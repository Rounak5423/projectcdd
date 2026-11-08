import React from 'react';
import {
  Sparkles,
  Trophy,
  Hammer,
  Zap,
  Coins,
  X,
  Crown,
  ChevronRight,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { useGameState, GameToast } from '../../context/GameStateContext';

export default function FloatingRewardBanner() {
  const { toasts, dismissToast, levelUpCelebration, dismissLevelUp } = useGameState();

  const getToastIcon = (type: GameToast['type']) => {
    switch (type) {
      case 'reward':
        return <Trophy size={18} className="text-[#fcd34d] animate-bounce" />;
      case 'eureka':
        return <Zap size={18} className="text-[#60a5fa] animate-pulse" />;
      case 'build':
        return <Hammer size={18} className="text-[#4ade80]" />;
      case 'levelup':
        return <Crown size={18} className="text-[#f59e0b] animate-spin" />;
      default:
        return <Sparkles size={18} className="text-[#a7f3d0]" />;
    }
  };

  const getToastColors = (type: GameToast['type']) => {
    switch (type) {
      case 'reward':
        return 'border-[#8f7742] bg-[#1a1711]/96 text-[#ede8dc] shadow-xl';
      case 'eureka':
        return 'border-[#476077] bg-[#141b21]/96 text-[#ede8dc] shadow-xl';
      case 'build':
        return 'border-[#42593f] bg-[#141b16]/96 text-[#ede8dc] shadow-xl';
      case 'levelup':
        return 'border-[#c29b38] bg-[#1e1b12]/98 text-[#dfb74a] shadow-2xl';
      default:
        return 'border-[#2d3840] bg-[#161c20]/96 text-[#ede8dc]';
    }
  };

  return (
    <>
      {/* ================= FLOATING TOAST STACK (TOP-CENTER) ================= */}
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none w-full max-w-md px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto w-full p-3 rounded-xl border-2 backdrop-blur-md flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300 transition-all ${getToastColors(
              toast.type
            )}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-black/40 border border-white/10 shrink-0">
                {getToastIcon(toast.type)}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold font-serif tracking-wide truncate">
                  {toast.title}
                </h4>
                {toast.subtitle && (
                  <p className="text-[11px] font-mono opacity-90 truncate mt-0.5">
                    {toast.subtitle}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="p-1 rounded-md text-white/60 hover:text-white hover:bg-black/30 transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* ================= LEVEL-UP CELEBRATION MODAL ================= */}
      {levelUpCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-[#8f7742] bg-[#14181b] p-6 text-[#ede8dc] shadow-2xl relative text-center select-none">
            {/* Crown Icon */}
            <div className="mx-auto w-14 h-14 rounded-full border border-[#8f7742] bg-[#1f262c] flex items-center justify-center shadow-md mb-3">
              <Crown size={26} className="text-[#c29b38]" />
            </div>

            <span className="text-[10px] font-mono font-bold tracking-widest text-[#aba393] uppercase">
              Civilisation Progression
            </span>
            <h2 className="text-2xl font-bold text-[#ede8dc] mt-0.5 tracking-wide">
              LEVEL {levelUpCelebration.level} ATTAINED
            </h2>
            <p className="text-xs text-[#8a8376] mt-0.5 font-mono">
              Era: {levelUpCelebration.era} · Settlement Authority Elevated
            </p>

            {/* Unlocked Perks List */}
            <div className="my-5 p-3 rounded-lg bg-[#0f1214] border border-[#232b30] text-left space-y-2">
              <span className="text-[9px] font-mono font-bold text-[#c29b38] uppercase tracking-wider block">
                Ascension Unlocks
              </span>
              {levelUpCelebration.perks.map((perk, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-[#ede8dc]">
                  <CheckCircle2 size={13} className="text-[#7ea376] shrink-0" />
                  <span>{perk}</span>
                </div>
              ))}
            </div>

            {/* Confirmation Button */}
            <button
              onClick={dismissLevelUp}
              className="w-full py-2.5 rounded-md btn-game-gold text-xs font-bold tracking-wide uppercase shadow-md flex items-center justify-center gap-1.5"
            >
              <Coins size={14} />
              <span>Claim Ascension Bounty & Continue</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

