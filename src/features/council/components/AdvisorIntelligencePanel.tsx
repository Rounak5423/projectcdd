import React from 'react';
import { Advisor } from '../types/advisor';
import { CouncilRecommendation } from '../types/recommendation';
import AdvisorBriefing from './AdvisorBriefing';
import {
  Shield,
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Award,
  Clock,
  Compass,
  ArrowRight
} from 'lucide-react';

interface AdvisorIntelligencePanelProps {
  advisor: Advisor | null;
  recommendations: CouncilRecommendation[];
  onSelectRecommendation?: (recId: string) => void;
}

export const AdvisorIntelligencePanel: React.FC<AdvisorIntelligencePanelProps> = ({
  advisor,
  recommendations,
  onSelectRecommendation,
}) => {
  if (!advisor) {
    return (
      <div className="w-full h-full bg-[#151915]/90 border border-[#2B372C] rounded p-6 flex flex-col items-center justify-center text-center text-[#A5AD9D]">
        <Compass className="w-8 h-8 text-[#C5A66A]/40 mb-3" />
        <h3 className="font-serif text-sm font-bold text-[#EAE3D2]">No Advisor Selected</h3>
        <p className="text-xs text-[#A5AD9D] mt-1 max-w-xs">
          Select an advisor station from the royal chamber or roster to inspect their intelligence portfolio.
        </p>
      </div>
    );
  }

  // Filter recommendations proposed by this advisor
  const advisorRecommendations = recommendations.filter((r) => r.advisorId === advisor.id);

  const getMetricTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-[#8FA879]" />;
      case 'down':
        return <TrendingDown className="w-3 h-3 text-[#C87569]" />;
      case 'neutral':
        return <Minus className="w-3 h-3 text-[#A5AD9D]" />;
    }
  };

  return (
    <div className="w-full h-full bg-[#151915]/90 border border-[#2B372C] rounded p-5 flex flex-col space-y-5 select-none overflow-y-auto custom-scrollbar font-sans">
      {/* Top Advisor Header & Credentials */}
      <div className="pb-4 border-b border-[#C5A66A]/20 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded border border-[#C5A66A]/40 bg-[#17231B] flex items-center justify-center text-2xl shadow-inner shrink-0">
            {advisor.portraitSymbol}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#C5A66A]">
                {advisor.officialTitle}
              </span>
              <span className="text-[10px] font-mono text-[#A5AD9D]">|</span>
              <span className="text-[10px] font-mono text-[#8FA879]">
                {advisor.confidenceScore}% Confidence
              </span>
            </div>
            <h2 className="font-serif text-lg font-bold text-[#EAE3D2] leading-tight mt-0.5">
              {advisor.name}
            </h2>
            <p className="text-xs text-[#A5AD9D] mt-0.5">
              Domain: <strong className="text-[#D8CBAA]">{advisor.domain}</strong>
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[9px] font-mono text-[#A5AD9D] block">LAST BRIEFING</span>
          <span className="text-[11px] font-mono text-[#EAE3D2] font-semibold">{advisor.lastBriefingDate}</span>
        </div>
      </div>

      {/* Motto / Philosophy Banner */}
      <div className="px-3 py-2 rounded bg-[#121713] border-l-2 border-[#C5A66A] text-xs font-serif italic text-[#D8CBAA]">
        "{advisor.motto}"
      </div>

      {/* Assessment Status Banner */}
      <div className="p-3 rounded bg-[#171D18] border border-[#2B372C] flex items-center justify-between text-xs">
        <div>
          <span className="text-[10px] uppercase font-mono text-[#A5AD9D] block">Current Assessment</span>
          <p className="text-xs text-[#EAE3D2] font-medium mt-0.5">{advisor.statusSummary}</p>
        </div>
        <span
          className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase font-bold shrink-0 ml-3 border ${
            advisor.status === 'Optimal'
              ? 'text-[#8FA879] border-[#8FA879]/30 bg-[#8FA879]/10'
              : advisor.status === 'Attention Required'
              ? 'text-[#D6A75E] border-[#D6A75E]/30 bg-[#D6A75E]/10'
              : 'text-[#A5AD9D] border-[#A5AD9D]/30 bg-[#A5AD9D]/10'
          }`}
        >
          {advisor.status}
        </span>
      </div>

      {/* Domain Key Metrics Grid */}
      <div className="space-y-2">
        <span className="text-[10px] uppercase font-mono tracking-wider text-[#C5A66A] font-bold block">
          Domain Key Telemetry & Metrics
        </span>
        <div className="grid grid-cols-2 gap-2.5">
          {advisor.metrics.map((metric) => (
            <div
              key={metric.id}
              className="p-3 rounded bg-[#171D18] border border-[#2B372C] space-y-1 hover:border-[#C5A66A]/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#A5AD9D] truncate">{metric.label}</span>
                {getMetricTrendIcon(metric.trend)}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-serif text-lg font-bold text-[#EAE3D2]">{metric.value}</span>
                {metric.unit && <span className="text-[10px] font-mono text-[#A5AD9D]">{metric.unit}</span>}
              </div>
              <p className="text-[10px] text-[#A5AD9D]/80 line-clamp-1 leading-tight">
                {metric.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Formal Advisor Briefing */}
      <AdvisorBriefing advisor={advisor} />

      {/* Identified Sector Risks */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#C5A66A] font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-[#D6A75E]" />
            Identified Sector Risks
          </span>
          <span className="text-[10px] font-mono text-[#A5AD9D]">{advisor.identifiedRisks.length} Tracked</span>
        </div>

        <div className="space-y-2">
          {advisor.identifiedRisks.map((risk) => (
            <div
              key={risk.id}
              className="p-3 rounded bg-[#171D18] border border-[#C87569]/25 space-y-1.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-bold text-[#EAE3D2]">{risk.name}</h4>
                <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase">
                  <span className="px-1.5 py-0.2 rounded bg-[#C87569]/15 text-[#C87569]">
                    {risk.probability} Prob
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-black/40 text-[#A5AD9D]">
                    {risk.potentialImpact} Impact
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-[#A5AD9D] leading-relaxed">
                <strong className="text-[#D8CBAA]">Mitigation:</strong> {risk.mitigationStrategy}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Associated Recommendations */}
      <div className="space-y-2 pt-2 border-t border-[#C5A66A]/15">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#C5A66A] font-bold">
            Proposed Council Recommendations ({advisorRecommendations.length})
          </span>
        </div>

        {advisorRecommendations.length === 0 ? (
          <p className="text-xs text-[#A5AD9D] italic py-2">
            No active recommendations currently filed by this advisor.
          </p>
        ) : (
          <div className="space-y-2">
            {advisorRecommendations.map((rec) => (
              <div
                key={rec.id}
                onClick={() => onSelectRecommendation?.(rec.id)}
                className="p-3 rounded bg-[#171D18] border border-[#2B372C] hover:border-[#C5A66A]/40 transition-all cursor-pointer flex items-center justify-between gap-2"
              >
                <div>
                  <h4 className="font-serif text-xs font-bold text-[#EAE3D2] hover:text-[#C5A66A] transition-colors">
                    {rec.title}
                  </h4>
                  <p className="text-[10px] text-[#A5AD9D] line-clamp-1 mt-0.5">
                    {rec.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-mono uppercase border ${
                      rec.status === 'Accepted'
                        ? 'text-[#8FA879] border-[#8FA879]/30 bg-[#8FA879]/10'
                        : rec.status === 'Proposed'
                        ? 'text-[#C5A66A] border-[#C5A66A]/30 bg-[#C5A66A]/10'
                        : 'text-[#A5AD9D] border-[#A5AD9D]/30'
                    }`}
                  >
                    {rec.status}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#A5AD9D]" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvisorIntelligencePanel;
