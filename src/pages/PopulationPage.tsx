import React, { useState, useMemo } from 'react';
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
  Award,
  Crown,
  Wheat,
  Shield,
  Zap,
  Home,
  HeartPulse
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell
} from 'recharts';
import { useGameState } from '../context/GameStateContext';
import { Citizen } from '../types/game';
import AnnoCitizenCard from '../components/game/AnnoCitizenCard';
import { soundFx } from '../services/soundFx';

interface PopulationPageProps {
  onClose?: () => void;
}

interface SocialTier {
  id: string;
  name: string;
  icon: string;
  count: number;
  satisfaction: number;
  taxContribution: number;
  unlockedPerk: string;
  primaryNeeds: string[];
}

const initialTiers: SocialTier[] = [
  {
    id: 'tier-pioneers',
    name: 'Pioneers & Laborers',
    icon: '🧑‍🌾',
    count: 420000,
    satisfaction: 92,
    taxContribution: 45,
    unlockedPerk: 'Manual Labor & Agri-Basins',
    primaryNeeds: ['Food Rations', 'Potable Water', 'Basic Habitation'],
  },
  {
    id: 'tier-artisans',
    name: 'Artisans & Fabricators',
    icon: '👷',
    count: 360000,
    satisfaction: 88,
    taxContribution: 94,
    unlockedPerk: 'Smelters & Structural Foundries',
    primaryNeeds: ['Grid Power', 'Civic Safety', 'Transit Link'],
  },
  {
    id: 'tier-engineers',
    name: 'Engineers & Scholars',
    icon: '🧑‍🔬',
    count: 280000,
    satisfaction: 84,
    taxContribution: 165,
    unlockedPerk: 'Quantum AI & Bio-Dome Arcologies',
    primaryNeeds: ['AI Coprocessor', 'Polytechnic Access', 'Sanatorium'],
  },
  {
    id: 'tier-investors',
    name: 'High Council & Architects',
    icon: '👑',
    count: 140000,
    satisfaction: 78,
    taxContribution: 280,
    unlockedPerk: 'Sovereign Directives & CRC Dividends',
    primaryNeeds: ['Luxury Synthetics', 'Imperial Data Ledger', 'Aesthetics'],
  },
];

const agePyramid = [
  { range: '0-14', male: 118, female: 114 },
  { range: '15-29', male: 165, female: 160 },
  { range: '30-44', male: 198, female: 192 },
  { range: '45-59', male: 142, female: 146 },
  { range: '60-74', male: 88, female: 94 },
  { range: '75+', male: 32, female: 38 },
];

const educationData = [
  { level: 'Foundational', pct: 28 },
  { level: 'Technical / Vocational', pct: 36 },
  { level: 'Polytechnic Graduate', pct: 24 },
  { level: 'Doctorate & Academic', pct: 12 },
];

