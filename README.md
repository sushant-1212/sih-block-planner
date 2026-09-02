#  SIH Railway Network Block Planner & Dynamic Rerouting Engine

> **Smart India Hackathon Rapid Demo**  
> An interactive, real-time railway network graph visualization and constraint-aware dynamic rerouting engine featuring **React Flow**, **Node.js/Express**, a **Custom O(1) LRU Cache**, and **PostgreSQL**.

---

## ⚡ Tech Stack

| Layer | Technology | Purpose in Demo |
| :--- | :--- | :--- |
| **Frontend** | **React (Vite) + React Flow (`@xyflow/react`)** | Renders the railway network graph visually. Allows you to click any track segment to "block" it and watch the rerouting happen in real time with glowing animations. |
| **Backend API** | **Node.js (Express)** | Processes dynamic rerouting requests, applies graph constraints, and returns conflict-free optimal paths. |
| **Optimization** | **Custom LRU Cache (Doubly-Linked List + Map)** | Caches frequently requested fallback routes in memory. When a primary track is blocked, the engine checks the cache before running graph recalculations (sub-0.1ms latency). |
| **Database** | **PostgreSQL / In-Memory SQL Store** | Stores railway stations (nodes), tracks (edges), speed limits, and simulated overlapping maintenance requests from **TMS**, **SMMS**, and **TDMS**. |

---

## 🚀 Quick Start (1-Click Run)

### 1. Run the Demo
You can start both Backend (Port 5000) and Frontend (Port 3000) simultaneously:

**Windows PowerShell:**
```powershell
# From the project root:
.\start-demo.ps1
```

**Or manually in two terminals:**

**Terminal 1 (Backend):**
```bash
cd backend
npm start
```
*Backend runs at `http://localhost:5000`*

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
*Frontend opens at `http://localhost:3000`*

---

## 🎯 Jury Demonstration Flow (5-Step Walkthrough)

1. **Baseline State**:
   - Open `http://localhost:3000`.
   - Observe the initial optimal route: **Station A → Junction 1 → Station B** (Total Travel Time: **20 mins**).
   - The route is highlighted in glowing animated green.

2. **Simulate Track Maintenance Block (Click-to-Block)**:
   - Click the track segment between **Station A** and **Junction 1** (`Track A1`).
   - The track immediately turns **Red (Hazard Striped)** with a `BLOCKED` badge.
   - The engine triggers `/api/reroute` and recomputes the new path via **Junction 2** (**Station A → Junction 2 → Station B**, Travel Time: **27 mins**).
   - Bottom HUD displays: **CACHE MISS → GRAPH SOLVER (0.16ms)**, `+7 min detour delay`.

3. **Demonstrate Sub-Millisecond LRU Cache Acceleration**:
   - Unblock Track A1 (returns to baseline).
   - Click Track A1 again to re-block it.
   - Watch the HUD instantly flash: **LRU CACHE HIT (<0.05ms)**!
   - Shows jury how high-frequency train block scenarios are served at memory speed without redundant graph traversal.

4. **Multi-System Maintenance Simulation (TMS / SMMS / TDMS)**:
   - In the left sidebar, click **"SMMS Track Web Fracture"** or **"Severe Corridor Blockade"**.
   - Notice how multiple tracks block simultaneously and the solver finds multi-hop detour paths (e.g. via **Bypass 3**).

5. **Live Audit Trail**:
   - Expand the bottom-right **"Real-time System Audit Trail"** to inspect exact microsecond timestamps, cache status, and route decisions.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/network` | Returns nodes, edges, active blocks, and maintenance requests |
| `POST` | `/api/reroute` | Computes optimal path with LRU cache check & Dijkstra solver |
| `POST` | `/api/toggle-block` | Toggles block state on a specific track segment |
| `POST` | `/api/reset` | Clears all active blocks across the network |
| `GET` | `/api/cache-stats` | Returns live LRU cache analytics (hits, misses, hit rate) |
| `POST` | `/api/cache-clear` | Flushes the LRU in-memory cache |
| `POST` | `/api/apply-maintenance` | Triggers a maintenance scenario from TMS/SMMS/TDMS feed |

---

## 🧠 Database Schema (`schema.sql`)

```sql
CREATE TABLE nodes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) NOT NULL,
  x INT DEFAULT 0,
  y INT DEFAULT 0,
  type VARCHAR(30) DEFAULT 'station'
);

CREATE TABLE edges (
  id SERIAL PRIMARY KEY,
  source INT REFERENCES nodes(id),
  target INT REFERENCES nodes(id),
  travel_time INT NOT NULL,
  track_name VARCHAR(100),
  speed_limit INT DEFAULT 110,
  is_double_track BOOLEAN DEFAULT TRUE,
  is_blocked BOOLEAN DEFAULT FALSE
);

CREATE TABLE maintenance_requests (
  id SERIAL PRIMARY KEY,
  system_source VARCHAR(20) NOT NULL, -- 'TMS', 'SMMS', 'TDMS'
  edge_id INT REFERENCES edges(id),
  title VARCHAR(150) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'ACTIVE'
);
```
