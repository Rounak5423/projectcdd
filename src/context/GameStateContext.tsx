import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
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
export type ActiveDrawer = 'none' | 'notifications' | 'codex' | 'timeline' | 'construction' | 'buildingInspector' | 'economy' | 'disaster' | 'citizens';

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
  triggerDisaster: (type: DisasterType, intensity: DisasterIntensity, districtId?: string) => void;
  dispatchEmergencyResponse: () => void;
  restoreAllDisasters: () => void;
  toggleAutoDisasters: () => void;
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
  const [relocatingBuildingId, setRelocatingBuildingId] = useState<string | null>(null);

  // Disaster & Emergency Response State
  const [disasterState, setDisasterState] = useState<DisasterSimulationState>(() => ({
    activeDisaster: null,
    risks: {
      floodRiskPercent: 18,
      wildfireRiskPercent: 12,
      droughtRiskPercent: 10,
      stormRiskPercent: 20,
      seismicRiskPercent: 14,
      overallThreatLevel: 'Low',
    },
    emergencyForces: {
      medicalUnitsActive: 0,
      medicalUnitsTotal: 4,
      fireCrewsActive: 0,
      fireCrewsTotal: 5,
      rescueTeamsActive: 0,
      rescueTeamsTotal: 4,
      repairEngineersActive: 0,
      repairEngineersTotal: 6,
      shelterCapacityTotal: 120000,
      responseEfficiencyPercent: 88,
    },
    settings: {
      autoDisastersEnabled: false,
      disasterFrequency: 'rare',
    },
    historicalDisasterCount: 0,
  }));

  const speedMultipliers = { '1x': 1, '2x': 2, '5x': 5, '10x': 10 };
  const mult = speedMultipliers[speed];

  const selectedBuilding = placedBuildings.find((b) => b.id === selectedBuildingId) || null;

  // Centralized City Simulation Report (Calculates fiscal flows, resource accounting, district metrics, demands & alerts)
  const economyReport = useMemo(() => {
    return calculateCitySimulation(placedBuildings, buildingCatalog, resources, districts, taxRate);
  }, [placedBuildings, resources, districts, taxRate]);

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

    // 6. Progress Natural Disaster & Emergency Response Lifecycle
    setDisasterState((prevDisaster) => {
      const currentForces = calculateEmergencyForces(placedBuildings, resources);
      const currentRisks = calculateDisasterRisks('clear', 14, resources, economyReport, placedBuildings);

      if (prevDisaster.activeDisaster) {
        const { updatedDisaster, updatedBuildings, economicDamageDelta } = advanceDisasterSimulation(
          prevDisaster.activeDisaster,
          placedBuildings,
          currentForces,
          0.1
        );

        setPlacedBuildings(updatedBuildings);

        if (economicDamageDelta > 0) {
          setResources((prevRes) => ({
            ...prevRes,
            grc: Math.max(0, Math.round(prevRes.grc - economicDamageDelta)),
            stability: Math.max(20, Math.round(prevRes.stability - 0.2)),
          }));
        }

        return {
          ...prevDisaster,
          activeDisaster: updatedDisaster,
          risks: currentRisks,
          emergencyForces: {
            ...currentForces,
            medicalUnitsActive: updatedDisaster ? Math.min(currentForces.medicalUnitsTotal, 3) : 0,
            fireCrewsActive: updatedDisaster?.type === 'wildfire' ? currentForces.fireCrewsTotal : 1,
            rescueTeamsActive: updatedDisaster ? Math.min(currentForces.rescueTeamsTotal, 2) : 0,
            repairEngineersActive: updatedDisaster ? Math.min(currentForces.repairEngineersTotal, 4) : 0,
          },
          historicalDisasterCount:
            updatedDisaster === null ? prevDisaster.historicalDisasterCount + 1 : prevDisaster.historicalDisasterCount,
        };
      }

      // Spontaneous natural disaster emergence only if enabled by user
      if (prevDisaster.settings.autoDisastersEnabled && Math.random() < 0.005) {
        const riskTypes: [DisasterType, number][] = [
          ['flood', currentRisks.floodRiskPercent],
          ['wildfire', currentRisks.wildfireRiskPercent],
          ['drought', currentRisks.droughtRiskPercent],
          ['storm', currentRisks.stormRiskPercent],
          ['earthquake', currentRisks.seismicRiskPercent],
        ];
        riskTypes.sort((a, b) => b[1] - a[1]);
        if (riskTypes[0][1] > 60) {
          const newD = createDisaster(riskTypes[0][0], 'medium', 'dist-residential');
          return {
            ...prevDisaster,
            activeDisaster: newD,
            risks: currentRisks,
            emergencyForces: currentForces,
          };
        }
      }

      return {
        ...prevDisaster,
        risks: currentRisks,
        emergencyForces: currentForces,
      };
    });
  }, [rates, civilization, placedBuildings, resources, economyReport]);

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
      maxLevel: 5,
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

    const event: GameEvent = {
      id: `ev-${Date.now()}`,
      year: civilization.currentYear,
      day: civilization.currentDay,
      title: `Expansion Commenced: ${building.name} (Target Lvl ${building.level + 1})`,
      description: `Architectural crews mobilized. Scaffolding deployed for Level ${building.level + 1} expansion.`,
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
        disasterState,
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
        createNewCivilization,
        loadCivilization,
        markEventRead,
        setActiveDrawer,
        taxRate,
        setTaxRate,
        triggerDisaster,
        dispatchEmergencyResponse,
        restoreAllDisasters,
        toggleAutoDisasters,
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

