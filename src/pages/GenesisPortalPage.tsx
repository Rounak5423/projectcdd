import React from 'react';
import {
  Globe2,
  PlusCircle,
  Play,
  Trophy,
  Microscope,
  Compass,
  ArrowRight,
  Shield,
  Sparkles,
  Calendar,
  Layers,
  Award,
} from 'lucide-react';
import { useGameState } from '../context/GameStateContext';

export default function GenesisPortalPage({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  const {
    civilization,
    savedWorlds,
    loadCivilization,
    achievements,
    resources,
    events,
  } = useGameState();

  return (
    <div className="p-6 lg:p-8 space-y-8 overflow-y-auto custom-scrollbar text-[#e8e9e3] max-w-7xl mx-auto">
      {/* Hero Cinematic Section */}
      <div className="relative rounded-2xl overflow-hidden border border-[#3e4f3f] shadow-2xl bg-gradient-to-br from-[#1a231b] via-[#141b15] to-[#0f1410] p-8 lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,#3d523a_0%,transparent_60%)] opacity-40 pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#273628] border border-[#485d47] text-xs font-mono font-semibold text-[#c6a76a] mb-4">
            <Sparkles size={13} />
            GENESIS CIVILISATION ENGINE · VER 4.2.0
          </div>
          <h1 className="text-3xl lg:text-5xl font-black tracking-tight text-[#f4f7f0] leading-tight">
            The Living Artificial Civilisation
          </h1>
          <p className="text-sm lg:text-base text-[#adb8a9] mt-3 leading-relaxed">
            Architect, govern, and observe autonomous societal evolution. From foundational closed-loop
            hydroponics to quantum AI governance, simulate real demographic, economic, and ecological frontiers.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('World Explorer')}
              className="px-6 py-3 rounded-xl bg-[#405439] hover:bg-[#526b48] text-[#dce9ca] font-bold text-sm flex items-center gap-2.5 border border-[#6b875f] shadow-xl transition-all"
            >
              <Play size={16} className="fill-current" />
              <span>Resume Active Simulation ({civilization.name})</span>
            </button>

            <button
              onClick={() => onNavigate('World Creation Studio')}
              className="px-5 py-3 rounded-xl bg-[#232d24] hover:bg-[#2d3a2e] text-[#e8e9e3] font-semibold text-sm flex items-center gap-2 border border-[#394a3a] transition-all"
            >
              <PlusCircle size={16} className="text-[#c6a76a]" />
              <span>Found New World</span>
            </button>
          </div>
        </div>

        {/* Global Summary Badge */}
        <div className="mt-8 lg:mt-0 lg:absolute lg:bottom-8 lg:right-8 bg-[#182119]/90 border border-[#384839] p-4 rounded-xl backdrop-blur-md flex items-center gap-6">
          <div>
            <span className="text-[10px] font-mono uppercase text-[#9da99b] block">COMMAND LEVEL</span>
            <span className="text-lg font-bold text-[#c6a76a]">Level {civilization.level}</span>
          </div>
          <div className="w-px h-8 bg-[#2d3a2e]" />
          <div>
            <span className="text-[10px] font-mono uppercase text-[#9da99b] block">RESEARCH WALLET</span>
            <span className="text-lg font-bold text-[#a6bd82]">{resources.grc} GRC</span>
          </div>
          <div className="w-px h-8 bg-[#2d3a2e]" />
          <div>
            <span className="text-[10px] font-mono uppercase text-[#9da99b] block">PLANET</span>
            <span className="text-sm font-semibold text-[#f0f3eb]">{civilization.planet}</span>
          </div>
        </div>
      </div>

      {/* World Discovery & Archive Registry */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="eyebrow text-[#c6a76a]">DISCOVERIES & ARCHIVES</span>
            <h2 className="text-xl font-bold text-[#f3f5ee] mt-0.5">Known Civilisations in Sandbox</h2>
          </div>
          <button
            onClick={() => onNavigate('World Creation Studio')}
            className="text-xs font-semibold text-[#a6bd82] hover:text-[#c4d7a8] flex items-center gap-1"
          >
            Create another world <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {savedWorlds.map((world) => {
            const isActive = world.id === civilization.id;

            return (
              <div
                key={world.id}
                className={`panel p-5 flex flex-col justify-between transition-all ${
                  isActive
                    ? 'border-[#667e5a] bg-[#1d271f] shadow-lg ring-1 ring-[#667e5a]'
                    : 'bg-[#182119] border-[#313f32] hover:border-[#4d614e]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-[#c6a76a] font-bold uppercase">
                        {world.era} ERA
                      </span>
                      <h3 className="text-lg font-bold text-[#f3f5ef] mt-1">{world.name}</h3>
                      <p className="text-xs text-[#9da99b] mt-0.5">{world.planet}</p>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#272216] text-[#c6a76a] border border-[#4d3f23]">
                      LVL {world.level}
                    </span>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs">
                    <div className="flex justify-between text-[#9da99b]">
                      <span>Terrain:</span>
                      <span className="text-[#e8e9e3]">{world.terrainType}</span>
                    </div>
                    <div className="flex justify-between text-[#9da99b]">
                      <span>Climate:</span>
                      <span className="text-[#e8e9e3]">{world.climateType}</span>
                    </div>
                    <div className="flex justify-between text-[#9da99b]">
                      <span>Simulated Date:</span>
                      <span className="font-mono text-[#a6bd82]">
                        Year {world.currentYear.toString().padStart(3, '0')} · Day {world.currentDay.toString().padStart(3, '0')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#2d3a2e] flex items-center justify-between">
                  {isActive ? (
                    <span className="text-xs font-semibold text-[#a6bd82] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#a6bd82]" />
                      Active Session
                    </span>
                  ) : (
                    <button
                      onClick={() => loadCivilization(world.id)}
                      className="text-xs font-semibold text-[#c6a76a] hover:text-[#dfc285]"
                    >
                      Load Civilisation →
                    </button>
                  )}

                  <button
                    onClick={() => {
                      loadCivilization(world.id);
                      onNavigate('World Explorer');
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#2a372b] hover:bg-[#38493a] text-[#dce9ca] border border-[#495e4a]"
                  >
                    Enter 3D World
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progression & Research Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Achievements */}
        <div className="panel p-5 bg-[#182119] border-[#313f32]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-[#c6a76a]" />
              <h3 className="font-bold text-sm text-[#f3f5ee]">RECENT RECOGNITION</h3>
            </div>
            <button
              onClick={() => onNavigate('Achievements')}
              className="text-xs text-[#a6bd82] hover:underline"
            >
              All Achievements →
            </button>
          </div>

          <div className="space-y-3">
            {achievements.slice(0, 3).map((ach) => (
              <div
                key={ach.id}
                className="p-3 rounded-lg bg-[#141b15] border border-[#273428] flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="text-xs font-bold text-[#e8e9e3]">{ach.title}</h4>
                  <p className="text-[11px] text-[#9da99b] mt-0.5">{ach.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-[#c6a76a]">+{ach.rewardGrc} GRC</span>
                  <p className="text-[10px] text-[#a6bd82]">
                    {ach.isUnlocked ? 'Unlocked' : 'In Progress'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Research Activity */}
        <div className="panel p-5 bg-[#182119] border-[#313f32]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Microscope size={18} className="text-[#a6bd82]" />
              <h3 className="font-bold text-sm text-[#f3f5ee]">SCIENTIFIC ACTIVITY</h3>
            </div>
            <button
              onClick={() => onNavigate('Research Observatory')}
              className="text-xs text-[#a6bd82] hover:underline"
            >
              Open Observatory →
            </button>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-[#141b15] border border-[#273428]">
              <span className="text-[10px] font-mono text-[#c6a76a] uppercase font-bold">
                FLAGSHIP EXPERIMENT ACTIVE
              </span>
              <h4 className="text-xs font-bold text-[#f3f5ee] mt-1">The AI Dependency Paradox</h4>
              <p className="text-[11px] text-[#9da99b] mt-0.5 leading-relaxed">
                Evaluating cognitive divergence across 36,000 augmented subjects over a 180-day cycle.
              </p>
              <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-[#a6bd82]">
                <span>Telemetry: Day 134 / 180</span>
                <span>74% Complete</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#141b15] border border-[#273428]">
              <span className="text-[10px] font-mono text-[#82a6bd] uppercase font-bold">
                ACTIVE RESEARCH FOCUS
              </span>
              <h4 className="text-xs font-bold text-[#f3f5ee] mt-1">Cryogenic Quantum Telemetry</h4>
              <p className="text-[11px] text-[#9da99b] mt-0.5">
                Generates 35% bonus research throughput and predictive crisis forecasting.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
