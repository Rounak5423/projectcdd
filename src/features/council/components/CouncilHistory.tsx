import React, { useState } from 'react';
import { CouncilSession } from '../types/council';
import { soundFx } from '../../../services/soundFx';
import {
  Calendar,
  History,
  CheckCircle2,
  XCircle,
  FileText,
  ChevronRight,
  Crown,
  Users,
  Award
} from 'lucide-react';

interface CouncilHistoryProps {
  sessions: CouncilSession[];
  onSelectSession?: (session: CouncilSession) => void;
}

export const CouncilHistory: React.FC<CouncilHistoryProps> = ({
  sessions,
  onSelectSession,
}) => {
  const [inspectedSession, setInspectedSession] = useState<CouncilSession | null>(
    sessions[0] || null
  );

  return (
    <div className="w-full h-full flex flex-col bg-[#151915]/95 border border-[#2B372C] rounded p-5 space-y-4 font-sans select-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#C5A66A]/20">
        <div className="flex items-center gap-2.5">
          <History className="w-5 h-5 text-[#C5A66A]" />
          <div>
            <h2 className="font-serif text-base font-bold text-[#EAE3D2] uppercase tracking-wider">
              Council Assembly Archives & History
            </h2>
            <p className="text-xs text-[#A5AD9D]">
              Authoritative records of sovereign council conclaves, attendee rosters, and ratified imperial decrees.
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono text-[#C5A66A] bg-[#C5A66A]/10 px-2 py-0.5 rounded border border-[#C5A66A]/20">
          {sessions.length} Assemblies
        </span>
      </div>

      {/* Main Split Body: Session List on Left, Detailed Transcript on Right */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[1fr_1.3fr] gap-5 overflow-hidden">
        {/* Left: Session Timeline List */}
        <div className="overflow-y-auto space-y-3 pr-1">
          {sessions.map((sess) => {
            const isSelected = inspectedSession?.id === sess.id;

            return (
              <div
                key={sess.id}
                onClick={() => {
                  soundFx.playClick();
                  setInspectedSession(sess);
                  onSelectSession?.(sess);
                }}
                className={`p-3.5 rounded cursor-pointer border transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#202820] border-[#C5A66A] shadow-md shadow-[#C5A66A]/10 ring-1 ring-[#C5A66A]/30'
                    : 'bg-[#171D18] border-[#2B372C] hover:border-[#C5A66A]/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[10px] text-[#C5A66A] font-bold">
                    ASSEMBLY #{sess.sessionNumber} · YEAR {sess.simYear}, DAY {sess.simDay}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-mono uppercase border ${
                      sess.state === 'Concluded'
                        ? 'border-[#8FA879]/30 bg-[#8FA879]/10 text-[#8FA879]'
                        : sess.state === 'Scheduled'
                        ? 'border-[#C5A66A]/30 bg-[#C5A66A]/10 text-[#C5A66A]'
                        : 'border-[#A5AD9D]/30 bg-black/40 text-[#A5AD9D]'
                    }`}
                  >
                    {sess.state}
                  </span>
                </div>

                <h3 className="font-serif text-sm font-bold text-[#EAE3D2] leading-tight">
                  {sess.title}
                </h3>

                <div className="mt-2.5 pt-2 border-t border-[#C5A66A]/10 flex items-center justify-between text-[11px] font-mono text-[#A5AD9D]">
                  <span>{sess.agendaTopics.length} Agenda Items</span>
                  <span>{sess.decisionsRecorded.length} Decrees Ratified</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Detailed Session Transcript & Record */}
        <div className="overflow-y-auto bg-[#171D18] border border-[#2B372C] rounded p-5 space-y-4">
          {inspectedSession ? (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#C5A66A] block">
                  Assembly Transcript #{inspectedSession.sessionNumber}
                </span>
                <h3 className="font-serif text-lg font-bold text-[#EAE3D2] mt-0.5">
                  {inspectedSession.title}
                </h3>
                <div className="flex items-center gap-3 text-xs font-mono text-[#A5AD9D] mt-1">
                  <span>Convened By: <strong className="text-[#EAE3D2]">{inspectedSession.convenedBy}</strong></span>
                  <span>|</span>
                  <span>Time: Year {inspectedSession.simYear}, Day {inspectedSession.simDay}</span>
                </div>
              </div>

              {inspectedSession.openingAddress && (
                <div className="p-3 rounded bg-[#121713] border-l-2 border-[#C5A66A] text-xs font-serif italic text-[#D8CBAA]">
                  "{inspectedSession.openingAddress}"
                </div>
              )}

              {/* Agenda Topics */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#C5A66A] font-bold block">
                  Formal Agenda Topics Deliberated:
                </span>
                <div className="space-y-1">
                  {inspectedSession.agendaTopics.map((topic, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded bg-[#151915] border border-[#2B372C] text-xs text-[#EAE3D2]"
                    >
                      <span className="font-mono text-[10px] text-[#C5A66A]">§{idx + 1}</span>
                      <span>{topic}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decisions Recorded */}
              <div className="space-y-2 pt-2 border-t border-[#C5A66A]/15">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#8FA879] font-bold block">
                  Official Decrees & Decisions Registered ({inspectedSession.decisionsRecorded.length})
                </span>

                {inspectedSession.decisionsRecorded.length === 0 ? (
                  <p className="text-xs text-[#A5AD9D] italic py-1">
                    No binding decisions recorded yet for this assembly session.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {inspectedSession.decisionsRecorded.map((dec) => (
                      <div
                        key={dec.id}
                        className="p-3 rounded bg-[#151915] border border-[#8FA879]/30 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-serif font-bold text-[#EAE3D2]">
                            {dec.recommendationTitle}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold ${
                              dec.outcome === 'Ratified'
                                ? 'bg-[#8FA879]/15 text-[#8FA879]'
                                : 'bg-[#C87569]/15 text-[#C87569]'
                            }`}
                          >
                            {dec.outcome}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#A5AD9D]">{dec.decreeSummary}</p>
                        <span className="text-[9px] font-mono text-[#C5A66A] block pt-1">
                          Sponsored by: {dec.advisorTitle} · Registered: {dec.timestamp}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {inspectedSession.summaryNotes && (
                <div className="p-3 rounded bg-[#121713] border border-[#2B372C] text-xs text-[#A5AD9D]">
                  <strong className="text-[#EAE3D2] block mb-0.5">Sovereign Conclave Closing Notes:</strong>
                  {inspectedSession.summaryNotes}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-xs text-[#A5AD9D]">
              Select a historical session to inspect official proceedings.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CouncilHistory;

