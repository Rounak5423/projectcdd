import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  Sliders,
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  Wheat,
  Droplets,
  Zap,
  Package,
  FlaskConical,
  Globe2,
  Ship,
  PlusCircle,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  X,
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
  Legend,
} from 'recharts';
import { useGameState } from '../context/GameStateContext';

interface TradeRoute {
  id: string;
  partnerCiv: string;
  partnerPlanet: string;
  exportResource: string;
  exportAmount: number;
  importResource: string;
  importAmount: number;
  netRevenueCredits: number;
  status: 'Active' | 'Under Review' | 'Congested';
}

const initialTradeRoutes: TradeRoute[] = [
  {
    id: 'tr-01',
    partnerCiv: 'Neo Byzantium',
    partnerPlanet: 'Aethelgard Prime',
    exportResource: 'Aeroponic Food Rations',
    exportAmount: 40,
    importResource: 'Refined Heavy Minerals',
    importAmount: 30,
    netRevenueCredits: 420,
    status: 'Active',
  },
  {
    id: 'tr-02',
    partnerCiv: 'Solaria Nexus',
    partnerPlanet: 'Hesperus II',
    exportResource: 'Quantum Telemetry Data',
    exportAmount: 15,
    importResource: 'Photovoltaic Cell Assemblies',
    importAmount: 25,
    netRevenueCredits: 680,
    status: 'Active',
  },
];

