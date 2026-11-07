import React, { useState } from 'react';
import {
  Trophy,
  Award,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
  Building2,
  BrainCircuit,
  Users,
  Crown,
  Medal,
  X
} from 'lucide-react';
import { useGameState } from '../context/GameStateContext';
import { Achievement } from '../types/game';
import { soundFx } from '../services/soundFx';

interface AchievementsPageProps {
  onClose?: () => void;
}

export const AchievementsPage: React.FC<AchievementsPageProps> = ({ onClose }) => {
  const { achievements, civilization, playerTitles, claimTitle, triggerToast } = useGameState();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredAchievements = achievements.filter((a) =>
    selectedCategory === 'all' ? true : a.category === selectedCategory
  );

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;

  const handleEquipTitle = (title: any) => {
    soundFx.playReward();
    claimTitle(title.id);
    triggerToast({
      type: 'reward',
      title: 'IMPERIAL TITLE EQUIPPED',
      subtitle: `Your sovereign designation is now: ${title.title}`,
    });
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#171D18]/95 backdrop-blur-md text-[#EAE3D2] overflow-hidden select-none font-sans">
      {/* Top Header */}
      <div className="flex-shrink-0 px-8 py-5 border-b border-[#C5A66A]/20 bg-gradient-to-r from-[#171D18] via-[#202820] to-[#171D18] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm border border-[#C5A66A]/40 bg-[#17231B] flex items-center justify-center text-[#C5A66A] shadow-inner">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl text-[#EAE3D2] tracking-wider font-semibold">
                ACHIEVEMENTS & SOVEREIGN HONORS
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-[#C5A66A]/40 text-[#C5A66A] bg-[#C5A66A]/10">
                Imperial Hall of Honors
              </span>
            </div>
            <p className="text-xs text-[#A5AD9D] font-sans mt-0.5">
              Historical triumphs, imperial titles, and epochal milestones commemorating the eternity of {civilization.name}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#171D18] px-3 py-1.5 rounded border border-[#C5A66A]/30 text-xs font-mono">
            <Medal className="w-4 h-4 text-[#C5A66A]" />
            <span className="text-[#A5AD9D]">Unlocked:</span>
            <span className="text-[#EAE3D2] font-bold">{unlockedCount} / {achievements.length}</span>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 border border-[#C5A66A]/30 rounded hover:bg-[#C5A66A]/10 text-[#A5AD9D] hover:text-[#EAE3D2] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 min-h-0 px-8 py-6 overflow-y-auto space-y-8">
        {/* PLAYER TITLES SECTION (PART 5) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="font-serif text-xs uppercase font-bold tracking-wider text-[#C5A66A] flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-[#C5A66A]" />
              SOVEREIGN PLAYER TITLES & HONORS
            </span>
            <span className="text-[11px] font-mono text-[#A5AD9D]">
              Active Leader: <strong className="text-[#EAE3D2]">{civilization.leaderTitle}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {playerTitles.map((t) => {
              const isEquipped = civilization.leaderTitle === t.title;

              return (
                <div
                  key={t.id}
                  className={`p-4 rounded border flex flex-col justify-between transition-all ${
                    isEquipped
                      ? 'bg-[#202820] border-[#C5A66A] shadow-md shadow-[#C5A66A]/10'
                      : t.isUnlocked
                      ? 'bg-[#171D18] border-[#C5A66A]/30 hover:border-[#C5A66A]/60'
                      : 'bg-[#171D18]/50 border-[#C5A66A]/10 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-mono uppercase text-[#C5A66A] font-bold">
                        {t.era || 'Imperium'}
                      </span>
                      {isEquipped ? (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-[#C5A66A] text-[#171D18] font-bold">
                          EQUIPPED
                        </span>
                      ) : t.isUnlocked ? (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-[#8FA879]/20 text-[#8FA879] border border-[#8FA879]/40">
                          UNLOCKED
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-[#A5AD9D]">LOCKED</span>
                      )}
                    </div>
                    <h4 className="font-serif text-sm font-bold text-[#EAE3D2] mt-1">{t.title}</h4>
                    <p className="text-[11px] text-[#A5AD9D] mt-1 line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-2 border-t border-[#C5A66A]/15">
                    {t.isUnlocked ? (
                      <button
                        onClick={() => handleEquipTitle(t)}
                        disabled={isEquipped}
                        className={`w-full py-1 rounded text-xs font-serif uppercase tracking-wider transition-colors ${
                          isEquipped
                            ? 'bg-transparent text-[#C5A66A] cursor-default'
                            : 'bg-[#17231B] hover:bg-[#C5A66A] hover:text-[#171D18] text-[#C5A66A] border border-[#C5A66A]/30'
                        }`}
                      >
                        {isEquipped ? 'Active Title' : 'Equip Title'}
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-[#A5AD9D] block text-center">
                        Requires Milestone
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ACHIEVEMENTS GRID */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#C5A66A]/20 gap-3 mb-4">
            <div>
              <span className="font-serif text-xs uppercase font-bold tracking-wider text-[#C5A66A]">
                HISTORICAL MILESTONE MEDALLIONS
              </span>
              <p className="text-xs text-[#A5AD9D]">Recognized accomplishments awarded by the Imperial Council.</p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {['all', 'Milestone', 'Technology', 'Economy', 'Sustainability', 'Social'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded text-xs font-serif tracking-wide transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#C5A66A] text-[#171D18] font-bold shadow'
                      : 'bg-[#202820] text-[#A5AD9D] border border-[#C5A66A]/20 hover:text-[#EAE3D2]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAchievements.map((ach) => (
              <div
                key={ach.id}
                className={`p-5 rounded flex flex-col justify-between border transition-all ${
                  ach.isUnlocked
                    ? 'bg-[#202820] border-[#C5A66A] shadow-md'
                    : 'bg-[#171D18] border-[#C5A66A]/20 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-mono text-[#C5A66A] uppercase font-bold">
                      {ach.category}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#8FA879]">
                      +{ach.rewardGrc} CRC
                    </span>
                  </div>

                  <h3 className="font-serif text-base font-bold text-[#EAE3D2] mt-2 flex items-center gap-2">
                    {ach.isUnlocked ? (
                      <CheckCircle2 className="w-4 h-4 text-[#8FA879] shrink-0" />
                    ) : (
                      <Trophy className="w-4 h-4 text-[#A5AD9D] shrink-0" />
                    )}
                    <span>{ach.title}</span>
                  </h3>
                  <p className="text-xs text-[#A5AD9D] font-sans mt-1 leading-relaxed">{ach.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#C5A66A]/15">
                  {ach.isUnlocked ? (
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#8FA879]">
                      <span className="flex items-center gap-1 font-serif">
                        <CheckCircle2 className="w-3.5 h-3.5" /> RECORDED IN CHRONICLE
                      </span>
                      <span className="font-bold text-[#C5A66A]">+{ach.rewardGrc} CRC</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-[#A5AD9D]">PROGRESSION</span>
                        <span className="text-[#C5A66A] font-bold">
                          {Math.round((ach.progress / ach.maxProgress) * 100)}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#171D18] overflow-hidden border border-[#C5A66A]/20">
                        <div
                          className="h-full bg-[#C5A66A] rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, (ach.progress / ach.maxProgress) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementsPage;
