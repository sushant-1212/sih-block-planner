const { Pool } = require('pg');

// 1. Real Indian Railways: Northern / North Central Railway (Delhi - Kanpur - Prayagraj Golden Quadrilateral Corridor)
const REAL_IR_NODES = [
  { id: 101, name: 'New Delhi', code: 'NDLS', x: 80, y: 260, type: 'terminal', capacity: 8, occupied: 0 },
  { id: 102, name: 'Ghaziabad Junction', code: 'GZB', x: 260, y: 260, type: 'junction', capacity: 4, occupied: 0 },
  { id: 103, name: 'Aligarh Junction', code: 'ALJN', x: 460, y: 140, type: 'junction', capacity: 3, occupied: 0 },
  { id: 104, name: 'Moradabad Bypass Loop', code: 'MB-BYP', x: 460, y: 380, type: 'junction', capacity: 3, occupied: 0 },
  { id: 105, name: 'Tundla Junction (Agra Bypass)', code: 'TDL', x: 670, y: 140, type: 'junction', capacity: 4, occupied: 0 },
  { id: 106, name: 'Bareilly-Lucknow Chord', code: 'LKO-CHD', x: 670, y: 380, type: 'junction', capacity: 3, occupied: 0 },
  { id: 107, name: 'Kanpur Central', code: 'CNB', x: 880, y: 260, type: 'terminal', capacity: 8, occupied: 0 }
];

const REAL_IR_EDGES = [
  { id: 201, source: 101, target: 102, travel_time: 25, track_name: 'NDLS-GZB Quad Track Fast Corridor', speed_limit: 110, length_km: 28, is_double_track: true, is_blocked: false },
  { id: 202, source: 102, target: 103, travel_time: 65, track_name: 'GZB-ALJN Main 130km/h Corridor', speed_limit: 130, length_km: 106, is_double_track: true, is_blocked: false },
  { id: 203, source: 102, target: 104, travel_time: 85, track_name: 'GZB-MB Northern Bypass Route', speed_limit: 100, length_km: 140, is_double_track: true, is_blocked: false },
  { id: 204, source: 103, target: 105, travel_time: 55, track_name: 'ALJN-TDL Grand Trunk Fast Track', speed_limit: 130, length_km: 78, is_double_track: true, is_blocked: false },
  { id: 205, source: 104, target: 106, travel_time: 90, track_name: 'MB-LKO Express Alternate Route', speed_limit: 110, length_km: 125, is_double_track: true, is_blocked: false },
  { id: 206, source: 105, target: 107, travel_time: 110, track_name: 'TDL-CNB Main Line Fast Corridor', speed_limit: 130, length_km: 228, is_double_track: true, is_blocked: false },
  { id: 207, source: 106, target: 107, travel_time: 125, track_name: 'LKO-CNB Southern Link Line', speed_limit: 100, length_km: 195, is_double_track: true, is_blocked: false },
  { id: 208, source: 103, target: 104, travel_time: 40, track_name: 'Chandausi-Aligarh Cross Chord', speed_limit: 90, length_km: 62, is_double_track: false, is_blocked: false }
];

// Multi-departmental maintenance requests from TMS, SMMS, and TDMS
const REAL_IR_MAINTENANCE = [
  {
    id: 301,
    system_source: 'SMMS',
    system_name: 'Signal & Telecom (SMMS)',
    department: 'Signal',
    edge_id: 202,
    track_name: 'GZB-ALJN Main Line',
    title: 'Digital Axle Counter & Point Interlocking Calibration',
    reason: 'Intermittent track vacancy signal glitch at Km 74/2. Requires 45-min signal testing.',
    startTime: 20,
    duration_mins: 45,
    severity: 'CRITICAL',
    status: 'PENDING'
  },
  {
    id: 302,
    system_source: 'TMS',
    system_name: 'Track Management System (TMS)',
    department: 'Track',
    edge_id: 202,
    track_name: 'GZB-ALJN Main Line',
    title: 'Ultrasonic Rail Flaw Detection (USFD) & Joint Weld',
    reason: 'AT-weld defect alert on Up Fast Line. 60-min ultrasonic inspection and thermit weld rectification.',
    startTime: 25,
    duration_mins: 60,
    severity: 'CRITICAL',
    status: 'PENDING'
  },
  {
    id: 303,
    system_source: 'TDMS',
    system_name: 'Traction Power (TDMS)',
    department: 'Power',
    edge_id: 202,
    track_name: 'GZB-ALJN Main Line',
    title: '25kV OHE Catenary Wire Tensioning & Insulator Wash',
    reason: 'Catenary dropper slack near Khurja neutral section. Requires 45-min power shadow block.',
    startTime: 30,
    duration_mins: 45,
    severity: 'HIGH',
    status: 'PENDING'
  },
  {
    id: 304,
    system_source: 'TMS',
    system_name: 'Track Management System (TMS)',
    department: 'Track',
    edge_id: 206,
    track_name: 'TDL-CNB Main Line',
    title: 'High-Output Ballast Tamping (CSM-09)',
    reason: 'Track Quality Index (TQI) maintenance on Shikohabad-Etawah section.',
    startTime: 40,
    duration_mins: 90,
    severity: 'HIGH',
    status: 'PENDING'
  },
  {
    id: 305,
    system_source: 'TDMS',
    system_name: 'Traction Power (TDMS)',
    department: 'Power',
    edge_id: 206,
    track_name: 'TDL-CNB Main Line',
    title: 'Substation Feeder Breaker Maintenance',
    reason: '25kV Traction Substation feeder isolator servicing at Etawah.',
    startTime: 50,
    duration_mins: 60,
    severity: 'SCHEDULED',
    status: 'PENDING'
  }
];

