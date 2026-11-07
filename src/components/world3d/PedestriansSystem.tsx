import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useIsNight, useDayNight } from './DayNightController';
import { useGameState } from '../../context/GameStateContext';
import { getTerrainHeight } from './Terrain';
import { getGlobalTrafficSignal } from './RoadNetwork';
import {
  CitizenArchetype,
  PedestrianAgent,
  PedestrianPath,
  PedestrianPathNode,
} from './cityLifeTypes';
import { setTrafficFlowMetrics } from './VehiclesSystem';

// ================= COLOR PALETTES FOR ARCHETYPES =================
const CLOTHING_PALETTES: Record<CitizenArchetype, string[]> = {
  casual: ['#3498db', '#e67e22', '#2ecc71', '#e74c3c', '#9b59b6', '#34495e', '#f39c12', '#16a085'],
  executive: ['#1e272c', '#2c3e50', '#c6a76a', '#34495e', '#4a4e69', '#222222'],
  medical: ['#00b4d8', '#48cae4', '#90e0ef', '#e0fbfc', '#2ec4b6', '#ffffff'],
  student: ['#e76f51', '#f4a261', '#2a9d8f', '#457b9d', '#1d3557', '#d62828'],
  worker: ['#f39c12', '#e67e22', '#d35400', '#2c3e50', '#7f8c8d'],
  scientist: ['#e0fbfc', '#98c1d9', '#ee6c4d', '#293241', '#3d5a80', '#ffffff'],
};

const SKIN_TONES = ['#f5d0b5', '#e8b996', '#c68642', '#8d5524', '#603d24'];

