/**
 * GENESIS — Advanced Civilization Evolution & Long-Term Simulation Types
 */

import { BuildingCategory, PlacedBuilding, ResourceState, CivilizationProfile, District } from './game';
import { CitySimulationReport } from '../simulation/economySimulationEngine';
import { CitizenSimulationReport } from './citizen';
import { DisasterSimulationState } from './disaster';

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
  category: 'demographics' | 'infrastructure' | 'economy' | 'social' | 'environment';
  currentValue: number | string;
  targetValue: number | string;
  isMet: boolean;
  unit?: string;
  tooltip?: string;
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
  minEnvironmentalIndex: number;
  requiredCategories: BuildingCategory[];
  unlockedOpportunities: string[];
  themeColor: string;
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

export interface DistrictDevelopmentSummary {
  districtId: string;
  name: string;
  population: number;
  buildingsCount: number;
  jobsCapacity: number;
  jobsFilled: number;
  infrastructureHealth: number;
  growthStatus: 'expanding' | 'stable' | 'constrained';
}

export interface DisasterRecoverySummary {
  hasActiveDisaster: boolean;
  activeDisasterType?: string;
  activeDisasterIntensity?: string;
  containmentPercent: number;
  overallDisasterReadiness: number;
  recoveryStatus: 'Nominal' | 'Alert' | 'Emergency Containment' | 'Restoration Phase';
}

export interface CivilizationEvolutionReport {
  currentStage: CivilizationStageConfig;
  nextStage: CivilizationStageConfig | null;
  stageProgressPercent: number; // 0 to 100%
  criteriaChecklist: StageRequirementCriterion[];
  overallCivilizationScore: number; // 0 to 1000 scale
  compositeScore: number; // 0 to 100 scale
  historicalTimeline: HistoricalYearSnapshot[];
  recommendations: DevelopmentRecommendation[];
  districtsSummary: DistrictDevelopmentSummary[];
  disasterRecovery: DisasterRecoverySummary;
  totalYearsSimulated: number;
  lastStageUpgradeYear?: number;
  lastStageUpgradeTitle?: string;
}
