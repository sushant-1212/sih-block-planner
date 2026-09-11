import React, { useState } from 'react';
import {
  CalendarClock,
  Layers,
  Train,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const TimelineGantt = ({
  megaBlocks = [],
  rawRequests = [],
  trainDecisions = [],
  timelineEvents = [],
  kpis = {}
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Time window: 0 to 360 minutes (6 hours)
  const MAX_TIME = 360;
  const timeMarkers = [0, 30, 60, 90, 120, 180, 240, 300, 360];

  const getPositionPercent = (mins) => {
    return Math.min(100, Math.max(0, (mins / MAX_TIME) * 100));
  };

  const getWidthPercent = (durationMins) => {
    return Math.max(1.5, Math.min(100, (durationMins / MAX_TIME) * 100));
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex flex-col shrink-0 z-20">
      {/* Header Bar with Toggle */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-6 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-900 transition-colors select-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <CalendarClock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-200 tracking-wide">
                Mega-Block Timeline &amp; Chronological Dispatch Gantt
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                SIH26027 Constraint Engine
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              Visualizes multi-department block consolidation &amp; train Hold vs. Reroute decisions
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Quick KPI stats in header */}
          <div className="hidden md:flex items-center gap-4 text-xs font-mono">
            <span className="text-slate-400">
              Mega-Block Ratio: <strong className="text-emerald-400">{kpis.megaBlockEfficiencyRatio || '2.5x'}</strong>
            </span>
            <span className="text-slate-400">
              Delay Saved: <strong className="text-amber-400">{kpis.delayMinutesSaved || 0}m</strong>
            </span>
            <span className="text-slate-400">
              Asset Uptime: <strong className="text-cyan-400">{kpis.assetUptimeIndex || '98.5%'}</strong>
            </span>
          </div>

          <button className="text-slate-400 hover:text-slate-200 p-1">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Collapsible Gantt Body */}
      {isExpanded && (
        <div className="p-4 overflow-x-auto space-y-4 max-h-72 overflow-y-auto">
          {/* Time Axis Header */}
          <div className="relative h-6 border-b border-slate-800 text-[10px] font-mono text-slate-400 ml-48 mr-4">
            {timeMarkers.map((time) => (
              <div
                key={time}
                style={{ left: `${getPositionPercent(time)}%` }}
                className="absolute transform -translate-x-1/2 flex flex-col items-center"
              >
                <span>T+{time}m</span>
                <div className="w-px h-1.5 bg-slate-700 mt-0.5" />
              </div>
            ))}
          </div>

          {/* Lane 1: Fragmented Department Maintenance Requests (Before Synthesis) */}
          <div className="flex items-center text-xs">
            <div className="w-48 shrink-0 pr-3 font-semibold text-[11px] text-slate-300 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span>Dept Requests (Raw)</span>
            </div>
            <div className="relative flex-1 h-7 bg-slate-950/60 rounded-lg border border-slate-800/80 mr-4 overflow-hidden">
              {rawRequests && rawRequests.length > 0 ? (
                rawRequests.map((req, idx) => {
                  const left = getPositionPercent(req.startTime || 15 * idx);
                  const width = getWidthPercent(req.duration_mins || req.durationMins || 45);
                  const isTrack = req.department === 'Track' || req.system_source === 'TMS';
                  const isSignal = req.department === 'Signal' || req.system_source === 'SMMS';
                  const isPower = req.department === 'Power' || req.system_source === 'TDMS';

                  const bgStyle = isTrack
                    ? 'bg-blue-600/80 border-blue-400 text-blue-100'
                    : isSignal
                    ? 'bg-amber-600/80 border-amber-400 text-amber-100'
                    : 'bg-purple-600/80 border-purple-400 text-purple-100';

                  return (
                    <div
                      key={req.id || idx}
                      style={{ left: `${left}%`, width: `${width}%` }}
                      title={`${req.department || req.system_source}: ${req.title} (${req.duration_mins || 45} mins)`}
                      className={`absolute top-1 bottom-1 rounded border text-[9px] font-bold px-1.5 flex items-center justify-between shadow-sm overflow-hidden whitespace-nowrap ${bgStyle}`}
                    >
                      <span className="truncate">{req.department || req.system_source}</span>
                      <span className="text-[8px] opacity-80 shrink-0">+{req.duration_mins || 45}m</span>
                    </div>
                  );
                })
              ) : (
                <div className="text-[10px] text-slate-500 italic flex items-center justify-center h-full">
                  No active maintenance requests in buffer
                </div>
              )}
            </div>
          </div>

          {/* Lane 2: Coordinated Mega-Block Synthesizer (After Synthesis) */}
          <div className="flex items-center text-xs">
            <div className="w-48 shrink-0 pr-3 font-semibold text-[11px] text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Synthesized Mega-Block</span>
            </div>
            <div className="relative flex-1 h-8 bg-slate-950/80 rounded-lg border border-emerald-500/30 mr-4 overflow-hidden shadow-inner">
              {megaBlocks && megaBlocks.length > 0 ? (
                megaBlocks.map((mb) => {
                  const left = getPositionPercent(mb.startTime);
                  const width = getWidthPercent(mb.durationMins);

                  return (
                    <div
                      key={mb.id}
                      style={{ left: `${left}%`, width: `${width}%` }}
                      title={`Mega-Block #${mb.id}: Consolidated ${mb.departments?.join(' + ')} (${mb.durationMins}m on ${mb.trackName})`}
                      className="absolute top-1 bottom-1 rounded-md border border-emerald-400 bg-emerald-950/80 text-emerald-200 text-[10px] font-bold px-2 flex items-center justify-between shadow-lg shadow-emerald-500/10 hazard-stripe"
                    >
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{mb.id}: {mb.trackName} ({mb.departments?.join(' + ')})</span>
                      </span>
                      <span className="bg-emerald-500 text-slate-950 text-[9px] px-1.5 py-0.2 rounded font-extrabold shrink-0">
                        {mb.durationMins} min window
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-[10px] text-slate-500 italic flex items-center justify-center h-full">
                  Corridor clear: 100% full track availability
                </div>
              )}
            </div>
          </div>

          {/* Lane 3 to N: Chronological Train Fleet Movements & Decisions */}
          {trainDecisions && trainDecisions.map((train) => {
            const isHold = train.decision === 'HOLD';
            const isGridlockGuard = train.decision === 'MANDATORY_REROUTE';
            const isReroute = train.decision.includes('REROUTE') && !isGridlockGuard;
            const isClear = train.decision === 'CLEAR_TRANSIT';

            const startLeft = getPositionPercent(train.departureTime);
            const totalWidth = getWidthPercent(train.travelTime);

            let barColor = 'bg-blue-500/20 border-blue-500/50 text-blue-300';
            let badgeText = 'Clear Transit';

            if (isHold) {
              barColor = 'bg-amber-500/25 border-amber-500 text-amber-200';
              badgeText = `Held at ${train.holdingStation?.code || 'Station'} (+${train.totalDelayMins}m)`;
            } else if (isGridlockGuard) {
              barColor = 'bg-red-500/25 border-red-500 text-red-200';
              badgeText = `Gridlock Guard Bypass (+${train.totalDelayMins}m)`;
            } else if (isReroute) {
              barColor = 'bg-purple-500/25 border-purple-500 text-purple-200';
              badgeText = `Bypass Detour (+${train.totalDelayMins}m)`;
            }

            return (
              <div key={train.trainId} className="flex items-center text-xs">
                <div className="w-48 shrink-0 pr-3 text-[11px] text-slate-300 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 truncate">
                    <Train className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="font-semibold truncate">{train.trainNumber} {train.trainName}</span>
                  </div>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                    P{train.priority}
                  </span>
                </div>

                <div className="relative flex-1 h-7 bg-slate-950/40 rounded-lg border border-slate-800/60 mr-4 overflow-hidden">
                  <div
                    style={{ left: `${startLeft}%`, width: `${totalWidth}%` }}
                    title={`Train ${train.trainNumber}: ${train.reason}`}
                    className={`absolute top-1 bottom-1 rounded border text-[10px] font-medium px-2 flex items-center justify-between transition-all ${barColor}`}
                  >
                    <span className="truncate font-semibold flex items-center gap-1">
                      {isHold && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />}
                      {isGridlockGuard && <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />}
                      {badgeText}
                    </span>
                    <span className="text-[9px] opacity-80 font-mono shrink-0">
                      Arr: T+{train.arrivalTime}m
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TimelineGantt;
