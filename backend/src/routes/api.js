const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { RailwayGraph } = require('../engine/graph');
const { findShortestRoute } = require('../engine/dijkstra');
const { LRUCache, routeCache } = require('../cache/lruCache');

/**
 * Helper to compute baseline route with zero blocks
 */
function getBaselineRoute(source = 1, target = 4) {
  const nodes = db.getNodes();
  const edges = db.getEdges();
  const graph = new RailwayGraph(nodes, edges);
  return findShortestRoute(graph, Number(source), Number(target), []);
}

/**
 * GET /api/network
 * Returns full railway graph nodes, edges, blocked segments, and active maintenance
 */
router.get('/network', (req, res) => {
  try {
    const nodes = db.getNodes();
    const edges = db.getEdges();
    const blockedEdgeIds = db.getBlockedEdgeIds();
    const maintenance = db.getMaintenanceRequests();
    const baseline = getBaselineRoute(1, 4);

    res.json({
      success: true,
      nodes,
      edges,
      blockedEdgeIds,
      maintenance,
      baselineRoute: baseline,
      cacheStats: routeCache.getStats()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/reroute
 * Calculates optimal path with constraint solving & LRU Cache optimization
 */
router.post('/reroute', (req, res) => {
  try {
    const source = Number(req.body.source || 1);
    const target = Number(req.body.target || 4);
    
    // Accept blocked edges from body or from database state
    const blockedEdgeIds = Array.isArray(req.body.blocked_edge_ids)
      ? req.body.blocked_edge_ids.map(Number)
      : db.getBlockedEdgeIds();

    const cacheKey = LRUCache.generateKey(source, target, blockedEdgeIds);
    const startLookupTime = process.hrtime.bigint();

    // 1. Check LRU Cache
    const cachedResult = routeCache.get(cacheKey);

    if (cachedResult) {
      const endLookupTime = process.hrtime.bigint();
      const lookupLatencyMs = Number(endLookupTime - startLookupTime) / 1e6;

      return res.json({
        success: true,
        cacheHit: true,
        cacheKey,
        dataSource: 'LRU_IN_MEMORY_CACHE',
        executionTimeMs: Number(lookupLatencyMs.toFixed(3)),
        source,
        target,
        blockedEdgeIds,
        ...cachedResult
      });
    }

    // 2. Cache Miss: Run Dijkstra Constraint Solver
    const nodes = db.getNodes();
    const edges = db.getEdges();
    const graph = new RailwayGraph(nodes, edges);

    const baseline = getBaselineRoute(source, target);
    const routeResult = findShortestRoute(graph, source, target, blockedEdgeIds);

    const detourDelay = routeResult.found
      ? Math.max(0, routeResult.travelTime - (baseline.travelTime || 0))
      : 0;

    const payload = {
      found: routeResult.found,
      message: routeResult.message,
      path: routeResult.path,
      pathNames: routeResult.pathNames,
      edgeIds: routeResult.edgeIds,
      travelTime: routeResult.travelTime,
      baselineTravelTime: baseline.travelTime,
      detourDelay,
      computationTimeMs: routeResult.executionTimeMs
    };

    // 3. Store in LRU Cache
    if (routeResult.found) {
      routeCache.put(cacheKey, payload);
    }

    return res.json({
      success: true,
      cacheHit: false,
      cacheKey,
      dataSource: 'GRAPH_DIJKSTRA_SOLVER',
      executionTimeMs: routeResult.executionTimeMs,
      source,
      target,
      blockedEdgeIds,
      ...payload
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/toggle-block
 * Toggles maintenance block on a specific track edge
 */
router.post('/toggle-block', (req, res) => {
  try {
    const { edgeId, isBlocked } = req.body;
    if (edgeId === undefined) {
      return res.status(400).json({ success: false, error: 'edgeId is required' });
    }

    let updatedBlocks;
    if (isBlocked !== undefined) {
      updatedBlocks = db.setEdgeBlocked(Number(edgeId), Boolean(isBlocked));
    } else {
      updatedBlocks = db.toggleEdgeBlock(Number(edgeId));
    }

    res.json({
      success: true,
      edgeId: Number(edgeId),
      isBlocked: updatedBlocks.includes(Number(edgeId)),
      blockedEdgeIds: updatedBlocks
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/reset
 * Clears all active blocks across the network
 */
router.post('/reset', (req, res) => {
  try {
    const updatedBlocks = db.resetAllBlocks();
    res.json({
      success: true,
      message: 'Railway network cleared of all maintenance blocks',
      blockedEdgeIds: updatedBlocks
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/cache-stats
 * Returns live LRU cache analytics
 */
router.get('/cache-stats', (req, res) => {
  res.json({
    success: true,
    stats: routeCache.getStats()
  });
});

/**
 * POST /api/cache-clear
 * Clears the LRU cache
 */
router.post('/cache-clear', (req, res) => {
  routeCache.clear();
  res.json({
    success: true,
    message: 'LRU Cache purged',
    stats: routeCache.getStats()
  });
});

/**
 * GET /api/maintenance-requests
 * Returns simulated requests from TMS, SMMS, and TDMS
 */
router.get('/maintenance-requests', (req, res) => {
  res.json({
    success: true,
    requests: db.getMaintenanceRequests()
  });
});

/**
 * POST /api/apply-maintenance
 * Applies a specific maintenance scenario from the external feed
 */
router.post('/apply-maintenance', (req, res) => {
  const { maintenanceId } = req.body;
  const applied = db.applyMaintenanceScenario(maintenanceId);
  if (!applied) {
    return res.status(404).json({ success: false, error: 'Maintenance scenario not found' });
  }

  res.json({
    success: true,
    applied,
    blockedEdgeIds: db.getBlockedEdgeIds()
  });
});

/**
 * POST /api/switch-dataset
 * Switches between 'demo' (Station A-B) and 'real_ir' (Delhi-Kanpur Golden Corridor)
 */
router.post('/switch-dataset', (req, res) => {
  try {
    const dataset = req.body.dataset || 'demo';
    const result = db.setDataset(dataset);
    routeCache.clear(); // Clear cache for new network

    const nodes = db.getNodes();
    const edges = db.getEdges();
    const source = nodes[0]?.id || 1;
    const target = nodes[nodes.length - 1]?.id || 4;
    const baseline = getBaselineRoute(source, target);

    res.json({
      success: true,
      currentDataset: result.dataset,
      nodes,
      edges,
      blockedEdgeIds: [],
      maintenance: db.getMaintenanceRequests(),
      baselineRoute: baseline,
      cacheStats: routeCache.getStats()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

