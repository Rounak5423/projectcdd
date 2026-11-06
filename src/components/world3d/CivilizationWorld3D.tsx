import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGameState, MapLayer } from '../../context/GameStateContext';
import { PlacedBuilding } from '../../types/game';
import { soundFx } from '../../services/soundFx';

// ================= 3D ATMOSPHERE PRESETS =================
export type TimeOfDay = 'day' | 'sunset' | 'night';

interface LightingConfig {
  skyColor: string;
  fogColor: string;
  sunColor: string;
  sunIntensity: number;
  sunPosition: [number, number, number];
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
}

const lightingPresets: Record<TimeOfDay, LightingConfig> = {
  day: {
    skyColor: '#8da6b5',
    fogColor: '#8da6b5',
    sunColor: '#fff6e3',
    sunIntensity: 2.4,
    sunPosition: [45, 65, 35],
    hemiSky: '#bcd9eb',
    hemiGround: '#475a3e',
    hemiIntensity: 1.1,
  },
  sunset: {
    skyColor: '#b87550',
    fogColor: '#b87550',
    sunColor: '#f7aa63',
    sunIntensity: 2.8,
    sunPosition: [70, 25, 40],
    hemiSky: '#e39871',
    hemiGround: '#3d3024',
    hemiIntensity: 0.9,
  },
  night: {
    skyColor: '#121824',
    fogColor: '#121824',
    sunColor: '#7895b8',
    sunIntensity: 0.6,
    sunPosition: [-30, 45, -30],
    hemiSky: '#22304a',
    hemiGround: '#14181f',
    hemiIntensity: 0.5,
  },
};

// ================= ANIMATED CHIMNEY SMOKE PARTICLES =================
function ChimneySmokeParticles({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const puffs = useMemo(
    () => [
      { offset: 0, speed: 0.7, xDrift: 0.08 },
      { offset: 0.33, speed: 0.65, xDrift: -0.1 },
      { offset: 0.66, speed: 0.75, xDrift: 0.06 },
    ],
    []
  );

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.children.forEach((child, i) => {
      const p = puffs[i];
      const progress = (t * p.speed + p.offset) % 1;
      child.position.y = progress * 2.8;
      child.position.x = Math.sin(t * 1.5 + i) * 0.2 + progress * p.xDrift;
      const scale = 0.25 + progress * 0.75;
      child.scale.set(scale, scale, scale);
      const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.opacity = (1 - progress) * 0.45;
      }
    });
  });

  return (
    <group ref={groupRef} position={position}>
      {puffs.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.35, 6, 6]} />
          <meshStandardMaterial
            color="#d1d7db"
            transparent
            opacity={0.35}
            depthWrite={false}
            roughness={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

// ================= ANIMATED CARGO BARGE ON RIVER =================
function RiverCargoBoat() {
  const boatRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!boatRef.current) return;
    const t = clock.getElapsedTime() * 0.25;
    // Travel smoothly along river X axis (-45 to 45)
    const x = ((t * 12) % 90) - 45;
    const z = Math.sin(x * 0.05) * 10;
    const rotY = Math.atan2(Math.cos(x * 0.05) * 0.5, 1);

    boatRef.current.position.set(x, -0.28 + Math.sin(clock.getElapsedTime() * 2) * 0.04, z);
    boatRef.current.rotation.set(0, rotY + Math.PI / 2, Math.sin(clock.getElapsedTime() * 2.5) * 0.05);
  });

  return (
    <group ref={boatRef}>
      {/* Timber Hull */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.45, 3.8]} />
        <meshStandardMaterial color="#4d3525" roughness={0.7} />
      </mesh>
      {/* Wooden Cabin */}
      <mesh position={[0, 0.45, -1.1]} castShadow>
        <boxGeometry args={[1.2, 0.55, 1.2]} />
        <meshStandardMaterial color="#694d37" roughness={0.65} />
      </mesh>
      {/* Cargo Crates */}
      <mesh position={[0, 0.4, 0.6]} castShadow>
        <boxGeometry args={[1.1, 0.5, 1.6]} />
        <meshStandardMaterial color="#a88b5b" roughness={0.8} />
      </mesh>
      {/* Canvas Canopy */}
      <mesh position={[0, 0.7, 0.6]} castShadow>
        <coneGeometry args={[0.9, 0.3, 4]} />
        <meshStandardMaterial color="#ede4d1" roughness={0.6} />
      </mesh>
    </group>
  );
}

