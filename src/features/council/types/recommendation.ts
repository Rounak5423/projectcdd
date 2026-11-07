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
  category: 'Policy' | 'Infrastructure' | 'Fiscal' | 'Ecological' | 'Research' | 'Civic';
}

export interface RecommendationReviewPayload {
  recommendationId: string;
  status: 'Accepted' | 'Rejected' | 'Under Review';
  notes?: string;
}

