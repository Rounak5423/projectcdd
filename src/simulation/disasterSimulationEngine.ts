/**
 * GENESIS — Natural Disaster & Intelligent Emergency Response Simulation Engine
 *
 * Deterministic engine managing:
 * 1. Simulation-driven Disaster Risk Assessment (Floods, Wildfires, Droughts, Storms, Earthquakes)
 * 2. Emergency Response Forces & Capacity Accounting (Medical, Fire, Rescue, Engineering, Shelters)
 * 3. Lifecycle & Damage Mechanics (Warning -> Active -> Containing -> Recovering -> Resolved)
 * 4. Citizen Evacuation & Shelter Logistics
 * 5. Structural Damage & Economic Reconstruction Costs
 */

import { PlacedBuilding, ResourceState, District } from '../types/game';
import { CitySimulationReport } from './economySimulationEngine';
import {
  DisasterType,
  DisasterIntensity,
  ActiveDisaster,
  DisasterRiskAssessment,
  EmergencyResponseForces,
  DisasterSimulationState,
} from '../types/disaster';

// District Epicenter Coordinates
const DISTRICT_CENTERS: Record<string, [number, number]> = {
  'dist-citadel': [0, 13],
  'dist-science': [-28, -20],
  'dist-industrial': [32, -16],
  'dist-agriculture': [-24, 28],
  'dist-residential': [20, 26],
};

const INTENSITY_CONFIG: Record<
  DisasterIntensity,
  { radius: number; durationDays: number; damagePerDay: number; casualtyRate: number }
> = {
  low: { radius: 14, durationDays: 3, damagePerDay: 4, casualtyRate: 0.001 },
  medium: { radius: 20, durationDays: 6, damagePerDay: 8, casualtyRate: 0.003 },
  high: { radius: 28, durationDays: 9, damagePerDay: 14, casualtyRate: 0.008 },
  critical: { radius: 36, durationDays: 14, damagePerDay: 22, casualtyRate: 0.018 },
};

/**
 * Evaluates real-time environmental and simulation variables to determine risk probabilities
 */
export function calculateDisasterRisks(
  weather: 'clear' | 'cloudy' | 'rain' | 'fog',
  timeOfDay: number,
  resources: ResourceState,
  economyReport: CitySimulationReport,
  placedBuildings: PlacedBuilding[]
): DisasterRiskAssessment {
  // 1. Flood Risk: Rainfall weather, high municipal water levels, riverbank proximity
  let floodRisk = 12; // baseline fluvial risk
  if (weather === 'rain') floodRisk += 45;
  if (weather === 'cloudy') floodRisk += 15;
  if (economyReport.resources.waterNet > 80) floodRisk += 14; // swollen aquifer
  floodRisk = Math.min(95, Math.max(5, floodRisk));

  // 2. Wildfire Risk: Clear dry weather, high midday temperatures, industrial heat
  let fireRisk = 10;
  if (weather === 'clear') fireRisk += 25;
  if (timeOfDay >= 11 && timeOfDay <= 16) fireRisk += 20; // peak diurnal heat
  if (economyReport.resources.waterNet < 0) fireRisk += 22; // dry terrain deficit
  fireRisk = Math.min(92, Math.max(5, fireRisk));

  // 3. Drought Risk: Water shortages, low reserves, high urban consumption
  let droughtRisk = 8;
  if (economyReport.resources.waterNet < 0) droughtRisk += 42;
  if (resources.water < 200) droughtRisk += 30;
  if (weather === 'clear') droughtRisk += 12;
  droughtRisk = Math.min(95, Math.max(5, droughtRisk));

  // 4. Storm Risk: Atmospheric disturbance, overcast weather
  let stormRisk = 15;
  if (weather === 'rain') stormRisk += 50;
  if (weather === 'cloudy') stormRisk += 25;
  if (weather === 'fog') stormRisk += 15;
  stormRisk = Math.min(96, Math.max(5, stormRisk));

  // 5. Seismic Risk: Heavy tectonic load from high-density arcologies & geothermal arrays
  const totalWeight = placedBuildings.reduce((sum, b) => sum + (b.level || 1), 0);
  let seismicRisk = Math.min(85, Math.max(8, 12 + Math.round(totalWeight * 0.8)));

  const maxRisk = Math.max(floodRisk, fireRisk, droughtRisk, stormRisk, seismicRisk);
  const overallThreatLevel: DisasterRiskAssessment['overallThreatLevel'] =
    maxRisk > 80 ? 'Severe' : maxRisk > 60 ? 'High' : maxRisk > 40 ? 'Elevated' : maxRisk > 25 ? 'Guarded' : 'Low';

  return {
    floodRiskPercent: floodRisk,
    wildfireRiskPercent: fireRisk,
    droughtRiskPercent: droughtRisk,
    stormRiskPercent: stormRisk,
    seismicRiskPercent: seismicRisk,
    overallThreatLevel,
  };
}

