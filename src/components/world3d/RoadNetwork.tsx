import React, { useState, useMemo, useRef } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { getTerrainHeight, isNearRiver } from './Terrain';
import { useIsNight } from './DayNightController';
import { useGameState } from '../../context/GameStateContext';
import { RoadSegmentData } from '../../types/road';
import { triggerRoadSelection } from './WorldLabelManager';
import {
  createTerrainAdaptiveRoadGeometry,
  createSidewalksGeometry,
  createRoadMarkingsGeometry,
  createIntersectionJunctionGeometry,
} from './roadGeometry';

// ================= TRAFFIC SIGNAL CONTROLLER =================
export interface TrafficSignalState {
  isNorthSouthGreen: boolean;
  isNorthSouthYellow: boolean;
  isEastWestGreen: boolean;
  isEastWestYellow: boolean;
}

let globalTrafficSignal: TrafficSignalState = {
  isNorthSouthGreen: true,
  isNorthSouthYellow: false,
  isEastWestGreen: false,
  isEastWestYellow: false,
};

export function getGlobalTrafficSignal(): TrafficSignalState {
  return globalTrafficSignal;
}

// 4-Way Traffic Signal Post Mesh
function TrafficSignalPost({
  position,
  rotationY,
  isGreen,
  isYellow,
  isRed,
}: {
  position: [number, number, number];
  rotationY: number;
  isGreen: boolean;
  isYellow: boolean;
  isRed: boolean;
}) {
  const isNight = useIsNight();
  const [x, y, z] = position;

  return (
    <group position={[x, y, z]} rotation={[0, rotationY, 0]} raycast={() => null}>
      {/* Heavy Base Plate */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.22, 0.26, 0.2, 8]} />
        <meshStandardMaterial color="#2d332e" metalness={0.7} />
      </mesh>
      {/* Mast Pole */}
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 3.4, 8]} />
        <meshStandardMaterial color="#2d332e" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Overhanging Signal Cantilever Arm */}
      <mesh position={[0.7, 3.3, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.06, 1.4, 8]} />
        <meshStandardMaterial color="#2d332e" metalness={0.7} />
      </mesh>
      {/* Signal Housing Box */}
      <mesh position={[1.3, 3.1, 0]}>
        <boxGeometry args={[0.28, 0.9, 0.26]} />
        <meshStandardMaterial color="#1f2420" roughness={0.8} />
      </mesh>
      {/* Red Lamp */}
      <mesh position={[1.3, 3.36, 0.12]}>
        <sphereGeometry args={[0.09, 10, 10]} />
        <meshStandardMaterial
          color={isRed ? '#ff3838' : '#4a1515'}
          emissive={isRed ? '#ff2222' : '#000000'}
          emissiveIntensity={isRed ? (isNight ? 2.8 : 1.8) : 0}
        />
      </mesh>
      {/* Yellow Lamp */}
      <mesh position={[1.3, 3.1, 0.12]}>
        <sphereGeometry args={[0.09, 10, 10]} />
        <meshStandardMaterial
          color={isYellow ? '#ffbb33' : '#4a3810'}
          emissive={isYellow ? '#ffaa00' : '#000000'}
          emissiveIntensity={isYellow ? (isNight ? 2.8 : 1.8) : 0}
        />
      </mesh>
      {/* Green Lamp */}
      <mesh position={[1.3, 2.84, 0.12]}>
        <sphereGeometry args={[0.09, 10, 10]} />
        <meshStandardMaterial
          color={isGreen ? '#2ecc71' : '#104523'}
          emissive={isGreen ? '#27ae60' : '#000000'}
          emissiveIntensity={isGreen ? (isNight ? 2.8 : 1.8) : 0}
        />
      </mesh>
    </group>
  );
}

