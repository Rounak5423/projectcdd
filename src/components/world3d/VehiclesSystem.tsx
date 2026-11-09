import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useIsNight } from './DayNightController';
import { useGameState } from '../../context/GameStateContext';
import { getGlobalTrafficSignal } from './RoadNetwork';
import { VehicleCategory, TrafficFlowMetrics } from './cityLifeTypes';

interface VehicleDef {
  id: string;
  name: string;
  category: VehicleCategory;
  color: string;
  routeId: string;
  waypoints: [number, number, number][];
  speed: number;
  length: number;
  isNorthSouth?: boolean;
  isEastWest?: boolean;
  isEmergency?: boolean;
}

// Global traffic metrics singleton for HUD and telemetry
let currentTrafficMetrics: TrafficFlowMetrics = {
  activeVehicles: 12,
  activePedestrians: 36,
  averageSpeedMps: 6.8,
  averageSpeedKph: 24.5,
  trafficFlowEfficiency: 92,
  congestionIndex: 8,
  ambulanceInTransit: true,
};

export function getTrafficFlowMetrics(): TrafficFlowMetrics {
  return currentTrafficMetrics;
}

export function setTrafficFlowMetrics(metrics: Partial<TrafficFlowMetrics>) {
  currentTrafficMetrics = { ...currentTrafficMetrics, ...metrics };
}

