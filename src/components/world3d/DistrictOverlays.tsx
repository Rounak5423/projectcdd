import React from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGameState } from '../../context/GameStateContext';

export default React.memo(function DistrictOverlays() {
  const { districts, activeLayer } = useGameState();

  // District overlays only display when explicitly inspecting Population or Economy layers
  // Never active in default 'all' view to ensure a crystal-clear, realistic 3D world view
  if (activeLayer !== 'population' && activeLayer !== 'economy') {
    return null;
  }

  return (
    <group raycast={() => null}>
      {districts.map((dist) => (
        <group key={dist.id} position={[dist.x, 3.2, dist.z]}>
          {/* Elegant Floating Boundary Halo (Above ground to eliminate terrain Z-fighting) */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[dist.radius - 0.3, dist.radius, 64]} />
            <meshBasicMaterial
              color={dist.color}
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          {/* Floating District Label */}
          <Text
            position={[0, 0.4, -dist.radius + 2.0]}
            rotation={[-Math.PI / 3, 0, 0]}
            fontSize={1.6}
            color={dist.color}
            anchorX="center"
            anchorY="middle"
          >
            {dist.name.toUpperCase()}
          </Text>
        </group>
      ))}
    </group>
  );
});
