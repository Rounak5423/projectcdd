import React, { useState } from 'react';
import LandingNavbar from '../components/landing/LandingNavbar';
import CivoraIntro from '../components/CivoraIntro/CivoraIntro';
import HeroSection from '../components/landing/HeroSection';
import CivilisationArchive from '../components/landing/CivilisationArchive';
import CivilisationPillars from '../components/landing/CivilisationPillars';
import EraTimeline from '../components/landing/EraTimeline';
import ResearchEconomy from '../components/landing/ResearchEconomy';
import ResearchObservatory from '../components/landing/ResearchObservatory';
import PlayerLegacy from '../components/landing/PlayerLegacy';
import FinalCTA from '../components/landing/FinalCTA';
import LandingFooter from '../components/landing/LandingFooter';
import { useGameState } from '../context/GameStateContext';
import { soundFx } from '../services/soundFx';
import '../styles/civora-landing.css';

interface CivoraLandingProps {
  onNavigate: (page: string) => void;
}

export default function CivoraLanding({ onNavigate }: CivoraLandingProps) {
  const { loadMaxDemoWorld, loadCivilization } = useGameState();
  // Heroic Cinematic Brand Introduction & Logo Reveal (9–12s)
  const [showIntro, setShowIntro] = useState<boolean>(true);

  const handleEnterSimulation = () => {
    soundFx.playClick();
    onNavigate('World Explorer');
  };

  const handleBeginCivilisation = () => {
    soundFx.playClick();
    onNavigate('World Creation Studio');
  };

  const handleSelectWorld = (worldId: string) => {
    soundFx.playClick();
    if (worldId === 'kyoto-prime') {
      loadMaxDemoWorld();
    } else {
      loadCivilization(worldId);
    }
    onNavigate('World Explorer');
  };

  const handleNavigateSection = (sectionId: string) => {
    soundFx.playClick();
    const elem = document.getElementById(sectionId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#060b07] text-[#eae3d2] selection:bg-[#3c5938] selection:text-[#faecd0] overflow-x-hidden">
      {/* 1. CINEMATIC BRAND INTRODUCTION & LOGO REVEAL (THE AWAKENING) */}
      {showIntro && (
        <CivoraIntro onComplete={() => setShowIntro(false)} />
      )}

      {/* 2. REFINED STICKY NAVIGATION */}
      <LandingNavbar
        onEnterSimulation={handleEnterSimulation}
        onNavigateSection={handleNavigateSection}
        onWatchPrologue={() => setShowIntro(true)}
      />

      {/* 3. HERO SECTION — THE BIRTH OF CIVILISATION (BALANCED ASPECT RATIO) */}
      <HeroSection
        onBeginCivilisation={handleBeginCivilisation}
        onContinueLegacy={handleEnterSimulation}
        onExploreMore={() => handleNavigateSection('archive')}
        onWatchPrologue={() => setShowIntro(true)}
      />

      {/* 4. THE CIVILISATION ARCHIVE — SAVED WORLDS */}
      <CivilisationArchive
        onSelectWorld={handleSelectWorld}
        onCreateNewWorld={handleBeginCivilisation}
      />

      {/* 5. THE FOUR PILLARS OF CIVILISATION */}
      <CivilisationPillars />

      {/* 6. CIVILISATION PROGRESSION — FROM SETTLEMENT TO EMPIRE */}
      <EraTimeline />

      {/* 7. RESEARCH ECONOMY — EARN YOUR DISCOVERIES */}
      <ResearchEconomy />

      {/* 8. RESEARCH OBSERVATORY — THE FUTURE OF CIVILISATION */}
      <ResearchObservatory
        onEnterObservatory={() => {
          soundFx.playClick();
          onNavigate('Research Observatory');
        }}
      />

      {/* 9. PLAYER LEGACY AND ACHIEVEMENTS */}
      <PlayerLegacy
        onViewAllAchievements={() => {
          soundFx.playClick();
          onNavigate('Achievements');
        }}
      />

      {/* 10. FINAL CALL TO ACTION — THE GATES OF CIVORA */}
      <FinalCTA onFoundCivilisation={handleBeginCivilisation} />

      {/* 11. MONUMENTAL ARCHIVAL FOOTER */}
      <LandingFooter
        onNavigateSection={handleNavigateSection}
        onEnterSimulation={handleEnterSimulation}
        onCreateNewWorld={handleBeginCivilisation}
      />
    </div>
  );
}

