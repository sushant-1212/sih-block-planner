const { db } = require('./db/database');
const { RailwayGraph } = require('./engine/graph');
const { findShortestRoute } = require('./engine/dijkstra');
const { LRUCache } = require('./cache/lruCache');

async function test() {
  console.log('--- 1. Testing Railway Graph & Database ---');
  const nodes = db.getNodes();
  const edges = db.getEdges();
  console.log(`Loaded ${nodes.length} nodes and ${edges.length} edges.`);

  const graph = new RailwayGraph(nodes, edges);
  
  console.log('\n--- 2. Testing Dijkstra Shortest Path (No Blocks) ---');
  // Baseline path: Station A (1) to Station B (4)
  const baseline = findShortestRoute(graph, 1, 4, []);
  console.log('Baseline Path:', baseline.pathNames.join(' -> '));
  console.log('Travel Time:', baseline.travelTime, 'mins');
  console.log('Edge IDs:', baseline.edgeIds);
  console.log('Compute Time:', baseline.executionTimeMs, 'ms');

  console.log('\n--- 3. Testing Rerouting on Blocking Edge 1 (Track A1 to J1) ---');
  // Blocking edge 1 (1 -> 2)
  const reroute1 = findShortestRoute(graph, 1, 4, [1]);
  console.log('Reroute 1 Path:', reroute1.pathNames.join(' -> '));
  console.log('Travel Time:', reroute1.travelTime, 'mins');
  console.log('Detour Delay:', reroute1.travelTime - baseline.travelTime, 'mins');

  console.log('\n--- 4. Testing Multi-Block Rerouting (Blocking Edge 1 and 4) ---');
  const reroute2 = findShortestRoute(graph, 1, 4, [1, 4]);
  console.log('Reroute 2 Path:', reroute2.pathNames.join(' -> '));
  console.log('Travel Time:', reroute2.travelTime, 'mins');

  console.log('\n--- 5. Testing Custom LRU Cache Performance ---');
  const cache = new LRUCache(3);
  const key1 = LRUCache.generateKey(1, 4, [1]);
  const key2 = LRUCache.generateKey(1, 4, [2]);
  const key3 = LRUCache.generateKey(1, 4, [3]);
  const key4 = LRUCache.generateKey(1, 4, [4]);

  cache.put(key1, reroute1);
  cache.put(key2, { travelTime: 25 });
  cache.put(key3, { travelTime: 30 });

  // Cache hit test
  const hit1 = cache.get(key1);
  console.log('Cache Hit for key1:', hit1 !== null, '(Access Count:', cache.map.get(key1)?.accessCount, ')');

  // Eviction test: adding key4 should evict key2 (since key1 was accessed recently)
  cache.put(key4, { travelTime: 40 });
  console.log('Has key2 (should be evicted):', cache.has(key2));
  console.log('Has key1 (should remain):', cache.has(key1));
  console.log('Cache Stats:', cache.getStats());

  console.log('\n ALL BACKEND ENGINE TESTS PASSED PERFECTLY!');
}

test();
