import React, { useState, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { PlacedBuilding } from '../../types/game';
import { RoadSegmentData } from '../../types/road';
import { useGameState } from '../../context/GameStateContext';

// Helper to determine exact building rooftop height for camera-aware billboard labels
export function getBuildingVisualHeight(category: string, modelType?: string, level: number = 1): number {
  const boost = (level - 1) * 0.35;
  if (category === 'government' || modelType === 'citadel') return 5.8 + boost;
  if (modelType === 'arcology' || modelType === 'highrise' || modelType === 'tower') return 5.4 + boost;
  if (category === 'healthcare' || modelType === 'hospital') return 4.2 + boost;
  if (category === 'education' || modelType === 'academy') return 3.8 + boost;
  if (category === 'industrial' || modelType === 'factory' || modelType === 'power_plant') return 3.9 + boost;
  if (modelType === 'dome' || modelType === 'hydroponic') return 3.2 + boost;
  return 2.4 + boost;
}

// Global Event Dispatchers for Coordinated Selection between Buildings and Roads
export function triggerRoadSelection(road: RoadSegmentData | null) {
  window.dispatchEvent(
    new CustomEvent('civilization-select-road', {
      detail: road,
    })
  );
}

export function triggerBuildingHover(buildingId: string | null) {
  window.dispatchEvent(
    new CustomEvent('civilization-hover-building', {
      detail: buildingId,
    })
  );
}

/**
 * Centralized 3D World Label & Selection Manager
 * Enforces strict single-selection, eliminates duplicate stacked labels,
 * implements distance-based label culling, and camera-aware positioning.
 */
export default function WorldLabelManager() {
  const {
    placedBuildings,
    selectedBuildingId,
    selectBuilding,
    resources,
    upgradeBuilding,
    demolishBuilding,
    rotateBuilding,
    startRelocation,
  } = useGameState();

  const { camera } = useThree();
  const [hoveredBuildingId, setHoveredBuildingId] = useState<string | null>(null);
  const [selectedRoad, setSelectedRoad] = useState<RoadSegmentData | null>(null);
  const [cameraDistance, setCameraDistance] = useState<number>(50);

  // Measure camera distance from scene center
  useFrame(() => {
    const dist = camera.position.length();
    // Update every few units to prevent React state thrashing
    if (Math.abs(dist - cameraDistance) > 3.0) {
      setCameraDistance(dist);
    }
  });

  // Listen for road selection and building hover events
  useEffect(() => {
    const handleRoadSelect = (e: Event) => {
      const custom = e as CustomEvent<RoadSegmentData | null>;
      setSelectedRoad(custom.detail || null);
      if (custom.detail) {
        // Deselect any active building so only ONE entity is selected at a time
        selectBuilding(null);
      }
    };

    const handleBuildingHover = (e: Event) => {
      const custom = e as CustomEvent<string | null>;
      setHoveredBuildingId(custom.detail || null);
    };

    window.addEventListener('civilization-select-road', handleRoadSelect);
    window.addEventListener('civilization-hover-building', handleBuildingHover);

    return () => {
      window.removeEventListener('civilization-select-road', handleRoadSelect);
      window.removeEventListener('civilization-hover-building', handleBuildingHover);
    };
  }, [selectBuilding]);

  // When a building is selected in GameState, clear any active road selection
  useEffect(() => {
    if (selectedBuildingId) {
      setSelectedRoad(null);
    }
  }, [selectedBuildingId]);

  const selectedBuilding = placedBuildings.find((b) => b.id === selectedBuildingId);
  const hoveredBuilding =
    !selectedBuildingId && !selectedRoad && hoveredBuildingId
      ? placedBuildings.find((b) => b.id === hoveredBuildingId)
      : null;

  // Zoomed out threshold (> 58 units) - hide hover cards to prevent visual clutter
  const isZoomedOut = cameraDistance > 58;

  return (
    <group raycast={() => null}>
      {/* 1. SINGLE ACTIVE SELECTED BUILDING INSPECTOR CARD */}
      {selectedBuilding && (
        <group
          position={[
            selectedBuilding.x,
            selectedBuilding.y + getBuildingVisualHeight(selectedBuilding.category, selectedBuilding.modelType, selectedBuilding.level) + 1.1,
            selectedBuilding.z,
          ]}
        >
          <Html center distanceFactor={30} zIndexRange={[100, 0]}>
            <div className="pointer-events-auto bg-[#171d18]/96 border-2 border-[#c6a76a] p-3.5 rounded-xl shadow-2xl text-[#e8e9e3] flex flex-col gap-2 min-w-[270px] max-w-[310px] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between border-b border-[#344435] pb-2">
                <div>
                  <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-[#2b372c] text-[#a6bd82] border border-[#405442]">
                    {selectedBuilding.category}
                  </span>
                  <h4 className="text-sm font-bold text-[#f3f5ee] mt-1 leading-snug">
                    {selectedBuilding.name}
                  </h4>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-[#c6a76a] bg-[#2d281a] px-2 py-0.5 rounded border border-[#615232]">
                    Lvl {selectedBuilding.level} / {selectedBuilding.maxLevel}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      selectBuilding(null);
                    }}
                    className="p-1 rounded text-[#9da99b] hover:text-white hover:bg-[#253227] transition-colors"
                    title="Close"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Health & Efficiency Gauges */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-1.5 rounded bg-[#131914] border border-[#263528]">
                  <span className="text-[9px] text-[#8e9c8c] block uppercase">HEALTH</span>
                  <span className="font-bold text-[#f0f3eb]">{selectedBuilding.health}%</span>
                </div>
                <div className="p-1.5 rounded bg-[#131914] border border-[#263528]">
                  <span className="text-[9px] text-[#8e9c8c] block uppercase">EFFICIENCY</span>
                  <span className="font-bold text-[#a6bd82]">{selectedBuilding.efficiency}%</span>
                </div>
              </div>

              {/* In-World Actions */}
              <div className="flex items-center gap-1.5 pt-1 border-t border-[#29352a]">
                {(() => {
                  const upgradeCost = selectedBuilding.level * 280;
                  const canAfford = resources.materials >= upgradeCost && selectedBuilding.level < selectedBuilding.maxLevel;
                  return (
                    <button
                      disabled={!canAfford}
                      onClick={(e) => {
                        e.stopPropagation();
                        upgradeBuilding(selectedBuilding.id);
                      }}
                      className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold text-center transition-all ${
                        canAfford
                          ? 'bg-[#3b4c37] hover:bg-[#4d6348] text-[#dce9ca] border border-[#5d7756] shadow-sm cursor-pointer'
                          : 'bg-[#212721] text-[#697268] border border-[#2f3830] cursor-not-allowed'
                      }`}
                    >
                      {selectedBuilding.level >= selectedBuilding.maxLevel ? 'Max' : `Upgrade (${upgradeCost}M)`}
                    </button>
                  );
                })()}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    rotateBuilding(selectedBuilding.id, Math.PI / 4);
                  }}
                  className="py-1 px-2 rounded-lg text-xs font-semibold bg-[#202921] hover:bg-[#2d382e] text-[#dce9ca] border border-[#374738] transition-colors cursor-pointer"
                  title="Rotate structure 45°"
                >
                  ↻ 45°
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startRelocation(selectedBuilding.id);
                  }}
                  className="py-1 px-2 rounded-lg text-xs font-semibold bg-[#252a1d] hover:bg-[#363e2a] text-[#c6a76a] border border-[#4d482a] transition-colors cursor-pointer"
                  title="Relocate this building to a new terrain site"
                >
                  Move
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    demolishBuilding(selectedBuilding.id);
                  }}
                  className="py-1 px-2 rounded-lg text-xs font-semibold bg-[#2a1a18] hover:bg-[#3b231f] text-[#d47e69] border border-[#522d25] transition-colors cursor-pointer"
                  title="Demolish structure and recover materials"
                >
                  Demolish
                </button>
              </div>
            </div>
          </Html>
        </group>
      )}

      {/* 2. SINGLE ACTIVE SELECTED ROAD INSPECTOR CARD */}
      {selectedRoad && !selectedBuilding && (
        <group position={[0, 6.2, 0]}>
          <Html center distanceFactor={30} zIndexRange={[100, 0]}>
            <div className="pointer-events-auto bg-[#171d18]/96 border-2 border-[#c6a76a] p-3.5 rounded-xl shadow-2xl text-[#e8e9e3] flex flex-col gap-2 min-w-[280px] max-w-[330px] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between border-b border-[#344435] pb-2">
                <div>
                  <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-[#2b372c] text-[#a6bd82] border border-[#405442]">
                    {selectedRoad.category.replace('_', ' ')}
                  </span>
                  <h4 className="text-sm font-bold text-[#f3f5ee] mt-1 leading-snug">
                    {selectedRoad.name}
                  </h4>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRoad(null);
                  }}
                  className="p-1 rounded text-[#9da99b] hover:text-white hover:bg-[#253227] transition-colors"
                  title="Close"
                >
                  ✕
                </button>
              </div>

              {/* Road Telemetry Grid */}
              <div className="grid grid-cols-3 gap-1.5 text-center text-xs font-mono">
                <div className="p-1.5 rounded bg-[#131914] border border-[#263528]">
                  <span className="text-[8px] text-[#8e9c8c] block uppercase">SPEED</span>
                  <span className="font-bold text-[#f0f3eb]">{selectedRoad.speedLimitKmh} km/h</span>
                </div>
                <div className="p-1.5 rounded bg-[#131914] border border-[#263528]">
                  <span className="text-[8px] text-[#8e9c8c] block uppercase">LANES</span>
                  <span className="font-bold text-[#c6a76a]">{selectedRoad.lanes} Lanes</span>
                </div>
                <div className="p-1.5 rounded bg-[#131914] border border-[#263528]">
                  <span className="text-[8px] text-[#8e9c8c] block uppercase">FLOW</span>
                  <span className="font-bold text-[#a6bd82]">{selectedRoad.status}</span>
                </div>
              </div>

              <div className="pt-1.5 border-t border-[#29352a] text-[10px] text-[#abb8a8] space-y-0.5">
                <div>
                  <strong className="text-[#c6a76a]">Daily Traffic:</strong> {selectedRoad.throughputVehiclesPerDay.toLocaleString()} vehicles/day
                </div>
                <div>
                  <strong className="text-[#c6a76a]">Districts:</strong> {selectedRoad.connectedDistricts.join(' ↔ ')}
                </div>
              </div>
            </div>
          </Html>
        </group>
      )}

      {/* 3. NON-OVERLAPPING HOVER PREVIEW PILL (Single instance, camera distance-aware) */}
      {hoveredBuilding && !isZoomedOut && (
        <group
          position={[
            hoveredBuilding.x,
            hoveredBuilding.y + getBuildingVisualHeight(hoveredBuilding.category, hoveredBuilding.modelType, hoveredBuilding.level) + 0.6,
            hoveredBuilding.z,
          ]}
        >
          <Html center distanceFactor={30} zIndexRange={[50, 0]}>
            <div className="pointer-events-none px-2.5 py-1 rounded-lg bg-[#141b16]/95 border border-[#c6a76a] text-xs text-[#e8e9e3] whitespace-nowrap shadow-xl flex items-center gap-2 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
              <span className="w-2 h-2 rounded-full bg-[#a6bd82] animate-pulse" />
              <span className="font-bold text-[#f3f5ee] text-[11px]">{hoveredBuilding.name}</span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#2b271d] text-[#c6a76a] border border-[#52442b]">
                Lvl {hoveredBuilding.level}
              </span>
              <span className="text-[#a6bd82] font-mono font-semibold text-[10px]">
                {hoveredBuilding.efficiency}%
              </span>
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}

