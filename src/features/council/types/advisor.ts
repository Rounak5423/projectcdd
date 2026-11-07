// CIVORA — Council of Advisors Type Definitions

export type AdvisorDomain =
  | 'Governance and Society'
  | 'Economy and Finance'
  | 'Science and Knowledge'
  | 'Infrastructure and Development'
  | 'Health and Wellbeing'
  | 'Environment and Ecology';

export type AdvisorRole =
  | 'chancellor'
  | 'treasurer'
  | 'scholar'
  | 'architect'
  | 'physician'
  | 'keeper';

export type AdvisorStatus = 'Optimal' | 'Stable' | 'Attention Required' | 'Critical';

export interface AdvisorMetric {
  id: string;
  label: string;
  value: string | number;
  trend: 'up' | 'down' | 'neutral';
  status: 'optimal' | 'stable' | 'warning' | 'critical';
  unit?: string;
  description: string;
}

export interface AdvisorObservation {
  id: string;
  title: string;
  detail: string;
  severity: 'info' | 'positive' | 'warning' | 'urgent';
  recordedDate: string;
}

export interface AdvisorRisk {
  id: string;
  name: string;
  probability: 'Low' | 'Moderate' | 'High' | 'Imminent';
  potentialImpact: 'Minor' | 'Moderate' | 'Severe' | 'Catastrophic';
  mitigationStrategy: string;
}

export interface AdvisorBriefingData {
  advisorId: string;
  date: string;
  headline: string;
  formalSpeech: string;
  supportingObservations: AdvisorObservation[];
  proposedDirectives: string[];
  systemicConsequences: string[];
  keyMetrics: AdvisorMetric[];
  confidenceScore: number; // 0 - 100
}

export interface Advisor {
  id: string;
  role: AdvisorRole;
  name: string;
  officialTitle: string;
  domain: AdvisorDomain;
  motto: string;
  portraitSymbol: string;
  accentColor: string;
  status: AdvisorStatus;
  statusSummary: string;
  hasActiveWarning: boolean;
  warningText?: string;
  confidenceScore: number; // 0 - 100
  lastBriefingDate: string;
  responsibilities: string[];
  metrics: AdvisorMetric[];
  currentBriefing: AdvisorBriefingData;
  identifiedRisks: AdvisorRisk[];
}

