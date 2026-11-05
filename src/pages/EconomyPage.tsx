import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  PlusCircle,
  X,
  CheckCircle2,
  Ship,
  Globe2,
  Scale,
  Zap,
  Wheat,
  Droplets,
  Package,
  Layers,
  Coins,
  ShieldAlert,
} from 'lucide-react';
import { useGameState } from '../context/GameStateContext';
import { soundFx } from '../services/soundFx';

interface DeficitItem {
  id: string;
  name: string;
  amount: string;
  unit: string;
  icon: string;
  severity: 'critical' | 'high' | 'moderate';
  reliefCostCredits: number;
}

interface CommodityLedgerItem {
  id: string;
  name: string;
  icon: string;
  stockpile: string;
  dailyRate: string;
  isPositive: boolean;
  marketPrice: number;
  trendSpark: number[]; // 5 datapoints for visual mini-chart
  category: 'Food & Bio' | 'Industrial' | 'Consumer' | 'Strategic';
}

interface TradeDeal {
  id: string;
  type: 'EXPORT' | 'IMPORT';
  resource: string;
  icon: string;
  amount: string;
  partnerCiv: string;
  pricePerUnit: string;
  durationYears: number;
  netRevenue: number;
}

const initialDeficits: DeficitItem[] = [
  { id: 'def-bread', name: 'Bread & Grain', amount: '-2.7M', unit: 'T', icon: '🍞', severity: 'critical', reliefCostCredits: 120 },
  { id: 'def-clothes', name: 'Work Clothes & Fabrics', amount: '-5.8M', unit: 'T', icon: '👕', severity: 'critical', reliefCostCredits: 180 },
  { id: 'def-drinks', name: 'Clean Drinks & Water', amount: '-3.4M', unit: 'U', icon: '🥤', severity: 'high', reliefCostCredits: 95 },
  { id: 'def-energy', name: 'Grid Energy Allocation', amount: '-249.4K', unit: 'KW H', icon: '⚡', severity: 'high', reliefCostCredits: 150 },
  { id: 'def-furniture', name: 'Furnitures & Appliances', amount: '-1.1M', unit: 'T', icon: '🛋️', severity: 'moderate', reliefCostCredits: 85 },
];

