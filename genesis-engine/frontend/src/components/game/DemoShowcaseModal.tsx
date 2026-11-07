import React from 'react';
import {
  Sparkles,
  X,
  Play,
  RotateCcw,
  Compass,
  AlertTriangle,
  Flame,
  Award,
  Layers,
  Cpu,
  TrendingUp,
  FileText,
  Hammer,
  Users,
  Shield,
  Eye,
  Sun,
  Sunset,
  Moon,
  CheckCircle,
} from 'lucide-react';
import { useGameState } from '../../context/GameStateContext';
import { soundFx } from '../../services/soundFx';
import { CivoraEmblem, CivoraWordmark } from '../brand/CivoraLogo';

export default function DemoShowcaseModal({
  onNavigate,
}: {
  onNavigate?: (page: string) => void;
}) {
  const {
    civilization,
    resources,
    isDemoModalOpen,
    setIsDemoModalOpen,
    loadMaxDemoWorld,
    triggerFireworks,
    triggerNextProtest,
    isCinematicTour,
    setIsCinematicTour,
    setConstructionMode,
    catalog,
  } = useGameState();

  if (!isDemoModalOpen) return null;

  const handleClose = () => {
    soundFx.playClick();
    setIsDemoModalOpen(false);
  };

  const handleLaunchFlyover = () => {
    soundFx.playClick();
    setIsCinematicTour(true);
    setIsDemoModalOpen(false);
  };

  const handleTriggerProtest = () => {
    soundFx.playCrowdChant();
    triggerNextProtest();
    setIsDemoModalOpen(false);
  };

  const handleLaunchFireworks = () => {
    triggerFireworks();
  };

  const handleOpenPage = (pageName: string) => {
    soundFx.playClick();
    setIsDemoModalOpen(false);
    if (onNavigate) {
      onNavigate(pageName);
    }
  };

  const handleStartConstruction = () => {
    soundFx.playHammerBuild();
    setIsDemoModalOpen(false);
    setConstructionMode(true, catalog[0]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#14181b] border-2 border-[#8f7742] rounded-xl shadow-2xl overflow-hidden text-[#ede8dc]">
        {/* Top Metallic Filigree Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#5e4e24] via-[#dfb74a] to-[#5e4e24]" />

        {/* Header Ribbon */}
        <div className="px-6 py-3.5 border-b border-[#2d3840] flex items-center justify-between bg-[#0f1511]">
          <div className="flex items-center gap-3">
            <CivoraWordmark emblemSize={42} showSubtitle={false} />
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[#2d3840]">
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-[#2e2617] text-[#dfb74a] border border-[#5e4e24]">
                PRESENTER SUITE
              </span>
              <span className="text-xs font-mono text-[#8a8376]">
                BUILD v2.4-CIVORA
              </span>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-md bg-[#222a30] hover:bg-[#2e3942] border border-[#3c4a55] text-[#aba393] hover:text-white transition-colors"
            title="Close Showcase Suite [ESC]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Main Body Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {/* Active Demo World Overview Banner */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-[#1c242a] via-[#1f282f] to-[#1a2227] border border-[#3d4b55] shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-serif font-bold text-[#dfb74a]">
                  {civilization.name}
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#241d11] text-[#dfb74a] border border-[#5e4e24]">
                  METROPOLE TIER L{civilization.level}
                </span>
                <span className="text-[10px] font-mono text-[#7ea376] bg-[#14231b] px-1.5 py-0.5 rounded border border-[#23422f]">
                  ERA V: QUANTUM
                </span>
              </div>
              <p className="text-xs text-[#a8a192] leading-relaxed">
                Planet <span className="text-[#ede8dc] font-semibold">{civilization.planet}</span> · Pop:{' '}
                <span className="text-[#ede8dc] font-semibold">{resources.population.toLocaleString()}</span> · Stability:{' '}
                <span className="text-[#7ea376] font-semibold">{resources.stability}%</span> · Treasury:{' '}
                <span className="text-[#dfb74a] font-semibold font-mono">{resources.grc} GRC</span>
              </p>
            </div>

            <button
              onClick={loadMaxDemoWorld}
              className="px-3.5 py-2 rounded bg-[#292212] hover:bg-[#3d3215] border border-[#a18131] text-xs font-bold text-[#dfb74a] flex items-center gap-2 transition-all shadow-md shrink-0 active:scale-95"
              title="Reset world to maximum demo capabilities"
            >
              <RotateCcw size={14} className="text-[#dfb74a]" />
              <span>⚡ RE-STOCK MAX DEMO STATS</span>
            </button>
          </div>

          {/* Interactive Capability Demonstrations Grid */}
          <div>
            <h2 className="text-xs font-mono font-bold text-[#dfb74a] tracking-wider uppercase mb-3 flex items-center gap-2">
              <span>🎯 INTERACTIVE DEMONSTRATION CONTROLS</span>
              <span className="h-px flex-1 bg-[#2d3840]" />
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* 1. Cinematic Orbit Flyover */}
              <div className="p-3.5 rounded-lg bg-[#181f24] border border-[#2b353b] hover:border-[#4a5d6a] transition-all flex flex-col justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-[#242e35] text-[#7ea376] flex items-center justify-center shrink-0 border border-[#3b4750]">
                    <Compass size={17} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#ede8dc] flex items-center gap-1.5">
                      <span>1. Cinematic 360° Aerial Flyover</span>
                    </h3>
                    <p className="text-[11px] text-[#8a8376] mt-0.5 leading-snug">
                      Autonomous camera orbit around all 5 metropolitan districts, river cargo barge, and road logistics.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLaunchFlyover}
                  className="w-full py-1.5 rounded bg-[#222a30] hover:bg-[#2d3840] border border-[#3c4a55] text-xs font-semibold text-[#ede8dc] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Play size={12} className="text-[#7ea376]" />
                  <span>Launch 360° Drone Tour</span>
                </button>
              </div>

              {/* 2. Historical Twin Civil Protest & Unrest */}
              <div className="p-3.5 rounded-lg bg-[#211716] border border-[#522923] hover:border-[#82392f] transition-all flex flex-col justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-[#3b1c14] text-[#d95338] flex items-center justify-center shrink-0 border border-[#6b2a1c]">
                    <AlertTriangle size={17} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#f7a999] flex items-center gap-1.5">
                      <span>2. Historical Twin Civil Protest</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-[#3d1810] text-[#dfb74a] uppercase font-mono">
                        Anno/Frostpunk
                      </span>
                    </h3>
                    <p className="text-[11px] text-[#a87d74] mt-0.5 leading-snug">
                      Animated 3D crowd marching with picket signs, cycling slogans, chants, and Genesis Chronicle newspaper.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleTriggerProtest}
                  className="w-full py-1.5 rounded bg-[#3b1c14] hover:bg-[#4d2419] border border-[#82392f] text-xs font-semibold text-[#f7a999] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>📢</span>
                  <span>Simulate Historical Protest Crisis</span>
                </button>
              </div>

              {/* 3. 3D Particle Fireworks & Grand Carnival */}
              <div className="p-3.5 rounded-lg bg-[#1f1d17] border border-[#5c4a23] hover:border-[#8f7742] transition-all flex flex-col justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-[#332814] text-[#dfb74a] flex items-center justify-center shrink-0 border border-[#6e5520]">
                    <Flame size={17} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#dfb74a] flex items-center gap-1.5">
                      <span>3. 3D Particle Fireworks Spectacle</span>
                    </h3>
                    <p className="text-[11px] text-[#9c8b65] mt-0.5 leading-snug">
                      Multi-colored 3D particle bursts ignite above Kyoto Citadel with fanfare chimes and crowd cheers.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLaunchFireworks}
                  className="w-full py-1.5 rounded bg-[#332814] hover:bg-[#473719] border border-[#8f7742] text-xs font-semibold text-[#dfb74a] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>🎆</span>
                  <span>Fire Celebration Sky Rockets</span>
                </button>
              </div>

              {/* 4. Civ VI Parchment Technology Tree */}
              <div className="p-3.5 rounded-lg bg-[#181f24] border border-[#2b353b] hover:border-[#4a5d6a] transition-all flex flex-col justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-[#242e35] text-[#5b9bb8] flex items-center justify-center shrink-0 border border-[#3b4750]">
                    <Cpu size={17} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#ede8dc] flex items-center gap-1.5">
                      <span>4. Civ VI Parchment Tech Matrix</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-[#1c2930] text-[#5b9bb8] uppercase font-mono">
                        Civ VI
                      </span>
                    </h3>
                    <p className="text-[11px] text-[#8a8376] mt-0.5 leading-snug">
                      Nonlinear tech tree across 5 historical eras with Eureka breakthrough boosts and research queue.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenPage('Technology')}
                  className="w-full py-1.5 rounded bg-[#222a30] hover:bg-[#2d3840] border border-[#3c4a55] text-xs font-semibold text-[#ede8dc] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>📜</span>
                  <span>Inspect Technology Tree</span>
                </button>
              </div>

              {/* 5. Anno 1800 Economy & Citizen Needs */}
              <div className="p-3.5 rounded-lg bg-[#181f24] border border-[#2b353b] hover:border-[#4a5d6a] transition-all flex flex-col justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-[#242e35] text-[#d49e49] flex items-center justify-center shrink-0 border border-[#3b4750]">
                    <TrendingUp size={17} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#ede8dc] flex items-center gap-1.5">
                      <span>5. Anno Economy & Citizen Needs</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-[#2b2416] text-[#d49e49] uppercase font-mono">
                        Anno 1800
                      </span>
                    </h3>
                    <p className="text-[11px] text-[#8a8376] mt-0.5 leading-snug">
                      Supply vs. demand balance sheets, luxury needs (Schnapps, Coffee), tax curves, and trade routes.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenPage('Economy')}
                  className="w-full py-1.5 rounded bg-[#222a30] hover:bg-[#2d3840] border border-[#3c4a55] text-xs font-semibold text-[#ede8dc] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>⚖️</span>
                  <span>Open Citizen Economy Ledger</span>
                </button>
              </div>

              {/* 6. 3D Construction & Cadastral Grid */}
              <div className="p-3.5 rounded-lg bg-[#181f24] border border-[#2b353b] hover:border-[#4a5d6a] transition-all flex flex-col justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-[#242e35] text-[#7ea376] flex items-center justify-center shrink-0 border border-[#3b4750]">
                    <Hammer size={17} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#ede8dc] flex items-center gap-1.5">
                      <span>6. 3D Raycast Construction Grid</span>
                    </h3>
                    <p className="text-[11px] text-[#8a8376] mt-0.5 leading-snug">
                      Real-time interactive building placement with collision rings, audio hammer strikes, and material costs.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleStartConstruction}
                  className="w-full py-1.5 rounded bg-[#222a30] hover:bg-[#2d3840] border border-[#3c4a55] text-xs font-semibold text-[#ede8dc] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>🏗️</span>
                  <span>Engage 3D Construction Mode</span>
                </button>
              </div>

              {/* 7. Policy Laboratory (Executive Edicts) */}
              <div className="p-3.5 rounded-lg bg-[#181f24] border border-[#2b353b] hover:border-[#4a5d6a] transition-all flex flex-col justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-[#242e35] text-[#c29b38] flex items-center justify-center shrink-0 border border-[#3b4750]">
                    <FileText size={17} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#ede8dc] flex items-center gap-1.5">
                      <span>7. Policy Laboratory (Executive Edicts)</span>
                    </h3>
                    <p className="text-[11px] text-[#8a8376] mt-0.5 leading-snug">
                      Ideological governance doctrines: Universal Compute Dividend, Algorithmic Labor Code, and Free Speech.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenPage('Policy Laboratory')}
                  className="w-full py-1.5 rounded bg-[#222a30] hover:bg-[#2d3840] border border-[#3c4a55] text-xs font-semibold text-[#ede8dc] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>🧬</span>
                  <span>Open Policy Laboratory</span>
                </button>
              </div>

              {/* 8. Future Catastrophe & Monte Carlo Simulator */}
              <div className="p-3.5 rounded-lg bg-[#181f24] border border-[#2b353b] hover:border-[#4a5d6a] transition-all flex flex-col justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-[#242e35] text-[#9b72cf] flex items-center justify-center shrink-0 border border-[#3b4750]">
                    <Sparkles size={17} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#ede8dc] flex items-center gap-1.5">
                      <span>8. 50-Year Predictive Simulator</span>
                    </h3>
                    <p className="text-[11px] text-[#8a8376] mt-0.5 leading-snug">
                      Multi-variable scenario projections modeling AI exposure, carbon levies, and demographic shifts.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenPage('Future Simulator')}
                  className="w-full py-1.5 rounded bg-[#222a30] hover:bg-[#2d3840] border border-[#3c4a55] text-xs font-semibold text-[#ede8dc] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>🔮</span>
                  <span>Run Predictive Simulator</span>
                </button>
              </div>
            </div>
          </div>

          {/* Technical Architecture Capabilities Breakdown */}
          <div className="p-4 rounded-lg bg-[#101416] border border-[#263138] space-y-3">
            <h3 className="text-xs font-mono font-bold text-[#aba393] uppercase tracking-wider flex items-center gap-2">
              <Shield size={13} className="text-[#7ea376]" />
              <span>CORE ARCHITECTURAL PILLARS</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
              <div className="p-2 rounded bg-[#171d21] border border-[#232c32]">
                <span className="font-bold text-[#ede8dc] block">Persistent 3D Canvas</span>
                <span className="text-[10px] text-[#8a8376]">60 FPS Three.js / R3F WebGL, never unmounts</span>
              </div>
              <div className="p-2 rounded bg-[#171d21] border border-[#232c32]">
                <span className="font-bold text-[#ede8dc] block">History Twin Model</span>
                <span className="text-[10px] text-[#8a8376]">Real human crises twinned into AI civil society</span>
              </div>
              <div className="p-2 rounded bg-[#171d21] border border-[#232c32]">
                <span className="font-bold text-[#ede8dc] block">Multi-Tier Demography</span>
                <span className="text-[10px] text-[#8a8376]">5 citizen classes with luxury & civic needs</span>
              </div>
              <div className="p-2 rounded bg-[#171d21] border border-[#232c32]">
                <span className="font-bold text-[#ede8dc] block">Synthesizer Web Audio</span>
                <span className="text-[10px] text-[#8a8376]">Pure math waveforms, zero asset overhead</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-[#171d21] border-t border-[#263038] flex items-center justify-between">
          <div className="text-[11px] font-mono text-[#8a8376]">
            Press <kbd className="px-1.5 py-0.5 rounded bg-[#20272c] border border-[#3b4750] text-[#dfb74a]">ESC</kbd> to return to 3D World Viewport
          </div>

          <button
            onClick={handleClose}
            className="px-4 py-1.5 rounded-md bg-[#222a30] hover:bg-[#2f3942] border border-[#3d4d5a] text-xs font-bold text-white transition-colors"
          >
            Dismiss Showcase
          </button>
        </div>
      </div>
    </div>
  );
}

