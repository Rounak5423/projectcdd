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
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useGameState } from '../context/GameStateContext';
import { SimulationScenario } from '../types/game';

export default function FutureSimulatorPage() {
  const { scenarios, resources, runScenario } = useGameState();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(scenarios[0].id);
  const [compareScenarioId, setCompareScenarioId] = useState<string | null>(null);
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
    setIsSimulating(true);
    setTimeout(() => {
      runScenario(activeScenario.id);
      setIsSimulating(false);
    }, 900);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 overflow-y-auto custom-scrollbar text-[#e8e9e3] max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#39443a] gap-4">
        <div>
          <span className="eyebrow text-[#c6a76a]">QUANTUM PREDICTIVE ENGINE</span>
          <h1 className="text-2xl font-bold text-[#f3f5ef] mt-0.5">Future Simulator</h1>
          <p className="text-xs text-[#9da99b] mt-1">
            Simulate alternative societal branch trajectories, calibrate policy combinations, and spend GRC to extrapolate horizons up to 100 years.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#182119] p-3 rounded-xl border border-[#2e3c2f] text-xs font-mono">
          <div>
            <span className="text-[#9da99b] block text-[10px]">RESEARCH CREDITS (GRC)</span>
            <span className="text-sm font-bold text-[#c6a76a]">{resources.grc} Available</span>
          </div>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center bg-[#151c16] p-1 rounded-xl border border-[#2d3a2e] w-fit">
        <button
          onClick={() => setActiveMode('presets')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeMode === 'presets'
              ? 'bg-[#3b4c37] text-[#dce9ca] border border-[#5d7756] shadow-sm'
              : 'text-[#9da99b] hover:text-white'
          }`}
        >
          Preset Scenarios ({scenarios.length})
        </button>
        <button
          onClick={() => setActiveMode('custom')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeMode === 'custom'
              ? 'bg-[#3b4c37] text-[#dce9ca] border border-[#5d7756] shadow-sm'
              : 'text-[#9da99b] hover:text-white'
          }`}
        >
          Custom Scenario Formulator
        </button>
        <button
          onClick={() => setActiveMode('compare')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeMode === 'compare'
              ? 'bg-[#3b4c37] text-[#dce9ca] border border-[#5d7756] shadow-sm'
              : 'text-[#9da99b] hover:text-white'
          }`}
        >
          Side-by-Side Comparison
        </button>
      </div>

      {/* Algorithmic Telemetry Disclaimer */}
      <div className="p-3.5 rounded-xl bg-[#222115] border border-[#524926] flex items-center gap-3 text-xs text-[#d8ca99]">
        <AlertTriangle size={16} className="text-[#c6a76a] shrink-0" />
        <span>
          <strong>Algorithmic Telemetry Disclaimer:</strong> Projections represent deterministic neural model extrapolations. Actual historical outcomes may diverge based on unforeseen planetary disasters, technological singularities, or diplomatic trade blockades.
        </span>
      </div>

      {/* MODE 1: PRESET SCENARIO CARDS */}
      {activeMode === 'presets' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {scenarios.map((scen) => {
              const isSelected = scen.id === activeScenario.id;

              return (
                <div
                  key={scen.id}
                  onClick={() => setSelectedScenarioId(scen.id)}
                  className={`panel p-3.5 flex flex-col justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#212c22] border-[#a6bd82] ring-1 ring-[#a6bd82] shadow-xl'
                      : 'bg-[#182119] border-[#313f32] hover:border-[#4d614e]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold text-[#c6a76a] uppercase">
                        {scen.codeName}
                      </span>
                      <span
                        className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          scen.riskRating === 'Low'
                            ? 'bg-[#233526] text-[#a6bd82]'
                            : scen.riskRating === 'High'
                            ? 'bg-[#3b2724] text-[#d47e69]'
                            : 'bg-[#36301d] text-[#c6a76a]'
                        }`}
                      >
                        {scen.riskRating}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-[#f3f5ef] mt-1.5">{scen.title}</h3>
                    <p className="text-[10px] text-[#9da99b] mt-1 line-clamp-2 leading-relaxed">
                      {scen.tagline}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#29342a] flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#9da99b]">{scen.horizonYears}y</span>
                    <span className="text-[#c6a76a] font-bold">
                      {scen.grcCost === 0 ? 'FREE' : `${scen.grcCost} GRC`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Main Visualizer: Multi-line Projection Chart & Execution Box */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
            <div className="panel p-5 bg-[#182119] border-[#313f32] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="eyebrow text-[#c6a76a]">QUANTUM MODEL EXTRAPOLATION</span>
                  <h3 className="text-base font-bold text-[#f3f5ef] mt-0.5">
                    {activeScenario.title} · 50-Year Trajectory
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#a6bd82]">
                  Confidence: {activeScenario.confidenceScore}%
                </span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activeScenario.projections} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <XAxis dataKey="year" stroke="#718070" tick={{ fill: '#9da99b', fontSize: 10 }} />
                    <YAxis stroke="#718070" tick={{ fill: '#9da99b', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#171d18', borderColor: '#39443a', borderRadius: '8px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Line type="monotone" dataKey="gdp" name="GDP (Billion Credits)" stroke="#c6a76a" strokeWidth={2.5} />
                    <Line type="monotone" dataKey="happiness" name="Public Happiness (/100)" stroke="#a6bd82" strokeWidth={2} />
                    <Line type="monotone" dataKey="environmentalIndex" name="Biosphere Purity (/100)" stroke="#82bd8e" strokeWidth={2} />
                    <Line type="monotone" dataKey="stability" name="Societal Stability (/100)" stroke="#82a6bd" strokeWidth={2} strokeDasharray="4 4" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Execution Sidebar */}
            <div className="panel p-5 bg-[#182119] border-[#313f32] flex flex-col justify-between space-y-4">
              <div>
                <span className="eyebrow text-[#c6a76a]">STRATEGIC CONSEQUENCES</span>
                <h4 className="text-sm font-bold text-[#f3f5ef] mt-0.5">Projected Structural Impacts</h4>

                <div className="mt-3 space-y-2">
                  {activeScenario.keyOutcomes.map((outcome, i) => (
                    <div key={i} className="p-2.5 rounded bg-[#131914] border border-[#273328] text-xs">
                      <p className="text-[#dce9ca] leading-relaxed flex items-start gap-1.5">
                        <span className="text-[#c6a76a] font-bold">▶</span> {outcome}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#29342a]">
                <button
                  disabled={resources.grc < activeScenario.grcCost || isSimulating}
                  onClick={handleExecuteSimulation}
                  className={`w-full py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xl ${
                    isSimulating
                      ? 'bg-[#3b351f] text-[#c6a76a] border border-[#6b5a2e] cursor-wait'
                      : resources.grc < activeScenario.grcCost
                      ? 'bg-[#222822] text-[#697268] border border-[#2e372e] cursor-not-allowed'
                      : 'bg-[#405439] hover:bg-[#526b48] text-[#dce9ca] border border-[#6b8563]'
                  }`}
                >
                  {isSimulating ? (
                    <>
                      <Sparkles size={14} className="animate-spin" />
                      <span>Processing Quantum Matrices...</span>
                    </>
                  ) : (
                    <>
                      <Play size={14} className="fill-current" />
                      <span>
                        Execute Simulation ({activeScenario.grcCost === 0 ? 'Free' : `${activeScenario.grcCost} GRC`})
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: CUSTOM SCENARIO FORMULATOR */}
      {activeMode === 'custom' && (
        <div className="panel p-6 bg-[#182119] border-[#313f32] space-y-6">
          <div>
            <span className="eyebrow text-[#c6a76a]">CUSTOM MODEL SYNTHESIZER</span>
            <h3 className="text-lg font-bold text-[#f3f5ef] mt-0.5">
              Configure Policy Parameter Combination
            </h3>
            <p className="text-xs text-[#9da99b] mt-1 leading-relaxed">
              Design a unique societal branch by tuning autonomous robotics quotas, carbon tariffs, and cognitive coprocessor allocations simultaneously.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="p-4 rounded-xl bg-[#141a15] border border-[#2a362b] space-y-3">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-[#f0f3eb]">Civilian AI Coprocessor Mandate</span>
                <span className="font-mono text-[#a6bd82] font-bold">{customAiExposure}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={customAiExposure}
                onChange={(e) => setCustomAiExposure(Number(e.target.value))}
                className="w-full accent-[#a6bd82]"
              />
              <span className="text-[10px] text-[#9da99b] block">
                Affects research output (+28%) and independent problem-solving capacity (-18%).
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#141a15] border border-[#2a362b] space-y-3">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-[#f0f3eb]">Circular Carbon Tariff Surcharge</span>
                <span className="font-mono text-[#82bd8e] font-bold">{customCarbonLevy}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                value={customCarbonLevy}
                onChange={(e) => setCustomCarbonLevy(Number(e.target.value))}
                className="w-full accent-[#82bd8e]"
              />
              <span className="text-[10px] text-[#9da99b] block">
                Preserves biosphere purity (+16 pts) while reducing short-term foundry throughput.
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#141a15] border border-[#2a362b] space-y-3">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-[#f0f3eb]">Universal Basic Dividend Stipend</span>
                <span className="font-mono text-[#c6a76a] font-bold">{customUbiAmount} Credits</span>
              </div>
              <input
                type="range"
                min="200"
                max="1500"
                step="50"
                value={customUbiAmount}
                onChange={(e) => setCustomUbiAmount(Number(e.target.value))}
                className="w-full accent-[#c6a76a]"
              />
              <span className="text-[10px] text-[#9da99b] block">
                Directly reduces Gini inequality index and boosts public life satisfaction.
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#141a15] border border-[#2a362b] space-y-3">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-[#f0f3eb]">Industrial Robot Automation Quota</span>
                <span className="font-mono text-[#82a6bd] font-bold">{customRoboticsQuota}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="95"
                value={customRoboticsQuota}
                onChange={(e) => setCustomRoboticsQuota(Number(e.target.value))}
                className="w-full accent-[#82a6bd]"
              />
              <span className="text-[10px] text-[#9da99b] block">
                Maximizes materials extraction and manufacturing yield.
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-[#29342a] flex items-center justify-between">
            <span className="text-xs font-mono text-[#c6a76a]">Custom Run Cost: 100 GRC</span>
            <button
              onClick={() => {
                runScenario(scenarios[0].id);
                setActiveMode('presets');
              }}
              className="px-5 py-2.5 rounded-lg text-xs font-bold bg-[#405439] hover:bg-[#526b48] text-[#dce9ca] border border-[#6b8563] shadow-lg flex items-center gap-2"
            >
              <Play size={14} className="fill-current" />
              <span>Synthesize Custom Horizon</span>
            </button>
          </div>
        </div>
      )}

      {/* MODE 3: SIDE-BY-SIDE COMPARISON */}
      {activeMode === 'compare' && (
        <div className="panel p-6 bg-[#182119] border-[#313f32] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#29342a]">
            <div>
              <span className="eyebrow text-[#c6a76a]">DIFFERENTIAL AUDIT</span>
              <h3 className="text-lg font-bold text-[#f3f5ef] mt-0.5">
                Side-by-Side Scenario Comparison
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={compareScenarioId || scenarios[1].id}
                onChange={(e) => setCompareScenarioId(e.target.value)}
                className="bg-[#141914] border border-[#2e3b2f] rounded-lg px-3 py-1.5 text-xs text-[#f3f5ef] outline-none"
              >
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id}>
                    Compare with: {s.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Comparison Diff Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141a15] text-[#8e9c8c] font-mono text-[10px] uppercase border-b border-[#263127]">
                <tr>
                  <th className="py-3 px-4">Evaluation Criterion (Year 50)</th>
                  <th className="py-3 px-4 text-[#c6a76a] font-bold">{activeScenario.title}</th>
                  <th className="py-3 px-4 text-[#82a6bd] font-bold">
                    {compareScenario?.title || scenarios[1].title}
                  </th>
                  <th className="py-3 px-4 text-right">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#212b22]">
                {[
                  {
                    metric: 'Projected Population',
                    valA: `${activeScenario.projections[4].population}M`,
                    valB: `${(compareScenario || scenarios[1]).projections[4].population}M`,
                    delta: `${(
                      ((activeScenario.projections[4].population -
                        (compareScenario || scenarios[1]).projections[4].population) /
                        (compareScenario || scenarios[1]).projections[4].population) *
                      100
                    ).toFixed(1)}%`,
                  },
                  {
                    metric: 'Gross Civil Output (GDP)',
                    valA: `${activeScenario.projections[4].gdp}B Cr`,
                    valB: `${(compareScenario || scenarios[1]).projections[4].gdp}B Cr`,
                    delta: `${(
                      ((activeScenario.projections[4].gdp -
                        (compareScenario || scenarios[1]).projections[4].gdp) /
                        (compareScenario || scenarios[1]).projections[4].gdp) *
                      100
                    ).toFixed(1)}%`,
                  },
                  {
                    metric: 'Public Happiness',
                    valA: `${activeScenario.projections[4].happiness}/100`,
                    valB: `${(compareScenario || scenarios[1]).projections[4].happiness}/100`,
                    delta: `${activeScenario.projections[4].happiness - (compareScenario || scenarios[1]).projections[4].happiness} pts`,
                  },
                  {
                    metric: 'Societal Stability',
                    valA: `${activeScenario.projections[4].stability}/100`,
                    valB: `${(compareScenario || scenarios[1]).projections[4].stability}/100`,
                    delta: `${activeScenario.projections[4].stability - (compareScenario || scenarios[1]).projections[4].stability} pts`,
                  },
                  {
                    metric: 'Biosphere Sustainability',
                    valA: `${activeScenario.projections[4].environmentalIndex}/100`,
                    valB: `${(compareScenario || scenarios[1]).projections[4].environmentalIndex}/100`,
                    delta: `${activeScenario.projections[4].environmentalIndex - (compareScenario || scenarios[1]).projections[4].environmentalIndex} pts`,
                  },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-[#1f2820] transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#f0f3eb]">{row.metric}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#c6a76a]">{row.valA}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#82a6bd]">{row.valB}</td>
                    <td className="py-3 px-4 font-mono text-right text-[#a6bd82] font-semibold">
                      {row.delta}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
