/**
 * GENESIS — Advanced Civilization Evolution & Long-Term Simulation Engine
 *
 * Deterministic engine managing:
 * 1. Multi-Stage Civilization Evolution (Settlement -> Village -> Town -> City -> Metropolis -> Advanced Civilization)
 * 2. Unmet Requirement Checklists & Progression Percentage
 * 3. Intelligent City Expansion & Road-Adjacent Placement Solver
 * 4. Actionable City Planner Recommendations with Calculated Impacts
 * 5. Time-Series Historical Snapshots & Long-Term Telemetry Records
 */

import {
  PlacedBuilding,
  ResourceState,
  District,
  CivilizationProfile,
} from '../types/game';
import { CitySimulationReport } from './economySimulationEngine';
import { CitizenSimulationReport } from '../types/citizen';
import { DisasterSimulationState } from '../types/disaster';
import { getTerrainHeight, isNearRiver } from '../components/world3d/Terrain';
import {
  CivilizationStageId,
  CivilizationStageConfig,
  StageRequirementCriterion,
  HistoricalYearSnapshot,
  DevelopmentRecommendation,
  CivilizationEvolutionReport,
  DistrictDevelopmentSummary,
  DisasterRecoverySummary,
} from '../types/evolution';

// ================= 1. THE 6 DYNAMIC CIVILIZATION STAGES =================
export const CIVILIZATION_STAGES: CivilizationStageConfig[] = [
  {
    id: 'settlement',
    order: 1,
    name: 'Settlement',
    subtitle: 'Pioneer Valley Outpost',
    description: 'Initial colonial landing site establishing basic aeroponics, local energy collectors, and pioneer habitation pods.',
    minPopulation: 25000,
    minBuildings: 3,
    minHappiness: 60,
    minGdpBillion: 5,
    minTreasuryCredits: 500,
    minQualityOfLife: 55,
    minEnvironmentalIndex: 60,
    requiredCategories: ['residential', 'agriculture', 'energy'],
    unlockedOpportunities: ['Hydroponic Bio-Domes', 'Solar Arrays', 'Basic Roadways', 'Local Aquifer Wells'],
    themeColor: '#C5A66A',
  },
  {
    id: 'village',
    order: 2,
    name: 'Village',
    subtitle: 'Riparian Agrarian Community',
    description: 'Growing permanent residential blocks, foundational metal smelting, and subterranean freshwater pipelines.',
    minPopulation: 100000,
    minBuildings: 6,
    minHappiness: 65,
    minGdpBillion: 15,
    minTreasuryCredits: 1200,
    minQualityOfLife: 65,
    minEnvironmentalIndex: 65,
    requiredCategories: ['residential', 'agriculture', 'energy', 'industrial'],
    unlockedOpportunities: ['Modular Habitat Blocks', 'Water Filtration Basins', 'Foundry Smelters', 'Civic Assembly Grounds'],
    themeColor: '#8FA879',
  },
  {
    id: 'town',
    order: 3,
    name: 'Town',
    subtitle: 'Integrated Provincial Hub',
    description: 'Paved arterial roads, primary medical care triage, commercial markets, and trade connectivity.',
    minPopulation: 350000,
    minBuildings: 9,
    minHappiness: 70,
    minGdpBillion: 20,
    minTreasuryCredits: 1500,
    minQualityOfLife: 70,
    minEnvironmentalIndex: 70,
    requiredCategories: ['residential', 'agriculture', 'energy', 'industrial', 'healthcare'],
    unlockedOpportunities: ['Cellular Care Clinics', 'Commercial Plazas', 'Paved Avenues', 'Civil Defense Forces'],
    themeColor: '#6e98b3',
  },
  {
    id: 'city',
    order: 4,
    name: 'City',
    subtitle: 'Urban Science & Industrial Center',
    description: 'Polytechnic research campuses, high-capacity bridges, diverse economic sectors, and automated logistics.',
    minPopulation: 700000,
    minBuildings: 12,
    minHappiness: 75,
    minGdpBillion: 35,
    minTreasuryCredits: 2500,
    minQualityOfLife: 75,
    minEnvironmentalIndex: 75,
    requiredCategories: ['residential', 'agriculture', 'energy', 'industrial', 'healthcare', 'education'],
    unlockedOpportunities: ['Polytechnic Institutes', 'Deep Space Observatories', 'Architectural Bridges', 'Advanced Logistics'],
    themeColor: '#9F8859',
  },
  {
    id: 'metropolis',
    order: 5,
    name: 'Metropolis',
    subtitle: 'High Technological Federation',
    description: 'Vertical Arcology habitats, Elysium Citadel High Senate, high-speed transit pods, and multi-district industrial automation.',
    minPopulation: 1100000,
    minBuildings: 15,
    minHappiness: 80,
    minGdpBillion: 45,
    minTreasuryCredits: 4000,
    minQualityOfLife: 80,
    minEnvironmentalIndex: 78,
    requiredCategories: ['residential', 'agriculture', 'energy', 'industrial', 'healthcare', 'education', 'government', 'environment'],
    unlockedOpportunities: ['Arcology Spires', 'Elysium Citadel', 'Biosphere Parks', 'Transit Pods', 'Universal Basic Income'],
    themeColor: '#D6A75E',
  },
  {
    id: 'advanced_civilization',
    order: 6,
    name: 'Advanced Civilization',
    subtitle: 'Post-Scarcity Planetary Synthesis',
    description: 'Harmonized ecological integration, quantum AI networks, zero net carbon emissions, and virtually limitless fusion energy.',
    minPopulation: 1800000,
    minBuildings: 20,
    minHappiness: 85,
    minGdpBillion: 90,
    minTreasuryCredits: 10000,
    minQualityOfLife: 85,
    minEnvironmentalIndex: 85,
    requiredCategories: ['residential', 'agriculture', 'energy', 'industrial', 'healthcare', 'education', 'government', 'environment'],
    unlockedOpportunities: ['Quantum Neural AI Grids', 'Geothermal Megawells', 'Planetary Ecological Equilibrium', 'Stellar Telemetry Arrays'],
    themeColor: '#3be8b0',
  },
];