/**
 * Calculates available municipal emergency response forces based on active facilities
 */
export function calculateEmergencyForces(
  placedBuildings: PlacedBuilding[],
  resources: ResourceState
): EmergencyResponseForces {
  let clinics = 0;
  let clinicTotalLvl = 0;
  let arcologies = 0;
  let citadels = 0;
  let foundries = 0;

  placedBuildings.forEach((b) => {
    if (b.status === 'active' || b.status === 'upgrading') {
      const cat = b.category;
      const cid = b.catalogId.toLowerCase();
      if (cat === 'healthcare' || cid.includes('clinic') || cid.includes('hospital')) {
        clinics++;
        clinicTotalLvl += b.level || 1;
      }
      if (cid.includes('arcology') || cid.includes('spire')) {
        arcologies++;
      }
      if (cid.includes('citadel')) {
        citadels++;
      }
      if (cat === 'industrial') {
        foundries++;
      }
    }
  });

  const medTotal = Math.max(2, clinics * 2 + clinicTotalLvl);
  const fireTotal = Math.max(2, Math.round(foundries * 1.5 + 2));
  const rescueTotal = Math.max(2, citadels * 4 + 2);
  const repairTotal = Math.max(3, foundries * 2 + 3);
  const shelterCap = arcologies * 45000 + citadels * 60000 + 35000;

  const stabilityFactor = (resources.stability || 80) / 100;
  const healthFactor = (resources.health || 80) / 100;
  const efficiency = Math.round(((stabilityFactor + healthFactor) / 2) * 100);

  return {
    medicalUnitsActive: 0,
    medicalUnitsTotal: medTotal,
    fireCrewsActive: 0,
    fireCrewsTotal: fireTotal,
    rescueTeamsActive: 0,
    rescueTeamsTotal: rescueTotal,
    repairEngineersActive: 0,
    repairEngineersTotal: repairTotal,
    shelterCapacityTotal: shelterCap,
    responseEfficiencyPercent: efficiency,
  };
}

/**
 * Factory creating an active disaster event
 */
export function createDisaster(
  type: DisasterType,
  intensity: DisasterIntensity,
  districtId: string = 'dist-residential',
  customEpicenter?: [number, number]
): ActiveDisaster {
  const config = INTENSITY_CONFIG[intensity];
  const epicenter = customEpicenter || DISTRICT_CENTERS[districtId] || [0, 10];

  const names: Record<DisasterType, string> = {
    flood: 'Fluvial River Basin Inundation',
    wildfire: 'Wildfire Thermal Conflagration',
    drought: 'Sub-Surface Aquifer Depletion Drought',
    storm: 'Supercell Microburst Gale Storm',
    earthquake: 'Tectonic Fracture Rift Tremor',
  };

  return {
    id: `dis-${Date.now()}-${type}`,
    type,
    name: `${intensity.toUpperCase()} ${names[type]}`,
    intensity,
    stage: 'active',
    epicenter,
    radius: config.radius,
    districtId,
    progressPercent: 0,
    containmentPercent: 0,
    durationDays: config.durationDays,
    elapsedDays: 0,
    affectedBuildingIds: [],
    displacedPopulation: 0,
    shelteredPopulation: 0,
    casualtiesCount: 0,
    economicDamageCredits: 0,
    estimatedRepairCost: 0,
  };
}

/**
 * Advances the active disaster and intelligent emergency containment lifecycle
 */
