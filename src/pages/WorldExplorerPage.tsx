import React, { useState } from 'react';
import {
  Layers,
  Compass,
  X,
  Radio,
  Eye,
  Shield,
  Activity,
  Trees,
  Sun,
  Sunset,
  Moon,
} from 'lucide-react';
import CivilizationWorld3D, { TimeOfDay } from '../components/world3d/CivilizationWorld3D';
import AnnoBuildDock from '../components/game/AnnoBuildDock';
import CivRegionsDrawer from '../components/game/CivRegionsDrawer';
import AnnoCitizenCard from '../components/game/AnnoCitizenCard';
import { useGameState, MapLayer } from '../context/GameStateContext';
import { Citizen } from '../types/game';
import { soundFx } from '../services/soundFx';

const strategicLenses: { id: MapLayer; label: string; icon: string }[] = [
  { id: 'all', label: 'Natural Aerial', icon: '🌲' },
  { id: 'infrastructure', label: 'Roads & Power', icon: '⚡' },
  { id: 'population', label: 'Settlement & Pop', icon: '👥' },
  { id: 'resources', label: 'Commodity Flow', icon: '📦' },
  { id: 'environment', label: 'Forests & River', icon: '🌿' },
  { id: 'economy', label: 'Commerce & Trade', icon: '💰' },
];

export default function WorldExplorerPage({
  onOpenTech,
  onOpenEconomy,
}: {
  onOpenTech?: () => void;
  onOpenEconomy?: () => void;
}) {
  const {
    activeLayer,
    setActiveLayer,
    districts,
    citizens,
    isConstructionMode,
    selectedCatalogItem,
    setConstructionMode,
    showFireworks,
    triggerFireworks,
    isCinematicTour,
    setIsCinematicTour,
    setIsDemoModalOpen,
  } = useGameState();

  const [inspectedCitizen, setInspectedCitizen] = useState<Citizen | null>(null);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');

  const handleSelectDistrict = (districtId: string) => {
    const citizen = citizens.find((c) => c.district.toLowerCase().includes(districtId.replace('dist-', ''))) || citizens[0];
    setInspectedCitizen(citizen);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#121619] select-none flex flex-col">
      {/* 3D React Three Fiber Viewport (Occupies the entire background) */}
      <div className="flex-1 w-full h-full relative">
        <CivilizationWorld3D
          onSelectDistrict={handleSelectDistrict}
          timeOfDay={timeOfDay}
          isCinematicTour={isCinematicTour}
          showFireworks={showFireworks}
        />

        {/* TOP STRATEGIC LENS & ATMOSPHERE SELECTOR */}
        <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-1.5 p-1 rounded-md border border-[#2d3840] bg-[#14181b]/92 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-bold text-[#aba393] border-r border-[#263037]">
            <Radio size={12} className="text-[#7ea376]" />
            <span className="hidden sm:inline">LENS:</span>
          </div>

          {strategicLenses.map((lens) => (
            <button
              key={lens.id}
              onClick={() => {
                soundFx.playClick();
                setActiveLayer(lens.id);
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 ${
                activeLayer === lens.id
                  ? 'bg-[#29353e] text-[#ffffff] font-semibold border border-[#445663] shadow-xs'
                  : 'text-[#8a8376] hover:text-[#ede8dc] hover:bg-[#1b2126]'
              }`}
            >
              <span className="text-xs">{lens.icon}</span>
              <span className="hidden md:inline">{lens.label}</span>
            </button>
          ))}

          {/* Time of Day Lighting Toggle */}
          <div className="pl-1 border-l border-[#263037] flex items-center gap-0.5">
            <button
              onClick={() => {
                soundFx.playClick();
                setTimeOfDay('day');
              }}
              className={`p-1 rounded text-xs transition-colors ${
                timeOfDay === 'day' ? 'bg-[#dfb74a] text-[#14181b]' : 'text-[#8a8376] hover:text-[#ede8dc]'
              }`}
              title="Daylight Lighting"
            >
              <Sun size={12} />
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                setTimeOfDay('sunset');
              }}
              className={`p-1 rounded text-xs transition-colors ${
                timeOfDay === 'sunset' ? 'bg-[#e07b46] text-[#14181b]' : 'text-[#8a8376] hover:text-[#ede8dc]'
              }`}
              title="Sunset / Golden Hour Lighting"
            >
              <Sunset size={12} />
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                setTimeOfDay('night');
              }}
              className={`p-1 rounded text-xs transition-colors ${
                timeOfDay === 'night' ? 'bg-[#5b87a8] text-[#14181b]' : 'text-[#8a8376] hover:text-[#ede8dc]'
              }`}
              title="Night Atmosphere & Lanterns"
            >
              <Moon size={12} />
            </button>
          </div>

          {/* Cinematic Flyover Orbit Toggle */}
          <div className="pl-1 border-l border-[#263037]">
            <button
              onClick={() => {
                soundFx.playClick();
                setIsCinematicTour((prev) => !prev);
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all flex items-center gap-1 border ${
                isCinematicTour
                  ? 'bg-[#dfb74a] text-[#14181b] border-[#dfb74a] shadow-xs'
                  : 'bg-[#1b2126] text-[#dfb74a] border-[#5e4e24] hover:bg-[#262f36]'
              }`}
              title="Toggle 360° Cinematic Orbit Camera Flyover"
            >
              <span>🎬</span>
              <span className="hidden sm:inline">Flyover</span>
            </button>
          </div>

          {/* Grand Fireworks Spectacle Toggle */}
          <div className="pl-1 border-l border-[#263037]">
            <button
              onClick={() => {
                triggerFireworks();
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all flex items-center gap-1 border ${
                showFireworks
                  ? 'bg-[#d95338] text-white border-[#f7a999] animate-pulse'
                  : 'bg-[#1b2126] text-[#e06c53] border-[#6b2a1c] hover:bg-[#262f36]'
              }`}
              title="Launch 3D Particle Fireworks over Citadel"
            >
              <span>🎆</span>
              <span className="hidden sm:inline">Fireworks</span>
            </button>
          </div>

          {/* Quick Anno Resident Dossier Toggle */}
          <div className="pl-1 border-l border-[#263037]">
            <button
              onClick={() => {
                soundFx.playClick();
                if (inspectedCitizen) {
                  setInspectedCitizen(null);
                } else {
                  setInspectedCitizen(citizens[0] || null);
                }
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all flex items-center gap-1.5 border ${
                inspectedCitizen
                  ? 'bg-[#8f7742] text-[#14181b] border-[#dfb74a]'
                  : 'bg-[#1b2126] text-[#dfb74a] border-[#5e4e24] hover:bg-[#262f36]'
              }`}
              title="Toggle Anno 1800 Resident & Advisor Dossier"
            >
              <span>👨🏻‍💼</span>
              <span className="hidden sm:inline">Resident Dossier</span>
            </button>
          </div>

          {/* Demo Capabilities Suite Pill */}
          <div className="pl-1 border-l border-[#263037]">
            <button
              onClick={() => {
                soundFx.playClick();
                setIsDemoModalOpen(true);
              }}
              className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#292212] hover:bg-[#3d3215] text-[#dfb74a] border border-[#a18131] transition-all flex items-center gap-1 shadow-sm"
              title="Open Demo Capabilities Showcase Suite"
            >
              <span>🌟</span>
              <span className="hidden md:inline font-mono uppercase tracking-wide">Showcase Suite</span>
            </button>
          </div>
        </div>

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
