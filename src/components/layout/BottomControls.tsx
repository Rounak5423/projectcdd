import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  FastForward,
  Calendar,
  History,
  Activity,
  Layers,
} from 'lucide-react';
import { useGameState } from '../../context/GameStateContext';

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
  } = useGameState();

  return (
    <footer className="h-[68px] shrink-0 bg-[#161c17] border-t border-[#39443a] flex items-center justify-between px-4 lg:px-6 select-none text-[#e8e9e3] shadow-lg z-30">
      {/* Date & Timeline shortcut */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-[#202921] border border-[#344435] flex items-center justify-center text-[#a6bd82]">
            <Calendar size={16} />
          </div>
          <div>
            <span className="text-[9px] font-mono tracking-wider text-[#9da99b] block uppercase">
              SIMULATED CALENDAR
            </span>
            <span className="text-xs lg:text-sm font-mono font-bold text-[#f3f5ef]">
              Year {civilization.currentYear.toString().padStart(3, '0')} · Day {civilization.currentDay.toString().padStart(3, '0')}
            </span>
          </div>
        </div>

        <button
          onClick={() => setActiveDrawer('timeline')}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#202921] hover:bg-[#2c382d] border border-[#344435] text-xs text-[#a6bd82] transition-colors"
          title="Open Historical Timeline Chronology"
        >
          <History size={13} />
          <span>Chronicle</span>
        </button>
      </div>

      {/* Main Playback HUD */}
      <div className="flex items-center gap-2.5">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all shadow-md ${
            isPlaying
              ? 'bg-[#c6a76a] hover:bg-[#d6b77a] text-[#151916]'
              : 'bg-[#405439] hover:bg-[#526c49] text-[#dce9ca] border border-[#6b8563]'
          }`}
          aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}
          title={isPlaying ? 'Pause simulation [Space]' : 'Start simulation [Space]'}
        >
          {isPlaying ? <Pause size={17} className="fill-current" /> : <Play size={17} className="fill-current ml-0.5" />}
        </button>

        {/* Speed Multipliers */}
        <div className="flex items-center bg-[#141914] p-1 rounded-lg border border-[#2b352c] gap-0.5">
          {(['1x', '2x', '5x', '10x'] as const).map((val) => (
            <button
              key={val}
              onClick={() => setSpeed(val)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all ${
                speed === val
                  ? 'bg-[#394b35] text-[#dce9ca] border border-[#5d7754]'
                  : 'text-[#9da99b] hover:text-white hover:bg-[#1f2820]'
              }`}
            >
              {val}
            </button>
          ))}
        </div>

        {/* Step 1 Tick */}
        <button
          onClick={advanceTick}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#202921] hover:bg-[#2b372c] border border-[#344435] text-xs font-medium text-[#c4cbbd] transition-colors"
          title="Advance by single simulation tick (+1 Day)"
        >
          <SkipForward size={14} />
          <span className="hidden sm:inline">+1 Day</span>
        </button>

        {/* Step 1 Year */}
        <button
          onClick={advanceYear}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#202921] hover:bg-[#2b372c] border border-[#344435] text-xs font-medium text-[#c6a76a] transition-colors"
          title="Advance by 1 Simulated Year"
        >
          <FastForward size={14} />
          <span className="hidden sm:inline">+1 Year</span>
        </button>
      </div>

      {/* Simulation Engine Status */}
      <div className="flex items-center gap-2 text-xs font-mono">
        <div
          className={`w-2 h-2 rounded-full ${
            isPlaying ? 'bg-[#a6bd82] animate-pulse shadow-[0_0_8px_#a6bd82]' : 'bg-[#c6a76a]'
          }`}
        />
        <span className="text-[#9da99b] hidden lg:inline">
          ENGINE: {isPlaying ? `SIMULATING (${speed})` : 'PAUSED'}
        </span>
      </div>
    </footer>
  );
}
