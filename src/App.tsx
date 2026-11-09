import React, { useState, useEffect } from 'react';
import { GameStateProvider, useGameState } from './context/GameStateContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GraphicsProvider } from './context/GraphicsSettingsContext';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import BottomControls from './components/layout/BottomControls';
import RightInfoPanel from './components/layout/RightInfoPanel';
import GameModals from './components/layout/GameModals';
import FloatingRewardBanner from './components/game/FloatingRewardBanner';
import ProtestResolutionModal from './components/game/ProtestResolutionModal';
import DemoShowcaseModal from './components/game/DemoShowcaseModal';
import TutorialModal from './components/game/TutorialModal';
import KeyboardShortcutsModal from './components/game/KeyboardShortcutsModal';
import CS2BudgetModal from './components/cs2/CS2BudgetModal';
import CS2StatisticsModal from './components/cs2/CS2StatisticsModal';

// Pages - Direct imports for critical initial path
import WorldExplorerPage from './pages/WorldExplorerPage';
import CivoraLanding from './pages/CivoraLanding';
import CivoraAuthPage from './pages/CivoraAuthPage';

// Lazy-loaded secondary pages to minimize initial bundle size and eliminate loading latency
const WorldDashboard = React.lazy(() => import('./pages/WorldDashboard'));
const CouncilPage = React.lazy(() => import('./features/council/pages/CouncilPage'));
const PopulationPage = React.lazy(() => import('./pages/PopulationPage'));
const InfrastructurePage = React.lazy(() => import('./pages/InfrastructurePage'));
const ChroniclesPage = React.lazy(() => import('./pages/ChroniclesPage'));
const MissionsPage = React.lazy(() => import('./pages/MissionsPage'));
const EconomyPage = React.lazy(() => import('./pages/EconomyPage'));
const ResourcesPage = React.lazy(() => import('./pages/ResourcesPage'));
const TechnologyPage = React.lazy(() => import('./pages/TechnologyPage'));
const PolicyLaboratoryPage = React.lazy(() => import('./pages/PolicyLaboratoryPage'));
const FutureSimulatorPage = React.lazy(() => import('./pages/FutureSimulatorPage'));
const ResearchObservatoryPage = React.lazy(() => import('./pages/ResearchObservatoryPage'));
const ResearchWalletPage = React.lazy(() => import('./pages/ResearchWalletPage'));
const AchievementsPage = React.lazy(() => import('./pages/AchievementsPage'));
const GenesisPortalPage = React.lazy(() => import('./pages/GenesisPortalPage'));
const WorldCreationStudioPage = React.lazy(() => import('./pages/WorldCreationStudioPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const AdminConsolePage = React.lazy(() => import('./pages/AdminConsolePage'));
import PerformanceDashboardModal from './components/diagnostics/PerformanceDashboardModal';
import { soundFx } from './services/soundFx';

// ============================================================
// App flow state type
// ============================================================
type AppStage = 'landing' | 'auth' | 'app';

function GameApp() {
  const [activePage, setActivePage] = useState<string>('World Explorer');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(false);
  const [isPerformanceDashboardOpen, setIsPerformanceDashboardOpen] = useState<boolean>(false);
  const {
    togglePlay,
    setSpeed,
    selectedBuilding,
    selectedBuildingId,
    setConstructionMode,
    undo,
    redo,
    isBulldozerActive,
    setIsBulldozerActive,
    activeZoneTool,
    setActiveZoneTool,
    activeInfoView,
    setActiveInfoView,
    isChirperOpen,
    setIsChirperOpen,
    isMilestonesModalOpen,
    setIsMilestonesModalOpen,
    isTutorialOpen,
    setIsTutorialOpen,
    isShortcutsOpen,
    setIsShortcutsOpen,
    isBudgetOpen,
    setIsBudgetOpen,
    isStatisticsOpen,
    setIsStatisticsOpen,
  } = useGameState();
  const { isAuthenticated, isLoading, logout, user, isAdmin } = useAuth();

  // App-level navigation stage: Always start on auth page as required
  const [stage, setStage] = useState<AppStage>('auth');

  // Auto-open tactical inspector when a building is selected in 3D world
  useEffect(() => {
    if (selectedBuildingId) {
      setIsRightPanelOpen(true);
    }
  }, [selectedBuildingId]);

  // Handle Navigation across Civora Empire & Shell
  const handleNavigate = (page: string) => {
    soundFx.playClick();
    if (page === 'CIVORA Landing') {
      setStage('landing');
    } else if (page === 'Genesis Portal') {
      setActivePage('Genesis Portal');
    } else {
      setActivePage(page);
    }
  };

  // Keyboard Hotkeys: Space, 1-4, ESC, Ctrl+Z/Y (Undo/Redo), B, Z, I, C, M, ?
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;
      if (e.code === 'Escape') {
        e.preventDefault();
        soundFx.playClick();
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
          return;
        }
        if (isTutorialOpen) {
          setIsTutorialOpen(false);
          return;
        }
        if (isBudgetOpen) {
          setIsBudgetOpen(false);
          return;
        }
        if (isStatisticsOpen) {
          setIsStatisticsOpen(false);
          return;
        }
        if (isMilestonesModalOpen) {
          setIsMilestonesModalOpen(false);
          return;
        }
        if (isChirperOpen) {
          setIsChirperOpen(false);
          return;
        }
        if (activePage !== 'World Explorer') {
          setActivePage('World Explorer');
        } else {
          setConstructionMode(false);
          setIsRightPanelOpen(false);
          setIsBulldozerActive(false);
          setActiveZoneTool(null);
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
      } else if (e.key === 'F2' || ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'P' || e.key === 'p'))) {
        e.preventDefault();
        soundFx.playClick();
        setIsPerformanceDashboardOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key.toLowerCase() === 'b' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        soundFx.playClick();
        setIsBulldozerActive(!isBulldozerActive);
      } else if (e.key.toLowerCase() === 'z' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        soundFx.playClick();
        setActiveZoneTool(activeZoneTool ? null : 'residential_high');
      } else if (e.key.toLowerCase() === 'i' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        soundFx.playClick();
        setActiveInfoView(activeInfoView === 'none' ? 'electricity' : 'none');
      } else if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        soundFx.playClick();
        setIsChirperOpen(!isChirperOpen);
      } else if (e.key.toLowerCase() === 'm' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        soundFx.playClick();
        setIsMilestonesModalOpen(!isMilestonesModalOpen);
      } else if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        soundFx.playClick();
        setIsShortcutsOpen(!isShortcutsOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    togglePlay,
    setSpeed,
    activePage,
    setConstructionMode,
    undo,
    redo,
    isBulldozerActive,
    setIsBulldozerActive,
    activeZoneTool,
    setActiveZoneTool,
    activeInfoView,
    setActiveInfoView,
    isChirperOpen,
    setIsChirperOpen,
    isMilestonesModalOpen,
    setIsMilestonesModalOpen,
    isShortcutsOpen,
    setIsShortcutsOpen,
  ]);

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
      case 'The Council':
      case 'Council':
      case 'Council of Advisors':
        return <CouncilPage onNavigate={handleNavigate} onClose={handleClose} />;
      case 'Infrastructure':
        return <InfrastructurePage onNavigate={handleNavigate} onClose={handleClose} />;
      case 'Civilisation Chronicle':
      case 'Chronicle':
        return <ChroniclesPage onClose={handleClose} />;
      case 'Missions & Challenges':
      case 'Missions':
        return <MissionsPage onClose={handleClose} />;
      case 'Technology Tree':
      case 'Technology':
        return <TechnologyPage onClose={handleClose} />;
      case 'Economy & Resources':
      case 'Economy':
        return <EconomyPage onClose={handleClose} />;
      case 'Resources':
        return <ResourcesPage />;
      case 'Population':
        return (
          <div className="relative w-full h-full flex flex-col justify-start">
            <PopulationPage onClose={handleClose} />
          </div>
        );
      case 'Policy Laboratory':
        return <PolicyLaboratoryPage onClose={handleClose} />;
      case 'Future Simulator':
        return <FutureSimulatorPage onClose={handleClose} />;
      case 'Research Observatory':
        return <ResearchObservatoryPage onClose={handleClose} />;
      case 'Research Wallet':
        return <ResearchWalletPage onClose={handleClose} />;
      case 'Achievements':
        return <AchievementsPage onClose={handleClose} />;
      case 'Genesis Portal':
        return <GenesisPortalPage onNavigate={handleNavigate} />;
      case 'World Creation Studio':
        return <WorldCreationStudioPage onNavigate={handleNavigate} />;
      case 'Settings':
        return <SettingsPage onClose={handleClose} />;
      case 'Admin Console':
        return <AdminConsolePage />;
      default:
        return null;
    }
  };

  // ── STAGE 1: LANDING PAGE ──────────────────────────────────
  if (stage === 'landing') {
    return (
      <CivoraLanding
        onNavigate={(page) => {
          if (
            page === 'World Explorer' ||
            page === 'World Creation Studio' ||
            page === 'Research Observatory' ||
            page === 'Achievements'
          ) {
            // Require auth before entering the app
            setStage('auth');
            // Store the intended destination to navigate after auth
            setActivePage(page);
          } else {
            handleNavigate(page);
          }
        }}
      />
    );
  }

  // ── STAGE 2: AUTH PAGE ─────────────────────────────────────
  if (stage === 'auth') {
    return (
      <CivoraAuthPage
        onAuthenticated={() => setStage('app')}
        onBackToLanding={() => setStage('landing')}
      />
    );
  }

  // ── STAGE 3: MAIN APPLICATION ──────────────────────────────
  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#151916] text-[#e8e9e3] font-sans">
      {/* Global Compact Strategy Sidebar */}
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />

      {/* Main Game Stage */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Top Resource HUD — includes user badge + logout */}
        <Topbar
          isRightPanelOpen={isRightPanelOpen}
          onToggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
          user={user}
          onLogout={() => {
            logout();
            setStage('auth');
          }}
          onNavigate={handleNavigate}
          onOpenDiagnostics={() => setIsPerformanceDashboardOpen(true)}
        />

        {/* 3D World Stage + Tactile Game Overlays */}
        <div className="flex-1 min-h-0 flex overflow-hidden relative">
          {/* PERSISTENT 3D WORLD: Frameloop pauses when an overlay page is open to eliminate GPU contention & lag */}
          <div className="absolute inset-0 z-0">
            <WorldExplorerPage
              isPaused={activePage !== 'World Explorer'}
              onOpenTech={() => setActivePage('Technology')}
              onOpenEconomy={() => setActivePage('Economy')}
            />
          </div>

          {/* GAME OVERLAYS: Opens as cinematic strategy screens over the 3D world */}
          {activePage !== 'World Explorer' && (
            <div className="absolute inset-0 z-20 flex flex-col overflow-y-auto custom-scrollbar bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
              <React.Suspense
                fallback={
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-[#C5A66A] space-y-3">
                    <div className="w-7 h-7 rounded-full border-2 border-[#C5A66A] border-t-transparent animate-spin" />
                    <span className="font-serif text-[11px] uppercase tracking-widest text-[#EAE3D2]">
                      Loading Imperial Module...
                    </span>
                  </div>
                }
              >
                {renderOverlay()}
              </React.Suspense>
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
      <PerformanceDashboardModal
        isOpen={isPerformanceDashboardOpen}
        onClose={() => setIsPerformanceDashboardOpen(false)}
      />
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => {
          setIsTutorialOpen(false);
          try {
            localStorage.setItem('genesis_tutorial_seen', 'true');
          } catch {}
        }}
      />
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
      <CS2BudgetModal
        isOpen={isBudgetOpen}
        onClose={() => setIsBudgetOpen(false)}
      />
      <CS2StatisticsModal
        isOpen={isStatisticsOpen}
        onClose={() => setIsStatisticsOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GameStateProvider>
        <GraphicsProvider>
          <GameApp />
        </GraphicsProvider>
      </GameStateProvider>
    </AuthProvider>
  );
}
