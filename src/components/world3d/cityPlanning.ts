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
  // 1. Primary Grand Boulevard & Civic Axis
  {
    id: 'road-ns-north',
    name: 'North Grand Boulevard (Riverfront Corridor)',
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
    id: 'road-citadel-boulevard',
    name: 'Senate Citadel Boulevard (Civic Axis)',
    p1: [0, 4.5],
    p2: [0, 18.0],
    width: 5.4,
    speedLimit: 50,
    zone: 'citadel',
  },
  {
    id: 'road-civic-roundabout',
    name: 'Grand Civic Central Roundabout',
    p1: [0, 18.0],
    p2: [0, 30.0],
    width: 6.0,
    speedLimit: 40,
    zone: 'commercial',
  },
  {
    id: 'road-ns-south',
    name: 'Oasis Terraces Grand Boulevard',
    p1: [0, 30.0],
    p2: [0, 44],
    width: 5.4,
    speedLimit: 70,
    zone: 'residential',
  },

  // 2. West Riverfront Science Highway
  {
    id: 'road-west-north',
    name: 'Aethel Ridge Highway (North Mountain Pass)',
    p1: [-25, -44],
    p2: [-25, -23.7],
    width: 4.2,
    speedLimit: 60,
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
    id: 'road-west-south',
    name: 'Aethel Ridge Scenic River Bluff Avenue',
    p1: [-25, -8.7],
    p2: [-25, 24.0],
    width: 4.2,
    speedLimit: 55,
    zone: 'education',
  },

  // 3. East Riverfront Industrial Highway
  {
    id: 'road-east-north',
    name: 'Vulcan Forge Freight Highway (North)',
    p1: [25, -44],
    p2: [25, 0.25],
    width: 4.2,
    speedLimit: 55,
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
    id: 'road-east-south',
    name: 'Vulcan Logistics Link (South Corridor)',
    p1: [25, 15.75],
    p2: [25, 24.0],
    width: 4.2,
    speedLimit: 50,
    zone: 'industrial',
  },

  // 4. Transverse Civic Parkway (Z = 24.0)
  {
    id: 'road-parkway-west',
    name: 'West Civic Parkway',
    p1: [-6.0, 24.0],
    p2: [-25.0, 24.0],
    width: 4.4,
    speedLimit: 50,
    zone: 'infrastructure',
  },
  {
    id: 'road-parkway-east',
    name: 'East Civic Parkway',
    p1: [6.0, 24.0],
    p2: [25.0, 24.0],
    width: 4.4,
    speedLimit: 50,
    zone: 'healthcare',
  },

  // 5. North Transverse Connectors (Z = -22.0)
  {
    id: 'road-conn-north-west',
    name: 'Aethel Academic Link (West)',
    p1: [-25, -22],
    p2: [0, -22],
    width: 3.8,
    speedLimit: 45,
    zone: 'education',
  },
  {
    id: 'road-conn-north-east',
    name: 'Vulcan Power Substation Link (East)',
    p1: [0, -22],
    p2: [25, -22],
    width: 3.8,
    speedLimit: 45,
    zone: 'industrial',
  },

  // 6. Local Access Roads & Engineered Cul-de-Sacs
  {
    id: 'road-spur-science',
    name: 'Quantum Telemetry Observatory Spur',
    p1: [-25.0, -2.0],
    p2: [-34.0, -2.0],
    width: 3.8,
    speedLimit: 40,
    zone: 'education',
  },
  {
    id: 'road-spur-agri',
    name: 'Verdant Vale Agrisector Farm Spur',
    p1: [-25.0, 24.0],
    p2: [-25.0, 38.0],
    width: 4.0,
    speedLimit: 40,
    zone: 'agriculture',
  },
  {
    id: 'road-spur-freight',
    name: 'Vulcan Heavy Foundry Freight Spur',
    p1: [25.0, 24.0],
    p2: [36.0, 24.0],
    width: 4.2,
    speedLimit: 40,
    zone: 'industrial',
  },
  {
    id: 'road-spur-residential',
    name: 'Oasis Terraces Residential Spur',
    p1: [14.0, 24.0],
    p2: [14.0, 38.0],
    width: 3.8,
    speedLimit: 35,
    zone: 'residential',
  },
];

// Major Junction Plazas & Roundabouts (Clearance zones where buildings must not be placed)
export const JUNCTION_CLEARANCE_PLAZAS: [number, number, number][] = [
  [0, 24.0, 7.0],       // Grand Civic Roundabout Central Hub
  [0, -22.0, 5.2],      // North Grand Boulevard Connector
  [-25.0, -22.0, 4.6],  // Northwest Science T-Junction
  [25.0, -22.0, 4.6],   // Northeast Industrial T-Junction
  [-25.0, 24.0, 5.0],   // West Crossroads
  [25.0, 24.0, 5.0],    // East Crossroads
  [14.0, 24.0, 4.4],    // Oasis Residential Branch Junction
  [-25.0, -2.0, 4.4],   // Science Observatory Branch Junction
  [-34.0, -2.0, 4.8],   // Science Observatory Cul-de-Sac
  [-25.0, 38.0, 5.0],   // Agrisector Farm Cul-de-Sac
  [36.0, 24.0, 5.2],    // Vulcan Freight Cul-de-Sac
  [14.0, 38.0, 4.8],    // Oasis Terraces Residential Cul-de-Sac
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

