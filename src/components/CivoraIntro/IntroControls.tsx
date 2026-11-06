import React from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, ArrowRight, Sparkles } from 'lucide-react';

interface IntroControlsProps {
  isMuted: boolean;
  onToggleMute: () => void;
  onSkip: () => void;
  currentScene: number;
  progressPercent: number; // 0 to 100
}

export default function IntroControls({
  isMuted,
  onToggleMute,
  onSkip,
  currentScene,
  progressPercent,
}: IntroControlsProps) {
  const sceneLabels = [
    'SCENE I: THE AGE BEFORE CIVILISATION',
    'SCENE II: THE ANCIENT GATES',
    'SCENE III: THE FORGING OF THE EMBLEM',
    'SCENE IV: THE NAME OF A CIVILISATION',
    'SCENE V: AWAKENING OF THE WORLD',
  ];

  return (
    <div className="absolute inset-0 pointer-events-none z-50 flex flex-col justify-between p-6 sm:p-8 select-none">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        {/* Left: Current Cinematic Act Label */}
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#0a100c]/80 border border-[#dfb74a]/40 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-[#dfb74a] animate-ping" />
          <span
            className="text-[10px] sm:text-[11px] font-mono tracking-widest uppercase text-[#faecd0]"
          >
            {sceneLabels[currentScene - 1] ?? sceneLabels[0]}
          </span>
        </div>

        {/* Right: Audio Toggle & Skip Action */}
        <div className="flex items-center gap-3">
          {/* Mute/Unmute Audio Button */}
          <button
            onClick={onToggleMute}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0a100c]/85 border border-[#dfb74a]/50 hover:border-[#dfb74a] text-[#dfb74a] text-[10px] font-mono tracking-wider uppercase backdrop-blur-md shadow-xl transition-all cursor-pointer"
            title={isMuted ? 'Unmute Orchestral Soundtrack' : 'Mute Soundtrack'}
          >
            {isMuted ? (
              <>
                <VolumeX size={13} className="text-[#8e8574]" />
                <span className="hidden sm:inline">MUTED</span>
              </>
            ) : (
              <>
                <Volume2 size={13} className="text-[#faecd0] animate-pulse" />
                <span className="hidden sm:inline">ORCHESTRA</span>
                <div className="flex items-center gap-0.5 ml-0.5">
                  <span className="w-0.5 h-2 bg-[#dfb74a] animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <span className="w-0.5 h-3 bg-[#faecd0] animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <span className="w-0.5 h-1.5 bg-[#dfb74a] animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </>
            )}
          </button>

          {/* Skip Intro Button */}
          <button
            onClick={onSkip}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0a100c]/85 border border-[#dfb74a]/50 hover:border-[#dfb74a] text-[#dfb74a] hover:text-[#faecd0] text-[10px] font-mono tracking-wider uppercase backdrop-blur-md shadow-xl transition-all hover:scale-105 cursor-pointer"
            title="Skip Cinematic Sequence (ESC or Space)"
          >
            <span>SKIP INTRO</span>
            <span className="text-[9px] text-[#8e8574] px-1.5 py-0.5 rounded bg-black/60 border border-[#8e8574]/40 font-mono">
              ESC
            </span>
            <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* Bottom Progress Bar */}
      <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-2 pointer-events-auto">
        <div className="w-full h-0.5 bg-[#1a261c] rounded-full overflow-hidden relative border border-[#c5a66a]/20">
          <motion.div
            className="h-full bg-gradient-to-r from-[#8c6e33] via-[#dfb74a] to-[#faecd0]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between w-full text-[9px] font-mono text-[#8c6e33] tracking-widest px-1">
          <span>CIVORA ORIGINAL OVERTURE</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
      </div>
    </div>
  );
}