// ================= MASTER PEDESTRIAN PATHWAYS =================
const PEDESTRIAN_PATHS: PedestrianPath[] = [
  // 1. Elysium Grand Civic Forum Promenade Loop (Civic & Fountain)
  {
    id: 'path-forum-promenade',
    name: 'Elysium Forum Civic Promenade',
    districtId: 'dist-citadel',
    isLoop: true,
    nodes: [
      { x: -5.5, z: 6.2, districtId: 'dist-citadel' },
      { x: 0, z: 6.2, isCrossing: true, crossingDirection: 'EW', description: 'Forum North Zebra Crossing' },
      { x: 5.5, z: 6.2, districtId: 'dist-citadel' },
      { x: 6.6, z: 9.5, districtId: 'dist-citadel' },
      { x: 6.6, z: 14.5, districtId: 'dist-citadel' },
      { x: 5.5, z: 18.0, districtId: 'dist-citadel' },
      { x: 0, z: 18.0, isCrossing: true, crossingDirection: 'EW', description: 'Forum South Zebra Crossing' },
      { x: -5.5, z: 18.0, districtId: 'dist-citadel' },
      { x: -6.6, z: 14.5, districtId: 'dist-citadel' },
      { x: -6.6, z: 9.5, districtId: 'dist-citadel' },
    ],
  },
  // 2. Central River Bridge Scenic Sidewalk (North Parkway to Forum)
  {
    id: 'path-bridge-sidewalk',
    name: 'Central Bridge Pedestrian Deck',
    districtId: 'dist-citadel',
    isLoop: true,
    nodes: [
      { x: 3.1, z: 5.8, districtId: 'dist-citadel' },
      { x: 3.1, z: 0.0, description: 'Central Bridge Overlook East' },
      { x: 3.1, z: -9.5, description: 'Bridge North Abutment' },
      { x: 4.5, z: -18.0, districtId: 'dist-citadel', description: 'Biosphere Park Pathway' },
      { x: -4.5, z: -18.0, districtId: 'dist-citadel' },
      { x: -3.1, z: -9.5, description: 'Bridge North Abutment West' },
      { x: -3.1, z: 0.0, description: 'Central Bridge Overlook West' },
      { x: -3.1, z: 5.8, districtId: 'dist-citadel' },
    ],
  },
  // 3. Oasis Terraces East Residential Sidewalk (Habitat Block & Villa)
  {
    id: 'path-oasis-east',
    name: 'Oasis Terraces East Sidewalk',
    districtId: 'dist-residential',
    isLoop: true,
    nodes: [
      { x: 3.2, z: 27.2, districtId: 'dist-residential', description: 'South Crossroad East Corner' },
      { x: 3.2, z: 30.0, districtId: 'dist-residential', description: 'Habitat Block Walkway' },
      { x: 3.2, z: 37.0, districtId: 'dist-residential', description: 'Suburban Villa Walkway' },
      { x: 3.2, z: 42.0, districtId: 'dist-residential', description: 'South Boulevard Terminal' },
      { x: 3.2, z: 37.0, districtId: 'dist-residential' },
      { x: 3.2, z: 30.0, districtId: 'dist-residential' },
    ],
  },
  // 4. Oasis Terraces West Residential Sidewalk (Spire Alpha & Beta)
  {
    id: 'path-oasis-west',
    name: 'Oasis Terraces West Sidewalk',
    districtId: 'dist-residential',
    isLoop: true,
    nodes: [
      { x: -3.2, z: 27.2, districtId: 'dist-residential', description: 'South Crossroad West Corner' },
      { x: -3.2, z: 30.0, districtId: 'dist-residential', description: 'Arcology Spire Alpha Entrance' },
      { x: -3.2, z: 37.0, districtId: 'dist-residential', description: 'Arcology Spire Beta Entrance' },
      { x: -3.2, z: 42.0, districtId: 'dist-residential', description: 'South Terminal West' },
      { x: -3.2, z: 37.0, districtId: 'dist-residential' },
      { x: -3.2, z: 30.0, districtId: 'dist-residential' },
    ],
  },
  // 5. South 4-Way Crossroads Zebra Crossing (East-West Crossing)
  {
    id: 'path-crossroads-zebra',
    name: 'South Crossroads Pedestrian Crosswalk',
    districtId: 'dist-residential',
    isLoop: true,
    nodes: [
      { x: -3.2, z: 21.0, districtId: 'dist-residential' },
      { x: 0, z: 21.0, isCrossing: true, crossingDirection: 'NS', description: 'North Zebra Crossing' },
      { x: 3.2, z: 21.0, districtId: 'dist-residential' },
      { x: 3.2, z: 27.0, districtId: 'dist-residential' },
      { x: 0, z: 27.0, isCrossing: true, crossingDirection: 'NS', description: 'South Zebra Crossing' },
      { x: -3.2, z: 27.0, districtId: 'dist-residential' },
    ],
  },
  // 6. Oasis Cellular Care Clinic Healthcare Pathway
  {
    id: 'path-healthcare-clinic',
    name: 'Cellular Care Clinic Access Way',
    districtId: 'dist-residential',
    isLoop: true,
    nodes: [
      { x: 3.2, z: 21.0, districtId: 'dist-residential' },
      { x: 8.5, z: 21.0, districtId: 'dist-residential' },
      { x: 14.0, z: 21.0, districtId: 'dist-residential', description: 'Clinic Entrance Sidewalk' },
      { x: 14.0, z: 19.5, districtId: 'dist-residential', description: 'Emergency Reception Lobby' },
      { x: 14.0, z: 21.0, districtId: 'dist-residential' },
      { x: 8.5, z: 21.0, districtId: 'dist-residential' },
    ],
  },
  // 7. Polytechnic Academy Educational Promenade
  {
    id: 'path-polytechnic-academy',
    name: 'Polytechnic Institute Campus Colonnade',
    districtId: 'dist-science',
    isLoop: true,
    nodes: [
      { x: -12.0, z: -17.5, districtId: 'dist-science' },
      { x: -16.0, z: -17.5, districtId: 'dist-science', description: 'Academy Grand Portal' },
      { x: -19.5, z: -17.5, districtId: 'dist-science' },
      { x: -19.5, z: -21.0, districtId: 'dist-science', description: 'Science Quadrangle Courtyard' },
      { x: -16.0, z: -21.0, districtId: 'dist-science' },
      { x: -12.0, z: -21.0, districtId: 'dist-science' },
    ],
  },
  // 8. Vulcan Forge Basin Industrial Worker Route
  {
    id: 'path-vulcan-workers',
    name: 'Vulcan Smelter Industrial Walkway',
    districtId: 'dist-industrial',
    isLoop: true,
    nodes: [
      { x: 27.2, z: -12.0, districtId: 'dist-industrial' },
      { x: 27.2, z: -17.0, districtId: 'dist-industrial', description: 'Smelter Hub A Gate' },
      { x: 27.2, z: -24.0, districtId: 'dist-industrial', description: 'Composites Complex Gate' },
      { x: 30.0, z: -24.0, districtId: 'dist-industrial' },
      { x: 27.2, z: -24.0, districtId: 'dist-industrial' },
      { x: 27.2, z: -17.0, districtId: 'dist-industrial' },
    ],
  },
  // 9. Verdant Vale Agrisector Ecological Path
  {
    id: 'path-agrisector-bio',
    name: 'Verdant Vale Agrisector Walkway',
    districtId: 'dist-agriculture',
    isLoop: true,
    nodes: [
      { x: -27.2, z: 26.0, districtId: 'dist-agriculture' },
      { x: -27.2, z: 30.0, districtId: 'dist-agriculture', description: 'Bio-Dome Prime Portal' },
      { x: -27.2, z: 36.5, districtId: 'dist-agriculture', description: 'Algae Basin Pathway' },
      { x: -27.2, z: 30.0, districtId: 'dist-agriculture' },
    ],
  },
];