/**
 * 2. Evaluates Current Civilization Stage and Criteria Checklist
 */
export function evaluateCivilizationStage(
  population: number,
  placedBuildings: PlacedBuilding[],
  resources: ResourceState,
  economyReport: CitySimulationReport,
  citizenReport: CitizenSimulationReport,
  disasterState?: DisasterSimulationState
): {
  currentStage: CivilizationStageConfig;
  nextStage: CivilizationStageConfig | null;
  stageProgressPercent: number;
  criteriaChecklist: StageRequirementCriterion[];
} {
  const activeBuildings = placedBuildings.filter((b) => b.status === 'active' || b.status === 'upgrading');
  const activeCategories = new Set(activeBuildings.map((b) => b.category));
  const activeCount = activeBuildings.length;
  const happiness = citizenReport?.overallHappiness ?? resources.happiness;
  const qol = citizenReport?.qualityOfLifeIndex ?? 70;
  const gdp = resources.gdp;
  const treasury = resources.grc;
  const env = resources.environmentalIndex;

  // Determine highest stage where all criteria are satisfied
  let currentStageIndex = 0;
  for (let i = 0; i < CIVILIZATION_STAGES.length; i++) {
    const stage = CIVILIZATION_STAGES[i];
    const hasPop = population >= stage.minPopulation;
    const hasBuildings = activeCount >= stage.minBuildings;
    const hasHappiness = happiness >= stage.minHappiness;
    const hasGdp = gdp >= stage.minGdpBillion;
    const hasTreasury = treasury >= stage.minTreasuryCredits;
    const hasQol = qol >= stage.minQualityOfLife;
    const hasEnv = env >= stage.minEnvironmentalIndex;
    const hasCategories = stage.requiredCategories.every((cat) => activeCategories.has(cat));

    if (hasPop && hasBuildings && hasHappiness && hasGdp && hasTreasury && hasQol && hasEnv && hasCategories) {
      currentStageIndex = i;
    } else {
      break;
    }
  }

  const currentStage = CIVILIZATION_STAGES[currentStageIndex];
  const nextStage = currentStageIndex < CIVILIZATION_STAGES.length - 1 ? CIVILIZATION_STAGES[currentStageIndex + 1] : null;

  const criteriaChecklist: StageRequirementCriterion[] = [];
  let metCount = 0;
  const totalCount = nextStage ? 8 : 8;

  if (nextStage) {
    // 1. Population Target
    const popMet = population >= nextStage.minPopulation;
    if (popMet) metCount++;
    criteriaChecklist.push({
      id: 'crit-pop',
      label: 'Population Census',
      category: 'demographics',
      currentValue: `${(population / 1000000).toFixed(3)}M`,
      targetValue: `${(nextStage.minPopulation / 1000000).toFixed(2)}M`,
      isMet: popMet,
      tooltip: 'Sustained census required to operate specialized municipal sectors.',
    });

    // 2. Active Buildings Target
    const bldMet = activeCount >= nextStage.minBuildings;
    if (bldMet) metCount++;
    criteriaChecklist.push({
      id: 'crit-bld',
      label: 'Operational Facilities',
      category: 'infrastructure',
      currentValue: activeCount,
      targetValue: nextStage.minBuildings,
      isMet: bldMet,
      tooltip: 'Total active buildings maintaining city infrastructure.',
    });

    // 3. Citizen Happiness Target
    const hapMet = happiness >= nextStage.minHappiness;
    if (hapMet) metCount++;
    criteriaChecklist.push({
      id: 'crit-hap',
      label: 'Citizen Happiness',
      category: 'social',
      currentValue: `${happiness}/100`,
      targetValue: `${nextStage.minHappiness}/100`,
      isMet: hapMet,
      tooltip: 'Public morale reflecting adequate food, safety, healthcare and housing.',
    });

    // 4. Quality of Life Target
    const qolMet = qol >= nextStage.minQualityOfLife;
    if (qolMet) metCount++;
    criteriaChecklist.push({
      id: 'crit-qol',
      label: 'Quality of Life Score',
      category: 'social',
      currentValue: `${qol}%`,
      targetValue: `${nextStage.minQualityOfLife}%`,
      isMet: qolMet,
      tooltip: 'Composite satisfaction across essential and higher-order needs.',
    });

    // 5. Annual Gross Output (GDP) Target
    const gdpMet = gdp >= nextStage.minGdpBillion;
    if (gdpMet) metCount++;
    criteriaChecklist.push({
      id: 'crit-gdp',
      label: 'Annual GDP Output',
      category: 'economy',
      currentValue: `${gdp.toFixed(1)}B Cr`,
      targetValue: `${nextStage.minGdpBillion}B Cr`,
      isMet: gdpMet,
      tooltip: 'Economic productivity generated across commercial and industrial sectors.',
    });

    // 6. Treasury Reserves Target
    const treasuryMet = treasury >= nextStage.minTreasuryCredits;
    if (treasuryMet) metCount++;
    criteriaChecklist.push({
      id: 'crit-treasury',
      label: 'Treasury Reserves (CRC)',
      category: 'economy',
      currentValue: `${treasury.toLocaleString()} GRC`,
      targetValue: `${nextStage.minTreasuryCredits.toLocaleString()} GRC`,
      isMet: treasuryMet,
      tooltip: 'Fiscal buffer to sustain public payroll and civic maintenance.',
    });

    // 7. Ecological Purity Target
    const envMet = env >= nextStage.minEnvironmentalIndex;
    if (envMet) metCount++;
    criteriaChecklist.push({
      id: 'crit-env',
      label: 'Biosphere Ecological Purity',
      category: 'environment',
      currentValue: `${env}%`,
      targetValue: `${nextStage.minEnvironmentalIndex}%`,
      isMet: envMet,
      tooltip: 'Air filtration, water cleanliness, and green canopy coverage.',
    });

    // 8. Category Diversity
    const missingCats = nextStage.requiredCategories.filter((cat) => !activeCategories.has(cat));
    const catMet = missingCats.length === 0;
    if (catMet) metCount++;
    criteriaChecklist.push({
      id: 'crit-cats',
      label: 'District Category Diversity',
      category: 'infrastructure',
      currentValue: `${activeCategories.size} Active`,
      targetValue: `${nextStage.requiredCategories.length} Required`,
      isMet: catMet,
      tooltip: `Requires functional coverage in: ${nextStage.requiredCategories.join(', ')}`,
    });
  } else {
    // Stage 6 Pinnacle
    criteriaChecklist.push({
      id: 'crit-pinnacle',
      label: 'Planetary Synthesis Achieved',
      category: 'infrastructure',
      currentValue: 'Pinnacle',
      targetValue: 'All Eras Completed',
      isMet: true,
      tooltip: 'The civilization has unlocked full post-scarcity synthesis.',
    });
  }

  const stageProgressPercent = nextStage ? Math.round((metCount / totalCount) * 100) : 100;

  return {
    currentStage,
    nextStage,
    stageProgressPercent,
    criteriaChecklist,
  };
}