// ================= ANIMATED HORSE CART ON AVENUE =================
function AvenueHorseCart() {
  const cartRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!cartRef.current) return;
    const t = clock.getElapsedTime() * 0.35;
    // Move North-South along central avenue
    const z = ((t * 10) % 70) - 35;
    cartRef.current.position.set(1.4, 0.35, z);
  });

  return (
    <group ref={cartRef} rotation={[0, 0, 0]}>
      {/* Timber Wagon Bed */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.4, 1.8]} />
        <meshStandardMaterial color="#5e4531" roughness={0.8} />
      </mesh>
      {/* Four Spoked Wheels */}
      {[-0.6, 0.6].map((wx, i) =>
        [-0.6, 0.6].map((wz, j) => (
          <mesh key={`${i}-${j}`} position={[wx, -0.15, wz]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 0.1, 8]} />
            <meshStandardMaterial color="#2b2016" roughness={0.9} />
          </mesh>
        ))
      )}
      {/* Cargo Sack / Grain Bales */}
      <mesh position={[0, 0.35, -0.1]} castShadow>
        <boxGeometry args={[0.8, 0.45, 1.3]} />
        <meshStandardMaterial color="#d4b46a" roughness={0.7} />
      </mesh>
    </group>
  );
}

// ================= REALISTIC ARCHITECTURAL MODELS =================

// 1. Traditional Timber Windmill with Rotating Canvas Sails
function WindmillMesh({ position, isSelected }: { position: [number, number, number]; isSelected: boolean }) {
  const sailsRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (sailsRef.current) {
      sailsRef.current.rotation.z += delta * 1.2;
    }
  });

  return (
    <group position={position}>
      {/* Stone Base */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 1.8, 0.8, 8]} />
        <meshStandardMaterial color={isSelected ? '#dfb74a' : '#69645c'} roughness={0.8} />
      </mesh>
      {/* Octagonal Timber Tower */}
      <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.1, 1.5, 2.0, 8]} />
        <meshStandardMaterial color="#4d3b2c" roughness={0.7} />
      </mesh>
      {/* Conical Thatched Cap */}
      <mesh position={[0, 3.2, 0]} castShadow>
        <coneGeometry args={[1.25, 1.1, 8]} />
        <meshStandardMaterial color="#2d2620" roughness={0.9} />
      </mesh>
      {/* Rotating Sails Hub */}
      <group position={[0, 3.0, 0.9]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.4, 8]} />
          <meshStandardMaterial color="#2b2018" />
        </mesh>
        <group ref={sailsRef}>
          {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => (
            <group key={i} rotation={[0, 0, angle]}>
              <mesh position={[0, 1.3, 0]} castShadow>
                <boxGeometry args={[0.08, 2.4, 0.04]} />
                <meshStandardMaterial color="#36281e" />
              </mesh>
              <mesh position={[0.24, 1.3, 0.02]}>
                <planeGeometry args={[0.42, 2.1]} />
                <meshStandardMaterial color="#ded8c8" roughness={0.6} side={THREE.DoubleSide} />
              </mesh>
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}

// 2. Classical Stone Academy & Observatory (Copper Dome)
function ObservatoryMesh({ position, isSelected }: { position: [number, number, number]; isSelected: boolean }) {
  const domeRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (domeRef.current) {
      domeRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group position={position}>
      {/* Sandstone Foundation */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.7, 3.2]} />
        <meshStandardMaterial color={isSelected ? '#dfb74a' : '#8c8070'} roughness={0.8} />
      </mesh>
      {/* Main Classical University Hall */}
      <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 1.4, 2.8]} />
        <meshStandardMaterial color="#b3a592" roughness={0.7} />
      </mesh>
      {/* Corner Columns */}
      {[-1.2, 1.2].map((x, i) =>
        [-1.2, 1.2].map((z, j) => (
          <mesh key={`${i}-${j}`} position={[x, 1.4, z]} castShadow>
            <cylinderGeometry args={[0.14, 0.16, 1.4, 8]} />
            <meshStandardMaterial color="#d4c7b4" />
          </mesh>
        ))
      )}
      {/* Rotating Verdigris Copper Dome */}
      <group ref={domeRef} position={[0, 2.4, 0]}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[1.3, 1.3, 0.4, 16]} />
          <meshStandardMaterial color="#617a6a" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.8, 0]} castShadow>
          <sphereGeometry args={[1.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#4f7e6f" roughness={0.4} metalness={0.5} />
        </mesh>
        <mesh position={[0.4, 1.1, 0.4]} rotation={[0.6, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.2, 1.4, 10]} />
          <meshStandardMaterial color="#b89342" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

// 3. Realistic Terracotta Gabled Townhouse Row with Chimney Smoke
function TownhouseRowMesh({ position, isSelected }: { position: [number, number, number]; isSelected: boolean }) {
  return (
    <group position={position}>
      {/* Stone Foundation Base */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.6, 2.4]} />
        <meshStandardMaterial color={isSelected ? '#dfb74a' : '#635e57'} roughness={0.85} />
      </mesh>
      {/* House 1: Plaster & Timber Gable */}
      <group position={[-0.8, 1.2, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.4, 1.3, 2.2]} />
          <meshStandardMaterial color="#d9ccb6" roughness={0.7} />
        </mesh>
        <mesh position={[0, 1.0, 0]} castShadow>
          <coneGeometry args={[1.2, 0.9, 4]} />
          <meshStandardMaterial color="#9c4632" roughness={0.65} />
        </mesh>
        {/* Brick Chimney with Active Smoke */}
        <mesh position={[0.4, 1.3, 0.4]} castShadow>
          <boxGeometry args={[0.25, 0.7, 0.25]} />
          <meshStandardMaterial color="#6b3427" />
        </mesh>
        <ChimneySmokeParticles position={[0.4, 1.7, 0.4]} />
      </group>
      {/* House 2: Dark Slate Gable */}
      <group position={[0.8, 1.4, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.5, 1.6, 2.2]} />
          <meshStandardMaterial color="#bfb099" roughness={0.7} />
        </mesh>
        <mesh position={[0, 1.2, 0]} castShadow>
          <coneGeometry args={[1.3, 1.0, 4]} />
          <meshStandardMaterial color="#384047" roughness={0.6} />
        </mesh>
        <mesh position={[-0.4, 1.5, -0.4]} castShadow>
          <boxGeometry args={[0.25, 0.8, 0.25]} />
          <meshStandardMaterial color="#6b3427" />
        </mesh>
      </group>
    </group>
  );
}

// 4. Farmland Barn, Silo & Tilled Crop Field (Agriculture)
function FarmlandMesh({ position, isSelected }: { position: [number, number, number]; isSelected: boolean }) {
  return (
    <group position={position}>
      {/* Tilled Earth Base */}
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <boxGeometry args={[4.2, 0.16, 3.6]} />
        <meshStandardMaterial color={isSelected ? '#dfb74a' : '#524332'} roughness={0.9} />
      </mesh>
      {/* Golden Wheat Strips */}
      {[-1.2, -0.8, -0.4, 0, 0.4].map((z, idx) => (
        <mesh key={idx} position={[-0.6, 0.22, z]}>
          <boxGeometry args={[2.2, 0.15, 0.25]} />
          <meshStandardMaterial color="#cfa84a" roughness={0.8} />
        </mesh>
      ))}
      {/* Wooden Barn with Gambrel Roof */}
      <group position={[1.1, 0.8, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.4, 1.1, 2.0]} />
          <meshStandardMaterial color="#7a3e30" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.8, 0]} castShadow>
          <coneGeometry args={[1.1, 0.7, 4]} />
          <meshStandardMaterial color="#423429" roughness={0.7} />
        </mesh>
      </group>
      {/* Stone Grain Silo */}
      <mesh position={[1.3, 1.2, 1.2]} castShadow>
        <cylinderGeometry args={[0.4, 0.45, 1.8, 10]} />
        <meshStandardMaterial color="#787369" roughness={0.8} />
      </mesh>
      <mesh position={[1.3, 2.2, 1.2]} castShadow>
        <coneGeometry args={[0.45, 0.5, 10]} />
        <meshStandardMaterial color="#4d463e" />
      </mesh>
    </group>
  );
}

