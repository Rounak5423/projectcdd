import React, { useState, useMemo } from 'react';
import { Advisor } from '../types/advisor';
import AdvisorCard from './AdvisorCard';
import { Search, Users, AlertTriangle, Filter } from 'lucide-react';

interface AdvisorRosterProps {
  advisors: Advisor[];
  selectedAdvisorId: string | null;
  onAdvisorSelect: (advisorId: string) => void;
}

export const AdvisorRoster: React.FC<AdvisorRosterProps> = ({
  advisors,
  selectedAdvisorId,
  onAdvisorSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWarningOnly, setFilterWarningOnly] = useState(false);

  const filteredAdvisors = useMemo(() => {
    return advisors.filter((adv) => {
      const matchSearch =
        adv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        adv.officialTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        adv.domain.toLowerCase().includes(searchQuery.toLowerCase());
      const matchWarning = !filterWarningOnly || adv.hasActiveWarning;
      return matchSearch && matchWarning;
    });
  }, [advisors, searchQuery, filterWarningOnly]);

  const warningCount = advisors.filter((a) => a.hasActiveWarning).length;

  return (
    <div className="w-full flex flex-col h-full bg-[#151915]/90 border border-[#2B372C] rounded p-4 space-y-3.5 select-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#C5A66A]/20">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#C5A66A]" />
          <h2 className="font-serif text-sm font-bold text-[#EAE3D2] uppercase tracking-wider">
            Imperial Council Roster
          </h2>
        </div>
        <span className="text-[10px] font-mono text-[#C5A66A] bg-[#C5A66A]/10 px-2 py-0.5 rounded border border-[#C5A66A]/20">
          6 Seats
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A5AD9D]" />
          <input
            type="text"
            placeholder="Search advisor or domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#121713] border border-[#2B372C] rounded text-xs text-[#EAE3D2] placeholder-[#A5AD9D]/60 focus:outline-none focus:border-[#C5A66A]"
          />
        </div>

        {warningCount > 0 && (
          <button
            onClick={() => setFilterWarningOnly(!filterWarningOnly)}
            className={`w-full flex items-center justify-between px-2.5 py-1 rounded text-[11px] font-mono transition-colors border ${
              filterWarningOnly
                ? 'bg-[#D6A75E]/20 text-[#D6A75E] border-[#D6A75E]/40 font-bold'
                : 'bg-[#171D18] text-[#A5AD9D] border-[#2B372C] hover:text-[#EAE3D2]'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 text-[#D6A75E]" />
              <span>Filter Attention Required</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/40">
              {warningCount}
            </span>
          </button>
        )}
      </div>

      {/* Advisor Cards Scrollable Column */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {filteredAdvisors.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#A5AD9D] font-serif">
            No council advisor found matching query.
          </div>
        ) : (
          filteredAdvisors.map((advisor) => (
            <AdvisorCard
              key={advisor.id}
              advisor={advisor}
              isSelected={selectedAdvisorId === advisor.id}
              onSelect={onAdvisorSelect}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default AdvisorRoster;
