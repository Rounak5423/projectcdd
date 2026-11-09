import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGameState } from '../../context/GameStateContext';
import { getTerrainHeight } from './Terrain';
import { MasterBuildingRouter } from './BuildingModels';
import { validateBuildingPlacement, ValidationResult } from './placementValidation';
import { calculateRoadsideAlignment } from './cityPlanning';

export default function PlacementSystem() {
  const {
    isConstructionMode,
    selectedCatalogItem,
    relocatingBuildingId,
    placeBuilding,
    relocateBuilding,
    setConstructionMode,
    cancelRelocation,
    placedBuildings,
    districts,
    resources,
  } = useGameState();

  const [cursorPos, setCursorPos] = useState<[number, number, number] | null>(null);
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [snapToRoad, setSnapToRoad] = useState<boolean>(true);
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: true,
    reason: 'Evaluating civic zoning...',
    distToRoad: 0,
    slope: 0,
    terrainElevation: 0,
    isFarFromRoad: false,
    zoneName: 'Central District',
  });

  const pointerDownScreenPos = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastCellRef = useRef<string>('');
  const pulseRef = useRef<THREE.Mesh>(null);

  // Terrain-conforming raycast surface for parallax-free cursor projection on hills and slopes
  const collisionGeo = useMemo(() => {
    const size = 320;
    const segs = 64;
    const geo = new THREE.PlaneGeometry(size, size, segs, segs);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      pos.setY(i, getTerrainHeight(vx, vz));
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  useEffect(() => {
    return () => {
      collisionGeo.dispose();
    };
  }, [collisionGeo]);

  // Keyboard controls:
  // [R] / [Shift+R] - Rotate in 45° increments
  // [S] - Toggle Intelligent Roadside Snapping
  // [Escape] - Cancel construction or relocation
  useEffect(() => {
    if (!isConstructionMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        const delta = e.shiftKey ? -Math.PI / 4 : Math.PI / 4;
        setRotationAngle((prev) => {
          let next = (prev + delta) % (Math.PI * 2);
          if (next < 0) next += Math.PI * 2;
          return next;
        });
      } else if (e.key === 's' || e.key === 'S') {
        setSnapToRoad((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (relocatingBuildingId) {
          cancelRelocation();
        } else {
          setConstructionMode(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConstructionMode, relocatingBuildingId, cancelRelocation, setConstructionMode]);

  // Subtle pulsing animation on the holographic foundation ring
  useFrame(({ clock }) => {
    if (pulseRef.current) {
      const s = 1.0 + Math.sin(clock.getElapsedTime() * 4.0) * 0.05;
      pulseRef.current.scale.set(s, s, 1);
    }
  });

  // Nearest district resolution based on world coordinates
  const getNearestDistrictId = useCallback(
    (x: number, z: number): string => {
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
    },
    [districts]
  );

  // Pointer move handler with roadside alignment & snapping
  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();

    const rawX = e.point.x;
    const rawZ = e.point.z;

    let targetX = rawX;
    let targetZ = rawZ;

    // Intelligent Roadside Snapping & Facing Alignment
    if (snapToRoad && selectedCatalogItem) {
      const alignment = calculateRoadsideAlignment(rawX, rawZ, selectedCatalogItem.category, 2.2);
      if (alignment.isBesideRoad) {
        targetX = Math.round(alignment.snappedX * 10) / 10;
        targetZ = Math.round(alignment.snappedZ * 10) / 10;
        setRotationAngle(alignment.facingRotation);
      } else {
        targetX = Math.round(rawX * 2) / 2;
        targetZ = Math.round(rawZ * 2) / 2;
      }
    } else {
      targetX = Math.round(rawX * 10) / 10;
      targetZ = Math.round(rawZ * 10) / 10;
    }

    const cellKey = `${targetX}_${targetZ}`;
    if (cellKey === lastCellRef.current) return;
    lastCellRef.current = cellKey;

    const terrainY = getTerrainHeight(targetX, targetZ) + 0.12;
    const newPos: [number, number, number] = [targetX, terrainY, targetZ];
    setCursorPos(newPos);

    if (selectedCatalogItem) {
      const val = validateBuildingPlacement({
        x: targetX,
        z: targetZ,
        catalogItem: selectedCatalogItem,
        placedBuildings,
        resources,
        relocatingBuildingId,
      });
      setValidation(val);
    }
  };

  // Guard against camera drag: only confirm placement on clean click
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    pointerDownScreenPos.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!pointerDownScreenPos.current || !cursorPos || !selectedCatalogItem) return;

    const dx = e.clientX - pointerDownScreenPos.current.x;
    const dy = e.clientY - pointerDownScreenPos.current.y;
    const dragDistance = Math.hypot(dx, dy);
    pointerDownScreenPos.current = null;

    // If pointer moved more than 7px, user was navigating/orbiting the camera
    if (dragDistance > 7) return;

    // Validate placement
    const val = validateBuildingPlacement({
      x: cursorPos[0],
      z: cursorPos[2],
      catalogItem: selectedCatalogItem,
      placedBuildings,
      resources,
      relocatingBuildingId,
    });

    if (!val.isValid) return;

    const [x, , z] = cursorPos;
    const districtId = getNearestDistrictId(x, z);

    if (relocatingBuildingId) {
      relocateBuilding(relocatingBuildingId, x, z, districtId, rotationAngle);
    } else {
      placeBuilding(selectedCatalogItem.id, x, z, districtId, rotationAngle);
    }
  };

  if (!isConstructionMode || !selectedCatalogItem) return null;

  const validColor = '#2ecc71';
  const invalidColor = '#e74c3c';
  const activeColor = validation.isValid ? validColor : invalidColor;

  const degrees = Math.round((rotationAngle * 180) / Math.PI) % 360;

  return (
    <group>
      {/* 1. Global Terrain-Conforming Raycast Intersection Surface */}
      <mesh
        geometry={collisionGeo}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* 2. Interactive Holographic Preview & Roadside Alignment Grid */}
      {cursorPos && (
        <group position={cursorPos} rotation={[0, rotationAngle, 0]}>
          {/* Dynamic 8x8m Holographic Construction Grid */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} raycast={() => null}>
            <planeGeometry args={[7.8, 7.8, 6, 6]} />
            <meshBasicMaterial
              color={activeColor}
              wireframe
              transparent
              opacity={validation.isValid ? 0.38 : 0.55}
            />
          </mesh>

          {/* Animated Ground Footprint Ring */}
          <mesh
            ref={pulseRef}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.04, 0]}
            raycast={() => null}
          >
            <ringGeometry args={[2.2, 2.55, 36]} />
            <meshBasicMaterial
              color={activeColor}
              transparent
              opacity={0.85}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Directional Front Entrance Arrow Indicator (Points directly towards adjacent road) */}
          <group position={[0, 0.06, 2.7]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
            <coneGeometry args={[0.45, 0.7, 3]} />
            <meshBasicMaterial color={activeColor} />
          </group>

          {/* Transparent Holographic Ghost Building Model */}
          <group>
            <MasterBuildingRouter
              catalogId={selectedCatalogItem.id}
              category={selectedCatalogItem.category}
              modelType={selectedCatalogItem.modelType}
              level={1}
              isSelected={false}
            />
            {/* Holographic Volume Tint Bounding Shell */}
            <mesh position={[0, 2.2, 0]} raycast={() => null}>
              <cylinderGeometry args={[2.3, 2.3, 4.4, 16]} />
              <meshBasicMaterial
                color={activeColor}
                transparent
                opacity={0.12}
                wireframe
              />
            </mesh>
          </group>

          {/* Floating High-Legibility In-World Status & Instruction Card */}
          <Html position={[0, 5.4, 0]} center distanceFactor={28} zIndexRange={[120, 0]}>
            <div
              className={`pointer-events-none px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl flex flex-col items-center gap-1.5 whitespace-nowrap backdrop-blur-xl border transition-all ${
                validation.isValid
                  ? 'bg-[#142317]/95 border-[#2ecc71] text-[#e3f7e1]'
                  : 'bg-[#291412]/95 border-[#e74c3c] text-[#fce2de]'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    validation.isValid ? 'bg-[#2ecc71]' : 'bg-[#e74c3c] animate-ping'
                  }`}
                />
                <span className="text-sm">
                  {validation.isValid
                    ? relocatingBuildingId
                      ? `Click to Relocate ${selectedCatalogItem.name}`
                      : `Click to Construct ${selectedCatalogItem.name}`
                    : validation.reason}
                </span>
              </div>

              {validation.isValid && validation.zoneName && (
                <div className="text-[11px] text-[#a6bd82] font-mono">
                  📍 {validation.zoneName} · Road Frontage: {validation.distToRoad.toFixed(1)}m
                </div>
              )}

              <div className="flex items-center gap-2 text-[10px] text-[#b6c7b3] font-mono">
                <span className="bg-[#1c281e] px-1.5 py-0.5 rounded border border-[#354838]">
                  Facing: {degrees}° [R]
                </span>
                <span className={`px-1.5 py-0.5 rounded border ${
                  snapToRoad
                    ? 'bg-[#203a25] border-[#4caf50] text-[#a5d6a7]'
                    : 'bg-[#1c281e] border-[#354838]'
                }`}>
                  Road Snap: {snapToRoad ? 'ON [S]' : 'OFF [S]'}
                </span>
                {!relocatingBuildingId && (
                  <span className="text-[#e0be70] font-semibold">
                    Cost: {selectedCatalogItem.costMaterials} Mat.
                  </span>
                )}
                <span className="text-[#e57373]">[Esc] Cancel</span>
              </div>
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}
