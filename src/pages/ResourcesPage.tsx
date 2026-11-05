import React from 'react';
import {
  Boxes,
  Wheat,
  Droplets,
  Zap,
  Package,
  FlaskConical,
  Coins,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  Layers,
  TrendingUp,
} from 'lucide-react';
import { useGameState } from '../context/GameStateContext';

export default function ResourcesPage() {
  const { resources, rates } = useGameState();

  const resourceCards = [
    {
      id: 'food',
      name: 'Agrarian Food Rations',
      stockpile: resources.food,
      rate: rates.foodRate,
      reserveDays: Math.round(resources.food / 38),
      icon: Wheat,
      color: '#c4d49d',
      desc: 'Synthetic proteins, aeroponic greens, and algal starch composites.',
      facilities: ['Valley Bio-Dome Prime', 'Algal Synthesis Basin'],
    },
    {
      id: 'water',
      name: 'Potable Hydro-Reserves',
      stockpile: resources.water,
      rate: rates.waterRate,
      reserveDays: Math.round(resources.water / 80),
      icon: Droplets,
      color: '#82a6bd',
      desc: 'Subterranean closed-loop aquifer filtration and pristine glacial runoffs.',
      facilities: ['Closed-Loop Aquifer Network', 'Verdant River Water Siphon'],
    },
    {
      id: 'energy',
      name: 'Grid Power Generation',
      stockpile: resources.energy,
      rate: rates.energyRate,
      unit: 'MW',
      reserveDays: 'Continuous Base Grid',
      icon: Zap,
      color: '#e5c97b',
      desc: 'Renewable molten-salt solar concentration and ridge vortex turbines.',
      facilities: ['Helios Solar Concentration Array', 'Ridge Wind Generator Alpha'],
    },
    {
      id: 'materials',
      name: 'High-Tensile Structural Materials',
      stockpile: resources.materials,
      rate: rates.materialsRate,
      reserveDays: Math.round(resources.materials / 126),
      icon: Package,
      color: '#bd9fa6',
      desc: 'Refined carbon nanotubes, structural ceramics, and molecular print feedstock.',
      facilities: ['Vulcan Smelter Hub A', 'Vulcan Composites Complex'],
    },
    {
      id: 'research',
      name: 'Civilisational Research Points',
      stockpile: resources.researchPoints,
      rate: rates.researchRate,
      reserveDays: 'Accumulated Knowledge Pool',
      icon: FlaskConical,
      color: '#82bd8e',
      desc: 'Empirical data streams, telemetry findings, and algorithmic theorem synthesis.',
      facilities: ['Quantum Telemetry Array', 'Polytechnic Institute'],
    },
    {
      id: 'grc',
      name: 'Genesis Research Credits (GRC)',
      stockpile: resources.grc,
      rate: rates.grcEarnRate,
      unit: 'GRC',
      reserveDays: 'High Strategist Wallet',
      icon: Coins,
      color: '#c6a76a',
      desc: 'Earnable meta-currency awarded through achievements, experiments, and milestones.',
      facilities: ['High Council Citadel', 'Global Milestone Ledger'],
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 overflow-y-auto custom-scrollbar text-[#e8e9e3] max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#39443a] gap-4">
        <div>
          <span className="eyebrow text-[#c6a76a]">STRATEGIC STOCKPILES</span>
          <h1 className="text-2xl font-bold text-[#f3f5ef] mt-0.5">Commodity & Supply Chains</h1>
          <p className="text-xs text-[#9da99b] mt-1">
            Reserve depth, supply buffer horizons, and contributing production infrastructure.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-[#182119] p-3 rounded-xl border border-[#2e3c2f]">
          <ShieldCheck size={16} className="text-[#a6bd82]" />
          <span className="text-[#a6bd82] font-semibold">ALL CRITICAL RESERVES SECURE</span>
        </div>
      </div>

      {/* Grid of Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {resourceCards.map((res) => {
          const Icon = res.icon;

          return (
            <div
              key={res.id}
              className="panel p-5 bg-[#182119] border-[#313f32] flex flex-col justify-between hover:border-[#4d614e] transition-all"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${res.color}22` }}
                    >
                      <Icon size={18} style={{ color: res.color }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#f3f5ef]">{res.name}</h3>
                      <span className="text-[10px] font-mono text-[#a6bd82]">
                        +{res.rate} {res.unit || 'Units'}/day
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-[#131914] border border-[#253026]">
                  <span className="text-[10px] font-mono text-[#9da99b] uppercase block">
                    CURRENT STOCKPILE
                  </span>
                  <p className="text-2xl font-bold font-mono text-[#f3f5ef] mt-0.5">
                    {res.stockpile.toLocaleString()} {res.unit || ''}
                  </p>
                  <p className="text-[11px] text-[#c6a76a] font-mono mt-1">
                    Reserve Runway: {res.reserveDays} {typeof res.reserveDays === 'number' ? 'days' : ''}
                  </p>
                </div>

                <p className="text-xs text-[#9da99b] mt-3 leading-relaxed">{res.desc}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#29342a]">
                <span className="text-[10px] font-mono text-[#8e9c8c] uppercase block mb-1">
                  Primary Source Facilities:
                </span>
                <div className="space-y-1">
                  {res.facilities.map((f, i) => (
                    <div
                      key={i}
                      className="text-xs text-[#dce9ca] flex items-center gap-1.5 font-medium"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#a6bd82]" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
