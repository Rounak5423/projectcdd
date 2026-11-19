import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Camera,
  Activity,
  Compass,
} from 'lucide-react';
import { useDayNight } from './DayNightController';
import { triggerCameraPreset, CameraPreset } from './CameraManager';
import { usePerformanceTelemetry } from './PerformanceTelemetry';

// Isolated FPS badge to prevent full HUD re-rendering every 500ms
const FpsBadge = React.memo(function FpsBadge() {
  const telemetry = usePerformanceTelemetry();
  const [showFpsDetail, setShowFpsDetail] = useState(false);

  return (
    <div className="relative pl-1 border-l border-[#263528]">
      <button
        onClick={() => setShowFpsDetail(!showFpsDetail)}
        className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#202921] text-[10px] text-[#7a8878] hover:text-[#2ecc71] transition-colors"
        title="Graphics frame rate (click for quick engine stats)"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#2ecc71]" />
        <span>{telemetry.fps} FPS</span>
      </button>

      {showFpsDetail && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-[#161d18]/95 border border-[#3b493a] rounded-xl shadow-2xl p-2.5 text-[10px] font-mono text-[#9da99b] space-y-1 z-30 animate-in fade-in">
          <div className="flex justify-between">
            <span>Draw Calls:</span>
            <span className="text-[#f0f3eb] font-bold">{telemetry.drawCalls}</span>
          </div>
          <div className="flex justify-between">
            <span>Triangles:</span>
            <span className="text-[#82a6bd] font-bold">{(telemetry.triangles || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Frame Time:</span>
            <span className="text-[#c6a76a] font-bold">{telemetry.frameTimeMs} ms</span>
          </div>
        </div>
      )}
    </div>
  );
});

export default function WorldHUD() {
  const {
    timeOfDay,
    setTimeOfDay,
    isNight,
    setIsAutoCycle,
    isAutoCycle,
  } = useDayNight();

  const formatHour = (hour: number) => {
    const h = Math.floor(hour);
    const m = Math.floor((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const toggleDayNight = () => {
    setIsAutoCycle(false);
    setTimeOfDay(isNight ? 12.0 : 23.5);
  };

  return (
    <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-none select-none">
      {/* Sleek Floating Viewport Controls */}
      <div className="pointer-events-auto flex items-center gap-1 bg-[#141916]/90 border border-[#344033] p-1 rounded-xl shadow-lg backdrop-blur-md text-xs font-mono">
        {/* Camera Perspective Presets */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-[#263528]">
          <span className="p-1 text-[#8e9c8c]" title="Camera Perspectives">
            <Camera size={13} />
          </span>
          <button
            onClick={() => triggerCameraPreset('isometric')}
            className="px-2 py-1 rounded-lg hover:bg-[#202921] text-[#c6a76a] hover:text-[#faecd0] transition-colors font-semibold text-[11px]"
            title="Isometric Perspective"
          >
            Iso
          </button>
          <button
            onClick={() => triggerCameraPreset('topDown')}
            className="px-2 py-1 rounded-lg hover:bg-[#202921] text-[#9da99b] hover:text-[#faecd0] transition-colors text-[11px]"
            title="Top-Down Tactical View"
          >
            Top
          </button>
          <button
            onClick={() => triggerCameraPreset('reset')}
            className="px-1.5 py-1 rounded-lg hover:bg-[#202921] text-[#9da99b] hover:text-[#faecd0] transition-colors text-[11px]"
            title="Reset Camera Angle"
          >
            <Compass size={12} />
          </button>
        </div>

        {/* Day / Night Toggle Pill */}
        <button
          onClick={toggleDayNight}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-[#202921] text-[#e8e9e3] transition-colors cursor-pointer"
          title={`Click to switch between Day & Night (${isAutoCycle ? 'Auto cycle active' : 'Manual'})`}
        >
          {isNight ? (
            <Moon size={13} className="text-[#80a8d6]" />
          ) : (
            <Sun size={13} className="text-[#ffbe3b]" />
          )}
          <span className="text-[11px] font-bold text-[#cfc7b4]">
            {formatHour(timeOfDay)}
          </span>
        </button>

        {/* Isolated Subtle Engine FPS Badge */}
        <FpsBadge />
      </div>
    </div>
  );
}
