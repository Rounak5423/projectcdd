import { getTerrainHeight, isNearRiver, isNearLake } from './Terrain';
import { PlacedBuilding, BuildingCatalogItem, ResourceState } from '../../types/game';

// ================= CITY ROAD CORRIDORS & ZONING TELEMETRY =================
export interface RoadSegmentDefinition {
  id: string;
  name: string;
  p1: [number, number];
  p2: [number, number];
  width: number;
  speedLimit: number;
  zone: 'residential' | 'commercial' | 'industrial' | 'education' | 'healthcare' | 'agriculture' | 'infrastructure' | 'citadel';
  isBridge?: boolean;
}

export const CITY_ROAD_CORRIDORS: RoadSegmentDefinition[] = [
  // 1. Central Citadel Monumental Axis
  {
    id: 'road-ns-north',
    name: 'North Grand Arterial Parkway',
    p1: [0, -44],
    p2: [0, -10.5],
    width: 5.4,
    speedLimit: 70,
    zone: 'citadel',
  },
  {
    id: 'road-bridge-central',
    name: 'Central Citadel Grand Arch Bridge',
    p1: [0, -10.5],
    p2: [0, 4.5],
    width: 5.6,
    speedLimit: 60,
    zone: 'citadel',
    isBridge: true,
  },
  {
    id: 'road-ns-dais',
    name: 'Citadel Dais Approach',
    p1: [0, 4.5],
    p2: [0, 5.6],
    width: 5.4,
    speedLimit: 50,
    zone: 'citadel',
  },
  {
    id: 'road-forum-north',
    name: 'Elysium Forum North Transverse',
    p1: [-8.6, 5.6],
    p2: [8.6, 5.6],
    width: 4.8,
    speedLimit: 45,
    zone: 'citadel',
  },
  {
    id: 'road-forum-west',
    name: 'Elysium Forum West Avenue',
    p1: [-8.6, 5.6],
    p2: [-8.6, 18.5],
    width: 4.6,
    speedLimit: 45,
    zone: 'citadel',
  },
  {
    id: 'road-forum-east',
    name: 'Elysium Forum East Avenue',
    p1: [8.6, 5.6],
    p2: [8.6, 18.5],
    width: 4.6,
    speedLimit: 45,
    zone: 'citadel',
  },
  {
    id: 'road-forum-south',
    name: 'Elysium Forum South Transverse',
    p1: [-8.6, 18.5],
    p2: [8.6, 18.5],
    width: 4.8,
    speedLimit: 45,
    zone: 'citadel',
  },
  {
    id: 'road-ns-citadel-to-cross',
    name: 'Citadel South Boulevard',
    p1: [0, 18.5],
    p2: [0, 21.2],
    width: 5.4,
    speedLimit: 60,
    zone: 'commercial',
  },
  {
    id: 'road-ns-south',
    name: 'Oasis Terraces Grand Arterial',
    p1: [0, 26.8],
    p2: [0, 44],
    width: 5.4,
    speedLimit: 70,
    zone: 'residential',
  },

  // 2. East-West Grand Arterial (Outer High-Speed Wings)
  {
    id: 'road-ew-west',
    name: 'Aethel Science Highway (West Axis)',
    p1: [-44, 0],
    p2: [-25, 0],
    width: 5.2,
    speedLimit: 65,
    zone: 'education',
  },
  {
    id: 'road-ew-east',
    name: 'Vulcan Industrial Expressway (East Axis)',
    p1: [25, 0],
    p2: [44, 0],
    width: 5.2,
    speedLimit: 60,
    zone: 'industrial',
  },

  // 3. West Science & Agrisector Longitudinal Highway (along X = -25)
  {
    id: 'road-west-north',
    name: 'Aethel Ridge Science Corridor (North)',
    p1: [-25, -38],
    p2: [-25, -23.7],
    width: 4.2,
    speedLimit: 55,
    zone: 'education',
  },
  {
    id: 'road-bridge-west',
    name: 'West Aethel Ridge Suspension Bridge',
    p1: [-25, -23.7],
    p2: [-25, -8.7],
    width: 4.5,
    speedLimit: 60,
    zone: 'education',
    isBridge: true,
  },
  {
    id: 'road-west-mid1',
    name: 'Aethel Science Access (South Bridge)',
    p1: [-25, -8.7],
    p2: [-25, -2.8],
    width: 4.2,
    speedLimit: 50,
    zone: 'education',
  },
  {
    id: 'road-west-mid2',
    name: 'Verdant Vale Agro-Avenue (Mid)',
    p1: [-25, 2.8],
    p2: [-25, 21.8],
    width: 4.2,
    speedLimit: 50,
    zone: 'agriculture',
  },
  {
    id: 'road-west-south',
    name: 'Verdant Vale Agro-Avenue (South)',
    p1: [-25, 26.2],
    p2: [-25, 38],
    width: 4.2,
    speedLimit: 50,
    zone: 'agriculture',
  },

  // 4. East Vulcan Industrial Highway (along X = 25)
  {
    id: 'road-east-north1',
    name: 'Vulcan Heavy Freight Corridor (Far North)',
    p1: [25, -38],
    p2: [25, -24.2],
    width: 4.2,
    speedLimit: 50,
    zone: 'industrial',
  },
  {
    id: 'road-east-north2',
    name: 'Vulcan Smelter Access Corridor',
    p1: [25, -19.8],
    p2: [25, 0.25],
    width: 4.2,
    speedLimit: 50,
    zone: 'industrial',
  },
  {
    id: 'road-bridge-east',
    name: 'East Vulcan Industrial Truss Bridge',
    p1: [25, 0.25],
    p2: [25, 15.75],
    width: 4.5,
    speedLimit: 50,
    zone: 'industrial',
    isBridge: true,
  },
  {
    id: 'road-east-south1',
    name: 'Vulcan-Oasis Residential Link',
    p1: [25, 15.75],
    p2: [25, 21.8],
    width: 4.2,
    speedLimit: 50,
    zone: 'residential',
  },
  {
    id: 'road-east-south2',
    name: 'Oasis Terraces East Avenue',
    p1: [25, 26.2],
    p2: [25, 38],
    width: 4.2,
    speedLimit: 45,
    zone: 'residential',
  },

  // 5. South District Cross-Arterial (along Z = 24)
  {
    id: 'road-cross-south-west',
    name: 'South Aquifer Cross-Avenue (West)',
    p1: [-22.8, 24],
    p2: [-2.9, 24],
    width: 3.8,
    speedLimit: 45,
    zone: 'infrastructure',
  },
  {
    id: 'road-cross-south-east',
    name: 'South Medical & Civic Parkway (East)',
    p1: [2.9, 24],
    p2: [22.8, 24],
    width: 3.8,
    speedLimit: 45,
    zone: 'healthcare',
  },

  // 6. North Connectors (along Z = -22)
  {
    id: 'road-conn-north-west',
    name: 'Aethel Academic Link (West)',
    p1: [-22.8, -22],
    p2: [-2.9, -22],
    width: 3.6,
    speedLimit: 45,
    zone: 'education',
  },
  {
    id: 'road-conn-north-east',
    name: 'Vulcan Power & Substation Connector',
    p1: [2.9, -22],
    p2: [22.8, -22],
    width: 3.6,
    speedLimit: 45,
    zone: 'industrial',
  },
  {
    id: 'road-conn-north-east-sub',
    name: 'Vulcan Outer Industrial Spur',
    p1: [27.2, -22],
    p2: [38, -22],
    width: 3.6,
    speedLimit: 40,
    zone: 'industrial',
  },
];

