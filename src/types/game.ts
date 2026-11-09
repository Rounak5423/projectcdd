// ================= CITIES: SKYLINES II SIMULATION EXTENSIONS =================

export type ZoneType =
  | 'none'
  | 'residential_low'
  | 'residential_high'
  | 'commercial_low'
  | 'commercial_high'
  | 'industrial'
  | 'office';

export type InfoViewType =
  | 'none'
  | 'electricity'
  | 'water'
  | 'traffic'
  | 'land_value'
  | 'pollution'
  | 'happiness'
  | 'noise'
  | 'crime'
  | 'health'
  | 'education'
  | 'transit'
  | 'unemployment';

export interface RciDemand {
  residentialLow: number; // 0 - 100
  residentialHigh: number; // 0 - 100
  commercial: number; // 0 - 100
  industrial: number; // 0 - 100
  office: number; // 0 - 100
}

export interface ChirperMessage {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  text: string;
  time: string;
  district: string;
  likes: number;
  isLiked?: boolean;
  tag: string;
}

export interface CityMilestone {
  level: number;
  name: string;
  popRequired: number;
  rewardCredits: number;
  rewardGrc: number;
  unlockedFeatures: string[];
  isReached: boolean;
}

export interface CitizenLifepathEvent {
  year: number;
  day: number;
  title: string;
  description: string;
  category: 'birth' | 'education' | 'career' | 'relocation' | 'achievement' | 'mortality';
}

export interface ZonedTile {
  id: string;
  x: number;
  z: number;
  zoneType: ZoneType;
  buildingLevel: number; // 1 - 5
  landValue: number;
  isOccupied: boolean;
}

export interface UtilityStats {
  powerCapacityMW: number;
  powerConsumptionMW: number;
  powerSurplusMW: number;
  waterCapacityM3: number;
  waterConsumptionM3: number;
  sewageTreatmentPercent: number;
  trafficFlowPercent: number; // 0 - 100%
  averageLandValue: number; // credits/m²
  pollutionIndex: number; // 0 - 100
}

export type ResourceType =
  | 'food'
  | 'water'
  | 'energy'
  | 'materials'
  | 'researchPoints'
  | 'grc'; // Genesis Research Credits

export interface ResourceState {
  food: number;
  water: number;
  energy: number;
  materials: number;
  researchPoints: number;
  grc: number; // Genesis Research Credits
  population: number;
  gdp: number; // in billions
  happiness: number; // 0 - 100
  health: number; // 0 - 100
  stability: number; // 0 - 100
  environmentalIndex: number; // 0 - 100
  educationIndex: number; // 0 - 100
  politicalCapital: number; // 0 - 1000
}

export interface ResourceRates {
  foodRate: number; // net per day
  waterRate: number;
  energyRate: number;
  materialsRate: number;
  researchRate: number;
  grcEarnRate: number;
  populationGrowthRate: number; // % annual
  gdpGrowthRate: number; // % annual
}

export type BuildingCategory =
  | 'residential'
  | 'agriculture'
  | 'commercial'
  | 'industrial'
  | 'research'
  | 'education'
  | 'healthcare'
  | 'energy'
  | 'government'
  | 'environment'
  | 'transportation';

export interface BuildingCatalogItem {
  id: string;
  name: string;
  category: BuildingCategory;
  description: string;
  costMaterials: number;
  costCredits: number;
  energyReq: number; // MW (+ is consumed, - is generated)
  waterReq: number;
  populationCapacity: number;
  workerReq: number;
  productionType?: ResourceType;
  productionAmount: number;
  maintenanceCost: number;
  constructionDurationDays: number;
  minTechLevel: number;
  modelType:
    | 'tower'
    | 'dome'
    | 'factory'
    | 'solar'
    | 'turbine'
    | 'observatory'
    | 'citadel'
    | 'hydroponic'
    | 'hospital'
    | 'academy'
    | 'windmill'
    | 'power_plant'
    | 'water_treatment'
    | 'warehouse'
    | 'park'
    | 'commercial';
}

