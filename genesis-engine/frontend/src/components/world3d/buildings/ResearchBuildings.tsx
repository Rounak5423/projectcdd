import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useIsNight } from '../DayNightController';

interface ModelProps {
  isSelected: boolean;
  level: number;
}

// Quantum Observatory (Telescope with spinning quantum rings)
export function ObservatoryModel({ isSelected, level }: ModelProps) {
  const isNight = useIsNight();
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

