import { getTerrainHeight, isNearRiver, isNearLake } from './Terrain';
import { PlacedBuilding, BuildingCatalogItem, ResourceState } from '../../types/game';

export interface RoadSegmentBounds {
  p1: [number, number];
  p2: [number, number];
  width: number;
}

// Complete road network corridors matching RoadNetwork.tsx
export const ROAD_CORRIDORS: RoadSegmentBounds[] = [
  // North-South Grand Arterial North
  { p1: [0, -44], p2: [0, -10.5], width: 5.4 },
  // Central Arch Bridge
  { p1: [0, -10.5], p2: [0, 4.5], width: 5.6 },
  // South Bridge Approach to Dais
  { p1: [0, 4.5], p2: [0, 11.8], width: 5.4 },
  // Citadel Ring to South Crossroads
  { p1: [0, 17.4], p2: [0, 21.2], width: 5.4 },
  // South Crossroads to Terminal
  { p1: [0, 26.8], p2: [0, 44], width: 5.4 },
  // East-West Grand Arterial West
  { p1: [-44, 0], p2: [-14.6, 0], width: 5.2 },
  // East-West Grand Arterial East
  { p1: [14.6, 0], p2: [44, 0], width: 5.2 },
  // North District Loop Avenue
  { p1: [-40, -22], p2: [40, -22], width: 3.8 },
  // South District Loop Avenue
  { p1: [-38, 24], p2: [38, 24], width: 3.8 },
  // West Longitudinal Avenue
  { p1: [-25, -38], p2: [-25, 38], width: 3.8 },
  // East Longitudinal Avenue
  { p1: [25, -38], p2: [25, 38], width: 3.8 },
  // West Suspension Bridge
  { p1: [-25, -23.7], p2: [-25, -8.7], width: 4.5 },
  // East Truss Bridge
  { p1: [25, 0.25], p2: [25, 15.75], width: 4.5 },
];

export const JUNCTION_PLAZAS: [number, number, number][] = [
  [0, 24, 3.8],
  [-25, 0, 3.8],
  [25, 0, 3.8],
  [-25, 24, 3.8],
  [25, 24, 3.8],
  [0, -22, 3.8],
  [25, -22, 3.8],
];

// Calculate distance from point (px, pz) to line segment (ax, az)-(bx, bz)
function distToSegment(
  px: number,
  pz: number,
  ax: number,
  az: number,
  bx: number,
  bz: number
): number {
  const dx = bx - ax;
  const dz = bz - az;
  const lenSq = dx * dx + dz * dz;

  if (lenSq === 0) return Math.hypot(px - ax, pz - az);

  let t = ((px - ax) * dx + (pz - az) * dz) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = ax + t * dx;
  const projZ = az + t * dz;
  return Math.hypot(px - projX, pz - projZ);
}

// Distance to road network
export function getDistToRoadNetwork(x: number, z: number): {
  minDist: number;
  overlaps: boolean;
  clearanceRequired: number;
} {
  const buildingRadius = 2.1;
  let minDist = Infinity;
  let overlaps = false;

  // 1. Check Citadel Boulevard Ring (center 0,0, radius 14.5, width 3.8)
  const distFromCenter = Math.hypot(x, z);
  const ringDist = Math.abs(distFromCenter - 14.5);
  const ringRequired = 1.9 + buildingRadius;
  if (ringDist < ringRequired) {
    overlaps = true;
  }
  minDist = Math.min(minDist, ringDist);

  // 2. Check all road linear corridors
  for (const road of ROAD_CORRIDORS) {
    const d = distToSegment(x, z, road.p1[0], road.p1[1], road.p2[0], road.p2[1]);
    const req = road.width * 0.5 + buildingRadius;
    if (d < req) {
      overlaps = true;
    }
    minDist = Math.min(minDist, d);
  }

  // 3. Check junction plazas
  for (const [jx, jz, jRadius] of JUNCTION_PLAZAS) {
    const d = Math.hypot(x - jx, z - jz);
    const req = jRadius + buildingRadius;
    if (d < req) {
      overlaps = true;
    }
    minDist = Math.min(minDist, d);
  }

  return { minDist, overlaps, clearanceRequired: buildingRadius };
}

export interface ValidationResult {
  isValid: boolean;
  reason: string;
  distToRoad: number;
  slope: number;
  terrainElevation: number;
  isFarFromRoad: boolean;
}