const commodityLedgerData: CommodityLedgerItem[] = [
  { id: 'res-alum', name: 'Aluminium Ingot', icon: '🔘', stockpile: '484.1M T', dailyRate: '+12.4k', isPositive: true, marketPrice: 240, trendSpark: [40, 55, 65, 80, 95], category: 'Industrial' },
  { id: 'res-anim', name: 'Animals & Livestock', icon: '🐄', stockpile: '94.1M AN', dailyRate: '+3.1k', isPositive: true, marketPrice: 410, trendSpark: [60, 58, 65, 70, 78], category: 'Food & Bio' },
  { id: 'res-bread', name: 'Artisan Bread', icon: '🍞', stockpile: '14.8M T', dailyRate: '-2.7k', isPositive: false, marketPrice: 185, trendSpark: [85, 70, 55, 45, 30], category: 'Food & Bio' },
  { id: 'res-clothes', name: 'Manufactured Clothes', icon: '👕', stockpile: '32.9M T', dailyRate: '-5.8k', isPositive: false, marketPrice: 290, trendSpark: [90, 80, 60, 45, 25], category: 'Consumer' },
  { id: 'res-coal', name: 'Thermal Coal', icon: '⛏️', stockpile: '1.24B T', dailyRate: '+45.2k', isPositive: true, marketPrice: 110, trendSpark: [30, 40, 50, 70, 85], category: 'Industrial' },
  { id: 'res-constr', name: 'Construction Materials', icon: '🧱', stockpile: '8.65M T', dailyRate: '+94.0k', isPositive: true, marketPrice: 165, trendSpark: [45, 50, 65, 78, 90], category: 'Industrial' },
  { id: 'res-copper', name: 'Refined Copper', icon: '🟤', stockpile: '151.3M T', dailyRate: '+8.6k', isPositive: true, marketPrice: 380, trendSpark: [50, 60, 70, 75, 82], category: 'Industrial' },
  { id: 'res-cotton', name: 'Raw Cotton', icon: '🌾', stockpile: '28.4M T', dailyRate: '+4.2k', isPositive: true, marketPrice: 145, trendSpark: [55, 60, 62, 68, 74], category: 'Food & Bio' },
  { id: 'res-dia', name: 'Diamonds & Rare Gems', icon: '💎', stockpile: '4.15 BBL', dailyRate: '+850', isPositive: true, marketPrice: 1850, trendSpark: [70, 72, 80, 85, 92], category: 'Strategic' },
  { id: 'res-drinks', name: 'Filtered Clean Drinks', icon: '🥤', stockpile: '19.4M U', dailyRate: '-3.4k', isPositive: false, marketPrice: 120, trendSpark: [80, 75, 60, 50, 38], category: 'Food & Bio' },
  { id: 'res-chips', name: 'Electronic Microchips', icon: '💾', stockpile: '68.2M U', dailyRate: '+18.5k', isPositive: true, marketPrice: 620, trendSpark: [35, 45, 60, 75, 95], category: 'Strategic' },
  { id: 'res-energy', name: 'Grid Energy Reserves', icon: '⚡', stockpile: '11.2k MW', dailyRate: '-249k', isPositive: false, marketPrice: 95, trendSpark: [75, 70, 60, 48, 35], category: 'Strategic' },
  { id: 'res-fruit', name: 'Fruits & Vegetables', icon: '🍎', stockpile: '52.7M T', dailyRate: '+14.2k', isPositive: true, marketPrice: 210, trendSpark: [50, 58, 65, 74, 85], category: 'Food & Bio' },
  { id: 'res-iron', name: 'Structural Steel & Iron', icon: '⚙️', stockpile: '320.5M T', dailyRate: '+28.4k', isPositive: true, marketPrice: 310, trendSpark: [40, 50, 62, 75, 88], category: 'Industrial' },
];

const initialTradeDeals: TradeDeal[] = [
  { id: 'td-01', type: 'EXPORT', resource: 'Refined Structural Steel', icon: '⚙️', amount: '45,000 T', partnerCiv: 'Neo Byzantium', pricePerUnit: '$340/T', durationYears: 3, netRevenue: 420 },
  { id: 'td-02', type: 'EXPORT', resource: 'Electronic Microchips', icon: '💾', amount: '18,000 U', partnerCiv: 'Solaria Nexus', pricePerUnit: '$650/U', durationYears: 5, netRevenue: 680 },
  { id: 'td-03', type: 'IMPORT', resource: 'Hydrocarbon Crude Oil', icon: '🛢️', amount: '25,000 BBL', partnerCiv: 'Aethelgard Prime', pricePerUnit: '$85/BBL', durationYears: 2, netRevenue: -210 },
];

