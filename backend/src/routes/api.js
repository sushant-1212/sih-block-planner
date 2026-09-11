const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { RailwayGraph } = require('../engine/graph');
const { findShortestRoute } = require('../engine/dijkstra');
const { LRUCache, routeCache } = require('../cache/lruCache');
const { MegaBlockSynthesizer } = require('../engine/megaBlockSynthesizer');
const { ChronologicalScheduler } = require('../engine/chronologicalScheduler');
const { MaintenanceIntelligence } = require('../engine/maintenanceIntelligence');

/**
 * Helper to compute baseline route with zero blocks
 */
function getBaselineRoute(source, target) {
  const nodes = db.getNodes();
  const edges = db.getEdges();
  const graph = new RailwayGraph(nodes, edges);
  const src = source !== undefined ? Number(source) : (nodes[0]?.id || 101);
  const tgt = target !== undefined ? Number(target) : (nodes[nodes.length - 1]?.id || 107);
  return findShortestRoute(graph, src, tgt, []);
}

/**
 * Helper to execute full Mega-Block synthesis and chronological train scheduling
 */
function computeSynthesizedSchedule(activeRequests = null) {
  const nodes = db.getNodes();
  const edges = db.getEdges();
  const trains = db.getTrains();
  const requests = activeRequests || db.getMaintenanceRequests();

  const synthResult = MegaBlockSynthesizer.synthesize(requests, edges);
  const scheduleResult = ChronologicalScheduler.solve({
    nodes,
    edges,
    trains,
    megaBlocks: synthResult.megaBlocks
  });

  // Sync station occupancies in DB
  for (const st of scheduleResult.stationCapacities) {
    db.updateStationOccupancy(st.id, st.occupied);
  }

  return {
    megaBlocks: synthResult.megaBlocks,
    megaBlockMetrics: synthResult.metrics,
    trainDecisions: scheduleResult.trainDecisions,
    timelineEvents: scheduleResult.timelineEvents,
    stationCapacities: scheduleResult.stationCapacities,
    kpis: {
      ...scheduleResult.kpis,
      megaBlockEfficiencyRatio: synthResult.metrics.megaBlockEfficiencyRatio,
      totalClosuresSaved: synthResult.metrics.totalClosuresSaved,
      totalDowntimeSavedMins: synthResult.metrics.totalDowntimeSavedMins
    }
  };
}

/**
 * GET /api/network
 * Returns full railway graph nodes, edges, blocked segments, fleet, active maintenance, and synthesized schedule
 */
