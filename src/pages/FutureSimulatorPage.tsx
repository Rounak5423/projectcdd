import React, { useState } from 'react';
import {
  Microscope,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Play,
  RotateCcw,
  Shield,
  Coins,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  GitCompare,
  Sliders,
  X,
  Compass,
  Cpu,
  BarChart2
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { useGameState } from '../context/GameStateContext';
import { SimulationScenario } from '../types/game';
import { soundFx } from '../services/soundFx';

interface FutureSimulatorPageProps {
  onClose?: () => void;
}

export const FutureSimulatorPage: React.FC<FutureSimulatorPageProps> = ({ onClose }) => {
  const { scenarios, resources, runScenario, civilization } = useGameState();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(scenarios[0].id);
  const [compareScenarioId, setCompareScenarioId] = useState<string | null>(scenarios[1]?.id || null);
  const [horizonYears, setHorizonYears] = useState<number>(50);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [activeMode, setActiveMode] = useState<'presets' | 'custom' | 'compare'>('presets');

  // Custom scenario builder state
  const [customAiExposure, setCustomAiExposure] = useState<number>(75);
  const [customCarbonLevy, setCustomCarbonLevy] = useState<number>(45);
  const [customUbiAmount, setCustomUbiAmount] = useState<number>(850);
  const [customRoboticsQuota, setCustomRoboticsQuota] = useState<number>(60);

  const activeScenario =
    scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];
  const compareScenario = compareScenarioId
    ? scenarios.find((s) => s.id === compareScenarioId)
    : null;

  const handleExecuteSimulation = () => {
    soundFx.playClick();
    setIsSimulating(true);
    setTimeout(() => {
      soundFx.playSuccess();
      runScenario(activeScenario.id);
      setIsSimulating(false);
    }, 900);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#171D18]/95 backdrop-blur-md text-[#EAE3D2] overflow-hidden select-none font-sans">
      {/* Top Header */}
      <div className="flex-shrink-0 px-8 py-5 border-b border-[#C5A66A]/20 bg-gradient-to-r from-[#171D18] via-[#202820] to-[#171D18] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm border border-[#C5A66A]/40 bg-[#17231B] flex items-center justify-center text-[#C5A66A] shadow-inner">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl text-[#EAE3D2] tracking-wider font-semibold">
                FUTURE SIMULATOR & BRANCH DIVERGENCE
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-[#C5A66A]/40 text-[#C5A66A] bg-[#C5A66A]/10">
                Predictive Monte Carlo Engine
              </span>
            </div>
            <p className="text-xs text-[#A5AD9D] font-sans mt-0.5">
              Simulate alternative civilisational branch trajectories up to 100 years into the future.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#171D18] px-3 py-1.5 rounded border border-[#C5A66A]/30 text-xs font-mono">
            <Coins className="w-4 h-4 text-[#C5A66A]" />
            <span className="text-[#A5AD9D]">Treasury:</span>
            <span className="text-[#EAE3D2] font-bold">{resources.grc} CRC</span>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 border border-[#C5A66A]/30 rounded hover:bg-[#C5A66A]/10 text-[#A5AD9D] hover:text-[#EAE3D2] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Mode Switcher & Horizon Pills */}
      <div className="flex-shrink-0 px-8 py-3.5 bg-[#17231B]/70 border-b border-[#C5A66A]/15 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center p-1 bg-[#171D18] border border-[#C5A66A]/30 rounded">
          <button
            onClick={() => { soundFx.playClick(); setActiveMode('presets'); }}
            className={`px-4 py-1.5 rounded text-xs font-serif tracking-wider uppercase transition-all ${
              activeMode === 'presets'
                ? 'bg-[#C5A66A] text-[#171D18] font-bold shadow'
                : 'text-[#A5AD9D] hover:text-[#EAE3D2]'
            }`}
          >
            Scenario Templates ({scenarios.length})
          </button>
          <button
            onClick={() => { soundFx.playClick(); setActiveMode('custom'); }}
            className={`px-4 py-1.5 rounded text-xs font-serif tracking-wider uppercase transition-all ${
              activeMode === 'custom'
                ? 'bg-[#C5A66A] text-[#171D18] font-bold shadow'
                : 'text-[#A5AD9D] hover:text-[#EAE3D2]'
            }`}
          >
            Scenario Formulator
          </button>
          <button
            onClick={() => { soundFx.playClick(); setActiveMode('compare'); }}
            className={`px-4 py-1.5 rounded text-xs font-serif tracking-wider uppercase transition-all ${
              activeMode === 'compare'
                ? 'bg-[#C5A66A] text-[#171D18] font-bold shadow'
                : 'text-[#A5AD9D] hover:text-[#EAE3D2]'
            }`}
          >
            Branch Divergence Comparison
          </button>
        </div>

        {/* Horizon Years */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#A5AD9D] font-sans">Sim Horizon:</span>
          {[10, 25, 50, 100].map(y => (
            <button
              key={y}
              onClick={() => { soundFx.playClick(); setHorizonYears(y); }}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                horizonYears === y
                  ? 'bg-[#C5A66A] text-[#171D18] font-bold'
                  : 'bg-[#202820] text-[#A5AD9D] border border-[#C5A66A]/20 hover:text-[#EAE3D2]'
              }`}
            >
              +{y}y
            </button>
          ))}
        </div>
      </div>

      {/* Model Projections vs Empirical Reality Disclaimer */}
      <div className="flex-shrink-0 px-8 py-2.5 bg-[#171D18] border-b border-[#C5A66A]/10 flex items-center gap-2 text-xs text-[#D8CBAA]">
        <AlertTriangle className="w-4 h-4 text-[#C5A66A] flex-shrink-0" />
        <span>
          <strong>Epistemic Boundary Notice:</strong> These figures are neural Monte Carlo projections based on current civil conditions. Authoritative game state is verified exclusively by the backend engine.
        </span>
      </div>

      {/* Main Body */}
      <div className="flex-1 min-h-0 px-8 py-6 overflow-y-auto space-y-6">
        {activeMode === 'presets' && (
          <div className="space-y-6">
            {/* Template Scenarios Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {scenarios.map((scen) => {
                const isSelected = scen.id === activeScenario.id;

                return (
                  <div
                    key={scen.id}
                    onClick={() => { soundFx.playClick(); setSelectedScenarioId(scen.id); }}
                    className={`p-4 rounded flex flex-col justify-between cursor-pointer border transition-all ${
                      isSelected
                        ? 'bg-[#202820] border-[#C5A66A] shadow-md'
                        : 'bg-[#171D18] border-[#C5A66A]/20 hover:border-[#C5A66A]/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-mono font-bold text-[#C5A66A] uppercase">
                          {scen.codeName}
                        </span>
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                            scen.riskRating === 'Low'
                              ? 'bg-[#8FA879]/15 text-[#8FA879] border-[#8FA879]/30'
                              : scen.riskRating === 'High'
                              ? 'bg-[#C87569]/15 text-[#C87569] border-[#C87569]/30'
                              : 'bg-[#D6A75E]/15 text-[#D6A75E] border-[#D6A75E]/30'
                          }`}
                        >
                          {scen.riskRating}
                        </span>
                      </div>
                      <h3 className="font-serif text-sm font-bold text-[#EAE3D2] mt-1">{scen.title}</h3>
                      <p className="text-[11px] text-[#A5AD9D] mt-1 line-clamp-2 leading-relaxed">
                        {scen.tagline}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#C5A66A]/15 flex items-center justify-between text-xs font-mono">
                      <span className="text-[#A5AD9D]">{scen.horizonYears}y</span>
                      <span className="text-[#C5A66A] font-bold">
                        {scen.grcCost === 0 ? 'FREE' : `${scen.grcCost} CRC`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Projection Chart & Execution Deck */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
              <div className="p-5 rounded bg-[#202820]/90 border border-[#C5A66A]/25 shadow-md space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#C5A66A] tracking-wider font-bold">
                      MULTIVARIATE PROJECTION TRAJECTORY
                    </span>
                    <h3 className="font-serif text-base font-bold text-[#EAE3D2] mt-0.5">
                      {activeScenario.title} · {horizonYears}-Year Extrapolation
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-[#8FA879]">
                    Confidence Index: {activeScenario.confidenceScore}%
                  </span>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activeScenario.projections} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                      <XAxis dataKey="year" stroke="#A5AD9D" fontSize={10} tickLine={false} />
                      <YAxis stroke="#A5AD9D" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#171D18', borderColor: '#C5A66A', color: '#EAE3D2', fontSize: '11px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Line type="monotone" dataKey="gdp" name="GDP (Billion CRC)" stroke="#C5A66A" strokeWidth={2.5} />
                      <Line type="monotone" dataKey="happiness" name="Public Happiness (/100)" stroke="#8FA879" strokeWidth={2} />
                      <Line type="monotone" dataKey="environmentalIndex" name="Biosphere Index (/100)" stroke="#8FA879" strokeWidth={2} strokeDasharray="3 3" />
                      <Line type="monotone" dataKey="stability" name="Societal Stability (/100)" stroke="#D8CBAA" strokeWidth={2} strokeDasharray="4 4" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Execution Sidebar */}
              <div className="p-5 rounded bg-[#202820]/90 border border-[#C5A66A]/25 flex flex-col justify-between space-y-4 shadow-md">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#C5A66A] tracking-wider font-bold">
                    PREDICTIVE CIVIL IMPLICATIONS
                  </span>
                  <h4 className="font-serif text-sm font-bold text-[#EAE3D2] mt-0.5">Projected Structural Impacts</h4>

                  <div className="mt-3 space-y-2">
                    {activeScenario.keyOutcomes.map((outcome, i) => (
                      <div key={i} className="p-3 rounded bg-[#171D18] border border-[#C5A66A]/15 text-xs">
                        <p className="text-[#D8CBAA] leading-relaxed flex items-start gap-1.5">
                          <span className="text-[#C5A66A] font-bold">▶</span> {outcome}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#C5A66A]/15">
                  <button
                    disabled={resources.grc < activeScenario.grcCost || isSimulating}
                    onClick={handleExecuteSimulation}
                    className={`w-full py-3 rounded text-xs font-serif font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow ${
                      isSimulating
                        ? 'bg-[#171D18] text-[#C5A66A] border border-[#C5A66A] cursor-wait'
                        : resources.grc < activeScenario.grcCost
                        ? 'bg-[#171D18] text-[#A5AD9D]/40 border border-[#C5A66A]/20 cursor-not-allowed'
                        : 'bg-[#C5A66A] hover:bg-[#D8CBAA] text-[#171D18]'
                    }`}
                  >
                    {isSimulating ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin" />
                        <span>Extrapolating Quantum Branches...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>
                          Run Simulation ({activeScenario.grcCost === 0 ? 'Free' : `${activeScenario.grcCost} CRC`})
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODE 2: CUSTOM FORMULATOR */}
        {activeMode === 'custom' && (
          <div className="p-6 rounded bg-[#202820]/90 border border-[#C5A66A]/25 space-y-6">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#C5A66A] tracking-wider font-bold">
                EXPERIMENT BENCH
              </span>
              <h3 className="font-serif text-xl font-bold text-[#EAE3D2] mt-0.5">
                Custom Societal Parameter Formulator
              </h3>
              <p className="text-xs text-[#A5AD9D] mt-1">
                Configure systemic variables to generate a novel predictive branch for {civilization.name}.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="p-4 rounded bg-[#171D18] border border-[#C5A66A]/20 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#A5AD9D]">AI Automation Quota</span>
                  <span className="font-mono text-[#C5A66A] font-bold">{customAiExposure}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={customAiExposure}
                  onChange={(e) => setCustomAiExposure(Number(e.target.value))}
                  className="w-full accent-[#C5A66A]"
                />
              </div>

              <div className="p-4 rounded bg-[#171D18] border border-[#C5A66A]/20 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#A5AD9D]">Carbon Offset Surcharge</span>
                  <span className="font-mono text-[#C5A66A] font-bold">{customCarbonLevy} CRC / Ton</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={customCarbonLevy}
                  onChange={(e) => setCustomCarbonLevy(Number(e.target.value))}
                  className="w-full accent-[#C5A66A]"
                />
              </div>

              <div className="p-4 rounded bg-[#171D18] border border-[#C5A66A]/20 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#A5AD9D]">Universal Dividend (UBI)</span>
                  <span className="font-mono text-[#C5A66A] font-bold">{customUbiAmount} CRC / Month</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={2000}
                  step={50}
                  value={customUbiAmount}
                  onChange={(e) => setCustomUbiAmount(Number(e.target.value))}
                  className="w-full accent-[#C5A66A]"
                />
              </div>

              <div className="p-4 rounded bg-[#171D18] border border-[#C5A66A]/20 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#A5AD9D]">Robotics Industrial Displacement</span>
                  <span className="font-mono text-[#C5A66A] font-bold">{customRoboticsQuota}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={customRoboticsQuota}
                  onChange={(e) => setCustomRoboticsQuota(Number(e.target.value))}
                  className="w-full accent-[#C5A66A]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#C5A66A]/15 flex justify-end">
              <button
                onClick={handleExecuteSimulation}
                className="px-6 py-2.5 bg-[#C5A66A] hover:bg-[#D8CBAA] text-[#171D18] font-serif font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Simulate Custom Trajectory (100 CRC)</span>
              </button>
            </div>
          </div>
        )}

        {/* MODE 3: BRANCH DIVERGENCE COMPARISON */}
        {activeMode === 'compare' && (
          <div className="p-6 rounded bg-[#202820]/90 border border-[#C5A66A]/25 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#C5A66A]/20">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#C5A66A] tracking-wider font-bold">
                  BRANCH COMPARISON
                </span>
                <h3 className="font-serif text-lg font-bold text-[#EAE3D2] mt-0.5">
                  Side-by-Side Trajectory Divergence
                </h3>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-[#C5A66A]">Branch A: {activeScenario.title}</span>
                <span className="text-[#8FA879]">Branch B: {compareScenario?.title || 'None Selected'}</span>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                  <XAxis dataKey="year" stroke="#A5AD9D" fontSize={10} tickLine={false} />
                  <YAxis stroke="#A5AD9D" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#171D18', borderColor: '#C5A66A', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Line data={activeScenario.projections} type="monotone" dataKey="gdp" name={`${activeScenario.codeName} - GDP`} stroke="#C5A66A" strokeWidth={2.5} />
                  {compareScenario && (
                    <Line data={compareScenario.projections} type="monotone" dataKey="gdp" name={`${compareScenario.codeName} - GDP`} stroke="#8FA879" strokeWidth={2.5} />
                  )}
                  <Line data={activeScenario.projections} type="monotone" dataKey="happiness" name={`${activeScenario.codeName} - Happiness`} stroke="#D6A75E" strokeWidth={1.5} strokeDasharray="3 3" />
                  {compareScenario && (
                    <Line data={compareScenario.projections} type="monotone" dataKey="happiness" name={`${compareScenario.codeName} - Happiness`} stroke="#C87569" strokeWidth={1.5} strokeDasharray="3 3" />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FutureSimulatorPage;
