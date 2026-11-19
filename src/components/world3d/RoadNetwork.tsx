import React, { useState, useMemo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useIsNight } from './DayNightController';
import { useGameState } from '../../context/GameStateContext';
import { RoadSegmentData } from '../../types/road';
import { triggerRoadSelection } from './WorldLabelManager';
import {
  sampleSplinePath,
  sampleTrimmedSplinePath,
  createContinuousRoadMesh,
  createContinuousSidewalkMesh,
  createContinuousMarkingsMesh,
  createCulDeSacGeometry,
  createFourWayCivicRoundaboutGeometry,
  createEngineeredJunctionGeometry,
} from './roadGeometry';
import {
  buildAuthoritativeRiverfrontMasterplan,
  RoadNetworkTopology,
  validateRoadNetworkTopology,
} from './roadNetworkModel';

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

// Coordinated Traffic Signal System
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

// ================= EXACTLY 2 ARCHITECTURAL RIVER BRIDGES =================
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

      {/* Bridge Deck Slab (Exact Width Match) */}
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

// ================= MASTER RECONSTRUCTED ROAD NETWORK COMPONENT =================
function RoadNetwork() {
  const { rates } = useGameState();
  const [selectedRoadId, setSelectedRoadId] = useState<string | null>(null);

  // 1. Authoritative Graph Masterplan Definition
  const topology: RoadNetworkTopology = useMemo(() => {
    return buildAuthoritativeRiverfrontMasterplan();
  }, []);

  // Validate on load and output verified report to console
  useMemo(() => {
    const report = validateRoadNetworkTopology(topology);
    if (!report.is100PercentValid) {
      console.warn('[RoadNetwork] Topology issues:', report.issues);
    }
  }, [topology]);

  // Road segment telemetry definitions for UI and Inspector
  const roadTelemetryList: RoadSegmentData[] = useMemo(() => {
    return Object.values(topology.segments).map((seg) => ({
      id: seg.id,
      name: seg.name,
      category: seg.category,
      speedLimitKmh: seg.speedLimitKmh,
      lanes: seg.lanes,
      width: seg.width,
      lengthMeters: Math.round(
        seg.centerline.reduce((acc, pt, idx, arr) => {
          if (idx === 0) return 0;
          return acc + Math.hypot(pt[0] - arr[idx - 1][0], pt[1] - arr[idx - 1][1]);
        }, 0) * 10
      ),
      status: 'Optimal',
      throughputVehiclesPerDay: Math.round(24000 * (1 + rates.gdpGrowthRate / 10)),
      connectedDistricts: ['Elysium Citadel'],
      connectedBuildings: ['Planetary Senate Citadel'],
      description: seg.description || '',
    }));
  }, [topology, rates.gdpGrowthRate]);

  const handleSelectRoad = (road: RoadSegmentData) => {
    setSelectedRoadId(road.id);
    triggerRoadSelection(road);
  };

  // 2. Continuous, Gap-Free Road Geometries
  const geometries = useMemo(() => {
    const segmentMeshes: Array<{
      id: string;
      data: RoadSegmentData;
      asphalt: THREE.BufferGeometry;
      sidewalk?: THREE.BufferGeometry;
      marking?: THREE.BufferGeometry;
      dashes?: THREE.BufferGeometry;
    }> = [];

    for (const seg of Object.values(topology.segments)) {
      if (seg.isBridge) continue; // Rendered by ArchitecturalBridge

      // Continuous, Gap-Free Unbroken Centerline (Full-length corridor ribbons)
      const nodes = sampleSplinePath(seg.centerline, 1.0, undefined, 0.08);
      if (nodes.length < 2) continue;

      const asphalt = createContinuousRoadMesh(nodes, seg.width);
      const sidewalk = seg.hasSidewalks
        ? createContinuousSidewalkMesh(nodes, seg.width, seg.sidewalkWidth)
        : undefined;

      const markingType = seg.markingType === 'dashed-white' ? 'single-white' : seg.markingType;
      const marking =
        seg.markingType !== 'none'
          ? createContinuousMarkingsMesh(nodes, seg.width, markingType as any)
          : undefined;

      const dashes =
        seg.lanes === 4
          ? createContinuousMarkingsMesh(nodes, seg.width, 'dual-dash')
          : undefined;

      const data = roadTelemetryList.find((r) => r.id === seg.id) || {
        id: seg.id,
        name: seg.name,
        category: seg.category,
        speedLimitKmh: seg.speedLimitKmh,
        lanes: seg.lanes,
        width: seg.width,
        lengthMeters: 200,
        status: 'Optimal',
        throughputVehiclesPerDay: 20000,
        connectedDistricts: [],
        connectedBuildings: [],
        description: seg.description || '',
      };

      segmentMeshes.push({
        id: seg.id,
        data,
        asphalt,
        sidewalk,
        marking,
        dashes,
      });
    }

    // 3. Multi-branch Junction Plazas & Intersection Tables (Seamless Solid Deck)
    const junctionMeshes: Array<{ id: string; geo: THREE.BufferGeometry }> = [];
    for (const node of Object.values(topology.nodes)) {
      if (
        node.clearanceRadius > 0 &&
        (node.type.startsWith('intersection') || node.type === 'junction_plaza')
      ) {
        junctionMeshes.push({
          id: node.id,
          geo: createEngineeredJunctionGeometry([node.x, node.z], node.clearanceRadius, 0.082),
        });
      }
    }

    // 4. Exactly ONE Grand Civic Roundabout at [0, 24.0]
    const rbDef = topology.roundabout;
    const roundaboutGeo = createFourWayCivicRoundaboutGeometry(
      rbDef.center,
      rbDef.innerRadius,
      rbDef.outerRadius,
      rbDef.approachWidthNS,
      rbDef.approachWidthEW,
      0.08
    );

    // 5. Exactly 4 Intentional, Vertex-Matched Cul-de-Sacs
    const culDeSacMeshes = topology.culDeSacs.map((cds) => ({
      id: cds.id,
      ...createCulDeSacGeometry(
        cds.center,
        cds.radius,
        cds.approachWidth,
        cds.approachTangent,
        cds.hasCenterIsland,
        0.082
      ),
    }));

    return {
      segments: segmentMeshes,
      junctions: junctionMeshes,
      roundabout: roundaboutGeo,
      culDeSacs: culDeSacMeshes,
    };
  }, [topology, roadTelemetryList]);

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
    <group name="authoritative-road-network">
      {/* ================= 1. CONTINUOUS TRIMMED ROAD SEGMENTS ================= */}
      {geometries.segments.map((seg) => (
        <group
          key={seg.id}
          onClick={(e) => {
            e.stopPropagation();
            handleSelectRoad(seg.data);
          }}
        >
          <mesh geometry={seg.asphalt} material={asphaltMat} receiveShadow />
          {seg.sidewalk && <mesh geometry={seg.sidewalk} material={sidewalkMat} receiveShadow />}
          {seg.marking && <mesh geometry={seg.marking} material={yellowMarkingMat} raycast={() => null} />}
          {seg.dashes && <mesh geometry={seg.dashes} material={whiteMarkingMat} raycast={() => null} />}
        </group>
      ))}

      {/* ================= 2. SEAMLESS JUNCTION PLAZAS ================= */}
      <group name="engineered-junctions" raycast={() => null}>
        {geometries.junctions.map((j) => (
          <mesh key={j.id} geometry={j.geo} material={asphaltMat} receiveShadow />
        ))}
      </group>

      {/* ================= 3. EXACTLY ONE GRAND CIVIC ROUNDABOUT AT [0, 24.0] ================= */}
      <group name="central-civic-roundabout" raycast={() => null}>
        <mesh geometry={geometries.roundabout.asphalt} material={asphaltMat} receiveShadow />
        <mesh geometry={geometries.roundabout.centerIsland} material={centerIslandGrassMat} receiveShadow />
        <mesh geometry={geometries.roundabout.sidewalks} material={sidewalkMat} receiveShadow />
        <mesh geometry={geometries.roundabout.circulatingMarkings} material={whiteMarkingMat} raycast={() => null} />
      </group>

      {/* ================= 4. EXACTLY 4 ENGINEERED CUL-DE-SACS ================= */}
      <group name="cul-de-sacs" raycast={() => null}>
        {geometries.culDeSacs.map((cds) => (
          <group key={cds.id}>
            <mesh geometry={cds.asphalt} material={asphaltMat} receiveShadow />
            <mesh geometry={cds.sidewalk} material={sidewalkMat} receiveShadow />
            {cds.centerIsland && <mesh geometry={cds.centerIsland} material={centerIslandGrassMat} receiveShadow />}
          </group>
        ))}
      </group>

      {/* ================= 5. EXACTLY 2 ARCHITECTURAL RIVER BRIDGES ================= */}
      {topology.bridges.map((b) => (
        <ArchitecturalBridge
          key={b.id}
          id={b.id}
          name={b.name}
          position={b.center}
          length={b.length}
          width={b.width}
          rotationY={b.rotationY}
          isSelected={selectedRoadId === b.id}
          onSelect={() => {
            const data = roadTelemetryList.find((r) => r.id === b.roadSegmentId);
            if (data) handleSelectRoad(data);
          }}
        />
      ))}

      {/* ================= 6. ZEBRA PEDESTRIAN CROSSINGS AT STRATEGIC NODES ================= */}
      {/* Central Arch Bridge Abutments */}
      <ZebraPedestrianCrossing position={[0, 0.76, -10.2]} width={5.4} length={2.2} />
      <ZebraPedestrianCrossing position={[0, 0.76, 4.3]} width={5.4} length={2.2} />

      {/* West Suspension Bridge Abutments */}
      <ZebraPedestrianCrossing position={[-25.0, 0.76, -23.4]} width={4.5} length={2.2} />
      <ZebraPedestrianCrossing position={[-25.0, 0.76, -9.0]} width={4.5} length={2.2} />

      {/* Grand Civic Roundabout Approach Throats */}
      <ZebraPedestrianCrossing position={[0, 0.86, 18.2]} width={5.4} length={2.2} />
      <ZebraPedestrianCrossing position={[0, 0.86, 29.8]} width={5.4} length={2.2} />
      <ZebraPedestrianCrossing position={[-5.8, 0.86, 24.0]} width={4.4} length={2.2} rotationY={Math.PI / 2} />
      <ZebraPedestrianCrossing position={[5.8, 0.86, 24.0]} width={4.4} length={2.2} rotationY={Math.PI / 2} />

      {/* ================= 7. HIGHWAY BOUNDARY PORTALS ================= */}
      <HighwayBoundaryPortal position={[0, 0.85, -43.8]} width={5.4} />
      <HighwayBoundaryPortal position={[0, 0.85, 43.8]} width={5.4} rotationY={Math.PI} />
      <HighwayBoundaryPortal position={[-25.0, 0.85, -43.8]} width={4.2} />

      {/* ================= 8. ANIMATED TRAFFIC SIGNALS ================= */}
      <TrafficIntersectionSignals />
    </group>
  );
}

export default React.memo(RoadNetwork);
