import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import IntroScene from './IntroScene';
import LogoReveal from './LogoReveal';
import IntroControls from './IntroControls';
import { introSoundEngine } from './IntroSound';
import './intro.css';

interface CivoraIntroProps {
  onComplete: () => void;
}

export default function CivoraIntro({ onComplete }: CivoraIntroProps) {
  // Scene timeline:
  // Scene 1 (0–2.0s): The Age Before Civilisation
  // Scene 2 (2.0–4.2s): The Ancient Gates
  // Scene 3 (4.2–7.0s): The CIVORA Emblem Forging
  // Scene 4 (7.0–9.2s): The Name of a Civilisation
  // Scene 5 (9.2–11.8s): Transition into the World
  const [currentScene, setCurrentScene] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  const TOTAL_DURATION_MS = 11800;
  const startTimeRef = useRef<number>(Date.now());
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Check reduced motion preference
    if (typeof window !== 'undefined') {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        onComplete();
        return;
      }
    }

    // Start Scene 1 Sound immediately
    try {
      introSoundEngine.playScene1();
    } catch (e) {}

    // Timeline triggers
    const t2 = setTimeout(() => {
      setCurrentScene(2);
      introSoundEngine.playScene2();
    }, 2000);

    const t3 = setTimeout(() => {
      setCurrentScene(3);
      introSoundEngine.playScene3();
    }, 4200);

    const t4 = setTimeout(() => {
      setCurrentScene(4);
      introSoundEngine.playScene4();
    }, 7000);

    const t5 = setTimeout(() => {
      setCurrentScene(5);
      introSoundEngine.playScene5();
    }, 9200);

    const tEnd = setTimeout(() => {
      handleComplete();
    }, TOTAL_DURATION_MS);

    timerRefs.current = [t2, t3, t4, t5, tEnd];

    // Progress counter
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(100, (elapsed / TOTAL_DURATION_MS) * 100);
      setProgressPercent(pct);
      if (pct >= 100) {
        clearInterval(progressInterval);
      }
    }, 50);

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      timerRefs.current.forEach((t) => clearTimeout(t));
      clearInterval(progressInterval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleToggleMute = () => {
    const muted = introSoundEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleComplete = () => {
    if (isExiting) return;
    setIsExiting(true);
    introSoundEngine.stop();
    setTimeout(() => {
      onComplete();
    }, 850);
  };

  const handleSkip = () => {
    handleComplete();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#050806] overflow-hidden select-none"
      >
        {/* Theatrical Anamorphic 2.39:1 Frame */}
        <div className="absolute top-0 left-0 right-0 h-[4.5vh] bg-black z-40 border-b border-[#dfb74a]/20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-[4.5vh] bg-black z-40 border-t border-[#dfb74a]/20 pointer-events-none" />

        {/* 3D Atmospheric Background & Stone Gates */}
        <IntroScene currentScene={currentScene} />

        {/* Monumental CIVORA Emblem & Logo Forging */}
        <LogoReveal currentScene={currentScene} />

        {/* Non-intrusive Cinematic UI Controls */}
        <IntroControls
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onSkip={handleSkip}
          currentScene={currentScene}
          progressPercent={progressPercent}
        />
      </motion.div>
    </AnimatePresence>
  );
}
