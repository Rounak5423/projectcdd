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
  Award,
  Crown,
  Wheat,
  Shield,
  Zap,
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
} from 'recharts';
import { useGameState } from '../context/GameStateContext';
import { Citizen } from '../types/game';
import AnnoCitizenCard from '../components/game/AnnoCitizenCard';

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
    unlockedPerk: 'Basic Manual Labor & Agriculture',
    primaryNeeds: ['Food Rations', 'Potable Water'],
  },
  {
    id: 'tier-artisans',
    name: 'Artisans & Agrarians',
    icon: '👷',
    count: 360000,
    satisfaction: 88,
    taxContribution: 94,
    unlockedPerk: 'Nanotube Foundries & Wind Turbines',
    primaryNeeds: ['Grid Power', 'Civic Safety'],
  },
  {
    id: 'tier-engineers',
    name: 'Engineers & Scientists',
    icon: '🧑‍🔬',
    count: 280000,
    satisfaction: 84,
    taxContribution: 165,
    unlockedPerk: 'Quantum AI & Bio-Dome Arcologies',
    primaryNeeds: ['AI Coprocessor', 'Polytechnic Access'],
  },
  {
    id: 'tier-investors',
    name: 'High Council & Investors',
    icon: '👑',
    count: 140000,
    satisfaction: 78,
    taxContribution: 280,
    unlockedPerk: 'Off-World Trade Fleets & GRC Dividends',
    primaryNeeds: ['Luxury Synthetics', 'Galactic Data'],
  },
];

const ageDistribution = [
  { group: '0-14', male: 118, female: 114 },
  { group: '15-29', male: 165, female: 160 },
  { group: '30-44', male: 198, female: 192 },
  { group: '45-59', male: 142, female: 146 },
  { group: '60-74', male: 88, female: 94 },
  { group: '75+', male: 32, female: 38 },
];

