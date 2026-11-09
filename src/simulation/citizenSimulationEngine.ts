/**
 * GENESIS — Intelligent Citizen, Happiness & Social Behaviour Simulation Engine
 *
 * Deterministic engine managing:
 * 1. 11 Core Citizen Needs Calculation (Housing, Food, Water, Power, Health, Education, Employment, Transit, Safety, Parks, Ecology)
 * 2. Quality of Life (QoL) & Overall Happiness Composite Index
 * 3. Diurnal Activity & Dynamic Daily Routine Scheduling (Home -> Commute -> Work -> Leisure -> Home)
 * 4. District-Based Social Metrics & Resident Satisfaction
 * 5. Actionable Citizen Grievance & Policy Alert Detection
 */

import { PlacedBuilding, ResourceState, District } from '../types/game';
import { CitySimulationReport } from './economySimulationEngine';
import { DisasterSimulationState } from '../types/disaster';
import {
  CitizenNeedItem,
  CitizenNeedsBreakdown,
  DetailedCitizenAgent,
  DistrictSocialMetric,
  CitizenProblemAlert,
  CitizenSimulationReport,
  DailyActivity,
} from '../types/citizen';
import {
  getCivilizationEra,
  ERA_PROFILES,
  evaluateTrainedActivitySequence,
  evaluateTrainedModeChoice,
  updateHumanMetabolicDrives,
  generateCitizenThought,
  DetailedHumanCitizen,
} from './humanEvolutionLogic';

// Helper to clamp values between min and max
function clamp(val: number, min: number = 0, max: number = 100): number {
  return Math.min(max, Math.max(min, Math.round(val)));
}

/**
 * 1. Computes the 11 Core Citizen Needs deterministically from actual simulation state
 */
