import React from 'react';
import { Advisor } from '../types/advisor';
import { CivoraIcon } from '../../../components/brand/CivoraLogo';
import { soundFx } from '../../../services/soundFx';
import { Sparkles, Shield, AlertTriangle, Crown, Compass, Layers } from 'lucide-react';

interface CouncilChamberPlaceholderProps {
  selectedAdvisorId: string | null;
  onAdvisorSelect: (advisorId: string) => void;
  advisors: Advisor[];
}

export const CouncilChamberPlaceholder: React.FC<CouncilChamberPlaceholderProps> = ({
  selectedAdvisorId,
  onAdvisorSelect,
  advisors,
}) => {
  // Map positions around the royal horseshoe council table
  // Left: Chancellor, Grand Scholar, High Physician
  // Right: Treasurer, Royal Architect, Keeper of Nature
  const leftAdvisors = advisors.slice(0, 3);
  const rightAdvisors = advisors.slice(3, 6);

  const renderAdvisorSeat = (advisor: Advisor, side: 'left' | 'right') => {
    const isSelected = selectedAdvisorId === advisor.id;

    return (
      <button
        key={advisor.id}
        onClick={() => {
          soundFx.playClick();
          onAdvisorSelect(advisor.id);
        }}
        className={`group relative flex items-center gap-3 p-3 rounded transition-all duration-300 text-left border ${
          isSelected
            ? 'bg-[#202820] border-[#C5A66A] shadow-lg shadow-[#C5A66A]/10 ring-1 ring-[#C5A66A]/40'
            : 'bg-[#151915]/90 border-[#2B372C] hover:border-[#C5A66A]/50 hover:bg-[#1A221B]'
        } ${side === 'right' ? 'flex-row-reverse text-right' : ''}`}
        title={`Confer with ${advisor.officialTitle}`}
      >
        {/* Seat Seal */}
        <div
          className={`w-11 h-11 rounded-sm border flex items-center justify-center text-lg transition-all shadow-inner shrink-0 ${
            isSelected
              ? 'border-[#C5A66A] bg-[#283228] text-[#EAE3D2] scale-105'
              : 'border-[#2B372C] bg-[#121713] text-[#A5AD9D] group-hover:border-[#C5A66A]/50 group-hover:text-[#EAE3D2]'
          }`}
        >
          <span>{advisor.portraitSymbol}</span>
        </div>

        {/* Seat Designation */}
        <div className="min-w-0">
          <div className={`flex items-center gap-1.5 ${side === 'right' ? 'justify-end' : 'justify-start'}`}>
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#C5A66A] truncate">
              {advisor.officialTitle}
            </span>
            {advisor.hasActiveWarning && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#D6A75E] animate-pulse" title="Active Warning" />
            )}
          </div>
          <h4 className="font-serif text-xs font-bold text-[#EAE3D2] truncate mt-0.5">
            {advisor.name}
          </h4>
          <span className="text-[10px] text-[#A5AD9D] font-mono block">
            {advisor.status}
          </span>
        </div>
      </button>
    );
  };

  return (
    <div className="relative w-full h-full min-h-[480px] bg-gradient-to-b from-[#121613] via-[#17231B]/40 to-[#121613] border border-[#2B372C] rounded flex flex-col justify-between p-6 select-none overflow-hidden">
      {/* Background Architectural Engraving Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.06] bg-[radial-gradient(#C5A66A_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Chamber Header Crest */}
      <div className="relative z-10 flex items-center justify-between border-b border-[#C5A66A]/15 pb-3">
        <div className="flex items-center gap-2.5">
          <Crown className="w-4 h-4 text-[#C5A66A]" />
          <span className="font-serif text-xs uppercase tracking-[0.2em] text-[#C5A66A]">
            Imperial Chamber of the Crown
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-[#A5AD9D]">
          <span className="w-2 h-2 rounded-full bg-[#8FA879]" />
          <span>Council in Quorum</span>
        </div>
      </div>

      {/* Main Chamber Centerpiece & Table */}
      <div className="relative z-10 my-auto grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-6 py-6">
        {/* Left Council Stations */}
        <div className="flex flex-col gap-3.5 max-w-[240px] justify-self-start w-full">
          {leftAdvisors.map((adv) => renderAdvisorSeat(adv, 'left'))}
        </div>

        {/* Central Council Table & Insignia Dais */}
        <div className="relative flex flex-col items-center justify-center p-8">
          {/* Outer Dais Stone Rings */}
          <div className="w-56 h-56 rounded-full border border-[#C5A66A]/20 bg-[#17231B]/40 flex items-center justify-center relative shadow-2xl">
            {/* Inner Gold Inlay Ring */}
            <div className="w-44 h-44 rounded-full border border-[#C5A66A]/40 bg-[#151915]/80 flex flex-col items-center justify-center p-4 text-center">
              <CivoraIcon size={46} className="text-[#C5A66A] mb-2 drop-shadow-[0_0_12px_rgba(197,166,106,0.3)]" />
              <span className="font-serif text-[11px] tracking-widest font-bold text-[#EAE3D2] uppercase">
                CIVORA
              </span>
              <span className="text-[8px] font-mono tracking-widest text-[#C5A66A] mt-0.5 uppercase">
                High Council Chamber
              </span>
            </div>

            {/* Orbiting Axis Marks */}
            <div className="absolute top-1 w-2 h-2 bg-[#C5A66A]/40 rounded-full" />
            <div className="absolute bottom-1 w-2 h-2 bg-[#C5A66A]/40 rounded-full" />
            <div className="absolute left-1 w-2 h-2 bg-[#C5A66A]/40 rounded-full" />
            <div className="absolute right-1 w-2 h-2 bg-[#C5A66A]/40 rounded-full" />
          </div>

          <div className="mt-4 text-center">
            <span className="font-serif text-xs text-[#EAE3D2] tracking-wide block">
              The Grand Table of Sovereign Concord
            </span>
            <span className="text-[10px] text-[#A5AD9D] font-mono mt-0.5 block">
              Select an advisor station to open executive intelligence
            </span>
          </div>
        </div>

        {/* Right Council Stations */}
        <div className="flex flex-col gap-3.5 max-w-[240px] justify-self-end w-full">
          {rightAdvisors.map((adv) => renderAdvisorSeat(adv, 'right'))}
        </div>
      </div>

      {/* 3D Integration Interface Boundary Notice */}
      <div className="relative z-10 pt-3 border-t border-[#C5A66A]/15 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#A5AD9D]">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-[#C5A66A]" />
          <span className="text-[11px] font-mono">
            <strong>Chamber Viewport:</strong> 3D WebGL / Three.js Council Chamber integration boundary.
          </span>
        </div>
        <span className="text-[10px] font-mono text-[#C5A66A] uppercase px-2 py-0.5 rounded border border-[#C5A66A]/30 bg-[#C5A66A]/5">
          Standard Interface Ready
        </span>
      </div>
    </div>
  );
};

export default CouncilChamberPlaceholder;

