/**
 * GENESIS — Natural Disasters & Intelligent Emergency Response Types
 */

export type DisasterType = 'flood' | 'wildfire' | 'drought' | 'storm' | 'earthquake';

export type DisasterIntensity = 'low' | 'medium' | 'high' | 'critical';

export type DisasterStage = 'idle' | 'warning' | 'active' | 'containing' | 'recovering' | 'resolved';

export interface ActiveDisaster {
  id: string;
  type: DisasterType;
  name: string;
  intensity: DisasterIntensity;
  stage: DisasterStage;
  epicenter: [number, number]; // [x, z] in 3D world coordinates
  radius: number;              // Radius of effect in meters
  districtId: string;
  progressPercent: number;     // 0 to 100%
  containmentPercent: number;  // 0 to 100%
  durationDays: number;
  elapsedDays: number;
  affectedBuildingIds: string[];
  displacedPopulation: number;
  shelteredPopulation: number;
  casualtiesCount: number;
  economicDamageCredits: number;
  estimatedRepairCost: number;
}

export interface DisasterRiskAssessment {
  floodRiskPercent: number;
  wildfireRiskPercent: number;
  droughtRiskPercent: number;
  stormRiskPercent: number;
  seismicRiskPercent: number;
  overallThreatLevel: 'Low' | 'Guarded' | 'Elevated' | 'High' | 'Severe';
}

export interface EmergencyResponseForces {
  medicalUnitsActive: number;
  medicalUnitsTotal: number;
  fireCrewsActive: number;
  fireCrewsTotal: number;
  rescueTeamsActive: number;
  rescueTeamsTotal: number;
  repairEngineersActive: number;
  repairEngineersTotal: number;
  shelterCapacityTotal: number;
  responseEfficiencyPercent: number;
}

export interface DisasterSystemSettings {
  autoDisastersEnabled: boolean;
  disasterFrequency: 'rare' | 'moderate' | 'frequent';
}

export interface DisasterSimulationState {
  activeDisaster: ActiveDisaster | null;
  risks: DisasterRiskAssessment;
  emergencyForces: EmergencyResponseForces;
  settings: DisasterSystemSettings;
  historicalDisasterCount: number;
}

