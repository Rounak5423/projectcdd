import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Filter,
  Key,
  Sparkles,
  CheckCircle2,
  Lock,
  Play,
  Zap,
  Wheat,
  Bot,
  FlaskConical,
  X,
  Compass,
  Layers,
  ChevronRight,
  ArrowRight,
  Crown,
} from 'lucide-react';
import { useGameState } from '../context/GameStateContext';
import { Technology, TechEra } from '../types/game';
import { soundFx } from '../services/soundFx';
import { civilizationApi } from '../services/civilizationApi';

interface CivTechItem {
  id: string;
  name: string;
  era: TechEra;
  turns: number;
  icon: string;
  isBoosted: boolean;
  boostText: string;
  description: string;
  unlockedEffects: string[];
  prerequisites: string[];
  unlocks: string[];
  category: string;
  costPoints: number;
}

const civTechData: CivTechItem[] = [
  // Foundational Era
  {
    id: 'tech-masonry',
    name: 'Masonry',
    era: 'Foundational',
    turns: 2,
    icon: '🧱',
    isBoosted: true,
    boostText: 'BOOSTED: Built a Quarry',
    description: 'Carved stone blocks and hydraulic mortar enabling durable city walls and aqueducts.',
    unlockedEffects: ['+25% City Defense', 'Unlocks Stone Walls & Paved Roads'],
    prerequisites: [],
    unlocks: ['tech-construction'],
    category: 'Engineering',
    costPoints: 200,
  },
  {
    id: 'tech-bronze',
    name: 'Bronze Working',
    era: 'Foundational',
    turns: 4,
    icon: '🛡️',
    isBoosted: false,
    boostText: 'To Boost: Slay 3 barbarian raiders',
    description: 'Smelting copper and tin into resilient bronze alloys for armaments and metal tools.',
    unlockedEffects: ['Unlocks Spearmen & Foundries', '+15% Mining Yield'],
    prerequisites: [],
    unlocks: ['tech-iron'],
    category: 'Military & Metallurgic',
    costPoints: 280,
  },
  {
    id: 'tech-wheel',
    name: 'The Wheel',
    era: 'Foundational',
    turns: 3,
    icon: '☸️',
    isBoosted: true,
    boostText: 'BOOSTED: Mined raw copper vein',
    description: 'Rotational axle mechanics revolutionizing logistics, chariots, and grain mills.',
    unlockedEffects: ['Unlocks Watermills & Carts', '+20% Trade Logistics'],
    prerequisites: [],
    unlocks: ['tech-horseback', 'tech-currency'],
    category: 'Logistics',
    costPoints: 240,
  },
  {
    id: 'tech-celestial',
    name: 'Celestial Navigation',
    era: 'Foundational',
    turns: 5,
    icon: '⛵',
    isBoosted: false,
    boostText: 'To Boost: Improve 2 sea resources',
    description: 'Astrolabes and star charting enabling coastal exploration and ocean fishing.',
    unlockedEffects: ['Unlocks Harbors & Fishing Fleets', 'Deep Ocean Visibility'],
    prerequisites: [],
    unlocks: ['tech-mathematics'],
    category: 'Naval Exploration',
    costPoints: 320,
  },

  // Classical / Industrial Era
  {
    id: 'tech-horseback',
    name: 'Horseback Riding',
    era: 'Industrial',
    turns: 4,
    icon: '🐎',
    isBoosted: true,
    boostText: 'BOOSTED: Built a Pasture',
    description: 'Equine domestication and saddle craftsmanship granting rapid overland cavalry movement.',
    unlockedEffects: ['Unlocks Cavalry & Mounted Scouts', '+2 Movement across Plains'],
    prerequisites: ['tech-wheel'],
    unlocks: ['tech-engineering'],
    category: 'Exploration',
    costPoints: 480,
  },
  {
    id: 'tech-currency',
    name: 'Currency & Minting',
    era: 'Industrial',
    turns: 5,
    icon: '🪙',
    isBoosted: false,
    boostText: 'To Boost: Establish 2 trade routes',
    description: 'Standardized precious coin mints and ledger accounting facilitating commercial markets.',
    unlockedEffects: ['Unlocks Marketplace & Imperial Banks', '+35% Tax Revenue'],
    prerequisites: ['tech-wheel'],
    unlocks: ['tech-mathematics'],
    category: 'Economy',
    costPoints: 520,
  },
  {
    id: 'tech-iron',
    name: 'Iron Working',
    era: 'Industrial',
    turns: 6,
    icon: '⚔️',
    isBoosted: false,
    boostText: 'To Boost: Build an Iron Mine',
    description: 'Blast furnace metallurgy forging high-carbon steel blades and heavy plowshares.',
    unlockedEffects: ['Unlocks Swordsmen & Blast Furnaces', '+30% Heavy Industry'],
    prerequisites: ['tech-bronze'],
    unlocks: ['tech-construction'],
    category: 'Metallurgy',
    costPoints: 600,
  },
  {
    id: 'tech-construction',
    name: 'Construction',
    era: 'Industrial',
    turns: 5,
    icon: '🏛️',
    isBoosted: true,
    boostText: 'BOOSTED: Built a Water Mill',
    description: 'Arch engineering, crane hoists, and terracotta kiln masonry for monumental works.',
    unlockedEffects: ['Unlocks Terracotta Palaces & Lumber Mills', '+2 Housing per City'],
    prerequisites: ['tech-masonry', 'tech-iron'],
    unlocks: ['tech-engineering'],
    category: 'Engineering',
    costPoints: 640,
  },
  {
    id: 'tech-mathematics',
    name: 'Mathematics',
    era: 'Industrial',
    turns: 7,
    icon: '📐',
    isBoosted: false,
    boostText: 'To Boost: Build 3 specialty districts',
    description: 'Geometry, algebraic notation, and celestial geometry for advanced architecture.',
    unlockedEffects: ['Unlocks Academies & Amphitheaters', '+40% Science Generation'],
    prerequisites: ['tech-celestial', 'tech-currency'],
    unlocks: ['tech-engineering'],
    category: 'Science',
    costPoints: 720,
  },
  {
    id: 'tech-engineering',
    name: 'Engineering',
    era: 'Industrial',
    turns: 6,
    icon: '⚙️',
    isBoosted: true,
    boostText: 'BOOSTED: Built Ancient Walls',
    description: 'Geared machinery, aqueduct siphons, and fortified stone catapult bastions.',
    unlockedEffects: ['Unlocks Aqueducts, Stone Bridges & Catapults', '+50% Siege Power'],
    prerequisites: ['tech-construction', 'tech-horseback', 'tech-mathematics'],
    unlocks: ['tech-steam'],
    category: 'Engineering',
    costPoints: 850,
  },

  // Digital / Modern Era
  {
    id: 'tech-steam',
    name: 'Steam & Power Grid',
    era: 'Digital',
    turns: 8,
    icon: '⚡',
    isBoosted: true,
    boostText: 'BOOSTED: Built 2 Coal Foundries',
    description: 'High-pressure steam boilers and electromagnetic dynamo generators.',
    unlockedEffects: ['Unlocks Factories & Power Grids', '+85MW Base Output'],
    prerequisites: ['tech-engineering'],
    unlocks: ['tech-quantum'],
    category: 'Energy',
    costPoints: 1200,
  },
  {
    id: 'tech-quantum',
    name: 'Quantum Telemetry',
    era: 'Digital',
    turns: 10,
    icon: '🔬',
    isBoosted: false,
    boostText: 'To Boost: Commission Space Observatory',
    description: 'Superconducting cryostats and cryogenic quantum entanglement sensors.',
    unlockedEffects: ['Unlocks Quantum Observatories', '+50% All Science Yields'],
    prerequisites: ['tech-steam'],
    unlocks: ['tech-synthetic'],
    category: 'High Tech',
    costPoints: 1800,
  },

  // Synthetic Era
  {
    id: 'tech-synthetic',
    name: 'Autonomous Synthesis',
    era: 'Synthetic / AI',
    turns: 12,
    icon: '🤖',
    isBoosted: false,
    boostText: 'To Boost: Automate 5 Heavy Industries',
    description: 'Self-replicating robotic assemblies and neural governance algorithms.',
    unlockedEffects: ['Unlocks Synthetic Android Labor', '+100% Civilization Productivity'],
    prerequisites: ['tech-quantum'],
    unlocks: [],
    category: 'Artificial Intelligence',
    costPoints: 2600,
  },
];

