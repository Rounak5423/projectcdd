import React, { useState, useEffect } from 'react';
import { GameStateProvider, useGameState } from './context/GameStateContext';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import BottomControls from './components/layout/BottomControls';
import RightInfoPanel from './components/layout/RightInfoPanel';
import GameModals from './components/layout/GameModals';
import FloatingRewardBanner from './components/game/FloatingRewardBanner';
import AuthModal from './components/auth/AuthModal';
import { AuthProvider, useAuth } from './context/AuthContext';

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
import AdminConsolePage from './pages/AdminConsolePage';

function GameApp() {
  const [activePage, setActivePage] = useState<string>('Overview');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(false);
  const { togglePlay, setSpeed, selectedBuilding } = useGameState();
  const { isAdmin } = useAuth();

  // Strict RBAC Guard: If user is not admin and activePage is Admin Console, instantly redirect to Overview
  useEffect(() => {
    if (!isAdmin && activePage === 'Admin Console') {
      setActivePage('Overview');
    }
  }, [isAdmin, activePage]);

  // Auto-open tactical inspector when a building is selected in 3D world
  useEffect(() => {
    if (selectedBuilding) {
      setIsRightPanelOpen(true);
    }
  }, [selectedBuilding]);

  // Keyboard Hotkeys (Space to Pause/Play, 1-4 for Speed)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (e.code === 'Space') {
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
  }, [togglePlay, setSpeed]);

  const renderContent = () => {
    switch (activePage) {
      case 'Overview':
        return <WorldDashboard onNavigate={setActivePage} />;
      case 'World Explorer':
        return <WorldExplorerPage />;
      case 'Population':
        return <PopulationPage />;
      case 'Economy':
        return <EconomyPage />;
      case 'Infrastructure':
        return <InfrastructurePage onNavigate={setActivePage} />;
      case 'Resources':
        return <ResourcesPage />;
      case 'Technology':
        return <TechnologyPage />;
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
        return <GenesisPortalPage onNavigate={setActivePage} />;
      case 'World Creation Studio':
        return <WorldCreationStudioPage onNavigate={setActivePage} />;
      case 'Settings':
        return <SettingsPage />;
      case 'Admin Console':
        return isAdmin ? <AdminConsolePage /> : <WorldDashboard onNavigate={setActivePage} />;
      default:
        return <WorldDashboard onNavigate={setActivePage} />;
    }
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#151916] text-[#e8e9e3] font-sans">
      {/* Global Sidebar Navigation */}
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      {/* Main Game Stage */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Top Resource HUD */}
        <Topbar
          isRightPanelOpen={isRightPanelOpen}
          onToggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
        />

        {/* Dynamic Center Work Area + Tactical Inspector */}
        <div className="flex-1 min-h-0 flex overflow-hidden relative">
          <div className="flex-1 min-w-0 overflow-y-auto custom-scrollbar relative">
            {renderContent()}
          </div>

          {/* Right Information Panel (Context-specific Game HUD) */}
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

      {/* Game Modals & Drawers */}
      <GameModals />

      {/* Authentication & User Role Selector Modal */}
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GameStateProvider>
        <GameApp />
      </GameStateProvider>
    </AuthProvider>
  );
}
