import React, { useState, useEffect, useMemo } from 'react';
import { useThree, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGameState } from '../../context/GameStateContext';
import { getTerrainHeight, isNearRiver, isNearLake } from './Terrain';
import { MasterBuildingRouter } from './BuildingModels';

export default function PlacementSystem() {
  const {
    isConstructionMode,
    selectedCatalogItem,
    placeBuilding,
    setConstructionMode,
    placedBuildings,
    districts,
    resources,
  } = useGameState();

  const [cursorPos, setCursorPos] = useState<[number, number, number] | null>(null);
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);

  // Keyboard shortcut: 'R' to rotate by 45 degrees, 'Escape' to cancel
  useEffect(() => {
    if (!isConstructionMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        setRotationAngle((prev) => (prev + Math.PI / 4) % (Math.PI * 2));
      } else if (e.key === 'Escape') {
        setConstructionMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConstructionMode, setConstructionMode]);

  // Validation logic: checks collisions, rivers, bounds, and resources
  const validation = useMemo(() => {
    if (!cursorPos || !selectedCatalogItem) return { isValid: false, reason: '' };

    const [x, , z] = cursorPos;

    // 1. Check material cost
    if (resources.materials < selectedCatalogItem.costMaterials) {
      return { isValid: false, reason: 'Insufficient materials to construct' };
    }

    // 2. Check terrain boundary
    const distFromOrigin = Math.hypot(x, z);
    if (distFromOrigin > 52) {
      return { isValid: false, reason: 'Outside buildable perimeter' };
    }

    // 3. Check river & lake collision
    if (isNearRiver(x, z, 3.8)) {
      return { isValid: false, reason: 'Cannot construct on riverbed water channel' };
    }
    if (isNearLake(x, z, 5.0)) {
      return { isValid: false, reason: 'Cannot construct in scenic reservoir lake' };
    }

    // 4. Check overlap with existing placed buildings
    const minSpacing = 4.2;
    for (const b of placedBuildings) {
      const d = Math.hypot(x - b.x, z - b.z);
      if (d < minSpacing) {
        return { isValid: false, reason: `Too close to ${b.name}` };
      }
    }

    return { isValid: true, reason: 'Valid construction zone' };
  }, [cursorPos, selectedCatalogItem, placedBuildings, resources.materials]);

  if (!isConstructionMode || !selectedCatalogItem) return null;

  // Determine closest district based on placement coordinates
  const getNearestDistrictId = (x: number, z: number): string => {
    let bestDist = Infinity;
    let bestId = 'dist-citadel';
    for (const d of districts) {
      const dist = Math.hypot(x - d.x, z - d.z);
      if (dist < bestDist) {
        bestDist = dist;
        bestId = d.id;
      }
    }
    return bestId;
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    let rawX = e.point.x;
    let rawZ = e.point.z;

    if (snapToGrid) {
      rawX = Math.round(rawX / 2.0) * 2.0;
      rawZ = Math.round(rawZ / 2.0) * 2.0;
    }

    const terrainY = getTerrainHeight(rawX, rawZ) + 0.15;
    setCursorPos([rawX, terrainY, rawZ]);
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!cursorPos || !validation.isValid) return;

    const [x, , z] = cursorPos;
    const districtId = getNearestDistrictId(x, z);
    placeBuilding(selectedCatalogItem.id, x, z, districtId, rotationAngle);
  };

  // Render ghost model preview using MasterBuildingRouter
  const renderGhostMesh = () => {
    return (
      <MasterBuildingRouter
        catalogId={selectedCatalogItem.id}
        category={selectedCatalogItem.category}
        modelType={selectedCatalogItem.modelType}
        level={1}
        isSelected={false}
      />
    );
  };

  const ringColor = validation.isValid ? '#2ecc71' : '#e74c3c';
  const holoColor = validation.isValid ? '#a6bd82' : '#e74c3c';

  return (
    <group>
      {/* Interactive Raycast Plane covering world */}
      <mesh
        position={[0, 0.4, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={handlePointerMove}
        onClick={handleClick}
      >
        <planeGeometry args={[140, 140]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Holographic Ghost Building Cursor */}
      {cursorPos && (
        <group position={cursorPos} rotation={[0, rotationAngle, 0]}>
          {/* Ground Footprint Ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
            <ringGeometry args={[2.0, 2.35, 36]} />
            <meshBasicMaterial color={ringColor} side={THREE.DoubleSide} />
          </mesh>

          {/* Construction Boundary Grid */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
            <planeGeometry args={[4.4, 4.4]} />
            <meshBasicMaterial color={ringColor} wireframe transparent opacity={0.4} />
          </mesh>

          {/* Holographic Preview Model */}
          <group>
            {renderGhostMesh()}
          </group>

          {/* Floating Validation Tooltip Banner */}
          <Html position={[0, 4.8, 0]} center distanceFactor={28}>
            <div
              className={`pointer-events-none px-3.5 py-2 rounded-xl text-xs font-semibold shadow-2xl flex flex-col items-center gap-0.5 whitespace-nowrap backdrop-blur-md border ${
                validation.isValid
                  ? 'bg-[#18261b]/95 border-[#2ecc71] text-[#dcf2db]'
                  : 'bg-[#291817]/95 border-[#e74c3c] text-[#fcdad7]'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    validation.isValid ? 'bg-[#2ecc71]' : 'bg-[#e74c3c] animate-ping'
                  }`}
                />
                <span>
                  {validation.isValid
                    ? `Click to build ${selectedCatalogItem.name}`
                    : validation.reason}
                </span>
              </div>
              <span className="text-[10px] text-[#abb7a7]">
                [R] Rotate ({(Math.round((rotationAngle * 180) / Math.PI)) % 360}°) · [Esc] Cancel · Cost: {selectedCatalogItem.costMaterials} Mat.
              </span>
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}

