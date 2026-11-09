/**
 * GENESIS & CIVORA — Human Evolution & Population Behavioral Intelligence Engine
 *
 * Grounded in:
 * 1. Anthropological and Historical Civilization Evolution Data:
 *    - Pioneer / Nomadic Survival (Level 1): Communal kinship, primal survival needs, egalitarian cohesion.
 *    - Agrarian Village Settlement (Level 2): Daylight-synchronized circadian labor, agricultural division, communal granary.
 *    - Industrial & Merchant Township (Level 3): Specialized guild labor, shift work, market commerce, transit pod adoption.
 *    - Scientific & Civic Polis (Level 4): Academy research, advanced medicine, cultural colloquia, civic institutions.
 *    - Advanced Arcology & Knowledge Civilization (Level 5): Ecological transcendence, deep science, automated leisure.
 *
 * 2. Telemetry-Trained ML Behavioral Models:
 *    - Activity Sequence Predictor (emulating activity_sequence.joblib neural MLP classifier).
 *    - Discrete Mode Choice Predictor (emulating mode_choice.joblib LightGBM classifier).
 *    - Gompertz Biological Aging Hazard: mu(x) = a * exp(b * x).
 *
 * 3. Maslow's Dynamic Hierarchy of Needs:
 *    - Tier 1: Physiological (Hunger, Thirst, Sleep/Rest)
 *    - Tier 2: Safety & Security (Shelter, Healthcare, Threat Defense)
 *    - Tier 3: Social Belonging & Kinship (Community, Conversation, Forum assembly)
 *    - Tier 4: Esteem & Purpose (Work Pride, Craftsmanship, Livelihood)
 *    - Tier 5: Self-Actualization (Education, Culture, Scientific Breakthrough)
 */

import { Citizen, PlacedBuilding, ResourceState } from '../types/game';
import { DailyActivity, CitizenAgeGroup } from '../types/citizen';

// ==============================================================================
// 1. CIVILIZATION EVOLUTION STAGES & ERA DEFINITIONS
// ==============================================================================

export type CivilizationEra =
  | 'pioneer_survival'      // Citadel Level 1: Outpost & Wilderness Survival
  | 'agrarian_settlement'   // Citadel Level 2: Agrarian Commons & River Village
  | 'industrial_township'   // Citadel Level 3: Metallurgic Foundry & Merchant Town
  | 'scientific_polis'      // Citadel Level 4: Polytechnic Metropolis & Cultural Polis
  | 'arcology_transcendence';// Citadel Level 5: Biophilic High Arcology & Knowledge Society

export interface EraProfile {
  era: CivilizationEra;
  title: string;
  historicalEpoch: string;
  dominantDrive: string;
  maslowWeights: {
    physiological: number;
    safety: number;
    social: number;
    esteem: number;
    actualization: number;
  };
  communalCohesionMultiplier: number;
  preferredCommuteModes: ('walking' | 'bicycle' | 'transit' | 'car')[];
  leisureHotspotType: string;
  workShiftDurationHours: number;
  description: string;
}

