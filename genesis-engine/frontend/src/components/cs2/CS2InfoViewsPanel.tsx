import React, { useState } from 'react';
import {
  Zap,
  Droplets,
  Car,
  CircleDollarSign,
  Factory,
  Smile,
  X,
  Layers,
  ChevronDown,
  Activity,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useGameState } from '../../context/GameStateContext';
import { InfoViewType } from '../../types/game';
import { soundFx } from '../../services/soundFx';

interface InfoViewMeta {
  id: InfoViewType;
  label: string;
  icon: any;
  color: string;
  description: string;
}

const infoViewsList: InfoViewMeta[] = [
  {
    id: 'electricity',
    label: 'Electricity Grid',
    icon: Zap,
    color: '#f1c40f',
    description: 'Power generation, high-voltage lines, substations, and battery storage.',
  },
  {
    id: 'water',
    label: 'Water & Sewage',
    icon: Droplets,
    color: '#3498db',
    description: 'Clean water pumping, pipe flow, water towers, and sewage treatment plants.',
  },
  {
    id: 'traffic',
    label: 'Traffic Flow',
    icon: Car,
    color: '#e74c3c',
    description: 'Road network congestion, bottleneck junctions, and commute speed indices.',
  },
  {
    id: 'land_value',
    label: 'Land Value',
    icon: CircleDollarSign,
    color: '#2ecc71',
    description: 'Real estate prices per m²; drives automatic Level 1-5 building upgrades.',
  },
  {
    id: 'pollution',
    label: 'Pollution Plumes',
    icon: Factory,
    color: '#9b59b6',
    description: 'Ground and air contamination plumes from factories and power plants.',
  },
  {
    id: 'happiness',
    label: 'Citizen Happiness',
    icon: Smile,
    color: '#1abc9c',
    description: 'Composite satisfaction index across healthcare, safety, taxes, and parks.',
  },
];