/**
 * 3. Generates Contextual Intelligent Development Recommendations
 */
export function generateDevelopmentRecommendations(
  economyReport: CitySimulationReport,
  citizenReport: CitizenSimulationReport,
  resources: ResourceState,
  placedBuildings: PlacedBuilding[],
  districts: District[]
): DevelopmentRecommendation[] {
  const recommendations: DevelopmentRecommendation[] = [];
  const demands = economyReport.demands;
  const needs = citizenReport.needs;
  const energyStress = economyReport.resources.energyGridStressPercent;
  const waterNet = economyReport.resources.waterNet;
  const foodNet = economyReport.resources.foodNet;
  const materials = resources.materials;
  const credits = resources.grc;

  // 1. Residential Housing Shortage Recommendation
  if (demands.residentialDemand > 65 || needs.housing.satisfactionPercent < 85) {
    const costMat = 900;
    const costCred = 450;
    recommendations.push({
      id: 'rec-housing-expansion',
      title: 'Construct Arcology Spire Beta',
      category: 'residential',
      priority: needs.housing.satisfactionPercent < 70 ? 'critical' : 'high',
      problemStatement: 'Habitation capacity is trailing urban population growth, risking housing inflation.',
      simulationEvidence: `Housing Satisfaction: ${needs.housing.satisfactionPercent}% · Residential Demand: ${demands.residentialDemand}% · Census: ${(resources.population / 1000000).toFixed(2)}M`,
      recommendedAction: 'Erect an Arcology Spire in the residential sector along the southern roadway.',
      expectedOutcome: '+180,000 Housing Capacity, +12% Housing Satisfaction, +3.5 pts Overall Happiness.',
      targetDistrictId: 'dist-residential',
      suggestedCatalogId: 'bld-res-arcology',
      materialsCost: costMat,
      creditsCost: costCred,
      canExecute: materials >= costMat && credits >= costCred,
    });
  }

  // 2. Power Grid Overload / Energy Expansion
  if (energyStress > 80 || needs.electricity.satisfactionPercent < 85) {
    const costMat = 650;
    const costCred = 380;
    recommendations.push({
      id: 'rec-energy-expansion',
      title: 'Deploy Clean Solar Concentrator Array',
      category: 'energy',
      priority: energyStress > 95 ? 'critical' : 'high',
      problemStatement: 'Grid load is approaching generation capacity, creating brownout vulnerability.',
      simulationEvidence: `Grid Stress: ${energyStress.toFixed(0)}% · Power Demand: ${economyReport.resources.energyConsumedMW} MW · Generation: ${economyReport.resources.energyProducedMW} MW`,
      recommendedAction: 'Construct an additional clean energy generator in the Science or Industrial Basin.',
      expectedOutcome: '+85 MW Clean Power Output, Grid Stress reduced to safe threshold (<75%).',
      targetDistrictId: 'dist-science',
      suggestedCatalogId: 'bld-ene-solar',
      materialsCost: costMat,
      creditsCost: costCred,
      canExecute: materials >= costMat && credits >= costCred,
    });
  }

  // 3. Healthcare Infrastructure Shortage
  if (needs.healthcare.satisfactionPercent < 80) {
    const costMat = 700;
    const costCred = 350;
    recommendations.push({
      id: 'rec-health-clinic',
      title: 'Upgrade Oasis Cellular Care Clinic',
      category: 'healthcare',
      priority: 'high',
      problemStatement: 'Medical triage capacity is strained by rapid demographic expansion.',
      simulationEvidence: `Healthcare Satisfaction: ${needs.healthcare.satisfactionPercent}% · Clinical Bed Margin Deficit`,
      recommendedAction: 'Overhaul healthcare medical wings with regenerative cellular therapy suites.',
      expectedOutcome: '+90,000 Patient Bed Capacity, +15% Healthcare Satisfaction, +2.5 pts Public Health.',
      targetDistrictId: 'dist-residential',
      suggestedCatalogId: 'bld-hea-clinic',
      materialsCost: costMat,
      creditsCost: costCred,
      canExecute: materials >= costMat && credits >= costCred,
    });
  }

  // 4. Industrial Smelter / Job Creation
  if (demands.industrialDemand > 65 || economyReport.resources.employmentRatePercent < 88) {
    const costMat = 800;
    const costCred = 400;
    recommendations.push({
      id: 'rec-industrial-foundry',
      title: 'Expand Vulcan Smelter Fabrication Complex',
      category: 'industrial',
      priority: 'medium',
      problemStatement: 'Workforce supply exceeds active factory slots, leading to idle engineering labor.',
      simulationEvidence: `Unemployment: ${economyReport.resources.unemploymentRatePercent}% · Industrial Demand: ${demands.industrialDemand}%`,
      recommendedAction: 'Construct an automated Foundry Smelter Hub in the industrial sector.',
      expectedOutcome: '+160 Industrial Jobs, +120 Tons/day Construction Materials production.',
      targetDistrictId: 'dist-industrial',
      suggestedCatalogId: 'bld-ind-foundry',
      materialsCost: costMat,
      creditsCost: costCred,
      canExecute: materials >= costMat && credits >= costCred,
    });
  }

  // 5. Agri-Basin Food Production
  if (foodNet < 35 || needs.food.satisfactionPercent < 82) {
    const costMat = 550;
    const costCred = 280;
    recommendations.push({
      id: 'rec-agri-dome',
      title: 'Construct Hydroponic Bio-Dome Prime',
      category: 'agriculture',
      priority: foodNet < 0 ? 'critical' : 'medium',
      problemStatement: 'Food consumption is near total crop output; reserves require long-term buffer.',
      simulationEvidence: `Food Net: ${foodNet >= 0 ? '+' : ''}${foodNet} Rations/day · Satisfaction: ${needs.food.satisfactionPercent}%`,
      recommendedAction: 'Build an additional climate-controlled Hydroponic Bio-Dome along the western riverbank.',
      expectedOutcome: '+150 Rations/day Food Surplus, guaranteed emergency famine security.',
      targetDistrictId: 'dist-agriculture',
      suggestedCatalogId: 'bld-agr-hydroponic',
      materialsCost: costMat,
      creditsCost: costCred,
      canExecute: materials >= costMat && credits >= costCred,
    });
  }

  // 6. Parks & Environmental Biosphere Restoration
  if (needs.environment.satisfactionPercent < 80 || needs.recreation.satisfactionPercent < 75) {
    const costMat = 400;
    const costCred = 200;
    recommendations.push({
      id: 'rec-biosphere-park',
      title: 'Establish Biosphere Ecological Sanctuary',
      category: 'environment',
      priority: 'growth',
      problemStatement: 'Urban density has reduced citizen recreation access and green canopy coverage.',
      simulationEvidence: `Recreation Satisfaction: ${needs.recreation.satisfactionPercent}% · Environmental Index: ${resources.environmentalIndex}%`,
      recommendedAction: 'Plant a protected Biosphere Park with native riparian flora near the central forum.',
      expectedOutcome: '+18% Recreation Score, +8 pts Ecological Purity, +3.5 pts Societal Happiness.',
      targetDistrictId: 'dist-citadel',
      suggestedCatalogId: 'bld-env-park',
      materialsCost: costMat,
      creditsCost: costCred,
      canExecute: materials >= costMat && credits >= costCred,
    });
  }

  // 7. Water Filtration & Hydrological Grid
  if (waterNet < 40 || needs.water.satisfactionPercent < 85) {
    const costMat = 600;
    const costCred = 320;
    recommendations.push({
      id: 'rec-water-filtration',
      title: 'Construct Aquifer Water Treatment Basin',
      category: 'infrastructure',
      priority: waterNet < 0 ? 'critical' : 'medium',
      problemStatement: 'Freshwater aquifer withdrawal is pacing population growth closely.',
      simulationEvidence: `Water Net: ${waterNet >= 0 ? '+' : ''}${waterNet} kL/day · Satisfaction: ${needs.water.satisfactionPercent}%`,
      recommendedAction: 'Install an automated riparian water filtration plant beside the river mouth.',
      expectedOutcome: '+80 kL/day Potable Water Surplus, +10% Hydrological Satisfaction.',
      targetDistrictId: 'dist-agriculture',
      suggestedCatalogId: 'bld-env-water',
      materialsCost: costMat,
      creditsCost: costCred,
      canExecute: materials >= costMat && credits >= costCred,
    });
  }

  // 8. Higher Education & Polytechnic Institute
  if (needs.education.satisfactionPercent < 80) {
    const costMat = 750;
    const costCred = 420;
    recommendations.push({
      id: 'rec-edu-polytechnic',
      title: 'Erect Polytechnic Scholar Towers',
      category: 'education',
      priority: 'medium',
      problemStatement: 'Vocational training and advanced technical academies have reached student enrollment capacity.',
      simulationEvidence: `Education Satisfaction: ${needs.education.satisfactionPercent}% · Index: ${resources.educationIndex}%`,
      recommendedAction: 'Construct a state-of-the-art Polytechnic Institute campus in the Science Ridge.',
      expectedOutcome: '+250 Student Capacity, +15% Education Satisfaction, +12 Research Points/day.',
      targetDistrictId: 'dist-science',
      suggestedCatalogId: 'bld-edu-college',
      materialsCost: costMat,
      creditsCost: costCred,
      canExecute: materials >= costMat && credits >= costCred,
    });
  }

  return recommendations;
}

