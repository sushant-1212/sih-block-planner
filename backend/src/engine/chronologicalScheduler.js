/**
 * Chronological Min-Heap Scheduler & Dynamic Cost Solver (SIH26027)
 *
 * Implements:
 * 1. Min-Heap Priority Queue for chronological train event processing based on T_arr.
 * 2. Dynamic Cost Function: Cost_wait = max(0, Block_End - T_arr) vs Cost_reroute.
 * 3. Physical Station Loop-Line Capacity Constraints & Anti-Gridlock Enforcement.
 * 4. Real-time KPI synthesis (Asset Uptime %, Delay Minutes Saved, Mega-Block Ratio).
 */

const { RailwayGraph } = require('./graph');
const { findShortestRoute } = require('./dijkstra');

class MinHeap {
  constructor() {
    this.heap = [];
  }

  push(node) {
    this.heap.push(node);
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (this.heap.length === 0) return null;
    const min = this.heap[0];
    const end = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = end;
      this._sinkDown(0);
    }
    return min;
  }

  peek() {
    return this.heap[0] || null;
  }

  size() {
    return this.heap.length;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  _bubbleUp(n) {
    const element = this.heap[n];
    while (n > 0) {
      const parentN = Math.floor((n - 1) / 2);
      const parent = this.heap[parentN];
      if (element.priority >= parent.priority) break;
      this.heap[n] = parent;
      this.heap[parentN] = element;
      n = parentN;
    }
  }

  _sinkDown(n) {
    const length = this.heap.length;
    const element = this.heap[n];
    while (true) {
      let child2N = (n + 1) * 2;
      let child1N = child2N - 1;
      let swap = null;

      if (child1N < length) {
        if (this.heap[child1N].priority < element.priority) {
          swap = child1N;
        }
      }

      if (child2N < length) {
        if (
          (swap === null && this.heap[child2N].priority < element.priority) ||
          (swap !== null && this.heap[child2N].priority < this.heap[child1N].priority)
        ) {
          swap = child2N;
        }
      }

      if (swap === null) break;
      this.heap[n] = this.heap[swap];
      this.heap[swap] = element;
      n = swap;
    }
  }
}