// 5. Red-Brick Factory, Smokestacks with Smoke & Waterwheel (Industrial)
function IndustrialFactoryMesh({ position, isSelected }: { position: [number, number, number]; isSelected: boolean }) {
  const wheelRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (wheelRef.current) {
      wheelRef.current.rotation.x += delta * 1.5;
    }
  });

  return (
    <group position={position}>
      {/* Cobblestone Factory Yard */}
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <boxGeometry args={[3.8, 0.3, 3.0]} />
        <meshStandardMaterial color={isSelected ? '#dfb74a' : '#4a4642'} roughness={0.9} />
      </mesh>
      {/* Red Brick Main Warehouse */}
      <mesh position={[-0.4, 1.0, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 1.5, 2.2]} />
        <meshStandardMaterial color="#823c2d" roughness={0.75} />
      </mesh>
      {/* Industrial Pitched Roof */}
      <mesh position={[-0.4, 2.0, 0]} castShadow>
        <coneGeometry args={[1.8, 0.8, 4]} />
        <meshStandardMaterial color="#353b40" roughness={0.6} />
      </mesh>
      {/* Tall Brick Smokestack 1 + Smoke */}
      <mesh position={[1.1, 1.8, 0.6]} castShadow>
        <cylinderGeometry args={[0.22, 0.35, 2.8, 8]} />
        <meshStandardMaterial color="#5c2c22" roughness={0.7} />
      </mesh>
      <ChimneySmokeParticles position={[1.1, 3.3, 0.6]} />

      {/* Tall Brick Smokestack 2 */}
      <mesh position={[1.1, 1.6, -0.6]} castShadow>
        <cylinderGeometry args={[0.22, 0.35, 2.4, 8]} />
        <meshStandardMaterial color="#5c2c22" roughness={0.7} />
      </mesh>
      <ChimneySmokeParticles position={[1.1, 2.9, -0.6]} />

      {/* Timber Waterwheel on side */}
      <mesh ref={wheelRef} position={[-1.7, 0.8, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.7, 0.7, 0.3, 12]} />
        <meshStandardMaterial color="#423122" roughness={0.8} />
      </mesh>
    </group>
  );
}