/**
 * 4. Road-Adjacent Collision-Free Intelligent Expansion Slot Finder
 * Finds an optimal [x, y, z] site alongside roads inside the target district.
 * Validates collision, road adjacency, terrain height and ensures buildings are never submerged in rivers.
 */
export function findOptimalExpansionSlot(
  districtId: string,
  placedBuildings: PlacedBuilding[]
): { x: number; y: number; z: number; rotation: number } | null {
  // Preset verified road-adjacent growth plots for each district
  const CANDIDATE_PLOTS: Record<string, [number, number, number][]> = {
    'dist-residential': [
      [7.5, 30.0, 0],
      [-7.5, 30.0, Math.PI],
      [7.5, 36.5, 0],
      [-7.5, 36.5, Math.PI],
      [8.0, 24.5, -Math.PI / 2],
      [-8.0, 24.5, Math.PI / 2],
      [7.5, 43.0, 0],
      [-7.5, 43.0, Math.PI],
    ],
    'dist-industrial': [
      [27.0, -18.5, 0],
      [27.0, -25.0, 0],
      [33.5, -18.5, Math.PI],
      [33.5, -25.0, Math.PI],
      [27.0, -12.0, 0],
      [33.5, -12.0, Math.PI],
    ],
    'dist-science': [
      [-19.5, -17.5, 0],
      [-19.5, -23.0, 0],
      [-26.0, -17.5, Math.PI],
      [-26.0, -23.0, Math.PI],
      [-19.5, -11.0, 0],
      [-26.0, -11.0, Math.PI],
    ],
    'dist-agriculture': [
      [-27.0, 31.0, 0],
      [-27.0, 37.0, 0],
      [-21.0, 31.0, Math.PI],
      [-21.0, 37.0, Math.PI],
      [-27.0, 25.0, 0],
      [-21.0, 25.0, Math.PI],
    ],
    'dist-citadel': [
      [11.5, 12.0, -Math.PI / 2],
      [-11.5, 12.0, Math.PI / 2],
      [7.5, 18.0, 0],
      [-7.5, 18.0, 0],
      [11.5, 6.0, -Math.PI / 2],
      [-11.5, 6.0, Math.PI / 2],
    ],
  };

  const candidates = CANDIDATE_PLOTS[districtId] || CANDIDATE_PLOTS['dist-residential'];

  for (const [cx, cz, rot] of candidates) {
    // Check distance to all existing placed buildings (minimum 5.2m separation)
    const isOccupied = placedBuildings.some((b) => Math.hypot(b.x - cx, b.z - cz) < 5.2);
    // Check river proximity (must not be inside river channel)
    const isInWater = isNearRiver(cx, cz, 3.8);

    if (!isOccupied && !isInWater) {
      const gy = getTerrainHeight(cx, cz);
      // Must not be below ground water level
      if (gy >= -0.05) {
        return { x: cx, y: gy, z: cz, rotation: rot };
      }
    }
  }

  // Fallback: offset slightly from first building in that district with safety checks
  const distBld = placedBuildings.find((b) => b.districtId === districtId);
  if (distBld) {
    const offsets = [
      [6.5, 1.5],
      [-6.5, 1.5],
      [1.5, 6.5],
      [-1.5, -6.5],
    ];
    for (const [ox, oz] of offsets) {
      const fx = distBld.x + ox;
      const fz = distBld.z + oz;
      const isOccupied = placedBuildings.some((b) => Math.hypot(b.x - fx, b.z - fz) < 5.0);
      const isInWater = isNearRiver(fx, fz, 3.8);
      if (!isOccupied && !isInWater) {
        const fy = getTerrainHeight(fx, fz);
        if (fy >= -0.05) {
          return { x: fx, y: fy, z: fz, rotation: distBld.rotation || 0 };
        }
      }
    }
  }

  return null;
}