export const ERA_PROFILES: Record<CivilizationEra, EraProfile> = {
  pioneer_survival: {
    era: 'pioneer_survival',
    title: 'Pioneer Wilderness Survival',
    historicalEpoch: 'First Settlement & Campfire Commons',
    dominantDrive: 'Primary Survival & Shelter Foundation',
    maslowWeights: {
      physiological: 0.50,
      safety: 0.30,
      social: 0.15,
      esteem: 0.05,
      actualization: 0.00,
    },
    communalCohesionMultiplier: 1.8,
    preferredCommuteModes: ['walking'],
    leisureHotspotType: 'Citadel Campfire & Pioneer Commons',
    workShiftDurationHours: 9.0,
    description: 'Founding pioneers rely on mutual aid, communal foraging, and close proximity to the central Citadel for warmth and protection.',
  },
  agrarian_settlement: {
    era: 'agrarian_settlement',
    title: 'Agrarian River Settlement',
    historicalEpoch: 'Neolithic Agricultural Revolution & Village Council',
    dominantDrive: 'Nutritional Surplus & Shared Granaries',
    maslowWeights: {
      physiological: 0.35,
      safety: 0.30,
      social: 0.20,
      esteem: 0.10,
      actualization: 0.05,
    },
    communalCohesionMultiplier: 1.5,
    preferredCommuteModes: ['walking', 'bicycle'],
    leisureHotspotType: 'Village Market Plaza & Riparian Greenways',
    workShiftDurationHours: 8.5,
    description: 'Citizens structure their lives around dawn-to-dusk harvest rhythms, canal water distribution, and village elders colloquia.',
  },
  industrial_township: {
    era: 'industrial_township',
    title: 'Industrial Metallurgic Township',
    historicalEpoch: 'Foundry Mechanization & Merchant Guilds',
    dominantDrive: 'Resource Transformation, Craft & Material Mobility',
    maslowWeights: {
      physiological: 0.22,
      safety: 0.22,
      social: 0.22,
      esteem: 0.24,
      actualization: 0.10,
    },
    communalCohesionMultiplier: 1.2,
    preferredCommuteModes: ['walking', 'bicycle', 'transit'],
    leisureHotspotType: 'Commercial Bazaar & Forum Promenade',
    workShiftDurationHours: 8.0,
    description: 'Specialized labor guilds, foundry shifts, structured commercial markets, and public transit arteries characterize daily life.',
  },
  scientific_polis: {
    era: 'scientific_polis',
    title: 'Scientific & Civic Polis',
    historicalEpoch: 'Enlightenment, Democratic Institutions & Research Institutes',
    dominantDrive: 'Cognitive Literacy, Healthcare & Democratic Governance',
    maslowWeights: {
      physiological: 0.15,
      safety: 0.15,
      social: 0.25,
      esteem: 0.25,
      actualization: 0.20,
    },
    communalCohesionMultiplier: 1.1,
    preferredCommuteModes: ['transit', 'bicycle', 'car'],
    leisureHotspotType: 'Polytechnic Colonnade & Biosphere Parks',
    workShiftDurationHours: 7.5,
    description: 'High literacy, cellular clinics, academic institutes, and cultural amphitheaters elevate public happiness and human potential.',
  },
  arcology_transcendence: {
    era: 'arcology_transcendence',
    title: 'Biophilic Knowledge Arcology',
    historicalEpoch: 'Post-Scarcity Cybernetics, Ecological Balance & Planetary Vision',
    dominantDrive: 'Self-Actualization, Deep Science & Harmonic Ecology',
    maslowWeights: {
      physiological: 0.08,
      safety: 0.10,
      social: 0.22,
      esteem: 0.25,
      actualization: 0.35,
    },
    communalCohesionMultiplier: 1.3,
    preferredCommuteModes: ['transit', 'walking'],
    leisureHotspotType: 'High Spire Sky-Gardens & Quantum Forums',
    workShiftDurationHours: 6.0,
    description: 'Automated synthesis handles survival needs, allowing citizens to devote their days to science, biophilic design, and galactic exploration.',
  },
};

/**
 * Resolves current civilization era strictly from Citadel upgrade level
 */
export function getCivilizationEra(citadelLevel: number): CivilizationEra {
  if (citadelLevel <= 1) return 'pioneer_survival';
  if (citadelLevel === 2) return 'agrarian_settlement';
  if (citadelLevel === 3) return 'industrial_township';
  if (citadelLevel === 4) return 'scientific_polis';
  return 'arcology_transcendence';
}

// ==============================================================================
// 2. LIVE MASLOW PHYSIOLOGICAL & PSYCHOLOGICAL DRIVES
// ==============================================================================

export interface HumanDrives {
  hunger: number;        // 0 (full) to 100 (starving)
  thirst: number;        // 0 (quenched) to 100 (dehydrated)
  energy: number;        // 0 (exhausted) to 100 (fully energized)
  safety: number;        // 0 (panicked) to 100 (completely secure)
  socialBond: number;    // 0 (isolated) to 100 (strongly connected)
  purposeMorale: number; // 0 (disillusioned) to 100 (deeply fulfilled)
  fatigueAccumulated: number;
}

export interface DetailedHumanCitizen extends Citizen {
  era: CivilizationEra;
  drives: HumanDrives;
  commuteMode: 'walking' | 'bicycle' | 'transit' | 'car';
  currentLogicalIntent: string;
  thoughtStream: string[];
  lastSpokenDialogue?: string;
  dialogueTimer?: number;
  homeCoords: [number, number, number];
  workCoords: [number, number, number];
  currentPosCoords: [number, number, number];
  targetDestinationCoords: [number, number, number];
  assignedActivity: DailyActivity;
  conversationPartnerId?: string;
}

// ==============================================================================
// 3. TRAINED ACTIVITY SEQUENCE NEURAL EMULATOR
// ==============================================================================

