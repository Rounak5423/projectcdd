import React from 'react';
import {
  X,
  Bell,
  CheckCircle,
  AlertTriangle,
  Globe,
  Award,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useGameState } from '../../context/GameStateContext';
import CityEconomyDashboard from '../dashboard/CityEconomyDashboard';
import DisasterManagementDashboard from '../dashboard/DisasterManagementDashboard';
import CitizenIntelligenceDashboard from '../dashboard/CitizenIntelligenceDashboard';
import CivilizationAnalyticsDashboard from '../dashboard/CivilizationAnalyticsDashboard';

export default function GameModals() {
  const {
    activeDrawer,
    setActiveDrawer,
    events,
    markEventRead,
    civilization,
    savedWorlds,
    loadCivilization,
    resources,
    achievements,
  } = useGameState();

  if (activeDrawer === 'none' || activeDrawer === 'buildingInspector') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* ================= NOTIFICATIONS MODAL ================= */}
      {activeDrawer === 'notifications' && (
        <div className="w-full max-w-2xl bg-[#19211a] border border-[#39443a] rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-[#e8e9e3]">
          <div className="p-4 border-b border-[#39443a] flex items-center justify-between bg-[#151b16]">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-[#c6a76a]" />
              <h3 className="font-semibold text-sm tracking-wide">CIVILISATION CHRONICLE & ALERTS</h3>
            </div>
            <button
              onClick={() => setActiveDrawer('none')}
              className="p-1 rounded text-[#9da99b] hover:text-white hover:bg-[#252f26]"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-3">
            {events.length === 0 ? (
              <div className="text-center py-10 text-[#9da99b]">No historical records logged yet.</div>
            ) : (
              events.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => markEventRead(ev.id)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                    ev.isRead
                      ? 'bg-[#1b231d] border-[#2e3a2f] opacity-80'
                      : 'bg-[#222c24] border-[#4e634c] shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono text-[#9da99b] mb-1">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-[#c6a76a]" />
                      Year {ev.year} · Day {ev.day}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${
                        ev.severity === 'success'
                          ? 'bg-[#263828] text-[#a6bd82]'
                          : ev.severity === 'warning'
                          ? 'bg-[#3d2b24] text-[#d47e69]'
                          : 'bg-[#3b3524] text-[#c6a76a]'
                      }`}
                    >
                      {ev.category}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-[#f0f3eb]">{ev.title}</h4>
                  <p className="text-xs text-[#9da99b] mt-1 leading-relaxed">{ev.description}</p>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-[#39443a] bg-[#151b16] flex justify-end">
            <button
              onClick={() => setActiveDrawer('none')}
              className="px-4 py-1.5 rounded-md text-xs font-medium bg-[#394b35] hover:bg-[#4b6145] text-[#dce9ca] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ================= CODEX / PROFILE MODAL ================= */}
      {activeDrawer === 'codex' && (
        <div className="w-full max-w-3xl bg-[#19211a] border border-[#39443a] rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-[#e8e9e3]">
          <div className="p-4 border-b border-[#39443a] flex items-center justify-between bg-[#151b16]">
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-[#a6bd82]" />
              <h3 className="font-semibold text-sm tracking-wide">CIVILISATION ARCHIVES & CODEX</h3>
            </div>
            <button
              onClick={() => setActiveDrawer('none')}
              className="p-1 rounded text-[#9da99b] hover:text-white hover:bg-[#252f26]"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            {/* Identity Banner */}
            <div className="p-5 rounded-lg bg-gradient-to-r from-[#222e23] to-[#1a221b] border border-[#3e4f3f] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="eyebrow text-[#c6a76a]">ACTIVE STATE ENTITY</span>
                <h2 className="text-2xl font-bold text-[#f3f6ee] mt-1">{civilization.name}</h2>
                <p className="text-xs text-[#9da99b] mt-0.5">
                  Designated Planet: {civilization.planet} · {civilization.climateType} {civilization.terrainType}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs font-mono px-3 py-1 rounded bg-[#2e3c2f] text-[#c6a76a] font-bold border border-[#52634d]">
                  Level {civilization.level} · {civilization.era} Era
                </span>
                <p className="text-xs text-[#9da99b] mt-1.5">
                  XP: {civilization.xp} / {civilization.xpToNextLevel}
                </p>
              </div>
            </div>

            {/* Governance & Attributes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded bg-[#161c17] border border-[#2e3a2f]">
                <span className="text-[#9da99b] block">LEADER TITLE</span>
                <span className="font-semibold text-sm text-[#f0f3eb] mt-1 block">
                  {civilization.leaderTitle}
                </span>
              </div>
              <div className="p-3 rounded bg-[#161c17] border border-[#2e3a2f]">
                <span className="text-[#9da99b] block">GOVERNANCE MODEL</span>
                <span className="font-semibold text-sm text-[#a6bd82] mt-1 block">
                  {civilization.governanceModel}
                </span>
              </div>
              <div className="p-3 rounded bg-[#161c17] border border-[#2e3a2f]">
                <span className="text-[#9da99b] block">FOUNDING YEAR</span>
                <span className="font-semibold text-sm text-[#c6a76a] mt-1 block">
                  Year {civilization.foundingYear.toString().padStart(3, '0')}
                </span>
              </div>
            </div>

            {/* Switch / Load Other Civilisations */}
            <div>
              <h4 className="text-xs font-semibold text-[#c6a76a] tracking-wider uppercase mb-3">
                SAVED ARCHIVAL WORLDS
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {savedWorlds.map((world) => (
                  <div
                    key={world.id}
                    onClick={() => {
                      loadCivilization(world.id);
                      setActiveDrawer('none');
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      world.id === civilization.id
                        ? 'bg-[#29362a] border-[#6b8563]'
                        : 'bg-[#182019] border-[#2e3a2f] hover:bg-[#202920]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-[#f0f3eb]">{world.name}</span>
                      <span className="text-[10px] text-[#c6a76a] font-mono">Lvl {world.level}</span>
                    </div>
                    <p className="text-[11px] text-[#9da99b] mt-1">
                      {world.planet} · {world.era} Era
                    </p>
                    <div className="mt-2 text-[10px] text-[#a6bd82] flex items-center gap-1 font-medium">
                      {world.id === civilization.id ? 'Currently Active' : 'Switch Civilisation →'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-3 border-t border-[#39443a] bg-[#151b16] flex justify-end">
            <button
              onClick={() => setActiveDrawer('none')}
              className="px-4 py-1.5 rounded-md text-xs font-medium bg-[#394b35] hover:bg-[#4b6145] text-[#dce9ca]"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ================= TIMELINE DRAWER ================= */}
      {activeDrawer === 'timeline' && (
        <div className="w-full max-w-2xl bg-[#19211a] border border-[#39443a] rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-[#e8e9e3]">
          <div className="p-4 border-b border-[#39443a] flex items-center justify-between bg-[#151b16]">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-[#c6a76a]" />
              <h3 className="font-semibold text-sm tracking-wide">HISTORICAL TIMELINE CHRONOLOGY</h3>
            </div>
            <button
              onClick={() => setActiveDrawer('none')}
              className="p-1 rounded text-[#9da99b] hover:text-white hover:bg-[#252f26]"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            <div className="relative border-l-2 border-[#39443a] ml-4 space-y-6">
              {[
                { year: 1, title: 'Arrival & First Hydroponics Dome', desc: 'Pioneer fleet lands in Verdant River Valley. Initial atmospheric filtration online.' },
                { year: 4, title: 'Founding of Elysium Citadel', desc: 'High Senate established. Federation charter ratified.' },
                { year: 8, title: 'Erection of First Arcology Spire', desc: 'Vertical habitat technology unlocks high-density living without urban sprawl.' },
                { year: 10, title: 'Metropolis Milestone (1.0M Citizens)', desc: 'Population breaches one million. Industrial district automated.' },
                { year: 12, title: 'Current Era: Quantum AI & Deep Observatory', desc: 'Telemetry arrays operational. AI Dependency Paradox experiment underway.' },
              ].map((node, i) => (
                <div key={i} className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#1c241d] border-2 border-[#c6a76a]" />
                  <div className="text-xs font-mono text-[#c6a76a] font-bold">YEAR {node.year.toString().padStart(3, '0')}</div>
                  <h4 className="text-sm font-semibold text-[#f0f3eb] mt-0.5">{node.title}</h4>
                  <p className="text-xs text-[#9da99b] mt-1">{node.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 border-t border-[#39443a] bg-[#151b16] flex justify-end">
            <button
              onClick={() => setActiveDrawer('none')}
              className="px-4 py-1.5 rounded-md text-xs font-medium bg-[#394b35] hover:bg-[#4b6145] text-[#dce9ca]"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ================= CITY ECONOMY & RESOURCE DASHBOARD ================= */}
      {activeDrawer === 'economy' && (
        <CityEconomyDashboard onClose={() => setActiveDrawer('none')} />
      )}

      {/* ================= NATURAL DISASTERS & INTELLIGENT EMERGENCY RESPONSE ================= */}
      {activeDrawer === 'disaster' && (
        <DisasterManagementDashboard onClose={() => setActiveDrawer('none')} />
      )}

      {/* ================= CITIZEN INTELLIGENCE & SOCIAL BEHAVIOUR DASHBOARD ================= */}
      {activeDrawer === 'citizens' && (
        <CitizenIntelligenceDashboard onClose={() => setActiveDrawer('none')} />
      )}

      {/* ================= ADVANCED CIVILIZATION EVOLUTION & ANALYTICS DASHBOARD ================= */}
      {activeDrawer === 'evolution' && (
        <CivilizationAnalyticsDashboard onClose={() => setActiveDrawer('none')} />
      )}
    </div>
  );
}

