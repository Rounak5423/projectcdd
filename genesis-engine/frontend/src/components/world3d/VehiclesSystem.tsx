import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useDayNight } from './DayNightController';
import { useGameState } from '../../context/GameStateContext';

interface VehicleRoute {
  waypoints: [number, number, number][];
  speed: number;
  color: string;
  type: 'commuter' | 'shuttle' | 'hauler';
}

export default function VehiclesSystem() {
  const { isNight } = useDayNight();
  const { isPlaying, speed: simSpeed } = useGameState();
  const vehiclesRef = useRef<THREE.Group>(null);

  // Define 6 autonomous transit routes along roads & bridges
  const routes: VehicleRoute[] = useMemo(() => [
    {
      // Route 1: North-South Main Bridge Corridor (Central Citadel to Oasis Terraces)
      waypoints: [
        [0.8, 0.65, -40],
        [0.8, 0.65, -12],
        [0.8, 0.75, -3], // across Central Bridge
        [0.8, 0.65, 8],
        [0.8, 0.65, 38],
        [-0.8, 0.65, 38],
        [-0.8, 0.65, 8],
        [-0.8, 0.75, -3], // return
        [-0.8, 0.65, -12],
        [-0.8, 0.65, -40],
      ],
      speed: 7.5,
      color: '#3498db',
      type: 'commuter',
    },
    {
      // Route 2: East-West Arterial Corridor (Science Park to Industrial Basin)
      waypoints: [
        [-40, 0.65, 0.8],
        [-15, 0.65, 0.8],
        [0, 0.65, 0.8],
        [20, 0.65, 0.8],
        [40, 0.65, 0.8],
        [40, 0.65, -0.8],
        [20, 0.65, -0.8],
        [0, 0.65, -0.8],
        [-15, 0.65, -0.8],
        [-40, 0.65, -0.8],
      ],
      speed: 8.2,
      color: '#e67e22',
      type: 'hauler',
    },
    {
      // Route 3: West Science Highway (Science Park via West Bridge to South Agri)
      waypoints: [
        [-25, 0.65, -35],
        [-25, 0.75, -16.2], // West Bridge
        [-25, 0.65, 0],
        [-25, 0.65, 25],
        [-23.6, 0.65, 25],
        [-23.6, 0.65, 0],
        [-23.6, 0.75, -16.2],
        [-23.6, 0.65, -35],
      ],
      speed: 6.8,
      color: '#2ecc71',
      type: 'shuttle',
    },
    {
      // Route 4: East Industrial & Residential Connector via East Bridge
      waypoints: [
        [25, 0.65, -35],
        [25, 0.65, 0],
        [25, 0.75, 8.0], // East Bridge
        [25, 0.65, 35],
        [23.6, 0.65, 35],
        [23.6, 0.75, 8.0],
        [23.6, 0.65, 0],
        [23.6, 0.65, -35],
      ],
      speed: 7.0,
      color: '#9b59b6',
      type: 'hauler',
    },
    {
      // Route 5: Citadel Boulevard Inner Ring Circuit (Clockwise)
      waypoints: [
        [0, 0.75, -14.6],
        [10.3, 0.75, -10.3],
        [14.6, 0.75, 0],
        [10.3, 0.75, 10.3],
        [0, 0.75, 14.6],
        [-10.3, 0.75, 10.3],
        [-14.6, 0.75, 0],
        [-10.3, 0.75, -10.3],
      ],
      speed: 5.5,
      color: '#f1c40f',
      type: 'commuter',
    },
    {
      // Route 6: Heavy Cargo Transporter (Industrial Basin to Central Citadel)
      waypoints: [
        [32, 0.65, -16],
        [25, 0.65, -16],
        [25, 0.65, 0],
        [14, 0.75, 0],
        [25, 0.65, 0],
        [25, 0.65, -16],
      ],
      speed: 5.0,
      color: '#e74c3c',
      type: 'hauler',
    },
  ], []);

  // Track parametric distances along each route
  const progressRef = useRef<number[]>(routes.map((_, i) => i * 0.18));

  useFrame((_, delta) => {
    if (!isPlaying) return;

    const multMap = { '1x': 1, '2x': 1.4, '5x': 2.0, '10x': 3.0 };
    const mult = multMap[simSpeed] || 1;
    const dt = delta * mult;

    if (!vehiclesRef.current) return;

    routes.forEach((route, idx) => {
      const child = vehiclesRef.current?.children[idx];
      if (!child) return;

      const wp = route.waypoints;
      // Calculate total path distance
      let totalDist = 0;
      const segDists: number[] = [];
      for (let i = 0; i < wp.length; i++) {
        const next = wp[(i + 1) % wp.length];
        const dist = Math.hypot(next[0] - wp[i][0], next[2] - wp[i][2]);
        segDists.push(dist);
        totalDist += dist;
      }

      // Advance progress
      progressRef.current[idx] = (progressRef.current[idx] + (route.speed * dt) / totalDist) % 1.0;
      const targetDist = progressRef.current[idx] * totalDist;

      // Find current segment
      let accum = 0;
      let segIdx = 0;
      for (let i = 0; i < segDists.length; i++) {
        if (accum + segDists[i] >= targetDist) {
          segIdx = i;
          break;
        }
        accum += segDists[i];
      }

      const p1 = wp[segIdx];
      const p2 = wp[(segIdx + 1) % wp.length];
      const segT = (targetDist - accum) / (segDists[segIdx] || 1);

      // Interpolate position
      const curX = THREE.MathUtils.lerp(p1[0], p2[0], segT);
      const curY = THREE.MathUtils.lerp(p1[1], p2[1], segT);
      const curZ = THREE.MathUtils.lerp(p1[2], p2[2], segT);

      child.position.set(curX, curY, curZ);

      // Orient forward
      const angle = Math.atan2(p2[0] - p1[0], p2[2] - p1[2]);
      child.rotation.y = angle;
    });
  });

  return (
    <group ref={vehiclesRef}>
      {routes.map((route, idx) => (
        <group key={idx} position={route.waypoints[0]}>
          {/* Vehicle Body according to type */}
          {route.type === 'commuter' && (
            <group>
              {/* Sleek Aerodynamic Pod Chassis */}
              <mesh position={[0, 0.15, 0]} castShadow>
                <boxGeometry args={[0.7, 0.35, 1.4]} />
                <meshStandardMaterial color={route.color} metalness={0.8} roughness={0.2} />
              </mesh>
              {/* Cockpit Canopy */}
              <mesh position={[0, 0.32, 0.1]}>
                <boxGeometry args={[0.55, 0.22, 0.7]} />
                <meshStandardMaterial color="#1f2c3d" roughness={0.1} metalness={0.9} />
              </mesh>
            </group>
          )}

          {route.type === 'shuttle' && (
            <group>
              {/* Autonomous Transit Shuttle */}
              <mesh position={[0, 0.25, 0]} castShadow>
                <boxGeometry args={[0.9, 0.55, 2.0]} />
                <meshStandardMaterial color="#34495e" metalness={0.5} roughness={0.3} />
              </mesh>
              {/* Tinted panoramic window strip */}
              <mesh position={[0, 0.32, 0]}>
                <boxGeometry args={[0.92, 0.2, 1.7]} />
                <meshStandardMaterial color="#5dade2" emissive="#5dade2" emissiveIntensity={0.2} />
              </mesh>
            </group>
          )}

          {route.type === 'hauler' && (
            <group>
              {/* Heavy Cargo Hauler */}
              <mesh position={[0, 0.22, -0.5]} castShadow>
                <boxGeometry args={[1.0, 0.45, 1.2]} />
                <meshStandardMaterial color="#473e34" roughness={0.7} />
              </mesh>
              {/* Container crate */}
              <mesh position={[0, 0.45, 0.4]} castShadow>
                <boxGeometry args={[1.05, 0.65, 1.8]} />
                <meshStandardMaterial color={route.color} roughness={0.6} />
              </mesh>
            </group>
          )}

          {/* Front Glowing Headlights */}
          <mesh position={[-0.22, 0.18, 0.7]}>
            <boxGeometry args={[0.12, 0.08, 0.05]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={isNight ? 2.5 : 0.8}
            />
          </mesh>
          <mesh position={[0.22, 0.18, 0.7]}>
            <boxGeometry args={[0.12, 0.08, 0.05]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={isNight ? 2.5 : 0.8}
            />
          </mesh>

          {/* Rear Glowing Taillights */}
          <mesh position={[-0.22, 0.18, -0.7]}>
            <boxGeometry args={[0.12, 0.08, 0.05]} />
            <meshStandardMaterial
              color="#ff2222"
              emissive="#ff1111"
              emissiveIntensity={isNight ? 3.0 : 1.0}
            />
          </mesh>
          <mesh position={[0.22, 0.18, -0.7]}>
            <boxGeometry args={[0.12, 0.08, 0.05]} />
            <meshStandardMaterial
              color="#ff2222"
              emissive="#ff1111"
              emissiveIntensity={isNight ? 3.0 : 1.0}
            />
          </mesh>

          {/* Subtle Headlight Projection in Night Mode */}
          {isNight && (
            <spotLight
              position={[0, 0.3, 0.8]}
              target-position={[0, 0, 8]}
              color="#fff8db"
              intensity={0.8}
              distance={7.0}
              angle={0.5}
              penumbra={0.6}
            />
          )}
        </group>
      ))}
    </group>
  );
}

