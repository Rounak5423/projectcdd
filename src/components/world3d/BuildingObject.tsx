import React, { useState, useMemo, useRef } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { PlacedBuilding } from '../../types/game';
import { MapLayer, useGameState } from '../../context/GameStateContext';
import { MasterBuildingRouter } from './BuildingModels';
import BuildingDamageEffect from './buildings/BuildingDamageEffect';
import BuildingScaffolding from './buildings/BuildingScaffolding';

interface BuildingObjectProps {
  building: PlacedBuilding;
  isSelected: boolean;
  onSelect: () => void;
  activeLayer: MapLayer;
}

export default function BuildingObject({
  building,
  isSelected,
  onSelect,
  activeLayer,
}: BuildingObjectProps) {
  const [hovered, setHovered] = useState(false);
  const ringRef = useRef<THREE.Mesh>(null);
  const {
    resources,
    rates,
    upgradeBuilding,
    demolishBuilding,
    selectBuilding,
  } = useGameState();

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

  // Resource warning check
  const hasResourceWarning = useMemo(() => {
    if (building.category === 'industrial' && resources.materials <= 0 && rates.materialsRate < 0) return true;
    if (building.category === 'energy' && resources.energy <= 0) return true;
    if (building.health < 60 || building.efficiency < 50) return true;
    return false;
  }, [building, resources, rates]);

  const rotY = building.rotation || 0;
  const upgradeCost = building.level * 280;
  const canAffordUpgrade = resources.materials >= upgradeCost && building.level < building.maxLevel;

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
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* 1. Main 3D Architectural Model */}
      <group scale={isDimmed ? 0.72 : hovered && !isSelected ? 1.04 : 1.0}>
        <MasterBuildingRouter
          catalogId={building.catalogId}
          category={building.category}
          modelType={building.modelType}
          level={building.level}
          isSelected={isSelected}
        />
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

      {/* 5. Warning Alert Icon for Compromised Health/Efficiency */}
      {hasResourceWarning && (
        <Html position={[0, 5.2, 0]} center distanceFactor={30}>
          <div className="w-5 h-5 rounded-full bg-[#d45d44] border-2 border-[#ffb4a2] flex items-center justify-center text-[11px] font-bold text-white shadow-lg animate-bounce pointer-events-none">
            !
          </div>
        </Html>
      )}

      {/* 6. In-World Interactive Tactical Building Card (On Selection) */}
      {isSelected ? (
        <Html position={[0, 5.8, 0]} center distanceFactor={28}>
          <div className="pointer-events-auto bg-[#171d18]/95 border-2 border-[#c6a76a] p-3.5 rounded-xl shadow-2xl text-[#e8e9e3] flex flex-col gap-2 min-w-[270px] max-w-[310px] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-[#344435] pb-2">
              <div>
                <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-[#2b372c] text-[#a6bd82] border border-[#405442]">
                  {building.category}
                </span>
                <h4 className="text-sm font-bold text-[#f3f5ee] mt-1 leading-snug">
                  {building.name}
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-[#c6a76a] bg-[#2d281a] px-2 py-0.5 rounded border border-[#615232]">
                Lvl {building.level} / {building.maxLevel}
              </span>
            </div>

            {/* Health & Efficiency Gauges */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-1.5 rounded bg-[#131914] border border-[#263528]">
                <span className="text-[9px] text-[#8e9c8c] block">HEALTH</span>
                <span className="font-bold text-[#f0f3eb]">{building.health}%</span>
              </div>
              <div className="p-1.5 rounded bg-[#131914] border border-[#263528]">
                <span className="text-[9px] text-[#8e9c8c] block">EFFICIENCY</span>
                <span className="font-bold text-[#a6bd82]">{building.efficiency}%</span>
              </div>
            </div>

            {/* In-World Actions */}
            <div className="flex items-center gap-1.5 pt-1 border-t border-[#29352a]">
              <button
                disabled={!canAffordUpgrade}
                onClick={(e) => {
                  e.stopPropagation();
                  upgradeBuilding(building.id);
                }}
                className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold text-center transition-all ${
                  canAffordUpgrade
                    ? 'bg-[#3b4c37] hover:bg-[#4d6348] text-[#dce9ca] border border-[#5d7756] shadow-sm'
                    : 'bg-[#212721] text-[#697268] border border-[#2f3830] cursor-not-allowed'
                }`}
                title={
                  building.level >= building.maxLevel
                    ? 'Max Level Reached'
                    : `Upgrade (${upgradeCost} Materials)`
                }
              >
                {building.level >= building.maxLevel ? 'Max Lvl' : `Upgrade (${upgradeCost}M)`}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  demolishBuilding(building.id);
                }}
                className="py-1 px-2 rounded-lg text-xs font-semibold bg-[#2a1a18] hover:bg-[#3b231f] text-[#d47e69] border border-[#522d25] transition-colors"
                title="Demolish structure and recover 150 materials"
              >
                Demolish
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  selectBuilding(null);
                }}
                className="p-1 rounded text-[#9da99b] hover:text-white"
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>
        </Html>
      ) : (
        /* 7. Hover Preview Tooltip */
        hovered && (
          <Html position={[0, 4.8, 0]} center distanceFactor={28}>
            <div className="pointer-events-none px-3 py-1.5 rounded-lg bg-[#141b16]/95 border border-[#c6a76a] text-xs text-[#e8e9e3] whitespace-nowrap shadow-2xl flex flex-col gap-0.5 backdrop-blur-md">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#a6bd82] animate-pulse" />
                <span className="font-bold text-[#f3f5ee]">{building.name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#2b271d] text-[#c6a76a] border border-[#52442b]">
                  Lvl {building.level}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#9da99b] gap-2 pt-0.5 border-t border-[#29352a]">
                <span className="uppercase font-mono">{building.category}</span>
                <span className="text-[#a6bd82] font-mono font-semibold">{building.efficiency}% eff.</span>
              </div>
            </div>
          </Html>
        )
      )}
    </group>
  );
}
