import React from 'react';
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
} from 'lucide-react';
import { useGameState } from '../context/GameStateContext';

export default function ResearchWalletPage() {
  const { resources, civilization, achievements, claimAchievement } = useGameState();

  const transactions = [
    { id: 'tx-1', type: 'earned', amount: 250, label: 'Metropolis of the Pioneers Milestone', date: 'Year 010 · Day 045' },
    { id: 'tx-2', type: 'earned', amount: 150, label: 'Vertical Horizons Arcology Commission', date: 'Year 008 · Day 210' },
    { id: 'tx-3', type: 'spent', amount: 80, label: 'Initiated AI Dependency Paradox Trial', date: 'Year 011 · Day 330' },
    { id: 'tx-4', type: 'earned', amount: 300, label: 'Sovereign Dynamo Renewable Grid Achieved', date: 'Year 011 · Day 312' },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 overflow-y-auto custom-scrollbar text-[#e8e9e3] max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#39443a] gap-4">
        <div>
          <span className="eyebrow text-[#c6a76a]">EXECUTIVE TREASURY</span>
          <h1 className="text-2xl font-bold text-[#f3f5ef] mt-0.5">Research Wallet & Progression</h1>
          <p className="text-xs text-[#9da99b] mt-1">
            Track Genesis Research Credits (GRC), civilisational experience level, and redeem scientific bounty milestones.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#182119] p-3 rounded-xl border border-[#2e3c2f] text-xs font-mono">
          <div>
            <span className="text-[#9da99b] block text-[10px]">COMMAND XP</span>
            <span className="text-sm font-bold text-[#a6bd82]">
              {civilization.xp} / {civilization.xpToNextLevel} XP
            </span>
          </div>
        </div>
      </div>

      {/* Main Balances Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="panel p-5 bg-gradient-to-br from-[#272214] to-[#182018] border-[#594926] shadow-xl">
          <div className="flex items-center justify-between">
            <span className="eyebrow text-[#c6a76a]">ACTIVE GRC WALLET</span>
            <div className="w-8 h-8 rounded-lg bg-[#3d3319] border border-[#6b5829] flex items-center justify-center text-[#c6a76a]">
              <Coins size={18} />
            </div>
          </div>
          <p className="text-3xl font-black font-mono text-[#f5ecd2] mt-3">
            {resources.grc.toLocaleString()} <span className="text-lg font-bold text-[#c6a76a]">GRC</span>
          </p>
          <p className="text-xs text-[#a6bd82] mt-1">+8 GRC earned per simulation day</p>
        </div>

        <div className="panel p-5 bg-[#182119] border-[#313f32]">
          <div className="flex items-center justify-between">
            <span className="eyebrow text-[#82bd8e]">RESEARCH KNOWLEDGE POOL</span>
            <div className="w-8 h-8 rounded-lg bg-[#223324] border border-[#375239] flex items-center justify-center text-[#82bd8e]">
              <FlaskConical size={18} />
            </div>
          </div>
          <p className="text-3xl font-black font-mono text-[#f3f5ef] mt-3">
            {resources.researchPoints.toLocaleString()}{' '}
            <span className="text-lg font-bold text-[#82bd8e]">PTS</span>
          </p>
          <p className="text-xs text-[#a6bd82] mt-1">+36 Points generated per day</p>
        </div>

        <div className="panel p-5 bg-[#182119] border-[#313f32] flex flex-col justify-between">
          <div>
            <span className="eyebrow text-[#c6a76a]">COMMAND LEVEL & ERA</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-[#f3f5ef]">Level {civilization.level}</span>
              <span className="text-xs text-[#c6a76a] font-mono">({civilization.era} Era)</span>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex justify-between text-[11px] font-mono mb-1">
              <span className="text-[#9da99b]">Level Progress</span>
              <span className="text-[#a6bd82]">
                {Math.round((civilization.xp / civilization.xpToNextLevel) * 100)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-[#121612] overflow-hidden">
              <div
                className="h-full bg-[#c6a76a] rounded-full transition-all duration-300"
                style={{
                  width: `${(civilization.xp / civilization.xpToNextLevel) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Claimable Milestones and Transaction Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Claimable Milestones */}
        <div className="panel p-5 bg-[#182119] border-[#313f32] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#29342a]">
            <div>
              <span className="eyebrow text-[#c6a76a]">DEVELOPMENT BOUNTIES</span>
              <h3 className="text-base font-bold text-[#f3f5ef] mt-0.5">Claimable Milestones</h3>
            </div>
            <Gift size={18} className="text-[#c6a76a]" />
          </div>

          <div className="space-y-3">
            {achievements.map((ach) => {
              const isClaimable = ach.isUnlocked && ach.progress < ach.maxProgress;

              return (
                <div
                  key={ach.id}
                  className="p-3.5 rounded-lg bg-[#141914] border border-[#273328] flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="text-xs font-bold text-[#f3f5ef]">{ach.title}</h4>
                    <p className="text-[11px] text-[#9da99b] mt-0.5">{ach.description}</p>
                    <span className="text-[10px] font-mono text-[#c6a76a] font-bold mt-1 inline-block">
                      Reward: +{ach.rewardGrc} GRC
                    </span>
                  </div>

                  {ach.isUnlocked ? (
                    <span className="px-3 py-1.5 rounded bg-[#202d22] text-[#a6bd82] border border-[#354c38] text-xs font-semibold flex items-center gap-1 shrink-0">
                      <CheckCircle2 size={13} /> Unlocked
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded bg-[#1c231d] text-[#6e7d6b] text-xs font-mono shrink-0">
                      In Progress
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Transaction History Ledger */}
        <div className="panel p-5 bg-[#182119] border-[#313f32] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#29342a]">
            <div>
              <span className="eyebrow text-[#c6a76a]">AUDIT TRAIL</span>
              <h3 className="text-base font-bold text-[#f3f5ef] mt-0.5">GRC Transaction History</h3>
            </div>
            <Coins size={18} className="text-[#a6bd82]" />
          </div>

          <div className="space-y-2.5">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3 rounded-lg bg-[#141914] border border-[#273328] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      tx.type === 'earned'
                        ? 'bg-[#203123] text-[#a6bd82]'
                        : 'bg-[#33221e] text-[#d47e69]'
                    }`}
                  >
                    {tx.type === 'earned' ? (
                      <ArrowDownLeft size={14} />
                    ) : (
                      <ArrowUpRight size={14} />
                    )}
                  </div>
                  <div>
                    <h5 className="font-semibold text-[#f0f3eb]">{tx.label}</h5>
                    <p className="text-[10px] font-mono text-[#9da99b]">{tx.date}</p>
                  </div>
                </div>

                <span
                  className={`font-mono font-bold text-sm ${
                    tx.type === 'earned' ? 'text-[#a6bd82]' : 'text-[#d47e69]'
                  }`}
                >
                  {tx.type === 'earned' ? `+${tx.amount}` : `-${tx.amount}`} GRC
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
