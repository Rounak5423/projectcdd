import React, { useState } from 'react';
import {
  Building2,
  Wheat,
  Zap,
  Cpu,
  FlaskConical,
  Heart,
  Landmark,
  Hammer,
  X,
  ChevronDown,
} from 'lucide-react';
import { useGameState } from '../../context/GameStateContext';
import { BuildingCategory, BuildingCatalogItem } from '../../types/game';

interface CategoryMedallion {
  category: BuildingCategory;
  label: string;
  icon: any;
  color: string;
}

const medallions: CategoryMedallion[] = [
  { category: 'residential', label: 'Habitats', icon: Building2, color: '#aba393' },
  { category: 'agriculture', label: 'Agriculture', icon: Wheat, color: '#c4b37d' },
  { category: 'energy', label: 'Power Grid', icon: Zap, color: '#d9a941' },
  { category: 'industrial', label: 'Foundry & Industry', icon: Cpu, color: '#aa9b8d' },
  { category: 'research', label: 'Academy & Science', icon: FlaskConical, color: '#78a689' },
  { category: 'healthcare', label: 'Sanatorium', icon: Heart, color: '#7ea376' },
  { category: 'government', label: 'Citadel & Hall', icon: Landmark, color: '#c29b38' },
];

export default function AnnoBuildDock() {
  const { catalog, resources, setConstructionMode, isConstructionMode, selectedCatalogItem } = useGameState();
  const [activeCategory, setActiveCategory] = useState<BuildingCategory | null>(null);

  const activeBuildings = activeCategory
    ? catalog.filter((b) => b.category === activeCategory)
    : [];

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 select-none">
      {/* Expanded Buildings Carousel Tray */}
      {activeCategory && (
        <div className="mb-2 p-2.5 rounded-lg bg-[#14181b]/96 border border-[#3d4b55] max-w-[800px] shadow-2xl backdrop-blur-md animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#252f36]">
            <span className="text-[11px] font-mono font-bold text-[#aba393] uppercase tracking-wider flex items-center gap-1.5">
              <Hammer size={12} className="text-[#c29b38]" />
              CONSTRUCT · {activeCategory.toUpperCase()}
            </span>
            <button
              onClick={() => setActiveCategory(null)}
              className="p-1 rounded text-[#7e8e7c] hover:text-[#ede8dc]"
            >
              <X size={13} />
            </button>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto custom-scrollbar pb-1">
            {activeBuildings.map((item) => {
              const canAfford = resources.materials >= item.costMaterials;
              const isSelected = selectedCatalogItem?.id === item.id && isConstructionMode;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (canAfford) {
                      setConstructionMode(true, item);
                      setActiveCategory(null);
                    }
                  }}
                  className={`w-48 p-2.5 rounded-md border transition-all cursor-pointer flex flex-col justify-between shrink-0 ${
                    isSelected
                      ? 'border-[#c29b38] bg-[#22292f] shadow-sm'
                      : canAfford
                      ? 'border-[#2d3840] bg-[#1a2126] hover:border-[#4d5f6d] hover:bg-[#20292f]'
                      : 'border-[#222a30] bg-[#121618] opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-mono font-bold text-[#c29b38]">
                        {item.costMaterials} Mat.
                      </span>
                      <span className="text-[9px] font-mono text-[#7ea376]">Lvl {item.minTechLevel}</span>
                    </div>

                    <h4 className="text-xs font-bold text-[#ede8dc] mt-1 truncate">{item.name}</h4>
                    <p className="text-[10px] text-[#8a8376] mt-0.5 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-2.5 pt-1.5 border-t border-[#252f36] flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[#d9a941]">
                      {item.energyReq > 0 ? `-${item.energyReq}MW` : `+${Math.abs(item.energyReq)}MW`}
                    </span>
                    <span className="text-[#7ea376] font-semibold">{canAfford ? 'Place' : 'Lacks Mat.'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Strategy Dock Toolbar */}
      <div className="flex items-center gap-1.5 p-1 rounded-md border border-[#2d3840] bg-[#14181b]/92 shadow-xl backdrop-blur-md">
        <div className="px-2.5 py-0.5 flex items-center gap-1.5 text-xs font-mono font-bold text-[#aba393] border-r border-[#263037]">
          <Hammer size={13} className="text-[#c29b38]" />
          <span className="hidden sm:inline text-[11px]">BUILD</span>
        </div>

        {/* Category Circular Medallions */}
        <div className="flex items-center gap-1">
          {medallions.map((med) => {
            const Icon = med.icon;
            const isActive = activeCategory === med.category;

            return (
              <button
                key={med.category}
                onClick={() => setActiveCategory(isActive ? null : med.category)}
                className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${
                  isActive
                    ? 'border border-[#c29b38] bg-[#27323b] shadow-xs'
                    : 'border border-[#29343c] bg-[#1a2126] hover:border-[#445562] hover:bg-[#202930]'
                }`}
                title={med.label}
              >
                <Icon size={15} style={{ color: isActive ? '#ede8dc' : med.color }} />
              </button>
            );
          })}
        </div>

        {activeCategory && (
          <button
            onClick={() => setActiveCategory(null)}
            className="p-1 rounded text-[#8a8376] hover:text-[#ede8dc]"
          >
            <ChevronDown size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
