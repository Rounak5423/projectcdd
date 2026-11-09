import React, { useState, useEffect } from 'react';
import { Advisor } from '../types/advisor';
import { CouncilRecommendation, CouncilEvaluationResult } from '../types/recommendation';
import { CouncilSession, RecordDecisionPayload, CouncilTradeOffConflict, CouncilOverview } from '../types/council';
import { councilService } from '../services/councilService';
import CouncilLayout from '../components/CouncilLayout';
import { useGameState } from '../../../context/GameStateContext';
import { soundFx } from '../../../services/soundFx';
import { Crown, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';

interface CouncilPageProps {
  onNavigate?: (page: string) => void;
  onClose?: () => void;
}

export const CouncilPage: React.FC<CouncilPageProps> = ({ onNavigate, onClose }) => {
  const { triggerToast, civilization } = useGameState();

  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [recommendations, setRecommendations] = useState<CouncilRecommendation[]>([]);
  const [sessions, setSessions] = useState<CouncilSession[]>([]);
  const [tradeoffs, setTradeoffs] = useState<CouncilTradeOffConflict[]>([]);
  const [overview, setOverview] = useState<CouncilOverview | null>(null);

  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string | null>(null);
  const [speakingAdvisorId, setSpeakingAdvisorId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isConvoking, setIsConvoking] = useState(false);
  const [isExecutingId, setIsExecutingId] = useState<string | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<CouncilEvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(true);

  const worldId = civilization?.id || 'world_alpha_prime';

  // Fetch initial council data
  useEffect(() => {
    let isMounted = true;

    async function loadCouncilData() {
      setIsLoading(true);
      setError(null);
      try {
        const [advisorsRes, recsRes, sessionsRes, overviewRes] = await Promise.all([
          councilService.getAdvisors(),
          councilService.getRecommendations(),
          councilService.getSessions(),
          councilService.getCouncilOverview(worldId).catch(() => ({ data: null, isDemo: true })),
        ]);

        if (isMounted) {
          setAdvisors(advisorsRes.data);
          setRecommendations(recsRes.data);
          setSessions(sessionsRes.data);
          setOverview(overviewRes.data);
          setIsDemoMode(advisorsRes.isDemo);

          if (advisorsRes.data.length > 0) {
            setSelectedAdvisorId(advisorsRes.data[0].id);
          }

          // Fetch tradeoffs if an active session exists
          const activeSess = sessionsRes.data.find(
            (s) => s.state === 'In Progress' || s.state === 'Scheduled'
          );
          if (activeSess) {
            try {
              const tradeRes = await councilService.getSessionTradeoffs(activeSess.id);
              if (isMounted && tradeRes.data) {
                setTradeoffs(tradeRes.data);
              }
            } catch (tErr) {
              // fallback or silent
            }
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to initialize Council data');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCouncilData();

    return () => {
      isMounted = false;
    };
  }, [worldId]);

  const handleSelectAdvisor = (advisorId: string) => {
    setSelectedAdvisorId(advisorId);
  };

  const handleHearBriefing = (advisorId: string) => {
    soundFx.playRewardClaim();
    setSpeakingAdvisorId((prev) => (prev === advisorId ? null : advisorId));
  };

  const handleReviewRecommendation = async (
    recId: string,
    status: 'Accepted' | 'Rejected' | 'Under Review'
  ) => {
    try {
      const res = await councilService.reviewRecommendation(recId, {
        recommendationId: recId,
        status,
      });

      if (res.data) {
        const updated = res.data;
        setRecommendations((prev) =>
          prev.map((r) => (r.id === updated.id ? updated : r))
        );

        triggerToast({
          type: status === 'Accepted' ? 'reward' : 'info',
          title: `COUNCIL DIRECTIVE: ${status.toUpperCase()}`,
          subtitle: `"${updated.title}" is now recorded as ${status}.`,
        });
      }
    } catch (err: any) {
      triggerToast({
        type: 'info',
        title: 'COUNCIL REVIEW FAILED',
        subtitle: err?.message || 'Could not update recommendation status.',
      });
    }
  };

  const handleExecuteRecommendation = async (recId: string) => {
    setIsExecutingId(recId);
    try {
      const res = await councilService.executeRecommendation({
        recommendationId: recId,
        confirmation: true,
        executionNotes: 'Imperial decree ratified and authorized by sovereign authority.',
      });

      if (res.data) {
        setRecommendations((prev) =>
          prev.map((r) =>
            r.id === recId
              ? { ...r, status: 'Implemented', implementationReference: res.data?.id }
              : r
          )
        );

        triggerToast({
          type: 'reward',
          title: 'IMPERIAL DIRECTIVE ENACTED',
          subtitle: `Mandate has been executed into civilization law & infrastructure. Reference: ${res.data.id}`,
        });

        // Refresh overview
        try {
          const ov = await councilService.getCouncilOverview(worldId);
          setOverview(ov.data);
        } catch {
          // ignore
        }
      }
    } catch (err: any) {
      triggerToast({
        type: 'info',
        title: 'EXECUTION FAILED',
        subtitle: err?.response?.data?.detail || err?.message || 'Could not authorize directive execution.',
      });
    } finally {
      setIsExecutingId(null);
    }
  };

  const handleEvaluateOutcome = async (recId: string) => {
    try {
      soundFx.playRewardClaim();
      const res = await councilService.getRecommendationEvaluation(recId);
      if (res.data) {
        setEvaluationResult(res.data);
      }
    } catch (err: any) {
      triggerToast({
        type: 'info',
        title: 'EVALUATION REPORT UNAVAILABLE',
        subtitle: err?.response?.data?.detail || err?.message || 'No post-implementation telemetry available yet.',
      });
    }
  };

  const handleConvokeAdvisors = async () => {
    setIsConvoking(true);
    try {
      // Find or summon an active session
      let targetSession = sessions.find(
        (s) => s.state === 'In Progress' || s.state === 'Scheduled'
      );

      if (!targetSession) {
        const sessRes = await councilService.createSession({
          title: 'Imperial Extraordinary Assembly',
          agendaTopics: ['Comprehensive Simulation Snapshot', 'Multi-Domain Risk Evaluation'],
          invitedAdvisorIds: advisors.map((a) => a.id),
        });
        targetSession = sessRes.data;
        setSessions((prev) => [sessRes.data, ...prev]);
      }

      const convokeRes = await councilService.convokeSessionAdvisors(targetSession.id);
      if (convokeRes.data) {
        const report = convokeRes.data;

        // Refresh recommendations, advisors, tradeoffs
        const [recsRes, advRes, tradeRes, ovRes] = await Promise.all([
          councilService.getRecommendations(),
          councilService.getAdvisors(),
          councilService.getSessionTradeoffs(targetSession.id).catch(() => ({ data: [] })),
          councilService.getCouncilOverview(worldId).catch(() => ({ data: null })),
        ]);

        setRecommendations(recsRes.data);
        setAdvisors(advRes.data);
        if (tradeRes.data) setTradeoffs(tradeRes.data);
        if (ovRes.data) setOverview(ovRes.data);

        triggerToast({
          type: 'eureka',
          title: 'COUNCIL ASSEMBLY CONVOKED',
          subtitle: `All 6 ministerial advisors completed independent multi-domain assessments. ${report.recommendations?.length || 0} proposals submitted.`,
        });
      }
    } catch (err: any) {
      triggerToast({
        type: 'info',
        title: 'CONVOCATION FAILED',
        subtitle: err?.response?.data?.detail || err?.message || 'Advisors failed to convene.',
      });
    } finally {
      setIsConvoking(false);
    }
  };

  const handleAdoptCompromise = (tradeoff: CouncilTradeOffConflict) => {
    soundFx.playReward();
    triggerToast({
      type: 'reward',
      title: 'SYNTHETIC COMPROMISE RATIFIED',
      subtitle: `Sovereign resolution adopted: ${tradeoff.potentialCompromise}`,
    });
  };

  const handleStartSession = async (
    title: string,
    agenda: string[],
    invitedAdvisorIds: string[]
  ) => {
    try {
      const res = await councilService.createSession({
        title,
        agendaTopics: agenda,
        invitedAdvisorIds,
      });

      setSessions((prev) => [res.data, ...prev]);

      triggerToast({
        type: 'reward',
        title: 'COUNCIL CONCLAVE CONVENED',
        subtitle: `Assembly #${res.data.sessionNumber} opened in royal chambers.`,
      });
    } catch (err: any) {
      triggerToast({
        type: 'info',
        title: 'FAILED TO CONVENE COUNCIL',
        subtitle: err?.response?.data?.detail || err?.message || 'Could not summon council assembly.',
      });
    }
  };

  const handleRecordDecision = async (payload: RecordDecisionPayload) => {
    const activeSession = sessions.find((s) => s.state === 'In Progress' || s.state === 'Scheduled');
    if (!activeSession) return;

    try {
      const res = await councilService.recordSessionDecision(activeSession.id, payload);

      // Refresh sessions & recommendations
      const [recsRes, sessRes] = await Promise.all([
        councilService.getRecommendations(),
        councilService.getSessions(),
      ]);

      setRecommendations(recsRes.data);
      setSessions(sessRes.data);

      triggerToast({
        type: payload.outcome === 'Ratified' ? 'reward' : 'info',
        title: `SOVEREIGN DECREE: ${payload.outcome.toUpperCase()}`,
        subtitle: res.data.decreeSummary,
      });
    } catch (err: any) {
      triggerToast({
        type: 'info',
        title: 'DECISION REGISTRATION FAILED',
        subtitle: err?.response?.data?.detail || err?.message || 'Could not register decision in imperial ledger.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#151915] text-[#EAE3D2] space-y-3 font-serif">
        <Crown className="w-8 h-8 text-[#C5A66A] animate-pulse" />
        <h2 className="text-base font-bold uppercase tracking-widest text-[#EAE3D2]">
          Assembling the Imperial Council...
        </h2>
        <span className="text-xs font-mono text-[#A5AD9D]">Verifying ministerial credentials</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#151915] text-[#EAE3D2] p-6 space-y-3 font-sans">
        <AlertTriangle className="w-8 h-8 text-[#C87569]" />
        <h2 className="font-serif text-lg font-bold text-[#EAE3D2]">Council Chamber Disrupted</h2>
        <p className="text-xs text-[#A5AD9D]">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded bg-[#C5A66A] text-[#171D18] text-xs font-serif font-bold uppercase tracking-wider"
        >
          Re-enter Chamber
        </button>
      </div>
    );
  }

  return (
    <CouncilLayout
      advisors={advisors}
      recommendations={recommendations}
      sessions={sessions}
      tradeoffs={tradeoffs}
      overview={overview}
      selectedAdvisorId={selectedAdvisorId}
      speakingAdvisorId={speakingAdvisorId}
      isConvoking={isConvoking}
      isExecutingId={isExecutingId}
      evaluationResult={evaluationResult}
      onSelectAdvisor={handleSelectAdvisor}
      onHearBriefing={handleHearBriefing}
      onReviewRecommendation={handleReviewRecommendation}
      onExecuteRecommendation={handleExecuteRecommendation}
      onEvaluateOutcome={handleEvaluateOutcome}
      onCloseEvaluationModal={() => setEvaluationResult(null)}
      onConvokeAdvisors={handleConvokeAdvisors}
      onAdoptCompromise={handleAdoptCompromise}
      onStartSession={handleStartSession}
      onRecordDecision={handleRecordDecision}
      onClose={onClose}
    />
  );
};

export default CouncilPage;
