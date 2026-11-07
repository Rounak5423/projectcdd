import React from 'react';
import {
  Trophy,
  CheckCircle2,
  Lock,
  Coins,
  DollarSign,
  Gift,
  X,
  Sparkles,
} from 'lucide-react';
import { useGameState } from '../../context/GameStateContext';
import { soundFx } from '../../services/soundFx';

interface CS2MilestonesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CS2MilestonesModal({ isOpen, onClose }: CS2MilestonesModalProps) {
  const { cityMilestones, resources } = useGameState();

  if (!isOpen) return null;

  const currentPop = resources.population;
  const nextMilestone = cityMilestones.find((m) => m.popRequired > currentPop) || cityMilestones[cityMilestones.length - 1];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#14181b] border border-[#3b4750] rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-[#ede8dc] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-[#182025] border-b border-[#252f36] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#272113] border border-[#c29b38] flex items-center justify-center text-[#dfb74a]">
              <Trophy size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase font-mono tracking-wide text-[#ede8dc]">
                CITY MILESTONES & REWARDS · CS2
              </h2>
              <p className="text-[10px] text-[#8a8376]">
                Population Growth, Service Unlocks & Development Grants
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-1 rounded-lg text-[#7e8e7c] hover:text-[#ede8dc] hover:bg-[#222a30]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Current Progress Banner */}
        <div className="p-4 bg-[#101416] border-b border-[#242c32] space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span>
              Next Goal: <strong className="text-[#dfb74a]">{nextMilestone.name}</strong>
            </span>
            <span className="text-[#8a8376]">
              {currentPop.toLocaleString()} / {nextMilestone.popRequired.toLocaleString()} Citizens
            </span>
          </div>

          <div className="w-full bg-[#1b2328] h-2.5 rounded-full overflow-hidden border border-[#2b373f]">
            <div
              className="h-full bg-gradient-to-r from-[#8f7742] via-[#dfb74a] to-[#2ecc71] transition-all duration-500"
              style={{
                width: `${Math.min(100, (currentPop / nextMilestone.popRequired) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Milestones Road */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
          {cityMilestones.map((m) => {
            const isReached = currentPop >= m.popRequired;

            return (
              <div
                key={m.level}
                className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                  isReached
                    ? 'bg-[#152119] border-[#2b4c37] shadow-sm'
                    : 'bg-[#14191d] border-[#263138] opacity-75'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      isReached
                        ? 'bg-[#1a3824] text-[#2ecc71] border border-[#2ecc71]'
                        : 'bg-[#1a2227] text-[#6b7985] border border-[#2c3842]'
                    }`}
                  >
                    {isReached ? <CheckCircle2 size={16} /> : <Lock size={13} />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-[#ede8dc]">
                        Milestone {m.level}: {m.name}
                      </h3>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#101518] text-[#8a8376] border border-[#26323a]">
                        Req: {m.popRequired.toLocaleString()} Pop
                      </span>
                    </div>

                    {/* Unlocked Features */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {m.unlockedFeatures.map((feat, i) => (
                        <span
                          key={i}
                          className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-[#192227] text-[#9fb0be] border border-[#2a3842]"
                        >
                          ✓ {feat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Grants */}
                <div className="flex flex-col items-end shrink-0 text-xs font-mono">
                  <span className="text-[#2ecc71] font-bold">+${m.rewardCredits.toLocaleString()}</span>
                  <span className="text-[#dfb74a] text-[11px]">+{m.rewardGrc} GRC</span>
                  <span
                    className={`mt-1.5 text-[8px] uppercase px-1.5 py-0.5 rounded font-bold border ${
                      isReached
                        ? 'bg-[#172d1f] text-[#2ecc71] border-[#295938]'
                        : 'bg-[#171c20] text-[#717e8a] border-[#27323a]'
                    }`}
                  >
                    {isReached ? 'UNLOCKED' : 'LOCKED'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
