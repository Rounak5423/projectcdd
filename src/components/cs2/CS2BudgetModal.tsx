import React, { useState, useEffect } from 'react';
import {
  X,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building2,
  Zap,
  Droplets,
  ShieldAlert,
  GraduationCap,
  HeartPulse,
  Truck,
  Coins,
  Scale,
  Percent,
  RefreshCw,
  Landmark,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
} from 'lucide-react';
import { useGameState } from '../../context/GameStateContext';
import { soundFx } from '../../services/soundFx';

interface CS2BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CS2BudgetModal({ isOpen, onClose }: CS2BudgetModalProps) {
  const { resources, rates, taxRate, setTaxRate, civilization, triggerToast } = useGameState();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        soundFx.playClick();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const [activeTab, setActiveTab] = useState<'overview' | 'taxes' | 'services' | 'loans' | 'supplychain'>('overview');
  const [resTax, setResTax] = useState(taxRate || 14);
  const [comTax, setComTax] = useState(12);
  const [indTax, setIndTax] = useState(15);
  const [offTax, setOffTax] = useState(13);

  // Service budget modifiers (percent of normal funding 50% - 150%)
  const [roadFunding, setRoadFunding] = useState(100);
  const [powerFunding, setPowerFunding] = useState(100);
  const [waterFunding, setWaterFunding] = useState(100);
  const [healthFunding, setHealthFunding] = useState(100);
  const [eduFunding, setEduFunding] = useState(105);
  const [policeFunding, setPoliceFunding] = useState(100);

  // Active municipal debt
  const [municipalDebt, setMunicipalDebt] = useState(15000);

  // Computed revenues and expenses
  const popFactor = resources.population / 1000000;
  const resRevenue = Math.round(popFactor * 4200 * (resTax / 14));
  const comRevenue = Math.round(popFactor * 2900 * (comTax / 12));
  const indRevenue = Math.round(popFactor * 2100 * (indTax / 15));
  const offRevenue = Math.round(popFactor * 1600 * (offTax / 13));
  const totalTaxRevenue = resRevenue + comRevenue + indRevenue + offRevenue;

  const roadCost = Math.round(1100 * (roadFunding / 100));
  const powerCost = Math.round(1450 * (powerFunding / 100));
  const waterCost = Math.round(980 * (waterFunding / 100));
  const healthCost = Math.round(1300 * (healthFunding / 100));
  const eduCost = Math.round(1600 * (eduFunding / 100));
  const policeCost = Math.round(1050 * (policeFunding / 100));
  const interestCost = Math.round(municipalDebt * 0.02);
  const totalExpenses = roadCost + powerCost + waterCost + healthCost + eduCost + policeCost + interestCost;

  const netBalance = totalTaxRevenue - totalExpenses;

  const handleIssueBond = (amount: number) => {
    soundFx.playRewardClaim();
    setMunicipalDebt((prev) => prev + amount);
    triggerToast({
      type: 'reward',
      title: `🏛️ MUNICIPAL BOND ISSUED`,
      subtitle: `Issued +${amount.toLocaleString()} GRC bond. Monthly interest rate: 2%.`,
      icon: '💰',
    });
  };

