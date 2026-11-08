import React, { useState } from 'react';
import { CouncilSession, RecordDecisionPayload } from '../types/council';
import { Advisor } from '../types/advisor';
import { CouncilRecommendation } from '../types/recommendation';
import { soundFx } from '../../../services/soundFx';
import {
  Crown,
  Play,
  CheckCircle2,
  XCircle,
  FileText,
  Users,
  Award,
  Sparkles,
  AlertTriangle,
  Send,
  X,
  History
} from 'lucide-react';

interface CouncilSessionPanelProps {
  currentSession: CouncilSession | null;
  advisors: Advisor[];
  recommendations: CouncilRecommendation[];
  onStartSession: (title: string, agenda: string[], invitedAdvisorIds: string[]) => void;
  onRecordDecision: (payload: RecordDecisionPayload) => void;
  onViewHistory: () => void;
}

export const CouncilSessionPanel: React.FC<CouncilSessionPanelProps> = ({
  currentSession,
  advisors,
  recommendations,
  onStartSession,
  onRecordDecision,
  onViewHistory,
}) => {
  const [isConveneModalOpen, setIsConveneModalOpen] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('High Directorate Emergency Conclave');
  const [agendaInput, setAgendaInput] = useState(
    '1. Reviewing Eastern Artisan Petitions\n2. AI Autonomy Quotas & Research Safeguards\n3. Sovereign Treasury Credit Allocation'
  );

  // Selected recommendation to vote on
  const [selectedRecForDecision, setSelectedRecForDecision] = useState<CouncilRecommendation | null>(null);
  const [decisionOutcome, setDecisionOutcome] = useState<'Ratified' | 'Vetoed' | 'Referred to Committee'>('Ratified');
  const [decreeSummary, setDecreeSummary] = useState('');

  const handleConveneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playReward();
    const agendaList = agendaInput
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const allAdvisorIds = advisors.map((a) => a.id);
    onStartSession(sessionTitle, agendaList, allAdvisorIds);
    setIsConveneModalOpen(false);
  };

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecForDecision) return;
    soundFx.playReward();
    onRecordDecision({
      recommendationId: selectedRecForDecision.id,
      outcome: decisionOutcome,
      decreeSummary: decreeSummary || `Sovereign decree ${decisionOutcome.toLowerCase()} by council vote.`,
    });
    setSelectedRecForDecision(null);
    setDecreeSummary('');
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#151915]/95 border border-[#2B372C] rounded p-5 space-y-4 font-sans select-none overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#C5A66A]/20 gap-3">
        <div className="flex items-center gap-2.5">
          <Crown className="w-5 h-5 text-[#C5A66A]" />
          <div>
            <h2 className="font-serif text-base font-bold text-[#EAE3D2] uppercase tracking-wider">
              Council Conclave Session
            </h2>
            <p className="text-xs text-[#A5AD9D]">
              Convene the six advisors to deliberate policy mandates, review field intelligence, and ratify binding imperial decrees.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundFx.playClick();
              onViewHistory();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#171D18] hover:bg-[#202820] border border-[#2B372C] text-xs font-serif text-[#A5AD9D] hover:text-[#EAE3D2] transition-colors"
          >
            <History className="w-3.5 h-3.5 text-[#C5A66A]" />
            <span>Assembly Archives</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setIsConveneModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#C5A66A] hover:bg-[#D8CBAA] text-[#171D18] text-xs font-serif font-bold uppercase tracking-wider transition-colors shadow"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Convene New Session</span>
          </button>
        </div>
      </div>

      {/* Active Session Content */}
      {currentSession ? (
        <div className="flex-1 min-h-0 flex flex-col space-y-4 overflow-y-auto pr-1">
          {/* Session Banner */}
          <div className="p-4 rounded bg-[#171D18] border border-[#C5A66A]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#C5A66A] font-bold">
                  ACTIVE ASSEMBLY #{currentSession.sessionNumber} · YEAR {currentSession.simYear}, DAY {currentSession.simDay}
                </span>
                <span className="w-2 h-2 rounded-full bg-[#8FA879] animate-pulse" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#EAE3D2] mt-0.5">
                {currentSession.title}
              </h3>
              <p className="text-xs text-[#A5AD9D] mt-0.5 font-serif italic">
                "{currentSession.openingAddress}"
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono shrink-0">
              <div className="text-right">
                <span className="text-[10px] text-[#A5AD9D] block">CONVENED ADVISORS</span>
                <span className="text-sm font-bold text-[#C5A66A]">
                  {currentSession.attendees.length} / 6 Present
                </span>
              </div>
            </div>
          </div>

          {/* Agenda & Deliberation Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Agenda Topics */}
            <div className="p-4 rounded bg-[#171D18] border border-[#2B372C] space-y-2.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#C5A66A] font-bold block">
                Session Agenda Topics
              </span>
              <div className="space-y-1.5">
                {currentSession.agendaTopics.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2.5 rounded bg-[#121713] border border-[#2B372C] text-xs text-[#EAE3D2]"
                  >
                    <span className="font-mono text-[10px] text-[#C5A66A]">§{i + 1}</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations up for vote */}
            <div className="p-4 rounded bg-[#171D18] border border-[#2B372C] space-y-2.5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#C5A66A] font-bold block">
                  Recommendations Under Deliberation ({currentSession.recommendationsDiscussed.length})
                </span>
                <div className="space-y-2 mt-2">
                  {currentSession.recommendationsDiscussed.slice(0, 3).map((rec) => (
                    <div
                      key={rec.id}
                      className="p-2.5 rounded bg-[#121713] border border-[#2B372C] flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-serif font-bold text-[#EAE3D2] block">{rec.title}</span>
                        <span className="text-[10px] text-[#A5AD9D] font-mono">{rec.advisorTitle}</span>
                      </div>
                      <button
                        onClick={() => {
                          soundFx.playClick();
                          setSelectedRecForDecision(rec);
                        }}
                        className="px-2.5 py-1 rounded bg-[#202820] hover:bg-[#C5A66A] hover:text-[#171D18] border border-[#C5A66A]/30 text-[#C5A66A] text-[10px] font-serif uppercase tracking-wider transition-colors"
                      >
                        Vote Directive
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <span className="text-[11px] text-[#A5AD9D] italic pt-2">
                Clicking "Vote Directive" registers sovereign ratification or veto into the council ledger.
              </span>
            </div>
          </div>

          {/* Recorded Decisions Section */}
          <div className="p-4 rounded bg-[#171D18] border border-[#2B372C] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#8FA879] font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Decisions Recorded in Current Conclave ({currentSession.decisionsRecorded.length})
              </span>
            </div>

            {currentSession.decisionsRecorded.length === 0 ? (
              <p className="text-xs text-[#A5AD9D] italic py-2">
                No formal decisions recorded yet. Deliberate above recommendations to cast binding sovereign votes.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentSession.decisionsRecorded.map((d) => (
                  <div key={d.id} className="p-3 rounded bg-[#121713] border border-[#8FA879]/30 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-[#EAE3D2]">{d.recommendationTitle}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-mono uppercase font-bold ${
                          d.outcome === 'Ratified'
                            ? 'bg-[#8FA879]/20 text-[#8FA879]'
                            : 'bg-[#C87569]/20 text-[#C87569]'
                        }`}
                      >
                        {d.outcome}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#A5AD9D]">{d.decreeSummary}</p>
                    <span className="text-[9px] font-mono text-[#C5A66A] block pt-1">{d.timestamp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
          <Crown className="w-10 h-10 text-[#C5A66A]/40" />
          <h3 className="font-serif text-lg font-bold text-[#EAE3D2]">No Council Session in Progress</h3>
          <p className="text-xs text-[#A5AD9D] max-w-md">
            The High Directorate chamber is currently in recess. Click "Convene New Session" to summon all six advisors and deliberate state policy.
          </p>
          <button
            onClick={() => {
              soundFx.playClick();
              setIsConveneModalOpen(true);
            }}
            className="px-5 py-2.5 rounded bg-[#C5A66A] hover:bg-[#D8CBAA] text-[#171D18] text-xs font-serif font-bold uppercase tracking-wider transition-colors shadow mt-2"
          >
            Convene Assembly
          </button>
        </div>
      )}

      {/* Modal: Convene Session */}
      {isConveneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-[#202820] border-2 border-[#C5A66A]/50 rounded p-6 font-sans shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#C5A66A]/20">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#C5A66A]" />
                <h3 className="font-serif text-lg font-bold text-[#EAE3D2]">Convene High Council Assembly</h3>
              </div>
              <button onClick={() => setIsConveneModalOpen(false)} className="text-[#A5AD9D] hover:text-[#EAE3D2]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConveneSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#C5A66A] font-serif text-xs mb-1">Assembly Conclave Title</label>
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-[#171D18] border border-[#2B372C] text-[#EAE3D2] focus:outline-none focus:border-[#C5A66A]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#C5A66A] font-serif text-xs mb-1">
                  Agenda Items (One topic per line)
                </label>
                <textarea
                  rows={4}
                  value={agendaInput}
                  onChange={(e) => setAgendaInput(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-[#171D18] border border-[#2B372C] text-[#EAE3D2] focus:outline-none focus:border-[#C5A66A] font-mono text-xs"
                  required
                />
              </div>

              <div className="p-3 rounded bg-[#171D18] border border-[#C5A66A]/20 text-[11px] text-[#A5AD9D]">
                <strong className="text-[#EAE3D2] block mb-0.5">Summoned Attendees:</strong>
                All 6 High Advisors (The Chancellor, Treasurer, Grand Scholar, Royal Architect, High Physician, Keeper of Nature) will assemble with their domain briefings.
              </div>

              <div className="pt-3 border-t border-[#C5A66A]/20 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsConveneModalOpen(false)}
                  className="px-4 py-2 rounded border border-[#2B372C] text-xs font-serif text-[#A5AD9D] hover:text-[#EAE3D2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-[#C5A66A] hover:bg-[#D8CBAA] text-[#171D18] text-xs font-serif font-bold uppercase tracking-wider transition-colors shadow"
                >
                  Summon Assembly
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Vote / Record Decision */}
      {selectedRecForDecision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-[#202820] border-2 border-[#C5A66A]/50 rounded p-6 font-sans shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#C5A66A]/20">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#C5A66A]" />
                <h3 className="font-serif text-lg font-bold text-[#EAE3D2]">Register Sovereign Council Vote</h3>
              </div>
              <button onClick={() => setSelectedRecForDecision(null)} className="text-[#A5AD9D] hover:text-[#EAE3D2]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordSubmit} className="space-y-4 text-xs">
              <div className="p-3 rounded bg-[#171D18] border border-[#2B372C] space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#C5A66A]">Directive Under Review:</span>
                <h4 className="font-serif text-sm font-bold text-[#EAE3D2]">{selectedRecForDecision.title}</h4>
                <p className="text-[11px] text-[#A5AD9D]">{selectedRecForDecision.description}</p>
              </div>

              <div>
                <label className="block text-[#C5A66A] font-serif text-xs mb-1">Sovereign Determination</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Ratified', 'Vetoed', 'Referred to Committee'] as const).map((outcome) => (
                    <button
                      key={outcome}
                      type="button"
                      onClick={() => setDecisionOutcome(outcome)}
                      className={`py-2 rounded text-xs font-serif font-bold transition-all border ${
                        decisionOutcome === outcome
                          ? outcome === 'Ratified'
                            ? 'bg-[#8FA879] text-[#171D18] border-[#8FA879]'
                            : outcome === 'Vetoed'
                            ? 'bg-[#C87569] text-white border-[#C87569]'
                            : 'bg-[#D6A75E] text-[#171D18] border-[#D6A75E]'
                          : 'bg-[#171D18] text-[#A5AD9D] border-[#2B372C]'
                      }`}
                    >
                      {outcome}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[#C5A66A] font-serif text-xs mb-1">Decree Rationale / Notes</label>
                <textarea
                  rows={3}
                  value={decreeSummary}
                  onChange={(e) => setDecreeSummary(e.target.value)}
                  placeholder="Record formal justification for the imperial archives..."
                  className="w-full px-3 py-2 rounded bg-[#171D18] border border-[#2B372C] text-[#EAE3D2] focus:outline-none focus:border-[#C5A66A] font-sans text-xs"
                />
              </div>

              <div className="pt-3 border-t border-[#C5A66A]/20 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRecForDecision(null)}
                  className="px-4 py-2 rounded border border-[#2B372C] text-xs font-serif text-[#A5AD9D] hover:text-[#EAE3D2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-[#C5A66A] hover:bg-[#D8CBAA] text-[#171D18] text-xs font-serif font-bold uppercase tracking-wider transition-colors shadow"
                >
                  Register Binding Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouncilSessionPanel;

