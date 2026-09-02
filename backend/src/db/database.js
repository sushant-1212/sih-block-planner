const { Pool } = require('pg');

// 1. Simplified 5-Station Demo Topology
const DEMO_NODES = [
  { id: 1, name: 'Station A', code: 'STA-A', x: 120, y: 260, type: 'terminal' },
  { id: 2, name: 'Junction 1', code: 'JNC-1', x: 450, y: 130, type: 'junction' },
  { id: 3, name: 'Junction 2', code: 'JNC-2', x: 450, y: 390, type: 'junction' },
  { id: 4, name: 'Station B', code: 'STA-B', x: 800, y: 260, type: 'terminal' },
  { id: 5, name: 'Bypass 3', code: 'BYP-3', x: 450, y: 530, type: 'junction' }
];

const DEMO_EDGES = [
  { id: 1, source: 1, target: 2, travel_time: 10, track_name: 'Main Track A1 (Corridor)', speed_limit: 130, is_double_track: true, is_blocked: false },
  { id: 2, source: 1, target: 3, travel_time: 15, track_name: 'Southern Loop A2', speed_limit: 100, is_double_track: true, is_blocked: false },
  { id: 3, source: 2, target: 4, travel_time: 10, track_name: 'Main Track B1 (Express)', speed_limit: 130, is_double_track: true, is_blocked: false },
  { id: 4, source: 3, target: 4, travel_time: 12, track_name: 'Southern Loop B2', speed_limit: 110, is_double_track: true, is_blocked: false },
  { id: 5, source: 2, target: 3, travel_time: 8, track_name: 'Cross Link (J1-J2)', speed_limit: 90, is_double_track: false, is_blocked: false },
  { id: 6, source: 1, target: 5, travel_time: 20, track_name: 'Outer Bypass Line South', speed_limit: 140, is_double_track: true, is_blocked: false },
  { id: 7, source: 5, target: 4, travel_time: 18, track_name: 'Outer Bypass Line North', speed_limit: 140, is_double_track: true, is_blocked: false }
];

const DEMO_MAINTENANCE = [
  {
    id: 1,
    system_source: 'SMMS',
    system_name: 'Smart Maintenance Management System',
    edge_id: 1,
    title: 'Ultrasonic Flaw Detection Block',
    reason: 'Micro-fracture detected in rail web on Track A1 (STA-A → JNC-1). Immediate 3hr maintenance window required.',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    duration_mins: 180,
    impact: 'Requires dynamic reroute via Junction 2 (Southern Loop)'
  },
  {
    id: 2,
    system_source: 'TMS',
    system_name: 'Train Management System',
    edge_id: 3,
    title: 'Emergency Signal Interlock Maintenance',
    reason: 'Point machine failure at Exit Point 42 on Track B1 (JNC-1 → STA-B).',
    severity: 'HIGH',
    status: 'PENDING',
    duration_mins: 120,
    impact: 'Reroutes express trains via Cross Link or Bypass 3'
  },
  {
    id: 3,
    system_source: 'TDMS',
    system_name: 'Track Deterioration Management System',
    edge_id: 5,
    title: 'Ballast Tamp & Track Bed Renewal',
    reason: 'Track quality index degraded below safety threshold on Cross Link.',
    severity: 'SCHEDULED',
    status: 'PENDING',
    duration_mins: 240,
    impact: 'Cross Link unavailable between J1 and J2'
  }
];

