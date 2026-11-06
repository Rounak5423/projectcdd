import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useDayNight } from './DayNightController';

interface ModelBaseProps {
  isSelected: boolean;
  level: number;
}

// 1. Wind Turbine (Animated Rotating Blades)
export function WindTurbineModel({ isSelected, level }: ModelBaseProps) {
  const { isNight } = useDayNight();
  const rotorRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (rotorRef.current) {
      rotorRef.current.rotation.z += delta * (2.0 + level * 0.4);
    }
  });

  return (
    <group>
      {/* Foundation Platform */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.2, 1.4, 0.4, 8]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#424d45'} roughness={0.7} />
      </mesh>
      {/* Tower Mast */}
      <mesh position={[0, 2.2 + level * 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.28, 4.0 + level * 0.6, 8]} />
        <meshStandardMaterial color={isSelected ? '#c6a76a' : '#d8ded3'} roughness={0.4} />
      </mesh>
      {/* Generator Nacelle */}
      <mesh position={[0, 4.2 + level * 0.6, 0]} castShadow>
        <boxGeometry args={[0.38, 0.32, 0.85]} />
        <meshStandardMaterial color="#6e7d69" roughness={0.5} />
      </mesh>
      {/* Red Obstruction Beacon */}
      <mesh position={[0, 4.45 + level * 0.6, -0.3]}>
        <sphereGeometry args={[0.07, 6, 6]} />
        <meshStandardMaterial
          color="#ff2222"
          emissive="#ff1111"
          emissiveIntensity={isNight ? 2.5 : 0.8}
        />
      </mesh>
      {/* Rotating Rotor & Blades */}
      <group ref={rotorRef} position={[0, 4.2 + level * 0.6, 0.45]}>
        <mesh>
          <sphereGeometry args={[0.16, 8, 8]} />
          <meshStandardMaterial color="#c6a76a" />
        </mesh>
        {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((angle, i) => (
          <group key={i} rotation={[0, 0, angle]}>
            <mesh position={[0, 1.3 + level * 0.15, 0]} castShadow>
              <boxGeometry args={[0.1, 2.4 + level * 0.3, 0.02]} />
              <meshStandardMaterial color="#ffffff" roughness={0.3} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

// 2. Quantum Observatory (Rotating Telescope & Quantum Rings)
export function ObservatoryModel({ isSelected, level }: ModelBaseProps) {
  const { isNight } = useDayNight();
  const ringRef1 = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);
  const domeRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (ringRef1.current) ringRef1.current.rotation.x += delta * 0.9;
    if (ringRef2.current) ringRef2.current.rotation.y += delta * 1.3;
    if (domeRef.current) domeRef.current.rotation.y += delta * 0.15;
  });

  return (
    <group>
      {/* Stepped Base Foundation */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.2, 2.6, 0.8, 12]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#2b362c'} roughness={0.6} />
      </mesh>
      {/* Mid Gallery */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[1.8, 2.0, 0.8, 12]} />
        <meshStandardMaterial color="#364538" roughness={0.5} />
      </mesh>
      {/* Rotating Telescope Dome */}
      <group ref={domeRef} position={[0, 1.6, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[1.5, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#6a8292" metalness={0.7} roughness={0.2} />
        </mesh>
        {/* Slotted Telescope Barrel */}
        <mesh position={[0.45, 0.6, 0.45]} rotation={[0.65, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.36, 1.6, 12]} />
          <meshStandardMaterial color="#1a241b" roughness={0.3} />
        </mesh>
      </group>
      {/* Quantum Levitating Energy Rings */}
      <mesh ref={ringRef1} position={[0, 2.7, 0]}>
        <torusGeometry args={[2.0 + level * 0.15, 0.05, 8, 32]} />
        <meshStandardMaterial
          color="#a6bd82"
          emissive="#a6bd82"
          emissiveIntensity={isNight ? 1.4 : 0.8}
        />
      </mesh>
      <mesh ref={ringRef2} position={[0, 2.7, 0]}>
        <torusGeometry args={[1.6, 0.04, 8, 32]} />
        <meshStandardMaterial
          color="#64d8cb"
          emissive="#64d8cb"
          emissiveIntensity={isNight ? 1.6 : 0.9}
        />
      </mesh>
    </group>
  );
}

// 3. Arcology Spire (High-Density Residential Skyscraper)
export function ArcologySpireModel({ isSelected, level }: ModelBaseProps) {
  const { isNight } = useDayNight();
  const heightBoost = (level - 1) * 0.9;

  return (
    <group>
      {/* Base Podium & Entrance Lobby */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 1.2, 3.2]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#273128'} roughness={0.6} />
      </mesh>
      {/* Lower Residential Body */}
      <mesh position={[0, 1.9 + heightBoost * 0.3, 0]} castShadow>
        <boxGeometry args={[2.4, 1.8 + heightBoost * 0.6, 2.4]} />
        <meshStandardMaterial color="#354437" roughness={0.4} />
      </mesh>
      {/* Mid Sky-Garden Balcony */}
      <mesh position={[0, 3.0 + heightBoost * 0.6, 0]}>
        <boxGeometry args={[2.7, 0.25, 2.7]} />
        <meshStandardMaterial color="#4a6346" roughness={0.5} />
      </mesh>
      {/* Upper Spire */}
      <mesh position={[0, 4.4 + heightBoost * 0.9, 0]} castShadow>
        <boxGeometry args={[1.5, 2.4 + heightBoost * 0.6, 1.5]} />
        <meshStandardMaterial color="#4b5d4e" roughness={0.3} />
      </mesh>
      {/* Rooftop Crown & Antenna Mast */}
      <mesh position={[0, 6.0 + heightBoost * 1.2, 0]}>
        <coneGeometry args={[0.7, 1.4, 4]} />
        <meshStandardMaterial color="#c6a76a" metalness={0.7} />
      </mesh>
      <mesh position={[0, 7.0 + heightBoost * 1.2, 0]}>
        <cylinderGeometry args={[0.03, 0.05, 1.2, 6]} />
        <meshStandardMaterial
          color="#c6a76a"
          emissive={isNight ? '#e6be75' : '#000000'}
          emissiveIntensity={isNight ? 1.5 : 0}
        />
      </mesh>
      {/* Illuminated Windows (Strip arrays on 4 facades) */}
      {[-1.22, 1.22].map((wx, i) => (
        <mesh key={`win-x-${i}`} position={[wx, 2.0 + heightBoost * 0.4, 0]}>
          <planeGeometry args={[0.05, 2.2 + heightBoost * 0.6]} />
          <meshBasicMaterial
            color={isNight ? '#ffe08a' : '#cce4b0'}
            transparent
            opacity={isNight ? 0.95 : 0.6}
          />
        </mesh>
      ))}
      {[-1.22, 1.22].map((wz, i) => (
        <mesh key={`win-z-${i}`} position={[0, 2.0 + heightBoost * 0.4, wz]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.05, 2.2 + heightBoost * 0.6]} />
          <meshBasicMaterial
            color={isNight ? '#ffe08a' : '#cce4b0'}
            transparent
            opacity={isNight ? 0.95 : 0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

// 4. Modular Habitat Block (Residential Pods)
export function ModularHabitatModel({ isSelected, level }: ModelBaseProps) {
  const { isNight } = useDayNight();

  return (
    <group>
      {/* Ground Foundation */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.5, 2.8]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#323c34'} roughness={0.7} />
      </mesh>
      {/* Pod Unit 1 */}
      <mesh position={[-0.7, 0.9, -0.4]} castShadow>
        <boxGeometry args={[1.4, 0.9, 1.6]} />
        <meshStandardMaterial color="#445547" roughness={0.4} />
      </mesh>
      {/* Pod Unit 2 */}
      <mesh position={[0.7, 0.9, 0.4]} castShadow>
        <boxGeometry args={[1.4, 0.9, 1.6]} />
        <meshStandardMaterial color="#4d5f50" roughness={0.4} />
      </mesh>
      {/* Second Tier Pod */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <boxGeometry args={[1.5, 0.9, 1.5]} />
        <meshStandardMaterial color="#3c4c3e" roughness={0.4} />
      </mesh>
      {/* Third Tier for Level 2+ */}
      {level >= 2 && (
        <mesh position={[0.3, 2.7, -0.2]} castShadow>
          <boxGeometry args={[1.2, 0.8, 1.2]} />
          <meshStandardMaterial color="#556b58" roughness={0.4} />
        </mesh>
      )}
      {/* Rooftop Solar Water Heater */}
      <mesh position={[-0.4, 2.3, 0.2]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.6, 0.05, 0.6]} />
        <meshStandardMaterial color="#1f374d" metalness={0.8} />
      </mesh>
      {/* Night Window Warm Lights */}
      <mesh position={[0, 1.0, 1.21]}>
        <planeGeometry args={[0.7, 0.35]} />
        <meshBasicMaterial
          color={isNight ? '#ffe49e' : '#d2e4ba'}
          transparent
          opacity={isNight ? 0.9 : 0.5}
        />
      </mesh>
    </group>
  );
}

// 5. Commercial Exchange (Sleek Crystalline Tower)
export function CommercialExchangeModel({ isSelected, level }: ModelBaseProps) {
  const { isNight } = useDayNight();
  const height = 4.2 + level * 0.8;

  return (
    <group>
      {/* Grand Commercial Podium */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 1.0, 3.2]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#29332a'} roughness={0.5} />
      </mesh>
      {/* Main Glass Faceted Skyscraper */}
      <mesh position={[0, height * 0.5 + 0.5, 0]} castShadow>
        <cylinderGeometry args={[1.2, 1.7, height, 6]} />
        <meshStandardMaterial
          color="#3e5b6e"
          metalness={0.8}
          roughness={0.15}
          transparent
          opacity={0.88}
        />
      </mesh>
      {/* Illuminated Commercial Ticker Ribbon */}
      <mesh position={[0, 2.2, 0]}>
        <cylinderGeometry args={[1.72, 1.72, 0.35, 6]} />
        <meshStandardMaterial
          color="#c6a76a"
          emissive={isNight ? '#e6be75' : '#c6a76a'}
          emissiveIntensity={isNight ? 1.5 : 0.6}
        />
      </mesh>
      {/* Crown Spire */}
      <mesh position={[0, height + 1.2, 0]}>
        <coneGeometry args={[0.5, 1.4, 6]} />
        <meshStandardMaterial color="#c6a76a" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

// 6. Commercial Plaza Arcade (Multi-Tier Mall)
export function CommercialPlazaModel({ isSelected, level }: ModelBaseProps) {
  const { isNight } = useDayNight();

  return (
    <group>
      {/* Plaza Tier 1 */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.6, 0.8, 3.2]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#313a33'} roughness={0.6} />
      </mesh>
      {/* Plaza Tier 2 */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[2.8, 0.8, 2.4]} />
        <meshStandardMaterial color="#3d493f" roughness={0.5} />
      </mesh>
      {/* Central Glass Skylight Atrium */}
      <mesh position={[0, 1.7, 0]}>
        <sphereGeometry args={[0.9, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#527d94"
          transparent
          opacity={0.7}
          roughness={0.1}
          metalness={0.6}
        />
      </mesh>
      {/* Neon Digital Billboard */}
      <mesh position={[0, 1.4, 1.22]}>
        <planeGeometry args={[1.6, 0.5]} />
        <meshBasicMaterial
          color={isNight ? '#ff5252' : '#e06666'}
          transparent
          opacity={isNight ? 0.95 : 0.7}
        />
      </mesh>
    </group>
  );
}

// 7. Academy of Applied Sciences (University Campus Quad)
export function AcademyModel({ isSelected, level }: ModelBaseProps) {
  const { isNight } = useDayNight();

  return (
    <group>
      {/* Campus Base Plaza */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.2, 0.5, 3.6]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#353e37'} roughness={0.7} />
      </mesh>
      {/* Central Grand Hall */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[2.0, 1.3, 2.0]} />
        <meshStandardMaterial color="#47564a" roughness={0.5} />
      </mesh>
      {/* East Lecture Wing */}
      <mesh position={[1.4, 0.8, 0]} castShadow>
        <boxGeometry args={[1.0, 0.8, 2.4]} />
        <meshStandardMaterial color="#3b483d" roughness={0.5} />
      </mesh>
      {/* West Laboratory Wing */}
      <mesh position={[-1.4, 0.8, 0]} castShadow>
        <boxGeometry args={[1.0, 0.8, 2.4]} />
        <meshStandardMaterial color="#3b483d" roughness={0.5} />
      </mesh>
      {/* Classical Colonnade Portico Entrance */}
      {[-0.6, 0, 0.6].map((colX, i) => (
        <mesh key={i} position={[colX, 0.85, 1.05]}>
          <cylinderGeometry args={[0.07, 0.09, 0.8, 8]} />
          <meshStandardMaterial color="#d4ccb8" roughness={0.4} />
        </mesh>
      ))}
      {/* Central Classical Copper/Verdigris Dome */}
      <mesh position={[0, 2.0, 0]}>
        <sphereGeometry args={[0.85, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#4a7a67" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Academy Clock & Bell Spire */}
      <mesh position={[0, 2.7, 0]}>
        <cylinderGeometry args={[0.06, 0.12, 0.9, 6]} />
        <meshStandardMaterial color="#c6a76a" metalness={0.8} />
      </mesh>
      {/* Window glow */}
      <mesh position={[0, 1.2, 1.02]}>
        <planeGeometry args={[1.2, 0.4]} />
        <meshBasicMaterial
          color={isNight ? '#ffe294' : '#d2e4ba'}
          transparent
          opacity={isNight ? 0.9 : 0.5}
        />
      </mesh>
    </group>
  );
}

// 8. Cellular Regeneration Hospital (Medical Campus with Helipad)
export function HospitalModel({ isSelected, level }: ModelBaseProps) {
  const { isNight } = useDayNight();

  return (
    <group>
      {/* Emergency Department Base */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 0.9, 3.2]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#333e36'} roughness={0.6} />
      </mesh>
      {/* Main Ward Tower */}
      <mesh position={[-0.4, 1.7, -0.2]} castShadow>
        <boxGeometry args={[2.0, 1.6 + level * 0.4, 1.8]} />
        <meshStandardMaterial color="#e0e6e2" roughness={0.3} />
      </mesh>
      {/* Diagnostic & Research Wing */}
      <mesh position={[1.1, 1.2, 0.3]} castShadow>
        <boxGeometry args={[1.2, 1.2, 1.8]} />
        <meshStandardMaterial color="#cedad2" roughness={0.3} />
      </mesh>
      {/* Rooftop Helipad Deck */}
      <mesh position={[-0.4, 2.55 + level * 0.4, -0.2]}>
        <cylinderGeometry args={[0.9, 0.95, 0.1, 16]} />
        <meshStandardMaterial color="#424c45" roughness={0.8} />
      </mesh>
      {/* Helipad Yellow Ring & Red Cross */}
      <mesh position={[-0.4, 2.62 + level * 0.4, -0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.9, 0.9]} />
        <meshBasicMaterial color="#e04848" />
      </mesh>
      {/* Emergency Entrance Sign */}
      <mesh position={[1.1, 0.6, 1.22]}>
        <boxGeometry args={[0.8, 0.25, 0.05]} />
        <meshBasicMaterial color="#e74c3c" />
      </mesh>
      {/* Glowing Night Windows */}
      <mesh position={[-0.4, 1.7, 0.72]}>
        <planeGeometry args={[1.4, 0.8]} />
        <meshBasicMaterial
          color={isNight ? '#74c0fc' : '#a5d8ff'}
          transparent
          opacity={isNight ? 0.9 : 0.5}
        />
      </mesh>
    </group>
  );
}

// 9. Nanofabrication Foundry (Industrial Factory with Animated Smokestack Smoke)
export function FactoryModel({ isSelected, level }: ModelBaseProps) {
  const smokeRef1 = useRef<THREE.Group>(null);
  const smokeRef2 = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (smokeRef1.current) {
      smokeRef1.current.position.y = 2.4 + ((t * 1.5) % 1.2);
      smokeRef1.current.scale.setScalar(0.6 + ((t * 1.5) % 1.2) * 0.5);
    }
    if (smokeRef2.current) {
      smokeRef2.current.position.y = 2.4 + (((t + 0.4) * 1.5) % 1.2);
      smokeRef2.current.scale.setScalar(0.6 + (((t + 0.4) * 1.5) % 1.2) * 0.5);
    }
  });

  return (
    <group>
      {/* Heavy Foundry Shop Floor */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.4, 1.5, 2.8]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#3a342c'} roughness={0.8} />
      </mesh>
      {/* Sawtooth Industrial Roof Gable */}
      {[-0.8, 0.8].map((rx, i) => (
        <mesh key={i} position={[rx, 1.75, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
          <boxGeometry args={[1.1, 1.1, 2.7]} />
          <meshStandardMaterial color="#473f36" roughness={0.7} />
        </mesh>
      ))}
      {/* Cooling Smokestack 1 */}
      <mesh position={[-1.1, 1.8, 0.8]} castShadow>
        <cylinderGeometry args={[0.26, 0.38, 1.8, 8]} />
        <meshStandardMaterial color="#50453c" roughness={0.6} />
      </mesh>
      {/* Cooling Smokestack 2 */}
      <mesh position={[-1.1, 1.8, -0.8]} castShadow>
        <cylinderGeometry args={[0.26, 0.38, 1.8, 8]} />
        <meshStandardMaterial color="#50453c" roughness={0.6} />
      </mesh>
      {/* Animated Rising Smoke Puffs */}
      <group ref={smokeRef1} position={[-1.1, 2.8, 0.8]}>
        <mesh>
          <sphereGeometry args={[0.25, 6, 6]} />
          <meshBasicMaterial color="#dcdad5" transparent opacity={0.35} />
        </mesh>
      </group>
      <group ref={smokeRef2} position={[-1.1, 2.8, -0.8]}>
        <mesh>
          <sphereGeometry args={[0.25, 6, 6]} />
          <meshBasicMaterial color="#dcdad5" transparent opacity={0.35} />
        </mesh>
      </group>
      {/* External Gantry Loading Crane */}
      <mesh position={[1.1, 1.9, 0]} castShadow>
        <boxGeometry args={[1.6, 0.18, 0.25]} />
        <meshStandardMaterial color="#c6a76a" metalness={0.7} />
      </mesh>
      {/* Blast Furnace Internal Amber Glow */}
      <mesh position={[0.5, 0.5, 1.41]}>
        <planeGeometry args={[1.2, 0.6]} />
        <meshBasicMaterial color="#ff7b25" />
      </mesh>
    </group>
  );
}

// 10. Automated Logistics & Cargo Hub (Warehouse)
export function WarehouseModel({ isSelected, level }: ModelBaseProps) {
  return (
    <group>
      {/* Foundation & Paved Loading Apron */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 0.4, 3.4]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#333b35'} roughness={0.8} />
      </mesh>
      {/* Main Distribution Warehouse Body */}
      <mesh position={[0, 1.0, -0.3]} castShadow>
        <boxGeometry args={[3.4, 1.4, 2.2]} />
        <meshStandardMaterial color="#404c43" roughness={0.6} />
      </mesh>
      {/* Roll-up Cargo Bays */}
      {[-0.9, 0, 0.9].map((bx, i) => (
        <mesh key={i} position={[bx, 0.7, 0.81]}>
          <planeGeometry args={[0.7, 0.8]} />
          <meshStandardMaterial color="#222b24" roughness={0.4} />
        </mesh>
      ))}
      {/* Staged Intermodal Cargo Containers */}
      {[
        [-1.1, 0.45, 1.1, '#c0392b'],
        [-0.4, 0.45, 1.1, '#2980b9'],
        [0.8, 0.45, 1.1, '#f39c12'],
        [0.8, 0.85, 1.1, '#27ae60'],
      ].map(([cx, cy, cz, color], i) => (
        <mesh key={i} position={[cx as number, cy as number, cz as number]} castShadow>
          <boxGeometry args={[0.55, 0.4, 0.8]} />
          <meshStandardMaterial color={color as string} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// 11. Photovoltaic Concentrator Field (Solar Array)
export function SolarArrayModel({ isSelected, level }: ModelBaseProps) {
  return (
    <group>
      {/* Ground Substation Pad */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.3, 2.8]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#283229'} />
      </mesh>
      {/* Central Inverter Unit */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.7, 0.5, 0.8]} />
        <meshStandardMaterial color="#425044" roughness={0.6} />
      </mesh>
      {/* 4 Tilted Solar Tracking Collector Panels */}
      {[-0.9, 0.9].map((px, i) =>
        [-0.7, 0.7].map((pz, j) => (
          <group key={`${i}-${j}`} position={[px, 0.5, pz]}>
            {/* Swivel Mount */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.08, 0.1, 0.4, 6]} />
              <meshStandardMaterial color="#2d372e" />
            </mesh>
            {/* High-Efficiency Blue Mirrored Panel */}
            <mesh position={[0, 0.3, 0]} rotation={[0.42, 0, 0]} castShadow>
              <boxGeometry args={[1.2, 0.08, 0.85]} />
              <meshStandardMaterial color="#1b3652" metalness={0.9} roughness={0.08} />
            </mesh>
          </group>
        ))
      )}
    </group>
  );
}

// 12. Tokamak Fusion Power Plant (Nuclear / Clean Baseload)
export function FusionPlantModel({ isSelected, level }: ModelBaseProps) {
  const { isNight } = useDayNight();
  const plasmaRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (plasmaRef.current) {
      const pulse = 1.0 + Math.sin(clock.getElapsedTime() * 4.0) * 0.35;
      const mat = plasmaRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = pulse;
    }
  });

  return (
    <group>
      {/* Reinforced Containment Foundation */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.5, 2.9, 0.8, 16]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#2c352d'} roughness={0.6} />
      </mesh>
      {/* Magnetic Torus Core */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[2.0, 2.2, 1.2, 16]} />
        <meshStandardMaterial color="#384339" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Glowing Electromagnetic Containment Plasma Ring */}
      <mesh ref={plasmaRef} position={[0, 1.25, 0]}>
        <torusGeometry args={[2.05, 0.12, 12, 32]} />
        <meshStandardMaterial
          color="#38d9a9"
          emissive="#20c997"
          emissiveIntensity={isNight ? 2.2 : 1.2}
        />
      </mesh>
      {/* Cryogenic Cooling Towers */}
      {[-1.2, 1.2].map((cx, i) => (
        <mesh key={i} position={[cx, 1.8, -1.0]} castShadow>
          <cylinderGeometry args={[0.4, 0.6, 1.6, 12]} />
          <meshStandardMaterial color="#4d5b4f" roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// 13. Hydro-Reclamation & Treatment Facility (Water Plant)
export function WaterTreatmentModel({ isSelected, level }: ModelBaseProps) {
  const armRef1 = useRef<THREE.Group>(null);
  const armRef2 = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (armRef1.current) armRef1.current.rotation.y += delta * 0.35;
    if (armRef2.current) armRef2.current.rotation.y += delta * 0.35;
  });

  return (
    <group>
      {/* Concrete Facility Apron */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 0.4, 3.2]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#333e36'} roughness={0.8} />
      </mesh>
      {/* Clarifier Settling Tank 1 */}
      <group position={[-0.9, 0.45, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[1.0, 1.1, 0.6, 16]} />
          <meshStandardMaterial color="#47544a" roughness={0.6} />
        </mesh>
        {/* Swirling Treated Water Basin */}
        <mesh position={[0, 0.31, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.92, 16]} />
          <meshStandardMaterial color="#23829e" roughness={0.1} metalness={0.7} />
        </mesh>
        {/* Rotating Clarifier Skimmer Arm */}
        <group ref={armRef1} position={[0, 0.35, 0]}>
          <mesh>
            <boxGeometry args={[1.7, 0.08, 0.1]} />
            <meshStandardMaterial color="#c6a76a" />
          </mesh>
        </group>
      </group>
      {/* Clarifier Settling Tank 2 */}
      <group position={[0.9, 0.45, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[1.0, 1.1, 0.6, 16]} />
          <meshStandardMaterial color="#47544a" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.31, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.92, 16]} />
          <meshStandardMaterial color="#23829e" roughness={0.1} metalness={0.7} />
        </mesh>
        <group ref={armRef2} position={[0, 0.35, 0]}>
          <mesh>
            <boxGeometry args={[1.7, 0.08, 0.1]} />
            <meshStandardMaterial color="#c6a76a" />
          </mesh>
        </group>
      </group>
      {/* Filtration Pump Manifold */}
      <mesh position={[0, 0.9, -0.9]} castShadow>
        <boxGeometry args={[1.4, 0.8, 0.8]} />
        <meshStandardMaterial color="#3b483e" />
      </mesh>
    </group>
  );
}

// 14. Central Biosphere Botanical Park (Recreational Public Commons)
export function BotanicalParkModel({ isSelected, level }: ModelBaseProps) {
  const fountainRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (fountainRef.current) {
      const s = 1.0 + Math.sin(clock.getElapsedTime() * 3.5) * 0.15;
      fountainRef.current.scale.set(s, s * 1.2, s);
    }
  });

  return (
    <group>
      {/* Cobblestone Promenade Plaza */}
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <cylinderGeometry args={[2.4, 2.5, 0.3, 16]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#697a66'} roughness={0.7} />
      </mesh>
      {/* Center Fountain Basin */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[1.1, 1.2, 0.35, 12]} />
        <meshStandardMaterial color="#889885" roughness={0.4} />
      </mesh>
      {/* Fountain Water */}
      <mesh position={[0, 0.52, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.95, 12]} />
        <meshStandardMaterial color="#3ba4c7" roughness={0.1} metalness={0.8} />
      </mesh>
      {/* Animated Spray Jet */}
      <mesh ref={fountainRef} position={[0, 0.85, 0]}>
        <coneGeometry args={[0.25, 0.7, 8]} />
        <meshBasicMaterial color="#d4f4ff" transparent opacity={0.65} />
      </mesh>
      {/* Park Benches */}
      {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((ang, i) => (
        <group key={i} rotation={[0, ang, 0]}>
          <mesh position={[0, 0.35, 1.8]}>
            <boxGeometry args={[0.7, 0.2, 0.25]} />
            <meshStandardMaterial color="#7a5538" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// 15. Aeroponic Bio-Dome (Agricultural Greenhouse)
export function HydroponicDomeModel({ isSelected, level }: ModelBaseProps) {
  return (
    <group>
      {/* Base Foundation */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.0, 2.3, 0.6, 12]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#334034'} />
      </mesh>
      {/* Translucent Geodesic Dome */}
      <mesh position={[0, 0.6, 0]}>
        <sphereGeometry args={[1.9, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#94b883"
          transparent
          opacity={0.65}
          roughness={0.15}
          metalness={0.3}
        />
      </mesh>
      {/* Internal Vertical Hydroponic Crop Tower & Grow Lights */}
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.6, 0.9, 1.0, 8]} />
        <meshStandardMaterial
          color="#4d733b"
          emissive="#5e8c47"
          emissiveIntensity={0.6}
        />
      </mesh>
    </group>
  );
}

// 16. Photobioreactor Basin (Algae Synthesis)
export function AlgaeBasinModel({ isSelected, level }: ModelBaseProps) {
  return (
    <group>
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.6, 2.8]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#29362a'} />
      </mesh>
      {/* 3 Tiered Photobioreactor Glass Tubes */}
      {[-0.8, 0, 0.8].map((tz, i) => (
        <mesh key={i} position={[0, 0.7, tz]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.3, 0.3, 2.8, 12]} />
          <meshStandardMaterial
            color="#2ecc71"
            emissive="#27ae60"
            emissiveIntensity={0.7}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
    </group>
  );
}

// 17. Planetary Senate Citadel (Government & Civic Command)
export function CitadelModel({ isSelected, level }: ModelBaseProps) {
  const { isNight } = useDayNight();

  return (
    <group>
      {/* Tiered Bastion Ground Terrace */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.8, 3.4, 1.0, 8]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#242f26'} roughness={0.5} />
      </mesh>
      {/* Mid Executive Council Keep */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[2.0, 2.4, 1.4, 8]} />
        <meshStandardMaterial color="#374639" roughness={0.4} />
      </mesh>
      {/* Classical Civic Colonnade Ring */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const ang = (i * Math.PI * 2) / 8;
        return (
          <mesh key={i} position={[Math.cos(ang) * 1.8, 1.6, Math.sin(ang) * 1.8]}>
            <cylinderGeometry args={[0.08, 0.1, 1.3, 6]} />
            <meshStandardMaterial color="#d8cdb4" />
          </mesh>
        );
      })}
      {/* Grand Golden Council Dome */}
      <mesh position={[0, 2.7, 0]} castShadow>
        <sphereGeometry args={[1.5, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#c6a76a"
          metalness={0.8}
          roughness={0.2}
          emissive="#c6a76a"
          emissiveIntensity={isNight ? 0.7 : 0.3}
        />
      </mesh>
      {/* Planetary Zenith Spire */}
      <mesh position={[0, 4.0, 0]}>
        <coneGeometry args={[0.4, 1.6, 8]} />
        <meshStandardMaterial color="#c6a76a" metalness={0.9} />
      </mesh>
    </group>
  );
}

