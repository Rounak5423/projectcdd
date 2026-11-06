import React, { useState, useMemo, useRef } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { PlacedBuilding } from '../../types/game';
import { MapLayer, useGameState } from '../../context/GameStateContext';
import {
  WindTurbineModel,
  ObservatoryModel,
  ArcologySpireModel,
  ModularHabitatModel,
  CommercialExchangeModel,
  CommercialPlazaModel,
  AcademyModel,
  HospitalModel,
  FactoryModel,
  WarehouseModel,
  SolarArrayModel,
  FusionPlantModel,
  WaterTreatmentModel,
  BotanicalParkModel,
  HydroponicDomeModel,
  AlgaeBasinModel,
  CitadelModel,
} from './BuildingModels';

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
  const { resources, rates } = useGameState();

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

  // Select appropriate architectural 3D model
  const renderBuildingMesh = () => {
    const isSel = isSelected;
    const lvl = building.level || 1;

    switch (building.modelType) {
      case 'turbine':
        return <WindTurbineModel isSelected={isSel} level={lvl} />;
      case 'observatory':
        return <ObservatoryModel isSelected={isSel} level={lvl} />;
      case 'solar':
        return <SolarArrayModel isSelected={isSel} level={lvl} />;
      case 'power_plant':
        return <FusionPlantModel isSelected={isSel} level={lvl} />;
      case 'water_treatment':
        return <WaterTreatmentModel isSelected={isSel} level={lvl} />;
      case 'warehouse':
        return <WarehouseModel isSelected={isSel} level={lvl} />;
      case 'park':
        return <BotanicalParkModel isSelected={isSel} level={lvl} />;
      case 'commercial':
        return <CommercialPlazaModel isSelected={isSel} level={lvl} />;
      case 'hospital':
        return <HospitalModel isSelected={isSel} level={lvl} />;
      case 'academy':
        return <AcademyModel isSelected={isSel} level={lvl} />;
      case 'factory':
        return <FactoryModel isSelected={isSel} level={lvl} />;
      case 'hydroponic':
        return <HydroponicDomeModel isSelected={isSel} level={lvl} />;
      case 'dome':
        return <AlgaeBasinModel isSelected={isSel} level={lvl} />;
      case 'citadel':
        return <CitadelModel isSelected={isSel} level={lvl} />;
      case 'tower':
      default:
        if (building.category === 'commercial') {
          return <CommercialExchangeModel isSelected={isSel} level={lvl} />;
        }
        if (building.catalogId.includes('modular')) {
          return <ModularHabitatModel isSelected={isSel} level={lvl} />;
        }
        return <ArcologySpireModel isSelected={isSel} level={lvl} />;
    }
  };

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
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Visual Construction Scaffolding if under construction */}
      {building.status === 'constructing' ? (
        <group>
          <mesh position={[0, 1.5, 0]}>
            <boxGeometry args={[3.0, 3.0, 3.0]} />
            <meshBasicMaterial color="#c6a76a" wireframe transparent opacity={0.6} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.8, 2.2, 24]} />
            <meshBasicMaterial color="#c6a76a" />
          </mesh>
        </group>
      ) : (
        <group scale={isDimmed ? 0.72 : hovered ? 1.05 : 1.0}>
          {renderBuildingMesh()}
        </group>
      )}

      {/* Ground Selection Projection Ring & Beacon */}
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
          {/* Subtle vertical golden beacon beam */}
          <mesh position={[0, 6.0, 0]}>
            <cylinderGeometry args={[0.08, 0.2, 12, 8]} />
            <meshBasicMaterial color="#c6a76a" transparent opacity={0.25} />
          </mesh>
        </group>
      )}

      {/* Warning Alert Icon if health or efficiency is compromised */}
      {hasResourceWarning && (
        <Html position={[0, 5.2, 0]} center distanceFactor={30}>
          <div className="w-5 h-5 rounded-full bg-[#d45d44] border-2 border-[#ffb4a2] flex items-center justify-center text-[11px] font-bold text-white shadow-lg animate-bounce pointer-events-none">
            !
          </div>
        </Html>
      )}

      {/* Floating Tactical HUD Info Card on hover or selection */}
      {(hovered || isSelected) && (
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
      )}
    </group>
  );
}