// Real Indian Railways Train Fleet Timetable on the NCR Corridor
const REAL_IR_TRAINS = [
  {
    id: 'TR-22436',
    trainNumber: '22436',
    name: 'Vande Bharat Express',
    origin: 'NDLS',
    destination: 'BSB',
    sourceId: 101,
    targetId: 107,
    departureTime: 0, // T=0 mins (e.g. 06:00)
    scheduledArrival: 255,
    priority: 1, // 1: Vande Bharat / Rajdhani, 2: Express, 3: Freight
    speedKmph: 130,
    passengers: 1128,
    trainType: 'Vande Bharat (High Priority)',
    color: '#38bdf8'
  },
  {
    id: 'TR-12004',
    trainNumber: '12004',
    name: 'Lucknow Shatabdi Express',
    origin: 'NDLS',
    destination: 'LKO',
    sourceId: 101,
    targetId: 107,
    departureTime: 12, // T=12 mins
    scheduledArrival: 267,
    priority: 1,
    speedKmph: 130,
    passengers: 980,
    trainType: 'Shatabdi Express',
    color: '#818cf8'
  },
  {
    id: 'TR-12418',
    trainNumber: '12418',
    name: 'Prayagraj Express',
    origin: 'NDLS',
    destination: 'PRYJ',
    sourceId: 101,
    targetId: 107,
    departureTime: 25, // T=25 mins
    scheduledArrival: 280,
    priority: 2,
    speedKmph: 110,
    passengers: 1640,
    trainType: 'Superfast Express',
    color: '#34d399'
  },
  {
    id: 'TR-12560',
    trainNumber: '12560',
    name: 'Shiv Ganga Express',
    origin: 'NDLS',
    destination: 'BSB',
    sourceId: 101,
    targetId: 107,
    departureTime: 40, // T=40 mins
    scheduledArrival: 295,
    priority: 2,
    speedKmph: 110,
    passengers: 1820,
    trainType: 'Superfast Express',
    color: '#fbbf24'
  },
  {
    id: 'TR-90214',
    trainNumber: '90214',
    name: 'Concor Container Freight Express',
    origin: 'TKD',
    destination: 'DDU',
    sourceId: 101,
    targetId: 107,
    departureTime: 5, // T=5 mins
    scheduledArrival: 345,
    priority: 3,
    speedKmph: 75,
    tonnage: 3400,
    trainType: 'Container Freight',
    color: '#f87171'
  }
];

// 2. Simplified 5-Station Demo Topology (Fallback)
const DEMO_NODES = [
  { id: 1, name: 'Station A', code: 'STA-A', x: 120, y: 260, type: 'terminal', capacity: 4, occupied: 0 },
  { id: 2, name: 'Junction 1', code: 'JNC-1', x: 450, y: 130, type: 'junction', capacity: 2, occupied: 0 },
  { id: 3, name: 'Junction 2', code: 'JNC-2', x: 450, y: 390, type: 'junction', capacity: 2, occupied: 0 },
  { id: 4, name: 'Station B', code: 'STA-B', x: 800, y: 260, type: 'terminal', capacity: 4, occupied: 0 },
  { id: 5, name: 'Bypass 3', code: 'BYP-3', x: 450, y: 530, type: 'junction', capacity: 2, occupied: 0 }
];

