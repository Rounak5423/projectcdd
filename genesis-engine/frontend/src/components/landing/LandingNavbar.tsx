import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CivoraEmblem } from '../brand/CivoraLogo';
import { Coins, User, ArrowRight, Play, Sparkles, Clapperboard } from 'lucide-react';
import { useGameState } from '../../context/GameStateContext';

interface LandingNavbarProps {
  onEnterSimulation: () => void;
  onNavigateSection: (sectionId: string) => void;
  onWatchPrologue?: () => void;
}

export default function LandingNavbar({
  onEnterSimulation,
  onNavigateSection,
  onWatchPrologue,
}: LandingNavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const { resources, civilization } = useGameState();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Discover', target: 'hero' },
    { label: 'My Civilisations', target: 'archive' },
    { label: 'Four Pillars', target: 'pillars' },
    { label: 'Progression Eras', target: 'eras' },
    { label: 'Research Economy', target: 'research' },
    { label: 'Observatory', target: 'observatory' },
    { label: 'Legacy', target: 'legacy' },
  ];

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 select-none ${
        isScrolled
          ? 'py-2.5 bg-[#0f1712]/92 backdrop-blur-md border-b border-[#c5a66a]/30 shadow-[0_8px_32px_rgba(0,0,0,0.85)]'
          : 'py-4 bg-gradient-to-b from-[#09110c]/90 via-[#0d1610]/60 to-transparent border-b border-[#c5a66a]/15'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Official Brand Identity */}
        <div
          onClick={() => onNavigateSection('hero')}
          className="flex items-center gap-3 cursor-pointer group"
          title="CIVORA — Build a Civilisation. Define an Eternity."
        >
          <div className="relative">
            <CivoraEmblem
              size={isScrolled ? 36 : 44}
              className="transition-transform duration-300 group-hover:scale-105"
            />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center">
              <span
                className="text-lg sm:text-xl font-serif font-black tracking-[0.22em] uppercase text-transparent bg-clip-text bg-gradient-to-b from-[#faecd0] via-[#c5a66a] to-[#8c6e33]"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                CIVORA
              </span>
            </div>
            {!isScrolled && (
              <span
                className="text-[8px] font-serif font-semibold tracking-[0.26em] uppercase text-[#d8cbaa] hidden sm:block"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                CIVILISATION ENGINE
              </span>
            )}
          </div>
        </div>

        {/* Centre: Strategy Game Navigation Items */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 px-3 py-1.5 rounded-lg bg-[#141d16]/70 border border-[#2b3a2d]/60 backdrop-blur-sm">
          {navItems.map((item, idx) => (
            <React.Fragment key={item.target}>
              <button
                onClick={() => onNavigateSection(item.target)}
                className="px-2.5 py-1 text-[11px] xl:text-xs font-serif font-medium tracking-wider text-[#cfc7b4] hover:text-[#faecd0] hover:bg-[#1f2d22] rounded transition-all"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                {item.label}
              </button>
              {idx < navItems.length - 1 && (
                <span className="w-1 h-1 rounded-full bg-[#c5a66a]/30" />
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Right: Research Balance, Profile & Enter Simulation CTA */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Civora Research Credits (CRC) */}
          <div
            onClick={() => onNavigateSection('research')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#131d16] border border-[#c5a66a]/40 shadow-sm cursor-pointer hover:border-[#dfb74a] transition-all"
            title="Civora Research Credits (CRC) balance"
          >
            <Coins size={13} className="text-[#c5a66a]" />
            <span className="text-[11px] font-mono font-bold text-[#faecd0]">
              {resources?.grc ?? 1250} <span className="text-[9px] text-[#c5a66a]">CRC</span>
            </span>
          </div>

          {/* Watch Prologue Title Sequence CTA */}
          {onWatchPrologue && (
            <button
              onClick={onWatchPrologue}
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#101c14] border border-[#dfb74a]/60 text-[#dfb74a] text-[10px] font-mono tracking-wider hover:bg-[#18261c] hover:border-[#dfb74a] transition-all cursor-pointer shadow-sm"
              title="Watch Game of Thrones Style Heroic Title Sequence"
            >
              <Clapperboard size={12} className="text-[#faecd0]" />
              <span>PROLOGUE</span>
            </button>
          )}

          {/* Commander Seal / Profile */}
          <div
            className="hidden sm:flex items-center gap-2 pl-2 border-l border-[#2d3a2e]"
            title={`Governor: ${civilization?.name ?? 'Verdant Vale'}`}
          >
            <div className="w-7 h-7 rounded-full bg-[#1e2a21] border border-[#c5a66a]/60 flex items-center justify-center text-[#faecd0] shadow-inner">
              <User size={13} />
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-[10px] font-serif font-bold text-[#ede8dc] leading-tight">
                {civilization?.name ?? 'Kyoto Prime'}
              </span>
              <span className="text-[8px] font-mono text-[#c5a66a] uppercase">
                Tier {civilization?.level ?? 4} Sovereign
              </span>
            </div>
          </div>

          {/* Enter Simulation / Play CTA */}
          <button
            onClick={onEnterSimulation}
            className="btn-civora-primary px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-serif font-bold tracking-wider flex items-center gap-2"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            <Play size={12} className="fill-current text-[#faecd0]" />
            <span>ENTER WORLD</span>
          </button>
        </div>
      </div>
    </motion.header>
  );
}

