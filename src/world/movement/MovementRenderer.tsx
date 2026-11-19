/**
 * Authoritative 3D Movement Renderer
 * File: src/world/movement/MovementRenderer.tsx
 * 
 * Renders backend-authoritative vehicles and pedestrians in the 3D scene
 * with realistic geometries, rotating wheels, emergency strobe beacons,
 * dynamic state badges, and smooth terrain conformity.
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMovementSync, InterpolatedVehicle, InterpolatedPedestrian } from './useMovementSync';
import { MapTerrainType } from '../../types/game';
import { Html } from '@react-three/drei';

interface MovementRendererProps {
  terrainType?: MapTerrainType;
  showBadges?: boolean;
}

// Color palettes for vehicle categories
const VEHICLE_COLORS: Record<string, string> = {
  sedan: '#2980b9',
  bus: '#f39c12',
  truck: '#7f8c8d',
  ambulance: '#ecf0f1',
  police: '#2c3e50',
  fire_truck: '#c0392b',
  service: '#16a085',
};

// Pedestrian archetype colors
const ARCHETYPE_COLORS: Record<string, string> = {
  casual: '#3498db',
  executive: '#2c3e50',
  medical: '#00b4d8',
  student: '#e76f51',
  worker: '#f39c12',
  scientist: '#9b59b6',
};

function VehicleMesh({ vehicle, showBadge }: { vehicle: InterpolatedVehicle; showBadge: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const strobeRef = useRef<THREE.PointLight>(null);

  const baseColor = VEHICLE_COLORS[vehicle.category] || VEHICLE_COLORS.sedan;
  const isEmergency = vehicle.sirenActive;
  const isBus = vehicle.category === 'bus';
  const isTruck = vehicle.category === 'truck';

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.position.set(vehicle.position[0], vehicle.position[1], vehicle.position[2]);
      groupRef.current.rotation.y = -vehicle.headingRad + Math.PI / 2;
    }
    if (strobeRef.current && isEmergency) {
      const t = clock.getElapsedTime() * 12.0;
      strobeRef.current.intensity = Math.sin(t) > 0 ? 3.5 : 0.2;
      strobeRef.current.color.set(Math.sin(t) > 0 ? '#ff2222' : '#2255ff');
    }
  });

  return (
    <group ref={groupRef}>
      {/* Vehicle Chassis */}
      {isBus ? (
        // Bus body
        <mesh position={[0, 1.1, 0]} castShadow>
          <boxGeometry args={[2.4, 2.0, 10.5]} />
          <meshStandardMaterial color={baseColor} roughness={0.3} metalness={0.4} transparent opacity={vehicle.opacity} />
        </mesh>
      ) : isTruck ? (
        // Truck cabin + cargo
        <group position={[0, 0.9, 0]}>
          <mesh position={[0, 0.2, 2.2]} castShadow>
            <boxGeometry args={[2.2, 1.8, 2.4]} />
            <meshStandardMaterial color={baseColor} roughness={0.4} transparent opacity={vehicle.opacity} />
          </mesh>
          <mesh position={[0, 0.5, -1.5]} castShadow>
            <boxGeometry args={[2.3, 2.2, 5.2]} />
            <meshStandardMaterial color="#bdc3c7" roughness={0.6} transparent opacity={vehicle.opacity} />
          </mesh>
        </group>
      ) : (
        // Standard Car / Emergency Cruiser
        <group position={[0, 0.5, 0]}>
          {/* Main body */}
          <mesh position={[0, 0.15, 0]} castShadow>
            <boxGeometry args={[1.8, 0.7, 4.0]} />
            <meshStandardMaterial color={baseColor} roughness={0.2} metalness={0.6} transparent opacity={vehicle.opacity} />
          </mesh>
          {/* Cabin greenhouse */}
          <mesh position={[0, 0.65, -0.2]} castShadow>
            <boxGeometry args={[1.5, 0.55, 2.0]} />
            <meshStandardMaterial color="#1a252f" roughness={0.1} metalness={0.9} transparent opacity={vehicle.opacity} />
          </mesh>
        </group>
      )}

      {/* Headlights & Taillights */}
      <mesh position={[0.65, 0.45, isBus ? 5.3 : 2.05]}>
        <boxGeometry args={[0.3, 0.15, 0.05]} />
        <meshBasicMaterial color="#ffffcc" />
      </mesh>
      <mesh position={[-0.65, 0.45, isBus ? 5.3 : 2.05]}>
        <boxGeometry args={[0.3, 0.15, 0.05]} />
        <meshBasicMaterial color="#ffffcc" />
      </mesh>
      <mesh position={[0.65, 0.45, isBus ? -5.3 : -2.05]}>
        <boxGeometry args={[0.3, 0.15, 0.05]} />
        <meshBasicMaterial color="#e74c3c" />
      </mesh>
      <mesh position={[-0.65, 0.45, isBus ? -5.3 : -2.05]}>
        <boxGeometry args={[0.3, 0.15, 0.05]} />
        <meshBasicMaterial color="#e74c3c" />
      </mesh>

      {/* Emergency Siren Beacon */}
      {isEmergency && (
        <group position={[0, isBus ? 2.2 : 1.35, 0]}>
          <mesh>
            <boxGeometry args={[0.4, 0.2, 0.3]} />
            <meshBasicMaterial color="#ff2222" />
          </mesh>
          <pointLight ref={strobeRef} distance={15} intensity={2.5} color="#ff2222" />
        </group>
      )}

      {/* State Badges (waiting, yielding, siren, boarding) */}
      {showBadge && vehicle.stateBadge !== 'normal' && (
        <Html position={[0, isBus ? 3.0 : 2.0, 0]} center distanceFactor={28}>
          <div
            style={{
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              background:
                vehicle.stateBadge === 'siren'
                  ? 'rgba(231, 76, 60, 0.9)'
                  : vehicle.stateBadge === 'yielding'
                  ? 'rgba(230, 126, 34, 0.9)'
                  : vehicle.stateBadge === 'waiting_signal'
                  ? 'rgba(192, 57, 43, 0.9)'
                  : vehicle.stateBadge === 'boarding'
                  ? 'rgba(41, 128, 185, 0.9)'
                  : 'rgba(52, 73, 94, 0.85)',
              color: '#ffffff',
              boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.4)',
            }}
          >
            {vehicle.stateBadge === 'waiting_signal'
              ? '🚦 WAITING'
              : vehicle.stateBadge === 'yielding'
              ? '⚠️ YIELDING'
              : vehicle.stateBadge === 'siren'
              ? '🚨 EMERGENCY'
              : vehicle.stateBadge === 'boarding'
              ? '🚌 BOARDING'
              : vehicle.stateBadge}
          </div>
        </Html>
      )}
    </group>
  );
}

