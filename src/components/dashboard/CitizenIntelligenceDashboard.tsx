import React, { useState } from 'react';
import {
  Users,
  Heart,
  GraduationCap,
  Briefcase,
  Activity,
  Home,
  Droplets,
  Zap,
  Wheat,
  Shield,
  ShieldAlert,
  Trees,
  Search,
  Filter,
  X,
  Compass,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  Building2,
  User,
  Coffee,
  Bed,
  Car,
  BookOpen,
} from 'lucide-react';
import { useGameState } from '../../context/GameStateContext';
import {
  CitizenNeedItem,
  DetailedCitizenAgent,
  DailyActivity,
} from '../../types/citizen';

interface CitizenDashboardProps {
  onClose?: () => void;
}

export default function CitizenIntelligenceDashboard({ onClose }: CitizenDashboardProps) {
  const { citizenReport, resources, rates, civilization, disasterState } = useGameState();
  const [activeTab, setActiveTab] = useState<'needs' | 'citizens' | 'districts' | 'grievances'>('needs');
  const [search, setSearch] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<DetailedCitizenAgent | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  const needsList: CitizenNeedItem[] = (citizenReport?.needs ? Object.values(citizenReport.needs) : []) as CitizenNeedItem[];

  const filteredNeeds = needsList.filter((n: CitizenNeedItem) => {
    if (selectedCategoryFilter === 'all') return true;
    return n.category === selectedCategoryFilter;
  });

  const filteredAgents = (citizenReport?.citizenAgents || []).filter((a: DetailedCitizenAgent) => {
    const q = search.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.occupation.toLowerCase().includes(q) ||
      a.district.toLowerCase().includes(q) ||
      a.currentActivity.toLowerCase().includes(q)
    );
  });

  const activityIcons: Record<DailyActivity, React.ElementType> = {
    sleeping: Bed,
    morning_commute: Car,
    working: Briefcase,
    studying: GraduationCap,
    lunch_break: Coffee,
    evening_commute: Car,
    recreation_park: Trees,
    commercial_shopping: Building2,
    home_leisure: Home,
    evacuating_shelter: ShieldAlert,
    seeking_medical_care: Activity,
  };

  const getNeedIcon = (id: string) => {
    switch (id) {
      case 'housing': return Home;
      case 'food': return Wheat;
      case 'water': return Droplets;
      case 'electricity': return Zap;
      case 'healthcare': return Activity;
      case 'education': return GraduationCap;
      case 'employment': return Briefcase;
      case 'transportation': return Car;
      case 'safety': return Shield;
      case 'recreation': return Trees;
      case 'environment': return Sparkles;
      default: return Heart;
    }
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-5xl bg-[#131914]/98 border-2 border-[#364438] rounded-2xl shadow-2xl backdrop-blur-2xl text-[#e8e9e3] flex flex-col max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
    >
      {/* ================= 1. DASHBOARD HEADER ================= */}
      <div className="p-4 sm:p-5 border-b border-[#2b372d] bg-[#18211a]/95 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#243326] border border-[#3f5742] text-[#a6bd82] shadow-inner">
            <Users size={24} className="text-[#a6bd82]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-[#c6a76a] uppercase font-bold">
                SOCIAL MOBILITY & CITIZEN INTELLIGENCE
              </span>
              <span
                className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                  citizenReport.societalMood === 'Ecstatic' || citizenReport.societalMood === 'Prosperous'
                    ? 'bg-[#1b3823] text-[#2ecc71] border border-[#2b5936]'
                    : citizenReport.societalMood === 'Content'
                    ? 'bg-[#332b17] text-[#f1c40f] border border-[#524424]'
                    : 'bg-[#3b1c1c] text-[#e74c3c] border border-[#5e2e2e]'
                }`}
              >
                Mood: {citizenReport.societalMood}
              </span>
            </div>
            <h2 className="text-xl font-black text-[#f3f5ef] tracking-tight">
              Metropolitan Population & Social Vitals
            </h2>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#141b15] border border-[#2d3a2f]">
          <button
            onClick={() => setActiveTab('needs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === 'needs'
                ? 'bg-[#29382b] text-[#f3f5ef] shadow-md border border-[#3d5340]'
                : 'text-[#8e9c8c] hover:text-[#e8e9e3]'
            }`}
          >
            Needs (11)
          </button>
          <button
            onClick={() => setActiveTab('citizens')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === 'citizens'
                ? 'bg-[#29382b] text-[#f3f5ef] shadow-md border border-[#3d5340]'
                : 'text-[#8e9c8c] hover:text-[#e8e9e3]'
            }`}
          >
            Routines & Dossiers
          </button>
          <button
            onClick={() => setActiveTab('districts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === 'districts'
                ? 'bg-[#29382b] text-[#f3f5ef] shadow-md border border-[#3d5340]'
                : 'text-[#8e9c8c] hover:text-[#e8e9e3]'
            }`}
          >
            Sectors QoL
          </button>
          <button
            onClick={() => setActiveTab('grievances')}
            className={`relative px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === 'grievances'
                ? 'bg-[#29382b] text-[#f3f5ef] shadow-md border border-[#3d5340]'
                : 'text-[#8e9c8c] hover:text-[#e8e9e3]'
            }`}
          >
            Grievances
            {citizenReport.activeProblems.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[9px] bg-[#e74c3c] text-white">
                {citizenReport.activeProblems.length}
              </span>
            )}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 ml-2 rounded-lg text-[#8e9c8c] hover:text-[#e8e9e3] hover:bg-[#202921] transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ================= 2. EXECUTIVE VITALS KPI STRIP ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-4 bg-[#151c16] border-b border-[#28352a] text-xs font-mono">
        <div className="p-2.5 rounded-xl bg-[#1b231d] border border-[#2b392d]">
          <span className="text-[#8e9c8c] block text-[9px] uppercase">TOTAL CENSUS</span>
          <span className="text-base font-bold text-[#f3f5ef]">
            {(citizenReport.totalPopulation / 1000000).toFixed(3)}M
          </span>
          <span className="text-[10px] text-[#a6bd82] block mt-0.5">+{rates.populationGrowthRate}%/yr growth</span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#1b231d] border border-[#2b392d]">
          <span className="text-[#8e9c8c] block text-[9px] uppercase">QUALITY OF LIFE</span>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-base font-bold text-[#c6a76a]">
              {citizenReport.qualityOfLifeIndex}%
            </span>
            <span className="text-[10px] text-[#8e9c8c]">Index</span>
          </div>
          <span className="text-[10px] text-[#a6bd82] block mt-0.5">Weighted composite</span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#1b231d] border border-[#2b392d]">
          <span className="text-[#8e9c8c] block text-[9px] uppercase">OVERALL HAPPINESS</span>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-base font-bold text-[#2ecc71]">
              {citizenReport.overallHappiness}/100
            </span>
          </div>
          <span className="text-[10px] text-[#2ecc71] block mt-0.5 capitalize">{citizenReport.happinessTrend} trend</span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#1b231d] border border-[#2b392d]">
          <span className="text-[#8e9c8c] block text-[9px] uppercase">EMPLOYMENT RATE</span>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-base font-bold text-[#82a6bd]">
              {citizenReport.employmentRatePercent}%
            </span>
          </div>
          <span className="text-[10px] text-[#8e9c8c] block mt-0.5">
            {(citizenReport.employedCount / 1000).toFixed(0)}k workforce
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#1b231d] border border-[#2b392d] col-span-2 sm:col-span-1">
          <span className="text-[#8e9c8c] block text-[9px] uppercase">ACTIVE CRISES</span>
          <div className="flex items-center gap-1 mt-0.5">
            <span className={`text-base font-bold ${disasterState?.activeDisaster ? 'text-[#e74c3c]' : 'text-[#2ecc71]'}`}>
              {disasterState?.activeDisaster ? 'DISASTER' : 'NONE'}
            </span>
          </div>
          <span className="text-[10px] text-[#8e9c8c] block mt-0.5">
            {disasterState?.activeDisaster ? disasterState.activeDisaster.type.toUpperCase() : 'Grid Secure'}
          </span>
        </div>
      </div>

      {/* ================= 3. TAB CONTENT ================= */}
      <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
        {/* TAB 1: 11 CORE CITIZEN NEEDS */}
        {activeTab === 'needs' && (
          <div className="space-y-4">
            {/* Category Filter Pills */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-mono text-[#8e9c8c]">FILTER NEEDS CATEGORY:</span>
              <div className="flex items-center gap-1.5 text-xs font-mono">
                {['all', 'vital', 'social', 'infrastructure', 'environmental'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg uppercase transition-all cursor-pointer ${
                      selectedCategoryFilter === cat
                        ? 'bg-[#3b4c37] text-[#dce9ca] border border-[#5d7756] font-bold'
                        : 'bg-[#18201a] text-[#8e9c8c] hover:bg-[#222c24]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Needs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredNeeds.map((need: CitizenNeedItem) => {
                const Icon = getNeedIcon(need.id);
                const isOptimal = need.status === 'optimal';
                const isAdequate = need.status === 'adequate';
                const isDeficient = need.status === 'deficient';

                return (
                  <div
                    key={need.id}
                    className="p-4 rounded-xl bg-[#18211a] border border-[#2b372d] hover:border-[#3d5340] transition-all flex flex-col justify-between gap-3 shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-[#202921] border border-[#2f3d31] text-[#c6a76a]">
                            <Icon size={16} />
                          </div>
                          <div>
                            <span className="font-bold text-sm text-[#f3f5ef] block">{need.name}</span>
                            <span className="text-[10px] font-mono text-[#8e9c8c] uppercase">
                              Category: {need.category} · Weight {(need.weight * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                              isOptimal
                                ? 'bg-[#1b3823] text-[#2ecc71] border border-[#2b5936]'
                                : isAdequate
                                ? 'bg-[#332b17] text-[#f1c40f] border border-[#524424]'
                                : 'bg-[#3b1c1c] text-[#e74c3c] border border-[#5e2e2e]'
                            }`}
                          >
                            {need.satisfactionPercent}%
                          </span>
                        </div>
                      </div>

                      {/* Progress Meter */}
                      <div className="w-full h-2 rounded-full bg-[#131914] overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isOptimal
                              ? 'bg-[#2ecc71]'
                              : isAdequate
                              ? 'bg-[#f1c40f]'
                              : isDeficient
                              ? 'bg-[#e67e22]'
                              : 'bg-[#e74c3c]'
                          }`}
                          style={{ width: `${need.satisfactionPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Drivers Breakdown */}
                    <div className="text-xs space-y-1 pt-2 border-t border-[#253227]">
                      {need.positiveDrivers.map((d: string, i: number) => (
                        <div key={i} className="flex items-center gap-1.5 text-[#a6bd82] text-[11px]">
                          <CheckCircle2 size={12} className="shrink-0" />
                          <span>{d}</span>
                        </div>
                      ))}
                      {need.negativeDrivers.map((d: string, i: number) => (
                        <div key={i} className="flex items-center gap-1.5 text-[#e74c3c] text-[11px]">
                          <AlertTriangle size={12} className="shrink-0" />
                          <span>{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: CITIZEN ROUTINES & DOSSIERS */}
        {activeTab === 'citizens' && (
          <div className="space-y-4">
            {/* Search & Overview Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#18211a] border border-[#2b372d]">
              <div>
                <span className="text-xs font-mono font-bold text-[#f3f5ef] block">
                  REPRESENTATIVE COHORT AGENTS ({filteredAgents.length})
                </span>
                <span className="text-[11px] text-[#8e9c8c]">
                  Live simulated citizens with daily routines, workplace routes, and personal needs.
                </span>
              </div>

              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#798877]" />
                <input
                  type="text"
                  placeholder="Filter name, job, or routine..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#131914] border border-[#2d3a2f] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#e8e9e3] placeholder-[#798877] outline-none"
                />
              </div>
            </div>

            {/* Citizen Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredAgents.map((agent: DetailedCitizenAgent) => {
                const ActivityIcon = (activityIcons as Record<string, React.ElementType>)[agent.currentActivity] || User;

                return (
                  <div
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className="p-4 rounded-xl bg-[#18211a] border border-[#2b372d] hover:border-[#4d634f] transition-all cursor-pointer group shadow-md space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#202921] border border-[#344435] flex items-center justify-center font-bold text-sm text-[#c6a76a] group-hover:border-[#c6a76a] transition-colors">
                          {agent.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-[#f3f5ef] group-hover:text-[#c6a76a] transition-colors">
                              {agent.name}
                            </h4>
                            <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-[#272317] text-[#c6a76a] border border-[#4d3e20]">
                              Age {agent.age} · {agent.ageGroup.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-[#a6bd82] mt-0.5">{agent.occupation}</p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                          agent.status === 'Optimal'
                            ? 'bg-[#1b3823] text-[#2ecc71]'
                            : agent.status === 'Content'
                            ? 'bg-[#332b17] text-[#f1c40f]'
                            : 'bg-[#3b1c1c] text-[#e74c3c]'
                        }`}
                      >
                        {agent.happiness}% Happiness
                      </span>
                    </div>

                    {/* Real-Time Routine Pill */}
                    <div className="p-2.5 rounded-lg bg-[#141b15] border border-[#273529] flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2 text-[#e0be70]">
                        <ActivityIcon size={14} className="text-[#c6a76a]" />
                        <span className="capitalize">{agent.currentActivity.replace('_', ' ')}</span>
                      </div>
                      <span className="text-[#8e9c8c] text-[10px] truncate max-w-[150px]">
                        → {agent.currentDestinationName}
                      </span>
                    </div>

                    {/* Residence & Workplace */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-[#8e9c8c]">
                      <div>
                        <span className="block text-[9px] uppercase font-mono">RESIDENCE</span>
                        <span className="font-medium text-[#e8e9e3] truncate block">
                          {agent.residenceName || agent.district}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase font-mono">PRIMARY FACILITY</span>
                        <span className="font-medium text-[#e8e9e3] truncate block">
                          {agent.workplaceName || 'Municipal Workstation'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: DISTRICTS SOCIAL QUALITY OF LIFE */}
        {activeTab === 'districts' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[#18211a] border border-[#2b372d]">
              <span className="text-xs font-mono font-bold text-[#f3f5ef] block">
                CIVILISATION SECTOR QUALITY OF LIFE COMPARISON
              </span>
              <span className="text-[11px] text-[#8e9c8c]">
                District development metrics, resident happiness ratings, and localized citizen grievances.
              </span>
            </div>

            <div className="space-y-3">
              {(citizenReport?.districts || []).map((d: any) => (
                <div
                  key={d.districtId}
                  className="p-4 rounded-xl bg-[#18211a] border border-[#2b372d] hover:border-[#3d5340] transition-all space-y-3 shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#29352a]">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#f3f5ef]">{d.name}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#202921] text-[#c6a76a] uppercase">
                          {d.category}
                        </span>
                      </div>
                      <span className="text-xs text-[#8e9c8c] mt-0.5 block">
                        Census Population: {d.population.toLocaleString()} Citizens
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-xs">
                      <div className="text-right">
                        <span className="text-[#8e9c8c] block text-[9px]">QUALITY OF LIFE</span>
                        <span className="font-bold text-[#c6a76a] text-sm">{d.qualityOfLife}%</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#8e9c8c] block text-[9px]">HAPPINESS</span>
                        <span className="font-bold text-[#2ecc71] text-sm">{d.happiness}%</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#8e9c8c] block text-[9px]">SAFETY</span>
                        <span className="font-bold text-[#82a6bd] text-sm">{d.safetyIndex}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bars for Sector Vitals */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-[#8e9c8c]">Sector Quality of Life Score</span>
                        <span className="font-bold font-mono text-[#c6a76a]">{d.qualityOfLife}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#131914] overflow-hidden">
                        <div
                          className="h-full bg-[#c6a76a] transition-all duration-300"
                          style={{ width: `${d.qualityOfLife}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-[#8e9c8c]">Safety & Emergency Shelter Readiness</span>
                        <span className="font-bold font-mono text-[#2ecc71]">{d.safetyIndex}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#131914] overflow-hidden">
                        <div
                          className="h-full bg-[#2ecc71] transition-all duration-300"
                          style={{ width: `${d.safetyIndex}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Primary Grievance */}
                  {d.primaryGrievance && (
                    <div className="p-2.5 rounded-lg bg-[#241717] border border-[#4d2525] text-xs flex items-center gap-2 text-[#ff8e8e]">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>{d.primaryGrievance}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ACTIVE CITIZEN GRIEVANCES & ACTIONABLE ALERTS */}
        {activeTab === 'grievances' && (
          <div className="space-y-4">
            {citizenReport.activeProblems.length === 0 ? (
              <div className="p-8 rounded-xl bg-[#18211a] border border-[#2b372d] text-center space-y-2">
                <CheckCircle2 size={36} className="text-[#2ecc71] mx-auto" />
                <h4 className="text-base font-bold text-[#f3f5ef]">All Social Needs Satisfied</h4>
                <p className="text-xs text-[#8e9c8c] max-w-md mx-auto">
                  No critical grievances detected across residential, commercial, or industrial districts.
                </p>
              </div>
            ) : (
              (citizenReport?.activeProblems || []).map((prob: any) => (
                <div
                  key={prob.id}
                  className="p-4 rounded-xl bg-[#241717] border-2 border-[#662828] shadow-lg space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-[#e74c3c]" />
                      <h4 className="text-sm font-bold text-[#ff8080] font-mono uppercase tracking-wide">
                        {prob.title}
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-[#4d1f1f] text-white">
                      {prob.severity} Severity
                    </span>
                  </div>

                  <p className="text-xs text-[#e8d5d5] leading-relaxed">
                    {prob.causeDescription}
                  </p>

                  <div className="p-3 rounded-lg bg-[#1a0f0f] border border-[#401818] flex items-start gap-2.5">
                    <ArrowUpRight size={16} className="text-[#c6a76a] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-mono text-[#c6a76a] uppercase font-bold block">
                        RECOMMENDED CITY PLANNER ACTION:
                      </span>
                      <p className="text-xs text-[#dce9ca] mt-0.5">
                        {prob.recommendedAction}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ================= 4. INDIVIDUAL CITIZEN DOSSIER MODAL ================= */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-lg bg-[#18211a] border-2 border-[#3d5340] rounded-2xl shadow-2xl p-5 text-[#e8e9e3] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-[#2b372d]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#202921] border-2 border-[#c6a76a] flex items-center justify-center font-bold text-base text-[#c6a76a]">
                  {selectedAgent.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#f3f5ef]">{selectedAgent.name}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#272317] text-[#c6a76a]">
                      ID #{selectedAgent.id}
                    </span>
                  </div>
                  <p className="text-xs text-[#a6bd82] mt-0.5">{selectedAgent.occupation}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAgent(null)}
                className="p-1 rounded-lg text-[#8e9c8c] hover:text-white hover:bg-[#202921] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Daily Activity Spotlight */}
              <div className="p-3 rounded-xl bg-[#141b15] border border-[#29382b] flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-mono text-[#8e9c8c] uppercase block">CURRENT REAL-TIME ACTIVITY</span>
                  <span className="text-sm font-bold text-[#c6a76a] capitalize">
                    {selectedAgent.currentActivity.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-mono text-[#8e9c8c] uppercase block">DESTINATION</span>
                  <span className="text-xs font-semibold text-[#f3f5ef]">
                    {selectedAgent.currentDestinationName}
                  </span>
                </div>
              </div>

              {/* Personal Needs Satisfaction Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[#141b15] border border-[#253227]">
                  <span className="text-[#8e9c8c] text-[10px] block">HOUSING NEED</span>
                  <span className="font-bold text-[#a6bd82]">{selectedAgent.personalNeeds.housing}% Satisfied</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#141b15] border border-[#253227]">
                  <span className="text-[#8e9c8c] text-[10px] block">HEALTHCARE ACCESS</span>
                  <span className="font-bold text-[#82a6bd]">{selectedAgent.personalNeeds.healthcare}% Satisfied</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#141b15] border border-[#253227]">
                  <span className="text-[#8e9c8c] text-[10px] block">LEISURE & PARKS</span>
                  <span className="font-bold text-[#c6a76a]">{selectedAgent.personalNeeds.recreation}% Satisfied</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#141b15] border border-[#253227]">
                  <span className="text-[#8e9c8c] text-[10px] block">SAFETY STATUS</span>
                  <span className="font-bold text-[#2ecc71]">{selectedAgent.personalNeeds.safety}% Secure</span>
                </div>
              </div>

              {/* Residence & Workplace */}
              <div className="p-3 rounded-xl bg-[#141b15] border border-[#253227] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#8e9c8c]">Home Sector:</span>
                  <span className="font-medium text-[#f3f5ef]">{selectedAgent.residenceName || selectedAgent.district}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8e9c8c]">Workplace / Facility:</span>
                  <span className="font-medium text-[#f3f5ef]">{selectedAgent.workplaceName || 'Municipal Workstation'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8e9c8c]">Annual Income:</span>
                  <span className="font-mono font-bold text-[#c6a76a]">{selectedAgent.income.toLocaleString()} Cr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8e9c8c]">AI Coprocessor Allocation:</span>
                  <span className="font-mono font-bold text-[#82a6bd]">{selectedAgent.aiAssistanceUsage}% Usage</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedAgent(null)}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#394b35] hover:bg-[#4b6145] text-[#dce9ca] transition-colors cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