export function calculateCitizenNeeds(
  resources: ResourceState,
  placedBuildings: PlacedBuilding[],
  economyReport: CitySimulationReport,
  disasterState: DisasterSimulationState,
  trafficFlowEfficiency: number = 85
): CitizenNeedsBreakdown {
  const pop = Math.max(1000, resources.population);
  const activeDisaster = disasterState?.activeDisaster;

  // A. HOUSING
  const totalHousingCapacity = placedBuildings.reduce((sum, b) => {
    if (b.status === 'active' || b.status === 'upgrading') {
      const cid = b.catalogId.toLowerCase();
      if (cid.includes('arcology') || cid.includes('spire')) return sum + 180000 * b.level;
      if (cid.includes('habitat') || cid.includes('villa')) return sum + 25000 * b.level;
      if (cid.includes('citadel')) return sum + 60000;
    }
    return sum;
  }, 400000); // Baseline colony housing

  const housingRatio = totalHousingCapacity / pop;
  const housingScore = clamp(housingRatio * 100);
  const housing: CitizenNeedItem = {
    id: 'housing',
    name: 'Habitation & Shelter',
    category: 'vital',
    satisfactionPercent: housingScore,
    status: housingScore >= 95 ? 'optimal' : housingScore >= 80 ? 'adequate' : housingScore >= 60 ? 'deficient' : 'critical',
    positiveDrivers: housingScore >= 80 ? ['Arcology spires provide high-density vertical living', 'Adequate residential capacity'] : [],
    negativeDrivers: housingScore < 80 ? [`Housing deficit of ${Math.round(Math.max(0, pop - totalHousingCapacity)).toLocaleString()} citizens`, 'Overcrowded habitats'] : [],
    weight: 0.12,
  };

  // B. FOOD
  const foodNet = economyReport.resources.foodNet;
  const foodStorageDays = resources.food / Math.max(1, economyReport.resources.foodConsumed);
  let foodScore = foodNet >= 0 ? 92 : 80 + Math.round(foodNet / 10);
  if (foodStorageDays > 15) foodScore += 6;
  if (resources.food < 100) foodScore -= 30;
  foodScore = clamp(foodScore);
  const food: CitizenNeedItem = {
    id: 'food',
    name: 'Food & Nutrition',
    category: 'vital',
    satisfactionPercent: foodScore,
    status: foodScore >= 90 ? 'optimal' : foodScore >= 75 ? 'adequate' : foodScore >= 50 ? 'deficient' : 'critical',
    positiveDrivers: foodNet >= 0 ? ['Bio-Dome agricultural basin produces surplus rations', 'Stable nutritional reserve stock'] : [],
    negativeDrivers: foodNet < 0 ? ['Agricultural output falling behind urban consumption', 'Ration reserves depleting'] : [],
    weight: 0.12,
  };

  // C. CLEAN WATER
  const waterNet = economyReport.resources.waterNet;
  let waterScore = waterNet >= 0 ? 94 : 78 + Math.round(waterNet / 8);
  if (resources.water < 150) waterScore -= 35;
  if (activeDisaster?.type === 'drought') waterScore -= 28;
  waterScore = clamp(waterScore);
  const water: CitizenNeedItem = {
    id: 'water',
    name: 'Clean Water & Hydration',
    category: 'vital',
    satisfactionPercent: waterScore,
    status: waterScore >= 90 ? 'optimal' : waterScore >= 75 ? 'adequate' : waterScore >= 50 ? 'deficient' : 'critical',
    positiveDrivers: waterNet >= 0 ? ['Fluvial river filtration & subterranean aquifers secure', 'Municipal water surplus'] : [],
    negativeDrivers: waterNet < 0 ? ['Aquifer drawdown exceeding replenishment rate', 'Low water reserves'] : [],
    weight: 0.12,
  };

  // D. ELECTRICITY (POWER)
  const powerStress = economyReport.resources.energyGridStressPercent;
  let energyScore = 100;
  if (powerStress > 100) {
    energyScore -= Math.round((powerStress - 100) * 2.8);
  } else if (powerStress > 85) {
    energyScore -= 8;
  }
  energyScore = clamp(energyScore);
  const electricity: CitizenNeedItem = {
    id: 'electricity',
    name: 'Power & Grid Stability',
    category: 'vital',
    satisfactionPercent: energyScore,
    status: energyScore >= 90 ? 'optimal' : energyScore >= 75 ? 'adequate' : energyScore >= 50 ? 'deficient' : 'critical',
    positiveDrivers: powerStress <= 85 ? ['Stable geothermal and fusion power generation', 'Robust energy grid reserves'] : [],
    negativeDrivers: powerStress > 85 ? [`Power grid near capacity (${powerStress.toFixed(0)}% load)`, 'Brownout risk'] : [],
    weight: 0.10,
  };

  // E. HEALTHCARE
  let clinicBedsCapacity = 0;
  placedBuildings.forEach((b) => {
    if (b.status === 'active' || b.status === 'upgrading') {
      const cid = b.catalogId.toLowerCase();
      if (b.category === 'healthcare' || cid.includes('clinic') || cid.includes('hospital')) {
        clinicBedsCapacity += 220000 * (b.level || 1);
      }
    }
  });
  let healthScore = clamp((clinicBedsCapacity / pop) * 100);
  if (activeDisaster) healthScore = Math.max(30, healthScore - 15);
  const healthcare: CitizenNeedItem = {
    id: 'healthcare',
    name: 'Healthcare & Cellular Medicine',
    category: 'social',
    satisfactionPercent: healthScore,
    status: healthScore >= 85 ? 'optimal' : healthScore >= 70 ? 'adequate' : healthScore >= 45 ? 'deficient' : 'critical',
    positiveDrivers: healthScore >= 70 ? ['Oasis Cellular Care Clinic operational', 'Preventive genome treatments online'] : [],
    negativeDrivers: healthScore < 70 ? ['Healthcare bed capacity trailing metropolis census', 'Long medical triage wait times'] : [],
    weight: 0.10,
  };

  // F. EDUCATION
  let academyCapacity = 0;
  placedBuildings.forEach((b) => {
    if (b.status === 'active' || b.status === 'upgrading') {
      const cid = b.catalogId.toLowerCase();
      if (b.category === 'education' || cid.includes('academy') || cid.includes('institute') || cid.includes('observatory')) {
        academyCapacity += 160000 * (b.level || 1);
      }
    }
  });
  const studentsEst = Math.round(pop * 0.18);
  const eduScore = clamp((academyCapacity / Math.max(1, studentsEst)) * 100);
  const education: CitizenNeedItem = {
    id: 'education',
    name: 'Education & Cognitive Training',
    category: 'social',
    satisfactionPercent: eduScore,
    status: eduScore >= 85 ? 'optimal' : eduScore >= 70 ? 'adequate' : eduScore >= 45 ? 'deficient' : 'critical',
    positiveDrivers: eduScore >= 70 ? ['Polytechnic Institute teaching advanced robotics & AI', 'High literacy and research acumen'] : [],
    negativeDrivers: eduScore < 70 ? ['Insufficient classroom portals for youth demographic', 'Limited technical apprenticeships'] : [],
    weight: 0.06,
  };

  // G. EMPLOYMENT
  const empScore = clamp(economyReport.resources.employmentRatePercent);
  const employment: CitizenNeedItem = {
    id: 'employment',
    name: 'Employment & Career Mobility',
    category: 'infrastructure',
    satisfactionPercent: empScore,
    status: empScore >= 90 ? 'optimal' : empScore >= 78 ? 'adequate' : empScore >= 60 ? 'deficient' : 'critical',
    positiveDrivers: empScore >= 80 ? ['High industrial and commercial workforce demand', 'Productive career opportunities'] : [],
    negativeDrivers: empScore < 80 ? [`Unemployment elevated (${economyReport.resources.unemploymentRatePercent}% seeking roles)`, 'Workforce capacity mismatch'] : [],
    weight: 0.10,
  };

  // H. TRANSPORTATION
  let transitScore = clamp(trafficFlowEfficiency);
  const transportation: CitizenNeedItem = {
    id: 'transportation',
    name: 'Transit & Road Mobility',
    category: 'infrastructure',
    satisfactionPercent: transitScore,
    status: transitScore >= 85 ? 'optimal' : transitScore >= 70 ? 'adequate' : transitScore >= 50 ? 'deficient' : 'critical',
    positiveDrivers: transitScore >= 75 ? ['Connected multi-lane arterial road network', 'Free-flowing bridge transit pods'] : [],
    negativeDrivers: transitScore < 75 ? ['Bottlenecks at central bridge intersections', 'Transit delays during peak commute'] : [],
    weight: 0.06,
  };

  // I. SAFETY
  let safetyScore = 92;
  if (activeDisaster) {
    const penalty = activeDisaster.intensity === 'critical' ? 45 : activeDisaster.intensity === 'high' ? 32 : activeDisaster.intensity === 'medium' ? 20 : 12;
    safetyScore -= penalty;
  }
  const maxThreat = disasterState?.risks?.overallThreatLevel;
  if (maxThreat === 'Severe') safetyScore -= 18;
  else if (maxThreat === 'High') safetyScore -= 10;
  safetyScore = clamp(safetyScore);
  const safety: CitizenNeedItem = {
    id: 'safety',
    name: 'Civil Safety & Disaster Defense',
    category: 'social',
    satisfactionPercent: safetyScore,
    status: safetyScore >= 85 ? 'optimal' : safetyScore >= 70 ? 'adequate' : safetyScore >= 45 ? 'deficient' : 'critical',
    positiveDrivers: !activeDisaster ? ['Civil Defense grid fully active', 'Hardened emergency shelters available in Elysium Citadel'] : [],
    negativeDrivers: activeDisaster ? [`Active ${activeDisaster.type} emergency in progress`, 'Citizen evacuation underway'] : [],
    weight: 0.10,
  };

  // J. RECREATION
  let recreationPoints = 30; // Baseline civic promenade
  placedBuildings.forEach((b) => {
    const cid = b.catalogId.toLowerCase();
    if (cid.includes('park') || cid.includes('biosphere') || cid.includes('forum') || cid.includes('observatory')) {
      recreationPoints += 25 * (b.level || 1);
    }
    if (b.category === 'commercial') {
      recreationPoints += 12 * (b.level || 1);
    }
  });
  const recScore = clamp(recreationPoints);
  const recreation: CitizenNeedItem = {
    id: 'recreation',
    name: 'Recreation, Parks & Culture',
    category: 'social',
    satisfactionPercent: recScore,
    status: recScore >= 85 ? 'optimal' : recScore >= 70 ? 'adequate' : recScore >= 45 ? 'deficient' : 'critical',
    positiveDrivers: recScore >= 70 ? ['Scenic Biosphere Park and forum fountains accessible', 'Vibrant leisure spaces'] : [],
    negativeDrivers: recScore < 70 ? ['Limited green spaces and recreational plazas in industrial zones', 'Urban density requires more parks'] : [],
    weight: 0.06,
  };

  // K. CLEAN ENVIRONMENT
  const envScore = clamp(resources.environmentalIndex || 82);
  const environment: CitizenNeedItem = {
    id: 'environment',
    name: 'Environmental Purity & Ecology',
    category: 'environmental',
    satisfactionPercent: envScore,
    status: envScore >= 85 ? 'optimal' : envScore >= 70 ? 'adequate' : envScore >= 50 ? 'deficient' : 'critical',
    positiveDrivers: envScore >= 75 ? ['Verdant River Valley riparian corridor intact', 'Atmospheric scrubbing operational'] : [],
    negativeDrivers: envScore < 75 ? ['Smelter emission particulates from Foundry basin', 'Industrial waste runoff'] : [],
    weight: 0.06,
  };

  return {
    housing,
    food,
    water,
    electricity,
    healthcare,
    education,
    employment,
    transportation,
    safety,
    recreation,
    environment,
  };
}

