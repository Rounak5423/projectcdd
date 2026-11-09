import React, { useState, useEffect } from 'react';
import {
  Scale,
  Shield,
  Heart,
  TrendingUp,
  Leaf,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Check,
  Power,
  Crown,
  Sparkles,
  Zap,
  Bot,
  Coins,
  Globe2,
  Flame,
  X,
  FileCheck2,
  HelpCircle,
  Layers,
  BookOpen,
  MessageSquare,
  Users,
  Vote,
  Brain,
  PlusCircle,
  Quote,
  Activity,
  Award,
  AlertCircle
} from 'lucide-react';
import { useGameState } from '../context/GameStateContext';
import { Policy } from '../types/game';
import { soundFx } from '../services/soundFx';
import { civilizationApi } from '../services/civilizationApi';

interface PolicyLaboratoryPageProps {
  onClose?: () => void;
}

const DOMAINS = [
  { id: 'all', label: 'All Domains' },
  { id: 'active', label: 'Enacted In Cabinet' },
  { id: 'Research', label: 'Research & Science' },
  { id: 'Economic', label: 'Economic & Fiscal' },
  { id: 'Labor', label: 'Labor & Workforce' },
  { id: 'Environmental', label: 'Ecological & Energy' },
  { id: 'AI', label: 'AI & Research Ethics' },
  { id: 'Social', label: 'Civic Liberties & Social' },
  { id: 'Education', label: 'Education & Institutions' },
];

