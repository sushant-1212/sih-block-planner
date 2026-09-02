-- Railway Network Schema for SIH Block Planner
-- Supports Nodes (Stations/Junctions), Edges (Track Segments), and Maintenance Requests

CREATE TABLE IF NOT EXISTS nodes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) NOT NULL,
  x INT DEFAULT 0,
  y INT DEFAULT 0,
  type VARCHAR(30) DEFAULT 'station' -- 'terminal', 'junction', 'station'
);

CREATE TABLE IF NOT EXISTS edges (
  id SERIAL PRIMARY KEY,
  source INT REFERENCES nodes(id) ON DELETE CASCADE,
  target INT REFERENCES nodes(id) ON DELETE CASCADE,
  travel_time INT NOT NULL,
  track_name VARCHAR(100),
  speed_limit INT DEFAULT 110,
  is_double_track BOOLEAN DEFAULT TRUE,
  is_blocked BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS maintenance_requests (
  id SERIAL PRIMARY KEY,
  system_source VARCHAR(20) NOT NULL, -- 'TMS', 'SMMS', 'TDMS'
  edge_id INT REFERENCES edges(id),
  title VARCHAR(150) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  severity VARCHAR(20) NOT NULL, -- 'CRITICAL', 'HIGH', 'PLANNED'
  status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'PENDING', 'RESOLVED'
  duration_mins INT DEFAULT 120,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Data: Core 5-node railway network with alternative bypass lines
INSERT INTO nodes (id, name, code, x, y, type) VALUES 
  (1, 'Station A (Origin Terminal)', 'STA-A', 100, 250, 'terminal'),
  (2, 'Junction 1 (Main Corridor)', 'JNC-1', 400, 120, 'junction'),
  (3, 'Junction 2 (Loop Line)', 'JNC-2', 400, 380, 'junction'),
  (4, 'Station B (Destination Terminal)', 'STA-B', 750, 250, 'terminal'),
  (5, 'Bypass Junction 3 (High Speed Detour)', 'BYP-3', 400, 520, 'junction')
ON CONFLICT (id) DO NOTHING;

INSERT INTO edges (id, source, target, travel_time, track_name, speed_limit, is_double_track) VALUES
  (1, 1, 2, 10, 'Main Track A1 (Fast Corridor)', 130, TRUE),
  (2, 1, 3, 15, 'Southern Line A2 (Scenic Loop)', 100, TRUE),
  (3, 2, 4, 10, 'Main Track B1 (Express Exit)', 130, TRUE),
  (4, 3, 4, 12, 'Southern Line B2 (Freight & Passenger)', 110, TRUE),
  (5, 2, 3, 8, 'Inter-Junction Cross Link (J1-J2)', 90, FALSE),
  (6, 1, 5, 20, 'Outer Bypass South Link (A-BYP3)', 140, TRUE),
  (7, 5, 4, 18, 'Outer Bypass North Link (BYP3-B)', 140, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO maintenance_requests (id, system_source, edge_id, title, reason, severity, status, duration_mins) VALUES
  (1, 'SMMS', 1, 'Track Geometry Inspection', 'Ultrasonic Rail Flaw Detection on Track A1', 'CRITICAL', 'ACTIVE', 180),
  (2, 'TDMS', 3, 'Overhead Catenary Maintenance', 'OHE wire tensioning near Junction 1-B', 'HIGH', 'PENDING', 120),
  (3, 'TMS', 2, 'Signaling Interlock Calibration', 'Axle Counter replacement on Line A2', 'PLANNED', 'PENDING', 90)
ON CONFLICT (id) DO NOTHING;
