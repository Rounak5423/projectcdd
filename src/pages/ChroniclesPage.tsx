import React, { useState, useMemo } from 'react';
import { useGameState } from '../context/GameStateContext';
import { ChronicleEntry, ChronicleCategory } from '../types/game';
import { soundFx } from '../services/soundFx';
import {
  BookOpen,
  Scroll,
  Calendar,
  Sparkles,
  Search,
  Filter,
  Download,
  Shield,
  Award,
  Compass,
  Feather,
  ChevronRight,
  BookMarked,
  X,
  Clock,
  Landmark
} from 'lucide-react';

interface ChroniclesPageProps {
  onClose?: () => void;
}

const CATEGORY_TAGS: { id: ChronicleCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Chronicles' },
  { id: 'Founding', label: 'Founding' },
  { id: 'Milestone', label: 'Milestones' },
  { id: 'Breakthrough', label: 'Breakthroughs' },
  { id: 'Policy', label: 'Edicts & Laws' },
  { id: 'Economic', label: 'Economic Feats' },
  { id: 'Environmental', label: 'Ecological' },
  { id: 'Crisis', label: 'Crises & Trials' },
  { id: 'Ascension', label: 'Ascension' },
];

export const ChroniclesPage: React.FC<ChroniclesPageProps> = ({ onClose }) => {
  const { civilization, chronicle } = useGameState();

  const [selectedCategory, setSelectedCategory] = useState<ChronicleCategory | 'all'>('all');
  const [selectedEra, setSelectedEra] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectedEntry, setInspectedEntry] = useState<ChronicleEntry | null>(null);

  // Filtered entries sorted chronologically
  const filteredChronicles = useMemo(() => {
    return chronicle
      .filter(entry => {
        const matchCat = selectedCategory === 'all' || entry.category === selectedCategory;
        const matchEra = selectedEra === 'all' || entry.era === selectedEra;
        const matchSearch =
          entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.impactSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (entry.relatedDistrict && entry.relatedDistrict.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchCat && matchEra && matchSearch;
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year; // newest first by default
        return b.day - a.day;
      });
  }, [chronicle, selectedCategory, selectedEra, searchQuery]);

  const handleExportChronicle = () => {
    soundFx.playSuccess();
    const markdownContent = `# THE CHRONICLES OF ${civilization.name.toUpperCase()}
*Civilisation Simulation Engine Archive — Current Year ${civilization.currentYear}, Day ${civilization.currentDay}*
*Era: ${civilization.era} | Leader: ${civilization.leaderTitle}*

---

${chronicle.map(e => `
## [Year ${e.year}, Day ${e.day}] ${e.title}
- **Era**: ${e.era}
- **Domain**: ${e.category}
- **Narrative**: ${e.description}
- **Civil Impact**: ${e.impactSummary}
${e.relatedDistrict ? `- **Locus**: ${e.relatedDistrict}` : ''}
${e.relatedTech ? `- **Discovery Linked**: ${e.relatedTech}` : ''}
${e.relatedPolicy ? `- **Imperial Decree**: ${e.relatedPolicy}` : ''}
`).join('\n---\n')}
`;

    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${civilization.name.replace(/\s+/g, '_')}_Chronicles.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#171D18]/95 backdrop-blur-md text-[#EAE3D2] overflow-hidden select-none">
      {/* Top Header */}
      <div className="flex-shrink-0 px-8 py-5 border-b border-[#C5A66A]/20 bg-gradient-to-r from-[#171D18] via-[#202820] to-[#171D18] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm border border-[#C5A66A]/40 bg-[#17231B] flex items-center justify-center text-[#C5A66A] shadow-inner">
            <Scroll className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl text-[#EAE3D2] tracking-wider font-semibold">
                THE CHRONICLES OF {civilization.name.toUpperCase()}
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-[#C5A66A]/40 text-[#C5A66A] bg-[#C5A66A]/10">
                Imperial Archive
              </span>
            </div>
            <p className="text-xs text-[#A5AD9D] font-sans mt-0.5">
              Authoritative historical annals, epochal milestones and sovereign decrees from Year 1 to the Present.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportChronicle}
            className="flex items-center gap-2 px-4 py-2 border border-[#C5A66A]/40 text-[#C5A66A] hover:bg-[#C5A66A]/15 rounded text-xs font-serif tracking-wider uppercase transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Annals</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 border border-[#C5A66A]/30 rounded hover:bg-[#C5A66A]/10 text-[#A5AD9D] hover:text-[#EAE3D2] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Ribbon */}
      <div className="flex-shrink-0 px-8 py-3.5 bg-[#17231B]/70 border-b border-[#C5A66A]/15 flex flex-wrap items-center justify-between gap-4">
        {/* Category pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {CATEGORY_TAGS.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => { soundFx.playClick(); setSelectedCategory(cat.id); }}
                className={`px-3 py-1 rounded text-xs font-serif tracking-wide transition-all ${
                  isSelected
                    ? 'bg-[#C5A66A] text-[#171D18] font-bold shadow'
                    : 'bg-[#202820] text-[#A5AD9D] border border-[#C5A66A]/20 hover:text-[#EAE3D2]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search & Era filter */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#A5AD9D]" />
            <input
              type="text"
              placeholder="Search historical records..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-[#202820] border border-[#C5A66A]/30 rounded text-xs text-[#EAE3D2] placeholder-[#A5AD9D]/60 focus:outline-none focus:border-[#C5A66A] w-56"
            />
          </div>

          <select
            value={selectedEra}
            onChange={e => setSelectedEra(e.target.value)}
            className="bg-[#202820] border border-[#C5A66A]/30 rounded text-xs text-[#EAE3D2] px-3 py-1.5 focus:outline-none focus:border-[#C5A66A]"
          >
            <option value="all">All Historical Eras</option>
            <option value="Settlement Age">Settlement Age</option>
            <option value="Agricultural Age">Agricultural Age</option>
            <option value="Industrial Age">Industrial Age</option>
            <option value="Knowledge Age">Knowledge Age</option>
            <option value="Digital Age">Digital Age</option>
            <option value="Advanced Civilisation">Advanced Civilisation</option>
          </select>
        </div>
      </div>

      {/* Chronicles Timeline Body */}
      <div className="flex-1 min-h-0 px-8 py-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto relative pl-8 border-l-2 border-[#C5A66A]/30 space-y-8 py-4">
          {filteredChronicles.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[#C5A66A]/20 rounded bg-[#202820]/40">
              <Scroll className="w-8 h-8 text-[#A5AD9D] mx-auto mb-2 opacity-50" />
              <p className="text-sm font-serif text-[#A5AD9D]">No historical entries recorded matching current filters.</p>
            </div>
          ) : (
            filteredChronicles.map(entry => (
              <div
                key={entry.id}
                onClick={() => { soundFx.playClick(); setInspectedEntry(entry); }}
                className="group relative cursor-pointer"
              >
                {/* Node icon on the timeline */}
                <div className="absolute -left-[45px] top-4 w-7 h-7 rounded-full bg-[#171D18] border-2 border-[#C5A66A] flex items-center justify-center text-[#C5A66A] group-hover:bg-[#C5A66A] group-hover:text-[#171D18] transition-all shadow-md">
                  <Feather className="w-3.5 h-3.5" />
                </div>

                {/* Parchment-style Card */}
                <div className="bg-[#202820]/90 border border-[#C5A66A]/30 group-hover:border-[#C5A66A] rounded p-6 shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      {/* Era & Date Header */}
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="font-mono text-xs text-[#C5A66A] tracking-wider font-semibold">
                          YEAR {entry.year}, DAY {entry.day}
                        </span>
                        <span className="text-xs text-[#A5AD9D]">|</span>
                        <span className="text-[11px] font-serif text-[#D8CBAA] uppercase tracking-wider">
                          {entry.era}
                        </span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#171D18] border border-[#C5A66A]/30 text-[#C5A66A]">
                          {entry.category}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-serif text-xl font-bold text-[#EAE3D2] group-hover:text-[#C5A66A] transition-colors">
                        {entry.title}
                      </h3>
                    </div>

                    <ChevronRight className="w-5 h-5 text-[#A5AD9D] group-hover:text-[#C5A66A] group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>

                  {/* Narrative Body */}
                  <p className="text-xs text-[#A5AD9D] font-sans mt-3 leading-relaxed">
                    {entry.description}
                  </p>

                  {/* Impact pill */}
                  <div className="mt-4 pt-3 border-t border-[#C5A66A]/15 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-[#8FA879]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="font-sans font-medium">{entry.impactSummary}</span>
                    </div>

                    {entry.relatedDistrict && (
                      <span className="text-[11px] font-mono text-[#A5AD9D] flex items-center gap-1">
                        <Landmark className="w-3 h-3 text-[#C5A66A]" />
                        {entry.relatedDistrict}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Manuscript Reader Modal */}
      {inspectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-[#202820] border-2 border-[#C5A66A]/50 rounded-sm shadow-2xl overflow-hidden font-sans">
            <div className="px-8 py-5 border-b border-[#C5A66A]/30 bg-gradient-to-r from-[#171D18] via-[#202820] to-[#171D18] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-[#C5A66A]" />
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#C5A66A]">
                    Official Imperial Record #{inspectedEntry.id}
                  </span>
                  <h2 className="font-serif text-xl font-bold text-[#EAE3D2]">{inspectedEntry.title}</h2>
                </div>
              </div>
              <button
                onClick={() => setInspectedEntry(null)}
                className="text-[#A5AD9D] hover:text-[#EAE3D2]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between text-xs font-mono text-[#A5AD9D] pb-3 border-b border-[#C5A66A]/20">
                <span>EPOCH: <strong className="text-[#C5A66A]">{inspectedEntry.era}</strong></span>
                <span>CHRONOLOGICAL TIME: <strong className="text-[#EAE3D2]">Year {inspectedEntry.year}, Day {inspectedEntry.day}</strong></span>
                <span>CLASSIFICATION: <strong className="text-[#C5A66A]">{inspectedEntry.category}</strong></span>
              </div>

              {/* Manuscript Narrative */}
              <div className="bg-[#171D18] border border-[#C5A66A]/30 p-6 rounded relative">
                <div className="font-serif text-sm text-[#EAE3D2] leading-relaxed italic">
                  "{inspectedEntry.description}"
                </div>
                <div className="mt-4 pt-4 border-t border-[#C5A66A]/20 text-xs text-[#A5AD9D] flex items-center justify-between">
                  <span>Recorded by: <strong>Office of the Grand Chronicler</strong></span>
                  <span>Authority: <strong>{civilization.leaderTitle}</strong></span>
                </div>
              </div>

              {/* Consequences & Impact */}
              <div className="space-y-2">
                <h4 className="font-serif text-xs uppercase tracking-wider text-[#C5A66A]">
                  Direct Consequences & Historical Legacy
                </h4>
                <div className="p-4 bg-[#283228]/50 border border-[#8FA879]/30 rounded text-xs text-[#EAE3D2] space-y-2">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-[#8FA879] flex-shrink-0 mt-0.5" />
                    <span>{inspectedEntry.impactSummary}</span>
                  </div>
                  {inspectedEntry.relatedDistrict && (
                    <div className="text-[#A5AD9D] pl-6 text-[11px]">
                      Municipal Sector Assigned: <strong>{inspectedEntry.relatedDistrict}</strong>
                    </div>
                  )}
                  {inspectedEntry.relatedTech && (
                    <div className="text-[#A5AD9D] pl-6 text-[11px]">
                      Technological Milestone: <strong>{inspectedEntry.relatedTech}</strong>
                    </div>
                  )}
                  {inspectedEntry.relatedPolicy && (
                    <div className="text-[#A5AD9D] pl-6 text-[11px]">
                      Enacted Imperial Decree: <strong>{inspectedEntry.relatedPolicy}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-8 py-4 bg-[#171D18] border-t border-[#C5A66A]/20 flex justify-end">
              <button
                onClick={() => setInspectedEntry(null)}
                className="px-6 py-2 bg-[#C5A66A] text-[#171D18] font-serif font-bold text-xs uppercase tracking-wider rounded hover:bg-[#D8CBAA] transition-colors"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChroniclesPage;