export default function CS2InfoViewsPanel() {
  const { activeInfoView, setActiveInfoView, utilityStats } = useGameState();
  const [isOpen, setIsOpen] = useState(false);

  const currentView = infoViewsList.find((v) => v.id === activeInfoView) || null;

  const handleSelectView = (id: InfoViewType) => {
    soundFx.playClick();
    if (activeInfoView === id) {
      setActiveInfoView('none');
    } else {
      setActiveInfoView(id);
      setIsOpen(true);
    }
  };

  return (
    <div className="absolute top-4 left-4 z-30 select-none flex flex-col gap-2">
      {/* Top Floating Button Bar */}
      <div className="flex items-center gap-1.5 bg-[#121619]/95 border border-[#2d3840] p-1.5 rounded-xl backdrop-blur-md shadow-2xl">
        <button
          onClick={() => {
            soundFx.playClick();
            setIsOpen(!isOpen);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
            isOpen || activeInfoView !== 'none'
              ? 'bg-[#222a31] text-[#ede8dc] border border-[#4d5e6d]'
              : 'text-[#8a8376] hover:bg-[#1a2024] hover:text-[#ede8dc]'
          }`}
          title="Cities: Skylines II Info Views (Click to inspect city networks)"
        >
          <Layers size={14} className={activeInfoView !== 'none' ? 'text-[#c29b38]' : ''} />
          <span>INFO VIEWS</span>
          <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Quick Icon Selector */}
        <div className="flex items-center gap-1 pl-1 border-l border-[#242d33]">
          {infoViewsList.map((view) => {
            const Icon = view.icon;
            const isActive = activeInfoView === view.id;
            return (
              <button
                key={view.id}
                onClick={() => handleSelectView(view.id)}
                className={`p-1.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-[#252f36] shadow-sm ring-1 ring-white/20'
                    : 'hover:bg-[#1a2126] text-[#79858f] hover:text-[#ede8dc]'
                }`}
                style={{ color: isActive ? view.color : undefined }}
                title={`${view.label} Info View`}
              >
                <Icon size={14} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Expanded Active Info View Inspector Drawer */}
      {isOpen && (
        <div className="w-[320px] bg-[#14181b]/95 border border-[#3b4750] rounded-xl p-3.5 text-[#ede8dc] shadow-2xl backdrop-blur-md animate-in fade-in duration-150 space-y-3">
          <div className="flex items-center justify-between border-b border-[#242c32] pb-2">
            <div className="flex items-center gap-2">
              {currentView ? (
                <>
                  <currentView.icon size={16} style={{ color: currentView.color }} />
                  <div>
                    <h3 className="text-xs font-bold leading-tight uppercase font-mono tracking-wide">
                      {currentView.label}
                    </h3>
                    <p className="text-[10px] text-[#8a8376]">Active Heatmap Layer</p>
                  </div>
                </>
              ) : (
                <>
                  <Layers size={16} className="text-[#c29b38]" />
                  <div>
                    <h3 className="text-xs font-bold leading-tight uppercase font-mono tracking-wide">
                      Select Info View
                    </h3>
                    <p className="text-[10px] text-[#8a8376]">33 Citywide Simulation Channels</p>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                setActiveInfoView('none');
              }}
              className="p-1 rounded text-[#7e8e7c] hover:text-[#ede8dc] hover:bg-[#1f262c]"
            >
              <X size={14} />
            </button>
          </div>

          {/* Detailed Data Views based on selection */}
          {activeInfoView === 'electricity' && (
            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-[#192127] border border-[#2b3944] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#8a8376]">Power Production:</span>
                  <span className="font-bold text-[#f1c40f]">{utilityStats.powerCapacityMW.toLocaleString()} MW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8a8376]">Current Consumption:</span>
                  <span className="font-bold text-[#ede8dc]">{utilityStats.powerConsumptionMW.toLocaleString()} MW</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#25323d]">
                  <span className="text-[#8a8376]">Surplus / Deficit:</span>
                  <span className={`font-bold ${utilityStats.powerSurplusMW >= 0 ? 'text-[#2ecc71]' : 'text-[#e74c3c]'}`}>
                    +{utilityStats.powerSurplusMW.toLocaleString()} MW
                  </span>
                </div>
              </div>

              {/* Grid Status Pill */}
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#16271c] border border-[#2a4d35] text-[#2ecc71] text-[11px]">
                <CheckCircle2 size={13} className="shrink-0" />
                <span>Grid Integrated: High-voltage lines running inside roads</span>
              </div>
            </div>
          )}

          {activeInfoView === 'water' && (
            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-[#152129] border border-[#263b4a] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#8a8376]">Water Pumping Capacity:</span>
                  <span className="font-bold text-[#3498db]">{utilityStats.waterCapacityM3.toLocaleString()} m³/day</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8a8376]">Citywide Consumption:</span>
                  <span className="font-bold text-[#ede8dc]">{utilityStats.waterConsumptionM3.toLocaleString()} m³/day</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#223543]">
                  <span className="text-[#8a8376]">Sewage Treatment:</span>
                  <span className="font-bold text-[#2ecc71]">{utilityStats.sewageTreatmentPercent}% Operational</span>
                </div>
              </div>
            </div>
          )}

          {activeInfoView === 'traffic' && (
            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-[#271b1d] border border-[#4d2d31] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#8a8376]">Traffic Flow Efficiency:</span>
                  <span className="font-bold text-[#2ecc71]">{utilityStats.trafficFlowPercent}% Flow</span>
                </div>
                <div className="w-full bg-[#1b1214] h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#e74c3c] via-[#f39c12] to-[#2ecc71]"
                    style={{ width: `${utilityStats.trafficFlowPercent}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#8a8376] leading-tight pt-1">
                  Bottlenecks identified near Central Avenue. Upgrade to 4-lane avenues or roundabouts to relieve congestion.
                </p>
              </div>
            </div>
          )}

          {activeInfoView === 'land_value' && (
            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-[#16271e] border border-[#284936] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#8a8376]">Average Land Value:</span>
                  <span className="font-bold text-[#2ecc71]">{utilityStats.averageLandValue} Credits/m²</span>
                </div>
                <div className="flex items-center gap-2 pt-1 text-[10px]">
                  <span className="w-3 h-3 rounded bg-[#2ecc71] shrink-0" />
                  <span className="text-[#8a8376]">Lush Green: High Value (Level 5 Skyscrapers)</span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="w-3 h-3 rounded bg-[#a6824a] shrink-0" />
                  <span className="text-[#8a8376]">Amber: Developing (Level 1–2 Low Density)</span>
                </div>
              </div>
            </div>
          )}

          {activeInfoView === 'pollution' && (
            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-[#231726] border border-[#46284d] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#8a8376]">Environmental Pollution Index:</span>
                  <span className="font-bold text-[#9b59b6]">{utilityStats.pollutionIndex}% (Low)</span>
                </div>
                <p className="text-[10px] text-[#8a8376] leading-tight">
                  Industrial emissions contained within Vulcan Forge. Buffer zones and wind turbines prevent smog drift into Oasis Terraces.
                </p>
              </div>
            </div>
          )}

          {activeInfoView === 'happiness' && (
            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-[#152623] border border-[#264b44] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#8a8376]">Citizen Approval Rating:</span>
                  <span className="font-bold text-[#1abc9c]">91% Blissful</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                  <div className="p-1 rounded bg-[#101c1a]">Healthcare: <strong className="text-[#2ecc71]">95%</strong></div>
                  <div className="p-1 rounded bg-[#101c1a]">Education: <strong className="text-[#2ecc71]">96%</strong></div>
                  <div className="p-1 rounded bg-[#101c1a]">Safety & Order: <strong className="text-[#2ecc71]">94%</strong></div>
                  <div className="p-1 rounded bg-[#101c1a]">Parks & Leisure: <strong className="text-[#2ecc71]">88%</strong></div>
                </div>
              </div>
            </div>
          )}

          {activeInfoView === 'none' && (
            <div className="grid grid-cols-2 gap-2">
              {infoViewsList.map((view) => {
                const Icon = view.icon;
                return (
                  <button
                    key={view.id}
                    onClick={() => handleSelectView(view.id)}
                    className="p-2.5 rounded-lg bg-[#182025] hover:bg-[#222c33] border border-[#2b3740] text-left transition-all group"
                  >
                    <Icon size={16} style={{ color: view.color }} />
                    <h4 className="text-[11px] font-bold mt-1 text-[#ede8dc] group-hover:text-white">
                      {view.label}
                    </h4>
                    <p className="text-[9px] text-[#8a8376] mt-0.5 line-clamp-1">
                      {view.description}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
