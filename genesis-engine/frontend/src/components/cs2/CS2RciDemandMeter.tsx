import React from 'react';
import { useGameState } from '../../context/GameStateContext';
import { RciDemand } from '../../types/game';

export default function CS2RciDemandMeter() {
  const { rciDemand, setActiveZoneTool } = useGameState();

  return (
    <div
      className="flex items-center gap-2 bg-[#121619]/90 border border-[#2b353b] px-3 py-1.5 rounded-lg backdrop-blur-md shadow-lg select-none text-[#ede8dc] group"
      title="RCI Demand Meters (Cities: Skylines II Demand-Driven Simulation)"
    >
      <div className="flex flex-col">
        <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-[#8a8376]">
          RCI DEMAND
        </span>
        <div className="flex items-center gap-1.5 mt-0.5">
          {/* Residential (Green) */}
          <div
            onClick={() => setActiveZoneTool?.('residential_high')}
            className="flex flex-col items-center gap-0.5 cursor-pointer hover:opacity-80 transition-opacity"
            title={`Residential Demand: Low ${rciDemand.residentialLow}%, High ${rciDemand.residentialHigh}%`}
          >
            <div className="w-3.5 h-8 bg-[#18251e] border border-[#264434] rounded-xs flex flex-col justify-end p-0.5 overflow-hidden">
              <div
                className="w-full bg-gradient-to-t from-[#2ecc71] to-[#58d68d] rounded-xs transition-all duration-300"
                style={{ height: `${rciDemand.residentialHigh}%` }}
              />
            </div>
            <span className="text-[8px] font-mono font-bold text-[#2ecc71]">R</span>
          </div>

          {/* Commercial (Blue) */}
          <div
            onClick={() => setActiveZoneTool?.('commercial_high')}
            className="flex flex-col items-center gap-0.5 cursor-pointer hover:opacity-80 transition-opacity"
            title={`Commercial Demand: ${rciDemand.commercial}% (Retail & Services)`}
          >
            <div className="w-3.5 h-8 bg-[#152028] border border-[#243d52] rounded-xs flex flex-col justify-end p-0.5 overflow-hidden">
              <div
                className="w-full bg-gradient-to-t from-[#3498db] to-[#5dade2] rounded-xs transition-all duration-300"
                style={{ height: `${rciDemand.commercial}%` }}
              />
            </div>
            <span className="text-[8px] font-mono font-bold text-[#3498db]">C</span>
          </div>

          {/* Industrial & Office (Orange / Purple) */}
          <div
            onClick={() => setActiveZoneTool?.('industrial')}
            className="flex flex-col items-center gap-0.5 cursor-pointer hover:opacity-80 transition-opacity"
            title={`Industrial Demand: ${rciDemand.industrial}% | Office Demand: ${rciDemand.office}%`}
          >
            <div className="w-3.5 h-8 bg-[#281e15] border border-[#523824] rounded-xs flex flex-col justify-end p-0.5 overflow-hidden">
              <div
                className="w-full bg-gradient-to-t from-[#e67e22] to-[#f39c12] rounded-xs transition-all duration-300"
                style={{ height: `${Math.max(rciDemand.industrial, rciDemand.office)}%` }}
              />
            </div>
            <span className="text-[8px] font-mono font-bold text-[#e67e22]">I</span>
          </div>
        </div>
      </div>
    </div>
  );
}
