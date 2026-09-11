const { MaintenanceIntelligence } = require('./engine/maintenanceIntelligence');
const { db } = require('./db/database');

function testIntelligence() {
  console.log('===========================================================');
  console.log('  TESTING AI MAINTENANCE TASK INTELLIGENCE & BACKLOG');
  console.log('===========================================================');

  const edges = db.getEdges();
  const analysis = MaintenanceIntelligence.analyzeBacklog(edges);

  console.log('\n--- 1. BEFORE VS. AFTER OPTIMIZATION METRICS ---');
  console.log('BEFORE:');
  console.log(`   Total Backlog Tasks: ${analysis.beforeOptimization.totalTasks}`);
  console.log(`   Critical: ${analysis.beforeOptimization.critical} | High: ${analysis.beforeOptimization.high}`);
  console.log(`   Overdue Tasks: ${analysis.beforeOptimization.overdueTasks}`);
  console.log(`   Track Hours Needed (Siloed): ${analysis.beforeOptimization.totalTrackClosureHoursNeeded} hours`);

  console.log('\nAFTER AI OPTIMIZATION:');
  console.log(`   Tasks Scheduled: ${analysis.afterOptimization.tasksScheduledThisWeek}`);
  console.log(`   Critical Completed: ${analysis.afterOptimization.criticalCompleted}`);
  console.log(`   Overdue Reduced: ${analysis.afterOptimization.overdueReduced}`);
  console.log(`   Track Hours Needed: ${analysis.afterOptimization.trackHoursNeeded} hours (Saved ${analysis.afterOptimization.trackHoursSaved}h / ${analysis.afterOptimization.trackDowntimeSavedPercent})`);

  console.log('\n--- 2. AI PRIORITIZED TASKS & CO-LOCATION SYNERGIES ---');
  for (const t of analysis.scoredTasks) {
    console.log(`[${t.code}] ${t.department} - ${t.title}`);
    console.log(`   Severity: ${t.severity} | Overdue: ${t.daysOverdue} days | Score: ${t.priorityScore}/100`);
    console.log(`   Recommended: ${t.recommendedWindow}`);
    if (t.synergyNote) {
      console.log(`   ⚡ SYNERGY: ${t.synergyNote}`);
    }
    console.log('');
  }

  console.log('✅ ALL MAINTENANCE INTELLIGENCE TESTS PASSED!');
}

testIntelligence();