function PedestrianMesh({ pedestrian }: { pedestrian: InterpolatedPedestrian }) {
  const groupRef = useRef<THREE.Group>(null);
  const color = ARCHETYPE_COLORS[pedestrian.archetype] || ARCHETYPE_COLORS.casual;

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.position.set(pedestrian.position[0], pedestrian.position[1], pedestrian.position[2]);
      groupRef.current.rotation.y = -pedestrian.headingRad + Math.PI / 2;
      // Stride bobbing
      const walkBob = Math.sin(clock.getElapsedTime() * 10.0 * (pedestrian.speedMps / 1.35)) * 0.04;
      groupRef.current.position.y += Math.max(0, walkBob);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Torso */}
      <mesh position={[0, 0.65, 0]} castShadow>
        <capsuleGeometry args={[0.2, 0.5, 4, 8]} />
        <meshStandardMaterial color={color} roughness={0.5} transparent opacity={pedestrian.opacity} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <sphereGeometry args={[0.16, 8, 8]} />
        <meshStandardMaterial color="#f5d0b5" roughness={0.6} transparent opacity={pedestrian.opacity} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.1, 0.25, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.5, 6]} />
        <meshStandardMaterial color="#2c3e50" roughness={0.7} transparent opacity={pedestrian.opacity} />
      </mesh>
      <mesh position={[0.1, 0.25, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.5, 6]} />
        <meshStandardMaterial color="#2c3e50" roughness={0.7} transparent opacity={pedestrian.opacity} />
      </mesh>
    </group>
  );
}

export function MovementRenderer({
  terrainType = 'Verdant River Valley',
  showBadges = true,
}: MovementRendererProps) {
  const { vehicles, pedestrians } = useMovementSync(terrainType);

  return (
    <group name="authoritative-movement-subsystem">
      {/* Vehicles */}
      {vehicles.map((v) => (
        <VehicleMesh key={v.id} vehicle={v} showBadge={showBadges} />
      ))}

      {/* Pedestrians */}
      {pedestrians.map((p) => (
        <PedestrianMesh key={p.id} pedestrian={p} />
      ))}
    </group>
  );
}

export default MovementRenderer;
