import React, { useState, useEffect } from 'react';
import { GameStateProvider, useGameState } from './context/GameStateContext';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import BottomControls from './components/layout/BottomControls';
import RightInfoPanel from './components/layout/RightInfoPanel';
import GameModals from './components/layout/GameModals';
import FloatingRewardBanner from './components/game/FloatingRewardBanner';
import ProtestResolutionModal from './components/game/ProtestResolutionModal';
import DemoShowcaseModal from './components/game/DemoShowcaseModal';

// Pages
import WorldDashboard from './pages/WorldDashboard';
import WorldExplorerPage from './pages/WorldExplorerPage';
import PopulationPage from './pages/PopulationPage';
import EconomyPage from './pages/EconomyPage';
import InfrastructurePage from './pages/InfrastructurePage';
import ResourcesPage from './pages/ResourcesPage';
import TechnologyPage from './pages/TechnologyPage';
import PolicyLaboratoryPage from './pages/PolicyLaboratoryPage';
import FutureSimulatorPage from './pages/FutureSimulatorPage';
import ResearchObservatoryPage from './pages/ResearchObservatoryPage';
import ResearchWalletPage from './pages/ResearchWalletPage';
import AchievementsPage from './pages/AchievementsPage';
import GenesisPortalPage from './pages/GenesisPortalPage';
import WorldCreationStudioPage from './pages/WorldCreationStudioPage';
import SettingsPage from './pages/SettingsPage';
import { soundFx } from './services/soundFx';

function GameApp() {
  // Default to the 3D World Viewport immediately on launch
  const [activePage, setActivePage] = useState<string>('World Explorer');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(false);
  const { togglePlay, setSpeed, selectedBuilding, setConstructionMode } = useGameState();

  // Auto-open tactical inspector when a building is selected in 3D world
  useEffect(() => {
    if (selectedBuilding) {
      setIsRightPanelOpen(true);
    }
  }, [selectedBuilding]);

  // Handle Infrastructure click: seamlessly trigger 3D Construction Mode
  const handleNavigate = (page: string) => {
    soundFx.playClick();
    if (page === 'Infrastructure') {
      setActivePage('World Explorer');
      setConstructionMode(true);
    } else {
      setActivePage(page);
    }
  };

  // Keyboard Hotkeys: Space (Play/Pause), 1-4 (Speed), ESC (Return to 3D World)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (e.code === 'Escape') {
        e.preventDefault();
        soundFx.playClick();
        if (activePage !== 'World Explorer') {
          setActivePage('World Explorer');
        } else {
          setConstructionMode(false);
          setIsRightPanelOpen(false);
        }
      } else if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === '1') {
        setSpeed('1x');
      } else if (e.key === '2') {
        setSpeed('2x');
      } else if (e.key === '3') {
        setSpeed('5x');
      } else if (e.key === '4') {
        setSpeed('10x');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, setSpeed, activePage, setConstructionMode]);

  // Render modal overlays when not in pure World Explorer
  const renderOverlay = () => {
    const handleClose = () => {
      soundFx.playClick();
      setActivePage('World Explorer');
    };

    switch (activePage) {
      case 'Overview':
        return (
          <div className="relative w-full h-full flex flex-col justify-start">
            <WorldDashboard onNavigate={handleNavigate} onClose={handleClose} />
          </div>
        );
      case 'Technology':
        return <TechnologyPage onClose={handleClose} />;
      case 'Economy':
        return <EconomyPage onClose={handleClose} />;
      case 'Population':
        return (
          <div className="relative w-full h-full flex flex-col justify-start">
            <PopulationPage />
          </div>
        );
      case 'Policy Laboratory':
        return <PolicyLaboratoryPage />;
      case 'Future Simulator':
        return <FutureSimulatorPage />;
      case 'Research Observatory':
        return <ResearchObservatoryPage />;
      case 'Research Wallet':
        return <ResearchWalletPage />;
      case 'Achievements':
        return <AchievementsPage />;
      case 'Genesis Portal':
        return <GenesisPortalPage onNavigate={handleNavigate} />;
      case 'World Creation Studio':
        return <WorldCreationStudioPage onNavigate={handleNavigate} />;
      case 'Settings':
        return <SettingsPage />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#151916] text-[#e8e9e3] font-sans">
      {/* Global Compact Strategy Sidebar */}
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />

      {/* Main Game Stage */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Top Resource HUD */}
        <Topbar
          isRightPanelOpen={isRightPanelOpen}
          onToggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
        />

        {/* 3D World Stage + Tactile Game Overlays */}
        <div className="flex-1 min-h-0 flex overflow-hidden relative">
          {/* PERSISTENT 3D WORLD: Never gets unmounted, always alive */}
          <div className="absolute inset-0 z-0">
            <WorldExplorerPage
              onOpenTech={() => setActivePage('Technology')}
              onOpenEconomy={() => setActivePage('Economy')}
            />
          </div>

          {/* GAME OVERLAYS: Opens as cinematic strategy screens over the 3D world */}
          {activePage !== 'World Explorer' && (
            <div className="absolute inset-0 z-20 flex flex-col overflow-y-auto custom-scrollbar bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
              {renderOverlay()}
            </div>
          )}

          {/* Right Information Panel (Inspector HUD) */}
          <RightInfoPanel
            isOpen={isRightPanelOpen}
            onClose={() => setIsRightPanelOpen(false)}
          />
        </div>

        {/* Bottom Simulation Bar */}
        <BottomControls />
      </main>

      {/* Floating Rewards & Level Up Celebrations */}
      <FloatingRewardBanner />

      {/* Game Modals, Drawers & Protest Chronicle */}
      <GameModals />
      <ProtestResolutionModal />
      <DemoShowcaseModal onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <GameStateProvider>
      <GameApp />
    </GameStateProvider>
  );
}
