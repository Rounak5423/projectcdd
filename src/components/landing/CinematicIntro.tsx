import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CivoraEmblem } from '../brand/CivoraLogo';
import { Sparkles, ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { soundFx } from '../../services/soundFx';

interface CinematicIntroProps {
  onComplete: () => void;
  isSkipped?: boolean;
}

export default function CinematicIntro({ onComplete }: CinematicIntroProps) {
  // Phase 0: Darkness (0-0.8s) - Deep bass rumble begins
  // Phase 1: Divine Awakening (0.8-2.2s) - God rays burst, shockwave expands, emblem materializes
  // Phase 2: World Panorama & Inscription (2.2-3.8s) - Ancient landscape reveals, letters engrave
  // Phase 3: Heroic Transition (3.8-4.8s) - Theatrical curtain rises into the main page
  const [phase, setPhase] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(true);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      onComplete();
      setIsVisible(false);
      return;
    }

    // Play initial subtle bass resonance
    try {
      soundFx.playHeroicOverture();
    } catch (e) {}

    const t1 = setTimeout(() => {
      setPhase(1);
    }, 800);

    const t2 = setTimeout(() => {
      setPhase(2);
      try {
        soundFx.playEureka();
      } catch (e) {}
    }, 2200);

    const t3 = setTimeout(() => {
      setPhase(3);
    }, 3800);

    const t4 = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 4900);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        skipIntro();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onComplete]);

  const skipIntro = () => {
    setIsVisible(false);
    onComplete();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#070c08] overflow-hidden select-none"
      >
        {/* ================= THEATRICAL ANAMORPHIC WIDESCREEN LETTERBOX SHUTTERS ================= */}
        <motion.div
          animate={{ y: phase >= 3 ? '-100%' : '0%' }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-0 left-0 right-0 h-[6vh] bg-black z-40 pointer-events-none border-b border-[#c5a66a]/20"
        />
        <motion.div
          animate={{ y: phase >= 3 ? '100%' : '0%' }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-0 left-0 right-0 h-[6vh] bg-black z-40 pointer-events-none border-t border-[#c5a66a]/20"
        />

        {/* ================= VOLUMETRIC GOD RAYS (HEROIC BEAMS) ================= */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{
              opacity: phase >= 1 ? 0.65 : 0,
              scale: phase >= 1 ? 1.2 : 0.6,
            }}
            transition={{ duration: 1.8, ease: 'easeOut' }}
            className="w-[900px] h-[900px] rounded-full animate-god-rays opacity-50"
            style={{
              background:
                'conic-gradient(from 0deg at 50% 50%, rgba(223,183,74,0.3) 0deg, transparent 20deg, rgba(250,236,208,0.25) 45deg, transparent 65deg, rgba(223,183,74,0.3) 90deg, transparent 110deg, rgba(250,236,208,0.2) 135deg, transparent 155deg, rgba(223,183,74,0.3) 180deg, transparent 200deg, rgba(250,236,208,0.25) 225deg, transparent 245deg, rgba(223,183,74,0.3) 270deg, transparent 290deg, rgba(250,236,208,0.2) 315deg, transparent 335deg, rgba(223,183,74,0.3) 360deg)',
              filter: 'blur(35px)',
            }}
          />
        </div>

        {/* ================= EXPANDING GOLDEN SHOCKWAVE ================= */}
        {phase >= 1 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 rounded-full border-2 border-[#dfb74a] animate-hero-shockwave" />
            <div className="w-48 h-48 rounded-full border border-[#faecd0] animate-hero-shockwave" style={{ animationDelay: '0.4s' }} />
          </div>
        )}

        {/* ================= CENTRAL DIVINE AURA ================= */}
        <motion.div
          animate={{
            opacity: phase >= 1 ? [0.4, 0.85, 0.4] : 0.1,
            scale: phase >= 2 ? [1, 1.15, 1] : 0.9,
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(223,183,74,0.28)_0%,rgba(23,35,27,0.85)_45%,#070c08_100%)] pointer-events-none"
        />

        {/* ================= REALISTIC ANCIENT LANDSCAPE HEROIC UNVEIL (PHASE 2) ================= */}
        <motion.div
          initial={{ opacity: 0, scale: 1.15 }}
          animate={{
            opacity: phase >= 2 ? 0.38 : 0,
            scale: phase >= 2 ? 1 : 1.15,
          }}
          transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 bg-cover bg-center filter brightness-[0.9] contrast-125 pointer-events-none"
          style={{
            backgroundImage: "url('/landscapes/ancient-civilization-hero.jpg'), url('/brand/civora-banner.jpg')",
          }}
        />

        {/* ================= HEROIC RISING FIRE EMBERS ================= */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(28)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-[#faecd0] shadow-[0_0_10px_#dfb74a]"
              style={{
                left: `${(i * 3.7) % 96}%`,
                bottom: '-20px',
                animation: `heroicEmberRise ${4 + (i % 4)}s cubic-bezier(0.25, 1, 0.5, 1) infinite`,
                animationDelay: `${(i * 0.18)}s`,
                opacity: phase >= 1 ? 0.9 : 0,
              }}
            />
          ))}
        </div>

        {/* ================= HEROIC MONUMENTAL EMBLEM & LOGO REVEAL ================= */}
        <div className="relative z-20 flex flex-col items-center justify-center px-6 text-center max-w-4xl">
          {/* Emblem Awaken with Golden Flare */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 25 }}
            animate={{
              opacity: phase >= 1 ? 1 : 0,
              scale: phase >= 1 ? (phase >= 3 ? 0.88 : 1) : 0.7,
              y: phase >= 1 ? 0 : 25,
            }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            {/* Pulsing Radial Beacon */}
            <div className="absolute inset-0 rounded-full bg-[#dfb74a]/25 blur-3xl scale-150 animate-hero-aura pointer-events-none" />

            {/* Radiant Cross Star Flare */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
              className="absolute -inset-8 opacity-40 pointer-events-none"
            >
              <div className="w-full h-full rounded-full border border-dashed border-[#dfb74a]/40" />
            </motion.div>

            <CivoraEmblem size={135} className="relative z-10 drop-shadow-[0_0_35px_rgba(223,183,74,0.6)]" />
          </motion.div>

          {/* Monumental Inscription: CIVORA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{
              opacity: phase >= 1 ? 1 : 0,
              scale: phase >= 1 ? 1 : 0.92,
              y: phase >= 1 ? 0 : 18,
            }}
            transition={{ duration: 1.2, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 space-y-2"
          >
            <h1
              className="text-4xl sm:text-6xl md:text-7xl font-serif font-black tracking-[0.32em] uppercase text-transparent bg-clip-text bg-gradient-to-b from-[#faecd0] via-[#dfb74a] to-[#8c6e33] drop-shadow-[0_8px_32px_rgba(0,0,0,0.95)]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              CIVORA
            </h1>

            {/* Imperial Hairlines & Subtitle */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0.4 }}
              animate={{
                opacity: phase >= 2 ? 1 : 0,
                scaleX: phase >= 2 ? 1 : 0.4,
              }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
              className="flex items-center justify-center gap-3 pt-1"
            >
              <div className="w-16 sm:w-28 h-0.5 bg-gradient-to-r from-transparent via-[#dfb74a] to-transparent" />
              <p
                className="text-[11px] sm:text-xs md:text-sm font-serif font-bold tracking-[0.38em] uppercase text-[#faecd0] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                CIVILISATION SIMULATION ENGINE
              </p>
              <div className="w-16 sm:w-28 h-0.5 bg-gradient-to-r from-transparent via-[#dfb74a] to-transparent" />
            </motion.div>
          </motion.div>

          {/* Heroic Philosophical Inscription (Phase 2 -> 3) */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{
              opacity: phase >= 2 ? 1 : 0,
              y: phase >= 2 ? 0 : 12,
            }}
            transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
            className="mt-6"
          >
            <p
              className="text-sm sm:text-lg font-serif italic tracking-wide text-[#faecd0] drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              &ldquo;Build a Civilisation. Define an Eternity.&rdquo;
            </p>
          </motion.div>

          {/* Live Progress Horizon Bar */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 4.8, ease: 'linear' }}
            className="w-48 sm:w-64 h-0.5 bg-gradient-to-r from-transparent via-[#dfb74a] to-transparent mt-8"
          />
        </div>

        {/* Skip & Audio Controls Header */}
        <div className="absolute top-8 right-8 z-50 flex items-center gap-3">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            whileHover={{ opacity: 1, scale: 1.05 }}
            onClick={skipIntro}
            className="text-[11px] font-mono tracking-widest uppercase text-[#dfb74a] flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#dfb74a]/50 bg-[#101a13]/90 hover:bg-[#18261c] backdrop-blur-md shadow-2xl transition-all cursor-pointer"
          >
            <span>Skip Overture</span>
            <span className="text-[9px] text-[#8e8574] px-1.5 py-0.5 rounded bg-black/60 border border-[#8e8574]/40 font-mono">
              ESC
            </span>
            <ArrowRight size={13} />
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
