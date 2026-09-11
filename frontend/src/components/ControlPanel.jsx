import React, { useState } from 'react';
import {
  Wrench,
  AlertOctagon,
  Radio,
  Trash2,
  GitCompare,
  ArrowRight,
  ShieldCheck,
  Zap,
  RotateCcw,
  Sparkles,
  Layers,
  ShieldAlert,
  BrainCircuit,
  Clock,
  Calendar,
  AlertTriangle
} from 'lucide-react';

const MULTI_DEPT_SCENARIOS = [
  {
    id: 'tri_dept_megablock',
    title: 'Tri-Department Mega-Block (GZB-ALJN)',
    subtitle: 'Track (TMS) + Signal (SMMS) + Power (TDMS)',
    color: 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300',
    edgeIds: [202, 1],
    requests: [
      {
        id: 301,
        system_source: 'SMMS',
        department: 'Signal',
        edge_id: 202,
        title: 'Axle Counter & Point Calibration',
        startTime: 20,
        duration_mins: 45
      },
      {
        id: 302,
        system_source: 'TMS',
        department: 'Track',
        edge_id: 202,
        title: 'Rail Flaw Joint Weld & USFD',
        startTime: 25,
        duration_mins: 60
      },
      {
        id: 303,
        system_source: 'TDMS',
        department: 'Power',
        edge_id: 202,
        title: 'OHE Catenary Wire Tensioning',
        startTime: 30,
        duration_mins: 45
      }
    ],
    description: 'Synthesizes 3 separate departmental requests into a single 65-min Mega-Block, saving 85 mins of downtime.'
  },
  {
    id: 'gridlock_saturation_test',
    title: 'Loop Saturation & Anti-Gridlock Guard',
    subtitle: 'Tests Physical Station Loop Line Capacity',
    color: 'border-amber-500/50 bg-amber-950/30 text-amber-300',
    edgeIds: [202, 1],
    requests: [
      {
        id: 302,
        system_source: 'TMS',
        department: 'Track',
        edge_id: 202,
        title: 'Major 3-Hour Track Bed Renewal',
        startTime: 10,
        duration_mins: 140
      }
    ],
    description: 'Saturates GZB loop lines (4/4 full). Proves engine prevents gridlock by forcing spatial detours.'
  },
  {
    id: 'tdl_cnb_power_block',
    title: 'TDL-CNB Main Line Power & Track Block',
    subtitle: 'High Output Ballast Tamping + Substation Breaker',
    color: 'border-purple-500/50 bg-purple-950/30 text-purple-300',
    edgeIds: [206, 3],
    requests: [
      {
        id: 304,
        system_source: 'TMS',
        department: 'Track',
        edge_id: 206,
        title: 'High-Output Ballast Tamping (CSM-09)',
        startTime: 40,
        duration_mins: 90
      },
      {
        id: 305,
        system_source: 'TDMS',
        department: 'Power',
        edge_id: 206,
        title: 'Substation Feeder Breaker Servicing',
        startTime: 50,
        duration_mins: 60
      }
    ],
    description: 'Synthesizes Track and Power work into a unified 90-min window on the Kanpur express approach.'
  }
];

