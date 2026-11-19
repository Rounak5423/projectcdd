import React, { useState, useEffect } from 'react';
import {
  Activity,
  HeartPulse,
  RefreshCw,
  Zap,
  ShieldAlert,
  X,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useGameState } from '../context/GameStateContext';
import { VitalSignsPanel } from '../features/causal/VitalSignsPanel';
import { CausalVitalsSnapshot, CausalTraceGraph } from '../features/causal/types';
import { civilizationApi } from '../services/civilizationApi';
import { soundFx } from '../services/soundFx';

interface CausalInsightsPageProps {
  onClose?: () => void;
}

export default function CausalInsightsPage({ onClose }: CausalInsightsPageProps) {
  const { civilization, triggerToast } = useGameState();
  const worldId = civilization?.id || 'aurora-prime';

  const [vitalsHistory, setVitalsHistory] = useState<CausalVitalsSnapshot[]>([]);
  const [latestVitals, setLatestVitals] = useState<CausalVitalsSnapshot | null>(null);
  const [causalTrace, setCausalTrace] = useState<CausalTraceGraph | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'vitals' | 'trace' | 'interventions'>('vitals');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const fetchCausalData = async () => {
    setIsLoading(true);
    try {
      const [vitalsRes, traceRes] = await Promise.all([
        civilizationApi.getCausalVitals(worldId, 30),
        civilizationApi.getCausalTrace(worldId),
      ]);

      if (vitalsRes.success && vitalsRes.data) {
        const dataArr: CausalVitalsSnapshot[] = Array.isArray(vitalsRes.data)
          ? vitalsRes.data
          : vitalsRes.data.data || [];
        setVitalsHistory(dataArr);
        if (dataArr.length > 0) {
          setLatestVitals(dataArr[dataArr.length - 1]);
        }
      }

      if (traceRes.success && traceRes.data) {
        setCausalTrace(traceRes.data);
      }
    } catch {
      // Handled silently
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCausalData();
    const interval = setInterval(fetchCausalData, 10000);
    return () => clearInterval(interval);
  }, [worldId]);

  const handleSimulateShock = async (shockType: string) => {
    setIsSimulating(true);
    soundFx.playHammerBuild();
    try {
      const res = await civilizationApi.simulateCausalShock(worldId, {
        intervention_type: shockType,
        ticks: 5,
      });
      if (res.success) {
        triggerToast({
          type: 'info',
          title: '⚡ CAUSAL INTERVENTION APPLIED',
          subtitle: `Injected '${shockType}' into system dynamics. Monitoring feedback loops...`,
          icon: '🔬',
        });
        await fetchCausalData();
      }
    } catch {
      triggerToast({
        type: 'info',
        title: '⚠️ Intervention Notice',
        subtitle: 'Intervention dispatch encountered an exception or simulation paused.',
        icon: '⚠️',
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#0F1410] text-[#EAE3D2] overflow-hidden select-none">
      {/* Top Header Bar */}
      <div className="h-14 px-6 border-b border-[#243324] flex items-center justify-between shrink-0 bg-[#141B15]/90 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#1E2E20] border border-[#2B402E] text-[#8FA879]">
            <HeartPulse size={20} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold font-cinzel tracking-wider text-[#EAE3D2] flex items-center gap-2">
              CAUSAL SYSTEM DYNAMICS & VITAL SIGNS
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#8FA879]/20 text-[#8FA879] border border-[#8FA879]/30">
                10-STAGE DAG
              </span>
            </h1>
            <p className="text-xs text-[#8A9684] font-mono">
              World: {civilization.name} · Closed-Loop Biological Vitality & Civil Unrest
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Tab Navigation */}
          <div className="flex items-center bg-[#18231A] p-0.5 rounded-lg border border-[#2B3F2E] text-xs font-mono">
            <button
              onClick={() => setActiveTab('vitals')}
              className={`px-3 py-1 rounded transition-colors ${
                activeTab === 'vitals'
                  ? 'bg-[#2E4230] text-[#EAE3D2] font-bold shadow'
                  : 'text-[#8A9684] hover:text-[#EAE3D2]'
              }`}
            >
              Vital Signs Charts
            </button>
            <button
              onClick={() => setActiveTab('trace')}
              className={`px-3 py-1 rounded transition-colors ${
                activeTab === 'trace'
                  ? 'bg-[#2E4230] text-[#EAE3D2] font-bold shadow'
                  : 'text-[#8A9684] hover:text-[#EAE3D2]'
              }`}
            >
              Causal DAG Trace
            </button>
            <button
              onClick={() => setActiveTab('interventions')}
              className={`px-3 py-1 rounded transition-colors ${
                activeTab === 'interventions'
                  ? 'bg-[#2E4230] text-[#EAE3D2] font-bold shadow'
                  : 'text-[#8A9684] hover:text-[#EAE3D2]'
              }`}
            >
              Causal Interventions
            </button>
          </div>

          <button
            onClick={fetchCausalData}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-[#18231A] border border-[#2B3F2E] hover:border-[#8FA879] text-[#8FA879] transition-all"
            title="Refresh Live Telemetry"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#18231A] border border-[#2B3F2E] hover:border-[#C87569] text-[#A5AD9D] hover:text-[#C87569] transition-all"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeTab === 'vitals' && (
          <div className="space-y-6">
            <VitalSignsPanel vitalsHistory={vitalsHistory} latestVitals={latestVitals} />
          </div>
        )}

        {activeTab === 'trace' && (
          <div className="space-y-6">
            <div className="bg-[#141B15] border border-[#243324] rounded-xl p-5 shadow-lg">
              <h2 className="text-sm font-bold font-cinzel text-[#C5A66A] mb-2 flex items-center gap-2">
                <Activity size={16} /> CAUSAL DEPENDENCY FACTORS & EQUILIBRIUM
              </h2>
              <p className="text-xs text-[#8A9684] mb-4">
                {causalTrace?.summary || 'Empirical causal relationships governing mortality, health deficits, and civil demonstrations.'}
              </p>

              {causalTrace?.nodes && causalTrace.nodes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {causalTrace.nodes.map((node) => (
                    <div
                      key={node.id}
                      className="p-3.5 rounded-lg bg-[#18231A] border border-[#283B2A] hover:border-[#8FA879]/50 transition-all"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-[#EAE3D2]">{node.label}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            node.status === 'critical'
                              ? 'bg-rose-900/40 text-rose-300 border border-rose-700/50'
                              : node.status === 'warning'
                              ? 'bg-amber-900/40 text-amber-300 border border-amber-700/50'
                              : 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50'
                          }`}
                        >
                          {node.display_value} {node.unit}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8A9684] line-clamp-2">{node.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-[#8A9684]">
                  <Activity size={24} className="mx-auto mb-2 text-[#8FA879] animate-pulse" />
                  <p className="text-xs font-mono">Simulating causal graph nodes from world entities...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'interventions' && (
          <div className="space-y-6">
            <div className="bg-[#141B15] border border-[#243324] rounded-xl p-6 shadow-lg">
              <h2 className="text-sm font-bold font-cinzel text-[#C5A66A] mb-2 flex items-center gap-2">
                <Sparkles size={16} /> SYSTEM DYNAMICS LAB: CONTROLLED CAUSAL SHOCKS
              </h2>
              <p className="text-xs text-[#8A9684] mb-6">
                Inject deterministic micro-interventions into the 10-stage causal loop to measure downstream societal resistance, hospital spillover, and mortality kinetics.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  disabled={isSimulating}
                  onClick={() => handleSimulateShock('emergency_food_relief')}
                  className="p-4 rounded-xl bg-[#18231A] border border-[#283B2A] hover:border-[#8FA879] text-left transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-[#8FA879] group-hover:text-[#A7C28F]">
                      🥖 Emergency Ration Deployment
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#8FA879]/20 text-[#8FA879]">
                      Mitigating
                    </span>
                  </div>
                  <p className="text-xs text-[#8A9684]">
                    Floods food reserves to eliminate starvation deaths and reduce citizen grievances by up to 25%.
                  </p>
                </button>

                <button
                  disabled={isSimulating}
                  onClick={() => handleSimulateShock('expand_hospital')}
                  className="p-4 rounded-xl bg-[#18231A] border border-[#283B2A] hover:border-[#8FA879] text-left transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-[#8FA879] group-hover:text-[#A7C28F]">
                      🏥 Expand Emergency Bed Surge Capacity
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#8FA879]/20 text-[#8FA879]">
                      Mitigating
                    </span>
                  </div>
                  <p className="text-xs text-[#8A9684]">
                    Temporarily adds +50 municipal trauma beds to relieve overflow patient mortality and suppress unrest.
                  </p>
                </button>

                <button
                  disabled={isSimulating}
                  onClick={() => handleSimulateShock('cut_food')}
                  className="p-4 rounded-xl bg-[#231818] border border-[#3B2828] hover:border-rose-500 text-left transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-rose-400 group-hover:text-rose-300">
                      ⚡ Ration Deficit Stress Test
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-900/30 text-rose-300">
                      Aggravating
                    </span>
                  </div>
                  <p className="text-xs text-[#8A9684]">
                    Induces sudden food shortage to measure time-to-protest propagation and starvation mortality rates.
                  </p>
                </button>

                <button
                  disabled={isSimulating}
                  onClick={() => handleSimulateShock('cut_hospital_capacity')}
                  className="p-4 rounded-xl bg-[#231818] border border-[#3B2828] hover:border-rose-500 text-left transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-rose-400 group-hover:text-rose-300">
                      ⚠️ Medical Facility Brownout Shock
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-900/30 text-rose-300">
                      Aggravating
                    </span>
                  </div>
                  <p className="text-xs text-[#8A9684]">
                    Triggers a partial clinical shutdown to observe casualty overflow and civic grievance spikes.
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
