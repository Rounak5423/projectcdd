import React, { useState, useMemo, useRef } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { getTerrainHeight, isNearRiver } from './Terrain';
import { useDayNight } from './DayNightController';
import { useGameState } from '../../context/GameStateContext';
import { RoadSegmentData } from '../../types/road';

// ================= TRAFFIC SIGNAL CONTROLLER =================
export interface TrafficSignalState {
  isNorthSouthGreen: boolean;
  isNorthSouthYellow: boolean;
  isEastWestGreen: boolean;
  isEastWestYellow: boolean;
}

// Global traffic light signal state listener for vehicles
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
  const { isNight } = useDayNight();
  const [x, y, z] = position;

  return (
    <group position={[x, y, z]} rotation={[0, rotationY, 0]}>
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
      {/* Signal Visor Caps */}
      {[-0.26, 0, 0.26].map((sy, i) => (
        <mesh key={i} position={[1.3, 3.1 + sy, 0.15]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[0.22, 0.05, 0.12]} />
          <meshStandardMaterial color="#151a16" />
        </mesh>
      ))}

      {/* Red Lamp */}
      <mesh position={[1.3, 3.36, 0.12]}>
        <sphereGeometry args={[0.09, 10, 10]} />
        <meshStandardMaterial
          color={isRed ? '#ff3838' : '#4a1515'}
          emissive={isRed ? '#ff2222' : '#000000'}
          emissiveIntensity={isRed ? (isNight ? 2.8 : 1.8) : 0}
        />
      </mesh>
      {/* Yellow / Amber Lamp */}
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
  const { isNight } = useDayNight();
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
        <group key={idx} position={[0, -1.15, offset]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[1.2, 1.5, 2.5, 8]} />
            <meshStandardMaterial color="#423b32" roughness={0.8} />
          </mesh>
          {/* Hydrodynamic Waterbreak Wedge */}
          <mesh position={[0, -0.2, 0]} rotation={[0, Math.PI / 4, 0]}>
            <boxGeometry args={[1.7, 2.1, 1.7]} />
            <meshStandardMaterial color="#36312a" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Main Bridge Road Deck (Asphalt & Substructure) */}
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
      <mesh position={[-0.08, 0.75, 0]}>
        <boxGeometry args={[0.07, 0.02, length - 0.6]} />
        <meshBasicMaterial color="#e3be66" />
      </mesh>
      <mesh position={[0.08, 0.75, 0]}>
        <boxGeometry args={[0.07, 0.02, length - 0.6]} />
        <meshBasicMaterial color="#e3be66" />
      </mesh>

      {/* White Outer Edge Boundaries */}
      {[-width * 0.5 + 0.5, width * 0.5 - 0.5].map((edgeX, i) => (
        <mesh key={i} position={[edgeX, 0.75, 0]}>
          <boxGeometry args={[0.08, 0.02, length - 0.6]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
      ))}

      {/* Raised Pedestrian Sidewalks */}
      {[-width * 0.5 + 0.35, width * 0.5 - 0.35].map((sideX, i) => (
        <mesh key={i} position={[sideX, 0.82, 0]} receiveShadow>
          <boxGeometry args={[0.7, 0.18, length]} />
          <meshStandardMaterial color="#68736a" roughness={0.7} />
        </mesh>
      ))}

      {/* Architectural Suspension Trusses & Cables */}
      {[-width * 0.5 + 0.05, width * 0.5 - 0.05].map((archX, i) => (
        <group key={i} position={[archX, 1.6, 0]}>
          {/* Steel Arch Spine */}
          <mesh castShadow>
            <cylinderGeometry args={[0.13, 0.13, length * 0.98, 8]} />
            <meshStandardMaterial color="#a89a7b" metalness={0.7} roughness={0.25} />
          </mesh>
          {/* Vertical Steel Hanger Cables */}
          {[-length * 0.38, -length * 0.24, -length * 0.1, length * 0.1, length * 0.24, length * 0.38].map((cz, j) => (
            <mesh key={j} position={[0, -0.6, cz]}>
              <cylinderGeometry args={[0.03, 0.03, 1.3, 6]} />
              <meshStandardMaterial color="#d4cbb6" metalness={0.8} />
            </mesh>
          ))}
          {/* Illuminated Handrails */}
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
        <group key={k} position={[px, 1.25, pz]}>
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
          {isNight && (
            <pointLight
              color="#ffbe3b"
              intensity={0.65}
              distance={7.0}
              position={[0, 0.8, 0]}
            />
          )}
        </group>
      ))}

      {/* Selection Glow Outline */}
      {isSelected && (
        <mesh position={[0, 0.78, 0]}>
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
    <group position={position} rotation={[0, rotationY, 0]}>
      {Array.from({ length: stripeCount }).map((_, i) => {
        const offset = -width * 0.5 + (i + 0.5) * stripeSpacing;
        return (
          <mesh key={i} position={[offset, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[stripeWidth, length]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.88} />
          </mesh>
        );
      })}
    </group>
  );
}

// ================= OVERHEAD GANTRY HIGHWAY SIGN =================
function HighwayGantrySign({
  position,
  rotationY = 0,
  signTextLeft,
  signTextRight,
}: {
  position: [number, number, number];
  rotationY?: number;
  signTextLeft: string;
  signTextRight: string;
}) {
  const [x, y, z] = position;
  return (
    <group position={[x, y, z]} rotation={[0, rotationY, 0]}>
      {/* Dual Steel Support Columns */}
      {[-3.2, 3.2].map((colX, i) => (
        <mesh key={i} position={[colX, 2.2, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 4.4, 6]} />
          <meshStandardMaterial color="#353e37" metalness={0.7} />
        </mesh>
      ))}
      {/* Overhead Gantry Truss Beam */}
      <mesh position={[0, 4.3, 0]}>
        <boxGeometry args={[6.8, 0.25, 0.3]} />
        <meshStandardMaterial color="#2a322c" metalness={0.7} />
      </mesh>
      {/* Directional Sign Boards */}
      <mesh position={[-1.4, 3.8, 0.18]}>
        <boxGeometry args={[2.4, 0.9, 0.08]} />
        <meshStandardMaterial color="#1a5f45" roughness={0.3} />
      </mesh>
      <mesh position={[1.4, 3.8, 0.18]}>
        <boxGeometry args={[2.4, 0.9, 0.08]} />
        <meshStandardMaterial color="#1f4f6e" roughness={0.3} />
      </mesh>
      {/* Glowing Highway Information Sign Text */}
      <Html position={[-1.4, 3.8, 0.25]} center transform distanceFactor={28}>
        <div className="pointer-events-none px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-400/80 text-[10px] font-mono font-bold text-emerald-200 tracking-wider text-center whitespace-nowrap shadow-lg">
          ◀ {signTextLeft}
        </div>
      </Html>
      <Html position={[1.4, 3.8, 0.25]} center transform distanceFactor={28}>
        <div className="pointer-events-none px-2 py-0.5 rounded bg-sky-950/90 border border-sky-400/80 text-[10px] font-mono font-bold text-sky-200 tracking-wider text-center whitespace-nowrap shadow-lg">
          {signTextRight} ▶
        </div>
      </Html>
    </group>
  );
}

// ================= TRANSIT BUS SHELTER =================
function TransitBusShelter({
  position,
  rotationY = 0,
  stopName,
}: {
  position: [number, number, number];
  rotationY?: number;
  stopName: string;
}) {
  const { isNight } = useDayNight();
  const [x, y, z] = position;

  return (
    <group position={[x, y, z]} rotation={[0, rotationY, 0]}>
      {/* Shelter Concrete Pad */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[2.4, 0.16, 1.4]} />
        <meshStandardMaterial color="#556057" roughness={0.7} />
      </mesh>
      {/* Rear & Side Tempered Glass Panels */}
      <mesh position={[0, 0.9, -0.6]}>
        <planeGeometry args={[2.2, 1.5]} />
        <meshStandardMaterial
          color="#8ac7db"
          transparent
          opacity={0.4}
          roughness={0.1}
          metalness={0.5}
        />
      </mesh>
      {/* Cantilever Steel Roof */}
      <mesh position={[0, 1.7, 0]}>
        <boxGeometry args={[2.6, 0.1, 1.6]} />
        <meshStandardMaterial color="#323b34" metalness={0.6} />
      </mesh>
      {/* Waiting Bench */}
      <mesh position={[0, 0.35, -0.2]}>
        <boxGeometry args={[1.6, 0.15, 0.4]} />
        <meshStandardMaterial color="#8a5e3c" />
      </mesh>
      {/* Digital Transit Route Beacon */}
      <mesh position={[1.1, 1.0, 0.4]}>
        <cylinderGeometry args={[0.04, 0.04, 2.0, 6]} />
        <meshStandardMaterial color="#2d3630" />
      </mesh>
      <mesh position={[1.1, 1.85, 0.4]}>
        <boxGeometry args={[0.35, 0.25, 0.1]} />
        <meshStandardMaterial
          color="#ffb833"
          emissive="#ff9900"
          emissiveIntensity={isNight ? 1.8 : 0.6}
        />
      </mesh>
    </group>
  );
}

// ================= ROADSIDE BOLLARD & FIRE HYDRANT =================
function RoadsideFireHydrant({ position }: { position: [number, number, number] }) {
  const [x, y, z] = position;
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.14, 0.6, 8]} />
        <meshStandardMaterial color="#e74c3c" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <sphereGeometry args={[0.13, 8, 8]} />
        <meshStandardMaterial color="#c0392b" />
      </mesh>
      <mesh position={[0, 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 0.36, 8]} />
        <meshStandardMaterial color="#dcdad5" metalness={0.7} />
      </mesh>
    </group>
  );
}

