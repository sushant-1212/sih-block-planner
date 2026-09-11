import React from 'react';
import {
  FileText,
  Train,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  Sparkles
} from 'lucide-react';

const DecisionAuditPanel = ({
  trainDecisions = [],
  megaBlocks = [],
  kpis = {}
}) => {
  return (
    <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">
            Train Dispatch Decision Matrix (SIH26027)
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="text-amber-400 font-semibold">
            {kpis.trainsHeld || 0} Trains Held
          </span>
          <span className="text-purple-400 font-semibold">
            {kpis.trainsRerouted || 0} Rerouted
          </span>
          {kpis.antiGridlockInterventions > 0 && (
            <span className="text-red-400 font-semibold px-2 py-0.5 rounded bg-red-950/60 border border-red-500/30">
              {kpis.antiGridlockInterventions} Gridlock Protected
            </span>
          )}
        </div>
      </div>

      {/* Decision Cards List */}
      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
        {trainDecisions && trainDecisions.length > 0 ? (
          trainDecisions.map((train) => {
            const isHold = train.decision === 'HOLD';
            const isGridlockGuard = train.decision === 'MANDATORY_REROUTE';
            const isReroute = train.decision.includes('REROUTE') && !isGridlockGuard;
            const isClear = train.decision === 'CLEAR_TRANSIT';

            let cardBorder = 'border-slate-800 bg-slate-900/50';
            let badgeBg = 'bg-blue-500/10 text-blue-400 border-blue-500/30';

            if (isHold) {
              cardBorder = 'border-amber-500/40 bg-amber-950/20';
              badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
            } else if (isGridlockGuard) {
              cardBorder = 'border-red-500/50 bg-red-950/30';
              badgeBg = 'bg-red-500/20 text-red-300 border-red-500/50 animate-pulse';
            } else if (isReroute) {
              cardBorder = 'border-purple-500/40 bg-purple-950/20';
              badgeBg = 'bg-purple-500/20 text-purple-300 border-purple-500/40';
            }

            return (
              <div
                key={train.trainId}
                className={`p-3 rounded-xl border text-xs transition-all ${cardBorder}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Train className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="font-bold text-slate-100">
                      #{train.trainNumber} {train.trainName}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ({train.trainType})
                    </span>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeBg}`}>
                    {train.decisionText}
                  </span>
                </div>

                {/* Mathematical Cost Justification */}
                <p className="text-[11px] text-slate-300 leading-relaxed mb-2 font-mono">
                  {train.reason}
                </p>

                {/* Cost Comparison Pills */}
                {train.costs && (
                  <div className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-slate-800/60 text-[10px] font-mono text-slate-400">
                    <span>
                      Wait Cost: <strong className="text-slate-200">+{train.costs.costWait}m</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Detour Cost: <strong className="text-slate-200">+{train.costs.costReroute}m</strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-slate-400" />
                      Station Loops: <strong className="text-slate-200">{train.costs.stationOccupancy}</strong>
                    </span>
                    <span className="ml-auto font-bold text-amber-400">
                      Delay: +{train.totalDelayMins}m
                    </span>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-6 text-slate-500 text-xs italic">
            No active train decisions. Dispatch queue is idle.
          </div>
        )}
      </div>
    </div>
  );
};

export default DecisionAuditPanel;
