import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Sliders,
  Monitor,
  Volume2,
  Database,
  RotateCcw,
  CheckCircle2,
  Shield,
  Layers,
  Eye,
  ZoomIn,
} from 'lucide-react';
import { useGameState } from '../context/GameStateContext';

export default function SettingsPage() {
  const { civilization, resources } = useGameState();
  const [graphicsQuality, setGraphicsQuality] = useState<'Standard' | 'High' | 'Ultra'>('Ultra');
  const [shadowsEnabled, setShadowsEnabled] = useState(true);
  const [ambientFog, setAmbientFog] = useState(true);
  const [masterVolume, setMasterVolume] = useState(75);
  const [ambientVolume, setAmbientVolume] = useState(85);
  const [autosaveInterval, setAutosaveInterval] = useState('90 Days');
  const [exportedStatus, setExportedStatus] = useState(false);
  const [colorblindMode, setColorblindMode] = useState<string>(() => {
    return localStorage.getItem('genesis_colorblind_mode') || 'Normal';
  });
  const [uiScale, setUiScale] = useState<string>(() => {
    return localStorage.getItem('genesis_ui_scale') || '100%';
  });

  const handleColorblindChange = (mode: string) => {
    setColorblindMode(mode);
    localStorage.setItem('genesis_colorblind_mode', mode);
  };

  const handleUiScaleChange = (scale: string) => {
    setUiScale(scale);
    localStorage.setItem('genesis_ui_scale', scale);
    const zoomMap: Record<string, string> = {
      '85%': '0.85',
      '100%': '1',
      '115%': '1.15',
      '130%': '1.30',
    };
    if (document.body) {
      document.body.style.zoom = zoomMap[scale] || '1';
    }
  };

  const handleExportState = () => {
    const data = {
      civilization,
      resources,
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `genesis-civ-${civilization.name.toLowerCase().replace(/\s+/g, '-')}-state.json`;
    a.click();
    setExportedStatus(true);
    setTimeout(() => setExportedStatus(false), 3000);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 overflow-y-auto custom-scrollbar text-[#e8e9e3] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#39443a] gap-2">
        <div>
          <span className="eyebrow text-[#c6a76a]">ENGINE CONFIGURATION</span>
          <h1 className="text-2xl font-bold text-[#f3f5ef] mt-0.5">System & Simulation Settings</h1>
          <p className="text-xs text-[#9da99b] mt-1">
            Calibrate 3D rendering pipeline, acoustic audio telemetry, and persistence state.
          </p>
        </div>
      </div>

      {/* 3D Graphics & Viewport Settings */}
      <div className="panel p-5 bg-[#182119] border-[#313f32] space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#29342a]">
          <Monitor size={17} className="text-[#a6bd82]" />
          <h3 className="font-bold text-sm text-[#f3f5ef]">3D VIEWPORT & RENDERING PIPELINE</h3>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-[#f0f3eb] block">Rendering Quality Preset</span>
              <span className="text-[#9da99b]">Resolution scaling and geometry LOD</span>
            </div>
            <div className="flex items-center bg-[#131914] p-1 rounded-lg border border-[#273328]">
              {(['Standard', 'High', 'Ultra'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => setGraphicsQuality(q)}
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    graphicsQuality === q
                      ? 'bg-[#3b4c37] text-[#dce9ca] border border-[#5d7756]'
                      : 'text-[#8e9c8c] hover:text-white'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#232d24]">
            <div>
              <span className="font-semibold text-[#f0f3eb] block">Dynamic Sun Shadows</span>
              <span className="text-[#9da99b]">2048x2048 shadow map projection for towers</span>
            </div>
            <input
              type="checkbox"
              checked={shadowsEnabled}
              onChange={(e) => setShadowsEnabled(e.target.checked)}
              className="accent-[#a6bd82] w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#232d24]">
            <div>
              <span className="font-semibold text-[#f0f3eb] block">Atmospheric Fog Horizon</span>
              <span className="text-[#9da99b]">Soft depth attenuation matching planetary biome</span>
            </div>
            <input
              type="checkbox"
              checked={ambientFog}
              onChange={(e) => setAmbientFog(e.target.checked)}
              className="accent-[#a6bd82] w-4 h-4 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Audio Environment */}
      <div className="panel p-5 bg-[#182119] border-[#313f32] space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#29342a]">
          <Volume2 size={17} className="text-[#c6a76a]" />
          <h3 className="font-bold text-sm text-[#f3f5ef]">ACOUSTIC ENVIRONMENT & SFX</h3>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <div className="flex justify-between mb-1">
              <span className="font-semibold text-[#f0f3eb]">Master Interface Volume</span>
              <span className="font-mono text-[#c6a76a]">{masterVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={masterVolume}
              onChange={(e) => setMasterVolume(Number(e.target.value))}
              className="w-full accent-[#a6bd82]"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="font-semibold text-[#f0f3eb]">Ambient Planetary Biome Sounds</span>
              <span className="font-mono text-[#a6bd82]">{ambientVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={ambientVolume}
              onChange={(e) => setAmbientVolume(Number(e.target.value))}
              className="w-full accent-[#a6bd82]"
            />
          </div>
        </div>
      </div>

      {/* Accessibility & Visual Calibration */}
      <div className="panel p-5 bg-[#182119] border-[#313f32] space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#29342a]">
          <Eye size={17} className="text-[#a6bd82]" />
          <h3 className="font-bold text-sm text-[#f3f5ef]">ACCESSIBILITY & HUD CALIBRATION</h3>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-[#f0f3eb] block">Colorblind-Safe Info View Palette</span>
              <span className="text-[#9da99b]">Calibrate 3D heatmap shaders for color vision deficiency</span>
            </div>
            <div className="flex flex-wrap items-center bg-[#131914] p-1 rounded-lg border border-[#273328] gap-1">
              {['Normal', 'Protanopia', 'Deuteranopia', 'Tritanopia', 'Monochrome'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleColorblindChange(mode)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                    colorblindMode === mode
                      ? 'bg-[#3b4c37] text-[#dce9ca] border border-[#5d7756]'
                      : 'text-[#8e9c8c] hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#232d24]">
            <div>
              <span className="font-semibold text-[#f0f3eb] block">Interface & HUD Scale Factor</span>
              <span className="text-[#9da99b]">Scale interface text, buttons, and telemetry ribbons</span>
            </div>
            <div className="flex items-center bg-[#131914] p-1 rounded-lg border border-[#273328] gap-1">
              {['85%', '100%', '115%', '130%'].map((scale) => (
                <button
                  key={scale}
                  onClick={() => handleUiScaleChange(scale)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition ${
                    uiScale === scale
                      ? 'bg-[#3b4c37] text-[#dce9ca] border border-[#5d7756]'
                      : 'text-[#8e9c8c] hover:text-white'
                  }`}
                >
                  {scale}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* State & Snapshot Management */}
      <div className="panel p-5 bg-[#182119] border-[#313f32] space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#29342a]">
          <Database size={17} className="text-[#82a6bd]" />
          <h3 className="font-bold text-sm text-[#f3f5ef]">STATE PERSISTENCE & DATA SNAPSHOT</h3>
        </div>

        <p className="text-xs text-[#9da99b] leading-relaxed">
          Export full authoritative telemetry, placed coordinates, policy matrices, and civil records to a local archival JSON snapshot.
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportState}
            className="px-4 py-2 rounded-lg bg-[#394b35] hover:bg-[#4b6145] text-[#dce9ca] text-xs font-semibold border border-[#5d7756] flex items-center gap-2"
          >
            <Database size={14} />
            <span>{exportedStatus ? 'Snapshot Downloaded!' : 'Export Civilisation Snapshot (.json)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
