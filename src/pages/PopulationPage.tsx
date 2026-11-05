import React, { useState } from 'react';
import {
  Users,
  Heart,
  GraduationCap,
  Briefcase,
  TrendingUp,
  Search,
  Filter,
  UserCheck,
  BrainCircuit,
  Activity,
  Sparkles,
  ChevronRight,
  X,
  PieChart as PieIcon,
  Layers,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  PieChart,
  Pie,
} from 'recharts';
import { useGameState } from '../context/GameStateContext';
import { Citizen } from '../types/game';

// Demographic Pyramid Mock Data
const ageDistribution = [
  { group: '0-14', male: 118, female: 114 },
  { group: '15-29', male: 165, female: 160 },
  { group: '30-44', male: 198, female: 192 },
  { group: '45-59', male: 142, female: 146 },
  { group: '60-74', male: 88, female: 94 },
  { group: '75+', male: 32, female: 38 },
];

// Population growth trend
const populationTrend = [
  { year: 'Y08', pop: 0.94 },
  { year: 'Y09', pop: 1.02 },
  { year: 'Y10', pop: 1.11 },
  { year: 'Y11', pop: 1.18 },
  { year: 'Y12', pop: 1.24 },
];

// Occupation distribution
const occupationData = [
  { name: 'Quantum & AI Scientists', value: 215, color: '#82a6bd' },
  { name: 'Automated Foundry Engineers', value: 340, color: '#bd8282' },
  { name: 'Aeroponic Bio-Agrarians', value: 192, color: '#82bd8e' },
  { name: 'Urban & Healthcare Operators', value: 310, color: '#bd9fa6' },
  { name: 'High Council & Civic Admin', value: 185, color: '#c6a76a' },
];

