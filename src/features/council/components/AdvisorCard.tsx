import React from 'react';
import { Advisor } from '../types/advisor';
import { soundFx } from '../../../services/soundFx';
import { AlertTriangle, ChevronRight, CheckCircle2, ShieldAlert } from 'lucide-react';

interface AdvisorCardProps {
  advisor: Advisor;
  isSelected: boolean;
  onSelect: (advisorId: string) => void;
}

export const AdvisorCard: React.FC<AdvisorCardProps> = ({ advisor, isSelected, onSelect }) => {
  const getStatusBadge = (status: Advisor['status']) => {
    switch (status) {
      case 'Optimal':
        return 'text-[#8FA879] border-[#8FA879]/30 bg-[#8FA879]/10';
      case 'Stable':
        return 'text-[#A5AD9D] border-[#A5AD9D]/30 bg-[#A5AD9D]/10';
      case 'Attention Required':
        return 'text-[#D6A75E] border-[#D6A75E]/30 bg-[#D6A75E]/10';
      case 'Critical':
        return 'text-[#C87569] border-[#C87569]/30 bg-[#C87569]/10';
    }
  };

  return (
    <div
      onClick={() => {
        soundFx.playClick();
        onSelect(advisor.id);
      }}
      className={`relative p-3.5 rounded cursor-pointer transition-all duration-200 border flex items-center justify-between gap-3 select-none ${
        isSelected
          ? 'bg-[#202820] border-[#C5A66A] shadow-md shadow-[#C5A66A]/10 ring-1 ring-[#C5A66A]/30'
          : 'bg-[#171D18]/90 border-[#2B372C] hover:bg-[#1C241D] hover:border-[#C5A66A]/40'
      }`}
    >
      {/* Left Active Selection Bar */}
      {isSelected && (
        <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#C5A66A] rounded-r" />
      )}

      {/* Portrait & Crest Placeholder */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-11 h-11 rounded-sm border flex items-center justify-center text-xl shrink-0 transition-all ${
            isSelected
              ? 'border-[#C5A66A] bg-[#283228] text-[#EAE3D2]'
              : 'border-[#2B372C] bg-[#121713] text-[#A5AD9D]'
          }`}
        >
          <span>{advisor.portraitSymbol}</span>
        </div>

        {/* Advisor Details */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#C5A66A] truncate">
              {advisor.officialTitle}
            </span>
            {advisor.hasActiveWarning && (
              <AlertTriangle className="w-3 h-3 text-[#D6A75E] shrink-0 animate-pulse" />
            )}
          </div>
          <h3 className="font-serif text-sm font-bold text-[#EAE3D2] truncate">
            {advisor.name}
          </h3>
          <p className="text-[11px] text-[#A5AD9D] truncate font-sans">
            {advisor.domain}
          </p>
        </div>
      </div>

      {/* Right Status Pill & Arrow */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase border ${getStatusBadge(
            advisor.status
          )}`}
        >
          {advisor.status}
        </span>
        <ChevronRight
          className={`w-4 h-4 transition-transform ${
            isSelected ? 'text-[#C5A66A] translate-x-0.5' : 'text-[#A5AD9D]/40'
          }`}
        />
      </div>
    </div>
  );
};

export default AdvisorCard;

