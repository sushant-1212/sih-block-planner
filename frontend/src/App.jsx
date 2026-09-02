import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import RailwayCanvas from './components/RailwayCanvas';
import MetricsHUD from './components/MetricsHUD';
import EventLog from './components/EventLog';
import {
  fetchNetwork,
  calculateReroute,
  toggleEdgeBlock,
  resetNetwork,
  fetchCacheStats,
  clearCache,
  switchDataset
} from './services/api';

export default function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [blockedEdgeIds, setBlockedEdgeIds] = useState([]);
  const [sourceId, setSourceId] = useState(1);
  const [targetId, setTargetId] = useState(4);
  const [activeRoute, setActiveRoute] = useState(null);
  const [lastQueryResult, setLastQueryResult] = useState(null);
  const [cacheStats, setCacheStats] = useState({});
  const [logs, setLogs] = useState([]);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDataset, setCurrentDataset] = useState('demo');

  // Helper to append timestamped event logs
  const addLog = useCallback((type, message, latency = null) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
    setLogs(prev => [
      { time: timeStr, type, message, latency },
      ...prev.slice(0, 49)
    ]);
  }, []);

  // Compute route for given endpoints & blocked tracks
  const triggerReroute = useCallback(
    async (src, tgt, currentBlocks) => {
      try {
        const result = await calculateReroute(src, tgt, currentBlocks);
        setActiveRoute(result);
        setLastQueryResult(result);

        if (result.cacheHit) {
          addLog(
            'CACHE_HIT',
            `Fast route retrieval for ${src}→${tgt} with [${currentBlocks.join(', ')}]`,
            result.executionTimeMs
          );
        } else {
          addLog(
            'CACHE_MISS',
            `Graph Dijkstra computed path: ${result.pathNames?.join(' → ') || 'No route'}`,
            result.executionTimeMs
          );
        }

        // Refresh cache analytics
        const statsRes = await fetchCacheStats();
        if (statsRes.success) {
          setCacheStats(statsRes.stats);
        }
      } catch (err) {
        console.error('Reroute error:', err);
      }
    },
    [addLog]
  );

  // Initial load
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchNetwork();
      if (data.success) {
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        setBlockedEdgeIds(data.blockedEdgeIds || []);
        setCacheStats(data.cacheStats || {});

        const initialSrc = data.nodes[0]?.id || 1;
        const initialTgt = data.nodes[data.nodes.length - 1]?.id || 4;
        setSourceId(initialSrc);
        setTargetId(initialTgt);

        // Compute initial route
        await triggerReroute(initialSrc, initialTgt, data.blockedEdgeIds || []);
        addLog('RESET', 'Railway network graph loaded & baseline route calibrated');
      }
    } catch (err) {
      console.error('Failed to load railway network:', err);
    } finally {
      setIsLoading(false);
    }
  }, [triggerReroute, addLog]);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Switch between Standard Demo & Real Indian Railways Corridor
  const handleSwitchDataset = async (datasetName) => {
    try {
      setIsLoading(true);
      const data = await switchDataset(datasetName);
      if (data.success) {
        setCurrentDataset(data.currentDataset);
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        setBlockedEdgeIds(data.blockedEdgeIds || []);
        setCacheStats(data.cacheStats || {});

        const newSrc = data.nodes[0]?.id;
        const newTgt = data.nodes[data.nodes.length - 1]?.id;
        setSourceId(newSrc);
        setTargetId(newTgt);

        await triggerReroute(newSrc, newTgt, []);
        addLog('RESET', `Switched network topology to: ${datasetName === 'real_ir' ? 'Real Indian Railways (NCR Delhi-Kanpur Corridor)' : 'Standard 5-Node Demo'}`);
      }
    } catch (err) {
      console.error('Failed to switch dataset:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Source / Target change
  const handleSourceChange = (newSrc) => {
    setSourceId(newSrc);
    triggerReroute(newSrc, targetId, blockedEdgeIds);
  };

  const handleTargetChange = (newTgt) => {
    setTargetId(newTgt);
    triggerReroute(sourceId, newTgt, blockedEdgeIds);
  };

  // Toggle individual track block
  const handleToggleBlock = async (edgeId) => {
    try {
      const res = await toggleEdgeBlock(edgeId);
      if (res.success) {
        const updatedBlocks = res.blockedEdgeIds;
        setBlockedEdgeIds(updatedBlocks);
        addLog(
          'BLOCK_TOGGLED',
          `Track #${edgeId} ${res.isBlocked ? 'BLOCKED for Maintenance' : 'UNBLOCKED & Restored'}`
        );
        // Automatically re-run reroute calculation
        await triggerReroute(sourceId, targetId, updatedBlocks);
      }
    } catch (err) {
      console.error('Toggle block error:', err);
    }
  };

  // Apply a preset maintenance scenario
  const handleApplyScenario = async (edgeIdsToBlock) => {
    try {
      let current = [...blockedEdgeIds];
      for (const id of edgeIdsToBlock) {
        if (!current.includes(id)) {
          await toggleEdgeBlock(id, true);
          current.push(id);
        }
      }
      setBlockedEdgeIds(current);
      addLog('BLOCK_TOGGLED', `Applied maintenance scenario on tracks [${edgeIdsToBlock.join(', ')}]`);
      await triggerReroute(sourceId, targetId, current);
    } catch (err) {
      console.error('Scenario apply error:', err);
    }
  };

  // Global network reset
  const handleResetNetwork = async () => {
    try {
      const res = await resetNetwork();
      if (res.success) {
        setBlockedEdgeIds([]);
        addLog('RESET', 'Cleared all maintenance blocks across the railway network');
        await triggerReroute(sourceId, targetId, []);
      }
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  // Flush LRU cache
  const handleClearCache = async () => {
    try {
      const res = await clearCache();
      if (res.success) {
        setCacheStats(res.stats);
        addLog('RESET', 'LRU Cache flushed. Next route queries will re-execute Graph Solver.');
      }
    } catch (err) {
      console.error('Clear cache error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#070b14] text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="font-semibold text-sm tracking-wide text-slate-400">
            Initializing SIH Railway Network Engine...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#070b14]">
      {/* Top Header */}
      <Header
        cacheStats={cacheStats}
        blockedCount={blockedEdgeIds.length}
        activeRoute={activeRoute}
        currentDataset={currentDataset}
        onSwitchDataset={handleSwitchDataset}
        onReset={handleResetNetwork}
        onRefresh={loadInitialData}
      />

      {/* Main Workspace Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Side Control Panel */}
        <ControlPanel
          nodes={nodes}
          edges={edges}
          blockedEdgeIds={blockedEdgeIds}
          sourceId={sourceId}
          targetId={targetId}
          onSourceChange={handleSourceChange}
          onTargetChange={handleTargetChange}
          onToggleBlock={handleToggleBlock}
          onApplyScenario={handleApplyScenario}
          onResetNetwork={handleResetNetwork}
          onClearCache={handleClearCache}
        />

        {/* Center Railway Network React Flow Canvas */}
        <div className="flex-1 flex flex-col h-full relative">
          <RailwayCanvas
            rawNodes={nodes}
            rawEdges={edges}
            blockedEdgeIds={blockedEdgeIds}
            activeRoute={activeRoute}
            sourceId={sourceId}
            targetId={targetId}
            onToggleBlock={handleToggleBlock}
          />

          {/* Bottom Live Metrics & Latency HUD */}
          <MetricsHUD
            activeRoute={activeRoute}
            cacheStats={cacheStats}
            lastQueryResult={lastQueryResult}
          />
        </div>
      </div>

      {/* Floating Collapsible System Audit Trail */}
      <EventLog
        logs={logs}
        isOpen={isLogOpen}
        onToggle={() => setIsLogOpen(prev => !prev)}
      />
    </div>
  );
}
