// CIVORA — Council Service & API Client Contracts
// Bridges the existing Axios client (apiClient) to future FastAPI endpoints
// with a clean demo-mode adapter fallback.

import { apiClient, ApiResponse } from '../../../services/civilizationApi';
import { Advisor, AdvisorBriefingData } from '../types/advisor';
import {
  CouncilRecommendation,
  RecommendationReviewPayload,
} from '../types/recommendation';
import {
  CouncilSession,
  CreateSessionPayload,
  RecordDecisionPayload,
  CouncilDecision,
} from '../types/council';
import {
  initialCouncilAdvisors,
  initialCouncilRecommendations,
  initialCouncilSessions,
} from '../mocks/councilDemoData';

// In-memory demo state for frontend demonstration mode
let demoAdvisors: Advisor[] = [...initialCouncilAdvisors];
let demoRecommendations: CouncilRecommendation[] = [...initialCouncilRecommendations];
let demoSessions: CouncilSession[] = [...initialCouncilSessions];

export interface CouncilServiceResult<T> {
  data: T;
  isDemo: boolean;
  message?: string;
}

export class CouncilService {
  private useDemoFallback: boolean = true;

  public setDemoMode(enabled: boolean) {
    this.useDemoFallback = enabled;
  }

  public isDemoMode(): boolean {
    return this.useDemoFallback;
  }

  // 1. GET /api/council/advisors
  public async getAdvisors(): Promise<CouncilServiceResult<Advisor[]>> {
    try {
      const response = await apiClient.get<ApiResponse<Advisor[]>>('/council/advisors');
      if (response.data && response.data.success && response.data.data) {
        return { data: response.data.data, isDemo: false };
      }
    } catch (err) {
      // Backend not yet deployed; fallback cleanly to demo adapter
    }
    return { data: [...demoAdvisors], isDemo: true };
  }

  // 2. GET /api/council/advisors/{advisor_id}
  public async getAdvisorById(advisorId: string): Promise<CouncilServiceResult<Advisor | null>> {
    try {
      const response = await apiClient.get<ApiResponse<Advisor>>(`/council/advisors/${advisorId}`);
      if (response.data && response.data.success && response.data.data) {
        return { data: response.data.data, isDemo: false };
      }
    } catch (err) {
      // Fallback
    }
    const found = demoAdvisors.find((a) => a.id === advisorId) || null;
    return { data: found, isDemo: true };
  }

  // 3. GET /api/council/advisors/{advisor_id}/briefing
  public async getAdvisorBriefing(advisorId: string): Promise<CouncilServiceResult<AdvisorBriefingData | null>> {
    try {
      const response = await apiClient.get<ApiResponse<AdvisorBriefingData>>(`/council/advisors/${advisorId}/briefing`);
      if (response.data && response.data.success && response.data.data) {
        return { data: response.data.data, isDemo: false };
      }
    } catch (err) {
      // Fallback
    }
    const advisor = demoAdvisors.find((a) => a.id === advisorId);
    return { data: advisor ? advisor.currentBriefing : null, isDemo: true };
  }

  // 4. GET /api/council/recommendations
  public async getRecommendations(params?: {
    advisorId?: string;
    status?: string;
    priority?: string;
  }): Promise<CouncilServiceResult<CouncilRecommendation[]>> {
    try {
      const response = await apiClient.get<ApiResponse<CouncilRecommendation[]>>('/council/recommendations', {
        params,
      });
      if (response.data && response.data.success && response.data.data) {
        return { data: response.data.data, isDemo: false };
      }
    } catch (err) {
      // Fallback
    }

    let filtered = [...demoRecommendations];
    if (params?.advisorId) {
      filtered = filtered.filter((r) => r.advisorId === params.advisorId);
    }
    if (params?.status && params.status !== 'all') {
      filtered = filtered.filter((r) => r.status === params.status);
    }
    if (params?.priority && params.priority !== 'all') {
      filtered = filtered.filter((r) => r.priority === params.priority);
    }

    return { data: filtered, isDemo: true };
  }

  // 5. GET /api/council/sessions
  public async getSessions(): Promise<CouncilServiceResult<CouncilSession[]>> {
    try {
      const response = await apiClient.get<ApiResponse<CouncilSession[]>>('/council/sessions');
      if (response.data && response.data.success && response.data.data) {
        return { data: response.data.data, isDemo: false };
      }
    } catch (err) {
      // Fallback
    }
    return { data: [...demoSessions], isDemo: true };
  }

