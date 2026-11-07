import React, { useState } from 'react';
import {
  Play,
  Pause,
  FastForward,
  Calendar,
  History,
  RotateCw,
  Volume2,
  VolumeX,
  Shovel,
  Trash2,
  Trophy,
  Grid,
} from 'lucide-react';
import { useGameState } from '../../context/GameStateContext';
import CS2RciDemandMeter from '../cs2/CS2RciDemandMeter';
import { soundFx } from '../../services/soundFx';

export default function BottomControls() {
  const {
    civilization,
    isPlaying,
    speed,
    togglePlay,
    setSpeed,
    advanceTick,
    advanceYear,
    setActiveDrawer,
    activeZoneTool,
    setActiveZoneTool,
    isBulldozerActive,
    setIsBulldozerActive,
    setIsMilestonesModalOpen,
  } = useGameState();

  const [isMuted, setIsMuted] = useState(soundFx.getIsMuted());

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
    <footer className="h-[50px] shrink-0 bg-[#14181b] border-t border-[#262f35] flex items-center justify-between px-3 lg:px-5 select-none text-[#ede8dc] shadow-lg z-30">
      {/* Left: Date & Chronicle */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2 bg-[#0f1214] px-3 py-1 rounded-md border border-[#232b30] text-xs font-mono">
          <Calendar size={13} className="text-[#c29b38]" />
          <div>
            <span className="text-[11px] font-bold text-[#ede8dc]">
              Year {civilization.currentYear.toString().padStart(3, '0')}, Day {civilization.currentDay.toString().padStart(3, '0')}
            </span>
          </div>
        </div>

        {/* Chronicle Archive Drawer */}
        <button
          onClick={() => {
            soundFx.playClick();
            setActiveDrawer('timeline');
          }}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#192025] hover:bg-[#222a30] border border-[#2b353b] text-xs text-[#aba393] hover:text-[#ede8dc] transition-colors"
          title="Open Civilisation Chronicle Log"
        >
          <History size={12} className="text-[#c29b38]" />
          <span className="text-[11px]">Chronicle</span>
        </button>

        {/* Audio Mute/Unmute */}
        <button
          onClick={handleToggleMute}
          className={`p-1.5 rounded-md border transition-colors ${
            isMuted
              ? 'bg-[#201515] border-[#442828] text-[#c94c4c]'
              : 'bg-[#192025] border-[#2b353b] text-[#7ea376] hover:text-[#ede8dc]'
          }`}
          title={isMuted ? 'Sound SFX Muted' : 'Sound SFX Active'}
        >
          {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
        </button>

        {/* Cities: Skylines II RCI Demand Meters */}
        <div className="hidden lg:flex items-center">
          <CS2RciDemandMeter />
        </div>
      </div>

      {/* Center: Playback Speed Controls */}
      <div className="flex items-center gap-2">
        {/* Play/Pause Button */}
        <button
          onClick={() => {
            soundFx.playClick();
            togglePlay();
          }}
          className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${
            isPlaying
              ? 'bg-[#c29b38] hover:bg-[#dfb74a] text-[#111416]'
              : 'bg-[#20272d] hover:bg-[#29323a] text-[#ede8dc] border border-[#3b4750]'
          }`}
          aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}
          title={isPlaying ? 'Pause [Space]' : 'Start [Space]'}
        >
          {isPlaying ? <Pause size={13} className="fill-current" /> : <Play size={13} className="fill-current ml-0.5" />}
        </button>

        {/* Speed Multipier Pips */}
        <div className="flex items-center bg-[#0f1214] p-0.5 rounded-md border border-[#232b30] gap-0.5">
          {(['1x', '2x', '5x', '10x'] as const).map((val) => (
            <button
              key={val}
              onClick={() => {
                soundFx.playClick();
                setSpeed(val);
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all ${
                speed === val
                  ? 'bg-[#27323b] text-[#ede8dc] border border-[#445563]'
                  : 'text-[#6c767e] hover:text-[#ede8dc]'
              }`}
            >
              {val}
            </button>
          ))}
        </div>

        {/* Advance 1 Year Button */}
        <button
          onClick={handleNextYear}
          className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#192025] hover:bg-[#222a30] border border-[#2b353b] text-xs text-[#aba393] hover:text-[#ede8dc] transition-colors"
          title="Advance full year (+365 Days)"
        >
          <FastForward size={11} className="text-[#c29b38]" />
          <span className="text-[11px] font-medium">+1 Year</span>
        </button>
      </div>

      {/* Right: CS2 Tools & Integrated Turn Advancement Button */}
      <div className="flex items-center gap-2">
        {/* CS2 Zoning Tool Button */}
        <button
          onClick={() => {
            soundFx.playClick();
            setActiveZoneTool(activeZoneTool ? null : 'residential_high');
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono font-bold transition-all border ${
            activeZoneTool
              ? 'bg-[#1e3325] border-[#2ecc71] text-[#2ecc71] shadow-sm'
              : 'bg-[#192025] hover:bg-[#222a30] border-[#2b353b] text-[#aba393] hover:text-[#ede8dc]'
          }`}
          title="Cities: Skylines II Zoning Tool (Residential, Commercial, Industrial, Office)"
        >
          <Grid size={13} className="text-[#2ecc71]" />
          <span className="hidden sm:inline text-[11px]">Zoning</span>
        </button>

        {/* CS2 Bulldozer Demolition Tool [B] */}
        <button
          onClick={() => {
            soundFx.playClick();
            setIsBulldozerActive(!isBulldozerActive);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono font-bold transition-all border ${
            isBulldozerActive
              ? 'bg-[#3b1c1e] border-[#e74c3c] text-[#e74c3c] shadow-sm animate-pulse'
              : 'bg-[#192025] hover:bg-[#222a30] border-[#2b353b] text-[#aba393] hover:text-[#ede8dc]'
          }`}
          title="Cities: Skylines II Bulldozer Tool [B] (Demolish structures & reclaim materials)"
        >
          <Trash2 size={13} className="text-[#e74c3c]" />
          <span className="hidden sm:inline text-[11px]">Bulldozer</span>
        </button>

        {/* CS2 City Milestones Button */}
        <button
          onClick={() => {
            soundFx.playClick();
            setIsMilestonesModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#251f14] hover:bg-[#332b1b] border border-[#786128] text-xs font-mono font-bold text-[#dfb74a] transition-all shadow-xs"
          title="Cities: Skylines II City Milestones & Growth Unlocks"
        >
          <Trophy size={13} className="text-[#dfb74a]" />
          <span className="hidden sm:inline text-[11px]">Milestones</span>
        </button>

        {/* Advance Turn Button */}
        <button
          onClick={handleNextTurn}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-md btn-game-gold text-xs transition-all"
          title="Advance to Next Simulated Day [Space / Enter]"
        >
          <RotateCw size={13} />
          <span className="font-bold tracking-wide uppercase text-[11px]">
            Advance Turn
          </span>
        </button>
      </div>
    </footer>
  );
}
