import React, { useState, useMemo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
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
  createFourWayCivicRoundaboutGeometry,
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
        position={[2.8, 0.85, 21.5]}
        rotationY={Math.PI}
        isGreen={signalState.isNorthSouthGreen}
        isYellow={signalState.isNorthSouthYellow}
        isRed={!signalState.isNorthSouthGreen && !signalState.isNorthSouthYellow}
      />
      <TrafficSignalPost
        position={[-2.8, 0.85, 26.5]}
        rotationY={0}
        isGreen={signalState.isNorthSouthGreen}
        isYellow={signalState.isNorthSouthYellow}
        isRed={!signalState.isNorthSouthGreen && !signalState.isNorthSouthYellow}
      />
      <TrafficSignalPost
        position={[-5.8, 0.85, 26.5]}
        rotationY={-Math.PI / 2}
        isGreen={signalState.isEastWestGreen}
        isYellow={signalState.isEastWestYellow}
        isRed={!signalState.isEastWestGreen && !signalState.isEastWestYellow}
      />
      <TrafficSignalPost
        position={[5.8, 0.85, 21.5]}
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
  id: _id,
  name: _name,
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

// Highway Boundary Portal Gateways
function HighwayBoundaryPortal({
  position,
  rotationY = 0,
  width = 5.4,
}: {
  position: [number, number, number];
  rotationY?: number;
  width?: number;
}) {
  const isNight = useIsNight();
  const halfW = width * 0.5 + 0.6;

  return (
    <group position={position} rotation={[0, rotationY, 0]} raycast={() => null}>
      {[-halfW, halfW].map((offset, idx) => (
        <group key={idx} position={[offset, 0, 0]}>
          <mesh position={[0, 1.6, 0]} receiveShadow castShadow>
            <cylinderGeometry args={[0.2, 0.3, 3.2, 8]} />
            <meshStandardMaterial color="#3e4842" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, 3.3, 0]}>
            <sphereGeometry args={[0.22, 10, 10]} />
            <meshStandardMaterial
              color="#5eead4"
              emissive="#14b8a6"
              emissiveIntensity={isNight ? 2.5 : 1.0}
            />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 3.1, 0]}>
        <boxGeometry args={[width + 1.2, 0.18, 0.25]} />
        <meshStandardMaterial color="#2d3530" metalness={0.8} />
      </mesh>
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
      name: 'North Grand Boulevard (Riverfront Corridor)',
      category: 'grand_arterial',
      speedLimitKmh: 70,
      lanes: 4,
      width: 5.4,
      lengthMeters: 420,
      status: 'Optimal',
      throughputVehiclesPerDay: Math.round(28400 * (1 + rates.gdpGrowthRate / 10)),
      connectedDistricts: ['Northern Terraces', 'Elysium Citadel'],
      connectedBuildings: ['Central River Abutment', 'Elysium Central Biosphere Park'],
      description: 'Primary 4-lane landscaped arterial connecting the northern territory to the Central River Bridge.',
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
    {
      id: 'road-citadel-boulevard',
      name: 'Senate Citadel Boulevard (Civic Axis)',
      category: 'grand_arterial',
      speedLimitKmh: 50,
      lanes: 4,
      width: 5.4,
      lengthMeters: 380,
      status: 'Optimal',
      throughputVehiclesPerDay: 26400,
      connectedDistricts: ['Elysium Citadel'],
      connectedBuildings: ['Planetary Senate Citadel', 'Civilization Evolution Monument'],
      description: 'Monumental 4-lane civic ceremonial avenue connecting Central Arch Bridge directly into the Grand Civic Roundabout.',
    },
    {
      id: 'road-civic-roundabout',
      name: 'Grand Civic Central Roundabout',
      category: 'grand_arterial',
      speedLimitKmh: 40,
      lanes: 2,
      width: 6.0,
      lengthMeters: 280,
      status: 'Optimal',
      throughputVehiclesPerDay: 36200,
      connectedDistricts: ['Elysium Citadel', 'Oasis Terraces'],
      connectedBuildings: ['Planetary Senate Citadel', 'Oasis Habitation Arcology'],
      description: 'Central circular civic junction featuring 4 orthogonal approaches, circulating dashed markings, and landscaped island.',
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
      connectedBuildings: ['Oasis Habitation Arcology', 'Cellular Care Clinic'],
      description: 'High-capacity 4-lane spine connecting the Grand Civic Roundabout south to the territorial gateway portal.',
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
      description: 'Scenic highway spanning West Suspension Bridge to West Crossroads with engineered observatory cul-de-sac.',
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
      description: 'Heavy transport logistics corridor serving foundries and smelters across East Truss Bridge with freight cul-de-sac.',
    },
    {
      id: 'road-parkway-west',
      name: 'West Civic Parkway',
      category: 'district_avenue',
      speedLimitKmh: 50,
      lanes: 2,
      width: 4.4,
      lengthMeters: 380,
      status: 'Optimal',
      throughputVehiclesPerDay: 16800,
      connectedDistricts: ['Elysium Citadel', 'Aethel Ridge Science Park'],
      connectedBuildings: ['Polytechnic Academy'],
      description: 'Transverse connector linking the Grand Civic Roundabout west to West Crossroads.',
    },
    {
      id: 'road-parkway-east',
      name: 'East Civic Parkway',
      category: 'district_avenue',
      speedLimitKmh: 50,
      lanes: 2,
      width: 4.4,
      lengthMeters: 380,
      status: 'Optimal',
      throughputVehiclesPerDay: 17400,
      connectedDistricts: ['Elysium Citadel', 'Vulcan Forge Basin'],
      connectedBuildings: ['Oasis Cellular Care Clinic'],
      description: 'Transverse connector linking the Grand Civic Roundabout east to East Crossroads and Oasis Residential Spur.',
    },
  ], [rates.gdpGrowthRate]);

  const handleSelectRoad = (road: RoadSegmentData) => {
    setSelectedRoadId(road.id);
    triggerRoadSelection(road);
  };

  // ================= MATHEMATICALLY EXACT PROCEDURAL ROAD RECONSTRUCTION =================
  const roadGeometries = useMemo(() => {
    // 1. PRIMARY NORTH GRAND BOULEVARD (North Map Portal [0, -44] to Central Bridge [0, -10.5])
    const nodesNsNorth = sampleSplinePath([[0, -44.0], [0, -32.0], [0, -22.0], [0, -10.5]], 1.0);
    const meshNsNorth = createContinuousRoadMesh(nodesNsNorth, 5.4);
    const swNsNorth = createContinuousSidewalkMesh(nodesNsNorth, 5.4, 0.85);
    const marksNsNorth = createContinuousMarkingsMesh(nodesNsNorth, 5.4, 'double-yellow');
    const dashesNsNorth = createContinuousMarkingsMesh(nodesNsNorth, 5.4, 'dual-dash');

    // 2. SENATE CITADEL BOULEVARD (Central Bridge South Abutment [0, 4.5] to Roundabout North Throat [0, 18.0])
    const nodesCitadel = sampleSplinePath([[0, 4.5], [0, 11.0], [0, 18.0]], 1.0);
    const meshCitadel = createContinuousRoadMesh(nodesCitadel, 5.4);
    const swCitadel = createContinuousSidewalkMesh(nodesCitadel, 5.4, 0.85);
    const marksCitadel = createContinuousMarkingsMesh(nodesCitadel, 5.4, 'double-yellow');
    const dashesCitadel = createContinuousMarkingsMesh(nodesCitadel, 5.4, 'dual-dash');

    // 3. EXACTLY ONE CENTRAL CIVIC ROUNDABOUT AT [0, 24.0]
    // Radius: inner 2.5m, outer 6.0m. 4 orthogonal approaches: North 18.0, South 30.0, West -6.0, East 6.0.
    const roundaboutCivic = createFourWayCivicRoundaboutGeometry([0, 24.0], 2.5, 6.0, 5.4, 4.4, 0.08);

    // 4. PRIMARY SOUTH OASIS GRAND BOULEVARD (Roundabout South Throat [0, 30.0] to South Portal [0, 44.0])
    const nodesNsSouth = sampleSplinePath([[0, 30.0], [0, 37.0], [0, 44.0]], 1.0);
    const meshNsSouth = createContinuousRoadMesh(nodesNsSouth, 5.4);
    const swNsSouth = createContinuousSidewalkMesh(nodesNsSouth, 5.4, 0.85);
    const marksNsSouth = createContinuousMarkingsMesh(nodesNsSouth, 5.4, 'double-yellow');
    const dashesNsSouth = createContinuousMarkingsMesh(nodesNsSouth, 5.4, 'dual-dash');

    // 5. TRANSVERSE CIVIC PARKWAY ALONG Z = 24.0
    // West Arm: Roundabout West Throat [-6.0, 24.0] to West Crossroads [-25.0, 24.0]
    const nodesParkwayWest = sampleSplinePath([[-6.0, 24.0], [-15.0, 24.0], [-25.0, 24.0]], 1.0);
    const meshParkwayWest = createContinuousRoadMesh(nodesParkwayWest, 4.4);
    const swParkwayWest = createContinuousSidewalkMesh(nodesParkwayWest, 4.4, 0.85);
    const marksParkwayWest = createContinuousMarkingsMesh(nodesParkwayWest, 4.4, 'single-white');

    // East Arm: Roundabout East Throat [6.0, 24.0] to East Crossroads [25.0, 24.0]
    const nodesParkwayEast = sampleSplinePath([[6.0, 24.0], [15.0, 24.0], [25.0, 24.0]], 1.0);
    const meshParkwayEast = createContinuousRoadMesh(nodesParkwayEast, 4.4);
    const swParkwayEast = createContinuousSidewalkMesh(nodesParkwayEast, 4.4, 0.85);
    const marksParkwayEast = createContinuousMarkingsMesh(nodesParkwayEast, 4.4, 'single-white');

    // 6. WEST REGIONAL CORRIDOR (X = -25.0)
    // North Approach: [-25.0, -44.0] to West Bridge North Abutment [-25.0, -23.7]
    const nodesWestNorth = sampleSplinePath([[-25.0, -44.0], [-25.0, -34.0], [-25.0, -23.7]], 1.0);
    const meshWestNorth = createContinuousRoadMesh(nodesWestNorth, 4.2);
    const swWestNorth = createContinuousSidewalkMesh(nodesWestNorth, 4.2, 0.85);
    const marksWestNorth = createContinuousMarkingsMesh(nodesWestNorth, 4.2, 'single-white');

    // South from West Bridge: [-25.0, -8.7] to West Crossroads [-25.0, 24.0]
    const nodesWestSouth = sampleSplinePath([[-25.0, -8.7], [-25.0, 0.0], [-25.0, 12.0], [-25.0, 24.0]], 1.0);
    const meshWestSouth = createContinuousRoadMesh(nodesWestSouth, 4.2);
    const swWestSouth = createContinuousSidewalkMesh(nodesWestSouth, 4.2, 0.85);
    const marksWestSouth = createContinuousMarkingsMesh(nodesWestSouth, 4.2, 'single-white');

    // 7. EAST REGIONAL CORRIDOR (X = 25.0)
    // North Approach: [25.0, -44.0] to East Bridge North Abutment [25.0, 0.25]
    const nodesEastNorth = sampleSplinePath([[25.0, -44.0], [25.0, -30.0], [25.0, -15.0], [25.0, 0.25]], 1.0);
    const meshEastNorth = createContinuousRoadMesh(nodesEastNorth, 4.2);
    const swEastNorth = createContinuousSidewalkMesh(nodesEastNorth, 4.2, 0.85);
    const marksEastNorth = createContinuousMarkingsMesh(nodesEastNorth, 4.2, 'single-white');

    // South from East Bridge: [25.0, 15.75] to East Crossroads [25.0, 24.0]
    const nodesEastSouth = sampleSplinePath([[25.0, 15.75], [25.0, 20.0], [25.0, 24.0]], 1.0);
    const meshEastSouth = createContinuousRoadMesh(nodesEastSouth, 4.2);
    const swEastSouth = createContinuousSidewalkMesh(nodesEastSouth, 4.2, 0.85);
    const marksEastSouth = createContinuousMarkingsMesh(nodesEastSouth, 4.2, 'single-white');

    // 8. NORTH TRANSVERSE CONNECTOR (Along Z = -22.0)
    // West Arm: [-25.0, -22.0] to [0, -22.0]
    const nodesNorthConnWest = sampleSplinePath([[-25.0, -22.0], [-12.5, -22.0], [0, -22.0]], 1.0);
    const meshNorthConnWest = createContinuousRoadMesh(nodesNorthConnWest, 3.8);
    const swNorthConnWest = createContinuousSidewalkMesh(nodesNorthConnWest, 3.8, 0.8);

    // East Arm: [0, -22.0] to [25.0, -22.0]
    const nodesNorthConnEast = sampleSplinePath([[0, -22.0], [12.5, -22.0], [25.0, -22.0]], 1.0);
    const meshNorthConnEast = createContinuousRoadMesh(nodesNorthConnEast, 3.8);
    const swNorthConnEast = createContinuousSidewalkMesh(nodesNorthConnEast, 3.8, 0.8);

    // 9. THE 4 INTENTIONAL, VERTEX-MATCHED CUL-DE-SACS
    // A. Science Observatory Spur & Cul-de-Sac (Branches from [-25.0, -2.0] to [-34.0, -2.0])
    const nodesSciSpur = sampleSplinePath([[-25.0, -2.0], [-29.5, -2.0], [-34.0, -2.0]], 0.8);
    const meshSciSpur = createContinuousRoadMesh(nodesSciSpur, 3.8);
    const swSciSpur = createContinuousSidewalkMesh(nodesSciSpur, 3.8, 0.8);
    const culDeSacScience = createCulDeSacGeometry([-34.0, -2.0], 4.2, 3.8, [-1, 0], true);

    // B. Agrisector Farming Loop & Cul-de-Sac (Branches from [-25.0, 24.0] to [-25.0, 38.0])
    const nodesAgriSpur = sampleSplinePath([[-25.0, 24.0], [-25.0, 31.0], [-25.0, 38.0]], 0.8);
    const meshAgriSpur = createContinuousRoadMesh(nodesAgriSpur, 4.0);
    const swAgriSpur = createContinuousSidewalkMesh(nodesAgriSpur, 4.0, 0.8);
    const culDeSacAgri = createCulDeSacGeometry([-25.0, 38.0], 4.5, 4.0, [0, 1], true);

    // C. Vulcan Heavy Freight Spur & Cul-de-Sac (Branches from [25.0, 24.0] to [36.0, 24.0])
    const nodesFreightSpur = sampleSplinePath([[25.0, 24.0], [30.5, 24.0], [36.0, 24.0]], 0.8);
    const meshFreightSpur = createContinuousRoadMesh(nodesFreightSpur, 4.2);
    const swFreightSpur = createContinuousSidewalkMesh(nodesFreightSpur, 4.2, 0.8);
    const culDeSacFreight = createCulDeSacGeometry([36.0, 24.0], 4.8, 4.2, [1, 0], true);

    // D. Oasis Terraces Residential Crescent & Cul-de-Sac (Branches from [14.0, 24.0] to [14.0, 38.0])
    const nodesResSpur = sampleSplinePath([[14.0, 24.0], [14.0, 31.0], [14.0, 38.0]], 0.8);
    const meshResSpur = createContinuousRoadMesh(nodesResSpur, 3.8);
    const swResSpur = createContinuousSidewalkMesh(nodesResSpur, 3.8, 0.8);
    const culDeSacRes = createCulDeSacGeometry([14.0, 38.0], 4.4, 3.8, [0, 1], true);

    // 10. SEAMLESS ENGINEERED JUNCTIONS
    const juncNorthCenter = createEngineeredJunctionGeometry([0, -22.0], 5.6);
    const juncNorthWest = createEngineeredJunctionGeometry([-25.0, -22.0], 4.4);
    const juncNorthEast = createEngineeredJunctionGeometry([25.0, -22.0], 4.4);
    const juncWestCross = createEngineeredJunctionGeometry([-25.0, 24.0], 4.8);
    const juncEastCross = createEngineeredJunctionGeometry([25.0, 24.0], 4.8);
    const juncResBranch = createEngineeredJunctionGeometry([14.0, 24.0], 4.2);
    const juncSciBranch = createEngineeredJunctionGeometry([-25.0, -2.0], 4.2);

    return {
      // Primary North-South Axis
      meshNsNorth, swNsNorth, marksNsNorth, dashesNsNorth,
      meshCitadel, swCitadel, marksCitadel, dashesCitadel,
      roundaboutCivic,
      meshNsSouth, swNsSouth, marksNsSouth, dashesNsSouth,

      // Transverse Civic Parkways
      meshParkwayWest, swParkwayWest, marksParkwayWest,
      meshParkwayEast, swParkwayEast, marksParkwayEast,
      meshNorthConnWest, swNorthConnWest,
      meshNorthConnEast, swNorthConnEast,

      // Regional Highways
      meshWestNorth, swWestNorth, marksWestNorth,
      meshWestSouth, swWestSouth, marksWestSouth,
      meshEastNorth, swEastNorth, marksEastNorth,
      meshEastSouth, swEastSouth, marksEastSouth,

      // Spurs & Cul-de-Sacs
      meshSciSpur, swSciSpur, culDeSacScience,
      meshAgriSpur, swAgriSpur, culDeSacAgri,
      meshFreightSpur, swFreightSpur, culDeSacFreight,
      meshResSpur, swResSpur, culDeSacRes,

      // Junction Plazas
      juncNorthCenter, juncNorthWest, juncNorthEast,
      juncWestCross, juncEastCross, juncResBranch, juncSciBranch,
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
      {/* ================= 1. PRIMARY GRAND BOULEVARD (NORTH & CITADEL) ================= */}
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
      </group>

      <group
        onClick={(e) => {
          e.stopPropagation();
          handleSelectRoad(roadSegments[2]);
        }}
      >
        {/* Senate Citadel Boulevard (Monumental Approach to Roundabout) */}
        <mesh geometry={roadGeometries.meshCitadel} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.swCitadel} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.marksCitadel} material={yellowMarkingMat} raycast={() => null} />
        <mesh geometry={roadGeometries.dashesCitadel} material={whiteMarkingMat} raycast={() => null} />
      </group>

      {/* ================= 2. GRAND CIVIC ROUNDABOUT (CENTRAL HUB AT [0, 24.0]) ================= */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          handleSelectRoad(roadSegments[3]);
        }}
      >
        <mesh geometry={roadGeometries.roundaboutCivic.asphalt} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.roundaboutCivic.centerIsland} material={centerIslandGrassMat} receiveShadow />
        <mesh geometry={roadGeometries.roundaboutCivic.sidewalks} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.roundaboutCivic.circulatingMarkings} material={whiteMarkingMat} raycast={() => null} />
      </group>

      {/* ================= 3. SOUTH OASIS GRAND BOULEVARD ================= */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          handleSelectRoad(roadSegments[4]);
        }}
      >
        <mesh geometry={roadGeometries.meshNsSouth} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.swNsSouth} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.marksNsSouth} material={yellowMarkingMat} raycast={() => null} />
        <mesh geometry={roadGeometries.dashesNsSouth} material={whiteMarkingMat} raycast={() => null} />
      </group>

      {/* ================= 4. TRANSVERSE CIVIC PARKWAY (Z = 24.0) ================= */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          handleSelectRoad(roadSegments[7]);
        }}
      >
        <mesh geometry={roadGeometries.meshParkwayWest} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.swParkwayWest} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.marksParkwayWest} material={whiteMarkingMat} raycast={() => null} />
      </group>

      <group
        onClick={(e) => {
          e.stopPropagation();
          handleSelectRoad(roadSegments[8]);
        }}
      >
        <mesh geometry={roadGeometries.meshParkwayEast} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.swParkwayEast} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.marksParkwayEast} material={whiteMarkingMat} raycast={() => null} />
      </group>

      {/* ================= 5. NORTH TRANSVERSE CONNECTORS (Z = -22.0) ================= */}
      <group raycast={() => null}>
        <mesh geometry={roadGeometries.meshNorthConnWest} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.swNorthConnWest} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.meshNorthConnEast} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.swNorthConnEast} material={sidewalkMat} receiveShadow />
      </group>

      {/* ================= 6. WEST REGIONAL SCIENCE HIGHWAY (X = -25.0) ================= */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          handleSelectRoad(roadSegments[5]);
        }}
      >
        <mesh geometry={roadGeometries.meshWestNorth} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.swWestNorth} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.marksWestNorth} material={whiteMarkingMat} raycast={() => null} />

        <mesh geometry={roadGeometries.meshWestSouth} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.swWestSouth} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.marksWestSouth} material={whiteMarkingMat} raycast={() => null} />
      </group>

      {/* ================= 7. EAST REGIONAL INDUSTRIAL HIGHWAY (X = 25.0) ================= */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          handleSelectRoad(roadSegments[6]);
        }}
      >
        <mesh geometry={roadGeometries.meshEastNorth} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.swEastNorth} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.marksEastNorth} material={whiteMarkingMat} raycast={() => null} />

        <mesh geometry={roadGeometries.meshEastSouth} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.swEastSouth} material={sidewalkMat} receiveShadow />
        <mesh geometry={roadGeometries.marksEastSouth} material={whiteMarkingMat} raycast={() => null} />
      </group>

      {/* ================= 8. LOCAL ACCESS ROADS & ENGINEERED CUL-DE-SACS ================= */}
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

      {/* ================= 9. SEAMLESS JUNCTION PLAZAS ================= */}
      <group raycast={() => null}>
        <mesh geometry={roadGeometries.juncNorthCenter} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.juncNorthWest} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.juncNorthEast} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.juncWestCross} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.juncEastCross} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.juncResBranch} material={asphaltMat} receiveShadow />
        <mesh geometry={roadGeometries.juncSciBranch} material={asphaltMat} receiveShadow />
      </group>

      {/* ================= 10. ZEBRA PEDESTRIAN CROSSINGS AT STRATEGIC NODES ================= */}
      {/* Central Arch Bridge Abutments */}
      <ZebraPedestrianCrossing position={[0, 0.76, -10.2]} width={5.4} length={2.2} />
      <ZebraPedestrianCrossing position={[0, 0.76, 4.3]} width={5.4} length={2.2} />

      {/* Grand Civic Roundabout Approach Throats */}
      <ZebraPedestrianCrossing position={[0, 0.86, 18.2]} width={5.4} length={2.2} />
      <ZebraPedestrianCrossing position={[0, 0.86, 29.8]} width={5.4} length={2.2} />
      <ZebraPedestrianCrossing position={[-5.8, 0.86, 24.0]} width={4.4} length={2.2} rotationY={Math.PI / 2} />
      <ZebraPedestrianCrossing position={[5.8, 0.86, 24.0]} width={4.4} length={2.2} rotationY={Math.PI / 2} />

      {/* ================= 11. HIGHWAY BOUNDARY PORTALS ================= */}
      <HighwayBoundaryPortal position={[0, 0.85, -43.8]} width={5.4} />
      <HighwayBoundaryPortal position={[0, 0.85, 43.8]} width={5.4} rotationY={Math.PI} />
      <HighwayBoundaryPortal position={[-25.0, 0.85, -43.8]} width={4.2} />
      <HighwayBoundaryPortal position={[25.0, 0.85, -43.8]} width={4.2} />

      {/* ================= 12. ANIMATED TRAFFIC SIGNALS ================= */}
      <TrafficIntersectionSignals />

      {/* ================= 13. EXACTLY 3 ARCHITECTURAL RIVER BRIDGES ================= */}
      {/* Central Citadel Grand Arch Bridge */}
      <ArchitecturalBridge
        id="road-bridge-central"
        name="Central Citadel Grand Arch Bridge"
        position={[0, 0.32, -3.0]}
        length={15.0}
        width={5.6}
        isSelected={selectedRoadId === 'road-bridge-central'}
        onSelect={() => handleSelectRoad(roadSegments[1])}
      />

      {/* West Aethel Ridge Suspension Bridge */}
      <ArchitecturalBridge
        id="road-bridge-west"
        name="West Aethel Ridge Suspension Bridge"
        position={[-25.0, 0.32, -16.2]}
        length={15.0}
        width={4.5}
        isSelected={selectedRoadId === 'road-bridge-west'}
        onSelect={() => handleSelectRoad(roadSegments[5])}
      />

      {/* East Vulcan Industrial Truss Bridge */}
      <ArchitecturalBridge
        id="road-bridge-east"
        name="East Vulcan Industrial Truss Bridge"
        position={[25.0, 0.32, 8.0]}
        length={15.5}
        width={4.5}
        rotationY={0.14}
        isSelected={selectedRoadId === 'road-bridge-east'}
        onSelect={() => handleSelectRoad(roadSegments[6])}
      />
    </group>
  );
}

export default React.memo(RoadNetwork);
