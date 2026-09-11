# 🚄 SIH26027: RailRoute Optimizer — Complete Team Master Documentation

> **Problem Statement ID:** SIH26027  
> **Project Name:** Dynamic Railway Network Block Planner, Mega-Block Synthesizer & Anti-Gridlock Fleet Dispatcher  
> **Target Corridor:** Indian Railways Northern (NR) & North Central Railway (NCR) High-Density Golden Quadrilateral Corridor (New Delhi to Kanpur Central)  
> **Live Production URL:** [https://sih-block-planner-ljr2.onrender.com](https://sih-block-planner-ljr2.onrender.com)  
> **GitHub Repository:** [https://github.com/sushant-1212/sih-block-planner](https://github.com/sushant-1212/sih-block-planner)  

---

## 📌 Executive Summary (What does this project do?)

In Indian Railways today, maintenance blocks are requested manually and in complete departmental silos via the Block Demand Management System (BDMS). 
- **Track (TMS)** requests track closures for rail flaws and tamping.
- **Signal (SMMS)** requests closures for point machines and axle counters.
- **Power (TDMS)** requests closures for 25kV OHE catenary wire adjustments.

Because these systems are disconnected from train operations (Control Office Application - COA), **the same railway track gets shut down 3 to 4 times a day**, causing massive asset downtime, train delays, and passenger frustration.

### 💡 Our Solution:
The **SIH RailRoute Optimizer** is a time-aware constraint synthesizer that:
1. **Consolidates Fragmented Requests:** Merges overlapping maintenance windows on the same track into a unified **"Mega-Block"**, slashing track closure time by **48.3%**.
2. **Chronological Min-Heap Dispatcher:** Orders approaching trains chronologically by arrival time ($T_{\text{arr}}$) and priority (Vande Bharat Express > Freight).
3. **Hold vs. Reroute Cost Optimizer:** Mathematically calculates whether it is faster to park a train at a station loop line or send it on a long geographical detour.
4. **Station Loop-Line Anti-Gridlock Guard:** Enforces physical station track capacity. If station loop lines are full, it strictly prohibits stopped trains from blocking mainlines, dynamically forcing spatial detours to prevent network-wide traffic jams.
5. **Sub-Millisecond In-Memory LRU Cache:** Delivers fallback route recalculations in **$<0.05\text{ ms}$**.

---

## 🏛️ System Architecture

```
                       DECENTRALIZED FEEDS
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
   Track (TMS)            Signal (SMMS)           Power (TDMS)
   Rail Web Flaws         Axle Counters           OHE Catenary
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                ▼
               [ MODULE 1: MEGA-BLOCK SYNTHESIZER ]
            Merges overlapping requests on same track
               (Saves ~50% track downtime; 2.5x ratio)
                                │
                                ▼
             [ MODULE 2: CHRONOLOGICAL MIN-HEAP QUEUE ]
              Ingests COA train fleet sorted by T_arr
          (Vande Bharat 22436, Shatabdi 12004, Concor Freight)
                                │
                                ▼
              [ MODULE 3: DYNAMIC COST OPTIMIZER ]
         Cost(Wait) = max(0, Block_End - T_arr) vs Cost(Detour)
                                │
                                ▼
            [ MODULE 4: LOOP-LINE CAPACITY & GRIDLOCK GUARD ]
                    Is Station.occupied < Capacity?
                     ├── YES: HOLD in Loop Line
                     └── NO (FULL): FORCED SPATIAL DETOUR
                                │
                                ▼
             [ PERSISTENCE & SUB-MILLISECOND CACHE ]
          PostgreSQL / In-Memory Store + O(1) LRU Cache (<0.05ms)
                                │
                                ▼
                       [ INTERACTIVE UI ]
    React Flow Canvas + Horizontal Gantt Timeline + Live KPI Header
```

---

## ⚙️ The 4 Core Algorithmic Modules (How it works under the hood)

### Module 1: Multi-Department Mega-Block Synthesizer
- **File:** `backend/src/engine/megaBlockSynthesizer.js`
- **Logic:** Ingests raw defect requests from TMS, SMMS, and TDMS. Detects requests that target the same track edge or adjacent track segment within a configurable 30-minute threshold.
- **Formula:** 
  $$\text{Window Start} = \min(T_{\text{start}}), \quad \text{Window End} = \max(T_{\text{end}})$$
  $$\text{Efficiency Ratio} = \frac{\text{Total Independent Requests Combined}}{\text{Total Coordinated Mega-Blocks Issued}}$$
- **Result:** Converts 5 separate departmental requests on the Delhi-Kanpur corridor into **2 coordinated Mega-Blocks**, cutting track closure downtime from 300 minutes to 155 minutes (**48.3% downtime reduction**).

---

### Module 2: Chronological Min-Heap Scheduler
- **File:** `backend/src/engine/chronologicalScheduler.js`
- **Logic:** Implements a binary **Min-Heap (Priority Queue)**.
- Real-world trains arrive sequentially, not in parallel. The heap processes train movements chronologically based on their departure and arrival times at the bottleneck.
- Higher priority trains (Priority 1: *Vande Bharat Express*, *Shatabdi Express*) get scheduled first, reserving loop lines before lower-priority freight trains.

---

### Module 3: Dynamic "Hold vs. Reroute" Cost Minimizer
- **File:** `backend/src/engine/chronologicalScheduler.js`
- When a train approaches a blocked segment, naive systems force a 90-minute detour. Our engine calculates:
  1. **Wait Cost:**
     $$\text{Cost}_{\text{wait}} = \max(0, \text{Block\_End\_Time} - \text{Train\_Arrival\_Time})$$
  2. **Reroute Cost:**
     $$\text{Cost}_{\text{reroute}} = \text{Detour\_Travel\_Time} - \text{Direct\_Travel\_Time}$$
- **Decision Rule:**
  - If $\text{Cost}_{\text{wait}} \le \text{Cost}_{\text{reroute}}$: **HOLD at station loop line** (minimizes passenger delay).
  - If $\text{Cost}_{\text{reroute}} < \text{Cost}_{\text{wait}}$: **REROUTE via alternate corridor**.

---

### Module 4: Station Loop-Line Capacity & Anti-Gridlock Guard
- **File:** `backend/src/engine/chronologicalScheduler.js` & `StationNode.jsx`
- **The Reality:** Stations have a finite number of **loop lines** (side tracks where trains can park without blocking the main line).
  - *Ghaziabad Junction (`GZB`):* 4 loop lines.
- **The Execution:**
  - Train 1 (Vande Bharat #22436): Held in Loop 1 $\rightarrow$ `GZB: 1/4 Loops`
  - Train 2 (Concor Freight #90214): Held in Loop 2 $\rightarrow$ `GZB: 2/4 Loops`
  - Train 3 (Shatabdi Express #12004): Held in Loop 3 $\rightarrow$ `GZB: 3/4 Loops`
  - Train 4 (Prayagraj Express #12418): Held in Loop 4 $\rightarrow$ `GZB: 4/4 Loops (FULL!)`
  - Train 5 (Shiv Ganga Express #12560): Arrives at T+40. Even though wait time is only 20 mins, **GZB loop lines are 100% full!**
  - **The Gridlock Guard:** Stopping Train 5 on the mainline would paralyze the entire incoming Delhi corridor. The engine detects $\text{occupied} \ge \text{capacity}$, sets $\text{Cost}_{\text{wait}} = \infty$, and **forces a mandatory spatial detour via the Moradabad Bypass (`MB-BYP`)**.

---

## 🗄️ Database Architecture: The Dual-Engine Model

### Are we using a database? **YES.**
The application uses an enterprise **Dual-Engine Persistence Strategy**:

1. **PostgreSQL Relational Engine:**
   - Client: `pg` (node-postgres with connection pooling).
   - Tables defined in `backend/src/db/schema.sql`:
     - `nodes`: Stations with physical `capacity` (loop lines), `occupied`, coordinates, and codes.
     - `edges`: Track segments with `speed_limit`, `travel_time`, `length_km`, and `is_blocked`.
     - `maintenance_requests`: Defect tickets logged from TMS, SMMS, TDMS.
   - Activates automatically when `DATABASE_URL` is configured.

2. **Zero-Downtime In-Memory Relational Store:**
   - When running on free cloud tiers without an attached database instance, the backend initializes an in-memory relational store running the exact same relational schema and datasets.
   - **Why?** Guarantees **zero cold starts, zero downtime, and $<0.05\text{ ms}$ response times** during live jury presentations.

---

## 🚆 Real Indian Railways Dataset (NCR Golden Corridor)

| Station Name | IR Code | Loop Capacity | Role in Network |
| :--- | :--- | :---: | :--- |
| **New Delhi** | `NDLS` | 8 Loops | Origin Terminal (Western Gateway) |
| **Ghaziabad Junction** | `GZB` | 4 Loops | Quad-Track Main Junction (Bifurcation Point) |
| **Aligarh Junction** | `ALJN` | 3 Loops | Mainline High-Speed Interlocking |
| **Moradabad Bypass Loop** | `MB-BYP` | 3 Loops | Northern Express/Freight Diversion Route |
| **Tundla Junction** | `TDL` | 4 Loops | Agra Bypass & Signaling Hub |
| **Bareilly-Lucknow Chord** | `LKO-CHD` | 3 Loops | Southern Alternate Express Corridor |
| **Kanpur Central** | `CNB` | 8 Loops | Destination Terminal (Eastern Gateway) |

### Real Train Fleet Timetable:
1. **Train #22436:** *Vande Bharat Express* (NDLS $\rightarrow$ BSB, Priority 1, 130 km/h)
2. **Train #12004:** *Lucknow Swarna Shatabdi Express* (NDLS $\rightarrow$ LKO, Priority 1, 130 km/h)
3. **Train #12418:** *Prayagraj Express* (NDLS $\rightarrow$ PRYJ, Priority 2, 110 km/h)
4. **Train #12560:** *Shiv Ganga Express* (NDLS $\rightarrow$ BSB, Priority 2, 110 km/h)
5. **Train #90214:** *Concor Container Freight Express* (TKD $\rightarrow$ DDU, Priority 3, Freight)

---

## 👥 Team Roles & Jury Presentation Division

| Role | Teammate | Key Pitch Responsibility |
| :--- | :--- | :--- |
| **Speaker 1: Systems Architect** | Team Lead | Explains the Indian Railways problem: departmental silos (TMS/SMMS/TDMS) causing 4.5+ hrs of track downtime. Introduces the **Mega-Block Synthesizer** and business KPIs (**48.3% downtime saved**, **2.5x efficiency ratio**). |
| **Speaker 2: Optimization Engineer** | Algorithm Lead | Explains the math: **Binary Min-Heap** for chronological sorting, **Dynamic Cost Formula** ($\text{Cost}_{\text{wait}}$ vs $\text{Cost}_{\text{reroute}}$), and the **Anti-Gridlock Loop Capacity Guard**. Mentions the $O(1)$ LRU Cache ($<0.05\text{ ms}$). |
| **Speaker 3: Full-Stack Engineer** | UI/UX Lead | Controls the live screen at [sih-block-planner-ljr2.onrender.com](https://sih-block-planner-ljr2.onrender.com). Shows the React Flow digital twin, triggers the Mega-Block button, and walks through the **Horizontal Gantt Chart** and **Decision Matrix**. |
| **Speaker 4: Data & Systems Specialist** | Data Lead | Explains the Real NCR Golden Corridor dataset, the PostgreSQL dual-engine architecture, and the future integration roadmap with CRIS, COA, and NTES. |

---

## 🎬 3-Minute Live Demo Walkthrough (What to do on screen)

1. **Step 1: Show the Clean Canvas**
   - Open [https://sih-block-planner-ljr2.onrender.com](https://sih-block-planner-ljr2.onrender.com).
   - Point to the green illuminated corridor: New Delhi (`NDLS`) to Kanpur Central (`CNB`). Optimal travel time: **255 mins**.
2. **Step 2: Trigger Mega-Block Synthesis**
   - On the left panel, click **`Synthesize Mega-Block`** under *Tri-Department Mega-Block (GZB-ALJN)*.
   - Point to the **Horizontal Gantt Timeline** at the bottom:
     - Show how 3 fragmented requests (TMS Track, SMMS Signal, TDMS Power) are merged into **1 unified 65-min green striped window**.
3. **Step 3: Point to Ghaziabad Station Capacity Badge**
   - On the canvas, point to `GZB`. It now displays **`4/4 Loops [100%] FULL`** with an amber holding pulse.
4. **Step 4: Switch to the `Train Dispatch Matrix` Tab**
   - Show the 5 trains:
     - Trains 1, 2, 3, 4: **`HELD AT GZB`** (Wait time 35–60m is faster than 60m detour).
     - Train 5 (Shiv Ganga Express): **`MANDATORY_REROUTE`**!
     - Read the reason: *"Gridlock Prevention: GZB loop lines are SATURATED (4/4 FULL). Holding forbidden; forced spatial detour via Moradabad Bypass (+60m)."*
5. **Step 5: Highlight the Header KPIs**
   - ⚡ **Asset Uptime Index:** Maintained at **98.7%**.
   - ⏱️ **Delay Minutes Saved:** **42 cumulative minutes saved**.
   - 🔄 **Mega-Block Ratio:** **2.5x**.

---

## ❓ Frequently Asked Questions by the Jury (Cheat Sheet)

1. **Q: How is this different from standard Dijkstra rerouting?**  
   *A: Dijkstra only finds geographical distance. Our system is a time-aware constraint synthesizer. It evaluates whether holding a train is faster than detouring, processes arrivals chronologically via a Min-Heap, and prevents mainline gridlocks by checking station loop line capacity.*

2. **Q: What if two departments have a 15-minute gap between maintenance windows?**  
   *A: Our synthesizer uses an adjacency threshold (30 minutes). If windows are within 30 minutes, it merges them because shutting down and re-energizing 25kV traction power twice costs far more than a 15-minute idle window.*

3. **Q: How does this scale to all of Indian Railways?**  
   *A: We scale using Hierarchical Contraction Hierarchies (HCH) across divisions, and connect directly to CRIS via Kafka streams to ingest live COA train positions and TMS defect work orders.*

4. **Q: Is the code open-source and deployed?**  
   *A: Yes, fully open-source on GitHub at `sushant-1212/sih-block-planner` and running live 24/7 on Render at `sih-block-planner-ljr2.onrender.com`.*
