import React, { useState } from 'react';
import { Advisor } from '../types/advisor';
import { CouncilRecommendation, CouncilEvaluationResult } from '../types/recommendation';
import { CouncilSession, RecordDecisionPayload, CouncilTradeOffConflict, CouncilOverview } from '../types/council';
import AdvisorRoster from './AdvisorRoster';
import CouncilChamber3D from '../three/CouncilChamber3D';
import AdvisorIntelligencePanel from './AdvisorIntelligencePanel';
import RecommendationPanel from './RecommendationPanel';
import CouncilSessionPanel from './CouncilSessionPanel';
import CouncilHistory from './CouncilHistory';
import CouncilDisagreementsView from './CouncilDisagreementsView';
import EvaluationModal from './EvaluationModal';
import { soundFx } from '../../../services/soundFx';
import {
  Crown,
  Layers,
  FileCheck2,
  Users,
  Compass,
  History,
  X,
  Sparkles,
  Shield,
  HelpCircle,
  Scale
} from 'lucide-react';

interface CouncilLayoutProps {
  advisors: Advisor[];
  recommendations: CouncilRecommendation[];
  sessions: CouncilSession[];
  tradeoffs?: CouncilTradeOffConflict[];
  overview?: CouncilOverview | null;
  selectedAdvisorId: string | null;
  speakingAdvisorId?: string | null;
  isConvoking?: boolean;
  isExecutingId?: string | null;
  evaluationResult?: CouncilEvaluationResult | null;
  onSelectAdvisor: (advisorId: string) => void;
  onHearBriefing?: (advisorId: string) => void;
  onReviewRecommendation: (recId: string, status: 'Accepted' | 'Rejected' | 'Under Review') => void;
  onExecuteRecommendation?: (recId: string) => void;
  onEvaluateOutcome?: (recId: string) => void;
  onCloseEvaluationModal?: () => void;
  onConvokeAdvisors?: () => void;
  onAdoptCompromise?: (tradeoff: CouncilTradeOffConflict) => void;
  onStartSession: (title: string, agenda: string[], invitedAdvisorIds: string[]) => void;
  onRecordDecision: (payload: RecordDecisionPayload) => void;
  onClose?: () => void;
}

export type CouncilViewMode = 'chamber' | 'recommendations' | 'disagreements' | 'sessions' | 'history';

