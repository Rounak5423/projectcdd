import React from 'react';
import * as THREE from 'three';
import { useIsNight } from '../DayNightController';
import {
  ArchitecturalDoor,
  ArchitecturalWindow,
  RedCrossEmblem,
  RooftopHVAC,
  RooftopSolarPanel,
  AntennaMast,
} from './BuildingSharedElements';

interface ModelProps {
  isSelected: boolean;
  level: number;
}

// 1. Community Medical Clinic
export function ClinicModel({ isSelected, level }: ModelProps) {
  const isNight = useIsNight();

  return (
    <group>
      {/* Foundation & Paved Ambulance Bay */}
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <boxGeometry args={[3.2, 0.3, 2.6]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#455048'} roughness={0.7} />
      </mesh>
      {/* Main Clinic Hall */}
      <mesh position={[-0.4, 0.75, 0]} castShadow>
        <boxGeometry args={[1.9, 0.9, 1.8]} />
        <meshStandardMaterial color="#e9ece6" roughness={0.3} />
      </mesh>
      {/* Red Cross Medical Insignia */}
      <RedCrossEmblem position={[-0.4, 1.35, 0.93]} scale={0.65} />
      {/* Emergency Entrance */}
      <ArchitecturalDoor position={[-0.4, 0.3, 0.92]} width={0.6} height={0.8} />

      {/* Ambulance Staging Shelter */}
      <mesh position={[0.8, 0.75, 0.2]} castShadow>
        <boxGeometry args={[1.0, 0.9, 1.4]} />
        <meshStandardMaterial color="#354038" roughness={0.6} />
      </mesh>
      {/* Emergency Red Siren Cap */}
      <mesh position={[0.8, 1.25, 0.2]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial
          color="#ff2222"
          emissive="#ff1111"
          emissiveIntensity={isNight ? 2.5 : 0.8}
        />
      </mesh>

      {/* Level 2 Development: Second Floor Telemedicine & Diagnostics Wing */}
      {level >= 2 && (
        <group position={[-0.4, 1.6, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.7, 0.8, 1.6]} />
            <meshStandardMaterial color="#dde3da" roughness={0.3} />
          </mesh>
          <ArchitecturalWindow position={[0, 0, 0.82]} width={1.0} height={0.4} />
        </group>
      )}

      {/* Level 3 Development: Rooftop Solar & Clean Air Chiller */}
      {level >= 3 && (
        <group position={[-0.4, level >= 2 ? 2.05 : 1.25, 0]}>
          <RooftopHVAC position={[0, 0, -0.3]} />
          <RooftopSolarPanel position={[0, 0, 0.3]} />
        </group>
      )}

      {/* Level 4 Development: Attached Triage Bay & Bio-containment Unit */}
      {level >= 4 && (
        <group position={[-0.4, 0.6, -1.1]}>
          <mesh castShadow>
            <boxGeometry args={[1.5, 0.7, 0.8]} />
            <meshStandardMaterial color="#81ecec" transparent opacity={0.7} />
          </mesh>
        </group>
      )}

      {/* Level 5 Development (Apex Longevity Clinic): Medical Drone Dispatch Pad & Cyan Beacon */}
      {level >= 5 && (
        <group position={[-0.4, 2.5, 0]}>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.6, 0.65, 0.08, 16]} />
            <meshStandardMaterial color="#2d3436" metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#00cec9" emissive="#00cec9" emissiveIntensity={isNight ? 2.5 : 1.0} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// 2. Cellular Care Healthcare Center
export function HealthcareCenterModel({ isSelected, level }: ModelProps) {
  const isNight = useIsNight();

  return (
    <group>
      {/* Base Foundation */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.6, 0.5, 3.0]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#323c34'} roughness={0.6} />
      </mesh>
      {/* Main Treatment Center Block */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <boxGeometry args={[2.8, 1.1, 2.2]} />
        <meshStandardMaterial color="#e4eae2" roughness={0.3} />
      </mesh>
      {/* Central Glass Atrium */}
      <mesh position={[0, 1.0, 1.12]}>
        <planeGeometry args={[1.2, 0.8]} />
        <meshBasicMaterial
          color={isNight ? '#74c0fc' : '#a5d8ff'}
          transparent
          opacity={isNight ? 0.95 : 0.65}
        />
      </mesh>
      <RedCrossEmblem position={[0, 1.8, 1.12]} scale={0.7} />
      <ArchitecturalDoor position={[0, 0.5, 1.12]} width={0.8} height={0.85} />

      {/* Level 2 Development: Inpatient Ward Wing */}
      {level >= 2 && (
        <group position={[0, 2.0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[2.2, 0.9, 1.8]} />
            <meshStandardMaterial color="#d2ddd0" roughness={0.3} />
          </mesh>
          <ArchitecturalWindow position={[-0.5, 0, 0.92]} width={0.6} height={0.4} />
          <ArchitecturalWindow position={[0.5, 0, 0.92]} width={0.6} height={0.4} />
        </group>
      )}

      {/* Level 3 Development: Rooftop Solar & Clean Air Manifold */}
      {level >= 3 && (
        <group position={[0, level >= 2 ? 2.5 : 1.6, 0]}>
          <RooftopSolarPanel position={[-0.6, 0, 0]} />
          <RooftopHVAC position={[0.6, 0, 0]} />
          <AntennaMast position={[0, 0, -0.5]} height={1.4} />
        </group>
      )}

      {/* Level 4 Development: Robotics Surgical Suite Wing */}
      {level >= 4 && (
        <group position={[1.6, 1.0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.9, 0.9, 1.6]} />
            <meshStandardMaterial color="#d2ddd0" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.81]}>
            <planeGeometry args={[0.7, 0.6]} />
            <meshStandardMaterial color="#81ecec" transparent opacity={0.7} />
          </mesh>
        </group>
      )}

      {/* Level 5 Development (Cellular Care Wonder): Glowing Caduceus Halo & Cryo Chamber */}
      {level >= 5 && (
        <group position={[0, 3.2, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.2, 0.06, 16, 24]} />
            <meshStandardMaterial
              color="#00cec9"
              emissive="#00cec9"
              emissiveIntensity={isNight ? 2.5 : 1.2}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

// 3. Central Regional Hospital (Campus with Helipad)
export function HospitalModel({ isSelected, level }: ModelProps) {
  const isNight = useIsNight();
  const heightBoost = (level - 1) * 0.5;

  return (
    <group>
      {/* Emergency Department Base */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 0.9, 3.2]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#333e36'} roughness={0.6} />
      </mesh>
      {/* Main Inpatient Ward Tower */}
      <mesh position={[-0.4, 1.7 + heightBoost * 0.5, -0.2]} castShadow>
        <boxGeometry args={[2.0, 1.6 + heightBoost, 1.8]} />
        <meshStandardMaterial color="#e0e6e2" roughness={0.3} />
      </mesh>
      {/* Diagnostic & Research Wing */}
      <mesh position={[1.1, 1.2, 0.3]} castShadow>
        <boxGeometry args={[1.2, 1.2, 1.8]} />
        <meshStandardMaterial color="#cedad2" roughness={0.3} />
      </mesh>
      {/* Red Cross Symbols */}
      <RedCrossEmblem position={[1.1, 1.4, 1.22]} scale={0.6} />

      {/* Rooftop Helipad Deck */}
      <mesh position={[-0.4, 2.55 + heightBoost, -0.2]}>
        <cylinderGeometry args={[0.9, 0.95, 0.1, 16]} />
        <meshStandardMaterial color="#424c45" roughness={0.8} />
      </mesh>
      {/* Helipad Yellow Ring & Red Cross */}
      <mesh position={[-0.4, 2.62 + heightBoost, -0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.9, 0.9]} />
        <meshBasicMaterial color="#e04848" />
      </mesh>

      {/* Illuminated Patient Ward Windows */}
      <mesh position={[-0.4, 1.7 + heightBoost * 0.5, 0.72]}>
        <planeGeometry args={[1.4, 0.8 + heightBoost * 0.5]} />
        <meshBasicMaterial
          color={isNight ? '#74c0fc' : '#a5d8ff'}
          transparent
          opacity={isNight ? 0.9 : 0.55}
        />
      </mesh>

      {/* Level 3 Development: Rooftop Solar & Clean Air Filtration */}
      {level >= 3 && (
        <group position={[1.1, 1.85, 0.3]}>
          <RooftopSolarPanel position={[0, 0, 0]} />
          <AntennaMast position={[0, 0, -0.5]} height={1.6} />
        </group>
      )}

      {/* Level 4 Development: Trauma Tower Extension & Skybridge */}
      {level >= 4 && (
        <group>
          <mesh position={[1.1, 2.6, 0.3]} castShadow>
            <boxGeometry args={[1.0, 1.2, 1.4]} />
            <meshStandardMaterial color="#d2ddd0" roughness={0.3} />
          </mesh>
          {/* Connecting Skybridge */}
          <mesh position={[0.35, 2.4, 0]}>
            <boxGeometry args={[0.9, 0.45, 0.5]} />
            <meshStandardMaterial color="#81ecec" transparent opacity={0.7} />
          </mesh>
        </group>
      )}

      {/* Level 5 Development (Medical Citadel Wonder): Holographic Caduceus Beacon & Med-Drone Port */}
      {level >= 5 && (
        <group position={[-0.4, 3.4 + heightBoost, -0.2]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.3, 0.08, 16, 32]} />
            <meshStandardMaterial
              color="#e74c3c"
              emissive="#e74c3c"
              emissiveIntensity={isNight ? 2.5 : 1.2}
            />
          </mesh>
          <mesh position={[0, 0.8, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 1.6, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      )}
    </group>
  );
}