/**
 * 2. Computes the composite Quality of Life (QoL) and Overall Happiness score
 */
export function calculateQualityOfLife(
  needs: CitizenNeedsBreakdown,
  disasterState: DisasterSimulationState,
  fiscalSurplus: number
): { qualityOfLife: number; overallHappiness: number; mood: CitizenSimulationReport['societalMood'] } {
  const needList = Object.values(needs);
  
  // Weighted QoL composite score
  const qol = needList.reduce((sum, item) => sum + item.satisfactionPercent * item.weight, 0);
  const qualityOfLife = clamp(qol);

  // Dynamic happiness calculation
  let happiness = qualityOfLife;
  if (fiscalSurplus > 200) happiness += 3; // Economic prosperity dividend
  if (disasterState?.activeDisaster) {
    happiness -= disasterState.activeDisaster.intensity === 'critical' ? 22 : 12;
  }
  const overallHappiness = clamp(happiness);

  let mood: CitizenSimulationReport['societalMood'] = 'Content';
  if (overallHappiness >= 90) mood = 'Ecstatic';
  else if (overallHappiness >= 80) mood = 'Prosperous';
  else if (overallHappiness >= 65) mood = 'Content';
  else if (overallHappiness >= 50) mood = 'Restless';
  else mood = 'Distressed';

  return { qualityOfLife, overallHappiness, mood };
}

