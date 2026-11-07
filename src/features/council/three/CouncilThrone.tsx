import React, { useMemo } from 'react';
import * as THREE from 'three';

export const CouncilThrone: React.FC = () => {
  const materials = useMemo(() => {
    return {
      daisStone: new THREE.MeshStandardMaterial({
        color: '#282C27',
        roughness: 0.75,
        metalness: 0.1,
      }),
      daisBorder: new THREE.MeshStandardMaterial({
        color: '#C5A66A',
        roughness: 0.35,
        metalness: 0.75,
      }),
      throneGold: new THREE.MeshStandardMaterial({
        color: '#D4AF37',
        roughness: 0.3,
        metalness: 0.85,
      }),
      throneWood: new THREE.MeshStandardMaterial({
        color: '#1B140F',
        roughness: 0.5,
        metalness: 0.1,
      }),
      throneVelvet: new THREE.MeshStandardMaterial({
        color: '#172B1E', // Royal deep imperial green
        roughness: 0.85,
        metalness: 0.15,
      }),
      brazierIron: new THREE.MeshStandardMaterial({
        color: '#1E201E',
        roughness: 0.65,
        metalness: 0.85,
      }),
      brazierFlame: new THREE.MeshBasicMaterial({
        color: '#FFA500',
      }),
    };
  }, []);

  return (
    <group name="SovereignDaisAndThrone" position={[0, 0, -4.8]}>
      {/* 1. Elevated Dais Platform & Steps */}
      {/* Bottom Step */}
      <mesh position={[0, 0.1, 0.4]} receiveShadow material={materials.daisStone}>
        <boxGeometry args={[4.2, 0.2, 2.6]} />
      </mesh>
      {/* Middle Step */}
      <mesh position={[0, 0.25, 0.1]} receiveShadow material={materials.daisStone}>
        <boxGeometry args={[3.6, 0.2, 2.2]} />
      </mesh>
      {/* Top Sovereign Platform */}
      <mesh position={[0, 0.4, -0.2]} receiveShadow material={materials.daisStone}>
        <boxGeometry args={[3.0, 0.2, 1.8]} />
      </mesh>
      {/* Gold Trim Inlay around Top Platform */}
      <mesh position={[0, 0.505, -0.2]} material={materials.daisBorder}>
        <boxGeometry args={[2.95, 0.01, 1.75]} />
      </mesh>
      {/* Dark Marble Center */}
      <mesh position={[0, 0.51, -0.2]} material={materials.daisStone}>
        <boxGeometry args={[2.7, 0.01, 1.5]} />
      </mesh>

      {/* 2. Grand Sovereign Throne (Y starts at 0.51, placed at [0, 0.51, -0.4]) */}
      <group position={[0, 0.51, -0.3]}>
        {/* Plinth Base */}
        <mesh position={[0, 0.1, 0]} castShadow material={materials.throneWood}>
          <boxGeometry args={[1.2, 0.2, 1.0]} />
        </mesh>
        {/* Seat Cushion */}
        <mesh position={[0, 0.28, 0.05]} material={materials.throneVelvet}>
          <boxGeometry args={[0.95, 0.16, 0.8]} />
        </mesh>
        {/* Gold Border around Seat */}
        <mesh position={[0, 0.22, 0.05]} material={materials.throneGold}>
          <boxGeometry args={[1.05, 0.06, 0.9]} />
        </mesh>

        {/* Grand High Backrest */}
        <mesh position={[0, 1.35, -0.38]} castShadow material={materials.throneWood}>
          <boxGeometry args={[1.1, 2.2, 0.14]} />
        </mesh>
        {/* Royal Velvet Back Inset */}
        <mesh position={[0, 1.3, -0.3]} material={materials.throneVelvet}>
          <boxGeometry args={[0.85, 1.8, 0.04]} />
        </mesh>
        {/* Gold Carved Frame around Backrest */}
        <mesh position={[0, 1.35, -0.32]} material={materials.throneGold}>
          <boxGeometry args={[1.0, 2.05, 0.02]} />
        </mesh>

        {/* Imperial Crown Apex at Top of Throne */}
        <group position={[0, 2.55, -0.38]}>
          <mesh material={materials.throneGold}>
            <cylinderGeometry args={[0.22, 0.18, 0.24, 16]} />
          </mesh>
          <mesh position={[0, 0.18, 0]} material={materials.throneGold}>
            <sphereGeometry args={[0.08, 12, 12]} />
          </mesh>
        </group>

        {/* Carved Lion Armrests */}
        <mesh position={[-0.52, 0.65, 0.05]} castShadow material={materials.throneWood}>
          <boxGeometry args={[0.15, 0.12, 0.85]} />
        </mesh>
        <mesh position={[0.52, 0.65, 0.05]} castShadow material={materials.throneWood}>
          <boxGeometry args={[0.15, 0.12, 0.85]} />
        </mesh>
        {/* Gold Armrest Terminals */}
        <mesh position={[-0.52, 0.72, 0.44]} material={materials.throneGold}>
          <sphereGeometry args={[0.07, 12, 12]} />
        </mesh>
        <mesh position={[0.52, 0.72, 0.44]} material={materials.throneGold}>
          <sphereGeometry args={[0.07, 12, 12]} />
        </mesh>

        {/* Throne Footstool */}
        <mesh position={[0, 0.08, 0.62]} castShadow material={materials.throneVelvet}>
          <boxGeometry args={[0.65, 0.12, 0.35]} />
        </mesh>
        <mesh position={[0, 0.03, 0.62]} material={materials.throneGold}>
          <boxGeometry args={[0.72, 0.04, 0.4]} />
        </mesh>
      </group>

      {/* 3. Flanking Ceremonial Imperial Standards & Braziers */}
      {/* West Brazier Urn */}
      <group position={[-1.6, 0.51, -0.2]}>
        <mesh position={[0, 0.35, 0]} material={materials.brazierIron}>
          <cylinderGeometry args={[0.24, 0.14, 0.7, 12]} />
        </mesh>
        <mesh position={[0, 0.72, 0]} material={materials.brazierFlame}>
          <sphereGeometry args={[0.12, 8, 8]} />
        </mesh>
      </group>

      {/* East Brazier Urn */}
      <group position={[1.6, 0.51, -0.2]}>
        <mesh position={[0, 0.35, 0]} material={materials.brazierIron}>
          <cylinderGeometry args={[0.24, 0.14, 0.7, 12]} />
        </mesh>
        <mesh position={[0, 0.72, 0]} material={materials.brazierFlame}>
          <sphereGeometry args={[0.12, 8, 8]} />
        </mesh>
      </group>
    </group>
  );
};

