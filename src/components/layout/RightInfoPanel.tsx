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
  ShieldAlert,
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
    achievements,
    civilization,
    disasterState,
    setActiveDrawer,
  } = useGameState();

  if (!isOpen) return null;

  return (
    <aside className="w-[340px] shrink-0 bg-[#19201a] border-l border-[#39443a] flex flex-col h-full overflow-hidden text-[#e8e9e3] shadow-2xl z-20">
      {/* Panel Header */}
      <div className="p-4 border-b border-[#39443a] flex items-center justify-between bg-[#151a16]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#c6a76a] animate-pulse" />
          <span className="eyebrow tracking-wider text-[#c6a76a]">
            {selectedBuilding ? 'TACTICAL INSPECTOR' : 'CIVILISATION VITALS'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-[#9da99b] hover:text-white hover:bg-[#252f26] transition-colors"
          title="Close panel"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5">
        {selectedBuilding ? (
          /* ================= BUILDING INSPECTOR ================= */
          <div className="space-y-4">
            <div className="panel p-4 bg-[#1e261f] border-[#445546]">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#2b372c] text-[#a6bd82] border border-[#405442]">
                    {selectedBuilding.category}
                  </span>
                  <h3 className="text-base font-bold mt-2 text-[#f3f4f0]">{selectedBuilding.name}</h3>
                  <p className="text-xs text-[#9da99b] mt-0.5">District: {selectedBuilding.districtId}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-[#c6a76a] bg-[#2d281a] px-2 py-1 rounded border border-[#615232]">
                    Lvl {selectedBuilding.level} / {selectedBuilding.maxLevel}
                  </span>
                </div>
              </div>

              {/* Status and Health */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-[#161c17] border border-[#2e3a2f]">
                  <span className="text-[10px] text-[#9da99b]">STATUS</span>
                  <p className="font-semibold text-[#a6bd82] capitalize">{selectedBuilding.status}</p>
                </div>
                <div className="p-2 rounded bg-[#161c17] border border-[#2e3a2f]">
                  <span className="text-[10px] text-[#9da99b]">STRUCTURAL HEALTH</span>
                  <p className="font-semibold text-[#f3f4f0]">{selectedBuilding.health}%</p>
                </div>
              </div>

              {/* Efficiency Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#9da99b]">Operating Efficiency</span>
                  <span className="text-[#a6bd82] font-semibold">{selectedBuilding.efficiency}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#161c17] overflow-hidden">
                  <div
                    className="h-full bg-[#a6bd82] rounded-full transition-all duration-300"
                    style={{ width: `${selectedBuilding.efficiency}%` }}
                  />
                </div>
              </div>

              {/* Workers Assigned */}
              <div className="mt-3 flex items-center justify-between text-xs py-2 border-t border-[#2e3a2f]">
                <div className="flex items-center gap-1.5 text-[#9da99b]">
                  <Users size={14} className="text-[#a6bd82]" />
                  <span>Workforce Capacity</span>
                </div>
                <span className="font-mono font-semibold">
                  {selectedBuilding.workersAssigned} / {selectedBuilding.workersNeeded}
                </span>
              </div>
            </div>

            {/* Actions: Upgrade & Demolish */}
            <div className="space-y-2">
              <button
                disabled={selectedBuilding.level >= selectedBuilding.maxLevel || resources.materials < selectedBuilding.level * 280}
                onClick={() => upgradeBuilding(selectedBuilding.id)}
                className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  selectedBuilding.level >= selectedBuilding.maxLevel
                    ? 'bg-[#252f26] text-[#717e6e] cursor-not-allowed border border-[#344235]'
                    : resources.materials < selectedBuilding.level * 280
                    ? 'bg-[#2f271f] text-[#c6a76a]/60 border border-[#4a3d2b] cursor-not-allowed'
                    : 'bg-[#405439] hover:bg-[#506947] text-[#dce9ca] border border-[#6d8a5f] shadow-lg'
                }`}
              >
                <Hammer size={14} />
                <span>
                  {selectedBuilding.level >= selectedBuilding.maxLevel
                    ? 'Max Level Reached'
                    : `Upgrade Facility (${selectedBuilding.level * 280} Materials)`}
                </span>
              </button>

              <button
                onClick={() => demolishBuilding(selectedBuilding.id)}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-[#d47e69] bg-[#2a1b18] hover:bg-[#3b231f] border border-[#522d25] flex items-center justify-center gap-2 transition-all"
              >
                <Trash2 size={13} />
                <span>Demolish (Recover 150 Materials)</span>
              </button>

              <button
                onClick={() => selectBuilding(null)}
                className="w-full py-1.5 text-[11px] text-[#9da99b] hover:text-white"
              >
                Deselect Building
              </button>
            </div>
          </div>
        ) : (
          /* ================= CIVILISATION VITALS ================= */
          <div className="space-y-5">
            {/* Disaster & Crisis Readiness Quick Card */}
            <div className="panel p-3.5 bg-[#1e261f] border-[#39443a]">
              <div className="flex items-center justify-between mb-2">
                <span className="eyebrow text-[#c6a76a]">DISASTER & EMERGENCY</span>
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    disasterState?.activeDisaster
                      ? 'bg-[#4d1616] text-[#ff8e8e] border border-[#e74c3c] animate-pulse'
                      : 'bg-[#1b3823] text-[#2ecc71] border border-[#2b5936]'
                  }`}
                >
                  {disasterState?.activeDisaster ? 'CRISIS ACTIVE' : 'SYSTEMS NORMAL'}
                </span>
              </div>
              {disasterState?.activeDisaster ? (
                <div className="p-2.5 rounded bg-[#2e1717] border border-[#6b2525] text-xs space-y-1">
                  <p className="font-bold text-[#ff8e8e] uppercase text-[11px]">
                    🚨 {disasterState.activeDisaster.name} ({disasterState.activeDisaster.intensity})
                  </p>
                  <p className="text-[10px] text-[#e8e9e3]">
                    Sector: {disasterState.activeDisaster.districtId} · Stage: {disasterState.activeDisaster.stage.toUpperCase()}
                  </p>
                  <div className="flex items-center justify-between text-[9px] font-mono text-[#ffb0b0] pt-1">
                    <span>Containment</span>
                    <span>{disasterState.activeDisaster.containmentPercent.toFixed(0)}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-[#150a0a] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#e74c3c] to-[#2ecc71]"
                      style={{ width: `${disasterState.activeDisaster.containmentPercent}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                  <div className="p-1.5 rounded bg-[#161c17] border border-[#2e3a2f]">
                    <span className="text-[#8e9c8c] block text-[9px]">FLOOD RISK</span>
                    <span className="font-bold text-[#82a6bd]">{disasterState?.risks?.floodRiskPercent || 0}%</span>
                  </div>
                  <div className="p-1.5 rounded bg-[#161c17] border border-[#2e3a2f]">
                    <span className="text-[#8e9c8c] block text-[9px]">WILDFIRE RISK</span>
                    <span className="font-bold text-[#e5a07b]">{disasterState?.risks?.wildfireRiskPercent || 0}%</span>
                  </div>
                </div>
              )}
              <button
                onClick={() => setActiveDrawer('disaster')}
                className="mt-2.5 w-full py-1.5 px-2 rounded-lg bg-[#273328] hover:bg-[#344435] text-[#dce9ca] border border-[#445b42] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <ShieldAlert size={13} className="text-[#c6a76a]" />
                <span>Open Emergency Command Center</span>
              </button>
            </div>

            {/* Vitals Summary Card */}
            <div className="panel p-3.5 bg-[#1e261f] border-[#39443a]">
              <div className="flex items-center justify-between mb-3">
                <span className="eyebrow text-[#c6a76a]">SOCIETAL HEALTH INDEX</span>
                <span className="text-xs font-mono font-bold text-[#a6bd82]">{resources.happiness}/100</span>
              </div>

              <div className="space-y-2.5">
                {[
                  { label: 'Public Happiness', val: resources.happiness, icon: Heart, color: '#a6bd82' },
                  { label: 'Societal Stability', val: resources.stability, icon: Shield, color: '#c6a76a' },
                  { label: 'Biosphere Purity', val: resources.environmentalIndex, icon: Leaf, color: '#82bd8e' },
                  { label: 'Education Mastery', val: resources.educationIndex, icon: GraduationCap, color: '#82a6bd' },
                  { label: 'Political Capital', val: Math.round((resources.politicalCapital / 1000) * 100), icon: Scale, color: '#bd9fa6' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="flex items-center gap-1.5 text-[#9da99b]">
                          <Icon size={12} style={{ color: item.color }} />
                          {item.label}
                        </span>
                        <span className="font-mono text-xs">{item.val}%</span>
                      </div>
                      <div className="h-1 rounded-full bg-[#151a16] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${item.val}%`, backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setActiveDrawer('citizens')}
                className="mt-3 w-full py-1.5 px-2 rounded-lg bg-[#273328] hover:bg-[#344435] text-[#dce9ca] border border-[#445b42] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Users size={13} className="text-[#a6bd82]" />
                <span>Open Citizen Intelligence Dashboard</span>
              </button>
            </div>

            {/* Strategic Objectives */}
            <div className="panel p-3.5 bg-[#1e261f] border-[#39443a]">
              <div className="flex items-center justify-between mb-3">
                <span className="eyebrow text-[#c6a76a]">ACTIVE STRATEGIC MANDATES</span>
                <Sparkles size={13} className="text-[#c6a76a]" />
              </div>

              <div className="space-y-3">
                {achievements.slice(0, 3).map((ach) => (
                  <div key={ach.id} className="p-2.5 rounded bg-[#161c17] border border-[#2e3a2f]">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-[#e8e9e3]">{ach.title}</p>
                      {ach.isUnlocked && <CheckCircle2 size={13} className="text-[#a6bd82] shrink-0" />}
                    </div>
                    <p className="text-[10px] text-[#9da99b] mt-0.5">{ach.description}</p>
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] font-mono mb-1">
                        <span className="text-[#9da99b]">Progress</span>
                        <span className="text-[#c6a76a]">
                          {ach.isUnlocked ? 'COMPLETE' : `${Math.round((ach.progress / ach.maxProgress) * 100)}%`}
                        </span>
                      </div>
                      <div className="h-1 rounded-full bg-[#202720] overflow-hidden">
                        <div
                          className="h-full bg-[#c6a76a] rounded-full"
                          style={{
                            width: ach.isUnlocked ? '100%' : `${Math.min(100, (ach.progress / ach.maxProgress) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Civilisation Chronicle */}
            <div className="panel p-3.5 bg-[#1e261f] border-[#39443a]">
              <div className="flex items-center justify-between mb-3">
                <span className="eyebrow text-[#c6a76a]">CHRONICLE ALERTS</span>
                <span className="text-[10px] text-[#9da99b] font-mono">LIVE FEED</span>
              </div>

              <div className="space-y-2">
                {events.slice(0, 3).map((ev) => (
                  <div
                    key={ev.id}
                    className={`p-2 rounded text-xs border-l-2 bg-[#161c17] ${
                      ev.severity === 'success'
                        ? 'border-[#a6bd82]'
                        : ev.severity === 'warning'
                        ? 'border-[#d47e69]'
                        : 'border-[#c6a76a]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#9da99b]">
                      <span>Y{ev.year} · D{ev.day}</span>
                      <span className="uppercase text-[9px]">{ev.category}</span>
                    </div>
                    <p className="font-semibold text-[#e8e9e3] mt-0.5 text-[11px]">{ev.title}</p>
                    <p className="text-[10px] text-[#9da99b] mt-0.5 line-clamp-2">{ev.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