// 2. Real Indian Railways: Northern / North Central Railway (Delhi - Kanpur - Prayagraj Golden Corridor)
const REAL_IR_NODES = [
  { id: 101, name: 'New Delhi', code: 'NDLS', x: 80, y: 250, type: 'terminal' },
  { id: 102, name: 'Ghaziabad Junction', code: 'GZB', x: 260, y: 250, type: 'junction' },
  { id: 103, name: 'Aligarh Junction', code: 'ALJN', x: 460, y: 150, type: 'junction' },
  { id: 104, name: 'Moradabad Bypass Loop', code: 'MB-BYP', x: 460, y: 380, type: 'junction' },
  { id: 105, name: 'Tundla Junction (Agra)', code: 'TDL', x: 650, y: 150, type: 'junction' },
  { id: 106, name: 'Bareilly-Lucknow Chord', code: 'LKO-CHD', x: 650, y: 380, type: 'junction' },
  { id: 107, name: 'Kanpur Central', code: 'CNB', x: 850, y: 250, type: 'terminal' }
];

const REAL_IR_EDGES = [
  { id: 201, source: 101, target: 102, travel_time: 25, track_name: 'NDLS-GZB Quad Track Main', speed_limit: 110, is_double_track: true, is_blocked: false },
  { id: 202, source: 102, target: 103, travel_time: 65, track_name: 'GZB-ALJN Main High-Speed Corridor', speed_limit: 130, is_double_track: true, is_blocked: false },
  { id: 203, source: 102, target: 104, travel_time: 85, track_name: 'GZB-MB Northern Bypass Line', speed_limit: 100, is_double_track: true, is_blocked: false },
  { id: 204, source: 103, target: 105, travel_time: 55, track_name: 'ALJN-TDL Grand Trunk Main Track', speed_limit: 130, is_double_track: true, is_blocked: false },
  { id: 205, source: 104, target: 106, travel_time: 90, track_name: 'MB-LKO Freight & Express Corridor', speed_limit: 110, is_double_track: true, is_blocked: false },
  { id: 206, source: 105, target: 107, travel_time: 110, track_name: 'TDL-CNB 130km/h Fast Track', speed_limit: 130, is_double_track: true, is_blocked: false },
  { id: 207, source: 106, target: 107, travel_time: 125, track_name: 'LKO-CNB Southern Link Line', speed_limit: 100, is_double_track: true, is_blocked: false },
  { id: 208, source: 103, target: 104, travel_time: 40, track_name: 'Chandausi-Aligarh Cross Chord', speed_limit: 90, is_double_track: false, is_blocked: false }
];

const REAL_IR_MAINTENANCE = [
  {
    id: 301,
    system_source: 'SMMS',
    system_name: 'Smart Maintenance Management System (NCR)',
    edge_id: 202,
    title: 'GZB-ALJN Ultrasonic Rail Web Testing',
    reason: 'Defect alert detected on Up Fast Line between Khurja & Aligarh. 2hr block required.',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    duration_mins: 120,
    impact: 'Reroutes Rajdhani / Vande Bharat trains via Moradabad Bypass Loop'
  },
  {
    id: 302,
    system_source: 'TMS',
    system_name: 'Train Management System (NR)',
    edge_id: 206,
    title: 'TDL-CNB Overhead Equipment (OHE) Wire Tensioning',
    reason: 'Catenary wire sag detected near Shikohabad Section. Scheduled block 14:00-16:00.',
    severity: 'HIGH',
    status: 'PENDING',
    duration_mins: 120,
    impact: 'Traffic diverted via Lucknow Chord to Kanpur Central'
  }
];

class DatabaseService {
  constructor() {
    this.isPostgres = false;
    this.pool = null;
    this.currentDataset = 'demo'; // 'demo' | 'real_ir'

    // In-memory state store (auto fallback)
    this.nodes = JSON.parse(JSON.stringify(DEMO_NODES));
    this.edges = JSON.parse(JSON.stringify(DEMO_EDGES));
    this.maintenance = JSON.parse(JSON.stringify(DEMO_MAINTENANCE));
    this.blockedEdgeIds = new Set();
  }

