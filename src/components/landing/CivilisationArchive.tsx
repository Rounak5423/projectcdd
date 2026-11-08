import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Globe2,
  Users,
  Smile,
  Microscope,
  Calendar,
  Sparkles,
  Play,
  PlusCircle,
  Shield,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { CivoraEmblem } from '../brand/CivoraLogo';
import { soundFx } from '../../services/soundFx';

export interface SavedCivilisationRecord {
  id: string;
  name: string;
  era: string;
  level: number;
  population: number;
  happiness: number;
  researchProgress: number; // percentage
  status: string;
  lastPlayed: string;
  landscapeImage: string;
  description: string;
  districtsCount: number;
  biomes: string;
}

interface CivilisationArchiveProps {
  onSelectWorld: (worldId: string) => void;
  onCreateNewWorld: () => void;
}

function TiltCard({
  world,
  isHovered,
  onHover,
  onLeave,
  onSelect,
}: {
  world: SavedCivilisationRecord;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onSelect: () => void;
}) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setRotateX(((y - centerY) / centerY) * -8);
    setRotateY(((x - centerX) / centerX) * 8);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    onLeave();
  };

  return (
    <motion.div
      onMouseEnter={onHover}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transition: 'transform 0.15s ease-out',
      }}
      className={`relative rounded-3xl overflow-hidden flex flex-col justify-between transition-colors duration-300 ${
        isHovered
          ? 'border-2 border-[#dfb74a] shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(223,183,74,0.25)]'
          : 'border border-[#c5a66a]/35 shadow-2xl bg-[#0f1712]'
      }`}
    >
      {/* Specular Light Sweep on Hover */}
      {isHovered && (
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#faecd0]/[0.08] to-transparent pointer-events-none z-20" />
      )}

      {/* Atlas Landscape Banner */}
      <div className="relative h-52 sm:h-56 overflow-hidden bg-[#0c140f]">
        <img
          src={world.landscapeImage}
          alt={world.name}
          className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
            isHovered ? 'scale-110 brightness-100' : 'scale-100 brightness-80'
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1712] via-[#0f1712]/45 to-transparent" />

        {/* Level / Sovereignty Medallion */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-2 px-3 py-1 rounded-full bg-[#080e0a]/90 border border-[#dfb74a] backdrop-blur-md shadow-lg">
          <Shield size={13} className="text-[#dfb74a]" />
          <span className="text-[10px] font-serif font-black text-[#faecd0] uppercase tracking-wider">
            Level {world.level}
          </span>
        </div>

        {/* Era Tag */}
        <div className="absolute top-3.5 right-3.5 px-3 py-1 rounded-full bg-[#080e0a]/90 border border-[#2d3b2e] text-[9px] font-mono font-bold text-[#dfb74a] uppercase tracking-wider">
          {world.era}
        </div>

        {/* Civilisation Name Inscription */}
        <div className="absolute bottom-3 left-4 right-4">
          <h3
            className="text-2xl sm:text-3xl font-serif font-black text-[#faecd0] drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] tracking-wide"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {world.name}
          </h3>
          <p className="text-[10px] font-mono text-[#dfb74a] tracking-wider uppercase mt-0.5">
            {world.biomes} • {world.status}
          </p>
        </div>
      </div>

      {/* Manuscript Narrative & Metrics */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4 bg-gradient-to-b from-[#0f1712] to-[#0a100c]">
        <p
          className="text-xs sm:text-sm text-[#d8cbaa] leading-relaxed line-clamp-2 italic"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          &ldquo;{world.description}&rdquo;
        </p>

        {/* Tactical Vitals Grid */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#253327]">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-[#c5a66a]" />
            <div>
              <span className="text-[8px] font-mono text-[#77786d] uppercase block">
                POPULATION
              </span>
              <span className="text-xs font-mono font-bold text-[#ede8dc]">
                {world.population.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Smile size={15} className="text-[#c5a66a]" />
            <div>
              <span className="text-[8px] font-mono text-[#77786d] uppercase block">
                HARMONY
              </span>
              <span className="text-xs font-mono font-bold text-[#faecd0]">
                {world.happiness}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Microscope size={15} className="text-[#c5a66a]" />
            <div>
              <span className="text-[8px] font-mono text-[#77786d] uppercase block">
                RESEARCH
              </span>
              <span className="text-xs font-mono font-bold text-[#faecd0]">
                {world.researchProgress}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-[#c5a66a]" />
            <div>
              <span className="text-[8px] font-mono text-[#77786d] uppercase block">
                LAST RECORD
              </span>
              <span className="text-[10px] font-mono text-[#cfc7b4]">
                {world.lastPlayed}
              </span>
            </div>
          </div>
        </div>

        {/* Continue World Action with Fanfare sound */}
        <button
          onClick={() => {
            soundFx.playHeroicFanfare();
            onSelect();
          }}
          className="w-full btn-civora-primary py-3 rounded-xl font-serif font-black text-xs tracking-[0.16em] uppercase flex items-center justify-center gap-2 mt-2 cursor-pointer border border-[#dfb74a]"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          <Play size={12} className="fill-current text-[#faecd0]" />
          <span>RESUME CIVILISATION</span>
        </button>
      </div>
    </motion.div>
  );
}

export default function CivilisationArchive({
  onSelectWorld,
  onCreateNewWorld,
}: CivilisationArchiveProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const archiveWorlds: SavedCivilisationRecord[] = [
    {
      id: 'kyoto-prime',
      name: 'Kyoto Prime',
      era: 'Advanced Civilisation & Quantum State',
      level: 5,
      population: 48600,
      happiness: 94,
      researchProgress: 92,
      status: 'Flourishing Metropolis • Sovereign',
      lastPlayed: 'Today, 23:40',
      landscapeImage: '/brand/civora-banner.jpg',
      description:
        'A monumental mountain empire integrating classical aqueducts, autonomous logistics hubs, and quantum AI telemetry shrines.',
      districtsCount: 18,
      biomes: 'Highland River Basin',
    },
    {
      id: 'aurora-prime',
      name: 'Aurora Prime',
      era: 'Industrial & Steam Age',
      level: 4,
      population: 26400,
      happiness: 88,
      researchProgress: 76,
      status: 'Industrial Expansion • Active',
      lastPlayed: 'Yesterday, 19:15',
      landscapeImage: '/landscapes/ancient-civilization-hero.jpg',
      description:
        'Vast iron foundries, sprawling canal networks, and dense brickwork residential quarters driving regional economic supremacy.',
      districtsCount: 12,
      biomes: 'Coastal Estuary & Pine Terraces',
    },
    {
      id: 'verdant-valley',
      name: 'Verdant Valley',
      era: 'Agricultural & Classical Age',
      level: 2,
      population: 6200,
      happiness: 93,
      researchProgress: 42,
      status: 'Agrarian Tranquility • Stable',
      lastPlayed: '3 days ago',
      landscapeImage: '/brand/civora-banner.jpg',
      description:
        'Terraced olive groves, sunlit grain fields, and river mills anchored by a classical amphitheatre and civic sanctuary.',
      districtsCount: 7,
      biomes: 'Fertile Riverine Plains',
    },
  ];

  return (
    <section
      id="archive"
      className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto select-none"
    >
      {/* Historical Manuscript Header */}
      <div className="text-center space-y-3 mb-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#16221a] border border-[#c5a66a]/50 text-[#dfb74a] text-[10px] font-mono tracking-widest uppercase shadow-lg"
        >
          <CivoraEmblem size={18} />
          <span>IMPERIAL CHRONICLES & ATLAS</span>
        </motion.div>

        <h2
          className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black tracking-[0.16em] uppercase text-transparent bg-clip-text bg-gradient-to-b from-[#faecd0] via-[#c5a66a] to-[#8c6e33]"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          EVERY WORLD HAS A HISTORY.
        </h2>

        <p
          className="text-base sm:text-lg font-serif italic text-[#d8cbaa] max-w-2xl mx-auto"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Return to the civilisations you have shaped, or begin carving an uncharted epoch into the stone of history.
        </p>

        <div className="w-24 h-0.5 mx-auto bg-gradient-to-r from-transparent via-[#dfb74a] to-transparent mt-4" />
      </div>

      {/* World Atlas Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {archiveWorlds.map((world) => (
          <TiltCard
            key={world.id}
            world={world}
            isHovered={hoveredId === world.id}
            onHover={() => setHoveredId(world.id)}
            onLeave={() => setHoveredId(null)}
            onSelect={() => onSelectWorld(world.id)}
          />
        ))}

        {/* 4. FOUND NEW CIVILISATION CARD */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => {
            soundFx.playHammerBuild();
            onCreateNewWorld();
          }}
          className="relative rounded-3xl border-2 border-dashed border-[#c5a66a]/60 hover:border-[#dfb74a] bg-[#101b14]/70 hover:bg-[#16251b] p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group shadow-2xl hover:scale-102"
        >
          <div className="w-20 h-20 rounded-full bg-[#18261c] border-2 border-[#dfb74a] flex items-center justify-center text-[#dfb74a] group-hover:scale-115 group-hover:border-[#faecd0] transition-all shadow-[0_0_24px_rgba(223,183,74,0.3)] mb-4">
            <PlusCircle size={34} />
          </div>

          <h3
            className="text-xl sm:text-2xl font-serif font-black text-[#faecd0] tracking-wider uppercase"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            FOUND NEW CIVILISATION
          </h3>

          <p
            className="text-xs sm:text-sm font-serif italic text-[#cfc7b4] mt-2 max-w-xs leading-relaxed"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Chart virgin topography, select climatic seeds, and author the foundational laws of a new generation.
          </p>

          <div className="mt-6 flex items-center gap-2 text-xs font-serif font-bold tracking-widest text-[#dfb74a] group-hover:text-[#faecd0] transition-colors">
            <span>ENTER WORLD CREATION STUDIO</span>
            <ArrowRight size={15} className="group-hover:translate-x-1.5 transition-transform" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
