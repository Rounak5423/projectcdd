import React, { useState, useMemo, useRef } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { getTerrainHeight, isNearRiver } from './Terrain';
import { useIsNight } from './DayNightController';
import { useGameState } from '../../context/GameStateContext';
import { RoadSegmentData } from '../../types/road';
import { triggerRoadSelection } from './WorldLabelManager';
import {
  sampleSplinePath,
  createContinuousRoadMesh,
  createContinuousSidewalkMesh,
  createContinuousMarkingsMesh,
  createCulDeSacGeometry,
  createRoundaboutGeometry,
  createEngineeredJunctionGeometry,
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
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.22, 0.26, 0.2, 8]} />
        <meshStandardMaterial color="#2d332e" metalness={0.7} />
      </mesh>
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 3.4, 8]} />
        <meshStandardMaterial color="#2d332e" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.7, 3.3, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.06, 1.4, 8]} />
        <meshStandardMaterial color="#2d332e" metalness={0.7} />
      </mesh>
      <mesh position={[1.3, 3.1, 0]}>
        <boxGeometry args={[0.28, 0.9, 0.26]} />
        <meshStandardMaterial color="#1f2420" roughness={0.8} />
      </mesh>
      <mesh position={[1.3, 3.36, 0.12]}>
        <sphereGeometry args={[0.09, 10, 10]} />
        <meshStandardMaterial
          color={isRed ? '#ff3838' : '#4a1515'}
          emissive={isRed ? '#ff2222' : '#000000'}
          emissiveIntensity={isRed ? (isNight ? 2.8 : 1.8) : 0}
        />
      </mesh>
      <mesh position={[1.3, 3.1, 0.12]}>
        <sphereGeometry args={[0.09, 10, 10]} />
        <meshStandardMaterial
          color={isYellow ? '#ffbb33' : '#4a3810'}
          emissive={isYellow ? '#ffaa00' : '#000000'}
          emissiveIntensity={isYellow ? (isNight ? 2.8 : 1.8) : 0}
        />
      </mesh>
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