export default function EconomyPage() {
  const { resources, rates } = useGameState();
  const [deficits, setDeficits] = useState<DeficitItem[]>(initialDeficits);
  const [commodities, setCommodities] = useState<CommodityLedgerItem[]>(commodityLedgerData);
  const [tradeDeals, setTradeDeals] = useState<TradeDeal[]>(initialTradeDeals);
  const [searchCommodity, setSearchCommodity] = useState('');
  const [selectedCommodity, setSelectedCommodity] = useState<CommodityLedgerItem>(commodityLedgerData[2]);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);

  // Filtered commodity list
  const filteredCommodities = useMemo(() => {
    return commodities.filter((c) =>
      c.name.toLowerCase().includes(searchCommodity.toLowerCase()) ||
      c.category.toLowerCase().includes(searchCommodity.toLowerCase())
    );
  }, [commodities, searchCommodity]);

  // Handle emergency relief for deficits
  const handleResolveDeficit = (defId: string) => {
    soundFx.playRewardClaim();
    setDeficits((prev) => prev.filter((d) => d.id !== defId));
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#0b1013] text-[#e1e9ed] select-none overflow-y-auto custom-scrollbar p-5 lg:p-7 space-y-6">
      {/* ================= TOP GRAND STRATEGY HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1b272f] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="eyebrow text-[#5ec1cd]">MACROECONOMIC RESOURCE LEDGER</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#3cd070]" />
          </div>
          <h1 className="text-xl font-bold text-[#f0f6fa] tracking-wide mt-0.5">
            Civilisation Commodity Flows & Deficit Command
          </h1>
        </div>

        {/* Tactical status pill */}
        <div className="flex items-center gap-3 bg-[#10171c] px-3.5 py-1.5 rounded-md border border-[#202f38] text-xs font-mono">
          <span className="text-[#8799a4]">Active Bilateral Deals:</span>
          <span className="font-bold text-[#5ec1cd]">{tradeDeals.length} Treaties</span>
          <span className="text-[#3cd070] font-bold">+$890M Net Fiscal Inflow</span>
        </div>
      </div>

      {/* ================= 1. ANNUAL SUMMARY (Exact match to Panel 3 screenshot) ================= */}
      <div className="bg-[#0f1519] border border-[#1e2a32] rounded-lg p-4 shadow-lg">
        <span className="eyebrow text-[#5ec1cd] block mb-3 font-mono font-bold tracking-wider">
          ANNUAL SUMMARY
        </span>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Box 1: Enterprise Revenue */}
          <div className="p-3 rounded-md bg-[#131b21] border border-[#23333d]">
            <span className="text-[10px] font-mono text-[#8799a4] block">ENTERPRISE REVENUE</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg md:text-xl font-bold font-mono text-[#f0f6fa]">
                $11,465.8
              </span>
              <span className="text-xs font-mono text-[#5ec1cd]">M</span>
            </div>
            <span className="text-[10px] font-mono text-[#3cd070] mt-1 flex items-center gap-1">
              <ArrowUpRight size={11} /> +3.4% from last cycle
            </span>
          </div>

          {/* Box 2: Resources GDP */}
          <div className="p-3 rounded-md bg-[#131b21] border border-[#23333d]">
            <span className="text-[10px] font-mono text-[#8799a4] block">RESOURCES GDP</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg md:text-xl font-bold font-mono text-[#f0f6fa]">
                ${resources.gdp}
              </span>
              <span className="text-xs font-mono text-[#caa455]">B</span>
            </div>
            <span className="text-[10px] font-mono text-[#3cd070] mt-1 flex items-center gap-1">
              <ArrowUpRight size={11} /> +{rates.gdpGrowthRate}% annual expansion
            </span>
          </div>

          {/* Box 3: Total Exports */}
          <div className="p-3 rounded-md bg-[#131b21] border border-[#23333d]">
            <span className="text-[10px] font-mono text-[#8799a4] block">TOTAL EXPORTS</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg md:text-xl font-bold font-mono text-[#f0f6fa]">
                $3.8
              </span>
              <span className="text-xs font-mono text-[#5ec1cd]">M</span>
            </div>
            <span className="text-[10px] font-mono text-[#8799a4] mt-1 block">
              Off-world allied corridors
            </span>
          </div>

          {/* Box 4: Total Imports */}
          <div className="p-3 rounded-md bg-[#131b21] border border-[#23333d]">
            <span className="text-[10px] font-mono text-[#8799a4] block">TOTAL IMPORTS</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg md:text-xl font-bold font-mono text-[#f0f6fa]">
                $0.00
              </span>
              <span className="text-xs font-mono text-[#8799a4]">/ cycle</span>
            </div>
            <span className="text-[10px] font-mono text-[#5ec1cd] mt-1 block">
              100% Autarky achieved
            </span>
          </div>
        </div>
      </div>

      {/* ================= 2. TWO-COLUMN SPLIT: TOP 5 DEFICITS (LEFT) vs SELECT RESOURCE (RIGHT) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ================= LEFT COLUMN: TOP 5 DEFICITS ================= */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0f1519] border border-[#1e2a32] rounded-lg p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1f2d37]">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} className="text-[#c94c4c]" />
                <span className="eyebrow text-[#c94c4c] font-mono font-bold tracking-wider">
                  TOP 5 DEFICITS
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#8799a4]">
                {deficits.length} Active Shortages
              </span>
            </div>

            {/* Deficit List */}
            {deficits.length === 0 ? (
              <div className="p-4 rounded bg-[#131b21] border border-[#1e2a32] text-center text-xs text-[#3cd070] space-y-1">
                <CheckCircle2 size={18} className="mx-auto" />
                <p className="font-bold">All Deficits Mitigated!</p>
                <p className="text-[10px] text-[#8799a4]">Civilisation stockpiles operating at positive net accrual.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {deficits.map((def) => (
                  <div
                    key={def.id}
                    className="p-2.5 rounded-md bg-[#141b21] border border-[#283844] flex items-center justify-between gap-3 shadow-xs hover:border-[#c94c4c] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl shrink-0">{def.icon}</span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[#f0f6fa] truncate">{def.name}</h4>
                        <span className="text-[10px] font-mono text-[#8799a4]">
                          Sector consumption peak
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-[#c94c4c] block">
                          {def.amount} {def.unit}
                        </span>
                        <span className="text-[9px] font-mono text-[#e08282] uppercase">
                          {def.severity}
                        </span>
                      </div>

                      <button
                        onClick={() => handleResolveDeficit(def.id)}
                        className="px-2.5 py-1 rounded bg-[#2a1b1b] hover:bg-[#3d2424] border border-[#5a2e2e] text-[#f28e8e] text-[10px] font-bold transition-colors"
                        title={`Order Emergency Relief Supply (${def.reliefCostCredits} Credits)`}
                      >
                        Subsidize
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="p-2 rounded bg-[#12191f] border border-[#1f2d37] text-[10px] text-[#8799a4] flex items-center gap-2 font-mono">
              <ShieldAlert size={13} className="text-[#caa455] shrink-0" />
              <span>Unmitigated deficits trigger public unrest and citizen happiness penalties.</span>
            </div>
          </div>

          {/* Quick Inspector of Selected Commodity */}
          <div className="bg-[#0f1519] border border-[#1e2a32] rounded-lg p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1f2d37]">
              <span className="eyebrow text-[#5ec1cd] font-mono font-bold tracking-wider">
                COMMODITY PROFILE
              </span>
              <span className="text-xs font-mono text-[#caa455]">
                ${selectedCommodity.marketPrice} / Ton
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-3xl">{selectedCommodity.icon}</span>
              <div>
                <h3 className="text-sm font-bold text-[#f0f6fa]">{selectedCommodity.name}</h3>
                <span className="text-xs font-mono text-[#8799a4]">
                  Stockpile: <strong className="text-white">{selectedCommodity.stockpile}</strong>
                </span>
              </div>
            </div>

            {/* Sparkline Visual */}
            <div>
              <div className="flex justify-between text-[10px] font-mono text-[#8799a4] mb-1">
                <span>Production Trend (Last 5 Cycles)</span>
                <span className={selectedCommodity.isPositive ? 'text-[#3cd070]' : 'text-[#c94c4c]'}>
                  {selectedCommodity.dailyRate} Net Accrual
                </span>
              </div>
              <div className="h-10 bg-[#12191f] rounded border border-[#202f38] flex items-end gap-1.5 p-1.5">
                {selectedCommodity.trendSpark.map((val, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 rounded-xs transition-all ${
                      selectedCommodity.isPositive ? 'bg-[#3cd070]' : 'bg-[#c94c4c]'
                    }`}
                    style={{ height: `${val}%` }}
                    title={`Cycle ${idx + 1}: ${val}% capacity`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: SELECT RESOURCE (Exact match to Panel 3 screenshot) ================= */}
        <div className="lg:col-span-7 bg-[#0f1519] border border-[#1e2a32] rounded-lg p-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1f2d37]">
              <div className="flex items-center gap-2">
                <Layers size={15} className="text-[#5ec1cd]" />
                <span className="eyebrow text-[#5ec1cd] font-mono font-bold tracking-wider">
                  SELECT RESOURCE
                </span>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8799a4]" />
                <input
                  type="text"
                  placeholder="Filter Commodity..."
                  value={searchCommodity}
                  onChange={(e) => setSearchCommodity(e.target.value)}
                  className="bg-[#12191f] border border-[#23333d] rounded pl-8 pr-3 py-1 text-xs text-[#f0f6fa] placeholder-[#8799a4] outline-none font-mono w-48 focus:border-[#5ec1cd]"
                />
              </div>
            </div>

            {/* Comprehensive Commodity Rows */}
            <div className="mt-3 space-y-1.5 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
              {filteredCommodities.map((item) => {
                const isSelected = selectedCommodity.id === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      soundFx.playClick();
                      setSelectedCommodity(item);
                    }}
                    className={`p-2 rounded-md border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#1b2630] border-[#5ec1cd] text-white shadow-xs'
                        : 'bg-[#131b21] border-[#22313b] hover:bg-[#18232b] hover:border-[#384e5e] text-[#d6e2e8]'
                    }`}
                  >
                    {/* Commodity Name & Icon */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-xs font-bold truncate">{item.name}</span>
                    </div>

                    {/* Stockpile & Daily Net Sparkline */}
                    <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                      <span className="text-[#8799a4] text-[11px]">{item.stockpile}</span>

                      {/* Mini sparkline indicator */}
                      <div className="w-16 h-4 bg-[#0d1317] rounded flex items-end gap-0.5 p-0.5 border border-[#1e2a32]">
                        {item.trendSpark.map((v, i) => (
                          <div
                            key={i}
                            className={`flex-1 rounded-xs ${
                              item.isPositive ? 'bg-[#3cd070]' : 'bg-[#c94c4c]'
                            }`}
                            style={{ height: `${v}%` }}
                          />
                        ))}
                      </div>

                      <span
                        className={`text-[11px] font-bold w-16 text-right ${
                          item.isPositive ? 'text-[#3cd070]' : 'text-[#c94c4c]'
                        }`}
                      >
                        {item.dailyRate}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-[#1f2d37] flex items-center justify-between text-xs text-[#8799a4] font-mono">
            <span>Tracking 14 Strategic Civil Commodities</span>
            <span className="text-[#caa455]">Stockpile Reserves: 100% Secure</span>
          </div>
        </div>
      </div>

      {/* ================= 3. TRADE DEALS SECTION (Exact match to Panel 3 screenshot) ================= */}
      <div className="bg-[#0f1519] border border-[#1e2a32] rounded-lg p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#1f2d37]">
          <div className="flex items-center gap-2">
            <Ship size={15} className="text-[#5ec1cd]" />
            <span className="eyebrow text-[#5ec1cd] font-mono font-bold tracking-wider">
              TRADE DEALS
            </span>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              setIsTradeModalOpen(true);
            }}
            className="px-3 py-1 rounded bg-[#17242c] hover:bg-[#20323e] border border-[#2f4654] text-[#5ec1cd] text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <PlusCircle size={13} />
            <span>Negotiate Treaty</span>
          </button>
        </div>

        {/* Trade Deals Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-[#8799a4] text-[10px] uppercase border-b border-[#1f2d37]">
              <tr>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3">Resource Commodity</th>
                <th className="py-2 px-3">Volume</th>
                <th className="py-2 px-3">Partner Civilisation</th>
                <th className="py-2 px-3">Unit Price</th>
                <th className="py-2 px-3">Duration</th>
                <th className="py-2 px-3 text-right">Net Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#18232b]">
              {tradeDeals.map((deal) => (
                <tr key={deal.id} className="hover:bg-[#131b21] transition-colors">
                  <td className="py-2 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        deal.type === 'EXPORT'
                          ? 'bg-[#15291e] text-[#3cd070] border border-[#234230]'
                          : 'bg-[#291e15] text-[#caa455] border border-[#423223]'
                      }`}
                    >
                      {deal.type}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-semibold text-[#f0f6fa] flex items-center gap-1.5">
                    <span>{deal.icon}</span>
                    <span>{deal.resource}</span>
                  </td>
                  <td className="py-2 px-3 text-[#8799a4]">{deal.amount}</td>
                  <td className="py-2 px-3 text-[#5ec1cd]">{deal.partnerCiv}</td>
                  <td className="py-2 px-3 text-[#f0f6fa]">{deal.pricePerUnit}</td>
                  <td className="py-2 px-3 text-[#8799a4]">{deal.durationYears} Years</td>
                  <td className="py-2 px-3 text-right font-bold text-[#caa455]">
                    {deal.netRevenue > 0 ? `+$${deal.netRevenue}M` : `-$${Math.abs(deal.netRevenue)}M`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Negotiate Trade Treaty Modal */}
      {isTradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none font-mono">
          <div className="w-full max-w-md bg-[#0f1519] border-2 border-[#5ec1cd] rounded-lg shadow-2xl p-5 text-[#e1e9ed] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#202f38]">
              <div>
                <span className="eyebrow text-[#5ec1cd]">DIPLOMATIC CONSORTIUM</span>
                <h3 className="text-base font-bold text-white mt-0.5">Draft Bilateral Trade Treaty</h3>
              </div>
              <button
                onClick={() => setIsTradeModalOpen(false)}
                className="p-1 rounded text-[#8799a4] hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-[#8799a4] uppercase block mb-1">
                  Partner Civilisation
                </label>
                <select className="w-full bg-[#131b21] border border-[#23333d] rounded p-2 text-xs text-white outline-none">
                  <option>Neo Byzantium (Aethelgard Prime)</option>
                  <option>Solaria Nexus (Hesperus II)</option>
                  <option>Free City-State of Kyoto</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-[#8799a4] uppercase block mb-1">
                  Commodity to Export
                </label>
                <select className="w-full bg-[#131b21] border border-[#23333d] rounded p-2 text-xs text-white outline-none">
                  <option>Refined Structural Steel (+28.4k surplus)</option>
                  <option>Electronic Microchips (+18.5k surplus)</option>
                  <option>Fruits & Vegetables (+14.2k surplus)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-[#8799a4] uppercase block mb-1">
                  Required Return Inflow
                </label>
                <select className="w-full bg-[#131b21] border border-[#23333d] rounded p-2 text-xs text-white outline-none">
                  <option>Artisan Bread & Hydro Rations (Deficit Relief)</option>
                  <option>Work Clothes & Fabrics</option>
                  <option>Deuterium Fuel Pellets</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-[#202f38] flex items-center justify-between">
              <span className="text-xs text-[#caa455] font-bold">Est. Yield: +$520M / cycle</span>
              <button
                onClick={() => {
                  soundFx.playRewardClaim();
                  setTradeDeals((prev) => [
                    ...prev,
                    {
                      id: `td-${Date.now()}`,
                      type: 'EXPORT',
                      resource: 'Electronic Microchips',
                      icon: '💾',
                      amount: '22,000 U',
                      partnerCiv: 'Free City-State of Kyoto',
                      pricePerUnit: '$680/U',
                      durationYears: 4,
                      netRevenue: 520,
                    },
                  ]);
                  setIsTradeModalOpen(false);
                }}
                className="px-4 py-1.5 rounded bg-[#17242c] hover:bg-[#20323e] border border-[#5ec1cd] text-[#5ec1cd] font-bold text-xs"
              >
                Ratify Treaty
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
