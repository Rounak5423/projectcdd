import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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
} from '../data/initialGameData';

export type MapLayer = 'all' | 'infrastructure' | 'population' | 'resources' | 'environment' | 'economy';
export type ActiveDrawer = 'none' | 'notifications' | 'codex' | 'timeline' | 'construction' | 'buildingInspector';

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
  
  // Simulation controls
  isPlaying: boolean;
  speed: '1x' | '2x' | '5x' | '10x';
  selectedBuildingId: string | null;
  selectedBuilding: PlacedBuilding | null;
  activeLayer: MapLayer;
  isConstructionMode: boolean;
  selectedCatalogItem: BuildingCatalogItem | null;
  activeDrawer: ActiveDrawer;
  
  // Action Handlers
  togglePlay: () => void;
  setSpeed: (speed: '1x' | '2x' | '5x' | '10x') => void;
  advanceTick: () => void;
  advanceYear: () => void;
  selectBuilding: (id: string | null) => void;
  setActiveLayer: (layer: MapLayer) => void;
  setConstructionMode: (active: boolean, item?: BuildingCatalogItem | null) => void;
  placeBuilding: (catalogId: string, x: number, z: number, districtId?: string, rotation?: number) => boolean;
  upgradeBuilding: (buildingId: string) => boolean;
  demolishBuilding: (buildingId: string) => void;
  startResearch: (techId: string) => boolean;
  togglePolicy: (policyId: string) => void;
  updatePolicySlider: (policyId: string, value: number) => void;
  runScenario: (scenarioId: string) => boolean;
  startExperiment: (experimentId: string) => boolean;
  claimAchievement: (achievementId: string) => void;
  createNewCivilization: (data: Partial<CivilizationProfile>) => void;
  loadCivilization: (civId: string) => void;
  markEventRead: (eventId: string) => void;
  setActiveDrawer: (drawer: ActiveDrawer) => void;
  taxRate: number;
  setTaxRate: (rate: number) => void;
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
  
  const [taxRate, setTaxRate] = useState<number>(18); // %
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<'1x' | '2x' | '5x' | '10x'>('1x');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<MapLayer>('all');
  const [isConstructionMode, setIsConstructionMode] = useState<boolean>(false);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<BuildingCatalogItem | null>(null);
  const [activeDrawer, setActiveDrawer] = useState<ActiveDrawer>('none');

  const speedMultipliers = { '1x': 1, '2x': 2, '5x': 5, '10x': 10 };
  const mult = speedMultipliers[speed];

  const selectedBuilding = placedBuildings.find((b) => b.id === selectedBuildingId) || null;

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

    // 2. Adjust Resources based on rates
    setResources((prev) => {
      const foodDelta = rates.foodRate * 0.1;
      const waterDelta = rates.waterRate * 0.1;
      const energyDelta = rates.energyRate * 0.1;
      const materialsDelta = rates.materialsRate * 0.1;
      const researchDelta = rates.researchRate * 0.1;
      const grcDelta = rates.grcEarnRate * 0.05;

      const newPop = prev.population + Math.round((prev.population * (rates.populationGrowthRate / 100)) / 365);
      const newGdp = Number((prev.gdp + (prev.gdp * (rates.gdpGrowthRate / 100)) / 365).toFixed(3));

      return {
        ...prev,
        food: Math.max(0, Math.round(prev.food + foodDelta)),
        water: Math.max(0, Math.round(prev.water + waterDelta)),
        energy: Math.max(0, Math.round(prev.energy + energyDelta)),
        materials: Math.max(0, Math.round(prev.materials + materialsDelta)),
        researchPoints: Math.round(prev.researchPoints + researchDelta),
        grc: Math.round(prev.grc + grcDelta),
        population: newPop,
        gdp: newGdp,
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
  }, [rates]);

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

  // Timer loop for simulation
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = Math.max(150, 1500 / mult);
    const timer = setInterval(() => {
      advanceTick();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isPlaying, mult, advanceTick]);

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
    if (active) {
      setActiveDrawer('none');
    }
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
      status: 'active',
      health: 100,
      efficiency: 95,
      workersAssigned: item.workerReq,
      workersNeeded: item.workerReq,
      modelType: item.modelType,
    };

    setPlacedBuildings((prev) => [...prev, newBuilding]);

    // Update rates if it's a producing building
    if (item.productionType && item.productionAmount) {
      setRates((prev) => {
        const key = `${item.productionType}Rate` as keyof ResourceRates;
        return {
          ...prev,
          [key]: (prev[key] as number) + item.productionAmount,
        };
      });
    }

    const event: GameEvent = {
      id: `ev-${Date.now()}`,
      year: civilization.currentYear,
      day: civilization.currentDay,
      title: `Commissioned: ${newBuilding.name}`,
      description: `New ${item.category} facility successfully erected in district ${districtId}.`,
      category: 'economic',
      severity: 'success',
      isRead: false,
    };
    setEvents((prev) => [event, ...prev]);
    setIsConstructionMode(false);
    setSelectedCatalogItem(null);
    return true;
  };

  const upgradeBuilding = (buildingId: string) => {
    const building = placedBuildings.find((b) => b.id === buildingId);
    if (!building || building.level >= building.maxLevel) return false;

    const upgradeCost = building.level * 280;
    if (resources.materials < upgradeCost) return false;

    setResources((prev) => ({
      ...prev,
      materials: prev.materials - upgradeCost,
      grc: prev.grc + 25,
    }));

    setPlacedBuildings((prev) =>
      prev.map((b) =>
        b.id === buildingId
          ? {
              ...b,
              level: b.level + 1,
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
      title: `Upgraded: ${building.name} (Level ${building.level + 1})`,
      description: `Technological overhaul complete. Structural throughput and efficiency elevated.`,
      category: 'economic',
      severity: 'success',
      isRead: false,
    };
    setEvents((prev) => [event, ...prev]);
    return true;
  };

  const demolishBuilding = (buildingId: string) => {
    const building = placedBuildings.find((b) => b.id === buildingId);
    if (!building) return;

    setPlacedBuildings((prev) => prev.filter((b) => b.id !== buildingId));
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

  const togglePolicy = (policyId: string) => {
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
        isPlaying,
        speed,
        selectedBuildingId,
        selectedBuilding,
        activeLayer,
        isConstructionMode,
        selectedCatalogItem,
        activeDrawer,
        togglePlay,
        setSpeed,
        advanceTick,
        advanceYear,
        selectBuilding,
        setActiveLayer,
        setConstructionMode,
        placeBuilding,
        upgradeBuilding,
        demolishBuilding,
        startResearch,
        togglePolicy,
        updatePolicySlider,
        runScenario,
        startExperiment,
        claimAchievement,
        createNewCivilization,
        loadCivilization,
        markEventRead,
        setActiveDrawer,
        taxRate,
        setTaxRate,
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

