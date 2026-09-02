/**
 * Railway Adjacency Graph Builder
 */
class RailwayGraph {
  constructor(nodes = [], edges = []) {
    this.nodes = new Map(); // id -> node
    this.adjacency = new Map(); // id -> array of connections
    this.edgeMap = new Map(); // id -> edge

    this.init(nodes, edges);
  }

  init(nodes, edges) {
    this.nodes.clear();
    this.adjacency.clear();
    this.edgeMap.clear();

    for (const node of nodes) {
      this.nodes.set(Number(node.id), {
        id: Number(node.id),
        name: node.name,
        code: node.code || `STA-${node.id}`,
        x: Number(node.x) || 0,
        y: Number(node.y) || 0,
        type: node.type || 'station'
      });
      this.adjacency.set(Number(node.id), []);
    }

    for (const edge of edges) {
      const edgeId = Number(edge.id);
      const source = Number(edge.source);
      const target = Number(edge.target);
      const travelTime = Number(edge.travel_time || edge.travelTime || 10);
      const trackName = edge.track_name || edge.trackName || `Track ${source}-${target}`;
      const speedLimit = Number(edge.speed_limit || edge.speedLimit || 110);
      const isDoubleTrack = edge.is_double_track !== false;

      const edgeObj = {
        id: edgeId,
        source,
        target,
        travelTime,
        trackName,
        speedLimit,
        isDoubleTrack
      };

      this.edgeMap.set(edgeId, edgeObj);

      // Bidirectional railway connectivity
      if (this.adjacency.has(source)) {
        this.adjacency.get(source).push({
          target,
          edgeId,
          travelTime,
          trackName,
          speedLimit
        });
      }

      if (this.adjacency.has(target)) {
        this.adjacency.get(target).push({
          target: source,
          edgeId,
          travelTime,
          trackName,
          speedLimit
        });
      }
    }
  }

  getNode(id) {
    return this.nodes.get(Number(id));
  }

  getEdge(id) {
    return this.edgeMap.get(Number(id));
  }

  getAllNodes() {
    return Array.from(this.nodes.values());
  }

  getAllEdges() {
    return Array.from(this.edgeMap.values());
  }
}

module.exports = { RailwayGraph };