const DEMO_EDGES = [
  { id: 1, source: 1, target: 2, travel_time: 10, track_name: 'Main Track A1 (Corridor)', speed_limit: 130, length_km: 20, is_double_track: true, is_blocked: false },
  { id: 2, source: 1, target: 3, travel_time: 15, track_name: 'Southern Loop A2', speed_limit: 100, length_km: 25, is_double_track: true, is_blocked: false },
  { id: 3, source: 2, target: 4, travel_time: 10, track_name: 'Main Track B1 (Express)', speed_limit: 130, length_km: 20, is_double_track: true, is_blocked: false },
  { id: 4, source: 3, target: 4, travel_time: 12, track_name: 'Southern Loop B2', speed_limit: 110, length_km: 22, is_double_track: true, is_blocked: false },
  { id: 5, source: 2, target: 3, travel_time: 8, track_name: 'Cross Link (J1-J2)', speed_limit: 90, length_km: 12, is_double_track: false, is_blocked: false },
  { id: 6, source: 1, target: 5, travel_time: 20, track_name: 'Outer Bypass Line South', speed_limit: 140, length_km: 40, is_double_track: true, is_blocked: false },
  { id: 7, source: 5, target: 4, travel_time: 18, track_name: 'Outer Bypass Line North', speed_limit: 140, length_km: 36, is_double_track: true, is_blocked: false }
];

const DEMO_MAINTENANCE = [
  {
    id: 1,
    system_source: 'SMMS',
    system_name: 'Smart Maintenance Management System',
    department: 'Signal',
    edge_id: 1,
    title: 'Ultrasonic Flaw Detection Block',
    reason: 'Micro-fracture detected in rail web on Track A1. Immediate maintenance required.',
    startTime: 10,
    duration_mins: 40,
    severity: 'CRITICAL',
    status: 'ACTIVE'
  },
  {
    id: 2,
    system_source: 'TMS',
    system_name: 'Train Management System',
    department: 'Track',
    edge_id: 1,
    title: 'Emergency Track Joint Inspection',
    reason: 'Joint bolt replacement on Track A1.',
    startTime: 15,
    duration_mins: 35,
    severity: 'HIGH',
    status: 'PENDING'
  }
];

class DatabaseService {
  constructor() {
    this.isPostgres = false;
    this.pool = null;
    this.currentDataset = 'real_ir'; // Real Indian Railways as default

    this.nodes = JSON.parse(JSON.stringify(REAL_IR_NODES));
    this.edges = JSON.parse(JSON.stringify(REAL_IR_EDGES));
    this.maintenance = JSON.parse(JSON.stringify(REAL_IR_MAINTENANCE));
    this.trains = JSON.parse(JSON.stringify(REAL_IR_TRAINS));
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
      console.log('ℹ In-memory railway network storage initialized with Real Indian Railways dataset.');
    }
  }

  setDataset(datasetName = 'real_ir') {
    this.currentDataset = datasetName;
    this.blockedEdgeIds.clear();

    if (datasetName === 'demo') {
      this.nodes = JSON.parse(JSON.stringify(DEMO_NODES));
      this.edges = JSON.parse(JSON.stringify(DEMO_EDGES));
      this.maintenance = JSON.parse(JSON.stringify(DEMO_MAINTENANCE));
      this.trains = [];
    } else {
      this.nodes = JSON.parse(JSON.stringify(REAL_IR_NODES));
      this.edges = JSON.parse(JSON.stringify(REAL_IR_EDGES));
      this.maintenance = JSON.parse(JSON.stringify(REAL_IR_MAINTENANCE));
      this.trains = JSON.parse(JSON.stringify(REAL_IR_TRAINS));
    }

    return {
      dataset: this.currentDataset,
      nodesCount: this.nodes.length,
      edgesCount: this.edges.length,
      trainsCount: this.trains.length
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

  getTrains() {
    return this.trains;
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
    // Reset station occupancies
    for (const node of this.nodes) {
      node.occupied = 0;
    }
    return [];
  }

  getMaintenanceRequests() {
    return this.maintenance.map(m => ({
      ...m,
      is_active: this.blockedEdgeIds.has(m.edge_id)
    }));
  }

  updateStationOccupancy(stationId, count) {
    const station = this.nodes.find(n => n.id === Number(stationId) || n.code === String(stationId));
    if (station) {
      station.occupied = Math.max(0, Math.min(station.capacity || 4, count));
      return station;
    }
    return null;
  }
}

const db = new DatabaseService();

module.exports = {
  db,
  REAL_IR_NODES,
  REAL_IR_EDGES,
  REAL_IR_MAINTENANCE,
  REAL_IR_TRAINS,
  DEMO_NODES,
  DEMO_EDGES,
  DEMO_MAINTENANCE
};