  async init() {
    const connectionString = process.env.DATABASE_URL;
    if (connectionString) {
      try {
        this.pool = new Pool({
          connectionString,
          connectionTimeoutMillis: 2000
        });

        const client = await this.pool.connect();
        client.release();
        this.isPostgres = true;
        console.log(' Connected to PostgreSQL database');
        await this.syncFromPostgres();
        return;
      } catch (err) {
        console.log(`ℹ PostgreSQL not detected (${err.message}). Using high-performance in-memory relational store.`);
        this.isPostgres = false;
      }
    } else {
      console.log('ℹ In-memory railway network storage initialized.');
    }
  }

  setDataset(datasetName = 'demo') {
    this.currentDataset = datasetName;
    this.blockedEdgeIds.clear();

    if (datasetName === 'real_ir') {
      this.nodes = JSON.parse(JSON.stringify(REAL_IR_NODES));
      this.edges = JSON.parse(JSON.stringify(REAL_IR_EDGES));
      this.maintenance = JSON.parse(JSON.stringify(REAL_IR_MAINTENANCE));
    } else {
      this.nodes = JSON.parse(JSON.stringify(DEMO_NODES));
      this.edges = JSON.parse(JSON.stringify(DEMO_EDGES));
      this.maintenance = JSON.parse(JSON.stringify(DEMO_MAINTENANCE));
    }

    return {
      dataset: this.currentDataset,
      nodesCount: this.nodes.length,
      edgesCount: this.edges.length
    };
  }

  getDatasetName() {
    return this.currentDataset;
  }

  async syncFromPostgres() {
    if (!this.isPostgres) return;
    try {
      const nodeRes = await this.pool.query('SELECT * FROM nodes ORDER BY id ASC');
      if (nodeRes.rows.length > 0) {
        this.nodes = nodeRes.rows;
      }
      const edgeRes = await this.pool.query('SELECT * FROM edges ORDER BY id ASC');
      if (edgeRes.rows.length > 0) {
        this.edges = edgeRes.rows;
      }
      const maintRes = await this.pool.query('SELECT * FROM maintenance_requests ORDER BY id ASC');
      if (maintRes.rows.length > 0) {
        this.maintenance = maintRes.rows;
      }
    } catch (err) {
      console.error('Error syncing from PostgreSQL:', err.message);
    }
  }

  getNodes() {
    return this.nodes;
  }

  getEdges() {
    return this.edges.map(e => ({
      ...e,
      is_blocked: this.blockedEdgeIds.has(e.id)
    }));
  }

  getBlockedEdgeIds() {
    return Array.from(this.blockedEdgeIds);
  }

  setEdgeBlocked(edgeId, isBlocked) {
    const id = Number(edgeId);
    if (isBlocked) {
      this.blockedEdgeIds.add(id);
    } else {
      this.blockedEdgeIds.delete(id);
    }

    const edge = this.edges.find(e => e.id === id);
    if (edge) {
      edge.is_blocked = isBlocked;
    }
    return this.getBlockedEdgeIds();
  }

  toggleEdgeBlock(edgeId) {
    const id = Number(edgeId);
    const currentlyBlocked = this.blockedEdgeIds.has(id);
    return this.setEdgeBlocked(id, !currentlyBlocked);
  }

  resetAllBlocks() {
    this.blockedEdgeIds.clear();
    for (const edge of this.edges) {
      edge.is_blocked = false;
    }
    return [];
  }

  getMaintenanceRequests() {
    return this.maintenance.map(m => ({
      ...m,
      is_active: this.blockedEdgeIds.has(m.edge_id)
    }));
  }

  applyMaintenanceScenario(maintId) {
    const maint = this.maintenance.find(m => m.id === Number(maintId));
    if (maint) {
      this.blockedEdgeIds.add(maint.edge_id);
      maint.status = 'ACTIVE';
      return maint;
    }
    return null;
  }
}

const db = new DatabaseService();

module.exports = {
  db,
  DEMO_NODES,
  DEMO_EDGES,
  DEMO_MAINTENANCE,
  REAL_IR_NODES,
  REAL_IR_EDGES,
  REAL_IR_MAINTENANCE
};
