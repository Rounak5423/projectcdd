import React from 'react';
import {
  Users,
  TrendingUp,
  Leaf,
  ShieldCheck,
  MapPin,
  Target,
  AlertTriangle,
  ArrowUpRight,
  Hammer,
  GitBranch,
  Sliders,
  Play,
  Sparkles,
  Building2,
  Calendar,
} from 'lucide-react';
import { useGameState } from '../context/GameStateContext';
import ResourcePanel from '../components/dashboard/ResourcePanel';
import ObjectivePanel from '../components/dashboard/ObjectivePanel';

export default function WorldDashboard({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  const {
    civilization,
    resources,
    rates,
    placedBuildings,
    districts,
    achievements,
    events,
    evolutionReport,
    setActiveDrawer,
  } = useGameState();

  const stats = [
    {
      label: 'POPULATION',
      value: `${(resources.population / 1000000).toFixed(3)}M`,
      change: `+${rates.populationGrowthRate}%/yr`,
      icon: Users,
      color: '#a6bd82',
    },
    {
      label: 'GROSS OUTPUT',
      value: `${resources.gdp}B Cr`,
      change: `+${rates.gdpGrowthRate}%/yr`,
      icon: TrendingUp,
      color: '#c6a76a',
    },
    {
      label: 'PUBLIC HAPPINESS',
      value: `${resources.happiness}/100`,
      change: 'Optimal Trajectory',
      icon: Leaf,
      color: '#82bd8e',
    },
    {
      label: 'STABILITY INDEX',
      value: `${resources.stability}/100`,
      change: 'High Civic Order',
      icon: ShieldCheck,
      color: '#82a6bd',
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 overflow-y-auto custom-scrollbar text-[#e8e9e3] max-w-7xl mx-auto">
      {/* Civilisation Command Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[#39443a]">
        <div>
          <span className="eyebrow text-[#c6a76a]">CIVILISATION OVERVIEW & TELEMETRY</span>
          <h1 className="text-2xl lg:text-3xl font-black text-[#f3f5ef] mt-1">
            {civilization.name} Command Deck
          </h1>
          <p className="text-xs text-[#9da99b] mt-1">
            {civilization.governanceModel} · {civilization.climateType} {civilization.terrainType} on {civilization.planet}
          </p>
        </div>

        <div className="sm:text-right">
          <p className="text-[10px] font-mono tracking-wider text-[#9da99b] uppercase">DEVELOPMENT ERA</p>
          <p className="text-base font-bold text-[#c6a76a]">
            Level {civilization.level.toString().padStart(2, '0')} · {civilization.era} Era
          </p>
          <p className="text-xs font-mono text-[#a6bd82] mt-0.5">
            Year {civilization.currentYear.toString().padStart(3, '0')} · Day {civilization.currentDay.toString().padStart(3, '0')}
          </p>
        </div>
      </div>

      {/* Core KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div key={stat.label} className="panel p-4 bg-[#182119] border-[#313f32] hover:border-[#4d614e] transition-all">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono tracking-wider text-[#9da99b]">{stat.label}</span>
                <Icon size={17} style={{ color: stat.color }} />
              </div>

              <p className="text-2xl font-bold font-mono text-[#f3f5ef] mt-3">{stat.value}</p>

              <p className="text-xs text-[#a6bd82] mt-1 font-mono">{stat.change}</p>
            </div>
          );
        })}
      </div>

      {/* Civilization Evolution & Stage Progression Hero Banner */}
      {evolutionReport && (
        <section
          onClick={() => setActiveDrawer('evolution')}
          className="p-4 rounded-xl bg-gradient-to-r from-[#1c271e] via-[#222e23] to-[#182119] border border-[#3b4c3c] hover:border-[#6b8563] transition-all cursor-pointer shadow-lg group"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-[#2a382c] border border-[#506952] flex items-center justify-center text-[#c6a76a] group-hover:scale-105 transition-transform shrink-0">
                <Sparkles size={24} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono tracking-wider text-[#a6bd82] uppercase font-bold">
                    CIVILIZATION STAGE {evolutionReport.currentStage.order} / 6
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-[#2e3e2b] text-[#c6a76a] border border-[#526a4d]">
                    {evolutionReport.currentStage.name}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#f3f5ee] mt-0.5">
                  {evolutionReport.currentStage.subtitle}
                </h3>
                <p className="text-xs text-[#9da99b] mt-0.5">
                  {evolutionReport.nextStage
                    ? `Advancing toward ${evolutionReport.nextStage.name} (${Math.round(evolutionReport.stageProgressPercent)}% requirements fulfilled)`
                    : 'Maximum civilization pinnacle reached.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-48 hidden sm:block">
                <div className="flex justify-between text-[10px] font-mono mb-1 text-[#9da99b]">
                  <span>PROGRESS</span>
                  <span className="font-bold text-[#c6a76a]">
                    {Math.round(evolutionReport.stageProgressPercent)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#121813] overflow-hidden border border-[#2d3a2e]">
                  <div
                    className="h-full bg-gradient-to-r from-[#7a9d60] to-[#c6a76a] transition-all duration-500 rounded-full"
                    style={{ width: `${Math.min(100, evolutionReport.stageProgressPercent)}%` }}
                  />
                </div>
              </div>

              <button className="px-4 py-2 rounded-lg bg-[#314232] group-hover:bg-[#3d523e] text-[#dce9ca] text-xs font-semibold border border-[#526b53] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap">
                <span>Inspect Evolution</span>
                <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Strategic Commodity Stockpiles & Reserve Runway */}
      <ResourcePanel />

      {/* Main Center Grid: 3D Viewport Launcher + Tactical Aside */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-6">
          {/* 3D World Gateway Banner */}
          <section className="panel overflow-hidden bg-[#182119] border-[#313f32] relative group">
            <div className="p-4 border-b border-[#29342a] flex justify-between items-center bg-[#141914]">
              <div>
                <p className="eyebrow text-[#c6a76a]">WORLD EXPLORATION</p>
                <h2 className="text-sm font-bold text-[#f3f5ef] mt-0.5">Living Civilisation 3D Viewport</h2>
              </div>

              <button
                onClick={() => onNavigate('World Explorer')}
                className="text-xs text-[#c6d5b4] hover:text-white flex items-center gap-1 font-semibold transition-colors"
              >
                Launch Fullscreen Viewport <ArrowUpRight size={14} />
              </button>
            </div>

            {/* Viewport Preview Gateway */}
            <div
              onClick={() => onNavigate('World Explorer')}
              className="world-placeholder relative min-h-[340px] flex items-center justify-center cursor-pointer overflow-hidden p-6 text-center"
            >
              <div className="absolute inset-0 world-grid opacity-25" />

              <div className="relative z-10 max-w-md px-6 py-8 rounded-2xl bg-[#151b16]/90 border border-[#3f5240] backdrop-blur-md shadow-2xl group-hover:border-[#a6bd82] transition-all">
                <div className="w-12 h-12 rounded-xl bg-[#2a382c] border border-[#526b54] flex items-center justify-center mx-auto mb-3 text-[#dce9ca]">
                  <MapPin size={24} />
                </div>
                <h3 className="text-lg font-bold text-[#f3f5ef]">
                  Enter Interactive 3D World
                </h3>
                <p className="text-xs text-[#adb8a9] mt-2 leading-relaxed">
                  Real-time React Three Fiber simulation with {placedBuildings.length} deployed facilities across 5 specialized districts. Click to enter orbit camera and placement mode.
                </p>
                <button className="mt-4 px-5 py-2 rounded-xl bg-[#405439] hover:bg-[#526b48] text-[#dce9ca] text-xs font-bold border border-[#6b8563] inline-flex items-center gap-2 shadow-lg">
                  <Play size={13} className="fill-current" />
                  <span>Launch 3D Explorer</span>
                </button>
              </div>
            </div>
          </section>

          {/* Quick Action Dock */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Erect Facility', icon: Hammer, target: 'Infrastructure', color: '#c6a76a' },
              { label: 'Research Tech', icon: GitBranch, target: 'Technology', color: '#82bd8e' },
              { label: 'Enact Policy', icon: Sliders, target: 'Policy Laboratory', color: '#82a6bd' },
              { label: 'Future Simulator', icon: Sparkles, target: 'Future Simulator', color: '#bd9fa6' },
            ].map((btn) => {
              const Icon = btn.icon;
              return (
                <button
                  key={btn.label}
                  onClick={() => onNavigate(btn.target)}
                  className="p-3.5 rounded-xl bg-[#182119] hover:bg-[#202920] border border-[#2f3d30] hover:border-[#4d614e] text-left transition-all flex flex-col justify-between"
                >
                  <Icon size={18} style={{ color: btn.color }} />
                  <span className="text-xs font-bold text-[#f0f3eb] mt-3 block">{btn.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Tactical Summary Column */}
        <aside className="space-y-6">
          {/* Active Objectives */}
          <section className="panel p-4 bg-[#182119] border-[#313f32]">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#29342a]">
              <Target size={16} className="text-[#c6a76a]" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#f3f5ef]">
                Active Civil Mandates
              </h3>
            </div>

            <div className="space-y-3.5">
              {achievements.slice(0, 3).map((ach) => (
                <div key={ach.id}>
                  <div className="flex justify-between text-xs gap-2 mb-1">
                    <span className="text-[#e8e9e3] font-medium text-[11px] truncate">{ach.title}</span>
                    <span className="text-[#c6a76a] font-mono font-bold text-[11px]">
                      {ach.isUnlocked ? 'COMPLETE' : `${Math.round((ach.progress / ach.maxProgress) * 100)}%`}
                    </span>
                  </div>

                  <div className="h-1.5 rounded-full bg-[#121612] overflow-hidden">
                    <div
                      className="h-full bg-[#9eb77a] rounded-full transition-all duration-300"
                      style={{
                        width: ach.isUnlocked
                          ? '100%'
                          : `${Math.min(100, (ach.progress / ach.maxProgress) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Regional District Health Grid */}
          <section className="panel p-4 bg-[#182119] border-[#313f32]">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#29342a]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#c6a76a]">
                District Vitals
              </span>
              <span className="text-[10px] font-mono text-[#9da99b]">5 REGIONS</span>
            </div>

            <div className="space-y-2">
              {districts.map((d) => (
                <div
                  key={d.id}
                  className="p-2.5 rounded-lg bg-[#141914] border border-[#263127] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="font-semibold text-[#f0f3eb] text-[11px]">{d.name}</span>
                  </div>
                  <span className="font-mono text-[#a6bd82] text-[11px]">{d.efficiency}%</span>
                </div>
              ))}
            </div>
          </section>

          {/* Chronicle Alerts */}
          <section className="panel p-4 bg-[#182119] border-[#313f32]">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#29342a]">
              <AlertTriangle size={16} className="text-[#c6a76a]" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#f3f5ef]">
                Chronicle Log
              </h3>
            </div>

            <div className="space-y-2.5">
              {events.slice(0, 2).map((ev) => (
                <div
                  key={ev.id}
                  className={`p-2.5 rounded bg-[#141914] border-l-2 text-xs ${
                    ev.severity === 'success' ? 'border-[#a6bd82]' : 'border-[#c6a76a]'
                  }`}
                >
                  <span className="text-[10px] font-mono text-[#9da99b]">
                    Y{ev.year} · D{ev.day}
                  </span>
                  <p className="font-semibold text-[#f0f3eb] text-[11px] mt-0.5">{ev.title}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
