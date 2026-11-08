import React, { useState, useMemo } from 'react';
import {
  Coins,
  FlaskConical,
  Award,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CheckCircle2,
  Gift,
  TrendingUp,
  Download,
  Filter,
  Search,
  Cpu,
  Layers,
  ShieldCheck,
  X,
  CreditCard,
  Zap,
  Clock
} from 'lucide-react';
import { useGameState } from '../context/GameStateContext';
import { ResearchTransaction } from '../types/game';
import { soundFx } from '../services/soundFx';

interface ResearchWalletPageProps {
  onClose?: () => void;
}

export const ResearchWalletPage: React.FC<ResearchWalletPageProps> = ({ onClose }) => {
  const { resources, civilization, rates, transactions } = useGameState();
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Spending categories catalogue
  const spendingCatalogue = [
    {
      id: 'spend-tech-boost',
      title: 'Technological Acceleration',
      cost: 150,
      description: 'Allocate quantum processing cycles to boost active research rate by +50% for 15 days.',
      icon: Cpu,
    },
    {
      id: 'spend-scenario',
      title: 'Deep Horizon Scenario Branching',
      cost: 80,
      description: 'Spin up Monte Carlo predictive simulation run in the Future Simulator for 3 alternate futures.',
      icon: TrendingUp,
    },
    {
      id: 'spend-policy-audit',
      title: 'Predictive Policy Econometric Audit',
      cost: 50,
      description: 'Simulate public sentiment and macroeconomic shocks before ratifying complex decrees.',
      icon: Layers,
    },
    {
      id: 'spend-permit',
      title: 'Specialised Architectural Charter',
      cost: 200,
      description: 'License advanced construction blueprints for wonder-class planetary infrastructure.',
      icon: ShieldCheck,
    },
  ];

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchType = selectedType === 'all' || tx.type === selectedType;
      const matchSearch =
        tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.type.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchSearch;
    });
  }, [transactions, selectedType, searchQuery]);

  const handleExportLedger = () => {
    soundFx.playSuccess();
    const csvContent = "data:text/csv;charset=utf-8,"
      + ["Transaction ID,Sim Year,Sim Day,Type,Description,Amount CRC,Balance After,Status"]
      .concat(transactions.map(t =>
        `"${t.id}","${t.simYear}","${t.simDay}","${t.type}","${t.description.replace(/"/g, '""')}","${t.amount}","${t.balanceAfter}","${t.status}"`
      )).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${civilization.name.replace(/\s+/g, '_')}_CRC_Treasury_Ledger.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#171D18]/95 backdrop-blur-md text-[#EAE3D2] overflow-hidden select-none font-sans">
      {/* Top Header */}
      <div className="flex-shrink-0 px-8 py-5 border-b border-[#C5A66A]/20 bg-gradient-to-r from-[#171D18] via-[#202820] to-[#171D18] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm border border-[#C5A66A]/40 bg-[#17231B] flex items-center justify-center text-[#C5A66A] shadow-inner">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl text-[#EAE3D2] tracking-wider font-semibold">
                RESEARCH WALLET & CRC TREASURY
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-[#C5A66A]/40 text-[#C5A66A] bg-[#C5A66A]/10">
                Civora Research Credits (CRC)
              </span>
            </div>
            <p className="text-xs text-[#A5AD9D] font-sans mt-0.5">
              Authoritative ledger for Civora Research Credits, scientific grants, scenario simulations, and command XP.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportLedger}
            className="flex items-center gap-2 px-4 py-2 border border-[#C5A66A]/40 text-[#C5A66A] hover:bg-[#C5A66A]/15 rounded text-xs font-serif tracking-wider uppercase transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Ledger</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 border border-[#C5A66A]/30 rounded hover:bg-[#C5A66A]/10 text-[#A5AD9D] hover:text-[#EAE3D2] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Balances Banner */}
      <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-4 gap-4 px-8 py-5 bg-[#17231B]/60 border-b border-[#C5A66A]/15">
        {/* Active CRC Wallet */}
        <div className="p-4 rounded bg-[#202820] border border-[#C5A66A]/30 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#C5A66A]">
              Treasury Balance
            </span>
            <Coins className="w-4 h-4 text-[#C5A66A]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-[#EAE3D2]">
              {resources.grc.toLocaleString()}
            </span>
            <span className="font-mono text-xs text-[#C5A66A] font-semibold">CRC</span>
          </div>
          <p className="text-[11px] text-[#8FA879] mt-1 flex items-center gap-1 font-mono">
            <TrendingUp className="w-3 h-3" />
            +{rates.grcEarnRate || 8} CRC / simulated day
          </p>
        </div>

        {/* Total Earned */}
        <div className="p-4 rounded bg-[#202820] border border-[#C5A66A]/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#A5AD9D]">
              Historical Earned
            </span>
            <ArrowDownLeft className="w-4 h-4 text-[#8FA879]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold text-[#8FA879]">
              3,850
            </span>
            <span className="font-mono text-xs text-[#A5AD9D]">CRC</span>
          </div>
          <p className="text-[11px] text-[#A5AD9D] mt-1 font-sans">
            From milestones & experimental validations
          </p>
        </div>

        {/* Total Disbursed */}
        <div className="p-4 rounded bg-[#202820] border border-[#C5A66A]/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#A5AD9D]">
              Total Disbursed
            </span>
            <ArrowUpRight className="w-4 h-4 text-[#D6A75E]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold text-[#D6A75E]">
              1,570
            </span>
            <span className="font-mono text-xs text-[#A5AD9D]">CRC</span>
          </div>
          <p className="text-[11px] text-[#A5AD9D] mt-1 font-sans">
            Invested into science trials & future branches
          </p>
        </div>

        {/* Command XP & Level */}
        <div className="p-4 rounded bg-[#202820] border border-[#C5A66A]/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#C5A66A]">
                Civilisation Level
              </span>
              <Award className="w-4 h-4 text-[#C5A66A]" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-serif text-xl font-bold text-[#EAE3D2]">
                Level {civilization.level}
              </span>
              <span className="text-xs text-[#A5AD9D] font-mono">({civilization.era})</span>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-[10px] font-mono text-[#A5AD9D] mb-1">
              <span>XP Progress</span>
              <span className="text-[#8FA879]">{civilization.xp} / {civilization.xpToNextLevel}</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#171D18] overflow-hidden border border-[#C5A66A]/20">
              <div
                className="h-full bg-[#C5A66A]"
                style={{ width: `${Math.round((civilization.xp / civilization.xpToNextLevel) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Spending Allocations & Ledger */}
      <div className="flex-1 min-h-0 px-8 py-6 overflow-y-auto space-y-6">
        {/* Spending Allocations */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="font-serif text-xs uppercase font-bold tracking-wider text-[#C5A66A]">
              SCIENTIFIC ALLOCATIONS & EXPEDITION INVESTMENTS
            </span>
            <span className="text-xs text-[#A5AD9D] font-mono">
              Authorize high-impact simulations using Treasury CRC
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {spendingCatalogue.map(item => {
              const Icon = item.icon;
              const canAfford = resources.grc >= item.cost;
              return (
                <div
                  key={item.id}
                  className="p-5 rounded bg-[#202820]/90 border border-[#C5A66A]/25 flex flex-col justify-between hover:border-[#C5A66A]/70 transition-all shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 rounded border border-[#C5A66A]/30 bg-[#171D18] flex items-center justify-center text-[#C5A66A]">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-mono text-xs font-bold text-[#C5A66A]">
                        {item.cost} CRC
                      </span>
                    </div>

                    <h3 className="font-serif text-sm font-bold text-[#EAE3D2]">{item.title}</h3>
                    <p className="text-xs text-[#A5AD9D] mt-2 line-clamp-3 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#C5A66A]/15">
                    <button
                      onClick={() => {
                        soundFx.playClick();
                      }}
                      disabled={!canAfford}
                      className={`w-full py-1.5 rounded text-xs font-serif font-bold uppercase tracking-wider transition-colors ${
                        canAfford
                          ? 'bg-[#17231B] text-[#C5A66A] border border-[#C5A66A]/40 hover:bg-[#C5A66A] hover:text-[#171D18]'
                          : 'bg-[#171D18] text-[#A5AD9D]/50 border border-transparent cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? 'Authorize Investment' : 'Insufficient CRC'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Audit Trail Table */}
        <div className="p-5 rounded bg-[#202820]/90 border border-[#C5A66A]/25 shadow-md flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#C5A66A]/20 gap-3">
            <div>
              <span className="text-[10px] font-mono text-[#C5A66A] uppercase font-bold tracking-wider">
                AUDIT LOG & JOURNAL
              </span>
              <h3 className="font-serif text-base font-bold text-[#EAE3D2] mt-0.5">
                Official Treasury Transaction Ledger
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A5AD9D]" />
                <input
                  type="text"
                  placeholder="Search ledger entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#171D18] border border-[#C5A66A]/30 rounded pl-8 pr-3 py-1 text-xs text-[#EAE3D2] placeholder-[#A5AD9D]/60 outline-none focus:border-[#C5A66A] w-48"
                />
              </div>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-[#171D18] border border-[#C5A66A]/30 rounded text-xs text-[#EAE3D2] px-3 py-1 focus:outline-none focus:border-[#C5A66A]"
              >
                <option value="all">All Classifications</option>
                <option value="Reward">Reward</option>
                <option value="Experiment">Experiment</option>
                <option value="Scenario">Scenario</option>
                <option value="Grant">Grant</option>
                <option value="Facility Upgrade">Facility Upgrade</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left text-xs font-sans">
              <thead className="text-[#A5AD9D] font-mono text-[10px] uppercase border-b border-[#C5A66A]/20">
                <tr>
                  <th className="py-2.5 px-3">Transaction ID</th>
                  <th className="py-2.5 px-3">Simulated Date</th>
                  <th className="py-2.5 px-3">Classification</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-right">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C5A66A]/10 text-[#EAE3D2]">
                {filteredTransactions.map(tx => {
                  const isPositive = tx.amount >= 0;
                  return (
                    <tr key={tx.id} className="hover:bg-[#17231B] transition-colors">
                      <td className="py-3 px-3 font-mono text-[11px] text-[#A5AD9D]">{tx.id}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-[#D8CBAA]">
                        Year {tx.simYear}, Day {tx.simDay}
                      </td>
                      <td className="py-3 px-3 font-mono text-[10px] uppercase">
                        <span className="px-2 py-0.5 rounded bg-[#171D18] border border-[#C5A66A]/30 text-[#C5A66A]">
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#EAE3D2] font-serif font-medium">{tx.description}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#8FA879]/10 text-[#8FA879] border border-[#8FA879]/30">
                          {tx.status}
                        </span>
                      </td>
                      <td className={`py-3 px-3 text-right font-mono font-bold ${isPositive ? 'text-[#8FA879]' : 'text-[#D6A75E]'}`}>
                        {isPositive ? `+${tx.amount}` : tx.amount} CRC
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[#D8CBAA]">
                        {tx.balanceAfter.toLocaleString()} CRC
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchWalletPage;
