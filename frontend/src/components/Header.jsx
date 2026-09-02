import React from 'react';
import { Train, Activity, Zap, RefreshCw, Cpu, Database, MapPin } from 'lucide-react';

const Header = ({
  cacheStats = {},
  blockedCount = 0,
  activeRoute = null,
  currentDataset = 'demo',
  onSwitchDataset,
  onReset,
  onRefresh
}) => {
  const hitRate = cacheStats.hitRate || '0.0%';
  const detour = activeRoute?.detourDelay || 0;
  const isRealIR = currentDataset === 'real_ir';

  return (
    <header className="h-16 px-6 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-30 shrink-0 shadow-lg">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/30">
          <Train className="w-5 h-5 text-slate-950 stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-2">
              SIH RailRoute Optimizer
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 tracking-wider uppercase">
              {isRealIR ? '🇮🇳 Delhi-Kanpur NCR Corridor' : 'Standard 5-Node Demo'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Dynamic Track Block Planner &amp; Constraint Rerouting Engine
          </p>
        </div>
      </div>

      {/* Live System Indicators */}
      <div className="flex items-center gap-4">
        {/* Dataset Switcher Toggle */}
        <button
          onClick={() => onSwitchDataset(isRealIR ? 'demo' : 'real_ir')}
          title="Switch between simplified 5-node demo and Real Indian Railways corridor"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            isRealIR
              ? 'bg-amber-950/80 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/30'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-amber-400" />
          <span>{isRealIR ? 'Switch to 5-Node Demo' : 'Load Real IR Data (NCR)'}</span>
        </button>

        {/* LRU Cache Status */}
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>LRU Cache:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-emerald-400">{hitRate}</span>
            <span className="text-[10px] text-slate-500">({cacheStats.hits || 0}H / {cacheStats.misses || 0}M)</span>
          </div>
        </div>

        {/* Detour Delay Indicator */}
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Detour Impact:</span>
          </div>
          <span className={`font-mono text-xs font-bold ${detour > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {detour > 0 ? `+${detour} min delay` : 'Optimal (0 min)'}
          </span>
        </div>

        {/* Active Blocks */}
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Activity className="w-3.5 h-3.5 text-red-400" />
            <span>Active Blocks:</span>
          </div>
          <span className={`font-mono text-xs font-bold ${blockedCount > 0 ? 'text-red-400' : 'text-slate-300'}`}>
            {blockedCount} Track{blockedCount === 1 ? '' : 's'}
          </span>
        </div>

        {/* Global Reset */}
        <button
          onClick={onReset}
          title="Reset all track blocks and reroute"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 hover:border-slate-600 transition-all shadow-sm active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          Reset
        </button>
      </div>
    </header>
  );
};

export default Header;
