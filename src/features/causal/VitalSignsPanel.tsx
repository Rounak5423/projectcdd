import React from 'react';
import {
  HeartPulse,
  Activity,
  Users,
  AlertTriangle,
  Building,
  ShieldAlert,
  Droplets,
  Utensils,
  Zap,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { CausalVitalsSnapshot } from './types';

interface VitalSignsPanelProps {
  vitalsHistory: CausalVitalsSnapshot[];
  latestVitals: CausalVitalsSnapshot | null;
}

export const VitalSignsPanel: React.FC<VitalSignsPanelProps> = ({
  vitalsHistory,
  latestVitals,
}) => {
  if (!latestVitals) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900/60 rounded-xl border border-slate-800">
        <HeartPulse className="w-8 h-8 mx-auto mb-2 text-slate-500 animate-pulse" />
        <p>No telemetry recorded yet. Advance the simulation to collect vital signs.</p>
      </div>
    );
  }

  const {
    births,
    deaths,
    deaths_by_cause,
    unmet_needs,
    bed_occupancy_pct,
    bed_capacity,
    overflow_patients,
    protest_intensity,
    protest_participants,
    grievance_score,
    health_index,
  } = latestVitals;

  // Chart data formatting
  const chartData = vitalsHistory.slice(-25).map((v) => ({
    name: `T${v.tick}`,
    births: v.births,
    deaths: v.deaths,
    aging: v.deaths_by_cause.aging,
    starvation: v.deaths_by_cause.starvation,
    dehydration: v.deaths_by_cause.dehydration,
    hospital_overload: v.deaths_by_cause.hospital_overload,
    pollution: v.deaths_by_cause.pollution,
    trauma: v.deaths_by_cause.trauma,
    protest_intensity: Math.round(v.protest_intensity * 100),
    occupancy_pct: Math.min(200, Math.round(v.bed_occupancy_pct)),
  }));

  const causeBreakdown = [
    { name: 'Aging', count: deaths_by_cause.aging, color: 'text-slate-300', bg: 'bg-slate-400' },
    { name: 'Starvation', count: deaths_by_cause.starvation, color: 'text-amber-400', bg: 'bg-amber-500' },
    { name: 'Dehydration', count: deaths_by_cause.dehydration, color: 'text-blue-400', bg: 'bg-blue-500' },
    { name: 'Hospital Saturated', count: deaths_by_cause.hospital_overload, color: 'text-rose-400', bg: 'bg-rose-500' },
    { name: 'Pollution', count: deaths_by_cause.pollution, color: 'text-purple-400', bg: 'bg-purple-500' },
    { name: 'Trauma', count: deaths_by_cause.trauma, color: 'text-orange-400', bg: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Population & Demographics */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-1">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              DEMOGRAPHIC PULSE
            </span>
            <span className={births >= deaths ? 'text-emerald-400' : 'text-rose-400'}>
              {births >= deaths ? '+' : ''}{births - deaths} net/day
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <div>
              <span className="text-2xl font-bold font-mono text-white">
                {latestVitals.population.toLocaleString()}
              </span>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                <span className="text-emerald-400">+{births} births</span>
                <span>•</span>
                <span className="text-rose-400">-{deaths} deaths</span>
              </div>
            </div>
          </div>
        </div>

        {/* Health Index */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-1">
            <span className="flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
              POPULATION HEALTH
            </span>
            <span className={health_index >= 0.75 ? 'text-emerald-400' : 'text-rose-400'}>
              {health_index >= 0.75 ? 'Optimal' : 'Compromised'}
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-white">
                {Math.round(health_index * 100)}%
              </span>
              <span className="text-xs text-slate-400 font-mono">vitality score</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  health_index >= 0.75
                    ? 'bg-emerald-500'
                    : health_index >= 0.5
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, health_index * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Healthcare & Hospital Bed Occupancy */}
        <div className={`bg-slate-900/70 border rounded-xl p-4 shadow-lg backdrop-blur-sm ${
          bed_occupancy_pct > 100 ? 'border-rose-500/50 bg-rose-950/10' : 'border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-1">
            <span className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-blue-400" />
              HOSPITAL CAPACITY
            </span>
            <span className={bed_occupancy_pct > 100 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
              {bed_occupancy_pct > 100 ? 'SATURATED' : 'Within Limits'}
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline justify-between">
              <span className={`text-2xl font-bold font-mono ${bed_occupancy_pct > 100 ? 'text-rose-400' : 'text-white'}`}>
                {bed_occupancy_pct.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {bed_capacity.toLocaleString()} beds
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  bed_occupancy_pct > 100
                    ? 'bg-rose-500'
                    : bed_occupancy_pct > 80
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(100, bed_occupancy_pct)}%` }}
              />
            </div>
            {overflow_patients > 0 && (
              <p className="text-[11px] text-rose-400 mt-1 font-mono">
                ⚠️ {overflow_patients.toLocaleString()} critical patients overflowing
              </p>
            )}
          </div>
        </div>

        {/* Civic Unrest & Protests */}
        <div className={`bg-slate-900/70 border rounded-xl p-4 shadow-lg backdrop-blur-sm ${
          protest_intensity > 0.4 ? 'border-amber-500/50 bg-amber-950/10' : 'border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-1">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              CIVIL PROTEST
            </span>
            <span className={protest_intensity > 0.3 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
              {protest_intensity > 0.3 ? 'Active Demonstration' : 'Peaceful'}
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline justify-between">
              <span className={`text-2xl font-bold font-mono ${protest_intensity > 0.3 ? 'text-amber-400' : 'text-white'}`}>
                {Math.round(protest_intensity * 100)}%
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {protest_participants.toLocaleString()} marchers
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  protest_intensity > 0.5
                    ? 'bg-rose-500'
                    : protest_intensity > 0.2
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, protest_intensity * 100)}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono flex justify-between">
              <span>Grievance Score:</span>
              <span className="text-slate-200">{(grievance_score * 100).toFixed(0)} / 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts: Births vs Deaths & Cause Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Births vs Deaths Time-Series */}
        <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                VITAL DYNAMICS (LIVE BIRTHS VS DEATHS)
              </h3>
              <p className="text-xs text-slate-400">Demographic replacement curve across simulation ticks</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="birthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="deathGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#cbd5e1' }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Area type="monotone" dataKey="births" stroke="#10b981" fillOpacity={1} fill="url(#birthGrad)" name="Daily Births" />
                <Area type="monotone" dataKey="deaths" stroke="#f43f5e" fillOpacity={1} fill="url(#deathGrad)" name="Daily Deaths" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Deaths By Cause Breakdown */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide mb-1 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              DEATHS BY CAUSAL FACTOR
            </h3>
            <p className="text-xs text-slate-400 mb-4">Attribution of casualties this cycle</p>

            <div className="space-y-3">
              {causeBreakdown.map((item) => (
                <div key={item.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">{item.name}</span>
                    <span className={`font-mono ${item.color}`}>
                      {item.count.toLocaleString()} ({deaths > 0 ? ((item.count / deaths) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.bg}`}
                      style={{ width: `${deaths > 0 ? (item.count / deaths) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
            Total Cycle Casualties: <span className="text-white font-bold">{deaths.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Unmet Basic Needs Grid */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h3 className="text-sm font-semibold text-white tracking-wide mb-1 flex items-center gap-2">
          <Utensils className="w-4 h-4 text-amber-400" />
          BASIC NEEDS & UTILITIES SATISFACTION
        </h3>
        <p className="text-xs text-slate-400 mb-4">Deprivation of basic needs directly triggers illness, mortality, and civil rebellion.</p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Food */}
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <Utensils className="w-3.5 h-3.5 text-amber-400" />
              <span>Nutrition / Food</span>
            </div>
            <div className="text-lg font-bold font-mono text-white mb-1">
              {(100 - unmet_needs.food * 100).toFixed(0)}%
            </div>
            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
              <div
                className={`h-full ${unmet_needs.food > 0.1 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                style={{ width: `${100 - unmet_needs.food * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5 font-mono">
              {unmet_needs.food > 0 ? `${(unmet_needs.food * 100).toFixed(0)}% deficit` : 'Fully supplied'}
            </p>
          </div>

          {/* Water */}
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <Droplets className="w-3.5 h-3.5 text-blue-400" />
              <span>Potable Water</span>
            </div>
            <div className="text-lg font-bold font-mono text-white mb-1">
              {(100 - unmet_needs.water * 100).toFixed(0)}%
            </div>
            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
              <div
                className={`h-full ${unmet_needs.water > 0.1 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                style={{ width: `${100 - unmet_needs.water * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5 font-mono">
              {unmet_needs.water > 0 ? `${(unmet_needs.water * 100).toFixed(0)}% deficit` : 'Fully supplied'}
            </p>
          </div>

          {/* Energy */}
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span>Power Grid</span>
            </div>
            <div className="text-lg font-bold font-mono text-white mb-1">
              {(100 - unmet_needs.energy * 100).toFixed(0)}%
            </div>
            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
              <div
                className={`h-full ${unmet_needs.energy > 0.1 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                style={{ width: `${100 - unmet_needs.energy * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5 font-mono">
              {unmet_needs.energy > 0 ? `${(unmet_needs.energy * 100).toFixed(0)}% deficit` : 'Fully supplied'}
            </p>
          </div>

          {/* Healthcare */}
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
              <span>Medical Access</span>
            </div>
            <div className="text-lg font-bold font-mono text-white mb-1">
              {(100 - unmet_needs.healthcare * 100).toFixed(0)}%
            </div>
            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
              <div
                className={`h-full ${unmet_needs.healthcare > 0.1 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                style={{ width: `${100 - unmet_needs.healthcare * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5 font-mono">
              {unmet_needs.healthcare > 0 ? `${(unmet_needs.healthcare * 100).toFixed(0)}% unserved` : 'Full triage'}
            </p>
          </div>

          {/* Shelter */}
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <Building className="w-3.5 h-3.5 text-indigo-400" />
              <span>Housing / Shelter</span>
            </div>
            <div className="text-lg font-bold font-mono text-white mb-1">
              {(100 - unmet_needs.shelter * 100).toFixed(0)}%
            </div>
            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
              <div
                className={`h-full ${unmet_needs.shelter > 0.1 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                style={{ width: `${100 - unmet_needs.shelter * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5 font-mono">
              {unmet_needs.shelter > 0 ? `${(unmet_needs.shelter * 100).toFixed(0)}% unhoused` : 'Adequate capacity'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

