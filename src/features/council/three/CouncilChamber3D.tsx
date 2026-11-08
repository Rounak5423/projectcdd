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
  RefreshCw,
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
            <CouncilTable />
            <CouncilThrone />
            <AdvisorGroup
              advisors={advisors}
              selectedAdvisorId={selectedAdvisorId}
              speakingAdvisorId={activeSpeakingId}
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

          {/* Camera Preset Navigation Pills */}
          <div className="pointer-events-auto flex items-center gap-1 p-1 rounded bg-[#151915]/85 border border-[#C5A66A]/30 backdrop-blur-md shadow-md text-xs font-serif">
            <button
              onClick={() => {
                soundFx.playClick();
                setCameraPreset('overview');
              }}
              className={`px-2.5 py-1 rounded transition-all flex items-center gap-1 ${
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
                className={`px-2.5 py-1 rounded transition-all flex items-center gap-1 ${
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
              className={`px-2.5 py-1 rounded transition-all flex items-center gap-1 ${
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
              className={`px-2.5 py-1 rounded transition-all flex items-center gap-1 ${
                cameraPreset === 'throne'
                  ? 'bg-[#C5A66A] text-[#171D18] font-bold shadow'
                  : 'text-[#A5AD9D] hover:text-[#EAE3D2]'
              }`}
              title="Sovereign Ruler Perspective"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Throne</span>
            </button>

            <div className="w-[1px] h-4 bg-[#C5A66A]/20 mx-1" />

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
        <div className="absolute bottom-3 inset-x-3 z-20 pointer-events-none flex items-center justify-between">
          {/* Active Advisor Info Callout */}
          {selectedAdvisor ? (
            <div className="pointer-events-auto flex items-center gap-3 px-3.5 py-2 rounded bg-[#151915]/90 border border-[#C5A66A]/40 backdrop-blur-md shadow-lg">
              <span className="text-xl">{selectedAdvisor.portraitSymbol}</span>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-xs font-bold text-[#EAE3D2]">
                    {selectedAdvisor.name}
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#C5A66A]/20 text-[#C5A66A] border border-[#C5A66A]/30">
                    {selectedAdvisor.officialTitle}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#A5AD9D]">
                  {selectedAdvisor.domain} · {selectedAdvisor.status}
                </span>
              </div>

              {/* Speech Simulator Button for Interactive Conclave */}
              <button
                onClick={() => {
                  soundFx.playClick();
                  setSimulatedSpeakingId(
                    activeSpeakingId === selectedAdvisor.id ? null : selectedAdvisor.id
                  );
                }}
                className={`ml-2 px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-all flex items-center gap-1 border ${
                  activeSpeakingId === selectedAdvisor.id
                    ? 'bg-[#8FA879] text-[#171D18] font-bold border-[#8FA879]'
                    : 'bg-[#202820] text-[#A5AD9D] hover:text-[#EAE3D2] border-[#3B4D3C]'
                }`}
                title="Yield the floor to this advisor"
              >
                <Volume2 className="w-3 h-3" />
                <span>
                  {activeSpeakingId === selectedAdvisor.id ? 'Address Floor' : 'Invite Speech'}
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
      </div>
    </WebGLErrorBoundary>
  );
};

export default CouncilChamber3D;