// Traffic Signals Controller
const TrafficIntersectionSignals = React.memo(function TrafficIntersectionSignals() {
  const [signalState, setSignalState] = useState<TrafficSignalState>(globalTrafficSignal);

  useFrame(({ clock }) => {
    const cycleTime = clock.getElapsedTime() % 22;
    let phase = 0;
    if (cycleTime < 8.5) phase = 0;
    else if (cycleTime < 11.0) phase = 1;
    else if (cycleTime < 19.5) phase = 2;
    else phase = 3;

    const nextState: TrafficSignalState = {
      isNorthSouthGreen: phase === 0,
      isNorthSouthYellow: phase === 1,
      isEastWestGreen: phase === 2,
      isEastWestYellow: phase === 3,
    };
    globalTrafficSignal = nextState;
    setSignalState(nextState);
  });

  return (
    <>
      <TrafficSignalPost
        position={[2.8, 0.85, 22.0]}
        rotationY={Math.PI}
        isGreen={signalState.isNorthSouthGreen}
        isYellow={signalState.isNorthSouthYellow}
        isRed={!signalState.isNorthSouthGreen && !signalState.isNorthSouthYellow}
      />
      <TrafficSignalPost
        position={[-2.8, 0.85, 27.2]}
        rotationY={0}
        isGreen={signalState.isNorthSouthGreen}
        isYellow={signalState.isNorthSouthYellow}
        isRed={!signalState.isNorthSouthGreen && !signalState.isNorthSouthYellow}
      />
      <TrafficSignalPost
        position={[-3.2, 0.85, 27.2]}
        rotationY={-Math.PI / 2}
        isGreen={signalState.isEastWestGreen}
        isYellow={signalState.isEastWestYellow}
        isRed={!signalState.isEastWestGreen && !signalState.isEastWestYellow}
      />
      <TrafficSignalPost
        position={[3.2, 0.85, 22.0]}
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

      {/* Bridge Deck Slab */}
      <mesh position={[0, 0.35, 0]} receiveShadow>
        <boxGeometry args={[width, 0.5, length]} />
        <meshStandardMaterial
          color={hovered ? '#3b433c' : '#272d29'}
          roughness={0.85}
          metalness={0.15}
        />
      </mesh>

      {/* Steel Deck Girder Trusses */}
      {[-width * 0.5 - 0.12, width * 0.5 + 0.12].map((xSide, i) => (
        <group key={i} position={[xSide, 0.35, 0]} raycast={() => null}>
          <mesh>
            <boxGeometry args={[0.22, 0.65, length + 0.2]} />
            <meshStandardMaterial color="#556058" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Steel Parapet Railing */}
          <mesh position={[0, 0.55, 0]}>
            <boxGeometry args={[0.12, 0.45, length]} />
            <meshStandardMaterial color="#333a35" metalness={0.7} />
          </mesh>
        </group>
      ))}

      {/* Grand Arch Suspension Ribs */}
      {[-width * 0.5 - 0.2, width * 0.5 + 0.2].map((xSide, i) => (
        <group key={i} position={[xSide, 0.6, 0]} raycast={() => null}>
          {Array.from({ length: 9 }).map((_, st) => {
            const zRel = -length * 0.44 + (st * length * 0.88) / 8;
            const archY = 2.2 * (1 - Math.pow(zRel / (length * 0.5), 2));
            return (
              <group key={st} position={[0, 0, zRel]}>
                <mesh position={[0, archY * 0.5, 0]}>
                  <cylinderGeometry args={[0.03, 0.03, Math.max(0.2, archY), 6]} />
                  <meshStandardMaterial color="#e0be70" metalness={0.9} roughness={0.2} />
                </mesh>
              </group>
            );
          })}
        </group>
      ))}

      {/* Luminous Architectural Deck Beacons */}
      {[-length * 0.48, 0, length * 0.48].map((zOffset, pIdx) => (
        <group key={pIdx} position={[width * 0.5 + 0.18, 0.8, zOffset]} raycast={() => null}>
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.06, 0.08, 0.7, 8]} />
            <meshStandardMaterial color="#2d332e" metalness={0.8} />
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

// Zebra Pedestrian Crossing
function ZebraPedestrianCrossing({
  position,
  width,
  length = 2.2,
  rotationY = 0,
}: {
  position: [number, number, number];
  width: number;
  length?: number;
  rotationY?: number;
}) {
  const stripeCount = Math.max(3, Math.floor(width / 0.7));
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

// ================= MASTER RECONSTRUCTED ROAD NETWORK =================
function RoadNetwork() {
  const { rates } = useGameState();
  const [selectedRoadId, setSelectedRoadId] = useState<string | null>(null);

  // Road segment telemetry definitions
  const roadSegments: RoadSegmentData[] = useMemo(() => [
    {
      id: 'road-ns-north',
      name: 'Elysium Grand Boulevard (North Riverfront Axis)',
      category: 'grand_arterial',
      speedLimitKmh: 70,
      lanes: 4,
      width: 5.4,
      lengthMeters: 420,
      status: 'Optimal',
      throughputVehiclesPerDay: Math.round(28400 * (1 + rates.gdpGrowthRate / 10)),
      connectedDistricts: ['Northern Terraces', 'Elysium Citadel'],
      connectedBuildings: ['Planetary Senate Citadel', 'Elysium Central Biosphere Park'],
      description: 'Primary 4-lane landscaped arterial connecting the northern territory to the Central River Bridge.',
    },
    {
      id: 'road-civic-crescent',
      name: 'Elysium Civic Promenade & Forum Crescent',
      category: 'grand_arterial',
      speedLimitKmh: 45,
      lanes: 2,
      width: 4.8,
      lengthMeters: 380,
      status: 'Optimal',
      throughputVehiclesPerDay: 19500,
      connectedDistricts: ['Elysium Citadel'],
      connectedBuildings: ['Planetary Senate Citadel', 'Civilization Stage Monument'],
      description: 'Elegant dual-crescent promenade encircling the High Council forum with wide pedestrian sidewalks and plazas.',
    },
    {
      id: 'road-ns-south',
      name: 'Oasis Terraces Grand Boulevard (South Corridor)',
      category: 'grand_arterial',
      speedLimitKmh: 70,
      lanes: 4,
      width: 5.4,
      lengthMeters: 460,
      status: 'Optimal',
      throughputVehiclesPerDay: Math.round(31200 * (1 + rates.gdpGrowthRate / 10)),
      connectedDistricts: ['Elysium Citadel', 'Oasis Terraces'],
      connectedBuildings: ['High Council Citadel', 'Oasis Habitation Arcology', 'Cellular Care Clinic'],
      description: 'High-capacity 4-lane spine connecting the civic center south to the territorial gateway.',
    },
    {
      id: 'road-west-science',
      name: 'Aethel Ridge Science Highway',
      category: 'district_avenue',
      speedLimitKmh: 60,
      lanes: 2,
      width: 4.2,
      lengthMeters: 520,
      status: 'Normal Flow',
      throughputVehiclesPerDay: 18400,
      connectedDistricts: ['Aethel Ridge Science Park', 'Elysium Citadel'],
      connectedBuildings: ['Quantum Telemetry Observatory', 'Helios Solar Concentration Array'],
      description: 'Curved scenic highway following the river bluff west with direct observatory cul-de-sac turnaround.',
    },
    {
      id: 'road-east-industrial',
      name: 'Vulcan Forge Industrial Expressway',
      category: 'district_avenue',
      speedLimitKmh: 55,
      lanes: 2,
      width: 4.2,
      lengthMeters: 540,
      status: 'Normal Flow',
      throughputVehiclesPerDay: 23600,
      connectedDistricts: ['Vulcan Forge Basin'],
      connectedBuildings: ['Vulcan Smelter Hub A', 'Industrial Foundry Complex'],
      description: 'Heavy transport logistics corridor serving foundries and smelters with industrial cul-de-sac.',
    },
    {
      id: 'road-south-parkway',
      name: 'South Aquifer Transverse Parkway',
      category: 'district_avenue',
      speedLimitKmh: 50,
      lanes: 2,
      width: 4.2,
      lengthMeters: 480,
      status: 'Optimal',
      throughputVehiclesPerDay: 17200,
      connectedDistricts: ['Verdant Vale Agrisector', 'Oasis Terraces', 'Vulcan Forge Basin'],
      connectedBuildings: ['Polytechnic Academy', 'Oasis Cellular Care Clinic'],
      description: 'Unified cross-town avenue connecting agricultural, residential, and industrial districts.',
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
      connectedBuildings: ['Planetary Senate Citadel'],
      description: 'Iconic suspension arch bridge over the central river gorge.',
    },
  ], [rates.gdpGrowthRate]);

  const handleSelectRoad = (road: RoadSegmentData) => {
    setSelectedRoadId(road.id);
    triggerRoadSelection(road);
  };

  // ================= MATHEMATICALLY EXACT PROCEDURAL ROAD RECONSTRUCTION =================
  const roadGeometries = useMemo(() => {
    // 1. PRIMARY GRAND BOULEVARD (North Corridor: [0, -44] to Central Bridge [0, -10.5])
    const nodesNsNorth = sampleSplinePath([[0, -44.0], [0, -32.0], [0.6, -22.0], [0, -10.5]], 1.0);
    const meshNsNorth = createContinuousRoadMesh(nodesNsNorth, 5.4);
    const swNsNorth = createContinuousSidewalkMesh(nodesNsNorth, 5.4, 0.85);
    const marksNsNorth = createContinuousMarkingsMesh(nodesNsNorth, 5.4, 'double-yellow');
    const dashesNsNorth = createContinuousMarkingsMesh(nodesNsNorth, 5.4, 'dual-dash');

    // 2. CIVIC RIVERFRONT ESPLANADE ROUNDABOUT (At [0, 6.0], South of Central Bridge)
    const roundaboutCivic = createRoundaboutGeometry([0, 6.0], 5.8, 2.4, 0.08);

    // Bridge south abutment ramp: [0, 4.5] to Roundabout north throat [0, 6.0 - 5.8 = 0.2]
    const nodesBridgeSouthThroat = sampleSplinePath([[0, 4.5], [0, 5.8]], 0.8, 0.75, 0.08);
    const meshBridgeSouthThroat = createContinuousRoadMesh(nodesBridgeSouthThroat, 5.4);
    const swBridgeSouthThroat = createContinuousSidewalkMesh(nodesBridgeSouthThroat, 5.4, 0.85);
    const marksBridgeSouthThroat = createContinuousMarkingsMesh(nodesBridgeSouthThroat, 5.4, 'double-yellow');

    // 3. ELYSIUM CIVIC PROMENADE CRESCENTS (Encompassing the Forum around Citadel [0, 13])
    // West Crescent: Spline arcing from Roundabout [0, 6.0] -> West flank -> South Gateway [0, 20.0]
    const nodesForumWest = sampleSplinePath([
      [-1.8, 6.8],
      [-5.2, 8.5],
      [-7.8, 12.0],
      [-7.8, 15.5],
      [-5.2, 18.5],
      [-1.8, 20.0],
    ], 0.9);
    const meshForumWest = createContinuousRoadMesh(nodesForumWest, 4.6);
    const swForumWest = createContinuousSidewalkMesh(nodesForumWest, 4.6, 0.9);
    const marksForumWest = createContinuousMarkingsMesh(nodesForumWest, 4.6, 'single-white');

    // East Crescent: Spline arcing from Roundabout [0, 6.0] -> East flank -> South Gateway [0, 20.0]
    const nodesForumEast = sampleSplinePath([
      [1.8, 6.8],
      [5.2, 8.5],
      [7.8, 12.0],
      [7.8, 15.5],
      [5.2, 18.5],
      [1.8, 20.0],
    ], 0.9);
    const meshForumEast = createContinuousRoadMesh(nodesForumEast, 4.6);
    const swForumEast = createContinuousSidewalkMesh(nodesForumEast, 4.6, 0.9);
    const marksForumEast = createContinuousMarkingsMesh(nodesForumEast, 4.6, 'single-white');

    // 4. CENTRAL HUB ROUNDABOUT (At [0, 24.5], junction of South Boulevard and Cross Parkway)
    const roundaboutCentralHub = createRoundaboutGeometry([0, 24.5], 6.2, 2.8, 0.08);

    // Forum South Link: [0, 20.0] to Central Hub Roundabout North throat [0, 24.5 - 6.2 = 18.3]
    const nodesForumToHub = sampleSplinePath([[0, 20.0], [0, 21.8], [0, 23.5]], 0.8);
    const meshForumToHub = createContinuousRoadMesh(nodesForumToHub, 5.4);
    const swForumToHub = createContinuousSidewalkMesh(nodesForumToHub, 5.4, 0.85);
    const marksForumToHub = createContinuousMarkingsMesh(nodesForumToHub, 5.4, 'double-yellow');

    // 5. PRIMARY GRAND BOULEVARD (South Corridor: [0, 24.5] to South Boundary [0, 44.0])
    const nodesNsSouth = sampleSplinePath([[0, 25.5], [0, 31.0], [0.5, 37.0], [0, 44.0]], 1.0);
    const meshNsSouth = createContinuousRoadMesh(nodesNsSouth, 5.4);
    const swNsSouth = createContinuousSidewalkMesh(nodesNsSouth, 5.4, 0.85);
    const marksNsSouth = createContinuousMarkingsMesh(nodesNsSouth, 5.4, 'double-yellow');
    const dashesNsSouth = createContinuousMarkingsMesh(nodesNsSouth, 5.4, 'dual-dash');

    // 6. WEST RIVERFRONT SCIENCE HIGHWAY (Across West Bridge [-25, -8.7] to West Junction [-19.5, 24.5])
    // North Approach: [-25, -44.0] to West Bridge North abutment [-25, -23.7]
    const nodesWestNorth = sampleSplinePath([[-25.0, -44.0], [-25.0, -34.0], [-25.0, -23.7]], 1.0);
    const meshWestNorth = createContinuousRoadMesh(nodesWestNorth, 4.2);
    const swWestNorth = createContinuousSidewalkMesh(nodesWestNorth, 4.2, 0.85);
    const marksWestNorth = createContinuousMarkingsMesh(nodesWestNorth, 4.2, 'single-white');

    // South from West Bridge: curves along river bluff to West Crossroads [-19.5, 24.5]
    const nodesWestSouth = sampleSplinePath([
      [-25.0, -8.7],
      [-24.6, -2.0],
      [-23.2, 5.0],
      [-21.8, 13.0],
      [-20.4, 19.5],
      [-19.5, 24.5],
    ], 1.0);
    const meshWestSouth = createContinuousRoadMesh(nodesWestSouth, 4.2);
    const swWestSouth = createContinuousSidewalkMesh(nodesWestSouth, 4.2, 0.85);
    const marksWestSouth = createContinuousMarkingsMesh(nodesWestSouth, 4.2, 'single-white');

    // 7. EAST RIVERFRONT INDUSTRIAL HIGHWAY (Across East Bridge to East Crossroads [19.5, 24.5])
    // North Approach: [25, -44.0] to East Bridge North abutment [25, 0.25]
    const nodesEastNorth = sampleSplinePath([[25.0, -44.0], [25.0, -32.0], [25.0, -18.0], [25.0, 0.25]], 1.0);
    const meshEastNorth = createContinuousRoadMesh(nodesEastNorth, 4.2);
    const swEastNorth = createContinuousSidewalkMesh(nodesEastNorth, 4.2, 0.85);
    const marksEastNorth = createContinuousMarkingsMesh(nodesEastNorth, 4.2, 'single-white');

    // South from East Bridge: [25, 15.75] curves to East Crossroads [19.5, 24.5]
    const nodesEastSouth = sampleSplinePath([
      [25.0, 15.75],
      [24.2, 19.0],
      [22.0, 22.2],
      [19.5, 24.5],
    ], 1.0);
    const meshEastSouth = createContinuousRoadMesh(nodesEastSouth, 4.2);
    const swEastSouth = createContinuousSidewalkMesh(nodesEastSouth, 4.2, 0.85);
    const marksEastSouth = createContinuousMarkingsMesh(nodesEastSouth, 4.2, 'single-white');

    // 8. TRANSVERSE SOUTH PARKWAY (East-West along Z = 24.5 connecting West, Center, East)
    // West Arm: [-19.5, 24.5] to Roundabout West throat [-4.5, 24.5]
    const nodesParkwayWest = sampleSplinePath([[-19.5, 24.5], [-12.0, 24.5], [-4.5, 24.5]], 1.0);
    const meshParkwayWest = createContinuousRoadMesh(nodesParkwayWest, 4.2);
    const swParkwayWest = createContinuousSidewalkMesh(nodesParkwayWest, 4.2, 0.85);
    const marksParkwayWest = createContinuousMarkingsMesh(nodesParkwayWest, 4.2, 'single-white');

    // East Arm: Roundabout East throat [4.5, 24.5] to [19.5, 24.5]
    const nodesParkwayEast = sampleSplinePath([[4.5, 24.5], [12.0, 24.5], [19.5, 24.5]], 1.0);
    const meshParkwayEast = createContinuousRoadMesh(nodesParkwayEast, 4.2);
    const swParkwayEast = createContinuousSidewalkMesh(nodesParkwayEast, 4.2, 0.85);
    const marksParkwayEast = createContinuousMarkingsMesh(nodesParkwayEast, 4.2, 'single-white');

    // 9. NORTH DISTRICT CONNECTORS (Transverse along Z = -22.0)
    // West Arm: [-25.0, -22.0] to [0, -22.0]
    const nodesNorthConnWest = sampleSplinePath([[-25.0, -22.0], [-13.0, -22.0], [-3.2, -22.0]], 1.0);
    const meshNorthConnWest = createContinuousRoadMesh(nodesNorthConnWest, 3.8);
    const swNorthConnWest = createContinuousSidewalkMesh(nodesNorthConnWest, 3.8, 0.8);

    // East Arm: [0, -22.0] to [25.0, -22.0]
    const nodesNorthConnEast = sampleSplinePath([[3.2, -22.0], [14.0, -22.0], [25.0, -22.0]], 1.0);
    const meshNorthConnEast = createContinuousRoadMesh(nodesNorthConnEast, 3.8);
    const swNorthConnEast = createContinuousSidewalkMesh(nodesNorthConnEast, 3.8, 0.8);

    // 10. LOCAL ACCESS ROADS WITH ENGINEERED CUL-DE-SACS
    // A. Science Observatory Spur & Cul-de-Sac (Branches from [-24.6, -2.0] to [-36.0, -2.0])
    const nodesSciSpur = sampleSplinePath([[-24.6, -2.0], [-29.5, -2.0], [-33.5, -2.0]], 0.8);
    const meshSciSpur = createContinuousRoadMesh(nodesSciSpur, 3.8);
    const swSciSpur = createContinuousSidewalkMesh(nodesSciSpur, 3.8, 0.8);
    const culDeSacScience = createCulDeSacGeometry([-36.0, -2.0], 4.2, 3.8, [-1, 0], true);

    // B. Agrisector Farming Loop & Cul-de-Sac (Branches from [-19.5, 24.5] to [-26.0, 40.5])
    const nodesAgriSpur = sampleSplinePath([
      [-19.5, 24.5],
      [-23.5, 27.5],
      [-26.0, 33.0],
      [-26.0, 38.0],
    ], 1.0);
    const meshAgriSpur = createContinuousRoadMesh(nodesAgriSpur, 3.8);
    const swAgriSpur = createContinuousSidewalkMesh(nodesAgriSpur, 3.8, 0.8);
    const culDeSacAgri = createCulDeSacGeometry([-26.0, 40.5], 4.5, 3.8, [0, 1], true);

    // C. Vulcan Heavy Freight Spur & Cul-de-Sac (Branches from [19.5, 24.5] to [37.5, 24.5])
    const nodesFreightSpur = sampleSplinePath([[19.5, 24.5], [26.0, 24.5], [33.0, 24.5]], 1.0);
    const meshFreightSpur = createContinuousRoadMesh(nodesFreightSpur, 4.0);
    const swFreightSpur = createContinuousSidewalkMesh(nodesFreightSpur, 4.0, 0.8);
    const culDeSacFreight = createCulDeSacGeometry([36.5, 24.5], 4.8, 4.0, [1, 0], true);

    // D. Oasis Terraces Residential Crescent & Cul-de-Sac (Branches from [12.0, 24.5] to [14.0, 41.5])
    const nodesResSpur = sampleSplinePath([[12.0, 24.5], [14.5, 29.0], [16.0, 35.0], [14.5, 39.0]], 1.0);
    const meshResSpur = createContinuousRoadMesh(nodesResSpur, 3.8);
    const swResSpur = createContinuousSidewalkMesh(nodesResSpur, 3.8, 0.8);
    const culDeSacRes = createCulDeSacGeometry([14.0, 41.5], 4.4, 3.8, [0, 1], true);

    // 11. REGIONAL HIGHWAY WINGS (Outer West & East Map Boundaries)
    const nodesOuterWest = sampleSplinePath([[-44.0, 0], [-34.0, 0], [-25.0, -2.0]], 1.0);
    const meshOuterWest = createContinuousRoadMesh(nodesOuterWest, 4.8);
    const swOuterWest = createContinuousSidewalkMesh(nodesOuterWest, 4.8, 0.85);

    const nodesOuterEast = sampleSplinePath([[25.0, 0.25], [34.0, 0], [44.0, 0]], 1.0);
    const meshOuterEast = createContinuousRoadMesh(nodesOuterEast, 4.8);
    const swOuterEast = createContinuousSidewalkMesh(nodesOuterEast, 4.8, 0.85);

    // 12. SEAMLESS ENGINEERED JUNCTIONS
    const juncWestCross = createEngineeredJunctionGeometry([-19.5, 24.5], 4.5);
    const juncEastCross = createEngineeredJunctionGeometry([19.5, 24.5], 4.5);
    const juncNorthCenter = createEngineeredJunctionGeometry([0, -22.0], 4.8);
    const juncNorthWest = createEngineeredJunctionGeometry([-25.0, -22.0], 4.2);
    const juncNorthEast = createEngineeredJunctionGeometry([25.0, -22.0], 4.2);
    const juncForumSouth = createEngineeredJunctionGeometry([0, 20.0], 4.4);

    return {
      // Primary Grand Boulevard
      meshNsNorth, swNsNorth, marksNsNorth, dashesNsNorth,
      meshBridgeSouthThroat, swBridgeSouthThroat, marksBridgeSouthThroat,
      meshForumToHub, swForumToHub, marksForumToHub,
      meshNsSouth, swNsSouth, marksNsSouth, dashesNsSouth,

      // Civic Forum Crescents
      meshForumWest, swForumWest, marksForumWest,
      meshForumEast, swForumEast, marksForumEast,

      // Roundabouts
      roundaboutCivic,
      roundaboutCentralHub,

      // West & East Highways
      meshWestNorth, swWestNorth, marksWestNorth,
      meshWestSouth, swWestSouth, marksWestSouth,
      meshEastNorth, swEastNorth, marksEastNorth,
      meshEastSouth, swEastSouth, marksEastSouth,

      // Transverse Parkways
      meshParkwayWest, swParkwayWest, marksParkwayWest,
      meshParkwayEast, swParkwayEast, marksParkwayEast,
      meshNorthConnWest, swNorthConnWest,
      meshNorthConnEast, swNorthConnEast,

      // Spurs & Cul-de-Sacs
      meshSciSpur, swSciSpur, culDeSacScience,
      meshAgriSpur, swAgriSpur, culDeSacAgri,
      meshFreightSpur, swFreightSpur, culDeSacFreight,
      meshResSpur, swResSpur, culDeSacRes,

      // Regional Wings
      meshOuterWest, swOuterWest,
      meshOuterEast, swOuterEast,

      // Junctions
      juncWestCross, juncEastCross, juncNorthCenter,
      juncNorthWest, juncNorthEast, juncForumSouth,
    };
  }, []);

  // Premium Asphalt & Surface Materials
  const asphaltMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#222724', roughness: 0.94, metalness: 0.06 }),
    []
  );
  const sidewalkMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#68746a', roughness: 0.72 }),
    []
  );
  const yellowMarkingMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#e5c46d' }),
    []
  );
  const whiteMarkingMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8 }),
    []
  );
  const centerIslandGrassMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#3d4d3d', roughness: 0.85 }),
    []
  );

  return (
    <group>
      {/* ================= 1. PRIMARY GRAND BOULEVARD ================= */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          handleSelectRoad(roadSegments[0]);
        }}
      >
        {/* North Grand Corridor */}
        <mesh geometry={roadGeometries.meshNsNorth} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.swNsNorth} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.marksNsNorth} material={yellowMarkingMat} raycast={() => null} />
        <mesh geometry={roadGeometries.dashesNsNorth} material={whiteMarkingMat} raycast={() => null} />

        {/* Bridge South Abutment Ramp */}
        <mesh geometry={roadGeometries.meshBridgeSouthThroat} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.swBridgeSouthThroat} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.marksBridgeSouthThroat} material={yellowMarkingMat} raycast={() => null} />

        {/* Forum to Hub Gateway */}
        <mesh geometry={roadGeometries.meshForumToHub} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.swForumToHub} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.marksForumToHub} material={yellowMarkingMat} raycast={() => null} />

        {/* South Oasis Grand Corridor */}
        <mesh geometry={roadGeometries.meshNsSouth} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.swNsSouth} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.marksNsSouth} material={yellowMarkingMat} raycast={() => null} />
        <mesh geometry={roadGeometries.dashesNsSouth} material={whiteMarkingMat} raycast={() => null} />
      </group>

      {/* ================= 2. ELYSIUM CIVIC ESPLANADE ROUNDABOUT ================= */}
      <group raycast={() => null}>
        <mesh geometry={roadGeometries.roundaboutCivic.asphalt} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.roundaboutCivic.centerIsland} material={centerIslandGrassMat} receiveShadow />
        <mesh geometry={roadGeometries.roundaboutCivic.sidewalk} material={sidewalkMat} receiveShadow />
      </group>

      {/* ================= 3. ELYSIUM CIVIC PROMENADE CRESCENTS (FORUM) ================= */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          handleSelectRoad(roadSegments[1]);
        }}
      >
        <mesh geometry={roadGeometries.meshForumWest} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.swForumWest} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.marksForumWest} material={whiteMarkingMat} raycast={() => null} />

        <mesh geometry={roadGeometries.meshForumEast} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.swForumEast} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.marksForumEast} material={whiteMarkingMat} raycast={() => null} />
      </group>

      {/* ================= 4. CENTRAL HUB ROUNDABOUT ================= */}
      <group raycast={() => null}>
        <mesh geometry={roadGeometries.roundaboutCentralHub.asphalt} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.roundaboutCentralHub.centerIsland} material={centerIslandGrassMat} receiveShadow />
        <mesh geometry={roadGeometries.roundaboutCentralHub.sidewalk} material={sidewalkMat} receiveShadow />
      </group>

      {/* ================= 5. WEST RIVERFRONT SCIENCE HIGHWAY ================= */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          handleSelectRoad(roadSegments[3]);
        }}
      >
        <mesh geometry={roadGeometries.meshWestNorth} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.swWestNorth} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.marksWestNorth} material={whiteMarkingMat} raycast={() => null} />

        <mesh geometry={roadGeometries.meshWestSouth} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.swWestSouth} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.marksWestSouth} material={whiteMarkingMat} raycast={() => null} />
      </group>

      {/* ================= 6. EAST RIVERFRONT INDUSTRIAL HIGHWAY ================= */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          handleSelectRoad(roadSegments[4]);
        }}
      >
        <mesh geometry={roadGeometries.meshEastNorth} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.swEastNorth} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.marksEastNorth} material={whiteMarkingMat} raycast={() => null} />

        <mesh geometry={roadGeometries.meshEastSouth} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.swEastSouth} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.marksEastSouth} material={whiteMarkingMat} raycast={() => null} />
      </group>

      {/* ================= 7. TRANSVERSE SOUTH PARKWAY ================= */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          handleSelectRoad(roadSegments[5]);
        }}
      >
        <mesh geometry={roadGeometries.meshParkwayWest} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.swParkwayWest} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.marksParkwayWest} material={whiteMarkingMat} raycast={() => null} />

        <mesh geometry={roadGeometries.meshParkwayEast} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.swParkwayEast} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.marksParkwayEast} material={whiteMarkingMat} raycast={() => null} />
      </group>

      {/* ================= 8. NORTH DISTRICT CONNECTORS ================= */}
      <group raycast={() => null}>
        <mesh geometry={roadGeometries.meshNorthConnWest} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.swNorthConnWest} material={sidewalkMat} receiveShadow />

        <mesh geometry={roadGeometries.meshNorthConnEast} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.swNorthConnEast} material={sidewalkMat} receiveShadow />
      </group>

      {/* ================= 9. LOCAL ACCESS ROADS & ENGINEERED CUL-DE-SACS ================= */}
      {/* A. Science Observatory Spur & Turnaround */}
      <group raycast={() => null}>
        <mesh geometry={roadGeometries.meshSciSpur} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.swSciSpur} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.culDeSacScience.asphalt} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.culDeSacScience.sidewalk} material={sidewalkMat} receiveShadow />
        {roadGeometries.culDeSacScience.centerIsland && (
          <mesh geometry={roadGeometries.culDeSacScience.centerIsland} material={centerIslandGrassMat} receiveShadow />
        )}
      </group>

      {/* B. Agrisector Farming Loop & Turnaround */}
      <group raycast={() => null}>
        <mesh geometry={roadGeometries.meshAgriSpur} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.swAgriSpur} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.culDeSacAgri.asphalt} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.culDeSacAgri.sidewalk} material={sidewalkMat} receiveShadow />
        {roadGeometries.culDeSacAgri.centerIsland && (
          <mesh geometry={roadGeometries.culDeSacAgri.centerIsland} material={centerIslandGrassMat} receiveShadow />
        )}
      </group>

      {/* C. Vulcan Heavy Freight Spur & Turnaround */}
      <group raycast={() => null}>
        <mesh geometry={roadGeometries.meshFreightSpur} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.swFreightSpur} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.culDeSacFreight.asphalt} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.culDeSacFreight.sidewalk} material={sidewalkMat} receiveShadow />
        {roadGeometries.culDeSacFreight.centerIsland && (
          <mesh geometry={roadGeometries.culDeSacFreight.centerIsland} material={centerIslandGrassMat} receiveShadow />
        )}
      </group>

      {/* D. Oasis Terraces Residential Crescent & Turnaround */}
      <group raycast={() => null}>
        <mesh geometry={roadGeometries.meshResSpur} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.swResSpur} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.culDeSacRes.asphalt} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.culDeSacRes.sidewalk} material={sidewalkMat} receiveShadow />
        {roadGeometries.culDeSacRes.centerIsland && (
          <mesh geometry={roadGeometries.culDeSacRes.centerIsland} material={centerIslandGrassMat} receiveShadow />
        )}
      </group>

      {/* ================= 10. REGIONAL HIGHWAY WINGS ================= */}
      <group raycast={() => null}>
        <mesh geometry={roadGeometries.meshOuterWest} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.swOuterWest} material={sidewalkMat} receiveShadow />

        <mesh geometry={roadGeometries.meshOuterEast} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.swOuterEast} material={sidewalkMat} receiveShadow />
      </group>

      {/* ================= 11. SEAMLESS JUNCTION PLAZAS ================= */}
      <group raycast={() => null}>
        <mesh geometry={roadGeometries.juncWestCross} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.juncEastCross} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.juncNorthCenter} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.juncNorthWest} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.juncNorthEast} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.juncForumSouth} material={asphaltMat} receiveShadow />
      </group>

      {/* ================= 12. ZEBRA PEDESTRIAN CROSSINGS AT STRATEGIC NODES ================= */}
      {/* Central Arch Bridge Abutments */}
      <ZebraPedestrianCrossing position={[0, 0.76, -10.2]} width={5.4} length={2.2} />
      <ZebraPedestrianCrossing position={[0, 0.76, 4.3]} width={5.4} length={2.2} />

      {/* Civic Esplanade Roundabout Entrances */}
      <ZebraPedestrianCrossing position={[-3.8, 0.86, 7.5]} width={4.4} length={2.0} rotationY={0.6} />
      <ZebraPedestrianCrossing position={[3.8, 0.86, 7.5]} width={4.4} length={2.0} rotationY={-0.6} />

      {/* South Gateway & Central Hub Roundabout */}
      <ZebraPedestrianCrossing position={[0, 0.86, 20.2]} width={4.8} length={2.2} />
      <ZebraPedestrianCrossing position={[0, 0.86, 29.5]} width={5.4} length={2.2} />
      <ZebraPedestrianCrossing position={[-4.0, 0.86, 24.5]} width={4.2} length={2.2} rotationY={Math.PI / 2} />
      <ZebraPedestrianCrossing position={[4.0, 0.86, 24.5]} width={4.2} length={2.2} rotationY={Math.PI / 2} />

      {/* ================= 13. ANIMATED TRAFFIC SIGNALS ================= */}
      <TrafficIntersectionSignals />

      {/* ================= 14. ARCHITECTURAL RIVER BRIDGES ================= */}
      {/* Central Citadel Grand Arch Bridge */}
      <ArchitecturalBridge
        id="road-bridge-central"
        name="Central Citadel Grand Arch Bridge"
        position={[0, 0.32, -3.0]}
        length={15.0}
        width={5.6}
        isSelected={selectedRoadId === 'road-bridge-central'}
        onSelect={() => handleSelectRoad(roadSegments[6])}
      />

      {/* West Aethel Ridge Suspension Bridge */}
      <ArchitecturalBridge
        id="road-bridge-west"
        name="West Aethel Ridge Suspension Bridge"
        position={[-25, 0.32, -16.2]}
        length={15.0}
        width={4.5}
        isSelected={selectedRoadId === 'road-bridge-west'}
        onSelect={() => handleSelectRoad(roadSegments[3])}
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
        onSelect={() => handleSelectRoad(roadSegments[4])}
      />
    </group>
  );
}

export default React.memo(RoadNetwork);
