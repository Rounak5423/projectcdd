import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameState } from '../../context/GameStateContext';

interface Pedestrian {
  id: number;
  axis: 'x' | 'z';
  fixedCoord: number;
  start: number;
  end: number;
  current: number;
  speed: number;
  dir: number;
  color: string;
  hasUmbrella: boolean;
}

export default function PedestriansSystem({ isRaining = false }: { isRaining?: boolean }) {
  const { isPlaying, speed } = useGameState();
  const groupRef = useRef<THREE.Group>(null);

  const speedMult = useMemo(() => {
    const map = { '1x': 1, '2x': 2, '5x': 4, '10x': 6 };
    return isPlaying ? (map[speed] || 1) : 0;
  }, [isPlaying, speed]);

  const peds = useMemo<Pedestrian[]>(() => {
    const list: Pedestrian[] = [];
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#ecf0f1'];

    // 40 pedestrians along North-South sidewalks (x = 2.2 and x = -2.2)
    for (let i = 0; i < 30; i++) {
      const fixedX = i % 2 === 0 ? 2.2 : -2.2;
      const startZ = -35 + (i * 2.3);
      list.push({
        id: i,
        axis: 'z',
        fixedCoord: fixedX,
        start: -38,
        end: 38,
        current: startZ,
        speed: 1.8 + (i % 5) * 0.3,
        dir: i % 2 === 0 ? 1 : -1,
        color: colors[i % colors.length],
        hasUmbrella: i % 3 === 0,
      });
    }

    // 30 pedestrians along East-West sidewalks (z = 2.2 and z = -2.2)
    for (let i = 0; i < 30; i++) {
      const fixedZ = i % 2 === 0 ? 2.2 : -2.2;
      const startX = -35 + (i * 2.3);
      list.push({
        id: 30 + i,
        axis: 'x',
        fixedCoord: fixedZ,
        start: -38,
        end: 38,
        current: startX,
        speed: 1.7 + (i % 4) * 0.35,
        dir: i % 2 === 0 ? 1 : -1,
        color: colors[(i + 3) % colors.length],
        hasUmbrella: i % 2 === 0,
      });
    }

    return list;
  }, []);

  useFrame((state, delta) => {
    if (speedMult === 0 || !groupRef.current) return;

    const time = state.clock.getElapsedTime();
    const children = groupRef.current.children;

    for (let i = 0; i < peds.length; i++) {
      const p = peds[i];
      const child = children[i];
      if (!child) continue;

      p.current += p.dir * p.speed * delta * speedMult;
      if (p.current > p.end) {
        p.current = p.start;
      } else if (p.current < p.start) {
        p.current = p.end;
      }

      const bobbing = Math.sin(time * 8.0 + i) * 0.05;
      if (p.axis === 'z') {
        child.position.set(p.fixedCoord, 0.75 + bobbing, p.current);
        child.rotation.y = p.dir > 0 ? 0 : Math.PI;
      } else {
        child.position.set(p.current, 0.75 + bobbing, p.fixedCoord);
        child.rotation.y = p.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      }
    }
  });

  return (
    <group ref={groupRef} name="pedestrians-layer">
      {peds.map((p) => (
        <group key={p.id}>
          {/* Torso */}
          <mesh position={[0, 0.25, 0]}>
            <boxGeometry args={[0.22, 0.35, 0.16]} />
            <meshStandardMaterial color={p.color} roughness={0.7} />
          </mesh>
          {/* Head */}
          <mesh position={[0, 0.52, 0]}>
            <sphereGeometry args={[0.1, 10, 10]} />
            <meshStandardMaterial color="#faecd0" roughness={0.5} />
          </mesh>
          {/* Umbrella if raining */}
          {isRaining && p.hasUmbrella && (
            <group position={[0, 0.72, 0]}>
              <mesh rotation={[0, 0, 0]}>
                <coneGeometry args={[0.38, 0.18, 12]} />
                <meshStandardMaterial color="#1a252c" roughness={0.4} />
              </mesh>
              <mesh position={[0, -0.15, 0]}>
                <cylinderGeometry args={[0.015, 0.015, 0.32, 6]} />
                <meshStandardMaterial color="#888888" metalness={0.8} />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </group>
  );
}
