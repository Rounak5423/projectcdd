import React, { useState, useEffect } from 'react';
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
  Compass,
  X,
  AlertTriangle,
  ShieldAlert,
  ChevronRight,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { useDayNight, WeatherType } from './DayNightController';
import { useGameState } from '../../context/GameStateContext';
import { triggerCameraPreset, triggerCameraFocus, CameraPreset } from './CameraManager';
import { usePerformanceTelemetry } from './PerformanceTelemetry';
import { getTrafficFlowMetrics } from './VehiclesSystem';

type ActiveHUDPanel = 'sectors' | 'atmosphere' | 'camera' | 'metrics' | null;

/**
 * GENESIS — Tactical World 3D HUD & Control Dock
 * Redesigned for maximum spaciousness, zero overlap, and modular popovers.
 */
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

  const {
    districts,
    selectBuilding,
    placedBuildings,
    setActiveDrawer,
    disasterState,
    evolutionReport,
  } = useGameState();

  const telemetry = usePerformanceTelemetry();
  const [traffic, setTraffic] = useState(getTrafficFlowMetrics());
  const [activePanel, setActivePanel] = useState<ActiveHUDPanel>(null);
  const [isCrisisMinimized, setIsCrisisMinimized] = useState<boolean>(false);

  useEffect(() => {
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

    // Select primary landmark in that district
    const primary = placedBuildings.find((b) => b.districtId === districtId);
    if (primary) {
      selectBuilding(primary.id);
    }
  };

  const activeDisaster = disasterState?.activeDisaster;

  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-3 pointer-events-none max-w-fit">
      {/* ================= 1. ACTIVE CRISIS HERO BANNER ================= */}
      {activeDisaster && (
        <div className="pointer-events-auto w-full max-w-[360px] p-3.5 rounded-2xl bg-gradient-to-r from-[#4d1616]/96 via-[#3b1515]/96 to-[#4d1616]/96 border-2 border-[#e74c3c] shadow-[0_0_30px_rgba(231,76,60,0.45)] backdrop-blur-xl animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🚨</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-black tracking-wider uppercase text-[#ff8e8e]">
                    {activeDisaster.type} CRISIS
                  </span>
                  <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#ff3b30]/30 text-white border border-[#ff3b30]">
                    {activeDisaster.intensity}
                  </span>
                </div>
                <p className="text-[11px] text-[#e8e9e3] font-medium leading-tight mt-0.5">
                  {activeDisaster.name} · {activeDisaster.stage.toUpperCase()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveDrawer('disaster')}
                className="px-3 py-1.5 rounded-xl bg-[#e74c3c] hover:bg-[#ff5544] text-white font-mono text-xs font-bold shadow-md transition-all shrink-0 cursor-pointer"
              >
                RESPOND
              </button>
              <button
                onClick={() => setIsCrisisMinimized(!isCrisisMinimized)}
                className="p-1 rounded-lg text-[#ffb0b0] hover:text-white hover:bg-[#661e1e] transition-colors"
                title={isCrisisMinimized ? 'Expand Details' : 'Minimize'}
              >
                {isCrisisMinimized ? <Maximize2 size={13} /> : <X size={13} />}
              </button>
            </div>
          </div>

          {!isCrisisMinimized && (
            <div className="mt-3 pt-2.5 border-t border-[#661e1e]/60 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#ffb0b0]">
                <span>Containment Progress</span>
                <span className="font-bold text-[#2ecc71]">{activeDisaster.containmentPercent.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#200e0e] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#e74c3c] to-[#2ecc71] transition-all duration-300"
                  style={{ width: `${activeDisaster.containmentPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-[#ffb0b0] pt-0.5">
                <span>Displaced Citizens: {activeDisaster.displacedPopulation.toLocaleString()}</span>
                <span>Losses: -{activeDisaster.economicDamageCredits.toLocaleString()} Cr</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= 2. SPACIOUS FLOATING HUD CONTROL DOCK ================= */}
      <div className="pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#151b16]/95 border border-[#39443a] shadow-2xl backdrop-blur-xl shrink-0">
        {/* Sectors Quick-Jump Button */}
        <button
          onClick={() => setActivePanel(activePanel === 'sectors' ? null : 'sectors')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activePanel === 'sectors'
              ? 'bg-[#3b4c37] text-[#dce9ca] border border-[#617c5b] shadow-md'
              : 'text-[#9da99b] hover:text-[#f3f5ee] hover:bg-[#202921]'
          }`}
          title="Inspect & Glide to Civilization Sectors"
        >
          <Compass size={14} className={activePanel === 'sectors' ? 'text-[#c6a76a]' : 'text-[#a6bd82]'} />
          <span>SECTORS ({districts.length})</span>
        </button>

        {/* Atmosphere & Weather Button */}
        <button
          onClick={() => setActivePanel(activePanel === 'atmosphere' ? null : 'atmosphere')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activePanel === 'atmosphere'
              ? 'bg-[#3b4c37] text-[#dce9ca] border border-[#617c5b] shadow-md'
              : 'text-[#9da99b] hover:text-[#f3f5ee] hover:bg-[#202921]'
          }`}
          title="Dynamic Atmosphere, Diurnal Time & Weather Controller"
        >
          {isNight ? <Moon size={14} className="text-[#80a8d6]" /> : <Sun size={14} className="text-[#ffbe3b]" />}
          <span>{formatHour(timeOfDay)}</span>
        </button>

        {/* Camera Views Button */}
        <button
          onClick={() => setActivePanel(activePanel === 'camera' ? null : 'camera')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activePanel === 'camera'
              ? 'bg-[#3b4c37] text-[#dce9ca] border border-[#617c5b] shadow-md'
              : 'text-[#9da99b] hover:text-[#f3f5ee] hover:bg-[#202921]'
          }`}
          title="Camera Perspectives & Angles"
        >
          <Camera size={14} className={activePanel === 'camera' ? 'text-[#c6a76a]' : 'text-[#a6bd82]'} />
          <span className="hidden sm:inline">VIEW</span>
        </button>

        {/* Performance Metrics Button */}
        <button
          onClick={() => setActivePanel(activePanel === 'metrics' ? null : 'metrics')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activePanel === 'metrics'
              ? 'bg-[#3b4c37] text-[#dce9ca] border border-[#617c5b] shadow-md'
              : 'text-[#9da99b] hover:text-[#f3f5ee] hover:bg-[#202921]'
          }`}
          title="Real-Time 3D Engine Metrics"
        >
          <Activity size={14} className="text-[#2ecc71]" />
          <span className="text-[#2ecc71]">{telemetry.fps} FPS</span>
        </button>
      </div>

      {/* ================= 3. ACTIVE POPOVER CARD ================= */}

      {/* A. SECTORS (TACTICAL DISTRICTS) POPOVER */}
      {activePanel === 'sectors' && (
        <div className="pointer-events-auto w-[330px] p-4 rounded-2xl bg-[#171d18]/96 border border-[#39443a] shadow-2xl backdrop-blur-2xl flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-[#2b372d]">
            <div className="flex items-center gap-2">
              <Compass size={16} className="text-[#c6a76a]" />
              <div>
                <h4 className="text-xs font-mono font-bold text-[#f3f5ee]">CIVILISATION SECTORS</h4>
                <p className="text-[10px] text-[#8e9c8c]">Tap any sector to glide camera directly</p>
              </div>
            </div>
            <button
              onClick={() => setActivePanel(null)}
              className="p-1 rounded-lg text-[#8e9c8c] hover:text-white hover:bg-[#202921] transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
            {districts.map((d) => (
              <button
                key={d.id}
                onClick={() => handleDistrictClick(d.id)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#1b231d] hover:bg-[#253227] border border-[#2c3a2e] hover:border-[#4d634f] transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: d.color }}
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#f0f3eb] group-hover:text-[#c6a76a] transition-colors truncate block">
                      {d.name}
                    </span>
                    <span className="text-[9px] font-mono text-[#8e9c8c] uppercase block">
                      {d.category} · Radius {d.radius}m
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-[#a6bd82] block">
                      {d.efficiency}%
                    </span>
                    <span className="text-[8px] font-mono text-[#7d8c7c] uppercase">Efficiency</span>
                  </div>
                  <ChevronRight size={14} className="text-[#556956] group-hover:text-[#c6a76a] transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* B. ATMOSPHERE & WEATHER CONTROLLER POPOVER */}
      {activePanel === 'atmosphere' && (
        <div className="pointer-events-auto w-[330px] p-4 rounded-2xl bg-[#171d18]/96 border border-[#39443a] shadow-2xl backdrop-blur-2xl flex flex-col gap-3.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-[#2b372d]">
            <div className="flex items-center gap-2">
              {isNight ? <Moon size={16} className="text-[#80a8d6]" /> : <Sun size={16} className="text-[#ffbe3b]" />}
              <div>
                <h4 className="text-xs font-mono font-bold text-[#c6a76a]">ATMOSPHERE & TIME</h4>
                <p className="text-[10px] text-[#8e9c8c]">Diurnal celestial cycle & climate control</p>
              </div>
            </div>
            <button
              onClick={() => setActivePanel(null)}
              className="p-1 rounded-lg text-[#8e9c8c] hover:text-white hover:bg-[#202921] transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          {/* Time Slider & Play/Pause */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#8e9c8c]">LOCAL TIME</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsTimePaused(!isTimePaused)}
                  title={isTimePaused ? 'Resume Time' : 'Pause Time'}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    isTimePaused
                      ? 'bg-[#4a2420] border-[#c0392b] text-[#e74c3c]'
                      : 'bg-[#202921] border-[#313f32] text-[#2ecc71] hover:bg-[#2b3a2e]'
                  }`}
                >
                  {isTimePaused ? <Play size={12} /> : <Pause size={12} />}
                </button>
                <span className="font-mono text-xs font-bold text-[#f3f5ee] px-2.5 py-1 rounded-lg bg-[#202921] border border-[#313f32]">
                  {formatHour(timeOfDay)}
                </span>
              </div>
            </div>

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
              className="w-full h-2 bg-[#253227] rounded-lg appearance-none cursor-pointer accent-[#c6a76a]"
            />
          </div>

          {/* Time Presets & Auto Cycle */}
          <div className="flex items-center justify-between gap-1 pt-2 border-t border-[#29352a]">
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setIsAutoCycle(false);
                  setTimeOfDay(6.5);
                }}
                title="Dawn (06:30)"
                className="p-1.5 rounded-lg bg-[#202921] hover:bg-[#2e3b2f] text-[#ffbe76] transition-colors cursor-pointer"
              >
                <Sunrise size={13} />
              </button>
              <button
                onClick={() => {
                  setIsAutoCycle(false);
                  setTimeOfDay(12.5);
                }}
                title="Midday Sun (12:30)"
                className="p-1.5 rounded-lg bg-[#202921] hover:bg-[#2e3b2f] text-[#ffdd59] transition-colors cursor-pointer"
              >
                <Sun size={13} />
              </button>
              <button
                onClick={() => {
                  setIsAutoCycle(false);
                  setTimeOfDay(18.5);
                }}
                title="Dusk (18:30)"
                className="p-1.5 rounded-lg bg-[#202921] hover:bg-[#2e3b2f] text-[#ff793f] transition-colors cursor-pointer"
              >
                <Sunset size={13} />
              </button>
              <button
                onClick={() => {
                  setIsAutoCycle(false);
                  setTimeOfDay(23.5);
                }}
                title="Night (23:30)"
                className="p-1.5 rounded-lg bg-[#202921] hover:bg-[#2e3b2f] text-[#70a1ff] transition-colors cursor-pointer"
              >
                <Moon size={13} />
              </button>
            </div>

            <div className="flex items-center gap-1">
              {[1, 2, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setTimeSpeedMultiplier(s)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all border cursor-pointer ${
                    timeSpeedMultiplier === s
                      ? 'bg-[#3b4c37] text-[#dce9ca] border-[#5d7756]'
                      : 'bg-[#182019] text-[#7d8c7c] border-[#29352a] hover:bg-[#222c23]'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsAutoCycle(!isAutoCycle)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                isAutoCycle
                  ? 'bg-[#3b4c37] text-[#dce9ca] border-[#5d7756]'
                  : 'bg-[#202921] text-[#9da99b] border-[#313f32]'
              }`}
            >
              {isAutoCycle ? 'Auto' : 'Manual'}
            </button>
          </div>

          {/* Weather Selector */}
          <div className="pt-2 border-t border-[#29352a] space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-[#a6bd82]">
              <span>METEOROLOGICAL STATE</span>
              <span className="uppercase font-bold text-[#e0be70]">{weather}</span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
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
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#25392b] border-[#2ecc71] text-[#e3f7e1]'
                        : 'bg-[#1c241e] border-[#2a382d] text-[#8e9c8c] hover:bg-[#263229]'
                    }`}
                  >
                    <Icon size={14} style={{ color: isSelected ? '#2ecc71' : w.color }} />
                    <span className="text-[9px] font-mono font-semibold mt-1">{w.label}</span>
                  </button>
                );
              })}

              <button
                onClick={() => setIsAutoWeather(!isAutoWeather)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                  isAutoWeather
                    ? 'bg-[#25392b] border-[#2ecc71] text-[#2ecc71]'
                    : 'bg-[#1c241e] border-[#2a382d] text-[#8e9c8c] hover:bg-[#263229]'
                }`}
                title={isAutoWeather ? 'Auto Weather Active' : 'Enable Dynamic Weather'}
              >
                <RefreshCw size={14} className={isAutoWeather ? 'animate-spin' : ''} />
                <span className="text-[9px] font-mono font-semibold mt-1">
                  {isAutoWeather ? 'Auto' : 'Cycle'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* C. CAMERA PERSPECTIVE PRESETS POPOVER */}
      {activePanel === 'camera' && (
        <div className="pointer-events-auto w-[280px] p-4 rounded-2xl bg-[#171d18]/96 border border-[#39443a] shadow-2xl backdrop-blur-2xl flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-[#2b372d]">
            <div className="flex items-center gap-2">
              <Camera size={16} className="text-[#c6a76a]" />
              <h4 className="text-xs font-mono font-bold text-[#f3f5ee]">CAMERA ANGLES</h4>
            </div>
            <button
              onClick={() => setActivePanel(null)}
              className="p-1 rounded-lg text-[#8e9c8c] hover:text-white hover:bg-[#202921] transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'isometric', label: 'Isometric', desc: 'Classic 45° angle' },
              { id: 'topDown', label: 'Top-Down', desc: 'Orthogonal planning' },
              { id: 'panoramic', label: 'Panoramic', desc: 'Cinematic horizon' },
              { id: 'reset', label: 'Reset Orbit', desc: 'Default vantage' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => triggerCameraPreset(btn.id as CameraPreset)}
                className="p-2.5 rounded-xl bg-[#202921] hover:bg-[#2c382d] border border-[#313f32] hover:border-[#4d614e] text-left transition-all cursor-pointer group"
              >
                <span className="text-xs font-mono font-bold text-[#f3f5ee] group-hover:text-[#c6a76a] transition-colors block">
                  {btn.label}
                </span>
                <span className="text-[9px] text-[#8e9c8c] block mt-0.5">{btn.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* D. PERFORMANCE TELEMETRY POPOVER */}
      {activePanel === 'metrics' && (
        <div className="pointer-events-auto w-[310px] p-4 rounded-2xl bg-[#171d18]/96 border border-[#39443a] shadow-2xl backdrop-blur-2xl flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-[#2b372d]">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-[#2ecc71] animate-pulse" />
              <h4 className="text-xs font-mono font-bold text-[#f3f5ee]">3D ENGINE TELEMETRY</h4>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full font-mono text-xs font-bold bg-[#1b251d] text-[#2ecc71] border border-[#2b3a2e]">
                {telemetry.fps} FPS
              </span>
              <button
                onClick={() => setActivePanel(null)}
                className="p-1 rounded-lg text-[#8e9c8c] hover:text-white hover:bg-[#202921] transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="p-2 rounded-xl bg-[#131914] border border-[#263528]">
              <span className="text-[#8e9c8c] block text-[9px]">DRAWCALLS</span>
              <span className="font-bold text-[#f0f3eb] text-xs">{telemetry.drawCalls}</span>
            </div>
            <div className="p-2 rounded-xl bg-[#131914] border border-[#263528]">
              <span className="text-[#8e9c8c] block text-[9px]">TRIANGLES</span>
              <span className="font-bold text-[#82a6bd] text-xs">{(telemetry.triangles || 0).toLocaleString()}</span>
            </div>
            <div className="p-2 rounded-xl bg-[#131914] border border-[#263528]">
              <span className="text-[#8e9c8c] block text-[9px]">FRAME TIME</span>
              <span className="font-bold text-[#c6a76a] text-xs">{telemetry.frameTimeMs} ms</span>
            </div>
            <div className="p-2 rounded-xl bg-[#131914] border border-[#263528]">
              <span className="text-[#8e9c8c] block text-[9px]">BUFFERS (GEO/TEX)</span>
              <span className="font-bold text-[#dce9ca] text-xs">{telemetry.geometries} / {telemetry.textures}</span>
            </div>
            <div className="p-2 rounded-xl bg-[#131914] border border-[#263528]">
              <span className="text-[#8e9c8c] block text-[9px]">ACTIVE CITIZENS</span>
              <span className="font-bold text-[#2ecc71] text-xs">{traffic.activePedestrians} peds · {traffic.activeVehicles} veh</span>
            </div>
            <div className="p-2 rounded-xl bg-[#131914] border border-[#263528]">
              <span className="text-[#8e9c8c] block text-[9px]">TRAFFIC EFFICIENCY</span>
              <span className="font-bold text-[#3498db] text-xs">{traffic.trafficFlowEfficiency}% ({traffic.averageSpeedKph} km/h)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
