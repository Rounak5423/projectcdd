import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Boxes,
  Wheat,
  Droplets,
  Zap,
  Package,
  Cpu,
  Coins,
  Globe2,
  Ship,
  Sparkles,
  Search,
  CheckCircle2,
  ChevronRight,
  Plus,
  AlertTriangle,
  Layers,
  Filter,
} from 'lucide-react';
import { useGameState } from '../context/GameStateContext';

interface StrategicCommodity {
  id: string;
  name: string;
  category: 'Agrarian' | 'Industrial' | 'Technological' | 'Mineral' | 'Energy';
  stockpile: number;
  unit: string;
  netRate: number; // positive = surplus, negative = deficit
  dailyConsumption: number;
  dailyProduction: number;
  sparkline: number[]; // 5-point trend
  status: 'Surplus' | 'Balanced' | 'Deficit';
  marketPriceGrc: number;
  primaryProducers: string[];
}

const strategicCommodities: StrategicCommodity[] = [
  {
    id: 'res-alum',
    name: 'Aluminium & Light Alloys',
    category: 'Industrial',
    stockpile: 3200,
    unit: 'T',
    netRate: 45,
    dailyProduction: 180,
    dailyConsumption: 135,
    sparkline: [35, 40, 48, 52, 60],
    status: 'Surplus',
    marketPriceGrc: 14,
    primaryProducers: ['Vulcan Smelter Hub A', 'Foundry Alpha'],
  },
  {
    id: 'res-biomass',
    name: 'Animals & Livestock Biomass',
    category: 'Agrarian',
    stockpile: 1850,
    unit: 'T',
    netRate: 12,
    dailyProduction: 65,
    dailyConsumption: 53,
    sparkline: [20, 22, 24, 25, 28],
    status: 'Surplus',
    marketPriceGrc: 22,
    primaryProducers: ['Bio-Pasture Enclosure', 'Valley Bio-Dome Prime'],
  },
  {
    id: 'res-bread',
    name: 'Aeroponic Bread & Rations',
    category: 'Agrarian',
    stockpile: 4120,
    unit: 'T',
    netRate: -27,
    dailyProduction: 140,
    dailyConsumption: 167,
    sparkline: [65, 58, 52, 45, 38],
    status: 'Deficit',
    marketPriceGrc: 18,
    primaryProducers: ['Valley Bio-Dome Prime', 'Algal Synthesis Basin'],
  },
  {
    id: 'res-clothes',
    name: 'Synthetic Textiles & Clothes',
    category: 'Industrial',
    stockpile: 2400,
    unit: 'T',
    netRate: -58,
    dailyProduction: 90,
    dailyConsumption: 148,
    sparkline: [50, 42, 35, 30, 22],
    status: 'Deficit',
    marketPriceGrc: 25,
    primaryProducers: ['Weaving Facility Beta', 'Nanofiber Loom'],
  },
  {
    id: 'res-coal',
    name: 'Dense Hydrocarbons & Coal',
    category: 'Mineral',
    stockpile: 8800,
    unit: 'BBL',
    netRate: 110,
    dailyProduction: 210,
    dailyConsumption: 100,
    sparkline: [40, 50, 60, 72, 85],
    status: 'Surplus',
    marketPriceGrc: 8,
    primaryProducers: ['Subterranean Extractor Delta', 'Quarry 1'],
  },
  {
    id: 'res-constr',
    name: 'Construction Nanomaterials',
    category: 'Industrial',
    stockpile: 5200,
    unit: 'T',
    netRate: 85,
    dailyProduction: 220,
    dailyConsumption: 135,
    sparkline: [55, 62, 70, 78, 88],
    status: 'Surplus',
    marketPriceGrc: 32,
    primaryProducers: ['Vulcan Smelter Hub A', 'Nanotube Foundry'],
  },
  {
    id: 'res-copper',
    name: 'Copper & Superconductors',
    category: 'Mineral',
    stockpile: 1510,
    unit: 'T',
    netRate: 20,
    dailyProduction: 80,
    dailyConsumption: 60,
    sparkline: [30, 32, 34, 38, 42],
    status: 'Surplus',
    marketPriceGrc: 28,
    primaryProducers: ['Deep Shaft Rig 4', 'Smelter Unit 2'],
  },
  {
    id: 'res-cotton',
    name: 'Natural Cotton & Bio-Fibers',
    category: 'Agrarian',
    stockpile: 940,
    unit: 'T',
    netRate: 8,
    dailyProduction: 45,
    dailyConsumption: 37,
    sparkline: [15, 18, 20, 22, 25],
    status: 'Balanced',
    marketPriceGrc: 16,
    primaryProducers: ['Valley Bio-Dome Prime'],
  },
  {
    id: 'res-diamonds',
    name: 'Industrial Diamonds & Quartz',
    category: 'Mineral',
    stockpile: 480,
    unit: 'T',
    netRate: 15,
    dailyProduction: 30,
    dailyConsumption: 15,
    sparkline: [12, 14, 18, 20, 24],
    status: 'Surplus',
    marketPriceGrc: 65,
    primaryProducers: ['High Pressure Geo-Synth Lab'],
  },
  {
    id: 'res-drinks',
    name: 'Potable Hydro & Purified Drinks',
    category: 'Agrarian',
    stockpile: 6300,
    unit: 'kL',
    netRate: -34,
    dailyProduction: 210,
    dailyConsumption: 244,
    sparkline: [60, 52, 45, 38, 30],
    status: 'Deficit',
    marketPriceGrc: 12,
    primaryProducers: ['Closed-Loop Aquifer Network', 'River Siphon'],
  },
  {
    id: 'res-chips',
    name: 'Electronic Chips & Microprocessors',
    category: 'Technological',
    stockpile: 1840,
    unit: 'kU',
    netRate: 42,
    dailyProduction: 95,
    dailyConsumption: 53,
    sparkline: [25, 35, 45, 60, 78],
    status: 'Surplus',
    marketPriceGrc: 48,
    primaryProducers: ['Quantum Fabrication Facility', 'Silicon Foundry Prime'],
  },
  {
    id: 'res-energy',
    name: 'High-Voltage Grid Energy',
    category: 'Energy',
    stockpile: 840,
    unit: 'MWh',
    netRate: -24.9,
    dailyProduction: 320,
    dailyConsumption: 344.9,
    sparkline: [55, 48, 42, 35, 28],
    status: 'Deficit',
    marketPriceGrc: 20,
    primaryProducers: ['Helios Solar Array', 'Ridge Wind Turbines'],
  },
  {
    id: 'res-fruits',
    name: 'Fruits & Bio-Vitamins',
    category: 'Agrarian',
    stockpile: 1250,
    unit: 'T',
    netRate: 16,
    dailyProduction: 55,
    dailyConsumption: 39,
    sparkline: [18, 22, 25, 28, 32],
    status: 'Surplus',
    marketPriceGrc: 19,
    primaryProducers: ['Hydroponic Arboretum', 'Bio-Dome B'],
  },
];

