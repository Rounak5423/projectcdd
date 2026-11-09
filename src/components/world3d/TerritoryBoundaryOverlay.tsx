import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGameState } from '../../context/GameStateContext';
import { getCitadelTerritoryRadius } from './placementValidation';
import { getTerrainHeight } from './Terrain';

export default function TerritoryBoundaryOverlay() {
  const { placedBuildings, civilization, isConstructionMode, activeLayer } = useGameState();

  const citadel = placedBuildings.find(
    (b) => b.modelType === 'citadel' || b.catalogId === 'bld-gov-citadel'
  );
  const citadelLevel = citadel?.level || civilization?.level || 1;
  const citadelX = citadel?.x ?? 0;
  const citadelZ = citadel?.z ?? 11;

  const targetRadius = getCitadelTerritoryRadius(citadelLevel);
  const currentRadiusRef = useRef(targetRadius);
  const ringMeshRef = useRef<THREE.Mesh>(null);

  // Smooth expansion interpolation when Citadel upgrades
  useFrame((_, delta) => {
    currentRadiusRef.current = THREE.MathUtils.lerp(
      currentRadiusRef.current,
      targetRadius,
      delta * 2.5
    );
    if (ringMeshRef.current) {
      const scale = currentRadiusRef.current / targetRadius;
      ringMeshRef.current.scale.set(scale, scale, 1);
    }
  });

  // Calculate 12 boundary beacon survey marker positions along perimeter
  const beaconPositions = useMemo(() => {
    const beacons: [number, number, number][] = [];
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const bx = citadelX + Math.cos(angle) * targetRadius;
      const bz = citadelZ + Math.sin(angle) * targetRadius;
      const by = getTerrainHeight(bx, bz, civilization?.terrainType) + 0.12;
      beacons.push([bx, by, bz]);
    }
    return beacons;
  }, [citadelX, citadelZ, targetRadius, civilization?.terrainType]);

  const terrainY = getTerrainHeight(citadelX, citadelZ, civilization?.terrainType) + 0.18;

  // Render prominently during construction mode, layer inspection, or always as subtle imperial boundary
  const isHighlighted = isConstructionMode || activeLayer === 'population' || activeLayer === 'economy';
  const ringOpacity = isHighlighted ? 0.75 : 0.32;
  const beaconColor = isHighlighted ? '#3be8b0' : '#c6a76a';

  return (
    <group raycast={() => null}>
      {/* 1. Main Imperial Sovereign Border Ring */}
      <group position={[citadelX, terrainY, citadelZ]}>
        <mesh ref={ringMeshRef} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[targetRadius - 0.45, targetRadius + 0.45, 96]} />
          <meshBasicMaterial
            color={beaconColor}
            transparent
            opacity={ringOpacity}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Outer subtle glow rim */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[targetRadius + 0.45, targetRadius + 1.8, 96]} />
          <meshBasicMaterial
            color={beaconColor}
            transparent
            opacity={ringOpacity * 0.28}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Floating Border Identification Label */}
        <Text
          position={[0, 1.8, targetRadius + 3.2]}
          rotation={[-Math.PI / 3, 0, 0]}
          fontSize={1.7}
          color={beaconColor}
          anchorX="center"
          anchorY="middle"
        >
          {`LEVEL ${citadelLevel} CITADEL DOMINION (${targetRadius.toFixed(0)}M TERRITORY)`}
        </Text>
      </group>

      {/* 2. Boundary Survey Beacons along Perimeter */}
      {beaconPositions.map(([bx, by, bz], idx) => (
        <group key={`beacon-${idx}`} position={[bx, by, bz]}>
          {/* Ground Anchor Plate */}
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.35, 0.45, 0.12, 8]} />
            <meshStandardMaterial color="#222b25" roughness={0.7} />
          </mesh>
          {/* Beacon Holographic Light Column */}
          <mesh position={[0, 0.85, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 1.5, 6]} />
            <meshBasicMaterial color={beaconColor} transparent opacity={isHighlighted ? 0.85 : 0.4} />
          </mesh>
          {/* Top Emitter Orb */}
          <mesh position={[0, 1.65, 0]}>
            <sphereGeometry args={[0.16, 8, 8]} />
            <meshBasicMaterial color={beaconColor} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