/**
 * 5. Generates Initial Historical Snapshots (Year 1 to Current Year)
 */
export function generateInitialHistory(
  currentYear: number = 12,
  currentPop: number = 1240000,
  currentGdp: number = 84,
  currentHappiness: number = 88
): HistoricalYearSnapshot[] {
  const history: HistoricalYearSnapshot[] = [];
  const startYear = Math.max(1, currentYear - 8);

  for (let yr = startYear; yr <= currentYear; yr++) {
    const progress = (yr - startYear) / Math.max(1, currentYear - startYear);
    const pop = Math.round(350000 + (currentPop - 350000) * Math.pow(progress, 0.85));
    const gdp = Number((18 + (currentGdp - 18) * progress).toFixed(1));
    const hap = Math.round(72 + (currentHappiness - 72) * progress);
    const qol = Math.round(68 + (hap - 68) * progress);
    const bldCount = Math.round(6 + (16 - 6) * progress);

    let stageId: CivilizationStageId = 'village';
    let stageName = 'Village';
    if (pop >= 1100000) {
      stageId = 'metropolis';
      stageName = 'Metropolis';
    } else if (pop >= 700000) {
      stageId = 'city';
      stageName = 'City';
    } else if (pop >= 350000) {
      stageId = 'town';
      stageName = 'Town';
    }

    let milestone: string | undefined = undefined;
    if (yr === 1) milestone = 'Planetary Settlement Ratified';
    else if (yr === 4) milestone = 'Founding of Elysium Citadel';
    else if (yr === 8) milestone = 'First Arcology Spire Operational';
    else if (yr === 10) milestone = 'Metropolis Milestone (1.0M Census)';
    else if (yr === currentYear) milestone = 'Present Era: Quantum AI & Deep Observatory';

    history.push({
      year: yr,
      day: 365,
      population: pop,
      populationGrowthRate: 2.1,
      gdp,
      happiness: hap,
      qualityOfLife: qol,
      treasuryBalance: Math.round(1500 + 7500 * progress),
      netDailyCashFlow: Math.round(25 + 70 * progress),
      energyProducedMW: Math.round(320 + 380 * progress),
      energyConsumedMW: Math.round(260 + 320 * progress),
      waterNet: Math.round(40 + 45 * progress),
      environmentalIndex: Math.round(88 - 6 * progress),
      activeBuildingsCount: bldCount,
      stageId,
      stageName,
      keyMilestoneEvent: milestone,
    });
  }

  return history;
}