export const PolicyLaboratoryPage: React.FC<PolicyLaboratoryPageProps> = ({ onClose }) => {
  const { policies, resources, togglePolicy, updatePolicySlider, addCustomPolicy, triggerToast, civilization } = useGameState();
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  
  // Deliberation and custom policy states
  const [deliberationPolicy, setDeliberationPolicy] = useState<Policy | null>(null);
  const [deliberationData, setDeliberationData] = useState<any | null>(null);
  const [isLoadingDeliberation, setIsLoadingDeliberation] = useState<boolean>(false);
  const [isDraftingCustom, setIsDraftingCustom] = useState<boolean>(false);
  const [learningStatus, setLearningStatus] = useState<any | null>(null);

  // Custom Policy Form State
  const [customForm, setCustomForm] = useState({
    name: '',
    category: 'Research',
    description: '',
    costPoliticalCapital: 180,
    sliderLabel: 'Funding & Enforcement Level',
    sliderValue: 60,
    minVal: 10,
    maxVal: 100,
    unit: '%',
    focusBenefit: 'Accelerates fundamental breakthrough discoveries across all laboratories.',
    focusRisk: 'Strains state energy grids and diverts municipal capital.'
  });

  const activePolicies = policies.filter((p) => p.isActive);

  const filteredPolicies = policies.filter((p) => {
    if (selectedDomain === 'active') return p.isActive;
    if (selectedDomain === 'all') return true;
    return p.category.toLowerCase().includes(selectedDomain.toLowerCase());
  });

  // Fetch ML Model Self-Learning Status on Mount
  useEffect(() => {
    civilizationApi.getPolicyLearningStatus().then((res) => {
      if (res.success && res.data) {
        setLearningStatus(res.data);
      }
    });
  }, []);

  // Open Deliberation Assembly before passing/ratifying any policy
  const handleOpenDeliberation = async (policy: Policy) => {
    soundFx.playClick();
    setDeliberationPolicy(policy);
    setIsLoadingDeliberation(true);

    try {
      const societyState = {
        population: resources.population,
        gdp: resources.grc * 100,
        happiness: resources.happiness,
        stability: resources.stability,
        gini_coefficient: 0.36,
        pollution: (100 - resources.environmentalIndex) / 100
      };

      const res = await civilizationApi.deliberatePolicy(policy, civilization.id, societyState);
      if (res.success && res.data) {
        setDeliberationData(res.data);
      } else {
        // Deterministic evolutionary behavioral fallback
        setDeliberationData(createEvolutionaryFallbackDeliberation(policy, resources));
      }
    } catch {
      setDeliberationData(createEvolutionaryFallbackDeliberation(policy, resources));
    } finally {
      setIsLoadingDeliberation(false);
    }
  };

  const confirmEnactOrRepeal = (policy: Policy) => {
    soundFx.playReward();
    togglePolicy(policy.id);
    setDeliberationPolicy(null);
    setDeliberationData(null);

    // Refresh model learning status after enactment
    setTimeout(() => {
      civilizationApi.getPolicyLearningStatus().then((res) => {
        if (res.success && res.data) {
          setLearningStatus(res.data);
        }
      });
    }, 1000);

    triggerToast({
      type: policy.isActive ? 'info' : 'reward',
      title: policy.isActive ? `EDICT REPEALED: ${policy.name}` : `IMPERIAL DECREE RATIFIED: ${policy.name}`,
      subtitle: policy.isActive
        ? 'Political capital refunded. Cabinet directives revised.'
        : `Enacted into High Directorate. Population reaction recorded by ML Behavioral Network.`,
    });
  };

  const handleCreateCustomPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customForm.name.trim()) return;

    soundFx.playReward();
    const newPolicyId = `custom_${Date.now()}`;
    const newPolicy: Policy = {
      id: newPolicyId,
      name: customForm.name.trim(),
      category: customForm.category as any,
      description: customForm.description.trim() || 'A custom civic directive instituted by sovereign decree.',
      costPoliticalCapital: Number(customForm.costPoliticalCapital),
      maintenanceCostCredits: Math.round(Number(customForm.costPoliticalCapital) * 0.4),
      isActive: false,
      expectedBenefits: [customForm.focusBenefit],
      risks: [customForm.focusRisk],
      durationDays: 365,
      sliderValue: Number(customForm.sliderValue),
      sliderLabel: customForm.sliderLabel,
      minVal: Number(customForm.minVal),
      maxVal: Number(customForm.maxVal),
      unit: customForm.unit,
      effectsSummary: {
        gdpModifier: Math.round(Number(customForm.sliderValue) * 0.12),
        happinessModifier: Math.round((Number(customForm.sliderValue) - 40) * 0.15),
        stabilityModifier: Math.round((50 - Math.abs(Number(customForm.sliderValue) - 50)) * 0.1),
        environmentModifier: customForm.category === 'Environmental' ? 8 : -2,
      }
    };

    // Register with backend & local state
    civilizationApi.createCustomPolicy(newPolicy).catch(() => {});
    addCustomPolicy(newPolicy);
    setIsDraftingCustom(false);

    triggerToast({
      type: 'reward',
      title: `CUSTOM EDICT DRAFTED: ${newPolicy.name}`,
      subtitle: 'Submitted to the High Deliberation Assembly for council review and behavioral evaluation.',
    });

    // Directly open Deliberation Chamber for the new policy
    handleOpenDeliberation(newPolicy);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#171D18]/95 backdrop-blur-md text-[#EAE3D2] overflow-hidden select-none font-sans">
      {/* Top Header */}
      <div className="flex-shrink-0 px-8 py-5 border-b border-[#C5A66A]/20 bg-gradient-to-r from-[#171D18] via-[#202820] to-[#171D18] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm border border-[#C5A66A]/40 bg-[#17231B] flex items-center justify-center text-[#C5A66A] shadow-inner">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl text-[#EAE3D2] tracking-wider font-semibold">
                POLICY LABORATORY & DELIBERATION ASSEMBLY
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-[#C5A66A]/40 text-[#C5A66A] bg-[#C5A66A]/10 flex items-center gap-1">
                <Brain className="w-3 h-3 text-[#8FA879]" />
                Self-Learning ML Active
              </span>
            </div>
            <p className="text-xs text-[#A5AD9D] font-sans mt-0.5">
              Deliberate societal policies with sovereign council tribunes, simulate evolutionary population reactions, and draft custom state edicts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Draft Custom Edict Trigger */}
          <button
            onClick={() => {
              soundFx.playClick();
              setIsDraftingCustom(true);
            }}
            className="px-4 py-2 rounded bg-gradient-to-r from-[#C5A66A] to-[#D8CBAA] hover:brightness-110 text-[#171D18] font-serif font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Draft Custom Edict</span>
          </button>

          <div className="flex items-center gap-3 bg-[#171D18] p-2.5 rounded border border-[#C5A66A]/30 text-xs font-mono">
            <div>
              <span className="text-[#A5AD9D] block text-[10px]">POLITICAL CAPITAL</span>
              <span className="text-sm font-bold text-[#C5A66A]">
                {resources.politicalCapital} / 1000 Cap
              </span>
            </div>
            <div className="w-px h-6 bg-[#C5A66A]/20" />
            <div>
              <span className="text-[#A5AD9D] block text-[10px]">LEARNED INSTANCES</span>
              <span className="text-sm font-bold text-[#8FA879]">
                {learningStatus?.total_learned_instances || 18} Epochs
              </span>
            </div>
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

      {/* Main Body */}
      <div className="flex-1 min-h-0 px-8 py-6 overflow-y-auto space-y-6">
        {/* Active Cabinet Slots */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-serif font-bold tracking-wider text-[#C5A66A] uppercase flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-[#C5A66A]" />
              HIGH DIRECTORATE ACTIVE CABINET PORTFOLIO ({activePolicies.length} / 6 SLOTTED)
            </span>
            <span className="text-[11px] font-mono text-[#A5AD9D]">
              4 Imperial Core Directives + 2 Sovereign Wildcards
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {activePolicies.slice(0, 4).map((p) => (
              <div
                key={p.id}
                className="p-4 rounded bg-[#202820] border-2 border-[#C5A66A]/60 flex flex-col justify-between shadow-md space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#171D18] border border-[#C5A66A]/30 text-[#C5A66A]">
                      {p.category}
                    </span>
                    <div className="w-2 h-2 rounded-full bg-[#8FA879] animate-pulse" />
                  </div>
                  <h4 className="font-serif text-sm font-bold text-[#EAE3D2] mt-2 line-clamp-1">{p.name}</h4>
                  <p className="text-[11px] text-[#A5AD9D] mt-0.5 font-mono">
                    {p.sliderLabel}: <strong className="text-[#C5A66A]">{p.sliderValue} {p.unit}</strong>
                  </p>
                </div>

                <div className="pt-3 border-t border-[#C5A66A]/15 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenDeliberation(p)}
                    className="text-[10px] text-[#8FA879] hover:underline flex items-center gap-1 font-mono"
                  >
                    <MessageSquare className="w-3 h-3" /> Review Debate
                  </button>
                  <button
                    onClick={() => handleOpenDeliberation(p)}
                    className="px-2.5 py-1 rounded bg-[#C87569]/15 hover:bg-[#C87569]/30 text-[#C87569] border border-[#C87569]/40 text-[10px] font-serif font-bold uppercase tracking-wider transition-colors"
                  >
                    Repeal
                  </button>
                </div>
              </div>
            ))}

            {/* Empty Cabinet Slots */}
            {Array.from({ length: Math.max(0, 4 - activePolicies.length) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="p-4 rounded border-2 border-dashed border-[#C5A66A]/20 bg-[#171D18]/50 flex flex-col items-center justify-center text-center text-[#A5AD9D]"
              >
                <div className="w-8 h-8 rounded-full border border-[#C5A66A]/20 flex items-center justify-center mb-1 text-sm font-serif text-[#C5A66A]">
                  🏛️
                </div>
                <span className="font-serif text-xs font-bold text-[#D8CBAA]">EMPTY CABINET SLOT</span>
                <span className="text-[10px] text-[#A5AD9D] mt-0.5">Deliberate & ratify an edict below</span>
              </div>
            ))}
          </div>
        </div>

        {/* Domain Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {DOMAINS.map((f) => (
            <button
              key={f.id}
              onClick={() => { soundFx.playClick(); setSelectedDomain(f.id); }}
              className={`px-3 py-1.5 rounded text-xs font-serif tracking-wide transition-all ${
                selectedDomain === f.id
                  ? 'bg-[#C5A66A] text-[#171D18] font-bold shadow'
                  : 'bg-[#202820] text-[#A5AD9D] border border-[#C5A66A]/20 hover:text-[#EAE3D2]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Policy Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredPolicies.map((policy) => {
            const canEnact = resources.politicalCapital >= policy.costPoliticalCapital;

            return (
              <div
                key={policy.id}
                className={`p-5 rounded flex flex-col justify-between border transition-all duration-200 ${
                  policy.isActive
                    ? 'bg-[#202820] border-[#C5A66A] shadow-md'
                    : 'bg-[#171D18] border-[#C5A66A]/20 hover:border-[#C5A66A]/50'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#171D18] border border-[#C5A66A]/30 text-[#C5A66A]">
                          {policy.category}
                        </span>
                        {policy.id.startsWith('custom_') && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-[#8FA879]/20 text-[#8FA879] border border-[#8FA879]/40">
                            Custom Edict
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif text-lg font-bold text-[#EAE3D2] mt-1.5">{policy.name}</h3>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase border ${
                        policy.isActive
                          ? 'bg-[#8FA879]/15 text-[#8FA879] border-[#8FA879]/40'
                          : 'bg-[#202820] text-[#A5AD9D] border-[#C5A66A]/20'
                      }`}
                    >
                      {policy.isActive ? 'SLOTTED' : 'ARCHIVED'}
                    </span>
                  </div>

                  <p className="text-xs text-[#A5AD9D] font-sans mt-2 leading-relaxed">
                    {policy.description}
                  </p>

                  {/* Calibration Slider */}
                  <div className="mt-4 p-3 rounded bg-[#171D18] border border-[#C5A66A]/20 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#A5AD9D] font-medium">{policy.sliderLabel}</span>
                      <span className="font-mono font-bold text-[#C5A66A]">
                        {policy.sliderValue} {policy.unit}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={policy.minVal}
                      max={policy.maxVal}
                      value={policy.sliderValue}
                      onChange={(e) => updatePolicySlider(policy.id, Number(e.target.value))}
                      className="w-full accent-[#C5A66A]"
                    />
                  </div>

                  {/* Impact Projections & Side Effects */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase text-[#8FA879] font-bold block">
                        Projected Benefits
                      </span>
                      {policy.expectedBenefits.map((b, i) => (
                        <p key={i} className="text-[11px] text-[#EAE3D2] flex items-start gap-1">
                          <span className="text-[#8FA879] font-bold">✓</span> {b}
                        </p>
                      ))}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase text-[#D6A75E] font-bold block">
                        Unintended Side Effects
                      </span>
                      {policy.risks.map((r, i) => (
                        <p key={i} className="text-[11px] text-[#D8CBAA] flex items-start gap-1">
                          <span className="text-[#D6A75E] font-bold">!</span> {r}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Deliberate & Ratify Footer */}
                <div className="mt-5 pt-3 border-t border-[#C5A66A]/15 flex items-center justify-between">
                  <span className="text-xs font-mono text-[#A5AD9D]">
                    Ratification Cost: <strong className="text-[#C5A66A]">{policy.costPoliticalCapital} Cap</strong>
                  </span>

                  <button
                    disabled={!policy.isActive && !canEnact}
                    onClick={() => handleOpenDeliberation(policy)}
                    className={`px-4 py-2 rounded text-xs font-serif font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow ${
                      policy.isActive
                        ? 'bg-[#C87569]/20 hover:bg-[#C87569]/30 text-[#C87569] border border-[#C87569]/50'
                        : canEnact
                        ? 'bg-[#C5A66A] hover:bg-[#D8CBAA] text-[#171D18]'
                        : 'bg-[#171D18] text-[#A5AD9D]/40 border border-[#C5A66A]/10 cursor-not-allowed'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>
                      {policy.isActive
                        ? 'Repeal / Deliberate'
                        : canEnact
                        ? 'Deliberate & Enact'
                        : 'Insufficient Capital'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* COUNCIL DELIBERATION & HUMAN EVOLUTION BEHAVIORAL ASSEMBLY MODAL */}
      {/* ========================================================================= */}
      {deliberationPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#1A221B] border-2 border-[#C5A66A]/70 rounded shadow-2xl overflow-hidden font-sans">
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 bg-gradient-to-r from-[#171D18] via-[#232F24] to-[#171D18] border-b border-[#C5A66A]/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded border border-[#C5A66A]/40 bg-[#17231B] flex items-center justify-center text-[#C5A66A]">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-lg font-bold text-[#EAE3D2] tracking-wide">
                      HIGH COUNCIL DELIBERATION ASSEMBLY
                    </h3>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#C5A66A]/15 text-[#C5A66A] border border-[#C5A66A]/30">
                      Behavioral Evaluation
                    </span>
                  </div>
                  <p className="text-xs text-[#A5AD9D]">
                    {deliberationPolicy.name} • {deliberationPolicy.category} • Cost: {deliberationPolicy.costPoliticalCapital} Political Capital
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setDeliberationPolicy(null);
                  setDeliberationData(null);
                }}
                className="text-[#A5AD9D] hover:text-[#EAE3D2] p-1.5 rounded hover:bg-[#C5A66A]/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Chamber Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isLoadingDeliberation ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
                  <div className="w-10 h-10 border-2 border-[#C5A66A] border-t-transparent rounded-full animate-spin" />
                  <span className="font-serif text-sm font-bold text-[#D8CBAA]">
                    SYNTHESIZING HUMAN EVOLUTIONARY BEHAVIORAL PREDICTIONS...
                  </span>
                  <p className="text-xs text-[#A5AD9D] max-w-md">
                    Evaluating loss aversion coefficients, fairness sensitivities, and demographic responses across all living strata.
                  </p>
                </div>
              ) : deliberationData ? (
                <>
                  {/* Overview Banner & Chamber Consensus */}
                  <div className="p-4 rounded bg-[#171D18] border border-[#C5A66A]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#A5AD9D] block">COUNCIL FLOOR STATUS</span>
                      <h4 className="font-serif text-base font-bold text-[#EAE3D2]">
                        {deliberationData.council_deliberation?.chamber_status || 'Council Deliberation In Progress'}
                      </h4>
                      <p className="text-xs text-[#A5AD9D] mt-0.5">
                        {deliberationData.council_deliberation?.proposer_right}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-center px-3 py-1.5 rounded bg-[#8FA879]/15 border border-[#8FA879]/40">
                        <span className="text-[10px] font-mono uppercase text-[#8FA879] block font-bold">YEAS</span>
                        <span className="text-lg font-serif font-bold text-[#8FA879]">
                          {deliberationData.council_deliberation?.vote_summary?.yea ?? 3}
                        </span>
                      </div>
                      <div className="text-center px-3 py-1.5 rounded bg-[#C87569]/15 border border-[#C87569]/40">
                        <span className="text-[10px] font-mono uppercase text-[#C87569] block font-bold">NAYS</span>
                        <span className="text-lg font-serif font-bold text-[#C87569]">
                          {deliberationData.council_deliberation?.vote_summary?.nay ?? 1}
                        </span>
                      </div>
                      <div className="text-center px-3 py-1.5 rounded bg-[#D6A75E]/15 border border-[#D6A75E]/40">
                        <span className="text-[10px] font-mono uppercase text-[#D6A75E] block font-bold">ABSTAIN</span>
                        <span className="text-lg font-serif font-bold text-[#D6A75E]">
                          {deliberationData.council_deliberation?.vote_summary?.abstain ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Advisor Deliberation Floor */}
                  <div>
                    <h4 className="text-xs font-serif font-bold tracking-wider text-[#C5A66A] uppercase mb-3 flex items-center gap-2">
                      <Vote className="w-4 h-4 text-[#C5A66A]" />
                      COUNCIL TRIBUNES DEBATE & DELIBERATION
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {deliberationData.council_deliberation?.advisors?.map((advisor: any, idx: number) => {
                        const isYea = advisor.vote === 'Yea';
                        const isNay = advisor.vote === 'Nay';

                        return (
                          <div
                            key={idx}
                            className="p-4 rounded bg-[#171D18] border border-[#C5A66A]/20 flex flex-col justify-between space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                <span className="text-2xl">{advisor.avatar}</span>
                                <div>
                                  <h5 className="font-serif text-sm font-bold text-[#EAE3D2]">{advisor.name}</h5>
                                  <span className="text-[10px] text-[#A5AD9D] font-mono block">{advisor.title}</span>
                                </div>
                              </div>

                              <span
                                className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                                  isYea
                                    ? 'bg-[#8FA879]/20 text-[#8FA879] border-[#8FA879]/50'
                                    : isNay
                                    ? 'bg-[#C87569]/20 text-[#C87569] border-[#C87569]/50'
                                    : 'bg-[#D6A75E]/20 text-[#D6A75E] border-[#D6A75E]/50'
                                }`}
                              >
                                {advisor.vote}
                              </span>
                            </div>

                            <p className="text-xs text-[#D8CBAA] leading-relaxed italic bg-[#202820]/60 p-2.5 rounded border border-[#C5A66A]/10">
                              "{advisor.argument}"
                            </p>

                            <div className="text-[10px] font-mono text-[#A5AD9D] flex items-center justify-between pt-1 border-t border-[#C5A66A]/10">
                              <span>Priority:</span>
                              <strong className="text-[#C5A66A]">{advisor.domain_priority}</strong>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Backend Human Evolutionary ML Prediction Card */}
                  <div className="p-5 rounded bg-gradient-to-br from-[#1C261E] to-[#171D18] border-2 border-[#8FA879]/40 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#8FA879]/20 pb-3">
                      <div className="flex items-center gap-2.5">
                        <Brain className="w-5 h-5 text-[#8FA879]" />
                        <div>
                          <h4 className="font-serif text-sm font-bold text-[#EAE3D2] uppercase tracking-wide">
                            BACKEND HUMAN EVOLUTIONARY BEHAVIORAL MODEL (E-BAN)
                          </h4>
                          <span className="text-[10px] text-[#A5AD9D] font-mono">
                            Trained on Anthropological Evolution & Civilization Simulation History
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-mono">
                        <span className="text-[#A5AD9D]">Model Confidence:</span>
                        <strong className="text-[#8FA879]">
                          {Math.round((deliberationData.model_status?.model_confidence || 0.88) * 100)}%
                        </strong>
                      </div>
                    </div>

                    {/* Overall Public Approval Meter */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline text-xs">
                        <span className="font-serif font-bold text-[#EAE3D2]">
                          Overall Population Approval Rating:
                        </span>
                        <span className="font-mono text-base font-bold text-[#8FA879]">
                          {deliberationData.population_reaction?.overall_approval_pct}% In Favor
                        </span>
                      </div>

                      {/* Multi-tier Approval Bar */}
                      <div className="w-full h-3 rounded-full bg-[#171D18] overflow-hidden flex border border-[#C5A66A]/20">
                        <div
                          className="bg-[#8FA879] h-full transition-all duration-500"
                          style={{ width: `${deliberationData.population_reaction?.in_favor_pct || 60}%` }}
                          title="In Favor"
                        />
                        <div
                          className="bg-[#D6A75E] h-full transition-all duration-500"
                          style={{ width: `${deliberationData.population_reaction?.neutral_pct || 25}%` }}
                          title="Neutral / Skeptical"
                        />
                        <div
                          className="bg-[#C87569] h-full transition-all duration-500"
                          style={{ width: `${deliberationData.population_reaction?.opposed_pct || 15}%` }}
                          title="Opposed"
                        />
                      </div>

                      <div className="flex justify-between text-[10px] font-mono text-[#A5AD9D]">
                        <span className="text-[#8FA879]">● In Favor: {deliberationData.population_reaction?.in_favor_pct}%</span>
                        <span className="text-[#D6A75E]">● Neutral: {deliberationData.population_reaction?.neutral_pct}%</span>
                        <span className="text-[#C87569]">● Opposed: {deliberationData.population_reaction?.opposed_pct}%</span>
                      </div>
                    </div>

                    {/* Evolutionary Behavioral Synthesis */}
                    <div className="p-3 bg-[#171D18]/90 rounded border border-[#C5A66A]/20">
                      <span className="text-[10px] font-mono uppercase text-[#C5A66A] font-bold block mb-1">
                        Evolutionary Behavioral Synthesis
                      </span>
                      <p className="text-xs text-[#EAE3D2] leading-relaxed">
                        {deliberationData.population_reaction?.evolutionary_synthesis}
                      </p>
                    </div>

                    {/* Demographic Cohort Breakdown */}
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#A5AD9D] font-bold block mb-2">
                        Demographic Cohort Reactions
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {deliberationData.population_reaction?.cohort_breakdown?.map((cohort: any, idx: number) => (
                          <div key={idx} className="p-2.5 rounded bg-[#171D18] border border-[#C5A66A]/15 space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-serif font-bold text-[#EAE3D2] text-[11px]">{cohort.cohort}</span>
                              <span className="font-mono font-bold text-[#8FA879]">{cohort.approval_pct}%</span>
                            </div>
                            <p className="text-[10px] text-[#A5AD9D] leading-tight">
                              {cohort.core_instinct}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Projected Societal Deltas */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#8FA879]/20 text-center font-mono text-xs">
                      <div className="p-2 rounded bg-[#171D18]">
                        <span className="text-[9px] uppercase text-[#A5AD9D] block">Δ Happiness</span>
                        <strong className={deliberationData.population_reaction?.projected_deltas?.happiness_delta >= 0 ? 'text-[#8FA879]' : 'text-[#C87569]'}>
                          {deliberationData.population_reaction?.projected_deltas?.happiness_delta >= 0 ? '+' : ''}
                          {deliberationData.population_reaction?.projected_deltas?.happiness_delta} pts
                        </strong>
                      </div>
                      <div className="p-2 rounded bg-[#171D18]">
                        <span className="text-[9px] uppercase text-[#A5AD9D] block">Δ Stability</span>
                        <strong className={deliberationData.population_reaction?.projected_deltas?.stability_delta >= 0 ? 'text-[#8FA879]' : 'text-[#C87569]'}>
                          {deliberationData.population_reaction?.projected_deltas?.stability_delta >= 0 ? '+' : ''}
                          {deliberationData.population_reaction?.projected_deltas?.stability_delta} pts
                        </strong>
                      </div>
                      <div className="p-2 rounded bg-[#171D18]">
                        <span className="text-[9px] uppercase text-[#A5AD9D] block">Δ Research Speed</span>
                        <strong className="text-[#C5A66A]">
                          +{deliberationData.population_reaction?.projected_deltas?.research_velocity_pct}%
                        </strong>
                      </div>
                      <div className="p-2 rounded bg-[#171D18]">
                        <span className="text-[9px] uppercase text-[#A5AD9D] block">Protest Risk</span>
                        <strong className="text-[#D6A75E]">
                          {Math.round((deliberationData.population_reaction?.projected_deltas?.protest_risk_probability || 0.05) * 100)}%
                        </strong>
                      </div>
                    </div>

                    {/* Real Citizen Reaction Quotes */}
                    {deliberationData.population_reaction?.citizen_quotes?.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-[#8FA879]/20">
                        <span className="text-[10px] font-mono uppercase text-[#A5AD9D] font-bold block flex items-center gap-1.5">
                          <Quote className="w-3 h-3 text-[#C5A66A]" /> Living Citizen Reactions
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {deliberationData.population_reaction.citizen_quotes.map((q: any, i: number) => (
                            <div key={i} className="p-2.5 rounded bg-[#171D18] border border-[#C5A66A]/10 text-xs">
                              <p className="text-[#D8CBAA] italic">"{q.quote}"</p>
                              <div className="mt-1 flex items-center justify-between text-[10px] text-[#A5AD9D] font-mono">
                                <strong className="text-[#C5A66A]">{q.author}</strong>
                                <span>{q.role}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {/* Bottom Decision Footer */}
            <div className="flex-shrink-0 px-6 py-4 bg-[#171D18] border-t border-[#C5A66A]/30 flex items-center justify-between">
              <span className="text-xs font-mono text-[#A5AD9D]">
                Imperial Enactment will deduct <strong className="text-[#C5A66A]">{deliberationPolicy.costPoliticalCapital} Cap</strong> and feed real outcome to backend model.
              </span>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setDeliberationPolicy(null);
                    setDeliberationData(null);
                  }}
                  className="px-4 py-2 border border-[#C5A66A]/30 text-xs font-serif text-[#A5AD9D] hover:text-[#EAE3D2] rounded transition-colors"
                >
                  Return to Floor
                </button>

                <button
                  onClick={() => confirmEnactOrRepeal(deliberationPolicy)}
                  className={`px-5 py-2 text-xs font-serif font-bold uppercase tracking-wider rounded transition-all shadow-lg ${
                    deliberationPolicy.isActive
                      ? 'bg-[#C87569] text-white hover:bg-red-700'
                      : 'bg-[#C5A66A] text-[#171D18] hover:bg-[#D8CBAA]'
                  }`}
                >
                  {deliberationPolicy.isActive ? 'Confirm Repeal Decree' : 'Authorize & Ratify Edict'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAFT CUSTOM POLICY / PROPOSE EDICT MODAL */}
      {/* ========================================================================= */}
      {isDraftingCustom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl bg-[#1D251E] border-2 border-[#C5A66A]/70 rounded shadow-2xl p-6 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-[#C5A66A]/30">
              <div className="flex items-center gap-2.5">
                <PlusCircle className="w-5 h-5 text-[#C5A66A]" />
                <h3 className="font-serif text-lg font-bold text-[#EAE3D2]">
                  PROPOSE SOVEREIGN CUSTOM POLICY
                </h3>
              </div>
              <button onClick={() => setIsDraftingCustom(false)} className="text-[#A5AD9D] hover:text-[#EAE3D2]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomPolicy} className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[#A5AD9D] font-mono text-[10px] uppercase block mb-1">
                    Edict Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Open Scientific Knowledge Accord"
                    value={customForm.name}
                    onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#171D18] border border-[#C5A66A]/30 rounded text-[#EAE3D2] focus:border-[#C5A66A] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#A5AD9D] font-mono text-[10px] uppercase block mb-1">
                    Policy Domain / Category
                  </label>
                  <select
                    value={customForm.category}
                    onChange={(e) => setCustomForm({ ...customForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-[#171D18] border border-[#C5A66A]/30 rounded text-[#EAE3D2] focus:border-[#C5A66A] outline-none"
                  >
                    <option value="Research">Research & Science</option>
                    <option value="Economic">Economic & Fiscal</option>
                    <option value="Labor">Labor & Workforce</option>
                    <option value="Environmental">Ecological & Biosphere</option>
                    <option value="AI">AI & Algorithmic Ethics</option>
                    <option value="Social">Civic Liberties & Social</option>
                    <option value="Education">Education & Institutions</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[#A5AD9D] font-mono text-[10px] uppercase block mb-1">
                  Edict Purpose & Societal Rationale
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the mandate, target institutions, and intended municipal transformation..."
                  value={customForm.description}
                  onChange={(e) => setCustomForm({ ...customForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#171D18] border border-[#C5A66A]/30 rounded text-[#EAE3D2] focus:border-[#C5A66A] outline-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[#A5AD9D] font-mono text-[10px] uppercase block mb-1">
                    Political Capital Cost
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="600"
                    value={customForm.costPoliticalCapital}
                    onChange={(e) => setCustomForm({ ...customForm, costPoliticalCapital: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#171D18] border border-[#C5A66A]/30 rounded text-[#C5A66A] font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#A5AD9D] font-mono text-[10px] uppercase block mb-1">
                    Primary Lever Name
                  </label>
                  <input
                    type="text"
                    value={customForm.sliderLabel}
                    onChange={(e) => setCustomForm({ ...customForm, sliderLabel: e.target.value })}
                    className="w-full px-3 py-2 bg-[#171D18] border border-[#C5A66A]/30 rounded text-[#EAE3D2] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#A5AD9D] font-mono text-[10px] uppercase block mb-1">
                    Calibrated Intensity ({customForm.sliderValue}{customForm.unit})
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={customForm.sliderValue}
                    onChange={(e) => setCustomForm({ ...customForm, sliderValue: Number(e.target.value) })}
                    className="w-full accent-[#C5A66A] mt-2"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#171D18] border border-[#C5A66A]/20 rounded space-y-2">
                <span className="text-[10px] font-mono uppercase text-[#8FA879] font-bold block">
                  Evolutionary Behavioral Safeguard
                </span>
                <p className="text-[11px] text-[#A5AD9D] leading-relaxed">
                  Upon submission, your custom edict will be subjected to rigorous Council Deliberation and analyzed by the backend self-learning model to evaluate evolutionary human responses across all social cohorts.
                </p>
              </div>

              <div className="pt-3 border-t border-[#C5A66A]/20 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDraftingCustom(false)}
                  className="px-4 py-2 border border-[#C5A66A]/30 text-xs font-serif text-[#A5AD9D] hover:text-[#EAE3D2] rounded"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-serif font-bold uppercase tracking-wider rounded bg-[#C5A66A] text-[#171D18] hover:bg-[#D8CBAA] transition-colors"
                >
                  Submit to Deliberation Assembly
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Deterministic evolutionary behavioral fallback in case of network disconnection
function createEvolutionaryFallbackDeliberation(policy: Policy, resources: any) {
  const isResearch = policy.category === 'Research' || policy.name.toLowerCase().includes('science') || policy.name.toLowerCase().includes('ai');
  const isWelfare = policy.category === 'Social' || policy.name.toLowerCase().includes('income') || policy.name.toLowerCase().includes('welfare');

  const approval = isResearch ? 76.5 : (isWelfare ? 72.0 : 64.0);

  return {
    policy_name: policy.name,
    category: policy.category,
    model_status: {
      model_type: 'Evolutionary Behavioral Adaptation Network (E-BAN)',
      total_learned_instances: 19,
      model_confidence: 0.89,
    },
    population_reaction: {
      overall_approval_pct: approval,
      in_favor_pct: approval,
      neutral_pct: 16.0,
      opposed_pct: Math.max(4.0, 100 - approval - 16.0),
      evolutionary_synthesis: 'Evolutionary consensus aligns with high reciprocal fitness. The populace instinctively perceives the policy as an amplifier of societal prosperity.',
      cohort_breakdown: [
        { cohort: 'Founding Pioneers & Agrarian Elders', approval_pct: approval - 10, core_instinct: 'Ancestral security, preservation of hard-earned stores.' },
        { cohort: 'Industrial & Logistics Workforce', approval_pct: approval - 4, core_instinct: 'Equitable resource distribution and labor dignity.' },
        { cohort: 'Scholars, Academics & Engineers', approval_pct: Math.min(96, approval + 15), core_instinct: 'Epistemic curiosity and technological agency.' },
        { cohort: 'Youth & Emerging Demographic', approval_pct: Math.min(94, approval + 10), core_instinct: 'Generational equity and long-term future optimism.' }
      ],
      projected_deltas: {
        happiness_delta: policy.effectsSummary.happinessModifier || 3.0,
        stability_delta: policy.effectsSummary.stabilityModifier || 1.5,
        research_velocity_pct: isResearch ? 18.0 : 2.0,
        protest_risk_probability: 0.08
      },
      citizen_quotes: [
        {
          author: 'Dr. Elian Mercer',
          role: 'Senior Physicist, Quantum Research Enclave',
          quote: 'If we hesitate on research, our civilization stagnates. Unlocking these discoveries secures our collective survival.'
        },
        {
          author: 'Daria Vance',
          role: 'Chief Logistics Machinist, Foundry Block 4',
          quote: 'Progress is magnificent, provided it enhances our tools rather than rendering our apprentices obsolete.'
        }
      ]
    },
    council_deliberation: {
      chamber_status: 'Approved by Council Consensus',
      vote_summary: { yea: 3, nay: 1, abstain: 0, total: 4 },
      proposer_right: 'As Sovereign Governor, you possess Imperial Veto and Casting Authority.',
      advisors: [
        {
          name: 'Dr. Aris Vance',
          title: 'Science & Technology Tribune',
          avatar: '🔬',
          vote: 'Yea',
          argument: `Authoritative advancement! The '${policy.name}' mandate channels critical energy into cognitive leverage and technological superiority.`,
          domain_priority: 'Research Velocity & Epistemic Evolution'
        },
        {
          name: 'Lyra Chen',
          title: 'Civil Tribune & Social Welfare',
          avatar: '🕊️',
          vote: 'Yea',
          argument: 'Evolutionary human history demonstrates that when the High Directorate invests directly in citizen wellbeing, social cohesion multiplies fourfold.',
          domain_priority: 'Citizen Happiness & Equity Safeguards'
        },
        {
          name: 'Marcus Sterling',
          title: 'Economic & Trade Overseer',
          avatar: '⚖️',
          vote: 'Abstain',
          argument: 'Caution on administrative overhead. We must ensure productive recoupment of expended political capital.',
          domain_priority: 'Fiscal Solvency & Resource Productivity'
        },
        {
          name: 'Aria Sol',
          title: 'Ecological & Biosphere Steward',
          avatar: '🌿',
          vote: 'Yea',
          argument: 'The environmental fallout remains well within biospheric carrying capacity.',
          domain_priority: 'Biospheric Carrying Capacity'
        }
      ]
    }
  };
}

export default PolicyLaboratoryPage;
