import React from 'react';
import {
  Zap,
  Cpu,
  Clock,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Database,
  Layers,
  Sparkles
} from 'lucide-react';

const MetricsHUD = ({
  activeRoute = null,
  cacheStats = {},
  lastQueryResult = null,
  baselineTravelTime = 20
}) => {
  const isCacheHit = lastQueryResult?.cacheHit === true;
  const executionTime = lastQueryResult?.executionTimeMs || 0;
  const travelTime = activeRoute?.travelTime || 0;
  const detourDelay = activeRoute?.detourDelay || 0;
  const pathNames = activeRoute?.pathNames || [];
  const found = activeRoute?.found !== false;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-900/80 backdrop-blur-md border-t border-slate-800 shrink-0">
      {/* 1. Dynamic Routing & Path Sequence Card */}
      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Active Computed Route
              </span>
            </div>

            {found ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Conflict-Free Path
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-950/60 px-2 py-0.5 rounded-md border border-red-500/30">
                <ShieldAlert className="w-3.5 h-3.5" />
                No Available Route
              </span>
            )}
          </div>

          {/* Route Progression Nodes */}
          {found && pathNames.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 py-1.5">
              {pathNames.map((name, idx) => (
                <React.Fragment key={idx}>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-100">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    {name}
                  </div>
                  {idx < pathNames.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="text-xs text-red-400 italic py-2">
              All viable connecting tracks are blocked by maintenance windows.
            </div>
          )}
        </div>

        {/* Travel Time & Detour Impact */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400">Total Travel Time:</span>
            <span className="font-mono font-bold text-slate-100">{travelTime} mins</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Detour Impact:</span>
            <span
              className={`font-mono font-bold ${
                detourDelay > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {detourDelay > 0 ? `+${detourDelay} min delay` : '0 min (Fastest Baseline)'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Custom LRU Cache Performance Card */}
      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                LRU Cache &amp; Constraint Solver Engine
              </span>
            </div>

            {/* Cache HIT / MISS Badge */}
            {isCacheHit ? (
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/50 shadow-sm shadow-emerald-500/20 animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                LRU CACHE HIT ({executionTime} ms)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-500/50">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                CACHE MISS → SOLVER ({executionTime} ms)
              </span>
            )}
          </div>

          {/* Cache Key & Speedup stats */}
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Source Engine:</span>
              <span className="font-mono text-slate-200">
                {isCacheHit ? 'O(1) In-Memory LRU Cache' : 'Dijkstra Constraint Graph Solver'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Cache Key:</span>
              <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 truncate max-w-[260px]">
                {lastQueryResult?.cacheKey || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Cache Statistics Meters */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 grid grid-cols-4 gap-2 text-center text-xs">
          <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400">Hit Rate</div>
            <div className="font-mono font-bold text-emerald-400">{cacheStats.hitRate || '0.0%'}</div>
          </div>
          <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400">Hits</div>
            <div className="font-mono font-bold text-slate-200">{cacheStats.hits || 0}</div>
          </div>
          <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400">Misses</div>
            <div className="font-mono font-bold text-slate-200">{cacheStats.misses || 0}</div>
          </div>
          <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400">Capacity</div>
            <div className="font-mono font-bold text-slate-200">
              {cacheStats.size || 0}/{cacheStats.capacity || 50}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsHUD;