// ================= MASTER ROAD NETWORK COMPONENT =================
export default function RoadNetwork() {
  const { isNight } = useDayNight();
  const { rates } = useGameState();

  const [selectedRoad, setSelectedRoad] = useState<RoadSegmentData | null>(null);
  const [signalState, setSignalState] = useState<TrafficSignalState>(globalTrafficSignal);

  // Traffic light cycle timer (North-South vs East-West green cycle)
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const cycleTime = time % 22; // 22 second full cycle

    let nsGreen = false;
    let nsYellow = false;
    let ewGreen = false;
    let ewYellow = false;

    if (cycleTime < 8.5) {
      // Phase 1: North-South Green
      nsGreen = true;
    } else if (cycleTime < 11.0) {
      // Phase 2: North-South Yellow
      nsYellow = true;
    } else if (cycleTime < 19.5) {
      // Phase 3: East-West Green
      ewGreen = true;
    } else {
      // Phase 4: East-West Yellow
      ewYellow = true;
    }

    globalTrafficSignal = {
      isNorthSouthGreen: nsGreen,
      isNorthSouthYellow: nsYellow,
      isEastWestGreen: ewGreen,
      isEastWestYellow: ewYellow,
    };

    setSignalState(globalTrafficSignal);
  });

  // Road segment definitions with full tactical telemetry
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

  // Streetlights placement coordinates
  const streetlights = useMemo(() => {
    const list: [number, number, number, number][] = [];
    // North-South Avenue poles
    for (let z = -44; z <= 44; z += 13) {
      if (Math.abs(z - (-3.0)) < 9) continue; // skip bridge span
      list.push([-3.4, getTerrainHeight(-3.4, z) + 0.1, z, 0]);
      list.push([3.4, getTerrainHeight(3.4, z) + 0.1, z, Math.PI]);
    }
    // East-West Avenue poles
    for (let x = -44; x <= 44; x += 13) {
      if (Math.abs(x) < 8) continue; // skip central intersection
      if (isNearRiver(x, 0, 4.0)) continue;
      list.push([x, getTerrainHeight(x, -3.4) + 0.1, -3.4, Math.PI * 0.5]);
      list.push([x, getTerrainHeight(x, 3.4) + 0.1, 3.4, -Math.PI * 0.5]);
    }
    // Residential & Industrial poles
    list.push([20, getTerrainHeight(20, 20) + 0.1, 20, 0]);
    list.push([20, getTerrainHeight(20, 32) + 0.1, 32, Math.PI]);
    list.push([-25, getTerrainHeight(-25, 20) + 0.1, 20, 0]);
    list.push([32, getTerrainHeight(32, -22) + 0.1, -22, Math.PI * 0.5]);
    return list;
  }, []);

  return (
    <group>
      {/* ================= 1. CENTRAL GRAND ARTERIAL HIGHWAYS ================= */}
      {/* North-South Grand Avenue (Width 5.4m) */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          setSelectedRoad(roadSegments[0]);
        }}
      >
        {/* South Segment */}
        <mesh position={[0, 0.22, 26]} receiveShadow>
          <boxGeometry args={[5.4, 0.2, 44]} />
          <meshStandardMaterial
            color={selectedRoad?.id === 'road-ns-south' ? '#695a3a' : '#2d352f'}
            roughness={0.92}
          />
        </mesh>
        {/* Double Yellow Dividing Lines */}
        <mesh position={[-0.08, 0.33, 26]}>
          <boxGeometry args={[0.08, 0.02, 44]} />
          <meshBasicMaterial color="#e0c87e" />
        </mesh>
        <mesh position={[0.08, 0.33, 26]}>
          <boxGeometry args={[0.08, 0.02, 44]} />
          <meshBasicMaterial color="#e0c87e" />
        </mesh>
        {/* Dashed Lane Lines */}
        {[-1.35, 1.35].map((laneX, i) => (
          <mesh key={i} position={[laneX, 0.33, 26]}>
            <boxGeometry args={[0.08, 0.02, 44]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.65} />
          </mesh>
        ))}
        {/* Raised Curbs & Sidewalks */}
        {[-3.0, 3.0].map((swX, i) => (
          <mesh key={i} position={[swX, 0.29, 26]} receiveShadow>
            <boxGeometry args={[0.8, 0.15, 44]} />
            <meshStandardMaterial color="#68736a" roughness={0.75} />
          </mesh>
        ))}

        {/* North Segment */}
        <mesh position={[0, 0.22, -26]} receiveShadow>
          <boxGeometry args={[5.4, 0.2, 38]} />
          <meshStandardMaterial
            color={selectedRoad?.id === 'road-ns-north' ? '#695a3a' : '#2d352f'}
            roughness={0.92}
          />
        </mesh>
        <mesh position={[-0.08, 0.33, -26]}>
          <boxGeometry args={[0.08, 0.02, 38]} />
          <meshBasicMaterial color="#e0c87e" />
        </mesh>
        <mesh position={[0.08, 0.33, -26]}>
          <boxGeometry args={[0.08, 0.02, 38]} />
          <meshBasicMaterial color="#e0c87e" />
        </mesh>
        {[-1.35, 1.35].map((laneX, i) => (
          <mesh key={i} position={[laneX, 0.33, -26]}>
            <boxGeometry args={[0.08, 0.02, 38]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.65} />
          </mesh>
        ))}
        {[-3.0, 3.0].map((swX, i) => (
          <mesh key={i} position={[swX, 0.29, -26]} receiveShadow>
            <boxGeometry args={[0.8, 0.15, 38]} />
            <meshStandardMaterial color="#68736a" roughness={0.75} />
          </mesh>
        ))}
      </group>

      {/* East-West Grand Avenue (Width 5.2m) */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          setSelectedRoad(roadSegments[2]);
        }}
      >
        <mesh position={[0, 0.22, 0]} receiveShadow>
          <boxGeometry args={[94, 0.2, 5.2]} />
          <meshStandardMaterial
            color={selectedRoad?.id === 'road-ew-west' || selectedRoad?.id === 'road-ew-east' ? '#695a3a' : '#2d352f'}
            roughness={0.92}
          />
        </mesh>
        <mesh position={[0, 0.33, -0.08]}>
          <boxGeometry args={[94, 0.02, 0.08]} />
          <meshBasicMaterial color="#e0c87e" />
        </mesh>
        <mesh position={[0, 0.33, 0.08]}>
          <boxGeometry args={[94, 0.02, 0.08]} />
          <meshBasicMaterial color="#e0c87e" />
        </mesh>
        {[-1.3, 1.3].map((laneZ, i) => (
          <mesh key={i} position={[0, 0.33, laneZ]}>
            <boxGeometry args={[94, 0.02, 0.08]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.65} />
          </mesh>
        ))}
        {[-2.9, 2.9].map((swZ, i) => (
          <mesh key={i} position={[0, 0.29, swZ]} receiveShadow>
            <boxGeometry args={[94, 0.15, 0.8]} />
            <meshStandardMaterial color="#68736a" roughness={0.75} />
          </mesh>
        ))}
      </group>

      {/* ================= 2. SECONDARY DISTRICT ACCESS CORRIDORS ================= */}
      {/* Secondary Cardinal Roads at X = ±25 and Z = ±25 */}
      {[-25, 25].map((gx, idx) => (
        <group
          key={`ns-sec-${idx}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRoad(idx === 0 ? roadSegments[9] : roadSegments[8]);
          }}
        >
          {/* South Access */}
          <mesh position={[gx, 0.2, 20]} receiveShadow>
            <boxGeometry args={[3.8, 0.18, 52]} />
            <meshStandardMaterial color="#353e37" roughness={0.9} />
          </mesh>
          <mesh position={[gx, 0.3, 20]}>
            <boxGeometry args={[0.1, 0.02, 52]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.65} />
          </mesh>
          {/* North Access */}
          <mesh position={[gx, 0.2, -26]} receiveShadow>
            <boxGeometry args={[3.8, 0.18, 40]} />
            <meshStandardMaterial color="#353e37" roughness={0.9} />
          </mesh>
          <mesh position={[gx, 0.3, -26]}>
            <boxGeometry args={[0.1, 0.02, 40]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.65} />
          </mesh>
        </group>
      ))}

      {[-25, 25].map((gz, idx) => (
        <group
          key={`ew-sec-${idx}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRoad(roadSegments[4]);
          }}
        >
          <mesh position={[0, 0.2, gz]} receiveShadow>
            <boxGeometry args={[92, 0.18, 3.8]} />
            <meshStandardMaterial color="#353e37" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.3, gz]}>
            <boxGeometry args={[92, 0.02, 0.1]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.65} />
          </mesh>
        </group>
      ))}

      {/* ================= 3. CITADEL GRAND BOULEVARD RING ================= */}
      <group
        position={[0, 0.45, 0]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedRoad(roadSegments[4]);
        }}
      >
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <ringGeometry args={[12.8, 16.6, 48]} />
          <meshStandardMaterial
            color={selectedRoad?.id === 'road-citadel-ring' ? '#695a3a' : '#333b35'}
            roughness={0.88}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
          <ringGeometry args={[14.65, 14.75, 48]} />
          <meshBasicMaterial color="#e0c87e" side={THREE.DoubleSide} />
        </mesh>
        {/* Outer Stone Promenade Curb */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[16.6, 17.2, 48]} />
          <meshStandardMaterial color="#68736a" roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* ================= 4. ZEBRA PEDESTRIAN CROSSINGS AT 4-WAY INTERSECTION ================= */}
      {/* North Approach (Z ≈ -3.8) */}
      <ZebraPedestrianCrossing position={[0, 0.33, -4.2]} width={5.2} length={2.2} />
      {/* South Approach (Z ≈ 3.8) */}
      <ZebraPedestrianCrossing position={[0, 0.33, 4.2]} width={5.2} length={2.2} />
      {/* East Approach (X ≈ 4.2) */}
      <ZebraPedestrianCrossing position={[4.2, 0.33, 0]} width={5.2} length={2.2} rotationY={Math.PI / 2} />
      {/* West Approach (X ≈ -4.2) */}
      <ZebraPedestrianCrossing position={[-4.2, 0.33, 0]} width={5.2} length={2.2} rotationY={Math.PI / 2} />

      {/* ================= 5. ANIMATED TRAFFIC SIGNALS AT CENTRAL INTERSECTION ================= */}
      {/* North-South Signal 1 (Southbound entrance) */}
      <TrafficSignalPost
        position={[-3.2, 0.33, -4.6]}
        rotationY={0}
        isGreen={signalState.isNorthSouthGreen}
        isYellow={signalState.isNorthSouthYellow}
        isRed={!signalState.isNorthSouthGreen && !signalState.isNorthSouthYellow}
      />
      {/* North-South Signal 2 (Northbound entrance) */}
      <TrafficSignalPost
        position={[3.2, 0.33, 4.6]}
        rotationY={Math.PI}
        isGreen={signalState.isNorthSouthGreen}
        isYellow={signalState.isNorthSouthYellow}
        isRed={!signalState.isNorthSouthGreen && !signalState.isNorthSouthYellow}
      />
      {/* East-West Signal 1 (Eastbound entrance) */}
      <TrafficSignalPost
        position={[-4.6, 0.33, 3.2]}
        rotationY={-Math.PI / 2}
        isGreen={signalState.isEastWestGreen}
        isYellow={signalState.isEastWestYellow}
        isRed={!signalState.isEastWestGreen && !signalState.isEastWestYellow}
      />
      {/* East-West Signal 2 (Westbound entrance) */}
      <TrafficSignalPost
        position={[4.6, 0.33, -3.2]}
        rotationY={Math.PI / 2}
        isGreen={signalState.isEastWestGreen}
        isYellow={signalState.isEastWestYellow}
        isRed={!signalState.isEastWestGreen && !signalState.isEastWestYellow}
      />

      {/* ================= 6. OVERHEAD HIGHWAY DIRECTIONAL SIGNS ================= */}
      <HighwayGantrySign
        position={[0, 0.22, 12.0]}
        rotationY={0}
        signTextLeft="Oasis Terraces"
        signTextRight="Verdant Agrisector"
      />
      <HighwayGantrySign
        position={[14.0, 0.22, 0]}
        rotationY={Math.PI / 2}
        signTextLeft="Vulcan Industrial"
        signTextRight="Elysium Citadel"
      />
      <HighwayGantrySign
        position={[-14.0, 0.22, 0]}
        rotationY={-Math.PI / 2}
        signTextLeft="Science Ridge Park"
        signTextRight="Elysium Citadel"
      />

      {/* ================= 7. TRANSIT STOPS & BUS SHELTERS ================= */}
      <TransitBusShelter position={[3.8, 0.32, 16.0]} rotationY={-Math.PI / 2} stopName="Citadel South Terminal" />
      <TransitBusShelter position={[-3.8, 0.32, -18.0]} rotationY={Math.PI / 2} stopName="Science Ridge Gateway" />
      <TransitBusShelter position={[18.0, 0.32, 3.8]} rotationY={Math.PI} stopName="Vulcan Foundry Exchange" />

      {/* ================= 8. ROADSIDE FIRE HYDRANTS ================= */}
      <RoadsideFireHydrant position={[3.4, 0.32, 8.0]} />
      <RoadsideFireHydrant position={[-3.4, 0.32, 22.0]} />
      <RoadsideFireHydrant position={[12.0, 0.32, -3.4]} />
      <RoadsideFireHydrant position={[-18.0, 0.32, 3.4]} />

      {/* ================= 9. ARCHITECTURAL RIVER BRIDGES ================= */}
      {/* Central Grand Citadel Bridge (Crossing river at X = 0, Z ≈ -3.0) */}
      <ArchitecturalBridge
        id="road-bridge-central"
        name="Central Citadel Grand Arch Bridge"
        position={[0, 0.3, -3.0]}
        length={16.5}
        width={5.6}
        rotationY={0}
        isSelected={selectedRoad?.id === 'road-bridge-central'}
        onSelect={() => setSelectedRoad(roadSegments[5])}
      />

      {/* West Science Highway Bridge (Crossing river at X = -25, Z ≈ -16.2) */}
      <ArchitecturalBridge
        id="road-bridge-west"
        name="West Aethel Ridge Suspension Bridge"
        position={[-25, 0.35, -16.2]}
        length={15.0}
        width={4.5}
        rotationY={-0.12}
        isSelected={selectedRoad?.id === 'road-bridge-west'}
        onSelect={() => setSelectedRoad(roadSegments[6])}
      />

      {/* East Oasis Highway Bridge (Crossing river at X = 25, Z ≈ 8.0) */}
      <ArchitecturalBridge
        id="road-bridge-east"
        name="East Vulcan Industrial Truss Bridge"
        position={[25, 0.32, 8.0]}
        length={15.5}
        width={4.5}
        rotationY={0.14}
        isSelected={selectedRoad?.id === 'road-bridge-east'}
        onSelect={() => setSelectedRoad(roadSegments[7])}
      />

      {/* ================= 10. STREETLIGHTS WITH NIGHT GLOW ================= */}
      {streetlights.map(([lx, ly, lz, lrot], idx) => (
        <group key={idx} position={[lx, ly, lz]} rotation={[0, lrot, 0]}>
          <mesh position={[0, 1.4, 0]}>
            <cylinderGeometry args={[0.06, 0.1, 2.8, 6]} />
            <meshStandardMaterial color="#2d332e" metalness={0.6} />
          </mesh>
          <mesh position={[0.4, 2.7, 0]} rotation={[0, 0, -Math.PI / 4]}>
            <cylinderGeometry args={[0.04, 0.05, 0.8, 6]} />
            <meshStandardMaterial color="#2d332e" metalness={0.6} />
          </mesh>
          <mesh position={[0.7, 2.85, 0]}>
            <boxGeometry args={[0.3, 0.1, 0.2]} />
            <meshStandardMaterial
              color={isNight ? '#ffdf94' : '#d2cbba'}
              emissive={isNight ? '#ffbe3b' : '#000000'}
              emissiveIntensity={isNight ? 1.7 : 0}
            />
          </mesh>
          {isNight && idx % 2 === 0 && (
            <pointLight
              color="#ffc75e"
              intensity={0.6}
              distance={8.0}
              position={[0.7, 2.5, 0]}
            />
          )}
        </group>
      ))}

      {/* ================= 11. INTERACTIVE ROAD INSPECTION TOOLTIP / POPUP ================= */}
      {selectedRoad && (
        <Html position={[0, 7.5, 0]} center distanceFactor={30}>
          <div className="pointer-events-auto bg-[#171d18]/95 border-2 border-[#c6a76a] p-4 rounded-xl shadow-2xl text-[#e8e9e3] flex flex-col gap-2 min-w-[290px] max-w-[340px] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-[#344435] pb-2">
              <div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#2b372c] text-[#a6bd82] border border-[#405442]">
                  {selectedRoad.category.replace('_', ' ')}
                </span>
                <h4 className="text-sm font-bold text-[#f3f5ee] mt-1.5 leading-snug">
                  {selectedRoad.name}
                </h4>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedRoad(null);
                }}
                className="p-1 rounded text-[#9da99b] hover:text-white hover:bg-[#253227] transition-colors"
                title="Close"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-[#9da99b] leading-relaxed">
              {selectedRoad.description}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
              <div className="p-2 rounded bg-[#131914] border border-[#263528]">
                <span className="text-[9px] text-[#8e9c8c] block uppercase">SPEED LIMIT</span>
                <span className="font-bold text-[#f0f3eb]">{selectedRoad.speedLimitKmh} km/h</span>
              </div>
              <div className="p-2 rounded bg-[#131914] border border-[#263528]">
                <span className="text-[9px] text-[#8e9c8c] block uppercase">ROADWAY LANES</span>
                <span className="font-bold text-[#c6a76a]">{selectedRoad.lanes} Lanes</span>
              </div>
              <div className="p-2 rounded bg-[#131914] border border-[#263528]">
                <span className="text-[9px] text-[#8e9c8c] block uppercase">DAILY FLOW</span>
                <span className="font-bold text-[#82a6bd]">
                  {selectedRoad.throughputVehiclesPerDay.toLocaleString()} V/Day
                </span>
              </div>
              <div className="p-2 rounded bg-[#131914] border border-[#263528]">
                <span className="text-[9px] text-[#8e9c8c] block uppercase">STATUS</span>
                <span className="font-bold text-[#a6bd82]">{selectedRoad.status}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#29352a] text-[10px] text-[#abb8a8] space-y-1">
              <div>
                <strong className="text-[#c6a76a]">Districts:</strong> {selectedRoad.connectedDistricts.join(' ↔ ')}
              </div>
              <div>
                <strong className="text-[#c6a76a]">Facilities:</strong> {selectedRoad.connectedBuildings.join(', ')}
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
