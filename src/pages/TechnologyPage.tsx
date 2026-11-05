import React, { useState, useRef, useEffect } from 'react';
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
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useGameState } from '../context/GameStateContext';
import { Technology, TechEra } from '../types/game';

const eras: TechEra[] = ['Foundational', 'Industrial', 'Digital', 'Synthetic / AI'];

export default function TechnologyPage() {
  const { technologies, resources, startResearch } = useGameState();
  const [selectedTech, setSelectedTech] = useState<Technology | null>(null);
  const [hoveredTechId, setHoveredTechId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getTechIcon = (name: string) => {
    switch (name) {
      case 'Droplets':
      case 'Wheat':
        return <Wheat size={16} />;
      case 'Zap':
      case 'Sun':
      case 'Flame':
        return <Zap size={16} />;
      case 'Bot':
      case 'Sparkles':
        return <Bot size={16} />;
      case 'Cpu':
        return <Cpu size={16} />;
      case 'Microscope':
      case 'BrainCircuit':
        return <BrainCircuit size={16} />;
      default:
        return <FlaskConical size={16} />;
    }
  };

  // Helper to determine if a tech is connected to hovered tech
  const isConnectedToHovered = (techId: string) => {
    if (!hoveredTechId) return false;
    const hovered = technologies.find((t) => t.id === hoveredTechId);
    if (!hovered) return false;
    return hovered.unlocks.includes(techId) || hovered.prerequisites.includes(techId);
  };

  return (
    <div
      ref={containerRef}
      className="p-6 lg:p-8 space-y-6 overflow-y-auto custom-scrollbar text-[#e8e9e3] max-w-7xl mx-auto relative select-none"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#39443a] gap-4">
        <div>
          <span className="eyebrow text-[#c6a76a]">SCIENTIFIC EVOLUTION & PARADIGMS</span>
          <h1 className="text-2xl font-bold text-[#f3f5ef] mt-0.5">Civilisation Technology Tree</h1>
          <p className="text-xs text-[#9da99b] mt-1">
            Synthesize progressive discoveries with interactive dependency linkages across 4 technological eras.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#182119] p-3 rounded-xl border border-[#2e3c2f] text-xs font-mono">
          <div>
            <span className="text-[#9da99b] block text-[10px]">AVAILABLE RESEARCH</span>
            <span className="text-sm font-bold text-[#82bd8e]">
              {resources.researchPoints.toLocaleString()} Points
            </span>
          </div>
          <div className="w-px h-6 bg-[#2c392d]" />
          <div>
            <span className="text-[#9da99b] block text-[10px]">OUTPUT VELOCITY</span>
            <span className="text-sm font-bold text-[#a6bd82]">+36 Pts/day</span>
          </div>
        </div>
      </div>

      {/* Dependency Link Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#171d18] p-3 rounded-xl border border-[#2c372d] text-xs">
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span className="flex items-center gap-1.5 text-[#a6bd82]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#a6bd82]" /> Researched (Bonus Active)
          </span>
          <span className="flex items-center gap-1.5 text-[#c6a76a]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#c6a76a]" /> In Progress / Available
          </span>
          <span className="flex items-center gap-1.5 text-[#6c7b6a]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3c4a3b]" /> Locked (Requires Prerequisite)
          </span>
        </div>

        <span className="text-[10px] font-mono text-[#8e9c8c]">
          Hover any paradigm node to illuminate upstream & downstream dependency arcs
        </span>
      </div>

      {/* Visual Tech Tree Grid Across Eras */}
      <div className="space-y-10 relative">
        {eras.map((era, eraIdx) => {
          const eraTechs = technologies.filter((t) => t.era === era);

          return (
            <div key={era} className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#c6a76a] bg-[#272216] px-3.5 py-1 rounded-full border border-[#4d3f23]">
                  ERA 0{eraIdx + 1} · {era.toUpperCase()}
                </span>
                <div className="flex-1 h-px bg-[#2f3d30]" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {eraTechs.map((tech) => {
                  const Icon = getTechIcon(tech.iconName);
                  const isCurrentResearch =
                    !tech.isResearched && tech.isAvailable && tech.progress > 0;
                  const isHovered = hoveredTechId === tech.id;
                  const isLinked = isConnectedToHovered(tech.id);

                  return (
                    <div
                      key={tech.id}
                      onClick={() => setSelectedTech(tech)}
                      onMouseEnter={() => setHoveredTechId(tech.id)}
                      onMouseLeave={() => setHoveredTechId(null)}
                      className={`panel p-4 flex flex-col justify-between cursor-pointer transition-all relative ${
                        isHovered
                          ? 'border-[#c6a76a] ring-2 ring-[#c6a76a]/60 shadow-2xl scale-[1.02]'
                          : isLinked
                          ? 'border-[#a6bd82] ring-1 ring-[#a6bd82] shadow-lg'
                          : tech.isResearched
                          ? 'bg-[#1a251c] border-[#445b43] hover:border-[#678b66]'
                          : isCurrentResearch
                          ? 'bg-[#262417] border-[#8a723e] ring-1 ring-[#c6a76a] shadow-lg'
                          : tech.isAvailable
                          ? 'bg-[#182019] border-[#374737] hover:border-[#526a52]'
                          : 'bg-[#141914] border-[#252f25] opacity-65'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                tech.isResearched
                                  ? 'bg-[#293c2b] text-[#a6bd82]'
                                  : isCurrentResearch
                                  ? 'bg-[#3b331c] text-[#c6a76a]'
                                  : 'bg-[#1e271f] text-[#8e9c8c]'
                              }`}
                            >
                              {Icon}
                            </div>
                            <span className="text-[10px] font-mono text-[#9da99b] uppercase">
                              {tech.category}
                            </span>
                          </div>

                          {tech.isResearched ? (
                            <span className="flex items-center gap-1 text-[10px] font-mono text-[#a6bd82] font-bold">
                              <CheckCircle2 size={12} /> RESEARCHED
                            </span>
                          ) : tech.isAvailable ? (
                            <span className="text-[10px] font-mono text-[#c6a76a] font-bold">
                              {tech.costResearchPoints} PTS
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-mono text-[#778575]">
                              <Lock size={12} /> LOCKED
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-[#f3f5ee] mt-2.5">{tech.name}</h3>
                        <p className="text-[11px] text-[#9da99b] mt-1 line-clamp-2 leading-relaxed">
                          {tech.description}
                        </p>

                        {/* Direct Dependency Badges */}
                        {tech.unlocks.length > 0 && (
                          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-mono text-[#7c8b7b] uppercase">Unlocks:</span>
                            {tech.unlocks.map((u) => (
                              <span
                                key={u}
                                className="px-1.5 py-0.2 rounded bg-[#161c16] text-[9px] font-mono text-[#a6bd82] border border-[#2b372c]"
                              >
                                {u.replace('tech-', '')}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Progress bar or action line */}
                      <div className="mt-4 pt-2 border-t border-[#263127]">
                        {tech.isResearched ? (
                          <div className="text-[10px] font-mono text-[#a6bd82] flex items-center justify-between">
                            <span>Civilisation Bonus Active</span>
                            <span>✓</span>
                          </div>
                        ) : isCurrentResearch ? (
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-mono text-[#c6a76a]">
                              <span>RESEARCHING</span>
                              <span>
                                {Math.round((tech.progress / tech.costResearchPoints) * 100)}%
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-[#131914] overflow-hidden">
                              <div
                                className="h-full bg-[#c6a76a] rounded-full transition-all duration-300"
                                style={{
                                  width: `${(tech.progress / tech.costResearchPoints) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        ) : tech.isAvailable ? (
                          <span className="text-[10px] font-mono text-[#82bd8e] flex items-center gap-1">
                            Ready to commence research <ArrowRight size={11} />
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-[#667264]">
                            Requires: {tech.prerequisites.map((p) => p.replace('tech-', '')).join(', ')}
                          </span>
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

      {/* Technology Detail Modal */}
      {selectedTech && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#19221a] border border-[#39443a] rounded-xl shadow-2xl p-6 text-[#e8e9e3]">
            <div className="flex items-start justify-between pb-3 border-b border-[#2d3a2e]">
              <div>
                <span className="text-[10px] font-mono text-[#c6a76a] font-bold uppercase">
                  {selectedTech.era} ERA · {selectedTech.category}
                </span>
                <h3 className="text-lg font-bold text-[#f3f5ef] mt-0.5">{selectedTech.name}</h3>
              </div>
              <button
                onClick={() => setSelectedTech(null)}
                className="p-1 rounded text-[#9da99b] hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <p className="text-xs text-[#adb8a9] leading-relaxed">{selectedTech.description}</p>

              <div>
                <span className="text-[10px] font-mono uppercase text-[#c6a76a] font-bold block mb-1">
                  STRATEGIC EFFECTS & BONUSES
                </span>
                <div className="space-y-1">
                  {selectedTech.effects.map((eff, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[#dce9ca] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#a6bd82]" />
                      <span>{eff}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedTech.prerequisites.length > 0 && (
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#9da99b] block mb-1">
                    Prerequisite Technologies:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedTech.prerequisites.map((p) => (
                      <span
                        key={p}
                        className="px-2 py-0.5 rounded bg-[#141914] text-[10px] font-mono text-[#82a6bd] border border-[#2b392d]"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedTech.unlocks.length > 0 && (
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#c6a76a] block mb-1">
                    Unlocks Downstream Technologies:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedTech.unlocks.map((u) => (
                      <span
                        key={u}
                        className="px-2 py-0.5 rounded bg-[#141914] text-[10px] font-mono text-[#c6a76a] border border-[#2b392d]"
                      >
                        {u}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#2d3a2e] flex items-center justify-between">
              <span className="text-xs font-mono text-[#c6a76a]">
                Cost: {selectedTech.costResearchPoints} Points
              </span>

              {selectedTech.isResearched ? (
                <span className="px-3 py-1.5 rounded text-xs font-semibold bg-[#263528] text-[#a6bd82] border border-[#405642]">
                  Researched & Active
                </span>
              ) : selectedTech.isAvailable ? (
                <button
                  onClick={() => {
                    startResearch(selectedTech.id);
                    setSelectedTech(null);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#405439] hover:bg-[#526b48] text-[#dce9ca] border border-[#6b8563]"
                >
                  Set as Active Research Focus
                </button>
              ) : (
                <span className="text-xs text-[#738272]">Prerequisites Not Yet Researched</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
