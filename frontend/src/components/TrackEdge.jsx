import React, { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from '@xyflow/react';
import { Clock, AlertTriangle, ShieldAlert, Zap } from 'lucide-react';

const TrackEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data = {}
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16
  });

  const {
    isBlocked = false,
    isOnActiveRoute = false,
    travelTime = 10,
    trackName = 'Track',
    speedLimit = 110,
    edgeId,
    onToggleBlock
  } = data;

  // Visual edge styling
  let strokeColor = '#334155'; // default slate-700
  let strokeWidth = 3;
  let strokeDasharray = 'none';
  let isAnimated = false;

  if (isBlocked) {
    strokeColor = '#ef4444'; // Red hazard
    strokeWidth = 4;
    strokeDasharray = '6 6';
  } else if (isOnActiveRoute) {
    strokeColor = '#10b981'; // Green active route
    strokeWidth = 4;
    strokeDasharray = '8 4';
    isAnimated = true;
  }

  const handleClick = (e) => {
    e.stopPropagation();
    if (onToggleBlock) {
      onToggleBlock(edgeId);
    }
  };

  return (
    <>
      {/* Background shadow path */}
      <path
        d={edgePath}
        fill="none"
        stroke={isBlocked ? 'rgba(239, 68, 68, 0.25)' : isOnActiveRoute ? 'rgba(16, 185, 129, 0.35)' : 'transparent'}
        strokeWidth={strokeWidth + 8}
        strokeLinecap="round"
      />

      {/* Main track path */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray,
          animation: isAnimated ? 'trackFlow 1.2s linear infinite' : undefined,
          cursor: 'pointer',
          transition: 'stroke 0.3s, stroke-width 0.3s'
        }}
      />

      {/* Interactive label & button on track */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all'
          }}
          className="nodrag nopan"
        >
          <button
            onClick={handleClick}
            title={isBlocked ? 'Click to UNBLOCK this track' : 'Click to BLOCK this track (Simulate Maintenance)'}
            className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shadow-xl backdrop-blur-md transition-all duration-200 transform hover:scale-105 border ${
              isBlocked
                ? 'bg-red-950/90 text-red-300 border-red-500/60 shadow-red-500/20 animate-pulse'
                : isOnActiveRoute
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60 shadow-emerald-500/20 ring-1 ring-emerald-500/40'
                : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:border-slate-500'
            }`}
          >
            {isBlocked ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="text-[11px] font-bold tracking-wide">BLOCKED</span>
              </>
            ) : isOnActiveRoute ? (
              <>
                <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/30 shrink-0 animate-bounce" />
                <span className="text-[11px] font-bold tracking-wide text-emerald-200">{travelTime} min</span>
              </>
            ) : (
              <>
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="text-[11px] text-slate-300">{travelTime} min</span>
              </>
            )}

            {/* Hover tooltip badge */}
            <span className="hidden group-hover:inline-block ml-1 text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
              {isBlocked ? 'Unblock' : 'Block'}
            </span>
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default memo(TrackEdge);
