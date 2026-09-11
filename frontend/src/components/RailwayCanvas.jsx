import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import StationNode from './StationNode';
import TrackEdge from './TrackEdge';

const nodeTypes = {
  station: StationNode
};

const edgeTypes = {
  track: TrackEdge
};

const RailwayCanvas = ({
  rawNodes = [],
  rawEdges = [],
  blockedEdgeIds = [],
  activeRoute = null,
  sourceId = 1,
  targetId = 4,
  onToggleBlock
}) => {
  const activeNodeIds = useMemo(() => {
    return new Set(activeRoute?.path || []);
  }, [activeRoute]);

  const activeEdgeIds = useMemo(() => {
    return new Set(activeRoute?.edgeIds || []);
  }, [activeRoute]);

  const blockedSet = useMemo(() => {
    return new Set(blockedEdgeIds);
  }, [blockedEdgeIds]);

  // Transform raw nodes to React Flow node format
  const initialNodes = useMemo(() => {
    return rawNodes.map((node) => {
      const isSource = node.id === sourceId;
      const isTarget = node.id === targetId;
      const isOnActiveRoute = activeNodeIds.has(node.id);
      const routeIndex = activeRoute?.path?.indexOf(node.id);

      return {
        id: String(node.id),
        type: 'station',
        position: { x: node.x, y: node.y },
        data: {
          id: node.id,
          name: node.name,
          code: node.code,
          type: node.type,
          capacity: node.capacity !== undefined ? node.capacity : 4,
          occupied: node.occupied !== undefined ? node.occupied : 0,
          isSource,
          isTarget,
          isOnActiveRoute,
          routeIndex: routeIndex !== -1 ? routeIndex : undefined
        }
      };
    });
  }, [rawNodes, sourceId, targetId, activeNodeIds, activeRoute]);

  // Transform raw edges to React Flow edge format
  const initialEdges = useMemo(() => {
    return rawEdges.map((edge) => {
      const isBlocked = blockedSet.has(edge.id);
      const isOnActiveRoute = activeEdgeIds.has(edge.id);

      // Determine handle orientations based on source/target layout
      const sourceNode = rawNodes.find(n => n.id === edge.source);
      const targetNode = rawNodes.find(n => n.id === edge.target);

      let sourceHandle = null;
      let targetHandle = null;

      if (sourceNode && targetNode) {
        if (Math.abs(sourceNode.x - targetNode.x) < 50) {
          // Vertical connection (e.g. Cross Link)
          sourceHandle = sourceNode.y < targetNode.y ? 'bottom' : 'top';
          targetHandle = sourceNode.y < targetNode.y ? 'top' : 'bottom';
        }
      }

      return {
        id: `e${edge.id}-${edge.source}-${edge.target}`,
        source: String(edge.source),
        target: String(edge.target),
        sourceHandle,
        targetHandle,
        type: 'track',
        data: {
          edgeId: edge.id,
          isBlocked,
          isOnActiveRoute,
          travelTime: edge.travel_time,
          trackName: edge.track_name,
          speedLimit: edge.speed_limit,
          onToggleBlock
        }
      };
    });
  }, [rawEdges, rawNodes, blockedSet, activeEdgeIds, onToggleBlock]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state when props change
  React.useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  React.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  return (
    <div className="w-full h-full relative bg-[#070b14]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.5}
        maxZoom={1.5}
        className="bg-[#070b14]"
      >
        <Background color="#1e293b" gap={28} size={1.5} />
        <Controls
          className="!bg-slate-900/90 !border-slate-800 !fill-slate-300 !rounded-xl !shadow-2xl overflow-hidden"
          showInteractive={false}
        />
        <MiniMap
          nodeColor={(n) => {
            if (n.data?.isSource) return '#10b981';
            if (n.data?.isTarget) return '#06b6d4';
            if (n.data?.isOnActiveRoute) return '#34d399';
            return '#334155';
          }}
          maskColor="rgba(7, 11, 20, 0.85)"
          className="!bg-slate-950/90 !border !border-slate-800/80 !rounded-xl overflow-hidden shadow-2xl !bottom-4 !right-4"
        />
      </ReactFlow>
    </div>
  );
};

export default RailwayCanvas;