/**
 * 6. Generates District Development Summaries
 */
export function generateDistrictSummaries(
  districts: District[],
  placedBuildings: PlacedBuilding[],
  economyReport: CitySimulationReport
): DistrictDevelopmentSummary[] {
  return districts.map((dist) => {
    const blds = placedBuildings.filter((b) => b.districtId === dist.id);
    const activeBlds = blds.filter((b) => b.status === 'active' || b.status === 'upgrading');
    const avgHealth = blds.length > 0 ? Math.round(blds.reduce((acc, b) => acc + b.health, 0) / blds.length) : 100;
    const isExpanding = blds.some((b) => b.status === 'constructing' || b.status === 'upgrading');

    let jobsCap = 0;
    if (dist.id === 'dist-industrial') jobsCap = 420;
    else if (dist.id === 'dist-science') jobsCap = 380;
    else if (dist.id === 'dist-agriculture') jobsCap = 290;
    else jobsCap = 180;

    const jobsFilled = Math.round(jobsCap * (economyReport.resources.employmentRatePercent / 100));

    return {
      districtId: dist.id,
      name: dist.name,
      population: dist.population,
      buildingsCount: activeBlds.length,
      jobsCapacity: jobsCap,
      jobsFilled,
      infrastructureHealth: avgHealth,
      growthStatus: isExpanding ? 'expanding' : dist.population > 200000 ? 'stable' : 'constrained',
    };
  });
}

