import React from 'react';
import { Hammer } from 'lucide-react';
import { District } from '../../types/game';

interface CivCityBannerProps {
  district: District;
  isSelected: boolean;
  onClick: () => void;
}

export default function CivCityBanner({ district, isSelected, onClick }: CivCityBannerProps) {
  const popDisplay = Math.round(district.population / 10000);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`cursor-pointer transition-all transform select-none ${
        isSelected ? 'scale-105' : 'hover:scale-102'
      }`}
    >
      <div className="flex items-center civ-city-banner pl-1 pr-2.5 py-0.5 gap-2 shadow-lg">
        {/* Settlement Shield with Population Count */}
        <div className="w-6 h-6 rounded-full civ-pop-shield flex items-center justify-center font-bold text-[11px] text-[#ede8dc] shrink-0 font-mono">
          {popDisplay}
        </div>

        {/* Center District Name */}
        <div className="text-left min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: district.color }}
            />
            <span className="text-xs font-bold text-[#ede8dc] tracking-wide truncate max-w-[130px]">
              {district.name}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[8px] font-mono text-[#8a8376]">
            <span>{district.efficiency}% Eff</span>
          </div>
        </div>

        {/* Production Indicator */}
        <div className="flex items-center gap-1 pl-1.5 border-l border-[#2e3940] text-right">
          <div className="w-4 h-4 rounded bg-[#161c20] border border-[#3b4952] flex items-center justify-center text-[#c29b38]">
            <Hammer size={9} />
          </div>
          <span className="text-[9px] font-mono font-bold text-[#aba393] whitespace-nowrap">
            {district.productionTurnsLeft || 4}T
          </span>
        </div>
      </div>
    </div>
  );
}