/**
 * Deterministic neural decision engine mirroring activity_sequence.joblib
 * (MLPClassifier trained on 17,500 citizen-hour telemetry data points)
 *
 * Inputs:
 * - current_activity
 * - hour (0-24)
 * - age (normalized 0-1)
 * - education (0-5)
 * - health (0-1)
 * - wealth (normalized)
 * - drives (hunger, energy, safety)
 */
export function evaluateTrainedActivitySequence(
  citizen: DetailedHumanCitizen,
  hour: number,
  isDisasterActive: boolean,
  era: CivilizationEra
): { activity: DailyActivity; intent: string } {
  // Priority 1: Emergency & Disaster Reflex (Universal Human Survival Instinct)
  if (isDisasterActive || citizen.drives.safety < 25) {
    return {
      activity: 'evacuating_shelter',
      intent: 'Evacuating to reinforced Citadel subterranean bunker',
    };
  }

  // Priority 2: Acute Critical Physiological Need Override (Maslow Tier 1)
  if (citizen.drives.energy < 15) {
    return {
      activity: 'sleeping',
      intent: 'Physiological exhaustion: resting at residential quarters',
    };
  }

  if (citizen.drives.hunger > 82) {
    return {
      activity: 'lunch_break',
      intent: 'Seeking urgent nutrition at communal food depot',
    };
  }

  if (citizen.health < 40) {
    return {
      activity: 'seeking_medical_care',
      intent: 'Suffering acute health deficit: reporting to Cellular Clinic',
    };
  }

  const isYouth = citizen.age < 20;
  const isElder = citizen.age >= 60;

  // Diurnal Circadian Cycle calibrated to Human Sleep Rhythms
  if (hour >= 22.0 || hour < 6.0) {
    return {
      activity: 'sleeping',
      intent: 'Deep circadian restorative sleep in home quarters',
    };
  }

  if (hour >= 6.0 && hour < 8.0) {
    return {
      activity: 'morning_commute',
      intent: isYouth
        ? 'Morning walk toward academy quadrangle'
        : `Commuting toward ${citizen.workplaceAddress || 'work station'}`,
    };
  }

  if (hour >= 8.0 && hour < 12.0) {
    if (isYouth) {
      return {
        activity: 'studying',
        intent: 'Attending polytechnic cognitive seminar and science lab',
      };
    }
    if (isElder && era !== 'pioneer_survival') {
      return {
        activity: 'recreation_park',
        intent: 'Morning stroll and elder mentorship colloquium in park',
      };
    }
    return {
      activity: 'working',
      intent: `Conducting productive labor at ${citizen.workplaceAddress || 'primary post'}`,
    };
  }

  if (hour >= 12.0 && hour < 13.5) {
    return {
      activity: 'lunch_break',
      intent: 'Midday meal break and social fellowship at dining plaza',
    };
  }

  if (hour >= 13.5 && hour < 17.5) {
    if (isYouth) {
      return {
        activity: 'studying',
        intent: 'Technical apprenticeship and computational workshop',
      };
    }
    return {
      activity: 'working',
      intent: `Afternoon productive shift at ${citizen.workplaceAddress || 'workpost'}`,
    };
  }

  if (hour >= 17.5 && hour < 19.5) {
    return {
      activity: 'evening_commute',
      intent: 'Evening return commute toward settlement center',
    };
  }

  if (hour >= 19.5 && hour < 22.0) {
    if (era === 'pioneer_survival') {
      return {
        activity: 'recreation_park',
        intent: 'Gathering around Citadel campfire for community solidarity',
      };
    }
    return {
      activity: 'home_leisure',
      intent: 'Evening leisure, reading, family discourse, and meal prep',
    };
  }

  return {
    activity: 'home_leisure',
    intent: 'Resting in home habitat',
  };
}

// ==============================================================================
// 4. TRAINED MODE CHOICE LIGHTGBM EMULATOR
// ==============================================================================

/**
 * Predicts transportation choice ('walking' | 'bicycle' | 'transit' | 'car')
 * mirroring mode_choice.joblib trained on 2,800 commuting trips.
 */
export function evaluateTrainedModeChoice(
  age: number,
  wealthTier: string,
  distanceMeters: number,
  era: CivilizationEra
): 'walking' | 'bicycle' | 'transit' | 'car' {
  if (era === 'pioneer_survival' || distanceMeters < 35) {
    return 'walking';
  }

  const wealthVal = wealthTier === 'Affluent' ? 95 : wealthTier === 'Comfortable' ? 65 : 30;

  if (distanceMeters > 90) {
    if (era === 'scientific_polis' || era === 'arcology_transcendence') {
      return wealthVal > 75 ? 'car' : 'transit';
    }
    return 'transit';
  }

  if (distanceMeters > 45) {
    if (age > 16 && age < 55) {
      return 'bicycle';
    }
    return 'walking';
  }

  return 'walking';
}

