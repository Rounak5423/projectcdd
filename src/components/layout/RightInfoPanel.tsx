import React from 'react';
import {
  X,
  Building2,
  Zap,
  Users,
  Hammer,
  Trash2,
  Heart,
  Shield,
  Leaf,
  GraduationCap,
  Scale,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Target,
  Clock,
} from 'lucide-react';
import { useGameState } from '../../context/GameStateContext';

export default function RightInfoPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const {
    selectedBuilding,
    selectBuilding,
    upgradeBuilding,
    demolishBuilding,
    resources,
    events,
    quests,
    districts,
  } = useGameState();

  const shortages = [
    { label: 'Bread & Hydro Rations', status: 'Deficit (-2.7k)', urgent: true },
    { label: 'Grid Power Margin', status: 'Optimal (+85 MW)', urgent: false },
    { label: 'Timber & Stone', status: 'Surplus (+220 T)', urgent: false },
  ];

  return (
    <>
      {/* Backdrop overlay for small screens */}
      {isOpen && (
        <div
          onClick={onClose}
          className="xl:hidden fixed inset-0 bg-black/40 backdrop-blur-xs z-30 transition-opacity"
        />
      )}

      <aside
        className={`absolute top-0 right-0 bottom-0 w-[340px] max-w-[90vw] bg-[#14181b]/98 backdrop-blur-md border-l border-[#262f35] flex flex-col h-full overflow-hidden text-[#ede8dc] shadow-2xl z-40 transition-transform duration-200 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
      >
        {/* Panel Header */}
        <div className="p-3.5 border-b border-[#262f35] flex items-center justify-between bg-[#111417]">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#c29b38]" />
            <span className="eyebrow tracking-wider text-[#aba393]">
              {selectedBuilding ? 'FACILITY INSPECTION' : 'SETTLEMENT OVERVIEW'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#7e8e7c] hover:text-[#ede8dc] hover:bg-[#1f262c] transition-colors"
            title="Close inspector"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 space-y-4">
          {selectedBuilding ? (
            /* ================= CONTEXTUAL BUILDING INSPECTOR ================= */
            <div className="space-y-3.5">
              <div className="panel p-3.5 bg-[#171d20] border-[#2b353b]">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#20272c] text-[#7ea376] border border-[#2f3b43]">
                      {selectedBuilding.category}
                    </span>
                    <h3 className="text-sm font-bold mt-1.5 text-[#ede8dc]">{selectedBuilding.name}</h3>
                    <p className="text-[11px] text-[#8a8376] mt-0.5">District: {selectedBuilding.districtId}</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#c29b38] bg-[#221f15] px-2 py-0.5 rounded border border-[#4d3f1d]">
                    Level {selectedBuilding.level} / {selectedBuilding.maxLevel}
                  </span>
                </div>

                {/* Status & Structural Health */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-[#101416] border border-[#232b30]">
                    <span className="text-[9px] text-[#6c767e] uppercase block font-mono">Status</span>
                    <p className="font-semibold text-[#7ea376] capitalize text-[11px] mt-0.5">{selectedBuilding.status}</p>
                  </div>
                  <div className="p-2 rounded bg-[#101416] border border-[#232b30]">
                    <span className="text-[9px] text-[#6c767e] uppercase block font-mono">Structural</span>
                    <p className="font-semibold text-[#ede8dc] text-[11px] mt-0.5">{selectedBuilding.health}%</p>
                  </div>
                </div>

                {/* Operating Efficiency Bar */}
                <div className="mt-2.5">
                  <div className="flex justify-between text-[10px] mb-1 font-mono">
                    <span className="text-[#8a8376]">Operating Efficiency</span>
                    <span className="text-[#7ea376] font-semibold">{selectedBuilding.efficiency}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-[#101416] overflow-hidden">
                    <div
                      className="h-full bg-[#7ea376] rounded-full transition-all duration-200"
                      style={{ width: `${selectedBuilding.efficiency}%` }}
                    />
                  </div>
                </div>

                {/* Workforce Assigned */}
                <div className="mt-3 flex items-center justify-between text-xs py-2 border-t border-[#232b30]">
                  <div className="flex items-center gap-1.5 text-[#8a8376]">
                    <Users size={13} className="text-[#7ea376]" />
                    <span className="text-[11px]">Workforce Assigned</span>
                  </div>
                  <span className="font-mono font-semibold text-[11px]">
                    {selectedBuilding.workersAssigned} / {selectedBuilding.workersNeeded}
                  </span>
                </div>
              </div>

              {/* Upgrade and Demolish Actions */}
              <div className="space-y-1.5">
                <button
                  disabled={selectedBuilding.level >= selectedBuilding.maxLevel || resources.materials < selectedBuilding.level * 280}
                  onClick={() => upgradeBuilding(selectedBuilding.id)}
                  className={`w-full py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    selectedBuilding.level >= selectedBuilding.maxLevel
                      ? 'bg-[#1b2126] text-[#55646f] cursor-not-allowed border border-[#293238]'
                      : resources.materials < selectedBuilding.level * 280
                      ? 'bg-[#221f15] text-[#8f7742] border border-[#3d3216] cursor-not-allowed'
                      : 'btn-game-green shadow-xs'
                  }`}
                >
                  <Hammer size={13} />
                  <span>
                    {selectedBuilding.level >= selectedBuilding.maxLevel
                      ? 'Maximum Level'
                      : `Upgrade (${selectedBuilding.level * 280} Materials)`}
                  </span>
                </button>

                <button
                  onClick={() => demolishBuilding(selectedBuilding.id)}
                  className="w-full py-1.5 px-3 rounded-md text-[11px] font-semibold text-[#c94c4c] bg-[#1f1717] hover:bg-[#2b1e1e] border border-[#3d2424] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Trash2 size={12} />
                  <span>Demolish (Salvage 150 Materials)</span>
                </button>

                <button
                  onClick={() => selectBuilding(null)}
                  className="w-full py-1 text-[10px] text-[#8a8376] hover:text-[#ede8dc] transition-colors"
                >
                  Deselect Building
                </button>
              </div>
            </div>
          ) : (
            /* ================= CONTEXTUAL SETTLEMENT OVERVIEW ================= */
            <div className="space-y-4">
              {/* 1. Civilisation Health */}
              <div className="panel p-3 bg-[#171d20] border-[#2b353b]">
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#232b30]">
                  <span className="eyebrow text-[#aba393]">CIVILISATION HEALTH</span>
                  <span className="text-xs font-mono font-bold text-[#7ea376]">{resources.happiness}/100</span>
                </div>

                <div className="space-y-2">
                  {[
                    { label: 'Public Happiness', val: resources.happiness, icon: Heart, color: '#7ea376' },
                    { label: 'Societal Stability', val: resources.stability, icon: Shield, color: '#c29b38' },
                    { label: 'Biosphere Purity', val: resources.environmentalIndex, icon: Leaf, color: '#5b87a8' },
                    { label: 'Education Level', val: resources.educationIndex, icon: GraduationCap, color: '#aa9b8d' },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="space-y-0.5">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-[#8a8376] flex items-center gap-1">
                            <Icon size={10} style={{ color: item.color }} />
                            {item.label}
                          </span>
                          <span className="text-[#ede8dc] font-semibold">{item.val}%</span>
                        </div>
                        <div className="h-1 rounded-full bg-[#101416] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${item.val}%`, backgroundColor: item.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Resource Shortages & Balances */}
              <div className="panel p-3 bg-[#171d20] border-[#2b353b]">
                <span className="eyebrow text-[#aba393] block mb-2">SUPPLY & SHORTAGES</span>
                <div className="space-y-1.5">
                  {shortages.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-1.5 rounded bg-[#101416] border border-[#232b30] flex items-center justify-between text-xs"
                    >
                      <span className="text-[11px] text-[#ede8dc]">{s.label}</span>
                      <span
                        className={`text-[10px] font-mono font-semibold ${
                          s.urgent ? 'text-[#c94c4c]' : 'text-[#7ea376]'
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Current Objectives */}
              <div className="panel p-3 bg-[#171d20] border-[#2b353b]">
                <div className="flex items-center gap-1.5 mb-2">
                  <Target size={12} className="text-[#c29b38]" />
                  <span className="eyebrow text-[#aba393]">CURRENT OBJECTIVES</span>
                </div>
                <div className="space-y-2">
                  {quests.slice(0, 2).map((q) => (
                    <div key={q.id} className="p-2 rounded bg-[#101416] border border-[#232b30] space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-[#ede8dc] text-[11px] truncate">{q.title}</span>
                        <span className="text-[10px] font-mono text-[#c29b38]">+{q.rewardGrc} GRC</span>
                      </div>
                      <p className="text-[10px] text-[#8a8376] leading-tight">{q.target}</p>
                      <div className="h-1 rounded-full bg-[#1a2024] overflow-hidden mt-1">
                        <div
                          className="h-full bg-[#7ea376] rounded-full"
                          style={{ width: `${Math.min(100, (q.progress / q.maxProgress) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Recent Events Chronicle */}
              <div className="panel p-3 bg-[#171d20] border-[#2b353b]">
                <div className="flex items-center gap-1.5 mb-2">
                  <Clock size={12} className="text-[#8f7742]" />
                  <span className="eyebrow text-[#aba393]">RECENT EVENTS</span>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                  {events.slice(0, 3).map((ev) => (
                    <div
                      key={ev.id}
                      className="p-1.5 rounded bg-[#101416] border-l-2 border-[#8f7742] text-xs space-y-0.5"
                    >
                      <div className="flex justify-between text-[9px] font-mono text-[#6c767e]">
                        <span>Yr {ev.year}, D{ev.day}</span>
                        <span className="uppercase text-[#7ea376]">{ev.category}</span>
                      </div>
                      <p className="text-[11px] font-medium text-[#ede8dc] leading-tight">{ev.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