export default function PopulationPage() {
  const { resources, rates, citizens, civilization, triggerToast } = useGameState();
  const [tiers, setTiers] = useState<SocialTier[]>(initialTiers);
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [inspectedCitizen, setInspectedCitizen] = useState<Citizen | null>(citizens[0] || null);

  const filteredCitizens = citizens.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.occupation.toLowerCase().includes(search.toLowerCase());
    const matchesDistrict = selectedDistrict === 'all' || c.district === selectedDistrict;
    return matchesSearch && matchesDistrict;
  });

  const handlePromoteTier = (tierId: string) => {
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
      title: `POPULATION PROMOTION: ${targetTier?.name}`,
      subtitle: `+15,000 citizens upgraded. Tax inflow elevated!`,
    });
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#111417] text-[#ede8dc] select-none overflow-y-auto custom-scrollbar p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ================= HEADER BAR ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#252f36] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="eyebrow text-[#c29b38]">DEMOGRAPHIC MATRIX & CITIZEN WELLBEING</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#7ea376]" />
          </div>
          <h1 className="text-2xl font-bold text-[#ede8dc] mt-0.5">
            Population Strata & Human Capital
          </h1>
          <p className="text-xs text-[#8a8376] mt-1">
            Manage citizen social classes, monitor needs fulfillment (Bedürfnisse), and promote social mobility.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#161c20] p-3 rounded-lg border border-[#2b353b] text-xs font-mono">
          <div>
            <span className="text-[#8a8376] block text-[10px]">TOTAL CENSUS</span>
            <span className="text-sm font-bold text-[#ede8dc]">
              {(resources.population / 1000000).toFixed(3)} M
            </span>
          </div>
          <div className="w-px h-6 bg-[#252f36]" />
          <div>
            <span className="text-[#8a8376] block text-[10px]">NATURAL GROWTH</span>
            <span className="text-sm font-bold text-[#7ea376]">+{rates.populationGrowthRate}%/yr</span>
          </div>
          <div className="w-px h-6 bg-[#252f36]" />
          <div>
            <span className="text-[#8a8376] block text-[10px]">PUBLIC HAPPINESS</span>
            <span className="text-sm font-bold text-[#dfb74a]">{resources.happiness}/100</span>
          </div>
        </div>
      </div>

      {/* ================= ANNO 1800 4-TIER SOCIAL STRATA DECK ================= */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-bold tracking-wider text-[#c29b38] uppercase flex items-center gap-1.5">
            <Crown size={14} className="text-[#c29b38]" />
            CIVILISATION SOCIAL STRATA & NEEDS FULFILLMENT
          </span>
          <span className="text-[11px] font-mono text-[#8a8376]">
            Tier 4 Investors generate +280M Credits/yr
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className="p-4 rounded-lg bg-[#161c20] border border-[#2b353b] flex flex-col justify-between hover:border-[#8f7742] transition-all space-y-3 shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{tier.icon}</span>
                    <div>
                      <h3 className="text-xs font-bold text-[#ede8dc] leading-tight">{tier.name}</h3>
                      <span className="text-[10px] font-mono text-[#8a8376]">
                        {(tier.count / 1000).toFixed(0)}k Citizens
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#7ea376]">
                    {tier.satisfaction}%
                  </span>
                </div>

                {/* Satisfaction Bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-[#8a8376]">
                    <span>Satisfaction</span>
                    <span className="text-[#f1f5f2] font-semibold">{tier.satisfaction}/100</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#080d09] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#4ade80] to-[#d4af37] rounded-full transition-all duration-300"
                      style={{ width: `${tier.satisfaction}%` }}
                    />
                  </div>
                </div>

                {/* Primary Needs Pills */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {tier.primaryNeeds.map((need, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-black/40 text-[#c6d4c8] border border-[#1b261e]"
                    >
                      ✓ {need}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Promote Action */}
              <div className="pt-2 border-t border-[#1a251c] flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#d4af37]">
                  +{tier.taxContribution}M Cr Tax
                </span>
                <button
                  onClick={() => handlePromoteTier(tier.id)}
                  className="px-2 py-1 rounded bg-[#1c2b1e] hover:bg-[#283d2b] text-[#4ade80] border border-[#3b5941] text-[10px] font-bold flex items-center gap-1 transition-colors"
                >
                  <TrendingUp size={11} />
                  <span>Promote</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= CITIZEN DIRECTORY & ANNO DOSSIER CARD ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Citizen Table */}
        <div className="lg:col-span-2 p-5 rounded-lg bg-[#161c20] border border-[#2b353b] flex flex-col justify-between shadow-md">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#252f36] gap-3">
              <div>
                <span className="text-[10px] font-mono text-[#c29b38] uppercase font-bold">
                  CITIZEN REGISTRY
                </span>
                <h3 className="text-sm font-bold text-[#ede8dc] mt-0.5">Sample Citizen Profiles</h3>
              </div>

              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8a8376]" />
                <input
                  type="text"
                  placeholder="Filter name or occupation..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-[#101416] border border-[#252f36] rounded-md pl-7 pr-3 py-1 text-xs text-[#ede8dc] placeholder-[#8a8376] outline-none focus:border-[#445663] w-48"
                />
              </div>
            </div>

            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-xs">
                <thead className="text-[#8a8376] font-mono text-[10px] uppercase border-b border-[#252f36]">
                  <tr>
                    <th className="py-2.5 px-2">Citizen</th>
                    <th className="py-2.5 px-2">Age / Sex</th>
                    <th className="py-2.5 px-2">Occupation</th>
                    <th className="py-2.5 px-2">Sector</th>
                    <th className="py-2.5 px-2">Happiness</th>
                    <th className="py-2.5 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e252a]">
                  {filteredCitizens.map((c) => {
                    const isSelected = inspectedCitizen?.id === c.id;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setInspectedCitizen(c)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#222b31]' : 'hover:bg-[#1a2126]'
                        }`}
                      >
                        <td className="py-2.5 px-2 font-semibold text-[#ede8dc] flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#7ea376]" />
                          <span>{c.name}</span>
                        </td>
                        <td className="py-2.5 px-2 text-[#8a8376] font-mono">
                          {c.age} / {c.gender}
                        </td>
                        <td className="py-2.5 px-2 text-[#aba393]">{c.occupation}</td>
                        <td className="py-2.5 px-2 text-[#8a8376]">{c.district}</td>
                        <td className="py-2.5 px-2 font-mono text-[#7ea376] font-semibold">
                          {c.happiness}/100
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectedCitizen(c);
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              isSelected
                                ? 'bg-[#dfb74a] text-[#14181b]'
                                : 'bg-[#222b31] text-[#7ea376] hover:bg-[#2b373e]'
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

          <div className="p-2.5 rounded-md bg-[#101416] border border-[#232b30] text-[10px] font-mono text-[#8a8376] mt-4 flex items-center justify-between">
            <span>Labor Force Participation: 84.6%</span>
            <span>Unemployment: 2.8%</span>
          </div>
        </div>

        {/* Right Col: Anno 1800 Citizen Dossier Card */}
        <div className="flex flex-col items-center justify-start">
          <span className="text-[10px] font-mono font-bold text-[#c29b38] uppercase tracking-wider mb-2 self-start">
            Selected Citizen Dossier (Anno 1800 Style)
          </span>
          {inspectedCitizen ? (
            <AnnoCitizenCard
              citizen={inspectedCitizen}
              onClose={() => setInspectedCitizen(null)}
            />
          ) : (
            <div className="w-full h-64 rounded-lg border border-[#2b353b] bg-[#161c20] flex items-center justify-center text-xs text-[#8a8376]">
              Click any citizen from the registry to inspect their needs dossier
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
