import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  Hammer,
  Wheat,
  Factory,
  GraduationCap,
  Cpu,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { CivoraEmblem } from '../brand/CivoraLogo';
import { soundFx } from '../../services/soundFx';

export default function EraTimeline() {
  const [activeEraIdx, setActiveEraIdx] = useState(2); // Default to Industrial Age

  const eras = [
    {
      id: 'settlement',
      eraNumber: 'I',
      name: 'Settlement Age',
      subheading: 'Hearth, Timber & Virgin Soil',
      populationCap: '500 Citizens',
      focus: 'Campfires, basic wooden shelters, foraging, and establishing clean water rights.',
      keyBuildings: ['Timber Camp', 'Wellspring', 'Granary Depot', 'Gatherer Guild'],
      unlockedTech: 'Fire Taming, Primitive Forestry, Clay Potters',
      status: 'Passed & Chronicled',
      icon: Hammer,
      bgImage: '/brand/civora-banner.jpg',
    },
    {
      id: 'agricultural',
      eraNumber: 'II',
      name: 'Agricultural Age',
      subheading: 'Irrigation, Terraces & Classical Sanctuaries',
      populationCap: '5,000 Citizens',
      focus: 'Terraced crop fields, aqueducts, stone masonry, market squares, and municipal courts.',
      keyBuildings: ['Stone Amphitheatre', 'Roman Aqueduct', 'Grain Windmill', 'Civic Forum'],
      unlockedTech: 'Crop Rotation, Hydro-Mechanics, Civic Jurisprudence',
      status: 'Passed & Chronicled',
      icon: Wheat,
      bgImage: '/landscapes/ancient-civilization-hero.jpg',
    },
    {
      id: 'industrial',
      eraNumber: 'III',
      name: 'Industrial Age',
      subheading: 'Steam Foundries, Steel Rails & Dense Boroughs',
      populationCap: '35,000 Citizens',
      focus: 'High-output factories, coal generators, maritime docks, and dense tenement housing.',
      keyBuildings: ['Blast Furnace', 'Steam Locomotive Rail', 'Merchant Harbour', 'Civic Hospital'],
      unlockedTech: 'Bessemer Steel, Steam Turbines, Public Health Mandates',
      status: 'Current Epoch (Active)',
      icon: Factory,
      bgImage: '/brand/civora-banner.jpg',
    },
    {
      id: 'knowledge',
      eraNumber: 'IV',
      name: 'Knowledge Age',
      subheading: 'Observatories, Universities & Global Telegraphs',
      populationCap: '100,000 Citizens',
      focus: 'Higher academies, electrical networks, precision printing, and laboratory research hubs.',
      keyBuildings: ['Grand Observatory', 'Polytechnic Academy', 'Telegraph Spire', 'Research Bureau'],
      unlockedTech: 'Electromagnetism, Quantum Mechanics Foundations, Mass Literacy',
      status: 'Unlocking via Research',
      icon: GraduationCap,
      bgImage: '/landscapes/ancient-civilization-hero.jpg',
    },
    {
      id: 'digital',
      eraNumber: 'V',
      name: 'Digital Age',
      subheading: 'Silicon Grids, Automated Logistics & Cybernetics',
      populationCap: '350,000 Citizens',
      focus: 'Automated assembly lines, datacentres, clean energy fusion, and planetary telecommunications.',
      keyBuildings: ['Supercomputer Hub', 'Solar Photovoltaic Array', 'Autonomous Docks', 'Cybernetic Clinic'],
      unlockedTech: 'Neural Networks, Fusion Reactors, Precision Robotics',
      status: 'Locked — Requires 2,500 CRC',
      icon: Cpu,
      bgImage: '/brand/civora-banner.jpg',
    },
    {
      id: 'advanced',
      eraNumber: 'VI',
      name: 'Advanced Civilisation',
      subheading: 'Quantum Synthesis, Biospheres & Orbital Sovereignty',
      populationCap: '1,000,000+ Citizens',
      focus: 'Autonomous algorithmic governance, post-scarcity matter synthesis, and planetary telemetry.',
      keyBuildings: ['Quantum Singularity Core', 'Biosphere Ark', 'Orbital Skyhook', 'AI Nexus'],
      unlockedTech: 'Artificial General Intelligence, Dyson Shrouds, Telepathic Mesh',
      status: 'Locked — Requires 6,000 CRC',
      icon: Sparkles,
      bgImage: '/landscapes/ancient-civilization-hero.jpg',
    },
  ];

  const currentEra = eras[activeEraIdx];

  const handleSelectEra = (idx: number) => {
    soundFx.playTurnAdvance();
    setActiveEraIdx(idx);
  };

  return (
    <section
      id="eras"
      className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto select-none"
    >
      {/* Historical Era Header */}
      <div className="text-center space-y-3 mb-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#16221a] border border-[#c5a66a]/50 text-[#dfb74a] text-[10px] font-mono tracking-widest uppercase shadow-lg"
        >
          <CivoraEmblem size={18} />
          <span>CIVILISATION PROGRESSION ARCHITECTURE</span>
        </motion.div>

        <h2
          className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black tracking-[0.16em] uppercase text-transparent bg-clip-text bg-gradient-to-b from-[#faecd0] via-[#c5a66a] to-[#8c6e33]"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          FROM SETTLEMENT TO EMPIRE.
        </h2>

        <p
          className="text-base sm:text-lg font-serif italic text-[#d8cbaa] max-w-2xl mx-auto"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Eternity is not granted instantly. Civilisations advance through hard-won agricultural yields,
          infrastructure development, citizen education, and scientific breakthroughs.
        </p>

        <div className="w-24 h-0.5 mx-auto bg-gradient-to-r from-transparent via-[#dfb74a] to-transparent mt-4" />
      </div>

      {/* Horizontal Era Selector Ribbon with Live Progression Line */}
      <div className="relative mb-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {eras.map((era, idx) => {
            const isSelected = activeEraIdx === idx;
            const IconComp = era.icon;

            return (
              <button
                key={era.id}
                onClick={() => handleSelectEra(idx)}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all duration-300 relative overflow-hidden cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-b from-[#293d2e] via-[#1c2c21] to-[#121c16] border-[#dfb74a] shadow-[0_12px_32px_rgba(0,0,0,0.8),0_0_20px_rgba(223,183,74,0.3)] -translate-y-1'
                    : 'bg-[#101812]/90 border-[#2d3a2e] hover:border-[#dfb74a]/60 hover:bg-[#16221a]'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeEraBar"
                    className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#dfb74a] via-[#faecd0] to-[#dfb74a]"
                  />
                )}

                <div className="flex items-center justify-between w-full mb-2">
                  <span
                    className="text-xs font-serif font-black text-[#dfb74a]"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    AGE {era.eraNumber}
                  </span>
                  <IconComp
                    size={18}
                    className={isSelected ? 'text-[#faecd0] animate-pulse' : 'text-[#8c6e33]'}
                  />
                </div>

                <div>
                  <h4
                    className="text-xs sm:text-sm font-serif font-black text-[#ede8dc] leading-tight"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    {era.name}
                  </h4>
                  <p className="text-[9px] font-mono text-[#c5a66a] mt-1 truncate font-semibold">
                    {era.status}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detailed Era Stage Showcase with Cinematic Pan & Zoom */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentEra.id}
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -20 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-3xl overflow-hidden border-2 border-[#dfb74a]/60 bg-[#0e1611] shadow-[0_24px_64px_rgba(0,0,0,0.9)]"
        >
          {/* Panoramic Era Landscape Background */}
          <div className="relative h-64 sm:h-88 w-full overflow-hidden">
            <motion.img
              initial={{ scale: 1.08 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              src={currentEra.bgImage}
              alt={currentEra.name}
              className="w-full h-full object-cover filter brightness-95 contrast-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e1611] via-[#0e1611]/60 to-transparent" />

            <div className="absolute top-6 left-6 flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#080e0a]/90 border border-[#dfb74a] backdrop-blur-md shadow-lg">
              <Compass size={15} className="text-[#dfb74a] animate-spin" style={{ animationDuration: '10s' }} />
              <span
                className="text-xs font-serif font-black text-[#faecd0] uppercase tracking-wider"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                ERA {currentEra.eraNumber}: {currentEra.name}
              </span>
            </div>

            <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#dfb74a] font-bold block">
                  CIVIC POPULATION ENVELOPE
                </span>
                <h3
                  className="text-2xl sm:text-4xl font-serif font-black text-[#faecd0] drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {currentEra.subheading}
                </h3>
              </div>

              <div className="px-5 py-2.5 rounded-2xl bg-[#09110c]/90 border border-[#dfb74a] backdrop-blur-md shrink-0 shadow-xl">
                <span className="text-[9px] font-mono text-[#77786d] uppercase block">
                  ERA CAPACITY
                </span>
                <span className="text-sm font-mono font-bold text-[#faecd0]">
                  {currentEra.populationCap}
                </span>
              </div>
            </div>
          </div>

          {/* Era Mechanics & Tech Requirements */}
          <div className="p-6 sm:p-8 lg:p-10 grid grid-cols-1 md:grid-cols-3 gap-6 bg-gradient-to-b from-[#0e1611] to-[#070c08]">
            {/* Focus */}
            <div className="space-y-2 p-5 rounded-2xl bg-[#131f17]/80 border border-[#2d3b2e]">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#dfb74a] font-bold block">
                MUNICIPAL PRIORITIES
              </span>
              <p
                className="text-sm font-serif text-[#eae3d2] leading-relaxed"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {currentEra.focus}
              </p>
            </div>

            {/* Key Buildings */}
            <div className="space-y-2 p-5 rounded-2xl bg-[#131f17]/80 border border-[#2d3b2e]">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#dfb74a] font-bold block">
                REPRESENTATIVE ARCHITECTURE
              </span>
              <ul className="space-y-2 pt-1">
                {currentEra.keyBuildings.map((building) => (
                  <li
                    key={building}
                    className="flex items-center gap-2 text-xs font-serif text-[#d8cbaa]"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    <CheckCircle2 size={14} className="text-[#dfb74a] shrink-0" />
                    <span>{building}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Unlocked Technologies & Breakthroughs */}
            <div className="space-y-2 p-5 rounded-2xl bg-[#131f17]/80 border border-[#2d3b2e]">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#dfb74a] font-bold block">
                SCIENTIFIC FOUNDATIONS
              </span>
              <p className="text-xs font-mono text-[#faecd0] leading-relaxed pt-1">
                {currentEra.unlockedTech}
              </p>
              <div className="pt-3 border-t border-[#2d3b2e] flex items-center justify-between text-[10px] font-mono text-[#a18131]">
                <span>Status:</span>
                <span className="font-bold text-[#dfb74a]">{currentEra.status}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
