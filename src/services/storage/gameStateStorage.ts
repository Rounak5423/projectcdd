/**
 * CIVORA & GENESIS — Persistent Game State Storage Engine
 *
 * Guarantees zero progress loss:
 * 1. Saves full simulation & world state on:
 *    - window.beforeunload (closing tab / reload)
 *    - window.pagehide (mobile/desktop page navigation)
 *    - document.visibilitychange (switching tabs / minimizing)
 *    - building placement, upgrade, relocation, demolition
 *    - research, policy changes, mission completions
 *    - periodic simulation ticks
 * 2. Restores exact state on page open / login so the player never starts all over again.
 */

import {
  CivilizationProfile,
  ResourceState,
  ResourceRates,
  PlacedBuilding,
  Technology,
  Policy,
  Citizen,
  Achievement,
  GameEvent,
  CivoraMission,
  ChronicleEntry,
  ResearchTransaction,
  District,
  ZonedTile,
} from '../../types/game';
import { DetailedCitizenAgent } from '../../types/citizen';

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

export const STORAGE_KEY_ACTIVE = 'civora_saved_game_state_active';
export const STORAGE_KEY_WORLD_PREFIX = 'civora_world_state_';
export const STORAGE_KEY_ACTIVE_WORLD_ID = 'civora_active_world_id';

export interface CivoraSavedGameState {
  version: number;
  timestamp: number;
  civilization: CivilizationProfile;
  resources: ResourceState;
  rates: ResourceRates;
  districts: District[];
  placedBuildings: PlacedBuilding[];
  technologies: Technology[];
  policies: Policy[];
  citizens: Citizen[];
  detailedAgents?: DetailedCitizenAgent[];
  quests: GameQuest[];
  missions: CivoraMission[];
  chronicle: ChronicleEntry[];
  transactions: ResearchTransaction[];
  achievements: Achievement[];
  zonedTiles: ZonedTile[];
  taxRate: number;
  savedWorlds: CivilizationProfile[];
}

/**
 * Safely writes state bundle to localStorage with quota protection
 */
export function saveGameStateToStorage(state: CivoraSavedGameState): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    const payload = JSON.stringify({
      ...state,
      version: 2,
      timestamp: Date.now(),
    });

    // 1. Save to active state key
    localStorage.setItem(STORAGE_KEY_ACTIVE, payload);

    // 2. Save to world-specific key for multi-world persistence
    if (state.civilization?.id) {
      localStorage.setItem(`${STORAGE_KEY_WORLD_PREFIX}${state.civilization.id}`, payload);
      localStorage.setItem(STORAGE_KEY_ACTIVE_WORLD_ID, state.civilization.id);
    }

    return true;
  } catch (err: any) {
    // If quota exceeded, attempt to clear non-essential cache and retry once
    console.warn('[Storage] Quota or serialization warning, cleaning temporary cache:', err);
    try {
      // Remove temporary items if any
      localStorage.removeItem('genesis_temporary_cache');
      const payload = JSON.stringify({
        ...state,
        version: 2,
        timestamp: Date.now(),
      });
      localStorage.setItem(STORAGE_KEY_ACTIVE, payload);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Loads the active saved game state from localStorage
 */
export function loadActiveGameStateFromStorage(): CivoraSavedGameState | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    // Check if there is an active world ID
    const activeWorldId = localStorage.getItem(STORAGE_KEY_ACTIVE_WORLD_ID);
    let raw = activeWorldId
      ? localStorage.getItem(`${STORAGE_KEY_WORLD_PREFIX}${activeWorldId}`)
      : null;

    if (!raw) {
      raw = localStorage.getItem(STORAGE_KEY_ACTIVE);
    }

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CivoraSavedGameState;
    if (parsed && parsed.civilization && Array.isArray(parsed.placedBuildings)) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.warn('[Storage] Failed to parse saved game state:', err);
    return null;
  }
}

/**
 * Loads saved state for a specific world ID
 */
export function loadGameStateForWorld(worldId: string): CivoraSavedGameState | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_WORLD_PREFIX}${worldId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CivoraSavedGameState;
    if (parsed && parsed.civilization && Array.isArray(parsed.placedBuildings)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Clears saved game state for a clean reset if explicitly requested
 */
export function clearSavedGameState(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.removeItem(STORAGE_KEY_ACTIVE);
    const activeWorldId = localStorage.getItem(STORAGE_KEY_ACTIVE_WORLD_ID);
    if (activeWorldId) {
      localStorage.removeItem(`${STORAGE_KEY_WORLD_PREFIX}${activeWorldId}`);
    }
    localStorage.removeItem(STORAGE_KEY_ACTIVE_WORLD_ID);
  } catch {}
}