export interface PlacedBuilding {
  id: string;
  catalogId: string;
  name: string;
  category: BuildingCategory;
  level: number;
  maxLevel: number;
  x: number;
  z: number;
  y: number;
  rotation?: number;
  districtId: string;
  status: 'active' | 'constructing' | 'upgrading' | 'offline';
  health: number; // 0 - 100
  efficiency: number; // 0 - 100
  workersAssigned: number;
  workersNeeded: number;
  modelType: BuildingCatalogItem['modelType'];
  constructionProgress?: number; // 0 - 100
  upgradeProgress?: number; // 0 - 100
  targetLevel?: number;
}

export interface District {
  id: string;
  name: string;
  category: string;
  color: string;
  x: number;
  z: number;
  radius: number;
  population: number;
  efficiency: number;
  specialization: string;
  defenseRating?: number;
  currentProduction?: string;
  productionTurnsLeft?: number;
  loyalty?: number;
}

export interface Citizen {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F' | 'NB';
  occupation: string;
  district: string;
  educationLevel: 'Basic' | 'Secondary' | 'Higher' | 'Specialist' | 'Quantum/AI';
  lifeStage?: 'Child' | 'Teen' | 'Adult' | 'Senior';
  wealthTier?: 'Penniless' | 'Poor' | 'Modest' | 'Comfortable' | 'Wealthy';
  homeAddress?: string;
  workplaceAddress?: string;
  commuteTimeMin?: number;
  happiness: number; // 0 - 100
  health: number; // 0 - 100
  income: number; // annual
  aiAssistanceUsage: number; // 0 - 100 %
  status: 'Optimal' | 'Content' | 'Stressed' | 'Critical';
  avatarUrl?: string;
  needs?: {
    food: number;
    water: number;
    energy: number;
    luxury: number;
    order: number;
  };
  taxContribution?: number;
  lifepathEvents?: CitizenLifepathEvent[];
}

export type TechEra = 'Foundational' | 'Industrial' | 'Digital' | 'Synthetic / AI';
export type TechCategory =
  | 'Agriculture'
  | 'Medicine'
  | 'Engineering'
  | 'Artificial Intelligence'
  | 'Robotics'
  | 'Energy'
  | 'Transportation'
  | 'Education'
  | 'Environmental Science'
  | 'Governance';

export interface Technology {
  id: string;
  name: string;
  category: TechCategory;
  era: TechEra;
  costResearchPoints: number;
  progress: number; // 0 - cost
  isResearched: boolean;
  isAvailable: boolean;
  description: string;
  effects: string[];
  prerequisites: string[]; // tech IDs
  unlocks: string[]; // tech IDs
  iconName: string;
  eurekaCondition?: string;
  isEurekaBoosted?: boolean;
  turnsToComplete?: number;
  unlockedIcons?: string[];
}

export interface Policy {
  id: string;
  name: string;
  category:
    | 'Education'
    | 'Healthcare'
    | 'AI Access'
    | 'Automation'
    | 'Universal Basic Income'
    | 'Environmental Protection'
    | 'Resource Equality'
    | 'Economic Regulation';
  description: string;
  costPoliticalCapital: number;
  maintenanceCostCredits: number;
  isActive: boolean;
  expectedBenefits: string[];
  risks: string[];
  durationDays: number;
  sliderValue: number; // 0 to 100
  sliderLabel: string;
  minVal: number;
  maxVal: number;
  unit: string;
  effectsSummary: {
    gdpModifier: number; // %
    happinessModifier: number; // points
    stabilityModifier: number; // points
    environmentModifier: number; // points
  };
}

export interface ScenarioProjectionPoint {
  year: number;
  population: number;
  gdp: number;
  happiness: number;
  stability: number;
  environmentalIndex: number;
}

export interface SimulationScenario {
  id: string;
  title: string;
  codeName: string;
  tagline: string;
  description: string;
  grcCost: number;
  horizonYears: number;
  policyFocus: string;
  riskRating: 'Low' | 'Moderate' | 'High' | 'Severe';
  confidenceScore: number;
  projections: ScenarioProjectionPoint[];
  keyOutcomes: string[];
}

