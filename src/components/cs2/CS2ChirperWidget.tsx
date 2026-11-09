import React, { useState } from 'react';
import {
  MessageCircle,
  Heart,
  Share2,
  X,
  TrendingUp,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { useGameState } from '../../context/GameStateContext';
import { soundFx } from '../../services/soundFx';

export default function CS2ChirperWidget() {
  const { chirperFeed, likeChirp, isChirperOpen, setIsChirperOpen } = useGameState();
  const [activeTag, setActiveTag] = useState<string>('all');
  const [latestToast, setLatestToast] = useState<boolean>(true);

  const unreadCount = chirperFeed.filter((c) => !c.isLiked).length;
  const latestChirp = chirperFeed[0];

  const filteredChirps = activeTag === 'all'
    ? chirperFeed
    : chirperFeed.filter((c) => c.tag.toLowerCase().includes(activeTag.replace('#', '').toLowerCase()));

  const tags = ['all', '#TrafficAlert', '#CleanEnergy', '#QuantumFuture', '#OasisLiving', '#GreenCity'];

  return (
    <>
      {/* Top Header Chirper Pill */}
      <div className="relative">
        <button
          onClick={() => {
            soundFx.playClick();
            setIsChirperOpen(!isChirperOpen);
            setLatestToast(false);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold transition-all shadow-md group ${
            isChirperOpen
              ? 'bg-[#1b3a4b] text-[#5dade2] border-[#2980b9]'
              : 'bg-[#12222b] hover:bg-[#18303d] text-[#4ea8de] border-[#1d4255]'
          }`}
          title="Cities: Skylines II Chirper (Live Citizen Social Media Feed)"
        >
          {/* Animated Blue Bird Icon */}
          <span className="text-sm group-hover:scale-125 transition-transform duration-200">
            🐦
          </span>
          <span className="font-mono text-[11px] hidden sm:inline">Chirper</span>
          <span className="w-4 h-4 rounded-full bg-[#3498db] text-[#0d161d] text-[9px] font-bold flex items-center justify-center">
            {chirperFeed.length}
          </span>
        </button>

        {/* Floating Mini Toast when recent chirp arrives */}
        {latestToast && latestChirp && !isChirperOpen && (
          <div
            onClick={() => {
              setIsChirperOpen(true);
              setLatestToast(false);
            }}
            className="absolute top-10 left-1/2 -translate-x-1/2 w-64 p-2 rounded-lg bg-[#14232b]/95 border border-[#2b5a74] text-xs text-[#ede8dc] shadow-2xl backdrop-blur-md cursor-pointer animate-in fade-in slide-in-from-top-2 duration-200 z-50 flex items-start gap-2"
          >
            <span className="text-base shrink-0">🐦</span>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-bold text-[10px] text-[#5dade2] truncate">{latestChirp.author}</span>
                <span className="text-[9px] text-[#8a8376] font-mono">{latestChirp.time}</span>
              </div>
              <p className="text-[10px] text-[#d6e4ec] line-clamp-2 mt-0.5 leading-snug">
                {latestChirp.text}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLatestToast(false);
              }}
              className="text-[#8a8376] hover:text-[#ede8dc] p-0.5"
            >
              <X size={10} />
            </button>
          </div>
        )}
      </div>

      {/* Full Screen / Drawer Chirper Social Feed */}
      {isChirperOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#12191f] border border-[#264152] rounded-2xl max-w-lg w-full h-[620px] flex flex-col shadow-2xl overflow-hidden text-[#ede8dc] animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 bg-[#14222c] border-b border-[#213a4a] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#1b3a4b] border border-[#3498db] flex items-center justify-center text-lg shadow-inner">
                  🐦
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm font-bold font-mono tracking-wide text-[#5dade2]">
                      CHIRPER LIVE FEED
                    </h2>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#0e1c24] text-[#3498db] border border-[#234d66]">
                      CS2 Social
                    </span>
                  </div>
                  <p className="text-[10px] text-[#7998ad]">Real-Time Citizen Sentiment & Pulse</p>
                </div>
              </div>
              <button
                onClick={() => setIsChirperOpen(false)}
                className="p-1 rounded-lg text-[#7998ad] hover:text-white hover:bg-[#1a2f3d]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Trending Hashtag Chips */}
            <div className="px-3.5 py-2 bg-[#0e151b] border-b border-[#1b2c37] flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0">
              <TrendingUp size={12} className="text-[#3498db] shrink-0 mr-1" />
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full transition-all shrink-0 ${
                    activeTag === tag
                      ? 'bg-[#1b3d52] text-[#5dade2] font-bold border border-[#3498db]'
                      : 'bg-[#141e26] text-[#7895a7] hover:bg-[#1a2933] hover:text-[#ede8dc]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Chirp Post List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 space-y-3">
              {filteredChirps.map((chirp) => (
                <div
                  key={chirp.id}
                  className="p-3 rounded-xl bg-[#152028] border border-[#233744] hover:border-[#345366] transition-all space-y-2 group"
                >
                  {/* Author Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={chirp.avatar}
                        alt={chirp.author}
                        className="w-7 h-7 rounded-full object-cover border border-[#345366]"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#ede8dc]">{chirp.author}</span>
                          <span className="text-[10px] text-[#69889b] font-mono">{chirp.handle}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[9px] text-[#69889b]">
                          <MapPin size={9} />
                          <span>{chirp.district}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[#69889b]">{chirp.time}</span>
                  </div>

                  {/* Tweet Content */}
                  <p className="text-xs text-[#dbe5eb] leading-relaxed">
                    {chirp.text}
                  </p>

                  {/* Actions Row */}
                  <div className="flex items-center gap-4 pt-1 border-t border-[#1e2f3a] text-xs text-[#69889b]">
                    <button
                      onClick={() => {
                        soundFx.playClick();
                        likeChirp(chirp.id);
                      }}
                      className={`flex items-center gap-1 hover:text-[#e74c3c] transition-colors ${
                        chirp.isLiked ? 'text-[#e74c3c] font-bold' : ''
                      }`}
                    >
                      <Heart size={12} className={chirp.isLiked ? 'fill-[#e74c3c]' : ''} />
                      <span className="text-[10px] font-mono">{chirp.likes}</span>
                    </button>
                    <div className="flex items-center gap-1 hover:text-[#5dade2] transition-colors">
                      <MessageCircle size={12} />
                      <span className="text-[10px] font-mono">Reply</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#3498db] ml-auto">
                      {chirp.tag}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Footer Callout */}
            <div className="p-3 bg-[#0f171d] border-t border-[#1c2e39] text-center text-[10px] text-[#69889b]">
              💡 <em>Chirps reflect real-time citizen approval of taxes, utilities, and traffic policies.</em>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