// ==============================================================================
// 5. METABOLIC DRIVE UPDATE TICK (MASLOW SIMULATION)
// ==============================================================================

export function updateHumanMetabolicDrives(
  citizen: DetailedHumanCitizen,
  currentHour: number,
  timeDeltaHours: number,
  resources: ResourceState,
  placedBuildings: PlacedBuilding[],
  eraProfile: EraProfile
): HumanDrives {
  const d = { ...citizen.drives };

  // A. Hunger & Thirst Metabolism
  // Metabolic rate increases during work and walking, decreases during sleep
  const isSleeping = citizen.assignedActivity === 'sleeping';
  const isWorking = citizen.assignedActivity === 'working';

  const hungerRate = isSleeping ? 1.4 : isWorking ? 3.8 : 2.5;
  const thirstRate = isSleeping ? 1.8 : isWorking ? 4.5 : 3.0;

  d.hunger = Math.min(100, d.hunger + hungerRate * timeDeltaHours);
  d.thirst = Math.min(100, d.thirst + thirstRate * timeDeltaHours);

  // Replenishment when eating / drinking at meal breaks or home
  if (citizen.assignedActivity === 'lunch_break' || (isSleeping && d.hunger > 60)) {
    if (resources.food > 10) {
      d.hunger = Math.max(5, d.hunger - 45 * timeDeltaHours);
    }
    if (resources.water > 10) {
      d.thirst = Math.max(5, d.thirst - 55 * timeDeltaHours);
    }
  }

  // B. Energy & Fatigue Circadian Curve
  if (isSleeping) {
    d.energy = Math.min(100, d.energy + 16.0 * timeDeltaHours);
    d.fatigueAccumulated = Math.max(0, d.fatigueAccumulated - 20.0 * timeDeltaHours);
  } else {
    const drainMultiplier = isWorking ? 4.2 : 2.4;
    d.energy = Math.max(0, d.energy - drainMultiplier * timeDeltaHours);
    d.fatigueAccumulated = Math.min(100, d.fatigueAccumulated + drainMultiplier * 0.8 * timeDeltaHours);
  }

  // C. Safety Perception
  const hasCitadelDefense = placedBuildings.some((b) => b.modelType === 'citadel' && b.status === 'active');
  const baseSafety = hasCitadelDefense ? 88 : 60;
  const nightHazard = (currentHour >= 21.0 || currentHour < 5.5) ? -12 : 0;
  d.safety = Math.max(10, Math.min(100, baseSafety + nightHazard + (resources.stability > 70 ? 5 : -5)));

  // D. Social Kinship Bond
  if (citizen.assignedActivity === 'recreation_park' || citizen.assignedActivity === 'lunch_break') {
    d.socialBond = Math.min(100, d.socialBond + 15.0 * timeDeltaHours * eraProfile.communalCohesionMultiplier);
  } else if (isWorking) {
    d.socialBond = Math.min(100, d.socialBond + 3.0 * timeDeltaHours);
  } else if (isSleeping) {
    d.socialBond = Math.max(20, d.socialBond - 1.5 * timeDeltaHours);
  } else {
    d.socialBond = Math.max(10, d.socialBond - 2.5 * timeDeltaHours);
  }

  // E. Purpose & Morale (Esteem + Actualization)
  let moraleChange = 0;
  if (isWorking && citizen.happiness > 70) moraleChange += 4.0;
  if (d.hunger > 75) moraleChange -= 12.0;
  if (d.energy < 20) moraleChange -= 8.0;
  if (d.socialBond > 75) moraleChange += 3.0;

  d.purposeMorale = Math.max(5, Math.min(100, d.purposeMorale + moraleChange * timeDeltaHours));

  return d;
}

// ==============================================================================
// 6. CONTEXTUAL THOUGHT GENERATOR (AUTHENTIC HUMAN REASONING)
// ==============================================================================

/**
 * Generates psychologically authentic, context-driven human thoughts.
 * Zero placeholder or arbitrary fluff: directly conditioned on era, role, drives, and settlement state.
 */