export const PopulationPage: React.FC<PopulationPageProps> = ({ onClose }) => {
  const { resources, rates, citizens, civilization, triggerToast } = useGameState();
  const [tiers, setTiers] = useState<SocialTier[]>(initialTiers);
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [inspectedCitizen, setInspectedCitizen] = useState<Citizen | null>(citizens[0] || null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const filteredCitizens = useMemo(() => {
    const s = search.toLowerCase();
    return citizens.filter((c) => {
      const matchesSearch =
        !s ||
        c.name.toLowerCase().includes(s) ||
        c.occupation.toLowerCase().includes(s) ||
        c.district.toLowerCase().includes(s);
      const matchesDistrict = selectedDistrict === 'all' || c.district === selectedDistrict;
      return matchesSearch && matchesDistrict;
    });
  }, [citizens, search, selectedDistrict]);

  const totalPages = Math.max(1, Math.ceil(filteredCitizens.length / pageSize));
  const paginatedCitizens = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCitizens.slice(start, start + pageSize);
  }, [filteredCitizens, currentPage, pageSize]);

  const handlePromoteTier = (tierId: string) => {
    soundFx.playReward();
    setTiers((prev) =>
      prev.map((t) =>
        t.id === tierId
          ? {
              ...t,
              count: t.count + 15000,
              satisfaction: Math.min(100, t.satisfaction + 4),
              taxContribution: t.taxContribution + 18,
            }
          : t
      )
    );
    const targetTier = tiers.find((t) => t.id === tierId);
    triggerToast({
      type: 'reward',
      title: `POPULATION ELEVATION: ${targetTier?.name}`,
      subtitle: `+15,000 citizens upgraded. Imperial fiscal yield increased!`,
    });
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#171D18]/95 backdrop-blur-md text-[#EAE3D2] overflow-hidden select-none font-sans">
      {/* Top Header */}
      <div className="flex-shrink-0 px-8 py-5 border-b border-[#C5A66A]/20 bg-gradient-to-r from-[#171D18] via-[#202820] to-[#171D18] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm border border-[#C5A66A]/40 bg-[#17231B] flex items-center justify-center text-[#C5A66A] shadow-inner">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl text-[#EAE3D2] tracking-wider font-semibold">
                POPULATION INTELLIGENCE & DEMOGRAPHICS
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-[#C5A66A]/40 text-[#C5A66A] bg-[#C5A66A]/10">
                Imperial Census Bureau
              </span>
            </div>
            <p className="text-xs text-[#A5AD9D] font-sans mt-0.5">
              Demographic distribution, workforce mobility, living conditions, and individual citizen dossiers.
            </p>
          </div>
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

      {/* Demographic KPIs Bar */}
      <div className="flex-shrink-0 grid grid-cols-2 md:grid-cols-6 gap-3 px-8 py-3.5 bg-[#17231B]/60 border-b border-[#C5A66A]/15 font-sans">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-[#A5AD9D]">Total Population</span>
          <span className="text-lg font-serif font-bold text-[#EAE3D2] mt-0.5">
            {(resources.population / 1000000).toFixed(3)}M
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-[#A5AD9D]">Annual Growth</span>
          <span className="text-lg font-serif font-bold text-[#8FA879] mt-0.5">
            +{rates.populationGrowthRate}%/yr
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-[#A5AD9D]">Public Happiness</span>
          <span className="text-lg font-serif font-bold text-[#C5A66A] mt-0.5">
            {resources.happiness} <span className="text-xs text-[#A5AD9D]">/ 100</span>
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-[#A5AD9D]">Average Lifespan</span>
          <span className="text-lg font-serif font-bold text-[#EAE3D2] mt-0.5">
            84.2 <span className="text-xs text-[#A5AD9D]">Solar Yrs</span>
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-[#A5AD9D]">Workforce Participation</span>
          <span className="text-lg font-serif font-bold text-[#8FA879] mt-0.5">
            86.4% <span className="text-xs text-[#A5AD9D]">(2.4% Unemp)</span>
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-[#A5AD9D]">Healthcare Access</span>
          <span className="text-lg font-serif font-bold text-[#8FA879] mt-0.5">
            91.8% <span className="text-xs text-[#A5AD9D]">Covered</span>
          </span>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 min-h-0 px-8 py-6 overflow-y-auto space-y-6">
        {/* Social Strata Deck (Anno 1800 Style) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-serif font-bold tracking-wider text-[#C5A66A] uppercase flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-[#C5A66A]" />
              CIVILISATION SOCIAL STRATA & BEDÜRFNISSE (NEEDS FULFILLMENT)
            </span>
            <span className="text-[11px] font-mono text-[#A5AD9D]">
              Tier 4 High Council generates +280M CRC Imperial Tax
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className="p-5 rounded bg-[#202820]/90 border border-[#C5A66A]/25 flex flex-col justify-between hover:border-[#C5A66A]/70 transition-all space-y-3 shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{tier.icon}</span>
                      <div>
                        <h3 className="font-serif text-sm font-bold text-[#EAE3D2]">{tier.name}</h3>
                        <span className="text-[10px] font-mono text-[#A5AD9D]">
                          {(tier.count / 1000).toFixed(0)}k Citizens
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#8FA879]">
                      {tier.satisfaction}%
                    </span>
                  </div>

                  {/* Satisfaction Bar */}
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-[#A5AD9D]">
                      <span>Satisfaction</span>
                      <span className="text-[#EAE3D2] font-semibold">{tier.satisfaction}/100</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#171D18] overflow-hidden border border-[#C5A66A]/20">
                      <div
                        className="h-full bg-[#8FA879] rounded-full transition-all duration-300"
                        style={{ width: `${tier.satisfaction}%` }}
                      />
                    </div>
                  </div>

                  {/* Primary Needs Pills */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {tier.primaryNeeds.map((need, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#171D18] text-[#D8CBAA] border border-[#C5A66A]/20"
                      >
                        ✓ {need}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Promote Action */}
                <div className="pt-3 border-t border-[#C5A66A]/15 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#C5A66A]">
                    +{tier.taxContribution}M CRC Tax
                  </span>
                  <button
                    onClick={() => handlePromoteTier(tier.id)}
                    className="px-2.5 py-1 rounded bg-[#17231B] hover:bg-[#C5A66A]/20 text-[#8FA879] hover:text-[#C5A66A] border border-[#8FA879]/30 text-[10px] font-serif font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                  >
                    <TrendingUp className="w-3 h-3" />
                    <span>Elevate Tier</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Demographic Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Age Cohorts Pyramid */}
          <div className="p-5 rounded bg-[#202820]/90 border border-[#C5A66A]/25 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <span className="font-serif text-sm font-bold text-[#EAE3D2] uppercase tracking-wider">
                Age Distribution Cohorts (Thousands)
              </span>
              <span className="text-[10px] font-mono text-[#A5AD9D]">Median Age: 34.2 yrs</span>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agePyramid} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="range" stroke="#A5AD9D" fontSize={10} tickLine={false} />
                  <YAxis stroke="#A5AD9D" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#171D18',
                      borderColor: '#C5A66A',
                      color: '#EAE3D2',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="male" name="Male Citizens" fill="#C5A66A" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="female" name="Female Citizens" fill="#8FA879" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Educational Attainment */}
          <div className="p-5 rounded bg-[#202820]/90 border border-[#C5A66A]/25 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-serif text-sm font-bold text-[#EAE3D2] uppercase tracking-wider">
                  Educational Attainment & Scientific Literacy
                </span>
                <span className="text-[10px] font-mono text-[#8FA879]">Index: {resources.educationIndex}/100</span>
              </div>
              <div className="space-y-3 pt-2">
                {educationData.map(ed => (
                  <div key={ed.level} className="space-y-1">
                    <div className="flex justify-between text-xs font-sans">
                      <span className="text-[#A5AD9D]">{ed.level}</span>
                      <span className="font-mono text-[#EAE3D2] font-semibold">{ed.pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#171D18] overflow-hidden border border-[#C5A66A]/20">
                      <div
                        className="h-full bg-[#C5A66A]"
                        style={{ width: `${ed.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#C5A66A]/15 text-[11px] text-[#A5AD9D] flex items-center justify-between">
              <span>Scientific workforce surplus: <strong>+18.4%</strong></span>
              <span>Literacy: <strong>99.4%</strong></span>
            </div>
          </div>
        </div>

        {/* Citizen Registry & Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Table */}
          <div className="lg:col-span-2 p-5 rounded bg-[#202820]/90 border border-[#C5A66A]/25 flex flex-col justify-between shadow-md">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#C5A66A]/20 gap-3">
                <div>
                  <span className="text-[10px] font-mono text-[#C5A66A] uppercase font-bold tracking-wider">
                    CITIZEN DIRECTORY
                  </span>
                  <h3 className="font-serif text-base font-bold text-[#EAE3D2] mt-0.5">
                    Municipal Citizen Registry
                  </h3>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A5AD9D]" />
                  <input
                    type="text"
                    placeholder="Search name, job, or district..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-[#171D18] border border-[#C5A66A]/30 rounded pl-8 pr-3 py-1 text-xs text-[#EAE3D2] placeholder-[#A5AD9D]/60 outline-none focus:border-[#C5A66A] w-52"
                  />
                </div>
              </div>

              <div className="overflow-x-auto mt-2">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="text-[#A5AD9D] font-mono text-[10px] uppercase border-b border-[#C5A66A]/20">
                    <tr>
                      <th className="py-2.5 px-3">Citizen</th>
                      <th className="py-2.5 px-3">Age / Sex</th>
                      <th className="py-2.5 px-3">Occupation</th>
                      <th className="py-2.5 px-3">District</th>
                      <th className="py-2.5 px-3">Happiness</th>
                      <th className="py-2.5 px-3 text-right">Dossier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C5A66A]/10 text-[#EAE3D2]">
                    {paginatedCitizens.map((c) => {
                      const isSelected = inspectedCitizen?.id === c.id;
                      return (
                        <tr
                          key={c.id}
                          onClick={() => { soundFx.playClick(); setInspectedCitizen(c); }}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-[#283228]' : 'hover:bg-[#17231B]'
                          }`}
                        >
                          <td className="py-2.5 px-3 font-semibold text-[#EAE3D2] flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#8FA879]" />
                            <span>{c.name}</span>
                          </td>
                          <td className="py-2.5 px-3 text-[#A5AD9D] font-mono">
                            {c.age} / {c.gender}
                          </td>
                          <td className="py-2.5 px-3 text-[#D8CBAA]">{c.occupation}</td>
                          <td className="py-2.5 px-3 text-[#A5AD9D]">{c.district}</td>
                          <td className="py-2.5 px-3 font-mono text-[#8FA879] font-semibold">
                            {c.happiness}/100
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                soundFx.playClick();
                                setInspectedCitizen(c);
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-serif uppercase tracking-wider ${
                                isSelected
                                  ? 'bg-[#C5A66A] text-[#171D18] font-bold'
                                  : 'bg-[#171D18] text-[#C5A66A] border border-[#C5A66A]/30 hover:bg-[#C5A66A]/10'
                              }`}
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-3 rounded bg-[#171D18] border border-[#C5A66A]/15 text-[10px] font-mono text-[#A5AD9D] mt-4 flex items-center justify-between">
              <span>Workforce Engagement: 86.4%</span>
              <div className="flex items-center gap-2">
                <span>Total Records: {filteredCitizens.length}</span>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1 ml-3">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2 py-0.5 rounded bg-[#202820] text-[#EAE3D2] disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <span>{currentPage}/{totalPages}</span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2 py-0.5 rounded bg-[#202820] text-[#EAE3D2] disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dossier Card */}
          <div className="flex flex-col items-center justify-start">
            <span className="text-[10px] font-mono font-bold text-[#C5A66A] uppercase tracking-wider mb-2 self-start">
              Selected Citizen Dossier (Anno 1800 Style)
            </span>
            {inspectedCitizen ? (
              <AnnoCitizenCard
                citizen={inspectedCitizen}
                onClose={() => setInspectedCitizen(null)}
              />
            ) : (
              <div className="w-full h-64 rounded border border-[#C5A66A]/20 bg-[#202820] flex items-center justify-center text-xs text-[#A5AD9D] p-6 text-center">
                Select any citizen from the directory to review their needs fulfillment dossier.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PopulationPage);
