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
  | 'environment';

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
}

export interface Citizen {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F' | 'NB';
  occupation: string;
  district: string;
  educationLevel: 'Basic' | 'Secondary' | 'Higher' | 'Specialist' | 'Quantum/AI';
  happiness: number; // 0 - 100
  health: number; // 0 - 100
  income: number; // annual
  aiAssistanceUsage: number; // 0 - 100 %
  status: 'Optimal' | 'Content' | 'Stressed' | 'Critical';
}

export type TechEra = 'Foundational' | 'Industrial' | 'Digital' | 'Synthetic / AI';
export type TechCategory =
  | 'Agriculture'
  | 'Medicine'
  | 'Artificial Intelligence'
  | 'Robotics'
  | 'Energy'
  | 'Transportation'
  | 'Education'
  | 'Environmental Science';

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

