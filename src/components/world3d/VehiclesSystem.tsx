import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useIsNight } from './DayNightController';
import { useGameState } from '../../context/GameStateContext';
import { getGlobalTrafficSignal } from './RoadNetwork';

interface VehicleRoute {
  id: string;
  waypoints: [number, number, number][];
  speed: number;
  color: string;
  type: 'commuter' | 'shuttle' | 'hauler' | 'cruiser';
  isNorthSouth?: boolean;
  isEastWest?: boolean;
}

function VehiclesSystem() {
  const isNight = useIsNight();
  const { isPlaying, speed: simSpeed } = useGameState();
  const vehiclesRef = useRef<THREE.Group>(null);

  // 8 Diverse Transportation Routes
  const routes: VehicleRoute[] = useMemo(() => [
    {
      id: 'r1-ns-corridor',
      // North-South Arterial Corridor (Citadel to Oasis Terraces across Central Bridge)
      waypoints: [
        [1.1, 0.65, -42],
        [1.1, 0.65, -14],
        [1.1, 0.65, -5.5], // North Approach Stop line
        [1.1, 0.65, -3.0], // Crossing
        [1.1, 0.75, 0],
        [1.1, 0.65, 8],
        [1.1, 0.65, 42],
        [-1.1, 0.65, 42],
        [-1.1, 0.65, 8],
        [-1.1, 0.65, 5.5], // South Approach Stop line
        [-1.1, 0.75, 0],
        [-1.1, 0.65, -14],
        [-1.1, 0.65, -42],
      ],
      speed: 7.8,
      color: '#3498db',
      type: 'commuter',
      isNorthSouth: true,
    },
    {
      id: 'r2-ew-corridor',
      // East-West Arterial Corridor (Science Park to Industrial Basin)
      waypoints: [
        [-42, 0.65, 1.1],
        [-16, 0.65, 1.1],
        [-5.5, 0.65, 1.1], // West Approach Stop line
        [0, 0.65, 1.1],
        [18, 0.65, 1.1],
        [42, 0.65, 1.1],
        [42, 0.65, -1.1],
        [18, 0.65, -1.1],
        [5.5, 0.65, -1.1], // East Approach Stop line
        [0, 0.65, -1.1],
        [-16, 0.65, -1.1],
        [-42, 0.65, -1.1],
      ],
      speed: 8.5,
      color: '#e67e22',
      type: 'hauler',
      isEastWest: true,
    },
    {
      id: 'r3-west-highway',
      // West Science Highway (Science Park via West Bridge to South Agrisector)
      waypoints: [
        [-25, 0.65, -36],
        [-25, 0.75, -16.2], // West Suspension Bridge
        [-25, 0.65, 0],
        [-25, 0.65, 28],
        [-23.6, 0.65, 28],
        [-23.6, 0.65, 0],
        [-23.6, 0.75, -16.2],
        [-23.6, 0.65, -36],
      ],
      speed: 7.2,
      color: '#2ecc71',
      type: 'shuttle',
    },
    {
      id: 'r4-east-expressway',
      // East Industrial Expressway (Vulcan Basin via East Bridge to Oasis Terraces)
      waypoints: [
        [25, 0.65, -36],
        [25, 0.65, 0],
        [25, 0.75, 8.0], // East Truss Bridge
        [25, 0.65, 36],
        [23.6, 0.65, 36],
        [23.6, 0.75, 8.0],
        [23.6, 0.65, 0],
        [23.6, 0.65, -36],
      ],
      speed: 7.4,
      color: '#9b59b6',
      type: 'hauler',
    },
    {
      id: 'r5-citadel-ring',
      // Citadel Grand Boulevard Inner Ring Promenade (Clockwise circuit)
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
      speed: 5.6,
      color: '#f1c40f',
      type: 'cruiser',
    },
    {
      id: 'r6-citadel-counter',
      // Citadel Boulevard Ring (Counter-Clockwise VIP Shuttle)
      waypoints: [
        [0, 0.75, 14.6],
        [10.3, 0.75, 10.3],
        [14.6, 0.75, 0],
        [10.3, 0.75, -10.3],
        [0, 0.75, -14.6],
        [-10.3, 0.75, -10.3],
        [-14.6, 0.75, 0],
        [-10.3, 0.75, 10.3],
      ],
      speed: 5.4,
      color: '#1abc9c',
      type: 'commuter',
    },
    {
      id: 'r7-oasis-residential',
      // Oasis Terraces Residential Loop (Habitat Blocks to Cellular Care Clinic)
      waypoints: [
        [18, 0.65, 18],
        [24, 0.65, 18],
        [24, 0.65, 32],
        [18, 0.65, 32],
      ],
      speed: 5.0,
      color: '#e84393',
      type: 'commuter',
    },
    {
      id: 'r8-vulcan-heavy-freight',
      // Vulcan Forge Basin Ore Freight Shuttle
      waypoints: [
        [32, 0.65, -14],
        [26, 0.65, -14],
        [26, 0.65, -26],
        [32, 0.65, -26],
      ],
      speed: 4.8,
      color: '#d63031',
      type: 'hauler',
    },
  ], []);

  // Precomputed Route Metrics for Zero-Allocation Frame Loop
  const routeMetas = useMemo(() => {
    return routes.map((route) => {
      const wp = route.waypoints;
      let totalDist = 0;
      const segDists: number[] = [];
      const segAccums: number[] = [];
      for (let i = 0; i < wp.length; i++) {
        const next = wp[(i + 1) % wp.length];
        const dist = Math.hypot(next[0] - wp[i][0], next[2] - wp[i][2]);
        segDists.push(dist);
        segAccums.push(totalDist);
        totalDist += dist;
      }
      return { totalDist, segDists, segAccums };
    });
  }, [routes]);

  // Distance progresses & current speeds
  const progressRef = useRef<number[]>(routes.map((_, i) => i * 0.14));
  const currentSpeedsRef = useRef<number[]>(routes.map((r) => r.speed));

  useFrame((_, delta) => {
    if (!isPlaying) return;

    const multMap = { '1x': 1, '2x': 1.4, '5x': 2.0, '10x': 3.0 };
    const mult = multMap[simSpeed] || 1;
    const dt = delta * mult;

    const signal = getGlobalTrafficSignal();

    if (!vehiclesRef.current) return;

    routes.forEach((route, idx) => {
      const child = vehiclesRef.current?.children[idx];
      if (!child) return;

      const wp = route.waypoints;
      const { totalDist, segDists, segAccums } = routeMetas[idx];

      // Check current vehicle position
      const curX = child.position.x;
      const curZ = child.position.z;

      // Traffic Signal Compliance Logic:
      let shouldStop = false;

      if (route.isNorthSouth) {
        // Approaching central 4-way intersection from North or South
        const isApproachingFromNorth = curZ < -4.8 && curZ > -7.8;
        const isApproachingFromSouth = curZ > 4.8 && curZ < 7.8;
        if ((isApproachingFromNorth || isApproachingFromSouth) && !signal.isNorthSouthGreen) {
          shouldStop = true;
        }
      } else if (route.isEastWest) {
        // Approaching central 4-way intersection from West or East
        const isApproachingFromWest = curX < -4.8 && curX > -7.8;
        const isApproachingFromEast = curX > 4.8 && curX < 7.8;
        if ((isApproachingFromWest || isApproachingFromEast) && !signal.isEastWestGreen) {
          shouldStop = true;
        }
      }

      // Smooth deceleration / acceleration
      const targetSpeed = shouldStop ? 0 : route.speed;
      currentSpeedsRef.current[idx] = THREE.MathUtils.lerp(
        currentSpeedsRef.current[idx],
        targetSpeed,
        dt * 4.0
      );

      // Advance parametric route progress
      progressRef.current[idx] =
        (progressRef.current[idx] + (currentSpeedsRef.current[idx] * dt) / totalDist) % 1.0;
      const targetDist = progressRef.current[idx] * totalDist;

      // Find current waypoint segment via precomputed cumulative distances
      let segIdx = 0;
      for (let i = segDists.length - 1; i >= 0; i--) {
        if (targetDist >= segAccums[i]) {
          segIdx = i;
          break;
        }
      }
      const accum = segAccums[segIdx];

      const p1 = wp[segIdx];
      const p2 = wp[(segIdx + 1) % wp.length];
      const segT = (targetDist - accum) / (segDists[segIdx] || 1);

      // Interpolate 3D coordinates
      const posX = THREE.MathUtils.lerp(p1[0], p2[0], segT);
      const posY = THREE.MathUtils.lerp(p1[1], p2[1], segT);
      const posZ = THREE.MathUtils.lerp(p1[2], p2[2], segT);

      child.position.set(posX, posY, posZ);

      // Smooth orientation along movement vector
      const targetAngle = Math.atan2(p2[0] - p1[0], p2[2] - p1[2]);
      // Slerp rotation
      child.rotation.y = THREE.MathUtils.lerp(child.rotation.y, targetAngle, dt * 6.0);
    });
  });

  return (
    <group ref={vehiclesRef} raycast={() => null}>
      {routes.map((route, idx) => (
        <group key={route.id} position={route.waypoints[0]}>
          {/* Commuter Pod */}
          {route.type === 'commuter' && (
            <group>
              <mesh position={[0, 0.16, 0]}>
                <boxGeometry args={[0.72, 0.36, 1.45]} />
                <meshStandardMaterial color={route.color} metalness={0.8} roughness={0.2} />
              </mesh>
              {/* Tinted Aerodynamic Glass Canopy */}
              <mesh position={[0, 0.34, 0.08]}>
                <boxGeometry args={[0.56, 0.22, 0.75]} />
                <meshStandardMaterial color="#1f2c3d" roughness={0.1} metalness={0.9} />
              </mesh>
            </group>
          )}

          {/* Luxury Executive Cruiser */}
          {route.type === 'cruiser' && (
            <group>
              <mesh position={[0, 0.15, 0]}>
                <boxGeometry args={[0.78, 0.32, 1.6]} />
                <meshStandardMaterial color={route.color} metalness={0.9} roughness={0.15} />
              </mesh>
              <mesh position={[0, 0.32, 0.05]}>
                <boxGeometry args={[0.62, 0.2, 0.85]} />
                <meshStandardMaterial color="#c6a76a" metalness={0.8} roughness={0.2} />
              </mesh>
            </group>
          )}

          {/* Autonomous Transit Shuttle */}
          {route.type === 'shuttle' && (
            <group>
              <mesh position={[0, 0.28, 0]}>
                <boxGeometry args={[0.92, 0.58, 2.1]} />
                <meshStandardMaterial color="#34495e" metalness={0.5} roughness={0.3} />
              </mesh>
              <mesh position={[0, 0.34, 0]}>
                <boxGeometry args={[0.94, 0.22, 1.8]} />
                <meshStandardMaterial
                  color="#5dade2"
                  emissive="#5dade2"
                  emissiveIntensity={isNight ? 0.6 : 0.2}
                />
              </mesh>
            </group>
          )}

          {/* Heavy Logistics Hauler */}
          {route.type === 'hauler' && (
            <group>
              {/* Tractor Cab */}
              <mesh position={[0, 0.24, -0.6]}>
                <boxGeometry args={[1.05, 0.5, 1.2]} />
                <meshStandardMaterial color="#42392f" roughness={0.7} />
              </mesh>
              {/* Intermodal Freight Container */}
              <mesh position={[0, 0.5, 0.45]}>
                <boxGeometry args={[1.1, 0.72, 1.9]} />
                <meshStandardMaterial color={route.color} roughness={0.5} />
              </mesh>
            </group>
          )}

          {/* Front Dual LED Headlights */}
          <mesh position={[-0.24, 0.2, 0.75]}>
            <boxGeometry args={[0.12, 0.08, 0.05]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={isNight ? 2.8 : 0.8}
            />
          </mesh>
          <mesh position={[0.24, 0.2, 0.75]}>
            <boxGeometry args={[0.12, 0.08, 0.05]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={isNight ? 2.8 : 0.8}
            />
          </mesh>

          {/* Rear Dual Red Taillights & Brake Lamps */}
          <mesh position={[-0.24, 0.2, -0.75]}>
            <boxGeometry args={[0.12, 0.08, 0.05]} />
            <meshStandardMaterial
              color="#ff2222"
              emissive="#ff1111"
              emissiveIntensity={isNight ? 3.0 : 1.0}
            />
          </mesh>
          <mesh position={[0.24, 0.2, -0.75]}>
            <boxGeometry args={[0.12, 0.08, 0.05]} />
            <meshStandardMaterial
              color="#ff2222"
              emissive="#ff1111"
              emissiveIntensity={isNight ? 3.0 : 1.0}
            />
          </mesh>

          {/* Night Dynamic Headlight Projection Cone */}
          {isNight && (
            <spotLight
              position={[0, 0.35, 0.85]}
              target-position={[0, 0, 9]}
              color="#fff8db"
              intensity={0.85}
              distance={8.0}
              angle={0.55}
              penumbra={0.6}
            />
          )}
        </group>
      ))}
    </group>
  );
}

export default React.memo(VehiclesSystem);