/**
 * 3. District-level social metrics calculation
 */
export function calculateDistrictSocialMetrics(
  districts: District[],
  placedBuildings: PlacedBuilding[],
  economyReport: CitySimulationReport,
  needs: CitizenNeedsBreakdown,
  activeDisaster: DisasterSimulationState['activeDisaster']
): DistrictSocialMetric[] {
  return districts.map((dist) => {
    const isAffected = activeDisaster?.districtId === dist.id;
    let baseQoL = 82;
    let safety = 90;
    let primaryGrievance = undefined;

    if (dist.id === 'dist-residential') {
      baseQoL = Math.round((needs.housing.satisfactionPercent + needs.healthcare.satisfactionPercent + needs.recreation.satisfactionPercent) / 3);
      if (needs.housing.satisfactionPercent < 80) primaryGrievance = 'Housing demand high; construct additional Arcology Spire';
    } else if (dist.id === 'dist-industrial') {
      baseQoL = Math.round((needs.employment.satisfactionPercent + needs.electricity.satisfactionPercent + needs.environment.satisfactionPercent) / 3);
      if (needs.environment.satisfactionPercent < 75) primaryGrievance = 'Smelter smoke particulates require air scrubbers';
    } else if (dist.id === 'dist-science') {
      baseQoL = Math.round((needs.education.satisfactionPercent + needs.electricity.satisfactionPercent) / 2 + 5);
      if (needs.education.satisfactionPercent < 80) primaryGrievance = 'Quantum research expansion requires more lab capacity';
    } else if (dist.id === 'dist-agriculture') {
      baseQoL = Math.round((needs.food.satisfactionPercent + needs.water.satisfactionPercent) / 2);
      if (needs.water.satisfactionPercent < 80) primaryGrievance = 'Aquifer irrigation lines near capacity';
    } else {
      // Citadel
      baseQoL = Math.round((needs.safety.satisfactionPercent + needs.recreation.satisfactionPercent) / 2);
    }

    if (isAffected) {
      safety = 35;
      baseQoL = Math.max(30, baseQoL - 25);
      primaryGrievance = `EMERGENCY: Active ${activeDisaster.type} impacting district`;
    }

    // Matching buildings
    const distBuildings = placedBuildings.filter((b) => b.districtId === dist.id);
    const jobsCap = distBuildings.reduce((sum, b) => sum + (b.workersNeeded || 0), 0);
    const jobsFilled = distBuildings.reduce((sum, b) => sum + (b.workersAssigned || 0), 0);
    const unemp = jobsCap > 0 ? clamp(((jobsCap - jobsFilled) / jobsCap) * 100) : 5;

    return {
      districtId: dist.id,
      name: dist.name,
      category: dist.category,
      population: dist.population,
      qualityOfLife: clamp(baseQoL),
      happiness: clamp(baseQoL - (isAffected ? 15 : 0)),
      safetyIndex: safety,
      housingCapacity: dist.id === 'dist-residential' ? Math.round(dist.population * 1.1) : 0,
      housingOccupancyPercent: dist.id === 'dist-residential' ? 92 : 0,
      jobsCapacity: jobsCap,
      jobsFilled: jobsFilled,
      unemploymentRate: unemp,
      primaryGrievance,
      citizenSatisfactionTrend: isAffected ? 'declining' : baseQoL >= 80 ? 'rising' : 'stable',
    };
  });
}

