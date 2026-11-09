/**
 * GENESIS — Advanced Civilization Evolution & Long-Term Simulation Types
 */

import { BuildingCategory, PlacedBuilding, ResourceState, CivilizationProfile } from './game';
import { CitySimulationReport } from '../simulation/economySimulationEngine';
import { CitizenSimulationReport } from './citizen';

export type CivilizationStageId =
  | 'settlement'
  | 'village'
  | 'town'
  | 'city'
  | 'metropolis'
  | 'advanced_civilization';

export interface StageRequirementCriterion {
  id: string;
  label: string;
  currentValue: number | string;
  targetValue: number | string;
  isMet: boolean;
  unit?: string;
}

export interface CivilizationStageConfig {
  id: CivilizationStageId;
  order: number;
  name: string;
  subtitle: string;
  description: string;
  minPopulation: number;
  minBuildings: number;
  minHappiness: number;
  minGdpBillion: number;
  minTreasuryCredits: number;
  minQualityOfLife: number;
  requiredCategories: BuildingCategory[];
  unlockedOpportunities: string[];
}

export interface HistoricalYearSnapshot {
  year: number;
  day: number;
  population: number;
  populationGrowthRate: number;
  gdp: number;
  happiness: number;
  qualityOfLife: number;
  treasuryBalance: number;
  netDailyCashFlow: number;
  energyProducedMW: number;
  energyConsumedMW: number;
  waterNet: number;
  environmentalIndex: number;
  activeBuildingsCount: number;
  stageId: CivilizationStageId;
  stageName: string;
  keyMilestoneEvent?: string;
}

export interface DevelopmentRecommendation {
  id: string;
  title: string;
  category: BuildingCategory | 'infrastructure' | 'policy' | 'environment';
  priority: 'critical' | 'high' | 'medium' | 'growth';
  problemStatement: string;
  simulationEvidence: string;
  recommendedAction: string;
  expectedOutcome: string;
  targetDistrictId: string;
  suggestedCatalogId?: string;
  materialsCost?: number;
  creditsCost?: number;
  canExecute: boolean;
}

export interface CivilizationEvolutionReport {
  currentStage: CivilizationStageConfig;
  nextStage: CivilizationStageConfig | null;
  stageProgressPercent: number; // 0 to 100%
  criteriaChecklist: StageRequirementCriterion[];
  overallCivilizationScore: number; // 0 to 1000
  historicalTimeline: HistoricalYearSnapshot[];
  recommendations: DevelopmentRecommendation[];
  totalYearsSimulated: number;
  lastStageUpgradeYear?: number;
  lastStageUpgradeTitle?: string;
}

