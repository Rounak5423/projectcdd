import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function BuildingScaffolding({
  isUpgrading = false,
  width = 3.2,
  height = 3.0,
}: {
  isUpgrading?: boolean;
  width?: number;
  height?: number;
}) {
  const craneRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (craneRef.current) {
      craneRef.current.rotation.y = t * 0.8;
    }
    if (ringRef.current) {
      const pulse = 1.0 + Math.sin(t * 4.0) * 0.08;
      ringRef.current.scale.set(pulse, pulse, 1);
    }
  });

  const scaffoldColor = isUpgrading ? '#f39c12' : '#c6a76a';

  return (
    <group>
      {/* Outer Holographic Scaffolding Box Lattice */}
      <mesh position={[0, height * 0.5, 0]}>
        <boxGeometry args={[width + 0.4, height + 0.4, width + 0.4]} />
        <meshBasicMaterial
          color={scaffoldColor}
          wireframe
          transparent
          opacity={0.45}
        />
      </mesh>

      {/* Rotating Construction Crane Arm */}
      <group ref={craneRef} position={[0, height + 0.2, 0]}>
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 0.8, 6]} />
          <meshStandardMaterial color="#c6a76a" metalness={0.7} />
        </mesh>
        <mesh position={[0.8, 0.8, 0]}>
          <boxGeometry args={[1.8, 0.14, 0.14]} />
          <meshStandardMaterial color="#c6a76a" metalness={0.7} />
        </mesh>
      </group>

      {/* Ground Progress Pulse Ring */}
      <mesh ref={ringRef} position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[width * 0.5 + 0.2, width * 0.5 + 0.45, 32]} />
        <meshBasicMaterial color={scaffoldColor} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

