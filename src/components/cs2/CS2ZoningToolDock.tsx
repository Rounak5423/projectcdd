import React from 'react';
import {
  Home,
  Building,
  Store,
  ShoppingBag,
  Factory,
  Briefcase,
  Eraser,
  X,
  Brush,
  Square,
  Sparkles,
} from 'lucide-react';
import { useGameState } from '../../context/GameStateContext';
import { ZoneType } from '../../types/game';
import { soundFx } from '../../services/soundFx';

interface ZoneOption {
  type: ZoneType;
  label: string;
  sublabel: string;
  icon: any;
  color: string;
  bgClass: string;
  density: 'Low' | 'Medium' | 'High';
  pollution: 'None' | 'Low' | 'Heavy';
}

const zoneOptions: ZoneOption[] = [
  {
    type: 'residential_low',
    label: 'Low-Density Residential',
    sublabel: 'Single-family homes & townhouses',
    icon: Home,
    color: '#2ecc71',
    bgClass: 'hover:border-[#2ecc71] hover:bg-[#16291e]',
    density: 'Low',
    pollution: 'None',
  },
  {
    type: 'residential_high',
    label: 'High-Density Residential',
    sublabel: 'High-rise residential spires',
    icon: Building,
    color: '#27ae60',
    bgClass: 'hover:border-[#27ae60] hover:bg-[#13271a]',
    density: 'High',
    pollution: 'None',
  },
  {
    type: 'commercial_low',
    label: 'Low-Density Commercial',
    sublabel: 'Local retail, bakeries & diners',
    icon: Store,
    color: '#3498db',
    bgClass: 'hover:border-[#3498db] hover:bg-[#152430]',
    density: 'Low',
    pollution: 'Low',
  },
  {
    type: 'commercial_high',
    label: 'High-Density Commercial',
    sublabel: 'Shopping plazas & department stores',
    icon: ShoppingBag,
    color: '#2980b9',
    bgClass: 'hover:border-[#2980b9] hover:bg-[#12202b]',
    density: 'High',
    pollution: 'Low',
  },
  {
    type: 'industrial',
    label: 'Manufacturing & Industry',
    sublabel: 'Heavy goods fabrication & foundries',
    icon: Factory,
    color: '#f39c12',
    bgClass: 'hover:border-[#f39c12] hover:bg-[#2b2112]',
    density: 'Medium',
    pollution: 'Heavy',
  },
  {
    type: 'office',
    label: 'High-Tech Office & IT',
    sublabel: 'Software, fintech & AI cybernetics',
    icon: Briefcase,
    color: '#9b59b6',
    bgClass: 'hover:border-[#9b59b6] hover:bg-[#25172b]',
    density: 'High',
    pollution: 'None',
  },
  {
    type: 'none',
    label: 'De-Zone (Clear Land)',
    sublabel: 'Demolish zoned plots & restore turf',
    icon: Eraser,
    color: '#e74c3c',
    bgClass: 'hover:border-[#e74c3c] hover:bg-[#2b1616]',
    density: 'Low',
    pollution: 'None',
  },
];

export default function CS2ZoningToolDock() {
  const { activeZoneTool, setActiveZoneTool, zoneMode, setZoneMode } = useGameState();

  if (!activeZoneTool) return null;

  return (
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 select-none animate-in fade-in slide-in-from-bottom-2 duration-150">
      <div className="bg-[#14191d]/95 border border-[#3b4954] rounded-2xl p-3 shadow-2xl backdrop-blur-md flex flex-col gap-2 max-w-[850px]">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between pb-1.5 border-b border-[#252f36]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#2ecc71] animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#ede8dc]">
              ZONING & REAL ESTATE TOOL · CITIES: SKYLINES II
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Brush vs Marquee selector */}
            <div className="flex items-center gap-1 bg-[#101417] p-0.5 rounded-lg border border-[#263138]">
              <button
                onClick={() => setZoneMode?.('brush')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                  zoneMode === 'brush' ? 'bg-[#212b33] text-[#ede8dc]' : 'text-[#79858f] hover:text-[#ede8dc]'
                }`}
              >
                <Brush size={11} />
                <span>Brush</span>
              </button>
              <button
                onClick={() => setZoneMode?.('marquee')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                  zoneMode === 'marquee' ? 'bg-[#212b33] text-[#ede8dc]' : 'text-[#79858f] hover:text-[#ede8dc]'
                }`}
              >
                <Square size={11} />
                <span>Marquee</span>
              </button>
            </div>

            <button
              onClick={() => {
                soundFx.playClick();
                setActiveZoneTool(null);
              }}
              className="p-1 rounded text-[#7e8e7c] hover:text-[#ede8dc] hover:bg-[#20282e]"
              title="Close Zoning Dock [ESC]"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Zone Cards Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {zoneOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = activeZoneTool === opt.type;

            return (
              <button
                key={opt.type}
                onClick={() => {
                  soundFx.playClick();
                  setActiveZoneTool(opt.type);
                }}
                className={`p-2 rounded-xl border text-left transition-all flex flex-col justify-between h-[85px] ${
                  isSelected
                    ? 'border-white bg-[#222a31] shadow-lg ring-2 ring-white/30'
                    : `border-[#2c3740] bg-[#161c20] ${opt.bgClass}`
                }`}
              >
                <div className="flex items-start justify-between w-full">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${opt.color}22`, color: opt.color }}
                  >
                    <Icon size={14} />
                  </div>
                  <span
                    className="text-[8px] font-mono font-bold px-1 py-0.2 rounded uppercase"
                    style={{ backgroundColor: `${opt.color}20`, color: opt.color }}
                  >
                    {opt.density}
                  </span>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-[#ede8dc] leading-tight line-clamp-1 mt-1">
                    {opt.label.split(' ')[0]}
                  </h4>
                  <p className="text-[8px] font-mono text-[#8a8376] truncate">
                    {opt.pollution === 'Heavy' ? '⚠️ Heavy Pollution' : 'No Pollution'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

