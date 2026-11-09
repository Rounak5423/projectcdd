import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import {
  CivilizationProfile,
  ResourceState,
  ResourceRates,
  BuildingCatalogItem,
  PlacedBuilding,
  District,
  Technology,
  Policy,
  SimulationScenario,
  Experiment,
  Achievement,
  GameEvent,
  Citizen,
  ProtestEvent,
  ZoneType,
  InfoViewType,
  RciDemand,
  ChirperMessage,
  CityMilestone,
  ZonedTile,
  UtilityStats,
  CivoraMission,
  ChronicleEntry,
  ResearchTransaction,
  MapTerrainType,
} from '../types/game';
import {
  initialCivilization,
  demoMetropolisCivilization,
  alternateWorlds,
  initialResources,
  demoMetropolisResources,
  initialRates,
  demoMetropolisRates,
  initialDistricts,
  demoMetropolisDistricts,
  buildingCatalog,
  initialPlacedBuildings,
  demoMetropolisBuildings,
  initialTechnologies,
  initialPolicies,
  initialCitizens,
  demoMetropolisCitizens,
  simulationScenarios,
  initialExperiments,
  initialAchievements,
  initialEvents,
  initialChronicleEntries,
  initialMissions,
  initialTransactions,
  historicalErasList,
  playerTitlesList,
  HistoricalEraDefinition,
  PlayerTitle,
} from '../data/initialGameData';
import { historicalTwinProtests } from '../data/protestData';
import {
  initialChirperMessages,
  initialCityMilestones,
  initialZonedTiles,
  calculateRciDemand,
  calculateUtilityStats,
  generateRandomChirp,
} from '../data/cs2Data';
import { soundFx } from '../services/soundFx';
import { civilizationApi } from '../services/civilizationApi';
import { civoraEventClient } from '../services/realtime/CivoraEventClient';
import { getCitadelTerritoryRadius } from '../components/world3d/placementValidation';
import {
  saveGameStateToStorage,
  loadActiveGameStateFromStorage,
  loadGameStateForWorld,
  CivoraSavedGameState,
} from '../services/storage/gameStateStorage';

export function getCitadelNameForLevel(level: number): string {
  switch (Math.max(1, Math.min(5, Math.round(level)))) {
    case 1:
      return 'Frontier Colony Outpost';
    case 2:
      return 'Frontier Civic Forum';
    case 3:
      return 'High Council Citadel';
    case 4:
      return 'Planetary Senate Citadel';
    case 5:
      return 'Imperial High Citadel';
    default:
      return 'High Council Citadel';
  }
}

export function calculateBuildingUpgradeCost(
  building: PlacedBuilding,
  catalogItem?: BuildingCatalogItem
): { materials: number; money: number } {
  const isCitadel = building.modelType === 'citadel' || building.catalogId === 'bld-gov-citadel';
  const targetLvl = building.level + 1;

  if (isCitadel) {
    switch (targetLvl) {
      case 2:
        return { money: 1200, materials: 850 };
      case 3:
        return { money: 3800, materials: 2600 };
      case 4:
        return { money: 9500, materials: 6800 };
      case 5:
        return { money: 24000, materials: 16500 };
      default:
        return { money: 1200, materials: 850 };
    }
  }

  // Building upgrades become progressively tougher after each level
  const baseMat = catalogItem?.costMaterials ?? 160;
  const baseMoney = catalogItem?.costCredits ?? 100;

  let multiplier = 1.8;
  if (targetLvl === 3) multiplier = 4.5;
  else if (targetLvl === 4) multiplier = 10.5;
  else if (targetLvl >= 5) multiplier = 24.0;

  return {
    materials: Math.round(baseMat * multiplier),
    money: Math.round(baseMoney * multiplier),
  };
}
import {
  calculateCitySimulation,
  CitySimulationReport,
} from '../simulation/economySimulationEngine';
import {
  DisasterType,
  DisasterIntensity,
  DisasterSimulationState,
} from '../types/disaster';
import {
  calculateDisasterRisks,
  calculateEmergencyForces,
  createDisaster,
  advanceDisasterSimulation,
  emergencyFullCivilizationRestoration,
} from '../simulation/disasterSimulationEngine';
import {
  CitizenSimulationReport,
  DetailedCitizenAgent,
} from '../types/citizen';
import {
  runCitizenSimulationTick,
  createInitialDetailedAgents,
  calculateCitizenNeeds,
  updateCitizenRoutines,
} from '../simulation/citizenSimulationEngine';

export type MapLayer = 'all' | 'infrastructure' | 'population' | 'resources' | 'environment' | 'economy';
export type ActiveDrawer =
  | 'none'
  | 'notifications'
  | 'codex'
  | 'timeline'
  | 'construction'
  | 'buildingInspector'
  | 'economy'
  | 'disaster'
  | 'citizens';

export interface GameToast {
  id: string;
  type: 'reward' | 'eureka' | 'build' | 'levelup' | 'info';
  title: string;
  subtitle?: string;
  icon?: string;
}

export interface GameQuest {
  id: string;
  title: string;
  category: 'Expansion' | 'Science' | 'Economy' | 'Ecology';
  target: string;
  progress: number;
  maxProgress: number;
  rewardGrc: number;
  rewardXp: number;
  isCompleted: boolean;
  isClaimed: boolean;
}

export const initialQuests: GameQuest[] = [
  {
    id: 'quest-1',
    title: 'Agrisector Expansion',
    category: 'Expansion',
    target: 'Maintain 2 Operational Bio-Dome Facilities',
    progress: 2,
    maxProgress: 2,
    rewardGrc: 150,
    rewardXp: 250,
    isCompleted: true,
    isClaimed: false,
  },
  {
    id: 'quest-2',
    title: 'Renewable Power Dominance',
    category: 'Ecology',
    target: 'Generate over 100 MW of renewable power',
    progress: 85,
    maxProgress: 100,
    rewardGrc: 200,
    rewardXp: 300,
    isCompleted: false,
    isClaimed: false,
  },
  {
    id: 'quest-3',
    title: 'Quantum Uplift',
    category: 'Science',
    target: 'Unlock Quantum AI in Technology Tree',
    progress: 1,
    maxProgress: 1,
    rewardGrc: 300,
    rewardXp: 450,
    isCompleted: true,
    isClaimed: false,
  },
];

interface GameStateContextType {
  civilization: CivilizationProfile;
  savedWorlds: CivilizationProfile[];
  resources: ResourceState;
  rates: ResourceRates;
  districts: District[];
  placedBuildings: PlacedBuilding[];
  catalog: BuildingCatalogItem[];
  technologies: Technology[];
  policies: Policy[];
  citizens: Citizen[];
  scenarios: SimulationScenario[];
  experiments: Experiment[];
  achievements: Achievement[];
  events: GameEvent[];
  economyReport: CitySimulationReport;
  disasterState: DisasterSimulationState;
  citizenReport: CitizenSimulationReport;
  triggerDisaster: (type: DisasterType, intensity: DisasterIntensity, districtId?: string) => void;
  dispatchEmergencyResponse: () => void;
  restoreAllDisasters: () => void;
  toggleAutoDisasters: () => void;
  quests: GameQuest[];
  missions: CivoraMission[];
  claimMission: (missionId: string) => void;
  chronicle: ChronicleEntry[];
  transactions: ResearchTransaction[];
  eras: HistoricalEraDefinition[];
  playerTitles: PlayerTitle[];
  claimTitle: (titleId: string) => void;
  toasts: GameToast[];
  levelUpCelebration: { level: number; era: string; perks: string[] } | null;
  
  // Simulation controls
  isPlaying: boolean;
  speed: '1x' | '2x' | '5x' | '10x';
  selectedBuildingId: string | null;
  selectedBuilding: PlacedBuilding | null;
  selectedCitizenId: string | null;
  selectedCitizen: DetailedCitizenAgent | null;
  activeLayer: MapLayer;
  isConstructionMode: boolean;
  selectedCatalogItem: BuildingCatalogItem | null;
  activeDrawer: ActiveDrawer;
  relocatingBuildingId: string | null;
  citadelTerritoryRadius: number;
  calculateUpgradeCost: (building: PlacedBuilding) => { materials: number; money: number };
  saveGame: () => boolean;
  lastSavedTimestamp: number | null;
  isSaving: boolean;
  
  // Action Handlers
  togglePlay: () => void;
  setSpeed: (speed: '1x' | '2x' | '5x' | '10x') => void;
  advanceTick: () => void;
  advanceYear: () => void;
  selectBuilding: (id: string | null) => void;
  selectCitizen: (id: string | null) => void;
  setActiveLayer: (layer: MapLayer) => void;
  setConstructionMode: (active: boolean, item?: BuildingCatalogItem | null) => void;
  placeBuilding: (catalogId: string, x: number, z: number, districtId?: string, rotation?: number) => boolean;
  startRelocation: (buildingId: string) => void;
  cancelRelocation: () => void;
  relocateBuilding: (buildingId: string, x: number, z: number, districtId?: string, rotation?: number) => boolean;
  rotateBuilding: (buildingId: string, angleDelta?: number) => void;
  repairBuilding: (buildingId: string) => boolean;
  upgradeBuilding: (buildingId: string) => boolean;
  rushConstruction: (buildingId: string) => boolean;
  cancelConstruction: (buildingId: string) => boolean;
  toggleFacilityActive: (buildingId: string) => void;
  demolishBuilding: (buildingId: string) => void;
  startResearch: (techId: string) => boolean;
  triggerEureka: (techId: string) => void;
  togglePolicy: (policyId: string) => void;
  updatePolicySlider: (policyId: string, value: number) => void;
  addCustomPolicy: (policy: Policy) => void;
  submitPolicyResearchFindings: (policyId: string) => boolean;
  runScenario: (scenarioId: string) => boolean;
  startExperiment: (experimentId: string) => boolean;
  claimAchievement: (achievementId: string) => void;
  claimQuest: (questId: string) => void;
  triggerToast: (toast: Omit<GameToast, 'id'>) => void;
  dismissToast: (id: string) => void;
  dismissLevelUp: () => void;
  createNewCivilization: (data: Partial<CivilizationProfile>) => void;
  loadCivilization: (civId: string) => void;
  markEventRead: (eventId: string) => void;
  setActiveDrawer: (drawer: ActiveDrawer) => void;
  taxRate: number;
  setTaxRate: (rate: number) => void;
  activeProtest: ProtestEvent | null;
  isProtestModalOpen: boolean;
  setIsProtestModalOpen: (open: boolean) => void;
  resolveProtest: (optionId: string) => void;
  triggerNextProtest: () => void;
  isDemoModalOpen: boolean;
  setIsDemoModalOpen: (open: boolean) => void;
  loadMaxDemoWorld: () => void;
  showFireworks: boolean;
  triggerFireworks: () => void;
  isCinematicTour: boolean;
  setIsCinematicTour: (val: boolean | ((prev: boolean) => boolean)) => void;

  // Cities: Skylines II Extensions
  activeInfoView: InfoViewType;
  setActiveInfoView: (view: InfoViewType) => void;
  rciDemand: RciDemand;
  activeZoneTool: ZoneType | null;
  setActiveZoneTool: (tool: ZoneType | null) => void;
  zoneMode: 'brush' | 'marquee';
  setZoneMode: (mode: 'brush' | 'marquee') => void;
  zonedTiles: ZonedTile[];
  paintZoneTile: (x: number, z: number, zoneType: ZoneType) => void;
  chirperFeed: ChirperMessage[];
  likeChirp: (chirpId: string) => void;
  isChirperOpen: boolean;
  setIsChirperOpen: (open: boolean) => void;
  cityMilestones: CityMilestone[];
  isMilestonesModalOpen: boolean;
  setIsMilestonesModalOpen: (open: boolean) => void;
  isBulldozerActive: boolean;
  setIsBulldozerActive: (active: boolean) => void;
  utilityStats: UtilityStats;
  inspectedCitizen: Citizen | null;
  setInspectedCitizen: (citizen: Citizen | null) => void;