const AI_PRIORITY_TASKS = [
  {
    code: 'Track T-104',
    title: 'Rail Defect (AT-Weld)',
    department: 'Track (TMS)',
    severity: 'CRITICAL',
    overdueDays: 12,
    trainImpact: 'HIGH',
    priorityScore: 94,
    recommendedWindow: '14:30–16:00',
    edgeId: 202,
    color: 'border-red-500/50 bg-red-950/30 text-red-300'
  },
  {
    code: 'Signal S-221',
    title: 'Inspection Overdue (Axle Counter)',
    department: 'Signal (SMMS)',
    severity: 'HIGH',
    overdueDays: 8,
    trainImpact: 'HIGH',
    priorityScore: 81,
    recommendedWindow: '14:30–16:00',
    synergyNote: 'Can be combined with T-104',
    edgeId: 202,
    color: 'border-amber-500/50 bg-amber-950/30 text-amber-300'
  },
  {
    code: 'Power P-309',
    title: 'OHE Catenary Wire Slack',
    department: 'Power (TDMS)',
    severity: 'HIGH',
    overdueDays: 6,
    trainImpact: 'HIGH',
    priorityScore: 78,
    recommendedWindow: '14:30–16:00',
    synergyNote: 'Can be combined with T-104',
    edgeId: 202,
    color: 'border-purple-500/50 bg-purple-950/30 text-purple-300'
  },
  {
    code: 'Track T-108',
    title: 'Continuous Track Tamping',
    department: 'Track (TMS)',
    severity: 'HIGH',
    overdueDays: 14,
    trainImpact: 'HIGH',
    priorityScore: 83,
    recommendedWindow: '11:00–12:30',
    edgeId: 206,
    color: 'border-amber-500/50 bg-amber-950/30 text-amber-300'
  }
];

