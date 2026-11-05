import React from 'react';
import { Target, CheckCircle2, Trophy, Clock, Sparkles, Gift } from 'lucide-react';
import { useGameState } from '../../context/GameStateContext';

export default function ObjectivePanel() {
  const { achievements, claimAchievement, civilization } = useGameState();

  return (
    <div className="panel p-5 bg-[#182119] border-[#313f32] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#29342a]">
        <div className="flex items-center gap-2">
          <Target size={17} className="text-[#c6a76a]" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#f3f5ef]">
            Strategic Objectives & Mandates
          </h3>
        </div>
        <span className="text-[10px] font-mono text-[#c6a76a] font-bold">
          LVL {civilization.level} DIRECTIVES
        </span>
      </div>

      {/* Level XP Bar */}
      <div className="p-3 rounded-lg bg-[#141914] border border-[#263127]">
        <div className="flex justify-between text-xs font-mono mb-1.5">
          <span className="text-[#9da99b]">Civilisation Experience</span>
          <span className="text-[#c6a76a] font-bold">
            {civilization.xp} / {civilization.xpToNextLevel} XP
          </span>
        </div>
        <div className="h-2 rounded-full bg-[#1e271f] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#9eb77a] to-[#c6a76a] rounded-full transition-all duration-300"
            style={{ width: `${(civilization.xp / civilization.xpToNextLevel) * 100}%` }}
          />
        </div>
      </div>

      {/* Objectives List */}
      <div className="space-y-3">
        {achievements.map((ach) => {
          const isComplete = ach.isUnlocked;
          const isClaimable = isComplete && ach.progress < ach.maxProgress;
          const pct = Math.min(100, Math.round((ach.progress / ach.maxProgress) * 100));

          return (
            <div
              key={ach.id}
              className={`p-3 rounded-lg border transition-all ${
                isComplete
                  ? 'bg-[#1b251d] border-[#425941]'
                  : 'bg-[#141914] border-[#263127]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-[#c6a76a] uppercase font-bold">
                      {ach.category}
                    </span>
                    <span className="text-[10px] text-[#9da99b]">·</span>
                    <span className="text-[10px] font-mono text-[#a6bd82] font-semibold">
                      +{ach.rewardGrc} GRC
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[#f3f5ef] mt-0.5">{ach.title}</h4>
                  <p className="text-[11px] text-[#9da99b] mt-0.5 leading-relaxed">
                    {ach.description}
                  </p>
                </div>

                {isComplete && (
                  <CheckCircle2 size={16} className="text-[#a6bd82] shrink-0 mt-1" />
                )}
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-[10px] font-mono mb-1">
                  <span className="text-[#9da99b]">
                    {isComplete ? 'DIRECTIVE RATIFIED' : 'ACTIVE CRITERIA'}
                  </span>
                  <span className={isComplete ? 'text-[#a6bd82] font-bold' : 'text-[#c6a76a]'}>
                    {isComplete ? 'COMPLETED' : `${pct}%`}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[#121612] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isComplete ? 'bg-[#a6bd82]' : 'bg-[#c6a76a]'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

