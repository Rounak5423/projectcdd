import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Sunset,
  Sunrise,
  Camera,
  Activity,
  Cloud,
  CloudRain,
  CloudFog,
  RefreshCw,
  Play,
  Pause,
  FastForward,
} from 'lucide-react';
import { useDayNight, WeatherType } from './DayNightController';
import { useGameState } from '../../context/GameStateContext';
import { triggerCameraPreset, triggerCameraFocus, CameraPreset } from './CameraManager';
import { usePerformanceTelemetry } from './PerformanceTelemetry';
import { getTrafficFlowMetrics } from './VehiclesSystem';

export default function WorldHUD() {
  const {
    timeOfDay,
    setTimeOfDay,
    isAutoCycle,
    setIsAutoCycle,
    isNight,
    weather,
    setWeather,
    isAutoWeather,
    setIsAutoWeather,
    isTimePaused,
    setIsTimePaused,
    timeSpeedMultiplier,
    setTimeSpeedMultiplier,
  } = useDayNight();

  const { districts, selectBuilding, placedBuildings } = useGameState();
  const telemetry = usePerformanceTelemetry();
  const [showTelemetry, setShowTelemetry] = useState<boolean>(true);
  const [traffic, setTraffic] = useState(getTrafficFlowMetrics());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTraffic(getTrafficFlowMetrics());
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  const formatHour = (hour: number) => {
    const h = Math.floor(hour);
    const m = Math.floor((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const handleDistrictClick = (districtId: string) => {
    const d = districts.find((dist) => dist.id === districtId);
    if (!d) return;

    // Trigger smooth camera glide to district center
    triggerCameraFocus(d.x, 0, d.z, d.radius * 1.3);

    // Optionally select primary structure in that district
    const primary = placedBuildings.find((b) => b.districtId === districtId);
    if (primary) {
      selectBuilding(primary.id);
    }
  };

  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2.5 pointer-events-none">
      {/* 1. REAL-TIME 3D PERFORMANCE TELEMETRY */}
      <div className="pointer-events-auto bg-[#171d18]/94 border border-[#39443a] p-2.5 rounded-xl backdrop-blur-md shadow-2xl flex flex-col gap-1.5 min-w-[260px]">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowTelemetry(!showTelemetry)}
            className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#a6bd82] hover:text-[#dce9ca] transition-colors"
          >
            <Activity size={14} className="text-[#2ecc71] animate-pulse" />
            <span>ENGINE METRICS</span>
          </button>
          <div className="flex items-center gap-1 font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#1b251d] border border-[#2b3a2e] text-[#2ecc71]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2ecc71] animate-ping" />
            <span>{telemetry.fps} FPS</span>
          </div>
        </div>

        {showTelemetry && (
          <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-[#29352a] text-[10px] font-mono">
            <div className="p-1 rounded bg-[#131914] border border-[#263528]">
              <span className="text-[#8e9c8c] block text-[9px]">DRAWCALLS</span>
              <span className="font-bold text-[#f0f3eb]">{telemetry.drawCalls}</span>
            </div>
            <div className="p-1 rounded bg-[#131914] border border-[#263528]">
              <span className="text-[#8e9c8c] block text-[9px]">TRIANGLES</span>
              <span className="font-bold text-[#82a6bd]">{(telemetry.triangles || 0).toLocaleString()}</span>
            </div>
            <div className="p-1 rounded bg-[#131914] border border-[#263528]">
              <span className="text-[#8e9c8c] block text-[9px]">FRAME TIME</span>
              <span className="font-bold text-[#c6a76a]">{telemetry.frameTimeMs} ms</span>
            </div>
            <div className="p-1 rounded bg-[#131914] border border-[#263528]">
              <span className="text-[#8e9c8c] block text-[9px]">BUFFERS (GEO/TEX)</span>
              <span className="font-bold text-[#dce9ca]">{telemetry.geometries} / {telemetry.textures}</span>
            </div>
            <div className="p-1 rounded bg-[#131914] border border-[#263528]">
              <span className="text-[#8e9c8c] block text-[9px]">ACTIVE CITIZENS</span>
              <span className="font-bold text-[#2ecc71]">{traffic.activePedestrians} peds · {traffic.activeVehicles} veh</span>
            </div>
            <div className="p-1 rounded bg-[#131914] border border-[#263528]">
              <span className="text-[#8e9c8c] block text-[9px]">TRAFFIC FLOW</span>
              <span className="font-bold text-[#3498db]">{traffic.trafficFlowEfficiency}% ({traffic.averageSpeedKph} km/h)</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. DYNAMIC ENVIRONMENT & WEATHER CONTROLLER */}
      <div className="pointer-events-auto bg-[#171d18]/94 border border-[#39443a] p-2.5 rounded-xl backdrop-blur-md shadow-2xl flex flex-col gap-2 min-w-[260px]">
        {/* Header: Diurnal clock & Pause/Play */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#c6a76a]">
            {isNight ? <Moon size={14} className="text-[#80a8d6]" /> : <Sun size={14} className="text-[#ffbe3b]" />}
            <span>ATMOSPHERE & TIME</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsTimePaused(!isTimePaused)}
              title={isTimePaused ? 'Resume Time' : 'Pause Time'}
              className={`p-1 rounded border transition-colors ${
                isTimePaused
                  ? 'bg-[#4a2420] border-[#c0392b] text-[#e74c3c]'
                  : 'bg-[#202921] border-[#313f32] text-[#2ecc71] hover:bg-[#2b3a2e]'
              }`}
            >
              {isTimePaused ? <Play size={11} /> : <Pause size={11} />}
            </button>
            <span className="font-mono text-xs font-bold text-[#f3f5ee] px-2 py-0.5 rounded bg-[#202921] border border-[#313f32]">
              {formatHour(timeOfDay)}
            </span>
          </div>
        </div>

        {/* Time Slider */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={24}
            step={0.1}
            value={timeOfDay}
            onChange={(e) => {
              setIsAutoCycle(false);
              setTimeOfDay(parseFloat(e.target.value));
            }}
            className="w-full h-1.5 bg-[#253227] rounded-lg appearance-none cursor-pointer accent-[#c6a76a]"
          />
        </div>

        {/* Quick Time Presets & Speed Controls */}
        <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#29352a]">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setIsAutoCycle(false);
                setTimeOfDay(6.5);
              }}
              title="Sunrise (06:30)"
              className="p-1 rounded bg-[#202921] hover:bg-[#2e3b2f] text-[#ffbe76] transition-colors"
            >
              <Sunrise size={12} />
            </button>
            <button
              onClick={() => {
                setIsAutoCycle(false);
                setTimeOfDay(12.5);
              }}
              title="Noon (12:30)"
              className="p-1 rounded bg-[#202921] hover:bg-[#2e3b2f] text-[#ffdd59] transition-colors"
            >
              <Sun size={12} />
            </button>
            <button
              onClick={() => {
                setIsAutoCycle(false);
                setTimeOfDay(18.5);
              }}
              title="Sunset (18:30)"
              className="p-1 rounded bg-[#202921] hover:bg-[#2e3b2f] text-[#ff793f] transition-colors"
            >
              <Sunset size={12} />
            </button>
            <button
              onClick={() => {
                setIsAutoCycle(false);
                setTimeOfDay(23.5);
              }}
              title="Midnight (23:30)"
              className="p-1 rounded bg-[#202921] hover:bg-[#2e3b2f] text-[#70a1ff] transition-colors"
            >
              <Moon size={12} />
            </button>
          </div>

          {/* Time Speed Multiplier */}
          <div className="flex items-center gap-0.5">
            {[1, 2, 5].map((s) => (
              <button
                key={s}
                onClick={() => setTimeSpeedMultiplier(s)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all border ${
                  timeSpeedMultiplier === s
                    ? 'bg-[#3b4c37] text-[#dce9ca] border-[#5d7756]'
                    : 'bg-[#182019] text-[#7d8c7c] border-[#29352a] hover:bg-[#222c23]'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Auto Cycle Toggle */}
          <button
            onClick={() => setIsAutoCycle(!isAutoCycle)}
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold flex items-center gap-1 border transition-all ${
              isAutoCycle
                ? 'bg-[#3b4c37] text-[#dce9ca] border-[#5d7756]'
                : 'bg-[#202921] text-[#9da99b] border-[#313f32]'
            }`}
          >
            <span>{isAutoCycle ? 'Auto' : 'Lock'}</span>
          </button>
        </div>

        {/* Dynamic Weather System Selector */}
        <div className="pt-1.5 border-t border-[#29352a] flex flex-col gap-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-[#a6bd82]">
            <span>METEOROLOGICAL STATE</span>
            <span className="uppercase font-bold text-[#e0be70]">{weather}</span>
          </div>

          <div className="grid grid-cols-5 gap-1">
            {[
              { id: 'clear', label: 'Clear', icon: Sun, color: '#ffdd59' },
              { id: 'cloudy', label: 'Cloudy', icon: Cloud, color: '#a0b8cc' },
              { id: 'rain', label: 'Rain', icon: CloudRain, color: '#70a1ff' },
              { id: 'fog', label: 'Fog', icon: CloudFog, color: '#dfe4ea' },
            ].map((w) => {
              const Icon = w.icon;
              const isSelected = weather === w.id;
              return (
                <button
                  key={w.id}
                  onClick={() => {
                    setIsAutoWeather(false);
                    setWeather(w.id as WeatherType);
                  }}
                  className={`flex flex-col items-center justify-center p-1 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-[#25392b] border-[#2ecc71] text-[#e3f7e1]'
                      : 'bg-[#1c241e] border-[#2a382d] text-[#8e9c8c] hover:bg-[#263229]'
                  }`}
                  title={`${w.label} Weather`}
                >
                  <Icon size={12} style={{ color: isSelected ? '#2ecc71' : w.color }} />
                  <span className="text-[9px] font-mono font-semibold mt-0.5">{w.label}</span>
                </button>
              );
            })}

            {/* Auto Weather Cycle Toggle */}
            <button
              onClick={() => setIsAutoWeather(!isAutoWeather)}
              className={`flex flex-col items-center justify-center p-1 rounded-lg border transition-all ${
                isAutoWeather
                  ? 'bg-[#25392b] border-[#2ecc71] text-[#2ecc71]'
                  : 'bg-[#1c241e] border-[#2a382d] text-[#8e9c8c] hover:bg-[#263229]'
              }`}
              title={isAutoWeather ? 'Auto Weather Cycle Active' : 'Enable Auto Weather Cycle'}
            >
              <RefreshCw size={12} className={isAutoWeather ? 'animate-spin' : ''} />
              <span className="text-[9px] font-mono font-semibold mt-0.5">
                {isAutoWeather ? 'Auto' : 'Manual'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. CAMERA PERSPECTIVE PRESETS */}
      <div className="pointer-events-auto bg-[#171d18]/94 border border-[#39443a] p-2 rounded-xl backdrop-blur-md shadow-2xl flex flex-col gap-1.5 min-w-[260px]">
        <div className="flex items-center gap-1.5 px-1 text-[10px] font-mono tracking-wider text-[#c6a76a] uppercase">
          <Camera size={12} />
          <span>CAMERA ANGLES</span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {[
            { id: 'isometric', label: 'Iso', title: 'Classic Isometric View' },
            { id: 'topDown', label: 'Top', title: 'Top-Down Tactical View' },
            { id: 'panoramic', label: 'Pano', title: 'Cinematic Horizon View' },
            { id: 'reset', label: 'Reset', title: 'Reset Default Perspective' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => triggerCameraPreset(btn.id as CameraPreset)}
              title={btn.title}
              className="py-1 px-1.5 rounded-lg bg-[#202921] hover:bg-[#2e3b2f] border border-[#313f32] text-[11px] font-mono font-medium text-[#dce9ca] transition-colors text-center"
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. DISTRICT QUICK TELEPORT NAVIGATION */}
      <div className="pointer-events-auto bg-[#171d18]/94 border border-[#39443a] p-2 rounded-xl backdrop-blur-md shadow-2xl flex flex-col gap-1 min-w-[260px]">
        <span className="text-[10px] font-mono tracking-wider text-[#c6a76a] uppercase px-1">
          TACTICAL DISTRICTS
        </span>
        <div className="grid grid-cols-1 gap-1">
          {districts.map((d) => (
            <button
              key={d.id}
              onClick={() => handleDistrictClick(d.id)}
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
