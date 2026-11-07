// CIVORA — Council Sessions and Chamber Types

import { Advisor } from './advisor';
import { CouncilRecommendation } from './recommendation';

export type SessionState = 'Scheduled' | 'In Progress' | 'Concluded' | 'Archived';

export interface CouncilDecision {
  id: string;
  recommendationId: string;
  recommendationTitle: string;
  advisorId: string;
  advisorTitle: string;
  outcome: 'Ratified' | 'Vetoed' | 'Referred to Committee';
  decreeSummary: string;
  timestamp: string;
}

export interface CouncilSession {
  id: string;
  sessionNumber: number;
  simYear: number;
  simDay: number;
  title: string;
  state: SessionState;
  convenedBy: string;
  agendaTopics: string[];
  attendees: string[]; // Advisor IDs
  briefingsDelivered: number;
  recommendationsDiscussed: CouncilRecommendation[];
  decisionsRecorded: CouncilDecision[];
  openingAddress?: string;
  summaryNotes?: string;
  dateConcluded?: string;
}

export interface CreateSessionPayload {
  title: string;
  agendaTopics: string[];
  invitedAdvisorIds: string[];
}

export interface RecordDecisionPayload {
  recommendationId: string;
  outcome: 'Ratified' | 'Vetoed' | 'Referred to Committee';
  decreeSummary: string;
}

export interface CouncilChamberProps {
  selectedAdvisorId: string | null;
  onAdvisorSelect: (advisorId: string) => void;
  advisors: Advisor[];
  activeSession?: CouncilSession | null;
}
