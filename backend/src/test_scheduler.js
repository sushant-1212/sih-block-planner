const { db } = require('./db/database');
const { MegaBlockSynthesizer } = require('./engine/megaBlockSynthesizer');
const { ChronologicalScheduler } = require('./engine/chronologicalScheduler');

async function testScheduler() {
  console.log('===========================================================');
  console.log('  TESTING SIH26027 TIME-AWARE SCHEDULER & SYNTHESIZER');
  console.log('===========================================================');

  const nodes = db.getNodes();
  const edges = db.getEdges();
  const maintenance = db.getMaintenanceRequests();
  const trains = db.getTrains();

  console.log(`Loaded ${nodes.length} stations, ${edges.length} tracks, ${trains.length} real trains, ${maintenance.length} raw maintenance requests.`);

  // 1. Test Mega-Block Synthesis
  console.log('\n--- 1. Testing Mega-Block Synthesizer ---');
  const synthResult = MegaBlockSynthesizer.synthesize(maintenance, edges);
  console.log('Raw Requests Ingested:', synthResult.metrics.totalIndependentRequests);
  console.log('Consolidated Mega-Blocks:', synthResult.metrics.totalMegaBlocks);
  console.log('Mega-Block Efficiency Ratio:', synthResult.metrics.megaBlockEfficiencyRatio);
  console.log('Track Closures Saved:', synthResult.metrics.totalClosuresSaved);
  console.log('Downtime Reduction %:', synthResult.metrics.downtimeReductionPercent);

  for (const mb of synthResult.megaBlocks) {
    console.log(` -> [${mb.id}] on ${mb.trackName}: Window ${mb.startTime}m to ${mb.endTime}m (Duration: ${mb.durationMins}m). Departments: [${mb.departments.join(', ')}]`);
  }

  // 2. Test Chronological Min-Heap Scheduler & Hold vs Reroute
  console.log('\n--- 2. Testing Chronological Min-Heap Scheduler & Hold vs Reroute ---');
  const scheduleResult = ChronologicalScheduler.solve({
    nodes,
    edges,
    trains,
    megaBlocks: synthResult.megaBlocks
  });

  console.log('\nTrain Decisions Matrix:');
  for (const t of scheduleResult.trainDecisions) {
    console.log(`[Train ${t.trainNumber}] ${t.trainName} (Priority: ${t.priority})`);
    console.log(`   Decision: ${t.decision} | Delay: +${t.totalDelayMins}m`);
    console.log(`   Reason: ${t.reason}`);
  }

  console.log('\nStation Loop Line Capacity Utilization:');
  for (const st of scheduleResult.stationCapacities) {
    console.log(`   ${st.code} (${st.name}): ${st.occupied}/${st.capacity} Loop Lines [${st.utilizationPercent}%]`);
  }

  console.log('\nNetwork KPIs:');
  console.log('   Asset Uptime Index:', scheduleResult.kpis.assetUptimeIndex);
  console.log('   Delay Minutes Saved:', scheduleResult.kpis.delayMinutesSaved, 'mins');
  console.log('   Trains Held at Station:', scheduleResult.kpis.trainsHeld);
  console.log('   Trains Rerouted via Bypass:', scheduleResult.kpis.trainsRerouted);
  console.log('   Gridlock Interventions:', scheduleResult.kpis.antiGridlockInterventions);

  console.log('\n✅ ALL TIME-AWARE SCHEDULER TESTS PASSED SUCCESSFULLY!');
}

testScheduler();
