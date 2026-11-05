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
} from 'lucide-react';
import { useGameState } from '../context/GameStateContext';
import { Achievement } from '../types/game';

export default function AchievementsPage() {
  const { achievements, events, claimAchievement, triggerToast } = useGameState();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredAchievements = achievements.filter((a) =>
    selectedCategory === 'all' ? true : a.category === selectedCategory
  );

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;

  return (
    <div className="p-6 lg:p-8 space-y-6 overflow-y-auto custom-scrollbar text-[#e8e9e3] max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#39443a] gap-4">
        <div>
          <span className="eyebrow text-[#c6a76a]">HALL OF ARCHIVES</span>
          <h1 className="text-2xl font-bold text-[#f3f5ef] mt-0.5">Achievements & Chronicle</h1>
          <p className="text-xs text-[#9da99b] mt-1">
            Historical milestones, crisis records, technological triumphs, and civilisational glory.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#182119] p-3 rounded-xl border border-[#2e3c2f] text-xs font-mono">
          <div>
            <span className="text-[#9da99b] block text-[10px]">UNLOCKED TROPHIES</span>
            <span className="text-sm font-bold text-[#c6a76a]">
              {unlockedCount} / {achievements.length} Completed
            </span>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
        {['all', 'Milestone', 'Technology', 'Economy', 'Sustainability', 'Social'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-[#3b4c37] text-[#dce9ca] border border-[#5d7756] font-semibold'
                : 'bg-[#182019] text-[#8e9c8c] hover:bg-[#202920]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAchievements.map((ach) => (
          <div
            key={ach.id}
            className={`panel p-5 flex flex-col justify-between transition-all ${
              ach.isUnlocked
                ? 'bg-[#1b251d] border-[#445b43] shadow-md'
                : 'bg-[#182019] border-[#2f3d30] opacity-80'
            }`}
          >
            <div>
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-mono text-[#c6a76a] uppercase font-bold">
                  {ach.category}
                </span>
                <span className="text-xs font-mono font-bold text-[#a6bd82]">
                  +{ach.rewardGrc} GRC
                </span>
              </div>

              <h3 className="text-base font-bold text-[#f3f5ef] mt-2 flex items-center gap-2">
                {ach.isUnlocked ? (
                  <CheckCircle2 size={16} className="text-[#a6bd82] shrink-0" />
                ) : (
                  <Trophy size={16} className="text-[#6c7d6a] shrink-0" />
                )}
                <span>{ach.title}</span>
              </h3>
              <p className="text-xs text-[#9da99b] mt-1 leading-relaxed">{ach.description}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#283429]">
              {ach.isUnlocked ? (
                <div className="flex items-center justify-between text-[11px] font-mono text-[#a6bd82]">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={13} /> RECORDED IN CHRONICLE
                  </span>
                  <span className="font-bold text-[#d4af37]">+{ach.rewardGrc} GRC</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-[#9da99b]">PROGRESSION</span>
                    <span className="text-[#c6a76a] font-bold">
                      {Math.round((ach.progress / ach.maxProgress) * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#121612] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#4ade80] to-[#d4af37] rounded-full transition-all duration-300"
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

      {/* Historical Chronicle Feed */}
      <div className="panel p-5 bg-[#182119] border-[#313f32] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#29342a]">
          <div>
            <span className="eyebrow text-[#c6a76a]">CIVILISATIONAL LOGS</span>
            <h3 className="text-base font-bold text-[#f3f5ef] mt-0.5">Historical Events Registry</h3>
          </div>
          <Calendar size={18} className="text-[#c6a76a]" />
        </div>

        <div className="space-y-3">
          {events.map((ev) => (
            <div
              key={ev.id}
              className={`p-3.5 rounded-lg border-l-4 bg-[#141914] ${
                ev.severity === 'success'
                  ? 'border-[#a6bd82]'
                  : ev.severity === 'warning'
                  ? 'border-[#d47e69]'
                  : 'border-[#c6a76a]'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono text-[#9da99b]">
                <span>
                  Year {ev.year.toString().padStart(3, '0')} · Day {ev.day.toString().padStart(3, '0')}
                </span>
                <span className="uppercase text-[10px] font-semibold text-[#a6bd82]">
                  {ev.category}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-[#f0f3eb] mt-1">{ev.title}</h4>
              <p className="text-xs text-[#9da99b] mt-0.5 leading-relaxed">{ev.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
