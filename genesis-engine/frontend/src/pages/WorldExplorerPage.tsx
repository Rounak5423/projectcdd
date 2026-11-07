import React, { useState } from 'react';
import {
  Compass,
  X,
} from 'lucide-react';
import CivilizationWorld3D from '../components/world3d/CivilizationWorld3D';
import AnnoBuildDock from '../components/game/AnnoBuildDock';
import CivRegionsDrawer from '../components/game/CivRegionsDrawer';
import AnnoCitizenCard from '../components/game/AnnoCitizenCard';
import { useGameState } from '../context/GameStateContext';
import { Citizen } from '../types/game';
import { soundFx } from '../services/soundFx';

export default function WorldExplorerPage({
  onOpenTech,
  onOpenEconomy,
}: {
  onOpenTech?: () => void;
  onOpenEconomy?: () => void;
} = {}) {
  const {
    districts,
    citizens,
    isConstructionMode,
    selectedCatalogItem,
    setConstructionMode,
  } = useGameState();

  const [inspectedCitizen, setInspectedCitizen] = useState<Citizen | null>(null);

  const handleSelectDistrict = (districtId: string) => {
    const citizen = citizens.find((c) => c.district.toLowerCase().includes(districtId.replace('dist-', ''))) || citizens[0];
    setInspectedCitizen(citizen);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#121619] select-none flex flex-col">
      {/* 3D React Three Fiber Viewport (Occupies the entire background) */}
      <div className="flex-1 w-full h-full relative">
        <CivilizationWorld3D />

        {/* TOP-RIGHT CIV REGIONS DRAWER */}
        <CivRegionsDrawer onSelectDistrict={handleSelectDistrict} />

        {/* ANNO CITIZEN INSPECTOR CARD (Floats Contextually) */}
        {inspectedCitizen && (
          <div className="absolute top-16 right-[290px] z-20 animate-in fade-in duration-150">
            <AnnoCitizenCard
              citizen={inspectedCitizen}
              onClose={() => setInspectedCitizen(null)}
            />
          </div>
        )}

        {/* CONSTRUCTION PLACEMENT MODE BANNER */}
        {isConstructionMode && selectedCatalogItem && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-[#161c20]/95 border border-[#8f7742] px-4 py-2 rounded-md shadow-xl backdrop-blur-md animate-in fade-in">
            <div className="w-2 h-2 rounded-full bg-[#7ea376] animate-pulse" />
            <span className="text-xs font-bold text-[#ede8dc]">
              Placing: <span className="text-[#dfb74a] uppercase font-mono">{selectedCatalogItem.name}</span>
            </span>
            <span className="text-xs font-mono text-[#8a8376]">
              Cost: {selectedCatalogItem.costMaterials} Materials
            </span>
            <button
              onClick={() => {
                soundFx.playClick();
                setConstructionMode(false);
              }}
              className="ml-2 px-2 py-0.5 rounded bg-[#2b1f1f] text-[#c94c4c] hover:bg-[#382828] text-xs font-bold border border-[#523232]"
            >
              <X size={11} className="inline mr-0.5" /> Cancel [ESC]
            </button>
          </div>
        )}

        {/* BOTTOM-LEFT SETTLEMENT COMPASS RADAR */}
        <div className="absolute bottom-3 left-3 z-20 flex flex-col items-center gap-1 p-1.5 rounded-md border border-[#2b353c] bg-[#14181b]/90 backdrop-blur-md shadow-md">
          <div className="w-16 h-16 rounded-full border border-[#3d4b55] relative overflow-hidden bg-[#0e1214] shadow-inner flex items-center justify-center">
            <div className="absolute inset-0 border border-[#232c32] rounded-full" />
            <div className="absolute w-full h-px bg-[#232c32]" />
            <div className="absolute h-full w-px bg-[#232c32]" />
            {districts.map((d) => (
              <div
                key={d.id}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: d.color,
                  left: `${50 + (d.x / 55) * 36}%`,
                  top: `${50 + (d.z / 55) * 36}%`,
                }}
                title={d.name}
              />
            ))}
            <Compass size={14} className="text-[#8f7742] opacity-40 pointer-events-none" />
          </div>
          <span className="text-[8px] font-mono font-bold text-[#8a8376] tracking-wider uppercase">
            Map Grid
          </span>
        </div>

        {/* ANNO BOTTOM BUILD DOCK */}
        <AnnoBuildDock />
      </div>
    </div>
  );
}
