import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useIsNight } from './DayNightController';
import { useGameState } from '../../context/GameStateContext';
import { getTerrainHeight } from './Terrain';
import { getGlobalTrafficSignal } from './RoadNetwork';
import {
  CitizenArchetype,
  PedestrianPath,
  PedestrianPathNode,
} from './cityLifeTypes';
import { setTrafficFlowMetrics } from './VehiclesSystem';
import {
  getCivilizationEra,
  ERA_PROFILES,
  generateCitizenThought,
  generateCitizenDialogue,
  DetailedHumanCitizen,
} from '../../simulation/humanEvolutionLogic';
import { DetailedCitizenAgent } from '../../types/citizen';
import { Citizen } from '../../types/game';

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
  if (Math.abs(x) < 4.2 && z >= -9.5 && z <= 5.0) {
    return 0.85;
  }
  if (Math.abs(x) < 7.6 && z >= 5.6 && z <= 18.5) {
    return 0.90;
  }
  return getTerrainHeight(x, z) + 0.15;
}

// Map occupation to visual archetype
function getArchetypeForOccupation(occupation: string = ''): CitizenArchetype {
  const occ = occupation.toLowerCase();
  if (occ.includes('commander') || occ.includes('senat') || occ.includes('architect') || occ.includes('executive')) {
    return 'executive';
  }
  if (occ.includes('doctor') || occ.includes('medic') || occ.includes('clinic') || occ.includes('nurse')) {
    return 'medical';
  }
  if (occ.includes('botanist') || occ.includes('research') || occ.includes('scientist') || occ.includes('ai')) {
    return 'scientist';
  }
  if (occ.includes('worker') || occ.includes('miner') || occ.includes('foundry') || occ.includes('operator') || occ.includes('technician')) {
    return 'worker';
  }
  if (occ.includes('student') || occ.includes('scholar') || occ.includes('apprentice')) {
    return 'student';
  }
  return 'casual';
}

interface HumanSimEntity {
  citizen: Citizen;
  detailed?: DetailedCitizenAgent;
  archetype: CitizenArchetype;
  clothingColor: string;
  pantsColor: string;
  skinTone: string;
  heightScale: number;
  accessoryType: 'none' | 'backpack' | 'satchel' | 'helmet' | 'datapad';
  // Dynamic spatial state
  currentX: number;
  currentZ: number;
  targetX: number;
  targetZ: number;
  facingAngle: number;
  walkPhase: number;
  speed: number;
  isSleeping: boolean;
  isWaitingAtCrossing: boolean;
  isConversing: boolean;
  conversationPartnerName?: string;
  conversationText?: string;
  dialogueTimer: number;
}

