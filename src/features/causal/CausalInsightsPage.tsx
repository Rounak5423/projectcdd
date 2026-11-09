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

interface CausalInsightsPageProps {
  onNavigate?: (page: string) => void;
  onClose?: () => void;
}

export const CausalInsightsPage: React.FC<CausalInsightsPageProps> = ({
  onNavigate,
  onClose,
}) => {
  const { civilization, advanceTick, isPlaying } = useGameState();
  const worldId = civilization?.id || 'aurora-prime';
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
        fetch(`/api/v1/worlds/${worldId}/vitals?limit=60`),
        fetch(`/api/v1/worlds/${worldId}/causal-trace`),
      ]);

      if (vitalsRes.ok) {
        const vitalsData = await vitalsRes.json();
        if (vitalsData.data && vitalsData.data.length > 0) {
          setVitalsHistory(vitalsData.data);
          setLatestVitals(vitalsData.data[vitalsData.data.length - 1]);
        } else {
          // Auto-bootstrap vitals with 1 tick
          const stepRes = await fetch(`/api/v1/worlds/${worldId}/simulation/advance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticks: 1 }),
          });
          if (stepRes.ok) {
            const stepDelta = await stepRes.json();
            if (stepDelta.vitals) {
              setLatestVitals(stepDelta.vitals);
              setVitalsHistory([stepDelta.vitals]);
            }
          }
        }
      }

      if (traceRes.ok) {
        const traceData = await traceRes.json();
        setTraceGraph(traceData);
      }

      // Also query recent events
      const eventsRes = await fetch(`/api/v1/worlds/${worldId}/events`);
      if (eventsRes.ok) {
        const evts = await eventsRes.json();
        const causalEvts: CausalEvent[] = evts.slice(0, 30).map((e: any) => ({
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
      const res = await fetch(`/api/v1/worlds/${worldId}/simulation/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticks: 1 }),
      });
      if (res.ok) {
        const delta = await res.json();
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
      const cmdRes = await fetch(`/api/v1/worlds/${worldId}/commands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commands: [
            {
              command_id: cmdId,
              action: 'causal_intervention',
              payload: { intervention_id: policyType },
            },
          ],
        }),
      });

      const cmdData = await cmdRes.json();
      if (!cmdRes.ok) {
        throw new Error(cmdData.detail || 'Intervention rejected by server.');
      }

      const res = cmdData.results?.[0];
      if (res && res.status === 'rejected') {
        throw new Error(res.reason || 'Simulation rules rejected this intervention.');
      }

      // Step simulation by 1 tick so that downstream effects materialize in the causal graph
      const advRes = await fetch(`/api/v1/worlds/${worldId}/simulation/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticks: 1 }),
      });
      if (advRes.ok) {
        const delta = await advRes.json();
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
    <div className="flex-1 w-full h-full overflow-y-auto bg-slate-950 text-slate-100 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/80 uppercase tracking-wider">
              GENESIS Causal Telemetry
            </span>
            <span className="text-xs text-slate-400 font-mono">
              World: <span className="text-white font-bold">{worldId}</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5 mt-1">
            <Activity className="w-6 h-6 text-cyan-400" />
            CAUSAL SYSTEM INTELLIGENCE & VITAL SIGNS
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time causal graph observing coupling between resource shortages, hospital capacity, mortality, and civil rebellion.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundFx.playClick();
              fetchData();
            }}
            disabled={isLoading}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition cursor-pointer"
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
            {isAdvancing ? 'Stepping...' : 'Step Sim (+1 Tick)'}
          </button>

          {onClose && (
            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer"
              title="Close Causal Insights"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-800/80 pb-2">
        <button
          onClick={() => {
            soundFx.playClick();
            setActiveTab('vitals');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${
            activeTab === 'vitals'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          VITAL SIGNS & MORTALITY
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            setActiveTab('graph');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${
            activeTab === 'graph'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <GitCommit className="w-4 h-4" />
          CAUSE & EFFECT FLOW GRAPH
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            setActiveTab('events');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${
            activeTab === 'events'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Bell className="w-4 h-4" />
          CRISIS & INCIDENTS LOG ({events.length})
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            setActiveTab('policy');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${
            activeTab === 'policy'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Sliders className="w-4 h-4" />
          POLICY WHAT-IF INTERVENTIONS
        </button>
      </div>

      {/* Tab Panels */}
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
    </div>
  );
};
