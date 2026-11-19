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
  // 1. Primary Grand Boulevard & River Crossing
  {
    id: 'seg-ns-north-portal',
    name: 'North Grand Boulevard (Outer Sector)',
    p1: [0, -44],
    p2: [0, -22],
    width: 5.4,
    speedLimit: 70,
    zone: 'commercial',
  },
  {
    id: 'seg-ns-north-approach',
    name: 'North Grand Boulevard (Bridge Approach)',
    p1: [0, -22],
    p2: [0, -10.5],
    width: 5.4,
    speedLimit: 70,
    zone: 'citadel',
  },
  {
    id: 'seg-bridge-central',
    name: 'Central Citadel Grand Arch Bridge',
    p1: [0, -10.5],
    p2: [0, 4.5],
    width: 5.6,
    speedLimit: 60,
    zone: 'citadel',
    isBridge: true,
  },

  // 2. Central Civic Secondary Loop (Encircles Forum, Preserving Landmark)
  {
    id: 'seg-loop-north-west',
    name: 'Riverfront Esplanade (West Wing)',
    p1: [0, 4.5],
    p2: [-12.0, 4.5],
    width: 4.4,
    speedLimit: 50,
    zone: 'citadel',
  },
  {
    id: 'seg-loop-north-east',
    name: 'Riverfront Esplanade (East Wing)',
    p1: [0, 4.5],
    p2: [12.0, 4.5],
    width: 4.4,
    speedLimit: 50,
    zone: 'citadel',
  },
  {
    id: 'seg-loop-west-avenue',
    name: 'West Civic Flank Avenue',
    p1: [-12.0, 4.5],
    p2: [-12.0, 24.0],
    width: 4.4,
    speedLimit: 50,
    zone: 'citadel',
  },
  {
    id: 'seg-loop-east-avenue',
    name: 'East Civic Flank Avenue',
    p1: [12.0, 4.5],
    p2: [12.0, 24.0],
    width: 4.4,
    speedLimit: 50,
    zone: 'citadel',
  },

  // 3. Central Civic Roundabout & South Boulevard
  {
    id: 'seg-roundabout',
    name: 'Grand Civic Central Roundabout',
    p1: [0, 18.0],
    p2: [0, 30.0],
    width: 6.0,
    speedLimit: 40,
    zone: 'commercial',
  },
  {
    id: 'seg-ns-south',
    name: 'Oasis Terraces Grand Boulevard',
    p1: [0, 30.0],
    p2: [0, 44.0],
    width: 5.4,
    speedLimit: 70,
    zone: 'residential',
  },

  // 4. Civic Parkway Approaches into Roundabout
  {
    id: 'seg-parkway-west-outer',
    name: 'West Civic Parkway (Regional Section)',
    p1: [-25.0, 24.0],
    p2: [-12.0, 24.0],
    width: 4.4,
    speedLimit: 50,
    zone: 'education',
  },
  {
    id: 'seg-parkway-west-inner',
    name: 'West Civic Parkway (Roundabout Throat)',
    p1: [-12.0, 24.0],
    p2: [-6.0, 24.0],
    width: 4.4,
    speedLimit: 45,
    zone: 'citadel',
  },
  {
    id: 'seg-parkway-east-inner',
    name: 'East Civic Parkway (Roundabout Throat)',
    p1: [6.0, 24.0],
    p2: [12.0, 24.0],
    width: 4.4,
    speedLimit: 45,
    zone: 'citadel',
  },
  {
    id: 'seg-parkway-east-mid',
    name: 'East Civic Parkway (Residential Link)',
    p1: [12.0, 24.0],
    p2: [14.0, 24.0],
    width: 4.4,
    speedLimit: 50,
    zone: 'residential',
  },
  {
    id: 'seg-parkway-east-outer',
    name: 'East Civic Parkway (Industrial Section)',
    p1: [14.0, 24.0],
    p2: [25.0, 24.0],
    width: 4.4,
    speedLimit: 50,
    zone: 'industrial',
  },

  // 5. West Regional Science Highway & Bridge
  {
    id: 'seg-west-north-portal',
    name: 'Aethel Ridge Mountain Pass (North)',
    p1: [-25.0, -44.0],
    p2: [-25.0, -22.0],
    width: 4.2,
    speedLimit: 65,
    zone: 'education',
  },
  {
    id: 'seg-west-north-approach',
    name: 'Aethel Ridge Bridge Approach',
    p1: [-25.0, -22.0],
    p2: [-25.0, -23.7],
    width: 4.2,
    speedLimit: 60,
    zone: 'education',
  },
  {
    id: 'seg-bridge-west',
    name: 'West Aethel Ridge Suspension Bridge',
    p1: [-25.0, -23.7],
    p2: [-25.0, -8.7],
    width: 4.5,
    speedLimit: 60,
    zone: 'education',
    isBridge: true,
  },
  {
    id: 'seg-west-south-upper',
    name: 'Aethel Ridge Scenic River Bluff Avenue',
    p1: [-25.0, -8.7],
    p2: [-25.0, -2.0],
    width: 4.2,
    speedLimit: 55,
    zone: 'education',
  },
  {
    id: 'seg-west-south-lower',
    name: 'Aethel Ridge Science Corridor',
    p1: [-25.0, -2.0],
    p2: [-25.0, 24.0],
    width: 4.2,
    speedLimit: 55,
    zone: 'education',
  },

  // 6. North Transverse Connector
  {
    id: 'seg-conn-north-west',
    name: 'Aethel Academic Transverse Link',
    p1: [-25.0, -22.0],
    p2: [0, -22.0],
    width: 3.8,
    speedLimit: 45,
    zone: 'education',
  },

  // 7. Local Access Roads & Engineered Cul-de-Sacs
  {
    id: 'seg-spur-science',
    name: 'Quantum Telemetry Observatory Spur',
    p1: [-25.0, -2.0],
    p2: [-34.0, -2.0],
    width: 3.8,
    speedLimit: 40,
    zone: 'education',
  },
  {
    id: 'seg-spur-agri',
    name: 'Verdant Vale Agrisector Farm Spur',
    p1: [-25.0, 24.0],
    p2: [-25.0, 38.0],
    width: 4.0,
    speedLimit: 40,
    zone: 'agriculture',
  },
  {
    id: 'seg-spur-freight',
    name: 'Vulcan Heavy Foundry Freight Spur',
    p1: [25.0, 24.0],
    p2: [36.0, 24.0],
    width: 4.2,
    speedLimit: 40,
    zone: 'industrial',
  },
  {
    id: 'seg-spur-residential',
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
  [0, 24.0, 6.2],       // Grand Civic Roundabout Central Hub
  [0, -22.0, 3.2],      // North Grand Boulevard Connector
  [0, 4.5, 3.2],        // Civic Forum North Esplanade Portal
  [-12.0, 4.5, 2.6],    // West Esplanade Corner Bend
  [12.0, 4.5, 2.6],     // East Esplanade Corner Bend
  [-12.0, 24.0, 2.8],   // West Civic Flank Junction
  [12.0, 24.0, 2.8],    // East Civic Flank Junction
  [-25.0, -22.0, 2.6],  // Northwest Science T-Junction
  [-25.0, -2.0, 2.6],   // Science Observatory Branch Junction
  [-25.0, 24.0, 2.8],   // West Crossroads
  [25.0, 24.0, 2.8],    // East Crossroads
  [14.0, 24.0, 2.4],    // Oasis Residential Branch Junction
  [-34.0, -2.0, 4.4],   // Science Observatory Cul-de-Sac
  [-25.0, 38.0, 4.6],   // Agrisector Farm Cul-de-Sac
  [36.0, 24.0, 5.0],    // Vulcan Freight Cul-de-Sac
  [14.0, 38.0, 4.6],    // Oasis Terraces Residential Cul-de-Sac
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