function PedestrianAvatar({
  archetype,
  clothingColor,
  pantsColor,
  skinTone,
  heightScale,
  accessoryType,
  isNight,
  walkPhase,
  isRaining,
  isSleeping,
}: {
  archetype: CitizenArchetype;
  clothingColor: string;
  pantsColor: string;
  skinTone: string;
  heightScale: number;
  accessoryType: 'none' | 'backpack' | 'satchel' | 'helmet' | 'datapad';
  isNight: boolean;
  walkPhase: number;
  isRaining?: boolean;
  isSleeping?: boolean;
}) {
  const leftLegRot = isSleeping ? 0 : Math.sin(walkPhase) * 0.45;
  const rightLegRot = -leftLegRot;
  const leftArmRot = isSleeping ? 0 : -leftLegRot * 0.75;
  const rightArmRot = isSleeping ? 0 : leftLegRot * 0.75;
  const torsoBob = isSleeping ? -0.4 : Math.abs(Math.sin(walkPhase * 2)) * 0.035;

  return (
    <group scale={[heightScale, heightScale, heightScale]}>
      <group position={[0, torsoBob, 0]}>
        {/* Torso */}
        <mesh position={[0, 0.95, 0]} castShadow>
          <boxGeometry args={[0.32, 0.44, 0.18]} />
          <meshStandardMaterial color={clothingColor} roughness={0.7} />
        </mesh>

        {/* Neck */}
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.06, 0.07, 0.1, 8]} />
          <meshStandardMaterial color={skinTone} roughness={0.6} />
        </mesh>

        {/* Head */}
        <mesh position={[0, 1.34, 0]} castShadow>
          <boxGeometry args={[0.18, 0.2, 0.18]} />
          <meshStandardMaterial color={skinTone} roughness={0.5} />
        </mesh>

        {/* Hair / Headwear */}
        {archetype === 'worker' ? (
          <mesh position={[0, 1.45, 0]}>
            <sphereGeometry args={[0.12, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            <meshStandardMaterial color="#f1c40f" metalness={0.4} roughness={0.3} />
          </mesh>
        ) : (
          <mesh position={[0, 1.44, -0.01]}>
            <boxGeometry args={[0.19, 0.08, 0.19]} />
            <meshStandardMaterial color="#2d3436" roughness={0.9} />
          </mesh>
        )}

        {/* Umbrella during rain */}
        {isRaining && !isSleeping && (
          <group position={[0, 1.7, 0]}>
            <mesh>
              <coneGeometry args={[0.42, 0.2, 12]} />
              <meshStandardMaterial color="#1a252c" roughness={0.4} />
            </mesh>
            <mesh position={[0, -0.2, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.4, 6]} />
              <meshStandardMaterial color="#888888" metalness={0.8} />
            </mesh>
          </group>
        )}

        {/* Worker Hi-Vis Vest */}
        {archetype === 'worker' && (
          <mesh position={[0, 0.95, 0]}>
            <boxGeometry args={[0.34, 0.32, 0.2]} />
            <meshStandardMaterial color="#ff9f43" emissive="#ff9f43" emissiveIntensity={isNight ? 1.0 : 0.2} />
          </mesh>
        )}

        {/* Medical Badge / Stethoscope */}
        {archetype === 'medical' && (
          <mesh position={[0, 1.02, 0.1]}>
            <boxGeometry args={[0.18, 0.12, 0.02]} />
            <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={isNight ? 0.8 : 0.2} />
          </mesh>
        )}

        {/* Accessories */}
        {accessoryType === 'backpack' && (
          <mesh position={[0, 0.98, -0.14]}>
            <boxGeometry args={[0.22, 0.28, 0.12]} />
            <meshStandardMaterial color="#2c3e50" roughness={0.8} />
          </mesh>
        )}

        {accessoryType === 'datapad' && (
          <mesh position={[0.22, 0.88, 0.12]} rotation={[0.4, -0.2, 0]}>
            <boxGeometry args={[0.12, 0.18, 0.02]} />
            <meshStandardMaterial color="#000" emissive="#00ffff" emissiveIntensity={isNight ? 1.8 : 0.6} />
          </mesh>
        )}

        {/* Left Arm */}
        <group position={[-0.21, 1.1, 0]} rotation={[leftArmRot, 0, 0]}>
          <mesh position={[0, -0.2, 0]}>
            <boxGeometry args={[0.09, 0.38, 0.09]} />
            <meshStandardMaterial color={clothingColor} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.42, 0]}>
            <sphereGeometry args={[0.045, 6, 6]} />
            <meshStandardMaterial color={skinTone} />
          </mesh>
        </group>

        {/* Right Arm */}
        <group position={[0.21, 1.1, 0]} rotation={[rightArmRot, 0, 0]}>
          <mesh position={[0, -0.2, 0]}>
            <boxGeometry args={[0.09, 0.38, 0.09]} />
            <meshStandardMaterial color={clothingColor} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.42, 0]}>
            <sphereGeometry args={[0.045, 6, 6]} />
            <meshStandardMaterial color={skinTone} />
          </mesh>
        </group>
      </group>

      {/* Left Leg */}
      <group position={[-0.09, 0.72, 0]} rotation={[leftLegRot, 0, 0]}>
        <mesh position={[0, -0.34, 0]}>
          <boxGeometry args={[0.1, 0.65, 0.1]} />
          <meshStandardMaterial color={pantsColor} roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.68, 0.04]}>
          <boxGeometry args={[0.11, 0.06, 0.18]} />
          <meshStandardMaterial color="#1e272c" roughness={0.9} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group position={[0.09, 0.72, 0]} rotation={[rightLegRot, 0, 0]}>
        <mesh position={[0, -0.34, 0]}>
          <boxGeometry args={[0.1, 0.65, 0.1]} />
          <meshStandardMaterial color={pantsColor} roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.68, 0.04]}>
          <boxGeometry args={[0.11, 0.06, 0.18]} />
          <meshStandardMaterial color="#1e272c" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

