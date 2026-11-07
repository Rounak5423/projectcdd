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
} from 'lucide-react';
import { useGameState } from '../context/GameStateContext';
import { Policy } from '../types/game';

export default function PolicyLaboratoryPage() {
  const { policies, resources, togglePolicy, updatePolicySlider, triggerToast } = useGameState();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const activePolicies = policies.filter((p) => p.isActive);
  const inactivePolicies = policies.filter((p) => !p.isActive);

  const filteredPolicies = policies.filter((p) => {
    if (selectedFilter === 'active') return p.isActive;
    if (selectedFilter === 'inactive') return !p.isActive;
    if (selectedFilter !== 'all') return p.category.toLowerCase().includes(selectedFilter.toLowerCase());
    return true;
  });

  const getPolicyBorder = (category: string, isActive: boolean) => {
    if (!isActive) return 'border-[#263529] bg-[#101712] opacity-80';
    if (category.includes('AI')) return 'border-[#818cf8] bg-gradient-to-b from-[#181a30] via-[#121424] to-[#0c0e17] ring-1 ring-[#818cf8]/50 shadow-[0_0_20px_rgba(129,140,248,0.2)]';
    if (category.includes('Income') || category.includes('Economic')) return 'border-[#eab308] bg-gradient-to-b from-[#2a2412] via-[#1f1a0d] to-[#121008] ring-1 ring-[#eab308]/50 shadow-[0_0_20px_rgba(234,179,8,0.2)]';
    if (category.includes('Environmental')) return 'border-[#22c55e] bg-gradient-to-b from-[#0d2616] via-[#0b1c11] to-[#07130b] ring-1 ring-[#22c55e]/50 shadow-[0_0_20px_rgba(34,197,94,0.2)]';
    return 'border-[#38bdf8] bg-gradient-to-b from-[#0f2438] via-[#0b1926] to-[#07101a] ring-1 ring-[#38bdf8]/50 shadow-[0_0_20px_rgba(56,189,248,0.2)]';
  };

  const getPolicyCategoryBadge = (category: string) => {
    if (category.includes('AI')) return 'bg-[#312e81] text-[#c7d2fe] border-[#4338ca]';
    if (category.includes('Income') || category.includes('Economic')) return 'bg-[#422006] text-[#fef08a] border-[#854d0e]';
    if (category.includes('Environmental')) return 'bg-[#052e16] text-[#bbf7d0] border-[#166534]';
    return 'bg-[#082f49] text-[#bae6fd] border-[#0369a1]';
  };

  const handleToggle = (policy: Policy) => {
    togglePolicy(policy.id);
    triggerToast({
      type: policy.isActive ? 'info' : 'reward',
      title: policy.isActive ? `EDICT REPEALED: ${policy.name}` : `CIVIC RATIFIED: ${policy.name}`,
      subtitle: policy.isActive
        ? 'Political capital refunded. Modifiers deactivated.'
        : `Active in Government Cabinet. GDP ${policy.effectsSummary.gdpModifier > 0 ? '+' : ''}${policy.effectsSummary.gdpModifier}%`,
    });
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#0b100d] text-[#e8ece9] select-none overflow-y-auto custom-scrollbar p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#213024] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="eyebrow text-[#d4af37]">CIVILISATION POLICY CABINET</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
          </div>
          <h1 className="text-2xl font-bold text-[#f1f5f2] mt-0.5">
            Government Civics & Systemic Edicts
          </h1>
          <p className="text-xs text-[#7d9480] mt-1">
            Slot active policy cards into your High Directorate cabinet. Calibrate AI assistance quotas and social contracts.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#0a100c] p-3 rounded-xl border border-[#1b261e] text-xs font-mono">
          <div>
            <span className="text-[#7d9480] block text-[10px]">POLITICAL CAPITAL</span>
            <span className="text-sm font-bold text-[#d4af37]">
              {resources.politicalCapital} / 1000 Cap
            </span>
          </div>
          <div className="w-px h-6 bg-[#1a251c]" />
          <div>
            <span className="text-[#7d9480] block text-[10px]">ACTIVE CABINET SLOTS</span>
            <span className="text-sm font-bold text-[#4ade80]">
              {activePolicies.length} / 6 Slotted
            </span>
          </div>
        </div>
      </div>

      {/* ================= CIV VI GOVERNMENT CABINET DOCK (SLOTTED CARDS) ================= */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-bold tracking-wider text-[#d4af37] uppercase flex items-center gap-1.5">
            <Crown size={14} className="text-[#d4af37]" />
            HIGH DIRECTORATE ACTIVE CABINET SLOTS
          </span>
          <span className="text-[11px] font-mono text-[#7d9480]">
            Pioneer Directorate: 4 Core Slots + 2 Wildcard Slots
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {activePolicies.slice(0, 4).map((p) => (
            <div
              key={p.id}
              className={`p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between ${getPolicyBorder(
                p.category,
                true
              )}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${getPolicyCategoryBadge(
                      p.category
                    )}`}
                  >
                    {p.category}
                  </span>
                  <div className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
                </div>
                <h4 className="text-xs font-bold text-[#f1f5f2] mt-2 line-clamp-1">{p.name}</h4>
                <p className="text-[10px] text-[#7d9480] mt-0.5 font-mono">
                  {p.sliderLabel}: {p.sliderValue} {p.unit}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#4ade80]">
                  +{p.effectsSummary.gdpModifier}% GDP
                </span>
                <button
                  onClick={() => handleToggle(p)}
                  className="px-2 py-0.5 rounded bg-red-950/80 hover:bg-red-900 text-[#fca5a5] border border-red-800 text-[9px] font-bold"
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
              className="p-4 rounded-xl border-2 border-dashed border-[#223325] bg-[#0c120e] flex flex-col items-center justify-center text-center text-[#7d9480]"
            >
              <div className="w-8 h-8 rounded-full border border-[#223325] flex items-center justify-center mb-1 text-sm font-serif">
                🏛️
              </div>
              <span className="text-xs font-mono font-bold text-[#8e9c8c]">EMPTY CABINET SLOT</span>
              <span className="text-[10px] text-[#556957] mt-0.5">Ratify a civic policy below to slot</span>
            </div>
          ))}
        </div>
      </div>

      {/* ================= FILTER PILLS ================= */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
        {[
          { id: 'all', label: 'All Policy Edicts' },
          { id: 'active', label: 'Active In Cabinet' },
          { id: 'inactive', label: 'Available In Archive' },
          { id: 'ai', label: 'AI & Automation' },
          { id: 'income', label: 'Welfare & UBI' },
          { id: 'environment', label: 'Ecological Purity' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              selectedFilter === f.id
                ? 'bg-[#273a2b] text-[#4ade80] border border-[#3b5941] font-bold shadow-sm'
                : 'bg-[#101712] text-[#7d9480] hover:text-[#f1f5f2]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ================= ALL POLICY CARDS GRID ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredPolicies.map((policy) => {
          const canEnact = resources.politicalCapital >= policy.costPoliticalCapital;

          return (
            <div
              key={policy.id}
              className={`panel p-5 flex flex-col justify-between border-2 transition-all ${getPolicyBorder(
                policy.category,
                policy.isActive
              )}`}
            >
              <div>
                {/* Card Top Title Row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${getPolicyCategoryBadge(
                        policy.category
                      )}`}
                    >
                      {policy.category}
                    </span>
                    <h3 className="text-base font-bold text-[#f1f5f2] mt-1.5">{policy.name}</h3>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                      policy.isActive
                        ? 'bg-[#14532d] text-[#bbf7d0] border border-[#22c55e]'
                        : 'bg-black/50 text-[#7d9480] border border-[#223325]'
                    }`}
                  >
                    {policy.isActive ? 'SLOTTED' : 'ARCHIVED'}
                  </span>
                </div>

                <p className="text-xs text-[#a2b29f] mt-2 leading-relaxed">
                  {policy.description}
                </p>

                {/* Interactive Calibration Slider */}
                <div className="mt-4 p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#a2b29f] font-medium">{policy.sliderLabel}</span>
                    <span className="font-mono font-bold text-[#d4af37]">
                      {policy.sliderValue} {policy.unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={policy.minVal}
                    max={policy.maxVal}
                    value={policy.sliderValue}
                    onChange={(e) => updatePolicySlider(policy.id, Number(e.target.value))}
                    className="w-full accent-[#4ade80]"
                  />
                </div>

                {/* Benefits & Tradeoff Risks */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-[#4ade80] font-bold block">
                      Guaranteed Perks
                    </span>
                    {policy.expectedBenefits.map((b, i) => (
                      <p key={i} className="text-[11px] text-[#c6d4c8] flex items-start gap-1">
                        <span className="text-[#4ade80] font-bold">✓</span> {b}
                      </p>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-[#f87171] font-bold block">
                      Systemic Tradeoffs
                    </span>
                    {policy.risks.map((r, i) => (
                      <p key={i} className="text-[11px] text-[#fca5a5] flex items-start gap-1">
                        <span className="text-[#f87171] font-bold">!</span> {r}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs font-mono text-[#7d9480]">
                  Ratification: <span className="text-[#d4af37] font-bold">{policy.costPoliticalCapital} Cap</span>
                </span>

                <button
                  disabled={!policy.isActive && !canEnact}
                  onClick={() => handleToggle(policy)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    policy.isActive
                      ? 'bg-red-950 hover:bg-red-900 text-[#fca5a5] border border-red-700 shadow-md'
                      : canEnact
                      ? 'btn-game-gold text-[#0a0f0b]'
                      : 'bg-[#182019] text-[#556957] cursor-not-allowed border border-[#223325]'
                  }`}
                >
                  <Power size={13} />
                  <span>
                    {policy.isActive
                      ? 'Repeal & Unslot Policy'
                      : canEnact
                      ? 'Ratify & Slot into Cabinet'
                      : 'Insufficient Capital'}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
