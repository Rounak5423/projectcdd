import React, { useState } from 'react';
import { Advisor, AdvisorBriefingData } from '../types/advisor';
import { soundFx } from '../../../services/soundFx';
import {
  FileText,
  Quote,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface AdvisorBriefingProps {
  advisor: Advisor;
}

export const AdvisorBriefing: React.FC<AdvisorBriefingProps> = ({ advisor }) => {
  const briefing = advisor.currentBriefing;
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-[#171D18]/90 border border-[#2B372C] rounded p-4 space-y-4 font-sans select-none">
      {/* Briefing Title & Formal Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#C5A66A]/20">
        <div className="flex items-center gap-2.5">
          <FileText className="w-4 h-4 text-[#C5A66A]" />
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#C5A66A] block">
              {advisor.officialTitle.toUpperCase()} BRIEFING
            </span>
            <h3 className="font-serif text-sm font-bold text-[#EAE3D2]">
              {briefing.headline}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[#A5AD9D]">
            {briefing.date}
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-[#A5AD9D] hover:text-[#EAE3D2] transition-colors"
            title={isExpanded ? 'Collapse Briefing' : 'Expand Briefing'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4 animate-fadeIn">
          {/* Formal Speech Scroll */}
          <div className="relative p-4 rounded bg-[#121713] border-l-2 border-[#C5A66A] text-xs leading-relaxed text-[#D8CBAA] font-serif italic">
            <Quote className="w-3.5 h-3.5 text-[#C5A66A] mb-1 opacity-70" />
            <p>"{briefing.formalSpeech}"</p>
          </div>

          {/* Supporting Observations */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#A5AD9D] block">
              Recorded Field Observations
            </span>
            <div className="space-y-2">
              {briefing.supportingObservations.map((obs) => (
                <div
                  key={obs.id}
                  className="p-2.5 rounded bg-[#151915] border border-[#2B372C] text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-[#EAE3D2]">{obs.title}</span>
                    <span className="text-[9px] font-mono text-[#A5AD9D]">{obs.recordedDate}</span>
                  </div>
                  <p className="text-[#A5AD9D] leading-relaxed text-[11px]">{obs.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Proposed Actions & Directives */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#C5A66A] block">
              Advisor Proposed Directives
            </span>
            <div className="space-y-1.5">
              {briefing.proposedDirectives.map((dir, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2 rounded bg-[#1A221B] border border-[#8FA879]/20 text-xs text-[#EAE3D2]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A66A] shrink-0 mt-0.5" />
                  <span>{dir}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Systemic Consequences */}
          <div className="space-y-1.5 pt-2 border-t border-[#C5A66A]/10 text-xs text-[#A5AD9D]">
            <span className="text-[10px] font-mono uppercase text-[#A5AD9D] block">
              Projected Systemic Consequences:
            </span>
            {briefing.systemicConsequences.map((c, i) => (
              <p key={i} className="text-[11px] text-[#A5AD9D] flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-[#C5A66A]" />
                <span>{c}</span>
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvisorBriefing;

