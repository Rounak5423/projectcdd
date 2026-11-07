import React, { useMemo, useRef } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Detailed, Html } from '@react-three/drei';
import * as THREE from 'three';
import { PlacedBuilding } from '../../types/game';
import { useGameState, MapLayer } from '../../context/GameStateContext';
import { MasterBuildingRouter } from './BuildingModels';
import { BuildingLODProxy } from './buildings/BuildingLODProxy';
import BuildingDamageEffect from './buildings/BuildingDamageEffect';
import BuildingScaffolding from './buildings/BuildingScaffolding';
import ConstructionStageModel from './buildings/ConstructionStageModel';
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
  const { isConstructionMode } = useGameState();
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
      raycast={isConstructionMode ? () => null : undefined}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (isConstructionMode) return;
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        if (isConstructionMode) return;
        e.stopPropagation();
        triggerBuildingHover(building.id);
      }}
      onPointerOut={() => {
        if (isConstructionMode) return;
        triggerBuildingHover(null);
      }}
    >
      {/* 1. Main 3D Architectural Model or Active Construction Lifecycle */}
      {building.status === 'constructing' ? (
        <ConstructionStageModel
          progress={building.constructionProgress ?? 0}
          category={building.category}
          modelType={building.modelType}
          isSelected={isSelected}
        />
      ) : (
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
      )}

      {/* 2. Construction / Upgrading Holographic Scaffolding & Progress HUD */}
      {building.status === 'upgrading' && (
        <>
          <BuildingScaffolding
            isUpgrading={true}
            width={3.4}
            height={3.2 + building.level * 0.4}
          />
          {/* Floating Upgrade HUD */}
          <group position={[0, 4.4 + building.level * 0.4, 0]}>
            <Html
              position={[0, 0, 0]}
              center
              distanceFactor={18}
              zIndexRange={[100, 0]}
              transform={false}
            >
              <div
                className={`pointer-events-none select-none transition-all duration-200 flex flex-col items-center ${
                  isSelected ? 'scale-110' : 'scale-95'
                }`}
              >
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1b221a]/95 border-2 border-[#2ecc71] shadow-xl backdrop-blur-md">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent border-[#2ecc71] animate-spin" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono font-black text-[#2ecc71] tracking-wider leading-none">
                      {(building.upgradeProgress ?? 0).toFixed(0)}%
                    </span>
                    <span className="text-[8px] font-sans font-bold text-[#e0e0e0] leading-none mt-0.5">
                      Upgrading to Lvl {building.targetLevel || building.level + 1}
                    </span>
                  </div>
                </div>
                <div className="w-1.5 h-1.5 bg-[#2ecc71] rotate-45 -mt-1 shadow-md" />
              </div>
            </Html>
          </group>
        </>
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
