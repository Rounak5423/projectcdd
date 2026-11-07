import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ModelProps {
  isSelected: boolean;
  level: number;
}

// 1. Central Biosphere Botanical Park (Animated Water Fountain)
export function BotanicalParkModel({ isSelected, level }: ModelProps) {
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
      {/* Fountain Water Surface */}
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

      {/* Level 4 Development: Shaded Pergola Promenade & Decorative Flower Planters */}
      {level >= 4 && (
        <group position={[0, 0.5, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.0, 2.3, 24]} />
            <meshStandardMaterial color="#27ae60" roughness={0.6} />
          </mesh>
        </group>
      )}

      {/* Level 5 Development (Apex Biosphere Wonder): Cascading Geyser Core & Floating Eco-Halo */}
      {level >= 5 && (
        <group position={[0, 1.6, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.4, 0.05, 12, 24]} />
            <meshStandardMaterial color="#2ecc71" emissive="#2ecc71" emissiveIntensity={1.8} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// 2. Community Allotment Garden
export function CommunityGardenModel({ isSelected, level }: ModelProps) {
  return (
    <group>
      {/* Garden Soil Lot */}
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <boxGeometry args={[3.2, 0.24, 2.8]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#4a3d2e'} roughness={0.9} />
      </mesh>
      {/* Raised Planter Crop Beds */}
      {[-0.9, 0, 0.9].map((bx, i) => (
        <group key={i} position={[bx, 0.24, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.6, 0.2, 2.2]} />
            <meshStandardMaterial color="#30261c" roughness={0.9} />
          </mesh>
          {/* Green Vegetative Rows */}
          <mesh position={[0, 0.15, 0]}>
            <boxGeometry args={[0.5, 0.14, 2.0]} />
            <meshStandardMaterial color="#27ae60" roughness={0.6} />
          </mesh>
        </group>
      ))}
      {/* Garden Tool Shed */}
      <mesh position={[1.0, 0.6, -0.8]} castShadow>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#8a532d" roughness={0.7} />
      </mesh>
    </group>
  );
}

// 3. Civic Sports & Recreation Pavilion
export function RecreationCenterModel({ isSelected, level }: ModelProps) {
  return (
    <group>
      {/* Paved Sports Complex Base */}
      <mesh position={[0, 0.2, 0]} receiveShadow>
        <boxGeometry args={[3.6, 0.4, 3.2]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#3d473f'} roughness={0.7} />
      </mesh>
      {/* Geodesic Sports Dome */}
      <mesh position={[-0.5, 0.35, 0]} castShadow>
        <sphereGeometry args={[1.4, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#4a7b9c" roughness={0.2} metalness={0.6} />
      </mesh>
      {/* Outdoor Athletic Court */}
      <mesh position={[1.1, 0.41, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.0, 1.8]} />
        <meshStandardMaterial color="#d35400" />
      </mesh>
    </group>
  );
}

// 4. Aeroponic Bio-Dome (Agricultural Greenhouse)
export function AeroponicBioDomeModel({ isSelected, level }: ModelProps) {
  return (
    <group>
      {/* Base Foundation */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.0, 2.3, 0.6, 12]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#334034'} />
      </mesh>
      {/* Translucent Geodesic Dome */}
      <mesh position={[0, 0.6, 0]}>
        <sphereGeometry args={[1.9, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
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

      {/* Level 4 Development: Satellite Growth Pods */}
      {level >= 4 && (
        <group>
          <mesh position={[1.8, 0.5, 0]}>
            <sphereGeometry args={[0.6, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#94b883" transparent opacity={0.6} />
          </mesh>
          <mesh position={[-1.8, 0.5, 0]}>
            <sphereGeometry args={[0.6, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#94b883" transparent opacity={0.6} />
          </mesh>
        </group>
      )}

      {/* Level 5 Development (Apex Eden Biodome Wonder): Giant Solar Crest & Bioluminescent Flora */}
      {level >= 5 && (
        <group position={[0, 2.5, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.5, 0.08, 12, 24]} />
            <meshStandardMaterial color="#a8e6cf" emissive="#a8e6cf" emissiveIntensity={2.0} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// 5. Algae Synthesis Photobioreactor Basin
export function AlgaeSynthesisBasinModel({ isSelected, level }: ModelProps) {
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