// Helper to determine path height (exact terrain or bridge height + sidewalk curb offset)
function getSidewalkY(x: number, z: number): number {
  // Central Bridge deck check
  if (Math.abs(x) < 4.2 && z >= -9.5 && z <= 5.0) {
    return 0.85; // Raised bridge pedestrian deck
  }
  // Forum civic terrace check
  if (Math.abs(x) < 7.6 && z >= 5.6 && z <= 18.5) {
    return 0.90; // Paved forum plaza level
  }
  return getTerrainHeight(x, z) + 0.15; // Ground sidewalk curb height
}

/**
 * Procedural Humanoid Pedestrian Avatar Mesh
 * Renders an articulated biped with dynamically oscillating limbs, accessories, and distinct attire
 */
function PedestrianAvatar({
  agent,
  isNight,
  walkPhase,
}: {
  agent: PedestrianAgent;
  isNight: boolean;
  walkPhase: number;
}) {
  const leftLegRot = Math.sin(walkPhase) * 0.45;
  const rightLegRot = -leftLegRot;
  const leftArmRot = -leftLegRot * 0.75;
  const rightArmRot = leftLegRot * 0.75;
  const torsoBob = Math.abs(Math.sin(walkPhase * 2)) * 0.035;

  return (
    <group scale={[agent.heightScale, agent.heightScale, agent.heightScale]}>
      {/* Torso & Head Group (bobs slightly with walking gait) */}
      <group position={[0, torsoBob, 0]}>
        {/* Torso Jacket / Shirt */}
        <mesh position={[0, 0.95, 0]} castShadow>
          <boxGeometry args={[0.32, 0.44, 0.18]} />
          <meshStandardMaterial color={agent.clothingColor} roughness={0.7} />
        </mesh>

        {/* Neck */}
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.06, 0.07, 0.1, 8]} />
          <meshStandardMaterial color={agent.skinTone} roughness={0.6} />
        </mesh>

        {/* Head */}
        <mesh position={[0, 1.34, 0]} castShadow>
          <boxGeometry args={[0.18, 0.2, 0.18]} />
          <meshStandardMaterial color={agent.skinTone} roughness={0.5} />
        </mesh>

        {/* Hair / Headwear */}
        {agent.archetype === 'worker' ? (
          // Yellow / Orange Safety Hardhat
          <mesh position={[0, 1.45, 0]}>
            <sphereGeometry args={[0.12, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            <meshStandardMaterial color="#f1c40f" metalness={0.4} roughness={0.3} />
          </mesh>
        ) : (
          // Natural hair
          <mesh position={[0, 1.44, -0.01]}>
            <boxGeometry args={[0.19, 0.08, 0.19]} />
            <meshStandardMaterial color="#2d3436" roughness={0.9} />
          </mesh>
        )}

        {/* High-Vis Vest for Industrial Workers */}
        {agent.archetype === 'worker' && (
          <mesh position={[0, 0.95, 0]}>
            <boxGeometry args={[0.34, 0.32, 0.2]} />
            <meshStandardMaterial color="#ff9f43" emissive="#ff9f43" emissiveIntensity={isNight ? 1.0 : 0.2} />
          </mesh>
        )}

        {/* Medical Teal Stethoscope / Badge */}
        {agent.archetype === 'medical' && (
          <mesh position={[0, 1.02, 0.1]}>
            <boxGeometry args={[0.18, 0.12, 0.02]} />
            <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={isNight ? 0.8 : 0.2} />
          </mesh>
        )}

        {/* Scholar Backpack Accessory */}
        {agent.accessoryType === 'backpack' && (
          <mesh position={[0, 0.98, -0.14]}>
            <boxGeometry args={[0.22, 0.28, 0.12]} />
            <meshStandardMaterial color="#2c3e50" roughness={0.8} />
          </mesh>
        )}

        {/* Datapad Tablet Accessory */}
        {agent.accessoryType === 'datapad' && (
          <mesh position={[0.22, 0.88, 0.12]} rotation={[0.4, -0.2, 0]}>
            <boxGeometry args={[0.12, 0.18, 0.02]} />
            <meshStandardMaterial color="#000" emissive="#00ffff" emissiveIntensity={isNight ? 1.8 : 0.6} />
          </mesh>
        )}

        {/* Left Arm */}
        <group position={[-0.21, 1.1, 0]} rotation={[leftArmRot, 0, 0]}>
          <mesh position={[0, -0.2, 0]}>
            <boxGeometry args={[0.09, 0.38, 0.09]} />
            <meshStandardMaterial color={agent.clothingColor} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.42, 0]}>
            <sphereGeometry args={[0.045, 6, 6]} />
            <meshStandardMaterial color={agent.skinTone} />
          </mesh>
        </group>

        {/* Right Arm */}
        <group position={[0.21, 1.1, 0]} rotation={[rightArmRot, 0, 0]}>
          <mesh position={[0, -0.2, 0]}>
            <boxGeometry args={[0.09, 0.38, 0.09]} />
            <meshStandardMaterial color={agent.clothingColor} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.42, 0]}>
            <sphereGeometry args={[0.045, 6, 6]} />
            <meshStandardMaterial color={agent.skinTone} />
          </mesh>
        </group>
      </group>

      {/* Left Leg */}
      <group position={[-0.09, 0.72, 0]} rotation={[leftLegRot, 0, 0]}>
        <mesh position={[0, -0.34, 0]}>
          <boxGeometry args={[0.1, 0.65, 0.1]} />
          <meshStandardMaterial color={agent.pantsColor} roughness={0.8} />
        </mesh>
        {/* Foot / Shoe */}
        <mesh position={[0, -0.68, 0.04]}>
          <boxGeometry args={[0.11, 0.06, 0.18]} />
          <meshStandardMaterial color="#1e272c" roughness={0.9} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group position={[0.09, 0.72, 0]} rotation={[rightLegRot, 0, 0]}>
        <mesh position={[0, -0.34, 0]}>
          <boxGeometry args={[0.1, 0.65, 0.1]} />
          <meshStandardMaterial color={agent.pantsColor} roughness={0.8} />
        </mesh>
        {/* Foot / Shoe */}
        <mesh position={[0, -0.68, 0.04]}>
          <boxGeometry args={[0.11, 0.06, 0.18]} />
          <meshStandardMaterial color="#1e272c" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * PedestriansSystem
 * Master system coordinating autonomous citizens walking on sidewalks, plazas, and pedestrian bridges
 */