interface TradeDeal {
  id: string;
  type: 'Export' | 'Import';
  resource: string;
  counterparty: string;
  amount: string;
  pricePerUnit: string;
  durationYears: number;
}

const initialDeals: TradeDeal[] = [
  {
    id: 'td-1',
    type: 'Export',
    resource: 'Construction Nanomaterials',
    counterparty: 'Neo Byzantium Colony',
    amount: '400 T/yr',
    pricePerUnit: '32 GRC',
    durationYears: 4,
  },
  {
    id: 'td-2',
    type: 'Export',
    resource: 'Electronic Chips',
    counterparty: 'Solaria Nexus Orbit',
    amount: '250 kU/yr',
    pricePerUnit: '48 GRC',
    durationYears: 6,
  },
  {
    id: 'td-3',
    type: 'Import',
    resource: 'Aeroponic Bread',
    counterparty: 'Verdant Agrar Hub',
    amount: '300 T/yr',
    pricePerUnit: '16 GRC',
    durationYears: 2,
  },
];

export default function ResourcesPage() {
  const { resources, civilization, triggerToast } = useGameState();
  const [commodities] = useState<StrategicCommodity[]>(strategicCommodities);
  const [selectedCommodityId, setSelectedCommodityId] = useState<string>('res-bread');
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [tradeDeals, setTradeDeals] = useState<TradeDeal[]>(initialDeals);

  const selectedCommodity =
    commodities.find((c) => c.id === selectedCommodityId) || commodities[0];

  const filteredCommodities = commodities.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCat = categoryFilter === 'all' || c.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const deficits = commodities
    .filter((c) => c.netRate < 0)
    .sort((a, b) => a.netRate - b.netRate);

  const handleSignDeal = (commodity: StrategicCommodity, type: 'Export' | 'Import') => {
    const newDeal: TradeDeal = {
      id: `td-${Date.now()}`,
      type,
      resource: commodity.name,
      counterparty: 'Off-World Trade Cartel',
      amount: `150 ${commodity.unit}/yr`,
      pricePerUnit: `${commodity.marketPriceGrc} GRC`,
      durationYears: 5,
    };
    setTradeDeals((prev) => [newDeal, ...prev]);
    triggerToast({
      type: 'reward',
      title: `TRADE CONTRACT RATIFIED: ${type.toUpperCase()} ${commodity.name}`,
      subtitle: `Off-World Cartel agreement active for 5 simulation cycles!`,
    });
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#0b100d] text-[#e8ece9] select-none overflow-hidden">
      {/* ================= TOP HEADER SUMMARY BAR ================= */}
      <div className="shrink-0 bg-[#0f1712] border-b border-[#1f2d22] px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="eyebrow text-[#d4af37]">STRATEGIC RESOURCE LEDGER</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
          </div>
          <h1 className="text-xl font-bold text-[#f1f5f2] mt-0.5">
            Civilisation Commodity Flow & Trade
          </h1>
        </div>

        {/* Annual / Cycle Financial Snapshot (Like reference image) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#090e0a] p-2.5 rounded-xl border border-[#1b261e] text-xs font-mono">
          <div className="px-3 py-1 border-r border-[#1a251c]">
            <span className="text-[10px] text-[#7d9480] block uppercase">Enterprise Output</span>
            <span className="text-sm font-bold text-[#f1f5f2]">$11,465.8 B</span>
            <span className="text-[9px] text-[#4ade80] block font-bold">+9.8% YoY</span>
          </div>

          <div className="px-3 py-1 border-r border-[#1a251c]">
            <span className="text-[10px] text-[#7d9480] block uppercase">Resources GDP</span>
            <span className="text-sm font-bold text-[#d4af37]">${resources.gdp} B</span>
            <span className="text-[9px] text-[#4ade80] block font-bold">+4.2% YoY</span>
          </div>

          <div className="px-3 py-1 border-r border-[#1a251c]">
            <span className="text-[10px] text-[#7d9480] block uppercase">Total Exports</span>
            <span className="text-sm font-bold text-[#60a5fa]">$3.8 M</span>
            <span className="text-[9px] text-[#7d9480] block">2 Corridors</span>
          </div>

          <div className="px-3 py-1">
            <span className="text-[10px] text-[#7d9480] block uppercase">Total Imports</span>
            <span className="text-sm font-bold text-[#f87171]">$0.00</span>
            <span className="text-[9px] text-[#4ade80] block font-bold">Autarky Secure</span>
          </div>
        </div>
      </div>

      {/* ================= MAIN SPLIT CONTENT ================= */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT COLUMN: TOP DEFICITS & COMMODITY SELECTOR LIST */}
        <div className="w-full lg:w-3/5 border-r border-[#1f2d22] flex flex-col min-h-0 bg-[#0e1410]">
          {/* Top 5 Deficits Section (Victoria / Geopolitical Sim Style) */}
          <div className="p-4 bg-[#121a14] border-b border-[#1f2d22]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-bold tracking-wider text-[#f87171] uppercase flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-[#f87171] animate-pulse" />
                TOP 5 CIVILISATION DEFICITS
              </span>
              <span className="text-[10px] font-mono text-[#7d9480]">
                Rationing Trigger: -30% Threshold
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {deficits.slice(0, 5).map((def) => (
                <div
                  key={def.id}
                  onClick={() => setSelectedCommodityId(def.id)}
                  className={`p-2 rounded-lg border cursor-pointer transition-all ${
                    selectedCommodityId === def.id
                      ? 'bg-[#2b1816] border-[#ef4444]'
                      : 'bg-[#181110] border-[#381f1d] hover:border-[#6b2c28]'
                  }`}
                >
                  <span className="text-[10px] font-semibold text-[#fca5a5] block truncate">
                    {def.name.split(' ')[0]}
                  </span>
                  <p className="text-xs font-mono font-black text-[#f87171] mt-0.5">
                    {def.netRate} {def.unit}
                  </p>
                  <div className="h-1 rounded-full bg-[#2e1412] mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-[#ef4444] rounded-full"
                      style={{ width: `${Math.min(100, Math.abs(def.netRate) * 2)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Commodity Filters & Search */}
          <div className="px-4 py-3 bg-[#0d130f] border-b border-[#1f2d22] flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
              {['all', 'Agrarian', 'Industrial', 'Mineral', 'Technological', 'Energy'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors ${
                    categoryFilter === cat
                      ? 'bg-[#273a2b] text-[#4ade80] font-bold border border-[#3b5941]'
                      : 'text-[#7d9480] hover:text-[#f1f5f2]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative shrink-0">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7d9480]" />
              <input
                type="text"
                placeholder="Search..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="bg-[#090e0a] border border-[#1b261e] rounded-lg pl-7 pr-2.5 py-1 text-xs text-[#f1f5f2] placeholder-[#7d9480] outline-none w-32 focus:border-[#4ade80]"
              />
            </div>
          </div>

          {/* Interactive Commodity Ledger Table */}
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-[#17221a]">
            {filteredCommodities.map((comm) => {
              const isSelected = comm.id === selectedCommodityId;
              const isDeficit = comm.netRate < 0;

              return (
                <div
                  key={comm.id}
                  onClick={() => setSelectedCommodityId(comm.id)}
                  className={`px-4 py-3 cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                    isSelected
                      ? 'bg-[#1b261d] border-l-4 border-l-[#d4af37]'
                      : 'hover:bg-[#131b14]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                        isDeficit
                          ? 'bg-[#311715] text-[#f87171] border border-[#5c2420]'
                          : 'bg-[#162719] text-[#4ade80] border border-[#2b4c30]'
                      }`}
                    >
                      {comm.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4
                          className={`text-xs font-bold truncate ${
                            isSelected ? 'text-[#f1f5f2]' : 'text-[#c6d4c8]'
                          }`}
                        >
                          {comm.name}
                        </h4>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-[#7d9480]">
                          {comm.category}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#7d9480]">
                        Stock: {comm.stockpile.toLocaleString()} {comm.unit}
                      </span>
                    </div>
                  </div>

                  {/* Sparkline Visual Mini-Bars */}
                  <div className="hidden sm:flex items-center gap-1 h-5 px-2 bg-black/30 rounded border border-[#1b261e]">
                    {comm.sparkline.map((val, idx) => (
                      <div
                        key={idx}
                        className={`w-1 rounded-xs ${
                          isDeficit ? 'bg-[#ef4444]' : 'bg-[#4ade80]'
                        }`}
                        style={{ height: `${(val / 100) * 16 + 3}px` }}
                      />
                    ))}
                  </div>

                  {/* Rate & Status */}
                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-mono font-bold block ${
                        isDeficit ? 'text-[#f87171]' : 'text-[#4ade80]'
                      }`}
                    >
                      {comm.netRate > 0 ? `+${comm.netRate}` : comm.netRate} {comm.unit}/d
                    </span>
                    <span className="text-[10px] font-mono text-[#d4af37]">
                      {comm.marketPriceGrc} GRC/unit
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: COMMODITY INSPECTION + TRADE CONTRACTS */}
        <div className="w-full lg:w-2/5 flex flex-col min-h-0 bg-[#0c120e] p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Inspected Commodity Card */}
          <div className="panel p-5 bg-[#131b14] border-[#223325] space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#d4af37] uppercase font-bold tracking-wider">
                  Commodity Dossier · {selectedCommodity.category}
                </span>
                <h3 className="text-lg font-bold text-[#f1f5f2] mt-0.5">
                  {selectedCommodity.name}
                </h3>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                  selectedCommodity.netRate < 0
                    ? 'bg-[#3b1c19] text-[#f87171] border border-[#6b2c28]'
                    : 'bg-[#192b1b] text-[#4ade80] border border-[#2b4c30]'
                }`}
              >
                {selectedCommodity.status}
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#090e0a] border border-[#1b261e]">
                <span className="text-[10px] text-[#7d9480] uppercase block">Total Stockpile</span>
                <span className="text-lg font-bold text-[#f1f5f2]">
                  {selectedCommodity.stockpile.toLocaleString()} {selectedCommodity.unit}
                </span>
                <span className="text-[10px] text-[#7d9480] block mt-0.5">
                  Reserve: ~{Math.round(selectedCommodity.stockpile / Math.max(1, selectedCommodity.dailyConsumption))} Days
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#090e0a] border border-[#1b261e]">
                <span className="text-[10px] text-[#7d9480] uppercase block">Net Flow Rate</span>
                <span
                  className={`text-lg font-bold ${
                    selectedCommodity.netRate < 0 ? 'text-[#f87171]' : 'text-[#4ade80]'
                  }`}
                >
                  {selectedCommodity.netRate > 0 ? `+${selectedCommodity.netRate}` : selectedCommodity.netRate}{' '}
                  {selectedCommodity.unit}/d
                </span>
                <span className="text-[10px] text-[#7d9480] block mt-0.5">
                  Prod: {selectedCommodity.dailyProduction} · Cons: {selectedCommodity.dailyConsumption}
                </span>
              </div>
            </div>

            {/* Producers List */}
            <div>
              <span className="text-[10px] font-mono text-[#7d9480] uppercase block mb-1.5">
                Key Production Infrastructure:
              </span>
              <div className="space-y-1">
                {selectedCommodity.primaryProducers.map((prod, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-[#090e0a] border border-[#1b261e] text-xs text-[#c6d4c8] flex items-center justify-between"
                  >
                    <span>{prod}</span>
                    <span className="text-[10px] font-mono text-[#4ade80]">Active (100%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Trade Action Buttons */}
            <div className="pt-3 border-t border-[#1f2d22] flex items-center gap-2">
              <button
                onClick={() => handleSignDeal(selectedCommodity, 'Export')}
                className="flex-1 py-2 rounded-lg bg-[#1f2f21] hover:bg-[#2b422e] text-[#4ade80] border border-[#3b5941] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <ArrowUpRight size={14} />
                <span>Export Surplus</span>
              </button>
              <button
                onClick={() => handleSignDeal(selectedCommodity, 'Import')}
                className="flex-1 py-2 rounded-lg bg-[#2f1f1d] hover:bg-[#422b28] text-[#f87171] border border-[#593b38] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <ArrowDownRight size={14} />
                <span>Import Deficit</span>
              </button>
            </div>
          </div>

          {/* Active Off-World Trade Contracts */}
          <div className="panel p-5 bg-[#131b14] border-[#223325] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe2 size={16} className="text-[#60a5fa]" />
                <h3 className="text-sm font-bold text-[#f1f5f2]">
                  Active Off-World Trade Deals ({tradeDeals.length})
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#d4af37] font-bold">
                Galactic Tariff: 4%
              </span>
            </div>

            <div className="space-y-2">
              {tradeDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="p-3 rounded-xl bg-[#090e0a] border border-[#1b261e] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase shrink-0 ${
                        deal.type === 'Export'
                          ? 'bg-[#192b1b] text-[#4ade80] border border-[#2b4c30]'
                          : 'bg-[#2b1816] text-[#f87171] border border-[#5c2420]'
                      }`}
                    >
                      {deal.type}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-[#f1f5f2] truncate">{deal.resource}</p>
                      <p className="text-[10px] text-[#7d9480] truncate">{deal.counterparty}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono">
                    <span className="text-[#f1f5f2] font-bold block">{deal.amount}</span>
                    <span className="text-[10px] text-[#d4af37]">{deal.pricePerUnit} · {deal.durationYears} yrs</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