export const CouncilLayout: React.FC<CouncilLayoutProps> = ({
  advisors,
  recommendations,
  sessions,
  tradeoffs = [],
  overview,
  selectedAdvisorId,
  speakingAdvisorId,
  isConvoking = false,
  isExecutingId = null,
  evaluationResult = null,
  onSelectAdvisor,
  onHearBriefing,
  onReviewRecommendation,
  onExecuteRecommendation,
  onEvaluateOutcome,
  onCloseEvaluationModal,
  onConvokeAdvisors,
  onAdoptCompromise,
  onStartSession,
  onRecordDecision,
  onClose,
}) => {
  const [viewMode, setViewMode] = useState<CouncilViewMode>('chamber');

  const selectedAdvisor = advisors.find((a) => a.id === selectedAdvisorId) || advisors[0] || null;
  const activeSession = sessions.find((s) => s.state === 'In Progress' || s.state === 'Scheduled') || null;

  return (
    <div className="relative w-full h-full flex flex-col bg-[#111612]/95 backdrop-blur-md text-[#EAE3D2] overflow-hidden select-none font-sans">
      {/* Top Council Navigation & Imperial Header */}
      <div className="flex-shrink-0 px-8 py-4 border-b border-[#C5A66A]/20 bg-gradient-to-r from-[#171D18] via-[#1D261E] to-[#171D18] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-sm border border-[#C5A66A]/40 bg-[#17231B] flex items-center justify-center text-[#C5A66A] shadow-inner">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-serif text-xl font-bold tracking-wider text-[#EAE3D2]">
                THE COUNCIL OF ADVISORS
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-[#C5A66A]/40 text-[#C5A66A] bg-[#C5A66A]/10">
                Imperial Advisory Directorate
              </span>
            </div>
            <p className="text-xs text-[#A5AD9D] font-sans mt-0.5">
              Six high counselors presiding over Governance, Economy, Knowledge, Infrastructure, Health, and Ecology.
            </p>
          </div>
        </div>

        {/* View Mode Navigation Pills */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 bg-[#151915] border border-[#C5A66A]/30 rounded">
            <button
              onClick={() => {
                soundFx.playClick();
                setViewMode('chamber');
              }}
              className={`px-3.5 py-1.5 rounded text-xs font-serif tracking-wider uppercase transition-all flex items-center gap-1.5 ${
                viewMode === 'chamber'
                  ? 'bg-[#C5A66A] text-[#171D18] font-bold shadow'
                  : 'text-[#A5AD9D] hover:text-[#EAE3D2]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Chamber View</span>
            </button>

            <button
              onClick={() => {
                soundFx.playClick();
                setViewMode('recommendations');
              }}
              className={`px-3.5 py-1.5 rounded text-xs font-serif tracking-wider uppercase transition-all flex items-center gap-1.5 ${
                viewMode === 'recommendations'
                  ? 'bg-[#C5A66A] text-[#171D18] font-bold shadow'
                  : 'text-[#A5AD9D] hover:text-[#EAE3D2]'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Recommendations ({recommendations.length})</span>
            </button>

            <button
              onClick={() => {
                soundFx.playClick();
                setViewMode('disagreements');
              }}
              className={`px-3.5 py-1.5 rounded text-xs font-serif tracking-wider uppercase transition-all flex items-center gap-1.5 ${
                viewMode === 'disagreements'
                  ? 'bg-[#C5A66A] text-[#171D18] font-bold shadow'
                  : 'text-[#A5AD9D] hover:text-[#EAE3D2]'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Disagreements ({tradeoffs.length})</span>
            </button>

            <button
              onClick={() => {
                soundFx.playClick();
                setViewMode('sessions');
              }}
              className={`px-3.5 py-1.5 rounded text-xs font-serif tracking-wider uppercase transition-all flex items-center gap-1.5 ${
                viewMode === 'sessions'
                  ? 'bg-[#C5A66A] text-[#171D18] font-bold shadow'
                  : 'text-[#A5AD9D] hover:text-[#EAE3D2]'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Assembly Conclave</span>
            </button>

            <button
              onClick={() => {
                soundFx.playClick();
                setViewMode('history');
              }}
              className={`px-3.5 py-1.5 rounded text-xs font-serif tracking-wider uppercase transition-all flex items-center gap-1.5 ${
                viewMode === 'history'
                  ? 'bg-[#C5A66A] text-[#171D18] font-bold shadow'
                  : 'text-[#A5AD9D] hover:text-[#EAE3D2]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Archives</span>
            </button>
          </div>

          {onConvokeAdvisors && (
            <button
              onClick={() => {
                soundFx.playClick();
                onConvokeAdvisors();
              }}
              disabled={isConvoking}
              className="px-3.5 py-1.5 rounded bg-[#C5A66A]/20 hover:bg-[#C5A66A]/30 border border-[#C5A66A]/50 text-[#C5A66A] text-xs font-serif font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
              title="Convoke all 6 ministerial advisors to evaluate civilisation snapshot and generate intelligence"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isConvoking ? 'animate-spin' : ''}`} />
              <span>{isConvoking ? 'Convoking Assembly...' : 'Convoke Council'}</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 border border-[#C5A66A]/30 rounded hover:bg-[#C5A66A]/10 text-[#A5AD9D] hover:text-[#EAE3D2] transition-colors"
              title="Return to World View"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 min-h-0 p-6 overflow-hidden">
        {viewMode === 'chamber' && (
          <div className="w-full h-full grid grid-cols-1 lg:grid-cols-[280px_1fr_380px] gap-5 overflow-hidden">
            {/* Left: Council Roster */}
            <div className="h-full overflow-hidden">
              <AdvisorRoster
                advisors={advisors}
                selectedAdvisorId={selectedAdvisorId}
                onAdvisorSelect={onSelectAdvisor}
              />
            </div>

            {/* Centre: 3D Royal Council Chamber */}
            <div className="h-full overflow-hidden">
              <CouncilChamber3D
                advisors={advisors}
                selectedAdvisorId={selectedAdvisorId}
                speakingAdvisorId={speakingAdvisorId}
                onAdvisorSelect={onSelectAdvisor}
              />
            </div>

            {/* Right: Advisor Intelligence Panel */}
            <div className="h-full overflow-hidden">
              <AdvisorIntelligencePanel
                advisor={selectedAdvisor}
                recommendations={recommendations}
                onSelectRecommendation={(recId) => {
                  setViewMode('recommendations');
                }}
                onYieldFloor={onHearBriefing}
                isSpeaking={selectedAdvisor?.id === speakingAdvisorId}
              />
            </div>
          </div>
        )}

        {viewMode === 'recommendations' && (
          <div className="w-full h-full max-w-6xl mx-auto overflow-hidden">
            <RecommendationPanel
              recommendations={recommendations}
              advisors={advisors}
              onReviewRecommendation={onReviewRecommendation}
              onExecuteRecommendation={onExecuteRecommendation}
              onEvaluateOutcome={onEvaluateOutcome}
              isExecutingId={isExecutingId}
            />
          </div>
        )}

        {viewMode === 'disagreements' && (
          <div className="w-full h-full max-w-6xl mx-auto overflow-hidden">
            <CouncilDisagreementsView
              tradeoffs={tradeoffs}
              onAdoptCompromise={onAdoptCompromise}
            />
          </div>
        )}

        {viewMode === 'sessions' && (
          <div className="w-full h-full max-w-6xl mx-auto overflow-hidden">
            <CouncilSessionPanel
              currentSession={activeSession}
              advisors={advisors}
              recommendations={recommendations}
              onStartSession={onStartSession}
              onRecordDecision={onRecordDecision}
              onViewHistory={() => setViewMode('history')}
            />
          </div>
        )}

        {viewMode === 'history' && (
          <div className="w-full h-full max-w-6xl mx-auto overflow-hidden">
            <CouncilHistory sessions={sessions} />
          </div>
        )}
      </div>

      {/* Outcome Evaluation Modal */}
      {evaluationResult && onCloseEvaluationModal && (
        <EvaluationModal
          evaluation={evaluationResult}
          onClose={onCloseEvaluationModal}
        />
      )}
    </div>
  );
};

export default CouncilLayout;