export default function EconomyPage({ onClose }: { onClose?: () => void } = {}) {
  const { resources, rates, taxRate, setTaxRate, districts, economyReport } = useGameState();
  const { economy, resources: resFlow, districts: distMetrics, alerts } = economyReport;

  const [activeTab, setActiveTab] = useState<'macro' | 'supply' | 'trade' | 'districts'>('macro');
  const [tradeRoutes, setTradeRoutes] = useState<TradeRoute[]>(initialTradeRoutes);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [emergencyRationing, setEmergencyRationing] = useState(false);

  // Advanced Tax Brackets
  const [automationSurcharge, setAutomationSurcharge] = useState(14);
  const [commercialTariff, setCommercialTariff] = useState(8);
  const [wealthBracket, setWealthBracket] = useState(6);

  // Total calculated revenue based on live simulation
  const totalTaxYield = economy.totalAnnualRevenueBillion;

  // Supply vs demand data from live simulation engine
  const supplyDemandData = [
    { name: 'Food (Rations)', production: resFlow.foodProduced, consumption: resFlow.foodConsumed, surplus: resFlow.foodNet },
    { name: 'Water (kL)', production: resFlow.waterProduced, consumption: resFlow.waterConsumed, surplus: resFlow.waterNet },
    { name: 'Energy (MW)', production: resFlow.energyProducedMW, consumption: resFlow.energyConsumedMW, surplus: resFlow.energyNetMW },
    { name: 'Materials (T)', production: resFlow.materialsProduced, consumption: resFlow.materialsConsumed, surplus: resFlow.materialsNet },
  ];

  const handleEstablishTrade = (newRoute: TradeRoute) => {
    setTradeRoutes((prev) => [...prev, newRoute]);
    setIsTradeModalOpen(false);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 overflow-y-auto custom-scrollbar text-[#e8e9e3] max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#39443a] gap-4">
        <div>
          <span className="eyebrow text-[#c6a76a]">FISCAL ARCHITECTURE & WEALTH</span>
          <h1 className="text-2xl font-bold text-[#f3f5ef] mt-0.5">Macroeconomic Command & Trade</h1>
          <p className="text-xs text-[#9da99b] mt-1">
            Manage multi-tier tax yields, off-world trade corridors, supply-demand equilibriums, and emergency reserves.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-[#182119] p-3 rounded-xl border border-[#2e3c2f] text-xs font-mono">
            <div>
              <span className="text-[#9da99b] block text-[10px]">ANNUAL GROSS OUTPUT</span>
              <span className="text-sm font-bold text-[#c6a76a]">{resources.gdp} B Credits</span>
            </div>
            <div className="w-px h-6 bg-[#2c392d]" />
            <div>
              <span className="text-[#9da99b] block text-[10px]">TOTAL FISCAL INFLOW</span>
              <span className="text-sm font-bold text-[#a6bd82]">+{totalTaxYield}M Cr/yr</span>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-[#182119] hover:bg-[#253226] text-[#9da99b] hover:text-[#f3f5ef] border border-[#2e3c2f] transition-colors"
              title="Return to World"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center bg-[#151c16] p-1 rounded-xl border border-[#2d3a2e] w-fit">
        <button
          onClick={() => setActiveTab('macro')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'macro'
              ? 'bg-[#3b4c37] text-[#dce9ca] border border-[#5d7756] shadow-sm'
              : 'text-[#9da99b] hover:text-white'
          }`}
        >
          Macro & Tax Brackets
        </button>
        <button
          onClick={() => setActiveTab('supply')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'supply'
              ? 'bg-[#3b4c37] text-[#dce9ca] border border-[#5d7756] shadow-sm'
              : 'text-[#9da99b] hover:text-white'
          }`}
        >
          Commodity Equilibrium
        </button>
        <button
          onClick={() => setActiveTab('trade')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'trade'
              ? 'bg-[#3b4c37] text-[#dce9ca] border border-[#5d7756] shadow-sm'
              : 'text-[#9da99b] hover:text-white'
          }`}
        >
          Off-World Corridors ({tradeRoutes.length})
        </button>
        <button
          onClick={() => setActiveTab('districts')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'districts'
              ? 'bg-[#3b4c37] text-[#dce9ca] border border-[#5d7756] shadow-sm'
              : 'text-[#9da99b] hover:text-white'
          }`}
        >
          District Performance
        </button>
      </div>

      {/* TAB 1: MACRO & FISCAL TAX BRACKETS */}
      {activeTab === 'macro' && (
        <div className="space-y-6">
          {/* Top 4 KPI Metric Tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'GROSS CIVIL OUTPUT', val: `${resources.gdp}B Cr`, note: `+${rates.gdpGrowthRate}% expansion/yr`, icon: TrendingUp, color: '#c6a76a' },
              { label: 'AVERAGE CITIZEN INCOME', val: '78,400 Cr', note: 'Higher technical strata parity', icon: DollarSign, color: '#a6bd82' },
              { label: 'INFLATION RATE', val: '1.4%', note: 'Optimal liquidity corridor', icon: Scale, color: '#82a6bd' },
              { label: 'GINI INEQUALITY INDEX', val: '0.24', note: 'High egalitarian tier', icon: PieIcon, color: '#bd9fa6' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="panel p-4 bg-[#182119] border-[#313f32]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono tracking-wider text-[#9da99b]">{item.label}</span>
                    <Icon size={16} style={{ color: item.color }} />
                  </div>
                  <p className="text-2xl font-bold text-[#f3f5ef] mt-2 font-mono">{item.val}</p>
                  <p className="text-xs text-[#a6bd82] mt-1">{item.note}</p>
                </div>
              );
            })}
          </div>

          {/* Multi-Tier Tax Calibration Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="panel p-5 bg-[#182119] border-[#313f32] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#29342a]">
                <div>
                  <span className="eyebrow text-[#c6a76a]">TAX JURISDICTIONS</span>
                  <h3 className="text-sm font-bold text-[#f3f5ef] mt-0.5">Four-Tier Fiscal Calibration</h3>
                </div>
                <span className="text-xs font-mono font-bold text-[#a6bd82] px-2 py-0.5 rounded bg-[#1b231d] border border-[#374737]">
                  Yield: +{totalTaxYield}M Cr/yr
                </span>
              </div>

              {/* Slider 1: Base Corporate Rate */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#f0f3eb] font-medium">Standard Corporate Rate</span>
                  <span className="font-mono text-[#c6a76a] font-bold">{taxRate}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full accent-[#a6bd82]"
                />
                <div className="flex justify-between text-[10px] font-mono text-[#8e9c8c]">
                  <span>5% (Incentive)</span>
                  <span>40% (Welfare Core)</span>
                </div>
              </div>

              {/* Slider 2: Automation Surcharge */}
              <div className="space-y-1.5 pt-2 border-t border-[#253026]">
                <div className="flex justify-between text-xs">
                  <span className="text-[#f0f3eb] font-medium">Industrial Robot Automation Levy</span>
                  <span className="font-mono text-[#82a6bd] font-bold">{automationSurcharge}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="35"
                  value={automationSurcharge}
                  onChange={(e) => setAutomationSurcharge(Number(e.target.value))}
                  className="w-full accent-[#82a6bd]"
                />
                <span className="text-[10px] text-[#9da99b] block">
                  Funds public retraining stipends from autonomous robot operating hours.
                </span>
              </div>

              {/* Slider 3: Commercial Transaction Duty */}
              <div className="space-y-1.5 pt-2 border-t border-[#253026]">
                <div className="flex justify-between text-xs">
                  <span className="text-[#f0f3eb] font-medium">Commercial Maglev Transaction Duty</span>
                  <span className="font-mono text-[#a6bd82] font-bold">{commercialTariff}%</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="20"
                  value={commercialTariff}
                  onChange={(e) => setCommercialTariff(Number(e.target.value))}
                  className="w-full accent-[#a6bd82]"
                />
              </div>

              {/* Slider 4: High-Income Bracket */}
              <div className="space-y-1.5 pt-2 border-t border-[#253026]">
                <div className="flex justify-between text-xs">
                  <span className="text-[#f0f3eb] font-medium">Executive Tier Wealth Surcharge</span>
                  <span className="font-mono text-[#bd9fa6] font-bold">{wealthBracket}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={wealthBracket}
                  onChange={(e) => setWealthBracket(Number(e.target.value))}
                  className="w-full accent-[#bd9fa6]"
                />
              </div>
            </div>

            {/* Wealth Distribution Strata breakdown */}
            <div className="panel p-5 bg-[#182119] border-[#313f32] space-y-4 flex flex-col justify-between">
              <div>
                <span className="eyebrow text-[#c6a76a]">WEALTH EQUILIBRIUM & CITIZEN STRATA</span>
                <h3 className="text-sm font-bold text-[#f3f5ef] mt-0.5">Civilisational Wealth Stratification</h3>
                <p className="text-xs text-[#9da99b] mt-1 leading-relaxed">
                  Proportion of total income and asset ownership across major socioeconomic cohorts.
                </p>

                <div className="mt-4 space-y-3">
                  {[
                    { group: 'Autonomous Algorithmic Dividend Cohort', share: '32%', pop: '420,000 citizens', color: '#a6bd82' },
                    { group: 'Specialist Engineers & Quantum Physicists', share: '38%', pop: '380,000 citizens', color: '#c6a76a' },
                    { group: 'Agrarian & Infrastructure Operators', share: '22%', pop: '310,000 citizens', color: '#82a6bd' },
                    { group: 'Foundational Pioneer Class', share: '8%', pop: '132,680 citizens', color: '#bd9fa6' },
                  ].map((stratum, i) => (
                    <div key={i} className="p-3 rounded-lg bg-[#141914] border border-[#263127]">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-[#f0f3eb]">{stratum.group}</span>
                        <span className="font-mono font-bold text-[#c6a76a]">{stratum.share} Wealth</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-[#9da99b]">
                        <span>Census: {stratum.pop}</span>
                        <span className="text-[#a6bd82]">Universal Basic Income Active</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded bg-[#131914] border border-[#273328] text-[11px] text-[#a6bd82] flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>Gini Coefficient holds below 0.25 (World-class societal stability target achieved).</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMMODITY EQUILIBRIUM */}
      {activeTab === 'supply' && (
        <div className="space-y-6">
          <div className="panel p-5 bg-[#182119] border-[#313f32] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#29342a]">
              <div>
                <span className="eyebrow text-[#c6a76a]">COMMODITY SURPLUS MATRIX</span>
                <h3 className="text-base font-bold text-[#f3f5ef] mt-0.5">
                  Daily Production vs Consumption Balance
                </h3>
              </div>

              {/* Emergency Rationing Toggle */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setEmergencyRationing(!emergencyRationing)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all ${
                    emergencyRationing
                      ? 'bg-[#3b2724] text-[#d47e69] border-[#5a312a]'
                      : 'bg-[#1b251d] text-[#a6bd82] border-[#384c3a] hover:bg-[#253328]'
                  }`}
                >
                  <ShieldAlert size={14} />
                  <span>{emergencyRationing ? 'Emergency Rationing ACTIVE (-30% Cons.)' : 'Normal Consumption'}</span>
                </button>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={supplyDemandData} margin={{ top: 10, right: 20, left: -5, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#718070" tick={{ fill: '#9da99b', fontSize: 10 }} />
                  <YAxis stroke="#718070" tick={{ fill: '#9da99b', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#171d18', borderColor: '#39443a', borderRadius: '8px', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="production" name="Daily Production" fill="#a6bd82" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="consumption" name="Daily Consumption" fill="#d47e69" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="surplus" name="Net Stockpile Accrual" fill="#c6a76a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: OFF-WORLD CORRIDORS */}
      {activeTab === 'trade' && (
        <div className="space-y-6">
          <div className="panel p-5 bg-[#182119] border-[#313f32] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#29342a]">
              <div>
                <span className="eyebrow text-[#c6a76a]">INTERSTELLAR COMMERCE</span>
                <h3 className="text-base font-bold text-[#f3f5ef] mt-0.5">Established Trade Corridors</h3>
              </div>

              <button
                onClick={() => setIsTradeModalOpen(true)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#405439] hover:bg-[#526b48] text-[#dce9ca] flex items-center gap-1.5 border border-[#6b8563] shadow-md"
              >
                <PlusCircle size={14} /> Establish New Trade Route
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tradeRoutes.map((route) => (
                <div key={route.id} className="p-4 rounded-xl bg-[#141a15] border border-[#2a362b] space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-[#c6a76a] font-bold uppercase">
                        TRADE PARTNER
                      </span>
                      <h4 className="text-base font-bold text-[#f3f5ef]">{route.partnerCiv}</h4>
                      <p className="text-xs text-[#9da99b]">{route.partnerPlanet}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#233526] text-[#a6bd82] border border-[#3b543e]">
                      {route.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#232c24]">
                    <div className="p-2 rounded bg-[#182019] border border-[#273328]">
                      <span className="text-[10px] text-[#9da99b] block">EXPORTING</span>
                      <span className="font-semibold text-[#a6bd82]">{route.exportResource}</span>
                      <span className="text-[10px] font-mono text-[#9da99b] block mt-0.5">
                        {route.exportAmount} Units/day
                      </span>
                    </div>

                    <div className="p-2 rounded bg-[#182019] border border-[#273328]">
                      <span className="text-[10px] text-[#9da99b] block">IMPORTING</span>
                      <span className="font-semibold text-[#82a6bd]">{route.importResource}</span>
                      <span className="text-[10px] font-mono text-[#9da99b] block mt-0.5">
                        {route.importAmount} Units/day
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs font-mono">
                    <span className="text-[#9da99b]">Net Tariff Revenue:</span>
                    <span className="font-bold text-[#c6a76a]">+{route.netRevenueCredits} Cr/cycle</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DISTRICT PERFORMANCE */}
      {activeTab === 'districts' && (
        <div className="panel p-5 bg-[#182119] border-[#313f32] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#29342a]">
            <div>
              <span className="eyebrow text-[#c6a76a]">REGIONAL PRODUCTIVITY MATRIX</span>
              <h3 className="text-base font-bold text-[#f3f5ef] mt-0.5">
                District-Level Labor & Capital Output
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[#8e9c8c] font-mono text-[10px] uppercase border-b border-[#263127]">
                <tr>
                  <th className="py-3 px-3">District Name</th>
                  <th className="py-3 px-3">Specialization</th>
                  <th className="py-3 px-3">Population</th>
                  <th className="py-3 px-3">Efficiency</th>
                  <th className="py-3 px-3">Regional Output</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#212b22]">
                {districts.map((d) => (
                  <tr key={d.id} className="hover:bg-[#1f2820] transition-colors">
                    <td className="py-3 px-3 font-semibold text-[#f0f3eb] flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span>{d.name}</span>
                    </td>
                    <td className="py-3 px-3 text-[#9da99b]">{d.specialization}</td>
                    <td className="py-3 px-3 font-mono">{(d.population / 1000).toLocaleString()}k</td>
                    <td className="py-3 px-3 font-mono text-[#a6bd82] font-semibold">{d.efficiency}%</td>
                    <td className="py-3 px-3 font-mono text-[#c6a76a] font-bold">
                      {(resources.gdp * (d.population / resources.population)).toFixed(2)}B Cr
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Establish Trade Route Modal */}
      {isTradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#19221a] border border-[#39443a] rounded-xl shadow-2xl p-6 text-[#e8e9e3]">
            <div className="flex items-start justify-between pb-3 border-b border-[#2d3a2e]">
              <div>
                <span className="text-[10px] font-mono text-[#c6a76a] font-bold uppercase">
                  DIPLOMATIC CONSORTIUM
                </span>
                <h3 className="text-lg font-bold text-[#f3f5ef] mt-0.5">Establish Trade Corridor</h3>
              </div>
              <button
                onClick={() => setIsTradeModalOpen(false)}
                className="p-1 rounded text-[#9da99b] hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-mono text-[#9da99b] uppercase block mb-1">
                  Partner Civilisation
                </label>
                <select className="w-full bg-[#131914] border border-[#2b392d] rounded-lg px-3 py-2 text-xs text-[#f3f5ee] outline-none">
                  <option>Aethelgard Core Alliance</option>
                  <option>Hyperion Orbital Freehold</option>
                  <option>Covenant of Europa</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#9da99b] uppercase block mb-1">
                  Surplus Commodity to Export
                </label>
                <select className="w-full bg-[#131914] border border-[#2b392d] rounded-lg px-3 py-2 text-xs text-[#f3f5ee] outline-none">
                  <option>Aeroponic Food Rations (+142 surplus/day)</option>
                  <option>Refined Nanofab Materials (+94 surplus/day)</option>
                  <option>Quantum Sensor Telemetry (+36 surplus/day)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#9da99b] uppercase block mb-1">
                  Required Import Commodity
                </label>
                <select className="w-full bg-[#131914] border border-[#2b392d] rounded-lg px-3 py-2 text-xs text-[#f3f5ee] outline-none">
                  <option>Deuterium Fuel Pellets (Fusion Prep)</option>
                  <option>Rare Isotope Superconductors</option>
                  <option>Neural Bio-Gel Media</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-[#2d3a2e] flex items-center justify-between">
              <span className="text-xs font-mono text-[#c6a76a]">Est. Net: +540 Cr/cycle</span>

              <button
                onClick={() =>
                  handleEstablishTrade({
                    id: `tr-${Date.now()}`,
                    partnerCiv: 'Aethelgard Core Alliance',
                    partnerPlanet: 'Aethelgard Prime',
                    exportResource: 'Aeroponic Food Rations',
                    exportAmount: 35,
                    importResource: 'Deuterium Pellets',
                    importAmount: 20,
                    netRevenueCredits: 540,
                    status: 'Active',
                  })
                }
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#405439] hover:bg-[#526b48] text-[#dce9ca] border border-[#6b8563]"
              >
                Sign Trade Treaty
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