// 6. Grand Stone Citadel & Town Hall (Government)
function GrandCitadelMesh({ position, isSelected }: { position: [number, number, number]; isSelected: boolean }) {
  return (
    <group position={position}>
      {/* Grand Stone Terrace */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.2, 0.8, 3.8]} />
        <meshStandardMaterial color={isSelected ? '#dfb74a' : '#69645d'} roughness={0.8} />
      </mesh>
      {/* Palatial Main Hall */}
      <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 1.8, 2.6]} />
        <meshStandardMaterial color="#a19787" roughness={0.7} />
      </mesh>
      {/* Slate Mansard Roof */}
      <mesh position={[0, 2.8, 0]} castShadow>
        <coneGeometry args={[2.2, 1.1, 4]} />
        <meshStandardMaterial color="#2d353b" roughness={0.6} />
      </mesh>
      {/* Central Stone Clock Spire */}
      <mesh position={[0, 3.6, 0.2]} castShadow>
        <boxGeometry args={[0.9, 1.8, 0.9]} />
        <meshStandardMaterial color="#8a7e6f" />
      </mesh>
      {/* Golden Spire Point */}
      <mesh position={[0, 4.8, 0.2]} castShadow>
        <coneGeometry args={[0.5, 1.4, 8]} />
        <meshStandardMaterial color="#c29b38" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Corner Turrets */}
      {[-1.5, 1.5].map((x, i) =>
        [-1.2, 1.2].map((z, j) => (
          <group key={`${i}-${j}`} position={[x, 2.0, z]}>
            <cylinderGeometry args={[0.3, 0.3, 1.6, 8]} />
            <meshStandardMaterial color="#7d7365" />
            <mesh position={[0, 1.1, 0]} castShadow>
              <coneGeometry args={[0.4, 0.7, 8]} />
              <meshStandardMaterial color="#2d353b" />
            </mesh>
          </group>
        ))
      )}
    </group>
  );
}

// 7. Photovoltaic Solar Concentrator
function ModernSolarMesh({ position, isSelected }: { position: [number, number, number]; isSelected: boolean }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <boxGeometry args={[3.0, 0.2, 2.4]} />
        <meshStandardMaterial color={isSelected ? '#dfb74a' : '#384039'} />
      </mesh>
      {[-0.8, 0, 0.8].map((x, i) =>
        [-0.6, 0.6].map((z, j) => (
          <mesh key={`${i}-${j}`} position={[x, 0.5, z]} rotation={[0.45, 0, 0]} castShadow>
            <boxGeometry args={[0.7, 0.05, 0.7]} />
            <meshStandardMaterial color="#1a354d" metalness={0.9} roughness={0.15} />
          </mesh>
        ))
      )}
    </group>
  );
}