export function advanceDisasterSimulation(
  disaster: ActiveDisaster,
  placedBuildings: PlacedBuilding[],
  forces: EmergencyResponseForces,
  deltaDays: number = 0.5
): {
  updatedDisaster: ActiveDisaster | null;
  updatedBuildings: PlacedBuilding[];
  economicDamageDelta: number;
} {
  const config = INTENSITY_CONFIG[disaster.intensity];
  const newElapsed = disaster.elapsedDays + deltaDays;
  const progress = Math.min(100, (newElapsed / disaster.durationDays) * 100);

  // 1. Identify buildings within disaster radius
  const [epicX, epicZ] = disaster.epicenter;
  const affectedBuildings: PlacedBuilding[] = [];
  const buildingIdSet = new Set<string>();

  const updatedBuildings = placedBuildings.map((b) => {
    const distToEpicenter = Math.hypot(b.x - epicX, b.z - epicZ);
    if (distToEpicenter <= disaster.radius) {
      buildingIdSet.add(b.id);
      affectedBuildings.push(b);

      // Apply damage during active phase
      if (disaster.stage === 'active' || disaster.stage === 'containing') {
        const dmg = Math.round(config.damagePerDay * deltaDays * (1 - distToEpicenter / (disaster.radius * 1.5)));
        const newHealth = Math.max(15, b.health - dmg);
        const newEff = newHealth < 40 ? Math.max(20, b.efficiency - 15) : b.efficiency;

        return {
          ...b,
          health: newHealth,
          efficiency: newEff,
          status: newHealth < 25 ? ('offline' as const) : b.status,
        };
      } else if (disaster.stage === 'recovering') {
        // Recovery stage: repair teams restore health
        const rep = Math.round(18 * deltaDays);
        const newHealth = Math.min(100, b.health + rep);
        return {
          ...b,
          health: newHealth,
          efficiency: Math.min(100, b.efficiency + 10),
          status: newHealth > 50 && b.status === 'offline' ? ('active' as const) : b.status,
        };
      }
    }
    return b;
  });

  // 2. Intelligent Containment Progress
  // Emergency forces combat the disaster
  const containmentRate =
    (forces.responseEfficiencyPercent / 100) *
    (forces.fireCrewsTotal + forces.repairEngineersTotal + forces.medicalUnitsTotal) *
    (1 / (disaster.intensity === 'critical' ? 2.5 : disaster.intensity === 'high' ? 1.8 : 1.2)) *
    deltaDays *
    3.5;

  let newContainment = Math.min(100, disaster.containmentPercent + containmentRate);
  let newStage = disaster.stage;

  if (newContainment >= 100) {
    if (disaster.stage === 'active' || disaster.stage === 'containing') {
      newStage = 'recovering';
    } else if (disaster.stage === 'recovering') {
      // Check if buildings are recovered
      const allRecovered = updatedBuildings
        .filter((b) => buildingIdSet.has(b.id))
        .every((b) => b.health >= 90);
      if (allRecovered || newElapsed >= disaster.durationDays * 1.6) {
        newStage = 'resolved';
      }
    }
  } else if (newContainment > 15 && disaster.stage === 'active') {
    newStage = 'containing';
  }

  // 3. Citizen Impact & Economic Loss
  const displacedEst = Math.round(buildingIdSet.size * 12500 * (disaster.intensity === 'critical' ? 1.5 : 1.0));
  const shelteredEst = Math.min(forces.shelterCapacityTotal, displacedEst);
  const economicLossPerDay = Math.round(buildingIdSet.size * 65 * (disaster.intensity === 'critical' ? 2.2 : 1.2));
  const repairEst = Math.round(buildingIdSet.size * 320 * (disaster.intensity === 'critical' ? 2.0 : 1.0));

  if (newStage === 'resolved') {
    return {
      updatedDisaster: null,
      updatedBuildings,
      economicDamageDelta: economicLossPerDay * deltaDays,
    };
  }

  const updatedDisaster: ActiveDisaster = {
    ...disaster,
    stage: newStage,
    elapsedDays: newElapsed,
    progressPercent: Math.round(progress),
    containmentPercent: Math.round(newContainment),
    affectedBuildingIds: Array.from(buildingIdSet),
    displacedPopulation: displacedEst,
    shelteredPopulation: shelteredEst,
    economicDamageCredits: Math.round(disaster.economicDamageCredits + economicLossPerDay * deltaDays),
    estimatedRepairCost: repairEst,
  };

  return {
    updatedDisaster,
    updatedBuildings,
    economicDamageDelta: economicLossPerDay * deltaDays,
  };
}

/**
 * Emergency Full Reconstruction Command
 * Safely restores all buildings to 100% integrity and clears active disasters
 */
export function emergencyFullCivilizationRestoration(placedBuildings: PlacedBuilding[]): PlacedBuilding[] {
  return placedBuildings.map((b) => ({
    ...b,
    health: 100,
    efficiency: Math.max(90, b.efficiency),
    status: b.status === 'offline' ? 'active' : b.status,
  }));
}

