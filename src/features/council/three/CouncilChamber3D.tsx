import React, { useState, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { CouncilChamber3DProps, CameraPreset } from './Council3DTypes';
import { CouncilLighting } from './CouncilLighting';
import { CouncilArchitecture } from './CouncilArchitecture';
import { CouncilTable } from './CouncilTable';
import { CouncilThrone } from './CouncilThrone';
import { AdvisorGroup } from './AdvisorGroup';
import { AdvisorCameraController } from './AdvisorCameraController';
import { CouncilChamberPlaceholder } from '../components/CouncilChamberPlaceholder';
import {
  COUNCIL_MODELS,
  THEME_PRESETS,
  getStoredThemePreset,
  getStoredModelMapping,
  saveModelMapping,
} from './CouncilModelRegistry';
import { soundFx } from '../../../services/soundFx';
import {
  Crown,
  Eye,
  Camera,
  RotateCw,
  Sparkles,
  Volume2,
  Compass,
  Layers,
  X,
  Check,
  User,
  Sliders,
} from 'lucide-react';

class WebGLErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.warn('WebGL Rendering Error in Council Chamber:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export const CouncilChamber3D: React.FC<CouncilChamber3DProps> = ({
  advisors,
  selectedAdvisorId,
  onAdvisorSelect,
  speakingAdvisorId: initialSpeakingId = null,
  className = '',
}) => {
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('overview');
  const [cinematicDrift, setCinematicDrift] = useState(false);
  const [simulatedSpeakingId, setSimulatedSpeakingId] = useState<string | null>(initialSpeakingId);
  const [force2DMode, setForce2DMode] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);

  // Model & Theme Customization State
  const [themePreset, setThemePreset] = useState<'historical' | 'real_enhanced' | 'custom'>(
    () => getStoredThemePreset()
  );
  const [modelMapping, setModelMapping] = useState<Record<string, string>>(
    () => getStoredModelMapping()
  );
  const [showModelPicker, setShowModelPicker] = useState(false);

  // Check WebGL availability
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
      }
    } catch {
      setWebglSupported(false);
    }
  }, []);

  // When an advisor is clicked in the 2D roster or 3D scene, switch to focus view
  const handleAdvisorSelect = (id: string) => {
    onAdvisorSelect(id);
    setCameraPreset('advisor-focus');
  };

  const selectedAdvisor = advisors.find((a) => a.id === selectedAdvisorId) || null;
  const activeSpeakingId = simulatedSpeakingId || initialSpeakingId;

  // Selected advisor's active 3D model
  const activeModelKey = selectedAdvisorId
    ? modelMapping[selectedAdvisorId] || selectedAdvisorId
    : 'adv-chancellor';
  const activeModelDef = COUNCIL_MODELS[activeModelKey] || COUNCIL_MODELS['adv-chancellor'];

  // Toggle Theme Preset Quick Switch
  const toggleThemePreset = () => {
    soundFx.playClick();
    const next = themePreset === 'real_enhanced' ? 'historical' : 'real_enhanced';
    setThemePreset(next);
    const nextMap = { ...THEME_PRESETS[next].mapping };
    setModelMapping(nextMap);
    saveModelMapping(next, nextMap);
  };

  // Assign specific 3D model to an advisor
  const handleAssignModel = (advisorId: string, modelId: string) => {
    soundFx.playClick();
    const nextMap = { ...modelMapping, [advisorId]: modelId };
    setModelMapping(nextMap);
    setThemePreset('custom');
    saveModelMapping('custom', nextMap);
  };

  if (!webglSupported || force2DMode) {
    return (
      <div className="relative w-full h-full flex flex-col">
        {/* Toggle back to 3D if supported */}
        {webglSupported && (
          <div className="absolute top-3 right-3 z-30">
            <button
              onClick={() => {
                soundFx.playClick();
                setForce2DMode(false);
              }}
              className="px-2.5 py-1 rounded bg-[#202820] border border-[#C5A66A]/40 text-[#C5A66A] hover:bg-[#C5A66A]/10 text-xs font-serif flex items-center gap-1.5 shadow"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Enter 3D Chamber</span>
            </button>
          </div>
        )}
        <CouncilChamberPlaceholder
          advisors={advisors}
          selectedAdvisorId={selectedAdvisorId}
          onAdvisorSelect={onAdvisorSelect}
        />
      </div>
    );
  }

  return (
    <WebGLErrorBoundary
      fallback={
        <CouncilChamberPlaceholder
          advisors={advisors}
          selectedAdvisorId={selectedAdvisorId}
          onAdvisorSelect={onAdvisorSelect}
        />
      }
    >
      <div
        className={`relative w-full h-full min-h-[520px] bg-[#121613] rounded border border-[#2B372C] overflow-hidden select-none ${className}`}
      >
        {/* 1. 3D React Three Fiber Canvas */}
        <Canvas
          shadows
          camera={{ position: [0, 5.2, 8.8], fov: 42 }}
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
          }}
          className="w-full h-full"
        >
          <color attach="background" args={['#101411']} />
          <fog attach="fog" args={['#101411', 10, 22]} />

          <Suspense fallback={null}>
            <CouncilLighting />
            <CouncilArchitecture />
            <CouncilTable modelMapping={modelMapping} />
            <CouncilThrone />
            <AdvisorGroup
              advisors={advisors}
              selectedAdvisorId={selectedAdvisorId}
              speakingAdvisorId={activeSpeakingId}
              modelMapping={modelMapping}
              onAdvisorSelect={handleAdvisorSelect}
            />
            <AdvisorCameraController
              preset={cameraPreset}
              selectedAdvisorId={selectedAdvisorId}
              cinematicDrift={cinematicDrift}
            />
          </Suspense>
        </Canvas>

        {/* 2. Top HUD Controls Overlay */}
        <div className="absolute top-3 inset-x-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          {/* Chamber Header Tag */}
          <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded bg-[#151915]/85 border border-[#C5A66A]/30 backdrop-blur-md shadow-md">
            <Crown className="w-4 h-4 text-[#C5A66A]" />
            <div className="flex flex-col">
              <span className="font-serif text-[11px] font-bold uppercase tracking-widest text-[#EAE3D2]">
                Royal Council Chamber
              </span>
              <span className="text-[9px] font-mono text-[#8FA879] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8FA879] animate-pulse" />
                Six Ministers in Conclave
              </span>
            </div>
          </div>

          {/* Center / Right Control Cluster */}
          <div className="pointer-events-auto flex items-center gap-1.5 p-1 rounded bg-[#151915]/85 border border-[#C5A66A]/30 backdrop-blur-md shadow-md text-xs font-serif">
            {/* 3D Model Quick Switcher */}
            <button
              onClick={toggleThemePreset}
              className={`px-2.5 py-1 rounded transition-all flex items-center gap-1 text-[11px] font-mono border ${
                themePreset === 'real_enhanced'
                  ? 'bg-[#C5A66A]/20 text-[#C5A66A] border-[#C5A66A]/50 font-bold'
                  : 'text-[#A5AD9D] hover:text-[#EAE3D2] border-transparent'
              }`}
              title="Toggle between Real 3D Models and Historical Sovereigns"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C5A66A]" />
              <span>
                {themePreset === 'real_enhanced'
                  ? '⚡ Real 3D'
                  : themePreset === 'historical'
                  ? '🏛️ Historical'
                  : '⚙️ Custom 3D'}
              </span>
            </button>

            <div className="w-[1px] h-4 bg-[#C5A66A]/20" />

            {/* Camera Preset Navigation Pills */}
            <button
              onClick={() => {
                soundFx.playClick();
                setCameraPreset('overview');
              }}
              className={`px-2 py-1 rounded transition-all flex items-center gap-1 ${
                cameraPreset === 'overview'
                  ? 'bg-[#C5A66A] text-[#171D18] font-bold shadow'
                  : 'text-[#A5AD9D] hover:text-[#EAE3D2]'
              }`}
              title="Full Chamber View"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Chamber</span>
            </button>

            {selectedAdvisorId && (
              <button
                onClick={() => {
                  soundFx.playClick();
                  setCameraPreset('advisor-focus');
                }}
                className={`px-2 py-1 rounded transition-all flex items-center gap-1 ${
                  cameraPreset === 'advisor-focus'
                    ? 'bg-[#C5A66A] text-[#171D18] font-bold shadow'
                    : 'text-[#A5AD9D] hover:text-[#EAE3D2]'
                }`}
                title="Focus on Selected Advisor"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Focus</span>
              </button>
            )}

            <button
              onClick={() => {
                soundFx.playClick();
                setCameraPreset('table');
              }}
              className={`px-2 py-1 rounded transition-all flex items-center gap-1 ${
                cameraPreset === 'table'
                  ? 'bg-[#C5A66A] text-[#171D18] font-bold shadow'
                  : 'text-[#A5AD9D] hover:text-[#EAE3D2]'
              }`}
              title="Council Table Overview"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>

            <button
              onClick={() => {
                soundFx.playClick();
                setCameraPreset('throne');
              }}
              className={`px-2 py-1 rounded transition-all flex items-center gap-1 ${
                cameraPreset === 'throne'
                  ? 'bg-[#C5A66A] text-[#171D18] font-bold shadow'
                  : 'text-[#A5AD9D] hover:text-[#EAE3D2]'
              }`}
              title="Sovereign Ruler Perspective"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Throne</span>
            </button>

            <div className="w-[1px] h-4 bg-[#C5A66A]/20" />

            {/* Cinematic Drift Toggle */}
            <button
              onClick={() => {
                soundFx.playClick();
                setCinematicDrift(!cinematicDrift);
              }}
              className={`p-1.5 rounded transition-colors ${
                cinematicDrift
                  ? 'bg-[#8FA879]/20 text-[#8FA879] border border-[#8FA879]/50'
                  : 'text-[#A5AD9D] hover:text-[#EAE3D2]'
              }`}
              title="Toggle Cinematic Camera Drift"
            >
              <RotateCw className={`w-3.5 h-3.5 ${cinematicDrift ? 'animate-spin' : ''}`} />
            </button>

            {/* Switch to 2D Diagram */}
            <button
              onClick={() => {
                soundFx.playClick();
                setForce2DMode(true);
              }}
              className="p-1.5 rounded text-[#A5AD9D] hover:text-[#EAE3D2] transition-colors"
              title="Switch to 2D Tactical Diagram"
            >
              <Compass className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 3. Bottom Status Bar & Interactivity HUD */}
        <div className="absolute bottom-3 inset-x-3 z-20 pointer-events-none flex flex-wrap items-center justify-between gap-2">
          {/* Active Advisor Info Callout */}
          {selectedAdvisor ? (
            <div className="pointer-events-auto flex items-center gap-2.5 px-3 py-1.5 rounded bg-[#151915]/90 border border-[#C5A66A]/40 backdrop-blur-md shadow-lg">
              <span className="text-xl">{selectedAdvisor.portraitSymbol}</span>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-xs font-bold text-[#EAE3D2]">
                    {selectedAdvisor.name}
                  </span>
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#C5A66A]/20 text-[#C5A66A] border border-[#C5A66A]/30">
                    {selectedAdvisor.officialTitle}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#A5AD9D]">
                  {selectedAdvisor.domain} · {activeModelDef.shortName}
                </span>
              </div>

              {/* 3D Model Picker Launcher */}
              <button
                onClick={() => {
                  soundFx.playClick();
                  setShowModelPicker(true);
                }}
                className="ml-1.5 px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-all flex items-center gap-1 border bg-[#202820] text-[#C5A66A] hover:bg-[#C5A66A]/15 border-[#C5A66A]/40 shadow-sm"
                title="Change 3D Character Model"
              >
                <Sliders className="w-3 h-3 text-[#C5A66A]" />
                <span>3D Model</span>
              </button>

              {/* Speech Simulator Button */}
              <button
                onClick={() => {
                  soundFx.playClick();
                  setSimulatedSpeakingId(
                    activeSpeakingId === selectedAdvisor.id ? null : selectedAdvisor.id
                  );
                }}
                className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-all flex items-center gap-1 border ${
                  activeSpeakingId === selectedAdvisor.id
                    ? 'bg-[#8FA879] text-[#171D18] font-bold border-[#8FA879]'
                    : 'bg-[#202820] text-[#A5AD9D] hover:text-[#EAE3D2] border-[#3B4D3C]'
                }`}
                title="Yield the floor to this advisor"
              >
                <Volume2 className="w-3 h-3" />
                <span>
                  {activeSpeakingId === selectedAdvisor.id ? 'Addressing' : 'Invite Speech'}
                </span>
              </button>
            </div>
          ) : (
            <div className="pointer-events-auto px-3 py-1.5 rounded bg-[#151915]/80 border border-[#3B4D3C] backdrop-blur-md text-xs font-mono text-[#A5AD9D]">
              Click any counselor or chair to confer
            </div>
          )}

          {/* Chamber Controls Tip */}
          <div className="pointer-events-none hidden sm:flex items-center gap-2 text-[10px] font-mono text-[#A5AD9D]/80 bg-[#151915]/60 px-2.5 py-1 rounded backdrop-blur-sm border border-[#2B372C]">
            <span>Left Click + Drag: Orbit</span>
            <span>·</span>
            <span>Scroll: Zoom</span>
            <span>·</span>
            <span>Click Character: Select</span>
          </div>
        </div>

        {/* 4. Interactive 3D Model Customizer Modal */}
        {showModelPicker && selectedAdvisor && (
          <div className="absolute inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-[#161D17] border border-[#C5A66A]/50 rounded shadow-2xl p-4 flex flex-col gap-3.5 animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[#2B372C]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#C5A66A]" />
                  <span className="font-serif text-sm font-bold text-[#EAE3D2]">
                    Assign 3D Character Model
                  </span>
                  <span className="text-[10px] font-mono text-[#8FA879] px-2 py-0.5 rounded bg-[#8FA879]/15 border border-[#8FA879]/30">
                    {selectedAdvisor.name}
                  </span>
                </div>
                <button
                  onClick={() => setShowModelPicker(false)}
                  className="p-1 rounded text-[#A5AD9D] hover:text-[#EAE3D2] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Presets Bar */}
              <div className="flex items-center gap-2 p-1.5 rounded bg-[#101411] border border-[#2B372C]">
                <span className="text-[10px] font-mono text-[#A5AD9D] uppercase tracking-wider px-1">
                  Preset:
                </span>
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setThemePreset('real_enhanced');
                    setModelMapping({ ...THEME_PRESETS.real_enhanced.mapping });
                    saveModelMapping('real_enhanced', THEME_PRESETS.real_enhanced.mapping);
                  }}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase transition-all flex items-center gap-1 border ${
                    themePreset === 'real_enhanced'
                      ? 'bg-[#C5A66A]/20 text-[#C5A66A] border-[#C5A66A] font-bold'
                      : 'text-[#A5AD9D] hover:text-[#EAE3D2] border-transparent'
                  }`}
                >
                  <span>⚡ Real 3D Enhanced</span>
                </button>
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setThemePreset('historical');
                    setModelMapping({ ...THEME_PRESETS.historical.mapping });
                    saveModelMapping('historical', THEME_PRESETS.historical.mapping);
                  }}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase transition-all flex items-center gap-1 border ${
                    themePreset === 'historical'
                      ? 'bg-[#C5A66A]/20 text-[#C5A66A] border-[#C5A66A] font-bold'
                      : 'text-[#A5AD9D] hover:text-[#EAE3D2] border-transparent'
                  }`}
                >
                  <span>🏛️ Historical Sovereigns</span>
                </button>
              </div>

              {/* Models List */}
              <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
                {/* 1. Real 3D Models Section */}
                <span className="text-[10px] font-mono uppercase font-bold text-[#C5A66A] tracking-wider mt-1">
                  ⚡ Downloaded Real 3D Models
                </span>
                {Object.values(COUNCIL_MODELS)
                  .filter((m) => m.category === 'real_downloaded')
                  .map((m) => {
                    const isCurrent = activeModelKey === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => handleAssignModel(selectedAdvisor.id, m.id)}
                        className={`p-2.5 rounded border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                          isCurrent
                            ? 'bg-[#202820] border-[#C5A66A] ring-1 ring-[#C5A66A]/40'
                            : 'bg-[#121613] border-[#2B372C] hover:border-[#C5A66A]/50 hover:bg-[#182019]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded bg-[#1B231C] border border-[#3B4D3C] flex items-center justify-center text-[#C5A66A] shrink-0 font-bold text-xs">
                            3D
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-serif text-xs font-bold text-[#EAE3D2] truncate">
                                {m.name}
                              </span>
                              <span className="text-[8px] font-mono px-1 rounded bg-[#C5A66A]/20 text-[#C5A66A] font-bold">
                                REAL GLB
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-[#A5AD9D] truncate">
                              {m.description}
                            </span>
                          </div>
                        </div>

                        {isCurrent ? (
                          <div className="w-5 h-5 rounded-full bg-[#C5A66A] text-[#171D18] flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-[#3B4D3C] shrink-0" />
                        )}
                      </div>
                    );
                  })}

                {/* 2. Historical Sovereigns Section */}
                <span className="text-[10px] font-mono uppercase font-bold text-[#A5AD9D] tracking-wider mt-2">
                  🏛️ Imperial Historical Sovereigns
                </span>
                {Object.values(COUNCIL_MODELS)
                  .filter((m) => m.category === 'historical')
                  .map((m) => {
                    const isCurrent = activeModelKey === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => handleAssignModel(selectedAdvisor.id, m.id)}
                        className={`p-2.5 rounded border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                          isCurrent
                            ? 'bg-[#202820] border-[#C5A66A] ring-1 ring-[#C5A66A]/40'
                            : 'bg-[#121613] border-[#2B372C] hover:border-[#C5A66A]/50 hover:bg-[#182019]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded bg-[#1B231C] border border-[#3B4D3C] flex items-center justify-center text-[#A5AD9D] shrink-0 font-serif text-xs">
                            🏛️
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-serif text-xs font-bold text-[#EAE3D2] truncate">
                              {m.name}
                            </span>
                            <span className="text-[10px] font-mono text-[#A5AD9D] truncate">
                              {m.description}
                            </span>
                          </div>
                        </div>

                        {isCurrent ? (
                          <div className="w-5 h-5 rounded-full bg-[#C5A66A] text-[#171D18] flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-[#3B4D3C] shrink-0" />
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-[#2B372C]">
                <span className="text-[10px] font-mono text-[#A5AD9D]">
                  Changes persist across sessions automatically
                </span>
                <button
                  onClick={() => setShowModelPicker(false)}
                  className="px-3 py-1 rounded bg-[#C5A66A] text-[#171D18] font-serif text-xs font-bold hover:bg-[#D6A75E] transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </WebGLErrorBoundary>
  );
};

export default CouncilChamber3D;