// 8. Modern Wind Turbine
function ModernTurbineMesh({ position, isSelected }: { position: [number, number, number]; isSelected: boolean }) {
  const rotorRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (rotorRef.current) {
      rotorRef.current.rotation.z += delta * 2.2;
    }
  });

  return (
    <group position={position}>
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.22, 3.6, 8]} />
        <meshStandardMaterial color={isSelected ? '#dfb74a' : '#d1d8dc'} roughness={0.4} />
      </mesh>
      <mesh position={[0, 3.6, 0]} castShadow>
        <boxGeometry args={[0.3, 0.25, 0.6]} />
        <meshStandardMaterial color="#85939a" />
      </mesh>
      <group ref={rotorRef} position={[0, 3.6, 0.33]}>
        <mesh>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color="#a6852e" />
        </mesh>
        {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((angle, i) => (
          <group key={i} rotation={[0, 0, angle]}>
            <mesh position={[0, 1.0, 0]}>
              <boxGeometry args={[0.07, 2.0, 0.02]} />
              <meshStandardMaterial color="#f0f3f5" roughness={0.3} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

// ================= ANIMATED 3D PROTESTING CROWD =================
function ProtestingCrowd3D({
  onInspectProtest,
}: {
  onInspectProtest?: () => void;
}) {
  const { activeProtest, setIsProtestModalOpen } = useGameState();
  const crowdRef = useRef<THREE.Group>(null);
  const [sloganIndex, setSloganIndex] = useState(0);

  // Cycle slogans periodically
  useMemo(() => {
    if (!activeProtest) return;
    const interval = setInterval(() => {
      setSloganIndex((idx) => (idx + 1) % activeProtest.slogans.length);
    }, 3800);
    return () => clearInterval(interval);
  }, [activeProtest]);

  useFrame(({ clock }) => {
    if (!crowdRef.current) return;
    const t = clock.getElapsedTime();
    crowdRef.current.children.forEach((child, i) => {
      child.position.y = 0.35 + Math.abs(Math.sin(t * 5 + i * 0.8)) * 0.28;
      child.rotation.y = Math.sin(t * 2 + i) * 0.25;
    });
  });

  if (!activeProtest) return null;

  const demonstrators = [
    { x: -3.5, z: 2.2, color: '#9c3828' },
    { x: -2.2, z: 1.5, color: '#386478' },
    { x: -4.2, z: 1.0, color: '#7a5a30' },
    { x: -1.8, z: 3.2, color: '#4a6b42' },
    { x: -3.0, z: 3.8, color: '#823868' },
    { x: -5.0, z: 2.5, color: '#916b32' },
    { x: -2.5, z: 4.5, color: '#3b5442' },
    { x: -4.5, z: 4.2, color: '#684532' },
  ];

  const handleClick = (e: any) => {
    e.stopPropagation();
    soundFx.playCrowdChant();
    if (onInspectProtest) {
      onInspectProtest();
    } else {
      setIsProtestModalOpen(true);
    }
  };

  return (
    <group position={[0, 0, 0]}>
      {/* Demonstrators group */}
      <group ref={crowdRef} onClick={handleClick}>
        {demonstrators.map((d, i) => (
          <group key={i} position={[d.x, 0.4, d.z]}>
            {/* Person Torso */}
            <mesh position={[0, 0.5, 0]} castShadow>
              <boxGeometry args={[0.35, 0.55, 0.25]} />
              <meshStandardMaterial color={d.color} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 0.95, 0]} castShadow>
              <sphereGeometry args={[0.18, 8, 8]} />
              <meshStandardMaterial color="#d4b292" />
            </mesh>
            {/* Wooden Picket Sign Pole */}
            <mesh position={[0.2, 1.2, 0.1]} castShadow>
              <cylinderGeometry args={[0.03, 0.03, 1.3, 6]} />
              <meshStandardMaterial color="#4a3726" />
            </mesh>
            {/* Placard Board */}
            <mesh position={[0.2, 1.8, 0.1]} castShadow>
              <boxGeometry args={[0.75, 0.45, 0.04]} />
              <meshStandardMaterial color="#ebe2d1" />
            </mesh>
          </group>
        ))}
      </group>

      {/* Floating 3D Protest Slogan Speech Bubble */}
      <Html position={[-3.2, 4.0, 2.5]} center distanceFactor={28}>
        <div
          onClick={handleClick}
          className="cursor-pointer group select-none animate-bounce"
        >
          <div className="px-3 py-1.5 rounded-lg bg-[#241c14] border-2 border-[#dfb74a] text-[#f5ebd2] shadow-2xl flex items-center gap-2 whitespace-nowrap hover:scale-105 transition-transform">
            <span className="text-base animate-pulse">📢</span>
            <div>
              <span className="text-[9px] font-sans font-bold text-[#dfb74a] uppercase tracking-wider block">
                CIVIL UNREST · {activeProtest.faction}
              </span>
              <p className="text-xs font-serif font-bold text-white tracking-wide">
                "{activeProtest.slogans[sloganIndex]}"
              </p>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#8f7742] text-[#14181b] font-bold uppercase ml-1">
              Resolve
            </span>
          </div>
        </div>
      </Html>
    </group>
  );
}

// ================= COBBLESTONE ROADS & STONE BRIDGES =================
function RoadNetwork() {
  return (
    <group>
      {/* Main Cobblestone Avenue North-South */}
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4.2, 85]} />
        <meshStandardMaterial color="#403c37" roughness={0.88} />
      </mesh>
      {/* East-West Avenues */}
      {[-18, 0, 20].map((z, idx) => (
        <mesh key={idx} position={[0, 0.06, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[80, 3.6]} />
          <meshStandardMaterial color="#403c37" roughness={0.88} />
        </mesh>
      ))}
      {/* Secondary Roads */}
      {[22, -22].map((x, idx) => (
        <mesh key={`sec-${idx}`} position={[x, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[3.2, 70]} />
          <meshStandardMaterial color="#47433e" roughness={0.9} />
        </mesh>
      ))}

      {/* Stone Arched Bridges across River */}
      {[-16, 14].map((bx, i) => (
        <group key={`bridge-${i}`} position={[bx, 0.45, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[4.4, 0.35, 14.5]} />
            <meshStandardMaterial color="#575149" roughness={0.8} />
          </mesh>
          <mesh position={[-2.1, 0.45, 0]} castShadow>
            <boxGeometry args={[0.25, 0.55, 14.5]} />
            <meshStandardMaterial color="#423d37" />
          </mesh>
          <mesh position={[2.1, 0.45, 0]} castShadow>
            <boxGeometry args={[0.25, 0.55, 14.5]} />
            <meshStandardMaterial color="#423d37" />
          </mesh>
          <mesh position={[0, -0.6, 0]} castShadow receiveShadow>
            <boxGeometry args={[3.8, 1.2, 3.0]} />
            <meshStandardMaterial color="#36322d" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Animated Horse Cart moving on Avenue */}
      <AvenueHorseCart />
    </group>
  );
}

// ================= REALISTIC NATURAL TERRAIN & RIVER =================
function WorldTerrain({ activeLayer }: { activeLayer: MapLayer }) {
  const terrainGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(120, 120, 56, 56);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);

      // Sinuous river channel curving through landscape
      const riverCenter = Math.sin(vx * 0.05) * 10;
      const distFromRiver = Math.abs(vy - riverCenter);

      let height = 0;
      if (distFromRiver < 6.5) {
        // Deep river bed
        height = -1.4 + (distFromRiver / 6.5) * 0.9;
      } else {
        // Natural rolling hills and slopes
        const hill1 = Math.sin(vx * 0.07) * Math.cos(vy * 0.07) * 2.2;
        const hill2 = Math.cos(vx * 0.035 + 1.2) * Math.sin(vy * 0.035) * 3.8;
        height = Math.max(0.12, hill1 + hill2);
      }
      pos.setZ(i, height);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <group>
      {/* Natural Grassy Ground Surface */}
      <mesh geometry={terrainGeo} rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <meshStandardMaterial
          color={activeLayer === 'environment' ? '#3c5c32' : '#456139'}
          roughness={0.88}
          metalness={0.08}
          flatShading
        />
      </mesh>

      {/* Realistic Flowing River Water */}
      <mesh position={[0, -0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[120, 24]} />
        <meshStandardMaterial
          color="#356875"
          roughness={0.12}
          metalness={0.7}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* River Cargo Boat Navigating River */}
      <RiverCargoBoat />

      {/* River Shore Sand & Gravel Banks */}
      <mesh position={[0, -0.15, -6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[120, 2.5]} />
        <meshStandardMaterial color="#7a6c56" roughness={0.92} />
      </mesh>
      <mesh position={[0, -0.15, 6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[120, 2.5]} />
        <meshStandardMaterial color="#7a6c56" roughness={0.92} />
      </mesh>

      {/* Cobblestone Roads, Bridges & Cart */}
      <RoadNetwork />

      {/* Natural Pine & Deciduous Forests */}
      {useMemo(() => {
        const forestTrees = [
          [-45, 34], [-40, 38], [-48, 28], [-44, 42], [-36, 46],
          [42, 32], [46, 36], [38, 28], [44, 24], [48, 18],
          [-16, -42], [-22, -38], [-12, -46], [-28, -34],
          [28, -38], [34, -42], [22, -45], [38, -32],
        ];

        return forestTrees.map(([tx, tz], i) => (
          <group key={`tree-${i}`} position={[tx, 0.9, tz]}>
            <mesh position={[0, 0.45, 0]} castShadow>
              <cylinderGeometry args={[0.1, 0.18, 0.9, 6]} />
              <meshStandardMaterial color="#3b2b1d" />
            </mesh>
            <mesh position={[0, 1.3, 0]} castShadow>
              <coneGeometry args={[1.0, 1.4, 7]} />
              <meshStandardMaterial color="#244225" roughness={0.85} />
            </mesh>
            <mesh position={[0, 2.1, 0]} castShadow>
              <coneGeometry args={[0.7, 1.2, 7]} />
              <meshStandardMaterial color="#2f5431" roughness={0.85} />
            </mesh>
          </group>
        ));
      }, [])}

      {/* River Docks & Timber Pier */}
      <group position={[-6, 0.2, 5.5]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.25, 4.8]} />
          <meshStandardMaterial color="#473628" roughness={0.8} />
        </mesh>
        {[-1.3, 1.3].map((px, i) =>
          [-2.0, 0, 2.0].map((pz, j) => (
            <mesh key={`${i}-${j}`} position={[px, -0.6, pz]}>
              <cylinderGeometry args={[0.08, 0.1, 1.4, 6]} />
              <meshStandardMaterial color="#2d2218" />
            </mesh>
          ))
        )}
      </group>
    </group>
  );
}

// ================= FLOATING 3D DISTRICT BANNERS (Civ VI Style) =================
function FloatingDistrictBanners({ onSelectDistrict }: { onSelectDistrict?: (id: string) => void }) {
  const { districts } = useGameState();

  return (
    <group>
      {districts.map((d) => (
        <Html key={d.id} position={[d.x, 8.5, d.z]} center distanceFactor={42}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              soundFx.playClick();
              if (onSelectDistrict) onSelectDistrict(d.id);
            }}
            className="cursor-pointer group select-none transition-transform hover:scale-110"
          >
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#141a1e]/94 border-2 border-[#8f7742] text-[#ede8dc] shadow-2xl backdrop-blur-md">
              {/* Population Shield */}
              <div className="w-5 h-5 rounded-full border border-[#dfb74a] bg-[#0c1012] flex items-center justify-center font-mono font-bold text-[10px] text-[#dfb74a]">
                {Math.round(d.population / 10000)}
              </div>
              {/* District Name */}
              <span className="text-xs font-serif font-bold tracking-wide truncate max-w-[130px] group-hover:text-[#dfb74a] transition-colors">
                {d.name.split(' ')[0]}
              </span>
              <span className="text-[9px] font-mono text-[#7ea376] font-bold">
                {d.loyalty || 98}%
              </span>
            </div>
          </div>
        </Html>
      ))}
    </group>
  );
}

// ================= BUILDING WRAPPER =================
function BuildingObject({
  building,
  isSelected,
  onSelect,
  activeLayer,
}: {
  building: PlacedBuilding;
  isSelected: boolean;
  onSelect: () => void;
  activeLayer: MapLayer;
}) {
  const [hovered, setHovered] = useState(false);

  const isDimmed = useMemo(() => {
    if (activeLayer === 'all') return false;
    if (activeLayer === 'infrastructure' && ['energy', 'industrial'].includes(building.category)) return false;
    if (activeLayer === 'population' && ['residential', 'healthcare', 'education'].includes(building.category)) return false;
    if (activeLayer === 'resources' && ['agriculture', 'industrial', 'energy'].includes(building.category)) return false;
    if (activeLayer === 'environment' && ['agriculture', 'energy'].includes(building.category)) return false;
    if (activeLayer === 'economy' && ['commercial', 'industrial', 'government'].includes(building.category)) return false;
    return true;
  }, [activeLayer, building.category]);

  const pos: [number, number, number] = [building.x, building.y, building.z];

  const renderRealisticMesh = () => {
    switch (building.modelType) {
      case 'turbine':
        return <ModernTurbineMesh position={pos} isSelected={isSelected} />;
      case 'observatory':
      case 'academy':
        return <ObservatoryMesh position={pos} isSelected={isSelected} />;
      case 'windmill':
        return <WindmillMesh position={pos} isSelected={isSelected} />;
      case 'tower':
      case 'hospital':
        return <TownhouseRowMesh position={pos} isSelected={isSelected} />;
      case 'hydroponic':
      case 'dome':
        return <FarmlandMesh position={pos} isSelected={isSelected} />;
      case 'factory':
        return <IndustrialFactoryMesh position={pos} isSelected={isSelected} />;
      case 'solar':
        return <ModernSolarMesh position={pos} isSelected={isSelected} />;
      case 'citadel':
        return <GrandCitadelMesh position={pos} isSelected={isSelected} />;
      default:
        if (building.category === 'agriculture') {
          return <WindmillMesh position={pos} isSelected={isSelected} />;
        }
        return <TownhouseRowMesh position={pos} isSelected={isSelected} />;
    }
  };

  return (
    <group
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        soundFx.playClick();
        onSelect();
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <group scale={isDimmed ? 0.75 : hovered ? 1.05 : 1.0}>
        {renderRealisticMesh()}
      </group>

      {/* Subtle Selection Ring */}
      {isSelected && (
        <mesh position={[building.x, 0.08, building.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.2, 2.6, 32]} />
          <meshBasicMaterial color="#dfb74a" side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Hover Tooltip */}
      {(hovered || isSelected) && (
        <Html position={[building.x, building.y + 4.2, building.z]} center distanceFactor={30}>
          <div className="pointer-events-none px-2.5 py-1 rounded bg-[#161c1f]/95 border border-[#8f7742] text-xs font-semibold text-[#ede8dc] whitespace-nowrap shadow-xl flex items-center gap-1.5 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-[#7ea376]" />
            <span>{building.name}</span>
            <span className="text-[10px] text-[#dfb74a] font-mono">L{building.level}</span>
          </div>
        </Html>
      )}
    </group>
  );
}

// ================= CONSTRUCTION PLACEMENT CURSOR =================
function ConstructionPlacementPlane() {
  const { isConstructionMode, selectedCatalogItem, placeBuilding } = useGameState();
  const [ghostPos, setGhostPos] = useState<[number, number, number] | null>(null);

  if (!isConstructionMode || !selectedCatalogItem) return null;

  return (
    <group>
      <mesh
        position={[0, 0.2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={(e) => {
          e.stopPropagation();
          setGhostPos([e.point.x, 0.4, e.point.z]);
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (ghostPos) {
            soundFx.playHammerBuild();
            placeBuilding(selectedCatalogItem.id, ghostPos[0], ghostPos[2]);
          }
        }}
      >
        <planeGeometry args={[120, 120]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {ghostPos && (
        <group position={ghostPos}>
          <mesh position={[0, 0.6, 0]}>
            <boxGeometry args={[2.8, 1.2, 2.8]} />
            <meshBasicMaterial color="#7ea376" transparent opacity={0.4} wireframe />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.8, 2.2, 32]} />
            <meshBasicMaterial color="#dfb74a" side={THREE.DoubleSide} />
          </mesh>
          <Html position={[0, 2.5, 0]} center>
            <div className="pointer-events-none px-2.5 py-1 bg-[#14181b]/95 border border-[#dfb74a] text-xs font-bold text-[#ede8dc] rounded shadow-md whitespace-nowrap">
              Click ground to construct {selectedCatalogItem.name}
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}

// ================= 3D PARTICLE FIREWORKS SPECTACLE =================
function FireworksShow3D({ active }: { active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  // 4 distinct firework burst clusters with staggered delays and colors
  const clusters = useMemo(
    () => [
      { origin: [0, 14, 0] as [number, number, number], color: '#dfb74a', delay: 0 },
      { origin: [-10, 18, -6] as [number, number, number], color: '#d95338', delay: 1.1 },
      { origin: [10, 16, 8] as [number, number, number], color: '#4da6ff', delay: 2.0 },
      { origin: [3, 20, -10] as [number, number, number], color: '#57c776', delay: 2.9 },
    ],
    []
  );

  const particlesPerCluster = 22;

  const particleDirs = useMemo(() => {
    return Array.from({ length: 4 * particlesPerCluster }, (_, i) => {
      const theta = (i % particlesPerCluster) * ((Math.PI * 2) / particlesPerCluster);
      const elevation = (((i * 7) % 11) - 5) / 5; // -1 to 1
      const speed = 4.2 + (i % 4) * 0.9;
      return {
        vx: Math.cos(theta) * Math.cos(elevation) * speed,
        vy: Math.sin(elevation) * speed + 3.0,
        vz: Math.sin(theta) * Math.cos(elevation) * speed,
      };
    });
  }, [particlesPerCluster]);

  useFrame(({ clock }) => {
    if (!groupRef.current || !active) return;
    const t = clock.getElapsedTime();

    clusters.forEach((cluster, cIdx) => {
      const cycleTime = (t + cluster.delay) % 3.6;
      const clusterGroup = groupRef.current!.children[cIdx] as THREE.Group;
      if (!clusterGroup) return;

      clusterGroup.children.forEach((pMesh, pIdx) => {
        const dir = particleDirs[cIdx * particlesPerCluster + pIdx];
        if (!dir) return;

        if (cycleTime < 0.22) {
          // Launch phase
          pMesh.position.set(0, cycleTime * 20, 0);
          pMesh.scale.set(0.12, 0.12, 0.12);
        } else {
          // Burst explosion phase
          const expTime = cycleTime - 0.22;
          pMesh.position.set(
            dir.vx * expTime * 0.75,
            dir.vy * expTime * 0.75 - 0.5 * 9.8 * expTime * expTime * 0.1,
            dir.vz * expTime * 0.75
          );
          const fade = Math.max(0, 1 - expTime / 2.6);
          pMesh.scale.set(fade * 0.32, fade * 0.32, fade * 0.32);
          const mat = (pMesh as THREE.Mesh).material as THREE.MeshBasicMaterial;
          if (mat) mat.opacity = fade * 0.9;
        }
      });
    });
  });

  if (!active) return null;

  return (
    <group ref={groupRef}>
      {clusters.map((cluster, cIdx) => (
        <group key={cIdx} position={cluster.origin}>
          {Array.from({ length: particlesPerCluster }).map((_, pIdx) => (
            <mesh key={pIdx}>
              <sphereGeometry args={[0.22, 6, 6]} />
              <meshBasicMaterial color={cluster.color} transparent opacity={0.9} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// ================= MAIN 3D CIVILIZATION CANVAS =================
export default function CivilizationWorld3D({
  onSelectDistrict,
  timeOfDay = 'day',
  isCinematicTour = false,
  showFireworks = false,
}: {
  onSelectDistrict?: (id: string) => void;
  timeOfDay?: TimeOfDay;
  isCinematicTour?: boolean;
  showFireworks?: boolean;
}) {
  const { placedBuildings, selectedBuildingId, selectBuilding, activeLayer } = useGameState();
  const config = lightingPresets[timeOfDay] || lightingPresets.day;

  return (
    <div className="w-full h-full relative bg-[#1a2328] select-none">
      <Canvas
        camera={{ position: [36, 32, 44], fov: 42 }}
        shadows
        gl={{ antialias: true, alpha: false }}
      >
        {/* Dynamic Sky and Fog based on Time of Day */}
        <color attach="background" args={[config.skyColor]} />
        <fog attach="fog" args={[config.fogColor, 65, 145]} />

        {/* Ambient & Directional Sun Lighting */}
        <hemisphereLight
          args={[config.hemiSky, config.hemiGround, config.hemiIntensity]}
        />
        <directionalLight
          position={config.sunPosition}
          intensity={config.sunIntensity}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={10}
          shadow-camera-far={160}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          color={config.sunColor}
        />
        <directionalLight position={[-40, 25, -30]} intensity={0.4} color="#8fae98" />

        {/* Natural Ground, River, Roads, Forest & Vehicles */}
        <WorldTerrain activeLayer={activeLayer} />

        {/* Animated 3D Historical Twin Protesting Crowd */}
        <ProtestingCrowd3D />

        {/* 3D Particle Fireworks Spectacle for Celebrations & Demonstrations */}
        <FireworksShow3D active={showFireworks} />

        {/* Floating 3D Civ District Banners */}
        <FloatingDistrictBanners onSelectDistrict={onSelectDistrict} />

        {/* Realistic Buildings with Chimney Smoke & Rotations */}
        {placedBuildings.map((building) => (
          <BuildingObject
            key={building.id}
            building={building}
            isSelected={selectedBuildingId === building.id}
            onSelect={() => selectBuilding(building.id)}
            activeLayer={activeLayer}
          />
        ))}

        {/* Interactive Construction Placement Plane */}
        <ConstructionPlacementPlane />

        {/* Smooth Orbit Controls with Optional Cinematic Auto-Rotation */}
        <OrbitControls
          maxPolarAngle={Math.PI / 2.15}
          minDistance={14}
          maxDistance={95}
          dampingFactor={0.06}
          enableDamping
          autoRotate={isCinematicTour}
          autoRotateSpeed={0.8}
        />
      </Canvas>
    </div>
  );
}
