import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { CivoraEmblem } from '../brand/CivoraLogo';
import {
  Sparkles,
  Play,
  Shield,
  Compass,
  ChevronDown,
  Award,
  Globe2,
  Volume2,
  VolumeX,
  Clapperboard,
} from 'lucide-react';
import { soundFx } from '../../services/soundFx';

interface HeroSectionProps {
  onBeginCivilisation: () => void;
  onContinueLegacy: () => void;
  onExploreMore: () => void;
  onWatchPrologue?: () => void;
}

export default function HeroSection({
  onBeginCivilisation,
  onContinueLegacy,
  onExploreMore,
  onWatchPrologue,
}: HeroSectionProps) {
  // Heroic Mouse Parallax tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 120 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Layer parallax transforms
  const bgTranslateX = useTransform(smoothX, [-0.5, 0.5], ['-12px', '12px']);
  const bgTranslateY = useTransform(smoothY, [-0.5, 0.5], ['-8px', '8px']);
  const textTranslateX = useTransform(smoothX, [-0.5, 0.5], ['5px', '-5px']);
  const textTranslateY = useTransform(smoothY, [-0.5, 0.5], ['3px', '-3px']);

  const [isAudioActive, setIsAudioActive] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientWidth, clientHeight } = e.currentTarget;
    const x = e.clientX / clientWidth - 0.5;
    const y = e.clientY / clientHeight - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const toggleChronicleAudio = () => {
    if (isAudioActive) {
      soundFx.toggleMute();
      setIsAudioActive(false);
    } else {
      soundFx.playHeroicOverture();
      setIsAudioActive(true);
    }
  };

  const handlePrimaryClick = () => {
    soundFx.playHeroicFanfare();
    onBeginCivilisation();
  };

  const handleSecondaryClick = () => {
    soundFx.playTurnAdvance();
    onContinueLegacy();
  };

  return (
    <section
      id="hero"
      onMouseMove={handleMouseMove}
      className="relative min-h-[90vh] lg:min-h-[92vh] w-full flex flex-col justify-center items-center py-20 lg:py-24 overflow-hidden select-none bg-[#070d08]"
    >
      {/* ================= 1. VOLUMETRIC GOD RAYS (HEROIC BEAMS) ================= */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0">
        <div
          className="w-[1100px] h-[1100px] rounded-full animate-god-rays opacity-40"
          style={{
            background:
              'conic-gradient(from 0deg at 50% 50%, rgba(223,183,74,0.35) 0deg, transparent 25deg, rgba(250,236,208,0.2) 45deg, transparent 75deg, rgba(223,183,74,0.3) 100deg, transparent 130deg, rgba(250,236,208,0.25) 165deg, transparent 195deg, rgba(223,183,74,0.35) 230deg, transparent 260deg, rgba(250,236,208,0.2) 290deg, transparent 320deg, rgba(223,183,74,0.35) 360deg)',
            filter: 'blur(45px)',
          }}
        />
      </div>

      {/* ================= 2. PARALLAX REALISTIC LANDSCAPE BACKGROUND ================= */}
      <motion.div
        style={{ x: bgTranslateX, y: bgTranslateY }}
        className="absolute -inset-8 z-0 overflow-hidden pointer-events-none"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 38, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 bg-cover bg-center filter brightness-[0.76] contrast-[1.18]"
          style={{
            backgroundImage: "url('/landscapes/ancient-civilization-hero.jpg'), url('/brand/civora-banner.jpg')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#070d08] via-[#0d1610]/70 to-[#121c15]/45" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(223,183,74,0.24)_0%,transparent_70%)]" />
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_bottom,rgba(250,236,208,0.18)_0%,transparent_70%)] animate-fog-slow" />
      </motion.div>

      {/* ================= 3. HEROIC RISING FIRE EMBERS ================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        {[...Array(26)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-[#faecd0] shadow-[0_0_12px_#dfb74a]"
            style={{
              left: `${(i * 3.7) % 98}%`,
              bottom: '-25px',
              animation: `heroicEmberRise ${5 + (i % 5)}s cubic-bezier(0.25, 1, 0.5, 1) infinite`,
              animationDelay: `${i * 0.22}s`,
              opacity: 0.85,
            }}
          />
        ))}
      </div>

      {/* ================= 4. PROLOGUE & AUDIO BAR ================= */}
      <div className="absolute top-20 sm:top-24 right-4 sm:right-8 z-30 flex items-center gap-2.5">
        {onWatchPrologue && (
          <button
            onClick={onWatchPrologue}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0a110c]/85 border border-[#c5a66a]/60 hover:border-[#dfb74a] text-[#dfb74a] text-[10px] font-mono tracking-widest uppercase backdrop-blur-md shadow-xl transition-all hover:scale-105 cursor-pointer"
            title="Replay the Game of Thrones Style Heroic Title Sequence"
          >
            <Clapperboard size={13} className="text-[#faecd0]" />
            <span className="hidden sm:inline">WATCH TITLE PROLOGUE</span>
            <span className="sm:hidden">PROLOGUE</span>
          </button>
        )}

        <button
          onClick={toggleChronicleAudio}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0a110c]/85 border border-[#c5a66a]/60 hover:border-[#dfb74a] text-[#dfb74a] text-[10px] font-mono tracking-widest uppercase backdrop-blur-md shadow-xl transition-all hover:scale-105 cursor-pointer"
          title="Toggle Imperial Chronicle Ambience Soundscape"
        >
          {isAudioActive ? (
            <>
              <Volume2 size={13} className="text-[#faecd0] animate-pulse" />
              <span className="hidden sm:inline">AUDIO: ACTIVE</span>
              <div className="flex items-center gap-0.5 ml-1">
                <span className="w-0.5 h-2 bg-[#dfb74a] animate-bounce" style={{ animationDelay: '0.1s' }} />
                <span className="w-0.5 h-3 bg-[#faecd0] animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </>
          ) : (
            <>
              <VolumeX size={13} className="text-[#8e8574]" />
              <span className="hidden sm:inline">CHRONICLE SOUND</span>
            </>
          )}
        </button>
      </div>

      {/* ================= 5. HERO CONTENT STAGE (BALANCED PROPORTIONS) ================= */}
      <motion.div
        style={{ x: textTranslateX, y: textTranslateY }}
        className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center text-center my-auto"
      >
        {/* Emblem Crest Badge with Golden Aura */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3 px-5 py-2 rounded-full bg-[#101a13]/90 border border-[#c5a66a] shadow-[0_4px_24px_rgba(0,0,0,0.8)] backdrop-blur-md mb-6 relative group"
        >
          <div className="absolute inset-0 rounded-full bg-[#dfb74a]/20 blur-md pointer-events-none" />
          <CivoraEmblem size={26} className="relative z-10" />
          <span
            className="text-[10px] sm:text-xs font-serif font-black tracking-[0.28em] uppercase text-[#faecd0] relative z-10"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            CIVORA CIVILISATION SIMULATION ENGINE
          </span>
          <span className="w-2 h-2 rounded-full bg-[#dfb74a] animate-ping" />
        </motion.div>

        {/* Monumental Headline with Molten Gold Animation */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-3 max-w-4xl"
        >
          <h1
            className="text-4xl sm:text-6xl md:text-7xl font-serif font-black tracking-[0.16em] uppercase text-transparent bg-clip-text bg-gradient-to-b from-[#faecd0] via-[#dfb74a] to-[#8c6e33] drop-shadow-[0_8px_32px_rgba(0,0,0,0.98)] leading-[1.12]"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            BUILD A CIVILISATION.
            <br />
            <span className="animate-molten-gold">
              DEFINE AN ETERNITY.
            </span>
          </h1>

          <div className="w-36 sm:w-56 h-0.5 mx-auto bg-gradient-to-r from-transparent via-[#dfb74a] to-transparent my-4" />
        </motion.div>

        {/* Cormorant Garamond Supporting Historical Prose */}
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.35, ease: 'easeOut' }}
          className="text-base sm:text-lg md:text-xl font-serif text-[#eae3d2] max-w-2xl leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] mt-2"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          From the first settlement to the rise of an empire, every decision shapes
          the world you leave behind. Build, govern, discover and explore the
          living consequences of human civilization.
        </motion.p>

        {/* ================= 6. HEROIC CALL TO ACTION CONTROLS ================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          {/* Primary CTA */}
          <button
            onClick={handlePrimaryClick}
            className="btn-civora-primary hero-beacon w-full sm:w-auto px-9 py-4 rounded-xl font-serif font-black text-sm tracking-[0.2em] uppercase flex items-center justify-center gap-3 shadow-[0_12px_36px_rgba(0,0,0,0.9)] border-2 border-[#dfb74a] cursor-pointer"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            <Sparkles size={17} className="text-[#faecd0] animate-spin" style={{ animationDuration: '6s' }} />
            <span>BEGIN YOUR CIVILISATION</span>
          </button>

          {/* Secondary CTA */}
          <button
            onClick={handleSecondaryClick}
            className="btn-civora-secondary w-full sm:w-auto px-8 py-4 rounded-xl font-serif font-bold text-sm tracking-[0.16em] uppercase flex items-center justify-center gap-2.5 border border-[#8c6e33]/80 cursor-pointer"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            <Play size={14} className="fill-current text-[#dfb74a]" />
            <span>CONTINUE YOUR LEGACY</span>
          </button>
        </motion.div>

        {/* ================= 7. INTEGRATED TACTICAL CONSOLE BENCHMARK ================= */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-12 w-full max-w-4xl"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#0b120d]/90 border border-[#c5a66a]/40 backdrop-blur-md shadow-2xl">
            <div className="flex items-center gap-3 px-3 py-1.5 border-r border-[#243326]/60">
              <Globe2 size={18} className="text-[#dfb74a] shrink-0 animate-pulse" />
              <div className="text-left">
                <span className="text-[9px] font-mono uppercase text-[#77786d] block">
                  ACTIVE REALM
                </span>
                <span className="text-xs font-serif font-bold text-[#faecd0]">
                  Kyoto Prime (128km²)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 px-3 py-1.5 border-r border-[#243326]/60">
              <Shield size={18} className="text-[#c5a66a] shrink-0" />
              <div className="text-left">
                <span className="text-[9px] font-mono uppercase text-[#77786d] block">
                  CIVILISATION EPOCH
                </span>
                <span className="text-xs font-serif font-bold text-[#faecd0]">
                  Advanced Sovereign VI
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 px-3 py-1.5 border-r border-[#243326]/60">
              <Compass size={18} className="text-[#dfb74a] shrink-0" />
              <div className="text-left">
                <span className="text-[9px] font-mono uppercase text-[#77786d] block">
                  HARMONY INDEX
                </span>
                <span className="text-xs font-serif font-bold text-[#faecd0]">
                  96.4% Cohesion
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 px-3 py-1.5">
              <Award size={18} className="text-[#dfb74a] shrink-0" />
              <div className="text-left">
                <span className="text-[9px] font-mono uppercase text-[#77786d] block">
                  RESEARCH TREASURY
                </span>
                <span className="text-xs font-serif font-bold text-[#faecd0]">
                  1,250 CRC Available
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Scroll cue */}
        <div
          onClick={onExploreMore}
          className="flex flex-col items-center justify-center pt-8 cursor-pointer text-[#dfb74a]/80 hover:text-[#faecd0] transition-colors"
        >
          <span className="text-[9px] font-mono uppercase tracking-widest">
            EXPLORE THE HISTORICAL CHRONICLES
          </span>
          <ChevronDown size={16} className="animate-bounce mt-1 text-[#dfb74a]" />
        </div>
      </motion.div>
    </section>
  );
}
