import React from 'react';
import {
  Wheat,
  Droplets,
  Zap,
  Package,
  FlaskConical,
  Coins,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { useGameState } from '../../context/GameStateContext';

export default function ResourcePanel() {
  const { resources, rates } = useGameState();

  const items = [
    { label: 'FOOD RATIONS', val: resources.food, rate: rates.foodRate, icon: Wheat, color: '#c4d49d', runway: '104 days' },
    { label: 'POTABLE HYDRO', val: resources.water, rate: rates.waterRate, icon: Droplets, color: '#82a6bd', runway: '242 days' },
    { label: 'POWER GRID', val: `${resources.energy} MW`, rate: rates.energyRate, icon: Zap, color: '#e5c97b', runway: 'Self-Sustaining' },
    { label: 'STRUCTURAL FAB', val: resources.materials, rate: rates.materialsRate, icon: Package, color: '#bd9fa6', runway: '68 days' },
    { label: 'RESEARCH ACCRUAL', val: resources.researchPoints, rate: rates.researchRate, icon: FlaskConical, color: '#82bd8e', runway: 'Cumulative' },
    { label: 'RESEARCH CREDITS', val: resources.grc, rate: rates.grcEarnRate, icon: Coins, color: '#c6a76a', runway: 'Sovereign Treasury' },
  ];

  return (
    <div className="panel p-5 bg-[#182119] border-[#313f32] space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#29342a]">
        <div className="flex items-center gap-2">
          <ShieldCheck size={17} className="text-[#a6bd82]" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#f3f5ef]">
            Strategic Resource Stockpiles
          </h3>
        </div>
        <span className="text-[10px] font-mono text-[#a6bd82] font-semibold">
          ALL CRITICAL RESERVES OPTIMAL
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="p-3.5 rounded-lg bg-[#141914] border border-[#273328]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#8e9b8b] uppercase font-semibold">
                  {item.label}
                </span>
                <Icon size={15} style={{ color: item.color }} />
              </div>

              <p className="text-lg font-bold font-mono text-[#f3f5ef] mt-2">
                {typeof item.val === 'number' ? item.val.toLocaleString() : item.val}
              </p>

              <div className="mt-2 pt-2 border-t border-[#232c25] flex items-center justify-between text-[10px] font-mono">
                <span className="text-[#a6bd82]">+{item.rate}/day</span>
                <span className="text-[#c6a76a]">{item.runway}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

