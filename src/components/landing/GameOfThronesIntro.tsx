import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CivoraEmblem } from '../brand/CivoraLogo';
import { Sparkles, ArrowRight, Compass, Volume2, Play } from 'lucide-react';
import { soundFx } from '../../services/soundFx';

interface GameOfThronesIntroProps {
  onComplete: () => void;
}

export default function GameOfThronesIntro({ onComplete }: GameOfThronesIntroProps) {
  // Phase 0: The Primordial Void (0 - 1.2s) - Astrolabe rings begin turning in darkness
  // Phase 1: The Solar Ignition (1.2 - 2.8s) - Blazing golden core burns through the rings
  // Phase 2: The Forging of Civora (2.8 - 4.5s) - Monumental architectural emblem rises
  // Phase 3: The Imperial Inscription (4.5s+) - Title carved in stone, ready to descend
  const [phase, setPhase] = useState<number>(0);
  const [isDiving, setIsDiving] = useState<boolean>(false);

  useEffect(() => {
    // Play the deep sub-bass imperial overture
    try {
      soundFx.playHeroicOverture();
    } catch (e) {}

    const t1 = setTimeout(() => {
      setPhase(1);
    }, 1200);

    const t2 = setTimeout(() => {
      setPhase(2);
      try {
        soundFx.playTurnAdvance();
      } catch (e) {}
    }, 2800);

    const t3 = setTimeout(() => {
      setPhase(3);
      try {
        soundFx.playEureka();
      } catch (e) {}
    }, 4500);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        handleEnter();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleEnter = () => {
    if (isDiving) return;
    setIsDiving(true);
    try {
      soundFx.playHeroicFanfare();
    } catch (e) {}
    setTimeout(() => {
      onComplete();
    }, 900);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.15, filter: 'blur(10px)' }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#050806] overflow-hidden select-none"
      >
        {/* ================= 1. THEATRICAL 2.39:1 CINEMATIC ANAMORPHIC FRAME ================= */}
        <div className="absolute top-0 left-0 right-0 h-[5vh] bg-black z-40 border-b border-[#dfb74a]/25 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-[5vh] bg-black z-40 border-t border-[#dfb74a]/25 pointer-events-none" />

        {/* Ancient Roman Corner Filigree Accents */}
        <div className="absolute top-[6vh] left-6 text-[#dfb74a]/40 font-serif text-xs tracking-widest pointer-events-none z-40">
          PROLOGUE • EPOCH I
        </div>
        <div className="absolute top-[6vh] right-6 text-[#dfb74a]/40 font-mono text-[10px] tracking-widest pointer-events-none z-40">
          CHRONICLE TITLE SEQUENCE
        </div>

        {/* ================= 2. GAME OF THRONES STYLE 3D ARMILLARY ASTROLABE RINGS ================= */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          {/* Outermost Celestial Meridian Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 75, repeat: Infinity, ease: 'linear' }}
            className="w-[850px] h-[850px] rounded-full border-[1.5px] border-[#dfb74a]/20 flex items-center justify-center"
            style={{ transform: 'perspective(1000px) rotateX(68deg) rotateY(12deg)' }}
          >
            <div className="w-[830px] h-[830px] rounded-full border border-dashed border-[#dfb74a]/30" />
            <div className="absolute top-0 w-3 h-3 rounded-full bg-[#dfb74a] shadow-[0_0_12px_#dfb74a]" />
            <div className="absolute bottom-0 w-3 h-3 rounded-full bg-[#dfb74a] shadow-[0_0_12px_#dfb74a]" />
          </motion.div>

          {/* Middle Mechanical Astrolabe Band (Counter-Rotating) */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 55, repeat: Infinity, ease: 'linear' }}
            className="absolute w-[680px] h-[680px] rounded-full border-2 border-[#c5a66a]/25 flex items-center justify-center"
            style={{ transform: 'perspective(1000px) rotateX(68deg) rotateY(-18deg)' }}
          >
            <div className="w-[660px] h-[660px] rounded-full border border-[#faecd0]/15" />
            <div className="absolute left-0 w-2.5 h-2.5 rounded-full bg-[#faecd0] shadow-[0_0_10px_#faecd0]" />
            <div className="absolute right-0 w-2.5 h-2.5 rounded-full bg-[#faecd0] shadow-[0_0_10px_#faecd0]" />
          </motion.div>

          {/* Inner Golden Equatorial Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
            className="absolute w-[500px] h-[500px] rounded-full border-[2.5px] border-[#dfb74a]/40 shadow-[0_0_30px_rgba(223,183,74,0.3)]"
            style={{ transform: 'perspective(1000px) rotateX(68deg)' }}
          />
        </div>

        {/* ================= 3. VOLUMETRIC SOLAR FORGE CORE (GOD RAYS & PLASMA) ================= */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Blazing God Rays */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: phase >= 1 ? 0.8 : 0.1,
              scale: phase >= 2 ? 1.25 : 0.8,
            }}
            transition={{ duration: 2.2, ease: 'easeOut' }}
            className="w-[1000px] h-[1000px] rounded-full animate-god-rays"
            style={{
              background:
                'conic-gradient(from 0deg at 50% 50%, rgba(223,183,74,0.45) 0deg, transparent 20deg, rgba(250,236,208,0.3) 45deg, transparent 65deg, rgba(223,183,74,0.4) 90deg, transparent 115deg, rgba(250,236,208,0.25) 140deg, transparent 165deg, rgba(223,183,74,0.45) 180deg, transparent 205deg, rgba(250,236,208,0.3) 230deg, transparent 250deg, rgba(223,183,74,0.4) 270deg, transparent 300deg, rgba(250,236,208,0.25) 325deg, transparent 345deg, rgba(223,183,74,0.45) 360deg)',
              filter: 'blur(35px)',
            }}
          />

          {/* Golden Solar Plasma Center */}
          <motion.div
            animate={{
              scale: phase >= 1 ? [1, 1.2, 1] : 0.7,
              opacity: phase >= 1 ? [0.6, 0.9, 0.6] : 0.2,
            }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute w-80 h-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(250,236,208,0.9)_0%,rgba(223,183,74,0.6)_40%,rgba(23,35,27,0)_75%)] blur-2xl"
          />

          {/* Shockwave Rings on Ignition */}
          {phase >= 1 && (
            <>
              <div className="absolute w-72 h-72 rounded-full border-2 border-[#dfb74a] animate-hero-shockwave" />
              <div
                className="absolute w-56 h-56 rounded-full border border-[#faecd0] animate-hero-shockwave"
                style={{ animationDelay: '0.4s' }}
              />
            </>
          )}
        </div>

        {/* ================= 4. RISING GOLDEN VOLCANIC EMBERS ================= */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(35)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-[#faecd0] shadow-[0_0_12px_#dfb74a]"
              style={{
                left: `${(i * 2.8) % 98}%`,
                bottom: '-20px',
                animation: `heroicEmberRise ${4.5 + (i % 4)}s cubic-bezier(0.25, 1, 0.5, 1) infinite`,
                animationDelay: `${i * 0.16}s`,
                opacity: phase >= 1 ? 0.95 : 0,
              }}
            />
          ))}
        </div>

        {/* ================= 5. THE HEROIC LOGO REVEAL (CIVORA EMBLEM & TITLE) ================= */}
        <motion.div
          animate={{
            scale: isDiving ? 2.5 : 1,
            opacity: isDiving ? 0 : 1,
          }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-30 flex flex-col items-center justify-center px-6 text-center max-w-4xl"
        >
          {/* Classical Architectural Emblem Forged in Gold */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: 35 }}
            animate={{
              opacity: phase >= 2 ? 1 : 0,
              scale: phase >= 2 ? 1 : 0.6,
              y: phase >= 2 ? 0 : 35,
            }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            {/* Blazing Crown Halo */}
            <div className="absolute inset-0 rounded-full bg-[#dfb74a]/35 blur-3xl scale-150 animate-hero-aura pointer-events-none" />

            {/* Emblem Vector */}
            <div className="p-3 rounded-full bg-[#070d09]/80 border border-[#dfb74a]/80 shadow-[0_0_50px_rgba(223,183,74,0.7)] backdrop-blur-md">
              <CivoraEmblem size={150} className="drop-shadow-[0_8px_30px_rgba(0,0,0,0.9)]" />
            </div>
          </motion.div>

          {/* Monumental Roman Lapidary Title: CIVORA with Compass Star inside 'O' */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{
              opacity: phase >= 2 ? 1 : 0,
              y: phase >= 2 ? 0 : 24,
            }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 space-y-2"
          >
            <div className="flex items-center justify-center">
              <h1
                className="text-5xl sm:text-7xl md:text-8xl font-serif font-black tracking-[0.32em] uppercase text-transparent bg-clip-text bg-gradient-to-b from-[#ffffff] via-[#dfb74a] to-[#7a5913] drop-shadow-[0_8px_36px_rgba(0,0,0,0.98)] leading-none select-none"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                CIVORA
              </h1>
            </div>

            {/* Classical Hairlines & Subtitle */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0.3 }}
              animate={{
                opacity: phase >= 3 ? 1 : 0,
                scaleX: phase >= 3 ? 1 : 0.3,
              }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
              className="flex items-center justify-center gap-4 pt-2"
            >
              <div className="w-16 sm:w-32 h-0.5 bg-gradient-to-r from-transparent via-[#dfb74a] to-transparent" />
              <p
                className="text-xs sm:text-sm md:text-base font-serif font-bold tracking-[0.42em] uppercase text-[#faecd0] drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                CIVILISATION SIMULATION ENGINE
              </p>
              <div className="w-16 sm:w-32 h-0.5 bg-gradient-to-r from-transparent via-[#dfb74a] to-transparent" />
            </motion.div>
          </motion.div>

          {/* Philosophical Motto */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{
              opacity: phase >= 3 ? 1 : 0,
              y: phase >= 3 ? 0 : 15,
            }}
            transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
            className="mt-6"
          >
            <p
              className="text-base sm:text-xl font-serif italic tracking-wide text-[#eae3d2] drop-shadow-[0_2px_14px_rgba(0,0,0,0.9)]"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              &ldquo;Build a Civilisation. Define an Eternity.&rdquo;
            </p>
          </motion.div>

          {/* ================= 6. THE HEROIC INVITATION ACTION ================= */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: phase >= 3 ? 1 : 0,
              y: phase >= 3 ? 0 : 20,
            }}
            transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex flex-col items-center gap-4"
          >
            <button
              onClick={handleEnter}
              className="btn-civora-primary hero-beacon px-10 py-4 rounded-xl font-serif font-black text-sm tracking-[0.24em] uppercase flex items-center gap-3 shadow-[0_16px_48px_rgba(0,0,0,0.95)] border-2 border-[#dfb74a] cursor-pointer hover:scale-105 transition-all"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              <Sparkles size={18} className="text-[#faecd0] animate-pulse" />
              <span>DESCEND INTO THE CHRONICLES</span>
              <ArrowRight size={18} className="text-[#faecd0]" />
            </button>

            <span className="text-[10px] font-mono tracking-widest uppercase text-[#dfb74a]/70">
              PRESS SPACE OR ENTER TO DESCEND • SKIP [ESC]
            </span>
          </motion.div>
        </motion.div>

        {/* Top Right Direct Skip Button */}
        <div className="absolute top-10 right-10 z-50">
          <button
            onClick={handleEnter}
            className="text-[11px] font-mono tracking-widest uppercase text-[#dfb74a] flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#dfb74a]/50 bg-[#080e0a]/90 hover:bg-[#121c15] backdrop-blur-md shadow-xl transition-all cursor-pointer"
          >
            <span>Skip Prologue</span>
            <span className="text-[9px] text-[#8e8574] px-1.5 py-0.5 rounded bg-black/60 border border-[#8e8574]/40 font-mono">
              ESC
            </span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

