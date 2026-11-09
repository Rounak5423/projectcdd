import React, { useState, useMemo } from 'react';
import {
  Layers,
  Hammer,
  RotateCw,
  X,
  ChevronUp,
  ChevronDown,
  Building,
  Home,
  Briefcase,
  HeartPulse,
  GraduationCap,
  Factory,
  Cpu,
  Trees,
  Grid,
} from 'lucide-react';
import CivilizationWorld3D from '../components/world3d/CivilizationWorld3D';
import BuildingInspectorPanel from '../components/world3d/BuildingInspectorPanel';
import { useGameState, MapLayer } from '../context/GameStateContext';

const layers: { id: MapLayer; label: string; desc: string }[] = [
  { id: 'all', label: 'Composite', desc: 'All civilisational structures and terrain' },
  { id: 'infrastructure', label: 'Infrastructure', desc: 'Power grids, transport, fabrication' },
  { id: 'population', label: 'Population', desc: 'Residential habitats & healthcare' },
  { id: 'resources', label: 'Resources', desc: 'Agrisector, energy arrays & foundries' },
  { id: 'environment', label: 'Biosphere', desc: 'Ecology index & river water quality' },
  { id: 'economy', label: 'Commerce', desc: 'Trade corridors & fiscal output' },
];

const PRIMARY_CATEGORIES: { id: string; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'All Architecture', icon: Building },
  { id: 'residential', label: 'Residential', icon: Home },
  { id: 'commercial', label: 'Commercial', icon: Briefcase },
  { id: 'healthcare', label: 'Healthcare', icon: HeartPulse },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'industrial', label: 'Industrial', icon: Factory },
  { id: 'infrastructure', label: 'Infrastructure', icon: Cpu },
  { id: 'environment', label: 'Environmental', icon: Trees },
];

export default function WorldExplorerPage() {
  const {
    activeLayer,
    setActiveLayer,
    catalog,
    isConstructionMode,
    selectedCatalogItem,
    relocatingBuildingId,
    setConstructionMode,
    cancelRelocation,
    resources,
    placedBuildings,
  } = useGameState();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredCatalog = useMemo(() => {
    return catalog.filter((item) => {
      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'residential') return item.category === 'residential';
      if (selectedCategory === 'commercial') return item.category === 'commercial';
      if (selectedCategory === 'healthcare') return item.category === 'healthcare';
      if (selectedCategory === 'education') return item.category === 'education';
      if (selectedCategory === 'industrial') return item.category === 'industrial';
      if (selectedCategory === 'infrastructure') {
        return ['infrastructure', 'energy', 'government'].includes(item.category);
      }
      if (selectedCategory === 'environment') {
        return ['environment', 'agriculture'].includes(item.category);
      }
      return item.category === selectedCategory;
    });
  }, [catalog, selectedCategory]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#151916] select-none flex flex-col">
      {/* 3D React Three Fiber Viewport */}
      <div className="flex-1 w-full h-full relative">
        <CivilizationWorld3D />

        {/* 1. TOP STRATEGIC LAYER TOGGLES */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-[#171d18]/90 backdrop-blur-md p-1.5 rounded-xl border border-[#39443a] shadow-xl max-w-[calc(100vw-360px)] overflow-x-auto"
        >
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-[#c6a76a] font-semibold border-r border-[#2d372e] shrink-0">
            <Layers size={14} />
            <span className="hidden sm:inline">DATA LAYER:</span>
          </div>
          {layers.map((layer) => (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
                activeLayer === layer.id
                  ? 'bg-[#3b4c37] text-[#dce9ca] border border-[#617c5b] shadow-sm font-semibold'
                  : 'text-[#9da99b] hover:text-white hover:bg-[#222a22]'
              }`}
              title={layer.desc}
            >
              {layer.label}
            </button>
          ))}
        </div>

        {/* 2. ACTIVE PLACEMENT / RELOCATION BANNER */}
        {isConstructionMode && selectedCatalogItem && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex flex-col sm:flex-row items-center gap-2.5 sm:gap-4 bg-[#1a251b]/95 border-2 border-[#2ecc71] px-5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2ecc71] animate-ping" />
              <div className="text-xs">
                <span className="font-mono text-[#a6bd82] uppercase text-[10px] block font-bold">
                  {relocatingBuildingId ? 'RELOCATING EXISTING ASSET' : 'CONSTRUCTING FACILITY'}
                </span>
                <span className="text-[#f5f7f2] font-bold text-sm">
                  {selectedCatalogItem.name}
                </span>
                {!relocatingBuildingId && (
                  <span className="text-xs text-[#c6a76a] font-mono ml-2 font-semibold">
                    Cost: {selectedCatalogItem.costMaterials} Materials
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 sm:pt-0">
              <span className="text-[11px] font-mono text-[#a6bd82] bg-[#121914] px-2.5 py-1 rounded-lg border border-[#2d382e]">
                [R] Rotate · [G] Grid Snap
              </span>

              <button
                onClick={() => {
                  if (relocatingBuildingId) {
                    cancelRelocation();
                  } else {
                    setConstructionMode(false);
                  }
                }}
                className="px-3 py-1 rounded-lg bg-[#381f1c] text-[#fcdad7] hover:bg-[#4d2824] text-xs font-semibold flex items-center gap-1.5 border border-[#6b352e] transition-colors cursor-pointer"
              >
                <X size={13} /> Cancel
              </button>
            </div>
          </div>
        )}

        {/* 3. DEDICATED CENTRALIZED BUILDING INSPECTOR OVERLAY */}
        <BuildingInspectorPanel />

        {/* 4. BOTTOM DOCK: CONSTRUCTION DRAWER TRIGGER */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-4 left-4 z-10 flex items-center gap-2"
        >
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xl backdrop-blur-md transition-all cursor-pointer ${
              isDrawerOpen
                ? 'bg-[#c6a76a] text-[#151916] ring-2 ring-[#c6a76a]/50'
                : 'bg-[#29362a]/95 text-[#dce9ca] hover:bg-[#384a39] border border-[#526b4f]'
            }`}
          >
            <Hammer size={16} />
            <span>CONSTRUCTION REPERTOIRE</span>
            {isDrawerOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>

          <span className="hidden sm:inline-block text-[11px] font-mono text-[#9da99b] bg-[#161c17]/85 px-3 py-1.5 rounded-lg border border-[#2d372e]">
            {placedBuildings.length} Operational Facilities Deployed · {resources.materials} Materials Available
          </span>
        </div>

        {/* 5. EXPANDABLE 7-CATEGORY CONSTRUCTION REPERTOIRE DRAWER */}
        {isDrawerOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-16 left-4 right-4 lg:right-auto lg:w-[860px] z-20 bg-[#161c17]/97 border-2 border-[#39443a] rounded-2xl shadow-2xl p-4 backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-2"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#2e3a2f]">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-[#2c2415] border border-[#59492a]">
                  <Hammer size={16} className="text-[#c6a76a]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-wide text-[#f0f3eb]">
                    CIVILISATIONAL ARCHITECTURAL REPERTOIRE
                  </h3>
                  <span className="text-[10px] text-[#8e9c8c] block">
                    Select a building blueprint to enter interactive 3D holographic placement mode.
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-lg text-[#9da99b] hover:text-white hover:bg-[#252f26] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* 7 Core Category Navigation Pills */}
            <div className="flex items-center gap-1.5 py-2.5 overflow-x-auto custom-scrollbar border-b border-[#263528]">
              {PRIMARY_CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-[#3b4c37] text-[#e3f7de] border border-[#5c7756] shadow-md font-bold'
                        : 'bg-[#1b231d] text-[#8e9c8c] hover:bg-[#263128] hover:text-[#dce9ca] border border-transparent'
                    }`}
                  >
                    <IconComponent size={13} className={isActive ? 'text-[#a6bd82]' : ''} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Building Blueprint Catalog Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pt-3">
              {filteredCatalog.map((item) => {
                const canAfford = resources.materials >= item.costMaterials;
                const isSelected = selectedCatalogItem?.id === item.id && isConstructionMode;

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#253526] border-[#2ecc71] ring-2 ring-[#2ecc71]/40 shadow-lg'
                        : canAfford
                        ? 'bg-[#1b231d] border-[#313f32] hover:border-[#526953] hover:bg-[#202a22]'
                        : 'bg-[#161a17] border-[#262f27] opacity-65'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#131914] text-[#a6bd82] border border-[#2b3a2e] font-bold">
                          {item.category}
                        </span>
                        <span className="text-xs font-mono font-bold text-[#c6a76a]">
                          {item.costMaterials} Mat.
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-[#f3f5ee] mt-1.5 leading-snug">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-[#9da99b] mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#29352a] flex items-center justify-between">
                      <div className="text-[10px] font-mono text-[#8e9c8c] flex items-center gap-2">
                        <span>{item.energyReq > 0 ? `-${item.energyReq}MW` : `+${Math.abs(item.energyReq)}MW`}</span>
                        {item.workerReq > 0 && <span>· {item.workerReq} Wk.</span>}
                      </div>

                      <button
                        disabled={!canAfford}
                        onClick={() => {
                          setConstructionMode(true, item);
                          setIsDrawerOpen(false);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          canAfford
                            ? 'bg-[#3b4c37] hover:bg-[#4d6348] text-[#dce9ca] border border-[#5c7756] shadow-sm'
                            : 'bg-[#222722] text-[#697268] border border-[#2d352e] cursor-not-allowed'
                        }`}
                      >
                        {isSelected ? 'Active Mode' : canAfford ? 'Deploy' : 'Need Mat.'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
