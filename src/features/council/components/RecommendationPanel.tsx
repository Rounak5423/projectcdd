import React, { useState, useMemo } from 'react';
import { CouncilRecommendation } from '../types/recommendation';
import { Advisor } from '../types/advisor';
import RecommendationCard from './RecommendationCard';
import { soundFx } from '../../../services/soundFx';
import {
  FileCheck2,
  Filter,
  Search,
  Sparkles,
  Layers,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface RecommendationPanelProps {
  recommendations: CouncilRecommendation[];
  advisors: Advisor[];
  onReviewRecommendation: (recId: string, status: 'Accepted' | 'Rejected' | 'Under Review') => void;
}

export const RecommendationPanel: React.FC<RecommendationPanelProps> = ({
  recommendations,
  advisors,
  onReviewRecommendation,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecommendations = useMemo(() => {
    return recommendations.filter((r) => {
      const matchStatus = selectedStatus === 'all' || r.status === selectedStatus;
      const matchPriority = selectedPriority === 'all' || r.priority === selectedPriority;
      const matchAdvisor = selectedAdvisorId === 'all' || r.advisorId === selectedAdvisorId;
      const matchSearch =
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.advisorName.toLowerCase().includes(searchQuery.toLowerCase());

      return matchStatus && matchPriority && matchAdvisor && matchSearch;
    });
  }, [recommendations, selectedStatus, selectedPriority, selectedAdvisorId, searchQuery]);

  // Counts by status
  const counts = useMemo(() => {
    return {
      proposed: recommendations.filter((r) => r.status === 'Proposed').length,
      underReview: recommendations.filter((r) => r.status === 'Under Review').length,
      accepted: recommendations.filter((r) => r.status === 'Accepted').length,
      implemented: recommendations.filter((r) => r.status === 'Implemented').length,
    };
  }, [recommendations]);

  return (
    <div className="w-full flex flex-col h-full bg-[#151915]/95 border border-[#2B372C] rounded p-5 space-y-4 font-sans select-none overflow-hidden">
      {/* Header & Status Summary Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#C5A66A]/20 gap-3">
        <div className="flex items-center gap-2.5">
          <FileCheck2 className="w-5 h-5 text-[#C5A66A]" />
          <div>
            <h2 className="font-serif text-base font-bold text-[#EAE3D2] uppercase tracking-wider">
              Council Policy & Directive Recommendations
            </h2>
            <p className="text-xs text-[#A5AD9D]">
              Formal policy proposals submitted by the six high advisors. Accepted edicts require imperial ratification.
            </p>
          </div>
        </div>

        {/* Status Counters */}
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="px-2 py-0.5 rounded bg-[#C5A66A]/10 text-[#C5A66A] border border-[#C5A66A]/20">
            {counts.proposed} Proposed
          </span>
          <span className="px-2 py-0.5 rounded bg-[#D6A75E]/10 text-[#D6A75E] border border-[#D6A75E]/20">
            {counts.underReview} Under Review
          </span>
          <span className="px-2 py-0.5 rounded bg-[#8FA879]/10 text-[#8FA879] border border-[#8FA879]/20">
            {counts.accepted} Accepted
          </span>
          <span className="px-2 py-0.5 rounded bg-[#8FA879]/20 text-[#8FA879] border border-[#8FA879]/40 font-bold">
            {counts.implemented} Implemented
          </span>
        </div>
      </div>

      {/* Filter and Search Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded bg-[#171D18] border border-[#2B372C]">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A5AD9D]" />
          <input
            type="text"
            placeholder="Search recommendations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-[#121713] border border-[#2B372C] rounded text-xs text-[#EAE3D2] placeholder-[#A5AD9D]/60 focus:outline-none focus:border-[#C5A66A]"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 text-xs">
          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#121713] border border-[#2B372C] rounded text-xs text-[#EAE3D2] px-2.5 py-1 focus:outline-none focus:border-[#C5A66A]"
          >
            <option value="all">All Statuses</option>
            <option value="Proposed">Proposed</option>
            <option value="Under Review">Under Review</option>
            <option value="Accepted">Accepted</option>
            <option value="Implemented">Implemented</option>
            <option value="Rejected">Rejected</option>
            <option value="Expired">Expired</option>
          </select>

          {/* Priority filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-[#121713] border border-[#2B372C] rounded text-xs text-[#EAE3D2] px-2.5 py-1 focus:outline-none focus:border-[#C5A66A]"
          >
            <option value="all">All Priorities</option>
            <option value="Urgent">Urgent Priority</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>

          {/* Advisor filter */}
          <select
            value={selectedAdvisorId}
            onChange={(e) => setSelectedAdvisorId(e.target.value)}
            className="bg-[#121713] border border-[#2B372C] rounded text-xs text-[#EAE3D2] px-2.5 py-1 focus:outline-none focus:border-[#C5A66A]"
          >
            <option value="all">All Advisors</option>
            {advisors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.officialTitle}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Recommendations Cards Grid */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
        {filteredRecommendations.length === 0 ? (
          <div className="text-center py-12 text-xs text-[#A5AD9D] font-serif border border-dashed border-[#2B372C] rounded p-6">
            <FileCheck2 className="w-8 h-8 text-[#C5A66A]/40 mx-auto mb-2" />
            <p>No recommendations match the specified filter criteria.</p>
          </div>
        ) : (
          filteredRecommendations.map((rec) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              onReview={onReviewRecommendation}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default RecommendationPanel;
