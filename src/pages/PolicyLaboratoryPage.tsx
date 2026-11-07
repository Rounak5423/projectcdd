import React, { useState } from 'react';
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
  BookOpen
} from 'lucide-react';
import { useGameState } from '../context/GameStateContext';
import { Policy } from '../types/game';
import { soundFx } from '../services/soundFx';

interface PolicyLaboratoryPageProps {
  onClose?: () => void;
}

const DOMAINS = [
  { id: 'all', label: 'All Domains' },
  { id: 'active', label: 'Enacted In Cabinet' },
  { id: 'Economic', label: 'Economic & Fiscal' },
  { id: 'Labor', label: 'Labor & Workforce' },
  { id: 'Environmental', label: 'Ecological & Energy' },
  { id: 'AI', label: 'AI & Research Ethics' },
  { id: 'Social', label: 'Civic Liberties & Social' },
  { id: 'Education', label: 'Education & Institutions' },
];

export const PolicyLaboratoryPage: React.FC<PolicyLaboratoryPageProps> = ({ onClose }) => {
  const { policies, resources, togglePolicy, updatePolicySlider, triggerToast, civilization } = useGameState();
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [pendingPolicy, setPendingPolicy] = useState<Policy | null>(null);

  const activePolicies = policies.filter((p) => p.isActive);

  const filteredPolicies = policies.filter((p) => {
    if (selectedDomain === 'active') return p.isActive;
    if (selectedDomain === 'all') return true;
    return p.category.toLowerCase().includes(selectedDomain.toLowerCase());
  });

  const confirmEnactOrRepeal = (policy: Policy) => {
    soundFx.playReward();
    togglePolicy(policy.id);
    setPendingPolicy(null);
    triggerToast({
      type: policy.isActive ? 'info' : 'reward',
      title: policy.isActive ? `EDICT REPEALED: ${policy.name}` : `IMPERIAL DECREE RATIFIED: ${policy.name}`,
      subtitle: policy.isActive
        ? 'Political capital refunded. Cabinet directives revised.'
        : `Enacted into High Directorate. Projected GDP impact: ${policy.effectsSummary.gdpModifier > 0 ? '+' : ''}${policy.effectsSummary.gdpModifier}%`,
    });
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
                POLICY LABORATORY & IMPERIAL EDICTS
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-[#C5A66A]/40 text-[#C5A66A] bg-[#C5A66A]/10">
                High Directorate Cabinet
              </span>
            </div>
            <p className="text-xs text-[#A5AD9D] font-sans mt-0.5">
              Calibrate civil decrees, simulate macroeconomic and ecological fallout, and ratify institutional covenants.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-[#171D18] p-2.5 rounded border border-[#C5A66A]/30 text-xs font-mono">
            <div>
              <span className="text-[#A5AD9D] block text-[10px]">POLITICAL CAPITAL</span>
              <span className="text-sm font-bold text-[#C5A66A]">
                {resources.politicalCapital} / 1000 Cap
              </span>
            </div>
            <div className="w-px h-6 bg-[#C5A66A]/20" />
            <div>
              <span className="text-[#A5AD9D] block text-[10px]">CONSENSUS STABILITY</span>
              <span className="text-sm font-bold text-[#8FA879]">
                91.4% Unified
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
        {/* Active Cabinet Slots (Civ VI Strategy Style) */}
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
                  <span className="text-xs font-mono text-[#8FA879] font-bold">
                    +{p.effectsSummary.gdpModifier}% GDP
                  </span>
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setPendingPolicy(p);
                    }}
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
                <span className="text-[10px] text-[#A5AD9D] mt-0.5">Ratify a policy decree below to slot</span>
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
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#171D18] border border-[#C5A66A]/30 text-[#C5A66A]">
                        {policy.category}
                      </span>
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

                {/* Bottom Ratify / Repeal Footer */}
                <div className="mt-5 pt-3 border-t border-[#C5A66A]/15 flex items-center justify-between">
                  <span className="text-xs font-mono text-[#A5AD9D]">
                    Ratification Cost: <strong className="text-[#C5A66A]">{policy.costPoliticalCapital} Cap</strong>
                  </span>

                  <button
                    disabled={!policy.isActive && !canEnact}
                    onClick={() => {
                      soundFx.playClick();
                      setPendingPolicy(policy);
                    }}
                    className={`px-4 py-2 rounded text-xs font-serif font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow ${
                      policy.isActive
                        ? 'bg-[#C87569]/20 hover:bg-[#C87569]/30 text-[#C87569] border border-[#C87569]/50'
                        : canEnact
                        ? 'bg-[#C5A66A] hover:bg-[#D8CBAA] text-[#171D18]'
                        : 'bg-[#171D18] text-[#A5AD9D]/40 border border-[#C5A66A]/10 cursor-not-allowed'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>
                      {policy.isActive
                        ? 'Repeal Policy'
                        : canEnact
                        ? 'Ratify Decree'
                        : 'Insufficient Capital'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal */}
      {pendingPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-[#202820] border-2 border-[#C5A66A]/50 rounded shadow-2xl p-6 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-[#C5A66A]/20">
              <div className="flex items-center gap-2.5">
                <FileCheck2 className="w-5 h-5 text-[#C5A66A]" />
                <h3 className="font-serif text-lg font-bold text-[#EAE3D2]">
                  {pendingPolicy.isActive ? 'Confirm Edict Repeal' : 'Confirm Decree Ratification'}
                </h3>
              </div>
              <button onClick={() => setPendingPolicy(null)} className="text-[#A5AD9D] hover:text-[#EAE3D2]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <p className="text-sm font-serif font-semibold text-[#EAE3D2]">
                {pendingPolicy.name}
              </p>
              <p className="text-[#A5AD9D] leading-relaxed">
                {pendingPolicy.description}
              </p>

              <div className="p-3 bg-[#171D18] border border-[#C5A66A]/20 rounded space-y-2 text-[#EAE3D2]">
                <div className="flex justify-between">
                  <span>Political Capital Impact:</span>
                  <strong className="text-[#C5A66A]">
                    {pendingPolicy.isActive ? `+${pendingPolicy.costPoliticalCapital} Cap Refunded` : `-${pendingPolicy.costPoliticalCapital} Cap Deducted`}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Calibrated Level:</span>
                  <strong className="font-mono">{pendingPolicy.sliderValue} {pendingPolicy.unit}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Projected GDP Impact:</span>
                  <strong className="text-[#8FA879]">+{pendingPolicy.effectsSummary.gdpModifier}% / cycle</strong>
                </div>
              </div>

              <p className="text-[11px] text-[#D8CBAA] italic">
                {pendingPolicy.isActive
                  ? 'Repealing this edict will immediately suspend all associated industrial and civilian bonuses.'
                  : 'Ratification is authoritative and binds imperial resources to enforcement across all municipal sectors.'}
              </p>
            </div>

            <div className="pt-3 border-t border-[#C5A66A]/20 flex justify-end gap-3">
              <button
                onClick={() => setPendingPolicy(null)}
                className="px-4 py-2 border border-[#C5A66A]/30 text-xs font-serif text-[#A5AD9D] hover:text-[#EAE3D2] rounded"
              >
                Abort
              </button>
              <button
                onClick={() => confirmEnactOrRepeal(pendingPolicy)}
                className={`px-5 py-2 text-xs font-serif font-bold uppercase tracking-wider rounded transition-colors ${
                  pendingPolicy.isActive
                    ? 'bg-[#C87569] text-white hover:bg-red-700'
                    : 'bg-[#C5A66A] text-[#171D18] hover:bg-[#D8CBAA]'
                }`}
              >
                {pendingPolicy.isActive ? 'Confirm Repeal' : 'Enact Edict'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PolicyLaboratoryPage;