const ControlPanel = ({
  nodes = [],
  edges = [],
  blockedEdgeIds = [],
  stationCapacities = [],
  sourceId = 101,
  targetId = 107,
  onSourceChange,
  onTargetChange,
  onToggleBlock,
  onApplyScenario,
  onOptimizeBacklog,
  onResetNetwork,
  onClearCache
}) => {
  const [leftTab, setLeftTab] = useState('ai_priority'); // 'ai_priority' | 'scenarios'
  const blockedSet = new Set(blockedEdgeIds);

  return (
    <div className="w-80 bg-slate-900/95 backdrop-blur-md border-r border-slate-800 flex flex-col h-full overflow-y-auto shrink-0 z-20">
      {/* Route Endpoints */}
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-emerald-400" />
          Corridor Terminals
        </h2>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-medium text-slate-400 block mb-1">
              Origin (Source)
            </label>
            <select
              value={sourceId}
              onChange={(e) => onSourceChange(Number(e.target.value))}
              className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 border border-slate-800 focus:outline-none focus:border-emerald-500 font-mono"
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.code} - {n.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-medium text-slate-400 block mb-1">
              Destination (Target)
            </label>
            <select
              value={targetId}
              onChange={(e) => onTargetChange(Number(e.target.value))}
              className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 border border-slate-800 focus:outline-none focus:border-cyan-500 font-mono"
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.code} - {n.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Segmented Control: AI Task Priority vs Macro Scenarios */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/40">
        <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setLeftTab('ai_priority')}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
              leftTab === 'ai_priority'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            AI Task Priority
          </button>
          <button
            onClick={() => setLeftTab('scenarios')}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
              leftTab === 'scenarios'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Mega-Blocks
          </button>
        </div>
      </div>

      {/* TAB A: AI Maintenance Priority Cards (Direct PS Match) */}
      {leftTab === 'ai_priority' ? (
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <BrainCircuit className="w-4 h-4 text-amber-400" />
              AI Maintenance Priority
            </h2>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Top 4 Queue
            </span>
          </div>

          <div className="space-y-2.5">
            {AI_PRIORITY_TASKS.map((task) => {
              const isCritical = task.severity === 'CRITICAL';
              return (
                <div
                  key={task.code}
                  className={`p-3 rounded-xl border text-xs transition-all ${
                    isCritical
                      ? 'border-red-500/50 bg-red-950/20'
                      : 'border-amber-500/40 bg-amber-950/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-extrabold text-xs text-slate-100 font-mono">
                      {isCritical ? '🔴' : '🟠'} {task.severity}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono font-bold text-slate-200">
                      Score: {task.priorityScore}
                    </span>
                  </div>

                  <div className="font-bold text-slate-200 text-xs mb-0.5">
                    {task.code}
                  </div>
                  <div className="text-[11px] text-slate-400 mb-2">
                    {task.title}
                  </div>

                  <div className="space-y-1 text-[10px] font-mono text-slate-400 py-1.5 border-t border-slate-800/80">
                    <div className="flex justify-between">
                      <span>Overdue:</span>
                      <strong className="text-amber-300">{task.overdueDays} days</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Train impact:</span>
                      <strong className="text-red-400">{task.trainImpact}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Recommended:</span>
                      <strong className="text-emerald-400">{task.recommendedWindow}</strong>
                    </div>
                  </div>

                  {task.synergyNote && (
                    <div className="mt-2 p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-[10px] text-emerald-300 flex items-center gap-1 font-medium">
                      <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>→ {task.synergyNote}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={onOptimizeBacklog}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-950" />
            AI Auto-Schedule Backlog
          </button>
        </div>
      ) : (
        /* TAB B: Multi-Department Mega-Block Macro Triggers */
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Mega-Block Synthesizer
            </h2>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              TMS / SMMS / TDMS
            </span>
          </div>

          <div className="space-y-2.5">
            {MULTI_DEPT_SCENARIOS.map((sc) => {
              const isApplied = sc.edgeIds.some((id) => blockedSet.has(id));

              return (
                <div
                  key={sc.id}
                  className={`p-3 rounded-xl border transition-all ${
                    isApplied
                      ? 'border-emerald-500/60 bg-emerald-950/20 shadow-md shadow-emerald-500/10'
                      : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-100 leading-tight">
                      {sc.title}
                    </span>
                  </div>
                  <div className="text-[10px] text-amber-400 font-semibold mb-1">
                    {sc.subtitle}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-2.5">
                    {sc.description}
                  </p>

                  <button
                    onClick={() => onApplyScenario(sc)}
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      isApplied
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        Re-Trigger Optimization
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        Synthesize Mega-Block
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Station Physical Loop-Line Capacity Monitor */}
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-400" />
            Station Loop Capacity
          </span>
          <span className="text-[10px] font-mono text-slate-500">Occupied/Total</span>
        </h2>

        <div className="space-y-1.5">
          {nodes.map((n) => {
            const cap = n.capacity || 4;
            const occ = n.occupied || 0;
            const pct = Math.round((occ / cap) * 100);
            const isFull = occ >= cap;

            return (
              <div
                key={n.id}
                className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center justify-between font-mono ${
                  isFull
                    ? 'border-red-500/50 bg-red-950/30 text-red-300 animate-pulse'
                    : occ > 0
                    ? 'border-amber-500/40 bg-amber-950/20 text-amber-200'
                    : 'border-slate-800/80 bg-slate-950/40 text-slate-400'
                }`}
              >
                <span className="font-semibold text-slate-200">{n.code} ({n.name.split(' ')[0]})</span>
                <div className="flex items-center gap-2">
                  <span>{occ}/{cap} Loops</span>
                  <span className={`text-[10px] font-bold ${isFull ? 'text-red-400' : 'text-slate-500'}`}>
                    [{pct}%]
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual Track Segment Controls */}
      <div className="p-4 flex-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
          <Wrench className="w-4 h-4 text-slate-400" />
          Manual Track Toggles
        </h2>

        <div className="space-y-1.5">
          {edges.map((e) => {
            const isBlocked = blockedSet.has(e.id);
            return (
              <button
                key={e.id}
                onClick={() => onToggleBlock(e.id)}
                className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition-all ${
                  isBlocked
                    ? 'border-red-500/50 bg-red-950/30 text-red-300'
                    : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="truncate pr-2">
                  <div className="text-xs font-semibold leading-tight truncate">
                    {e.track_name || `Track ${e.source} → ${e.target}`}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {e.travel_time}m • {e.speed_limit}km/h
                  </div>
                </div>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                    isBlocked
                      ? 'bg-red-500 text-white border-red-400'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {isBlocked ? 'BLOCKED' : 'CLEAR'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer System Actions */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2">
        <button
          onClick={onClearCache}
          className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-700 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5 text-slate-400" />
          Flush Cache
        </button>
        <button
          onClick={onResetNetwork}
          className="flex-1 py-2 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-emerald-500/40 transition-all"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Clear Blocks
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