// Dedicated Traffic Signals Controller
const TrafficIntersectionSignals = React.memo(function TrafficIntersectionSignals() {
  const [signalState, setSignalState] = useState<TrafficSignalState>(globalTrafficSignal);
  const phaseRef = useRef<number>(-1);

  useFrame(({ clock }) => {
    const cycleTime = clock.getElapsedTime() % 22;
    let phase = 0;
    if (cycleTime < 8.5) {
      phase = 0;
    } else if (cycleTime < 11.0) {
      phase = 1;
    } else if (cycleTime < 19.5) {
      phase = 2;
    } else {
      phase = 3;
    }

    if (phase !== phaseRef.current) {
      phaseRef.current = phase;
      globalTrafficSignal = {
        isNorthSouthGreen: phase === 0,
        isNorthSouthYellow: phase === 1,
        isEastWestGreen: phase === 2,
        isEastWestYellow: phase === 3,
      };
      setSignalState({ ...globalTrafficSignal });
    }
  });

  return (
    <>
      <TrafficSignalPost
        position={[-3.2, 0.85, 21.0]}
        rotationY={0}
        isGreen={signalState.isNorthSouthGreen}
        isYellow={signalState.isNorthSouthYellow}
        isRed={!signalState.isNorthSouthGreen && !signalState.isNorthSouthYellow}
      />
      <TrafficSignalPost
        position={[3.2, 0.85, 27.0]}
        rotationY={Math.PI}
        isGreen={signalState.isNorthSouthGreen}
        isYellow={signalState.isNorthSouthYellow}
        isRed={!signalState.isNorthSouthGreen && !signalState.isNorthSouthYellow}
      />
      <TrafficSignalPost
        position={[-3.2, 0.85, 27.0]}
        rotationY={-Math.PI / 2}
        isGreen={signalState.isEastWestGreen}
        isYellow={signalState.isEastWestYellow}
        isRed={!signalState.isEastWestGreen && !signalState.isEastWestYellow}
      />
      <TrafficSignalPost
        position={[3.2, 0.85, 21.0]}
        rotationY={Math.PI / 2}
        isGreen={signalState.isEastWestGreen}
        isYellow={signalState.isEastWestYellow}
        isRed={!signalState.isEastWestGreen && !signalState.isEastWestYellow}
      />
    </>
  );
});

// ================= ARCHITECTURAL BRIDGES =================
interface BridgeProps {
  id: string;
  name: string;
  position: [number, number, number];
  length: number;
  width: number;
  rotationY?: number;
  isSelected: boolean;
  onSelect: () => void;
}

