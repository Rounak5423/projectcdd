import * as THREE from 'three';

export interface CouncilModelConfig {
  id: string;
  name: string;
  shortName: string;
  roleHint: string;
  category: 'real_downloaded' | 'historical';
  modelPath: string;
  description: string;
  targetHeight: number;
  offsetY?: number;
  offsetZ?: number;
  offsetX?: number;
  rotationY?: number;
  hasOwnChair?: boolean;
}

export const COUNCIL_MODELS: Record<string, CouncilModelConfig> = {
  // --- REAL 3D DOWNLOADED MODELS ---
  'real-carl': {
    id: 'real-carl',
    name: 'Carl Manfred (Detroit)',
    shortName: 'Carl Manfred',
    roleHint: 'Distinguished Elder Statesman & Philosopher',
    category: 'real_downloaded',
    modelPath: '/models/council/real_carl_manfred.glb',
    description: 'Photorealistic distinguished elder statesman with scarf, styled hair, and expressive face.',
    targetHeight: 1.55,
    offsetY: 0,
    offsetZ: 0.05,
    rotationY: 0,
    hasOwnChair: true,
  },
  'real-avatar': {
    id: 'real-avatar',
    name: 'Imperial Emissary (Fullbody Avatar)',
    shortName: 'Imperial Emissary',
    roleHint: 'Prime Minister & Architect of Realm',
    category: 'real_downloaded',
    modelPath: '/models/council/real_fullbody_male.glb',
    description: 'High-fidelity full-body human model with realistic beard, modern-historical garments, and footwear.',
    targetHeight: 1.68,
    offsetY: 0,
    offsetZ: 0.0,
    rotationY: 0,
  },
  'real-magus': {
    id: 'real-magus',
    name: 'The Hollow Archmagus',
    shortName: 'Archmagus',
    roleHint: 'Grand Occultist & Arcane Keeper',
    category: 'real_downloaded',
    modelPath: '/models/council/real_undead_wizard.glb',
    description: 'Monumental arcane counselor draped in dark ceremonial vestments and ancient knowledge.',
    targetHeight: 1.62,
    offsetY: 0,
    offsetZ: 0.05,
    rotationY: 0,
  },
  'real-tactical': {
    id: 'real-tactical',
    name: 'Imperial Vanguard Commander',
    shortName: 'Vanguard',
    roleHint: 'Martial Strategist & Security Counselor',
    category: 'real_downloaded',
    modelPath: '/models/council/real_freefire_pace.glb',
    description: 'Disciplined military strategist outfitted for defense and state operations.',
    targetHeight: 1.60,
    offsetY: 0,
    offsetZ: 0.0,
    rotationY: 0,
  },

  // --- HISTORICAL MONUMENTAL SOVEREIGNS ---
  'adv-chancellor': {
    id: 'adv-chancellor',
    name: 'Chancellor Malor Drake',
    shortName: 'Chancellor Drake',
    roleHint: 'Imperial Statesman',
    category: 'historical',
    modelPath: '/models/council/adv_chancellor.glb',
    description: 'Regal green and antique gold robes, imperial crown fillet, and golden signet ring.',
    targetHeight: 1.55,
  },
  'adv-treasurer': {
    id: 'adv-treasurer',
    name: 'Treasurer Varian Voss',
    shortName: 'Treasurer Voss',
    roleHint: 'High Treasurer',
    category: 'historical',
    modelPath: '/models/council/adv_treasurer.glb',
    description: 'Rich dark walnut doublets, muted gold filigree, and brass-bound ledger.',
    targetHeight: 1.55,
  },
  'adv-scholar': {
    id: 'adv-scholar',
    name: 'Grand Scholar Elyse Moran',
    shortName: 'Scholar Moran',
    roleHint: 'Grand Scholar',
    category: 'historical',
    modelPath: '/models/council/adv_scholar.glb',
    description: 'Midnight navy robes, flowing silver hair, pince-nez spectacles, and celestial scroll.',
    targetHeight: 1.55,
  },
  'adv-architect': {
    id: 'adv-architect',
    name: 'Royal Architect Corin Sol',
    shortName: 'Architect Sol',
    roleHint: 'Master Builder',
    category: 'historical',
    modelPath: '/models/council/adv_architect.glb',
    description: 'Terracotta artisan vest, cropped hair, and brass drafting dividers.',
    targetHeight: 1.55,
  },
  'adv-physician': {
    id: 'adv-physician',
    name: 'High Physician Thalia Rowe',
    shortName: 'Physician Rowe',
    roleHint: 'Healer of Realm',
    category: 'historical',
    modelPath: '/models/council/adv_physician.glb',
    description: 'Sage and ivory linen, braided crown headdress, and glass elixir vial.',
    targetHeight: 1.55,
  },
  'adv-keeper': {
    id: 'adv-keeper',
    name: 'Keeper Sarah Thorne',
    shortName: 'Keeper Thorne',
    roleHint: 'Ecological Warden',
    category: 'historical',
    modelPath: '/models/council/adv_keeper.glb',
    description: 'Moss green fabrics, auburn locks, golden laurel circlet, and botanical sprig.',
    targetHeight: 1.55,
  },
};

// Preset configurations
export const THEME_PRESETS = {
  historical: {
    label: 'Historical Sovereigns',
    icon: '🏛️',
    description: 'Authentic Renaissance & Classical Imperial Advisors',
    mapping: {
      'adv-chancellor': 'adv-chancellor',
      'adv-treasurer': 'adv-treasurer',
      'adv-scholar': 'adv-scholar',
      'adv-architect': 'adv-architect',
      'adv-physician': 'adv-physician',
      'adv-keeper': 'adv-keeper',
    },
  },
  real_enhanced: {
    label: 'Real 3D Enhanced',
    icon: '⚡',
    description: 'Realistic 3D Models with Carl Manfred, Fullbody Avatar, Archmagus & Vanguard',
    mapping: {
      'adv-chancellor': 'real-carl',       // Carl Manfred as the distinguished grand chancellor / elder
      'adv-scholar': 'real-magus',          // Archmagus as grand scholar
      'adv-architect': 'real-avatar',       // Real full-body male avatar as master architect
      'adv-treasurer': 'real-tactical',     // Tactical commander as imperial treasurer / security
      'adv-physician': 'adv-physician',     // High physician with headdress & vial
      'adv-keeper': 'adv-keeper',           // Keeper of nature with laurel circlet
    },
  },
};

const STORAGE_KEY_THEME = 'civora_council_theme_preset';
const STORAGE_KEY_MAP = 'civora_council_advisor_models';

export function getStoredThemePreset(): 'historical' | 'real_enhanced' | 'custom' {
  try {
    const val = localStorage.getItem(STORAGE_KEY_THEME);
    if (val === 'historical' || val === 'real_enhanced' || val === 'custom') {
      return val;
    }
  } catch {}
  return 'real_enhanced'; // Default to the newly downloaded real models to showcase them immediately!
}

export function getStoredModelMapping(): Record<string, string> {
  const defaultMap = { ...THEME_PRESETS.real_enhanced.mapping };
  try {
    const val = localStorage.getItem(STORAGE_KEY_MAP);
    if (val) {
      const parsed = JSON.parse(val);
      return { ...defaultMap, ...parsed };
    }
  } catch {}
  return defaultMap;
}

export function saveModelMapping(
  theme: 'historical' | 'real_enhanced' | 'custom',
  mapping: Record<string, string>
) {
  try {
    localStorage.setItem(STORAGE_KEY_THEME, theme);
    localStorage.setItem(STORAGE_KEY_MAP, JSON.stringify(mapping));
  } catch {}
}
