import React, { useState, useMemo } from 'react';
import {
  X,
  Bell,
  CheckCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  Flame,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useGameState } from '../../context/GameStateContext';
import { GameEvent } from '../../types/game';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (page: string) => void;
}

export default function NotificationCenter({
  isOpen,
  onClose,
  onNavigate,
}: NotificationCenterProps) {
  const { events, markEventRead } = useGameState();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const unreadCount = useMemo(() => events.filter((e) => !e.isRead).length, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchesCat =
        selectedCategory === 'all' || e.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSev =
        selectedSeverity === 'all' || e.severity.toLowerCase() === selectedSeverity.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSev && matchesSearch;
    });
  }, [events, selectedCategory, selectedSeverity, searchQuery]);

  if (!isOpen) return null;

  const markAllRead = () => {
    events.forEach((e) => {
      if (!e.isRead) markEventRead(e.id);
    });
  };

  const severityIcon = (severity: GameEvent['severity']) => {
    switch (severity) {
      case 'critical':
        return <Flame size={15} className="text-[#C87569]" />;
      case 'warning':
        return <AlertTriangle size={15} className="text-[#D6A75E]" />;
      case 'success':
        return <CheckCircle2 size={15} className="text-[#8FA879]" />;
      case 'info':
      default:
        return <Info size={15} className="text-[#C5A66A]" />;
    }
  };

  const severityBadge = (severity: GameEvent['severity']) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#C87569]/15 text-[#C87569] border border-[#C87569]/30 uppercase font-bold">
            Critical
          </span>
        );
      case 'warning':
        return (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#D6A75E]/15 text-[#D6A75E] border border-[#D6A75E]/30 uppercase font-bold">
            Warning
          </span>
        );
      case 'success':
        return (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#8FA879]/15 text-[#8FA879] border border-[#8FA879]/30 uppercase font-bold">
            Optimal
          </span>
        );
      case 'info':
      default:
        return (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#202820] text-[#A5AD9D] border border-[#2B372C] uppercase">
            Dispatched
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md h-full bg-[#171D18] border-l border-[#2B372C] flex flex-col text-[#EAE3D2] shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2B372C] bg-[#121713] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bell size={18} className="text-[#C5A66A]" />
            <div>
              <h2 className="text-sm font-bold font-cinzel text-[#EAE3D2] tracking-wider uppercase">
                Notification Center
              </h2>
              <span className="text-[10px] font-mono text-[#A5AD9D]">
                {unreadCount > 0 ? `${unreadCount} Unread Telemetry Events` : 'All Directives Acknowledged'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="px-2 py-1 rounded text-[10px] font-mono bg-[#202820] hover:bg-[#283228] text-[#C5A66A] border border-[#2B372C] flex items-center gap-1 transition-colors"
                title="Mark all as read"
              >
                <CheckCheck size={12} />
                <span>Mark All Read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded text-[#A5AD9D] hover:text-[#EAE3D2] hover:bg-[#202820] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="p-3 border-b border-[#2B372C] bg-[#17231B] space-y-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7A8473]" />
            <input
              type="text"
              placeholder="Search event logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded text-xs bg-[#121713] border border-[#2B372C] text-[#EAE3D2] placeholder-[#7A8473] focus:outline-none focus:border-[#C5A66A]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 text-[10px] font-mono">
            {['all', 'economic', 'environmental', 'breakthrough', 'diplomatic'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-0.5 rounded capitalize whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#C5A66A] text-[#121713] font-bold'
                    : 'bg-[#202820] text-[#A5AD9D] hover:text-[#EAE3D2] border border-[#2B372C]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Events Feed */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          {filteredEvents.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#7A8473] font-mono">
              No matching civil events recorded.
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => markEventRead(event.id)}
                className={`p-3 rounded border transition-all cursor-pointer relative ${
                  event.isRead
                    ? 'bg-[#1C231E]/60 border-[#2B372C] opacity-75 hover:opacity-100'
                    : 'bg-[#202820] border-[#3D4F3F] shadow-sm'
                }`}
              >
                {!event.isRead && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#C5A66A]" />
                )}

                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">{severityIcon(event.severity)}</div>
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-[#7A8473]">
                        Yr {event.year.toString().padStart(3, '0')}, D{event.day}
                      </span>
                      {severityBadge(event.severity)}
                    </div>
                    <h3 className="text-xs font-bold font-cinzel text-[#EAE3D2] leading-snug">
                      {event.title}
                    </h3>
                    <p className="text-[11px] text-[#A5AD9D] leading-relaxed mt-1">
                      {event.description}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#2B372C] bg-[#121713] text-center text-[10px] font-mono text-[#7A8473]">
          Synchronized to High Council Telemetry Stream
        </div>
      </div>
    </div>
  );
}
