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
      <div className="p-8 text-center text-[#8e9c8c] bg-[#141b16] rounded-xl border border-[#2b392d]">
        <HeartPulse className="w-8 h-8 mx-auto mb-2 text-[#c5a66a] animate-pulse" />
        <p className="font-cinzel text-sm">No imperial telemetry recorded yet. Advance the realm simulation to collect vital signs.</p>
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
    name: `C${v.tick}`,
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
    { name: 'Natural Aging', count: deaths_by_cause.aging, color: 'text-[#8e9c8c]', bg: 'bg-[#596657]' },
    { name: 'Starvation', count: deaths_by_cause.starvation, color: 'text-[#c5a66a]', bg: 'bg-[#c5a66a]' },
    { name: 'Dehydration', count: deaths_by_cause.dehydration, color: 'text-[#6e98b3]', bg: 'bg-[#6e98b3]' },
    { name: 'Healer Overload', count: deaths_by_cause.hospital_overload, color: 'text-[#e74c3c]', bg: 'bg-[#e74c3c]' },
    { name: 'Miasma & Pollution', count: deaths_by_cause.pollution, color: 'text-[#9b59b6]', bg: 'bg-[#9b59b6]' },
    { name: 'Physical Trauma', count: deaths_by_cause.trauma, color: 'text-[#e67e22]', bg: 'bg-[#e67e22]' },
  ];

  return (
    <div className="space-y-6">
      {/* Top 4 Imperial KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Population & Demographics */}
        <div className="bg-[#141b16] border border-[#2b392d] hover:border-[#c5a66a]/40 rounded-xl p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between text-xs text-[#8e9c8c] font-mono mb-1">
            <span className="flex items-center gap-1.5 font-cinzel font-bold text-[#c5a66a]">
              <Users className="w-3.5 h-3.5" />
              DEMOGRAPHIC PULSE
            </span>
            <span className={births >= deaths ? 'text-[#2ecc71] font-bold' : 'text-[#e74c3c] font-bold'}>
              {births >= deaths ? '+' : ''}{births - deaths} net/day
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <div>
              <span className="text-2xl font-bold font-mono text-[#f3f5ee]">
                {latestVitals.population.toLocaleString()}
              </span>
              <div className="text-xs text-[#8e9c8c] flex items-center gap-2 mt-1 font-mono">
                <span className="text-[#2ecc71]">+{births} births</span>
                <span>•</span>
                <span className="text-[#e74c3c]">-{deaths} deaths</span>
              </div>
            </div>
          </div>
        </div>

        {/* Health Index */}
        <div className="bg-[#141b16] border border-[#2b392d] hover:border-[#c5a66a]/40 rounded-xl p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between text-xs text-[#8e9c8c] font-mono mb-1">
            <span className="flex items-center gap-1.5 font-cinzel font-bold text-[#c5a66a]">
              <HeartPulse className="w-3.5 h-3.5 text-[#e74c3c]" />
              POPULATION VITALITY
            </span>
            <span className={health_index >= 0.75 ? 'text-[#2ecc71] font-bold' : 'text-[#e74c3c] font-bold'}>
              {health_index >= 0.75 ? 'Flourishing' : 'Endangered'}
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-[#f3f5ee]">
                {Math.round(health_index * 100)}%
              </span>
              <span className="text-xs text-[#8e9c8c] font-mono">vitality index</span>
            </div>
            <div className="w-full bg-[#1e2720] h-1.5 rounded-full mt-2 overflow-hidden border border-[#2b392d]">
              <div
                className={`h-full transition-all duration-300 ${
                  health_index >= 0.75
                    ? 'bg-[#2ecc71]'
                    : health_index >= 0.5
                    ? 'bg-[#c5a66a]'
                    : 'bg-[#e74c3c]'
                }`}
                style={{ width: `${Math.min(100, health_index * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Healthcare & Hospital Bed Occupancy */}
        <div className={`bg-[#141b16] border rounded-xl p-4 shadow-sm transition-colors ${
          bed_occupancy_pct > 100 ? 'border-[#e74c3c]/60 bg-[#251515]' : 'border-[#2b392d] hover:border-[#c5a66a]/40'
        }`}>
          <div className="flex items-center justify-between text-xs text-[#8e9c8c] font-mono mb-1">
            <span className="flex items-center gap-1.5 font-cinzel font-bold text-[#c5a66a]">
              <Building className="w-3.5 h-3.5 text-[#6e98b3]" />
              HEALING CLINIC CAPACITY
            </span>
            <span className={bed_occupancy_pct > 100 ? 'text-[#e74c3c] font-bold' : 'text-[#8fa879]'}>
              {bed_occupancy_pct > 100 ? 'OVERFLOW' : 'Within Limits'}
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline justify-between">
              <span className={`text-2xl font-bold font-mono ${bed_occupancy_pct > 100 ? 'text-[#e74c3c]' : 'text-[#f3f5ee]'}`}>
                {bed_occupancy_pct.toFixed(1)}%
              </span>
              <span className="text-xs text-[#8e9c8c] font-mono">
                {bed_capacity.toLocaleString()} cots
              </span>
            </div>
            <div className="w-full bg-[#1e2720] h-1.5 rounded-full mt-2 overflow-hidden border border-[#2b392d]">
              <div
                className={`h-full transition-all duration-300 ${
                  bed_occupancy_pct > 100
                    ? 'bg-[#e74c3c]'
                    : bed_occupancy_pct > 80
                    ? 'bg-[#c5a66a]'
                    : 'bg-[#6e98b3]'
                }`}
                style={{ width: `${Math.min(100, bed_occupancy_pct)}%` }}
              />
            </div>
            {overflow_patients > 0 && (
              <p className="text-[11px] text-[#e74c3c] mt-1 font-mono">
                ⚠️ {overflow_patients.toLocaleString()} critical citizens awaiting care
              </p>
            )}
          </div>
        </div>

        {/* Civic Unrest & Protests */}
        <div className={`bg-[#141b16] border rounded-xl p-4 shadow-sm transition-colors ${
          protest_intensity > 0.4 ? 'border-[#e67e22]/60 bg-[#261c14]' : 'border-[#2b392d] hover:border-[#c5a66a]/40'
        }`}>
          <div className="flex items-center justify-between text-xs text-[#8e9c8c] font-mono mb-1">
            <span className="flex items-center gap-1.5 font-cinzel font-bold text-[#c5a66a]">
              <ShieldAlert className="w-3.5 h-3.5 text-[#e67e22]" />
              CIVIC REBELLION
            </span>
            <span className={protest_intensity > 0.3 ? 'text-[#e67e22] font-bold' : 'text-[#2ecc71]'}>
              {protest_intensity > 0.3 ? 'Uprising' : 'Peaceful'}
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline justify-between">
              <span className={`text-2xl font-bold font-mono ${protest_intensity > 0.3 ? 'text-[#e67e22]' : 'text-[#f3f5ee]'}`}>
                {Math.round(protest_intensity * 100)}%
              </span>
              <span className="text-xs text-[#8e9c8c] font-mono">
                {protest_participants.toLocaleString()} subjects
              </span>
            </div>
            <div className="w-full bg-[#1e2720] h-1.5 rounded-full mt-2 overflow-hidden border border-[#2b392d]">
              <div
                className={`h-full transition-all duration-300 ${
                  protest_intensity > 0.5
                    ? 'bg-[#e74c3c]'
                    : protest_intensity > 0.2
                    ? 'bg-[#e67e22]'
                    : 'bg-[#2ecc71]'
                }`}
                style={{ width: `${Math.min(100, protest_intensity * 100)}%` }}
              />
            </div>
            <div className="text-[11px] text-[#8e9c8c] mt-1 font-mono flex justify-between">
              <span>Grievance Index:</span>
              <span className="text-[#f3f5ee]">{(grievance_score * 100).toFixed(0)} / 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts: Births vs Deaths & Cause Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Births vs Deaths Time-Series */}
        <div className="lg:col-span-2 bg-[#141b16] border border-[#2b392d] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#f3f5ee] tracking-wide flex items-center gap-2 font-cinzel">
                <Activity className="w-4 h-4 text-[#c5a66a]" />
                REALM VITAL DYNAMICS (BIRTHS VS CASUALTIES)
              </h3>
              <p className="text-xs text-[#8e9c8c]">Demographic replacement curve across simulation cycles</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="birthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2ecc71" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2ecc71" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="deathGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e74c3c" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#e74c3c" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#596657" tick={{ fontSize: 11, fill: '#8e9c8c' }} />
                <YAxis stroke="#596657" tick={{ fontSize: 11, fill: '#8e9c8c' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111713', borderColor: '#594d2d', borderRadius: '10px', color: '#eae3d2' }}
                  labelStyle={{ color: '#c5a66a', fontFamily: 'Cinzel, serif', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8, color: '#eae3d2' }} />
                <Area type="monotone" dataKey="births" stroke="#2ecc71" fillOpacity={1} fill="url(#birthGrad)" name="Daily Births" />
                <Area type="monotone" dataKey="deaths" stroke="#e74c3c" fillOpacity={1} fill="url(#deathGrad)" name="Daily Casualties" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Deaths By Cause Breakdown */}
        <div className="bg-[#141b16] border border-[#2b392d] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#f3f5ee] tracking-wide mb-1 flex items-center gap-2 font-cinzel">
              <ShieldAlert className="w-4 h-4 text-[#e74c3c]" />
              CASUALTY ATTRIBUTION
            </h3>
            <p className="text-xs text-[#8e9c8c] mb-4">Attribution of losses this kingdom cycle</p>

            <div className="space-y-3">
              {causeBreakdown.map((item) => (
                <div key={item.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#d8ded6] font-medium">{item.name}</span>
                    <span className={`font-mono ${item.color}`}>
                      {item.count.toLocaleString()} ({deaths > 0 ? ((item.count / deaths) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#1e2720] h-1.5 rounded-full overflow-hidden border border-[#2b392d]">
                    <div
                      className={`h-full ${item.bg}`}
                      style={{ width: `${deaths > 0 ? (item.count / deaths) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#2b392d] text-[11px] text-[#8e9c8c] font-mono">
            Total Cycle Casualties: <span className="text-[#f3f5ee] font-bold">{deaths.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Unmet Basic Needs Grid */}
      <div className="bg-[#141b16] border border-[#2b392d] rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-[#f3f5ee] tracking-wide mb-1 flex items-center gap-2 font-cinzel">
          <Utensils className="w-4 h-4 text-[#c5a66a]" />
          ROYAL SUSTENANCE & BASIC NEEDS FULFILLMENT
        </h3>
        <p className="text-xs text-[#8e9c8c] mb-4">Deprivation of basic needs directly causes illness, starvation, and civic unrest.</p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Food */}
          <div className="bg-[#111713] border border-[#2b392d] rounded-xl p-3">
            <div className="flex items-center gap-2 text-xs text-[#8e9c8c] mb-2 font-cinzel">
              <Utensils className="w-3.5 h-3.5 text-[#c5a66a]" />
              <span>Grain & Food</span>
            </div>
            <div className="text-lg font-bold font-mono text-[#f3f5ee] mb-1">
              {(100 - unmet_needs.food * 100).toFixed(0)}%
            </div>
            <div className="w-full bg-[#1e2720] h-1 rounded-full overflow-hidden">
              <div
                className={`h-full ${unmet_needs.food > 0.1 ? 'bg-[#e74c3c]' : 'bg-[#2ecc71]'}`}
                style={{ width: `${100 - unmet_needs.food * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-[#8e9c8c] mt-1.5 font-mono">
              {unmet_needs.food > 0 ? `${(unmet_needs.food * 100).toFixed(0)}% deficit` : 'Plentiful store'}
            </p>
          </div>

          {/* Water */}
          <div className="bg-[#111713] border border-[#2b392d] rounded-xl p-3">
            <div className="flex items-center gap-2 text-xs text-[#8e9c8c] mb-2 font-cinzel">
              <Droplets className="w-3.5 h-3.5 text-[#6e98b3]" />
              <span>Potable Aquifers</span>
            </div>
            <div className="text-lg font-bold font-mono text-[#f3f5ee] mb-1">
              {(100 - unmet_needs.water * 100).toFixed(0)}%
            </div>
            <div className="w-full bg-[#1e2720] h-1 rounded-full overflow-hidden">
              <div
                className={`h-full ${unmet_needs.water > 0.1 ? 'bg-[#e74c3c]' : 'bg-[#2ecc71]'}`}
                style={{ width: `${100 - unmet_needs.water * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-[#8e9c8c] mt-1.5 font-mono">
              {unmet_needs.water > 0 ? `${(unmet_needs.water * 100).toFixed(0)}% deficit` : 'Pure springs'}
            </p>
          </div>

          {/* Energy */}
          <div className="bg-[#111713] border border-[#2b392d] rounded-xl p-3">
            <div className="flex items-center gap-2 text-xs text-[#8e9c8c] mb-2 font-cinzel">
              <Zap className="w-3.5 h-3.5 text-[#d4b77d]" />
              <span>Energy & Power</span>
            </div>
            <div className="text-lg font-bold font-mono text-[#f3f5ee] mb-1">
              {(100 - unmet_needs.energy * 100).toFixed(0)}%
            </div>
            <div className="w-full bg-[#1e2720] h-1 rounded-full overflow-hidden">
              <div
                className={`h-full ${unmet_needs.energy > 0.1 ? 'bg-[#e74c3c]' : 'bg-[#2ecc71]'}`}
                style={{ width: `${100 - unmet_needs.energy * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-[#8e9c8c] mt-1.5 font-mono">
              {unmet_needs.energy > 0 ? `${(unmet_needs.energy * 100).toFixed(0)}% deficit` : 'Full capacity'}
            </p>
          </div>

          {/* Healthcare */}
          <div className="bg-[#111713] border border-[#2b392d] rounded-xl p-3">
            <div className="flex items-center gap-2 text-xs text-[#8e9c8c] mb-2 font-cinzel">
              <HeartPulse className="w-3.5 h-3.5 text-[#e74c3c]" />
              <span>Healer Access</span>
            </div>
            <div className="text-lg font-bold font-mono text-[#f3f5ee] mb-1">
              {(100 - unmet_needs.healthcare * 100).toFixed(0)}%
            </div>
            <div className="w-full bg-[#1e2720] h-1 rounded-full overflow-hidden">
              <div
                className={`h-full ${unmet_needs.healthcare > 0.1 ? 'bg-[#e74c3c]' : 'bg-[#2ecc71]'}`}
                style={{ width: `${100 - unmet_needs.healthcare * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-[#8e9c8c] mt-1.5 font-mono">
              {unmet_needs.healthcare > 0 ? `${(unmet_needs.healthcare * 100).toFixed(0)}% unserved` : 'Full treatment'}
            </p>
          </div>

          {/* Shelter */}
          <div className="bg-[#111713] border border-[#2b392d] rounded-xl p-3">
            <div className="flex items-center gap-2 text-xs text-[#8e9c8c] mb-2 font-cinzel">
              <Building className="w-3.5 h-3.5 text-[#8fa879]" />
              <span>Hearth & Shelter</span>
            </div>
            <div className="text-lg font-bold font-mono text-[#f3f5ee] mb-1">
              {(100 - unmet_needs.shelter * 100).toFixed(0)}%
            </div>
            <div className="w-full bg-[#1e2720] h-1 rounded-full overflow-hidden">
              <div
                className={`h-full ${unmet_needs.shelter > 0.1 ? 'bg-[#e74c3c]' : 'bg-[#2ecc71]'}`}
                style={{ width: `${100 - unmet_needs.shelter * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-[#8e9c8c] mt-1.5 font-mono">
              {unmet_needs.shelter > 0 ? `${(unmet_needs.shelter * 100).toFixed(0)}% unhoused` : 'Warm roofs'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

