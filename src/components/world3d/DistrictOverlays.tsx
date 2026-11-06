import React from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGameState } from '../../context/GameStateContext';

export default React.memo(function DistrictOverlays() {
  const { districts, activeLayer } = useGameState();

  if (activeLayer !== 'all' && activeLayer !== 'population' && activeLayer !== 'economy') {
    return null;
  }

  return (
    <group raycast={() => null}>
      {districts.map((dist) => (
        <group key={dist.id} position={[dist.x, 0.16, dist.z]}>
          {/* Subtle Outer Boundary Ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[dist.radius - 0.45, dist.radius, 48]} />
            <meshBasicMaterial
              color={dist.color}
              transparent
              opacity={0.35}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Dotted Inner Ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[dist.radius - 1.2, dist.radius - 1.0, 36]} />
            <meshBasicMaterial
              color={dist.color}
              transparent
              opacity={0.18}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Floating In-World District Name Label */}
          <Text
            position={[0, 0.25, -dist.radius + 2.2]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={1.4}
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
