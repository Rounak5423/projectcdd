import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useDayNight } from '../DayNightController';
import { AntennaMast } from './BuildingSharedElements';

interface ModelProps {
  isSelected: boolean;
  level: number;
}

// 1. Hydro-Reclamation & Water Treatment Plant
export function WaterTreatmentPlantModel({ isSelected, level }: ModelProps) {
  const armRef1 = useRef<THREE.Group>(null);
  const armRef2 = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (armRef1.current) armRef1.current.rotation.y += delta * 0.35;
    if (armRef2.current) armRef2.current.rotation.y += delta * 0.35;
  });

  return (
    <group>
      {/* Concrete Apron */}
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

      {/* Level 2 Development: Chemical Disinfection & Aeration Unit */}
      {level >= 2 && (
        <mesh position={[0, 1.4, -0.9]} castShadow>
          <cylinderGeometry args={[0.35, 0.35, 0.6, 12]} />
          <meshStandardMaterial color="#2d829e" metalness={0.6} />
        </mesh>
      )}

      {/* Level 3 Development: Deep Aquifer Injection Well */}
      {level >= 3 && (
        <group position={[0, 1.8, -0.9]}>
          <AntennaMast position={[0, 0, 0]} height={1.4} />
        </group>
      )}
    </group>
  );
}

// 2. Elevated Municipal Water Storage Facility (Water Tower)
export function WaterStorageFacilityModel({ isSelected, level }: ModelProps) {
  return (
    <group>
      {/* Base Staging Pad */}
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <cylinderGeometry args={[1.8, 2.0, 0.3, 12]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#39443c'} roughness={0.7} />
      </mesh>
      {/* Steel Lattice Trestle Legs */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const ang = (i * Math.PI * 2) / 6;
        return (
          <mesh key={i} position={[Math.cos(ang) * 1.0, 1.5, Math.sin(ang) * 1.0]}>
            <cylinderGeometry args={[0.04, 0.05, 2.6, 6]} />
            <meshStandardMaterial color="#2c362f" metalness={0.7} />
          </mesh>
        );
      })}
      {/* Central Riser Pipe */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 2.6, 8]} />
        <meshStandardMaterial color="#404e44" metalness={0.6} />
      </mesh>
      {/* Elevated Spherical Hydro Reservoir Sphere */}
      <mesh position={[0, 3.2, 0]} castShadow>
        <sphereGeometry args={[1.3, 16, 16]} />
        <meshStandardMaterial color="#4a768c" metalness={0.5} roughness={0.2} />
      </mesh>
      {/* Civil Water District Beacon Cap */}
      <mesh position={[0, 4.6, 0]}>
        <coneGeometry args={[0.2, 0.4, 8]} />
        <meshStandardMaterial color="#c6a76a" metalness={0.8} />
      </mesh>
    </group>
  );
}

// 3. Grid Energy Substation & Battery Bank
export function ElectricalSubstationModel({ isSelected, level }: ModelProps) {
  return (
    <group>
      {/* Gravel Substation Yard */}
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <boxGeometry args={[3.6, 0.3, 3.0]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#454a46'} roughness={0.9} />
      </mesh>
      {/* Heavy Step-Up Transformer 1 */}
      <mesh position={[-0.8, 0.7, 0]} castShadow>
        <boxGeometry args={[1.0, 0.8, 1.2]} />
        <meshStandardMaterial color="#303b33" roughness={0.6} />
      </mesh>
      {/* Heavy Step-Up Transformer 2 */}
      <mesh position={[0.8, 0.7, 0]} castShadow>
        <boxGeometry args={[1.0, 0.8, 1.2]} />
        <meshStandardMaterial color="#303b33" roughness={0.6} />
      </mesh>
      {/* Insulator Ceramic Bushing Bushings */}
      {[-0.8, 0.8].map((tx, i) =>
        [-0.3, 0, 0.3].map((bz, j) => (
          <mesh key={`${i}-${j}`} position={[tx, 1.25, bz]}>
            <cylinderGeometry args={[0.04, 0.06, 0.4, 6]} />
            <meshStandardMaterial color="#c0392b" roughness={0.3} />
          </mesh>
        ))
      )}
      {/* Steel Transmission Gantry Tower */}
      <mesh position={[0, 1.8, -0.9]} castShadow>
        <cylinderGeometry args={[0.06, 0.12, 2.8, 6]} />
        <meshStandardMaterial color="#dcdad5" metalness={0.8} />
      </mesh>
    </group>
  );
}

// 4. Planetary Senate Citadel (Government & Civic Command)
export function SenateCitadelModel({ isSelected, level }: ModelProps) {
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

