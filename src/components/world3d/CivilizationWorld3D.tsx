import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
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
import BuildingObject from './BuildingObject';
import PlacementSystem from './PlacementSystem';
import CameraManager from './CameraManager';
import WorldHUD from './WorldHUD';
import { PerformanceSampler } from './PerformanceTelemetry';
import WorldLabelManager, { triggerRoadSelection } from './WorldLabelManager';

export function CameraHUD() {
  return <CameraManager />;
}

export default function CivilizationWorld3D() {
  const {
    placedBuildings,
    selectedBuildingId,
    selectBuilding,
    activeLayer,
    districts,
    isConstructionMode,
  } = useGameState();

  const handleFocusDistrict = (districtId: string) => {
    const dist = districts.find((d) => d.id === districtId);
    if (!dist) return;
    // Find building in district or select first building
    const districtBld = placedBuildings.find((b) => b.districtId === districtId);
    if (districtBld) {
      selectBuilding(districtBld.id);
    }
  };

  return (
    <DayNightProvider>
      <div className="w-full h-full relative bg-[#121714] select-none overflow-hidden">
        {/* 3D WebGL Canvas */}
        <Canvas
          camera={{ position: [32, 28, 38], fov: 38, near: 0.5, far: 350 }}
          shadows
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
          }}
          onPointerDown={(e) => {
            // Deselect active building and road if clicking on empty canvas directly while not in construction mode
            if (!isConstructionMode && (e.target as HTMLElement).tagName === 'CANVAS') {
              selectBuilding(null);
              triggerRoadSelection(null);
            }
          }}
        >
          {/* Dynamic Sun, Moon, Ambient & Fog Environment */}
          <WorldLighting />

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

          {/* Autonomous Intelligent Pedestrians System */}
          <PedestriansSystem />

          {/* Tactical District Projection Rings & Labels */}
          <DistrictOverlays />

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

          {/* Centralized 3D World Label & Selection Manager */}
          <WorldLabelManager />

          {/* Real-time Holographic Placement & Grid System */}
          <PlacementSystem />

          {/* Smooth Camera Navigation & Building Focus Controls */}
          <CameraManager />

          {/* High-Performance 3D Engine Telemetry Sampler */}
          <PerformanceSampler />
        </Canvas>

        {/* In-World Tactical Time, Camera & District Teleport HUD */}
        <WorldHUD />
      </div>
    </DayNightProvider>
  );
}
