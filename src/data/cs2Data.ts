import {
  ChirperMessage,
  CityMilestone,
  RciDemand,
  UtilityStats,
  ZonedTile,
  ZoneType,
  PlacedBuilding,
  Citizen,
} from '../types/game';

// ================= INITIAL CHIRPER FEED (CITIES SKYLINES 2) =================

export const initialChirperMessages: ChirperMessage[] = [
  {
    id: 'chirp-1',
    author: 'Elena Rostova',
    handle: '@elena_arch',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    text: 'Just moved into the new high-rise at Oasis Terraces! Sunrise over the river is unreal. Thanks City Planning! 🌅 #NewHome #OasisLiving',
    time: '2m ago',
    district: 'Oasis Terraces',
    likes: 42,
    isLiked: false,
    tag: '#OasisLiving',
  },
  {
    id: 'chirp-2',
    author: 'Marcus Vance',
    handle: '@marcus_drive',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
    text: 'Central Avenue junction needs a roundabout ASAP! Traffic backed up three blocks during evening rush. 🚗🚦 #TrafficAlert #FixTheRoads',
    time: '8m ago',
    district: 'Elysium Citadel',
    likes: 89,
    isLiked: false,
    tag: '#TrafficAlert',
  },
  {
    id: 'chirp-3',
    author: 'Dr. Aris Thorne',
    handle: '@aris_quantum',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces',
    text: 'Breakthrough at Aethel Ridge Science Park! Our new neural scaffolding pilot boosted student retention by 34%. 🧠✨ #QuantumFuture #ScienceRules',
    time: '15m ago',
    district: 'Aethel Ridge',
    likes: 156,
    isLiked: true,
    tag: '#QuantumFuture',
  },
  {
    id: 'chirp-4',
    author: 'City Power Dispatch',
    handle: '@grid_operations',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop',
    text: 'Grid telemetry report: Solar Arrays and Fusion generators producing a healthy surplus of +280 MW. Power grid stable. ⚡🔌 #CleanEnergy',
    time: '24m ago',
    district: 'Vulcan Forge',
    likes: 67,
    isLiked: false,
    tag: '#CleanEnergy',
  },
  {
    id: 'chirp-5',
    author: 'Maya Lin',
    handle: '@maya_retail',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
    text: 'Sales at the Citadel Commercial Plaza are booming this weekend! We need more delivery loading zones though. 🛍️📦 #ShopLocal',
    time: '35m ago',
    district: 'Elysium Citadel',
    likes: 31,
    isLiked: false,
    tag: '#ShopLocal',
  },
  {
    id: 'chirp-6',
    author: 'EcoWatch Terra',
    handle: '@ecowatch_terra',
    avatar: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=100&h=100&fit=crop',
    text: 'River water clarity is up 14% since the new purification plant came online. Keep up the green policies, Mayor! 💧🌿 #GreenCity',
    time: '1h ago',
    district: 'Verdant Vale',
    likes: 112,
    isLiked: true,
    tag: '#GreenCity',
  },
];

// ================= CITY MILESTONES (CITIES SKYLINES 2 SYSTEM) =================

export const initialCityMilestones: CityMilestone[] = [
  {
    level: 1,
    name: 'Pioneer Settlement',
    popRequired: 500,
    rewardCredits: 25000,
    rewardGrc: 100,
    unlockedFeatures: ['Low Density Residential', 'Low Density Commercial', 'Water Pumping', 'Dirt Roads'],
    isReached: true,
  },
  {
    level: 2,
    name: 'Emerging Village',
    popRequired: 2500,
    rewardCredits: 50000,
    rewardGrc: 150,
    unlockedFeatures: ['Medical Clinic', 'Primary School', 'Landfill / Recycling', 'Paved Roads'],
    isReached: true,
  },
  {
    level: 3,
    name: 'Prosperous Town',
    popRequired: 10000,
    rewardCredits: 100000,
    rewardGrc: 250,
    unlockedFeatures: ['Fire Station', 'Police Precinct', 'Medium Density Residential', '4-Lane Avenues'],
    isReached: true,
  },
  {
    level: 4,
    name: 'Thriving City',
    popRequired: 50000,
    rewardCredits: 250000,
    rewardGrc: 500,
    unlockedFeatures: ['High School', 'University', 'High Density Commercial', 'Highways & Interchanges'],
    isReached: true,
  },
  {
    level: 5,
    name: 'Grand Metropolis',
    popRequired: 250000,
    rewardCredits: 750000,
    rewardGrc: 1000,
    unlockedFeatures: ['High Density Residential Arcologies', 'Office Hubs', 'Solar Arrays', 'Public Transit'],
    isReached: true,
  },
  {
    level: 6,
    name: 'Synthetic Megacity',
    popRequired: 1000000,
    rewardCredits: 2000000,
    rewardGrc: 2500,
    unlockedFeatures: ['Quantum AI Labs', 'Nuclear Fusion', 'Orbital Space Elevator', 'Monument Wonders'],
    isReached: true,
  },
];