/**
 * 4. Updates Representative Citizen Agents with Diurnal Routines and Trained ML Inference
 */
export function updateCitizenRoutines(
  agents: DetailedCitizenAgent[],
  timeOfDay: number,
  activeDisaster: DisasterSimulationState['activeDisaster'],
  needs: CitizenNeedsBreakdown,
  citadelLevel: number = 1,
  resources?: ResourceState,
  placedBuildings?: PlacedBuilding[]
): DetailedCitizenAgent[] {
  const era = getCivilizationEra(citadelLevel);
  const eraProfile = ERA_PROFILES[era];
  const safeResources: ResourceState = resources || {
    energy: 500,
    materials: 500,
    food: 500,
    water: 500,
    population: 10,
    grc: 25000,
    happiness: 90,
    health: 95,
    stability: 95,
    environmentalIndex: 85,
    educationIndex: 75,
    politicalCapital: 100,
    gdp: 1.0,
    researchPoints: 50,
  };
  const safeBuildings = placedBuildings || [];

  return agents.map((agent, idx) => {
    // Current metabolic drives or initialize defaults
    const currentDrives = agent.drives || {
      hunger: 20 + (idx * 5) % 30,
      thirst: 15 + (idx * 7) % 25,
      energy: 85 - (idx * 3) % 20,
      safety: 90,
      socialBond: 80,
      purposeMorale: 88,
      fatigueAccumulated: 10,
    };

    const mockHuman: DetailedHumanCitizen = {
      ...agent,
      era,
      drives: { ...currentDrives, fatigueAccumulated: 10 },
      commuteMode: agent.commuteMode || 'walking',
      currentLogicalIntent: agent.currentDestinationName || 'Active duty',
      thoughtStream: [],
      homeCoords: agent.homeCoords || [-7.5 + (idx % 5) * 2, 0, 11 + Math.floor(idx / 5) * 3],
      workCoords: agent.workCoords || [0, 0, 8],
      currentPosCoords: agent.currentPosCoords || [-7.5 + (idx % 5) * 2, 0, 11 + Math.floor(idx / 5) * 3],
      targetDestinationCoords: agent.targetDestinationCoords || [0, 0, 8],
      assignedActivity: agent.currentActivity,
    };

    // 1. Advance metabolic drives
    const updatedDrives = updateHumanMetabolicDrives(
      mockHuman,
      timeOfDay,
      0.25, // simulation step delta
      safeResources,
      safeBuildings,
      eraProfile
    );

    mockHuman.drives = updatedDrives;

    // 2. Evaluate Trained ML Activity Sequence Model
    const isDisasterActive = Boolean(activeDisaster);
    const { activity, intent } = evaluateTrainedActivitySequence(
      mockHuman,
      timeOfDay,
      isDisasterActive,
      era
    );

    // 3. Resolve Destination Coordinates & Name
    let destinationName = agent.workplaceName || 'Municipal Complex';
    let targetCoords = mockHuman.workCoords;

    if (activity === 'sleeping' || activity === 'home_leisure') {
      destinationName = agent.residenceName || 'Residential Habitat';
      targetCoords = mockHuman.homeCoords;
    } else if (activity === 'lunch_break') {
      destinationName = era === 'pioneer_survival' ? 'Citadel Communal Hearth' : 'Dining Plaza & Biosphere Park';
      targetCoords = [0, 0, 12];
    } else if (activity === 'recreation_park') {
      destinationName = era === 'pioneer_survival' ? 'Citadel Assembly Ground' : 'Elysium Civic Forum';
      targetCoords = [0, 0, 14];
    } else if (activity === 'seeking_medical_care') {
      destinationName = 'Cellular Care Clinic';
      targetCoords = [14, 0, 20];
    } else if (activity === 'evacuating_shelter') {
      destinationName = 'Citadel Subterranean Bunker';
      targetCoords = [0, 0, 8];
    }

    // 4. Evaluate Mode Choice
    const distToTarget = Math.hypot(
      targetCoords[0] - mockHuman.currentPosCoords[0],
      targetCoords[2] - mockHuman.currentPosCoords[2]
    );
    const mode = evaluateTrainedModeChoice(agent.age, agent.wealthTier || 'Comfortable', distToTarget, era);

    // 5. Dynamic Human Thought Stream
    const currentThought = generateCitizenThought(mockHuman, eraProfile, citadelLevel, timeOfDay);

    // 6. Dynamic Personal Needs composite
    const personalHousing = clamp(needs.housing.satisfactionPercent + (agent.income > 100000 ? 5 : -5));
    const personalHealth = clamp(needs.healthcare.satisfactionPercent + (agent.health > 85 ? 5 : -10));
    const personalRec = clamp(needs.recreation.satisfactionPercent + (updatedDrives.socialBond > 70 ? 8 : -8));
    const personalSafety = isDisasterActive ? 25 : clamp(updatedDrives.safety);

    const personalAvg = Math.round((personalHousing + personalHealth + personalRec + personalSafety) / 4);

    return {
      ...agent,
      era,
      drives: {
        hunger: Math.round(updatedDrives.hunger),
        thirst: Math.round(updatedDrives.thirst),
        energy: Math.round(updatedDrives.energy),
        safety: Math.round(updatedDrives.safety),
        socialBond: Math.round(updatedDrives.socialBond),
        purposeMorale: Math.round(updatedDrives.purposeMorale),
      },
      commuteMode: mode,
      currentThought,
      currentActivity: activity,
      currentDestinationName: destinationName,
      targetDestinationCoords: targetCoords,
      happiness: clamp(personalAvg),
      commuteSatisfaction: needs.transportation.satisfactionPercent,
      personalNeeds: {
        housing: personalHousing,
        healthcare: personalHealth,
        recreation: personalRec,
        safety: personalSafety,
      },
      status: personalAvg >= 85 ? 'Optimal' : personalAvg >= 70 ? 'Content' : personalAvg >= 50 ? 'Stressed' : 'Critical',
    };
  });
}

