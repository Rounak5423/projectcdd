import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  GitBranch,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowRight,
  FlaskConical,
  X,
  Zap,
  Wheat,
  Bot,
  Microscope,
  BrainCircuit,
  Building2,
  Cpu,
  Search,
  Filter,
  Check,
  ChevronRight,
  Flame,
  Sun,
  Droplets,
  Layers,
  LayoutGrid,
  Network,
  Clock,
  Play,
} from 'lucide-react';
import { useGameState } from '../context/GameStateContext';
import { Technology, TechEra } from '../types/game';

const eraColumns: { era: TechEra; label: string; turns: string }[] = [
  { era: 'Foundational', label: 'ERA I · FOUNDATIONAL', turns: 'Turns 1 - 25' },
  { era: 'Industrial', label: 'ERA II · INDUSTRIAL', turns: 'Turns 26 - 55' },
  { era: 'Digital', label: 'ERA III · DIGITAL & QUANTUM', turns: 'Turns 56 - 90' },
  { era: 'Synthetic / AI', label: 'ERA IV · SYNTHETIC', turns: 'Turns 91+' },
];

interface ConnectorLine {
  id: string;
  fromId: string;
  toId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isUnlocked: boolean;
}

export default function TechnologyPage() {
  const { technologies, resources, startResearch, triggerEureka } = useGameState();
  const [selectedTech, setSelectedTech] = useState<Technology | null>(null);
  const [hoveredTechId, setHoveredTechId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEraTab, setSelectedEraTab] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [connectors, setConnectors] = useState<ConnectorLine[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const getTechIcon = (name: string, size = 18) => {
    switch (name) {
      case 'Droplets':
      case 'Wheat':
        return <Wheat size={size} />;
      case 'Zap':
      case 'Sun':
      case 'Flame':
        return <Zap size={size} />;
      case 'Bot':
      case 'Sparkles':
        return <Bot size={size} />;
      case 'Cpu':
        return <Cpu size={size} />;
      case 'Microscope':
      case 'BrainCircuit':
        return <BrainCircuit size={size} />;
      default:
        return <FlaskConical size={size} />;
    }
  };

  // Find currently researching tech
  const activeResearchTech = useMemo(() => {
    return technologies.find((t) => !t.isResearched && t.isAvailable);
  }, [technologies]);

  const filteredTechnologies = useMemo(() => {
    return technologies.filter((t) => {
      const matchEra = selectedEraTab === 'all' || t.era === selectedEraTab;
      const matchQuery =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchEra && matchQuery;
    });
  }, [technologies, selectedEraTab, searchQuery]);

  // Compute connectors for timeline mode
  useEffect(() => {
    if (viewMode !== 'timeline') return;

    const updateConnectors = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const lines: ConnectorLine[] = [];

      technologies.forEach((tech) => {
        if (!tech.unlocks || tech.unlocks.length === 0) return;

        const fromElem = document.getElementById(`timeline-card-${tech.id}`);
        if (!fromElem) return;
        const fromRect = fromElem.getBoundingClientRect();

        tech.unlocks.forEach((unlockId) => {
          const toElem = document.getElementById(`timeline-card-${unlockId}`);
          if (!toElem) return;
          const toRect = toElem.getBoundingClientRect();

          const x1 = fromRect.right - containerRect.left + container.scrollLeft;
          const y1 = fromRect.top + fromRect.height / 2 - containerRect.top + container.scrollTop;
          const x2 = toRect.left - containerRect.left + container.scrollLeft;
          const y2 = toRect.top + toRect.height / 2 - containerRect.top + container.scrollTop;

          lines.push({
            id: `${tech.id}->${unlockId}`,
            fromId: tech.id,
            toId: unlockId,
            x1,
            y1,
            x2,
            y2,
            isUnlocked: tech.isResearched,
          });
        });
      });

      setConnectors(lines);
    };

    const timer = setTimeout(updateConnectors, 150);
    window.addEventListener('resize', updateConnectors);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateConnectors);
    };
  }, [technologies, viewMode, filteredTechnologies]);

  return (
    <div className="h-full w-full flex flex-col bg-[#111417] text-[#ede8dc] select-none overflow-hidden">
      {/* ================= CLEAN HEADER BAR ================= */}
      <div className="shrink-0 bg-[#161c20] border-b border-[#252f36] px-5 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="eyebrow text-[#aba393]">Settlement Progress</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#7ea376]" />
          </div>
          <h1 className="text-lg font-bold text-[#ede8dc] mt-0.5">Technology & Paradigms</h1>
        </div>

        {/* View Mode Switcher + Search */}
        <div className="flex items-center gap-2.5">
          {/* Search Box */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8a8376]" />
            <input
              type="text"
              placeholder="Search technologies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#101416] border border-[#232b30] rounded-md pl-8 pr-2.5 py-1 text-xs text-[#ede8dc] placeholder-[#8a8376] outline-none focus:border-[#445663] w-44 transition-colors"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-[#101416] p-0.5 rounded-md border border-[#232b30] gap-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-[#252f36] text-[#ffffff] font-semibold shadow-xs'
                  : 'text-[#8a8376] hover:text-[#ede8dc]'
              }`}
              title="Catalog Grid View"
            >
              <LayoutGrid size={13} />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                viewMode === 'timeline'
                  ? 'bg-[#252f36] text-[#ffffff] font-semibold shadow-xs'
                  : 'text-[#8a8376] hover:text-[#ede8dc]'
              }`}
              title="Era Timeline View"
            >
              <Network size={13} />
              <span>Timeline</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= ACTIVE RESEARCH BANNER ================= */}
      <div className="shrink-0 px-5 py-2.5 bg-[#14181b] border-b border-[#252f36]">
        {activeResearchTech ? (
          <div className="p-2.5 rounded-md bg-[#182025] border border-[#2d3840] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-[#222b31] border border-[#3b4952] flex items-center justify-center text-[#c29b38] shrink-0">
                {getTechIcon(activeResearchTech.iconName, 16)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="eyebrow text-[#7ea376]">Active Research Project</span>
                  <span className="text-[10px] font-mono text-[#aba393]">
                    ({activeResearchTech.era} Era)
                  </span>
                </div>
                <h3 className="text-xs font-bold text-[#ede8dc]">{activeResearchTech.name}</h3>
              </div>
            </div>

            {/* Progress Bar & Turns */}
            <div className="flex items-center gap-3 sm:w-1/2 max-w-md">
              <div className="flex-1 space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-[#8a8376]">
                    {activeResearchTech.progress} / {activeResearchTech.costResearchPoints} Points
                  </span>
                  <span className="text-[#c29b38] font-bold">
                    {Math.max(1, Math.ceil((activeResearchTech.costResearchPoints - activeResearchTech.progress) / 36))} Turns Left
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[#101416] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#7ea376] to-[#c29b38] rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (activeResearchTech.progress / activeResearchTech.costResearchPoints) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <button
                onClick={() => setSelectedTech(activeResearchTech)}
                className="px-2.5 py-1 rounded bg-[#202930] hover:bg-[#2b3740] text-xs font-semibold text-[#ede8dc] border border-[#374652] shrink-0 transition-colors"
              >
                Inspect
              </button>
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-md bg-[#161c20] border border-[#252f36] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#8a8376]">
              <FlaskConical size={14} className="text-[#c29b38]" />
              <span>No research in progress. Select an available paradigm below.</span>
            </div>
            <span className="text-[10px] font-mono text-[#7ea376] font-bold">+36 Points / Turn</span>
          </div>
        )}
      </div>

      {/* ================= ERA FILTER TABS ================= */}
      <div className="shrink-0 px-6 pt-3 pb-2 flex items-center gap-2 overflow-x-auto custom-scrollbar border-b border-[#1b261d]">
        <button
          onClick={() => setSelectedEraTab('all')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            selectedEraTab === 'all'
              ? 'bg-[#2b3d2d] text-[#f1f5f2] border border-[#4a684e] shadow-sm'
              : 'text-[#8e9c8c] hover:bg-[#151e17] hover:text-white'
          }`}
        >
          All Eras ({technologies.length})
        </button>

        {eraColumns.map((col) => {
          const count = technologies.filter((t) => t.era === col.era).length;
          const isSelected = selectedEraTab === col.era;

          return (
            <button
              key={col.era}
              onClick={() => setSelectedEraTab(col.era)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-[#2b3d2d] text-[#f1f5f2] border border-[#4a684e] shadow-sm'
                  : 'text-[#8e9c8c] hover:bg-[#151e17] hover:text-white'
              }`}
            >
              {col.era} ({count})
            </button>
          );
        })}
      </div>

      {/* ================= CONTENT: GRID VIEW OR TIMELINE VIEW ================= */}
      {viewMode === 'grid' ? (
        /* ================= USER-FRIENDLY CARD GRID VIEW ================= */
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto">
            {filteredTechnologies.map((tech) => {
              const Icon = getTechIcon(tech.iconName);
              const isResearching = !tech.isResearched && tech.isAvailable && tech.progress > 0;

              return (
                <div
                  key={tech.id}
                  onClick={() => setSelectedTech(tech)}
                  className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all duration-200 group ${
                    tech.isResearched
                      ? 'bg-[#152017] border-[#384e3a] hover:border-[#4ade80]'
                      : isResearching
                      ? 'bg-[#1e1c14] border-[#d4af37] ring-1 ring-[#d4af37]/40 shadow-lg'
                      : tech.isAvailable
                      ? 'bg-[#141c15] border-[#2b3a2d] hover:border-[#4ade80] hover:bg-[#18231a]'
                      : 'bg-[#111712]/70 border-[#1f2921] opacity-60'
                  }`}
                >
                  <div>
                    {/* Top Status & Category */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-[#8e9c8c] uppercase">
                        {tech.category}
                      </span>
                      {tech.isResearched ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1e2f20] text-[#4ade80] border border-[#3a583e] flex items-center gap-1">
                          <CheckCircle2 size={11} /> Researched
                        </span>
                      ) : isResearching ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#2d2817] text-[#d4af37] border border-[#5c4f2b] animate-pulse">
                          In Progress
                        </span>
                      ) : tech.isAvailable ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1d2b1f] text-[#a6bd82] border border-[#354f38]">
                          Ready
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono text-[#6f8271] bg-[#141b15] flex items-center gap-1">
                          <Lock size={10} /> Locked
                        </span>
                      )}
                    </div>

                    {/* Tech Name & Icon */}
                    <div className="flex items-center gap-3 mt-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                          tech.isResearched
                            ? 'bg-[#213323] text-[#4ade80] border-[#3f5f43]'
                            : isResearching
                            ? 'bg-[#332b17] text-[#d4af37] border-[#5e4e27]'
                            : 'bg-[#18221a] text-[#8e9c8c] border-[#293a2c]'
                        }`}
                      >
                        {Icon}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-[#f1f5f2] group-hover:text-[#4ade80] transition-colors truncate">
                          {tech.name}
                        </h4>
                        <span className="text-[11px] font-mono text-[#8e9c8c]">
                          {tech.costResearchPoints} Points ({tech.turnsToComplete || 6} Turns)
                        </span>
                      </div>
                    </div>

                    {/* Description preview */}
                    <p className="text-xs text-[#8e9c8c] mt-2.5 line-clamp-2 leading-relaxed">
                      {tech.description}
                    </p>

                    {/* Eureka Boost Badge */}
                    <div className="mt-3 p-2 rounded-lg bg-[#0e1410] border border-[#202b22] text-[10px] font-mono flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <Sparkles
                          size={11}
                          className={tech.isEurekaBoosted ? 'text-[#4ade80]' : 'text-[#6f8271]'}
                        />
                        <span
                          className={`truncate ${
                            tech.isEurekaBoosted ? 'text-[#4ade80] font-bold' : 'text-[#8e9c8c]'
                          }`}
                        >
                          {tech.isEurekaBoosted ? 'BOOSTED (-50%): ' : 'Boost: '}
                          {tech.eurekaCondition || 'Accomplish sector milestone'}
                        </span>
                      </div>
                      {!tech.isEurekaBoosted && !tech.isResearched && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerEureka(tech.id);
                          }}
                          className="px-2 py-0.5 rounded bg-[#332b17] hover:bg-[#4a3e20] text-[#fcd34d] border border-[#6b5828] text-[9px] font-bold flex items-center gap-1 shrink-0 transition-colors shadow-sm"
                          title="Trigger Eureka! (50% instant discount)"
                        >
                          <Zap size={10} className="fill-current text-[#fcd34d]" />
                          <span>Trigger Eureka</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Action */}
                  <div className="mt-4 pt-3 border-t border-[#1f2c21] flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#6f8271]">
                      Era: {tech.era}
                    </span>

                    {tech.isAvailable && !tech.isResearched && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startResearch(tech.id);
                        }}
                        className="px-3 py-1 rounded-lg text-xs font-semibold btn-game-gold flex items-center gap-1"
                      >
                        <Play size={11} className="fill-current" />
                        <span>Research</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ================= TIMELINE ERA MATRIX VIEW ================= */
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar p-8 relative"
        >
          {/* SVG Dependency Arc Overlay */}
          <svg
            className="absolute inset-0 pointer-events-none z-0"
            style={{ minWidth: '1500px', minHeight: '900px', width: '100%', height: '100%' }}
          >
            {connectors.map((c) => {
              const isHighlighted =
                hoveredTechId === c.fromId || hoveredTechId === c.toId;
              const isAnyHovered = hoveredTechId !== null;
              const dx = c.x2 - c.x1;
              const midX1 = c.x1 + dx * 0.45;
              const midX2 = c.x1 + dx * 0.55;
              const pathD = `M ${c.x1} ${c.y1} C ${midX1} ${c.y1}, ${midX2} ${c.y2}, ${c.x2} ${c.y2}`;

              return (
                <path
                  key={c.id}
                  d={pathD}
                  fill="none"
                  stroke={
                    isHighlighted
                      ? '#d4af37'
                      : isAnyHovered
                      ? 'rgba(60, 85, 65, 0.15)'
                      : c.isUnlocked
                      ? 'rgba(212, 175, 55, 0.5)'
                      : 'rgba(50, 70, 54, 0.3)'
                  }
                  strokeWidth={isHighlighted ? 3 : c.isUnlocked ? 2 : 1}
                  strokeDasharray={c.isUnlocked ? undefined : '4,4'}
                  className="transition-all duration-200"
                />
              );
            })}
          </svg>

          {/* Horizontal Era Lanes Canvas */}
          <div className="min-w-[1380px] flex gap-10 relative pb-12 z-10">
            {eraColumns.map((col) => {
              const eraTechs = filteredTechnologies.filter((t) => t.era === col.era);

              return (
                <div key={col.era} className="w-[320px] shrink-0 space-y-4 relative">
                  {/* Era Header */}
                  <div className="p-2.5 rounded-xl border border-[#2b3a2d] bg-[#141c15] text-center shadow-sm">
                    <span className="text-xs font-bold text-[#f1f5f2] block">
                      {col.label}
                    </span>
                    <span className="text-[10px] font-mono text-[#8e9c8c]">
                      {col.turns}
                    </span>
                  </div>

                  {/* Vertical Lane Divider Line */}
                  <div className="absolute top-14 bottom-0 -right-5 w-px border-r border-dashed border-[#233325] pointer-events-none" />

                  {/* Tech Pills Column */}
                  <div className="space-y-3">
                    {eraTechs.map((tech) => {
                      const Icon = getTechIcon(tech.iconName);
                      const isResearching = !tech.isResearched && tech.isAvailable && tech.progress > 0;
                      const isHovered = hoveredTechId === tech.id;

                      return (
                        <div
                          id={`timeline-card-${tech.id}`}
                          key={tech.id}
                          onMouseEnter={() => setHoveredTechId(tech.id)}
                          onMouseLeave={() => setHoveredTechId(null)}
                          onClick={() => setSelectedTech(tech)}
                          className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer select-none transition-all duration-200 shadow-sm ${
                            tech.isResearched
                              ? 'bg-[#152017] border-[#384e3a] hover:border-[#4ade80]'
                              : isResearching
                              ? 'bg-[#1e1c14] border-[#d4af37] ring-1 ring-[#d4af37]/50 shadow-md'
                              : tech.isAvailable
                              ? 'bg-[#141c15] border-[#2b3a2d] hover:border-[#4ade80]'
                              : 'bg-[#111712]/70 border-[#1f2921] opacity-60'
                          } ${isHovered ? '-translate-y-0.5' : ''}`}
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
                              tech.isResearched
                                ? 'bg-[#213323] text-[#4ade80] border-[#3f5f43]'
                                : isResearching
                                ? 'bg-[#332b17] text-[#d4af37] border-[#5e4e27] animate-pulse'
                                : 'bg-[#18221a] text-[#8e9c8c] border-[#293a2c]'
                            }`}
                          >
                            {Icon}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#f1f5f2] truncate">
                                {tech.name}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-[#d4af37] ml-1 shrink-0">
                                {tech.isResearched ? '✓' : `${tech.turnsToComplete || 6}T`}
                              </span>
                            </div>

                            <p className="text-[10px] text-[#8e9c8c] truncate mt-0.5">
                              {tech.eurekaCondition || 'Accomplish sector milestone'}
                            </p>
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
      )}

      {/* ================= CLEAN TECH DETAIL INSPECTION MODAL ================= */}
      {selectedTech && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#3b513e] bg-[#141c15] shadow-2xl p-6 text-[#f1f5f2] select-none space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#253627]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#202e22] border border-[#3e5a42] flex items-center justify-center text-[#d4af37]">
                  {getTechIcon(selectedTech.iconName, 22)}
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#d4af37] font-bold uppercase tracking-wider">
                    {selectedTech.era} Era · {selectedTech.category}
                  </span>
                  <h3 className="text-lg font-bold text-[#f1f5f2] mt-0.5">
                    {selectedTech.name}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedTech(null)}
                className="p-1 rounded-lg text-[#8e9c8c] hover:text-white hover:bg-[#1f2b21] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 text-xs">
              <p className="text-xs text-[#a2b29f] leading-relaxed">
                {selectedTech.description}
              </p>

              {/* Eureka Boost Box */}
              <div className="p-3 rounded-xl bg-[#0e1510] border border-[#233325] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#4ade80]">
                  <Sparkles size={14} />
                  <span>Eureka Acceleration</span>
                </div>
                <p className="text-[11px] text-[#8e9c8c]">
                  {selectedTech.eurekaCondition || 'Accomplish sector milestone to trigger 50% research acceleration'}
                </p>
                <span className="text-[10px] font-mono text-[#4ade80] font-semibold block mt-1">
                  Status: {selectedTech.isEurekaBoosted ? 'Eureka Triggered (+50% Complete)' : 'Pending Condition'}
                </span>
              </div>

              {/* Discovery Rewards */}
              <div>
                <span className="text-[10px] font-mono uppercase text-[#d4af37] font-bold block mb-2">
                  Discovery Rewards & Unlocks
                </span>
                <div className="space-y-1.5">
                  {selectedTech.effects.map((eff, i) => (
                    <div key={i} className="flex items-center gap-2 text-[#f1f5f2] font-medium text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
                      <span>{eff}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer / Research Action */}
            <div className="pt-4 border-t border-[#253627] flex items-center justify-between">
              <div className="font-mono text-xs">
                <span className="text-[#8e9c8c]">Cost: </span>
                <span className="text-[#d4af37] font-bold text-sm">
                  {selectedTech.costResearchPoints} Points
                </span>
                <span className="text-[#8e9c8c] text-[11px] ml-1.5">
                  ({selectedTech.turnsToComplete || 6} Turns)
                </span>
              </div>

              {selectedTech.isResearched ? (
                <span className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1e2f20] text-[#4ade80] border border-[#3a583e] flex items-center gap-1.5">
                  <CheckCircle2 size={15} /> Researched & Active
                </span>
              ) : selectedTech.isAvailable ? (
                <div className="flex items-center gap-2">
                  {!selectedTech.isEurekaBoosted && (
                    <button
                      onClick={() => {
                        triggerEureka(selectedTech.id);
                        setSelectedTech((prev) =>
                          prev
                            ? {
                                ...prev,
                                isEurekaBoosted: true,
                                progress: Math.min(
                                  prev.costResearchPoints,
                                  prev.progress + Math.round(prev.costResearchPoints * 0.5)
                                ),
                              }
                            : null
                        );
                      }}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-[#332b17] hover:bg-[#4a3e20] text-[#fcd34d] border border-[#6b5828] flex items-center gap-1.5 transition-colors"
                      title="Trigger 50% Breakthrough Eureka discount"
                    >
                      <Zap size={13} className="text-[#fcd34d]" />
                      <span>Trigger Eureka (-50%)</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      startResearch(selectedTech.id);
                      setSelectedTech(null);
                    }}
                    className="px-5 py-2 rounded-xl text-xs font-bold btn-game-gold flex items-center gap-2"
                  >
                    <FlaskConical size={14} />
                    <span>Commence Research</span>
                  </button>
                </div>
              ) : (
                <span className="text-xs text-[#6f8271] font-mono">
                  Prerequisites Required: {selectedTech.prerequisites.join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