// ================= PRE-ZONED TILES (ALONG EXISTING ROADS) =================

export const initialZonedTiles: ZonedTile[] = [
  // Residential Corridor along East Avenue
  { id: 'zone-r1', x: 12, z: 18, zoneType: 'residential_high', buildingLevel: 4, landValue: 480, isOccupied: true },
  { id: 'zone-r2', x: 16, z: 18, zoneType: 'residential_high', buildingLevel: 3, landValue: 460, isOccupied: true },
  { id: 'zone-r3', x: 20, z: 18, zoneType: 'residential_low', buildingLevel: 2, landValue: 410, isOccupied: true },
  { id: 'zone-r4', x: 12, z: 22, zoneType: 'residential_high', buildingLevel: 5, landValue: 520, isOccupied: true },
  { id: 'zone-r5', x: 16, z: 22, zoneType: 'residential_low', buildingLevel: 3, landValue: 440, isOccupied: true },

  // Commercial District in Central Boulevard
  { id: 'zone-c1', x: 4, z: -6, zoneType: 'commercial_high', buildingLevel: 4, landValue: 620, isOccupied: true },
  { id: 'zone-c2', x: 8, z: -6, zoneType: 'commercial_high', buildingLevel: 4, landValue: 590, isOccupied: true },
  { id: 'zone-c3', x: 4, z: -10, zoneType: 'commercial_low', buildingLevel: 2, landValue: 510, isOccupied: true },
  { id: 'zone-c4', x: 8, z: -10, zoneType: 'commercial_high', buildingLevel: 3, landValue: 550, isOccupied: true },

  // Industrial Fab Sector (Vulcan Forge)
  { id: 'zone-i1', x: 26, z: -12, zoneType: 'industrial', buildingLevel: 4, landValue: 240, isOccupied: true },
  { id: 'zone-i2', x: 30, z: -12, zoneType: 'industrial', buildingLevel: 3, landValue: 230, isOccupied: true },
  { id: 'zone-i3', x: 34, z: -12, zoneType: 'industrial', buildingLevel: 4, landValue: 250, isOccupied: true },
  { id: 'zone-i4', x: 26, z: -16, zoneType: 'industrial', buildingLevel: 5, landValue: 280, isOccupied: true },

  // High-Tech Office Hub (Aethel Ridge)
  { id: 'zone-o1', x: -22, z: -14, zoneType: 'office', buildingLevel: 4, landValue: 540, isOccupied: true },
  { id: 'zone-o2', x: -26, z: -14, zoneType: 'office', buildingLevel: 5, landValue: 580, isOccupied: true },
  { id: 'zone-o3', x: -22, z: -18, zoneType: 'office', buildingLevel: 3, landValue: 490, isOccupied: true },
  { id: 'zone-o4', x: -26, z: -18, zoneType: 'office', buildingLevel: 4, landValue: 530, isOccupied: true },
];

// ================= CS2 SIMULATION CALCULATION ENGINES =================

/**
 * Calculates Cities Skylines 2 authentic RCI Demand based on current city state
 */
export function calculateRciDemand(
  population: number,
  placedBuildings: PlacedBuilding[],
  taxRate: number,
  healthScore: number,
  unemploymentRate: number = 0.05
): RciDemand {
  // 1. Residential Demand: Driven by low taxes, high health/happiness, and job abundance
  const taxFactor = Math.max(0, 1.0 - (taxRate - 8) * 0.04);
  const healthBonus = (healthScore / 100) * 30;
  const resLow = Math.min(100, Math.max(10, Math.round(55 * taxFactor + healthBonus * 0.4)));
  const resHigh = Math.min(100, Math.max(15, Math.round(70 * taxFactor + (population > 100000 ? 25 : 5))));

  // 2. Commercial Demand: Driven by consumer population and low sales friction
  const commercialDemand = Math.min(100, Math.max(12, Math.round((population / 35000) * 20 + 45 * taxFactor)));

  // 3. Industrial Demand: Driven by factory requirements and export capacity
  const industrialDemand = Math.min(100, Math.max(8, Math.round(48 + unemploymentRate * 120 - (taxRate > 12 ? 15 : 0))));

  // 4. Office Demand: Driven by education level and high-tech status
  const officeDemand = Math.min(100, Math.max(20, Math.round(62 + (population > 200000 ? 20 : 5) - taxRate * 1.5)));

  return {
    residentialLow: resLow,
    residentialHigh: resHigh,
    commercial: commercialDemand,
    industrial: industrialDemand,
    office: officeDemand,
  };
}

