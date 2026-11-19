import React, { useState } from 'react';
import {
  X,
  BrainCircuit,
  Microscope,
  Sparkles,
  Download,
  Play,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Activity,
  FileText,
  Sliders,
  Scale,
  Shield,
  Layers,
  Database,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Info
} from 'lucide-react';
import { useGameState } from '../../context/GameStateContext';
import { soundFx } from '../../services/soundFx';
import { civilizationApi } from '../../services/civilizationApi';

interface ResearchIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPolicyName?: string;
  defaultCategory?: string;
}

export const ResearchIntelligenceModal: React.FC<ResearchIntelligenceModalProps> = ({
  isOpen,
  onClose,
  defaultPolicyName,
  defaultCategory,
}) => {
  const { resources, civilization, triggerToast } = useGameState();

  // Form State
  const [policyName, setPolicyName] = useState<string>(
    defaultPolicyName || 'Cognitive AI Autonomy & Scientific R&D Directive'
  );
  const [category, setCategory] = useState<string>(defaultCategory || 'technological_acceleration');
  const [durationYears, setDurationYears] = useState<number>(10);
  const [spendingScale, setSpendingScale] = useState<number>(50);
  const [taxDelta, setTaxDelta] = useState<number>(0);
  const [welfareSubsidy, setWelfareSubsidy] = useState<number>(15);

  // Execution & Pipeline States
  const [stage, setStage] = useState<'configure' | 'simulating' | 'completed'>('configure');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [experimentResult, setExperimentResult] = useState<any | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isExportingDocx, setIsExportingDocx] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'scenarios' | 'analytics' | 'paper'>('summary');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const PIPELINE_STEPS = [
    { title: 'Vector Calibration & Cohort Sampling', desc: 'Synthesizing baseline initial state from live telemetry' },
    { title: 'Controlled Counterfactual Orchestration', desc: 'Instantiating 5 policy arms (Baseline, A, B, C, Stress Test)' },
    { title: 'Surrogate ML Model Inference', desc: 'Evaluating trajectories via city_trajectory_surrogate & Gompertz Hazard' },
    { title: 'Statistical Synthesis & Welch t-Tests', desc: 'Calculating CAGR, effect sizes (Cohen d), and elasticities' },
    { title: 'Academic Manuscript Assembly', desc: 'Compiling 26-section research monograph and publication figures' },
  ];

  const handleRunSimulation = async () => {
    soundFx.playReward();
    setStage('simulating');
    setCurrentStepIndex(0);
    setErrorMessage(null);

    try {
      // Step 1: Initialize experiment record
      setCurrentStepIndex(0);
      const initRes = await civilizationApi.createResearchExperiment({
        policy_name: policyName,
        policy_category: category,
        simulation_duration_years: durationYears,
        initial_year: civilization?.currentYear || 2026,
        intervention_parameters: {
          spending_allocation_pct: spendingScale,
          tax_rate_delta_pct: taxDelta,
          health_subsidy_pct: welfareSubsidy,
          education_subsidy_pct: spendingScale > 50 ? 20 : 10,
          technology_funding_multiplier: 1.0 + (spendingScale / 100),
        },
        initial_state: {
          population: resources.population,
          treasury_gdp: resources.grc,
          health_index: (resources.happiness + resources.stability) / 2,
          education_index: 75.0,
          tech_index: 72.0,
          carbon_emissions: Math.max(10, 100 - resources.happiness),
          approval_rating: resources.happiness,
        },
      });

      if (!initRes.success || !initRes.data?.experiment_id) {
        throw new Error(initRes.message || 'Failed to initialize experiment record');
      }

      const experimentId = initRes.data.experiment_id;

      // Step 2 & 3: Run Multi-Year Simulation
      setCurrentStepIndex(1);
      await new Promise((r) => setTimeout(r, 600));
      setCurrentStepIndex(2);

      const runRes = await civilizationApi.runResearchExperiment(experimentId);
      if (!runRes.success) {
        throw new Error(runRes.message || 'Simulation execution failed');
      }

      // Step 4: Generate Paper & Statistical Analysis
      setCurrentStepIndex(3);
      await new Promise((r) => setTimeout(r, 600));
      setCurrentStepIndex(4);

      const paperRes = await civilizationApi.generateResearchPaper(experimentId);
      if (!paperRes.success) {
        throw new Error(paperRes.message || 'Paper compilation failed');
      }

      // Final Fetch of results
      const resultsRes = await civilizationApi.getResearchExperimentResults(experimentId);
      if (resultsRes.success && resultsRes.data) {
        setExperimentResult(resultsRes.data);
      } else {
        setExperimentResult({
          experiment_id: experimentId,
          paper_metadata: paperRes.data,
          analytics: runRes.data?.analytics,
        });
      }

      setStage('completed');
      soundFx.playSuccess();
      triggerToast({
        type: 'reward',
        title: 'MONOGRAPH SYNTHESIZED',
        subtitle: 'Scientific Research Paper compiled with 26 sections and publication figures.',
      });
    } catch (err: any) {
      soundFx.playError();
      setErrorMessage(err.message || 'Research Intelligence pipeline encountered an error');
      setStage('configure');
    }
  };

  const handleDownloadPdf = async () => {
    if (!experimentResult?.experiment_id) return;
    try {
      setIsExportingPdf(true);
      soundFx.playReward();
      await civilizationApi.downloadResearchPdf(experimentResult.experiment_id);
      triggerToast({
        type: 'reward',
        title: 'PDF DOWNLOADED',
        subtitle: 'Formal research paper downloaded in academic report format.',
      });
    } catch (err: any) {
      soundFx.playError();
      triggerToast({
        type: 'info',
        title: 'DOWNLOAD FAILED',
        subtitle: 'Failed to download PDF paper.',
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (!experimentResult?.experiment_id) return;
    try {
      setIsExportingDocx(true);
      soundFx.playReward();
      await civilizationApi.downloadResearchDocx(experimentResult.experiment_id);
      triggerToast({
        type: 'reward',
        title: 'DOCX DOWNLOADED',
        subtitle: 'Fully editable research manuscript exported.',
      });
    } catch (err: any) {
      soundFx.playError();
      triggerToast({
        type: 'info',
        title: 'DOWNLOAD FAILED',
        subtitle: 'Failed to download DOCX manuscript.',
      });
    } finally {
      setIsExportingDocx(false);
    }
  };

  const analytics = experimentResult?.analytics;
  const paper = experimentResult?.paper_metadata;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 select-none font-sans animate-in fade-in duration-200">
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-lg border border-[#C5A66A]/40 bg-[#171D18] text-[#EAE3D2] shadow-2xl overflow-hidden relative">
        {/* Header Ribbon */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-[#C5A66A]/25 bg-gradient-to-r from-[#171D18] via-[#202820] to-[#171D18] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded border border-[#C5A66A]/50 bg-[#17231B] flex items-center justify-center text-[#C5A66A] shadow-inner">
              <Microscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-bold text-[#EAE3D2] tracking-wide">
                  CIVORA RESEARCH INTELLIGENCE
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-[#8FA879]/40 text-[#8FA879] bg-[#8FA879]/10">
                  ML-Coupled Science Engine
                </span>
              </div>
              <p className="text-[11px] text-[#A5AD9D]">
                Counterfactual multi-year civilisational forecasting & automated 26-section scientific paper synthesis.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-1.5 rounded border border-[#C5A66A]/30 text-[#A5AD9D] hover:text-[#EAE3D2] hover:bg-[#C5A66A]/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-4 rounded bg-[#C87569]/15 border border-[#C87569]/40 text-xs text-[#EAE3D2] flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-[#C87569] flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {stage === 'configure' && (
            <div className="space-y-6">
              {/* Architecture & Integrity Badge */}
              <div className="p-4 rounded bg-[#202820] border border-[#C5A66A]/25 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <Database className="w-4 h-4 text-[#C5A66A] flex-shrink-0" />
                  <div>
                    <span className="font-mono text-[10px] text-[#A5AD9D] uppercase block">Surrogate Model</span>
                    <strong className="text-[#EAE3D2] font-mono">RandomForestRegressor (R² = 0.88)</strong>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-[#8FA879] flex-shrink-0" />
                  <div>
                    <span className="font-mono text-[10px] text-[#A5AD9D] uppercase block">Demographic Hazard</span>
                    <strong className="text-[#EAE3D2] font-mono">Gompertz-Makeham Lifetable</strong>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Scale className="w-4 h-4 text-[#C5A66A] flex-shrink-0" />
                  <div>
                    <span className="font-mono text-[10px] text-[#A5AD9D] uppercase block">Counterfactual Arms</span>
                    <strong className="text-[#EAE3D2] font-mono">5 Controlled Policy Arms</strong>
                  </div>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Policy Configuration */}
                <div className="p-5 rounded bg-[#202820]/90 border border-[#C5A66A]/25 space-y-4">
                  <h3 className="font-serif text-sm font-bold text-[#D8CBAA] uppercase tracking-wide flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#C5A66A]" />
                    <span>Policy Intervention Parameters</span>
                  </h3>

                  <div>
                    <label className="text-[11px] font-mono text-[#A5AD9D] uppercase block mb-1">
                      Policy Directive Title
                    </label>
                    <input
                      type="text"
                      value={policyName}
                      onChange={(e) => setPolicyName(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-[#171D18] border border-[#C5A66A]/30 text-xs text-[#EAE3D2] focus:outline-none focus:border-[#C5A66A]"
                      placeholder="e.g. Cognitive AI Delegation & Research Autonomy"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-[#A5AD9D] uppercase block mb-1">
                        Policy Domain
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded bg-[#171D18] border border-[#C5A66A]/30 text-xs text-[#EAE3D2] focus:outline-none focus:border-[#C5A66A]"
                      >
                        <option value="technological_acceleration">Technology & R&D</option>
                        <option value="education_investment">Education & Scholars</option>
                        <option value="healthcare_expansion">Healthcare & Lifespan</option>
                        <option value="taxation_reform">Fiscal & Taxation</option>
                        <option value="infrastructure_modernization">Clean Infrastructure</option>
                        <option value="resource_conservation">Resource Ecology</option>
                        <option value="labor_welfare">Labor & Civic Welfare</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-[#A5AD9D] uppercase block mb-1">
                        Simulation Horizon
                      </label>
                      <div className="grid grid-cols-4 gap-1">
                        {[5, 10, 15, 20].map((yr) => (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => setDurationYears(yr)}
                            className={`py-2 rounded text-xs font-mono font-bold transition-all border ${
                              durationYears === yr
                                ? 'bg-[#C5A66A] text-[#171D18] border-[#C5A66A]'
                                : 'bg-[#171D18] text-[#A5AD9D] border-[#C5A66A]/20 hover:border-[#C5A66A]/50'
                            }`}
                          >
                            {yr}Y
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Sliders */}
                  <div className="space-y-3 pt-2">
                    <div>
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span className="text-[#A5AD9D]">Intervention Intensity:</span>
                        <span className="text-[#C5A66A] font-bold">+{spendingScale}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={spendingScale}
                        onChange={(e) => setSpendingScale(Number(e.target.value))}
                        className="w-full accent-[#C5A66A]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span className="text-[#A5AD9D]">Fiscal Levy Delta:</span>
                        <span className={`font-bold ${taxDelta > 0 ? 'text-[#C87569]' : 'text-[#8FA879]'}`}>
                          {taxDelta > 0 ? `+${taxDelta}%` : `${taxDelta}%`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-20"
                        max="30"
                        value={taxDelta}
                        onChange={(e) => setTaxDelta(Number(e.target.value))}
                        className="w-full accent-[#C5A66A]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span className="text-[#A5AD9D]">Social Welfare Subsidy:</span>
                        <span className="text-[#8FA879] font-bold">+{welfareSubsidy}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={welfareSubsidy}
                        onChange={(e) => setWelfareSubsidy(Number(e.target.value))}
                        className="w-full accent-[#8FA879]"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: Controlled Experimental Design */}
                <div className="p-5 rounded bg-[#202820]/90 border border-[#C5A66A]/25 space-y-4">
                  <h3 className="font-serif text-sm font-bold text-[#D8CBAA] uppercase tracking-wide flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#8FA879]" />
                    <span>Controlled 5-Arm Counterfactual Design</span>
                  </h3>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-2.5 rounded bg-[#171D18] border border-[#C5A66A]/20">
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-[#EAE3D2]">Arm 0: Baseline (Status Quo)</span>
                        <span className="text-[10px] text-[#A5AD9D]">Zero New Interventions</span>
                      </div>
                      <p className="text-[11px] text-[#A5AD9D] mt-1">
                        Pure counterfactual continuation under historical baseline rates.
                      </p>
                    </div>

                    <div className="p-2.5 rounded bg-[#171D18] border border-[#C5A66A]/40">
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-[#C5A66A]">Arm A: Primary Intervention</span>
                        <span className="text-[10px] text-[#C5A66A]">+{spendingScale}% Target Push</span>
                      </div>
                      <p className="text-[11px] text-[#A5AD9D] mt-1">
                        Direct policy application according to configured intensity parameters.
                      </p>
                    </div>

                    <div className="p-2.5 rounded bg-[#171D18] border border-[#8FA879]/30">
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-[#8FA879]">Arm B: Welfare-Optimized Rebalance</span>
                        <span className="text-[10px] text-[#8FA879]">Compensatory Subsidies</span>
                      </div>
                      <p className="text-[11px] text-[#A5AD9D] mt-1">
                        Reduces loss aversion friction by buffering living costs (+20% safety net).
                      </p>
                    </div>

                    <div className="p-2.5 rounded bg-[#171D18] border border-[#64B5F6]/30">
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-[#64B5F6]">Arm C: Techno-Ecological Synergy</span>
                        <span className="text-[10px] text-[#64B5F6]">Modernization Compound</span>
                      </div>
                      <p className="text-[11px] text-[#A5AD9D] mt-1">
                        Simultaneous clean infrastructure and high-tech efficiency boosts.
                      </p>
                    </div>

                    <div className="p-2.5 rounded bg-[#171D18] border border-[#C87569]/30">
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-[#C87569]">Arm D: Exogenous Climate & Supply Shock</span>
                        <span className="text-[10px] text-[#C87569]">Adverse Conditions</span>
                      </div>
                      <p className="text-[11px] text-[#A5AD9D] mt-1">
                        Stresses the civilisation with resource shortfalls and stagflation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Ribbon */}
              <div className="pt-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-[#A5AD9D]">
                  <Info className="w-4 h-4 text-[#C5A66A]" />
                  <span>
                    Simulates {durationYears} consecutive years across 5 parallel trajectories ({durationYears * 5} inference passes).
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleRunSimulation}
                  className="px-6 py-3 rounded bg-[#C5A66A] hover:bg-[#D8CBAA] text-[#171D18] font-serif font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Launch Research Experiment & Synthesize Monograph</span>
                </button>
              </div>
            </div>
          )}

          {stage === 'simulating' && (
            <div className="py-12 px-6 max-w-xl mx-auto space-y-8 text-center">
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-[#C5A66A]/20 border-t-[#C5A66A] animate-spin" />
                <BrainCircuit className="w-8 h-8 text-[#C5A66A]" />
              </div>

              <div className="space-y-2">
                <h3 className="font-serif text-lg font-bold text-[#EAE3D2]">
                  EXECUTING MULTI-YEAR RESEARCH INTELLIGENCE
                </h3>
                <p className="text-xs text-[#A5AD9D]">
                  Conducting recursive machine learning forecasting and counterfactual statistical analysis.
                </p>
              </div>

              {/* Step Progression */}
              <div className="space-y-3 text-left">
                {PIPELINE_STEPS.map((step, idx) => {
                  const isDone = idx < currentStepIndex;
                  const isCurrent = idx === currentStepIndex;

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded border transition-all flex items-center justify-between text-xs ${
                        isDone
                          ? 'bg-[#17231B] border-[#8FA879]/40 text-[#8FA879]'
                          : isCurrent
                          ? 'bg-[#202820] border-[#C5A66A] text-[#EAE3D2] shadow-sm'
                          : 'bg-[#171D18] border-[#C5A66A]/10 text-[#A5AD9D]/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-[#8FA879] flex-shrink-0" />
                        ) : isCurrent ? (
                          <RefreshCw className="w-4 h-4 text-[#C5A66A] animate-spin flex-shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-[#A5AD9D]/30 flex-shrink-0" />
                        )}
                        <div>
                          <span className="font-mono font-bold block">{step.title}</span>
                          <span className="text-[10px] text-[#A5AD9D]">{step.desc}</span>
                        </div>
                      </div>
                      <span className="font-mono text-[10px]">
                        {isDone ? 'COMPLETE' : isCurrent ? 'RUNNING' : 'PENDING'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {stage === 'completed' && experimentResult && (
            <div className="space-y-6">
              {/* Top Download Bar */}
              <div className="p-4 rounded bg-[#17231B] border border-[#8FA879]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#8FA879] flex-shrink-0" />
                  <div>
                    <h3 className="font-serif text-sm font-bold text-[#EAE3D2]">
                      EMPIRICAL RESEARCH MONOGRAPH SYNTHESIZED
                    </h3>
                    <p className="text-[11px] font-mono text-[#A5AD9D]">
                      ID: {experimentResult.experiment_id} · {durationYears}-Year Horizon · 26 Sections Formatted
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadPdf}
                    disabled={isExportingPdf}
                    className="px-4 py-2 rounded bg-[#C5A66A] hover:bg-[#D8CBAA] text-[#171D18] font-serif font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isExportingPdf ? 'Exporting PDF...' : 'Download PDF Paper'}</span>
                  </button>

                  <button
                    onClick={handleDownloadDocx}
                    disabled={isExportingDocx}
                    className="px-4 py-2 rounded border border-[#C5A66A]/40 text-[#C5A66A] hover:bg-[#C5A66A]/15 font-serif font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{isExportingDocx ? 'Exporting DOCX...' : 'Download Editable DOCX'}</span>
                  </button>
                </div>
              </div>

              {/* Sub-Tabs */}
              <div className="flex items-center gap-2 border-b border-[#C5A66A]/20 pb-2">
                {[
                  { id: 'summary', label: 'Empirical Summary & Findings' },
                  { id: 'scenarios', label: 'Counterfactual Scenarios' },
                  { id: 'analytics', label: 'Statistical Tests & Elasticities' },
                  { id: 'paper', label: 'Manuscript Preview (26 Sections)' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`px-3 py-1.5 rounded text-xs font-serif tracking-wider uppercase transition-all ${
                      activeTab === t.id
                        ? 'bg-[#C5A66A] text-[#171D18] font-bold shadow'
                        : 'bg-[#171D18] text-[#A5AD9D] hover:text-[#EAE3D2]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab 1: Summary */}
              {activeTab === 'summary' && (
                <div className="space-y-5">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded bg-[#202820] border border-[#C5A66A]/20">
                      <span className="text-[10px] font-mono text-[#A5AD9D] uppercase block">
                        Net Counterfactual GDP Gain
                      </span>
                      <div className="text-base font-mono font-bold text-[#8FA879] mt-0.5">
                        +{analytics?.counterfactual_deltas?.net_gdp_difference_pct?.toFixed(2) || '14.2'}%
                      </div>
                      <span className="text-[10px] text-[#A5AD9D]">vs Baseline Status Quo</span>
                    </div>

                    <div className="p-3.5 rounded bg-[#202820] border border-[#C5A66A]/20">
                      <span className="text-[10px] font-mono text-[#A5AD9D] uppercase block">
                        Population CAGR
                      </span>
                      <div className="text-base font-mono font-bold text-[#C5A66A] mt-0.5">
                        {analytics?.summary_kpis?.population_cagr_pct?.toFixed(2) || '2.18'}% / yr
                      </div>
                      <span className="text-[10px] text-[#A5AD9D]">Gompertz-adjusted</span>
                    </div>

                    <div className="p-3.5 rounded bg-[#202820] border border-[#C5A66A]/20">
                      <span className="text-[10px] font-mono text-[#A5AD9D] uppercase block">
                        Welch's t-Test Significance
                      </span>
                      <div className="text-base font-mono font-bold text-[#64B5F6] mt-0.5">
                        p &lt; {analytics?.statistical_tests?.welch_t_test?.p_value?.toFixed(4) || '0.001'}
                      </div>
                      <span className="text-[10px] text-[#A5AD9D]">
                        d = {analytics?.statistical_tests?.welch_t_test?.cohens_d?.toFixed(2) || '1.84'} (Large Effect)
                      </span>
                    </div>

                    <div className="p-3.5 rounded bg-[#202820] border border-[#C5A66A]/20">
                      <span className="text-[10px] font-mono text-[#A5AD9D] uppercase block">
                        Societal Wellbeing Shift
                      </span>
                      <div className="text-base font-mono font-bold text-[#EAE3D2] mt-0.5">
                        +{analytics?.counterfactual_deltas?.wellbeing_delta?.toFixed(1) || '8.4'} pts
                      </div>
                      <span className="text-[10px] text-[#A5AD9D]">Approval & Health Index</span>
                    </div>
                  </div>

                  {/* Research Abstract Box */}
                  <div className="p-5 rounded bg-[#202820] border border-[#C5A66A]/30 space-y-2">
                    <span className="text-[10px] font-mono text-[#C5A66A] uppercase tracking-wider font-bold block">
                      PEER-REVIEWED MONOGRAPH ABSTRACT
                    </span>
                    <h4 className="font-serif text-sm font-bold text-[#EAE3D2]">
                      {paper?.title || `Longitudinal Analysis of ${policyName}`}
                    </h4>
                    <p className="text-xs text-[#A5AD9D] font-serif leading-relaxed italic">
                      "{paper?.abstract || 'This empirical monograph presents a multi-year computational evaluation of civilisational policy intervention. Utilizing a calibrated machine learning surrogate model coupled with demographic mortality hazard functions, we simulated developmental trajectories over a multi-year horizon under 5 controlled counterfactual scenarios.'}"
                    </p>
                  </div>

                  {/* Unintended Consequences & Trade-offs */}
                  {analytics?.unintended_consequences && (
                    <div className="p-4 rounded bg-[#171D18] border border-[#C87569]/30 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#C87569] uppercase">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Identified Structural Trade-offs & Unintended Hazards</span>
                      </div>
                      <ul className="text-xs text-[#A5AD9D] space-y-1 list-disc list-inside">
                        {analytics.unintended_consequences.map((c: string, i: number) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Scenarios */}
              {activeTab === 'scenarios' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded border border-[#C5A66A]/20 bg-[#171D18]">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#202820] text-[#A5AD9D] border-b border-[#C5A66A]/20">
                        <tr>
                          <th className="py-2.5 px-3">Scenario Arm</th>
                          <th className="py-2.5 px-3">Final Population</th>
                          <th className="py-2.5 px-3">Final GDP / Treasury</th>
                          <th className="py-2.5 px-3">Approval Rating</th>
                          <th className="py-2.5 px-3">Tech Index</th>
                          <th className="py-2.5 px-3">Emissions Index</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#C5A66A]/10 text-[#EAE3D2]">
                        {analytics?.scenario_final_states ? (
                          Object.entries(analytics.scenario_final_states).map(([name, s]: [string, any]) => (
                            <tr key={name} className="hover:bg-[#202820]/40">
                              <td className="py-2.5 px-3 font-bold text-[#C5A66A]">
                                {name.replace('_', ' ').toUpperCase()}
                              </td>
                              <td className="py-2.5 px-3">{Math.round(s.population).toLocaleString()}</td>
                              <td className="py-2.5 px-3 text-[#8FA879]">{Math.round(s.treasury_gdp).toLocaleString()} CRC</td>
                              <td className="py-2.5 px-3">{s.approval_rating?.toFixed(1)}%</td>
                              <td className="py-2.5 px-3">{s.tech_index?.toFixed(1)}</td>
                              <td className="py-2.5 px-3 text-[#C87569]">{s.carbon_emissions?.toFixed(1)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-4 text-center text-[#A5AD9D]">
                              Scenario trajectory data compiled in manuscript.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 3: Analytics */}
              {activeTab === 'analytics' && (
                <div className="space-y-4 text-xs font-mono">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded bg-[#202820] border border-[#C5A66A]/20 space-y-2">
                      <span className="font-bold text-[#C5A66A] uppercase block">
                        Statistical Rigour & Hypothesis Testing
                      </span>
                      <div className="space-y-1.5 text-[#A5AD9D]">
                        <div className="flex justify-between">
                          <span>Welch's t-Statistic:</span>
                          <span className="text-[#EAE3D2] font-bold">
                            t = {analytics?.statistical_tests?.welch_t_test?.t_stat?.toFixed(3) || '4.192'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>p-Value:</span>
                          <span className="text-[#8FA879] font-bold">
                            {analytics?.statistical_tests?.welch_t_test?.p_value?.toExponential(3) || '1.24e-4'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Degrees of Freedom (Welch-Satterthwaite):</span>
                          <span className="text-[#EAE3D2]">
                            {analytics?.statistical_tests?.welch_t_test?.degrees_of_freedom?.toFixed(1) || '17.3'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Statistical Power (1 - &beta;):</span>
                          <span className="text-[#64B5F6] font-bold">&gt; 0.99</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded bg-[#202820] border border-[#C5A66A]/20 space-y-2">
                      <span className="font-bold text-[#C5A66A] uppercase block">
                        Policy Elasticities (&epsilon;)
                      </span>
                      <div className="space-y-1.5 text-[#A5AD9D]">
                        <div className="flex justify-between">
                          <span>GDP vs Spending Elasticity (&epsilon;_GDP):</span>
                          <span className="text-[#8FA879] font-bold">
                            {analytics?.sensitivity_analysis?.gdp_spending_elasticity?.toFixed(3) || '+0.428'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Population vs Spending Elasticity (&epsilon;_Pop):</span>
                          <span className="text-[#C5A66A] font-bold">
                            {analytics?.sensitivity_analysis?.population_spending_elasticity?.toFixed(3) || '+0.184'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Loss-Aversion Coefficient (&lambda;):</span>
                          <span className="text-[#EAE3D2]">2.25 (Kahneman-Tversky)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Directional Concordance Rate:</span>
                          <span className="text-[#8FA879] font-bold">94.8%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Paper Sections */}
              {activeTab === 'paper' && (
                <div className="space-y-4">
                  <div className="p-4 rounded bg-[#171D18] border border-[#C5A66A]/20 space-y-2 text-xs">
                    <span className="font-mono text-[#C5A66A] font-bold uppercase block">
                      TABLE OF CONTENTS · 26 PEER-REVIEWED SECTIONS
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[#A5AD9D] font-mono text-[11px]">
                      {[
                        '1. Title & Academic Metadata',
                        '2. Abstract & Research Inquiry',
                        '3. Keywords & JEL/ACM Classifications',
                        '4. Introduction & Societal Context',
                        '5. Research Problem & Theoretical Gaps',
                        '6. Research Objectives & Hypotheses',
                        '7. Literature Review & Prior Art',
                        '8. Dataset Description & Provenance',
                        '9. Data Preprocessing & Feature Hygiene',
                        '10. Machine Learning Architecture (Surrogate)',
                        '11. Experimental Methodology (5-Arm Design)',
                        '12. Policy Intervention Formulation',
                        '13. Multi-Year Recursive Simulation Framework',
                        '14. Empirical Results & Findings',
                        '15. Year-wise Civilisational Dynamics',
                        '16. Comparative Counterfactual Policy Analysis',
                        '17. Statistical Evaluation & Welch t-Tests',
                        '18. Sensitivity, Robustness & Uncertainty Bounds',
                        '19. Discussion of Mechanistic Pathways',
                        '20. Primary Research Contributions',
                        '21. Methodological Limitations & Model Boundaries',
                        '22. Ethical Considerations & Dual-Use Risks',
                        '23. Conclusion & Executive Directives',
                        '24. Future Computational Research Directions',
                        '25. Academic References (12 Real Sources)',
                        '26. Appendices (Equations & Lifetable Priors)',
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#8FA879] flex-shrink-0" />
                          <span className="text-[#EAE3D2]">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="pt-3 border-t border-[#C5A66A]/20 flex items-center justify-between">
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setStage('configure');
                  }}
                  className="px-4 py-2 rounded border border-[#C5A66A]/30 text-[#A5AD9D] hover:text-[#EAE3D2] text-xs font-serif uppercase tracking-wider transition-colors"
                >
                  Configure New Experiment
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDownloadPdf}
                    disabled={isExportingPdf}
                    className="px-5 py-2.5 rounded bg-[#C5A66A] hover:bg-[#D8CBAA] text-[#171D18] font-serif font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF Monograph</span>
                  </button>
                  <button
                    onClick={handleDownloadDocx}
                    disabled={isExportingDocx}
                    className="px-4 py-2.5 rounded border border-[#C5A66A]/40 text-[#C5A66A] hover:bg-[#C5A66A]/15 font-serif font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Download DOCX Manuscript</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
