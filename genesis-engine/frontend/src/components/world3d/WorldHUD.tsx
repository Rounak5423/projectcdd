import React from 'react';
import {
  Sun,
  Moon,
  Sunset,
  Sunrise,
  RotateCcw,
  Compass,
  Video,
  Eye,
  Sliders,
  Play,
  Pause,
} from 'lucide-react';
import { useDayNight } from './DayNightController';
import { useGameState } from '../../context/GameStateContext';

interface WorldHUDProps {
  onCameraPreset?: (preset: 'isometric' | 'topDown' | 'panoramic' | 'reset') => void;
  onFocusDistrict?: (districtId: string) => void;
}

export default function WorldHUD({ onCameraPreset, onFocusDistrict }: WorldHUDProps) {
  const { timeOfDay, setTimeOfDay, isAutoCycle, setIsAutoCycle, isNight } = useDayNight();
  const { districts, selectBuilding } = useGameState();

  const formatHour = (hour: number) => {
    const h = Math.floor(hour);
    const m = Math.floor((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2.5 pointer-events-none">
      {/* TIME OF DAY & LIGHTING CONTROLLER */}
      <div className="pointer-events-auto bg-[#171d18]/92 border border-[#39443a] p-2.5 rounded-xl backdrop-blur-md shadow-2xl flex flex-col gap-2 min-w-[240px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#c6a76a]">
            {isNight ? <Moon size={14} className="text-[#80a8d6]" /> : <Sun size={14} className="text-[#ffbe3b]" />}
            <span>DIURNAL CYCLE</span>
          </div>
          <span className="font-mono text-xs font-bold text-[#f3f5ee] px-2 py-0.5 rounded bg-[#202921] border border-[#313f32]">
            {formatHour(timeOfDay)}
          </span>
        </div>

        {/* Time Slider */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={24}
            step={0.2}
            value={timeOfDay}
            onChange={(e) => {
              setIsAutoCycle(false);
              setTimeOfDay(parseFloat(e.target.value));
            }}
            className="w-full h-1.5 bg-[#253227] rounded-lg appearance-none cursor-pointer accent-[#c6a76a]"
          />
        </div>

        {/* Quick Time Presets & Auto Toggle */}
        <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#29352a]">
          <button
            onClick={() => {
              setIsAutoCycle(false);
              setTimeOfDay(6.5);
            }}
            title="Sunrise (06:30)"
            className="p-1.5 rounded-lg bg-[#202921] hover:bg-[#2e3b2f] text-[#ffbe76] transition-colors"
          >
            <Sunrise size={13} />
          </button>
          <button
            onClick={() => {
              setIsAutoCycle(false);
              setTimeOfDay(12.5);
            }}
            title="Noon (12:30)"
            className="p-1.5 rounded-lg bg-[#202921] hover:bg-[#2e3b2f] text-[#ffdd59] transition-colors"
          >
            <Sun size={13} />
          </button>
          <button
            onClick={() => {
              setIsAutoCycle(false);
              setTimeOfDay(18.5);
            }}
            title="Sunset (18:30)"
            className="p-1.5 rounded-lg bg-[#202921] hover:bg-[#2e3b2f] text-[#ff793f] transition-colors"
          >
            <Sunset size={13} />
          </button>
          <button
            onClick={() => {
              setIsAutoCycle(false);
              setTimeOfDay(23.5);
            }}
            title="Midnight (23:30)"
            className="p-1.5 rounded-lg bg-[#202921] hover:bg-[#2e3b2f] text-[#70a1ff] transition-colors"
          >
            <Moon size={13} />
          </button>

          <button
            onClick={() => setIsAutoCycle(!isAutoCycle)}
            className={`px-2 py-1 rounded-md text-[10px] font-mono font-semibold flex items-center gap-1 border transition-all ${
              isAutoCycle
                ? 'bg-[#3b4c37] text-[#dce9ca] border-[#5d7756]'
                : 'bg-[#202921] text-[#9da99b] border-[#313f32]'
            }`}
          >
            <span>{isAutoCycle ? 'Auto' : 'Locked'}</span>
          </button>
        </div>
      </div>

      {/* DISTRICT QUICK TELEPORT NAVIGATION */}
      <div className="pointer-events-auto bg-[#171d18]/92 border border-[#39443a] p-2 rounded-xl backdrop-blur-md shadow-2xl flex flex-col gap-1 min-w-[240px]">
        <span className="text-[10px] font-mono tracking-wider text-[#c6a76a] uppercase px-1">
          TACTICAL DISTRICTS
        </span>
        <div className="grid grid-cols-1 gap-1">
          {districts.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                if (onFocusDistrict) {
                  onFocusDistrict(d.id);
                }
              }}
              className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-[#1f2821]/80 hover:bg-[#2a362d] border border-[#2f3d31] text-xs transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[#e8e9e3] font-medium text-[11px] truncate">{d.name}</span>
              </div>
              <span className="font-mono text-[10px] text-[#a6bd82]">{d.efficiency}%</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