/**
 * 7. Generates Disaster Recovery & Emergency Readiness Summary
 */
export function generateDisasterRecoverySummary(
  disasterState?: DisasterSimulationState
): DisasterRecoverySummary {
  if (!disasterState) {
    return {
      hasActiveDisaster: false,
      containmentPercent: 100,
      overallDisasterReadiness: 90,
      recoveryStatus: 'Nominal',
    };
  }

  const active = disasterState.activeDisaster;
  const forces = disasterState.emergencyForces;
  const readiness = forces
    ? Math.round(
        forces.responseEfficiencyPercent * 0.5 +
          Math.min(1, (forces.shelterCapacityTotal || 2000) / 5000) * 30 +
          Math.min(
            1,
            ((forces.medicalUnitsActive || 0) +
              (forces.fireCrewsActive || 0) +
              (forces.rescueTeamsActive || 0)) /
              10
          ) *
            20
      )
    : 85;

  let recoveryStatus: DisasterRecoverySummary['recoveryStatus'] = 'Nominal';
  if (active) {
    if (active.stage === 'warning') recoveryStatus = 'Alert';
    else if (active.stage === 'active' || active.stage === 'containing') recoveryStatus = 'Emergency Containment';
    else recoveryStatus = 'Restoration Phase';
  }

  return {
    hasActiveDisaster: Boolean(active),
    activeDisasterType: active?.type,
    activeDisasterIntensity: active?.intensity,
    containmentPercent: active ? Math.round(active.containmentPercent) : 100,
    overallDisasterReadiness: Math.min(100, Math.max(0, readiness)),
    recoveryStatus,
  };
}

