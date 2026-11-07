import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Zap,
  Droplets,
  Wheat,
  Hammer,
  Users,
  AlertTriangle,
  ShieldCheck,
  Building2,
  PieChart as PieIcon,
  Activity,
  Layers,
  X,
  Sliders,
  CheckCircle2,
  Info,
  ChevronRight,
  Flame,
  Scale,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useGameState } from '../../context/GameStateContext';

interface CityEconomyDashboardProps {
  onClose?: () => void;
}

export default function CityEconomyDashboard({ onClose }: CityEconomyDashboardProps) {
  const {
    resources,
    districts,
    taxRate,
    setTaxRate,
    economyReport,
    selectBuilding,
    placedBuildings,
    setActiveDrawer,
  } = useGameState();

  const [activeTab, setActiveTab] = useState<'fiscal' | 'resources' | 'districts' | 'demands'>('fiscal');

  const { economy, resources: resFlow, districts: distMetrics, demands, alerts } = economyReport;

  // Chart data for Fiscal Breakdown
  const revenueChartData = [
    { name: 'Income Tax', amount: economy.populationIncomeTax, fill: '#2ecc71' },
    { name: 'Commerce Tax', amount: economy.commercialTaxYield, fill: '#3498db' },
    { name: 'Industry Rev', amount: economy.industrialOutputRevenue, fill: '#f39c12' },
    { name: 'Trade Surplus', amount: economy.interColonyTradeSurplus, fill: '#9b59b6' },
  ];

  const expenditureChartData = [
    { name: 'Bld Maint', amount: economy.buildingMaintenanceTotal, fill: '#e74c3c' },
    { name: 'Infra Upkeep', amount: economy.infrastructureUpkeepTotal, fill: '#e67e22' },
    { name: 'Public Svcs', amount: economy.publicServicesSubsidies, fill: '#d35400' },
  ];

  const resourceComparisonData = [
    { name: 'Energy (MW)', prod: resFlow.energyProducedMW, cons: resFlow.energyConsumedMW },
    { name: 'Water (kL)', prod: resFlow.waterProduced, cons: resFlow.waterConsumed },
    { name: 'Food (Rations)', prod: resFlow.foodProduced, cons: resFlow.foodConsumed },
    { name: 'Materials (T)', prod: resFlow.materialsProduced, cons: resFlow.materialsConsumed },
  ];

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-4xl bg-[#131914]/98 border-2 border-[#364438] rounded-2xl shadow-2xl backdrop-blur-2xl text-[#e8e9e3] flex flex-col max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
    >
      {/* ================= 1. HEADER ================= */}
      <div className="p-4 sm:p-5 border-b border-[#2b372d] bg-[#18211a]/95 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#202c22] border border-[#384c3b] text-[#c6a76a]">
            <DollarSign size={22} className="text-[#c6a76a]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-[#a6bd82] uppercase font-bold">
                GENESIS CIVIC SIMULATION
              </span>
              <span
                className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                  economy.fiscalHealth === 'Surplus'
                    ? 'bg-[#1b3823] text-[#2ecc71] border border-[#2b5936]'
                    : economy.fiscalHealth === 'Balanced'
                    ? 'bg-[#332b17] text-[#f1c40f] border border-[#524424]'
                    : 'bg-[#3b1c1c] text-[#e74c3c] border border-[#5e2e2e]'
                }`}
              >
                {economy.fiscalHealth}
              </span>
            </div>
            <h2 className="text-xl font-black text-[#f3f5ef] tracking-tight">
              City Economy & Resource Engine
            </h2>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#141b15] border border-[#2d3a2f]">
          <button
            onClick={() => setActiveTab('fiscal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'fiscal'
                ? 'bg-[#29382b] text-[#f3f5ef] shadow-md border border-[#3d5340]'
                : 'text-[#8e9c8c] hover:text-[#e8e9e3]'
            }`}
          >
            Fiscal Flow
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'resources'
                ? 'bg-[#29382b] text-[#f3f5ef] shadow-md border border-[#3d5340]'
                : 'text-[#8e9c8c] hover:text-[#e8e9e3]'
            }`}
          >
            Resources
          </button>
          <button
            onClick={() => setActiveTab('districts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'districts'
                ? 'bg-[#29382b] text-[#f3f5ef] shadow-md border border-[#3d5340]'
                : 'text-[#8e9c8c] hover:text-[#e8e9e3]'
            }`}
          >
            Districts
          </button>
          <button
            onClick={() => setActiveTab('demands')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'demands'
                ? 'bg-[#29382b] text-[#f3f5ef] shadow-md border border-[#3d5340]'
                : 'text-[#8e9c8c] hover:text-[#e8e9e3]'
            }`}
          >
            <span>Demands</span>
            {alerts.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#e74c3c] animate-ping" />
            )}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 ml-2 rounded-lg text-[#8e9c8c] hover:text-[#e8e9e3] hover:bg-[#202921] transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ================= 2. BODY CONTENT ================= */}
      <div className="p-5 overflow-y-auto custom-scrollbar space-y-5">
        {/* TOP LEVEL METRIC CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* 1. Treasury Reserves */}
          <div className="p-3.5 rounded-xl bg-[#18201a] border border-[#2b372d] flex flex-col justify-between">
            <span className="text-[10px] font-mono text-[#8f9d8d] uppercase">TREASURY RESERVES</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-mono font-black text-[#c6a76a]">
                {resources.grc.toLocaleString()}
              </span>
              <span className="text-xs font-mono text-[#8f9d8d]">Cr</span>
            </div>
            <span className="text-[10px] font-mono text-[#a6bd82] mt-1">Available Capital</span>
          </div>

          {/* 2. Daily Revenues */}
          <div className="p-3.5 rounded-xl bg-[#18201a] border border-[#2b372d] flex flex-col justify-between">
            <span className="text-[10px] font-mono text-[#8f9d8d] uppercase">DAILY REVENUES</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-mono font-black text-[#2ecc71]">
                +{economy.totalDailyRevenue}
              </span>
              <span className="text-xs font-mono text-[#8f9d8d]">Cr/d</span>
            </div>
            <span className="text-[10px] font-mono text-[#8f9d8d] mt-1">
              ~{economy.totalAnnualRevenueBillion}B Cr/yr
            </span>
          </div>

          {/* 3. Daily Expenditures */}
          <div className="p-3.5 rounded-xl bg-[#18201a] border border-[#2b372d] flex flex-col justify-between">
            <span className="text-[10px] font-mono text-[#8f9d8d] uppercase">DAILY EXPENDITURES</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-mono font-black text-[#e74c3c]">
                -{economy.totalDailyExpenditure}
              </span>
              <span className="text-xs font-mono text-[#8f9d8d]">Cr/d</span>
            </div>
            <span className="text-[10px] font-mono text-[#8f9d8d] mt-1">
              Maint & Services
            </span>
          </div>

          {/* 4. Net Cash Flow */}
          <div className="p-3.5 rounded-xl bg-[#18201a] border border-[#2b372d] flex flex-col justify-between">
            <span className="text-[10px] font-mono text-[#8f9d8d] uppercase">NET CASH FLOW</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span
                className={`text-xl font-mono font-black ${
                  economy.netDailyCashFlow >= 0 ? 'text-[#2ecc71]' : 'text-[#e74c3c]'
                }`}
              >
                {economy.netDailyCashFlow >= 0 ? `+${economy.netDailyCashFlow}` : economy.netDailyCashFlow}
              </span>
              <span className="text-xs font-mono text-[#8f9d8d]">Cr/d</span>
            </div>
            <span
              className={`text-[10px] font-mono mt-1 ${
                economy.netDailyCashFlow >= 0 ? 'text-[#2ecc71]' : 'text-[#e74c3c]'
              }`}
            >
              {economy.netDailyCashFlow >= 0 ? 'Budget Expanding' : 'Budget Deficit'}
            </span>
          </div>
        </div>

        {/* ================= TAB 1: FISCAL OVERVIEW ================= */}
        {activeTab === 'fiscal' && (
          <div className="space-y-4">
            {/* Tax Policy Slider */}
            <div className="p-4 rounded-xl bg-[#18201a] border border-[#2b372d]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sliders size={15} className="text-[#c6a76a]" />
                  <span className="text-xs font-mono font-bold text-[#f3f5ef] uppercase">
                    MUNICIPAL TAX RATE POLICY
                  </span>
                </div>
                <span className="text-sm font-mono font-black text-[#c6a76a] px-2.5 py-0.5 rounded bg-[#222c23] border border-[#3b4c3d]">
                  {taxRate}%
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={35}
                step={1}
                value={taxRate}
                onChange={(e) => setTaxRate(parseInt(e.target.value))}
                className="w-full accent-[#c6a76a] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#8f9d8d] mt-1.5">
                <span>5% (Libertarian Growth)</span>
                <span>Current Yield: +{economy.populationIncomeTax} Cr/day</span>
                <span>35% (Heavy Taxation)</span>
              </div>
            </div>

            {/* Income vs Expenditure Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Revenues Chart */}
              <div className="p-4 rounded-xl bg-[#18201a] border border-[#2b372d]">
                <span className="text-xs font-mono font-bold text-[#2ecc71] uppercase block mb-3">
                  REVENUE STREAMS BREAKDOWN (+{economy.totalDailyRevenue} Cr/day)
                </span>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueChartData} layout="vertical" margin={{ left: 15, right: 15 }}>
                      <XAxis type="number" stroke="#667768" tick={{ fontSize: 10, fill: '#8f9d8d' }} />
                      <YAxis dataKey="name" type="category" stroke="#667768" tick={{ fontSize: 10, fill: '#e8e9e3' }} width={90} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18211a', borderColor: '#334235', borderRadius: '8px' }}
                        formatter={(val) => [`${val} Cr/day`, 'Yield']}
                      />
                      <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                        {revenueChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Expenditures Chart */}
              <div className="p-4 rounded-xl bg-[#18201a] border border-[#2b372d]">
                <span className="text-xs font-mono font-bold text-[#e74c3c] uppercase block mb-3">
                  EXPENDITURE ALLOCATION (-{economy.totalDailyExpenditure} Cr/day)
                </span>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={expenditureChartData} layout="vertical" margin={{ left: 15, right: 15 }}>
                      <XAxis type="number" stroke="#667768" tick={{ fontSize: 10, fill: '#8f9d8d' }} />
                      <YAxis dataKey="name" type="category" stroke="#667768" tick={{ fontSize: 10, fill: '#e8e9e3' }} width={90} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18211a', borderColor: '#334235', borderRadius: '8px' }}
                        formatter={(val) => [`${val} Cr/day`, 'Upkeep']}
                      />
                      <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                        {expenditureChartData.map((entry, index) => (
                          <Cell key={`cell-exp-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: RESOURCES & UTILITIES ================= */}
        {activeTab === 'resources' && (
          <div className="space-y-4">
            {/* 4 Utility Grids */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Electricity Grid */}
              <div className="p-4 rounded-xl bg-[#18201a] border border-[#2b372d]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-[#f1c40f]" />
                    <span className="text-xs font-mono font-bold text-[#f3f5ef]">ELECTRICITY GRID</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      resFlow.energyNetMW >= 0 ? 'text-[#2ecc71] bg-[#1a2d1f]' : 'text-[#e74c3c] bg-[#381a1a]'
                    }`}
                  >
                    {resFlow.energyNetMW >= 0 ? `+${resFlow.energyNetMW} MW Net` : `${resFlow.energyNetMW} MW Deficit`}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-[#131914] border border-[#222d24]">
                    <span className="text-[9px] text-[#8f9d8d] block">GENERATION</span>
                    <span className="font-bold text-[#2ecc71]">{resFlow.energyProducedMW} MW</span>
                  </div>
                  <div className="p-2 rounded bg-[#131914] border border-[#222d24]">
                    <span className="text-[9px] text-[#8f9d8d] block">CONSUMPTION</span>
                    <span className="font-bold text-[#e74c3c]">{resFlow.energyConsumedMW} MW</span>
                  </div>
                </div>
                <div className="mt-2.5">
                  <div className="flex justify-between text-[9px] font-mono text-[#8f9d8d] mb-1">
                    <span>GRID LOAD STRESS</span>
                    <span className="font-bold">{resFlow.energyGridStressPercent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#131914] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        resFlow.energyGridStressPercent > 95 ? 'bg-[#e74c3c]' : resFlow.energyGridStressPercent > 80 ? 'bg-[#f1c40f]' : 'bg-[#2ecc71]'
                      }`}
                      style={{ width: `${Math.min(100, resFlow.energyGridStressPercent)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Municipal Water */}
              <div className="p-4 rounded-xl bg-[#18201a] border border-[#2b372d]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets size={16} className="text-[#3498db]" />
                    <span className="text-xs font-mono font-bold text-[#f3f5ef]">MUNICIPAL WATER</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      resFlow.waterNet >= 0 ? 'text-[#3498db] bg-[#1a2533]' : 'text-[#e74c3c] bg-[#381a1a]'
                    }`}
                  >
                    {resFlow.waterNet >= 0 ? `+${resFlow.waterNet} kL/d Net` : `${resFlow.waterNet} kL/d Deficit`}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-[#131914] border border-[#222d24]">
                    <span className="text-[9px] text-[#8f9d8d] block">SUPPLY</span>
                    <span className="font-bold text-[#3498db]">{resFlow.waterProduced} kL/d</span>
                  </div>
                  <div className="p-2 rounded bg-[#131914] border border-[#222d24]">
                    <span className="text-[9px] text-[#8f9d8d] block">DEMAND</span>
                    <span className="font-bold text-[#e74c3c]">{resFlow.waterConsumed} kL/d</span>
                  </div>
                </div>
                <div className="mt-2.5">
                  <div className="flex justify-between text-[9px] font-mono text-[#8f9d8d] mb-1">
                    <span>AQUIFER STRESS</span>
                    <span className="font-bold">{resFlow.waterGridStressPercent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#131914] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        resFlow.waterGridStressPercent > 95 ? 'bg-[#e74c3c]' : 'bg-[#3498db]'
                      }`}
                      style={{ width: `${Math.min(100, resFlow.waterGridStressPercent)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Food Biomass */}
              <div className="p-4 rounded-xl bg-[#18201a] border border-[#2b372d]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wheat size={16} className="text-[#2ecc71]" />
                    <span className="text-xs font-mono font-bold text-[#f3f5ef]">AGRI-FOOD BIOMASS</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold text-[#2ecc71] bg-[#1a2d1f]">
                    +{resFlow.foodNet} Rations/d
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-[#131914] border border-[#222d24]">
                    <span className="text-[9px] text-[#8f9d8d] block">AEROPONIC YIELD</span>
                    <span className="font-bold text-[#2ecc71]">{resFlow.foodProduced} Rations</span>
                  </div>
                  <div className="p-2 rounded bg-[#131914] border border-[#222d24]">
                    <span className="text-[9px] text-[#8f9d8d] block">RATIONING CONSUMPTION</span>
                    <span className="font-bold text-[#8f9d8d]">{resFlow.foodConsumed} Rations</span>
                  </div>
                </div>
              </div>

              {/* Construction Materials */}
              <div className="p-4 rounded-xl bg-[#18201a] border border-[#2b372d]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hammer size={16} className="text-[#e67e22]" />
                    <span className="text-xs font-mono font-bold text-[#f3f5ef]">CONSTRUCTION MATERIALS</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold text-[#e67e22] bg-[#332214]">
                    +{resFlow.materialsNet} Tons/d
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-[#131914] border border-[#222d24]">
                    <span className="text-[9px] text-[#8f9d8d] block">FOUNDRY SMELTER OUTPUT</span>
                    <span className="font-bold text-[#e67e22]">{resFlow.materialsProduced} Tons</span>
                  </div>
                  <div className="p-2 rounded bg-[#131914] border border-[#222d24]">
                    <span className="text-[9px] text-[#8f9d8d] block">CONSTRUCTION & MAINT</span>
                    <span className="font-bold text-[#8f9d8d]">{resFlow.materialsConsumed} Tons</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Workforce & Employment Section */}
            <div className="p-4 rounded-xl bg-[#18201a] border border-[#2b372d]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-[#a6bd82]" />
                  <span className="text-xs font-mono font-bold text-[#f3f5ef]">
                    CIVIC WORKFORCE & EMPLOYMENT
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-[#2ecc71]">
                  {resFlow.employmentRatePercent}% Employed
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono mt-2">
                <div className="p-2 rounded bg-[#131914] border border-[#222d24]">
                  <span className="text-[9px] text-[#8f9d8d] block">TOTAL POPULATION</span>
                  <span className="font-bold text-[#f3f5ef]">{(resFlow.totalPopulation / 1000000).toFixed(3)}M</span>
                </div>
                <div className="p-2 rounded bg-[#131914] border border-[#222d24]">
                  <span className="text-[9px] text-[#8f9d8d] block">LABOR POOL</span>
                  <span className="font-bold text-[#a6bd82]">{(resFlow.workingAgePopulation / 1000).toFixed(0)}k</span>
                </div>
                <div className="p-2 rounded bg-[#131914] border border-[#222d24]">
                  <span className="text-[9px] text-[#8f9d8d] block">EMPLOYED JOBS</span>
                  <span className="font-bold text-[#2ecc71]">{resFlow.employedWorkforce.toLocaleString()}</span>
                </div>
                <div className="p-2 rounded bg-[#131914] border border-[#222d24]">
                  <span className="text-[9px] text-[#8f9d8d] block">UNEMPLOYED RATE</span>
                  <span className="font-bold text-[#f1c40f]">{resFlow.unemploymentRatePercent}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: DISTRICT DEVELOPMENT ================= */}
        {activeTab === 'districts' && (
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold text-[#a6bd82] uppercase block">
              ZONED DISTRICT PERFORMANCE & SYNERGIES
            </span>
            <div className="grid grid-cols-1 gap-3">
              {distMetrics.map((d) => (
                <div
                  key={d.districtId}
                  className="p-3.5 rounded-xl bg-[#18201a] border border-[#2b372d] hover:border-[#415344] transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#242f26]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#f3f5ef]">{d.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#222c23] border border-[#364638] text-[#c6a76a]">
                          Tier {d.tier}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#8f9d8d] block mt-0.5">
                        {d.specialization} · {d.buildingCount} Buildings ({d.activeBuildingCount} Active)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[#8f9d8d]">DEVELOPMENT SCORE</span>
                      <span className="text-sm font-mono font-bold text-[#a6bd82]">{d.developmentScore}/100</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono mt-3">
                    <div className="p-1.5 rounded bg-[#131914] border border-[#222d24]">
                      <span className="text-[9px] text-[#8f9d8d] block">POPULATION</span>
                      <span className="font-bold text-[#f3f5ef]">{d.population.toLocaleString()}</span>
                    </div>
                    <div className="p-1.5 rounded bg-[#131914] border border-[#222d24]">
                      <span className="text-[9px] text-[#8f9d8d] block">JOBS / WORKERS</span>
                      <span className="font-bold text-[#a6bd82]">{d.jobsEmployed} / {d.jobsCapacity}</span>
                    </div>
                    <div className="p-1.5 rounded bg-[#131914] border border-[#222d24]">
                      <span className="text-[9px] text-[#8f9d8d] block">ENERGY DEMAND</span>
                      <span className="font-bold text-[#f1c40f]">{d.energyDemandMW} MW</span>
                    </div>
                    <div className="p-1.5 rounded bg-[#131914] border border-[#222d24]">
                      <span className="text-[9px] text-[#8f9d8d] block">MAINTENANCE DRAW</span>
                      <span className="font-bold text-[#e74c3c]">-{d.dailyMaintenanceDraw} Cr/d</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 4: DEMANDS & CITY ALERTS ================= */}
        {activeTab === 'demands' && (
          <div className="space-y-4">
            {/* Real-Time Demand Gauges */}
            <div className="p-4 rounded-xl bg-[#18201a] border border-[#2b372d]">
              <span className="text-xs font-mono font-bold text-[#c6a76a] uppercase block mb-3">
                ZONING DEMANDS (EXPANSION SIGNALS)
              </span>
              <div className="space-y-2.5">
                {/* Residential Demand */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-[#e8e9e3]">Housing & Residential Demand</span>
                    <span className="text-[#a6bd82] font-bold">{demands.residentialDemand}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#131914] overflow-hidden">
                    <div className="h-full bg-[#82a6bd] transition-all" style={{ width: `${demands.residentialDemand}%` }} />
                  </div>
                </div>

                {/* Commercial Demand */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-[#e8e9e3]">Commercial & Retail Demand</span>
                    <span className="text-[#c6a76a] font-bold">{demands.commercialDemand}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#131914] overflow-hidden">
                    <div className="h-full bg-[#c6a76a] transition-all" style={{ width: `${demands.commercialDemand}%` }} />
                  </div>
                </div>

                {/* Industrial Demand */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-[#e8e9e3]">Industrial & Foundry Materials Demand</span>
                    <span className="text-[#e67e22] font-bold">{demands.industrialDemand}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#131914] overflow-hidden">
                    <div className="h-full bg-[#e67e22] transition-all" style={{ width: `${demands.industrialDemand}%` }} />
                  </div>
                </div>

                {/* Healthcare Demand */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-[#e8e9e3]">Healthcare Clinic Capacity Demand</span>
                    <span className="text-[#e57373] font-bold">{demands.healthcareDemand}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#131914] overflow-hidden">
                    <div className="h-full bg-[#e57373] transition-all" style={{ width: `${demands.healthcareDemand}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Intelligent City Alerts */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-[#f3f5ef] uppercase block">
                INTELLIGENT ADVISORY & ACTIVE CITY ALERTS ({alerts.length})
              </span>
              {alerts.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#1a251e] border border-[#2b3c2e] flex items-center gap-3 text-xs font-mono text-[#2ecc71]">
                  <CheckCircle2 size={18} />
                  <span>All municipal systems operating within optimal stability envelopes. No critical alerts.</span>
                </div>
              ) : (
                alerts.map((alt) => (
                  <div
                    key={alt.id}
                    className={`p-3.5 rounded-xl border flex flex-col gap-2 ${
                      alt.severity === 'critical'
                        ? 'bg-[#2b1717] border-[#662b2b]'
                        : alt.severity === 'warning'
                        ? 'bg-[#2b2416] border-[#665026]'
                        : 'bg-[#1a221c] border-[#2d3a2e]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {alt.severity === 'critical' ? (
                          <AlertTriangle size={16} className="text-[#e74c3c]" />
                        ) : alt.severity === 'warning' ? (
                          <AlertTriangle size={16} className="text-[#f1c40f]" />
                        ) : (
                          <Info size={16} className="text-[#a6bd82]" />
                        )}
                        <span className="font-bold text-xs text-[#f3f5ef]">{alt.title}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#141b16] border border-[#2a352c] font-bold">
                        {alt.metricLabel}: {alt.metricValue}
                      </span>
                    </div>
                    <p className="text-xs text-[#cdd8cc]">{alt.message}</p>
                    <div className="p-2 rounded bg-[#151d17]/80 border border-[#273329] text-[11px] font-mono text-[#a6bd82]">
                      <span className="text-[#f1c40f] font-bold mr-1">Recommended Action:</span>
                      {alt.recommendedAction}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

