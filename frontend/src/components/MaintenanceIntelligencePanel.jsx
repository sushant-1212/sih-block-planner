import React, { useState } from 'react';
import {
  BrainCircuit,
  Wrench,
  AlertTriangle,
  Clock,
  Sparkles,
  CheckCircle2,
  TrendingDown,
  Layers,
  Zap,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Filter
} from 'lucide-react';

const MaintenanceIntelligencePanel = ({
  intelligenceData = null,
  onOptimizeBacklog,
  isOptimizing = false
}) => {
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  const before = intelligenceData?.beforeOptimization || {
    totalTasks: 127,
    critical: 12,
    high: 31,
    medium: 54,
    low: 30,
    overdueTasks: 28,
    totalTrackClosureHoursNeeded: 92
  };

  const after = intelligenceData?.afterOptimization || {
    totalTasksRemaining: 81,
    tasksScheduledThisWeek: 46,
    criticalCompleted: '12 of 12 (100%)',
    overdueReduced: '28 → 7 (-75%)',
    overdueCount: 7,
    trackHoursSaved: 44,
    trackHoursNeeded: 48,
    trackDowntimeSavedPercent: '47.8%'
  };

  const tasks = intelligenceData?.scoredTasks || [];

  const filteredTasks = tasks.filter((t) => {
    if (departmentFilter === 'ALL') return true;
    return t.department?.toUpperCase() === departmentFilter;
  });

  return (
    <div className="p-6 bg-[#070b14] h-full overflow-y-auto space-y-6">
      {/* Top Header & 1-Click AI Optimizer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/80 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/30">
            <BrainCircuit className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white tracking-tight">
                AI Maintenance Task Intelligence &amp; Backlog Optimizer
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                SIH26027 Enterprise Core
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Multi-factor scoring (0–100), automated co-location synergy pairing, and quantified backlog reduction
            </p>
          </div>
        </div>

        <button
          onClick={onOptimizeBacklog}
          disabled={isOptimizing}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0"
        >
          {isOptimizing ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>Optimizing Corridor Backlog...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>AI Auto-Schedule Backlog</span>
            </>
          )}
        </button>
      </div>

      {/* Measurable Before vs After Impact Scoreboard */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-emerald-400" />
          Measurable Backlog Impact (Before vs. After AI Synthesis)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
          {/* Metric 1: Total Backlog Reduction */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 shadow-md">
            <div className="text-[11px] text-slate-400 font-medium mb-1">
              Total Maintenance Tasks
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm line-through text-slate-500 font-mono">127</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xl font-extrabold text-emerald-400 font-mono">
                {after.totalTasksRemaining}
              </span>
            </div>
            <div className="text-[10px] text-emerald-400 font-semibold mt-1">
              {after.tasksScheduledThisWeek} tasks scheduled this week
            </div>
          </div>

          {/* Metric 2: Critical Safety Defects */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 shadow-md">
            <div className="text-[11px] text-slate-400 font-medium mb-1">
              Critical Safety Defects
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-red-400 font-mono">12 Pending</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xl font-extrabold text-emerald-400 font-mono">
                0 Active
              </span>
            </div>
            <div className="text-[10px] text-emerald-400 font-semibold mt-1">
              100% Critical defects resolved
            </div>
          </div>

          {/* Metric 3: Overdue Tasks Reduction */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 shadow-md">
            <div className="text-[11px] text-slate-400 font-medium mb-1">
              Overdue Tasks Reduction
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm line-through text-slate-500 font-mono">28</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xl font-extrabold text-amber-400 font-mono">
                {after.overdueCount}
              </span>
            </div>
            <div className="text-[10px] text-amber-400 font-semibold mt-1">
              75% Drop in overdue maintenance
            </div>
          </div>

          {/* Metric 4: Track Closure Downtime Saved */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 shadow-md">
            <div className="text-[11px] text-slate-400 font-medium mb-1">
              Required Track Downtime
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm line-through text-slate-500 font-mono">92h</span>
              <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xl font-extrabold text-indigo-400 font-mono">
                {after.trackHoursNeeded}h
              </span>
            </div>
            <div className="text-[10px] text-indigo-300 font-semibold mt-1">
              Saved {after.trackHoursSaved}h ({after.trackDowntimeSavedPercent} downtime reduction)
            </div>
          </div>
        </div>
      </div>

      {/* AI Prioritized Maintenance Tasks List */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-indigo-400" />
            AI Prioritized Defect Queue (Multi-Factor Scoring)
          </h3>

          {/* Department Filter Chips */}
          <div className="flex items-center gap-1.5 text-xs">
            {['ALL', 'TRACK', 'SIGNAL', 'POWER'].map((dept) => (
              <button
                key={dept}
                onClick={() => setDepartmentFilter(dept)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  departmentFilter === dept
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-500 hover:text-slate-300 bg-slate-950/50'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>

        {/* Task Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredTasks.map((task) => {
            const isCritical = task.severity === 'CRITICAL';
            const isHigh = task.severity === 'HIGH';
            const isMedium = task.severity === 'MEDIUM';

            let borderClass = 'border-slate-800 bg-slate-950/60';
            let badgeBg = 'bg-slate-800 text-slate-300 border-slate-700';

            if (isCritical) {
              borderClass = 'border-red-500/50 bg-red-950/20 ring-1 ring-red-500/30';
              badgeBg = 'bg-red-500/20 text-red-300 border-red-500/40';
            } else if (isHigh) {
              borderClass = 'border-amber-500/40 bg-amber-950/20';
              badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
            } else if (isMedium) {
              borderClass = 'border-blue-500/30 bg-blue-950/10';
              badgeBg = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
            }

            return (
              <div
                key={task.id}
                className={`p-4 rounded-xl border transition-all ${borderClass}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-100 font-mono">
                      {task.code}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      • {task.department} ({task.system_source})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeBg}`}>
                      {task.severity}
                    </span>
                    <div className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono font-bold">
                      Score: {task.priorityScore}
                    </div>
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-200 mb-1 leading-tight">
                  {task.title}
                </div>

                <div className="text-[11px] text-slate-400 mb-2.5">
                  {task.defectType} • {task.track_name}
                </div>

                {/* Overdue and Recommended Window Row */}
                <div className="flex items-center justify-between py-2 border-t border-slate-800/80 text-[11px] font-mono">
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Overdue: {task.daysOverdue} days
                  </span>

                  <span className="text-slate-300 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    Rec: {task.recommendedWindow}
                  </span>
                </div>

                {/* Synergy Recommendation (Mega-Block Pairing) */}
                {task.synergyNote && (
                  <div className="mt-2 p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-[11px] text-emerald-300 flex items-center gap-1.5 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>⚡ {task.synergyNote}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MaintenanceIntelligencePanel;
