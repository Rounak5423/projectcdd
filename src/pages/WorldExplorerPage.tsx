import React, { useState } from 'react';
import {
  Layers,
  Hammer,
  RotateCcw,
  Compass,
  Building,
  Plus,
  X,
  Maximize2,
  Sliders,
  Check,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import CivilizationWorld3D from '../components/world3d/CivilizationWorld3D';
import { useGameState, MapLayer } from '../context/GameStateContext';
import { BuildingCatalogItem } from '../types/game';

const layers: { id: MapLayer; label: string; desc: string }[] = [
  { id: 'all', label: 'Composite', desc: 'All civilisational structures and terrain' },
  { id: 'infrastructure', label: 'Infrastructure', desc: 'Power grids, transport, fabrication' },
  { id: 'population', label: 'Population', desc: 'Residential habitats & healthcare' },
  { id: 'resources', label: 'Resources', desc: 'Agrisector, energy arrays & foundries' },
  { id: 'environment', label: 'Biosphere', desc: 'Ecology index & river water quality' },
  { id: 'economy', label: 'Commerce', desc: 'Trade corridors & fiscal output' },
];

export default function WorldExplorerPage() {
  const {
    activeLayer,
    setActiveLayer,
    catalog,
    isConstructionMode,
    selectedCatalogItem,
    setConstructionMode,
    resources,
    districts,
    selectedBuilding,
    selectBuilding,
    placedBuildings,
  } = useGameState();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredCatalog = catalog.filter((item) =>
    selectedCategory === 'all' ? true : item.category === selectedCategory
  );

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#151916] select-none flex flex-col">
      {/* 3D React Three Fiber Viewport */}
      <div className="flex-1 w-full h-full relative">
        <CivilizationWorld3D />

        {/* TOP LAYER CONTROLS (HUD) */}
        <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-1.5 bg-[#171d18]/90 backdrop-blur-md p-1.5 rounded-xl border border-[#39443a] shadow-xl">
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-[#c6a76a] font-semibold border-r border-[#2d372e]">
            <Layers size={14} />
            <span className="hidden sm:inline">STRATEGIC LAYER:</span>
          </div>
          {layers.map((layer) => (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
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

        {/* CONSTRUCTION MODE BANNER (When active) */}
        {isConstructionMode && selectedCatalogItem && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex flex-col sm:flex-row items-center gap-2 sm:gap-4 bg-[#1d271e]/95 border border-[#a6bd82] px-5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#a6bd82] animate-ping" />
              <span className="text-xs font-semibold text-[#e8e9e3]">
                CONSTRUCTING: <span className="text-[#c6a76a] font-bold">{selectedCatalogItem.name}</span>
              </span>
              <span className="text-xs text-[#9da99b]">| {selectedCatalogItem.costMaterials} Mat.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[#a6bd82] bg-[#141b16] px-2 py-0.5 rounded border border-[#2d382e]">
                Press [R] to Rotate
              </span>
              <button
                onClick={() => setConstructionMode(false)}
                className="px-2.5 py-1 rounded-full bg-[#352523] text-[#d47e69] hover:bg-[#472f2c] text-xs font-semibold flex items-center gap-1 border border-[#633a34] transition-colors"
              >
                <X size={12} /> Cancel
              </button>
            </div>
          </div>
        )}

        {/* BOTTOM HUD: CONSTRUCTION DRAWER TRIGGER */}
        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xl backdrop-blur-md transition-all ${
              isDrawerOpen
                ? 'bg-[#c6a76a] text-[#151916]'
                : 'bg-[#29362a]/95 text-[#dce9ca] hover:bg-[#384a39] border border-[#526b4f]'
            }`}
          >
            <Hammer size={16} />
            <span>CONSTRUCTION REPERTOIRE</span>
            {isDrawerOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>

          <span className="hidden sm:inline-block text-[11px] font-mono text-[#9da99b] bg-[#161c17]/80 px-3 py-1.5 rounded-lg border border-[#2d372e]">
            {placedBuildings.length} Operational Facilities Deployed
          </span>
        </div>

        {/* EXPANDABLE CONSTRUCTION REPERTOIRE DRAWER */}
        {isDrawerOpen && (
          <div className="absolute bottom-16 left-4 right-4 lg:right-auto lg:w-[780px] z-20 bg-[#171d18]/95 border border-[#39443a] rounded-xl shadow-2xl p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#2e3a2f]">
              <div className="flex items-center gap-2">
                <Hammer size={16} className="text-[#c6a76a]" />
                <h3 className="text-sm font-bold tracking-wide text-[#f0f3eb]">
                  SELECT CIVILISATIONAL ARCHITECTURE
                </h3>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded text-[#9da99b] hover:text-white hover:bg-[#252f26]"
              >
                <X size={14} />
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 py-2 overflow-x-auto custom-scrollbar">
              {[
                'all',
                'residential',
                'commercial',
                'agriculture',
                'energy',
                'industrial',
                'research',
                'healthcare',
                'education',
                'government',
                'environment',
              ].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded text-[11px] uppercase font-mono font-semibold transition-colors ${
                    selectedCategory === cat
                      ? 'bg-[#3b4c37] text-[#dce9ca] border border-[#5c7756]'
                      : 'bg-[#1b231d] text-[#8e9c8c] hover:bg-[#263128]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[280px] overflow-y-auto custom-scrollbar pt-2">
              {filteredCatalog.map((item) => {
                const canAfford = resources.materials >= item.costMaterials;
                const isSelected = selectedCatalogItem?.id === item.id && isConstructionMode;

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#2a382b] border-[#a6bd82] ring-1 ring-[#a6bd82]'
                        : canAfford
                        ? 'bg-[#1e2620] border-[#344235] hover:border-[#526953]'
                        : 'bg-[#181f19] border-[#29332a] opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-[10px] font-mono uppercase text-[#a6bd82]">
                          {item.category}
                        </span>
                        <span className="text-[10px] font-mono text-[#c6a76a] font-bold">
                          {item.costMaterials} Mat.
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[#f3f5ee] mt-1">{item.name}</h4>
                      <p className="text-[10px] text-[#9da99b] mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#2d382e] flex items-center justify-between">
                      <div className="text-[10px] font-mono text-[#9da99b]">
                        {item.energyReq > 0 ? `-${item.energyReq}MW` : `+${Math.abs(item.energyReq)}MW`}
                      </div>

                      <button
                        disabled={!canAfford}
                        onClick={() => {
                          setConstructionMode(true, item);
                          setIsDrawerOpen(false);
                        }}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                          canAfford
                            ? 'bg-[#3b4c37] hover:bg-[#4d6348] text-[#dce9ca] border border-[#5c7756]'
                            : 'bg-[#242924] text-[#697268] cursor-not-allowed'
                        }`}
                      >
                        Deploy
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

