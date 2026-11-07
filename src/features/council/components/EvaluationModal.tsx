import React from 'react';
import { CouncilEvaluationResult } from '../types/recommendation';
import { soundFx } from '../../../services/soundFx';
import {
  FileCheck2,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Scale,
  X,
  AlertCircle,
  Activity,
  CheckCircle2
} from 'lucide-react';

interface EvaluationModalProps {
  evaluation: CouncilEvaluationResult | null;
  onClose: () => void;
}

export const EvaluationModal: React.FC<EvaluationModalProps> = ({ evaluation, onClose }) => {
  if (!evaluation) return null;

  const renderDelta = (key: string, value: number) => {
    const isPositiveGood = key !== 'gini_index' && key !== 'pollution';
    const isUp = value > 0;
    const isDown = value < 0;

    let color = 'text-[#A5AD9D]';
    if (value !== 0) {
      if (isPositiveGood) {
        color = isUp ? 'text-[#8FA879]' : 'text-[#C87569]';
      } else {
        color = isDown ? 'text-[#8FA879]' : 'text-[#C87569]';
      }
    }

    return (
      <span className={`font-mono font-bold ${color}`}>
        {value > 0 ? `+${value}` : value}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none font-sans">
      <div className="relative w-full max-w-2xl bg-[#171D18] border border-[#C5A66A]/50 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#C5A66A]/20 bg-[#121713] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#17231B] border border-[#8FA879]/40 flex items-center justify-center text-[#8FA879]">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#8FA879]">
                  Post-Implementation Analysis
                </span>
                <span className="text-[10px] font-mono text-[#A5AD9D]">|</span>
                <span className="text-[10px] font-mono text-[#C5A66A]">
                  Ref: {evaluation.executionId}
                </span>
              </div>
              <h3 className="font-serif text-base font-bold text-[#EAE3D2]">
                {evaluation.title}
              </h3>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-1.5 rounded hover:bg-[#C5A66A]/10 text-[#A5AD9D] hover:text-[#EAE3D2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Epoch Progression Ribbon */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded bg-[#151915] border border-[#2B372C] text-center">
            <div>
              <span className="text-[10px] uppercase font-mono text-[#A5AD9D] block">
                Execution Epoch
              </span>
              <span className="font-serif text-base font-bold text-[#C5A66A]">
                Tick #{evaluation.executionTick}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-[#A5AD9D] block">
                Current Epoch
              </span>
              <span className="font-serif text-base font-bold text-[#EAE3D2]">
                Tick #{evaluation.currentTick}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-[#A5AD9D] block">
                Observation Window
              </span>
              <span className="font-serif text-base font-bold text-[#8FA879]">
                {evaluation.ticksElapsed} Ticks Elapsed
              </span>
            </div>
          </div>

          {/* Observable Metric Deltas Table */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#C5A66A] font-bold block">
              Observed Macro-Systemic Metric Shifts
            </span>
            <div className="rounded bg-[#121713] border border-[#2B372C] overflow-hidden text-xs">
              <div className="grid grid-cols-4 p-2.5 bg-[#171D18] border-b border-[#2B372C] font-mono text-[10px] text-[#A5AD9D] uppercase">
                <span>Indicator</span>
                <span className="text-right">Baseline</span>
                <span className="text-right">Current</span>
                <span className="text-right">Observable Shift</span>
              </div>

              {Object.entries(evaluation.metricDeltas).map(([k, delta]) => {
                const bVal = evaluation.baselineMetrics[k] ?? '—';
                const cVal = evaluation.currentMetrics[k] ?? '—';
                return (
                  <div
                    key={k}
                    className="grid grid-cols-4 p-2.5 border-b border-[#2B372C]/40 last:border-b-0 hover:bg-[#151915]/50 transition-colors font-mono"
                  >
                    <span className="capitalize text-[#EAE3D2]">{k.replace('_', ' ')}</span>
                    <span className="text-right text-[#A5AD9D]">
                      {typeof bVal === 'number' ? bVal.toFixed(2) : bVal}
                    </span>
                    <span className="text-right text-[#EAE3D2]">
                      {typeof cVal === 'number' ? cVal.toFixed(2) : cVal}
                    </span>
                    <span className="text-right">
                      {renderDelta(k, delta)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Observed Outcome Summary */}
          <div className="p-4 rounded bg-[#17231B] border border-[#8FA879]/30 text-xs space-y-1">
            <div className="flex items-center gap-2 text-[#8FA879] font-bold uppercase font-mono text-[10px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ministerial Outcome Findings</span>
            </div>
            <p className="text-[#EAE3D2] leading-relaxed">
              {evaluation.observedOutcomeSummary}
            </p>
          </div>

          {/* Causality Disclaimer */}
          <div className="p-3 rounded bg-[#151915] border border-[#2B372C] text-[11px] text-[#A5AD9D] flex items-start gap-2 italic">
            <AlertCircle className="w-4 h-4 text-[#D6A75E] shrink-0 mt-0.5" />
            <span>{evaluation.causalityDisclaimer}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#C5A66A]/20 bg-[#121713] flex justify-end">
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded bg-[#C5A66A] text-[#171D18] hover:bg-[#D4B87D] font-serif font-bold text-xs uppercase tracking-wider transition-colors"
          >
            Dismiss Ledger
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvaluationModal;

