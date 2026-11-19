import React, { useState, useRef } from 'react';
import {
  Sparkles,
  TrendingUp,
  Award,
  Crown,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Hammer,
  Database,
  Calendar,
  Layers,
  ChevronRight,
  RotateCcw,
  Download,
  Upload,
  Shield,
  ShieldAlert,
  Activity,
  Users,
  Building2,
  Zap,
  Leaf,
  X,
  Compass,
  FileDown,
  FileUp,
  HardDrive,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';
import { useGameState } from '../../context/GameStateContext';
import { DevelopmentRecommendation } from '../../types/evolution';

interface CivilizationAnalyticsDashboardProps {
  onClose?: () => void;
}

export default function CivilizationAnalyticsDashboard({ onClose }: CivilizationAnalyticsDashboardProps) {
  const {
    civilization,
    resources,
    evolutionReport,
    executeDevelopmentRecommendation,
    saveGameToStorage,
    loadGameFromStorage,
    exportGameStateJSON,
    importGameStateJSON,
    resetGameToInitial,
    rates,
  } = useGameState();

  const [activeTab, setActiveTab] = useState<'stage' | 'analytics' | 'expansion' | 'districts' | 'persistence'>('stage');
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentStage = evolutionReport.currentStage;
  const nextStage = evolutionReport.nextStage;
  const checklist = evolutionReport.criteriaChecklist;
  const recommendations = evolutionReport.recommendations;
  const timeline = evolutionReport.historicalTimeline;
  const districtsSummary = evolutionReport.districtsSummary;
  const disasterRecovery = evolutionReport.disasterRecovery;

  // Chart data formatting
  const chartData = timeline.map((snap) => ({
    year: `Y${snap.year.toString().padStart(2, '0')}`,
    population: Number((snap.population / 1000000).toFixed(3)),
    gdp: snap.gdp,
    happiness: snap.happiness,
    qol: snap.qualityOfLife,
    energyMW: snap.energyProducedMW,
    envIndex: snap.environmentalIndex,
  }));

  const handleSave = () => {
    saveGameToStorage();
    setSaveSuccessNotice('Civilization state successfully saved to browser local storage!');
    setTimeout(() => setSaveSuccessNotice(null), 3500);
  };

  const handleLoad = () => {
    const success = loadGameFromStorage();
    if (success) {
      setSaveSuccessNotice('Civilization state successfully restored from local storage archive!');
    } else {
      setSaveSuccessNotice('No saved civilization state found in local storage.');
    }
    setTimeout(() => setSaveSuccessNotice(null), 3500);
  };

  const handleExportJSON = () => {
    try {
      const jsonStr = exportGameStateJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `genesis-evolution-${civilization.name.toLowerCase().replace(/\s+/g, '-')}-Y${civilization.currentYear}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSaveSuccessNotice('Civilization state archive downloaded as JSON file!');
      setTimeout(() => setSaveSuccessNotice(null), 3500);
    } catch (err) {
      setSaveSuccessNotice('Error creating JSON export.');
      setTimeout(() => setSaveSuccessNotice(null), 3500);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const ok = importGameStateJSON(text);
        if (ok) {
          setSaveSuccessNotice(`Successfully imported & restored state from ${file.name}!`);
        } else {
          setSaveSuccessNotice('Error: File is not a valid Genesis civilization state JSON.');
        }
        setTimeout(() => setSaveSuccessNotice(null), 4000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmReset = () => {
    resetGameToInitial();
    setShowResetModal(false);
    if (onClose) onClose();
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-5xl bg-[#131914]/98 border-2 border-[#364438] rounded-2xl shadow-2xl backdrop-blur-2xl text-[#e8e9e3] flex flex-col max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
    >
      {/* Hidden File Input for JSON State Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        onChange={handleFileImport}
        className="hidden"
      />

      {/* ================= 1. HEADER ================= */}
      <div className="p-4 sm:p-5 border-b border-[#2b372d] bg-[#18211a]/95 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#2b2718] border border-[#594d2d] text-[#c6a76a] shadow-inner shrink-0">
            <Crown size={24} className="text-[#c6a76a]" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-[#c6a76a] uppercase font-bold">
                CIVILIZATION EVOLUTION & LONG-TERM SIMULATION
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase bg-[#2b2718] text-[#c6a76a] border border-[#594d2d] whitespace-nowrap">
                Stage {currentStage.order} of 6: {currentStage.name}
              </span>
            </div>
            <h2 className="text-xl font-black text-[#f3f5ef] tracking-tight mt-0.5 truncate">
              {civilization.name} Evolutionary Matrix
            </h2>
          </div>
        </div>

        {/* Tab Navigation Pills */}
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#141b15] border border-[#2d3a2f] shrink-0">
          <button
            onClick={() => setActiveTab('stage')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'stage'
                ? 'bg-[#29382b] text-[#f3f5ef] shadow-md border border-[#3d5340]'
                : 'text-[#8e9c8c] hover:text-[#e8e9e3]'
            }`}
          >
            Stages
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-[#29382b] text-[#f3f5ef] shadow-md border border-[#3d5340]'
                : 'text-[#8e9c8c] hover:text-[#e8e9e3]'
            }`}
          >
            Historical Graphs
          </button>
          <button
            onClick={() => setActiveTab('expansion')}
            className={`relative px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'expansion'
                ? 'bg-[#29382b] text-[#f3f5ef] shadow-md border border-[#3d5340]'
                : 'text-[#8e9c8c] hover:text-[#e8e9e3]'
            }`}
          >
            Planner ({recommendations.length})
          </button>
          <button
            onClick={() => setActiveTab('districts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'districts'
                ? 'bg-[#29382b] text-[#f3f5ef] shadow-md border border-[#3d5340]'
                : 'text-[#8e9c8c] hover:text-[#e8e9e3]'
            }`}
          >
            Districts & Hazards
          </button>
          <button
            onClick={() => setActiveTab('persistence')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'persistence'
                ? 'bg-[#29382b] text-[#f3f5ef] shadow-md border border-[#3d5340]'
                : 'text-[#8e9c8c] hover:text-[#e8e9e3]'
            }`}
          >
            Archive & Save
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 ml-2 rounded-lg text-[#8e9c8c] hover:text-[#e8e9e3] hover:bg-[#202921] transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Save / Restore Feedback Notice Banner */}
      {saveSuccessNotice && (
        <div className="bg-[#1b3823] border-b border-[#2b5936] px-4 py-2.5 text-xs font-mono text-[#2ecc71] flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} />
            <span>{saveSuccessNotice}</span>
          </div>
          <button onClick={() => setSaveSuccessNotice(null)} className="cursor-pointer text-[#a6bd82] hover:text-white">✕</button>
        </div>
      )}

      {/* ================= 2. VITALS STRIP ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-4 bg-[#151c16] border-b border-[#28352a] text-xs font-mono">
        <div className="p-2.5 rounded-xl bg-[#1b231d] border border-[#2b392d]">
          <span className="text-[#8e9c8c] block text-[9px] uppercase">CIVILIZATION SCORE</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-base font-bold text-[#c6a76a]">
              {evolutionReport.overallCivilizationScore}
            </span>
            <span className="text-[10px] text-[#8e9c8c]">/ 1000</span>
          </div>
          <span className="text-[10px] text-[#a6bd82] block mt-0.5">Multi-vector index</span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#1b231d] border border-[#2b392d]">
          <span className="text-[#8e9c8c] block text-[9px] uppercase">SIMULATED CHRONOLOGY</span>
          <span className="text-base font-bold text-[#f3f5ef] block mt-0.5 truncate">
            Year {civilization.currentYear} · Day {civilization.currentDay}
          </span>
          <span className="text-[10px] text-[#a6bd82] block mt-0.5">Long-term timeline</span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#1b231d] border border-[#2b392d]">
          <span className="text-[#8e9c8c] block text-[9px] uppercase">TOTAL CENSUS</span>
          <span className="text-base font-bold text-[#f3f5ef] block mt-0.5">
            {(resources.population / 1000000).toFixed(3)}M
          </span>
          <span className="text-[10px] text-[#a6bd82] block mt-0.5">+{rates.populationGrowthRate}%/yr growth</span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#1b231d] border border-[#2b392d]">
          <span className="text-[#8e9c8c] block text-[9px] uppercase">GROSS PRODUCT (GDP)</span>
          <span className="text-base font-bold text-[#f3f5ef] block mt-0.5">
            {resources.gdp.toFixed(1)}B Cr
          </span>
          <span className="text-[10px] text-[#a6bd82] block mt-0.5">+{rates.gdpGrowthRate}%/yr</span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#1b231d] border border-[#2b392d] col-span-2 sm:col-span-1">
          <span className="text-[#8e9c8c] block text-[9px] uppercase">STAGE ADVANCEMENT</span>
          <span className="text-base font-bold text-[#2ecc71] block mt-0.5">
            {evolutionReport.stageProgressPercent}%
          </span>
          <span className="text-[10px] text-[#8e9c8c] block mt-0.5 truncate">
            {nextStage ? `Target: ${nextStage.name}` : 'Pinnacle Reached'}
          </span>
        </div>
      </div>

      {/* ================= 3. TAB CONTENT ================= */}
      <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-5">
        {/* TAB 1: EVOLUTION STAGES & REQUIREMENTS CHECKLIST */}
        {activeTab === 'stage' && (
          <div className="space-y-5">
            {/* Current Stage Hero Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-[#212b22] via-[#1a231b] to-[#212b22] border-2 border-[#4d634f] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#272317] text-[#c6a76a] border border-[#524424] whitespace-nowrap">
                    STAGE {currentStage.order} OF 6
                  </span>
                  <h3 className="text-xl font-bold text-[#f3f5ef]">{currentStage.name}</h3>
                </div>
                <p className="text-xs font-mono text-[#a6bd82]">{currentStage.subtitle}</p>
                <p className="text-xs text-[#cdd8cc] max-w-xl leading-relaxed">
                  {currentStage.description}
                </p>
              </div>

              {/* Progress to next stage */}
              {nextStage && (
                <div className="p-4 rounded-xl bg-[#131914] border border-[#2a372c] min-w-[260px] space-y-2 shrink-0">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#8e9c8c]">NEXT: {nextStage.name.toUpperCase()}</span>
                    <span className="font-bold text-[#2ecc71]">{evolutionReport.stageProgressPercent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#1b231d] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#c6a76a] to-[#2ecc71] transition-all duration-500"
                      style={{ width: `${evolutionReport.stageProgressPercent}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[#8e9c8c] leading-tight">
                    Satisfy all 6 criteria below to advance to the {nextStage.name} stage.
                  </p>
                </div>
              )}
            </div>

            {/* Stage Requirements Checklist */}
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-bold text-[#f3f5ef]">
                  {nextStage ? `Stage Advancement Criteria: ${currentStage.name} → ${nextStage.name}` : 'Pinnacle Civilization Status'}
                </h4>
                <p className="text-xs text-[#8e9c8c]">
                  Real simulation metrics evaluated continuously against dynamic development thresholds.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      item.isMet
                        ? 'bg-[#18231a] border-[#39503b] shadow-sm'
                        : 'bg-[#1b1c1a] border-[#3a3528]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-[#f3f5ef]">{item.label}</span>
                      {item.isMet ? (
                        <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#2ecc71] px-2 py-0.5 rounded-full bg-[#1b3823] border border-[#2b5936] whitespace-nowrap">
                          <CheckCircle2 size={11} /> MET
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#f1c40f] px-2 py-0.5 rounded-full bg-[#332b17] border border-[#524424] whitespace-nowrap">
                          <AlertTriangle size={11} /> PENDING
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="text-[#8e9c8c] block text-[9px]">CURRENT</span>
                        <span className={item.isMet ? 'text-[#a6bd82] font-bold' : 'text-[#f3f5ef]'}>
                          {item.currentValue}
                        </span>
                      </div>
                      <ArrowRight size={13} className="text-[#556956]" />
                      <div className="text-right">
                        <span className="text-[#8e9c8c] block text-[9px]">REQUIRED</span>
                        <span className="font-bold text-[#c6a76a]">{item.targetValue}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Opportunities Unlocked Strip */}
            <div className="p-4 rounded-xl bg-[#18211a] border border-[#2b372d] space-y-2">
              <span className="text-xs font-mono font-bold text-[#c6a76a] uppercase block">
                STAGE {currentStage.order} UNLOCKED OPPORTUNITIES
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                {currentStage.unlockedOpportunities.map((opp, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#202921] border border-[#313f32] text-xs font-mono text-[#dce9ca]"
                  >
                    <Sparkles size={12} className="text-[#c6a76a]" />
                    <span>{opp}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HISTORICAL GRAPHS & TIME-SERIES */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="p-3.5 rounded-xl bg-[#18211a] border border-[#2b372d]">
              <h4 className="text-sm font-bold text-[#f3f5ef]">Long-Term Multi-Year Simulation Telemetry</h4>
              <p className="text-xs text-[#8e9c8c]">
                Records actual historical performance from planetary founding to present year.
              </p>
            </div>

            {/* Chart 1: Population and GDP Growth */}
            <div className="p-4 rounded-xl bg-[#18211a] border border-[#2b372d] space-y-3">
              <div>
                <h5 className="text-xs font-mono font-bold text-[#c6a76a] uppercase">
                  CENSUS POPULATION & ANNUAL GDP TRAJECTORY
                </h5>
                <p className="text-[10px] text-[#8e9c8c]">Demographic expansion and macroeconomic output</p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#253227" />
                    <XAxis dataKey="year" stroke="#718070" tick={{ fill: '#9da99b', fontSize: 10 }} />
                    <YAxis yAxisId="left" stroke="#a6bd82" tick={{ fill: '#a6bd82', fontSize: 10 }} unit="M" />
                    <YAxis yAxisId="right" orientation="right" stroke="#c6a76a" tick={{ fill: '#c6a76a', fontSize: 10 }} unit="B" />
                    <Tooltip contentStyle={{ backgroundColor: '#171d18', borderColor: '#39443a', borderRadius: '8px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Line yAxisId="left" type="monotone" dataKey="population" name="Population (Millions)" stroke="#a6bd82" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line yAxisId="right" type="monotone" dataKey="gdp" name="GDP (Billion Cr)" stroke="#c6a76a" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Citizen Happiness & Quality of Life */}
            <div className="p-4 rounded-xl bg-[#18211a] border border-[#2b372d] space-y-3">
              <div>
                <h5 className="text-xs font-mono font-bold text-[#2ecc71] uppercase">
                  CITIZEN HAPPINESS & QUALITY OF LIFE (QoL)
                </h5>
                <p className="text-[10px] text-[#8e9c8c]">Social satisfaction and infrastructure adequacy index</p>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#253227" />
                    <XAxis dataKey="year" stroke="#718070" tick={{ fill: '#9da99b', fontSize: 10 }} />
                    <YAxis stroke="#8e9c8c" domain={[50, 100]} tick={{ fill: '#9da99b', fontSize: 10 }} unit="%" />
                    <Tooltip contentStyle={{ backgroundColor: '#171d18', borderColor: '#39443a', borderRadius: '8px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Line type="monotone" dataKey="happiness" name="Overall Happiness (/100)" stroke="#2ecc71" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="qol" name="Quality of Life Index (%)" stroke="#82a6bd" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="envIndex" name="Ecological Purity (%)" stroke="#e0be70" strokeWidth={1.5} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Historical Milestone Chronology Table */}
            <div className="p-4 rounded-xl bg-[#18211a] border border-[#2b372d] space-y-3">
              <h5 className="text-xs font-mono font-bold text-[#c6a76a] uppercase">
                HISTORICAL SIMULATION CHRONICLE
              </h5>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="text-[#8e9c8c] text-[10px] uppercase border-b border-[#253227]">
                    <tr>
                      <th className="py-2.5 px-3">Year</th>
                      <th className="py-2.5 px-3">Stage</th>
                      <th className="py-2.5 px-3">Census</th>
                      <th className="py-2.5 px-3">GDP Output</th>
                      <th className="py-2.5 px-3">Happiness</th>
                      <th className="py-2.5 px-3">Key Historical Milestone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2720]">
                    {timeline.slice().reverse().map((snap) => (
                      <tr key={snap.year} className="hover:bg-[#1f2821] transition-colors">
                        <td className="py-2.5 px-3 font-bold text-[#c6a76a]">Year {snap.year.toString().padStart(3, '0')}</td>
                        <td className="py-2.5 px-3 text-[#dce9ca] capitalize">{snap.stageName}</td>
                        <td className="py-2.5 px-3 text-[#a6bd82]">{(snap.population / 1000000).toFixed(3)}M</td>
                        <td className="py-2.5 px-3 text-[#f3f5ef]">{snap.gdp}B Cr</td>
                        <td className="py-2.5 px-3 text-[#2ecc71]">{snap.happiness}/100</td>
                        <td className="py-2.5 px-3 text-[#8e9c8c] text-[11px] font-sans">
                          {snap.keyMilestoneEvent || 'Continuous steady municipal development'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: INTELLIGENT CITY EXPANSION & PLANNER */}
        {activeTab === 'expansion' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[#18211a] border border-[#2b372d]">
              <h4 className="text-sm font-bold text-[#f3f5ef]">Intelligent City Expansion Planner</h4>
              <p className="text-xs text-[#8e9c8c]">
                Engine analyzes live zoning demand and resource bottlenecks to recommend exact road-adjacent building projects.
              </p>
            </div>

            <div className="space-y-3.5">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 rounded-xl bg-[#18211a] border border-[#2b372d] hover:border-[#3d5340] transition-all space-y-3 shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#263529]">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-[#202921] border border-[#2f3d31] text-[#c6a76a]">
                        <Hammer size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#f3f5ef]">{rec.title}</h4>
                          <span
                            className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${
                              rec.priority === 'critical'
                                ? 'bg-[#3d1818] text-[#ff7676] border border-[#6b2222]'
                                : rec.priority === 'high'
                                ? 'bg-[#3a2818] text-[#f39c12] border border-[#614220]'
                                : 'bg-[#1b2f21] text-[#2ecc71] border border-[#2b5936]'
                            }`}
                          >
                            {rec.priority} Priority
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#8e9c8c] uppercase mt-0.5 block">
                          Target Sector: {rec.targetDistrictId}
                        </span>
                      </div>
                    </div>

                    {/* Action Button & Cost */}
                    <div className="flex items-center gap-3">
                      <div className="text-right text-[11px] font-mono text-[#8e9c8c]">
                        <span>Cost: </span>
                        <span className={resources.materials >= (rec.materialsCost || 0) ? 'text-[#a6bd82] font-bold' : 'text-[#ff7676]'}>
                          {rec.materialsCost} Materials
                        </span>
                        <span> · </span>
                        <span className={resources.grc >= (rec.creditsCost || 0) ? 'text-[#c6a76a] font-bold' : 'text-[#ff7676]'}>
                          {rec.creditsCost} Cr
                        </span>
                      </div>

                      <button
                        disabled={!rec.canExecute}
                        onClick={() => executeDevelopmentRecommendation(rec.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${
                          rec.canExecute
                            ? 'bg-[#3b4c37] hover:bg-[#4d6348] text-[#dce9ca] border border-[#5d7756]'
                            : 'bg-[#202721] text-[#637262] border border-[#2c362d] cursor-not-allowed'
                        }`}
                      >
                        <Hammer size={13} />
                        <span>{rec.canExecute ? 'Execute Project' : 'Insufficient Resources'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Problem & Calculated Evidence */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-[#141b15] border border-[#243026]">
                      <span className="text-[#8e9c8c] block text-[9px] uppercase font-mono">SIMULATION EVIDENCE</span>
                      <p className="text-[#f0f3eb] font-mono text-[11px] mt-0.5">{rec.simulationEvidence}</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#141b15] border border-[#243026]">
                      <span className="text-[#a6bd82] block text-[9px] uppercase font-mono">CALCULATED OUTCOME</span>
                      <p className="text-[#dce9ca] text-[11px] mt-0.5">{rec.expectedOutcome}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: DISTRICTS & HAZARDS RESILIENCE */}
        {activeTab === 'districts' && (
          <div className="space-y-5">
            {/* Disaster Recovery Status Card */}
            <div className="p-4 rounded-xl bg-[#18211a] border border-[#2b372d] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#253227]">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={18} className={disasterRecovery.hasActiveDisaster ? 'text-[#ff6b6b]' : 'text-[#2ecc71]'} />
                  <div>
                    <h4 className="text-sm font-bold text-[#f3f5ef]">Hazard Containment & Civil Readiness</h4>
                    <span className="text-[10px] text-[#8e9c8c] font-mono">
                      Status: {disasterRecovery.recoveryStatus}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#8e9c8c]">Disaster Readiness:</span>
                  <span className="text-xs font-mono font-bold text-[#2ecc71] bg-[#1a2d1e] px-2 py-0.5 rounded border border-[#2c5234]">
                    {disasterRecovery.overallDisasterReadiness}%
                  </span>
                </div>
              </div>

              {disasterRecovery.hasActiveDisaster ? (
                <div className="p-3 rounded-xl bg-[#2d1515] border border-[#612727] space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-[#ff8080] uppercase">
                      ACTIVE THREAT: {disasterRecovery.activeDisasterType?.toUpperCase()} ({disasterRecovery.activeDisasterIntensity?.toUpperCase()})
                    </span>
                    <span className="text-[#ffb3b3]">
                      Containment: {disasterRecovery.containmentPercent}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#1b1212] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#e74c3c] to-[#2ecc71] transition-all duration-300"
                      style={{ width: `${disasterRecovery.containmentPercent}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-mono text-[#2ecc71] bg-[#17261a] p-3 rounded-xl border border-[#27482d]">
                  <CheckCircle2 size={16} />
                  <span>No active atmospheric or geological crises. Civil shield generators and containment units are on standby.</span>
                </div>
              )}
            </div>

            {/* District Breakdown Cards */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-[#f3f5ef]">Territorial Sector Development Telemetry</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {districtsSummary.map((dist) => (
                  <div
                    key={dist.districtId}
                    className="p-4 rounded-xl bg-[#18211a] border border-[#2b372d] space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[#253227]">
                      <div>
                        <h5 className="text-xs font-bold text-[#f3f5ef]">{dist.name}</h5>
                        <span className="text-[10px] font-mono text-[#8e9c8c]">{dist.districtId}</span>
                      </div>
                      <span
                        className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${
                          dist.growthStatus === 'expanding'
                            ? 'bg-[#1b3823] text-[#2ecc71] border border-[#2b5936]'
                            : dist.growthStatus === 'stable'
                            ? 'bg-[#1b2533] text-[#64b5f6] border border-[#263e59]'
                            : 'bg-[#332b17] text-[#f1c40f] border border-[#524424]'
                        }`}
                      >
                        {dist.growthStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                      <div className="p-2 rounded bg-[#131914] border border-[#232f26]">
                        <span className="text-[#8e9c8c] block text-[9px]">CENSUS</span>
                        <span className="font-bold text-[#f3f5ef] text-[11px]">
                          {(dist.population / 1000).toFixed(0)}k
                        </span>
                      </div>
                      <div className="p-2 rounded bg-[#131914] border border-[#232f26]">
                        <span className="text-[#8e9c8c] block text-[9px]">BUILDINGS</span>
                        <span className="font-bold text-[#c6a76a] text-[11px]">
                          {dist.buildingsCount} Active
                        </span>
                      </div>
                      <div className="p-2 rounded bg-[#131914] border border-[#232f26]">
                        <span className="text-[#8e9c8c] block text-[9px]">INFRA HEALTH</span>
                        <span className="font-bold text-[#a6bd82] text-[11px]">
                          {dist.infrastructureHealth}%
                        </span>
                      </div>
                    </div>

                    {/* Jobs Capacity Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-[#8e9c8c]">
                        <span>Jobs Filled: {dist.jobsFilled} / {dist.jobsCapacity}</span>
                        <span>{dist.jobsCapacity > 0 ? Math.round((dist.jobsFilled / dist.jobsCapacity) * 100) : 100}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#131914] overflow-hidden">
                        <div
                          className="h-full bg-[#64b5f6]"
                          style={{
                            width: `${dist.jobsCapacity > 0 ? Math.min(100, Math.round((dist.jobsFilled / dist.jobsCapacity) * 100)) : 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ARCHIVAL PERSISTENCE & DATA SNAPSHOT */}
        {activeTab === 'persistence' && (
          <div className="space-y-5">
            <div className="p-3.5 rounded-xl bg-[#18211a] border border-[#2b372d]">
              <h4 className="text-sm font-bold text-[#f3f5ef]">Civilization Archives & State Persistence</h4>
              <p className="text-xs text-[#8e9c8c]">
                Preserve your multi-stage civilization progress across browser sessions or export/import JSON state files.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Browser Storage Sync */}
              <div className="p-5 rounded-2xl bg-[#18211a] border border-[#2b372d] space-y-4">
                <div className="flex items-center gap-2">
                  <Database size={18} className="text-[#a6bd82]" />
                  <h5 className="text-sm font-bold text-[#f3f5ef]">BROWSER LOCAL STORAGE ARCHIVE</h5>
                </div>
                <p className="text-xs text-[#8e9c8c] leading-relaxed">
                  Saves placed building coordinates, stage progress, treasury, citizen records, and simulation year into your browser storage.
                </p>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <button
                    onClick={handleSave}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#394b35] hover:bg-[#4b6145] text-[#dce9ca] text-xs font-mono font-bold transition-all border border-[#5d7756] flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <Download size={14} />
                    <span>Save World State</span>
                  </button>
                  <button
                    onClick={handleLoad}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#202921] hover:bg-[#2b382d] text-[#e8e9e3] text-xs font-mono font-bold transition-all border border-[#364738] flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <Upload size={14} />
                    <span>Restore Archive</span>
                  </button>
                </div>
              </div>

              {/* JSON File Export / Import */}
              <div className="p-5 rounded-2xl bg-[#18211a] border border-[#2b372d] space-y-4">
                <div className="flex items-center gap-2">
                  <HardDrive size={18} className="text-[#c6a76a]" />
                  <h5 className="text-sm font-bold text-[#f3f5ef]">PORTABLE JSON STATE FILE</h5>
                </div>
                <p className="text-xs text-[#8e9c8c] leading-relaxed">
                  Export or import your civilization save as a standalone JSON file for backups, migrations, or device transfers.
                </p>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <button
                    onClick={handleExportJSON}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#2a3726] hover:bg-[#394a34] text-[#c6a76a] text-xs font-mono font-bold transition-all border border-[#4d6344] flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <FileDown size={14} />
                    <span>Export JSON</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#202921] hover:bg-[#2b382d] text-[#e8e9e3] text-xs font-mono font-bold transition-all border border-[#364738] flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <FileUp size={14} />
                    <span>Import JSON</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Reset to Initial Colony Baseline */}
            <div className="p-5 rounded-2xl bg-[#1c1414] border border-[#402222] space-y-3">
              <div className="flex items-center gap-2">
                <RotateCcw size={18} className="text-[#e74c3c]" />
                <h5 className="text-sm font-bold text-[#ff8080]">SIMULATION RESET</h5>
              </div>
              <p className="text-xs text-[#d19c9c] leading-relaxed">
                Reset the simulation to its initial baseline state. All custom constructed structures and changes will be safely reverted.
              </p>

              <button
                onClick={() => setShowResetModal(true)}
                className="py-2.5 px-4 rounded-xl bg-[#4a1c1c] hover:bg-[#612323] text-[#ff9999] text-xs font-mono font-bold transition-all border border-[#7a2e2e] flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <RotateCcw size={14} />
                <span>Reset to Baseline Outpost</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= RESET CONFIRMATION MODAL ================= */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#191e1a] border-2 border-[#7a2c2c] rounded-2xl p-5 space-y-4 shadow-2xl text-[#e8e9e3]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#3d1818] text-[#e74c3c]">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#f5f7f2]">Reset Civilization?</h3>
                <span className="text-xs text-[#8f9d8d]">Irreversible simulation reset confirmation</span>
              </div>
            </div>

            <p className="text-xs text-[#cdd8cc] leading-relaxed">
              Are you sure you want to reset <strong className="text-[#c6a76a]">{civilization.name}</strong>?
              This will restore all buildings, resources, and citizen metrics back to initial defaults.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2e3b30]">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-mono font-medium text-[#8f9d8d] hover:bg-[#253227] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-lg bg-[#c0392b] hover:bg-[#d94436] text-white text-xs font-mono font-bold transition-colors shadow-lg"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
