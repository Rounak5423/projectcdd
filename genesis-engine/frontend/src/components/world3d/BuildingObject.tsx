import React, { useMemo, useRef } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Detailed } from '@react-three/drei';
import * as THREE from 'three';
import { PlacedBuilding } from '../../types/game';
import { MapLayer } from '../../context/GameStateContext';
import { MasterBuildingRouter } from './BuildingModels';
import { BuildingLODProxy } from './buildings/BuildingLODProxy';
import BuildingDamageEffect from './buildings/BuildingDamageEffect';
import BuildingScaffolding from './buildings/BuildingScaffolding';
import { triggerBuildingHover } from './WorldLabelManager';

interface BuildingObjectProps {
  building: PlacedBuilding;
  isSelected: boolean;
  onSelect: () => void;
  activeLayer: MapLayer;
}

function BuildingObject({
  building,
  isSelected,
  onSelect,
  activeLayer,
}: BuildingObjectProps) {
  const ringRef = useRef<THREE.Mesh>(null);

  // Dimming based on strategic map layers
  const isDimmed = useMemo(() => {
    if (activeLayer === 'all') return false;
    if (activeLayer === 'infrastructure' && ['energy', 'industrial'].includes(building.category)) return false;
    if (activeLayer === 'population' && ['residential', 'healthcare', 'education'].includes(building.category)) return false;
    if (activeLayer === 'resources' && ['agriculture', 'industrial', 'energy'].includes(building.category)) return false;
    if (activeLayer === 'environment' && ['agriculture', 'energy', 'environment'].includes(building.category)) return false;
    if (activeLayer === 'economy' && ['commercial', 'industrial', 'government'].includes(building.category)) return false;
    return true;
  }, [activeLayer, building.category]);

  // Animated selection ring pulse
  useFrame(({ clock }) => {
    if (isSelected && ringRef.current) {
      const pulse = 1.0 + Math.sin(clock.getElapsedTime() * 4.5) * 0.08;
      ringRef.current.scale.set(pulse, pulse, 1);
    }
  });

  const rotY = building.rotation || 0;

  return (
    <group
      position={[building.x, building.y, building.z]}
      rotation={[0, rotY, 0]}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        triggerBuildingHover(building.id);
      }}
      onPointerOut={() => {
        triggerBuildingHover(null);
      }}
    >
      {/* 1. Main 3D Architectural Model with Native GPU Level-of-Detail (LOD) */}
      <group scale={isDimmed ? 0.72 : isSelected ? 1.05 : 1.0}>
        <Detailed distances={[0, 48]}>
          {/* Level 0 (< 48 units): Full High-Fidelity Architectural Model */}
          <MasterBuildingRouter
            catalogId={building.catalogId}
            category={building.category}
            modelType={building.modelType}
            level={building.level}
            isSelected={isSelected}
          />
          {/* Level 1 (>= 48 units): Ultra-Fast Low-Poly LOD Proxy Silhouette */}
          <BuildingLODProxy
            category={building.category}
            modelType={building.modelType}
            level={building.level}
            isSelected={isSelected}
          />
        </Detailed>
      </group>

      {/* 2. Construction / Upgrading Holographic Scaffolding */}
      {(building.status === 'constructing' || building.status === 'upgrading') && (
        <BuildingScaffolding
          isUpgrading={building.status === 'upgrading'}
          width={3.4}
          height={3.2 + building.level * 0.4}
        />
      )}

      {/* 3. Building Damage & Warning Effects */}
      <BuildingDamageEffect health={building.health} status={building.status} />

      {/* 4. Ground Selection Projection Ring & Beacon Beam */}
      {isSelected && (
        <group position={[0, 0.05, 0]}>
          <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.5, 2.9, 36]} />
            <meshBasicMaterial color="#c6a76a" side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[3.2, 3.35, 36]} />
            <meshBasicMaterial color="#a6bd82" transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 6.0, 0]}>
            <cylinderGeometry args={[0.08, 0.2, 12, 8]} />
            <meshBasicMaterial color="#c6a76a" transparent opacity={0.25} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// React.memo with custom equality comparator to completely stop unnecessary re-renders on game state ticks
export default React.memo(BuildingObject, (prev, next) => {
  return (
    prev.isSelected === next.isSelected &&
    prev.activeLayer === next.activeLayer &&
    prev.building.id === next.building.id &&
    prev.building.level === next.building.level &&
    prev.building.health === next.building.health &&
    prev.building.efficiency === next.building.efficiency &&
    prev.building.status === next.building.status &&
    prev.building.x === next.building.x &&
    prev.building.z === next.building.z &&
    prev.building.rotation === next.building.rotation
  );
});