/**
 * 8. Central Evolution Engine Tick: Evaluates Stage, Progress, Snapshots & Recommendations
 */
export function runEvolutionSimulationTick(
  civilization: CivilizationProfile,
  resources: ResourceState,
  placedBuildings: PlacedBuilding[],
  districts: District[],
  economyReport: CitySimulationReport,
  citizenReport: CitizenSimulationReport,
  existingHistory: HistoricalYearSnapshot[],
  disasterState?: DisasterSimulationState
): CivilizationEvolutionReport {
  // Stage evaluation
  const { currentStage, nextStage, stageProgressPercent, criteriaChecklist } = evaluateCivilizationStage(
    resources.population,
    placedBuildings,
    resources,
    economyReport,
    citizenReport,
    disasterState
  );

  // Recommendations
  const recommendations = generateDevelopmentRecommendations(
    economyReport,
    citizenReport,
    resources,
    placedBuildings,
    districts
  );

  // District development summaries
  const districtsSummary = generateDistrictSummaries(districts, placedBuildings, economyReport);

  // Disaster recovery summary
  const disasterRecovery = generateDisasterRecoverySummary(disasterState);

  // Overall civilization score (0 - 1000 scale)
  const popScore = Math.min(300, (resources.population / 2000000) * 300);
  const qolScore = ((citizenReport?.qualityOfLifeIndex || 75) / 100) * 250;
  const gdpScore = Math.min(200, (resources.gdp / 150) * 200);
  const envScore = (resources.environmentalIndex / 100) * 150;
  const bldScore = Math.min(100, (placedBuildings.length / 25) * 100);
  const overallCivilizationScore = Math.round(popScore + qolScore + gdpScore + envScore + bldScore);
  const compositeScore = Math.round(overallCivilizationScore / 10);

  // Update or record yearly snapshot
  let updatedHistory = [...existingHistory];
  const lastSnap = updatedHistory[updatedHistory.length - 1];

  if (!lastSnap || lastSnap.year !== civilization.currentYear) {
    updatedHistory.push({
      year: civilization.currentYear,
      day: civilization.currentDay,
      population: resources.population,
      populationGrowthRate: 2.1,
      gdp: resources.gdp,
      happiness: citizenReport?.overallHappiness || resources.happiness,
      qualityOfLife: citizenReport?.qualityOfLifeIndex || 75,
      treasuryBalance: resources.grc,
      netDailyCashFlow: economyReport.economy.netDailyCashFlow,
      energyProducedMW: economyReport.resources.energyProducedMW,
      energyConsumedMW: economyReport.resources.energyConsumedMW,
      waterNet: economyReport.resources.waterNet,
      environmentalIndex: resources.environmentalIndex,
      activeBuildingsCount: placedBuildings.length,
      stageId: currentStage.id,
      stageName: currentStage.name,
      keyMilestoneEvent:
        lastSnap?.stageId !== currentStage.id ? `Advancement to ${currentStage.name} Stage!` : undefined,
    });
  } else {
    // Refresh latest snapshot
    updatedHistory[updatedHistory.length - 1] = {
      ...lastSnap,
      day: civilization.currentDay,
      population: resources.population,
      gdp: resources.gdp,
      happiness: citizenReport?.overallHappiness || resources.happiness,
      qualityOfLife: citizenReport?.qualityOfLifeIndex || 75,
      treasuryBalance: resources.grc,
      netDailyCashFlow: economyReport.economy.netDailyCashFlow,
      activeBuildingsCount: placedBuildings.length,
      stageId: currentStage.id,
      stageName: currentStage.name,
    };
  }

  return {
    currentStage,
    nextStage,
    stageProgressPercent,
    criteriaChecklist,
    overallCivilizationScore,
    compositeScore,
    historicalTimeline: updatedHistory,
    recommendations,
    districtsSummary,
    disasterRecovery,
    totalYearsSimulated: civilization.currentYear,
  };
}