  // 6. POST /api/council/sessions
  public async createSession(payload: CreateSessionPayload): Promise<CouncilServiceResult<CouncilSession>> {
    try {
      const response = await apiClient.post<ApiResponse<CouncilSession>>('/council/sessions', payload);
      if (response.data && response.data.success && response.data.data) {
        return { data: response.data.data, isDemo: false, message: 'Council session scheduled successfully.' };
      }
    } catch (err) {
      // Fallback
    }

    const newSession: CouncilSession = {
      id: `sess-${Date.now()}`,
      sessionNumber: demoSessions.length + 1,
      simYear: 12,
      simDay: 147,
      title: payload.title || `Council Session #${demoSessions.length + 1}`,
      state: 'In Progress',
      convenedBy: 'The Sovereign High Directorate',
      agendaTopics: payload.agendaTopics,
      attendees: payload.invitedAdvisorIds,
      briefingsDelivered: payload.invitedAdvisorIds.length,
      recommendationsDiscussed: demoRecommendations.filter((r) => r.status === 'Proposed' || r.status === 'Under Review'),
      decisionsRecorded: [],
      openingAddress: 'The Imperial Council is officially convened to review high state matters.',
    };

    demoSessions = [newSession, ...demoSessions];
    return { data: newSession, isDemo: true, message: 'Demo: Council session convened in royal chambers.' };
  }

  // 7. POST /api/council/sessions/{session_id}/decisions
  public async recordSessionDecision(
    sessionId: string,
    payload: RecordDecisionPayload
  ): Promise<CouncilServiceResult<CouncilDecision>> {
    try {
      const response = await apiClient.post<ApiResponse<CouncilDecision>>(
        `/council/sessions/${sessionId}/decisions`,
        payload
      );
      if (response.data && response.data.success && response.data.data) {
        return { data: response.data.data, isDemo: false, message: 'Decision registered into Imperial Archives.' };
      }
    } catch (err) {
      // Fallback
    }

    const targetRec = demoRecommendations.find((r) => r.id === payload.recommendationId);
    const newDecision: CouncilDecision = {
      id: `dec-${Date.now()}`,
      recommendationId: payload.recommendationId,
      recommendationTitle: targetRec ? targetRec.title : 'Council Directive',
      advisorId: targetRec ? targetRec.advisorId : 'adv-chancellor',
      advisorTitle: targetRec ? targetRec.advisorTitle : 'The Crown',
      outcome: payload.outcome,
      decreeSummary: payload.decreeSummary,
      timestamp: 'Year 12 · Day 147',
    };

    // Update in-memory session
    demoSessions = demoSessions.map((s) => {
      if (s.id === sessionId) {
        return {
          ...s,
          decisionsRecorded: [...s.decisionsRecorded, newDecision],
        };
      }
      return s;
    });

    // Update recommendation status: Accepted does NOT automatically mean Implemented
    if (targetRec) {
      if (payload.outcome === 'Ratified') {
        targetRec.status = 'Accepted';
        targetRec.decisionNotes = payload.decreeSummary;
      } else if (payload.outcome === 'Vetoed') {
        targetRec.status = 'Rejected';
        targetRec.decisionNotes = payload.decreeSummary;
      } else {
        targetRec.status = 'Under Review';
      }
    }

    return { data: newDecision, isDemo: true, message: 'Demo: Decision registered in Imperial Ledger.' };
  }

  // 8. POST /api/council/recommendations/{recommendation_id}/review
  public async reviewRecommendation(
    recommendationId: string,
    payload: RecommendationReviewPayload
  ): Promise<CouncilServiceResult<CouncilRecommendation | null>> {
    try {
      const response = await apiClient.post<ApiResponse<CouncilRecommendation>>(
        `/council/recommendations/${recommendationId}/review`,
        payload
      );
      if (response.data && response.data.success && response.data.data) {
        return { data: response.data.data, isDemo: false, message: 'Recommendation reviewed.' };
      }
    } catch (err) {
      // Fallback
    }

    let updated: CouncilRecommendation | null = null;
    demoRecommendations = demoRecommendations.map((r) => {
      if (r.id === recommendationId) {
        updated = {
          ...r,
          status: payload.status,
          decisionNotes: payload.notes || r.decisionNotes,
          reviewedDate: 'Year 12 · Day 147',
        };
        return updated;
      }
      return r;
    });

    return { data: updated, isDemo: true, message: `Recommendation marked as ${payload.status}.` };
  }

  // Reset demo state helper
  public resetDemoState() {
    demoAdvisors = [...initialCouncilAdvisors];
    demoRecommendations = [...initialCouncilRecommendations];
    demoSessions = [...initialCouncilSessions];
  }
}

export const councilService = new CouncilService();