function PedestriansSystem({ isRaining = false }: { isRaining?: boolean } = {}) {
  const isNight = useIsNight();
  const {
    citizens,
    citizenReport,
    inspectedCitizen,
    setInspectedCitizen,
    isPlaying,
    speed: simSpeed,
    civilization,
    placedBuildings,
  } = useGameState();

  const groupRef = useRef<THREE.Group>(null);
  const [hoveredCitizenId, setHoveredCitizenId] = useState<string | null>(null);

  const citadel = useMemo(
    () => placedBuildings.find((b) => b.modelType === 'citadel' || b.catalogId === 'bld-gov-citadel'),
    [placedBuildings]
  );
  const citadelLevel = citadel?.level || civilization?.level || 1;
  const era = getCivilizationEra(citadelLevel);

  // Initialize physical state for active citizens (up to 24 for optimal render budget)
  const activeCitizens = useMemo(() => {
    return citizens.slice(0, 24);
  }, [citizens]);

  const entitiesRef = useRef<HumanSimEntity[]>([]);

  // Build or sync simulation entities from authentic citizens
  useEffect(() => {
    const list: HumanSimEntity[] = activeCitizens.map((c, idx) => {
      const detailed = citizenReport.citizenAgents.find((a) => a.id === c.id);
      const archetype = getArchetypeForOccupation(c.occupation);
      const clothes = CLOTHING_PALETTES[archetype];
      const color = clothes[idx % clothes.length];
      const skin = SKIN_TONES[idx % SKIN_TONES.length];
      const height = 0.92 + ((idx * 7) % 20) * 0.01;

      let acc: HumanSimEntity['accessoryType'] = 'none';
      if (archetype === 'worker') acc = 'helmet';
      else if (archetype === 'student') acc = 'backpack';
      else if (archetype === 'scientist' || archetype === 'executive') acc = 'datapad';

      // Default home and work positions
      const defaultHomeX = -7.5 + (idx % 5) * 3.0;
      const defaultHomeZ = 11.5 + Math.floor(idx / 5) * 3.5;
      const homeX = detailed?.homeCoords ? detailed.homeCoords[0] : defaultHomeX;
      const homeZ = detailed?.homeCoords ? detailed.homeCoords[2] : defaultHomeZ;

      const defaultWorkX = idx % 2 === 0 ? 0 : 5.5;
      const defaultWorkZ = idx % 2 === 0 ? 8 : 12;
      const workX = detailed?.workCoords ? detailed.workCoords[0] : defaultWorkX;
      const workZ = detailed?.workCoords ? detailed.workCoords[2] : defaultWorkZ;

      return {
        citizen: c,
        detailed,
        archetype,
        clothingColor: color,
        pantsColor: idx % 2 === 0 ? '#2c3e50' : '#34495e',
        skinTone: skin,
        heightScale: height,
        accessoryType: acc,
        currentX: homeX,
        currentZ: homeZ,
        targetX: workX,
        targetZ: workZ,
        facingAngle: 0,
        walkPhase: idx * 1.5,
        speed: 1.25 + (idx % 3) * 0.1,
        isSleeping: false,
        isWaitingAtCrossing: false,
        isConversing: false,
        dialogueTimer: 0,
      };
    });

    entitiesRef.current = list;
  }, [activeCitizens, citizenReport.citizenAgents]);

  // Frame tick: update movement, avoidance, social encounters, and instanced visuals
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const multMap = { '1x': 1, '2x': 1.4, '5x': 2.0, '10x': 3.0 };
    const mult = multMap[simSpeed] || 1;
    const dt = Math.min(delta, 0.1) * (isPlaying ? mult : 0);

    const entities = entitiesRef.current;
    if (entities.length === 0) return;

    const signal = getGlobalTrafficSignal();

    entities.forEach((entity, idx) => {
      const child = groupRef.current?.children[idx] as THREE.Group | undefined;
      if (!child) return;

      const detailed = citizenReport.citizenAgents.find((a) => a.id === entity.citizen.id);
      const activity = detailed?.currentActivity || 'working';

      // 1. Resolve Target Coordinates based on authentic activity
      let destX = entity.targetX;
      let destZ = entity.targetZ;

      if (activity === 'sleeping' || activity === 'home_leisure') {
        entity.isSleeping = activity === 'sleeping';
        if (detailed?.homeCoords) {
          destX = detailed.homeCoords[0];
          destZ = detailed.homeCoords[2];
        }
      } else if (activity === 'working' || activity === 'studying') {
        entity.isSleeping = false;
        if (detailed?.workCoords) {
          destX = detailed.workCoords[0];
          destZ = detailed.workCoords[2];
        }
      } else if (activity === 'lunch_break') {
        entity.isSleeping = false;
        destX = 0.0;
        destZ = 12.0; // Central hearth / dining plaza
      } else if (activity === 'recreation_park') {
        entity.isSleeping = false;
        destX = 0.0;
        destZ = 14.5; // Forum assembly
      } else if (activity === 'seeking_medical_care') {
        entity.isSleeping = false;
        destX = 14.0;
        destZ = 20.0; // Clinic
      }

      entity.targetX = destX;
      entity.targetZ = destZ;

      // 2. Inter-Human Social Interaction Check
      if (entity.dialogueTimer > 0) {
        entity.dialogueTimer -= delta;
        if (entity.dialogueTimer <= 0) {
          entity.isConversing = false;
          entity.conversationText = undefined;
        }
      } else if (Math.random() < 0.005) {
        // Look for peer within 2.2m
        const peer = entities.find(
          (p, pIdx) =>
            pIdx !== idx &&
            !p.isSleeping &&
            Math.hypot(p.currentX - entity.currentX, p.currentZ - entity.currentZ) < 2.2
        );
        if (peer && detailed && peer.detailed) {
          const dialogue = generateCitizenDialogue(
            detailed as unknown as DetailedHumanCitizen,
            peer.detailed as unknown as DetailedHumanCitizen,
            era
          );
          entity.isConversing = true;
          entity.conversationPartnerName = peer.citizen.name;
          entity.conversationText = dialogue;
          entity.dialogueTimer = 4.0;
        }
      }

      // 3. Movement towards destination
      const dx = destX - entity.currentX;
      const dz = destZ - entity.currentZ;
      const dist = Math.hypot(dx, dz);

      const isStationary = entity.isSleeping || entity.isConversing || dist < 0.4;

      if (!isStationary && dt > 0) {
        const moveStep = Math.min(dist, entity.speed * dt);
        const dirX = dx / dist;
        const dirZ = dz / dist;

        entity.currentX += dirX * moveStep;
        entity.currentZ += dirZ * moveStep;
        entity.facingAngle = Math.atan2(dirX, dirZ);
        entity.walkPhase += entity.speed * dt * 4.8;
      }

      const posY = getSidewalkY(entity.currentX, entity.currentZ);

      child.position.set(entity.currentX, posY, entity.currentZ);
      child.rotation.y = entity.facingAngle;
    });

    setTrafficFlowMetrics({ activePedestrians: entities.length });
  });

  return (
    <group ref={groupRef}>
      {entitiesRef.current.map((entity) => {
        const isSelected = inspectedCitizen?.id === entity.citizen.id;
        const isHovered = hoveredCitizenId === entity.citizen.id;
        const detailed = citizenReport.citizenAgents.find((a) => a.id === entity.citizen.id);

        return (
          <group
            key={entity.citizen.id}
            position={[entity.currentX, getSidewalkY(entity.currentX, entity.currentZ), entity.currentZ]}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              setInspectedCitizen(entity.citizen);
            }}
            onPointerOver={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              setHoveredCitizenId(entity.citizen.id);
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              setHoveredCitizenId((prev) => (prev === entity.citizen.id ? null : prev));
              document.body.style.cursor = 'default';
            }}
          >
            {/* Holographic Selection Ring */}
            {isSelected && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                <ringGeometry args={[0.5, 0.65, 32]} />
                <meshBasicMaterial color="#00e5ff" transparent opacity={0.85} side={THREE.DoubleSide} />
              </mesh>
            )}

            {/* Hover Indicator Ring */}
            {isHovered && !isSelected && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
                <ringGeometry args={[0.45, 0.55, 32]} />
                <meshBasicMaterial color="#ffd166" transparent opacity={0.6} side={THREE.DoubleSide} />
              </mesh>
            )}

            {/* Citizen 3D Character Body */}
            <PedestrianAvatar
              archetype={entity.archetype}
              clothingColor={entity.clothingColor}
              pantsColor={entity.pantsColor}
              skinTone={entity.skinTone}
              heightScale={entity.heightScale}
              accessoryType={entity.accessoryType}
              isNight={isNight}
              walkPhase={entity.walkPhase}
              isRaining={isRaining}
              isSleeping={entity.isSleeping}
            />

            {/* Overhead 3D Floating Thought & Identity Bubble */}
            {(isSelected || entity.isConversing || isHovered) && (
              <Html
                position={[0, 1.85, 0]}
                center
                distanceFactor={18}
                zIndexRange={[100, 0]}
              >
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setInspectedCitizen(entity.citizen);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs backdrop-blur-md border shadow-2xl transition-all duration-200 select-none cursor-pointer whitespace-nowrap min-w-[200px] max-w-[280px] ${
                    isSelected
                      ? 'bg-[#101a24]/95 border-[#00e5ff] text-white shadow-[#00e5ff]/20'
                      : 'bg-[#14181b]/90 border-[#3d4b55] text-[#ede8dc]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1 mb-1">
                    <span className="font-bold text-[11px] truncate flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#00e5ff] animate-ping" />
                      {entity.citizen.name}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase bg-white/10 text-[#c29b38]">
                      {entity.citizen.occupation}
                    </span>
                  </div>

                  {/* Speech dialogue or live thought */}
                  <p className="text-[10px] italic text-[#a0c4d8] leading-tight line-clamp-2">
                    {entity.conversationText
                      ? `"${entity.conversationText}"`
                      : detailed?.currentThought
                      ? `"${detailed.currentThought}"`
                      : `"${entity.detailed?.currentDestinationName || 'On duty'}"`}
                  </p>

                  {/* Dynamic Maslow drive indicators */}
                  {detailed?.drives && (
                    <div className="flex items-center gap-2 mt-1.5 pt-1 border-t border-white/10 text-[9px]">
                      <span className="text-[#64dfdf]">⚡ {detailed.drives.energy}%</span>
                      <span className="text-[#ffd166]">🍞 {100 - detailed.drives.hunger}%</span>
                      <span className="text-[#06d6a0]">❤️ {detailed.happiness}%</span>
                      <span className="text-gray-400 font-mono ml-auto">
                        {detailed.currentActivity.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

export default React.memo(PedestriansSystem);