/**
 * Calculates Utilities and Info View metrics (Power, Water, Traffic, Land Value, Pollution)
 */
export function calculateUtilityStats(
  placedBuildings: PlacedBuilding[],
  population: number
): UtilityStats {
  // Power: Calculate from energy producers in buildings
  let totalCapMW = 3840;
  let totalConsMW = 2950;

  for (const b of placedBuildings) {
    if (b.category === 'energy') {
      totalCapMW += 450 * b.level;
    } else {
      totalConsMW += 25 * b.level;
    }
  }

  // Water: Calculate from water facilities
  const waterCap = Math.round(population * 0.035 + 45000);
  const waterCons = Math.round(population * 0.028 + 32000);

  // Traffic: Dynamic based on population density and road balance
  const trafficFlow = Math.max(62, Math.min(94, Math.round(92 - (population / 500000) * 4)));

  return {
    powerCapacityMW: totalCapMW,
    powerConsumptionMW: totalConsMW,
    powerSurplusMW: totalCapMW - totalConsMW,
    waterCapacityM3: waterCap,
    waterConsumptionM3: waterCons,
    sewageTreatmentPercent: 96,
    trafficFlowPercent: trafficFlow,
    averageLandValue: 475,
    pollutionIndex: 18,
  };
}

// ================= DYNAMIC CHIRPER GENERATOR =================

const citizenNames = [
  'Sophia Chen', 'Liam O\'Connor', 'David Sterling', 'Amara Okafor',
  'Kenji Sato', 'Hannah Schmidt', 'Lucas Silva', 'Aria Montgomery',
  'Vikram Patel', 'Zoe Washburne', 'Mateo Rossi', 'Freja Lindqvist',
];

const citizenHandles = [
  '@sophia_tech', '@liam_transit', '@sterling_invest', '@amara_art',
  '@kenji_fab', '@hannah_eco', '@lucas_commute', '@aria_sound',
  '@vikram_stem', '@zoe_skyline', '@mateo_bistro', '@freja_nature',
];

const positiveChirps = [
  'Our district park looks so peaceful today. Glad the council invested in green spaces! 🌳🌷 #LiveableCity',
  'Fiber internet speed just got doubled in Sector 4! Coding from home is pure bliss now. 💻⚡ #GigabitLife',
  'Rode the new rapid electric bus across the river—only took 6 minutes! Smooth commute. 🚌💨 #PublicTransit',
  'The air feels so fresh this morning. Green energy transition is really paying off! 🍃☀️ #EcoCity',
  'Just enrolled in the Advanced Neural Systems course at the university! Can’t wait to start. 🎓🔬 #HigherEd',
  'Loving the nightlife around Central Promenade! Great food, great music, safe streets. 🎶🥂 #CityVibes',
];

const warningChirps = [
  'Is it just me or is the water pressure a bit low in District 2 today? 💧🤔 #WaterWatch',
  'Taxes went up slightly, but as long as schools and roads stay this good, I can live with it! 📊🏙️ #CivicDuty',
  'Trucks from the industrial basin are noisy around 6 AM. Maybe reroute them to the bypass? 🚛🔊 #NoisePollution',
  'Commercial shops are packed! We could really use another shopping arcade nearby. 🛍️🛒 #MoreShops',
];

export function generateRandomChirp(districtName: string): ChirperMessage {
  const isPos = Math.random() > 0.3;
  const pool = isPos ? positiveChirps : warningChirps;
  const text = pool[Math.floor(Math.random() * pool.length)];
  const idx = Math.floor(Math.random() * citizenNames.length);

  return {
    id: `chirp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    author: citizenNames[idx],
    handle: citizenHandles[idx],
    avatar: `https://images.unsplash.com/photo-${1530000000000 + idx * 50000}?w=100&h=100&fit=crop&crop=faces`,
    text,
    time: 'Just now',
    district: districtName,
    likes: Math.floor(Math.random() * 25) + 3,
    isLiked: false,
    tag: text.match(/#[A-Za-z0-9]+/)?.[0] || '#CityLife',
  };
}

