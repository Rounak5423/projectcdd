import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Shield,
  Hammer,
  Coins,
  MapPin,
  Users,
} from 'lucide-react';
import { useGameState } from '../../context/GameStateContext';
import { District } from '../../types/game';

interface CivRegionsDrawerProps {
  onSelectDistrict: (districtId: string) => void;
}

export default function CivRegionsDrawer({ onSelectDistrict }: CivRegionsDrawerProps) {
  const { districts } = useGameState();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="absolute top-12 right-3 z-20 select-none">
      {isOpen ? (
        <div className="w-[260px] rounded-md overflow-hidden border border-[#2d3840] bg-[#14181b]/95 text-[#ede8dc] shadow-xl backdrop-blur-md">
          {/* Header */}
          <div className="bg-[#101416] px-3 py-2 border-b border-[#252f36] flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold tracking-wider text-[#aba393] uppercase">
              DISTRICT REGIONS [{districts.length}]
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded text-[#7e8e7c] hover:text-[#ede8dc] transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Region Rows */}
          <div className="p-1.5 space-y-1 max-h-[340px] overflow-y-auto custom-scrollbar">
            {districts.map((d) => (
              <div
                key={d.id}
                onClick={() => onSelectDistrict(d.id)}
                className="p-2 rounded-md border border-[#232b31] bg-[#171d22] hover:border-[#445663] hover:bg-[#1d252b] transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-xs font-semibold text-[#ede8dc] truncate group-hover:text-[#ffffff] transition-colors">
                      {d.name}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-[#7ea376] font-semibold shrink-0">
                    {d.loyalty || 98}% Loy
                  </span>
                </div>

                <div className="mt-1.5 pt-1 border-t border-[#232b30] flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[#8a8376] flex items-center gap-1 truncate max-w-[130px]">
                    <Hammer size={10} className="text-[#c29b38] shrink-0" />
                    <span className="truncate">{d.currentProduction || 'Infrastructure'}</span>
                  </span>

                  <span className="text-[#aba393]">
                    {d.productionTurnsLeft || 3} T
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="px-2 py-1.5 bg-[#0f1214] border-t border-[#232b30] text-center">
            <span className="text-[9px] font-mono text-[#6c767e]">
              Click district to focus camera & inspector
            </span>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="px-2.5 py-1.5 rounded-md border border-[#2d3840] bg-[#14181b]/95 text-[#ede8dc] text-xs font-semibold shadow-md flex items-center gap-1.5 hover:bg-[#1f262c] transition-all"
        >
          <ChevronLeft size={13} className="text-[#c29b38]" />
          <span className="text-[11px]">Districts [{districts.length}]</span>
        </button>
      )}
    </div>
  );
}