export interface Experiment {
  id: string;
  title: string;
  researchQuestion: string;
  hypothesis: string;
  experimentalGroups: {
    name: string;
    description: string;
    sampleSize: number;
    aiExposure: string;
  }[];
  independentVariables: string[];
  evaluationMetrics: string[];
  grcCost: number;
  durationDays: number;
  currentDay: number;
  status: 'Draft' | 'Active' | 'Completed' | 'Analyzing';
  findings?: string;
  dataPoints?: {
    exposureMonth: number;
    cognitiveIndependence: number; // 0 - 100
    problemSolvingVelocity: number; // 0 - 100
    creativeDivergence: number; // 0 - 100
  }[];
}

export interface Achievement {
  id: string;
  title: string;
  category: 'Milestone' | 'Technology' | 'Economy' | 'Sustainability' | 'Social';
  description: string;
  rewardGrc: number;
  progress: number;
  maxProgress: number;
  isUnlocked: boolean;
  unlockedAtDate?: string;
  iconName: string;
}

export interface GameEvent {
  id: string;
  year: number;
  day: number;
  title: string;
  description: string;
  category: 'crisis' | 'breakthrough' | 'economic' | 'environmental' | 'diplomatic';
  severity: 'info' | 'warning' | 'critical' | 'success';
  isRead: boolean;
}

export interface CivilizationProfile {
  id: string;
  name: string;
  planet: string;
  era: TechEra;
  level: number;
  xp: number;
  xpToNextLevel: number;
  leaderTitle: string;
  governanceModel: string;
  foundingYear: number;
  currentYear: number;
  currentDay: number;
  terrainType: 'Verdant River Valley' | 'Highland Plateau' | 'Archipelago' | 'Boreal Basin' | 'Arid Oasis';
  climateType: 'Temperate' | 'Subtropical' | 'Subpolar' | 'Continental';
}

export interface ProtestOption {
  id: string;
  label: string;
  flavorQuote: string;
  costGrc?: number;
  effectDescription: string;
  outcomeType: 'carnival' | 'reform' | 'bribe' | 'speech';
  happinessDelta: number;
  stabilityDelta: number;
}

export interface ProtestEvent {
  id: string;
  title: string;
  historicalTwin: string;
  historicalContext: string;
  faction: string;
  leaderName: string;
  leaderTitle: string;
  leaderAvatar: string;
  demands: string;
  slogans: string[];
  districtId: string;
  districtName: string;
  options: ProtestOption[];
}

// ================= AAA PROGRESSION, CHRONICLE & RESEARCH WALLET =================

export type HistoricalEra =
  | 'Settlement Age'
  | 'Agricultural Age'
  | 'Industrial Age'
  | 'Knowledge Age'
  | 'Digital Age'
  | 'Advanced Civilisation';

export type MissionCategory =
  | 'Founding'
  | 'Population'
  | 'Infrastructure'
  | 'Economic'
  | 'Research'
  | 'Environmental'
  | 'Technology'
  | 'Long-term';

export type MissionStatus = 'Available' | 'In Progress' | 'Completed' | 'Claimed' | 'Expired';

export interface CivoraMission {
  id: string;
  title: string;
  category: MissionCategory;
  description: string;
  requirements: string;
  progress: number;
  maxProgress: number;
  rewardCrc: number;
  rewardXp: number;
  status: MissionStatus;
  expiresInDays?: number;
}

export type ChronicleCategory =
  | 'Founding'
  | 'Milestone'
  | 'Breakthrough'
  | 'Policy'
  | 'Economic'
  | 'Environmental'
  | 'Crisis'
  | 'Ascension';

export interface ChronicleEntry {
  id: string;
  year: number;
  day: number;
  era: string;
  title: string;
  category: ChronicleCategory;
  description: string;
  sealUrl?: string;
  relatedDistrict?: string;
  relatedPolicy?: string;
  relatedTech?: string;
  impactSummary: string;
}

export interface ResearchTransaction {
  id: string;
  timestamp: string;
  simYear: number;
  simDay: number;
  type: 'Reward' | 'Experiment' | 'Scenario' | 'Grant' | 'Facility Upgrade';
  description: string;
  amount: number; // positive = credit, negative = debit
  balanceAfter: number;
  status: 'Confirmed' | 'Pending' | 'Settled';
}


