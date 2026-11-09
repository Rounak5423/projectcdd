// CIVORA — Council Service & API Client Contracts
// Bridges the existing Axios client (apiClient) to future FastAPI endpoints
// with a clean demo-mode adapter fallback.

import { apiClient, ApiResponse } from '../../../services/civilizationApi';
import { apiCache } from '../../../services/apiCache';
import { Advisor, AdvisorBriefingData } from '../types/advisor';
import {
  CouncilRecommendation,
  RecommendationReviewPayload,
  RecommendationExecutePayload,
  CouncilExecutionRecord,
  CouncilEvaluationResult,
} from '../types/recommendation';
import {
  CouncilSession,
  CreateSessionPayload,
  RecordDecisionPayload,
  CouncilDecision,
  CouncilTradeOffConflict,
  CouncilOverview,
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
    return apiCache.deduplicate('council_advisors', async () => {
      try {
        const response = await apiClient.get<ApiResponse<Advisor[]>>('/council/advisors');
        if (response.data && response.data.success && response.data.data) {
          return { data: response.data.data, isDemo: false };
        }
      } catch (err) {
        // Backend not yet deployed; fallback cleanly to demo adapter
      }
      return { data: [...demoAdvisors], isDemo: true };
    }, 8000);
  }

  // 2. GET /api/council/advisors/{advisor_id}
  public async getAdvisorById(advisorId: string): Promise<CouncilServiceResult<Advisor | null>> {
    return apiCache.deduplicate(`council_advisor_${advisorId}`, async () => {
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
    }, 8000);
  }

  // 3. GET /api/council/advisors/{advisor_id}/briefing
  public async getAdvisorBriefing(advisorId: string): Promise<CouncilServiceResult<AdvisorBriefingData | null>> {
    return apiCache.deduplicate(`council_briefing_${advisorId}`, async () => {
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
    }, 5000);
  }

  // 4. GET /api/council/recommendations
  public async getRecommendations(params?: {
    advisorId?: string;
    status?: string;
    priority?: string;
  }): Promise<CouncilServiceResult<CouncilRecommendation[]>> {
    const cacheKey = `council_recs_${params?.advisorId || 'all'}_${params?.status || 'all'}_${params?.priority || 'all'}`;
    return apiCache.deduplicate(cacheKey, async () => {
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
    }, 4000);
  }

  // 5. GET /api/council/sessions
  public async getSessions(): Promise<CouncilServiceResult<CouncilSession[]>> {
    return apiCache.deduplicate('council_sessions', async () => {
      try {
        const response = await apiClient.get<ApiResponse<CouncilSession[]>>('/council/sessions');
        if (response.data && response.data.success && response.data.data) {
          return { data: response.data.data, isDemo: false };
        }
      } catch (err) {
        // Fallback
      }
      return { data: [...demoSessions], isDemo: true };
    }, 4000);
  }

  // 6. POST /api/council/sessions
  public async createSession(payload: CreateSessionPayload): Promise<CouncilServiceResult<CouncilSession>> {
    apiCache.invalidate('council_');
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
    apiCache.invalidate('council_');
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

  // 9. POST /api/council/sessions/{session_id}/convoke
  public async convokeSessionAdvisors(sessionId: string): Promise<CouncilServiceResult<any>> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(`/council/sessions/${sessionId}/convoke`);
      if (response.data && response.data.success && response.data.data) {
        return { data: response.data.data, isDemo: false, message: 'High Council convoked and ministerial analysis delivered.' };
      }
    } catch (err) {
      // Fallback
    }
    return {
      data: {
        advisors: demoAdvisors,
        recommendations: demoRecommendations,
        tradeoffs: [],
      },
      isDemo: true,
      message: 'Demo: Ministerial convocation completed.',
    };
  }

  // 10. GET /api/council/sessions/{session_id}/tradeoffs
  public async getSessionTradeoffs(sessionId: string): Promise<CouncilServiceResult<CouncilTradeOffConflict[]>> {
    try {
      const response = await apiClient.get<ApiResponse<CouncilTradeOffConflict[]>>(`/council/sessions/${sessionId}/tradeoffs`);
      if (response.data && response.data.success && response.data.data) {
        return { data: response.data.data, isDemo: false };
      }
    } catch (err) {
      // Fallback
    }
    const demoTradeoffs: CouncilTradeOffConflict[] = [
      {
        id: 'conflict-treasurer-chancellor-ubi',
        conflictTitle: 'Sovereign Fiscal Liquidity vs Social Wealth Redistribution',
        advisorAId: 'adv-treasurer',
        advisorATitle: 'The Grand Treasurer',
        advisorAStance: 'Cautions that liquid reserves are tight and funding unconditional dividends strains the crown balance sheet.',
        advisorBId: 'adv-chancellor',
        advisorBTitle: 'The High Chancellor',
        advisorBStance: 'Maintains that widening Gini disparity erodes civic stability and generates public unrest.',
        competingObjectives: 'Maintaining sovereign credit reserves vs Compressing wealth inequality',
        potentialConsequences: 'Premature dividend payout risks fiscal insolvency; austerity risks civic unrest.',
        potentialCompromise: 'Phase universal dividend gradually tied to algorithmic productivity surpluses.',
      },
      {
        id: 'conflict-architect-keeper-growth',
        conflictTitle: 'Civic Urban Expansion vs Environmental Conservation',
        advisorAId: 'adv-architect',
        advisorATitle: 'The Royal Architect',
        advisorAStance: 'Demands rapid expansion of heavy infrastructure to meet housing and transport demand.',
        advisorBId: 'adv-keeper',
        advisorBTitle: 'The Keeper of Nature',
        advisorBStance: 'Warns that concrete and steel expansion accelerates carbon emissions and stresses environmental health.',
        competingObjectives: 'Expanding municipal capacity vs Protecting biospheric balance',
        potentialConsequences: 'Overbuilding triggers irreversible ecological degradation; stalling causes housing shortages.',
        potentialCompromise: 'Mandate 35% ecological green buffers on all new infrastructure districts.',
      },
    ];
    return { data: demoTradeoffs, isDemo: true };
  }

  // 11. GET /api/council/overview/{world_id}
  public async getCouncilOverview(worldId: string = 'aurora-prime'): Promise<CouncilServiceResult<CouncilOverview | null>> {
    return apiCache.deduplicate(`council_overview_${worldId}`, async () => {
      try {
        const response = await apiClient.get<ApiResponse<CouncilOverview>>(`/council/overview/${worldId}`);
        if (response.data && response.data.success && response.data.data) {
          return { data: response.data.data, isDemo: false };
        }
      } catch (err) {
        // Fallback
      }
      const demoOverview: CouncilOverview = {
        worldId,
        overallCivilisationAssessment: 'The Council is in active quorum. Six ministerial departments are reporting live telemetry.',
        advisorStatuses: {},
        pendingRecommendationsCount: demoRecommendations.filter((r) => r.status === 'Proposed' || r.status === 'Under Review').length,
        acceptedAwaitingExecutionCount: demoRecommendations.filter((r) => r.status === 'Accepted').length,
        implementedCount: demoRecommendations.filter((r) => r.status === 'Implemented').length,
        disagreementsCount: 2,
        simulationTick: 147,
        dataCompletenessScore: 92.5,
        criticalFindings: [],
        importantWarnings: [],
      };
      return { data: demoOverview, isDemo: true };
    }, 4000);
  }

  // 12. POST /api/council/recommendations/{recommendation_id}/execute
  public async executeRecommendation(
    payload: RecommendationExecutePayload
  ): Promise<CouncilServiceResult<CouncilExecutionRecord | null>> {
    apiCache.invalidate('council_');
    try {
      const response = await apiClient.post<ApiResponse<CouncilExecutionRecord>>(
        `/council/recommendations/${payload.recommendationId}/execute`,
        payload
      );
      if (response.data && response.data.success && response.data.data) {
        return { data: response.data.data, isDemo: false, message: 'Recommendation executed into live simulation.' };
      }
    } catch (err: any) {
      if (err.response?.data?.detail) {
        throw new Error(err.response.data.detail);
      }
    }

    // Demo mode execution
    const rec = demoRecommendations.find((r) => r.id === payload.recommendationId);
    if (!rec) {
      throw new Error('Recommendation not found');
    }
    if (rec.status !== 'Accepted') {
      throw new Error(`Cannot execute: recommendation status is ${rec.status}. Must be Accepted.`);
    }

    rec.status = 'Implemented';
    rec.implementationReference = `exec_demo_${Date.now()}`;

    const demoRecord: CouncilExecutionRecord = {
      id: rec.implementationReference,
      recommendationId: rec.id,
      worldId: 'aurora-prime',
      executionType: 'policy',
      actionId: 'clean_energy_subsidies',
      status: 'implemented',
      simTickAtExecution: 147,
      simYear: 12,
      simDay: 147,
      costCredits: rec.estimatedCostCrc || 250,
      costMaterials: 0,
      costEnergy: 0,
      baselineMetrics: {
        treasury: 1000,
        happiness: 0.75,
        civic_stability: 0.77,
      },
      outcomeMetrics: {},
      outcomeEvaluation: 'Demo baseline captured.',
      createdAt: new Date().toISOString(),
    };

    return { data: demoRecord, isDemo: true, message: 'Demo: Recommendation executed.' };
  }

  // 13. GET /api/council/recommendations/{recommendation_id}/evaluation
  public async getRecommendationEvaluation(
    recommendationId: string
  ): Promise<CouncilServiceResult<CouncilEvaluationResult | null>> {
    try {
      const response = await apiClient.get<ApiResponse<CouncilEvaluationResult>>(
        `/council/recommendations/${recommendationId}/evaluation`
      );
      if (response.data && response.data.success && response.data.data) {
        return { data: response.data.data, isDemo: false };
      }
    } catch (err) {
      // Fallback
    }

    const rec = demoRecommendations.find((r) => r.id === recommendationId);
    const demoEval: CouncilEvaluationResult = {
      recommendationId,
      executionId: rec?.implementationReference || 'exec_demo_01',
      title: rec?.title || 'Council Directive',
      status: rec?.status || 'Implemented',
      executionTick: 147,
      currentTick: 152,
      ticksElapsed: 5,
      baselineMetrics: {
        happiness: 0.75,
        civic_stability: 0.77,
        treasury: 1200,
      },
      currentMetrics: {
        happiness: 0.78,
        civic_stability: 0.81,
        treasury: 950,
      },
      metricDeltas: {
        happiness: 0.03,
        civic_stability: 0.04,
        treasury: -250,
      },
      observedOutcomeSummary: 'Observed shifts across 5 simulation ticks: Stability (+0.040), Happiness (+0.030), Treasury (-250 CRC).',
      causalityDisclaimer: 'Observed metrics reflect broader civilisational progression and should not be conflated with exclusive direct causality.',
    };
    return { data: demoEval, isDemo: true };
  }

  // 14. POST /api/council/sessions/{session_id}/complete
  public async completeSession(
    sessionId: string,
    summary?: string
  ): Promise<CouncilServiceResult<CouncilSession | null>> {
    try {
      const response = await apiClient.post<ApiResponse<CouncilSession>>(
        `/council/sessions/${sessionId}/complete`,
        null,
        { params: { summary } }
      );
      if (response.data && response.data.success && response.data.data) {
        return { data: response.data.data, isDemo: false, message: 'Council session concluded and decrees archived.' };
      }
    } catch (err) {
      // Fallback
    }

    let updated: CouncilSession | null = null;
    demoSessions = demoSessions.map((s) => {
      if (s.id === sessionId) {
        updated = {
          ...s,
          state: 'Concluded',
          summaryNotes: summary || s.summaryNotes,
        };
        return updated;
      }
      return s;
    });
    return { data: updated, isDemo: true, message: 'Demo: Council session concluded.' };
  }

  // Reset demo state helper
  public resetDemoState() {
    demoAdvisors = [...initialCouncilAdvisors];
    demoRecommendations = [...initialCouncilRecommendations];
    demoSessions = [...initialCouncilSessions];
  }
}

export const councilService = new CouncilService();

