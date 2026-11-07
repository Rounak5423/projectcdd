import React from 'react';
import { motion } from 'framer-motion';
import { CivoraEmblem } from '../brand/CivoraLogo';

interface LogoRevealProps {
  currentScene: number; // 1 to 5
}

export default function LogoReveal({ currentScene }: LogoRevealProps) {
  // Only visible in Scene 3 (Emblem Forging), Scene 4 (Name of Civilisation), and early Scene 5 (Camera Glide)
  if (currentScene < 3) return null;

  const isScene3 = currentScene === 3;
  const isScene4 = currentScene === 4;
  const isScene5 = currentScene >= 5;

  return (
    <div className="relative z-30 flex flex-col items-center justify-center text-center px-4 max-w-4xl select-none">
      {/* ================= 1. EMBLEM FORGING & REVELATION ================= */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7, y: 30 }}
        animate={{
          opacity: isScene5 ? 0.4 : 1,
          scale: isScene5 ? 1.4 : isScene4 ? 1.05 : 1,
          y: isScene5 ? -40 : 0,
        }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative"
      >
        {/* Volumetric Rotating Sunbeam Corona behind Emblem */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none -m-16">
          <div
            className="w-[600px] h-[600px] rounded-full animate-intro-god-rays opacity-45"
            style={{
              background:
                'conic-gradient(from 0deg at 50% 50%, rgba(223,183,74,0.35) 0deg, transparent 25deg, rgba(250,236,208,0.2) 50deg, transparent 75deg, rgba(223,183,74,0.3) 100deg, transparent 130deg, rgba(250,236,208,0.2) 160deg, transparent 190deg, rgba(223,183,74,0.35) 230deg, transparent 270deg, rgba(223,183,74,0.35) 360deg)',
              filter: 'blur(30px)',
            }}
          />
        </div>

        {/* Ambient Gold Aura Halo */}
        <div className="absolute inset-0 rounded-full bg-[#dfb74a]/30 blur-3xl scale-150 animate-emblem-shine pointer-events-none" />

        {/* The Exact CIVORA Architectural Emblem */}
        <div className="relative z-10 p-2.5 rounded-full bg-[#080e0a]/85 border-2 border-[#dfb74a]/80 shadow-[0_0_55px_rgba(223,183,74,0.7)] backdrop-blur-md">
          <CivoraEmblem
            size={160}
            className="drop-shadow-[0_10px_35px_rgba(0,0,0,0.95)]"
          />
        </div>
      </motion.div>

      {/* ================= 2. SCENE 4: THE NAME OF A CIVILISATION (7–9s) ================= */}
      {/* "CIVORA", "CIVILISATION SIMULATION ENGINE", and "BUILD A CIVILISATION. DEFINE AN ETERNITY." */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{
          opacity: isScene4 || isScene5 ? (isScene5 ? 0.3 : 1) : 0,
          y: isScene4 || isScene5 ? 0 : 24,
          scale: isScene5 ? 1.2 : 1,
        }}
        transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="mt-8 space-y-3"
      >
        {/* Exact Brand Name: CIVORA with custom star in the 'O' */}
        <div className="flex items-center justify-center">
          <h1
            className="text-5xl sm:text-7xl md:text-8xl font-serif font-black tracking-[0.34em] uppercase text-transparent bg-clip-text bg-gradient-to-b from-[#ffffff] via-[#dfb74a] to-[#8c6e33] drop-shadow-[0_8px_32px_rgba(0,0,0,0.98)] leading-none select-none animate-light-travel"
            style={{ fontFamily: "'Cinzel', 'Trajan Pro', Georgia, serif" }}
          >
            CIVORA
          </h1>
        </div>

        {/* Classical Hairlines & Subtitle: CIVILISATION SIMULATION ENGINE */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0.3 }}
          animate={{
            opacity: isScene4 || isScene5 ? 1 : 0,
            scaleX: isScene4 || isScene5 ? 1 : 0.3,
          }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
          className="flex items-center justify-center gap-4 pt-1"
        >
          <div className="w-16 sm:w-36 h-0.5 bg-gradient-to-r from-transparent via-[#dfb74a] to-transparent" />
          <p
            className="text-xs sm:text-sm md:text-base font-serif font-bold tracking-[0.42em] uppercase text-[#faecd0] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] whitespace-nowrap"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            CIVILISATION SIMULATION ENGINE
          </p>
          <div className="w-16 sm:w-36 h-0.5 bg-gradient-to-r from-transparent via-[#dfb74a] to-transparent" />
        </motion.div>

        {/* Brand Statement: BUILD A CIVILISATION. DEFINE AN ETERNITY. */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: isScene4 ? 1 : isScene5 ? 0.3 : 0,
            y: isScene4 ? 0 : 10,
          }}
          transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
          className="pt-3"
        >
          <p
            className="text-sm sm:text-lg md:text-xl font-serif italic tracking-wide text-[#eae3d2] drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            &ldquo;Build a Civilisation. Define an Eternity.&rdquo;
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

