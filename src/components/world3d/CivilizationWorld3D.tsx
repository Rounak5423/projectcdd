import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ZapOff, RefreshCw } from 'lucide-react';
import { useGameState } from '../../context/GameStateContext';
import { DayNightProvider, WorldLighting } from './DayNightController';
import Terrain from './Terrain';
import WaterSystem from './WaterSystem';
import NatureEnvironment from './NatureEnvironment';
import RoadNetwork from './RoadNetwork';
import StreetlightsSystem from './StreetlightsSystem';
import VehiclesSystem from './VehiclesSystem';
import PedestriansSystem from './PedestriansSystem';
import DistrictOverlays from './DistrictOverlays';
import TerritoryBoundaryOverlay from './TerritoryBoundaryOverlay';
import BuildingObject from './BuildingObject';
import CS2ZoningAndInfoView3D from './CS2ZoningAndInfoView3D';
import PlacementSystem from './PlacementSystem';
import CameraManager from './CameraManager';
import WorldHUD from './WorldHUD';
import { PerformanceSampler } from './PerformanceTelemetry';
import { ThreeSceneSampler } from '../diagnostics/ThreeSceneSampler';
import WorldLabelManager, { triggerRoadSelection } from './WorldLabelManager';
import { useRenderingQuality } from '../../hooks/useRenderingQuality';
import ErrorBoundary from '../common/ErrorBoundary';
import WeatherSystem from './WeatherSystem';
import DisasterVisualEffects from './DisasterVisualEffects';
import CivilizationEvolutionStageMonument from './CivilizationEvolutionStageMonument';
import { useGraphics } from '../../context/GraphicsSettingsContext';

function WebGLContextWatcher({
  onContextLost,
  onContextRestored,
}: {
  onContextLost: () => void;
  onContextRestored: () => void;
}) {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const handleLost = (e: Event) => {
      e.preventDefault();
      onContextLost();
    };
    const handleRestored = () => {
      onContextRestored();
    };
    canvas.addEventListener('webglcontextlost', handleLost);
    canvas.addEventListener('webglcontextrestored', handleRestored);
    return () => {
      canvas.removeEventListener('webglcontextlost', handleLost);
      canvas.removeEventListener('webglcontextrestored', handleRestored);
    };
  }, [gl, onContextLost, onContextRestored]);
  return null;
}

export function CameraHUD() {
  return <CameraManager />;
}

export interface CivilizationWorld3DProps {
  isPaused?: boolean;
}

export default function CivilizationWorld3D({ isPaused = false }: CivilizationWorld3DProps) {
  const qualitySettings = useRenderingQuality();
  const {
    placedBuildings,
    selectedBuildingId,
    selectBuilding,
    activeLayer,
    districts,
    isConstructionMode,
  } = useGameState();

  const graphics = useGraphics();
  const shadows = graphics?.shadows ?? true;
  const dpr = graphics?.dpr ?? qualitySettings.dpr;
  const weatherEffects = graphics?.weatherEffects ?? false;
  const pedestriansEnabled = graphics?.pedestriansEnabled ?? true;

  const [contextLost, setContextLost] = useState(false);
  const [viewportKey, setViewportKey] = useState(0);

  const handleFocusDistrict = (districtId: string) => {
    const dist = districts.find((d) => d.id === districtId);
    if (!dist) return;
    const districtBld = placedBuildings.find((b) => b.districtId === districtId);
    if (districtBld) {
      selectBuilding(districtBld.id);
    }
  };

  return (
    <DayNightProvider>
      <div className="w-full h-full relative bg-[#121714] select-none overflow-hidden">
        {contextLost && (
          <div className="absolute inset-0 z-50 bg-[#080d0a]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 animate-pulse">
              <ZapOff className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold font-serif text-[#faecd0] mb-2">
              WebGL Hardware Context Suspended
            </h3>
            <p className="text-xs text-[#a0aba3] max-w-sm mb-6">
              The graphics processor interrupted the 3D surface. All simulation parameters and city data remain intact.
            </p>
            <button
              onClick={() => {
                setContextLost(false);
                setViewportKey((k) => k + 1);
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold text-xs tracking-wider uppercase transition shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              Re-initialize 3D Viewport
            </button>
          </div>
        )}

        <ErrorBoundary onReset={() => setViewportKey((k) => k + 1)}>
          <Canvas
            key={viewportKey}
            frameloop={isPaused ? 'never' : 'always'}
            camera={{ position: [38, 34, 46], fov: 42, near: 0.5, far: 1400 }}
            shadows={shadows}
            dpr={dpr}
            performance={{ min: 0.5 }}
            gl={{
              antialias: true,
              alpha: false,
              powerPreference: 'high-performance',
            }}
            onPointerDown={(e) => {
              if (!isConstructionMode && (e.target as HTMLElement).tagName === 'CANVAS') {
                selectBuilding(null);
                triggerRoadSelection(null);
              }
            }}
          >
            <WebGLContextWatcher
              onContextLost={() => setContextLost(true)}
              onContextRestored={() => setContextLost(false)}
            />

            {/* Dynamic Sun, Moon, Ambient & Fog Environment */}
            <WorldLighting shadowMapSize={qualitySettings.shadowMapSize} />

            {/* Dynamic Atmospheric Clouds & Weather Particle Simulation */}
            {weatherEffects && <WeatherSystem weather="rain" />}

            {/* Procedural 3D Natural Disaster Visual Effects */}
            <DisasterVisualEffects />

            {/* Procedural Vertex-Colored Landscape */}
            <Terrain activeLayer={activeLayer} />

            {/* Realistic Dynamic River, Lake & Shoreline System */}
            <WaterSystem />

            {/* High-Performance Instanced Forests, Boulders & Flora */}
            <NatureEnvironment activeLayer={activeLayer} />

            {/* Comprehensive Connected Road Network & Architectural Bridges */}
            <RoadNetwork />

            {/* Roadside Architectural Streetlights System */}
            <StreetlightsSystem />

            {/* Autonomous Transit Vehicles & Freight Pods */}
            <VehiclesSystem />

            {/* Real Agent-Based Pedestrians on Sidewalks */}
            {pedestriansEnabled && <PedestriansSystem isRaining={weatherEffects} />}

            {/* Tactical District Projection Rings & Labels */}
            <DistrictOverlays />

            {/* Sovereign Territory Frontier Boundary & Beacons */}
            <TerritoryBoundaryOverlay />

            {/* Central Civilization Evolution Stage Monument */}
            <CivilizationEvolutionStageMonument />

            {/* Interactive Architectural Buildings */}
            {placedBuildings.map((building) => (
              <BuildingObject
                key={building.id}
                building={building}
                isSelected={selectedBuildingId === building.id}
                onSelect={() => selectBuilding(building.id)}
                activeLayer={activeLayer}
              />
            ))}

            {/* CITIES: SKYLINES II - DYNAMIC ZONING LOTS, INFO VIEWS & BULLDOZER TARGETING */}
            <CS2ZoningAndInfoView3D />

            {/* Centralized 3D World Label & Selection Manager */}
            <WorldLabelManager />

            {/* Real-time Holographic Placement & Grid System */}
            <PlacementSystem />

            {/* Smooth Camera Navigation & Building Focus Controls */}
            <CameraManager />

            {/* High-Performance 3D Engine Telemetry Sampler */}
            <PerformanceSampler />
            <ThreeSceneSampler sceneId="world" />
          </Canvas>
        </ErrorBoundary>

        {/* In-World Tactical Time, Camera & District Teleport HUD */}
        <WorldHUD />
      </div>
    </DayNightProvider>
  );
}