  // Undo & Redo History
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;

  // CS2 Modals & Overlays
  isTutorialOpen: boolean;
  setIsTutorialOpen: (open: boolean) => void;
  isShortcutsOpen: boolean;
  setIsShortcutsOpen: (open: boolean) => void;
  isBudgetOpen: boolean;
  setIsBudgetOpen: (open: boolean) => void;
  isStatisticsOpen: boolean;
  setIsStatisticsOpen: (open: boolean) => void;
}

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

export function GameStateProvider({ children }: { children: ReactNode }) {
  // Synchronously load saved game progress from localStorage so the game resumes exactly where the user left off
  const initialSaved = useMemo(() => loadActiveGameStateFromStorage(), []);

  const [civilization, setCivilization] = useState<CivilizationProfile>(() => initialSaved?.civilization || initialCivilization);
  const [savedWorlds, setSavedWorlds] = useState<CivilizationProfile[]>(() => initialSaved?.savedWorlds || alternateWorlds);
  const [resources, setResources] = useState<ResourceState>(() => initialSaved?.resources || initialResources);
  const [rates, setRates] = useState<ResourceRates>(() => initialSaved?.rates || initialRates);
  const [districts, setDistricts] = useState<District[]>(() => initialSaved?.districts || initialDistricts);
  const [placedBuildings, setPlacedBuildings] = useState<PlacedBuilding[]>(() => initialSaved?.placedBuildings || initialPlacedBuildings);
  const [technologies, setTechnologies] = useState<Technology[]>(() => initialSaved?.technologies || initialTechnologies);
  const [policies, setPolicies] = useState<Policy[]>(() => initialSaved?.policies || initialPolicies);
  const [citizens, setCitizens] = useState<Citizen[]>(() => initialSaved?.citizens || initialCitizens);
  const [scenarios] = useState<SimulationScenario[]>(simulationScenarios);
  const [experiments, setExperiments] = useState<Experiment[]>(initialExperiments);
  const [achievements, setAchievements] = useState<Achievement[]>(() => initialSaved?.achievements || initialAchievements);
  const [events, setEvents] = useState<GameEvent[]>(initialEvents);
  const [quests, setQuests] = useState<GameQuest[]>(() => initialSaved?.quests || initialQuests);
  const [missions, setMissions] = useState<CivoraMission[]>(() => initialSaved?.missions || initialMissions);
  const [chronicle, setChronicle] = useState<ChronicleEntry[]>(() => initialSaved?.chronicle || initialChronicleEntries);
  const [transactions, setTransactions] = useState<ResearchTransaction[]>(() => initialSaved?.transactions || initialTransactions);
  const [eras, setEras] = useState<HistoricalEraDefinition[]>(historicalErasList);
  const [playerTitles, setPlayerTitles] = useState<PlayerTitle[]>(playerTitlesList);
  const [toasts, setToasts] = useState<GameToast[]>([]);
  const [levelUpCelebration, setLevelUpCelebration] = useState<{
    level: number;
    era: string;
    perks: string[];
  } | null>(null);

  // Managed Timer Registry (Phase 8: Prevents detached timer closures & memory leaks on unmount)
  const activeTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const safeSetTimeout = useCallback((fn: () => void, delayMs: number) => {
    const timer = setTimeout(() => {
      activeTimersRef.current.delete(timer);
      fn();
    }, delayMs);
    activeTimersRef.current.add(timer);
    return timer;
  }, []);

  useEffect(() => {
    return () => {
      activeTimersRef.current.forEach((t) => clearTimeout(t));
      activeTimersRef.current.clear();
    };
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const triggerToast = useCallback((toast: Omit<GameToast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newToast: GameToast = { ...toast, id };
    setToasts((prev) => [newToast, ...prev.slice(0, 4)]);
    safeSetTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, [safeSetTimeout]);

  const dismissLevelUp = useCallback(() => {
    setLevelUpCelebration(null);
  }, []);

  const claimMission = useCallback((missionId: string) => {
    setMissions((prev) => {
      const target = prev.find((m) => m.id === missionId);
      if (!target || target.status !== 'Completed') return prev;

      setResources((r) => ({
        ...r,
        grc: r.grc + target.rewardCrc,
      }));

      setCivilization((c) => ({
        ...c,
        xp: c.xp + target.rewardXp,
      }));

      setTransactions((txs) => [
        {
          id: `tx-${Date.now()}`,
          timestamp: `Year ${civilization.currentYear.toString().padStart(3, '0')}, Day ${civilization.currentDay.toString().padStart(3, '0')}`,
          simYear: civilization.currentYear,
          simDay: civilization.currentDay,
          type: 'Reward',
          description: `Mission Claimed: ${target.title}`,
          amount: target.rewardCrc,
          balanceAfter: resources.grc + target.rewardCrc,
          status: 'Confirmed',
        },
        ...txs,
      ]);

      soundFx.playRewardClaim();
      triggerToast({
        type: 'reward',
        title: `MISSION REWARD CLAIMED`,
        subtitle: `+${target.rewardCrc} CRC & +${target.rewardXp} Civilisation XP`,
      });

      return prev.map((m) => (m.id === missionId ? { ...m, status: 'Claimed' as const } : m));
    });
  }, [civilization.currentYear, civilization.currentDay, resources.grc, triggerToast]);

  const claimTitle = useCallback((titleId: string) => {
    setPlayerTitles((prev) =>
      prev.map((t) =>
        t.id === titleId
          ? {
              ...t,
              isUnlocked: true,
              unlockedAt: `Year ${civilization.currentYear.toString().padStart(3, '0')}, Day ${civilization.currentDay.toString().padStart(3, '0')}`,
            }
          : t
      )
    );
    soundFx.playRewardClaim();
    triggerToast({
      type: 'levelup',
      title: 'TITLE CONFERRED',
      subtitle: `Honoured by the High Council of Civora`,
    });
  }, [civilization.currentYear, civilization.currentDay, triggerToast]);
  
  const [taxRate, setTaxRate] = useState<number>(() => initialSaved?.taxRate ?? 18); // %
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<'1x' | '2x' | '5x' | '10x'>('1x');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [selectedCitizenId, setSelectedCitizenId] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<MapLayer>('all');
  const [isConstructionMode, setIsConstructionMode] = useState<boolean>(false);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<BuildingCatalogItem | null>(null);
  const [activeDrawer, setActiveDrawer] = useState<ActiveDrawer>('none');
  const [relocatingBuildingId, setRelocatingBuildingId] = useState<string | null>(null);

  // Cities: Skylines II Simulation State
  const [activeInfoView, setActiveInfoView] = useState<InfoViewType>('none');
  const [activeZoneTool, setActiveZoneTool] = useState<ZoneType | null>(null);
  const [zoneMode, setZoneMode] = useState<'brush' | 'marquee'>('brush');
  const [zonedTiles, setZonedTiles] = useState<ZonedTile[]>(() => initialSaved?.zonedTiles || initialZonedTiles);
  const [chirperFeed, setChirperFeed] = useState<ChirperMessage[]>(initialChirperMessages);
  const [isChirperOpen, setIsChirperOpen] = useState<boolean>(false);
  const [cityMilestones, setCityMilestones] = useState<CityMilestone[]>(initialCityMilestones);
  const [isMilestonesModalOpen, setIsMilestonesModalOpen] = useState<boolean>(false);
  const [isBulldozerActive, setIsBulldozerActive] = useState<boolean>(false);
  const [inspectedCitizen, setInspectedCitizen] = useState<Citizen | null>(null);

  // Undo & Redo History Stacks
  const [historyStack, setHistoryStack] = useState<Array<{
    placedBuildings: PlacedBuilding[];
    zonedTiles: ZonedTile[];
    resources: ResourceState;
  }>>([]);
  const [redoStack, setRedoStack] = useState<Array<{
    placedBuildings: PlacedBuilding[];
    zonedTiles: ZonedTile[];
    resources: ResourceState;
  }>>([]);

  // CS2 Modals & Overlays State
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(() => {
    return !localStorage.getItem('genesis_tutorial_seen');
  });
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState<boolean>(false);
  const [isStatisticsOpen, setIsStatisticsOpen] = useState<boolean>(false);

  // Dynamic RCI Demand & Utility calculation state
  const [rciDemand, setRciDemand] = useState<RciDemand>(() => {
    const pop = initialSaved?.resources?.population ?? initialResources.population;
    const blds = initialSaved?.placedBuildings ?? initialPlacedBuildings;
    const tax = initialSaved?.taxRate ?? 18;
    return calculateRciDemand(pop, blds, tax, 95);
  });
  const [utilityStats, setUtilityStats] = useState<UtilityStats>(() => {
    const pop = initialSaved?.resources?.population ?? initialResources.population;
    const blds = initialSaved?.placedBuildings ?? initialPlacedBuildings;
    return calculateUtilityStats(blds, pop);
  });

  const likeChirp = useCallback((chirpId: string) => {
    setChirperFeed((prev) =>
      prev.map((c) =>
        c.id === chirpId
          ? { ...c, likes: c.isLiked ? c.likes - 1 : c.likes + 1, isLiked: !c.isLiked }
          : c
      )
    );
  }, []);

  const pushSnapshot = useCallback(() => {
    setHistoryStack((prev) => [
      ...prev.slice(-29),
      {
        placedBuildings,
        zonedTiles,
        resources,
      },
    ]);
    setRedoStack([]);
  }, [placedBuildings, zonedTiles, resources]);

  const undo = useCallback(() => {
    if (historyStack.length === 0) return;
    const previous = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [
      ...prev,
      {
        placedBuildings,
        zonedTiles,
        resources,
      },
    ]);
    setPlacedBuildings(previous.placedBuildings);
    setZonedTiles(previous.zonedTiles);
    setResources(previous.resources);
    soundFx.playClick();
    triggerToast({
      type: 'info',
      title: '↩️ ACTION UNDONE',
      subtitle: 'Restored previous building and zoning layout.',
    });
  }, [historyStack, placedBuildings, zonedTiles, resources, triggerToast]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setHistoryStack((prev) => [
      ...prev,
      {
        placedBuildings,
        zonedTiles,
        resources,
      },
    ]);
    setPlacedBuildings(next.placedBuildings);
    setZonedTiles(next.zonedTiles);
    setResources(next.resources);
    soundFx.playClick();
    triggerToast({
      type: 'info',
      title: '↪️ ACTION REDONE',
      subtitle: 'Re-applied building and zoning action.',
    });
  }, [redoStack, placedBuildings, zonedTiles, resources, triggerToast]);

  const paintZoneTile = useCallback((x: number, z: number, zoneType: ZoneType) => {
    pushSnapshot();
    const tileId = `tile-${Math.round(x)}-${Math.round(z)}`;
    setZonedTiles((prev) => {
      const existing = prev.find((t) => t.id === tileId);
      if (existing) {
        if (zoneType === 'none') {
          return prev.filter((t) => t.id !== tileId);
        }
        return prev.map((t) => (t.id === tileId ? { ...t, zoneType } : t));
      } else if (zoneType !== 'none') {
        const newTile: ZonedTile = {
          id: tileId,
          x: Math.round(x),
          z: Math.round(z),
          zoneType,
          buildingLevel: 1,
          landValue: 400 + Math.floor(Math.random() * 150),
          isOccupied: true,
        };
        return [...prev, newTile];
      }
      return prev;
    });
    soundFx.playHammerBuild();
  }, [pushSnapshot]);

  // Fun Historical Twin Citizen Protests & Unrest System
  const [activeProtest, setActiveProtest] = useState<ProtestEvent | null>(historicalTwinProtests[0]);
  const [isProtestModalOpen, setIsProtestModalOpen] = useState<boolean>(false);
  const [protestIndex, setProtestIndex] = useState<number>(0);

  const resolveProtest = useCallback(
    (optionId: string) => {
      if (!activeProtest) return;
      const option = activeProtest.options.find((o) => o.id === optionId) || activeProtest.options[0];
      const cost = option.costGrc || 0;

      setResources((prev) => ({
        ...prev,
        grc: Math.max(0, prev.grc - cost),
        happiness: Math.min(100, Math.max(0, prev.happiness + option.happinessDelta)),
        stability: Math.min(100, Math.max(0, prev.stability + option.stabilityDelta)),
      }));

      if (option.outcomeType === 'carnival') {
        soundFx.playCarnivalCheer();
      } else {
        soundFx.playGavel();
      }

      triggerToast({
        type: 'reward',
        title: `📢 EDICT RATIFIED: ${activeProtest.title}`,
        subtitle: `${option.label} enacted! +${option.happinessDelta}% Citizen Happiness.`,
        icon: '🎉',
      });

      setIsProtestModalOpen(false);
      setActiveProtest(null);

      // Cycle next protest after 45 seconds for continuous fun
      safeSetTimeout(() => {
        setProtestIndex((idx) => {
          const next = (idx + 1) % historicalTwinProtests.length;
          setActiveProtest(historicalTwinProtests[next]);
          return next;
        });
      }, 45000);
    },
    [activeProtest, triggerToast, safeSetTimeout]
  );

  const triggerNextProtest = useCallback(() => {
    soundFx.playCrowdChant();
    setProtestIndex((idx) => {
      const next = (idx + 1) % historicalTwinProtests.length;
      setActiveProtest(historicalTwinProtests[next]);
      setIsProtestModalOpen(true);
      return next;
    });
  }, []);

  // Demo Showcase & Capabilities Suite
  const [isDemoModalOpen, setIsDemoModalOpen] = useState<boolean>(false);
  const [showFireworks, setShowFireworks] = useState<boolean>(false);
  const [isCinematicTour, setIsCinematicTour] = useState<boolean>(false);

  const loadMaxDemoWorld = useCallback(() => {
    soundFx.playRewardClaim();
    setCivilization(demoMetropolisCivilization);
    setResources(demoMetropolisResources);
    setRates(demoMetropolisRates);
    setDistricts(demoMetropolisDistricts);
    setPlacedBuildings(demoMetropolisBuildings);
    setCitizens(demoMetropolisCitizens);
    triggerToast({
      type: 'reward',
      title: '🌟 MAX CAPABILITIES DEMO INITIALIZED',
      subtitle: 'Kyoto Prime Nexus loaded with complete 16-structure district architecture and Tier-V resources.',
      icon: '🏛️',
    });
  }, [triggerToast]);

  const triggerFireworks = useCallback(() => {
    soundFx.playFireworksExplosion();
    soundFx.playCarnivalCheer();
    setShowFireworks(true);
    safeSetTimeout(() => setShowFireworks(false), 8500);
    triggerToast({
      type: 'reward',
      title: '🎆 GRAND CARNIVAL SPECTACLE',
      subtitle: 'Fireworks illuminate the Citadel spire! Stability +3%, Happiness +5%',
      icon: '🎆',
    });
  }, [triggerToast, safeSetTimeout]);

  const speedMultipliers = { '1x': 1, '2x': 2, '5x': 5, '10x': 10 };
  const mult = speedMultipliers[speed];

  const selectedBuilding = placedBuildings.find((b) => b.id === selectedBuildingId) || null;

  // Natural Disaster Simulation State
  const [disasterState, setDisasterState] = useState<DisasterSimulationState>(() => ({
    activeDisaster: null,
    risks: calculateDisasterRisks('clear', 12, initialResources, { resources: { waterNet: 0 } } as any, initialPlacedBuildings),
    emergencyForces: calculateEmergencyForces(initialPlacedBuildings, initialResources),
    settings: {
      autoDisastersEnabled: true,
      disasterFrequency: 'moderate',
    },
    historicalDisasterCount: 0,
  }));

  // Detailed Citizen Agent Multi-Need Social Intelligence
  const [detailedAgents, setDetailedAgents] = useState<DetailedCitizenAgent[]>(() => {
    if (initialSaved?.detailedAgents && initialSaved.detailedAgents.length > 0) {
      return initialSaved.detailedAgents;
    }
    const cits = initialSaved?.citizens || initialCitizens;
    const lvl = initialSaved?.civilization?.level || 1;
    return createInitialDetailedAgents(cits, lvl);
  });

  // Centralized City Simulation Report (Calculates fiscal flows, resource accounting, district metrics, demands & alerts)
  const economyReport = useMemo(() => {
    return calculateCitySimulation(placedBuildings, buildingCatalog, resources, districts, taxRate);
  }, [placedBuildings, resources.population, resources.health, resources.environmentalIndex, districts, taxRate]);

  const economyReportRef = useRef(economyReport);
  useEffect(() => {
    economyReportRef.current = economyReport;
  }, [economyReport]);

  // Throttled tick accumulator to eliminate HTTP flooding latency
  const accumulatedTicksRef = useRef(0);
  const lastBackendSyncRef = useRef(Date.now());

  const citizenReport = useMemo(() => {
    const timeOfDay = (civilization.currentDay * 8) % 24;
    const citadel = placedBuildings.find((b) => b.modelType === 'citadel' || b.catalogId === 'bld-gov-citadel');
    const citadelLevel = citadel?.level || civilization?.level || 1;
    return runCitizenSimulationTick(
      resources,
      placedBuildings,
      districts,
      economyReport,
      disasterState,
      detailedAgents,
      timeOfDay,
      citadelLevel
    );
  }, [resources, placedBuildings, districts, economyReport, disasterState, detailedAgents, civilization.currentDay, civilization.level]);

  // Persistent Progress Management (Zero Progress Loss on page exit, reload, or tab switch)
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<number | null>(() => initialSaved?.timestamp || null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Latest state ref for exit / unload event handlers to eliminate stale closures
  const latestStateRef = useRef<CivoraSavedGameState>({
    version: 2,
    timestamp: Date.now(),
    civilization,
    resources,
    rates,
    districts,
    placedBuildings,
    technologies,
    policies,
    citizens,
    detailedAgents,
    quests,
    missions,
    chronicle,
    transactions,
    achievements,
    zonedTiles,
    taxRate,
    savedWorlds,
  });

  useEffect(() => {
    latestStateRef.current = {
      version: 2,
      timestamp: Date.now(),
      civilization,
      resources,
      rates,
      districts,
      placedBuildings,
      technologies,
      policies,
      citizens,
      detailedAgents,
      quests,
      missions,
      chronicle,
      transactions,
      achievements,
      zonedTiles,
      taxRate,
      savedWorlds,
    };
  }, [
    civilization,
    resources,
    rates,
    districts,
    placedBuildings,
    technologies,
    policies,
    citizens,
    detailedAgents,
    quests,
    missions,
    chronicle,
    transactions,
    achievements,
    zonedTiles,
    taxRate,
    savedWorlds,
  ]);

  const saveGame = useCallback((): boolean => {
    setIsSaving(true);
    const success = saveGameStateToStorage(latestStateRef.current);
    if (success) {
      setLastSavedTimestamp(Date.now());
    }
    setTimeout(() => setIsSaving(false), 500);
    return success;
  }, []);

  // Multi-event exit & page navigation persistence (tab close, refresh, mobile app switch, tab switch)
  useEffect(() => {
    const handleExit = () => {
      saveGameStateToStorage(latestStateRef.current);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveGameStateToStorage(latestStateRef.current);
      }
    };

    window.addEventListener('beforeunload', handleExit);
    window.addEventListener('pagehide', handleExit);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleExit);
      window.removeEventListener('pagehide', handleExit);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Periodic throttled auto-save every 8 seconds when running
  const lastAutoSaveRef = useRef<number>(Date.now());
  useEffect(() => {
    const now = Date.now();
    if (now - lastAutoSaveRef.current >= 8000) {
      lastAutoSaveRef.current = now;
      saveGameStateToStorage(latestStateRef.current);
      setLastSavedTimestamp(now);
    }
  }, [resources, placedBuildings, civilization.currentDay]);

  // Simulation Tick Logic
  const advanceTick = useCallback(() => {
    // 1. Advance Calendar
    setCivilization((prev) => {
      let nextDay = prev.currentDay + 1;
      let nextYear = prev.currentYear;
      if (nextDay > 365) {
        nextDay = 1;
        nextYear += 1;
      }
      return { ...prev, currentDay: nextDay, currentYear: nextYear };
    });

    // 2. Adjust Resources & Treasury based on real simulation calculations
    setResources((prev) => {
      const liveReport = economyReportRef.current;

      const netCashDelta = liveReport.economy.netDailyCashFlow * 0.1;
      const foodDelta = liveReport.resources.foodNet * 0.1;
      const waterDelta = liveReport.resources.waterNet * 0.1;
      const energyDelta = liveReport.resources.energyNetMW * 0.1;
      const materialsDelta = liveReport.resources.materialsNet * 0.1;
      const researchDelta = rates.researchRate * 0.1;

      // Natural Population growth influenced by housing capacity and healthcare
      const housingFactor = liveReport.demands.residentialDemand > 98 ? 0.15 : 1.0;
      const healthFactor = (prev.health || 80) / 100;
      const popGrowth = Math.round(
        (prev.population * (rates.populationGrowthRate / 100) * housingFactor * healthFactor) / 365
      );
      const newPop = prev.population + popGrowth;

      // GDP responds to commercial activity and employment rate
      const employmentFactor = (liveReport.resources.employmentRatePercent || 90) / 100;
      const gdpDelta = (prev.gdp * (rates.gdpGrowthRate / 100) * employmentFactor) / 365;
      const newGdp = Number((prev.gdp + gdpDelta).toFixed(3));

      // Public health responds to water and clinic availability
      let newHealth = prev.health;
      if (liveReport.resources.waterNet < 0) {
        newHealth = Math.max(30, newHealth - 0.5);
      } else if (newHealth < 98) {
        newHealth = Math.min(100, newHealth + 0.1);
      }

      // Public happiness responds to fiscal health, power stability, and unemployment
      let newHappiness = prev.happiness;
      if (liveReport.resources.energyNetMW < 0) {
        newHappiness = Math.max(20, newHappiness - 1.0);
      } else if (liveReport.economy.fiscalHealth === 'Surplus' && newHappiness < 98) {
        newHappiness = Math.min(100, newHappiness + 0.1);
      }

      return {
        ...prev,
        food: Math.max(0, Math.round(prev.food + foodDelta)),
        water: Math.max(0, Math.round(prev.water + waterDelta)),
        energy: Math.max(0, Math.round(prev.energy + energyDelta)),
        materials: Math.max(0, Math.round(prev.materials + materialsDelta)),
        researchPoints: Math.round(prev.researchPoints + researchDelta),
        grc: Math.max(0, Math.round(prev.grc + netCashDelta)),
        population: newPop,
        gdp: newGdp,
        health: Math.round(newHealth),
        happiness: Math.round(newHappiness),
      };
    });

    // 3. Progress Research
    setTechnologies((prev) =>
      prev.map((tech) => {
        if (!tech.isResearched && tech.isAvailable && tech.progress < tech.costResearchPoints) {
          const newProgress = Math.min(tech.costResearchPoints, tech.progress + Math.round(rates.researchRate * 0.2));
          const completed = newProgress >= tech.costResearchPoints;
          return {
            ...tech,
            progress: newProgress,
            isResearched: completed,
            isAvailable: !completed,
          };
        }
        return tech;
      })
    );

    // 4. Progress Active Experiments
    setExperiments((prev) =>
      prev.map((exp) => {
        if (exp.status === 'Active' && exp.currentDay < exp.durationDays) {
          const nextDay = exp.currentDay + 1;
          const isDone = nextDay >= exp.durationDays;
          return {
            ...exp,
            currentDay: nextDay,
            status: isDone ? 'Completed' : 'Active',
          };
        }
        return exp;
      })
    );

    // 4b. Progress Active Policy Gradual Assimilation & Longitudinal Research
    setPolicies((prevPolicies) =>
      prevPolicies.map((p) => {
        if (!p.isActive) return p;

        const prevProgress = p.assimilationProgress || 0;
        const days = (p.daysActive || 0) + 1;
        // Progresses ~0.8% per simulation day, taking ~80-100 days for full mature equilibrium
        const nextProgress = Math.min(100, Math.round((prevProgress + 0.8) * 10) / 10);

        let phase: 'Friction & Resistance' | 'Societal Assimilation' | 'Mature Equilibrium' = 'Friction & Resistance';
        if (nextProgress >= 75) phase = 'Mature Equilibrium';
        else if (nextProgress >= 25) phase = 'Societal Assimilation';

        const effRatio = nextProgress / 100;
        const happinessShift = Number((p.effectsSummary.happinessModifier * effRatio).toFixed(2));
        const productivityShift = Number((p.effectsSummary.gdpModifier * effRatio).toFixed(2));
        const stabilityShift = Number((p.effectsSummary.stabilityModifier * effRatio).toFixed(2));

        const existingFindings = p.researchFindings || {
          totalObservations: 0,
          measuredHappinessShift: 0,
          measuredProductivityShift: 0,
          measuredStabilityShift: 0,
          evolutionaryAdaptationScore: 0,
          breakthroughDiscovery: `Empirical findings show ${p.name} restructuring daily civic routines with ${Math.round(nextProgress)}% compliance.`,
          isResearchSubmitted: false,
        };

        return {
          ...p,
          daysActive: days,
          assimilationProgress: nextProgress,
          currentPhase: phase,
          researchFindings: {
            ...existingFindings,
            totalObservations: existingFindings.totalObservations + 1,
            measuredHappinessShift: happinessShift,
            measuredProductivityShift: productivityShift,
            measuredStabilityShift: stabilityShift,
            evolutionaryAdaptationScore: Math.round(nextProgress),
            breakthroughDiscovery:
              nextProgress >= 50
                ? `Longitudinal study confirms ${p.name} yields compounding dividends: measured +${happinessShift} happiness and +${productivityShift}% productivity shift.`
                : existingFindings.breakthroughDiscovery,
          },
        };
      })
    );

    // 5. Progress Building Construction and Upgrades
    setPlacedBuildings((prev) => {
      let ratesChanged = false;
      const rateDeltas: Partial<ResourceRates> = {};
      const newEvents: GameEvent[] = [];

      const updated = prev.map((b) => {
        // A. Active Construction Lifecycle (4 Stages: Excavation -> Framing -> Wall Enclosure -> Commissioning)
        if (b.status === 'constructing') {
          const currentProg = b.constructionProgress || 0;
          const nextProg = Math.min(100, currentProg + 4);
          if (nextProg >= 100) {
            const item = buildingCatalog.find((c) => c.id === b.catalogId);
            const workers = item?.workerReq || b.workersNeeded;
            if (item?.productionType && item?.productionAmount) {
              const rKey = `${item.productionType}Rate` as keyof ResourceRates;
              rateDeltas[rKey] = (rateDeltas[rKey] || 0) + item.productionAmount;
              ratesChanged = true;
            }
            newEvents.push({
              id: `ev-${Date.now()}-${b.id}`,
              year: civilization.currentYear,
              day: civilization.currentDay,
              title: `Commissioned: ${b.name}`,
              description: `Construction complete! The facility is now fully operational and connected to the civic grid.`,
              category: 'economic',
              severity: 'success',
              isRead: false,
            });
            return {
              ...b,
              status: 'active' as const,
              constructionProgress: 100,
              workersAssigned: workers,
              efficiency: 95,
              health: 100,
            };
          }
          return {
            ...b,
            constructionProgress: nextProg,
          };
        }

        // B. Active Building Upgrade Lifecycle (Levels 1 to 5)
        if (b.status === 'upgrading') {
          const currentUp = b.upgradeProgress || 0;
          const targetLvl = b.targetLevel || (b.level + 1);
          const isCitadel = b.modelType === 'citadel' || b.catalogId === 'bld-gov-citadel';

          // Upgrades take longer at higher levels, making each tier hard-earned
          let tickRate = 2.8; // Level 2: ~35 ticks (~25-30s)
          if (targetLvl === 3) tickRate = 1.4; // Level 3: ~70 ticks (~50-60s)
          else if (targetLvl === 4) tickRate = 0.7; // Level 4: ~140 ticks (~1.5-2 mins)
          else if (targetLvl >= 5) tickRate = 0.35; // Level 5: ~280 ticks (~3.5 mins)

          if (isCitadel) {
            // Citadel upgrades are monumental village-wide architectural undertakings
            tickRate *= 0.65;
          }

          const nextUp = Math.min(100, currentUp + tickRate);
          if (nextUp >= 100) {
            const nextLvl = targetLvl;
            const item = buildingCatalog.find((c) => c.id === b.catalogId);
            if (item?.productionType && item?.productionAmount) {
              const rKey = `${item.productionType}Rate` as keyof ResourceRates;
              const bonus = Math.round(item.productionAmount * 0.35);
              rateDeltas[rKey] = (rateDeltas[rKey] || 0) + bonus;
              ratesChanged = true;
            }

            // Handle Citadel / Village Level Advancement
            if (isCitadel) {
              setCivilization((prevCiv) => ({
                ...prevCiv,
                level: nextLvl,
                xpToNextLevel: nextLvl * 1500,
              }));
              const newName = getCitadelNameForLevel(nextLvl);
              const newRadius = getCitadelTerritoryRadius(nextLvl);

              soundFx.playHeroicFanfare();
              triggerToast({
                type: 'levelup',
                title: `CITADEL ELEVATED TO LEVEL ${nextLvl}!`,
                subtitle: `Sovereign dominion expanded to ${newRadius}m! Building tier ${nextLvl} authorized village-wide!`,
              });

              newEvents.push({
                id: `ev-${Date.now()}-${b.id}`,
                year: civilization.currentYear,
                day: civilization.currentDay,
                title: `Imperial Era Milestone: Citadel Level ${nextLvl}`,
                description: `The heart of your civilization has been elevated to ${newName}! Survey beacons have expanded sovereign territory to ${newRadius}m radius. All citizens celebrate this new era of prosperity!`,
                category: 'diplomatic',
                severity: 'success',
                isRead: false,
              });

              return {
                ...b,
                name: newName,
                status: 'active' as const,
                level: nextLvl,
                upgradeProgress: 0,
                targetLevel: undefined,
                efficiency: 100,
                health: 100,
              };
            }

            newEvents.push({
              id: `ev-${Date.now()}-${b.id}`,
              year: civilization.currentYear,
              day: civilization.currentDay,
              title: `Expansion Complete: ${b.name} (Level ${nextLvl})`,
              description: `Major structural overhaul finalized. Facility throughput elevated to Level ${nextLvl}.`,
              category: 'economic',
              severity: 'success',
              isRead: false,
            });

            return {
              ...b,
              status: 'active' as const,
              level: nextLvl,
              upgradeProgress: 0,
              targetLevel: undefined,
              efficiency: Math.min(100, b.efficiency + 5),
              health: 100,
            };
          }
          return {
            ...b,
            upgradeProgress: nextUp,
          };
        }

        return b;
      });

      if (ratesChanged) {
        setRates((r) => {
          const nextR = { ...r };
          for (const k in rateDeltas) {
            const key = k as keyof ResourceRates;
            (nextR[key] as number) = (nextR[key] as number) + (rateDeltas[key] || 0);
          }
          return nextR;
        });
      }

      if (newEvents.length > 0) {
        setEvents((evs) => [...newEvents, ...evs]);
      }

      return updated;
    });

    // 6. Update Cities: Skylines II RCI Demand & Utility Networks
    setRciDemand(calculateRciDemand(resources.population, placedBuildings, taxRate, resources.health));
    setUtilityStats(calculateUtilityStats(placedBuildings, resources.population));

    // 6. Real-time Citizen Chirper Network tied to real simulation events
    if (Math.random() < 0.28 && districts.length > 0) {
      const dName = districts[Math.floor(Math.random() * districts.length)].name;
      const simStatus = {
        powerDeficit: utilityStats.powerConsumptionMW > utilityStats.powerCapacityMW,
        waterDeficit: utilityStats.waterConsumptionM3 > utilityStats.waterCapacityM3,
        highTaxes: taxRate > 20,
        highPollution: utilityStats.pollutionIndex > 40 || resources.environmentalIndex < 40,
        highHappiness: resources.happiness > 85,
        techBreakthrough: Math.random() < 0.15,
        materialsShortage: resources.materials < 500,
      };
      const newChirp = generateRandomChirp(dName, simStatus);
      setChirperFeed((prev) => [newChirp, ...prev.slice(0, 24)]);
    }

    // 7. Disaster Simulation Progression
    setDisasterState((prevDisaster) => {
      if (!prevDisaster.activeDisaster) return prevDisaster;
      const { updatedDisaster, updatedBuildings } = advanceDisasterSimulation(
        prevDisaster.activeDisaster,
        placedBuildings,
        prevDisaster.emergencyForces,
        0.5
      );

      if (updatedBuildings) {
        setPlacedBuildings(updatedBuildings);
      }

      return {
        ...prevDisaster,
        activeDisaster: updatedDisaster,
      };
    });

    // 8. Update detailed citizen routines
    setDetailedAgents((prevAgents) => {
      const hour = (civilization.currentDay * 8) % 24;
      const needs = calculateCitizenNeeds(resources, placedBuildings, economyReport, disasterState);
      return updateCitizenRoutines(prevAgents, hour, disasterState?.activeDisaster, needs);
    });

    // 9. Background sync to FastAPI backend (WebSocket first with REST fallback)
    accumulatedTicksRef.current += 1;
    const now = Date.now();
    if (now - lastBackendSyncRef.current >= 4000) {
      const ticksToSync = accumulatedTicksRef.current;
      accumulatedTicksRef.current = 0;
      lastBackendSyncRef.current = now;
      const sent = civoraEventClient.send(
        'tick',
        { ticks: ticksToSync },
        `tick_${civilization.id}_${now}`
      );
      if (!sent) {
        civilizationApi.advanceSimulationTicks(civilization.id, ticksToSync).catch(() => {});
      }
    }
  }, [
    rates,
    resources.population,
    resources.health,
    placedBuildings,
    taxRate,
    districts,
    civilization,
    utilityStats,
    economyReport,
    disasterState,
  ]);

  // Real-Time Event Engine (Phase 6): Maintain centralized WebSocket connection
  useEffect(() => {
    if (civilization.id) {
      civoraEventClient.connect(civilization.id);

      const unsub = civoraEventClient.subscribe('council.deliberation.completed', (envelope) => {
        const payload = envelope.payload || {};
        triggerToast({
          type: 'info',
          title: 'Council Deliberation Concluded',
          subtitle: `${payload.recommendations_count || 'New'} policy directives synthesized.`,
        });
      });

      return () => {
        unsub();
        civoraEventClient.disconnect();
      };
    }
  }, [civilization.id, triggerToast]);

  // Flush accumulated ticks when paused
  useEffect(() => {
    if (!isPlaying && accumulatedTicksRef.current > 0) {
      const ticks = accumulatedTicksRef.current;
      accumulatedTicksRef.current = 0;
      const sent = civoraEventClient.send(
        'tick',
        { ticks },
        `tick_${civilization.id}_${Date.now()}`
      );
      if (!sent) {
        civilizationApi.advanceSimulationTicks(civilization.id, ticks).catch(() => {});
      }
    }
  }, [isPlaying, civilization.id]);

  // Advance by a full year
  const advanceYear = useCallback(() => {
    for (let i = 0; i < 30; i++) {
      advanceTick();
    }
    setCivilization((prev) => ({
      ...prev,
      currentYear: prev.currentYear + 1,
      currentDay: 1,
      xp: Math.min(prev.xpToNextLevel, prev.xp + 450),
    }));
  }, [advanceTick]);

  // Keep a stable ref to advanceTick to prevent timer recreation on every frame
  const advanceTickRef = useRef(advanceTick);
  useEffect(() => {
    advanceTickRef.current = advanceTick;
  });

  // Timer loop for simulation - only restarts when isPlaying or mult changes, zero timer thrashing
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = Math.max(150, 1500 / mult);
    const timer = setInterval(() => {
      advanceTickRef.current();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isPlaying, mult]);

  const togglePlay = () => setIsPlaying((p) => !p);

  const selectBuilding = (id: string | null) => {
    setSelectedBuildingId(id);
    if (id) {
      setSelectedCitizenId(null);
      setInspectedCitizen(null);
      setActiveDrawer('buildingInspector');
    }
  };

  const selectCitizen = useCallback((id: string | null) => {
    setSelectedCitizenId(id);
    if (id) {
      setSelectedBuildingId(null);
      setActiveDrawer('none');
      const targetCit = citizens.find((c) => c.id === id);
      if (targetCit) setInspectedCitizen(targetCit);
    } else {
      setInspectedCitizen(null);
    }
  }, [citizens]);

  const selectedCitizen = useMemo(() => {
    if (!selectedCitizenId) return null;
    return citizenReport.citizenAgents.find((c) => c.id === selectedCitizenId) || null;
  }, [selectedCitizenId, citizenReport.citizenAgents]);

  const setConstructionMode = (active: boolean, item?: BuildingCatalogItem | null) => {
    setIsConstructionMode(active);
    setSelectedCatalogItem(item || null);
    if (!active) {
      setRelocatingBuildingId(null);
    }
    if (active) {
      setActiveDrawer('none');
    }
  };

  const startRelocation = (buildingId: string) => {
    const building = placedBuildings.find((b) => b.id === buildingId);
    if (!building) return;

    const catalogItem = buildingCatalog.find((c) => c.id === building.catalogId) || {
      id: building.catalogId,
      name: building.name,
      category: building.category,
      description: 'Relocating existing structural asset.',
      costMaterials: 0,
      costCredits: 0,
      energyReq: 0,
      waterReq: 0,
      populationCapacity: 0,
      workerReq: building.workersNeeded,
      productionAmount: 0,
      maintenanceCost: 0,
      constructionDurationDays: 0,
      minTechLevel: 1,
      modelType: building.modelType,
    };

    setRelocatingBuildingId(buildingId);
    setSelectedCatalogItem(catalogItem);
    setIsConstructionMode(true);
    setSelectedBuildingId(null);
    setActiveDrawer('none');
  };

  const cancelRelocation = () => {
    setRelocatingBuildingId(null);
    setIsConstructionMode(false);
    setSelectedCatalogItem(null);
  };

  const relocateBuilding = (
    buildingId: string,
    x: number,
    z: number,
    districtId?: string,
    rotation?: number
  ) => {
    const building = placedBuildings.find((b) => b.id === buildingId);
    if (!building) return false;

    setPlacedBuildings((prev) =>
      prev.map((b) =>
        b.id === buildingId
          ? {
              ...b,
              x: Math.round(x * 10) / 10,
              z: Math.round(z * 10) / 10,
              districtId: districtId || b.districtId,
              rotation: rotation !== undefined ? rotation : b.rotation,
            }
          : b
      )
    );

    const event: GameEvent = {
      id: `ev-${Date.now()}`,
      year: civilization.currentYear,
      day: civilization.currentDay,
      title: `Relocated: ${building.name}`,
      description: `Structure systematically transported to coordinates (${x.toFixed(1)}, ${z.toFixed(1)}).`,
      category: 'economic',
      severity: 'info',
      isRead: false,
    };
    setEvents((prev) => [event, ...prev]);

    setRelocatingBuildingId(null);
    setIsConstructionMode(false);
    setSelectedCatalogItem(null);
    setSelectedBuildingId(buildingId);
    return true;
  };

  const rotateBuilding = (buildingId: string, angleDelta: number = Math.PI / 4) => {
    setPlacedBuildings((prev) =>
      prev.map((b) =>
        b.id === buildingId
          ? {
              ...b,
              rotation: ((b.rotation || 0) + angleDelta) % (Math.PI * 2),
            }
          : b
      )
    );
  };

  const repairBuilding = (buildingId: string) => {
    const building = placedBuildings.find((b) => b.id === buildingId);
    if (!building || building.health >= 100) return false;

    const repairCost = Math.max(15, Math.round((100 - building.health) * 2.5));
    if (resources.materials < repairCost) return false;

    setResources((prev) => ({
      ...prev,
      materials: prev.materials - repairCost,
    }));

    setPlacedBuildings((prev) =>
      prev.map((b) => (b.id === buildingId ? { ...b, health: 100, status: 'active' } : b))
    );

    const event: GameEvent = {
      id: `ev-${Date.now()}`,
      year: civilization.currentYear,
      day: civilization.currentDay,
      title: `Repaired: ${building.name}`,
      description: `Structural integrity fully restored (Cost: ${repairCost} materials).`,
      category: 'economic',
      severity: 'success',
      isRead: false,
    };
    setEvents((prev) => [event, ...prev]);
    return true;
  };

  const placeBuilding = (
    catalogId: string,
    x: number,
    z: number,
    districtId: string = 'dist-citadel',
    rotation: number = 0
  ) => {
    const item = buildingCatalog.find((b) => b.id === catalogId);
    if (!item) return false;

    if (resources.materials < item.costMaterials) {
      const errEvent: GameEvent = {
        id: `ev-${Date.now()}`,
        year: civilization.currentYear,
        day: civilization.currentDay,
        title: 'Construction Suspended: Insufficient Materials',
        description: `Failed to construct ${item.name}. Required: ${item.costMaterials} materials. Available: ${resources.materials}.`,
        category: 'economic',
        severity: 'warning',
        isRead: false,
      };
      setEvents((prev) => [errEvent, ...prev]);
      return false;
    }

    // Save state snapshot for Undo/Redo
    pushSnapshot();

    // Deduct materials
    setResources((prev) => ({
      ...prev,
      materials: prev.materials - item.costMaterials,
      grc: prev.grc + 5,
    }));

    const newBuilding: PlacedBuilding = {
      id: `inst-${item.id}-${Date.now().toString().slice(-4)}`,
      catalogId: item.id,
      name: `${item.name} #${placedBuildings.length + 1}`,
      category: item.category,
      level: 1,
      maxLevel: 4,
      x: Math.round(x * 10) / 10,
      z: Math.round(z * 10) / 10,
      y: 0.6,
      rotation: rotation || 0,
      districtId,
      status: 'constructing',
      health: 100,
      efficiency: 95,
      workersAssigned: 0,
      workersNeeded: item.workerReq,
      modelType: item.modelType,
      constructionProgress: 0,
      upgradeProgress: 0,
    };

    setPlacedBuildings((prev) => [...prev, newBuilding]);
    civilizationApi.constructFacility(civilization.id, {
      catalogId: newBuilding.catalogId,
      name: newBuilding.name,
      category: newBuilding.category,
      level: newBuilding.level,
      x: newBuilding.x,
      z: newBuilding.z,
      y: newBuilding.y,
      districtId: newBuilding.districtId,
    }).catch(() => {});

    const event: GameEvent = {
      id: `ev-${Date.now()}`,
      year: civilization.currentYear,
      day: civilization.currentDay,
      title: `Ground Broken: ${newBuilding.name}`,
      description: `Foundation excavation and structural staging underway in district ${districtId}.`,
      category: 'economic',
      severity: 'info',
      isRead: false,
    };
    setEvents((prev) => [event, ...prev]);
    soundFx.playHammerBuild();
    triggerToast({
      type: 'build',
      title: `CONSTRUCTION STARTED: ${item.name}`,
      subtitle: `Staging underway in Sector ${districtId}. +5 GRC Treasury Grant`,
    });
    setIsConstructionMode(false);
    setSelectedCatalogItem(null);
    return true;
  };

  const upgradeBuilding = (buildingId: string) => {
    const building = placedBuildings.find((b) => b.id === buildingId);
    if (
      !building ||
      building.level >= building.maxLevel ||
      building.status === 'upgrading' ||
      building.status === 'constructing'
    )
      return false;

    const isCitadel = building.modelType === 'citadel' || building.catalogId === 'bld-gov-citadel';
    const citadel = placedBuildings.find(
      (b) => b.modelType === 'citadel' || b.catalogId === 'bld-gov-citadel'
    );
    const citadelLevel = citadel?.level || civilization.level || 1;

    // VILLAGE ANCHOR RULE: Facilities cannot exceed the current Citadel command level
    if (!isCitadel && building.level >= citadelLevel) {
      soundFx.playError();
      triggerToast({
        type: 'info',
        title: 'UPGRADE RESTRICTED BY CITADEL',
        subtitle: `Village Citadel must reach Level ${building.level + 1} first to authorize Tier ${building.level + 1} facilities!`,
      });
      const errEvent: GameEvent = {
        id: `ev-${Date.now()}`,
        year: civilization.currentYear,
        day: civilization.currentDay,
        title: 'Upgrade Denied: Citadel Tier Constraint',
        description: `Village protocol dictates no facility may exceed the command level of the central Citadel (Currently Level ${citadelLevel}). Elevate your Citadel first.`,
        category: 'diplomatic',
        severity: 'warning',
        isRead: false,
      };
      setEvents((prev) => [errEvent, ...prev]);
      return false;
    }

    const item = buildingCatalog.find((c) => c.id === building.catalogId);
    const { materials: reqMat, money: reqMoney } = calculateBuildingUpgradeCost(building, item);

    if (resources.materials < reqMat || resources.grc < reqMoney) {
      soundFx.playError();
      const missing: string[] = [];
      if (resources.materials < reqMat) missing.push(`${reqMat - resources.materials} Materials`);
      if (resources.grc < reqMoney) missing.push(`${reqMoney - resources.grc} Credits`);

      triggerToast({
        type: 'info',
        title: 'INSUFFICIENT CAPITAL FOR UPGRADE',
        subtitle: `Need: ${missing.join(' and ')}. Earn credits through commerce, taxes, and trade.`,
      });
      const errEvent: GameEvent = {
        id: `ev-${Date.now()}`,
        year: civilization.currentYear,
        day: civilization.currentDay,
        title: 'Upgrade Suspended: Insufficient Capital',
        description: `Upgrade to Level ${building.level + 1} requires ${reqMat} Materials and ${reqMoney} Credits. Available: ${resources.materials} Mat, ${resources.grc} Cr.`,
        category: 'economic',
        severity: 'warning',
        isRead: false,
      };
      setEvents((prev) => [errEvent, ...prev]);
      return false;
    }

    setResources((prev) => ({
      ...prev,
      materials: prev.materials - reqMat,
      grc: prev.grc - reqMoney,
    }));

    setPlacedBuildings((prev) =>
      prev.map((b) =>
        b.id === buildingId
          ? {
              ...b,
              status: 'upgrading',
              targetLevel: b.level + 1,
              upgradeProgress: 0,
            }
          : b
      )
    );
    civilizationApi.upgradeFacility(civilization.id, buildingId).catch(() => {});

    soundFx.playHammerBuild();
    triggerToast({
      type: 'build',
      title: isCitadel ? `EXPANDING IMPERIAL CITADEL` : `UPGRADE UNDERWAY: ${building.name}`,
      subtitle: isCitadel
        ? `Upgrading to Level ${building.level + 1}. Sovereign territory will expand upon completion!`
        : `Upgrading to Level ${building.level + 1}. Specialized engineering teams dispatched.`,
    });

    const event: GameEvent = {
      id: `ev-${Date.now()}`,
      year: civilization.currentYear,
      day: civilization.currentDay,
      title: `Expansion Commenced: ${building.name}`,
      description: `Structural renovation underway targeting Level ${building.level + 1} (${reqMat} Mat, ${reqMoney} Cr invested).`,
      category: 'economic',
      severity: 'info',
      isRead: false,
    };
    setEvents((prev) => [event, ...prev]);
    return true;
  };

  const rushConstruction = (buildingId: string) => {
    const building = placedBuildings.find((b) => b.id === buildingId);
    if (!building || (building.status !== 'constructing' && building.status !== 'upgrading'))
      return false;

    const rushCostGrc = building.status === 'constructing' ? 30 : 45;
    if (resources.grc < rushCostGrc) {
      const errEvent: GameEvent = {
        id: `ev-${Date.now()}`,
        year: civilization.currentYear,
        day: civilization.currentDay,
        title: 'Expedite Failed: Insufficient GRC',
        description: `Fast-tracking requires ${rushCostGrc} GRC. Available: ${resources.grc} GRC.`,
        category: 'economic',
        severity: 'warning',
        isRead: false,
      };
      setEvents((prev) => [errEvent, ...prev]);
      return false;
    }

    setResources((prev) => ({
      ...prev,
      grc: prev.grc - rushCostGrc,
    }));

    if (building.status === 'constructing') {
      const item = buildingCatalog.find((c) => c.id === building.catalogId);
      const workers = item?.workerReq || building.workersNeeded;
      if (item?.productionType && item?.productionAmount) {
        setRates((prev) => {
          const key = `${item.productionType}Rate` as keyof ResourceRates;
          return {
            ...prev,
            [key]: (prev[key] as number) + item.productionAmount,
          };
        });
      }

      setPlacedBuildings((prev) =>
        prev.map((b) =>
          b.id === buildingId
            ? {
                ...b,
                status: 'active',
                constructionProgress: 100,
                workersAssigned: workers,
                health: 100,
                efficiency: 95,
              }
            : b
        )
      );

      const event: GameEvent = {
        id: `ev-${Date.now()}`,
        year: civilization.currentYear,
        day: civilization.currentDay,
        title: `Priority Commission: ${building.name}`,
        description: `Construction fast-tracked with priority funding. Facility is now online and operational!`,
        category: 'economic',
        severity: 'success',
        isRead: false,
      };
      setEvents((prev) => [event, ...prev]);
    } else if (building.status === 'upgrading') {
      const nextLvl = building.targetLevel || building.level + 1;
      const isCitadel = building.modelType === 'citadel' || building.catalogId === 'bld-gov-citadel';
      const item = buildingCatalog.find((c) => c.id === building.catalogId);
      if (item?.productionType && item?.productionAmount) {
        setRates((prev) => {
          const key = `${item.productionType}Rate` as keyof ResourceRates;
          const bonus = Math.round(item.productionAmount * 0.35);
          return {
            ...prev,
            [key]: (prev[key] as number) + bonus,
          };
        });
      }

      const newName = isCitadel ? getCitadelNameForLevel(nextLvl) : building.name;
      if (isCitadel) {
        setCivilization((prevCiv) => ({
          ...prevCiv,
          level: nextLvl,
          xpToNextLevel: nextLvl * 1500,
        }));
        const newRadius = getCitadelTerritoryRadius(nextLvl);
        soundFx.playHeroicFanfare();
        triggerToast({
          type: 'levelup',
          title: `CITADEL ELEVATED TO LEVEL ${nextLvl}!`,
          subtitle: `Sovereign dominion expanded to ${newRadius}m! Building tier ${nextLvl} authorized village-wide!`,
        });
      }

      setPlacedBuildings((prev) =>
        prev.map((b) =>
          b.id === buildingId
            ? {
                ...b,
                name: newName,
                status: 'active',
                level: nextLvl,
                upgradeProgress: 0,
                targetLevel: undefined,
                health: 100,
                efficiency: 100,
              }
            : b
        )
      );

      const event: GameEvent = {
        id: `ev-${Date.now()}`,
        year: civilization.currentYear,
        day: civilization.currentDay,
        title: isCitadel
          ? `Imperial Milestone: Citadel Level ${nextLvl} Fast-Tracked`
          : `Priority Upgrade Complete: ${building.name} (Level ${nextLvl})`,
        description: isCitadel
          ? `Emergency sovereign funding finalized ${newName}! Territory expanded to ${getCitadelTerritoryRadius(nextLvl)}m radius.`
          : `Expansion accelerated with emergency capital. All structural enhancements active!`,
        category: isCitadel ? 'diplomatic' : 'economic',
        severity: 'success',
        isRead: false,
      };
      setEvents((prev) => [event, ...prev]);
    }

    soundFx.playRewardClaim();
    triggerToast({
      type: 'build',
      title: `EXPEDITED: ${building.name}`,
      subtitle: `Fast-track protocol completed. Facility active.`,
    });

    return true;
  };

  const cancelConstruction = (buildingId: string) => {
    const building = placedBuildings.find((b) => b.id === buildingId);
    if (!building) return false;

    if (building.status === 'constructing') {
      const item = buildingCatalog.find((c) => c.id === building.catalogId);
      const refund = item ? Math.round(item.costMaterials * 0.8) : 100;
      setResources((prev) => ({
        ...prev,
        materials: prev.materials + refund,
      }));
      setPlacedBuildings((prev) => prev.filter((b) => b.id !== buildingId));
      setSelectedBuildingId(null);
      setActiveDrawer('none');

      const event: GameEvent = {
        id: `ev-${Date.now()}`,
        year: civilization.currentYear,
        day: civilization.currentDay,
        title: `Construction Cancelled: ${building.name}`,
        description: `Project aborted. Site cleared and ${refund} materials recovered.`,
        category: 'economic',
        severity: 'info',
        isRead: false,
      };
      setEvents((prev) => [event, ...prev]);
      return true;
    } else if (building.status === 'upgrading') {
      const refund = Math.round(building.level * 280 * 0.8);
      setResources((prev) => ({
        ...prev,
        materials: prev.materials + refund,
      }));
      setPlacedBuildings((prev) =>
        prev.map((b) =>
          b.id === buildingId
            ? {
                ...b,
                status: 'active',
                upgradeProgress: 0,
                targetLevel: undefined,
              }
            : b
        )
      );

      const event: GameEvent = {
        id: `ev-${Date.now()}`,
        year: civilization.currentYear,
        day: civilization.currentDay,
        title: `Expansion Cancelled: ${building.name}`,
        description: `Upgrade project called off. Structure restored to Level ${building.level} baseline (${refund} materials salvaged).`,
        category: 'economic',
        severity: 'info',
        isRead: false,
      };
      setEvents((prev) => [event, ...prev]);
      return true;
    }

    return false;
  };

  const toggleFacilityActive = (buildingId: string) => {
    const building = placedBuildings.find((b) => b.id === buildingId);
    if (!building || (building.status !== 'active' && building.status !== 'offline')) return;

    const willBeOffline = building.status === 'active';
    const item = buildingCatalog.find((c) => c.id === building.catalogId);

    if (item?.productionType && item?.productionAmount) {
      setRates((prev) => {
        const key = `${item.productionType}Rate` as keyof ResourceRates;
        const delta = willBeOffline ? -item.productionAmount : item.productionAmount;
        return {
          ...prev,
          [key]: (prev[key] as number) + delta,
        };
      });
    }

    setPlacedBuildings((prev) =>
      prev.map((b) =>
        b.id === buildingId
          ? {
              ...b,
              status: willBeOffline ? 'offline' : 'active',
              workersAssigned: willBeOffline ? 0 : item?.workerReq || b.workersNeeded,
            }
          : b
      )
    );

    const event: GameEvent = {
      id: `ev-${Date.now()}`,
      year: civilization.currentYear,
      day: civilization.currentDay,
      title: willBeOffline
        ? `Facility Paused: ${building.name}`
        : `Facility Reactivated: ${building.name}`,
      description: willBeOffline
        ? `Operations suspended. Facility placed on cold standby.`
        : `Operations resumed. Facility online at full efficiency.`,
      category: 'economic',
      severity: willBeOffline ? 'warning' : 'info',
      isRead: false,
    };
    setEvents((prev) => [event, ...prev]);
  };

  const demolishBuilding = (buildingId: string) => {
    const building = placedBuildings.find((b) => b.id === buildingId);
    if (!building) return;

    // Save state snapshot for Undo/Redo
    pushSnapshot();

    setPlacedBuildings((prev) => prev.filter((b) => b.id !== buildingId));
    civilizationApi.decommissionFacility(civilization.id, buildingId).catch(() => {});
    setSelectedBuildingId(null);
    setActiveDrawer('none');

    // Refund some materials
    setResources((prev) => ({
      ...prev,
      materials: prev.materials + 150,
    }));

    const event: GameEvent = {
      id: `ev-${Date.now()}`,
      year: civilization.currentYear,
      day: civilization.currentDay,
      title: `Demolished: ${building.name}`,
      description: `Facility decommissioned and salvaged for 150 structural materials.`,
      category: 'economic',
      severity: 'info',
      isRead: false,
    };
    setEvents((prev) => [event, ...prev]);
  };

  const startResearch = (techId: string) => {
    const tech = technologies.find((t) => t.id === techId);
    if (!tech || tech.isResearched) return false;

    soundFx.playResearchStart();
    civilizationApi.queueResearch(civilization.id, techId).catch(() => {});

    setTechnologies((prev) =>
      prev.map((t) => {
        if (t.id === techId) {
          return { ...t, isAvailable: true };
        }
        return t;
      })
    );
    return true;
  };

  const triggerEureka = (techId: string) => {
    const tech = technologies.find((t) => t.id === techId);
    soundFx.playEureka();
    triggerToast({
      type: 'eureka',
      title: '⚡ EUREKA BREAKTHROUGH!',
      subtitle: tech ? `${tech.name}: 50% Research Cost Discount!` : '50% Research Discount Applied!',
    });
    setTechnologies((prev) =>
      prev.map((t) => {
        if (t.id === techId) {
          const discount = Math.round(t.costResearchPoints * 0.5);
          return {
            ...t,
            isEurekaBoosted: true,
            progress: Math.min(t.costResearchPoints, t.progress + discount),
          };
        }
        return t;
      })
    );
  };

  const togglePolicy = (policyId: string) => {
    civilizationApi.enactPolicy(civilization.id, policyId, 1).catch(() => {});
    setPolicies((prev) =>
      prev.map((p) => {
        if (p.id === policyId) {
          const nextActive = !p.isActive;
          // Apply instant political capital impact
          if (nextActive) {
            setResources((r) => ({
              ...r,
              politicalCapital: Math.max(0, r.politicalCapital - p.costPoliticalCapital),
              happiness: Math.min(100, Math.max(0, r.happiness + p.effectsSummary.happinessModifier)),
              stability: Math.min(100, Math.max(0, r.stability + p.effectsSummary.stabilityModifier)),
              environmentalIndex: Math.min(100, Math.max(0, r.environmentalIndex + p.effectsSummary.environmentModifier)),
            }));

            // Reflect on citizen thoughts and public discourse
            setCitizens((cPrev) =>
              cPrev.map((c, i) =>
                i % 3 === 0
                  ? {
                      ...c,
                      currentThought: `Discussing ${p.name}: ${
                        p.effectsSummary.happinessModifier >= 0
                          ? 'Optimistic about new civil reforms.'
                          : 'Cautiously adapting to administrative directives.'
                      }`,
                    }
                  : c
              )
            );

            // Announce in Chirper feed
            setChirperFeed((feedPrev) => [
              {
                id: `chirp-policy-${Date.now()}`,
                author: 'Civic Directorate Dispatch',
                handle: '@imperial_council',
                avatar: '🏛️',
                text: `High Council Directive: "${p.name}" has been ratified into imperial law. Municipal sectors are synchronizing.`,
                time: 'Just now',
                district: 'Imperial Citadel',
                likes: Math.floor(Math.random() * 20) + 5,
                isLiked: false,
                tag: '#ImperialDecree',
              },
              ...feedPrev.slice(0, 24),
            ]);

            // Feed outcome back into backend self-learning model
            const estimatedApproval = Math.min(95, Math.max(25, 60 + p.effectsSummary.happinessModifier * 2));
            civilizationApi
              .recordPolicyFeedback({
                policy_id: p.id,
                policy_name: p.name,
                category: p.category,
                predicted_approval: estimatedApproval,
                actual_approval: estimatedApproval + (Math.random() * 6 - 3),
                world_id: civilization.id,
              })
              .catch(() => {});
          }
          return {
            ...p,
            isActive: nextActive,
            daysActive: nextActive ? (p.daysActive || 1) : p.daysActive,
            assimilationProgress: nextActive ? (p.assimilationProgress || 5) : p.assimilationProgress,
            enactedAtDay: nextActive ? civilization.currentDay : p.enactedAtDay,
            enactedAtYear: nextActive ? civilization.currentYear : p.enactedAtYear,
            currentPhase: nextActive ? (p.currentPhase || 'Friction & Resistance') : p.currentPhase,
            researchFindings: p.researchFindings || {
              totalObservations: 1,
              measuredHappinessShift: 0,
              measuredProductivityShift: 0,
              measuredStabilityShift: 0,
              evolutionaryAdaptationScore: 5,
              breakthroughDiscovery: `Initial rollout of ${p.name} active. Tracking baseline living citizen compliance.`,
              isResearchSubmitted: false,
            },
          };
        }
        return p;
      })
    );
  };

  const submitPolicyResearchFindings = (policyId: string): boolean => {
    const policy = policies.find((p) => p.id === policyId);
    if (!policy || !policy.isActive) return false;
    const progress = policy.assimilationProgress || 0;
    if (progress < 50) return false;
    if (policy.researchFindings?.isResearchSubmitted) return false;

    // Award +250 GRC and +500 XP
    setResources((r) => ({
      ...r,
      grc: r.grc + 250,
      happiness: Math.min(100, r.happiness + 2),
    }));

    setCivilization((c) => ({
      ...c,
      xp: c.xp + 500,
    }));

    // Mark as submitted
    setPolicies((prev) =>
      prev.map((p) =>
        p.id === policyId
          ? {
              ...p,
              researchFindings: {
                ...(p.researchFindings || {
                  totalObservations: 100,
                  measuredHappinessShift: p.effectsSummary.happinessModifier,
                  measuredProductivityShift: p.effectsSummary.gdpModifier,
                  measuredStabilityShift: p.effectsSummary.stabilityModifier,
                  evolutionaryAdaptationScore: Math.round(progress),
                  breakthroughDiscovery: `Empirical research whitepaper finalized on ${p.name}.`,
                  isResearchSubmitted: true,
                }),
                isResearchSubmitted: true,
                submittedAtDay: civilization.currentDay,
                submittedAtYear: civilization.currentYear,
              },
            }
          : p
      )
    );

    const event: GameEvent = {
      id: `ev-res-${Date.now()}`,
      year: civilization.currentYear,
      day: civilization.currentDay,
      title: `Empirical Research Submitted: ${policy.name}`,
      description: `Longitudinal policy findings successfully compiled across ${policy.daysActive || 60} days! Sovereign Directorate awarded +250 GRC & +500 XP.`,
      category: 'breakthrough',
      severity: 'success',
      isRead: false,
    };
    setEvents((prev) => [event, ...prev]);

    // Permanent record in Civilisation Chronicle
    const chronicleEntry: ChronicleEntry = {
      id: `chron-res-${Date.now()}`,
      year: civilization.currentYear,
      day: civilization.currentDay,
      era: civilization.era || 'Era I: Dawn of Genesis',
      title: `Empirical Research Monograph: ${policy.name}`,
      category: 'Breakthrough',
      description: `Official longitudinal empirical study compiled by the High Directorate across ${policy.daysActive || 60} simulation days.`,
      relatedPolicy: policy.name,
      impactSummary: `Measured population shift: +${policy.effectsSummary.happinessModifier} happiness, +${policy.effectsSummary.gdpModifier}% productivity. Public compliance reached ${Math.round(progress)}%.`,
    };
    setChronicle((prev) => [chronicleEntry, ...prev]);

    // Financial grant record in Research Wallet
    const transaction: ResearchTransaction = {
      id: `tx-res-${Date.now()}`,
      timestamp: `Year ${civilization.currentYear}, Day ${civilization.currentDay}`,
      simYear: civilization.currentYear,
      simDay: civilization.currentDay,
      type: 'Grant',
      description: `Empirical Research Grant: ${policy.name} Monograph`,
      amount: 250,
      balanceAfter: resources.grc + 250,
      status: 'Confirmed',
    };
    setTransactions((prev) => [transaction, ...prev]);

    soundFx.playReward();
    triggerToast({
      type: 'reward',
      title: `EMPIRICAL RESEARCH SUBMITTED: ${policy.name}`,
      subtitle: `+250 GRC and +500 Civilization XP awarded! Whitepaper cataloged in High Directorate archives.`,
    });

    // Provide final longitudinal empirical outcome to backend self-learning model
    civilizationApi
      .recordPolicyFeedback({
        policy_id: policy.id,
        policy_name: policy.name,
        category: policy.category,
        predicted_approval: 60 + policy.effectsSummary.happinessModifier * 2,
        actual_approval: 60 + (policy.effectsSummary.happinessModifier * 2) + 4.5,
        world_id: civilization.id,
      })
      .catch(() => {});

    return true;
  };

  const addCustomPolicy = (policy: Policy) => {
    setPolicies((prev) => {
      if (prev.some((p) => p.id === policy.id)) return prev;
      return [policy, ...prev];
    });
  };

  const updatePolicySlider = (policyId: string, value: number) => {
    setPolicies((prev) =>
      prev.map((p) => (p.id === policyId ? { ...p, sliderValue: value } : p))
    );
  };

  const runScenario = (scenarioId: string) => {
    const scenario = scenarios.find((s) => s.id === scenarioId);
    if (!scenario) return false;
    if (resources.grc < scenario.grcCost) return false;

    // Deduct GRC
    setResources((prev) => ({
      ...prev,
      grc: prev.grc - scenario.grcCost,
    }));

    const event: GameEvent = {
      id: `ev-${Date.now()}`,
      year: civilization.currentYear,
      day: civilization.currentDay,
      title: `Simulation Completed: ${scenario.title}`,
      description: `Quantum predictive simulation synthesized over ${scenario.horizonYears}-year horizon. Results logged in Future Simulator.`,
      category: 'breakthrough',
      severity: 'success',
      isRead: false,
    };
    setEvents((prev) => [event, ...prev]);
    return true;
  };

  const startExperiment = (experimentId: string) => {
    const exp = experiments.find((e) => e.id === experimentId);
    if (!exp) return false;
    if (resources.grc < exp.grcCost) return false;

    setResources((prev) => ({
      ...prev,
      grc: prev.grc - exp.grcCost,
    }));

    setExperiments((prev) =>
      prev.map((e) => (e.id === experimentId ? { ...e, status: 'Active', currentDay: 0 } : e))
    );

    const event: GameEvent = {
      id: `ev-${Date.now()}`,
      year: civilization.currentYear,
      day: civilization.currentDay,
      title: `Initiated Experiment: ${exp.title}`,
      description: `Trial cohorts seeded. Telemetry streams active. Duration: ${exp.durationDays} days.`,
      category: 'breakthrough',
      severity: 'info',
      isRead: false,
    };
    setEvents((prev) => [event, ...prev]);
    return true;
  };

  const claimAchievement = (achievementId: string) => {
    const ach = achievements.find((a) => a.id === achievementId);
    if (!ach || !ach.isUnlocked) return;

    setResources((prev) => ({
      ...prev,
      grc: prev.grc + ach.rewardGrc,
    }));

    setAchievements((prev) =>
      prev.map((a) => (a.id === achievementId ? { ...a, progress: a.maxProgress } : a))
    );

    const event: GameEvent = {
      id: `ev-${Date.now()}`,
      year: civilization.currentYear,
      day: civilization.currentDay,
      title: `Reward Claimed: ${ach.title}`,
      description: `Awarded +${ach.rewardGrc} Genesis Research Credits (GRC).`,
      category: 'economic',
      severity: 'success',
      isRead: false,
    };
    setEvents((prev) => [event, ...prev]);
  };

  const claimQuest = (questId: string) => {
    const q = quests.find((quest) => quest.id === questId);
    if (!q || !q.isCompleted || q.isClaimed) return;

    soundFx.playRewardClaim();
    triggerToast({
      type: 'reward',
      title: `🎯 QUEST REWARD CLAIMED!`,
      subtitle: `+${q.rewardGrc} GRC & +${q.rewardXp} Civilisation XP`,
    });

    setResources((prev) => ({
      ...prev,
      grc: prev.grc + q.rewardGrc,
    }));

    setCivilization((prev) => {
      const nextXp = prev.xp + q.rewardXp;
      if (nextXp >= prev.xpToNextLevel) {
        soundFx.playRewardClaim();
        const nextLevel = prev.level + 1;
        setLevelUpCelebration({
          level: nextLevel,
          era: prev.era,
          perks: [
            '+500 GRC Sovereign Treasury Grant',
            'District Grid Tier Expansion Unlocked',
            '+15% Civilisation Happiness & Production Output',
          ],
        });
        setResources((r) => ({ ...r, grc: r.grc + 500 }));
        return {
          ...prev,
          level: nextLevel,
          xp: nextXp - prev.xpToNextLevel,
          xpToNextLevel: Math.round(prev.xpToNextLevel * 1.5),
        };
      }
      return { ...prev, xp: nextXp };
    });

    setQuests((prev) =>
      prev.map((quest) => (quest.id === questId ? { ...quest, isClaimed: true } : quest))
    );

    const event: GameEvent = {
      id: `ev-${Date.now()}`,
      year: civilization.currentYear,
      day: civilization.currentDay,
      title: `Quest Victory: ${q.title}!`,
      description: `Claimed +${q.rewardGrc} GRC and +${q.rewardXp} Civilisation XP!`,
      category: 'breakthrough',
      severity: 'success',
      isRead: false,
    };
    setEvents((prev) => [event, ...prev]);
  };

  const triggerDisaster = (type: DisasterType, intensity: DisasterIntensity, districtId?: string) => {
    const dId = districtId || 'dist-residential';
    const newDisaster = createDisaster(type, intensity, dId);
    setDisasterState((prev) => ({
      ...prev,
      activeDisaster: newDisaster,
      emergencyForces: {
        ...prev.emergencyForces,
        medicalUnitsActive: Math.min(prev.emergencyForces.medicalUnitsTotal, 3),
        fireCrewsActive: type === 'wildfire' ? prev.emergencyForces.fireCrewsTotal : 2,
        rescueTeamsActive: 2,
        repairEngineersActive: 3,
      },
    }));

    setEvents((prev) => [
      {
        id: `ev-${Date.now()}-disaster`,
        year: civilization.currentYear,
        day: civilization.currentDay,
        title: `CRISIS ALERT: ${newDisaster.name}`,
        description: `Natural disaster detected in ${districts.find((d) => d.id === dId)?.name || 'city sector'}. Emergency response units dispatched.`,
        category: 'crisis',
        severity: 'critical',
        isRead: false,
      },
      ...prev,
    ]);
  };

  const dispatchEmergencyResponse = () => {
    setDisasterState((prev) => {
      if (!prev.activeDisaster) return prev;
      return {
        ...prev,
        activeDisaster: {
          ...prev.activeDisaster,
          containmentPercent: Math.min(100, prev.activeDisaster.containmentPercent + 35),
          stage: prev.activeDisaster.containmentPercent + 35 >= 100 ? 'recovering' : 'containing',
        },
      };
    });
  };

  const restoreAllDisasters = () => {
    setPlacedBuildings((prev) => emergencyFullCivilizationRestoration(prev));
    setDisasterState((prev) => ({
      ...prev,
      activeDisaster: null,
      emergencyForces: {
        ...prev.emergencyForces,
        medicalUnitsActive: 0,
        fireCrewsActive: 0,
        rescueTeamsActive: 0,
        repairEngineersActive: 0,
      },
    }));
  };

  const toggleAutoDisasters = () => {
    setDisasterState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        autoDisastersEnabled: !prev.settings.autoDisastersEnabled,
      },
    }));
  };

  const createNewCivilization = (data: Partial<CivilizationProfile>) => {
    // 1. Archive current active world first
    saveGameStateToStorage(latestStateRef.current);

    const newCiv: CivilizationProfile = {
      id: `civ-${Date.now().toString().slice(-4)}`,
      name: data.name || 'Nova Terra',
      planet: data.planet || 'Kepler-452c',
      era: data.era || 'Foundational',
      level: 1,
      xp: 0,
      xpToNextLevel: 1000,
      leaderTitle: data.leaderTitle || 'First Pioneer',
      governanceModel: data.governanceModel || 'Direct Frontier Council',
      foundingYear: 1,
      currentYear: 1,
      currentDay: 1,
      terrainType: data.terrainType || 'Verdant River Valley',
      climateType: data.climateType || 'Temperate',
    };

    const newSavedWorlds = [newCiv, ...savedWorlds];
    const newAgents = createInitialDetailedAgents(initialCitizens, 1);

    setCivilization(newCiv);
    setSavedWorlds(newSavedWorlds);
    setPlacedBuildings(initialPlacedBuildings);
    setResources(initialResources);
    setRates(initialRates);
    setDistricts(initialDistricts);
    setCitizens(initialCitizens);
    setDetailedAgents(newAgents);
    setZonedTiles([]);
    setTechnologies(initialTechnologies);
    setPolicies(initialPolicies);

    // Save immediately so the fresh world is persisted as active state
    saveGameStateToStorage({
      version: 2,
      timestamp: Date.now(),
      civilization: newCiv,
      resources: initialResources,
      rates: initialRates,
      districts: initialDistricts,
      placedBuildings: initialPlacedBuildings,
      technologies: initialTechnologies,
      policies: initialPolicies,
      citizens: initialCitizens,
      detailedAgents: newAgents,
      quests: initialQuests,
      missions: initialMissions,
      chronicle: initialChronicleEntries,
      transactions: initialTransactions,
      achievements: initialAchievements,
      zonedTiles: [],
      taxRate: 18,
      savedWorlds: newSavedWorlds,
    });

    triggerToast({
      type: 'info',
      title: `🌱 Welcome to ${newCiv.name}!`,
      subtitle: `Your 10 founding pioneers have landed on ${newCiv.terrainType}. Build your colony from the ground up!`,
      icon: '🚀',
    });
  };

  const loadCivilization = (civId: string) => {
    // 1. Save currently active world before switching
    saveGameStateToStorage(latestStateRef.current);

    // 2. Check if target world has saved state in storage
    const savedForTarget = loadGameStateForWorld(civId);
    if (savedForTarget) {
      setCivilization(savedForTarget.civilization);
      setPlacedBuildings(savedForTarget.placedBuildings);
      setResources(savedForTarget.resources);
      setRates(savedForTarget.rates);
      setDistricts(savedForTarget.districts);
      setCitizens(savedForTarget.citizens);
      setDetailedAgents(
        savedForTarget.detailedAgents ||
        createInitialDetailedAgents(savedForTarget.citizens, savedForTarget.civilization.level)
      );
      setTechnologies(savedForTarget.technologies || initialTechnologies);
      setPolicies(savedForTarget.policies || initialPolicies);
      setZonedTiles(savedForTarget.zonedTiles || []);
      setTaxRate(savedForTarget.taxRate ?? 18);
      if (savedForTarget.quests) setQuests(savedForTarget.quests);
      if (savedForTarget.missions) setMissions(savedForTarget.missions);
      if (savedForTarget.chronicle) setChronicle(savedForTarget.chronicle);

      saveGameStateToStorage(savedForTarget);
      triggerToast({
        type: 'info',
        title: `🏛️ World Loaded: ${savedForTarget.civilization.name}`,
        subtitle: `Resumed from your saved progress at Day ${savedForTarget.civilization.currentDay}, Year ${savedForTarget.civilization.currentYear}.`,
        icon: '💾',
      });
      return;
    }

    const target = savedWorlds.find((w) => w.id === civId);
    if (target) {
      setCivilization(target);
      if (civId === 'civ-kyoto-demo' || civId === 'civ-01') {
        setPlacedBuildings(demoMetropolisBuildings);
        setResources(demoMetropolisResources);
        setRates(demoMetropolisRates);
        setDistricts(demoMetropolisDistricts);
        setCitizens(demoMetropolisCitizens);
        setDetailedAgents(createInitialDetailedAgents(demoMetropolisCitizens, 5));
      } else {
        setPlacedBuildings(initialPlacedBuildings);
        setResources(initialResources);
        setRates(initialRates);
        setDistricts(initialDistricts);
        setCitizens(initialCitizens);
        setDetailedAgents(createInitialDetailedAgents(initialCitizens, 1));
      }
    }
  };

  const markEventRead = (eventId: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, isRead: true } : e))
    );
  };

  const citadel = useMemo(
    () => placedBuildings.find((b) => b.modelType === 'citadel' || b.catalogId === 'bld-gov-citadel'),
    [placedBuildings]
  );
  const citadelLevel = citadel?.level || civilization.level || 1;
  const citadelTerritoryRadius = useMemo(() => getCitadelTerritoryRadius(citadelLevel), [citadelLevel]);
  const calculateUpgradeCost = useCallback(
    (b: PlacedBuilding) =>
      calculateBuildingUpgradeCost(
        b,
        buildingCatalog.find((c) => c.id === b.catalogId)
      ),
    []
  );

  const contextValue = useMemo<GameStateContextType>(
    () => ({
      civilization,
      savedWorlds,
      resources,
      rates,
      districts,
      placedBuildings,
      catalog: buildingCatalog,
      technologies,
      policies,
      citizens,
      scenarios,
      experiments,
      achievements,
      events,
      economyReport,
      disasterState,
      citizenReport,
      triggerDisaster,
      dispatchEmergencyResponse,
      restoreAllDisasters,
      toggleAutoDisasters,
      isPlaying,
      speed,
      selectedBuildingId,
      selectedBuilding,
      selectedCitizenId,
      selectedCitizen,
      selectCitizen,
      activeLayer,
      isConstructionMode,
      selectedCatalogItem,
      activeDrawer,
      relocatingBuildingId,
      citadelTerritoryRadius,
      calculateUpgradeCost,
      saveGame,
      lastSavedTimestamp,
      isSaving,
      togglePlay,
      setSpeed,
      advanceTick,
      advanceYear,
      selectBuilding,
      setActiveLayer,
      setConstructionMode,
      placeBuilding,
      startRelocation,
      cancelRelocation,
      relocateBuilding,
      rotateBuilding,
      repairBuilding,
      upgradeBuilding,
      rushConstruction,
      cancelConstruction,
      toggleFacilityActive,
      demolishBuilding,
      startResearch,
      togglePolicy,
      updatePolicySlider,
      addCustomPolicy,
      submitPolicyResearchFindings,
      runScenario,
      startExperiment,
      claimAchievement,
      quests,
      claimQuest,
      missions,
      claimMission,
      chronicle,
      transactions,
      eras,
      playerTitles,
      claimTitle,
      triggerEureka,
      toasts,
      triggerToast,
      dismissToast,
      levelUpCelebration,
      dismissLevelUp,
      createNewCivilization,
      loadCivilization,
      markEventRead,
      setActiveDrawer,
      taxRate,
      setTaxRate,
      activeProtest,
      isProtestModalOpen,
      setIsProtestModalOpen,
      resolveProtest,
      triggerNextProtest,
      isDemoModalOpen,
      setIsDemoModalOpen,
      loadMaxDemoWorld,
      showFireworks,
      triggerFireworks,
      isCinematicTour,
      setIsCinematicTour,
      activeInfoView,
      setActiveInfoView,
      rciDemand,
      activeZoneTool,
      setActiveZoneTool,
      zoneMode,
      setZoneMode,
      zonedTiles,
      paintZoneTile,
      chirperFeed,
      likeChirp,
      isChirperOpen,
      setIsChirperOpen,
      cityMilestones,
      isMilestonesModalOpen,
      setIsMilestonesModalOpen,
      isBulldozerActive,
      setIsBulldozerActive,
      utilityStats,
      inspectedCitizen,
      setInspectedCitizen,
      // Undo & Redo History
      canUndo: historyStack.length > 0,
      canRedo: redoStack.length > 0,
      undo,
      redo,
      // CS2 Modals & Overlays
      isTutorialOpen,
      setIsTutorialOpen,
      isShortcutsOpen,
      setIsShortcutsOpen,
      isBudgetOpen,
      setIsBudgetOpen,
      isStatisticsOpen,
      setIsStatisticsOpen,
    }),
    [
      civilization,
      savedWorlds,
      resources,
      rates,
      districts,
      placedBuildings,
      technologies,
      policies,
      citizens,
      scenarios,
      experiments,
      achievements,
      events,
      economyReport,
      disasterState,
      citizenReport,
      triggerDisaster,
      dispatchEmergencyResponse,
      restoreAllDisasters,
      toggleAutoDisasters,
      isPlaying,
      speed,
      selectedBuildingId,
      selectedBuilding,
      selectedCitizenId,
      selectedCitizen,
      selectCitizen,
      activeLayer,
      isConstructionMode,
      selectedCatalogItem,
      activeDrawer,
      relocatingBuildingId,
      quests,
      missions,
      chronicle,
      transactions,
      eras,
      playerTitles,
      toasts,
      levelUpCelebration,
      taxRate,
      activeProtest,
      isProtestModalOpen,
      isDemoModalOpen,
      showFireworks,
      isCinematicTour,
      activeInfoView,
      rciDemand,
      activeZoneTool,
      zoneMode,
      zonedTiles,
      chirperFeed,
      isChirperOpen,
      cityMilestones,
      isMilestonesModalOpen,
      isBulldozerActive,
      utilityStats,
      inspectedCitizen,
      historyStack.length,
      redoStack.length,
      undo,
      redo,
      isTutorialOpen,
      isShortcutsOpen,
      isBudgetOpen,
      isStatisticsOpen,
      advanceTick,
      advanceYear,
      claimAchievement,
      claimMission,
      claimQuest,
      claimTitle,
      createNewCivilization,
      dismissLevelUp,
      dismissToast,
      loadCivilization,
      loadMaxDemoWorld,
      markEventRead,
      resolveProtest,
      triggerEureka,
      triggerFireworks,
      triggerNextProtest,
      triggerToast,
      saveGame,
      lastSavedTimestamp,
      isSaving,
    ]
  );

  return (
    <GameStateContext.Provider value={contextValue}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
}

