import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  HeartPulse,
  GitCommit,
  Bell,
  Sliders,
  RefreshCw,
  Play,
  X,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { useGameState } from '../../context/GameStateContext';
import { soundFx } from '../../services/soundFx';
import { VitalSignsPanel } from './VitalSignsPanel';
import { CauseAndEffectView } from './CauseAndEffectView';
import { CausalEventFeed } from './CausalEventFeed';
import { PolicyWhatIfShortcuts } from './PolicyWhatIfShortcuts';
import { CausalVitalsSnapshot, CausalTraceGraph, CausalEvent } from './types';
import { apiClient } from '../../services/civilizationApi';

interface CausalInsightsPageProps {
  onNavigate?: (page: string) => void;
  onClose?: () => void;
}

export const CausalInsightsPage: React.FC<CausalInsightsPageProps> = ({
  onNavigate,
  onClose,
}) => {
  const { civilization, advanceTick, isPlaying } = useGameState();
  // Fall back to persistent backend world 'aurora-prime' if using the default client id
  const worldId =
    civilization?.id && civilization.id !== 'civ-new-frontier'
      ? civilization.id
      : 'aurora-prime';
  const year = civilization?.currentYear || 2026;
  const day = civilization?.currentDay || 1;

  const [activeTab, setActiveTab] = useState<'vitals' | 'graph' | 'events' | 'policy'>('vitals');
  const [vitalsHistory, setVitalsHistory] = useState<CausalVitalsSnapshot[]>([]);
  const [latestVitals, setLatestVitals] = useState<CausalVitalsSnapshot | null>(null);
  const [traceGraph, setTraceGraph] = useState<CausalTraceGraph | null>(null);
  const [events, setEvents] = useState<CausalEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdvancing, setIsAdvancing] = useState<boolean>(false);
  const [isExecutingPolicy, setIsExecutingPolicy] = useState<boolean>(false);

  const tick = latestVitals?.tick || 1;

  // Fetch live vitals and causal trace from backend
  const fetchData = useCallback(async () => {
    try {
      const [vitalsRes, traceRes] = await Promise.all([
        apiClient.get(`/worlds/${worldId}/vitals?limit=60`).catch(() => null),
        apiClient.get(`/worlds/${worldId}/causal-trace`).catch(() => null),
      ]);

      if (vitalsRes && vitalsRes.data) {
        const vitalsData = vitalsRes.data;
        if (vitalsData.data && vitalsData.data.length > 0) {
          setVitalsHistory(vitalsData.data);
          setLatestVitals(vitalsData.data[vitalsData.data.length - 1]);
        } else {
          // Auto-bootstrap vitals with 1 tick
          try {
            const stepRes = await apiClient.post(`/worlds/${worldId}/simulation/advance`, { ticks: 1 });
            if (stepRes.data && stepRes.data.vitals) {
              setLatestVitals(stepRes.data.vitals);
              setVitalsHistory([stepRes.data.vitals]);
            }
          } catch {}
        }
      }

      if (traceRes && traceRes.data) {
        setTraceGraph(traceRes.data);
      }

      // Also query recent events
      try {
        const eventsRes = await apiClient.get(`/worlds/${worldId}/events`);
        if (eventsRes && Array.isArray(eventsRes.data)) {
          const causalEvts: CausalEvent[] = eventsRes.data.slice(0, 30).map((e: any) => ({
            id: e.id,
            world_id: e.world_id,
            year: e.year,
            day: e.day,
            tick: e.tick || tick,
            category: e.category,
            title: e.title,
            severity: (['critical', 'emergency', 'warning'].includes(e.category) || e.title.includes('Crisis') || e.title.includes('Protest'))
              ? (e.title.includes('Unrest') ? 'critical' : e.title.includes('Hospital') ? 'emergency' : 'warning')
              : 'info',
            description: e.description,
            metadata: e.metadata || {},
          }));
          setEvents(causalEvts);
        }
      } catch {}
    } catch (err) {
      console.error('Error fetching causal telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  }, [worldId, tick]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Periodic polling when simulation runs
  useEffect(() => {
    const timer = setInterval(() => {
      fetchData();
    }, 4000);
    return () => clearInterval(timer);
  }, [fetchData]);

  const handleManualAdvance = async () => {
    soundFx.playClick();
    setIsAdvancing(true);
    try {
      const res = await apiClient.post(`/worlds/${worldId}/simulation/advance`, { ticks: 1 });
      if (res.data) {
        const delta = res.data;
        if (delta.vitals) {
          setLatestVitals(delta.vitals);
          setVitalsHistory((prev) => [...prev, delta.vitals].slice(-60));
        }
        if (delta.trace_graph) {
          setTraceGraph(delta.trace_graph);
        }
      }
      await fetchData();
    } catch (err) {
      console.error('Manual advance error:', err);
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleExecutePolicy = async (policyType: string) => {
    setIsExecutingPolicy(true);
    try {
      const cmdId = `cmd_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const cmdRes = await apiClient.post(`/worlds/${worldId}/commands`, {
        commands: [
          {
            command_id: cmdId,
            action: 'causal_intervention',
            payload: { intervention_id: policyType },
          },
        ],
      });

      const cmdData = cmdRes.data;
      const res = cmdData.results?.[0];
      if (res && res.status === 'rejected') {
        throw new Error(res.reason || 'Simulation rules rejected this intervention.');
      }

      // Step simulation by 1 tick so that downstream effects materialize in the causal graph
      const advRes = await apiClient.post(`/worlds/${worldId}/simulation/advance`, { ticks: 1 });
      if (advRes.data) {
        const delta = advRes.data;
        if (delta.vitals) {
          setLatestVitals(delta.vitals);
          setVitalsHistory((prev) => [...prev, delta.vitals].slice(-60));
        }
        if (delta.trace_graph) {
          setTraceGraph(delta.trace_graph);
        }
      }
      await fetchData();
    } catch (err: any) {
      console.error('Policy execution error:', err);
      throw err;
    } finally {
      setIsExecutingPolicy(false);
    }
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Header Bar */}
      <header className="shrink-0 px-6 py-4 bg-slate-900/80 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/80 uppercase tracking-wider font-semibold">
              GENESIS Causal Telemetry
            </span>
            <span className="text-xs text-slate-400 font-mono">
              World: <span className="text-white font-bold">{worldId}</span>
            </span>
            <span className="text-xs text-slate-500 font-mono">
              · Year {year} · Day {day} · Tick {tick}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5 mt-1">
            <Activity className="w-6 h-6 text-cyan-400" />
            CAUSAL SYSTEM INTELLIGENCE & VITAL SIGNS
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              soundFx.playClick();
              fetchData();
            }}
            disabled={isLoading}
            className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-white hover:border-slate-500 transition cursor-pointer"
            title="Refresh Causal Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <button
            onClick={handleManualAdvance}
            disabled={isAdvancing}
            className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs tracking-wider uppercase flex items-center gap-2 shadow-lg shadow-cyan-950/50 transition cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isAdvancing ? 'Stepping...' : 'Step Sim (+1 Tick)'}</span>
          </button>

          {onClose && (
            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-500 transition cursor-pointer"
              title="Close Causal Insights"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Two-Column Layout with Dedicated Left Navigation Sidebar */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Dedicated Causal Insights Sidebar */}
        <aside className="w-64 shrink-0 bg-slate-900/60 border-r border-slate-800/80 flex flex-col justify-between p-4 overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400 font-bold block mb-2 px-2">
                TELEMETRY MODULES
              </span>
              <nav className="space-y-1">
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setActiveTab('vitals');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    activeTab === 'vitals'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-950/30 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <HeartPulse className={`w-4 h-4 ${activeTab === 'vitals' ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
                    <span>Vital Signs & Mortality</span>
                  </div>
                  {latestVitals && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                </button>

                <button
                  onClick={() => {
                    soundFx.playClick();
                    setActiveTab('graph');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    activeTab === 'graph'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-950/30 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <GitCommit className={`w-4 h-4 ${activeTab === 'graph' ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>Cause & Effect Graph</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    soundFx.playClick();
                    setActiveTab('events');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    activeTab === 'events'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-950/30 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Bell className={`w-4 h-4 ${activeTab === 'events' ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>Crisis & Incidents</span>
                  </div>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {events.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    soundFx.playClick();
                    setActiveTab('policy');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    activeTab === 'policy'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-950/30 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sliders className={`w-4 h-4 ${activeTab === 'policy' ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>Policy What-If</span>
                  </div>
                  <Sparkles size={13} className="text-cyan-400" />
                </button>
              </nav>
            </div>

            {/* Causal Diagnostics Card in Sidebar */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 text-[11px] font-mono space-y-2">
              <span className="text-[10px] text-cyan-400 font-bold tracking-wider uppercase block">
                ENGINE COUPLING MATRIX
              </span>
              <div className="flex justify-between text-slate-400">
                <span>Active World:</span>
                <span className="text-white font-semibold truncate max-w-[100px]">{worldId}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Simulation Tick:</span>
                <span className="text-cyan-300 font-semibold">{tick}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Vitals History:</span>
                <span className="text-emerald-400 font-semibold">{vitalsHistory.length} frames</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Causal Engine:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  Coupled
                </span>
              </div>
            </div>
          </div>

          {/* Quick Step Trigger */}
          <div className="pt-4 border-t border-slate-800/80">
            <button
              onClick={handleManualAdvance}
              disabled={isAdvancing}
              className="w-full py-2 px-3 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/50 border border-cyan-800/60 text-cyan-300 hover:text-cyan-100 font-mono text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Step Simulation</span>
            </button>
          </div>
        </aside>

        {/* Main Panel Viewport */}
        <main className="flex-1 min-w-0 overflow-y-auto p-6 custom-scrollbar">
          {activeTab === 'vitals' && (
            <VitalSignsPanel vitalsHistory={vitalsHistory} latestVitals={latestVitals} />
          )}

          {activeTab === 'graph' && (
            <CauseAndEffectView traceGraph={traceGraph} />
          )}

          {activeTab === 'events' && (
            <CausalEventFeed events={events} />
          )}

          {activeTab === 'policy' && (
            <PolicyWhatIfShortcuts
              onExecutePolicy={handleExecutePolicy}
              isExecuting={isExecutingPolicy}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default CausalInsightsPage;