export function validateBuildingPlacement({
  x,
  z,
  catalogItem,
  placedBuildings,
  resources,
  relocatingBuildingId = null,
}: {
  x: number;
  z: number;
  catalogItem: BuildingCatalogItem;
  placedBuildings: PlacedBuilding[];
  resources: ResourceState;
  relocatingBuildingId?: string | null;
}): ValidationResult {
  const terrainY = getTerrainHeight(x, z);

  // 1. Check World Buildable Perimeter
  const distFromOrigin = Math.hypot(x, z);
  if (distFromOrigin > 51.5 || Math.abs(x) > 48 || Math.abs(z) > 48) {
    return {
      isValid: false,
      reason: 'Beyond surveyed civilization perimeter',
      distToRoad: 99,
      slope: 0,
      terrainElevation: terrainY,
      isFarFromRoad: false,
    };
  }

  // 2. Check Water Channel (River & Lakes)
  if (isNearRiver(x, z, 2.2)) {
    return {
      isValid: false,
      reason: 'Cannot construct on active riverbed water channel',
      distToRoad: 0,
      slope: 0,
      terrainElevation: terrainY,
      isFarFromRoad: false,
    };
  }

  if (isNearLake(x, z, 2.6)) {
    return {
      isValid: false,
      reason: 'Cannot construct inside alpine reservoir lake',
      distToRoad: 0,
      slope: 0,
      terrainElevation: terrainY,
      isFarFromRoad: false,
    };
  }

  // Highland tarn pond at [-26, -34]
  if (Math.hypot(x - (-26), z - (-34)) < 6.2) {
    return {
      isValid: false,
      reason: 'Cannot construct in highland scenic tarn pool',
      distToRoad: 0,
      slope: 0,
      terrainElevation: terrainY,
      isFarFromRoad: false,
    };
  }

  // 3. Check Road Overlap
  const roadCheck = getDistToRoadNetwork(x, z);
  if (roadCheck.overlaps) {
    return {
      isValid: false,
      reason: 'Overlaps active roadway transit corridor',
      distToRoad: roadCheck.minDist,
      slope: 0,
      terrainElevation: terrainY,
      isFarFromRoad: false,
    };
  }

  // 4. Check Terrain Elevation & Slope Stability
  const offset = 2.1;
  const hN = getTerrainHeight(x, z - offset);
  const hS = getTerrainHeight(x, z + offset);
  const hW = getTerrainHeight(x - offset, z);
  const hE = getTerrainHeight(x + offset, z);
  const minH = Math.min(terrainY, hN, hS, hW, hE);
  const maxH = Math.max(terrainY, hN, hS, hW, hE);
  const slopeDelta = maxH - minH;

  if (slopeDelta > 1.35) {
    return {
      isValid: false,
      reason: `Terrain slope too steep for structural foundation (Δ ${slopeDelta.toFixed(1)}m)`,
      distToRoad: roadCheck.minDist,
      slope: slopeDelta,
      terrainElevation: terrainY,
      isFarFromRoad: false,
    };
  }

  if (terrainY > 8.5) {
    return {
      isValid: false,
      reason: 'Alpine mountain peak is unsuitable for civic construction',
      distToRoad: roadCheck.minDist,
      slope: slopeDelta,
      terrainElevation: terrainY,
      isFarFromRoad: false,
    };
  }

  // 5. Check Overlap with Existing Placed Buildings
  const minBuildingSpacing = 4.3;
  for (const b of placedBuildings) {
    if (relocatingBuildingId && b.id === relocatingBuildingId) {
      continue; // Skip self when relocating
    }
    const d = Math.hypot(x - b.x, z - b.z);
    if (d < minBuildingSpacing) {
      return {
        isValid: false,
        reason: `Overlaps clearance zone of ${b.name}`,
        distToRoad: roadCheck.minDist,
        slope: slopeDelta,
        terrainElevation: terrainY,
        isFarFromRoad: false,
      };
    }
  }

  // 6. Check Materials Cost (waived if simply relocating an existing structure)
  if (!relocatingBuildingId && resources.materials < catalogItem.costMaterials) {
    return {
      isValid: false,
      reason: `Insufficient structural materials (Requires ${catalogItem.costMaterials} Mat.)`,
      distToRoad: roadCheck.minDist,
      slope: slopeDelta,
      terrainElevation: terrainY,
      isFarFromRoad: false,
    };
  }

  // 7. Road Access Warning
  const isFarFromRoad = roadCheck.minDist > 26.0;

  return {
    isValid: true,
    reason: isFarFromRoad
      ? 'Valid site (Notice: Far from primary transit corridor)'
      : 'Optimal structural placement zone',
    distToRoad: roadCheck.minDist,
    slope: slopeDelta,
    terrainElevation: terrainY,
    isFarFromRoad,
  };
}