/**
 * 5. Generates actionable citizen problem alerts based on simulation state
 */
export function generateCitizenProblems(
  needs: CitizenNeedsBreakdown,
  districts: DistrictSocialMetric[],
  disasterState: DisasterSimulationState,
  pop: number
): CitizenProblemAlert[] {
  const problems: CitizenProblemAlert[] = [];

  // 1. Disaster Displacement Alert
  if (disasterState?.activeDisaster) {
    const dis = disasterState.activeDisaster;
    problems.push({
      id: `prob-disaster-${dis.id}`,
      type: 'disaster',
      severity: dis.intensity === 'critical' ? 'critical' : 'high',
      title: `${dis.intensity.toUpperCase()} ${dis.type.toUpperCase()} DISPLACEMENT`,
      affectedPopulation: dis.displacedPopulation,
      affectedDistrictName: dis.name,
      causeDescription: `Uncontained ${dis.type} hazard impacting structural foundations and citizen safety in the district.`,
      recommendedAction: 'Deploy Emergency Response Forces from the Civil Defense Command Center to raise containment.',
    });
  }

  // 2. Housing Shortage
  if (needs.housing.satisfactionPercent < 80) {
    problems.push({
      id: 'prob-housing-shortage',
      type: 'housing',
      severity: needs.housing.satisfactionPercent < 60 ? 'critical' : 'high',
      title: 'CRITICAL HABITATION DEFICIT',
      affectedPopulation: Math.round(pop * (1 - needs.housing.satisfactionPercent / 100)),
      affectedDistrictName: 'Arcology Spire Residential District',
      causeDescription: 'Urban population expansion has outgrown current residential vertical tower capacity.',
      recommendedAction: 'Erect an additional Arcology Spire or High-Density Habitat Block along the residential corridor.',
    });
  }

  // 3. Healthcare Shortage
  if (needs.healthcare.satisfactionPercent < 75) {
    problems.push({
      id: 'prob-health-deficit',
      type: 'healthcare',
      severity: 'medium',
      title: 'HEALTHCARE CAPACITY CONSTRAINT',
      affectedPopulation: Math.round(pop * 0.22),
      affectedDistrictName: 'Oasis Terraces Healthcare Hub',
      causeDescription: 'Clinic triage portals are experiencing patient backlogs and delayed preventative care.',
      recommendedAction: 'Upgrade Oasis Cellular Care Clinic to Level 2 or construct a specialized Med-Center.',
    });
  }

  // 4. Power Grid Stress
  if (needs.electricity.satisfactionPercent < 85) {
    problems.push({
      id: 'prob-power-stress',
      type: 'energy',
      severity: needs.electricity.satisfactionPercent < 70 ? 'critical' : 'high',
      title: 'ELECTRICAL GRID OVERLOAD RISK',
      affectedPopulation: Math.round(pop * 0.4),
      affectedDistrictName: 'Metropolitan Grid Interconnect',
      causeDescription: 'Industrial foundries and vertical arcologies are consuming power near generator output thresholds.',
      recommendedAction: 'Construct additional Geothermal Wells or Fusion Solar Arrays to expand MW generation margin.',
    });
  }

  // 5. Environmental Pollution
  if (needs.environment.satisfactionPercent < 75) {
    problems.push({
      id: 'prob-pollution',
      type: 'pollution',
      severity: 'medium',
      title: 'INDUSTRIAL SMELTER PARTICULATE HAZE',
      affectedPopulation: Math.round(pop * 0.18),
      affectedDistrictName: 'Vulcan Smelter Heavy Industrial Basin',
      causeDescription: 'Thermal metal fabrication has increased atmospheric carbon and sulfur particulate density.',
      recommendedAction: 'Enact Environmental Scrubbing Mandate policy or plant protective biosphere buffer forests.',
    });
  }

  return problems;
}

