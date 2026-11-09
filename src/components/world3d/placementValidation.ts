import { getTerrainHeight, isNearRiver, isNearLake } from './Terrain';
import { PlacedBuilding, BuildingCatalogItem, ResourceState } from '../../types/game';
import {
  CITY_ROAD_CORRIDORS,
  JUNCTION_CLEARANCE_PLAZAS,
  getDistToRoadNetwork,
  calculateRoadsideAlignment,
  RoadsideAlignment,
} from './cityPlanning';

export interface ValidationResult {
  isValid: boolean;
  reason: string;
  distToRoad: number;
  slope: number;
  terrainElevation: number;
  isFarFromRoad: boolean;
  zoneName?: string;
  recommendedRotation?: number;
}

// Unlocked sovereign territory radius based on Citadel / Village Center level
export function getCitadelTerritoryRadius(citadelLevel: number): number {
  switch (Math.max(1, Math.min(5, Math.round(citadelLevel)))) {
    case 1:
      return 28.0; // Pioneer Outpost settlement: ~2,460 m²
    case 2:
      return 46.0; // Frontier Township / Forum: ~6,650 m² (+170% area expansion)
    case 3:
      return 68.0; // Sovereign Citadel / River crossings: ~14,500 m² (+118% area expansion)
    case 4:
      return 95.0; // Imperial Metropolis: ~28,350 m² (+95% area expansion)
    case 5:
      return 135.0; // Sovereign Imperial Capital: ~57,250 m² (+102% area expansion)
    default:
      return 28.0;
  }
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
  const footprintRadius = 2.2;

  // 1. Check Sovereign Territory Unlocked by Citadel / Village Center Level
  const citadel = placedBuildings.find(
    (b) => b.modelType === 'citadel' || b.catalogId === 'bld-gov-citadel'
  );
  const citadelLevel = citadel?.level || 1;
  const citadelX = citadel?.x ?? 0;
  const citadelZ = citadel?.z ?? 11;
  const maxTerritoryRadius = getCitadelTerritoryRadius(citadelLevel);

  const distFromCitadel = Math.hypot(x - citadelX, z - citadelZ);
  if (distFromCitadel > maxTerritoryRadius) {
    return {
      isValid: false,
      reason: `Beyond Citadel sovereign territory (${distFromCitadel.toFixed(0)}m / limit ${maxTerritoryRadius}m). Upgrade Citadel to expand territory!`,
      distToRoad: 99,
      slope: 0,
      terrainElevation: terrainY,
      isFarFromRoad: true,
    };
  }

  // 2. Check Water Channel & Wetlands (River & Lakes)
  if (isNearRiver(x, z, 2.4)) {
    return {
      isValid: false,
      reason: 'Cannot construct on active riverbed water channel',
      distToRoad: 0,
      slope: 0,
      terrainElevation: terrainY,
      isFarFromRoad: false,
    };
  }

  if (isNearLake(x, z, 2.8)) {
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
  if (Math.hypot(x - (-26), z - (-34)) < 6.4) {
    return {
      isValid: false,
      reason: 'Cannot construct in highland scenic tarn pool',
      distToRoad: 0,
      slope: 0,
      terrainElevation: terrainY,
      isFarFromRoad: false,
    };
  }

  // 3. Check Road Overlap & Highway Corridors
  const roadCheck = getDistToRoadNetwork(x, z, footprintRadius);
  if (roadCheck.overlaps) {
    return {
      isValid: false,
      reason: 'Footprint obstructs active roadway or pedestrian sidewalk',
      distToRoad: roadCheck.minDist,
      slope: 0,
      terrainElevation: terrainY,
      isFarFromRoad: false,
    };
  }

  // 4. Check Road Access Requirement (Buildings must be positioned alongside roads)
  // Citadel high council building is permitted on central dais at [0, 13]; other buildings must be roadside
  const isCitadelCenter = catalogItem.modelType === 'citadel' && Math.hypot(x, z - 13) < 11.0;
  if (!isCitadelCenter && roadCheck.minDist > 12.5) {
    return {
      isValid: false,
      reason: 'Building must be positioned alongside an accessible road',
      distToRoad: roadCheck.minDist,
      slope: 0,
      terrainElevation: terrainY,
      isFarFromRoad: true,
    };
  }

  // 5. Check Bridges (No buildings on bridge spans)
  if (roadCheck.closestRoad?.isBridge) {
    const bridgeDist = roadCheck.minDist;
    if (bridgeDist < 5.8) {
      return {
        isValid: false,
        reason: 'Cannot place buildings on or directly under bridge spans',
        distToRoad: roadCheck.minDist,
        slope: 0,
        terrainElevation: terrainY,
        isFarFromRoad: false,
      };
    }
  }

  // 6. Check Terrain Elevation & Slope Stability
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

  // 7. Check Overlap with Existing Placed Buildings
  const minBuildingSpacing = 4.4;
  for (const b of placedBuildings) {
    if (relocatingBuildingId && b.id === relocatingBuildingId) {
      continue; // Skip self when relocating
    }
    const d = Math.hypot(x - b.x, z - b.z);
    if (d < minBuildingSpacing) {
      return {
        isValid: false,
        reason: `Overlaps clearance envelope of ${b.name}`,
        distToRoad: roadCheck.minDist,
        slope: slopeDelta,
        terrainElevation: terrainY,
        isFarFromRoad: false,
      };
    }
  }

  // 8. Check Materials Cost (waived if relocating an existing structure)
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

  // 9. Zone Telemetry & Road Alignment Information
  const alignment = calculateRoadsideAlignment(x, z, catalogItem.category, footprintRadius);

  const zoneNames: Record<string, string> = {
    residential: 'Residential Quarter',
    commercial: 'Commercial District',
    industrial: 'Industrial Zone',
    healthcare: 'Healthcare & Wellness Sector',
    education: 'Science & Education Hub',
    agriculture: 'Verdant Agrisector',
    infrastructure: 'Utility & Infrastructure Corridor',
    citadel: 'Central Civic Dais',
  };

  const zoneDisplay = zoneNames[alignment.zone] || 'Civilization Sector';

  return {
    isValid: true,
    reason: alignment.isZoneMatching
      ? `Optimal roadside site in ${zoneDisplay}`
      : `Valid site in ${zoneDisplay} (Notice: Cross-zone construction)`,
    distToRoad: roadCheck.minDist,
    slope: slopeDelta,
    terrainElevation: terrainY,
    isFarFromRoad: false,
    zoneName: zoneDisplay,
    recommendedRotation: alignment.facingRotation,
  };
}
