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

// ================= DETERMINISTIC SVG CITIZEN AVATAR =================

export function generateCitizenSvgAvatar(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const colors = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2', '#4f46e5', '#ca8a04', '#059669', '#d97706'];
  const bg1 = colors[Math.abs(hash) % colors.length];
  const bg2 = colors[Math.abs(hash >> 3) % colors.length];
  const initials = (seed.replace(/[^a-zA-Z]/g, '').slice(0, 2) || 'CI').toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <linearGradient id="g_${Math.abs(hash)}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bg1}" />
        <stop offset="100%" stop-color="${bg2}" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="28" fill="url(#g_${Math.abs(hash)})" />
    <circle cx="50" cy="38" r="18" fill="#ffffff" opacity="0.85" />
    <path d="M22 84 C22 62, 78 62, 78 84 Z" fill="#ffffff" opacity="0.85" />
    <text x="50" y="44" font-family="sans-serif" font-size="14" font-weight="bold" fill="${bg1}" text-anchor="middle">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// ================= INITIAL CHIRPER FEED (CITIES SKYLINES 2) =================

export const initialChirperMessages: ChirperMessage[] = [
  {
    id: 'chirp-1',
    author: 'Elena Rostova',
    handle: '@elena_arch',
    avatar: generateCitizenSvgAvatar('@elena_arch'),
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
    avatar: generateCitizenSvgAvatar('@marcus_drive'),
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
    avatar: generateCitizenSvgAvatar('@aris_quantum'),
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
    avatar: generateCitizenSvgAvatar('@grid_operations'),
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
    avatar: generateCitizenSvgAvatar('@maya_retail'),
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
    avatar: generateCitizenSvgAvatar('@ecowatch_terra'),
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
  // Residential Corridor along East Avenue (Secondary Civic Loop)
  { id: 'zone-r1', x: 15.5, z: 12, zoneType: 'residential_high', buildingLevel: 4, landValue: 480, isOccupied: true },
  { id: 'zone-r2', x: 15.5, z: 16, zoneType: 'residential_high', buildingLevel: 3, landValue: 460, isOccupied: true },
  { id: 'zone-r3', x: 15.5, z: 20, zoneType: 'residential_low', buildingLevel: 2, landValue: 410, isOccupied: true },
  { id: 'zone-r4', x: 19.5, z: 12, zoneType: 'residential_high', buildingLevel: 5, landValue: 520, isOccupied: true },
  { id: 'zone-r5', x: 19.5, z: 16, zoneType: 'residential_low', buildingLevel: 3, landValue: 440, isOccupied: true },

  // Commercial District in North Riverbank Promenade
  { id: 'zone-c1', x: 6, z: -8, zoneType: 'commercial_high', buildingLevel: 4, landValue: 620, isOccupied: true },
  { id: 'zone-c2', x: 10, z: -8, zoneType: 'commercial_high', buildingLevel: 4, landValue: 590, isOccupied: true },
  { id: 'zone-c3', x: 6, z: -12, zoneType: 'commercial_low', buildingLevel: 2, landValue: 510, isOccupied: true },
  { id: 'zone-c4', x: 10, z: -12, zoneType: 'commercial_high', buildingLevel: 3, landValue: 550, isOccupied: true },

  // Industrial Fab Sector along Industrial Spur (z = 4.5)
  { id: 'zone-i1', x: 22, z: 8.5, zoneType: 'industrial', buildingLevel: 4, landValue: 240, isOccupied: true },
  { id: 'zone-i2', x: 26, z: 8.5, zoneType: 'industrial', buildingLevel: 3, landValue: 230, isOccupied: true },
  { id: 'zone-i3', x: 30, z: 8.5, zoneType: 'industrial', buildingLevel: 4, landValue: 250, isOccupied: true },
  { id: 'zone-i4', x: 26, z: 12.5, zoneType: 'industrial', buildingLevel: 5, landValue: 280, isOccupied: true },

  // High-Tech Office Hub along West District (x = -12)
  { id: 'zone-o1', x: -16, z: 12, zoneType: 'office', buildingLevel: 4, landValue: 540, isOccupied: true },
  { id: 'zone-o2', x: -20, z: 12, zoneType: 'office', buildingLevel: 5, landValue: 580, isOccupied: true },
  { id: 'zone-o3', x: -16, z: 16, zoneType: 'office', buildingLevel: 3, landValue: 490, isOccupied: true },
  { id: 'zone-o4', x: -20, z: 16, zoneType: 'office', buildingLevel: 4, landValue: 530, isOccupied: true },
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

export interface SimStateForChirp {
  powerDeficit?: boolean;
  waterDeficit?: boolean;
  highTaxes?: boolean;
  highPollution?: boolean;
  highHappiness?: boolean;
  techBreakthrough?: boolean;
  materialsShortage?: boolean;
}

export function generateRandomChirp(districtName: string, simState?: SimStateForChirp): ChirperMessage {
  let text = '';
  if (simState?.powerDeficit) {
    text = `🚨 #BlackoutAlert Lights flickered out across ${districtName}! The grid is running beyond capacity. Need more power generators!`;
  } else if (simState?.waterDeficit) {
    text = `🚰 #WaterNotice Low water pressure in taps again. The pumping stations need attention!`;
  } else if (simState?.highTaxes) {
    text = `💸 #TaxHike Municipal taxes are getting way too steep! Mayor, small businesses are feeling the squeeze.`;
  } else if (simState?.highPollution) {
    text = `🌫️ #AirQuality Thick smog plume near the industrial perimeter today. Don't forget your breather filters.`;
  } else if (simState?.materialsShortage) {
    text = `📦 #SupplyChain Foundry delays! Construction crews in ${districtName} are waiting on alloy shipments.`;
  } else if (simState?.techBreakthrough) {
    text = `💡 #EurekaMoment Huge science discovery announced by the Citadel Research Hub! Proud of our engineers.`;
  } else if (simState?.highHappiness) {
    text = `✨ #ProudCitizen The skyline in ${districtName} looks stunning tonight. Clean power, zero traffic, great schools.`;
  } else {
    let hash = 0;
    const seedStr = `${districtName}_${Date.now()}`;
    for (let i = 0; i < seedStr.length; i++) {
      hash = (hash << 5) - hash + seedStr.charCodeAt(i);
      hash |= 0;
    }
    const isPos = Math.abs(hash % 100) > 35;
    const pool = isPos ? positiveChirps : warningChirps;
    text = pool[Math.abs(hash) % pool.length];
  }

  let nameHash = 0;
  for (let i = 0; i < districtName.length; i++) {
    nameHash = (nameHash << 5) - nameHash + districtName.charCodeAt(i);
    nameHash |= 0;
  }
  const idx = Math.abs(nameHash + Date.now()) % citizenNames.length;
  const authorName = citizenNames[idx];
  const authorHandle = citizenHandles[idx];
  const likesCount = (Math.abs(nameHash) % 25) + 3;

  return {
    id: `chirp-${Date.now()}-${idx}`,
    author: authorName,
    handle: authorHandle,
    avatar: generateCitizenSvgAvatar(authorHandle),
    text,
    time: 'Just now',
    district: districtName,
    likes: likesCount,
    isLiked: false,
    tag: text.match(/#[A-Za-z0-9]+/)?.[0] || '#CityLife',
  };
}