  const handleRepayBond = (amount: number) => {
    if (resources.grc < amount) {
      soundFx.playClick();
      triggerToast({
        type: 'info',
        title: `INSUFFICIENT TREASURY FUNDS`,
        subtitle: `Need ${amount.toLocaleString()} GRC in treasury to retire debt.`,
      });
      return;
    }
    soundFx.playGavel();
    setMunicipalDebt((prev) => Math.max(0, prev - amount));
    triggerToast({
      type: 'reward',
      title: `DEBT REPAID`,
      subtitle: `Retired ${amount.toLocaleString()} GRC of municipal debt obligations.`,
      icon: '✅',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md select-none animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#0f1713] border border-[#dfb74a]/40 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-[#e8ece9]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#243328] bg-[#09110d]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#8f9d94] block">
                Cities: Skylines II Municipal Finance
              </span>
              <h2 className="text-base sm:text-lg font-bold font-serif text-[#faecd0]">
                City Treasury & Fiscal Budget
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] text-[#8f9d94] block uppercase font-mono">Treasury Reserve</span>
              <span className="text-sm font-mono font-bold text-[#dfb74a]">
                {resources.grc.toLocaleString()} GRC
              </span>
            </div>
            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="p-1.5 rounded-lg text-[#8f9d94] hover:text-white hover:bg-[#1a2920] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#1e2e23] bg-[#0b1410] px-4 gap-1 text-xs">
          {[
            { id: 'overview', label: 'Financial Summary', icon: Scale },
            { id: 'taxes', label: 'Sector Taxation', icon: Percent },
            { id: 'services', label: 'Municipal Services', icon: Building2 },
            { id: 'loans', label: 'Bonds & Credit', icon: Landmark },
            { id: 'supplychain', label: 'Supply Chain Ledger', icon: Truck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundFx.playClick();
                  setActiveTab(tab.id as any);
                }}
                className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 font-medium transition ${
                  isActive
                    ? 'border-[#dfb74a] text-[#dfb74a] bg-[#142219]'
                    : 'border-transparent text-[#8f9d94] hover:text-[#e8ece9]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar text-xs">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* High-level Cash Flow Hero Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-[#121e16] border border-[#2b3e32]">
                  <span className="text-[10px] text-[#8f9d94] uppercase tracking-wider block font-mono">
                    Total Revenue / Cycle
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <ArrowUpRight className="w-4 h-4 text-[#2ecc71]" />
                    <span className="text-xl font-bold font-mono text-[#2ecc71]">
                      +{totalTaxRevenue.toLocaleString()} GRC
                    </span>
                  </div>
                  <span className="text-[10px] text-[#8f9d94] mt-1 block">
                    Taxation across 4 RCI zone sectors
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#121e16] border border-[#2b3e32]">
                  <span className="text-[10px] text-[#8f9d94] uppercase tracking-wider block font-mono">
                    Total Expenses / Cycle
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <ArrowDownRight className="w-4 h-4 text-[#e74c3c]" />
                    <span className="text-xl font-bold font-mono text-[#e74c3c]">
                      -{totalExpenses.toLocaleString()} GRC
                    </span>
                  </div>
                  <span className="text-[10px] text-[#8f9d94] mt-1 block">
                    Services, grid utilities & debt interest
                  </span>
                </div>

                <div
                  className={`p-4 rounded-xl border ${
                    netBalance >= 0
                      ? 'bg-[#0f2418] border-[#2ecc71]/40'
                      : 'bg-[#291313] border-[#e74c3c]/40'
                  }`}
                >
                  <span className="text-[10px] text-[#8f9d94] uppercase tracking-wider block font-mono">
                    Net Fiscal Surplus
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={`text-xl font-bold font-mono ${
                        netBalance >= 0 ? 'text-[#2ecc71]' : 'text-[#e74c3c]'
                      }`}
                    >
                      {netBalance >= 0 ? `+${netBalance.toLocaleString()}` : `${netBalance.toLocaleString()}`} GRC
                    </span>
                  </div>
                  <span className="text-[10px] text-[#8f9d94] mt-1 block">
                    {netBalance >= 0 ? 'Municipal surplus growing reserve' : 'Deficit spending: adjust tax or services'}
                  </span>
                </div>
              </div>

              {/* Two Column Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Revenue Breakdown */}
                <div className="p-4 rounded-xl bg-[#101913] border border-[#1e2d22] space-y-2.5">
                  <h3 className="font-bold text-[#faecd0] text-sm flex items-center justify-between">
                    <span>Tax Revenue Sources</span>
                    <span className="text-xs font-mono text-[#2ecc71]">+{totalTaxRevenue.toLocaleString()} GRC</span>
                  </h3>
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="flex items-center gap-1.5 text-[#2ecc71]">
                        <span className="w-2 h-2 rounded-full bg-[#2ecc71]" />
                        Residential Tax ({resTax}%)
                      </span>
                      <span className="font-mono text-white">+{resRevenue.toLocaleString()} GRC</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="flex items-center gap-1.5 text-[#3498db]">
                        <span className="w-2 h-2 rounded-full bg-[#3498db]" />
                        Commercial Tax ({comTax}%)
                      </span>
                      <span className="font-mono text-white">+{comRevenue.toLocaleString()} GRC</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="flex items-center gap-1.5 text-[#f39c12]">
                        <span className="w-2 h-2 rounded-full bg-[#f39c12]" />
                        Industrial Tax ({indTax}%)
                      </span>
                      <span className="font-mono text-white">+{indRevenue.toLocaleString()} GRC</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="flex items-center gap-1.5 text-[#9b59b6]">
                        <span className="w-2 h-2 rounded-full bg-[#9b59b6]" />
                        High-Tech Office Tax ({offTax}%)
                      </span>
                      <span className="font-mono text-white">+{offRevenue.toLocaleString()} GRC</span>
                    </div>
                  </div>
                </div>

                {/* Expense Breakdown */}
                <div className="p-4 rounded-xl bg-[#101913] border border-[#1e2d22] space-y-2.5">
                  <h3 className="font-bold text-[#faecd0] text-sm flex items-center justify-between">
                    <span>Operating Expenses</span>
                    <span className="text-xs font-mono text-[#e74c3c]">-{totalExpenses.toLocaleString()} GRC</span>
                  </h3>
                  <div className="space-y-1.5 pt-1 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="text-[#a0aba3]">Education & Universities</span>
                      <span className="font-mono text-white">-{eduCost.toLocaleString()} GRC</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#a0aba3]">Power Grid Maintenance</span>
                      <span className="font-mono text-white">-{powerCost.toLocaleString()} GRC</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#a0aba3]">Healthcare & Hospitals</span>
                      <span className="font-mono text-white">-{healthCost.toLocaleString()} GRC</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#a0aba3]">Roads & Transit Upkeep</span>
                      <span className="font-mono text-white">-{roadCost.toLocaleString()} GRC</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#a0aba3]">Water Filtration & Sewage</span>
                      <span className="font-mono text-white">-{waterCost.toLocaleString()} GRC</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#a0aba3]">Police, Fire & Safety</span>
                      <span className="font-mono text-white">-{policeCost.toLocaleString()} GRC</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#a0aba3]">Bond Debt Interest (2%)</span>
                      <span className="font-mono text-[#e67e22]">-{interestCost.toLocaleString()} GRC</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAXATION TAB */}
          {activeTab === 'taxes' && (
            <div className="space-y-4">
              <p className="text-xs text-[#9da99b]">
                Adjust individual tax rates by sector. High taxes increase municipal income but reduce RCI demand and encourage business emigration or civil protests.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Residential */}
                <div className="p-4 rounded-xl bg-[#121f17] border border-[#2ecc71]/30 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#2ecc71]">Residential Zones</span>
                    <span className="font-mono font-bold text-white text-sm">{resTax}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="25"
                    value={resTax}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setResTax(val);
                      setTaxRate(val);
                    }}
                    className="w-full accent-[#2ecc71]"
                  />
                  <div className="flex justify-between text-[10px] text-[#8f9d94]">
                    <span>Low Tax (Attracts Citizens)</span>
                    <span>High Tax (Risks Unrest)</span>
                  </div>
                </div>

                {/* Commercial */}
                <div className="p-4 rounded-xl bg-[#101c2b] border border-[#3498db]/30 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#3498db]">Commercial Zones</span>
                    <span className="font-mono font-bold text-white text-sm">{comTax}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="25"
                    value={comTax}
                    onChange={(e) => setComTax(Number(e.target.value))}
                    className="w-full accent-[#3498db]"
                  />
                  <div className="flex justify-between text-[10px] text-[#8f9d94]">
                    <span>Boosts Consumer Goods</span>
                    <span>High Margin Sales Tax</span>
                  </div>
                </div>

                {/* Industrial */}
                <div className="p-4 rounded-xl bg-[#26190a] border border-[#f39c12]/30 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#f39c12]">Industrial Zones</span>
                    <span className="font-mono font-bold text-white text-sm">{indTax}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="25"
                    value={indTax}
                    onChange={(e) => setIndTax(Number(e.target.value))}
                    className="w-full accent-[#f39c12]"
                  />
                  <div className="flex justify-between text-[10px] text-[#8f9d94]">
                    <span>Manufacturing Growth</span>
                    <span>Pollution Penalty Tax</span>
                  </div>
                </div>

                {/* High Tech Offices */}
                <div className="p-4 rounded-xl bg-[#1c1029] border border-[#9b59b6]/30 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#9b59b6]">High-Tech Offices</span>
                    <span className="font-mono font-bold text-white text-sm">{offTax}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="25"
                    value={offTax}
                    onChange={(e) => setOffTax(Number(e.target.value))}
                    className="w-full accent-[#9b59b6]"
                  />
                  <div className="flex justify-between text-[10px] text-[#8f9d94]">
                    <span>Incentivizes AI Startups</span>
                    <span>Corporate Revenue Yield</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MUNICIPAL SERVICES TAB */}
          {activeTab === 'services' && (
            <div className="space-y-4">
              <p className="text-xs text-[#9da99b]">
                Fine-tune funding percentages for municipal services. Lowering funding saves cash but degrades response times, leads to crime spikes, fire hazards, or blackouts.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'Roads & Public Transit', val: roadFunding, set: setRoadFunding, icon: Truck, cost: roadCost },
                  { name: 'Power Grid Infrastructure', val: powerFunding, set: setPowerFunding, icon: Zap, cost: powerCost },
                  { name: 'Water & Sewage Treatment', val: waterFunding, set: setWaterFunding, icon: Droplets, cost: waterCost },
                  { name: 'Healthcare & Clinics', val: healthFunding, set: setHealthFunding, icon: HeartPulse, cost: healthCost },
                  { name: 'Public Education & Universities', val: eduFunding, set: setEduFunding, icon: GraduationCap, cost: eduCost },
                  { name: 'Police & Fire Department', val: policeFunding, set: setPoliceFunding, icon: ShieldAlert, cost: policeCost },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.name} className="p-3.5 rounded-xl bg-[#121c16] border border-[#24362a] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-[#dfb74a]" />
                          <span className="font-semibold text-white text-xs">{s.name}</span>
                        </div>
                        <span className="font-mono font-bold text-[#dfb74a]">{s.val}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={s.val}
                        onChange={(e) => s.set(Number(e.target.value))}
                        className="w-full accent-[#dfb74a]"
                      />
                      <div className="flex justify-between text-[10px] text-[#8f9d94]">
                        <span>Budget: -{s.cost.toLocaleString()} GRC / cycle</span>
                        <span>{s.val < 100 ? 'Reduced Efficiency' : s.val > 100 ? 'Boosted Coverage' : 'Normal'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* BONDS & LOANS TAB */}
          {activeTab === 'loans' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#141e17] border border-[#2d4032] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-[10px] text-[#8f9d94] uppercase font-mono block">Municipal Credit Rating</span>
                  <span className="text-2xl font-bold font-mono text-[#2ecc71]">AAA · Prime Grade</span>
                  <p className="text-[11px] text-[#9da99b] mt-1">
                    Your city maintains strong fiscal integrity with low default probability.
                  </p>
                </div>
                <div className="p-3 bg-[#0d1611] rounded-lg border border-[#223126] text-right">
                  <span className="text-[10px] text-[#8f9d94] block uppercase font-mono">Outstanding Debt</span>
                  <span className="text-xl font-mono font-bold text-[#e67e22]">
                    {municipalDebt.toLocaleString()} GRC
                  </span>
                  <span className="text-[10px] text-[#8f9d94] block mt-0.5">
                    Interest: -{interestCost.toLocaleString()} GRC / cycle
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#101913] border border-[#1e2e22] space-y-3">
                  <h4 className="font-bold text-white text-xs">Issue Municipal Bonds</h4>
                  <p className="text-[11px] text-[#8f9d94]">
                    Borrow immediate liquid capital from external financial markets for mega-projects.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleIssueBond(10000)}
                      className="flex-1 py-2 rounded-lg bg-[#223326] border border-[#3b5540] hover:bg-[#2c4232] text-xs font-semibold text-white transition"
                    >
                      +10,000 GRC Bond
                    </button>
                    <button
                      onClick={() => handleIssueBond(50000)}
                      className="flex-1 py-2 rounded-lg bg-[#293c2a] border border-[#486b4e] hover:bg-[#344d36] text-xs font-semibold text-[#faecd0] transition"
                    >
                      +50,000 GRC Bond
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#101913] border border-[#1e2e22] space-y-3">
                  <h4 className="font-bold text-white text-xs">Retire Municipal Debt</h4>
                  <p className="text-[11px] text-[#8f9d94]">
                    Pay down principal debt balance to eliminate recurring interest payments.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRepayBond(10000)}
                      disabled={municipalDebt <= 0}
                      className="flex-1 py-2 rounded-lg bg-[#2d1b18] border border-[#522b25] hover:bg-[#3d2420] text-xs font-semibold text-[#f7a999] transition disabled:opacity-40"
                    >
                      Repay 10,000 GRC
                    </button>
                    <button
                      onClick={() => handleRepayBond(municipalDebt)}
                      disabled={municipalDebt <= 0}
                      className="flex-1 py-2 rounded-lg bg-[#3b1d19] border border-[#692f27] hover:bg-[#4d2621] text-xs font-semibold text-[#f7a999] transition disabled:opacity-40"
                    >
                      Pay Off All Debt
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUPPLY CHAIN TAB */}
          {activeTab === 'supplychain' && (
            <div className="space-y-4">
              <p className="text-xs text-[#9da99b]">
                Cities: Skylines II supply chain economy. Raw materials are harvested, refined in industrial zones, and sold in commercial stores or exported for profit.
              </p>

              <div className="border border-[#1e2e22] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0b140f] text-[#8f9d94] font-mono uppercase text-[10px] border-b border-[#1e2e22]">
                    <tr>
                      <th className="p-3">Commodity / Material</th>
                      <th className="p-3">Local Production</th>
                      <th className="p-3">Consumption</th>
                      <th className="p-3">Net Trade Balance</th>
                      <th className="p-3">Market Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#17241a] text-[11px]">
                    {[
                      { name: 'Grain & Hydroponics', prod: '12,500 t', cons: '9,800 t', bal: '+2,700 t (Export)', val: '45 GRC/t', pos: true },
                      { name: 'Clean Energy & MW', prod: '14,200 MW', cons: '11,800 MW', bal: '+2,400 MW (Grid Export)', val: '68 GRC/MW', pos: true },
                      { name: 'Refined Metals & Titanium', prod: '6,100 t', cons: '7,200 t', bal: '-1,100 t (Importing)', val: '120 GRC/t', pos: false },
                      { name: 'Semiconductors & AI Cores', prod: '8,200 t', cons: '5,400 t', bal: '+2,800 t (Export)', val: '350 GRC/t', pos: true },
                      { name: 'Commercial Consumer Goods', prod: '9,500 t', cons: '9,100 t', bal: '+400 t (Export)', val: '85 GRC/t', pos: true },
                    ].map((c) => (
                      <tr key={c.name} className="hover:bg-[#131d16] transition">
                        <td className="p-3 font-semibold text-white">{c.name}</td>
                        <td className="p-3 font-mono text-[#a0aba3]">{c.prod}</td>
                        <td className="p-3 font-mono text-[#a0aba3]">{c.cons}</td>
                        <td className={`p-3 font-mono font-bold ${c.pos ? 'text-[#2ecc71]' : 'text-[#e74c3c]'}`}>
                          {c.bal}
                        </td>
                        <td className="p-3 font-mono text-[#dfb74a]">{c.val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#243328] bg-[#09110d] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#8f9d94]">
            <CheckCircle2 className="w-4 h-4 text-[#2ecc71]" />
            <span>Fiscal policies apply automatically on daily simulation ticks</span>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-lg bg-[#18261e] border border-[#2a3c30] hover:bg-[#203328] text-white text-xs font-semibold transition"
          >
            Close Budget Manager
          </button>
        </div>
      </div>
    </div>
  );
}
