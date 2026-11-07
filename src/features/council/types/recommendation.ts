// CIVORA — Council Recommendation System Types

export type RecommendationPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type RecommendationStatus =
  | 'Proposed'
  | 'Under Review'
  | 'Accepted'
  | 'Rejected'
  | 'Implemented'
  | 'Expired';

export interface CouncilRecommendation {
  id: string;
  title: string;
  advisorId: string;
  advisorName: string;
  advisorTitle: string;
  domain: string;
  description: string;
  justification: string;
  expectedBenefits: string[];
  potentialRisks: string[];
  estimatedCostCrc?: number;
  politicalCapitalReq?: number;
  priority: RecommendationPriority;
  status: RecommendationStatus;
  dateProposed: string;
  reviewedDate?: string;
  decisionNotes?: string;
  implementationReference?: string;
  category: 'Policy' | 'Infrastructure' | 'Fiscal' | 'Ecological' | 'Research' | 'Civic';
}

export interface CouncilExecutionRecord {
  id: string;
  recommendationId: string;
  worldId: string;
  sessionId?: string;
  executionType: string;
  actionId?: string;
  status: string;
  simTickAtExecution: number;
  simYear: number;
  simDay: number;
  costCredits: number;
  costMaterials: number;
  costEnergy: number;
  baselineMetrics: Record<string, any>;
  outcomeMetrics: Record<string, any>;
  outcomeEvaluation?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface CouncilEvaluationResult {
  recommendationId: string;
  executionId: string;
  title: string;
  status: string;
  executionTick: number;
  currentTick: number;
  ticksElapsed: number;
  baselineMetrics: Record<string, any>;
  currentMetrics: Record<string, any>;
  metricDeltas: Record<string, number>;
  observedOutcomeSummary: string;
  causalityDisclaimer: string;
}

export interface RecommendationReviewPayload {
  recommendationId: string;
  status: 'Accepted' | 'Rejected' | 'Under Review';
  notes?: string;
}

export interface RecommendationExecutePayload {
  recommendationId: string;
  confirmation: boolean;
  executionNotes?: string;
}