export default function TechnologyPage({ onClose }: { onClose?: () => void }) {
  const { civilization, technologies, startResearch, triggerEureka, resources } = useGameState();
  const [techList, setTechList] = useState<CivTechItem[]>(civTechData);
  const [activeResearchId, setActiveResearchId] = useState<string>('tech-celestial');
  const [researchProgress, setResearchProgress] = useState<number>(0);
  const [sciencePerTurn, setSciencePerTurn] = useState<number>(36.0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTech, setSelectedTech] = useState<CivTechItem | null>(null);
  const [filterEra, setFilterEra] = useState<string>('all');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  // Sync with Backend Technology Overview & Tree
  useEffect(() => {
    let isMounted = true;
    civilizationApi.getTechnologyOverview(civilization.id).then((res) => {
      if (!isMounted || !res.success || !res.data) return;
      const data = res.data;
      if (data.science_per_turn) setSciencePerTurn(data.science_per_turn);
      if (data.active_technology) {
        setActiveResearchId(data.active_technology.id);
        setResearchProgress(data.active_technology.research_progress || 0);
      }
      if (data.technologies && data.technologies.length > 0) {
        setTechList((prev) =>
          prev.map((localItem) => {
            const serverNode = data.technologies.find((s: any) => s.id === localItem.id);
            if (!serverNode) return localItem;
            return {
              ...localItem,
              turns: serverNode.turns ?? localItem.turns,
              isBoosted: serverNode.is_boosted ?? localItem.isBoosted,
              boostText: serverNode.boost_text || localItem.boostText,
              costPoints: serverNode.cost_points ?? localItem.costPoints,
            };
          })
        );
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, [civilization.id]);

  const activeTech = techList.find((t) => t.id === activeResearchId) || techList[3] || techList[0];

  const handleCommenceResearch = (tech: CivTechItem) => {
    soundFx.playResearchStart();
    setActiveResearchId(tech.id);
    setResearchProgress(0);

    // Call backend API
    civilizationApi.queueResearch(civilization.id, tech.id).catch(() => {});

    const matchingGlobal = technologies.find((t) => t.name.toLowerCase().includes(tech.name.toLowerCase()));
    if (matchingGlobal) {
      startResearch(matchingGlobal.id);
    }
  };

  const handleTriggerEureka = (techId: string) => {
    soundFx.playEureka();

    // Call backend Eureka trigger
    civilizationApi.triggerEurekaBoost(civilization.id, techId).catch(() => {});

    setTechList((prev) =>
      prev.map((t) =>
        t.id === techId
          ? {
              ...t,
              isBoosted: true,
              turns: Math.max(1, Math.round(t.turns * 0.5)),
              boostText: `BOOSTED! (-50% Turns Left)`,
            }
          : t
      )
    );
  };

  const filteredTechs = useMemo(() => {
    return techList.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesEra = filterEra === 'all' || t.era === filterEra;
      return matchesSearch && matchesEra;
    });
  }, [techList, searchQuery, filterEra]);

  return (
    <div className="relative w-full h-full flex flex-col select-none overflow-hidden bg-[#e0d3bc] text-[#2c2419]">
      {/* ================= CIV VI PARCHMENT CANVAS BACKGROUND ================= */}
      <div
        className="absolute inset-0 pointer-events-none opacity-85 z-0"
        style={{
          backgroundColor: '#dfd2b9',
          backgroundImage: `
            radial-gradient(circle at 15% 25%, rgba(184, 158, 114, 0.25) 0%, transparent 60%),
            radial-gradient(circle at 85% 75%, rgba(145, 120, 80, 0.22) 0%, transparent 60%),
            linear-gradient(to right, rgba(120, 95, 60, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(120, 95, 60, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 100% 100%, 60px 60px, 60px 60px',
        }}
      >
        <div className="absolute top-12 right-24 opacity-15 pointer-events-none text-[#735939]">
          <Compass size={220} strokeWidth={1} />
        </div>
      </div>

      {/* ================= TOP CIVILIZATION RIBBON BANNER ================= */}
      <div className="relative z-10 shrink-0 bg-gradient-to-r from-[#0d4f54] via-[#09393e] to-[#0d4f54] border-b-2 border-[#caa455] px-6 py-2.5 flex items-center justify-between text-white shadow-xl">
        {/* Left: Civ Style Options Ribbon */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded bg-[#092b2f] border border-[#1b6b72] flex items-center gap-2 text-xs font-serif font-bold text-[#f5ebd2] shadow-inner">
            <Filter size={13} className="text-[#caa455]" />
            <select
              value={filterEra}
              onChange={(e) => {
                soundFx.playClick();
                setFilterEra(e.target.value);
              }}
              className="bg-transparent text-xs text-[#f5ebd2] font-serif font-semibold outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#092b2f] text-white">Filter: All Eras</option>
              <option value="Foundational" className="bg-[#092b2f] text-white">Foundational Era</option>
              <option value="Industrial" className="bg-[#092b2f] text-white">Industrial Era</option>
              <option value="Digital" className="bg-[#092b2f] text-white">Digital Era</option>
              <option value="Synthetic / AI" className="bg-[#092b2f] text-white">Synthetic Era</option>
            </select>
          </div>

          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#87aeb0]" />
            <input
              type="text"
              placeholder="Search Technology..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#092b2f] border border-[#1b6b72] rounded pl-8 pr-3 py-1 text-xs text-[#f5ebd2] placeholder-[#87aeb0] outline-none font-serif w-44 focus:border-[#caa455]"
            />
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              setIsKeyModalOpen(true);
            }}
            className="px-2.5 py-1 rounded bg-[#092b2f] hover:bg-[#124247] border border-[#1b6b72] text-xs font-serif font-semibold text-[#caa455] transition-colors flex items-center gap-1.5"
          >
            <Key size={12} />
            <span>Show Key</span>
          </button>
        </div>

        {/* Center: Grand Title Banner */}
        <div className="text-center font-serif">
          <div className="flex items-center justify-center gap-2">
            <span className="w-8 h-px bg-[#caa455]" />
            <h1 className="text-base sm:text-lg font-bold tracking-widest text-[#f8edd6] uppercase drop-shadow">
              TECHNOLOGY TREE
            </h1>
            <span className="w-8 h-px bg-[#caa455]" />
          </div>
          <span className="text-[10px] font-sans font-semibold tracking-wider text-[#98b8ba] uppercase">
            Civilisation Science & Technological Horizons
          </span>
        </div>

        {/* Right: Research Output Status + Close Button */}
        <div className="flex items-center gap-3 font-serif">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-[#98b8ba] block leading-none">SCIENCE PER TURN</span>
            <span className="text-xs font-bold font-mono text-[#caa455]">+{sciencePerTurn.toFixed(1)} 🧪</span>
          </div>
          <div className="w-8 h-8 rounded-full border-2 border-[#caa455] bg-[#092b2f] flex items-center justify-center text-[#caa455] shadow-md font-mono text-xs font-bold">
            {activeTech.turns}T
          </div>

          {onClose && (
            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="ml-2 px-3 py-1.5 rounded-md bg-[#c94c4c] hover:bg-[#a33838] border border-[#f08b8b] text-xs font-serif font-bold text-white transition-colors flex items-center gap-1.5 shadow-md"
              title="Return to 3D World Viewport (ESC)"
            >
              <X size={13} />
              <span className="hidden md:inline">Return to World [ESC]</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= ACTIVE RESEARCH PROJECT BANNER ================= */}
      <div className="relative z-10 px-6 py-2 bg-[#d2c3a5] border-b border-[#bda984] flex items-center justify-between text-xs font-serif shadow-xs">
        <div className="flex items-center gap-3">
          <span className="text-lg">{activeTech.icon}</span>
          <div>
            <span className="text-[9px] uppercase font-sans font-bold tracking-wider text-[#69553b]">
              CURRENTLY RESEARCHING ({activeTech.era} ERA)
            </span>
            <h3 className="text-xs font-bold text-[#201912] font-sans flex items-center gap-2">
              <span>{activeTech.name}</span>
              <span className="text-[#caa455] text-xs">★</span>
            </h3>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-3 w-1/2 max-w-md font-sans">
          <div className="flex-1 space-y-0.5">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-[#69553b] font-semibold">{researchProgress} / {activeTech.costPoints} Science</span>
              <span className="text-[#201912] font-bold">{activeTech.turns} Turns Remaining</span>
            </div>
            <div className="h-2 rounded-full bg-[#baa682] overflow-hidden border border-[#9b8560]">
              <div
                className="h-full bg-gradient-to-r from-[#0d4f54] via-[#1b7e87] to-[#caa455] rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (researchProgress / activeTech.costPoints) * 100)}%` }}
              />
            </div>
          </div>

          {!activeTech.isBoosted && (
            <button
              onClick={() => handleTriggerEureka(activeTech.id)}
              className="px-2.5 py-1 rounded bg-[#0d4f54] hover:bg-[#156066] text-[#dfb74a] border border-[#caa455] text-[10px] font-bold flex items-center gap-1 shrink-0 transition-colors shadow-xs"
              title="Trigger 50% Breakthrough Eureka discount"
            >
              <Sparkles size={11} className="text-[#dfb74a]" />
              <span>Eureka!</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= HORIZONTAL SCROLLING CIV TECH CANVAS ================= */}
      <div className="relative z-10 flex-1 overflow-x-auto overflow-y-auto custom-scrollbar p-8">
        <div className="min-w-[1400px] flex gap-12 relative pb-16">
          {(['Foundational', 'Industrial', 'Digital', 'Synthetic / AI'] as TechEra[]).map((eraName) => {
            const eraTechs = filteredTechs.filter((t) => t.era === eraName);

            return (
              <div key={eraName} className="w-[310px] shrink-0 space-y-4 relative">
                {/* Era Header Plaque */}
                <div className="p-2 rounded bg-gradient-to-b from-[#241c14] to-[#14100c] border-2 border-[#caa455] text-center shadow-md">
                  <span className="text-xs font-serif font-bold text-[#f5ebd2] tracking-wider uppercase block">
                    {eraName} Era
                  </span>
                  <span className="text-[9px] font-mono font-semibold text-[#caa455]">
                    {eraTechs.length} Paradigms
                  </span>
                </div>

                <div className="absolute top-12 bottom-0 -right-6 w-px border-r-2 border-dashed border-[#b39e78] pointer-events-none" />

                {/* Civ Tech Node Capsules */}
                <div className="space-y-4">
                  {eraTechs.map((tech) => {
                    const isActive = activeResearchId === tech.id;

                    return (
                      <div
                        key={tech.id}
                        onClick={() => setSelectedTech(tech)}
                        className={`rounded-lg border-2 transition-all cursor-pointer select-none overflow-hidden shadow-md flex flex-col justify-between group ${
                          isActive
                            ? 'bg-[#1b2327] border-[#caa455] ring-2 ring-[#caa455]/60 text-white shadow-xl'
                            : 'bg-[#1f262b] border-[#3a4750] hover:border-[#caa455] hover:bg-[#252e35] text-[#ede8dc]'
                        }`}
                      >
                        <div className="p-2.5 flex items-center justify-between gap-2.5 border-b border-[#2d3840]">
                          <div className="w-10 h-10 rounded-full border-2 border-[#caa455] bg-gradient-to-b from-[#2c363d] to-[#13181a] flex items-center justify-center text-xl shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                            <span>{tech.icon}</span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-serif font-bold uppercase tracking-wide group-hover:text-[#caa455] transition-colors truncate">
                              {tech.name}
                            </h4>
                            <span className="text-[9px] font-sans text-[#8f9ca6] block truncate">
                              {tech.category}
                            </span>
                          </div>

                          <div className="px-2 py-0.5 rounded bg-[#101416] border border-[#2e3940] text-[10px] font-mono font-bold text-[#caa455] shrink-0">
                            {tech.turns} TURNS
                          </div>
                        </div>

                        {/* Eureka Boost Stripe */}
                        <div
                          onClick={(e) => {
                            if (!tech.isBoosted) {
                              e.stopPropagation();
                              handleTriggerEureka(tech.id);
                            }
                          }}
                          className={`px-2.5 py-1.5 text-[10px] font-sans flex items-center justify-between gap-1.5 transition-colors ${
                            tech.isBoosted
                              ? 'bg-[#142327] text-[#55b8bf] border-t border-[#1d3c42]'
                              : 'bg-[#181d21] text-[#9ba8b2] hover:bg-[#20272c] hover:text-[#f5ebd2] cursor-pointer'
                          }`}
                          title={tech.isBoosted ? 'Eureka Bonus Active (-50%)' : 'Click to trigger Eureka boost!'}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <Sparkles
                              size={11}
                              className={tech.isBoosted ? 'text-[#55b8bf] fill-current' : 'text-[#caa455]'}
                            />
                            <span className="truncate font-medium">{tech.boostText}</span>
                          </div>

                          {!tech.isBoosted && (
                            <span className="text-[9px] font-bold text-[#caa455] uppercase shrink-0 font-mono">
                              Boost!
                            </span>
                          )}
                        </div>

                        {/* Bottom Research Trigger Action */}
                        <div className="p-1.5 bg-[#121618] border-t border-[#232c32] flex items-center justify-between text-[10px] font-sans">
                          <span className="text-[#6d7982] font-mono">{tech.costPoints} Science</span>

                          {isActive ? (
                            <span className="px-2 py-0.5 rounded bg-[#0d4f54] text-[#55b8bf] font-bold text-[9px] border border-[#1b6b72] flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#55b8bf] animate-ping" />
                              RESEARCHING
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCommenceResearch(tech);
                              }}
                              className="px-2 py-0.5 rounded bg-[#2a343c] hover:bg-[#caa455] hover:text-[#14181b] text-[#f5ebd2] font-bold text-[9px] transition-all flex items-center gap-1"
                            >
                              <Play size={8} className="fill-current" />
                              <span>RESEARCH</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= TECH DETAIL INSPECTOR MODAL ================= */}
      {selectedTech && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none font-serif">
          <div className="w-full max-w-md rounded-lg border-2 border-[#caa455] bg-[#f5ecd8] text-[#2c2419] shadow-2xl p-5 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b-2 border-[#caa455]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-[#caa455] bg-[#241c14] flex items-center justify-center text-2xl shadow-md">
                  <span>{selectedTech.icon}</span>
                </div>
                <div>
                  <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-[#69553b] block">
                    {selectedTech.era} Era · {selectedTech.category}
                  </span>
                  <h3 className="text-base font-bold text-[#201912] uppercase tracking-wide">
                    {selectedTech.name}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => {
                  soundFx.playClick();
                  setSelectedTech(null);
                }}
                className="p-1 rounded text-[#7a6b57] hover:text-[#201912] hover:bg-[#ede2cb] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs font-sans text-[#4a3f32] leading-relaxed">
              {selectedTech.description}
            </p>

            <div className="p-2.5 rounded bg-[#ede2cb] border border-[#cbba98] space-y-1 font-sans">
              <div className="flex items-center gap-1.5 font-bold text-xs text-[#0d4f54]">
                <Sparkles size={13} className="text-[#caa455]" />
                <span>Eureka Breakthrough Condition</span>
              </div>
              <p className="text-[11px] text-[#69553b]">{selectedTech.boostText}</p>
              <div className="pt-1 flex items-center justify-between text-[10px]">
                <span className="text-[#0d4f54] font-semibold">
                  Status: {selectedTech.isBoosted ? 'Triggered (-50% turns)' : 'Pending sector condition'}
                </span>
                {!selectedTech.isBoosted && (
                  <button
                    onClick={() => handleTriggerEureka(selectedTech.id)}
                    className="px-2 py-0.5 rounded bg-[#0d4f54] text-[#dfb74a] font-bold text-[9px] border border-[#caa455]"
                  >
                    Trigger Eureka
                  </button>
                )}
              </div>
            </div>

            <div className="font-sans space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#69553b] block">
                Discoveries & Unlocks
              </span>
              {selectedTech.unlockedEffects.map((eff, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-[#201912]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0d4f54]" />
                  <span>{eff}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t-2 border-[#caa455] flex items-center justify-between font-sans">
              <div className="text-xs font-mono">
                <span className="text-[#69553b]">Cost: </span>
                <span className="font-bold text-[#201912]">{selectedTech.costPoints} Science</span>
                <span className="text-[#69553b] ml-1">({selectedTech.turns} Turns)</span>
              </div>

              <button
                onClick={() => {
                  handleCommenceResearch(selectedTech);
                  setSelectedTech(null);
                }}
                className="px-4 py-1.5 rounded text-xs font-bold btn-game-gold flex items-center gap-1.5"
              >
                <Play size={11} className="fill-current" />
                <span>Commence Research</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SHOW KEY MODAL ================= */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none font-serif">
          <div className="w-full max-w-sm rounded-lg border-2 border-[#caa455] bg-[#f5ecd8] text-[#2c2419] shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#caa455]">
              <h3 className="font-bold text-sm text-[#201912] uppercase tracking-wider">
                Technology Tree Key
              </h3>
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="p-1 rounded text-[#7a6b57] hover:text-[#201912]"
              >
                <X size={15} />
              </button>
            </div>
            <div className="space-y-2 text-xs font-sans">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#caa455]" />
                <span>Gold Ribbon / Frame: Active Research Focus</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles size={13} className="text-[#0d4f54]" />
                <span>Eureka: Instant 50% Research Cost Acceleration</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-[#1f262b] border border-[#3a4750]" />
                <span>Slate Capsule: Available Paradigm to discover</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
