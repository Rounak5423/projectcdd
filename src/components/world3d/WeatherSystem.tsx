import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameState } from '../../context/GameStateContext';

export type WeatherType = 'clear' | 'overcast' | 'rain' | 'snow';

interface WeatherProps {
  weather?: WeatherType;
}

export default function WeatherSystem({ weather = 'rain' }: WeatherProps) {
  const { isPlaying, speed } = useGameState();
  const rainRef = useRef<THREE.Points>(null);
  const snowRef = useRef<THREE.Points>(null);
  const cloudsRef = useRef<THREE.Group>(null);

  const speedMult = useMemo(() => {
    const map = { '1x': 1, '2x': 2, '5x': 4, '10x': 6 };
    return isPlaying ? (map[speed] || 1) : 0;
  }, [isPlaying, speed]);

  // Rain particle geometry (3,000 drops)
  const { rainPositions, rainVelocities } = useMemo(() => {
    const count = 3000;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 1] = Math.random() * 50 + 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
      velocities[i] = Math.random() * 18 + 25;
    }
    return { rainPositions: positions, rainVelocities: velocities };
  }, []);

  // Snow particle geometry (2,000 flakes)
  const { snowPositions, snowVelocities } = useMemo(() => {
    const count = 2000;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 1] = Math.random() * 45 + 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
      velocities[i] = Math.random() * 4 + 4;
    }
    return { snowPositions: positions, snowVelocities: velocities };
  }, []);

  // Animated particle physics loop
  useFrame((_, delta) => {
    if (speedMult === 0) return;

    // 1. Rain drops
    if (rainRef.current && (weather === 'rain' || weather === 'overcast')) {
      const pos = rainRef.current.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i);
        y -= rainVelocities[i] * delta * Math.min(speedMult, 3);
        if (y < 0.5) {
          y = 52.0;
        }
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }

    // 2. Snow flakes
    if (snowRef.current && weather === 'snow') {
      const pos = snowRef.current.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i);
        let x = pos.getX(i);
        y -= snowVelocities[i] * delta * Math.min(speedMult, 2);
        x += Math.sin(y * 0.1) * delta * 2.0;
        if (y < 0.5) {
          y = 48.0;
        }
        pos.setY(i, y);
        pos.setX(i, x);
      }
      pos.needsUpdate = true;
    }

    // 3. Drifting atmospheric clouds
    if (cloudsRef.current) {
      cloudsRef.current.position.x += 0.8 * delta * speedMult;
      if (cloudsRef.current.position.x > 80) {
        cloudsRef.current.position.x = -80;
      }
    }
  });

  return (
    <group name="weather-atmosphere">
      {/* 1. Volumetric Cloud Layer */}
      <group ref={cloudsRef} position={[-20, 38, -10]}>
        {[-35, -15, 5, 25, 45].map((cx, idx) => (
          <mesh key={idx} position={[cx, Math.sin(idx) * 2, (idx % 2) * 18 - 8]}>
            <boxGeometry args={[18, 3.5, 14]} />
            <meshStandardMaterial
              color="#d9e6eb"
              transparent
              opacity={0.35}
              roughness={1.0}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* 2. Dynamic Rain System */}
      {(weather === 'rain' || weather === 'overcast') && (
        <points ref={rainRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[rainPositions, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            color="#a4c2d1"
            size={0.22}
            transparent
            opacity={0.7}
            depthWrite={false}
          />
        </points>
      )}

      {/* 3. Dynamic Snow System */}
      {weather === 'snow' && (
        <points ref={snowRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[snowPositions, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            color="#ffffff"
            size={0.38}
            transparent
            opacity={0.85}
            depthWrite={false}
          />
        </points>
      )}
    </group>
  );
}