function VehiclesSystem() {
  const isNight = useIsNight();
  const { isPlaying, speed: simSpeed, resources } = useGameState();
  const vehiclesRef = useRef<THREE.Group>(null);
  const emergencyStrobeRef = useRef<THREE.PointLight>(null);

  // 12 Realistic Transportation Vehicles with Authoritative Masterplan Waypoints
  const vehicles: VehicleDef[] = useMemo(() => [
    // 1. Commuter Pod (North-South Grand Axis & Civic Loop)
    {
      id: 'veh-ns-commuter',
      name: 'Pioneer Commuter Pod Alpha',
      category: 'commuter',
      color: '#3498db',
      routeId: 'r-ns-main',
      waypoints: [
        [1.2, 0.72, -42.0],
        [1.2, 0.72, -10.5],
        [1.2, 0.85, -3.0],   // Central Citadel Grand Arch Bridge
        [1.2, 0.72, 4.5],
        [12.0, 0.72, 4.5],  // Riverfront Esplanade (East Wing)
        [12.0, 0.72, 24.0], // East Civic Flank Avenue
        [6.0, 0.72, 24.0],  // East throat into Roundabout
        [3.0, 0.85, 27.0],  // Circulating south arc
        [1.2, 0.85, 30.0],  // South throat onto South Boulevard
        [1.2, 0.72, 42.0],
        [-1.2, 0.72, 42.0], // U-turn at south boundary
        [-1.2, 0.85, 30.0], // South throat entering northbound
        [-3.0, 0.85, 27.0],
        [-6.0, 0.72, 24.0], // West throat exiting to West Flank
        [-12.0, 0.72, 24.0],
        [-12.0, 0.72, 4.5], // West Civic Flank Avenue
        [-1.2, 0.72, 4.5],  // Riverfront Esplanade (West Wing)
        [-1.2, 0.85, -3.0], // Central Arch Bridge northbound
        [-1.2, 0.72, -10.5],
        [-1.2, 0.72, -42.0],
      ],
      speed: 7.6,
      length: 1.6,
      isNorthSouth: true,
    },
    // 2. Autonomous Transit Shuttle (North-South Rapid Transit)
    {
      id: 'veh-ns-transit',
      name: 'Metro Autonomous Transit Shuttle 01',
      category: 'shuttle',
      color: '#2980b9',
      routeId: 'r-ns-main',
      waypoints: [
        [1.2, 0.72, -35.0],
        [1.2, 0.85, -3.0],
        [1.2, 0.72, 4.5],
        [-12.0, 0.72, 4.5], // West Wing
        [-12.0, 0.72, 24.0],
        [-6.0, 0.72, 24.0],
        [-3.0, 0.85, 27.0],
        [1.2, 0.85, 30.0],
        [1.2, 0.72, 38.0],
        [-1.2, 0.72, 38.0],
        [-1.2, 0.85, 30.0],
        [3.0, 0.85, 27.0],
        [6.0, 0.72, 24.0],
        [12.0, 0.72, 24.0],
        [12.0, 0.72, 4.5],
        [-1.2, 0.72, 4.5],
        [-1.2, 0.85, -3.0],
        [-1.2, 0.72, -35.0],
      ],
      speed: 6.4,
      length: 2.4,
      isNorthSouth: true,
    },
    // 3. Heavy Freight Hauler (Transverse Arterial Corridor)
    {
      id: 'veh-ew-freight-01',
      name: 'Vulcan Intermodal Hauler 01',
      category: 'hauler',
      color: '#e67e22',
      routeId: 'r-ew-main',
      waypoints: [
        [-24.0, 0.72, 24.6], // West Crossroads
        [-15.0, 0.72, 24.6],
        [-12.0, 0.72, 24.6],
        [-6.0, 0.72, 24.6],  // West throat into Roundabout
        [-3.0, 0.85, 27.0],  // Circulating south arc
        [0, 0.85, 28.25],
        [3.0, 0.85, 27.0],
        [6.0, 0.72, 24.6],   // East throat out to East Parkway
        [12.0, 0.72, 24.6],
        [24.0, 0.72, 24.6],  // East Crossroads
        [24.0, 0.72, 23.4],
        [12.0, 0.72, 23.4],
        [6.0, 0.72, 23.4],   // East throat entering westbound
        [3.0, 0.85, 21.0],   // Circulating north arc
        [0, 0.85, 19.75],
        [-3.0, 0.85, 21.0],
        [-6.0, 0.72, 23.4],  // West throat exiting westbound
        [-12.0, 0.72, 23.4],
        [-24.0, 0.72, 23.4],
      ],
      speed: 7.2,
      length: 2.8,
      isEastWest: true,
    },
    // 4. Commuter Sedan (Science Parkway Corridor)
    {
      id: 'veh-ew-sedan',
      name: 'Science Park Commuter Sedan',
      category: 'commuter',
      color: '#c0392b',
      routeId: 'r-ew-main',
      waypoints: [
        [24.0, 0.72, 23.4],
        [12.0, 0.72, 23.4],
        [6.0, 0.72, 23.4],
        [3.0, 0.85, 21.0],
        [0, 0.85, 19.75],
        [-3.0, 0.85, 21.0],
        [-6.0, 0.72, 23.4],
        [-12.0, 0.72, 23.4],
        [-24.0, 0.72, 23.4],
        [-24.0, 0.72, 24.6],
        [-12.0, 0.72, 24.6],
        [-6.0, 0.72, 24.6],
        [-3.0, 0.85, 27.0],
        [0, 0.85, 28.25],
        [3.0, 0.85, 27.0],
        [6.0, 0.72, 24.6],
        [12.0, 0.72, 24.6],
        [24.0, 0.72, 24.6],
      ],
      speed: 8.0,
      length: 1.5,
      isEastWest: true,
    },
    // 5. West Science Highway Transit Shuttle
    {
      id: 'veh-west-transit',
      name: 'Aethel Ridge Tech Shuttle',
      category: 'shuttle',
      color: '#27ae60',
      routeId: 'r-west-highway',
      waypoints: [
        [-24.4, 0.72, -36.0],
        [-24.4, 0.85, -16.2], // West Suspension Bridge
        [-24.4, 0.72, -2.0],  // Science Observatory Spur junction
        [-33.0, 0.72, -2.0],  // Science Observatory Cul-de-Sac
        [-24.4, 0.72, -2.0],
        [-24.4, 0.72, 24.0],  // West Crossroads
        [-25.6, 0.72, 24.0],
        [-25.6, 0.72, -2.0],
        [-25.6, 0.85, -16.2],
        [-25.6, 0.72, -36.0],
      ],
      speed: 6.8,
      length: 2.2,
    },
    // 6. East Industrial Basin Hauler
    {
      id: 'veh-east-freight',
      name: 'Vulcan Smelter Logistics Transporter',
      category: 'hauler',
      color: '#8e44ad',
      routeId: 'r-east-highway',
      waypoints: [
        [25.0, 0.72, 24.0],  // East Crossroads
        [35.0, 0.72, 24.0],  // Vulcan Heavy Freight Cul-de-Sac
        [25.0, 0.72, 24.0],
        [14.0, 0.72, 24.0],
        [25.0, 0.72, 24.0],
      ],
      speed: 6.5,
      length: 2.8,
    },
    // 7. Elysium Civic Secondary Loop VIP Cruiser
    {
      id: 'veh-forum-vip',
      name: 'High Council Executive Limousine',
      category: 'cruiser',
      color: '#d4af37',
      routeId: 'r-forum-loop',
      waypoints: [
        [-12.0, 0.72, 4.5],  // Northwest corner
        [0, 0.72, 4.5],      // Riverfront Esplanade
        [12.0, 0.72, 4.5],   // Northeast corner
        [12.0, 0.72, 24.0],  // Southeast corner
        [6.0, 0.72, 24.0],   // Roundabout East throat
        [0, 0.85, 28.25],    // Roundabout south arc
        [-6.0, 0.72, 24.0],  // Roundabout West throat
        [-12.0, 0.72, 24.0], // Southwest corner
        [-12.0, 0.72, 4.5],
      ],
      speed: 5.6,
      length: 1.8,
    },
    // 8. Forum Autonomous Sightseeing Trolley
    {
      id: 'veh-forum-trolley',
      name: 'Elysium Forum Autonomous Trolley',
      category: 'shuttle',
      color: '#16a085',
      routeId: 'r-forum-counter',
      waypoints: [
        [12.0, 0.72, 24.0],
        [12.0, 0.72, 4.5],
        [0, 0.72, 4.5],
        [-12.0, 0.72, 4.5],
        [-12.0, 0.72, 24.0],
        [-6.0, 0.72, 24.0],
        [0, 0.85, 19.75],
        [6.0, 0.72, 24.0],
      ],
      speed: 5.0,
      length: 2.1,
    },
    // 9. Oasis Residential Delivery Van
    {
      id: 'veh-res-van',
      name: 'Oasis Terraces Courier Van',
      category: 'commuter',
      color: '#e84393',
      routeId: 'r-res-loop',
      waypoints: [
        [14.0, 0.72, 24.5],  // Branch at East Parkway
        [14.0, 0.72, 31.0],
        [14.0, 0.72, 37.0],  // Oasis Residential Cul-de-Sac
        [14.0, 0.72, 31.0],
        [14.0, 0.72, 24.5],
        [12.0, 0.72, 24.5],
        [14.0, 0.72, 24.5],
      ],
      speed: 5.2,
      length: 1.6,
    },
    // 10. Vulcan Heavy Ore Hauler
    {
      id: 'veh-vulcan-ore',
      name: 'Vulcan Heavy Ore Hauler 02',
      category: 'hauler',
      color: '#d63031',
      routeId: 'r-vulcan-loop',
      waypoints: [
        [25.0, 0.72, 24.0], // East Crossroads
        [35.0, 0.72, 24.0], // Freight Cul-de-Sac
        [25.0, 0.72, 24.0],
        [18.0, 0.72, 24.0],
        [25.0, 0.72, 24.0],
      ],
      speed: 4.8,
      length: 2.9,
    },
    // 11. OASIS EMERGENCY MEDICAL AMBULANCE (Priority Emergency Response)
    {
      id: 'veh-ambulance',
      name: 'Oasis Mobile Cellular Care Ambulance',
      category: 'ambulance',
      color: '#ffffff',
      routeId: 'r-emergency-clinic',
      waypoints: [
        [14.0, 0.72, 37.0],  // Residential Cul-de-Sac
        [14.0, 0.72, 24.0],  // East Parkway Branch
        [12.0, 0.72, 24.0],
        [6.0, 0.72, 24.0],   // Roundabout East throat
        [0, 0.85, 28.25],
        [-6.0, 0.72, 24.0],
        [-12.0, 0.72, 24.0],
        [-12.0, 0.72, 4.5],  // West Civic Flank to Riverfront
        [0, 0.72, 4.5],      // Central Bridge Landing
        [12.0, 0.72, 4.5],
        [12.0, 0.72, 24.0],
        [14.0, 0.72, 24.0],
        [14.0, 0.72, 37.0],
      ],
      speed: 9.2,
      length: 2.1,
      isEmergency: true,
    },
    // 12. Verdant Vale Agrisector Transporter
    {
      id: 'veh-agri-trans',
      name: 'Vale Bio-Produce Delivery Cart',
      category: 'shuttle',
      color: '#2ecc71',
      routeId: 'r-agri-loop',
      waypoints: [
        [-25.0, 0.72, 24.0], // West Crossroads
        [-25.0, 0.72, 31.0],
        [-25.0, 0.72, 37.0], // Agrisector Farm Cul-de-Sac
        [-25.0, 0.72, 31.0],
        [-25.0, 0.72, 24.0],
      ],
      speed: 5.2,
      length: 1.8,
    },
  ], []);

  // Precomputed Route Geometry & Distances
  const routeMetas = useMemo(() => {
    return vehicles.map((v) => {
      const wp = v.waypoints;
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
  }, [vehicles]);

  // Dynamic simulation state refs (zero-allocation frame loop)
  const progressRef = useRef<number[]>(vehicles.map((_, i) => (i * 0.16) % 1.0));
  const currentSpeedsRef = useRef<number[]>(vehicles.map((v) => v.speed));
  const isBrakingRef = useRef<boolean[]>(vehicles.map(() => false));

  useFrame(({ clock }, delta) => {
    if (!isPlaying) return;

    const multMap = { '1x': 1, '2x': 1.4, '5x': 2.0, '10x': 3.0 };
    const mult = multMap[simSpeed] || 1;
    const dt = Math.min(delta, 0.1) * mult;

    const signal = getGlobalTrafficSignal();
    const elapsedTime = clock.getElapsedTime();

    // Pulse emergency strobe beacon for ambulance
    if (emergencyStrobeRef.current) {
      const strobe = Math.sin(elapsedTime * 14.0) > 0 ? 1 : 0;
      emergencyStrobeRef.current.intensity = strobe * (isNight ? 2.5 : 1.2);
    }

    if (!vehiclesRef.current) return;

    let totalVelocity = 0;
    let totalMaxVelocity = 0;

    // 1. First Pass: Compute vehicle positions & detect headway distance
    const positions: [number, number, number][] = [];
    for (let i = 0; i < vehicles.length; i++) {
      const child = vehiclesRef.current.children[i];
      if (child) {
        positions.push([child.position.x, child.position.y, child.position.z]);
      } else {
        positions.push([0, 0, 0]);
      }
    }

    // 2. Second Pass: Kinematics, Collision Spacing, and Traffic Signal Compliance
    vehicles.forEach((veh, idx) => {
      const child = vehiclesRef.current?.children[idx];
      if (!child) return;

      const wp = veh.waypoints;
      const { totalDist, segDists, segAccums } = routeMetas[idx];
      const curX = child.position.x;
      const curZ = child.position.z;

      // --- A. TRAFFIC SIGNAL & JUNCTION INTERACTION ---
      let shouldStopForSignal = false;
      if (!veh.isEmergency) {
        if (veh.isNorthSouth) {
          // Approaching South Crossroads (Z = 24.0)
          const isApproachingSouthCrossNorth = curZ < 21.0 && curZ > 17.5;
          const isApproachingSouthCrossSouth = curZ > 27.0 && curZ < 30.5;
          if ((isApproachingSouthCrossNorth || isApproachingSouthCrossSouth) && !signal.isNorthSouthGreen) {
            shouldStopForSignal = true;
          }
        } else if (veh.isEastWest) {
          // Approaching Central Crossing
          const isApproachingWest = curX < -2.8 && curX > -6.5;
          const isApproachingEast = curX > 2.8 && curX < 6.5;
          if ((isApproachingWest || isApproachingEast) && !signal.isEastWestGreen) {
            shouldStopForSignal = true;
          }
        }
      }

      // --- B. VEHICLE HEADWAY MONITORING (ANTI-COLLISION SPACING) ---
      let headwayLimitSpeed = veh.speed;
      let hasVehicleAhead = false;

      for (let j = 0; j < vehicles.length; j++) {
        if (j === idx) continue;
        const otherPos = positions[j];
        const dist = Math.hypot(otherPos[0] - curX, otherPos[2] - curZ);

        // Check if other vehicle is within forward proximity cone
        if (dist < 6.2) {
          // Angle comparison to ensure other vehicle is actually in front
          const fwdX = Math.sin(child.rotation.y);
          const fwdZ = Math.cos(child.rotation.y);
          const toOtherX = (otherPos[0] - curX) / dist;
          const toOtherZ = (otherPos[2] - curZ) / dist;
          const dot = fwdX * toOtherX + fwdZ * toOtherZ;

          if (dot > 0.65) {
            // Vehicle directly in front!
            hasVehicleAhead = true;
            if (dist < 2.8) {
              headwayLimitSpeed = 0; // Emergency headway stop
            } else {
              const safeSpeedFraction = Math.max(0, (dist - 2.8) / 3.4);
              headwayLimitSpeed = Math.min(headwayLimitSpeed, currentSpeedsRef.current[j] * safeSpeedFraction);
            }
          }
        }
      }

      // --- C. TARGET SPEED INTEGRATION ---
      let targetSpeed = veh.speed;
      if (shouldStopForSignal) {
        targetSpeed = 0;
      } else if (hasVehicleAhead) {
        targetSpeed = Math.min(targetSpeed, headwayLimitSpeed);
      }

      // Smooth physics-inspired acceleration and braking
      const isBraking = targetSpeed < currentSpeedsRef.current[idx] - 0.2;
      isBrakingRef.current[idx] = isBraking;

      const accelRate = targetSpeed < currentSpeedsRef.current[idx] ? 6.5 : 3.8;
      currentSpeedsRef.current[idx] = THREE.MathUtils.lerp(
        currentSpeedsRef.current[idx],
        targetSpeed,
        dt * accelRate
      );

      totalVelocity += currentSpeedsRef.current[idx];
      totalMaxVelocity += veh.speed;

      // Advance progress along route
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

      // Smooth interpolated 3D coordinates
      const posX = THREE.MathUtils.lerp(p1[0], p2[0], segT);
      const posY = THREE.MathUtils.lerp(p1[1], p2[1], segT);
      const posZ = THREE.MathUtils.lerp(p1[2], p2[2], segT);

      child.position.set(posX, posY, posZ);

      // Smooth orientation along movement vector
      const targetAngle = Math.atan2(p2[0] - p1[0], p2[2] - p1[2]);
      let diff = targetAngle - child.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      child.rotation.y += diff * Math.min(1.0, dt * 7.5);
    });

    // Update global traffic flow telemetry
    const avgSpeed = vehicles.length > 0 ? totalVelocity / vehicles.length : 6.0;
    const efficiency = totalMaxVelocity > 0 ? Math.round((totalVelocity / totalMaxVelocity) * 100) : 90;
    setTrafficFlowMetrics({
      activeVehicles: vehicles.length,
      averageSpeedMps: parseFloat(avgSpeed.toFixed(1)),
      averageSpeedKph: parseFloat((avgSpeed * 3.6).toFixed(1)),
      trafficFlowEfficiency: efficiency,
      congestionIndex: 100 - efficiency,
    });
  });

  return (
    <group ref={vehiclesRef} raycast={() => null}>
      {vehicles.map((veh, idx) => (
        <group key={veh.id} position={veh.waypoints[0]}>
          {/* ================= 1. COMMUTER POD / SEDAN ================= */}
          {veh.category === 'commuter' && (
            <group>
              <mesh position={[0, 0.16, 0]}>
                <boxGeometry args={[0.74, 0.36, 1.5]} />
                <meshStandardMaterial color={veh.color} metalness={0.7} roughness={0.25} />
              </mesh>
              {/* Aerodynamic Tinted Glass Canopy */}
              <mesh position={[0, 0.35, 0.05]}>
                <boxGeometry args={[0.58, 0.22, 0.8]} />
                <meshStandardMaterial color="#1a252f" roughness={0.1} metalness={0.9} />
              </mesh>
              {/* Dual Axle Wheels */}
              <mesh position={[-0.38, 0.12, 0.45]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.12, 0.12, 0.08, 12]} />
                <meshStandardMaterial color="#111" roughness={0.9} />
              </mesh>
              <mesh position={[0.38, 0.12, 0.45]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.12, 0.12, 0.08, 12]} />
                <meshStandardMaterial color="#111" roughness={0.9} />
              </mesh>
              <mesh position={[-0.38, 0.12, -0.45]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.12, 0.12, 0.08, 12]} />
                <meshStandardMaterial color="#111" roughness={0.9} />
              </mesh>
              <mesh position={[0.38, 0.12, -0.45]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.12, 0.12, 0.08, 12]} />
                <meshStandardMaterial color="#111" roughness={0.9} />
              </mesh>
            </group>
          )}

          {/* ================= 2. AUTONOMOUS TRANSIT SHUTTLE ================= */}
          {veh.category === 'shuttle' && (
            <group>
              <mesh position={[0, 0.32, 0]}>
                <boxGeometry args={[0.96, 0.62, 2.2]} />
                <meshStandardMaterial color="#2c3e50" metalness={0.5} roughness={0.3} />
              </mesh>
              {/* Continuous Panoramic Glass Windows with Soft Blue Luminescence */}
              <mesh position={[0, 0.38, 0]}>
                <boxGeometry args={[0.98, 0.24, 1.9]} />
                <meshStandardMaterial
                  color="#5dade2"
                  emissive="#5dade2"
                  emissiveIntensity={isNight ? 0.75 : 0.25}
                />
              </mesh>
              {/* Digital Route Display Sign */}
              <mesh position={[0, 0.58, 1.05]}>
                <boxGeometry args={[0.7, 0.08, 0.04]} />
                <meshStandardMaterial color="#000" emissive="#00ffff" emissiveIntensity={1.8} />
              </mesh>
            </group>
          )}

          {/* ================= 3. HEAVY LOGISTICS FREIGHT HAULER ================= */}
          {veh.category === 'hauler' && (
            <group>
              {/* Tractor Driver Cab */}
              <mesh position={[0, 0.28, -0.75]}>
                <boxGeometry args={[1.08, 0.56, 1.2]} />
                <meshStandardMaterial color="#34495e" roughness={0.6} />
              </mesh>
              {/* Intermodal Shipping Freight Container */}
              <mesh position={[0, 0.56, 0.45]}>
                <boxGeometry args={[1.14, 0.8, 2.1]} />
                <meshStandardMaterial color={veh.color} roughness={0.5} />
              </mesh>
              {/* Heavy Axles */}
              <mesh position={[-0.56, 0.14, 0.75]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.14, 0.14, 0.12, 12]} />
                <meshStandardMaterial color="#111" />
              </mesh>
              <mesh position={[0.56, 0.14, 0.75]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.14, 0.14, 0.12, 12]} />
                <meshStandardMaterial color="#111" />
              </mesh>
            </group>
          )}

          {/* ================= 4. EXECUTIVE LUXURY CRUISER ================= */}
          {veh.category === 'cruiser' && (
            <group>
              <mesh position={[0, 0.16, 0]}>
                <boxGeometry args={[0.82, 0.32, 1.75]} />
                <meshStandardMaterial color="#1b1d1f" metalness={0.95} roughness={0.12} />
              </mesh>
              {/* Gold Chrome Roofline Accent */}
              <mesh position={[0, 0.34, 0.05]}>
                <boxGeometry args={[0.65, 0.2, 0.95]} />
                <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.2} />
              </mesh>
            </group>
          )}

          {/* ================= 5. OASIS EMERGENCY MEDICAL AMBULANCE ================= */}
          {veh.category === 'ambulance' && (
            <group>
              {/* Clean White Medical Van Body */}
              <mesh position={[0, 0.34, 0]}>
                <boxGeometry args={[0.92, 0.65, 2.05]} />
                <meshStandardMaterial color="#f8f9fa" roughness={0.3} metalness={0.4} />
              </mesh>
              {/* Emergency Red Reflective Side Stripe */}
              <mesh position={[0, 0.28, 0]}>
                <boxGeometry args={[0.94, 0.14, 1.95]} />
                <meshStandardMaterial color="#e74c3c" emissive="#c0392b" emissiveIntensity={0.6} />
              </mesh>
              {/* Medical Red Cross on Flank */}
              <mesh position={[0.48, 0.42, 0.1]}>
                <planeGeometry args={[0.24, 0.08]} />
                <meshBasicMaterial color="#e74c3c" />
              </mesh>
              <mesh position={[0.48, 0.42, 0.1]}>
                <planeGeometry args={[0.08, 0.24]} />
                <meshBasicMaterial color="#e74c3c" />
              </mesh>

              {/* Roof-Mounted Emergency Strobe Light Bar (Alternating Cyan/Red) */}
              <group position={[0, 0.72, 0.2]}>
                {/* Blue/Cyan Left Strobe */}
                <mesh position={[-0.24, 0, 0]}>
                  <boxGeometry args={[0.18, 0.08, 0.12]} />
                  <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={3.0} />
                </mesh>
                {/* Red Right Strobe */}
                <mesh position={[0.24, 0, 0]}>
                  <boxGeometry args={[0.18, 0.08, 0.12]} />
                  <meshStandardMaterial color="#ff2222" emissive="#ff1111" emissiveIntensity={3.0} />
                </mesh>
              </group>

              {/* Dynamic Emergency Flasher Light Source */}
              <pointLight
                ref={emergencyStrobeRef}
                position={[0, 0.85, 0.2]}
                color="#00e5ff"
                intensity={1.8}
                distance={7.5}
              />
            </group>
          )}

          {/* ================= COMMON VEHICLE LIGHTING ================= */}
          {/* Front Dual LED Headlights */}
          <mesh position={[-0.26, 0.2, 0.76]}>
            <boxGeometry args={[0.12, 0.08, 0.05]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={isNight ? 3.0 : 0.9}
            />
          </mesh>
          <mesh position={[0.26, 0.2, 0.76]}>
            <boxGeometry args={[0.12, 0.08, 0.05]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={isNight ? 3.0 : 0.9}
            />
          </mesh>

          {/* Rear Dual Red Taillights & Active Brake Lamps */}
          <mesh position={[-0.26, 0.2, -0.76]}>
            <boxGeometry args={[0.12, 0.08, 0.05]} />
            <meshStandardMaterial
              color="#ff2222"
              emissive="#ff1111"
              emissiveIntensity={isBrakingRef.current[idx] ? 4.5 : isNight ? 2.5 : 1.0}
            />
          </mesh>
          <mesh position={[0.26, 0.2, -0.76]}>
            <boxGeometry args={[0.12, 0.08, 0.05]} />
            <meshStandardMaterial
              color="#ff2222"
              emissive="#ff1111"
              emissiveIntensity={isBrakingRef.current[idx] ? 4.5 : isNight ? 2.5 : 1.0}
            />
          </mesh>

          {/* Night Dynamic Headlight Projection Spot Cone */}
          {isNight && (
            <spotLight
              position={[0, 0.35, 0.85]}
              target-position={[0, 0, 9]}
              color="#fff8db"
              intensity={0.9}
              distance={8.5}
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
