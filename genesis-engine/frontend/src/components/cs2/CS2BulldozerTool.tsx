import React from 'react';
import { Shovel, Trash2, X, AlertOctagon } from 'lucide-react';
import { useGameState } from '../../context/GameStateContext';
import { soundFx } from '../../services/soundFx';

export default function CS2BulldozerTool() {
  const { isBulldozerActive, setIsBulldozerActive } = useGameState();

  if (!isBulldozerActive) return null;

  return (
    <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-[#261517]/95 border border-[#c0392b] px-4 py-2 rounded-xl shadow-2xl backdrop-blur-md text-[#ede8dc] animate-in fade-in slide-in-from-top-2 duration-150 select-none">
      <div className="w-2.5 h-2.5 rounded-full bg-[#e74c3c] animate-ping" />
      <div className="flex items-center gap-2">
        <Trash2 size={15} className="text-[#e74c3c]" />
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#f5b7b1]">
          BULLDOZER DEMOLITION MODE ACTIVE [B]
        </span>
      </div>
      <span className="text-[10px] text-[#8a8376] font-mono hidden sm:inline">
        Click any building in 3D world to demolish & reclaim 70% materials.
      </span>
      <button
        onClick={() => {
          soundFx.playClick();
          setIsBulldozerActive(false);
        }}
        className="ml-2 px-2.5 py-1 rounded bg-[#3d1a1e] hover:bg-[#522026] text-[#e74c3c] hover:text-white border border-[#78282f] text-xs font-bold transition-all flex items-center gap-1"
      >
        <X size={12} />
        <span>Cancel [ESC]</span>
      </button>
    </div>
  );
}
