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
  X,
  SlidersHorizontal,
  Bell,
  Clock,
  Download
} from 'lucide-react';
import { useGameState } from '../context/GameStateContext';
import { soundFx } from '../services/soundFx';

interface SettingsPageProps {
  onClose?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onClose }) => {
  const { civilization, resources } = useGameState();
  const [graphicsQuality, setGraphicsQuality] = useState<'Standard' | 'High' | 'Ultra'>('Ultra');
  const [shadowsEnabled, setShadowsEnabled] = useState(true);
  const [ambientFog, setAmbientFog] = useState(true);
  const [masterVolume, setMasterVolume] = useState(75);
  const [ambientVolume, setAmbientVolume] = useState(85);
  const [autosaveInterval, setAutosaveInterval] = useState('90 Days');
  const [pauseOnCritical, setPauseOnCritical] = useState(true);
  const [exportedStatus, setExportedStatus] = useState(false);

  const handleExportState = () => {
    soundFx.playSuccess();
    const data = {
      civilization,
      resources,
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `civora-${civilization.name.toLowerCase().replace(/\s+/g, '-')}-state.json`;
    a.click();
    setExportedStatus(true);
    setTimeout(() => setExportedStatus(false), 3000);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#171D18]/95 backdrop-blur-md text-[#EAE3D2] overflow-hidden select-none font-sans">
      {/* Top Header */}
      <div className="flex-shrink-0 px-8 py-5 border-b border-[#C5A66A]/20 bg-gradient-to-r from-[#171D18] via-[#202820] to-[#171D18] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm border border-[#C5A66A]/40 bg-[#17231B] flex items-center justify-center text-[#C5A66A] shadow-inner">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl text-[#EAE3D2] tracking-wider font-semibold">
                SYSTEM & SIMULATION SETTINGS
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-[#C5A66A]/40 text-[#C5A66A] bg-[#C5A66A]/10">
                Civora Engine Config
              </span>
            </div>
            <p className="text-xs text-[#A5AD9D] font-sans mt-0.5">
              Audio landscape, 3D viewport fidelity, simulation pauses, and state persistence.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 border border-[#C5A66A]/30 rounded hover:bg-[#C5A66A]/10 text-[#A5AD9D] hover:text-[#EAE3D2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Settings Body */}
      <div className="flex-1 min-h-0 px-8 py-6 overflow-y-auto space-y-6 max-w-4xl mx-auto w-full">
        {/* Simulation Execution Settings */}
        <div className="p-5 rounded bg-[#202820]/90 border border-[#C5A66A]/25 space-y-4 shadow-md">
          <div className="flex items-center gap-2 pb-2 border-b border-[#C5A66A]/20">
            <Clock className="w-4 h-4 text-[#C5A66A]" />
            <h3 className="font-serif text-sm font-bold text-[#EAE3D2]">SIMULATION ENGINE DIRECTIVES</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-[#EAE3D2] block">Pause on Critical Disasters</span>
                <span className="text-[#A5AD9D]">Automatically halts simulation time during volcanic eruptions or food shortages</span>
              </div>
              <input
                type="checkbox"
                checked={pauseOnCritical}
                onChange={(e) => setPauseOnCritical(e.target.checked)}
                className="accent-[#C5A66A] w-4 h-4 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#C5A66A]/15">
              <div>
                <span className="font-semibold text-[#EAE3D2] block">Autosave Interval</span>
                <span className="text-[#A5AD9D]">Synchronizes authoritative game snapshot to local storage</span>
              </div>
              <select
                value={autosaveInterval}
                onChange={(e) => setAutosaveInterval(e.target.value)}
                className="bg-[#171D18] border border-[#C5A66A]/30 rounded text-xs text-[#EAE3D2] px-3 py-1 focus:outline-none focus:border-[#C5A66A]"
              >
                <option value="30 Days">Every 30 Simulated Days</option>
                <option value="90 Days">Every 90 Simulated Days</option>
                <option value="365 Days">Every Solar Year</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3D Graphics & Viewport Settings */}
        <div className="p-5 rounded bg-[#202820]/90 border border-[#C5A66A]/25 space-y-4 shadow-md">
          <div className="flex items-center gap-2 pb-2 border-b border-[#C5A66A]/20">
            <Monitor className="w-4 h-4 text-[#C5A66A]" />
            <h3 className="font-serif text-sm font-bold text-[#EAE3D2]">3D VIEWPORT & RENDERING PIPELINE</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-[#EAE3D2] block">Rendering Quality Preset</span>
                <span className="text-[#A5AD9D]">Resolution scaling, post-processing and geometry LOD</span>
              </div>
              <div className="flex items-center bg-[#171D18] p-1 rounded border border-[#C5A66A]/30">
                {(['Standard', 'High', 'Ultra'] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => { soundFx.playClick(); setGraphicsQuality(q); }}
                    className={`px-3 py-1 rounded text-xs font-serif uppercase tracking-wider ${
                      graphicsQuality === q
                        ? 'bg-[#C5A66A] text-[#171D18] font-bold'
                        : 'text-[#A5AD9D] hover:text-[#EAE3D2]'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#C5A66A]/15">
              <div>
                <span className="font-semibold text-[#EAE3D2] block">Dynamic Solar Shadows</span>
                <span className="text-[#A5AD9D]">High-resolution shadow map projection for terrain & towers</span>
              </div>
              <input
                type="checkbox"
                checked={shadowsEnabled}
                onChange={(e) => setShadowsEnabled(e.target.checked)}
                className="accent-[#C5A66A] w-4 h-4 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#C5A66A]/15">
              <div>
                <span className="font-semibold text-[#EAE3D2] block">Atmospheric Fog & Depth Occlusion</span>
                <span className="text-[#A5AD9D]">Depth attenuation matching planetary biome</span>
              </div>
              <input
                type="checkbox"
                checked={ambientFog}
                onChange={(e) => setAmbientFog(e.target.checked)}
                className="accent-[#C5A66A] w-4 h-4 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Audio Environment */}
        <div className="p-5 rounded bg-[#202820]/90 border border-[#C5A66A]/25 space-y-4 shadow-md">
          <div className="flex items-center gap-2 pb-2 border-b border-[#C5A66A]/20">
            <Volume2 className="w-4 h-4 text-[#C5A66A]" />
            <h3 className="font-serif text-sm font-bold text-[#EAE3D2]">ACOUSTIC ENVIRONMENT & SFX</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-[#EAE3D2]">Master Interface & UI Volume</span>
                <span className="font-mono text-[#C5A66A]">{masterVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={masterVolume}
                onChange={(e) => setMasterVolume(Number(e.target.value))}
                className="w-full accent-[#C5A66A]"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-[#EAE3D2]">Ambient Planetary Biome SFX</span>
                <span className="font-mono text-[#8FA879]">{ambientVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={ambientVolume}
                onChange={(e) => setAmbientVolume(Number(e.target.value))}
                className="w-full accent-[#C5A66A]"
              />
            </div>
          </div>
        </div>

        {/* State Persistence */}
        <div className="p-5 rounded bg-[#202820]/90 border border-[#C5A66A]/25 space-y-4 shadow-md">
          <div className="flex items-center gap-2 pb-2 border-b border-[#C5A66A]/20">
            <Database className="w-4 h-4 text-[#C5A66A]" />
            <h3 className="font-serif text-sm font-bold text-[#EAE3D2]">STATE PERSISTENCE & DATA EXPORT</h3>
          </div>

          <p className="text-xs text-[#A5AD9D] leading-relaxed">
            Download full authoritative state, district metrics, citizen census data, and transaction logs as a standalone JSON snapshot.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportState}
              className="px-5 py-2.5 rounded bg-[#C5A66A] hover:bg-[#D8CBAA] text-[#171D18] text-xs font-serif font-bold uppercase tracking-wider flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>{exportedStatus ? 'Snapshot Downloaded!' : 'Export Civilisation Snapshot (.json)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