// Major Junction Plazas (Clearance zones where buildings must not be placed)
export const JUNCTION_CLEARANCE_PLAZAS: [number, number, number][] = [
  [0, 24, 4.2], // South 4-Way Crossroads
  [-25, 0, 4.0], // West Crossroads
  [25, 0, 4.0], // East Crossroads
  [-25, 24, 3.8], // Agrisector T-Junction
  [25, 24, 3.8], // Residential T-Junction
  [0, -22, 4.2], // North Grand Arterial T-Junction
  [25, -22, 3.8], // Northeast Industrial T-Junction
  [-25, -22, 3.8], // Northwest Science T-Junction
];

// Point to Line Segment Distance and Projection
export function projectPointToSegment(
  px: number,
  pz: number,
  ax: number,
  az: number,
  bx: number,
  bz: number
): {
  dist: number;
  projX: number;
  projZ: number;
  t: number;
  tangentX: number;
  tangentZ: number;
  normalX: number;
  normalZ: number;
} {
  const dx = bx - ax;
  const dz = bz - az;
  const lenSq = dx * dx + dz * dz;

  if (lenSq === 0) {
    const d = Math.hypot(px - ax, pz - az);
    return {
      dist: d,
      projX: ax,
      projZ: az,
      t: 0,
      tangentX: 1,
      tangentZ: 0,
      normalX: 0,
      normalZ: 1,
    };
  }

  const len = Math.sqrt(lenSq);
  const tangentX = dx / len;
  const tangentZ = dz / len;
  // Perpendicular normal (pointing 90° clockwise)
  const normalX = -tangentZ;
  const normalZ = tangentX;

  let t = ((px - ax) * dx + (pz - az) * dz) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = ax + t * dx;
  const projZ = az + t * dz;
  const dist = Math.hypot(px - projX, pz - projZ);

  return { dist, projX, projZ, t, tangentX, tangentZ, normalX, normalZ };
}

