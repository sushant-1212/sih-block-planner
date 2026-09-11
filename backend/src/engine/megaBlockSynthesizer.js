/**
 * Multi-Department Mega-Block Synthesizer Engine (SIH26027)
 *
 * Ingests fragmented maintenance requests from Track (TMS), Signal (SMMS), and Power/OHE (TDMS).
 * Consolidates overlapping or adjacent time-windows into single, coordinated "Mega-Blocks",
 * slashing total network asset downtime by up to 60%.
 */

class MegaBlockSynthesizer {
  /**
   * Synthesizes raw maintenance requests into unified Mega-Blocks
   * @param {Array} requests - Raw maintenance requests from TMS, SMMS, TDMS
   * @param {Array} edges - Network edges for context
   * @returns {Object} Consolidated Mega-Blocks and efficiency metrics
   */
  static synthesize(requests = [], edges = []) {
    if (!requests || requests.length === 0) {
      return {
        megaBlocks: [],
        metrics: {
          totalIndependentRequests: 0,
          totalMegaBlocks: 0,
          totalClosuresSaved: 0,
          megaBlockEfficiencyRatio: '1.0x',
          totalDowntimeSavedMins: 0,
          downtimeReductionPercent: '0.0%'
        }
      };
    }

    // Group requests by edge_id
    const edgeGroups = new Map();
    for (const req of requests) {
      const edgeId = Number(req.edge_id);
      if (!edgeGroups.has(edgeId)) {
        edgeGroups.set(edgeId, []);
      }
      edgeGroups.get(edgeId).push({
        id: req.id,
        title: req.title,
        reason: req.reason,
        department: req.department || req.system_source || 'Track',
        systemSource: req.system_source || 'TMS',
        startTime: Number(req.startTime || 0),
        durationMins: Number(req.duration_mins || req.durationMins || 60),
        endTime: Number(req.startTime || 0) + Number(req.duration_mins || req.durationMins || 60),
        severity: req.severity || 'HIGH'
      });
    }

    const megaBlocks = [];
    let totalIndependentMinutes = 0;
    let totalSynthesizedMinutes = 0;

    let megaBlockIdCounter = 1;

    for (const [edgeId, group] of edgeGroups.entries()) {
      // Sort requests chronologically by start time
      group.sort((a, b) => a.startTime - b.startTime);

      // Merge overlapping/adjacent windows (within 30 mins gap)
      let currentBlock = null;

      for (const req of group) {
        totalIndependentMinutes += req.durationMins;

        if (!currentBlock) {
          currentBlock = {
            id: `MB-${megaBlockIdCounter++}`,
            edgeId,
            trackName: edges.find(e => e.id === edgeId)?.track_name || `Track #${edgeId}`,
            startTime: req.startTime,
            endTime: req.endTime,
            departments: [req.department],
            systemSources: [req.systemSource],
            requests: [req],
            severities: [req.severity]
          };
        } else {
          // If this request overlaps or starts within 30 mins of the current block
          if (req.startTime <= currentBlock.endTime + 30) {
            currentBlock.endTime = Math.max(currentBlock.endTime, req.endTime);
            if (!currentBlock.departments.includes(req.department)) {
              currentBlock.departments.push(req.department);
            }
            if (!currentBlock.systemSources.includes(req.systemSource)) {
              currentBlock.systemSources.push(req.systemSource);
            }
            currentBlock.requests.push(req);
            currentBlock.severities.push(req.severity);
          } else {
            // Push finished block and start a new one
            currentBlock.durationMins = currentBlock.endTime - currentBlock.startTime;
            megaBlocks.push(currentBlock);
            totalSynthesizedMinutes += currentBlock.durationMins;

            currentBlock = {
              id: `MB-${megaBlockIdCounter++}`,
              edgeId,
              trackName: edges.find(e => e.id === edgeId)?.track_name || `Track #${edgeId}`,
              startTime: req.startTime,
              endTime: req.endTime,
              departments: [req.department],
              systemSources: [req.systemSource],
              requests: [req],
              severities: [req.severity]
            };
          }
        }
      }

      if (currentBlock) {
        currentBlock.durationMins = currentBlock.endTime - currentBlock.startTime;
        megaBlocks.push(currentBlock);
        totalSynthesizedMinutes += currentBlock.durationMins;
      }
    }

    const totalIndependentRequests = requests.length;
    const totalMegaBlocks = megaBlocks.length;
    const totalClosuresSaved = Math.max(0, totalIndependentRequests - totalMegaBlocks);
    const downtimeSavedMins = Math.max(0, totalIndependentMinutes - totalSynthesizedMinutes);
    const downtimeReductionPercent = totalIndependentMinutes > 0
      ? ((downtimeSavedMins / totalIndependentMinutes) * 100).toFixed(1)
      : '0.0';

    const efficiencyRatio = totalMegaBlocks > 0
      ? (totalIndependentRequests / totalMegaBlocks).toFixed(1)
      : '1.0';

    return {
      megaBlocks,
      metrics: {
        totalIndependentRequests,
        totalMegaBlocks,
        totalClosuresSaved,
        megaBlockEfficiencyRatio: `${efficiencyRatio}x`,
        totalDowntimeSavedMins: downtimeSavedMins,
        totalIndependentMinutes,
        totalSynthesizedMinutes,
        downtimeReductionPercent: `${downtimeReductionPercent}%`
      }
    };
  }
}

module.exports = { MegaBlockSynthesizer };