function ArchitecturalBridge({
  id,
  name,
  position,
  length,
  width,
  rotationY = 0,
  isSelected,
  onSelect,
}: BridgeProps) {
  const isNight = useIsNight();
  const [bx, by, bz] = position;
  const [hovered, setHovered] = useState(false);

  return (
    <group
      position={[bx, by, bz]}
      rotation={[0, rotationY, 0]}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Deep Pier Footings dipping into Riverbed */}
      {[-length * 0.28, length * 0.28].map((offset, idx) => (
        <group key={idx} position={[0, -1.15, offset]} raycast={() => null}>
          <mesh receiveShadow>
            <cylinderGeometry args={[1.2, 1.5, 2.5, 8]} />
            <meshStandardMaterial color="#423b32" roughness={0.8} />
          </mesh>
          <mesh position={[0, -0.2, 0]} rotation={[0, Math.PI / 4, 0]}>
            <boxGeometry args={[1.7, 2.1, 1.7]} />
            <meshStandardMaterial color="#36312a" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Main Bridge Road Deck */}
      <mesh position={[0, 0.45, 0]} receiveShadow castShadow>
        <boxGeometry args={[width, 0.5, length]} />
        <meshStandardMaterial
          color={isSelected ? '#705b32' : hovered ? '#475249' : '#333b35'}
          roughness={0.85}
        />
      </mesh>

      {/* Asphalt Running Surface */}
      <mesh position={[0, 0.72, 0]} receiveShadow>
        <boxGeometry args={[width - 0.4, 0.05, length]} />
        <meshStandardMaterial color="#272d29" roughness={0.95} />
      </mesh>

      {/* Double Yellow Center Line */}
      <mesh position={[-0.08, 0.75, 0]} raycast={() => null}>
        <boxGeometry args={[0.07, 0.02, length - 0.6]} />
        <meshBasicMaterial color="#e3be66" />
      </mesh>
      <mesh position={[0.08, 0.75, 0]} raycast={() => null}>
        <boxGeometry args={[0.07, 0.02, length - 0.6]} />
        <meshBasicMaterial color="#e3be66" />
      </mesh>

      {/* White Outer Edge Boundaries */}
      {[-width * 0.5 + 0.5, width * 0.5 - 0.5].map((edgeX, i) => (
        <mesh key={i} position={[edgeX, 0.75, 0]} raycast={() => null}>
          <boxGeometry args={[0.08, 0.02, length - 0.6]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
      ))}

      {/* Raised Pedestrian Sidewalks */}
      {[-width * 0.5 + 0.35, width * 0.5 - 0.35].map((sideX, i) => (
        <mesh key={i} position={[sideX, 0.82, 0]} receiveShadow raycast={() => null}>
          <boxGeometry args={[0.7, 0.18, length]} />
          <meshStandardMaterial color="#68736a" roughness={0.7} />
        </mesh>
      ))}

      {/* Architectural Suspension Trusses & Cables */}
      {[-width * 0.5 + 0.05, width * 0.5 - 0.05].map((archX, i) => (
        <group key={i} position={[archX, 1.6, 0]} raycast={() => null}>
          <mesh castShadow>
            <cylinderGeometry args={[0.13, 0.13, length * 0.98, 8]} />
            <meshStandardMaterial color="#a89a7b" metalness={0.7} roughness={0.25} />
          </mesh>
          {[-length * 0.38, -length * 0.24, -length * 0.1, length * 0.1, length * 0.24, length * 0.38].map((cz, j) => (
            <mesh key={j} position={[0, -0.6, cz]}>
              <cylinderGeometry args={[0.03, 0.03, 1.3, 6]} />
              <meshStandardMaterial color="#d4cbb6" metalness={0.8} />
            </mesh>
          ))}
          <mesh position={[0, -0.4, 0]}>
            <boxGeometry args={[0.08, 0.12, length]} />
            <meshStandardMaterial
              color="#d4cbb6"
              emissive={isNight ? '#e6be75' : '#000000'}
              emissiveIntensity={isNight ? 0.8 : 0}
            />
          </mesh>
        </group>
      ))}

      {/* Bridge Entrance Pylons with Lanterns */}
      {[
        [-width * 0.5 - 0.35, -length * 0.48],
        [width * 0.5 + 0.35, -length * 0.48],
        [-width * 0.5 - 0.35, length * 0.48],
        [width * 0.5 + 0.35, length * 0.48],
      ].map(([px, pz], k) => (
        <group key={k} position={[px, 1.25, pz]} raycast={() => null}>
          <mesh>
            <cylinderGeometry args={[0.1, 0.14, 1.3, 6]} />
            <meshStandardMaterial color="#2d352f" metalness={0.6} />
          </mesh>
          <mesh position={[0, 0.72, 0]}>
            <sphereGeometry args={[0.16, 8, 8]} />
            <meshStandardMaterial
              color={isNight ? '#ffe49e' : '#e8dec2'}
              emissive={isNight ? '#ffbe3b' : '#333333'}
              emissiveIntensity={isNight ? 2.0 : 0.1}
            />
          </mesh>
        </group>
      ))}

      {/* Selection Glow Outline */}
      {isSelected && (
        <mesh position={[0, 0.78, 0]} raycast={() => null}>
          <boxGeometry args={[width + 0.3, 0.06, length + 0.3]} />
          <meshBasicMaterial color="#e0be70" wireframe transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
}

// ================= ZEBRA PEDESTRIAN CROSSING =================
function ZebraPedestrianCrossing({
  position,
  width,
  length = 2.4,
  rotationY = 0,
}: {
  position: [number, number, number];
  width: number;
  length?: number;
  rotationY?: number;
}) {
  const stripeCount = Math.floor(width / 0.7);
  const stripeWidth = 0.45;
  const stripeSpacing = width / stripeCount;

  return (
    <group position={position} rotation={[0, rotationY, 0]} raycast={() => null}>
      {Array.from({ length: stripeCount }).map((_, i) => {
        const offset = -width * 0.5 + (i + 0.5) * stripeSpacing;
        return (
          <mesh key={i} position={[offset, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[stripeWidth, length]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.88} />
          </mesh>
        );
      })}
    </group>
  );
}

// ================= MASTER ROAD NETWORK COMPONENT =================
function RoadNetwork() {
  const isNight = useIsNight();
  const { rates } = useGameState();
  const [selectedRoadId, setSelectedRoadId] = useState<string | null>(null);

  // Road segment telemetry definitions
  const roadSegments: RoadSegmentData[] = useMemo(() => [
    {
      id: 'road-ns-north',
      name: 'Elysium Grand Arterial (North Corridor)',
      category: 'grand_arterial',
      speedLimitKmh: 70,
      lanes: 4,
      width: 5.4,
      lengthMeters: 420,
      status: 'Optimal',
      throughputVehiclesPerDay: Math.round(28400 * (1 + rates.gdpGrowthRate / 10)),
      connectedDistricts: ['Elysium Citadel', 'Northern Terraces'],
      connectedBuildings: ['Planetary Senate Citadel', 'North Gateway Terminal'],
      description: 'Primary four-lane dual carriageway heading north over the Central Citadel Arch Bridge.',
    },
    {
      id: 'road-ns-south',
      name: 'Elysium Grand Arterial (South Corridor)',
      category: 'grand_arterial',
      speedLimitKmh: 70,
      lanes: 4,
      width: 5.4,
      lengthMeters: 460,
      status: 'Optimal',
      throughputVehiclesPerDay: Math.round(31200 * (1 + rates.gdpGrowthRate / 10)),
      connectedDistricts: ['Elysium Citadel', 'Oasis Terraces'],
      connectedBuildings: ['High Council Citadel', 'Oasis Terraces Hab Block', 'Cellular Care Clinic'],
      description: 'Central arterial connecting political governance to primary residential sectors.',
    },
    {
      id: 'road-ew-west',
      name: 'Aethel Science Highway (West Axis)',
      category: 'grand_arterial',
      speedLimitKmh: 65,
      lanes: 4,
      width: 5.2,
      lengthMeters: 480,
      status: 'Normal Flow',
      throughputVehiclesPerDay: 22100,
      connectedDistricts: ['Elysium Citadel', 'Aethel Ridge Science Park'],
      connectedBuildings: ['Quantum Telemetry Observatory', 'Polytechnic Institute', 'Helios Solar Concentration Array'],
      description: 'High-speed transit highway connecting central Elysium to high-tech quantum research facilities.',
    },
    {
      id: 'road-ew-east',
      name: 'Vulcan Industrial Expressway (East Axis)',
      category: 'industrial_corridor',
      speedLimitKmh: 60,
      lanes: 4,
      width: 5.2,
      lengthMeters: 480,
      status: 'Normal Flow',
      throughputVehiclesPerDay: 26800,
      connectedDistricts: ['Elysium Citadel', 'Vulcan Forge Basin'],
      connectedBuildings: ['Vulcan Smelter Hub A', 'Vulcan Composites Complex', 'Ridge Wind Generator Alpha'],
      description: 'Heavy reinforced industrial corridor built for freight haulers and robotic transport.',
    },
    {
      id: 'road-citadel-ring',
      name: 'Citadel Grand Boulevard Ring',
      category: 'district_avenue',
      speedLimitKmh: 50,
      lanes: 2,
      width: 3.8,
      lengthMeters: 380,
      status: 'Optimal',
      throughputVehiclesPerDay: 19500,
      connectedDistricts: ['Elysium Citadel'],
      connectedBuildings: ['High Council Citadel', 'Elysium Spire Alpha', 'Elysium Spire Beta'],
      description: 'Circular ceremonial promenade encircling the Planetary Senate Citadel and administrative grounds.',
    },
    {
      id: 'road-bridge-central',
      name: 'Central Citadel Grand Arch Bridge',
      category: 'architectural_bridge',
      speedLimitKmh: 60,
      lanes: 4,
      width: 5.6,
      lengthMeters: 165,
      status: 'Optimal',
      throughputVehiclesPerDay: 34500,
      connectedDistricts: ['Elysium Citadel'],
      connectedBuildings: ['High Council Citadel'],
      description: 'Iconic architectural river bridge with steel arch suspension, deep piers, and illuminated railings.',
    },
    {
      id: 'road-bridge-west',
      name: 'West Aethel Ridge Suspension Bridge',
      category: 'architectural_bridge',
      speedLimitKmh: 60,
      lanes: 2,
      width: 4.5,
      lengthMeters: 150,
      status: 'Normal Flow',
      throughputVehiclesPerDay: 18200,
      connectedDistricts: ['Aethel Ridge Science Park'],
      connectedBuildings: ['Quantum Telemetry Array'],
      description: 'Engineered highway crossing spanning the river gorge toward the western science ridge.',
    },
    {
      id: 'road-bridge-east',
      name: 'East Vulcan Industrial Truss Bridge',
      category: 'architectural_bridge',
      speedLimitKmh: 50,
      lanes: 2,
      width: 4.5,
      lengthMeters: 155,
      status: 'Normal Flow',
      throughputVehiclesPerDay: 21400,
      connectedDistricts: ['Vulcan Forge Basin', 'Oasis Terraces'],
      connectedBuildings: ['Vulcan Smelter Hub A'],
      description: 'Reinforced heavy-load bridge facilitating inter-district transport between factories and habitats.',
    },
    {
      id: 'road-res-loop',
      name: 'Oasis Terraces Residential Parkway',
      category: 'residential_street',
      speedLimitKmh: 40,
      lanes: 2,
      width: 3.6,
      lengthMeters: 320,
      status: 'Optimal',
      throughputVehiclesPerDay: 14200,
      connectedDistricts: ['Oasis Terraces'],
      connectedBuildings: ['Oasis Terraces Hab Block', 'Oasis Cellular Care Clinic'],
      description: 'Curved residential street network serving arcology habitats, neighborhood parks, and medical clinics.',
    },
    {
      id: 'road-agri-loop',
      name: 'Verdant Vale Agrisector Agro-Corridor',
      category: 'district_avenue',
      speedLimitKmh: 45,
      lanes: 2,
      width: 3.6,
      lengthMeters: 340,
      status: 'Optimal',
      throughputVehiclesPerDay: 12800,
      connectedDistricts: ['Verdant Vale Agrisector'],
      connectedBuildings: ['Valley Bio-Dome Prime', 'Algal Synthesis Basin'],
      description: 'Service road network linking hydroponic farming domes and bio-reclamation facilities.',
    },
  ], [rates.gdpGrowthRate]);

  // Centralized selection handler
  const handleSelectRoad = (road: RoadSegmentData) => {
    setSelectedRoadId(road.id);
    triggerRoadSelection(road);
  };

  // ================= MATHEMATICALLY EXACT ROAD GEOMETRY GENERATION =================
  const roadGeometries = useMemo(() => {
    // 1. North-South Central Grand Arterial (Width 5.4m)
    // North Approach: stops exactly at Central Bridge North abutment Z = -10.5
    const nsNorth = createTerrainAdaptiveRoadGeometry([[0, -44], [0, -10.5]], 5.4);
    const nsNorthSW = createSidewalksGeometry([[0, -44], [0, -10.5]], 5.4);
    const nsNorthMarks = createRoadMarkingsGeometry([[0, -44], [0, -10.5]], 5.4, 'double-yellow');
    const nsNorthDashes = createRoadMarkingsGeometry([[0, -44], [0, -10.5]], 5.4, 'dual-dash');

    // South Bridge Approach to Dais: Z = 4.5 to Z = 5.6 (meets Citadel Ring North apex at Z = 5.6)
    const nsDaisApproach = createTerrainAdaptiveRoadGeometry([[0, 4.5], [0, 5.6]], 5.4, 0.08, 0.75);
    const nsDaisApproachSW = createSidewalksGeometry([[0, 4.5], [0, 5.6]], 5.4, 0.75, 0.08, 0.75);
    const nsDaisMarks = createRoadMarkingsGeometry([[0, 4.5], [0, 5.6]], 5.4, 'double-yellow', 0.08, 0.75);

    // Citadel Ring to South Crossroads: Z = 20.4 to Z = 21.2 (from Citadel Ring South apex at Z = 20.4)
    const nsCitadelToCross = createTerrainAdaptiveRoadGeometry([[0, 20.4], [0, 21.2]], 5.4);
    const nsCitadelToCrossSW = createSidewalksGeometry([[0, 20.4], [0, 21.2]], 5.4);
    const nsCitadelMarks = createRoadMarkingsGeometry([[0, 20.4], [0, 21.2]], 5.4, 'double-yellow');

    // South Crossroads to Oasis South Terminal: Z = 26.8 to Z = 44
    const nsSouth = createTerrainAdaptiveRoadGeometry([[0, 26.8], [0, 44]], 5.4);
    const nsSouthSW = createSidewalksGeometry([[0, 26.8], [0, 44]], 5.4);
    const nsSouthMarks = createRoadMarkingsGeometry([[0, 26.8], [0, 44]], 5.4, 'double-yellow');
    const nsSouthDashes = createRoadMarkingsGeometry([[0, 26.8], [0, 44]], 5.4, 'dual-dash');

    // 2. East-West Grand Arterial (Outer High-Speed Wings along Z = 0)
    // West Arm: X = -44 to X = -27.6 (terminates cleanly at West Crossroads)
    const ewWest = createTerrainAdaptiveRoadGeometry([[-44, 0], [-27.6, 0]], 5.2);
    const ewWestSW = createSidewalksGeometry([[-44, 0], [-27.6, 0]], 5.2);
    const ewWestMarks = createRoadMarkingsGeometry([[-44, 0], [-27.6, 0]], 5.2, 'double-yellow');

    // East Arm: X = 27.6 to X = 44 (begins cleanly from East Crossroads)
    const ewEast = createTerrainAdaptiveRoadGeometry([[27.6, 0], [44, 0]], 5.2);
    const ewEastSW = createSidewalksGeometry([[27.6, 0], [44, 0]], 5.2);
    const ewEastMarks = createRoadMarkingsGeometry([[27.6, 0], [44, 0]], 5.2, 'double-yellow');

    // 3. West Science Highway (Width 4.2m, along X = -25)
    // North Arm: Z = -38 to Z = -23.7 (meets West Suspension Bridge)
    const westNorth = createTerrainAdaptiveRoadGeometry([[-25, -38], [-25, -23.7]], 4.2);
    const westNorthSW = createSidewalksGeometry([[-25, -38], [-25, -23.7]], 4.2);
    const westNorthMarks = createRoadMarkingsGeometry([[-25, -38], [-25, -23.7]], 4.2, 'single-white');

    // South from West Bridge: Z = -8.7 to Z = -2.8 (meets West Crossroads)
    const westMid1 = createTerrainAdaptiveRoadGeometry([[-25, -8.7], [-25, -2.8]], 4.2);
    const westMid1SW = createSidewalksGeometry([[-25, -8.7], [-25, -2.8]], 4.2);
    const westMid1Marks = createRoadMarkingsGeometry([[-25, -8.7], [-25, -2.8]], 4.2, 'single-white');

    // South from West Crossroads to South Crossroads: Z = 2.8 to Z = 21.8
    const westMid2 = createTerrainAdaptiveRoadGeometry([[-25, 2.8], [-25, 21.8]], 4.2);
    const westMid2SW = createSidewalksGeometry([[-25, 2.8], [-25, 21.8]], 4.2);
    const westMid2Marks = createRoadMarkingsGeometry([[-25, 2.8], [-25, 21.8]], 4.2, 'single-white');

    // South from South Crossroads to Agrisector Dome: Z = 26.2 to Z = 38
    const westSouth = createTerrainAdaptiveRoadGeometry([[-25, 26.2], [-25, 38]], 4.2);
    const westSouthSW = createSidewalksGeometry([[-25, 26.2], [-25, 38]], 4.2);
    const westSouthMarks = createRoadMarkingsGeometry([[-25, 26.2], [-25, 38]], 4.2, 'single-white');

    // 4. East Vulcan Industrial Highway (Width 4.2m, along X = 25)
    // North Arm: Z = -38 to Z = 0.25 (meets East Truss Bridge North)
    const eastNorth1 = createTerrainAdaptiveRoadGeometry([[25, -38], [25, -24.2]], 4.2);
    const eastNorth2 = createTerrainAdaptiveRoadGeometry([[25, -19.8], [25, 0.25]], 4.2);
    const eastNorthSW = createSidewalksGeometry([[25, -38], [25, 0.25]], 4.2);
    const eastNorthMarks = createRoadMarkingsGeometry([[25, -38], [25, 0.25]], 4.2, 'single-white');

    // South from East Truss Bridge to South Crossroads: Z = 15.75 to Z = 21.8
    const eastSouth1 = createTerrainAdaptiveRoadGeometry([[25, 15.75], [25, 21.8]], 4.2);
    const eastSouth1SW = createSidewalksGeometry([[25, 15.75], [25, 21.8]], 4.2);
    const eastSouth1Marks = createRoadMarkingsGeometry([[25, 15.75], [25, 21.8]], 4.2, 'single-white');

    // South Extension to Residential Habitats: Z = 26.2 to Z = 38
    const eastSouth2 = createTerrainAdaptiveRoadGeometry([[25, 26.2], [25, 38]], 4.2);
    const eastSouth2SW = createSidewalksGeometry([[25, 26.2], [25, 38]], 4.2);
    const eastSouth2Marks = createRoadMarkingsGeometry([[25, 26.2], [25, 38]], 4.2, 'single-white');

    // 5. South District Cross-Arterial (Width 3.8m, along Z = 24)
    // West Segment: X = -22.8 to X = -2.9
    const crossSouthWest = createTerrainAdaptiveRoadGeometry([[-22.8, 24], [-2.9, 24]], 3.8);
    const crossSouthWestSW = createSidewalksGeometry([[-22.8, 24], [-2.9, 24]], 3.8);
    const crossSouthWestMarks = createRoadMarkingsGeometry([[-22.8, 24], [-2.9, 24]], 3.8, 'single-white');

    // East Segment: X = 2.9 to X = 22.8
    const crossSouthEast = createTerrainAdaptiveRoadGeometry([[2.9, 24], [22.8, 24]], 3.8);
    const crossSouthEastSW = createSidewalksGeometry([[2.9, 24], [22.8, 24]], 3.8);
    const crossSouthEastMarks = createRoadMarkingsGeometry([[2.9, 24], [22.8, 24]], 3.8, 'single-white');

    // 6. North Industrial & Science Connectors (Width 3.6m, along Z = -22)
    const connNorthEast = createTerrainAdaptiveRoadGeometry([[2.9, -22], [22.8, -22]], 3.6);
    const connNorthEastSub = createTerrainAdaptiveRoadGeometry([[27.2, -22], [38, -22]], 3.6);
    const connNorthWest = createTerrainAdaptiveRoadGeometry([[-22.8, -22], [-2.9, -22]], 3.6);

    // 7. Clean Intersection Junction Plazas
    const juncCitadelSouth = createIntersectionJunctionGeometry([0, 24], 5.6, 5.8);
    const juncWestCross = createIntersectionJunctionGeometry([-25, 0], 4.4, 5.4);
    const juncEastCross = createIntersectionJunctionGeometry([25, 0], 4.4, 5.4);
    const juncAgrisectorT = createIntersectionJunctionGeometry([-25, 24], 4.4, 4.0);
    const juncResidentialT = createIntersectionJunctionGeometry([25, 24], 4.4, 4.0);
    const juncNorthCenterT = createIntersectionJunctionGeometry([0, -22], 5.6, 4.0);
    const juncNorthEastT = createIntersectionJunctionGeometry([25, -22], 4.4, 4.0);

    return {
      nsNorth, nsNorthSW, nsNorthMarks, nsNorthDashes,
      nsDaisApproach, nsDaisApproachSW, nsDaisMarks,
      nsCitadelToCross, nsCitadelToCrossSW, nsCitadelMarks,
      nsSouth, nsSouthSW, nsSouthMarks, nsSouthDashes,
      ewWest, ewWestSW, ewWestMarks,
      ewEast, ewEastSW, ewEastMarks,
      westNorth, westNorthSW, westNorthMarks,
      westMid1, westMid1SW, westMid1Marks,
      westMid2, westMid2SW, westMid2Marks,
      westSouth, westSouthSW, westSouthMarks,
      eastNorth1, eastNorth2, eastNorthSW, eastNorthMarks,
      eastSouth1, eastSouth1SW, eastSouth1Marks,
      eastSouth2, eastSouth2SW, eastSouth2Marks,
      crossSouthWest, crossSouthWestSW, crossSouthWestMarks,
      crossSouthEast, crossSouthEastSW, crossSouthEastMarks,
      connNorthEast, connNorthEastSub, connNorthWest,
      juncCitadelSouth, juncWestCross, juncEastCross,
      juncAgrisectorT, juncResidentialT, juncNorthCenterT, juncNorthEastT,
    };
  }, []);

  const asphaltMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#272d29', roughness: 0.92, metalness: 0.08 }),
    []
  );
  const sidewalkMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#667368', roughness: 0.75 }),
    []
  );
  const yellowMarkingMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#e5c46d' }),
    []
  );
  const whiteMarkingMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.75 }),
    []
  );

  return (
    <group>
      {/* ================= 1. CLEAN TERRAIN-ADAPTIVE ROAD CARPETS ================= */}
      {/* North-South Grand Arterial */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          handleSelectRoad(roadSegments[0]);
        }}
      >
        <mesh geometry={roadGeometries.nsNorth} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.nsNorthSW} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.nsNorthMarks} material={yellowMarkingMat} raycast={() => null} />
        <mesh geometry={roadGeometries.nsNorthDashes} material={whiteMarkingMat} raycast={() => null} />

        <mesh geometry={roadGeometries.nsDaisApproach} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.nsDaisApproachSW} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.nsDaisMarks} material={yellowMarkingMat} raycast={() => null} />

        <mesh geometry={roadGeometries.nsCitadelToCross} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.nsCitadelToCrossSW} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.nsCitadelMarks} material={yellowMarkingMat} raycast={() => null} />

        <mesh geometry={roadGeometries.nsSouth} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.nsSouthSW} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.nsSouthMarks} material={yellowMarkingMat} raycast={() => null} />
        <mesh geometry={roadGeometries.nsSouthDashes} material={whiteMarkingMat} raycast={() => null} />
      </group>

      {/* East-West Grand Arterial (Outer High-Speed Wings) */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          handleSelectRoad(roadSegments[2]);
        }}
      >
        <mesh geometry={roadGeometries.ewWest} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.ewWestSW} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.ewWestMarks} material={yellowMarkingMat} raycast={() => null} />

        <mesh geometry={roadGeometries.ewEast} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.ewEastSW} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.ewEastMarks} material={yellowMarkingMat} raycast={() => null} />
      </group>

      {/* West Science Highway */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          handleSelectRoad(roadSegments[9]);
        }}
      >
        <mesh geometry={roadGeometries.westNorth} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.westNorthSW} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.westNorthMarks} material={whiteMarkingMat} raycast={() => null} />

        <mesh geometry={roadGeometries.westMid1} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.westMid1SW} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.westMid1Marks} material={whiteMarkingMat} raycast={() => null} />

        <mesh geometry={roadGeometries.westMid2} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.westMid2SW} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.westMid2Marks} material={whiteMarkingMat} raycast={() => null} />

        <mesh geometry={roadGeometries.westSouth} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.westSouthSW} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.westSouthMarks} material={whiteMarkingMat} raycast={() => null} />
      </group>

      {/* East Vulcan Industrial Highway */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          handleSelectRoad(roadSegments[3]);
        }}
      >
        <mesh geometry={roadGeometries.eastNorth1} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.eastNorth2} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.eastNorthSW} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.eastNorthMarks} material={whiteMarkingMat} raycast={() => null} />

        <mesh geometry={roadGeometries.eastSouth1} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.eastSouth1SW} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.eastSouth1Marks} material={whiteMarkingMat} raycast={() => null} />

        <mesh geometry={roadGeometries.eastSouth2} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.eastSouth2SW} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.eastSouth2Marks} material={whiteMarkingMat} raycast={() => null} />
      </group>

      {/* South District Cross-Arterial */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          handleSelectRoad(roadSegments[8]);
        }}
      >
        <mesh geometry={roadGeometries.crossSouthWest} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.crossSouthWestSW} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.crossSouthWestMarks} material={whiteMarkingMat} raycast={() => null} />

        <mesh geometry={roadGeometries.crossSouthEast} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.crossSouthEastSW} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.crossSouthEastMarks} material={whiteMarkingMat} raycast={() => null} />
      </group>

      {/* North District Connectors */}
      <group raycast={() => null}>
        <mesh geometry={roadGeometries.connNorthEast} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.connNorthEastSub} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.connNorthWest} material={asphaltMat} receiveShadow />
      </group>

      {/* ================= 2. SEAMLESS INTERSECTION JUNCTION PLAZAS ================= */}
      <group raycast={() => null}>
        <mesh geometry={roadGeometries.juncCitadelSouth} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.juncWestCross} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.juncEastCross} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.juncAgrisectorT} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.juncResidentialT} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.juncNorthCenterT} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.juncNorthEastT} material={asphaltMat} receiveShadow />
      </group>

      {/* ================= 3. CITADEL GRAND BOULEVARD RING ================= */}
      {/* Encircles the elevated Citadel Civic Terrace South of river at [0, 13] */}
      <group
        position={[0, 1.05, 13]}
        onClick={(e) => {
          e.stopPropagation();
          handleSelectRoad(roadSegments[4]);
        }}
      >
        {/* Asphalt Ring Roadway */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <ringGeometry args={[5.6, 7.8, 48]} />
          <meshStandardMaterial color="#272d29" roughness={0.92} metalness={0.08} side={THREE.DoubleSide} />
        </mesh>
        {/* Center Yellow Dividing Line */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} raycast={() => null}>
          <ringGeometry args={[6.65, 6.75, 48]} />
          <meshBasicMaterial color="#e5c46d" side={THREE.DoubleSide} />
        </mesh>
        {/* Outer Raised Sidewalk & Curb */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.016, 0]} receiveShadow raycast={() => null}>
          <ringGeometry args={[7.8, 8.4, 48]} />
          <meshStandardMaterial color="#667368" roughness={0.75} side={THREE.DoubleSide} />
        </mesh>
        {/* Inner Dais Promenade Curb */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.016, 0]} receiveShadow raycast={() => null}>
          <ringGeometry args={[5.0, 5.6, 48]} />
          <meshStandardMaterial color="#667368" roughness={0.75} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* ================= 4. ZEBRA PEDESTRIAN CROSSINGS AT JUNCTIONS ================= */}
      {/* South 4-Way Crossroads (Z = 24) */}
      <ZebraPedestrianCrossing position={[0, 0.86, 21.4]} width={5.4} length={2.2} />
      <ZebraPedestrianCrossing position={[0, 0.86, 26.6]} width={5.4} length={2.2} />
      <ZebraPedestrianCrossing position={[-2.8, 0.86, 24]} width={3.8} length={2.2} rotationY={Math.PI / 2} />
      <ZebraPedestrianCrossing position={[2.8, 0.86, 24]} width={3.8} length={2.2} rotationY={Math.PI / 2} />

      {/* Central Bridge Abutments */}
      <ZebraPedestrianCrossing position={[0, 0.76, -10.2]} width={5.4} length={2.2} />
      <ZebraPedestrianCrossing position={[0, 0.76, 4.3]} width={5.4} length={2.2} />

      {/* ================= 5. ANIMATED TRAFFIC SIGNALS ================= */}
      <TrafficIntersectionSignals />

      {/* ================= 6. ARCHITECTURAL RIVER BRIDGES ================= */}
      {/* Central Citadel Grand Arch Bridge */}
      <ArchitecturalBridge
        id="road-bridge-central"
        name="Central Citadel Grand Arch Bridge"
        position={[0, 0.32, -3.0]}
        length={15.0}
        width={5.6}
        isSelected={selectedRoadId === 'road-bridge-central'}
        onSelect={() => handleSelectRoad(roadSegments[5])}
      />

      {/* West Aethel Ridge Suspension Bridge */}
      <ArchitecturalBridge
        id="road-bridge-west"
        name="West Aethel Ridge Suspension Bridge"
        position={[-25, 0.32, -16.2]}
        length={15.0}
        width={4.5}
        isSelected={selectedRoadId === 'road-bridge-west'}
        onSelect={() => handleSelectRoad(roadSegments[6])}
      />

      {/* East Vulcan Industrial Truss Bridge */}
      <ArchitecturalBridge
        id="road-bridge-east"
        name="East Vulcan Industrial Truss Bridge"
        position={[25, 0.32, 8.0]}
        length={15.5}
        width={4.5}
        rotationY={0.14}
        isSelected={selectedRoadId === 'road-bridge-east'}
        onSelect={() => handleSelectRoad(roadSegments[7])}
      />
    </group>
  );
}

export default React.memo(RoadNetwork);