class ChronologicalScheduler {
  /**
   * Evaluates train movements against synthesized Mega-Blocks
   * @param {Object} params
   * @param {Array} params.nodes - Station nodes with physical loop capacities
   * @param {Array} params.edges - Track edges with running times
   * @param {Array} params.trains - Train fleet with scheduled departures and priorities
   * @param {Array} params.megaBlocks - Consolidated Mega-Block track closures
   * @returns {Object} Comprehensive schedule, decisions, station occupancies, and KPIs
   */
  static solve({ nodes = [], edges = [], trains = [], megaBlocks = [] }) {
    const graph = new RailwayGraph(nodes, edges);

    // Deep clone station capacities and track occupancies
    const stationMap = new Map();
    for (const node of nodes) {
      stationMap.set(node.id, {
        id: node.id,
        name: node.name,
        code: node.code,
        capacity: Number(node.capacity || 4),
        occupied: 0,
        activeTrains: []
      });
    }

    // Map megaBlocks by edgeId for fast lookup
    const megaBlockMap = new Map();
    for (const mb of megaBlocks) {
      const edgeId = Number(mb.edgeId);
      if (!megaBlockMap.has(edgeId)) {
        megaBlockMap.set(edgeId, []);
      }
      megaBlockMap.get(edgeId).push(mb);
    }

    // Build Min-Heap for train dispatch queue sorted by departure time
    const minHeap = new MinHeap();
    for (const train of trains) {
      minHeap.push({
        priority: Number(train.departureTime || 0),
        train
      });
    }

    const trainDecisions = [];
    const timelineEvents = [];
    let totalDelayMinutesSaved = 0;
    let totalEngineDelayMins = 0;
    let totalManualBaselineDelayMins = 0;

    // Process trains chronologically
    while (!minHeap.isEmpty()) {
      const item = minHeap.pop();
      const train = item.train;

      const sourceId = Number(train.sourceId || nodes[0]?.id || 101);
      const targetId = Number(train.targetId || nodes[nodes.length - 1]?.id || 107);

      // 1. Calculate unconstrained baseline shortest path
      const baselineRoute = findShortestRoute(graph, sourceId, targetId, []);
      const baselineTravelTime = baselineRoute.travelTime || 200;

      // 2. Identify if baseline route encounters a Mega-Block
      let conflictingBlock = null;
      let cumulativeTime = train.departureTime;
      let holdingStation = null;

      if (baselineRoute.found && baselineRoute.edgeIds) {
        for (let i = 0; i < baselineRoute.edgeIds.length; i++) {
          const edgeId = baselineRoute.edgeIds[i];
          const edgeObj = graph.getEdge(edgeId);
          const fromNodeId = baselineRoute.path[i];
          const toNodeId = baselineRoute.path[i + 1];

          const edgeTravelTime = edgeObj?.travelTime || 30;
          const arrivalAtEdge = cumulativeTime;
          const departureFromEdge = arrivalAtEdge + edgeTravelTime;

          // Check if this edge has a Mega-Block
          const blocksOnEdge = megaBlockMap.get(edgeId) || [];
          for (const mb of blocksOnEdge) {
            // Conflict if train arrival overlaps block window
            if (arrivalAtEdge < mb.endTime && departureFromEdge > mb.startTime) {
              conflictingBlock = mb;
              holdingStation = stationMap.get(fromNodeId);
              break;
            }
          }

          if (conflictingBlock) {
            break;
          }

          cumulativeTime += edgeTravelTime;
        }
      }

      // 3. If no conflict, train dispatches on optimal primary path
      if (!conflictingBlock) {
        trainDecisions.push({
          trainId: train.id,
          trainNumber: train.trainNumber,
          trainName: train.name,
          trainType: train.trainType,
          priority: train.priority,
          decision: 'CLEAR_TRANSIT',
          decisionText: 'Optimal Fast Track Transit',
          path: baselineRoute.path,
          pathNames: baselineRoute.pathNames,
          departureTime: train.departureTime,
          arrivalTime: train.departureTime + baselineTravelTime,
          travelTime: baselineTravelTime,
          waitDelayMins: 0,
          detourDelayMins: 0,
          totalDelayMins: 0,
          holdingStation: null,
          reason: 'No maintenance conflicts detected along primary corridor.'
        });

        timelineEvents.push({
          id: `TL-${train.id}`,
          type: 'TRAIN_PASSAGE',
          trainId: train.id,
          trainName: train.name,
          color: train.color,
          startTime: train.departureTime,
          endTime: train.departureTime + baselineTravelTime,
          status: 'ON_TIME',
          label: `${train.trainNumber} ${train.name} (Direct ${baselineTravelTime}m)`
        });

        continue;
      }

      // 4. Conflict Detected: Calculate Dynamic Cost of Waiting vs Rerouting
      const trainArrivalAtBlock = train.departureTime + 25; // Approximate arrival at holding point (e.g. GZB)
      const waitTimeNeeded = Math.max(0, conflictingBlock.endTime - trainArrivalAtBlock);
      const costWait = waitTimeNeeded;

      // Calculate spatial detour route excluding the blocked edge
      const detourRoute = findShortestRoute(graph, sourceId, targetId, [conflictingBlock.edgeId]);
      const detourTravelTime = detourRoute.found ? detourRoute.travelTime : Infinity;
      const costReroute = detourRoute.found ? Math.max(0, detourTravelTime - baselineTravelTime) : Infinity;

      // 5. Check Station Loop-Line Capacity Constraint
      const currentOccupancy = holdingStation ? holdingStation.occupied : 0;
      const maxCapacity = holdingStation ? holdingStation.capacity : 4;
      const hasLoopCapacity = currentOccupancy < maxCapacity;

      // Manual baseline delay (without smart hold-vs-reroute optimization)
      // Standard manual practice either holds blindly (adding wait) or sends all trains on detour
      const manualDelay = Math.max(costWait, costReroute === Infinity ? costWait : costReroute);
      totalManualBaselineDelayMins += manualDelay;

      let chosenDecision = 'REROUTE';
      let delayIncurred = 0;
      let finalPath = detourRoute.path;
      let finalPathNames = detourRoute.pathNames;
      let reasonText = '';

      if (costWait <= costReroute && hasLoopCapacity) {
        // Option A: HOLD in Station Loop Line (Faster & Capacity Available)
        chosenDecision = 'HOLD';
        delayIncurred = costWait;
        finalPath = baselineRoute.path;
        finalPathNames = baselineRoute.pathNames;

        // Allocate loop line
        if (holdingStation) {
          holdingStation.occupied++;
          holdingStation.activeTrains.push({
            trainNumber: train.trainNumber,
            holdStart: trainArrivalAtBlock,
            holdEnd: conflictingBlock.endTime
          });
        }

        reasonText = `Wait time (+${costWait}m) is faster than detour (+${costReroute}m). Held in loop line at ${holdingStation?.name} (${holdingStation?.occupied}/${holdingStation?.capacity} occupied).`;
        totalEngineDelayMins += delayIncurred;
        totalDelayMinutesSaved += Math.max(0, costReroute - costWait);

        timelineEvents.push({
          id: `TL-${train.id}-WAIT`,
          type: 'TRAIN_HOLD',
          trainId: train.id,
          trainName: train.name,
          color: '#fbbf24',
          startTime: trainArrivalAtBlock,
          endTime: conflictingBlock.endTime,
          stationCode: holdingStation?.code,
          status: 'HELD_AT_STATION',
          label: `${train.trainNumber} Held at ${holdingStation?.code} (+${costWait}m)`
        });
      } else if (!hasLoopCapacity && costWait <= costReroute) {
        // Option B: Anti-Gridlock Trigger (Cost wait is lower, but Station Loop Lines are FULL!)
        chosenDecision = 'MANDATORY_REROUTE';
        delayIncurred = costReroute === Infinity ? costWait + 40 : costReroute;
        reasonText = `Gridlock Prevention: ${holdingStation?.name} loop lines are SATURATED (${holdingStation?.capacity}/${holdingStation?.capacity} FULL). Holding forbidden; forced spatial detour via bypass (+${delayIncurred}m).`;
        totalEngineDelayMins += delayIncurred;

        timelineEvents.push({
          id: `TL-${train.id}-REROUTE`,
          type: 'TRAIN_REROUTE',
          trainId: train.id,
          trainName: train.name,
          color: '#f87171',
          startTime: train.departureTime,
          endTime: train.departureTime + detourTravelTime,
          status: 'REROUTED_GRIDLOCK_GUARD',
          label: `${train.trainNumber} Gridlock Bypass (+${delayIncurred}m)`
        });
      } else {
        // Option C: REROUTE via Bypass (Detour is mathematically faster than waiting)
        chosenDecision = 'REROUTE';
        delayIncurred = costReroute;
        reasonText = `Detour penalty (+${costReroute}m) is faster than holding for track clearance (+${costWait}m). Dispatched via bypass corridor.`;
        totalEngineDelayMins += delayIncurred;
        totalDelayMinutesSaved += Math.max(0, costWait - costReroute);

        timelineEvents.push({
          id: `TL-${train.id}-REROUTE`,
          type: 'TRAIN_REROUTE',
          trainId: train.id,
          trainName: train.name,
          color: '#a855f7',
          startTime: train.departureTime,
          endTime: train.departureTime + detourTravelTime,
          status: 'REROUTED_SPEED_OPTIMAL',
          label: `${train.trainNumber} Bypass Detour (+${delayIncurred}m)`
        });
      }

      trainDecisions.push({
        trainId: train.id,
        trainNumber: train.trainNumber,
        trainName: train.name,
        trainType: train.trainType,
        priority: train.priority,
        decision: chosenDecision,
        decisionText: chosenDecision === 'HOLD' ? `Held at ${holdingStation?.code}` : 'Rerouted via Bypass',
        path: finalPath,
        pathNames: finalPathNames,
        departureTime: train.departureTime,
        arrivalTime: train.departureTime + (chosenDecision === 'HOLD' ? baselineTravelTime + delayIncurred : detourTravelTime),
        travelTime: chosenDecision === 'HOLD' ? baselineTravelTime + delayIncurred : detourTravelTime,
        waitDelayMins: chosenDecision === 'HOLD' ? delayIncurred : 0,
        detourDelayMins: chosenDecision !== 'HOLD' ? delayIncurred : 0,
        totalDelayMins: delayIncurred,
        holdingStation: holdingStation ? { id: holdingStation.id, code: holdingStation.code, name: holdingStation.name, occupied: holdingStation.occupied, capacity: holdingStation.capacity } : null,
        costs: {
          costWait,
          costReroute,
          hasLoopCapacity,
          stationOccupancy: `${currentOccupancy}/${maxCapacity}`
        },
        reason: reasonText
      });
    }

    // 6. Network KPI Computations
    const totalTrackHours = 24 * edges.length; // 24hr availability across network
    const totalMegaBlockHours = megaBlocks.reduce((acc, mb) => acc + (mb.durationMins || 60) / 60, 0);
    const assetUptimeIndex = ((1 - (totalMegaBlockHours / totalTrackHours)) * 100).toFixed(1);

    const stationCapacities = Array.from(stationMap.values()).map(st => ({
      id: st.id,
      name: st.name,
      code: st.code,
      capacity: st.capacity,
      occupied: st.occupied,
      utilizationPercent: ((st.occupied / st.capacity) * 100).toFixed(0),
      isSaturated: st.occupied >= st.capacity
    }));

    return {
      trainDecisions,
      timelineEvents,
      stationCapacities,
      kpis: {
        assetUptimeIndex: `${assetUptimeIndex}%`,
        delayMinutesSaved: Math.max(0, totalDelayMinutesSaved),
        totalEngineDelayMins,
        totalManualBaselineDelayMins,
        antiGridlockInterventions: trainDecisions.filter(t => t.decision === 'MANDATORY_REROUTE').length,
        trainsHeld: trainDecisions.filter(t => t.decision === 'HOLD').length,
        trainsRerouted: trainDecisions.filter(t => t.decision.includes('REROUTE')).length,
        trainsClear: trainDecisions.filter(t => t.decision === 'CLEAR_TRANSIT').length
      }
    };
  }
}

module.exports = { ChronologicalScheduler };
