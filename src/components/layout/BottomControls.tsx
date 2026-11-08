import React, { useState } from 'react';
import {
  Play,
  Pause,
  FastForward,
  Calendar,
  Volume2,
  VolumeX,
  Radio,
  StepForward,
} from 'lucide-react';
import { useGameState } from '../../context/GameStateContext';
import { soundFx } from '../../services/soundFx';
import CS2RciDemandMeter from '../cs2/CS2RciDemandMeter';

export default function BottomControls() {
  const {
    civilization,
    isPlaying,
    speed,
    togglePlay,
    setSpeed,
    advanceTick,
    advanceYear,
    events,
    activeZoneTool,
    setActiveZoneTool,
    isBulldozerActive,
    setIsBulldozerActive,
    setIsMilestonesModalOpen,
  } = useGameState();

  const [isMuted, setIsMuted] = useState(soundFx.getIsMuted());

  const latestEvent = events[0];

  const handleToggleMute = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
    if (!muted) soundFx.playClick();
  };

  const handleNextTurn = () => {
    soundFx.playTurnAdvance();
    advanceTick();
  };

  const handleNextYear = () => {
    soundFx.playTurnAdvance();
    advanceYear();
  };

  return (
    <footer className="h-[52px] shrink-0 bg-[#171D18] border-t border-[#2B372C] flex items-center justify-between px-3 lg:px-5 select-none text-[#EAE3D2] shadow-xl z-30">
      {/* Left: Simulated Date, State Indicator & Latest Civil Event */}
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Date Display */}
        <div className="flex items-center gap-2 bg-[#121713] px-3 py-1 rounded border border-[#2B372C] text-xs font-mono">
          <Calendar size={13} className="text-[#C5A66A]" />
          <div>
            <span className="text-[11px] font-bold text-[#EAE3D2] font-cinzel">
              Yr {civilization.currentYear.toString().padStart(3, '0')}, D{civilization.currentDay.toString().padStart(3, '0')}
            </span>
          </div>
        </div>

        {/* Live Simulation State Indicator */}
        <div
          className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${
            isPlaying
              ? 'bg-[#17231B] text-[#8FA879] border-[#3D4F3F]'
              : 'bg-[#202820] text-[#D6A75E] border-[#2B372C]'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isPlaying ? 'bg-[#8FA879] animate-pulse' : 'bg-[#D6A75E]'
            }`}
          />
          <span>{isPlaying ? 'Engine Live' : 'Simulation Paused'}</span>
        </div>

        {/* Latest Event Indicator Ticker */}
        {latestEvent && (
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded bg-[#121713] border border-[#2B372C] text-xs max-w-sm truncate">
            <Radio size={12} className="text-[#C5A66A] shrink-0 animate-pulse" />
            <span className="text-[11px] text-[#A5AD9D] truncate">
              {latestEvent.title}
            </span>
          </div>
        )}

        {/* Audio Mute/Unmute */}
        <button
          onClick={handleToggleMute}
          className={`p-1.5 rounded border transition-colors ${
            isMuted
              ? 'bg-[#C87569]/15 border-[#C87569]/40 text-[#C87569]'
              : 'bg-[#202820] border-[#2B372C] text-[#8FA879] hover:text-[#EAE3D2]'
          }`}
          title={isMuted ? 'Sound SFX Muted' : 'Sound SFX Active'}
        >
          {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>

        {/* Cities: Skylines II RCI Demand Meters */}
        <div className="hidden md:flex items-center ml-1">
          <CS2RciDemandMeter />
        </div>
      </div>

      {/* Center: Playback Speed & Step Controls */}
      <div className="flex items-center gap-2">
        {/* Play/Pause Button */}
        <button
          onClick={() => {
            soundFx.playClick();
            togglePlay();
          }}
          className={`w-7 h-7 rounded flex items-center justify-center transition-all ${
            isPlaying
              ? 'bg-[#C5A66A] hover:bg-[#D4B67A] text-[#121713] font-bold shadow-md'
              : 'bg-[#202820] hover:bg-[#283228] text-[#EAE3D2] border border-[#3D4F3F]'
          }`}
          aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}
          title={isPlaying ? 'Pause Simulation [Space]' : 'Resume Simulation [Space]'}
        >
          {isPlaying ? <Pause size={13} className="fill-current" /> : <Play size={13} className="fill-current ml-0.5" />}
        </button>

        {/* Speed Multiplier Pips */}
        <div className="flex items-center bg-[#121713] p-0.5 rounded border border-[#2B372C] gap-0.5">
          {(['1x', '2x', '5x', '10x'] as const).map((val) => (
            <button
              key={val}
              onClick={() => {
                soundFx.playClick();
                setSpeed(val);
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all ${
                speed === val
                  ? 'bg-[#283228] text-[#C5A66A] border border-[#C5A66A]/40'
                  : 'text-[#7A8473] hover:text-[#EAE3D2]'
              }`}
            >
              {val}
            </button>
          ))}
        </div>

        {/* Advance 1 Day Button */}
        <button
          onClick={handleNextTurn}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#202820] hover:bg-[#283228] border border-[#2B372C] text-xs text-[#A5AD9D] hover:text-[#EAE3D2] transition-colors"
          title="Advance single tick cycle (+1 Day)"
        >
          <StepForward size={12} className="text-[#8FA879]" />
          <span className="text-[11px] font-medium hidden sm:inline">+1 Day</span>
        </button>

        {/* Advance 1 Year Button */}
        <button
          onClick={handleNextYear}
          className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded bg-[#202820] hover:bg-[#283228] border border-[#2B372C] text-xs text-[#A5AD9D] hover:text-[#EAE3D2] transition-colors"
          title="Advance full year (+365 Days)"
        >
          <FastForward size={12} className="text-[#C5A66A]" />
          <span className="text-[11px] font-medium">+1 Year</span>
        </button>
      </div>

      {/* Right: Tools & Turn Advance Master */}
      <div className="flex items-center gap-2">
        {/* CS2 Zoning Tool Button */}
        <button
          onClick={() => {
            soundFx.playClick();
            setActiveZoneTool(activeZoneTool ? null : 'residential_high');
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono font-bold transition-all border ${
            activeZoneTool
              ? 'bg-[#17231B] border-[#8FA879] text-[#8FA879] shadow-sm'
              : 'bg-[#202820] hover:bg-[#283228] border-[#2B372C] text-[#A5AD9D] hover:text-[#EAE3D2]'
          }`}
          title="Toggle Cities: Skylines 2 Lot Zoning Tools"
        >
          <span className="text-xs">📐</span>
          <span className="hidden sm:inline">Zoning</span>
        </button>

        {/* CS2 Bulldozer Tool Button */}
        <button
          onClick={() => {
            soundFx.playClick();
            setIsBulldozerActive(!isBulldozerActive);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono font-bold transition-all border ${
            isBulldozerActive
              ? 'bg-[#C87569]/20 border-[#C87569] text-[#C87569] shadow-sm animate-pulse'
              : 'bg-[#202820] hover:bg-[#283228] border-[#2B372C] text-[#A5AD9D] hover:text-[#EAE3D2]'
          }`}
          title="Toggle Bulldozer Demolition Tool"
        >
          <span className="text-xs">🚜</span>
          <span className="hidden sm:inline">Demolish</span>
        </button>

        {/* CS2 City Milestones Progression Road Button */}
        <button
          onClick={() => {
            soundFx.playClick();
            setIsMilestonesModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono font-bold bg-[#202820] hover:bg-[#283228] border border-[#C5A66A]/40 text-[#C5A66A] transition-all shadow-xs"
          title="Open City Milestones Progression Road"
        >
          <span className="text-xs">🏆</span>
          <span className="hidden sm:inline">Milestones</span>
        </button>

        {/* Master Turn Advancement Action Button */}
        <button
          onClick={handleNextTurn}
          className="btn-civ-gold px-3.5 py-1.5 rounded text-xs flex items-center gap-1.5 transition-all shrink-0"
          title="Advance simulation by 1 day"
        >
          <span>Cycle</span>
        </button>
      </div>
    </footer>
  );
}