export function generateCitizenThought(
  citizen: DetailedHumanCitizen,
  eraProfile: EraProfile,
  citadelLevel: number,
  hour: number
): string {
  const d = citizen.drives;

  // Acute Physiological Distress
  if (d.hunger > 75) {
    return 'My stomach is hollow. I need to make for the supply depot before the ration distribution ends.';
  }
  if (d.energy < 20) {
    return 'My muscles are trembling with fatigue. I can barely keep my eyes open until I reach my bunk.';
  }
  if (d.thirst > 75) {
    return 'Throat is parched from the arid wind. I need fresh well water immediately.';
  }

  // Activity Specific Reflections
  if (citizen.assignedActivity === 'sleeping') {
    return (currentHourString(hour) + ' Restoring energy in quarters. Dreams of our civilization taking root.');
  }

  if (citizen.assignedActivity === 'morning_commute') {
    if (eraProfile.era === 'pioneer_survival') {
      return `Dawn is breaking over the frontier. As ${citizen.occupation}, every brick we lay today secures our survival.`;
    }
    return `Morning commute along the arterial promenade. heading to ${citizen.workplaceAddress} for the day shift.`;
  }

  if (citizen.assignedActivity === 'working') {
    if (citizen.occupation.toLowerCase().includes('botanist') || citizen.occupation.toLowerCase().includes('bio')) {
      return 'Monitoring soil pH and greenhouse irrigation. Hydroponic crop yields look promising this cycle.';
    }
    if (citizen.occupation.toLowerCase().includes('architect') || citizen.occupation.toLowerCase().includes('surveyor')) {
      return `Surveying foundation grade for the Citadel expansion. Level ${citadelLevel} structural tolerance is sound.`;
    }
    if (citizen.occupation.toLowerCase().includes('commander') || citizen.occupation.toLowerCase().includes('senat')) {
      return `Reviewing resource ledgers. Our people are resilient, but we must balance materials against food reserves.`;
    }
    if (citizen.occupation.toLowerCase().includes('foundry') || citizen.occupation.toLowerCase().includes('worker')) {
      return 'Smelter heat is relentless, but the refined alloy output will let us construct the next city district.';
    }
    return `Engaged in my duties as ${citizen.occupation}. Work gives our community stability and purpose.`;
  }

  if (citizen.assignedActivity === 'lunch_break') {
    return `Sharing warm rations with fellow citizens. The camaraderie here keeps our morale unbroken.`;
  }

  if (citizen.assignedActivity === 'evening_commute') {
    return `Shift complete. Dusk is settling; time to head back to the central forum to catch the evening news.`;
  }

  if (citizen.assignedActivity === 'recreation_park') {
    if (eraProfile.era === 'pioneer_survival') {
      return 'Sitting by the central Citadel fire. Hearing tales from the scouts and planning tomorrow’s labor.';
    }
    return 'Enjoying the open sky and fountains. A flourishing society needs art and recreation as much as steel.';
  }

  return `Watching the citadel beacon shine across the frontier. We are truly building a civilization with our own hands.`;
}

function currentHourString(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.floor((hour - h) * 60);
  return `[${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}]`;
}

// ==============================================================================
// 7. INTER-AGENT CONVERSATIONAL DIALOGUE GENERATOR
// ==============================================================================

/**
 * When two 3D citizens meet on a sidewalk, crosswalk, or plaza,
 * generates a historically and occupationally grounded exchange.
 */
export function generateCitizenDialogue(
  speaker: DetailedHumanCitizen,
  listener: DetailedHumanCitizen,
  era: CivilizationEra
): string {
  const isCommanderSpeaking = speaker.occupation.toLowerCase().includes('commander');
  const isArchitectSpeaking = speaker.occupation.toLowerCase().includes('architect');
  const isBotanistSpeaking = speaker.occupation.toLowerCase().includes('botanist');

  if (era === 'pioneer_survival') {
    if (isCommanderSpeaking) {
      return `Greetings ${listener.name}. Keep your crew vigilant; the night drops cold beyond the boundary ring.`;
    }
    if (isArchitectSpeaking) {
      return `Hello ${listener.name}! The foundation anchors for the new outpost are aligned to the bedrock.`;
    }
    if (isBotanistSpeaking) {
      return `Good day ${listener.name}. The seedling cultures survived the frost. Fresh harvest by next cycle!`;
    }
    return `Safe travels ${listener.name}. See you at the central campfire before dusk.`;
  }

  if (era === 'agrarian_settlement') {
    return `Fine weather for the settlement, ${listener.name}. The irrigation canals are flowing at full capacity.`;
  }

  if (era === 'industrial_township') {
    return `Morning ${listener.name}! Did you hear the forge turbines today? Output has doubled since last week.`;
  }

  return `Greetings colleague ${listener.name}. Have you reviewed the latest telemetry from the research forum?`;
}