/**
 * 6. Full Citizen Simulation Tick
 */
export function runCitizenSimulationTick(
  resources: ResourceState,
  placedBuildings: PlacedBuilding[],
  districts: District[],
  economyReport: CitySimulationReport,
  disasterState: DisasterSimulationState,
  existingAgents: DetailedCitizenAgent[],
  timeOfDay: number,
  citadelLevel: number = 1
): CitizenSimulationReport {
  const pop = resources.population;
  const workingAge = Math.round(pop * 0.62);
  const students = Math.round(pop * 0.18);
  const retirees = Math.round(pop * 0.20);
  const employed = Math.round(workingAge * (economyReport.resources.employmentRatePercent / 100));
  const unemployed = Math.max(0, workingAge - employed);

  const needs = calculateCitizenNeeds(resources, placedBuildings, economyReport, disasterState);
  const { qualityOfLife, overallHappiness, mood } = calculateQualityOfLife(
    needs,
    disasterState,
    economyReport.economy.netDailyCashFlow
  );

  const districtMetrics = calculateDistrictSocialMetrics(
    districts,
    placedBuildings,
    economyReport,
    needs,
    disasterState?.activeDisaster
  );

  const updatedAgents = updateCitizenRoutines(
    existingAgents,
    timeOfDay,
    disasterState?.activeDisaster,
    needs,
    citadelLevel,
    resources,
    placedBuildings
  );
  const activeProblems = generateCitizenProblems(needs, districtMetrics, disasterState, pop);

  return {
    totalPopulation: pop,
    workingAgePopulation: workingAge,
    employedCount: employed,
    unemployedCount: unemployed,
    employmentRatePercent: economyReport.resources.employmentRatePercent,
    unemploymentRatePercent: economyReport.resources.unemploymentRatePercent,
    studentsCount: students,
    retireesCount: retirees,
    overallHappiness,
    qualityOfLifeIndex: qualityOfLife,
    happinessTrend: overallHappiness >= 82 ? 'rising' : overallHappiness >= 70 ? 'stable' : 'declining',
    needs,
    districts: districtMetrics,
    citizenAgents: updatedAgents,
    activeProblems,
    societalMood: mood,
  };
}

