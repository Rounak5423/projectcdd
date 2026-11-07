import React from 'react';
import { CouncilRecommendation } from '../types/recommendation';
import { soundFx } from '../../../services/soundFx';
import {
  FileCheck2,
  AlertTriangle,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Coins,
  Shield,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface RecommendationCardProps {
  recommendation: CouncilRecommendation;
  onReview?: (recId: string, status: 'Accepted' | 'Rejected' | 'Under Review') => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onReview,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const getStatusBadge = (status: CouncilRecommendation['status']) => {
    switch (status) {
      case 'Accepted':
        return 'text-[#8FA879] border-[#8FA879]/40 bg-[#8FA879]/10';
      case 'Implemented':
        return 'text-[#8FA879] border-[#8FA879]/60 bg-[#8FA879]/20 font-bold';
      case 'Proposed':
        return 'text-[#C5A66A] border-[#C5A66A]/40 bg-[#C5A66A]/10';
      case 'Under Review':
        return 'text-[#D6A75E] border-[#D6A75E]/40 bg-[#D6A75E]/10';
      case 'Rejected':
        return 'text-[#C87569] border-[#C87569]/40 bg-[#C87569]/10';
      case 'Expired':
        return 'text-[#A5AD9D] border-[#A5AD9D]/30 bg-black/40';
    }
  };

  const getPriorityBadge = (priority: CouncilRecommendation['priority']) => {
    switch (priority) {
      case 'Urgent':
        return 'text-[#C87569] border-[#C87569]/40 bg-[#C87569]/15 font-bold animate-pulse';
      case 'High':
        return 'text-[#D6A75E] border-[#D6A75E]/40 bg-[#D6A75E]/10';
      case 'Medium':
        return 'text-[#C5A66A] border-[#C5A66A]/30 bg-[#C5A66A]/10';
      case 'Low':
        return 'text-[#A5AD9D] border-[#A5AD9D]/30 bg-black/30';
    }
  };

  return (
    <div className="bg-[#171D18]/90 border border-[#2B372C] hover:border-[#C5A66A]/35 rounded p-4.5 space-y-3.5 transition-all duration-200 select-none font-sans shadow-sm">
      {/* Top Meta Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#C5A66A]">
              {recommendation.advisorTitle}
            </span>
            <span className="text-[10px] font-mono text-[#A5AD9D]">|</span>
            <span className="text-[10px] font-mono text-[#A5AD9D]">
              {recommendation.domain}
            </span>
          </div>
          <h3 className="font-serif text-base font-bold text-[#EAE3D2] leading-tight">
            {recommendation.title}
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${getPriorityBadge(recommendation.priority)}`}>
            {recommendation.priority} Priority
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${getStatusBadge(recommendation.status)}`}>
            {recommendation.status}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-[#A5AD9D] leading-relaxed">
        {recommendation.description}
      </p>

      {/* Benefits & Risks Preview */}
      <div className="p-3 rounded bg-[#121713] border border-[#2B372C] grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#8FA879] block mb-1">
            Expected Benefits
          </span>
          <ul className="space-y-1">
            {recommendation.expectedBenefits.slice(0, 2).map((b, i) => (
              <li key={i} className="text-[11px] text-[#EAE3D2] flex items-start gap-1.5">
                <span className="text-[#8FA879] font-bold">✓</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#D6A75E] block mb-1">
            Potential Systemic Tradeoffs
          </span>
          <ul className="space-y-1">
            {recommendation.potentialRisks.slice(0, 2).map((r, i) => (
              <li key={i} className="text-[11px] text-[#D8CBAA] flex items-start gap-1.5">
                <span className="text-[#D6A75E] font-bold">!</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Expandable Decision Notes & Justification */}
      {isExpanded && (
        <div className="p-3 rounded bg-[#151915] border border-[#C5A66A]/20 space-y-2 text-xs animate-fadeIn">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#C5A66A] block">
              Official Imperial Justification
            </span>
            <p className="text-[#A5AD9D] italic mt-0.5 font-serif text-[11px]">
              "{recommendation.justification}"
            </p>
          </div>

          {recommendation.decisionNotes && (
            <div className="pt-2 border-t border-[#C5A66A]/15">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#8FA879] block">
                Recorded Council Registry Notes:
              </span>
              <p className="text-[#EAE3D2] text-[11px] mt-0.5">
                {recommendation.decisionNotes}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between text-[10px] font-mono text-[#A5AD9D] pt-1">
            <span>Date Filed: {recommendation.dateProposed}</span>
            {recommendation.reviewedDate && <span>Reviewed: {recommendation.reviewedDate}</span>}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="pt-2 border-t border-[#2B372C] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs font-mono text-[#A5AD9D]">
          {recommendation.estimatedCostCrc ? (
            <span className="text-[#C5A66A] flex items-center gap-1">
              <Coins className="w-3 h-3" />
              {recommendation.estimatedCostCrc} CRC
            </span>
          ) : (
            <span>Cost: Nil</span>
          )}

          {recommendation.politicalCapitalReq ? (
            <span className="text-[#8FA879] flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {recommendation.politicalCapitalReq} Cap
            </span>
          ) : null}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[#C5A66A] hover:underline text-[11px] font-serif"
          >
            {isExpanded ? 'Show Less' : 'Full Details'}
          </button>
        </div>

        {/* Action Controls for Demo Review */}
        {onReview && recommendation.status !== 'Implemented' && recommendation.status !== 'Expired' && (
          <div className="flex items-center gap-2">
            {recommendation.status !== 'Under Review' && recommendation.status !== 'Accepted' && (
              <button
                onClick={() => {
                  soundFx.playClick();
                  onReview(recommendation.id, 'Under Review');
                }}
                className="px-2.5 py-1 rounded bg-[#202820] hover:bg-[#283228] border border-[#D6A75E]/30 text-[#D6A75E] text-[10px] font-serif uppercase tracking-wider transition-colors"
              >
                Deliberate
              </button>
            )}

            {recommendation.status !== 'Accepted' && (
              <button
                onClick={() => {
                  soundFx.playClick();
                  onReview(recommendation.id, 'Accepted');
                }}
                className="px-3 py-1 rounded bg-[#C5A66A] hover:bg-[#D8CBAA] text-[#171D18] text-[10px] font-serif font-bold uppercase tracking-wider transition-colors shadow"
              >
                Accept Directive
              </button>
            )}

            {recommendation.status !== 'Rejected' && (
              <button
                onClick={() => {
                  soundFx.playClick();
                  onReview(recommendation.id, 'Rejected');
                }}
                className="px-2.5 py-1 rounded bg-[#171D18] hover:bg-[#C87569]/20 border border-[#C87569]/40 text-[#C87569] text-[10px] font-serif uppercase tracking-wider transition-colors"
              >
                Veto
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationCard;
