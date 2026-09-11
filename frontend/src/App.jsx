import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import RailwayCanvas from './components/RailwayCanvas';
import MetricsHUD from './components/MetricsHUD';
import TimelineGantt from './components/TimelineGantt';
import DecisionAuditPanel from './components/DecisionAuditPanel';
import EventLog from './components/EventLog';
import {
  fetchNetwork,
  calculateReroute,
  synthesizeSchedule,
  toggleEdgeBlock,
  resetNetwork,
  fetchCacheStats,
  clearCache,
  switchDataset
} from './services/api';

export default function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [trains, setTrains] = useState([]);
  const [rawMaintenance, setRawMaintenance] = useState([]);
  const [blockedEdgeIds, setBlockedEdgeIds] = useState([]);
  const [sourceId, setSourceId] = useState(101);
  const [targetId, setTargetId] = useState(107);
  const [activeRoute, setActiveRoute] = useState(null);
  const [lastQueryResult, setLastQueryResult] = useState(null);
  const [cacheStats, setCacheStats] = useState({});
  const [logs, setLogs] = useState([]);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDataset, setCurrentDataset] = useState('real_ir');

  // Time-Aware Synthesizer State (SIH26027)
  const [synthesizedSchedule, setSynthesizedSchedule] = useState({
    megaBlocks: [],
    megaBlockMetrics: {},
    trainDecisions: [],
    timelineEvents: [],
    stationCapacities: [],
    kpis: {
      assetUptimeIndex: '98.5%',
      delayMinutesSaved: 42,
      megaBlockEfficiencyRatio: '2.5x',
      antiGridlockInterventions: 1,
      trainsHeld: 4,
      trainsRerouted: 1
    }
  });

  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'decision_matrix'

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
        setTrains(data.trains || []);
        setRawMaintenance(data.maintenance || []);
        setBlockedEdgeIds(data.blockedEdgeIds || []);
        setCacheStats(data.cacheStats || {});

        if (data.synthesizedSchedule) {
          setSynthesizedSchedule(data.synthesizedSchedule);
        }

        const initialSrc = data.nodes[0]?.id || 101;
        const initialTgt = data.nodes[data.nodes.length - 1]?.id || 107;
        setSourceId(initialSrc);
        setTargetId(initialTgt);

        // Compute initial route
        await triggerReroute(initialSrc, initialTgt, data.blockedEdgeIds || []);
        addLog('RESET', 'Railway network graph & multi-department scheduler loaded');
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

  // Switch between Real Indian Railways Corridor & 5-Node Demo
  const handleSwitchDataset = async (datasetName) => {
    try {
      setIsLoading(true);
      const data = await switchDataset(datasetName);
      if (data.success) {
        setCurrentDataset(data.currentDataset);
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        setTrains(data.trains || []);
        setRawMaintenance(data.maintenance || []);
        setBlockedEdgeIds(data.blockedEdgeIds || []);
        setCacheStats(data.cacheStats || {});

        if (data.synthesizedSchedule) {
          setSynthesizedSchedule(data.synthesizedSchedule);
        }

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
        if (res.synthesizedSchedule) {
          setSynthesizedSchedule(res.synthesizedSchedule);
        }
        if (res.nodes) {
          setNodes(res.nodes);
        }

        addLog(
          'BLOCK_TOGGLED',
          `Track #${edgeId} ${res.isBlocked ? 'BLOCKED for Maintenance' : 'UNBLOCKED & Restored'}`
        );
        await triggerReroute(sourceId, targetId, updatedBlocks);
      }
    } catch (err) {
      console.error('Toggle block error:', err);
    }
  };

  // Apply a multi-department preset scenario
  const handleApplyScenario = async (scenario) => {
    try {
      addLog('BLOCK_TOGGLED', `Synthesizing Mega-Block: ${scenario.title}`);
      const res = await synthesizeSchedule(scenario.requests, scenario.edgeIds);
      if (res.success) {
        setSynthesizedSchedule({
          megaBlocks: res.megaBlocks,
          megaBlockMetrics: res.megaBlockMetrics,
          trainDecisions: res.trainDecisions,
          timelineEvents: res.timelineEvents,
          stationCapacities: res.stationCapacities,
          kpis: res.kpis
        });

        if (res.nodes) {
          setNodes(res.nodes);
        }
        if (res.blockedEdgeIds) {
          setBlockedEdgeIds(res.blockedEdgeIds);
          await triggerReroute(sourceId, targetId, res.blockedEdgeIds);
        }

        addLog('RESET', `Mega-Block activated: ${res.megaBlocks.length} window(s) consolidated, saving ${res.kpis.delayMinutesSaved || 0} delay mins.`);
      }
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
        if (res.synthesizedSchedule) {
          setSynthesizedSchedule(res.synthesizedSchedule);
        }
        if (res.nodes) {
          setNodes(res.nodes);
        }
        addLog('RESET', 'Cleared all maintenance blocks across the railway network & reset loop lines');
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
          <p className="font-semibold text-sm tracking-wide text-slate-400 font-mono">
            Initializing SIH26027 Time-Aware Railway Synthesizer...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#070b14]">
      {/* Top Header with Live KPI Summary Cards */}
      <Header
        cacheStats={cacheStats}
        blockedCount={blockedEdgeIds.length}
        activeRoute={activeRoute}
        currentDataset={currentDataset}
        kpis={synthesizedSchedule.kpis}
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
          stationCapacities={synthesizedSchedule.stationCapacities}
          sourceId={sourceId}
          targetId={targetId}
          onSourceChange={handleSourceChange}
          onTargetChange={handleTargetChange}
          onToggleBlock={handleToggleBlock}
          onApplyScenario={handleApplyScenario}
          onResetNetwork={handleResetNetwork}
          onClearCache={handleClearCache}
        />

        {/* Center Railway Network React Flow Canvas & Chronological Schedulers */}
        <div className="flex-1 flex flex-col h-full relative overflow-hidden">
          {/* Top Tabs Bar: Canvas vs Decision Matrix */}
          <div className="h-10 px-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between z-10 shrink-0 select-none">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'timeline'
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🗺️ Spatial Digital Twin &amp; Timeline
              </button>
              <button
                onClick={() => setActiveTab('decision_matrix')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'decision_matrix'
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                📋 Train Dispatch Matrix
                {synthesizedSchedule.trainDecisions?.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/30 text-indigo-300">
                    {synthesizedSchedule.trainDecisions.length}
                  </span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
              <span>Station Capacity Guard: <strong className="text-emerald-400">ACTIVE</strong></span>
              <span>•</span>
              <span>Min-Heap Queue: <strong className="text-cyan-400">CHRONOLOGICAL</strong></span>
            </div>
          </div>

          {/* Tab 1: Spatial Canvas + Gantt Timeline */}
          {activeTab === 'timeline' ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
              <div className="flex-1 relative">
                <RailwayCanvas
                  rawNodes={nodes}
                  rawEdges={edges}
                  blockedEdgeIds={blockedEdgeIds}
                  activeRoute={activeRoute}
                  sourceId={sourceId}
                  targetId={targetId}
                  onToggleBlock={handleToggleBlock}
                />
              </div>

              {/* Mega-Block Timeline & Fleet Dispatch Gantt Chart */}
              <TimelineGantt
                megaBlocks={synthesizedSchedule.megaBlocks}
                rawRequests={rawMaintenance}
                trainDecisions={synthesizedSchedule.trainDecisions}
                timelineEvents={synthesizedSchedule.timelineEvents}
                kpis={synthesizedSchedule.kpis}
              />
            </div>
          ) : (
            /* Tab 2: Detailed Train Dispatch Decision Matrix */
            <div className="flex-1 p-6 overflow-y-auto bg-[#070b14]">
              <DecisionAuditPanel
                trainDecisions={synthesizedSchedule.trainDecisions}
                megaBlocks={synthesizedSchedule.megaBlocks}
                kpis={synthesizedSchedule.kpis}
              />
            </div>
          )}

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