/**
 * 7. Factory to initialize detailed citizen agent cohorts with authentic locations and drives
 */
export function createInitialDetailedAgents(
  baseCitizens: any[],
  citadelLevel: number = 1
): DetailedCitizenAgent[] {
  const era = getCivilizationEra(citadelLevel);

  return baseCitizens.map((c, idx) => {
    let ageGroup: 'youth' | 'adult' | 'elder' = 'adult';
    if (c.age < 22) ageGroup = 'youth';
    else if (c.age >= 60) ageGroup = 'elder';

    // Pioneer vs Metropolis Residence
    const isPioneer = era === 'pioneer_survival';
    const homeName = isPioneer
      ? `Frontier Colony Outpost Quarters ${idx + 1}`
      : (c.district === 'Oasis Terraces' ? 'Arcology Spire Alpha' : 'Citadel High Quarters');

    const homeCoords: [number, number, number] = isPioneer
      ? [-8.5 + (idx % 5) * 3.0, 0, 11.5 + Math.floor(idx / 5) * 3.5]
      : (c.district === 'Oasis Terraces' ? [-3.2, 0, 30.0] : [-5.5, 0, 10.0]);

    // Workplace
    let workplaceName = 'Citadel Command Deck';
    let workCoords: [number, number, number] = [0, 0, 8];

    const occ = (c.occupation || '').toLowerCase();
    if (occ.includes('botanist') || occ.includes('agr')) {
      workplaceName = isPioneer ? 'Pioneer Greenhouse Plot' : 'Bio-Dome Prime';
      workCoords = isPioneer ? [-12, 0, 14] : [-27.2, 0, 30.0];
    } else if (occ.includes('architect') || occ.includes('survey')) {
      workplaceName = isPioneer ? 'Surveyor Engineering Bench' : 'Civic Planning Bureau';
      workCoords = isPioneer ? [8.5, 0, 12] : [5.5, 0, 9.5];
    } else if (occ.includes('doctor') || occ.includes('medic')) {
      workplaceName = isPioneer ? 'Frontier Triage Tent' : 'Oasis Cellular Care Clinic';
      workCoords = [14.0, 0, 20.0];
    } else if (occ.includes('foundry') || occ.includes('tech') || occ.includes('worker')) {
      workplaceName = isPioneer ? 'Refinery Kiln' : 'Vulcan Smelter Hub A';
      workCoords = [27.2, 0, -17.0];
    } else if (occ.includes('student') || occ.includes('scholar')) {
      workplaceName = 'Polytechnic Institute';
      workCoords = [-16.0, 0, -19.5];
    }

    const drives = {
      hunger: 12 + (idx * 4) % 20,
      thirst: 10 + (idx * 6) % 20,
      energy: 92 - (idx * 3) % 15,
      safety: 95,
      socialBond: 85,
      purposeMorale: 92,
    };

    return {
      ...c,
      ageGroup,
      era,
      residenceBuildingId: isPioneer ? 'bld-pioneer-quarters' : 'bld-arcology-01',
      residenceName: homeName,
      workplaceBuildingId: isPioneer ? 'bld-citadel-01' : 'bld-foundry-01',
      workplaceName,
      currentActivity: 'working' as DailyActivity,
      currentDestinationName: workplaceName,
      commuteSatisfaction: 94,
      commuteMode: 'walking' as const,
      homeCoords,
      workCoords,
      currentPosCoords: homeCoords,
      targetDestinationCoords: workCoords,
      drives,
      currentThought: `Pioneering the frontier as ${c.occupation}. Every foundation stone builds our legacy.`,
      personalNeeds: {
        housing: 92,
        healthcare: 86,
        recreation: 80,
        safety: 90,
      },
      status: 'Optimal',
    };
  });
}
