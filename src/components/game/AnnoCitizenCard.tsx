import React, { useState } from 'react';
import {
  X,
  Wheat,
  Droplets,
  Zap,
  Sparkles,
  Shield,
  Coins,
  TrendingUp,
  Brain,
  Activity,
  Compass,
} from 'lucide-react';
import { Citizen } from '../../types/game';
import { useGameState } from '../../context/GameStateContext';

interface AnnoCitizenCardProps {
  citizen: Citizen | null;
  onClose: () => void;
}

export default function AnnoCitizenCard({ citizen, onClose }: AnnoCitizenCardProps) {
  const [activeTab, setActiveTab] = useState<'needs' | 'satisfaction' | 'psychology'>('psychology');
  const { citizenReport } = useGameState();

  if (!citizen) return null;

  const detailed = citizenReport.citizenAgents.find((a) => a.id === citizen.id);

  const drives = detailed?.drives || {
    hunger: 20,
    thirst: 15,
    energy: 88,
    safety: 90,
    socialBond: 85,
    purposeMorale: 90,
  };

  const needsList = [
    { label: 'Sustenance & Food', icon: Wheat, current: 100 - drives.hunger, color: '#c4b37d' },
    { label: 'Clean Water', icon: Droplets, current: 100 - drives.thirst, color: '#6e98b3' },
    { label: 'Physiological Rest', icon: Zap, current: drives.energy, color: '#d9a941' },
    { label: 'Social & Kinship Bond', icon: Sparkles, current: drives.socialBond, color: '#78a689' },
    { label: 'Civic Security & Safety', icon: Shield, current: drives.safety, color: '#aa9b8d' },
  ];

  return (
    <div className="w-[300px] rounded-lg overflow-hidden shadow-2xl border border-[#3d4b55] bg-[#14181b]/98 text-[#ede8dc] select-none z-30">
      {/* Top Banner */}
      <div className="bg-[#101416] p-2.5 border-b border-[#242c32] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#c29b38]" />
          <span className="text-[10px] font-mono font-bold tracking-wider text-[#aba393] uppercase">
            CITIZEN DOSSIER
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-[#7e8e7c] hover:text-[#ede8dc] hover:bg-[#1f262c] transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <div className="p-3.5 space-y-3">
        {/* Portrait & Title Block */}
        <div className="flex items-center gap-3 pb-2.5 border-b border-[#232b31]">
          {/* Oval Portrait Ring */}
          <div className="w-14 h-16 rounded-full border border-[#8f7742] p-0.5 bg-[#1a2126] flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden">
            <div className="w-full h-full rounded-full bg-[#20282f] flex flex-col items-center justify-center text-center">
              <span className="text-lg">
                {citizen.gender === 'F' ? '👩‍🌾' : citizen.gender === 'M' ? '👨‍🌾' : '🧑‍🔧'}
              </span>
              <span className="text-[8px] font-mono text-[#aba393] font-bold">AGE {citizen.age}</span>
            </div>
            <div className="absolute bottom-0.5 right-1.5 w-2 h-2 rounded-full bg-[#7ea376] border border-[#14181b]" />
          </div>

          <div className="min-w-0">
            <span className="text-[8px] font-mono font-bold text-[#c29b38] uppercase px-1 py-0.2 rounded bg-[#201d14] border border-[#4d3f1d]">
              {citizen.status} STRATA
            </span>
            <h3 className="text-sm font-bold text-[#ede8dc] mt-0.5 truncate">
              {citizen.name}
            </h3>
            <p className="text-[11px] text-[#7ea376] truncate font-medium">{citizen.occupation}</p>
            <p className="text-[10px] text-[#8a8376] truncate">{citizen.district}</p>
          </div>
        </div>

        {/* Live Thought Stream & Current Action */}
        <div className="p-2 rounded bg-[#0d1216] border border-[#1e2a35] space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-1 text-[#00e5ff] font-bold">
              <Brain size={11} /> LIVE REASONING
            </span>
            <span className="text-[#a0c4d8] font-mono capitalize">
              {detailed?.currentActivity ? detailed.currentActivity.replace('_', ' ') : 'Active duty'}
            </span>
          </div>
          <p className="text-[11px] italic text-[#d4e4ec] leading-relaxed">
            "{detailed?.currentThought || 'Working to ensure our settlement survives and grows.'}"
          </p>
          <div className="flex items-center gap-1.5 text-[9px] text-[#8a9ba8] pt-0.5">
            <Compass size={10} className="text-[#c29b38]" />
            <span className="truncate">Bound for: {detailed?.currentDestinationName || citizen.workplaceAddress}</span>
          </div>
        </div>

        {/* Tab Buttons (Psychology / Needs / Satisfaction) */}
        <div className="flex items-center bg-[#0f1214] p-0.5 rounded-md border border-[#232b30]">
          <button
            onClick={() => setActiveTab('psychology')}
            className={`flex-1 py-1 rounded text-[10px] font-semibold transition-all ${
              activeTab === 'psychology'
                ? 'bg-[#27323b] text-[#ffffff] shadow-xs'
                : 'text-[#8a8376] hover:text-[#ede8dc]'
            }`}
          >
            Psychology
          </button>
          <button
            onClick={() => setActiveTab('needs')}
            className={`flex-1 py-1 rounded text-[10px] font-semibold transition-all ${
              activeTab === 'needs'
                ? 'bg-[#27323b] text-[#ffffff] shadow-xs'
                : 'text-[#8a8376] hover:text-[#ede8dc]'
            }`}
          >
            Maslow Needs
          </button>
          <button
            onClick={() => setActiveTab('satisfaction')}
            className={`flex-1 py-1 rounded text-[10px] font-semibold transition-all ${
              activeTab === 'satisfaction'
                ? 'bg-[#27323b] text-[#ffffff] shadow-xs'
                : 'text-[#8a8376] hover:text-[#ede8dc]'
            }`}
          >
            Vitals
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'psychology' ? (
          <div className="space-y-1.5 text-xs">
            <div className="p-2 rounded bg-[#101416] border border-[#22292f] space-y-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#8a9ba8]">Civilization Era:</span>
                <span className="font-mono font-bold text-[#c29b38] capitalize">
                  {detailed?.era ? detailed.era.replace('_', ' ') : 'Pioneer Survival'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#8a9ba8]">Commute Mode:</span>
                <span className="font-mono text-[#00e5ff] capitalize">{detailed?.commuteMode || 'Walking'}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#8a9ba8]">Purpose & Morale:</span>
                <span className="font-mono font-bold text-[#7ea376]">{drives.purposeMorale}%</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#8a9ba8]">Cognitive Scaffolding:</span>
                <span className="font-mono text-[#6e98b3]">{citizen.aiAssistanceUsage}%</span>
              </div>
            </div>
          </div>
        ) : activeTab === 'needs' ? (
          <div className="space-y-2">
            {needsList.map((need) => {
              const Icon = need.icon;
              return (
                <div key={need.label} className="p-1.5 rounded bg-[#101416] border border-[#22292f]">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1.5 text-[#ede8dc]">
                      <Icon size={11} style={{ color: need.color }} />
                      <span className="text-[10px]">{need.label}</span>
                    </span>
                    <span className="font-mono text-[10px] font-bold" style={{ color: need.color }}>
                      {need.current}%
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-[#1a2126] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${need.current}%`, backgroundColor: need.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2 p-2 rounded bg-[#101416] border border-[#22292f] text-xs">
            <div className="flex justify-between items-center py-0.5 border-b border-[#1f262c]">
              <span className="text-[#8a8376] text-[11px]">Happiness:</span>
              <span className="font-mono font-bold text-[#7ea376] text-[11px]">{citizen.happiness}/100</span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-[#1f262c]">
              <span className="text-[#8a8376] text-[11px]">Health Vitals:</span>
              <span className="font-mono font-bold text-[#78a689] text-[11px]">{citizen.health}/100</span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-[#1f262c]">
              <span className="text-[#8a8376] text-[11px]">Education:</span>
              <span className="font-mono text-[#6e98b3] text-[11px]">{citizen.educationLevel}</span>
            </div>
          </div>
        )}

        {/* Tax Contribution */}
        <div className="p-2 rounded bg-[#171612] border border-[#3b321a] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5 text-[#ede8dc]">
            <Coins size={13} className="text-[#c29b38]" />
            <span className="font-bold text-xs text-[#dfb74a]">
              +{(citizen.income * 0.003).toFixed(0)} Credits
            </span>
          </div>
          <span className="text-[9px] text-[#8a8376] uppercase">Tax / Cycle</span>
        </div>
      </div>
    </div>
  );
}
