import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const CouncilLighting: React.FC = () => {
  const chandelierLight1Ref = useRef<THREE.PointLight>(null);
  const chandelierLight2Ref = useRef<THREE.PointLight>(null);
  const throneLightRef = useRef<THREE.SpotLight>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Natural candlelight flicker
    if (chandelierLight1Ref.current) {
      chandelierLight1Ref.current.intensity =
        2.2 + Math.sin(t * 7.3) * 0.12 + Math.cos(t * 13.1) * 0.08;
    }
    if (chandelierLight2Ref.current) {
      chandelierLight2Ref.current.intensity =
        2.2 + Math.cos(t * 8.1) * 0.12 + Math.sin(t * 11.7) * 0.08;
    }
  });

  return (
    <group name="CouncilLighting">
      {/* Soft atmospheric ambient light */}
      <ambientLight color="#2E2822" intensity={0.9} />

      {/* Primary directional sunbeam streaming through high arched windows */}
      <directionalLight
        position={[-9, 14, -3]}
        target-position={[0, 1, 0]}
        color="#FFF4DC"
        intensity={2.4}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={35}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0005}
      />

      {/* Subtle blue-grey bounce from opposite stone wall */}
      <directionalLight
        position={[9, 10, 5]}
        target-position={[0, 1, 0]}
        color="#8B9BAE"
        intensity={0.6}
      />

      {/* Grand Chandelier 1 (North side of table) */}
      <pointLight
        ref={chandelierLight1Ref}
        position={[0, 4.2, -1.2]}
        color="#FFB347"
        intensity={2.2}
        distance={14}
        decay={2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.001}
      />

      {/* Grand Chandelier 2 (South side of table) */}
      <pointLight
        ref={chandelierLight2Ref}
        position={[0, 4.2, 1.2]}
        color="#FFB347"
        intensity={2.2}
        distance={14}
        decay={2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.001}
      />

      {/* Throne Focus Light */}
      <spotLight
        ref={throneLightRef}
        position={[0, 5.5, -2.2]}
        target-position={[0, 1.2, -4.8]}
        color="#FFE6A3"
        intensity={1.8}
        angle={0.6}
        penumbra={0.7}
        distance={12}
        decay={2}
      />

      {/* Wall Candle Sconces (North-West, South-West, North-East, South-East) */}
      <pointLight position={[-4.8, 2.6, -3.5]} color="#FF9A3C" intensity={0.9} distance={6} decay={2} />
      <pointLight position={[-4.8, 2.6, 3.5]} color="#FF9A3C" intensity={0.9} distance={6} decay={2} />
      <pointLight position={[4.8, 2.6, -3.5]} color="#FF9A3C" intensity={0.9} distance={6} decay={2} />
      <pointLight position={[4.8, 2.6, 3.5]} color="#FF9A3C" intensity={0.9} distance={6} decay={2} />
    </group>
  );
};

