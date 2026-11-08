import React from 'react';
import { CivoraEmblem } from '../brand/CivoraLogo';
import { Shield, Sparkles, Globe2, BookOpen, Compass, Award } from 'lucide-react';

interface LandingFooterProps {
  onNavigateSection: (sectionId: string) => void;
  onEnterSimulation: () => void;
  onCreateNewWorld: () => void;
}

export default function LandingFooter({
  onNavigateSection,
  onEnterSimulation,
  onCreateNewWorld,
}: LandingFooterProps) {
  return (
    <footer className="relative bg-[#0a100c] border-t border-[#c5a66a]/30 pt-16 pb-12 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#243326]">
          {/* Brand Philosophy & Seal */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <CivoraEmblem size={44} />
              <div>
                <h3
                  className="text-lg font-serif font-black tracking-[0.22em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#faecd0] via-[#c5a66a] to-[#8c6e33]"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  CIVORA
                </h3>
                <p
                  className="text-[9px] font-serif tracking-[0.28em] uppercase text-[#d8cbaa]"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  CIVILISATION SIMULATION ENGINE
                </p>
              </div>
            </div>

            <p
              className="text-sm font-serif italic text-[#cfc7b4] leading-relaxed max-w-sm pt-2"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              &ldquo;Build a Civilisation. Define an Eternity.&rdquo;
              <br />
              A persistent artificial civilisation-building and research simulation platform
              governing thousands of autonomous human minds.
            </p>

            <div className="pt-2 flex items-center gap-2 text-[10px] font-mono text-[#77786d]">
              <span className="w-2 h-2 rounded-full bg-[#3c5938]" />
              <span>SIMULATION ENGINE ENGINE: V3.4 PERSISTENT ACTIVE</span>
            </div>
          </div>

          {/* Column 1: Exploration */}
          <div className="space-y-3">
            <h4
              className="text-xs font-serif font-bold tracking-widest uppercase text-[#faecd0]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              EXPLORATION
            </h4>
            <ul className="space-y-2 text-xs text-[#cfc7b4]">
              <li>
                <button
                  onClick={() => onNavigateSection('hero')}
                  className="hover:text-[#faecd0] transition-colors"
                >
                  The Dawn of Empires
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('archive')}
                  className="hover:text-[#faecd0] transition-colors"
                >
                  My Civilisations Archive
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('pillars')}
                  className="hover:text-[#faecd0] transition-colors"
                >
                  The Four Pillars of State
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('eras')}
                  className="hover:text-[#faecd0] transition-colors"
                >
                  Epochs of Human Progress
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: Research & Science */}
          <div className="space-y-3">
            <h4
              className="text-xs font-serif font-bold tracking-widest uppercase text-[#faecd0]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              RESEARCH
            </h4>
            <ul className="space-y-2 text-xs text-[#cfc7b4]">
              <li>
                <button
                  onClick={() => onNavigateSection('research')}
                  className="hover:text-[#faecd0] transition-colors"
                >
                  Civora Research Credits (CRC)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('observatory')}
                  className="hover:text-[#faecd0] transition-colors"
                >
                  Research Observatory
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('observatory')}
                  className="hover:text-[#faecd0] transition-colors"
                >
                  AI Dependency Paradox
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('legacy')}
                  className="hover:text-[#faecd0] transition-colors"
                >
                  Historical Imperial Ledger
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Direct Game Actions */}
          <div className="space-y-3">
            <h4
              className="text-xs font-serif font-bold tracking-widest uppercase text-[#faecd0]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              COMMAND
            </h4>
            <ul className="space-y-2 text-xs text-[#cfc7b4]">
              <li>
                <button
                  onClick={onEnterSimulation}
                  className="hover:text-[#faecd0] font-semibold text-[#c5a66a] transition-colors"
                >
                  Launch 3D Simulation →
                </button>
              </li>
              <li>
                <button
                  onClick={onCreateNewWorld}
                  className="hover:text-[#faecd0] transition-colors"
                >
                  Found New Civilisation
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('legacy')}
                  className="hover:text-[#faecd0] transition-colors"
                >
                  Review Medallions & Laurels
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <p
            className="text-[11px] font-serif text-[#77786d] max-w-xl leading-relaxed"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Empirical Notice: Simulations explore societal outcomes under defined mathematical and historical assumptions
            rather than guarantee real-world predictions.
          </p>

          <div className="text-[10px] font-mono text-[#77786d] flex items-center gap-3">
            <span>© 2026 CIVORA SIMULATION ENGINE</span>
            <span>•</span>
            <span className="text-[#c5a66a]">ALL RIGHTS INSCRIBED</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

