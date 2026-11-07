/**
 * GENESIS — Intelligent Citizens, Happiness & Social Behaviour Types
 */

import { Citizen } from './game';

export type CitizenAgeGroup = 'youth' | 'adult' | 'elder';

export type DailyActivity =
  | 'sleeping'
  | 'morning_commute'
  | 'working'
  | 'studying'
  | 'lunch_break'
  | 'evening_commute'
  | 'recreation_park'
  | 'commercial_shopping'
  | 'home_leisure'
  | 'evacuating_shelter'
  | 'seeking_medical_care';

export interface CitizenNeedItem {
  id: string;
  name: string;
  category: 'vital' | 'social' | 'environmental' | 'infrastructure';
  satisfactionPercent: number; // 0 to 100%
  status: 'critical' | 'deficient' | 'adequate' | 'optimal';
  positiveDrivers: string[];
  negativeDrivers: string[];
  weight: number; // Relative weight in overall Quality of Life calculation
}

export interface CitizenNeedsBreakdown {
  housing: CitizenNeedItem;
  food: CitizenNeedItem;
  water: CitizenNeedItem;
  electricity: CitizenNeedItem;
  healthcare: CitizenNeedItem;
  education: CitizenNeedItem;
  employment: CitizenNeedItem;
  transportation: CitizenNeedItem;
  safety: CitizenNeedItem;
  recreation: CitizenNeedItem;
  environment: CitizenNeedItem;
}

export interface DetailedCitizenAgent extends Citizen {
  ageGroup: CitizenAgeGroup;
  workplaceBuildingId?: string;
  workplaceName?: string;
  residenceBuildingId?: string;
  residenceName?: string;
  currentActivity: DailyActivity;
  currentDestinationName: string;
  commuteSatisfaction: number; // 0 to 100%
  personalNeeds: {
    housing: number;
    healthcare: number;
    recreation: number;
    safety: number;
  };
  grievance?: string;
}

export interface DistrictSocialMetric {
  districtId: string;
  name: string;
  category: string;
  population: number;
  qualityOfLife: number; // 0 to 100
  happiness: number;     // 0 to 100
  safetyIndex: number;   // 0 to 100
  housingCapacity: number;
  housingOccupancyPercent: number;
  jobsCapacity: number;
  jobsFilled: number;
  unemploymentRate: number;
  primaryGrievance?: string;
  citizenSatisfactionTrend: 'rising' | 'stable' | 'declining';
}

export interface CitizenProblemAlert {
  id: string;
  type: 'housing' | 'employment' | 'water' | 'energy' | 'healthcare' | 'pollution' | 'safety' | 'disaster';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  affectedPopulation: number;
  affectedDistrictName: string;
  causeDescription: string;
  recommendedAction: string;
}

export interface CitizenSimulationReport {
  totalPopulation: number;
  workingAgePopulation: number;
  employedCount: number;
  unemployedCount: number;
  employmentRatePercent: number;
  unemploymentRatePercent: number;
  studentsCount: number;
  retireesCount: number;
  
  // Aggregate Happiness & Quality of Life
  overallHappiness: number;       // 0 to 100
  qualityOfLifeIndex: number;     // 0 to 100
  happinessTrend: 'rising' | 'stable' | 'declining';
  
  // Needs satisfaction
  needs: CitizenNeedsBreakdown;
  
  // District-level social metrics
  districts: DistrictSocialMetric[];
  
  // Representative citizen sample
  citizenAgents: DetailedCitizenAgent[];
  
  // Intelligent citizen grievance alerts
  activeProblems: CitizenProblemAlert[];
  
  // Current dominant societal mood
  societalMood: 'Ecstatic' | 'Prosperous' | 'Content' | 'Restless' | 'Distressed';
}
