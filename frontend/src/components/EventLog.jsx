import React from 'react';
import { Terminal, Sparkles, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

const EventLog = ({ logs = [], isOpen, onToggle }) => {
  return (
    <div
      className={`fixed bottom-0 right-0 z-40 transition-all duration-300 ${
        isOpen ? 'h-64' : 'h-9'
      } w-96 bg-slate-950/95 backdrop-blur-md border-t border-l border-slate-800 rounded-tl-2xl shadow-2xl flex flex-col overflow-hidden`}
    >
      {/* Header bar */}
      <div
        onClick={onToggle}
        className="h-9 px-3.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between cursor-pointer hover:bg-slate-850 select-none shrink-0"
      >
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span>Real-time System Audit Trail</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
            {logs.length}
          </span>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          {isOpen ? '▼ minimize' : '▲ expand'}
        </span>
      </div>

      {/* Log Feed */}
      {isOpen && (
        <div className="p-3 overflow-y-auto flex-1 font-mono text-[11px] space-y-2">
          {logs.length === 0 ? (
            <div className="text-slate-500 italic text-center py-6">
              Listening for railway block events and reroute computations...
            </div>
          ) : (
            logs.map((log, index) => {
              const isHit = log.type === 'CACHE_HIT';
              const isMiss = log.type === 'CACHE_MISS';
              const isBlock = log.type === 'BLOCK_TOGGLED';
              const isReset = log.type === 'RESET';

              return (
                <div
                  key={index}
                  className="flex items-start gap-2 p-1.5 rounded bg-slate-900/60 border border-slate-800/60 leading-tight"
                >
                  <span className="text-[10px] text-slate-500 shrink-0">{log.time}</span>

                  <div className="flex-1">
                    {isHit && (
                      <div className="text-emerald-300 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>[LRU HIT] {log.message}</span>
                        <span className="text-emerald-400 font-bold ml-auto">{log.latency}ms</span>
                      </div>
                    )}

                    {isMiss && (
                      <div className="text-amber-300 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>[SOLVER] {log.message}</span>
                        <span className="text-amber-400 font-bold ml-auto">{log.latency}ms</span>
                      </div>
                    )}

                    {isBlock && (
                      <div className="text-red-300 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                        <span>[BLOCK] {log.message}</span>
                      </div>
                    )}

                    {isReset && (
                      <div className="text-cyan-300 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span>[NETWORK] {log.message}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default EventLog;
