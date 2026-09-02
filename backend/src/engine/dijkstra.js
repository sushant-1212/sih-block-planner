/**
 * Priority Queue Implementation for Dijkstra Solver
 */
class MinPriorityQueue {
  constructor() {
    this.elements = [];
  }

  enqueue(item, priority) {
    this.elements.push({ item, priority });
    this.elements.sort((a, b) => a.priority - b.priority);
  }

  dequeue() {
    return this.elements.shift()?.item;
  }

  isEmpty() {
    return this.elements.length === 0;
  }
}

/**
 * Calculates the shortest conflict-free path between source and target,
 * strictly omitting all blocked edge segments.
 *
 * @param {RailwayGraph} graph - The railway network graph
 * @param {number} sourceId - Start station ID
 * @param {number} targetId - Destination station ID
 * @param {number[]} blockedEdgeIds - Array of blocked track segment IDs
 * @returns {Object} Route result containing path nodes, edges, travel time, and latency
 */
function findShortestRoute(graph, sourceId, targetId, blockedEdgeIds = []) {
  const startTime = process.hrtime.bigint();
  const blockedSet = new Set(blockedEdgeIds.map(Number));

  const distances = new Map();
  const previousNode = new Map();
  const previousEdge = new Map();
  const pq = new MinPriorityQueue();

  const allNodes = graph.getAllNodes();
  for (const node of allNodes) {
    distances.set(node.id, Infinity);
  }

  distances.set(sourceId, 0);
  pq.enqueue(sourceId, 0);

  while (!pq.isEmpty()) {
    const current = pq.dequeue();

    if (current === targetId) {
      break;
    }

    const neighbors = graph.adjacency.get(current) || [];
    for (const neighbor of neighbors) {
      // Constraint check: Skip if edge is blocked
      if (blockedSet.has(neighbor.edgeId)) {
        continue;
      }

      const alt = distances.get(current) + neighbor.travelTime;
      if (alt < distances.get(neighbor.target)) {
        distances.set(neighbor.target, alt);
        previousNode.set(neighbor.target, current);
        previousEdge.set(neighbor.target, neighbor.edgeId);
        pq.enqueue(neighbor.target, alt);
      }
    }
  }

  const endTime = process.hrtime.bigint();
  const executionTimeMs = Number(endTime - startTime) / 1e6;

  // Reconstruct path
  if (distances.get(targetId) === Infinity || distances.get(targetId) === undefined) {
    return {
      found: false,
      message: 'No available alternate route found. Network severed by blockades.',
      path: [],
      pathNames: [],
      edgeIds: [],
      travelTime: 0,
      detourDelay: 0,
      executionTimeMs: Number(executionTimeMs.toFixed(3))
    };
  }

  const path = [];
  const edgeIds = [];
  let curr = targetId;

  while (curr !== undefined && curr !== null) {
    path.unshift(curr);
    const edge = previousEdge.get(curr);
    if (edge !== undefined) {
      edgeIds.unshift(edge);
    }
    curr = previousNode.get(curr);
  }

  const pathNames = path.map(id => graph.getNode(id)?.name || `Station ${id}`);
  const travelTime = distances.get(targetId);

  return {
    found: true,
    path,
    pathNames,
    edgeIds,
    travelTime,
    executionTimeMs: Number(executionTimeMs.toFixed(3))
  };
}

module.exports = {
  findShortestRoute
};
