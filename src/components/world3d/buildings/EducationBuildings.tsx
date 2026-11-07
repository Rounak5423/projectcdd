import React from 'react';
import * as THREE from 'three';
import { useIsNight } from '../DayNightController';
import {
  ArchitecturalDoor,
  ArchitecturalWindow,
  RooftopHVAC,
  RooftopSolarPanel,
  AntennaMast,
} from './BuildingSharedElements';

interface ModelProps {
  isSelected: boolean;
  level: number;
}

// 1. Primary & Secondary School
export function SchoolModel({ isSelected, level }: ModelProps) {
  const isNight = useIsNight();

  return (
    <group>
      {/* Playground & School Grounds Base */}
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <boxGeometry args={[3.6, 0.3, 3.0]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#496144'} roughness={0.8} />
      </mesh>
      {/* Central School Entrance Hall */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[1.8, 0.9, 1.8]} />
        <meshStandardMaterial color="#d8ded2" roughness={0.5} />
      </mesh>
      {/* East Classroom Wing */}
      <mesh position={[1.1, 0.65, -0.2]} castShadow>
        <boxGeometry args={[1.2, 0.7, 1.6]} />
        <meshStandardMaterial color="#ced6c7" roughness={0.5} />
      </mesh>
      {/* West Science / Art Wing */}
      <mesh position={[-1.1, 0.65, -0.2]} castShadow>
        <boxGeometry args={[1.2, 0.7, 1.6]} />
        <meshStandardMaterial color="#ced6c7" roughness={0.5} />
      </mesh>
      {/* School Entrance Door */}
      <ArchitecturalDoor position={[0, 0.3, 0.92]} width={0.7} height={0.8} />

      {/* Clock Tower / Bell Spire */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <boxGeometry args={[0.7, 1.0, 0.7]} />
        <meshStandardMaterial color="#b8c4b1" roughness={0.4} />
      </mesh>
      {/* Golden Clock Face */}
      <mesh position={[0, 1.65, 0.36]}>
        <circleGeometry args={[0.18, 12]} />
        <meshBasicMaterial color="#f1c40f" />
      </mesh>
      {/* Conical Steeple Cap */}
      <mesh position={[0, 2.3, 0]}>
        <coneGeometry args={[0.45, 0.6, 4]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>

      {/* Level 2 Development: Second Floor Classrooms */}
      {level >= 2 && (
        <group>
          <mesh position={[1.1, 1.25, -0.2]} castShadow>
            <boxGeometry args={[1.1, 0.6, 1.4]} />
            <meshStandardMaterial color="#b8c4b1" />
          </mesh>
          <mesh position={[-1.1, 1.25, -0.2]} castShadow>
            <boxGeometry args={[1.1, 0.6, 1.4]} />
            <meshStandardMaterial color="#b8c4b1" />
          </mesh>
        </group>
      )}

      {/* Level 3 Development: Rooftop Solar & Observational Dome */}
      {level >= 3 && (
        <group position={[1.1, 1.65, -0.2]}>
          <RooftopSolarPanel position={[0, 0, 0]} />
          <AntennaMast position={[-2.2, 0, 0]} height={1.2} />
        </group>
      )}

      {/* Level 4 Development: Sports & Athletic Geodesic Gym Pavilion */}
      {level >= 4 && (
        <group position={[0, 0.45, -1.2]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.7, 0.7, 0.5, 12]} />
            <meshStandardMaterial color="#34495e" roughness={0.4} />
          </mesh>
        </group>
      )}

      {/* Level 5 Development (Civic Education Wonder): Digital Planetarium Dome & Halo Ring */}
      {level >= 5 && (
        <group position={[-1.1, 1.6, -0.2]}>
          <mesh position={[0, 0.3, 0]}>
            <sphereGeometry args={[0.55, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshStandardMaterial color="#527d94" metalness={0.7} roughness={0.1} />
          </mesh>
          <mesh position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.6, 0.68, 24]} />
            <meshBasicMaterial color="#f1c40f" side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// 2. Polytechnic Technical College
export function CollegeModel({ isSelected, level }: ModelProps) {
  const isNight = useIsNight();

  return (
    <group>
      {/* Campus Base */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 0.5, 3.2]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#353e37'} roughness={0.7} />
      </mesh>
      {/* Main Engineering Hall */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <boxGeometry args={[2.4, 1.1, 2.2]} />
        <meshStandardMaterial color="#445548" roughness={0.4} />
      </mesh>
      {/* Modern Angled Glass Lecture Atrium */}
      <mesh position={[0, 1.1, 1.12]} rotation={[0.2, 0, 0]}>
        <planeGeometry args={[1.6, 0.9]} />
        <meshBasicMaterial
          color={isNight ? '#ffeaa7' : '#74b9ff'}
          transparent
          opacity={isNight ? 0.95 : 0.65}
        />
      </mesh>
      <ArchitecturalDoor position={[0, 0.5, 1.12]} width={0.9} height={0.85} />

      {/* Robotics Workshop Wing */}
      <mesh position={[1.4, 0.8, -0.2]} castShadow>
        <boxGeometry args={[1.0, 0.8, 2.0]} />
        <meshStandardMaterial color="#3a483d" roughness={0.5} />
      </mesh>

      {/* Level 2 Development: Research Lab Annex */}
      {level >= 2 && (
        <group position={[-1.4, 0.9, -0.2]}>
          <mesh castShadow>
            <boxGeometry args={[1.0, 1.0, 2.0]} />
            <meshStandardMaterial color="#3a483d" roughness={0.5} />
          </mesh>
          <ArchitecturalWindow position={[0, 0.2, 1.02]} width={0.7} height={0.4} />
        </group>
      )}

      {/* Level 3 Development: Rooftop Solar & Telemetry Dish */}
      {level >= 3 && (
        <group position={[0, 1.6, 0]}>
          <RooftopSolarPanel position={[-0.6, 0, -0.4]} />
          <RooftopHVAC position={[0.6, 0, -0.4]} />
          <AntennaMast position={[0, 0, 0.5]} height={1.6} />
        </group>
      )}

      {/* Level 4 Development: Particle Physics & Cybernetics Lab Wing */}
      {level >= 4 && (
        <group position={[0, 1.8, -0.8]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.5, 0.5, 0.6, 12]} />
            <meshStandardMaterial color="#2d3436" metalness={0.8} />
          </mesh>
        </group>
      )}

      {/* Level 5 Development (Polytechnic Wonder): Supercomputing Quantum Core & Neon Beacons */}
      {level >= 5 && (
        <group position={[0, 2.3, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.2, 0.05, 16, 24]} />
            <meshStandardMaterial color="#9b59b6" emissive="#9b59b6" emissiveIntensity={isNight ? 2.5 : 1.2} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// 3. University / Academy of Applied Sciences
export function UniversityAcademyModel({ isSelected, level }: ModelProps) {
  const isNight = useIsNight();

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
      {/* Central Classical Verdigris Copper Dome */}
      <mesh position={[0, 2.0, 0]}>
        <sphereGeometry args={[0.85, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#4a7a67" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Academy Telemetry Spire */}
      <mesh position={[0, 2.7, 0]}>
        <cylinderGeometry args={[0.06, 0.12, 0.9, 6]} />
        <meshStandardMaterial color="#c6a76a" metalness={0.8} />
      </mesh>

      {/* Level 3 Development: Quantum Research Expansion */}
      {level >= 3 && (
        <group position={[0, 1.8, 0]}>
          <RooftopSolarPanel position={[1.4, -0.5, 0]} />
          <RooftopSolarPanel position={[-1.4, -0.5, 0]} />
          <AntennaMast position={[0, 1.2, 0]} height={1.8} />
        </group>
      )}

      {/* Level 4 Development: Quadrant Library Rotunda & Celestial Bridge */}
      {level >= 4 && (
        <group position={[0, 1.4, -1.3]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.7, 0.75, 0.8, 16]} />
            <meshStandardMaterial color="#47564a" roughness={0.4} />
          </mesh>
        </group>
      )}

      {/* Level 5 Development (Academy Wonder of Knowledge): Floating Armillary Celestial Rings & Zenith Beacon */}
      {level >= 5 && (
        <group position={[0, 3.4, 0]}>
          <mesh rotation={[0.4, 0, 0]}>
            <torusGeometry args={[1.1, 0.04, 16, 32]} />
            <meshStandardMaterial color="#f1c40f" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh rotation={[-0.4, Math.PI / 2, 0]}>
            <torusGeometry args={[1.1, 0.04, 16, 32]} />
            <meshStandardMaterial color="#f1c40f" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0, 0.8, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 1.6, 8]} />
            <meshBasicMaterial color="#00cec9" />
          </mesh>
        </group>
      )}
    </group>
  );
}