function PedestriansSystem() {
  const isNight = useIsNight();
  const { isPlaying, speed: simSpeed, resources, districts } = useGameState();
  const groupRef = useRef<THREE.Group>(null);

  // Generate 32 Varied Citizen Agents distributed across the city districts
  const agents: PedestrianAgent[] = useMemo(() => {
    const list: PedestrianAgent[] = [];
    let idCounter = 1;

    PEDESTRIAN_PATHS.forEach((path) => {
      // Determine archetype appropriate for this path
      let archetype: CitizenArchetype = 'casual';
      if (path.districtId === 'dist-citadel') archetype = 'executive';
      else if (path.districtId === 'dist-industrial') archetype = 'worker';
      else if (path.districtId === 'dist-science') archetype = 'student';
      else if (path.id.includes('clinic')) archetype = 'medical';

      // Allocate 3 to 4 pedestrians per path
      const agentCount = path.id.includes('forum') ? 5 : path.id.includes('bridge') ? 4 : 3;

      for (let i = 0; i < agentCount; i++) {
        const clothes = CLOTHING_PALETTES[archetype];
        const color = clothes[i % clothes.length];
        const skin = SKIN_TONES[(i + idCounter) % SKIN_TONES.length];
        const height = 0.92 + ((idCounter * 7) % 20) * 0.01; // 0.92 to 1.12

        let acc: PedestrianAgent['accessoryType'] = 'none';
        if (archetype === 'worker') acc = 'helmet';
        else if (archetype === 'student') acc = i % 2 === 0 ? 'backpack' : 'datapad';
        else if (archetype === 'casual' && i % 3 === 0) acc = 'satchel';

        list.push({
          id: `ped-${idCounter++}`,
          archetype,
          pathId: path.id,
          pathProgress: (i / agentCount + 0.12 * (idCounter % 3)) % 1.0,
          speed: 1.25 + ((idCounter * 3) % 4) * 0.08, // 1.25 to 1.50 m/s
          direction: i % 2 === 0 ? 1 : -1,
          heightScale: height,
          clothingColor: color,
          pantsColor: i % 2 === 0 ? '#2c3e50' : '#34495e',
          skinTone: skin,
          accessoryType: acc,
          isWaitingAtCrossing: false,
          waitTimer: 0,
        });
      }
    });

    return list;
  }, []);

  // Precomputed path distance metrics for O(1) parametric position lookup
  const pathMetas = useMemo(() => {
    const map = new Map<
      string,
      { totalDist: number; segDists: number[]; segAccums: number[]; nodes: PedestrianPathNode[] }
    >();

    PEDESTRIAN_PATHS.forEach((path) => {
      const nodes = path.nodes;
      let totalDist = 0;
      const segDists: number[] = [];
      const segAccums: number[] = [];

      for (let i = 0; i < nodes.length; i++) {
        const next = nodes[(i + 1) % nodes.length];
        const dist = Math.hypot(next.x - nodes[i].x, next.z - nodes[i].z);
        segDists.push(dist);
        segAccums.push(totalDist);
        totalDist += dist;
      }

      map.set(path.id, { totalDist, segDists, segAccums, nodes });
    });

    return map;
  }, []);

  // State refs for animation loop
  const progressRef = useRef<number[]>(agents.map((a) => a.pathProgress));
  const walkPhaseRef = useRef<number[]>(agents.map((_, i) => i * 1.5));
  const waitingRef = useRef<boolean[]>(agents.map(() => false));

  useFrame((_, delta) => {
    if (!isPlaying || !groupRef.current) return;

    const multMap = { '1x': 1, '2x': 1.4, '5x': 2.0, '10x': 3.0 };
    const mult = multMap[simSpeed] || 1;
    const dt = Math.min(delta, 0.1) * mult;

    const signal = getGlobalTrafficSignal();

    agents.forEach((agent, idx) => {
      const child = groupRef.current?.children[idx];
      if (!child) return;

      const meta = pathMetas.get(agent.pathId);
      if (!meta) return;

      const { totalDist, segDists, segAccums, nodes } = meta;
      const targetDist = progressRef.current[idx] * totalDist;

      // Find current node segment
      let segIdx = 0;
      for (let i = segDists.length - 1; i >= 0; i--) {
        if (targetDist >= segAccums[i]) {
          segIdx = i;
          break;
        }
      }
      const accum = segAccums[segIdx];
      const n1 = nodes[segIdx];
      const n2 = nodes[(segIdx + 1) % nodes.length];
      const segT = (targetDist - accum) / (segDists[segIdx] || 1);

      // --- ZEBRA CROSSING SAFETY COMPLIANCE ---
      // If approaching a zebra crossing, check if traffic signal permits pedestrian crossing
      let isWaiting = false;
      if (n1.isCrossing || n2.isCrossing) {
        const crossingNode = n1.isCrossing ? n1 : n2;
        if (crossingNode.crossingDirection === 'NS') {
          // North-South vehicles have green light: pedestrians must wait at sidewalk curb!
          if (signal.isNorthSouthGreen) {
            isWaiting = true;
          }
        } else if (crossingNode.crossingDirection === 'EW') {
          if (signal.isEastWestGreen) {
            isWaiting = true;
          }
        }
      }
      waitingRef.current[idx] = isWaiting;

      // Update position only when not waiting for traffic
      if (!isWaiting) {
        const step = (agent.speed * agent.direction * dt) / totalDist;
        progressRef.current[idx] = (progressRef.current[idx] + step + 1.0) % 1.0;
        walkPhaseRef.current[idx] += agent.speed * dt * 4.8;
      }

      // Exact 3D Ground & Sidewalk Coordinates
      const posX = THREE.MathUtils.lerp(n1.x, n2.x, segT);
      const posZ = THREE.MathUtils.lerp(n1.z, n2.z, segT);
      const posY = getSidewalkY(posX, posZ);

      child.position.set(posX, posY, posZ);

      // Orientation along movement vector
      const targetAngle =
        agent.direction > 0
          ? Math.atan2(n2.x - n1.x, n2.z - n1.z)
          : Math.atan2(n1.x - n2.x, n1.z - n2.z);

      let diff = targetAngle - child.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      child.rotation.y += diff * Math.min(1.0, dt * 8.0);
    });

    // Update traffic telemetry with active pedestrian count
    setTrafficFlowMetrics({ activePedestrians: agents.length });
  });

  return (
    <group ref={groupRef} raycast={() => null}>
      {agents.map((agent, idx) => (
        <group key={agent.id} position={[0, -100, 0]}>
          <PedestrianAvatar
            agent={agent}
            isNight={isNight}
            walkPhase={waitingRef.current[idx] ? 0 : walkPhaseRef.current[idx]}
          />
        </group>
      ))}
    </group>
  );
}

export default React.memo(PedestriansSystem);
