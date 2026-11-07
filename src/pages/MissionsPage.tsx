import React, { useState, useMemo } from 'react';
import { useGameState } from '../context/GameStateContext';
import { CivoraMission, MissionCategory, MissionStatus } from '../types/game';
import { soundFx } from '../services/soundFx';
import {
  Target,
  Sparkles,
  Coins,
  Award,
  CheckCircle2,
  Clock,
  Flame,
  Shield,
  Layers,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  X
} from 'lucide-react';

interface MissionsPageProps {
  onClose?: () => void;
}

const CATEGORIES: { id: MissionCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Mandates' },
  { id: 'Founding', label: 'Founding' },
  { id: 'Population', label: 'Population' },
  { id: 'Infrastructure', label: 'Infrastructure' },
  { id: 'Economic', label: 'Economic' },
  { id: 'Research', label: 'Research' },
  { id: 'Environmental', label: 'Ecological' },
  { id: 'Technology', label: 'Technological' },
  { id: 'Long-term', label: 'Grand Epochal' },
];

export const MissionsPage: React.FC<MissionsPageProps> = ({ onClose }) => {
  const { missions, claimMission, civilization } = useGameState();

  const [selectedCategory, setSelectedCategory] = useState<MissionCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter missions
  const filteredMissions = useMemo(() => {
    return missions.filter(m => {
      const matchCat = selectedCategory === 'all' || m.category === selectedCategory;
      const matchStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'claimable' && m.status === 'Completed') ||
        (selectedStatus === 'in_progress' && (m.status === 'In Progress' || m.status === 'Available')) ||
        (selectedStatus === 'claimed' && m.status === 'Claimed');
      const matchSearch =
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.requirements.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchStatus && matchSearch;
    });
  }, [missions, selectedCategory, selectedStatus, searchQuery]);

  const claimableCount = useMemo(() => {
    return missions.filter(m => m.status === 'Completed').length;
  }, [missions]);

  const handleClaim = (mission: CivoraMission) => {
    if (mission.status !== 'Completed') return;
    soundFx.playReward();
    claimMission(mission.id);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#171D18]/95 backdrop-blur-md text-[#EAE3D2] overflow-hidden select-none font-sans">
      {/* Top Header */}
      <div className="flex-shrink-0 px-8 py-5 border-b border-[#C5A66A]/20 bg-gradient-to-r from-[#171D18] via-[#202820] to-[#171D18] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm border border-[#C5A66A]/40 bg-[#17231B] flex items-center justify-center text-[#C5A66A] shadow-inner">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl text-[#EAE3D2] tracking-wider font-semibold">
                MISSIONS & SOVEREIGN MANDATES
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-[#C5A66A]/40 text-[#C5A66A] bg-[#C5A66A]/10">
                Council Directives
              </span>
            </div>
            <p className="text-xs text-[#A5AD9D] font-sans mt-0.5">
              Fulfill imperial objectives to unlock Civilisation XP, Civora Research Credits (CRC), and epochal distinctions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {claimableCount > 0 && (
            <div className="px-3 py-1.5 bg-[#C5A66A]/20 border border-[#C5A66A] rounded text-xs font-serif font-bold text-[#C5A66A] flex items-center gap-2 animate-pulse">
              <Sparkles className="w-4 h-4" />
              <span>{claimableCount} Mandate{claimableCount > 1 ? 's' : ''} Ready to Claim</span>
            </div>
          )}

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

      {/* Filter and Search Bar */}
      <div className="flex-shrink-0 px-8 py-3.5 bg-[#17231B]/70 border-b border-[#C5A66A]/15 flex flex-wrap items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => { soundFx.playClick(); setSelectedCategory(cat.id); }}
                className={`px-3 py-1 rounded text-xs font-serif tracking-wide transition-all ${
                  isSelected
                    ? 'bg-[#C5A66A] text-[#171D18] font-bold shadow'
                    : 'bg-[#202820] text-[#A5AD9D] border border-[#C5A66A]/20 hover:text-[#EAE3D2]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Status & Search */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#A5AD9D]" />
            <input
              type="text"
              placeholder="Search mandates..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-[#202820] border border-[#C5A66A]/30 rounded text-xs text-[#EAE3D2] placeholder-[#A5AD9D]/60 focus:outline-none focus:border-[#C5A66A] w-48"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="bg-[#202820] border border-[#C5A66A]/30 rounded text-xs text-[#EAE3D2] px-3 py-1.5 focus:outline-none focus:border-[#C5A66A]"
          >
            <option value="all">All Statuses</option>
            <option value="claimable">Ready to Claim</option>
            <option value="in_progress">Active / In Progress</option>
            <option value="claimed">Claimed & Concluded</option>
          </select>
        </div>
      </div>

      {/* Missions Grid */}
      <div className="flex-1 min-h-0 px-8 py-6 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-7xl mx-auto">
          {filteredMissions.map(m => {
            const isCompleted = m.status === 'Completed';
            const isClaimed = m.status === 'Claimed';
            const pct = Math.min(100, Math.round((m.progress / m.maxProgress) * 100));

            return (
              <div
                key={m.id}
                className={`relative bg-[#202820]/90 border rounded p-5 flex flex-col justify-between transition-all duration-200 ${
                  isCompleted
                    ? 'border-[#C5A66A] shadow-lg shadow-[#C5A66A]/10'
                    : isClaimed
                    ? 'border-[#8FA879]/30 opacity-75'
                    : 'border-[#C5A66A]/20 hover:border-[#C5A66A]/50'
                }`}
              >
                <div>
                  {/* Category & Status Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#171D18] border border-[#C5A66A]/30 text-[#C5A66A]">
                      {m.category}
                    </span>

                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                      isCompleted
                        ? 'border-[#C5A66A] bg-[#C5A66A]/20 text-[#C5A66A] font-bold'
                        : isClaimed
                        ? 'border-[#8FA879]/40 bg-[#8FA879]/10 text-[#8FA879]'
                        : 'border-[#D6A75E]/30 bg-[#D6A75E]/10 text-[#D6A75E]'
                    }`}>
                      {m.status}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-serif text-lg font-bold text-[#EAE3D2] mt-1">
                    {m.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-[#A5AD9D] font-sans mt-2 line-clamp-3 leading-relaxed">
                    {m.description}
                  </p>

                  {/* Objective Criteria */}
                  <div className="mt-4 p-2.5 bg-[#171D18] border border-[#C5A66A]/15 rounded text-xs text-[#D8CBAA]">
                    <span className="text-[10px] uppercase font-mono text-[#A5AD9D] block mb-0.5">Objective:</span>
                    {m.requirements}
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#A5AD9D]">Progress</span>
                      <span className="font-mono text-[#EAE3D2]">
                        {m.progress.toLocaleString()} / {m.maxProgress.toLocaleString()} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#171D18] rounded-full overflow-hidden border border-[#C5A66A]/20">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isCompleted || isClaimed ? 'bg-[#8FA879]' : 'bg-[#C5A66A]'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Rewards & Action */}
                <div className="mt-5 pt-3 border-t border-[#C5A66A]/15 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 font-mono text-[#C5A66A]">
                      <Coins className="w-3.5 h-3.5" />
                      +{m.rewardCrc} CRC
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[#8FA879]">
                      <Award className="w-3.5 h-3.5" />
                      +{m.rewardXp} XP
                    </span>
                  </div>

                  {isCompleted ? (
                    <button
                      onClick={() => handleClaim(m)}
                      className="px-4 py-1.5 bg-[#C5A66A] hover:bg-[#D8CBAA] text-[#171D18] rounded text-xs font-serif font-bold uppercase tracking-wider transition-all shadow flex items-center gap-1.5 animate-bounce"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Claim</span>
                    </button>
                  ) : isClaimed ? (
                    <span className="flex items-center gap-1 text-xs text-[#8FA879] font-serif">
                      <CheckCircle2 className="w-4 h-4" />
                      Claimed
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#A5AD9D] font-mono">
                      In Progress
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MissionsPage;

