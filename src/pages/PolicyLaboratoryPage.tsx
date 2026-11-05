import React from 'react';
import {
  FlaskConical,
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
} from 'lucide-react';
import { useGameState } from '../context/GameStateContext';

export default function PolicyLaboratoryPage() {
  const { policies, resources, togglePolicy, updatePolicySlider } = useGameState();

  const activeCount = policies.filter((p) => p.isActive).length;

  return (
    <div className="p-6 lg:p-8 space-y-6 overflow-y-auto custom-scrollbar text-[#e8e9e3] max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#39443a] gap-4">
        <div>
          <span className="eyebrow text-[#c6a76a]">GOVERNANCE & SOCIAL CONTRACT</span>
          <h1 className="text-2xl font-bold text-[#f3f5ef] mt-0.5">Policy Laboratory</h1>
          <p className="text-xs text-[#9da99b] mt-1">
            Enact systemic edicts, calibrate automation quotas, mandate AI access, and manage societal tradeoffs.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#182119] p-3 rounded-xl border border-[#2e3c2f] text-xs font-mono">
          <div>
            <span className="text-[#9da99b] block text-[10px]">POLITICAL CAPITAL</span>
            <span className="text-sm font-bold text-[#c6a76a]">
              {resources.politicalCapital} / 1000
            </span>
          </div>
          <div className="w-px h-6 bg-[#2c392d]" />
          <div>
            <span className="text-[#9da99b] block text-[10px]">ACTIVE EDICTS</span>
            <span className="text-sm font-bold text-[#a6bd82]">{activeCount} Enacted</span>
          </div>
        </div>
      </div>

      {/* Policies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {policies.map((policy) => {
          const canEnact = resources.politicalCapital >= policy.costPoliticalCapital;

          return (
            <div
              key={policy.id}
              className={`panel p-6 flex flex-col justify-between transition-all ${policy.isActive
                ? 'bg-[#1a251c] border-[#4b6348] ring-1 ring-[#5b7a58] shadow-lg'
                : 'bg-[#182119] border-[#313f32] hover:border-[#4d614e]'
                }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#a6bd82] font-semibold">
                      {policy.category}
                    </span>
                    <h3 className="text-base font-bold text-[#f3f5ef] mt-0.5">{policy.name}</h3>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${policy.isActive
                      ? 'bg-[#293d2c] text-[#a6bd82] border border-[#435e46]'
                      : 'bg-[#232a24] text-[#8e9c8c] border border-[#354036]'
                      }`}
                  >
                    {policy.isActive ? 'ACTIVE EDICT' : 'INACTIVE'}
                  </span>
                </div>

                <p className="text-xs text-[#9da99b] mt-2 leading-relaxed">{policy.description}</p>

                {/* Interactive Slider Parameter */}
                <div className="mt-4 p-3 rounded-lg bg-[#131914] border border-[#253026] space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#8e9c8c] font-medium">{policy.sliderLabel}</span>
                    <span className="font-mono font-bold text-[#c6a76a]">
                      {policy.sliderValue} {policy.unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={policy.minVal}
                    max={policy.maxVal}
                    value={policy.sliderValue}
                    onChange={(e) => updatePolicySlider(policy.id, Number(e.target.value))}
                    className="w-full accent-[#a6bd82]"
                  />
                </div>

                {/* Tradeoffs: Benefits & Risks */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-[#a6bd82] font-bold block">
                      EXPECTED BENEFITS
                    </span>
                    {policy.expectedBenefits.map((b, i) => (
                      <p key={i} className="text-[11px] text-[#dce9ca] flex items-start gap-1">
                        <span className="text-[#a6bd82] font-bold">✓</span> {b}
                      </p>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-[#d47e69] font-bold block">
                      SYSTEMIC RISKS
                    </span>
                    {policy.risks.map((r, i) => (
                      <p key={i} className="text-[11px] text-[#e0b2a8] flex items-start gap-1">
                        <span className="text-[#d47e69] font-bold">!</span> {r}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Net Modifiers */}
                <div className="mt-4 pt-3 border-t border-[#283429] flex flex-wrap gap-2 text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-[#1f2820] text-[#a6bd82]">
                    GDP: {policy.effectsSummary.gdpModifier > 0 ? '+' : ''}
                    {policy.effectsSummary.gdpModifier}%
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#1f2820] text-[#c6a76a]">
                    Happiness: {policy.effectsSummary.happinessModifier > 0 ? '+' : ''}
                    {policy.effectsSummary.happinessModifier} pts
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#1f2820] text-[#82a6bd]">
                    Stability: {policy.effectsSummary.stabilityModifier > 0 ? '+' : ''}
                    {policy.effectsSummary.stabilityModifier} pts
                  </span>
                </div>
              </div>

              {/* Bottom Enact / Repeal Toggle Button */}
              <div className="mt-5 pt-3 border-t border-[#283429] flex items-center justify-between">
                <span className="text-xs font-mono text-[#9da99b]">
                  Cost: <span className="text-[#c6a76a] font-bold">{policy.costPoliticalCapital} Cap</span>
                </span>

                <button
                  disabled={!policy.isActive && !canEnact}
                  onClick={() => togglePolicy(policy.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${policy.isActive
                    ? 'bg-[#3b2724] hover:bg-[#4d322e] text-[#d47e69] border border-[#633a34]'
                    : canEnact
                      ? 'bg-[#3b4c37] hover:bg-[#4d6348] text-[#dce9ca] border border-[#5d7756] shadow-md'
                      : 'bg-[#222822] text-[#636e62] cursor-not-allowed border border-[#2f382f]'
                    }`}
                >
                  <Power size={13} />
                  <span>
                    {policy.isActive
                      ? 'Repeal Policy Edict'
                      : canEnact
                        ? 'Ratify & Enact Edict'
                        : 'Insufficient Political Capital'}
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
