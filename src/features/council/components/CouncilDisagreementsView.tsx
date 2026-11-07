import React from 'react';
import { CouncilTradeOffConflict } from '../types/council';
import { soundFx } from '../../../services/soundFx';
import { AlertCircle, Scale, ArrowRight, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

interface CouncilDisagreementsViewProps {
  tradeoffs: CouncilTradeOffConflict[];
  onAdoptCompromise?: (tradeoff: CouncilTradeOffConflict) => void;
}

export const CouncilDisagreementsView: React.FC<CouncilDisagreementsViewProps> = ({
  tradeoffs,
  onAdoptCompromise,
}) => {
  if (tradeoffs.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-[#151915]/60 border border-[#2B372C] rounded text-center">
        <Scale className="w-10 h-10 text-[#8FA879] mb-3 opacity-80" />
        <h3 className="font-serif text-base font-bold text-[#EAE3D2]">
          Harmonious Ministerial Consensus
        </h3>
        <p className="text-xs text-[#A5AD9D] max-w-md mt-1">
          No irreconcilable policy trade-offs detected across the six ministerial portfolios.
          The Council's analytical engines are aligned on civilisational priorities.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col space-y-4 overflow-y-auto pr-1">
      {/* Header Banner */}
      <div className="p-4 rounded bg-[#17231B] border border-[#C5A66A]/30 flex items-start gap-3">
        <Scale className="w-5 h-5 text-[#C5A66A] mt-0.5 shrink-0" />
        <div>
          <h2 className="font-serif text-sm font-bold text-[#EAE3D2] uppercase tracking-wider">
            Cross-Domain Ministerial Trade-Offs & Conflicts
          </h2>
          <p className="text-xs text-[#A5AD9D] mt-0.5">
            The Council's analytical models have identified {tradeoffs.length} genuine systemic contradictions.
            As sovereign, your decree must resolve these competing civilisational imperatives.
          </p>
        </div>
      </div>

      {/* Conflicts List */}
      <div className="space-y-4">
        {tradeoffs.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded bg-[#151915] border border-[#3B4D3C] hover:border-[#C5A66A]/40 transition-colors shadow-lg"
          >
            {/* Title & Objectives */}
            <div className="flex items-center justify-between border-b border-[#2B372C] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#E09F3E]" />
                <h3 className="font-serif text-sm font-bold text-[#EAE3D2]">
                  {item.conflictTitle}
                </h3>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#E09F3E]/20 text-[#E09F3E] border border-[#E09F3E]/30">
                Systemic Tension
              </span>
            </div>

            {/* Competing Objectives Tag */}
            <div className="mb-4 p-2.5 rounded bg-[#1A221B] border border-[#2B372C] text-xs font-mono text-[#C5A66A] flex items-center gap-2">
              <span className="font-bold text-[#EAE3D2]">Competing Objectives:</span>
              <span>{item.competingObjectives}</span>
            </div>

            {/* Opposing Stances Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Primary Advisor */}
              <div className="p-3.5 rounded bg-[#121713] border border-[#2B372C]">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#C5A66A]" />
                  <span className="font-serif text-xs font-bold text-[#EAE3D2]">
                    {item.advisorATitle}
                  </span>
                </div>
                <p className="text-xs text-[#A5AD9D] italic leading-relaxed">
                  "{item.advisorAStance}"
                </p>
              </div>

              {/* Competing Advisor */}
              <div className="p-3.5 rounded bg-[#121713] border border-[#2B372C]">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#8FA879]" />
                  <span className="font-serif text-xs font-bold text-[#EAE3D2]">
                    {item.advisorBTitle}
                  </span>
                </div>
                <p className="text-xs text-[#A5AD9D] italic leading-relaxed">
                  "{item.advisorBStance}"
                </p>
              </div>
            </div>

            {/* Potential Consequences */}
            <div className="mb-4 text-xs text-[#C87569] bg-[#C87569]/10 p-3 rounded border border-[#C87569]/20 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Risk of Inaction or Extreme Path: </strong>
                <span>{item.potentialConsequences}</span>
              </div>
            </div>

            {/* Compromise Directive & Action */}
            <div className="p-3.5 rounded bg-[#17231B] border border-[#8FA879]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-[#8FA879] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#8FA879] uppercase tracking-wider font-mono">
                    Synthetic Imperial Compromise
                  </h4>
                  <p className="text-xs text-[#EAE3D2] mt-0.5">
                    {item.potentialCompromise}
                  </p>
                </div>
              </div>

              {onAdoptCompromise && (
                <button
                  onClick={() => {
                    soundFx.playClick();
                    onAdoptCompromise(item);
                  }}
                  className="px-3.5 py-1.5 rounded bg-[#C5A66A] text-[#171D18] hover:bg-[#D4B87D] text-xs font-serif font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 shadow transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Adopt Compromise</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CouncilDisagreementsView;

