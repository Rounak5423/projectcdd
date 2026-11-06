import React from 'react';
import * as THREE from 'three';
import { useDayNight } from '../DayNightController';

// Shared Architectural Doorway Unit
export function ArchitecturalDoor({
  width = 0.6,
  height = 1.0,
  position = [0, 0, 0],
}: {
  width?: number;
  height?: number;
  position?: [number, number, number];
}) {
  const [x, y, z] = position;
  return (
    <group position={[x, y + height * 0.5, z]}>
      {/* Frame */}
      <mesh>
        <boxGeometry args={[width + 0.1, height + 0.08, 0.06]} />
        <meshStandardMaterial color="#2d332e" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Door panel */}
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#7a5538" roughness={0.6} />
      </mesh>
      {/* Transom light / awning */}
      <mesh position={[0, height * 0.5 + 0.08, 0.15]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[width + 0.25, 0.06, 0.35]} />
        <meshStandardMaterial color="#354037" metalness={0.6} />
      </mesh>
    </group>
  );
}

// Reusable Day/Night Window Unit
export function ArchitecturalWindow({
  width = 0.7,
  height = 0.5,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  isLit = true,
}: {
  width?: number;
  height?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  isLit?: boolean;
}) {
  const { isNight } = useDayNight();
  const [x, y, z] = position;

  return (
    <group position={[x, y, z]} rotation={rotation}>
      {/* Window Frame */}
      <mesh>
        <boxGeometry args={[width + 0.06, height + 0.06, 0.04]} />
        <meshStandardMaterial color="#222b24" roughness={0.5} />
      </mesh>
      {/* Window Glass Pane with Emissive Glow at Night */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          color={isNight && isLit ? '#ffeaa7' : '#d2e4ba'}
          transparent
          opacity={isNight && isLit ? 0.95 : 0.6}
        />
      </mesh>
    </group>
  );
}

// Modern Glass/Steel Balcony Unit
export function ArchitecturalBalcony({
  width = 1.4,
  depth = 0.6,
  position = [0, 0, 0],
}: {
  width?: number;
  depth?: number;
  position?: [number, number, number];
}) {
  const [x, y, z] = position;
  return (
    <group position={[x, y, z]}>
      {/* Balcony Floor Slab */}
      <mesh position={[0, 0, depth * 0.5]} receiveShadow>
        <boxGeometry args={[width, 0.08, depth]} />
        <meshStandardMaterial color="#424c44" roughness={0.6} />
      </mesh>
      {/* Front Glass Balustrade */}
      <mesh position={[0, 0.25, depth]}>
        <boxGeometry args={[width, 0.45, 0.04]} />
        <meshStandardMaterial color="#74b9ff" transparent opacity={0.45} roughness={0.1} metalness={0.7} />
      </mesh>
      {/* Side Glass Balustrades */}
      {[-width * 0.5, width * 0.5].map((sx, i) => (
        <mesh key={i} position={[sx, 0.25, depth * 0.5]}>
          <boxGeometry args={[0.04, 0.45, depth]} />
          <meshStandardMaterial color="#74b9ff" transparent opacity={0.45} roughness={0.1} metalness={0.7} />
        </mesh>
      ))}
      {/* Steel Handrail Cap */}
      <mesh position={[0, 0.48, depth]}>
        <boxGeometry args={[width + 0.04, 0.04, 0.06]} />
        <meshStandardMaterial color="#dcdad5" metalness={0.8} />
      </mesh>
    </group>
  );
}

// Rooftop HVAC Chiller Unit
export function RooftopHVAC({
  position = [0, 0, 0],
}: {
  position?: [number, number, number];
}) {
  const [x, y, z] = position;
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[0.7, 0.5, 0.9]} />
        <meshStandardMaterial color="#4d5951" roughness={0.6} />
      </mesh>
      {/* Fan Vent Grille */}
      <mesh position={[0, 0.51, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.26, 12]} />
        <meshStandardMaterial color="#2d3630" metalness={0.7} />
      </mesh>
    </group>
  );
}

// Rooftop Municipal Water Tank
export function RooftopWaterTank({
  position = [0, 0, 0],
}: {
  position?: [number, number, number];
}) {
  const [x, y, z] = position;
  return (
    <group position={[x, y, z]}>
      {/* Legs Staging */}
      {[-0.25, 0.25].map((lx, i) =>
        [-0.25, 0.25].map((lz, j) => (
          <mesh key={`${i}-${j}`} position={[lx, 0.2, lz]}>
            <cylinderGeometry args={[0.02, 0.02, 0.4, 6]} />
            <meshStandardMaterial color="#303831" metalness={0.8} />
          </mesh>
        ))
      )}
      {/* Cylindrical Wood/Steel Tank */}
      <mesh position={[0, 0.65, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.38, 0.65, 12]} />
        <meshStandardMaterial color="#8a6142" roughness={0.7} />
      </mesh>
      {/* Conical Roof Cap */}
      <mesh position={[0, 1.05, 0]}>
        <coneGeometry args={[0.42, 0.22, 12]} />
        <meshStandardMaterial color="#473221" />
      </mesh>
    </group>
  );
}

// Rooftop Angled Solar Collector Panel
export function RooftopSolarPanel({
  position = [0, 0, 0],
  rotationY = 0,
}: {
  position?: [number, number, number];
  rotationY?: number;
}) {
  const [x, y, z] = position;
  return (
    <group position={[x, y, z]} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 0.16, 6]} />
        <meshStandardMaterial color="#2d352e" />
      </mesh>
      <mesh position={[0, 0.22, 0]} rotation={[0.38, 0, 0]} castShadow>
        <boxGeometry args={[0.9, 0.04, 0.65]} />
        <meshStandardMaterial color="#1b3652" metalness={0.9} roughness={0.08} />
      </mesh>
    </group>
  );
}

// Rooftop Communication Antenna with Blinking Obstruction Beacon
export function AntennaMast({
  position = [0, 0, 0],
  height = 1.8,
}: {
  position?: [number, number, number];
  height?: number;
}) {
  const { isNight } = useDayNight();
  const [x, y, z] = position;

  return (
    <group position={[x, y, z]}>
      <mesh position={[0, height * 0.5, 0]}>
        <cylinderGeometry args={[0.025, 0.06, height, 6]} />
        <meshStandardMaterial color="#dcdad5" metalness={0.8} />
      </mesh>
      {/* Blinking Red Beacon at tip */}
      <mesh position={[0, height + 0.05, 0]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial
          color="#ff2222"
          emissive="#ff1111"
          emissiveIntensity={isNight ? 2.5 : 0.8}
        />
      </mesh>
    </group>
  );
}

// 3D Red Cross Medical Emblem
export function RedCrossEmblem({
  position = [0, 0, 0],
  scale = 1.0,
}: {
  position?: [number, number, number];
  scale?: number;
}) {
  const [x, y, z] = position;
  return (
    <group position={[x, y, z]} scale={scale}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.6, 0.18, 0.05]} />
        <meshBasicMaterial color="#e74c3c" />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.18, 0.6, 0.05]} />
        <meshBasicMaterial color="#e74c3c" />
      </mesh>
    </group>
  );
}