router.get('/network', (req, res) => {
  try {
    const nodes = db.getNodes();
    const edges = db.getEdges();
    const trains = db.getTrains();
    const blockedEdgeIds = db.getBlockedEdgeIds();
    const maintenance = db.getMaintenanceRequests();
    const baseline = getBaselineRoute();
    const synthesized = computeSynthesizedSchedule();
    const maintenanceIntelligence = MaintenanceIntelligence.analyzeBacklog(edges);

    res.json({
      success: true,
      currentDataset: db.getDatasetName(),
      nodes,
      edges,
      trains,
      blockedEdgeIds,
      maintenance,
      baselineRoute: baseline,
      synthesizedSchedule: synthesized,
      maintenanceIntelligence,
      cacheStats: routeCache.getStats()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/synthesize-schedule
 * Main endpoint for SIH26027 time-aware Mega-Block optimization & chronological scheduling
 */
router.post('/synthesize-schedule', (req, res) => {
  try {
    const { maintenanceRequests, blockedEdgeIds } = req.body;

    let requestsToProcess = maintenanceRequests;
    if (!requestsToProcess && Array.isArray(blockedEdgeIds) && blockedEdgeIds.length > 0) {
      // Build synthesized requests from blocked edges
      requestsToProcess = blockedEdgeIds.map((edgeId, idx) => ({
        id: 900 + idx,
        system_source: 'TMS',
        department: 'Track',
        edge_id: edgeId,
        title: `Manual Track #${edgeId} Maintenance Block`,
        reason: 'Sectional maintenance constraint applied via operator console',
        startTime: 20,
        duration_mins: 60,
        severity: 'HIGH'
      }));
    }

    const result = computeSynthesizedSchedule(requestsToProcess);

    // Sync blocked edge IDs with active Mega-Blocks
    const activeMegaEdges = result.megaBlocks.map(mb => mb.edgeId);
    for (const edge of db.getEdges()) {
      db.setEdgeBlocked(edge.id, activeMegaEdges.includes(edge.id));
    }

    res.json({
      success: true,
      ...result,
      nodes: db.getNodes(),
      blockedEdgeIds: db.getBlockedEdgeIds()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/fleet-schedule
 * Returns live train fleet and chronological timetable
 */
router.get('/fleet-schedule', (req, res) => {
  try {
    const synthesized = computeSynthesizedSchedule();
    res.json({
      success: true,
      trains: db.getTrains(),
      trainDecisions: synthesized.trainDecisions,
      timelineEvents: synthesized.timelineEvents,
      kpis: synthesized.kpis
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
    const nodes = db.getNodes();
    const defaultSrc = nodes[0]?.id || 101;
    const defaultTgt = nodes[nodes.length - 1]?.id || 107;
    const source = Number(req.body.source || defaultSrc);
    const target = Number(req.body.target || defaultTgt);
    
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
 * Toggles maintenance block on a specific track edge and recomputes schedule
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

    // Recompute synthesized schedule with updated blocks
    const synthesized = computeSynthesizedSchedule();

    res.json({
      success: true,
      edgeId: Number(edgeId),
      isBlocked: updatedBlocks.includes(Number(edgeId)),
      blockedEdgeIds: updatedBlocks,
      synthesizedSchedule: synthesized,
      nodes: db.getNodes()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/reset
 * Clears all active blocks across the network and resets loop occupancies
 */
router.post('/reset', (req, res) => {
  try {
    const updatedBlocks = db.resetAllBlocks();
    const synthesized = computeSynthesizedSchedule([]);

    res.json({
      success: true,
      message: 'Railway network cleared of all maintenance blocks & loop line occupancies reset',
      blockedEdgeIds: updatedBlocks,
      synthesizedSchedule: synthesized,
      nodes: db.getNodes()
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
 * GET /api/maintenance-intelligence
 * Returns AI-prioritized defect backlog with scores (0-100) and before-vs-after metrics
 */
router.get('/maintenance-intelligence', (req, res) => {
  try {
    const edges = db.getEdges();
    const analysis = MaintenanceIntelligence.analyzeBacklog(edges);
    res.json({
      success: true,
      ...analysis
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/optimize-backlog
 * Runs AI optimization on top backlog tasks and schedules coordinated Mega-Blocks
 */
router.post('/optimize-backlog', (req, res) => {
  try {
    const edges = db.getEdges();
    const analysis = MaintenanceIntelligence.analyzeBacklog(edges);

    // Map top priority tasks to maintenance requests for the Mega-Block Synthesizer
    const topTasks = analysis.topPriorityTasks.map((t, idx) => ({
      id: 700 + idx,
      system_source: t.system_source,
      department: t.department,
      edge_id: t.edge_id,
      title: `${t.code}: ${t.title}`,
      reason: `${t.defectType} (Overdue: ${t.daysOverdue}d, Priority Score: ${t.priorityScore}/100)`,
      startTime: 20 + idx * 5,
      duration_mins: t.estimatedDurationMins,
      severity: t.severity
    }));

    const synthesized = computeSynthesizedSchedule(topTasks);

    // Sync active Mega-Block edges
    const activeMegaEdges = synthesized.megaBlocks.map(mb => mb.edgeId);
    for (const edge of db.getEdges()) {
      db.setEdgeBlocked(edge.id, activeMegaEdges.includes(edge.id));
    }

    res.json({
      success: true,
      message: 'AI Backlog Optimization executed. Top safety-critical defects merged into Mega-Blocks.',
      backlogAnalysis: analysis,
      synthesizedSchedule: synthesized,
      nodes: db.getNodes(),
      blockedEdgeIds: db.getBlockedEdgeIds()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/maintenance-requests
 * Returns multi-department requests from TMS, SMMS, and TDMS
 */
router.get('/maintenance-requests', (req, res) => {
  res.json({
    success: true,
    requests: db.getMaintenanceRequests()
  });
});

/**
 * POST /api/switch-dataset
 * Switches between 'real_ir' (NCR Delhi-Kanpur) and 'demo' (5-node sample)
 */
router.post('/switch-dataset', (req, res) => {
  try {
    const dataset = req.body.dataset || 'real_ir';
    const result = db.setDataset(dataset);
    routeCache.clear(); // Clear cache for new network

    const nodes = db.getNodes();
    const edges = db.getEdges();
    const baseline = getBaselineRoute();
    const synthesized = computeSynthesizedSchedule();

    res.json({
      success: true,
      currentDataset: result.dataset,
      nodes,
      edges,
      trains: db.getTrains(),
      blockedEdgeIds: [],
      maintenance: db.getMaintenanceRequests(),
      baselineRoute: baseline,
      synthesizedSchedule: synthesized,
      cacheStats: routeCache.getStats()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
