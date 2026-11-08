import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, Scale, Landmark, Sparkles } from 'lucide-react';
import { CivoraEmblem } from '../brand/CivoraLogo';

export default function CivilisationPillars() {
  const [activePillar, setActivePillar] = useState<number | null>(null);

  const pillars = [
    {
      numeral: 'I',
      title: 'PEOPLE',
      subtitle: 'Demographics, Generational Memory & Factions',
      icon: Users,
      summary:
        'A living tapestry of thousands of autonomous citizens. From agrarian laborers and guild artisans to philosophers and quantum engineers, their happiness, health, and aspirations govern the heartbeat of your empire.',
      engravingDetail:
        'Citizen sentiments trigger dynamic petitions, cultural festivals, or historical strikes when neglected.',
      latinInscription: 'CIVITAS EX HOMINIBUS CONSTAT',
      textureAccent: 'from-[#19271e] via-[#121c15] to-[#0c140e]',
      highlightColor: '#dfb74a',
    },
    {
      numeral: 'II',
      title: 'KNOWLEDGE',
      subtitle: 'Epistemology, Tech Trees & Empirical Science',
      icon: BookOpen,
      summary:
        'Knowledge must be forged through empirical discovery and societal investment. Unlock deep tech branches across Metallurgy, Hydraulic Engineering, Civic Jurisprudence, and Autonomous AI Governance.',
      engravingDetail:
        'Technologies are not simply unlocked with timers; they demand real production facilities and research credits.',
      latinInscription: 'SCIENTIA IPSA POTESTAS EST',
      textureAccent: 'from-[#1b2a20] via-[#141f17] to-[#0d1610]',
      highlightColor: '#faecd0',
    },
    {
      numeral: 'III',
      title: 'GOVERNANCE',
      subtitle: 'Fiscal Policy, Ethical Mandates & Statecraft',
      icon: Scale,
      summary:
        'Every decree echoes through generations. Enact land reforms, universal education charters, automation tariffs, or emergency rations. Balance immediate public harmony against long-term civilisational survival.',
      engravingDetail:
        'Real ethical consequences: high taxation sparks unrest; unchecked deregulation risks environmental collapse.',
      latinInscription: 'SALUS POPULI SUPREMA LEX ESTO',
      textureAccent: 'from-[#1a281f] via-[#131d16] to-[#0c140f]',
      highlightColor: '#c5a66a',
    },
    {
      numeral: 'IV',
      title: 'LEGACY',
      subtitle: 'Historical Chronicles, Monuments & Eternity',
      icon: Landmark,
      summary:
        'Civilisations do not evaporate when a simulation ends. They leave monumental architectural wonders, philosophical treatises, and permanent historical records inscribed into the global Civora archives.',
      engravingDetail:
        'Achieve timeless UNESCO-grade status or be remembered as an empire consumed by hubris.',
      latinInscription: 'MONUMENTUM AERE PERENNIUS',
      textureAccent: 'from-[#1d2d22] via-[#152119] to-[#0d1611]',
      highlightColor: '#dfb74a',
    },
  ];

  return (
    <section
      id="pillars"
      className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto select-none overflow-hidden"
    >
      {/* Editorial Header */}
      <div className="relative z-10 max-w-3xl mb-16 text-left">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-2 mb-3 text-[#dfb74a]"
        >
          <CivoraEmblem size={20} />
          <span className="text-[10px] font-mono tracking-widest uppercase font-bold">
            EDITORIAL TREATISE ON STATECRAFT
          </span>
        </motion.div>

        <h2
          className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black tracking-[0.14em] uppercase text-transparent bg-clip-text bg-gradient-to-b from-[#faecd0] via-[#c5a66a] to-[#8c6e33] leading-tight"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          EMPIRES ARE NOT BUILT BY STONE ALONE.
        </h2>

        <p
          className="text-base sm:text-lg font-serif italic text-[#d8cbaa] mt-4 leading-relaxed"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          A settlement is more than bricks and mortar. It is the confluence of living souls,
          accumulated wisdom, the justice of laws, and the enduring resonance of its legacy.
        </p>

        <div className="w-32 h-0.5 bg-gradient-to-r from-[#dfb74a] to-transparent mt-4" />
      </div>

      {/* Asymmetric Editorial Manuscript Layout */}
      <div className="space-y-12">
        {pillars.map((pillar, idx) => {
          const isEven = idx % 2 === 0;
          const IconComponent = pillar.icon;
          const isHovered = activePillar === idx;

          return (
            <motion.div
              key={pillar.title}
              onMouseEnter={() => setActivePillar(idx)}
              onMouseLeave={() => setActivePillar(null)}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className={`relative rounded-3xl p-8 sm:p-10 lg:p-12 border transition-all duration-300 shadow-2xl bg-gradient-to-br ${pillar.textureAccent} overflow-hidden ${
                isHovered
                  ? 'border-[#dfb74a] shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_25px_rgba(223,183,74,0.2)] -translate-y-1'
                  : 'border-[#c5a66a]/30 shadow-xl'
              }`}
            >
              {/* Sacred Geometry Astrolabe Ring Watermark */}
              <div
                className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full border border-[#dfb74a]/10 pointer-events-none animate-astrolabe"
                style={{ animationDuration: '70s' }}
              />
              <div
                className="absolute -right-10 -bottom-10 w-60 h-60 rounded-full border border-dashed border-[#dfb74a]/15 pointer-events-none animate-astrolabe-reverse"
                style={{ animationDuration: '50s' }}
              />

              {/* Background Architectural Roman Numeral */}
              <div className="absolute right-6 bottom-4 text-[#faecd0]/[0.035] select-none pointer-events-none font-serif font-black text-9xl sm:text-[190px] leading-none">
                {pillar.numeral}
              </div>

              <div
                className={`flex flex-col ${
                  isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'
                } items-start justify-between gap-8 relative z-10`}
              >
                {/* Left/Right Narrative Column */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xl sm:text-2xl font-serif font-black text-[#dfb74a]"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      {pillar.numeral}.
                    </span>
                    <span
                      className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black tracking-widest uppercase text-[#faecd0]"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      {pillar.title}
                    </span>
                  </div>

                  <p className="text-xs font-mono tracking-widest uppercase text-[#dfb74a] font-semibold">
                    {pillar.subtitle}
                  </p>

                  <p
                    className="text-base sm:text-lg font-serif text-[#eae3d2] leading-relaxed pt-2"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {pillar.summary}
                  </p>

                  <div className="pt-2">
                    <span
                      className="text-xs sm:text-sm font-serif italic tracking-wider block text-transparent bg-clip-text bg-gradient-to-r from-[#faecd0] via-[#dfb74a] to-[#c5a66a]"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      &mdash; {pillar.latinInscription} &mdash;
                    </span>
                  </div>
                </div>

                {/* Classical Engraving Annotation Box */}
                <div className="w-full lg:w-80 shrink-0 p-6 rounded-2xl bg-[#09100b]/90 border border-[#8c6e33]/60 shadow-inner space-y-3.5 backdrop-blur-md">
                  <div className="flex items-center gap-2.5 text-[#dfb74a]">
                    <IconComponent size={22} className="animate-pulse" />
                    <span
                      className="text-xs font-serif font-bold uppercase tracking-wider"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      SIMULATION REALITY
                    </span>
                  </div>

                  <p
                    className="text-xs font-serif text-[#cfc7b4] leading-relaxed"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {pillar.engravingDetail}
                  </p>

                  <div className="flex items-center gap-2 text-[10px] font-mono text-[#dfb74a] pt-2 border-t border-[#233125]">
                    <Sparkles size={13} className="text-[#dfb74a]" />
                    <span>DETERMINISTIC AGENT DYNAMICS</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
