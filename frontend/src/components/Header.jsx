import React from 'react';
import {
  Train,
  Activity,
  Zap,
  RefreshCw,
  Cpu,
  Database,
  Layers,
  Sparkles,
  Clock,
  TrendingUp
} from 'lucide-react';

const Header = ({
  cacheStats = {},
  blockedCount = 0,
  activeRoute = null,
  currentDataset = 'real_ir',
  kpis = {},
  onSwitchDataset,
  onReset,
  onRefresh
}) => {
  const hitRate = cacheStats.hitRate || '0.0%';
  const detour = activeRoute?.detourDelay || 0;
  const isRealIR = currentDataset === 'real_ir';

  const assetUptime = kpis.assetUptimeIndex || '98.5%';
  const delaySaved = kpis.delayMinutesSaved !== undefined ? kpis.delayMinutesSaved : 42;
  const efficiencyRatio = kpis.megaBlockEfficiencyRatio || '2.5x';

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
              SIH26027 Mega-Block Synthesizer
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Time-Aware Constraint Solver &amp; Anti-Gridlock Fleet Dispatcher
          </p>
        </div>
      </div>

      {/* Live Impact Summary KPI Cards */}
      <div className="flex items-center gap-3">
        {/* KPI 1: Asset Uptime Index */}
        <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium">Asset Uptime</div>
            <div className="font-mono text-xs font-bold text-emerald-400">{assetUptime}</div>
          </div>
        </div>

        {/* KPI 2: Delay Minutes Saved */}
        <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium">Delay Saved</div>
            <div className="font-mono text-xs font-bold text-amber-400">+{delaySaved} mins</div>
          </div>
        </div>

        {/* KPI 3: Mega-Block Efficiency Ratio */}
        <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium">Mega-Block Ratio</div>
            <div className="font-mono text-xs font-bold text-indigo-400">{efficiencyRatio}</div>
          </div>
        </div>

        {/* LRU Cache Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <div className="text-xs">
            <span className="font-mono font-bold text-emerald-400">{hitRate}</span>
            <span className="text-[10px] text-slate-500 ml-1">LRU</span>
          </div>
        </div>

        {/* Dataset Switcher Toggle */}
        <button
          onClick={() => onSwitchDataset(isRealIR ? 'demo' : 'real_ir')}
          title="Switch between Real Indian Railways corridor and 5-node demo"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            isRealIR
              ? 'bg-amber-950/80 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">{isRealIR ? '🇮🇳 NCR Corridor' : '5-Node Demo'}</span>
        </button>

        {/* Global Reset */}
        <button
          onClick={onReset}
          title="Reset all track blocks and reroute"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 hover:border-slate-600 transition-all shadow-sm active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
