import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Building2, GitFork, Navigation, Flag } from 'lucide-react';

const StationNode = ({ data, selected }) => {
  const {
    name,
    code,
    type = 'station',
    isSource,
    isTarget,
    isOnActiveRoute,
    routeIndex
  } = data;

  const isTerminal = type === 'terminal';
  const isJunction = type === 'junction';

  // Dynamic styling based on route state
  let borderClass = 'border-slate-700/80 bg-slate-900/90 shadow-lg';
  let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';

  if (isSource) {
    borderClass = 'border-emerald-500 bg-emerald-950/40 shadow-emerald-500/20 shadow-xl ring-2 ring-emerald-500/50';
    badgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
  } else if (isTarget) {
    borderClass = 'border-cyan-500 bg-cyan-950/40 shadow-cyan-500/20 shadow-xl ring-2 ring-cyan-500/50';
    badgeColor = 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
  } else if (isOnActiveRoute) {
    borderClass = 'border-emerald-500/80 bg-slate-900/95 shadow-emerald-500/10 shadow-lg ring-1 ring-emerald-500/40';
    badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  }

  return (
    <div className={`relative px-4 py-3 rounded-xl border backdrop-blur-md transition-all duration-300 min-w-[200px] ${borderClass} ${selected ? 'ring-2 ring-indigo-400' : ''}`}>
      {/* Handles for connections */}
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-slate-400 !border-2 !border-slate-900" />
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-slate-400 !border-2 !border-slate-900" />
      <Handle type="target" position={Position.Top} id="top" className="!w-3 !h-3 !bg-slate-400 !border-2 !border-slate-900" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-3 !h-3 !bg-slate-400 !border-2 !border-slate-900" />

      {/* Header Tag */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          {isSource ? (
            <Navigation className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
          ) : isTarget ? (
            <Flag className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20" />
          ) : isJunction ? (
            <GitFork className="w-3.5 h-3.5 text-indigo-400" />
          ) : (
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span className={`text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded border ${badgeColor}`}>
            {code}
          </span>
        </div>

        {isOnActiveRoute && routeIndex !== undefined && (
          <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 shadow-sm animate-pulse">
            Step {routeIndex + 1}
          </span>
        )}

        {isSource && !isOnActiveRoute && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
            ORIGIN
          </span>
        )}
      </div>

      {/* Station Name */}
      <div className="font-semibold text-sm text-slate-100 leading-tight">
        {name}
      </div>

      {/* Status Subtitle */}
      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/80 text-[11px] text-slate-400">
        <span className="capitalize">{type}</span>
        <span className={`flex items-center gap-1 text-[10px] font-medium ${isOnActiveRoute ? 'text-emerald-400' : 'text-slate-500'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isOnActiveRoute ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
          {isOnActiveRoute ? 'On Active Route' : 'Idle Track'}
        </span>
      </div>
    </div>
  );
};

export default memo(StationNode);