// Distance to complete road network
export function getDistToRoadNetwork(x: number, z: number, footprintRadius: number = 2.1): {
  minDist: number;
  overlaps: boolean;
  closestRoad: RoadSegmentDefinition | null;
  side: 'left' | 'right';
  projX: number;
  projZ: number;
} {
  let minDist = Infinity;
  let overlaps = false;
  let closestRoad: RoadSegmentDefinition | null = null;
  let side: 'left' | 'right' = 'right';
  let bestProjX = x;
  let bestProjZ = z;

  // 1. Check Citadel Boulevard Ring (center [0, 13], radius 6.7, width 2.2)
  const distFromCitadel = Math.hypot(x, z - 13);
  const ringDist = Math.abs(distFromCitadel - 6.7);
  const ringRequired = 1.1 + footprintRadius;
  if (ringDist < ringRequired) {
    overlaps = true;
  }
  if (ringDist < minDist) {
    minDist = ringDist;
  }

  // 2. Check linear road corridors
  for (const road of CITY_ROAD_CORRIDORS) {
    const proj = projectPointToSegment(x, z, road.p1[0], road.p1[1], road.p2[0], road.p2[1]);
    const reqClearance = road.width * 0.5 + footprintRadius;

    if (proj.dist < reqClearance) {
      overlaps = true;
    }

    if (proj.dist < minDist) {
      minDist = proj.dist;
      closestRoad = road;
      bestProjX = proj.projX;
      bestProjZ = proj.projZ;

      // Determine left or right of road line
      const crossProduct = (x - proj.projX) * proj.normalX + (z - proj.projZ) * proj.normalZ;
      side = crossProduct >= 0 ? 'right' : 'left';
    }
  }

  // 3. Check Junction Plazas
  for (const [jx, jz, jRadius] of JUNCTION_CLEARANCE_PLAZAS) {
    const d = Math.hypot(x - jx, z - jz);
    const req = jRadius + footprintRadius;
    if (d < req) {
      overlaps = true;
    }
    if (d < minDist) {
      minDist = d;
    }
  }

  return {
    minDist,
    overlaps,
    closestRoad,
    side,
    projX: bestProjX,
    projZ: bestProjZ,
  };
}

// ================= INTELLIGENT ROADSIDE PARCEL ALIGNMENT =================
export interface RoadsideAlignment {
  snappedX: number;
  snappedZ: number;
  snappedY: number;
  facingRotation: number;
  roadName: string;
  zone: string;
  distToRoadCenter: number;
  isBesideRoad: boolean;
  isZoneMatching: boolean;
}

export function calculateRoadsideAlignment(
  rawX: number,
  rawZ: number,
  category: string = 'residential',
  footprintRadius: number = 2.2
): RoadsideAlignment {
  const roadCheck = getDistToRoadNetwork(rawX, rawZ, footprintRadius);
  const road = roadCheck.closestRoad;

  if (!road) {
    const y = getTerrainHeight(rawX, rawZ);
    return {
      snappedX: rawX,
      snappedZ: rawZ,
      snappedY: y,
      facingRotation: 0,
      roadName: 'None',
      zone: 'general',
      distToRoadCenter: roadCheck.minDist,
      isBesideRoad: false,
      isZoneMatching: true,
    };
  }

  const proj = projectPointToSegment(rawX, rawZ, road.p1[0], road.p1[1], road.p2[0], road.p2[1]);

  // Standard civic setback: road half-width + sidewalk (1.2m) + building radius + garden buffer (0.8m)
  const setback = road.width * 0.5 + 1.2 + footprintRadius + 0.8;

  // Determine side along the normal
  const cross = (rawX - proj.projX) * proj.normalX + (rawZ - proj.projZ) * proj.normalZ;
  const sideSign = cross >= 0 ? 1 : -1;

  const snappedX = proj.projX + proj.normalX * setback * sideSign;
  const snappedZ = proj.projZ + proj.normalZ * setback * sideSign;
  const snappedY = getTerrainHeight(snappedX, snappedZ);

  // Calculate facing rotation: building entrance faces towards the road centerline projection (projX, projZ)
  // Three.js rotation: rot = 0 faces +Z.
  // Angle towards road center:
  const toRoadX = proj.projX - snappedX;
  const toRoadZ = proj.projZ - snappedZ;
  const facingRotation = Math.atan2(toRoadX, toRoadZ);

  const isBesideRoad = roadCheck.minDist <= 12.0;

  // Zone compatibility check
  const zone = road.zone;
  let isZoneMatching = true;
  if (category === 'industrial' && zone === 'residential') isZoneMatching = false;
  if (category === 'residential' && zone === 'industrial') isZoneMatching = false;

  return {
    snappedX,
    snappedZ,
    snappedY,
    facingRotation,
    roadName: road.name,
    zone,
    distToRoadCenter: setback,
    isBesideRoad,
    isZoneMatching,
  };
}

