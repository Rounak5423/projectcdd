import React from 'react';
import { motion } from 'framer-motion';

interface IntroSceneProps {
  currentScene: number; // 1 to 5
}

export default function IntroScene({ currentScene }: IntroSceneProps) {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none civora-intro-viewport">
      {/* ================= SCENE 1: THE AGE BEFORE CIVILISATION (0–2s) ================= */}
      {/* Deep primordial darkness with faint central golden light & temple dust */}
      <motion.div
        animate={{
          opacity: currentScene === 1 ? 1 : 0.4,
          scale: currentScene >= 2 ? 1.15 : 1,
        }}
        transition={{ duration: 2, ease: 'easeOut' }}
        className="absolute inset-0 bg-[#050806]"
      >
        {/* Faint emerging golden glow in darkness */}
        <motion.div
          animate={{
            opacity: currentScene === 1 ? [0.08, 0.25, 0.15] : 0.4,
            scale: currentScene === 1 ? [0.8, 1.1, 1] : 1.3,
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(223,183,74,0.18)_0%,rgba(15,24,18,0.7)_50%,#050806_100%)]"
        />

        {/* Ancient temple dust motes */}
        <div className="absolute inset-0">
          {[...Array(24)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-[#faecd0] animate-cavern-dust"
              style={{
                left: `${(i * 4.3) % 94}%`,
                top: `${(i * 6.7) % 88}%`,
                animationDelay: `${i * 0.25}s`,
                animationDuration: `${6 + (i % 4)}s`,
                opacity: currentScene === 1 ? 0.6 : 0.2,
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* ================= SCENE 2: THE ANCIENT GATES (2–4s) ================= */}
      {/* Two enormous monumental Roman stone doors slowly parting in 3D */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        {/* Left Monumental Stone Door */}
        <motion.div
          initial={{ rotateY: 0, x: 0 }}
          animate={{
            rotateY: currentScene >= 2 ? -75 : 0,
            x: currentScene >= 2 ? '-45%' : '0%',
            opacity: currentScene >= 3 ? 0 : 1,
          }}
          transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
          className="monumental-gate-left absolute top-0 bottom-0 left-0 w-1/2 h-full roman-door-texture flex flex-col justify-around p-8 sm:p-12 border-r-4 border-[#8c6e33] z-20"
        >
          {/* Classical Roman Coffered Relief Panels */}
          <div className="w-full h-1/3 rounded-xl border-2 border-[#8c6e33]/50 bg-black/40 flex items-center justify-center shadow-inner">
            <div className="w-4/5 h-4/5 rounded-lg border border-[#dfb74a]/30 flex items-center justify-center">
              <span className="text-[#dfb74a]/25 font-serif font-black text-4xl sm:text-6xl select-none">
                C • I
              </span>
            </div>
          </div>
          <div className="w-full h-1/3 rounded-xl border-2 border-[#8c6e33]/50 bg-black/40 flex items-center justify-center shadow-inner mt-4">
            <div className="w-4/5 h-4/5 rounded-lg border border-[#dfb74a]/30 flex items-center justify-center">
              <span className="text-[#dfb74a]/25 font-serif font-black text-4xl sm:text-6xl select-none">
                V • O
              </span>
            </div>
          </div>
        </motion.div>

        {/* Right Monumental Stone Door */}
        <motion.div
          initial={{ rotateY: 0, x: 0 }}
          animate={{
            rotateY: currentScene >= 2 ? 75 : 0,
            x: currentScene >= 2 ? '45%' : '0%',
            opacity: currentScene >= 3 ? 0 : 1,
          }}
          transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
          className="monumental-gate-right absolute top-0 bottom-0 right-0 w-1/2 h-full roman-door-texture flex flex-col justify-around p-8 sm:p-12 border-l-4 border-[#8c6e33] z-20"
        >
          {/* Classical Roman Coffered Relief Panels */}
          <div className="w-full h-1/3 rounded-xl border-2 border-[#8c6e33]/50 bg-black/40 flex items-center justify-center shadow-inner">
            <div className="w-4/5 h-4/5 rounded-lg border border-[#dfb74a]/30 flex items-center justify-center">
              <span className="text-[#dfb74a]/25 font-serif font-black text-4xl sm:text-6xl select-none">
                R • A
              </span>
            </div>
          </div>
          <div className="w-full h-1/3 rounded-xl border-2 border-[#8c6e33]/50 bg-black/40 flex items-center justify-center shadow-inner mt-4">
            <div className="w-4/5 h-4/5 rounded-lg border border-[#dfb74a]/30 flex items-center justify-center">
              <span className="text-[#dfb74a]/25 font-serif font-black text-4xl sm:text-6xl select-none">
                I • V
              </span>
            </div>
          </div>
        </motion.div>

        {/* Golden Light Bursting Through the Parting Gates */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: currentScene === 2 ? 0.9 : currentScene >= 3 ? 0.4 : 0,
            scale: currentScene >= 2 ? 1.2 : 0.8,
          }}
          transition={{ duration: 1.8, ease: 'easeOut' }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(250,236,208,0.7)_0%,rgba(223,183,74,0.4)_35%,transparent_75%)] z-10"
        />
      </div>

      {/* ================= SCENE 5: TRANSITION INTO THE WORLD (9–12s) ================= */}
      {/* Monumental Ancient Civilisation Landscape Unveiled */}
      <motion.div
        initial={{ opacity: 0, scale: 1.15 }}
        animate={{
          opacity: currentScene === 5 ? 1 : 0,
          scale: currentScene === 5 ? 1 : 1.15,
        }}
        transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 bg-cover bg-center filter brightness-95 contrast-110 z-0"
        style={{
          backgroundImage: "url('/landscapes/ancient-civilization-hero.jpg'), url('/brand/civora-banner.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#060b07] via-transparent to-[#060b07]/50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(223,183,74,0.25)_0%,transparent_65%)]" />
      </motion.div>
    </div>
  );
}

