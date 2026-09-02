import React from 'react';
import {
  Wrench,
  AlertOctagon,
  Radio,
  Trash2,
  GitCompare,
  ArrowRight,
  ShieldCheck,
  Zap,
  RotateCcw
} from 'lucide-react';

const SCENARIOS = [
  {
    id: 'smms_flaw',
    title: 'SMMS Track Web Fracture',
    sourceSystem: 'SMMS',
    color: 'border-red-500/40 bg-red-950/30 text-red-300',
    edgeIds: [1],
    description: 'Track A1 (Station A → Junction 1) blocked for ultrasonic flaw repair.'
  },
  {
    id: 'tms_signal',
    title: 'TMS Signal Point Failure',
    sourceSystem: 'TMS',
    color: 'border-amber-500/40 bg-amber-950/30 text-amber-300',
    edgeIds: [3],
    description: 'Track B1 (Junction 1 → Station B) exit interlocking point inoperative.'
  },
  {
    id: 'tdms_wear',
    title: 'TDMS Major Catenary Renewal',
    sourceSystem: 'TDMS',
    color: 'border-indigo-500/40 bg-indigo-950/30 text-indigo-300',
    edgeIds: [1, 2],
    description: 'Dual track maintenance on Station A approaches.'
  },
  {
    id: 'full_mainline_block',
    title: 'Severe Corridor Blockade (Stress Test)',
    sourceSystem: 'MULTI-SYS',
    color: 'border-purple-500/40 bg-purple-950/30 text-purple-300',
    edgeIds: [1, 4],
    description: 'Main corridor and South exit blocked simultaneously. Forces multi-hop detour.'
  }
];

const ControlPanel = ({
  nodes = [],
  edges = [],
  blockedEdgeIds = [],
  sourceId = 1,
  targetId = 4,
  onSourceChange,
  onTargetChange,
  onToggleBlock,
  onApplyScenario,
  onResetNetwork,
  onClearCache
}) => {
  const blockedSet = new Set(blockedEdgeIds);

  return (
    <div className="w-80 bg-slate-900/95 backdrop-blur-md border-r border-slate-800 flex flex-col h-full overflow-y-auto shrink-0 z-20">
      {/* Station Selector Header */}
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-emerald-400" />
          Train Route Endpoints
        </h2>

        <div className="space-y-2.5">
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">
              Origin (Source)
            </label>
            <select
              value={sourceId}
              onChange={(e) => onSourceChange(Number(e.target.value))}
              className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg px-3 py-2 border border-slate-800 focus:outline-none focus:border-emerald-500"
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} ({n.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">
              Destination (Target)
            </label>
            <select
              value={targetId}
              onChange={(e) => onTargetChange(Number(e.target.value))}
              className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg px-3 py-2 border border-slate-800 focus:outline-none focus:border-cyan-500"
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} ({n.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Jury Demo Scenarios */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-amber-400" />
            Maintenance Scenarios
          </h2>
          <span className="text-[10px] text-slate-500">TMS / SMMS / TDMS</span>
        </div>

        <div className="space-y-2">
          {SCENARIOS.map((sc) => {
            const isFullyApplied = sc.edgeIds.every((id) => blockedSet.has(id));

            return (
              <div
                key={sc.id}
                className={`p-2.5 rounded-xl border transition-all ${
                  isFullyApplied
                    ? 'border-emerald-500/50 bg-emerald-950/20'
                    : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200 leading-tight">
                    {sc.title}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${sc.color}`}
                  >
                    {sc.sourceSystem}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                  {sc.description}
                </p>
                <button
                  onClick={() => onApplyScenario(sc.edgeIds)}
                  className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    isFullyApplied
                      ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  }`}
                >
                  {isFullyApplied ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      Re-Trigger Scenario
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      Simulate &amp; Reroute
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual Track Segment Controls */}
      <div className="p-4 flex-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Wrench className="w-4 h-4 text-slate-400" />
          Individual Track Controls
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
                    ? 'border-red-500/50 bg-red-950/30 text-red-300 shadow-sm shadow-red-500/10'
                    : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold leading-tight">
                    {e.track_name || `Track ${e.source} → ${e.target}`}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Travel: {e.travel_time} min • Speed: {e.speed_limit} km/h
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isBlocked
                      ? 'bg-red-500 text-white border-red-400 animate-pulse'
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
