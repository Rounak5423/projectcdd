import React from 'react';
import {
  Users,
  TrendingUp,
  Leaf,
  ShieldCheck,
  MapPin,
  Target,
  ArrowUpRight,
  Hammer,
  GitBranch,
  Sliders,
  Play,
  Sparkles,
  Building2,
  Calendar,
  Crown,
  Trophy,
  Rocket,
  Coins,
  CheckCircle2,
} from 'lucide-react';
import { useGameState } from '../context/GameStateContext';
import { soundFx } from '../services/soundFx';

export default function WorldDashboard({
  onNavigate,
  onClose,
}: {
  onNavigate: (page: string) => void;
  onClose?: () => void;
}) {
  const {
    civilization,
    resources,
    rates,
    placedBuildings,
    quests,
    claimQuest,
  } = useGameState();

  const stats = [
    {
      label: 'TOTAL POPULATION',
      value: `${(resources.population / 1000000).toFixed(3)}M`,
      change: `+${rates.populationGrowthRate}%/cycle`,
      icon: Users,
      color: '#7ea376',
    },
    {
      label: 'GROSS PRODUCT (GDP)',
      value: `${resources.gdp}B Cr`,
      change: `+${rates.gdpGrowthRate}%/cycle`,
      icon: TrendingUp,
      color: '#c29b38',
    },
    {
      label: 'PUBLIC HAPPINESS',
      value: `${resources.happiness} / 100`,
      change: 'Harmonious Welfare',
      icon: Leaf,
      color: '#7ea376',
    },
    {
      label: 'CIVIC STABILITY',
      value: `${resources.stability} / 100`,
      change: 'High Order',
      icon: ShieldCheck,
      color: '#5b87a8',
    },
  ];

  const victoryTracks = [
    { name: 'Technological Ascension', progress: 54, icon: Rocket, color: '#5b87a8', req: 'Research Quantum AI & Erect Astronomical Academy' },
    { name: 'Commercial Sovereign', progress: 68, icon: Coins, color: '#c29b38', req: 'Reach 5,000 GRC Treasury & 3 Trade Corridors' },
    { name: 'Biosphere Eden', progress: 82, icon: Leaf, color: '#7ea376', req: 'Maintain 90% Biosphere Purity for 5 Years' },
  ];

  return (
    <div className="p-5 lg:p-7 space-y-5 overflow-y-auto custom-scrollbar text-[#ede8dc] max-w-7xl mx-auto">
      {/* ================= LEADER PROFILE & SETTLEMENT BANNER ================= */}
      <div className="p-4 rounded-lg bg-[#161c20] border border-[#2b353b] shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {/* Leader Emblem */}
          <div className="relative shrink-0">
            <div className="w-13 h-13 rounded-md bg-[#1f262c] border border-[#8f7742] flex items-center justify-center text-[#c29b38] shadow-sm">
              <Crown size={24} />
            </div>
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded bg-[#101416] border border-[#8f7742] text-[9px] font-mono font-bold text-[#dfb74a]">
              L{civilization.level}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg lg:text-xl font-bold text-[#ede8dc] tracking-wide">
                {civilization.name}
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1f272e] text-[#aba393] border border-[#34424d]">
                {civilization.era} Era
              </span>
            </div>
            <p className="text-xs text-[#8a8376] mt-0.5">
              Leader: <span className="text-[#ede8dc] font-semibold">{civilization.leaderTitle}</span> · {civilization.governanceModel} on {civilization.planet}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Level XP Progress */}
          <div className="bg-[#101416] p-3 rounded-md border border-[#232b30] lg:w-72 space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[#8a8376] text-[11px]">Command XP</span>
              <span className="text-[#dfb74a] font-bold text-[11px]">
                {civilization.xp} / {civilization.xpToNextLevel} XP
              </span>
            </div>

            <div className="h-2 rounded-full bg-[#1b2227] overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-[#7ea376] to-[#c29b38] rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (civilization.xp / civilization.xpToNextLevel) * 100)}%`,
                }}
              />
            </div>

            <p className="text-[10px] font-mono text-[#7ea376]">
              ★ Next Level Unlock: Tier {civilization.level + 1} Arcology & Clean Fusion
            </p>
          </div>

          {onClose && (
            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="px-3 py-2 rounded-md bg-[#222b31] hover:bg-[#c94c4c] border border-[#3d4b55] text-xs font-bold text-[#ede8dc] transition-colors flex items-center gap-1.5 shrink-0 shadow-md"
              title="Return to 3D World Viewport (ESC)"
            >
              <span>🌲</span>
              <span className="hidden sm:inline">3D World [ESC]</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= 4 CORE RESOURCE TILES ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="p-3.5 rounded-lg bg-[#161c20] border border-[#2b353b] hover:border-[#445663] transition-all shadow-xs"
            >
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-mono tracking-wider text-[#8a8376]">{stat.label}</span>
                <div
                  className="w-6 h-6 rounded flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <Icon size={13} style={{ color: stat.color }} />
                </div>
              </div>
              <p className="text-xl font-bold text-[#ede8dc] mt-1.5 tracking-tight font-mono">{stat.value}</p>
              <p className="text-[10px] text-[#7ea376] mt-0.5 font-mono">{stat.change}</p>
            </div>
          );
        })}
      </div>

      {/* ================= ACTIVE CAMPAIGN QUESTS & BOUNTIES ================= */}
      <div className="p-4 rounded-lg bg-[#161c20] border border-[#2b353b] space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#252f36]">
          <div className="flex items-center gap-2">
            <Trophy size={15} className="text-[#c29b38]" />
            <h2 className="text-xs font-bold text-[#ede8dc] uppercase tracking-wider">
              Settlement Quests & Directives
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[#dfb74a]">
            Accomplish directives to earn GRC & XP
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {quests.map((q) => (
            <div
              key={q.id}
              className={`p-3 rounded-md border flex flex-col justify-between transition-all ${
                q.isCompleted && !q.isClaimed
                  ? 'bg-[#1b221a] border-[#8f7742] shadow-sm'
                  : q.isClaimed
                  ? 'bg-[#121618] border-[#222a30] opacity-60'
                  : 'bg-[#14191d] border-[#252f36]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold uppercase text-[#8a8376]">
                    {q.category}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[#dfb74a]">
                    +{q.rewardGrc} GRC · +{q.rewardXp} XP
                  </span>
                </div>

                <h3 className="text-xs font-bold text-[#ede8dc] mt-1">{q.title}</h3>
                <p className="text-[11px] text-[#8a8376] mt-0.5">{q.target}</p>

                {/* Progress bar */}
                <div className="mt-2.5 space-y-1">
                  <div className="flex justify-between text-[9px] font-mono">
                    <span className="text-[#8a8376]">Progress</span>
                    <span className="text-[#7ea376] font-bold">
                      {q.progress} / {q.maxProgress}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-[#0e1214] overflow-hidden">
                    <div
                      className="h-full bg-[#7ea376] rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (q.progress / q.maxProgress) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-3 pt-2 border-t border-[#232b31] flex items-center justify-between">
                {q.isClaimed ? (
                  <span className="text-[11px] font-mono font-bold text-[#8a8376] flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-[#7ea376]" /> Claimed
                  </span>
                ) : q.isCompleted ? (
                  <button
                    onClick={() => claimQuest(q.id)}
                    className="w-full py-1.5 rounded btn-game-gold text-xs font-bold flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Sparkles size={12} />
                    <span>CLAIM DIRECTIVE (+{q.rewardGrc} GRC)</span>
                  </button>
                ) : (
                  <span className="text-[10px] font-mono text-[#8a8376]">In Progress...</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= 3D INTERACTIVE SETTLEMENT PREVIEW ================= */}
      <section className="rounded-lg overflow-hidden bg-[#161c20] border border-[#2b353b] shadow-md group">
        <div className="p-3 border-b border-[#252f36] flex justify-between items-center bg-[#121619]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#7ea376] animate-pulse" />
            <h2 className="text-xs font-bold tracking-wider text-[#ede8dc] uppercase">
              3D Settlement Territory ({placedBuildings.length} Municipal Facilities)
            </h2>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onNavigate('World Explorer');
            }}
            className="text-xs font-semibold text-[#dfb74a] hover:text-[#ffffff] flex items-center gap-1 transition-colors"
          >
            <span>Launch Aerial Strategy Viewport</span>
            <ArrowUpRight size={13} />
          </button>
        </div>

        <div
          onClick={() => {
            soundFx.playClick();
            onNavigate('World Explorer');
          }}
          className="relative min-h-[220px] flex items-center justify-center cursor-pointer overflow-hidden p-6 text-center select-none bg-gradient-to-br from-[#1d272c] via-[#161e22] to-[#12181a]"
        >
          <div className="relative z-10 max-w-md px-6 py-5 rounded-lg bg-[#14181b]/95 border border-[#3d4b55] backdrop-blur-md shadow-xl group-hover:border-[#8f7742] transition-colors">
            <div className="w-10 h-10 rounded-md bg-[#1f272e] border border-[#8f7742] flex items-center justify-center mx-auto mb-2.5 text-[#c29b38]">
              <MapPin size={20} />
            </div>

            <h3 className="text-base font-bold text-[#ede8dc] tracking-wide">
              Explore Living 3D Settlement
            </h3>

            <p className="text-xs text-[#8a8376] mt-1.5 leading-relaxed">
              Inspect cobblestone streets, agricultural windmills, and industrial mills with realistic daylight shadows and dynamic camera controls.
            </p>

            <button className="mt-3.5 px-5 py-2 rounded btn-game-gold text-xs font-bold inline-flex items-center gap-1.5 shadow-md">
              <Play size={12} className="fill-current" />
              <span>ENTER 3D WORLD EXPLORER</span>
            </button>
          </div>
        </div>
      </section>

      {/* ================= VICTORY GOALS & QUICK COMMANDS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Victory Paths */}
        <div className="p-4 rounded-lg bg-[#161c20] border border-[#2b353b] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#252f36]">
            <span className="text-xs font-bold text-[#ede8dc] uppercase tracking-wider">
              Civilisation Campaign Milestones
            </span>
            <Rocket size={14} className="text-[#5b87a8]" />
          </div>

          <div className="space-y-2.5">
            {victoryTracks.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.name} className="space-y-1 p-2.5 rounded bg-[#101416] border border-[#22292f]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-semibold text-[#ede8dc]">
                      <Icon size={12} style={{ color: v.color }} />
                      {v.name}
                    </span>
                    <span className="font-mono font-bold text-[11px]" style={{ color: v.color }}>
                      {v.progress}%
                    </span>
                  </div>

                  <div className="h-1.5 rounded-full bg-[#1b2227] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${v.progress}%`, backgroundColor: v.color }}
                    />
                  </div>

                  <p className="text-[10px] text-[#8a8376] font-mono">{v.req}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Strategic Quick Actions */}
        <div className="p-4 rounded-lg bg-[#161c20] border border-[#2b353b] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#252f36]">
            <span className="text-xs font-bold text-[#ede8dc] uppercase tracking-wider">
              Executive Directives
            </span>
            <Sparkles size={13} className="text-[#c29b38]" />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'Erect Architecture', icon: Hammer, target: 'Infrastructure', color: '#c29b38', desc: 'Construct timber mills & municipal works' },
              { label: 'Technology Tree', icon: GitBranch, target: 'Technology', color: '#7ea376', desc: 'Advance paradigms & Eureka moments' },
              { label: 'Policy Cabinet', icon: Sliders, target: 'Policy Laboratory', color: '#5b87a8', desc: 'Slot civics & calibrate social edicts' },
              { label: 'Future Simulator', icon: Sparkles, target: 'Future Simulator', color: '#aa9b8d', desc: 'Model 50-year settlement outcomes' },
            ].map((btn) => {
              const Icon = btn.icon;
              return (
                <button
                  key={btn.label}
                  onClick={() => {
                    soundFx.playClick();
                    onNavigate(btn.target);
                  }}
                  className="p-3 rounded-md bg-[#101416] hover:bg-[#1a2126] border border-[#22292f] hover:border-[#3d4b55] text-left transition-all flex flex-col justify-between group"
                >
                  <Icon size={16} style={{ color: btn.color }} />
                  <div>
                    <span className="text-xs font-semibold text-[#ede8dc] group-hover:text-[#ffffff] transition-colors mt-1.5 block">
                      {btn.label}
                    </span>
                    <span className="text-[10px] text-[#8a8376] line-clamp-1 mt-0.5">{btn.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
