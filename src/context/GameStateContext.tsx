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
} from '../types/game';
import {
  initialCivilization,
  alternateWorlds,
  initialResources,
  initialRates,
  initialDistricts,
  buildingCatalog,
  initialPlacedBuildings,
  initialTechnologies,
  initialPolicies,
  initialCitizens,
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
import {
  calculateCitySimulation,
  CitySimulationReport,
} from '../simulation/economySimulationEngine';

export type MapLayer = 'all' | 'infrastructure' | 'population' | 'resources' | 'environment' | 'economy';
export type ActiveDrawer = 'none' | 'notifications' | 'codex' | 'timeline' | 'construction' | 'buildingInspector' | 'economy';

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
  activeLayer: MapLayer;
  isConstructionMode: boolean;
  selectedCatalogItem: BuildingCatalogItem | null;
  activeDrawer: ActiveDrawer;
  relocatingBuildingId: string | null;
  
  // Action Handlers
  togglePlay: () => void;
  setSpeed: (speed: '1x' | '2x' | '5x' | '10x') => void;
  advanceTick: () => void;
  advanceYear: () => void;
  selectBuilding: (id: string | null) => void;
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
}

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [civilization, setCivilization] = useState<CivilizationProfile>(initialCivilization);
  const [savedWorlds, setSavedWorlds] = useState<CivilizationProfile[]>(alternateWorlds);
  const [resources, setResources] = useState<ResourceState>(initialResources);
  const [rates, setRates] = useState<ResourceRates>(initialRates);
  const [districts] = useState<District[]>(initialDistricts);
  const [placedBuildings, setPlacedBuildings] = useState<PlacedBuilding[]>(initialPlacedBuildings);
  const [technologies, setTechnologies] = useState<Technology[]>(initialTechnologies);
  const [policies, setPolicies] = useState<Policy[]>(initialPolicies);
  const [citizens] = useState<Citizen[]>(initialCitizens);
  const [scenarios] = useState<SimulationScenario[]>(simulationScenarios);
  const [experiments, setExperiments] = useState<Experiment[]>(initialExperiments);
  const [achievements, setAchievements] = useState<Achievement[]>(initialAchievements);
  const [events, setEvents] = useState<GameEvent[]>(initialEvents);
  const [quests, setQuests] = useState<GameQuest[]>(initialQuests);
  const [missions, setMissions] = useState<CivoraMission[]>(initialMissions);
  const [chronicle, setChronicle] = useState<ChronicleEntry[]>(initialChronicleEntries);
  const [transactions, setTransactions] = useState<ResearchTransaction[]>(initialTransactions);
  const [eras, setEras] = useState<HistoricalEraDefinition[]>(historicalErasList);
  const [playerTitles, setPlayerTitles] = useState<PlayerTitle[]>(playerTitlesList);
  const [toasts, setToasts] = useState<GameToast[]>([]);
  const [levelUpCelebration, setLevelUpCelebration] = useState<{
    level: number;
    era: string;
    perks: string[];
  } | null>(null);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const triggerToast = useCallback((toast: Omit<GameToast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newToast: GameToast = { ...toast, id };
    setToasts((prev) => [newToast, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

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
  
  const [taxRate, setTaxRate] = useState<number>(18); // %
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<'1x' | '2x' | '5x' | '10x'>('1x');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<MapLayer>('all');
  const [isConstructionMode, setIsConstructionMode] = useState<boolean>(false);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<BuildingCatalogItem | null>(null);
  const [activeDrawer, setActiveDrawer] = useState<ActiveDrawer>('none');
  const [relocatingBuildingId, setRelocatingBuildingId] = useState<string | null>(null);

  // Cities: Skylines II Simulation State
  const [activeInfoView, setActiveInfoView] = useState<InfoViewType>('none');
  const [activeZoneTool, setActiveZoneTool] = useState<ZoneType | null>(null);
  const [zoneMode, setZoneMode] = useState<'brush' | 'marquee'>('brush');
  const [zonedTiles, setZonedTiles] = useState<ZonedTile[]>(initialZonedTiles);
  const [chirperFeed, setChirperFeed] = useState<ChirperMessage[]>(initialChirperMessages);
  const [isChirperOpen, setIsChirperOpen] = useState<boolean>(false);
  const [cityMilestones, setCityMilestones] = useState<CityMilestone[]>(initialCityMilestones);
  const [isMilestonesModalOpen, setIsMilestonesModalOpen] = useState<boolean>(false);
  const [isBulldozerActive, setIsBulldozerActive] = useState<boolean>(false);
  const [inspectedCitizen, setInspectedCitizen] = useState<Citizen | null>(null);

  // Dynamic RCI Demand & Utility calculation state
  const [rciDemand, setRciDemand] = useState<RciDemand>(() =>
    calculateRciDemand(initialResources.population, initialPlacedBuildings, 18, 95)
  );
  const [utilityStats, setUtilityStats] = useState<UtilityStats>(() =>
    calculateUtilityStats(initialPlacedBuildings, initialResources.population)
  );

  const likeChirp = useCallback((chirpId: string) => {
    setChirperFeed((prev) =>
      prev.map((c) =>
        c.id === chirpId
          ? { ...c, likes: c.isLiked ? c.likes - 1 : c.likes + 1, isLiked: !c.isLiked }
          : c
      )
    );
  }, []);

  const paintZoneTile = useCallback((x: number, z: number, zoneType: ZoneType) => {
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
  }, []);

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
      setTimeout(() => {
        setProtestIndex((idx) => {
          const next = (idx + 1) % historicalTwinProtests.length;
          setActiveProtest(historicalTwinProtests[next]);
          return next;
        });
      }, 45000);
    },
    [activeProtest, triggerToast]
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
    setCivilization({
      id: 'civ-kyoto-demo',
      name: 'Kyoto Prime · Nexus Metropole',
      planet: 'Genesis Terra-IV',
      era: 'Synthetic / AI',
      level: 12,
      xp: 18400,
      xpToNextLevel: 20000,
      leaderTitle: 'High Strategist & Archon',
      governanceModel: 'Techno-Democratic Federation',
      foundingYear: 1,
      currentYear: 142,
      currentDay: 288,
      terrainType: 'Verdant River Valley',
      climateType: 'Temperate',
    });
    setResources({
      food: 42500,
      water: 58000,
      energy: 36400,
      materials: 28500,
      researchPoints: 14200,
      grc: 8450,
      population: 2840000,
      gdp: 148.65,
      happiness: 94,
      health: 96,
      stability: 95,
      environmentalIndex: 89,
      educationIndex: 96,
      politicalCapital: 1450,
    });
    setPlacedBuildings(initialPlacedBuildings);
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
    setTimeout(() => setShowFireworks(false), 8500);
    triggerToast({
      type: 'reward',
      title: '🎆 GRAND CARNIVAL SPECTACLE',
      subtitle: 'Fireworks illuminate the Citadel spire! Stability +3%, Happiness +5%',
      icon: '🎆',
    });
  }, [triggerToast]);

  const speedMultipliers = { '1x': 1, '2x': 2, '5x': 5, '10x': 10 };
  const mult = speedMultipliers[speed];

  const selectedBuilding = placedBuildings.find((b) => b.id === selectedBuildingId) || null;

  // Centralized City Simulation Report (Calculates fiscal flows, resource accounting, district metrics, demands & alerts)
  const economyReport = useMemo(() => {
    return calculateCitySimulation(placedBuildings, buildingCatalog, resources, districts, taxRate);
  }, [placedBuildings, resources, districts, taxRate]);

  // Throttled tick accumulator to eliminate HTTP flooding latency
  const accumulatedTicksRef = useRef(0);
  const lastBackendSyncRef = useRef(Date.now());

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
      const liveReport = calculateCitySimulation(placedBuildings, buildingCatalog, prev, districts, taxRate);

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
          const nextUp = Math.min(100, currentUp + 5);
          if (nextUp >= 100) {
            const nextLvl = b.targetLevel || (b.level + 1);
            const item = buildingCatalog.find((c) => c.id === b.catalogId);
            if (item?.productionType && item?.productionAmount) {
              const rKey = `${item.productionType}Rate` as keyof ResourceRates;
              const bonus = Math.round(item.productionAmount * 0.25);
              rateDeltas[rKey] = (rateDeltas[rKey] || 0) + bonus;
              ratesChanged = true;
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

    // 7. Real-time Citizen Chirper Network
    if (Math.random() < 0.25 && districts.length > 0) {
      const dName = districts[Math.floor(Math.random() * districts.length)].name;
      const newChirp = generateRandomChirp(dName);
      setChirperFeed((prev) => [newChirp, ...prev.slice(0, 24)]);
    }

    // 8. Throttled background sync to FastAPI backend (flushes at most once every 4 seconds)
    accumulatedTicksRef.current += 1;
    const now = Date.now();
    if (now - lastBackendSyncRef.current >= 4000) {
      const ticksToSync = accumulatedTicksRef.current;
      accumulatedTicksRef.current = 0;
      lastBackendSyncRef.current = now;
      civilizationApi.advanceSimulationTicks(civilization.id, ticksToSync).catch(() => {});
    }
  }, [rates, resources.population, resources.health, placedBuildings, taxRate, districts, civilization]);

  // Flush accumulated ticks when paused
  useEffect(() => {
    if (!isPlaying && accumulatedTicksRef.current > 0) {
      const ticks = accumulatedTicksRef.current;
      accumulatedTicksRef.current = 0;
      civilizationApi.advanceSimulationTicks(civilization.id, ticks).catch(() => {});
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
      setActiveDrawer('buildingInspector');
    }
  };

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

    const upgradeCost = building.level * 280;
    if (resources.materials < upgradeCost) {
      const errEvent: GameEvent = {
        id: `ev-${Date.now()}`,
        year: civilization.currentYear,
        day: civilization.currentDay,
        title: 'Upgrade Suspended: Insufficient Materials',
        description: `Upgrade to Level ${building.level + 1} requires ${upgradeCost} materials. Available: ${resources.materials}.`,
        category: 'economic',
        severity: 'warning',
        isRead: false,
      };
      setEvents((prev) => [errEvent, ...prev]);
      return false;
    }

    setResources((prev) => ({
      ...prev,
      materials: prev.materials - upgradeCost,
      grc: prev.grc + 15,
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
      title: `EXPANSION UNDERWAY: ${building.name}`,
      subtitle: `Upgrading to Level ${building.level + 1}. Construction crew dispatched.`,
    });

    const event: GameEvent = {
      id: `ev-${Date.now()}`,
      year: civilization.currentYear,
      day: civilization.currentDay,
      title: `Expansion Commenced: ${building.name}`,
      description: `Structural renovation underway targeting Level ${building.level + 1}.`,
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
      const item = buildingCatalog.find((c) => c.id === building.catalogId);
      if (item?.productionType && item?.productionAmount) {
        setRates((prev) => {
          const key = `${item.productionType}Rate` as keyof ResourceRates;
          const bonus = Math.round(item.productionAmount * 0.25);
          return {
            ...prev,
            [key]: (prev[key] as number) + bonus,
          };
        });
      }

      setPlacedBuildings((prev) =>
        prev.map((b) =>
          b.id === buildingId
            ? {
                ...b,
                status: 'active',
                level: nextLvl,
                upgradeProgress: 0,
                targetLevel: undefined,
                health: 100,
                efficiency: Math.min(100, b.efficiency + 5),
              }
            : b
        )
      );

      const event: GameEvent = {
        id: `ev-${Date.now()}`,
        year: civilization.currentYear,
        day: civilization.currentDay,
        title: `Priority Upgrade Complete: ${building.name} (Level ${nextLvl})`,
        description: `Expansion accelerated with emergency capital. All structural enhancements active!`,
        category: 'economic',
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
          }
          return { ...p, isActive: nextActive };
        }
        return p;
      })
    );
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

  const createNewCivilization = (data: Partial<CivilizationProfile>) => {
    const newCiv: CivilizationProfile = {
      id: `civ-${Date.now().toString().slice(-4)}`,
      name: data.name || 'Nova Terra',
      planet: data.planet || 'Kepler-452c',
      era: data.era || 'Foundational',
      level: 1,
      xp: 0,
      xpToNextLevel: 1000,
      leaderTitle: data.leaderTitle || 'Founder',
      governanceModel: data.governanceModel || 'Pioneer Directorate',
      foundingYear: 1,
      currentYear: 1,
      currentDay: 1,
      terrainType: data.terrainType || 'Verdant River Valley',
      climateType: data.climateType || 'Temperate',
    };
    setCivilization(newCiv);
    setSavedWorlds((prev) => [newCiv, ...prev]);
  };

  const loadCivilization = (civId: string) => {
    const target = savedWorlds.find((w) => w.id === civId);
    if (target) {
      setCivilization(target);
    }
  };

  const markEventRead = (eventId: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, isRead: true } : e))
    );
  };

  return (
    <GameStateContext.Provider
      value={{
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
        isPlaying,
        speed,
        selectedBuildingId,
        selectedBuilding,
        activeLayer,
        isConstructionMode,
        selectedCatalogItem,
        activeDrawer,
        relocatingBuildingId,
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
      }}
    >
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

