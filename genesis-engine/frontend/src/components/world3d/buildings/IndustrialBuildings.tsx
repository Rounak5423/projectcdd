import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useIsNight } from '../DayNightController';
import { AntennaMast } from './BuildingSharedElements';

interface ModelProps {
  isSelected: boolean;
  level: number;
}

// 1. Nanofabrication Foundry (Heavy Factory with Rising Smoke)
export function FactoryFoundryModel({ isSelected, level }: ModelProps) {
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
      {/* Heavy Foundry Floor */}
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

      {/* External Gantry Crane */}
      <mesh position={[1.1, 1.9, 0]} castShadow>
        <boxGeometry args={[1.6, 0.18, 0.25]} />
        <meshStandardMaterial color="#c6a76a" metalness={0.7} />
      </mesh>

      {/* Level 2 Development: Extra Smelting Furnace Annex */}
      {level >= 2 && (
        <mesh position={[1.2, 0.6, 0]} castShadow>
          <boxGeometry args={[1.0, 1.2, 2.0]} />
          <meshStandardMaterial color="#302a24" roughness={0.7} />
        </mesh>
      )}

      {/* Level 3 Development: Filtration Catalyzer & Pylons */}
      {level >= 3 && (
        <group position={[0, 2.2, 0]}>
          <AntennaMast position={[0.8, 0, 0]} height={1.5} />
        </group>
      )}
    </group>
  );
}

// 2. Automated Robotics Manufacturing Plant
export function ManufacturingUnitModel({ isSelected, level }: ModelProps) {
  return (
    <group>
      {/* Foundation */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.6, 0.5, 3.0]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#333b35'} roughness={0.7} />
      </mesh>
      {/* Main Assembly Shed */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[3.2, 1.2, 2.4]} />
        <meshStandardMaterial color="#3f4d44" roughness={0.5} />
      </mesh>
      {/* Conveyor Portal Shutter */}
      <mesh position={[0, 0.7, 1.21]}>
        <planeGeometry args={[1.4, 0.8]} />
        <meshStandardMaterial color="#222b25" metalness={0.6} />
      </mesh>
      {/* Pneumatic Exhaust Tubes */}
      {[-0.8, 0, 0.8].map((tx, i) => (
        <mesh key={i} position={[tx, 1.85, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.6, 8]} />
          <meshStandardMaterial color="#d4cbb6" metalness={0.8} />
        </mesh>
      ))}

      {/* Level 2 Development: Component Fabrication Bay */}
      {level >= 2 && (
        <mesh position={[0, 2.0, -0.4]} castShadow>
          <boxGeometry args={[2.2, 0.8, 1.4]} />
          <meshStandardMaterial color="#354039" />
        </mesh>
      )}

      {/* Level 3 Development: Automated Drone Dispatch Pad */}
      {level >= 3 && (
        <mesh position={[0, level >= 2 ? 2.45 : 1.75, 0]}>
          <cylinderGeometry args={[0.8, 0.85, 0.1, 12]} />
          <meshStandardMaterial color="#c6a76a" metalness={0.7} />
        </mesh>
      )}
    </group>
  );
}

// 3. Automated Logistics & Cargo Hub (Warehouse)
export function LogisticsWarehouseModel({ isSelected, level }: ModelProps) {
  return (
    <group>
      {/* Loading Apron */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 0.4, 3.4]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#333b35'} roughness={0.8} />
      </mesh>
      {/* Main Warehouse Hall */}
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
      {/* Intermodal Cargo Containers Staged Outside */}
      {[
        [-1.1, 0.45, 1.1, '#c0392b'],
        [-0.4, 0.45, 1.1, '#2980b9'],
        [0.8, 0.45, 1.1, '#f39c12'],
      ].map(([cx, cy, cz, color], i) => (
        <mesh key={i} position={[cx as number, cy as number, cz as number]} castShadow>
          <boxGeometry args={[0.55, 0.4, 0.8]} />
          <meshStandardMaterial color={color as string} roughness={0.5} />
        </mesh>
      ))}

      {/* Level 2 Development: Extra High-Bay Container Rack */}
      {level >= 2 && (
        <mesh position={[0.8, 0.85, 1.1]} castShadow>
          <boxGeometry args={[0.55, 0.4, 0.8]} />
          <meshStandardMaterial color="#27ae60" roughness={0.5} />
        </mesh>
      )}

      {/* Level 3 Development: Rooftop Cargo Crane & Logistics Telemetry */}
      {level >= 3 && (
        <group position={[0, 1.75, -0.3]}>
          <AntennaMast position={[-1.2, 0, 0]} height={1.4} />
        </group>
      )}
    </group>
  );
}

// 4. Tokamak Fusion Power Plant (Clean Baseload Energy)
export function FusionPowerPlantModel({ isSelected, level }: ModelProps) {
  const isNight = useIsNight();
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
      {/* Reinforced Containment Pad */}
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

      {/* Level 3 Development: Magnetic Energy Collector Spire */}
      {level >= 3 && (
        <mesh position={[0, 2.2, 0]}>
          <coneGeometry args={[0.5, 1.2, 8]} />
          <meshStandardMaterial color="#c6a76a" metalness={0.8} />
        </mesh>
      )}
    </group>
  );
}

// 5. Photovoltaic Concentrator Field (Solar Array)
export function SolarArrayFieldModel({ isSelected, level }: ModelProps) {
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
      {/* 4 Tilted Mirrored Solar Collector Panels */}
      {[-0.9, 0.9].map((px, i) =>
        [-0.7, 0.7].map((pz, j) => (
          <group key={`${i}-${j}`} position={[px, 0.5, pz]}>
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.08, 0.1, 0.4, 6]} />
              <meshStandardMaterial color="#2d372e" />
            </mesh>
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

// 6. Vortex Wind Turbine
export function WindTurbineModel({ isSelected, level }: ModelProps) {
  const isNight = useIsNight();
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

