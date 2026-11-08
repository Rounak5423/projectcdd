import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Shield, Compass } from 'lucide-react';
import { CivoraEmblem } from '../brand/CivoraLogo';
import { soundFx } from '../../services/soundFx';

interface FinalCTAProps {
  onFoundCivilisation: () => void;
}

export default function FinalCTA({ onFoundCivilisation }: FinalCTAProps) {
  const [isGatesOpen, setIsGatesOpen] = useState(false);

  const handleMouseEnter = () => {
    if (!isGatesOpen) {
      soundFx.playStoneGateRumble();
      setIsGatesOpen(true);
    }
  };

  const handleAction = () => {
    soundFx.playHeroicFanfare();
    onFoundCivilisation();
  };

  return (
    <section className="relative py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto select-none overflow-hidden">
      {/* Monumental Stone Gateway Backdrop */}
      <div
        onMouseEnter={handleMouseEnter}
        className="relative rounded-3xl overflow-hidden border-2 border-[#dfb74a] shadow-[0_28px_80px_rgba(0,0,0,0.95)] bg-[#070c08] p-10 sm:p-16 lg:p-24 text-center flex flex-col items-center justify-center group"
      >
        {/* ================= 1. SUNLIT HORIZON BEHIND GATES ================= */}
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 bg-cover bg-center filter brightness-[0.8] contrast-[1.25] pointer-events-none"
          style={{
            backgroundImage: "url('/landscapes/ancient-civilization-hero.jpg'), url('/brand/civora-banner.jpg')",
          }}
        />

        {/* Radiant Divine Light Burst */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070c08] via-[#0d1610]/70 to-[#16221a]/50 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(223,183,74,0.35)_0%,transparent_70%)] pointer-events-none" />

        {/* Volumetric Sunbeams */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <div className="w-[1000px] h-[1000px] rounded-full animate-god-rays opacity-30"
            style={{
              background:
                'conic-gradient(from 0deg at 50% 50%, rgba(223,183,74,0.3) 0deg, transparent 30deg, rgba(250,236,208,0.2) 60deg, transparent 90deg, rgba(223,183,74,0.3) 180deg, transparent 270deg, rgba(223,183,74,0.3) 360deg)',
              filter: 'blur(35px)',
            }}
          />
        </div>

        {/* ================= 2. PARTING MONOLITHIC STONE GATES ================= */}
        <motion.div
          animate={{ x: isGatesOpen ? '-35%' : '0%', opacity: isGatesOpen ? 0.35 : 0.85 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-black via-[#0d1510] to-[#121c15] border-r-2 border-[#dfb74a]/60 pointer-events-none z-10 shadow-2xl"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,rgba(223,183,74,0.15)_0%,transparent_70%)]" />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#dfb74a]/30 font-serif font-black text-6xl select-none">
            CIV
          </div>
        </motion.div>

        <motion.div
          animate={{ x: isGatesOpen ? '35%' : '0%', opacity: isGatesOpen ? 0.35 : 0.85 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-0 bottom-0 right-0 w-1/2 bg-gradient-to-l from-black via-[#0d1510] to-[#121c15] border-l-2 border-[#dfb74a]/60 pointer-events-none z-10 shadow-2xl"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,rgba(223,183,74,0.15)_0%,transparent_70%)]" />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#dfb74a]/30 font-serif font-black text-6xl select-none">
            ORA
          </div>
        </motion.div>

        {/* ================= 3. MONUMENTAL CALL TO ACTION CONTENT ================= */}
        <div className="relative z-20 max-w-3xl space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[#dfb74a]/30 blur-2xl animate-hero-aura pointer-events-none" />
              <CivoraEmblem size={84} className="relative z-10 drop-shadow-[0_0_30px_rgba(223,183,74,0.7)]" />
            </div>
          </motion.div>

          <div className="space-y-3">
            <span
              className="text-xs font-mono font-bold tracking-[0.32em] uppercase text-[#dfb74a] block"
            >
              THE THRESHOLD OF ETERNITY
            </span>

            <h2
              className="text-3xl sm:text-5xl lg:text-6xl font-serif font-black tracking-[0.14em] uppercase text-transparent bg-clip-text bg-gradient-to-b from-[#faecd0] via-[#dfb74a] to-[#8c6e33] drop-shadow-[0_8px_32px_rgba(0,0,0,0.98)] leading-[1.15]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              THE NEXT CIVILISATION
              <br />
              <span className="animate-molten-gold">
                BEGINS WITH YOU.
              </span>
            </h2>
          </div>

          <div className="w-36 h-0.5 mx-auto bg-gradient-to-r from-transparent via-[#dfb74a] to-transparent" />

          <p
            className="text-base sm:text-xl font-serif italic text-[#eae3d2] max-w-xl mx-auto leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            &ldquo;Every great civilisation began with a single decision.
            What will yours become?&rdquo;
          </p>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleAction}
              className="btn-civora-primary hero-beacon w-full sm:w-auto px-12 py-4.5 rounded-xl font-serif font-black text-sm tracking-[0.24em] uppercase flex items-center justify-center gap-3 shadow-[0_16px_48px_rgba(0,0,0,0.95)] border-2 border-[#dfb74a] cursor-pointer"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              <Sparkles size={18} className="text-[#faecd0] animate-pulse" />
              <span>FOUND YOUR CIVILISATION</span>
              <ArrowRight size={18} className="text-[#faecd0]" />
            </button>
          </div>

          <div className="pt-2 text-[10px] font-mono tracking-widest uppercase text-[#dfb74a]/70">
            PERSISTENT WORLD SEED • DETERMINISTIC DEMOGRAPHICS • CLOUD ARCHIVE
          </div>
        </div>
      </div>
    </section>
  );
}