export default function PopulationPage() {
  const { resources, rates, citizens, districts } = useGameState();
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);

  const filteredCitizens = citizens.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.occupation.toLowerCase().includes(search.toLowerCase());
    const matchesDistrict = selectedDistrict === 'all' || c.district === selectedDistrict;
    return matchesSearch && matchesDistrict;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 overflow-y-auto custom-scrollbar text-[#e8e9e3] max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#39443a] gap-4">
        <div>
          <span className="eyebrow text-[#c6a76a]">DEMOGRAPHIC INTELLIGENCE & SOCIAL MOBILITY</span>
          <h1 className="text-2xl font-bold text-[#f3f5ef] mt-0.5">Population & Human Capital</h1>
          <p className="text-xs text-[#9da99b] mt-1">
            Real-time census, demographic pyramid, cognitive augmentation metrics, and citizen profiles.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#182119] p-3 rounded-xl border border-[#2e3c2f] text-xs font-mono">
          <div>
            <span className="text-[#9da99b] block text-[10px]">TOTAL CENSUS</span>
            <span className="text-sm font-bold text-[#f3f5ef]">
              {(resources.population / 1000000).toFixed(3)}M
            </span>
          </div>
          <div className="w-px h-6 bg-[#2c392d]" />
          <div>
            <span className="text-[#9da99b] block text-[10px]">NATURAL GROWTH</span>
            <span className="text-sm font-bold text-[#a6bd82]">+{rates.populationGrowthRate}%/yr</span>
          </div>
        </div>
      </div>

      {/* Vitals KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'PUBLIC HAPPINESS', val: `${resources.happiness}/100`, change: '+3.2 pts', icon: Heart, color: '#a6bd82' },
          { label: 'WELLNESS & HEALTH', val: `${resources.health}/100`, change: '+1.8 pts', icon: Activity, color: '#82bd8e' },
          { label: 'EDUCATION MASTERY', val: `${resources.educationIndex}/100`, change: 'Tier 4', icon: GraduationCap, color: '#82a6bd' },
          { label: 'SOCIAL MOBILITY', val: '86/100', change: 'Meritocratic', icon: Briefcase, color: '#c6a76a' },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="panel p-4 bg-[#182119] border-[#313f32]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono tracking-wider text-[#9da99b]">{kpi.label}</span>
                <Icon size={16} style={{ color: kpi.color }} />
              </div>
              <p className="text-2xl font-bold text-[#f3f5ef] mt-2 font-mono">{kpi.val}</p>
              <p className="text-xs text-[#a6bd82] mt-1">{kpi.change} vs last cycle</p>
            </div>
          );
        })}
      </div>

      {/* Demographic Pyramid & Occupation Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Age Distribution Pyramid */}
        <div className="panel p-5 bg-[#182119] border-[#313f32] lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="eyebrow text-[#c6a76a]">POPULATION PYRAMID</span>
              <h3 className="text-sm font-bold text-[#f3f5ef] mt-0.5">Age Cohorts (Thousands)</h3>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-[#82a6bd]">
                <span className="w-2 h-2 rounded bg-[#82a6bd]" /> Male
              </span>
              <span className="flex items-center gap-1 text-[#a6bd82]">
                <span className="w-2 h-2 rounded bg-[#a6bd82]" /> Female
              </span>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageDistribution} layout="vertical" margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
                <XAxis type="number" stroke="#718070" tick={{ fill: '#9da99b', fontSize: 10 }} />
                <YAxis dataKey="group" type="category" stroke="#718070" tick={{ fill: '#9da99b', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#171d18', borderColor: '#39443a', borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="male" fill="#82a6bd" radius={[0, 4, 4, 0]} />
                <Bar dataKey="female" fill="#a6bd82" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Occupation Breakdown */}
        <div className="panel p-5 bg-[#182119] border-[#313f32] flex flex-col justify-between">
          <div>
            <span className="eyebrow text-[#c6a76a]">LABOR FORCE COMPOSITION</span>
            <h3 className="text-sm font-bold text-[#f3f5ef] mt-0.5">Sector Allocation</h3>

            <div className="mt-4 space-y-2.5">
              {occupationData.map((occ, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#e8e9e3] font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: occ.color }} />
                      {occ.name}
                    </span>
                    <span className="font-mono text-[#c6a76a] font-bold">{occ.value}k</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#121612] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(occ.value / 1242) * 100}%`,
                        backgroundColor: occ.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-2.5 rounded bg-[#131914] border border-[#273328] text-[10px] text-[#9da99b] mt-4 font-mono">
            Unemployment: 2.8% · Labor Participation: 84.6%
          </div>
        </div>
      </div>

      {/* Citizen Directory & Inspection Table */}
      <div className="panel p-5 bg-[#182119] border-[#313f32]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#29342a] gap-3">
          <div>
            <span className="eyebrow text-[#c6a76a]">CENSUS RECORD REGISTRY</span>
            <h3 className="text-base font-bold text-[#f3f5ef] mt-0.5">Sample Citizen Profiles</h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#798877]" />
              <input
                type="text"
                placeholder="Search citizen or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-[#141914] border border-[#2e3b2f] rounded-lg pl-8 pr-3 py-1 text-xs text-[#e8e9e3] placeholder-[#798877] outline-none"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left text-xs">
            <thead className="text-[#8e9c8c] font-mono text-[10px] uppercase border-b border-[#263127]">
              <tr>
                <th className="py-3 px-2">Citizen Name</th>
                <th className="py-3 px-2">Age / Sex</th>
                <th className="py-3 px-2">Occupation</th>
                <th className="py-3 px-2">District</th>
                <th className="py-3 px-2">AI Coprocessor</th>
                <th className="py-3 px-2">Happiness</th>
                <th className="py-3 px-2 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#212b22]">
              {filteredCitizens.map((c) => (
                <tr key={c.id} className="hover:bg-[#1f2820] transition-colors">
                  <td className="py-3 px-2 font-semibold text-[#f0f3eb] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#a6bd82]" />
                    <span>{c.name}</span>
                  </td>
                  <td className="py-3 px-2 text-[#9da99b] font-mono">
                    {c.age} / {c.gender}
                  </td>
                  <td className="py-3 px-2 text-[#e8e9e3]">{c.occupation}</td>
                  <td className="py-3 px-2 text-[#9da99b]">{c.district}</td>
                  <td className="py-3 px-2 font-mono">
                    <span className="text-[#82a6bd]">{c.aiAssistanceUsage}%</span>
                  </td>
                  <td className="py-3 px-2 font-mono text-[#a6bd82] font-semibold">{c.happiness}/100</td>
                  <td className="py-3 px-2 text-right">
                    <button
                      onClick={() => setSelectedCitizen(c)}
                      className="px-2.5 py-1 rounded bg-[#273328] hover:bg-[#344335] text-[#dce9ca] text-[11px] font-medium border border-[#445845]"
                    >
                      Dossier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Citizen Dossier Modal */}
      {selectedCitizen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#19221a] border border-[#39443a] rounded-xl shadow-2xl p-5 text-[#e8e9e3]">
            <div className="flex items-start justify-between pb-3 border-b border-[#2d3a2e]">
              <div>
                <span className="text-[10px] font-mono text-[#c6a76a] font-bold uppercase">
                  CITIZEN DOSSIER · ID #{selectedCitizen.id}
                </span>
                <h3 className="text-lg font-bold text-[#f3f5ef] mt-0.5">{selectedCitizen.name}</h3>
                <p className="text-xs text-[#a6bd82]">{selectedCitizen.occupation}</p>
              </div>
              <button
                onClick={() => setSelectedCitizen(null)}
                className="p-1 rounded text-[#9da99b] hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-[#252f26]">
                <span className="text-[#9da99b]">Residential District:</span>
                <span className="font-semibold">{selectedCitizen.district}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#252f26]">
                <span className="text-[#9da99b]">Education Tier:</span>
                <span className="text-[#82a6bd] font-semibold">{selectedCitizen.educationLevel}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#252f26]">
                <span className="text-[#9da99b]">Annual Income:</span>
                <span className="font-mono font-bold text-[#c6a76a]">
                  {selectedCitizen.income.toLocaleString()} Credits
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#252f26]">
                <span className="text-[#9da99b]">Cognitive Coprocessor Allocation:</span>
                <span className="font-mono font-bold text-[#82a6bd]">
                  {selectedCitizen.aiAssistanceUsage}% Usage
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#9da99b]">Overall Status:</span>
                <span className="text-[#a6bd82] font-bold uppercase">{selectedCitizen.status}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedCitizen(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#394b35] hover:bg-[#4b6145] text-[#dce9ca]"
              >
                Dismiss Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
