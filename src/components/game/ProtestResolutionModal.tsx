import React from 'react';
import {
  X,
  AlertTriangle,
  Megaphone,
  Sparkles,
  Award,
  Crown,
  History,
  Coins,
  Smile,
  Shield,
  BookOpen,
  PartyPopper,
} from 'lucide-react';
import { useGameState } from '../../context/GameStateContext';
import { soundFx } from '../../services/soundFx';

export default function ProtestResolutionModal() {
  const {
    activeProtest,
    isProtestModalOpen,
    setIsProtestModalOpen,
    resolveProtest,
    triggerNextProtest,
    resources,
  } = useGameState();

  if (!isProtestModalOpen || !activeProtest) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none font-serif animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-lg border-3 border-[#8f7742] bg-[#f5ecd8] text-[#2c2419] shadow-2xl overflow-hidden relative">
        {/* Ornate Newspaper Gazette Header */}
        <div className="bg-[#241c14] px-4 py-2.5 border-b-2 border-[#8f7742] flex items-center justify-between text-[#ede8dc]">
          <div className="flex items-center gap-2">
            <Megaphone size={16} className="text-[#dfb74a] animate-bounce" />
            <span className="font-sans font-bold text-xs uppercase tracking-widest text-[#f5ebd2]">
              THE GENESIS CHRONICLE · SPECIAL EDITION
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={triggerNextProtest}
              className="text-[10px] font-sans px-2 py-0.5 rounded bg-[#382c20] text-[#dfb74a] hover:bg-[#4d3c2c] border border-[#8f7742] transition-colors"
              title="Next Historical Twin Protest"
            >
              Cycle Protest ❯
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                setIsProtestModalOpen(false);
              }}
              className="p-1 rounded text-[#aba393] hover:text-white hover:bg-[#382c20] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Newspaper Sub-masthead */}
        <div className="bg-[#ede2cb] px-4 py-2 border-b border-[#cbba98] flex items-center justify-between text-xs">
          <span className="font-sans font-bold text-[#69553b] text-[10px] uppercase tracking-wider">
            Location: {activeProtest.districtName}
          </span>
          <span className="font-mono text-[10px] text-[#8a765a] italic">
            "History repeats itself: the first time as tragedy, the second as artificial simulation."
          </span>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar font-serif">
          {/* Main Headline */}
          <div className="text-center pb-2 border-b-2 border-[#cbba98]">
            <span className="px-2.5 py-0.5 rounded bg-[#423120] text-[#dfb74a] font-sans font-bold text-[10px] uppercase tracking-widest inline-block mb-1">
              {activeProtest.historicalTwin}
            </span>
            <h2 className="text-xl font-bold text-[#1f1710] tracking-tight leading-snug">
              {activeProtest.title}
            </h2>
            <p className="text-xs text-[#5e4f3c] mt-1.5 italic font-sans leading-relaxed max-w-lg mx-auto">
              {activeProtest.historicalContext}
            </p>
          </div>

          {/* Slogans Marquee Banner */}
          <div className="bg-[#241c14] p-2 rounded border border-[#8f7742] text-[#f5ebd2] flex items-center gap-2 overflow-x-auto custom-scrollbar">
            <span className="text-xs font-sans font-bold text-[#dfb74a] uppercase shrink-0">
              Chanted Slogans:
            </span>
            {activeProtest.slogans.map((slogan, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded bg-[#382c20] text-[10px] font-sans font-bold text-[#ede8dc] border border-[#5c4a35] whitespace-nowrap shrink-0"
              >
                "{slogan}"
              </span>
            ))}
          </div>

          {/* Protest Leader Profile */}
          <div className="flex items-center gap-3.5 bg-[#ede2cb] p-3 rounded-md border border-[#cbba98] shadow-inner">
            <div className="w-14 h-14 rounded-full border-2 border-[#8f7742] bg-[#241c14] flex items-center justify-center text-3xl shrink-0 shadow-md">
              <span>{activeProtest.leaderAvatar}</span>
            </div>

            <div className="min-w-0 flex-1 font-sans">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#dfb74a] bg-[#423120] px-1.5 py-0.2 rounded inline-block">
                {activeProtest.faction}
              </span>
              <h3 className="text-sm font-bold text-[#201912] mt-0.5 truncate">
                {activeProtest.leaderName}
              </h3>
              <p className="text-[11px] text-[#69553b] font-medium italic">{activeProtest.leaderTitle}</p>
              <p className="text-[10px] text-[#3d3224] mt-0.5 leading-tight font-serif">
                <strong>Core Grievance:</strong> {activeProtest.demands}
              </p>
            </div>
          </div>

          {/* Executive Directives (The 3 Fun Choices) */}
          <div className="space-y-2.5 font-sans">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#52412e] flex items-center gap-1.5">
              <Award size={13} className="text-[#8f7742]" />
              Executive Council Resolutions (Choose Response)
            </span>

            {activeProtest.options.map((opt) => {
              const canAfford = (opt.costGrc || 0) <= resources.grc;

              return (
                <div
                  key={opt.id}
                  onClick={() => {
                    if (canAfford) {
                      resolveProtest(opt.id);
                    } else {
                      soundFx.playError();
                    }
                  }}
                  className={`p-3 rounded-lg border-2 transition-all cursor-pointer flex flex-col justify-between group shadow-sm ${
                    canAfford
                      ? 'bg-[#ffffff] border-[#baa784] hover:border-[#8f7742] hover:bg-[#fffdf7]'
                      : 'bg-[#ede5d8] border-[#baa784] opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">
                        {opt.outcomeType === 'carnival'
                          ? '🎉'
                          : opt.outcomeType === 'bribe'
                          ? '🍺'
                          : opt.outcomeType === 'reform'
                          ? '📜'
                          : '🏛️'}
                      </span>
                      <h4 className="text-xs font-bold text-[#201912] group-hover:text-[#8f7742] transition-colors">
                        {opt.label}
                      </h4>
                    </div>

                    {/* Cost in GRC */}
                    <span className="text-xs font-mono font-bold text-[#8f7742] shrink-0">
                      {opt.costGrc ? `${opt.costGrc} GRC` : 'Free'}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#69553b] italic font-serif mt-1">
                    {opt.flavorQuote}
                  </p>

                  <div className="mt-2 pt-1.5 border-t border-[#ede2cb] flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-[#2e6b26]">
                      {opt.effectDescription}
                    </span>

                    <button
                      disabled={!canAfford}
                      className="px-3 py-1 rounded btn-game-gold text-[10px] font-bold uppercase tracking-wider shadow-xs"
                    >
                      {canAfford ? 'Ratify Edict' : 'Lacks GRC'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

