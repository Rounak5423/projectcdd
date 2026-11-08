import React from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Award,
  Crown,
  BookOpen,
  Sparkles,
  Shield,
  Layers,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { CivoraEmblem } from '../brand/CivoraLogo';
import { useGameState } from '../../context/GameStateContext';

interface PlayerLegacyProps {
  onViewAllAchievements: () => void;
}

export default function PlayerLegacy({ onViewAllAchievements }: PlayerLegacyProps) {
  const { achievements, resources } = useGameState();

  const legacyStats = [
    { label: 'CIVILISATIONS FOUNDED', value: '4 Sovereign Worlds', icon: Crown },
    { label: 'HISTORICAL MILESTONES', value: '38 Epoch Seals', icon: Shield },
    { label: 'DISCOVERED TECHNOLOGIES', value: '54 Breakthroughs', icon: BookOpen },
    { label: 'RESEARCH EXPERIMENTS', value: '16 Completed', icon: Award },
  ];

  const medallions = [
    {
      id: 'grand-architect',
      name: 'Grand Architect of Antiquity',
      inscription: 'Erected 10 classical monumental wonders without triggering civil famine.',
      date: 'Earned Epoch II',
      sealType: 'Embossed Imperial Gold',
      points: '+250 CRC',
      unlocked: true,
    },
    {
      id: 'pax-aeterna',
      name: 'Pax Aeterna (Perpetual Peace)',
      inscription: 'Maintained greater than 90% harmony index over 5 consecutive simulated decades.',
      date: 'Earned Epoch III',
      sealType: 'Verdant Laurel Wreath',
      points: '+400 CRC',
      unlocked: true,
    },
    {
      id: 'prometheus-quantum',
      name: 'Promethean Cognition',
      inscription: 'Successfully resolved the AI Dependency Paradox without authoritarian override.',
      date: 'Earned Epoch IV',
      sealType: 'Quantum Astrolabe Seal',
      points: '+600 CRC',
      unlocked: true,
    },
    {
      id: 'dyson-ascendant',
      name: 'Sovereign of Eternity',
      inscription: 'Advance a civilization through all six epochs and complete the Biosphere Ark.',
      date: 'Inscribed in Prophecy',
      sealType: 'Antique Bronze Inscription',
      points: '+1,500 CRC',
      unlocked: false,
    },
  ];

  return (
    <section
      id="legacy"
      className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto select-none"
    >
      {/* Legacy Header */}
      <div className="text-center space-y-3 mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16221a] border border-[#c5a66a]/40 text-[#c5a66a] text-[10px] font-mono tracking-widest uppercase">
          <Trophy size={14} />
          <span>PLAYER LEGACY & CHRONICLES</span>
        </div>

        <h2
          className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black tracking-[0.16em] uppercase text-transparent bg-clip-text bg-gradient-to-b from-[#faecd0] via-[#c5a66a] to-[#8c6e33]"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          WHAT WILL HISTORY REMEMBER?
        </h2>

        <p
          className="text-base sm:text-lg font-serif italic text-[#d8cbaa] max-w-2xl mx-auto"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Your decisions outlive the fleeting moments of simulation. Here lie the immutable achievements,
          philosophical seals, and enduring laurels earned across your civilisations.
        </p>

        <div className="w-24 h-0.5 mx-auto bg-gradient-to-r from-transparent via-[#c5a66a] to-transparent mt-4" />
      </div>

      {/* Global Legacy Metrics Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
        {legacyStats.map((stat) => {
          const IconComp = stat.icon;

          return (
            <div
              key={stat.label}
              className="p-5 rounded-2xl bg-[#121c15] border border-[#c5a66a]/30 shadow-lg flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-[#1a271e] border border-[#8c6e33] flex items-center justify-center text-[#dfb74a] shrink-0">
                <IconComp size={20} />
              </div>

              <div>
                <span className="text-[9px] font-mono uppercase text-[#77786d] block">
                  {stat.label}
                </span>
                <span className="text-sm sm:text-base font-serif font-bold text-[#faecd0]">
                  {stat.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Antique Medallions & Achievement Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {medallions.map((med) => (
          <motion.div
            key={med.id}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`p-6 sm:p-7 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
              med.unlocked
                ? 'bg-gradient-to-br from-[#16221a] via-[#101913] to-[#0a100c] border-[#c5a66a]/40 shadow-xl hover:border-[#dfb74a]'
                : 'bg-[#0c120e] border-[#222c23] opacity-60'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase text-[#c5a66a] font-bold">
                    {med.sealType}
                  </span>
                  <span className="text-[9px] font-mono text-[#77786d]">
                    • {med.date}
                  </span>
                </div>

                <span className="px-2.5 py-1 rounded bg-black/40 border border-[#8c6e33]/60 text-xs font-mono font-bold text-[#faecd0]">
                  {med.points}
                </span>
              </div>

              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  <CivoraEmblem size={44} />
                  {!med.unlocked && (
                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                      <Lock size={16} className="text-[#8e8574]" />
                    </div>
                  )}
                </div>

                <div>
                  <h4
                    className="text-base sm:text-lg font-serif font-bold text-[#faecd0]"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    {med.name}
                  </h4>
                  <p
                    className="text-xs sm:text-sm font-serif text-[#d8cbaa] mt-1 leading-relaxed"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {med.inscription}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#233125] flex items-center justify-between text-[11px] font-mono">
              <span className={med.unlocked ? 'text-[#a18131]' : 'text-[#77786d]'}>
                {med.unlocked ? 'Verified Historical Archive' : 'Objective Unfulfilled'}
              </span>
              <span className="text-[#c5a66a] font-serif font-semibold">
                {med.unlocked ? 'Conferred' : 'Locked'}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <button
          onClick={onViewAllAchievements}
          className="btn-civora-secondary px-6 py-3 rounded-xl font-serif font-bold text-xs tracking-wider uppercase inline-flex items-center gap-2"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          <Trophy size={14} className="text-[#c5a66a]" />
          <span>INSPECT COMPLETE CHRONICLE ARCHIVE</span>
        </button>
      </div>
    </section>
  );
}

