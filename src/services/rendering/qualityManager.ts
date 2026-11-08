/**
 * CIVORA — Centralized 3D Rendering Quality Manager
 * 
 * Provides adaptive, performance-aware rendering tiers (High / Medium / Low)
 * with hysteresis, sustained framerate evaluation, and gradual recovery.
 * Preserves 100% of scene composition, controls, camera, and gameplay state.
 */

export type QualityTier = 'high' | 'medium' | 'low';

export interface QualitySettings {
  tier: QualityTier;
  dpr: [number, number];
  shadowMapSize: number;
  shadowsEnabled: boolean;
  particleDensity: number;
  textureDirectory: string; // 'optimized' vs standard
  targetFramerate: number;
  useInstancing: boolean;
  animateOffscreen: boolean;
}

const TIER_SETTINGS: Record<QualityTier, QualitySettings> = {
  high: {
    tier: 'high',
    dpr: [1, 1.5],
    shadowMapSize: 2048,
    shadowsEnabled: true,
    particleDensity: 1.0,
    textureDirectory: 'optimized',
    targetFramerate: 60,
    useInstancing: true,
    animateOffscreen: false,
  },
  medium: {
    tier: 'medium',
    dpr: [1, 1.25],
    shadowMapSize: 1024,
    shadowsEnabled: true,
    particleDensity: 0.6,
    textureDirectory: 'optimized',
    targetFramerate: 60,
    useInstancing: true,
    animateOffscreen: false,
  },
  low: {
    tier: 'low',
    dpr: [1, 1.0],
    shadowMapSize: 512,
    shadowsEnabled: false,
    particleDensity: 0.3,
    textureDirectory: 'optimized',
    targetFramerate: 30,
    useInstancing: true,
    animateOffscreen: false,
  },
};

type QualityListener = (settings: QualitySettings) => void;

class RenderingQualityManager {
  private currentTier: QualityTier = 'high';
  private isAutoMode: boolean = true;
  private listeners: Set<QualityListener> = new Set();

  // Hysteresis buffers
  private lowFpsStreak: number = 0;
  private highFpsStreak: number = 0;
  private lastTierChangeTime: number = Date.now();
  private readonly COOLDOWN_MS = 8000; // Minimum 8 seconds between automatic tier changes

  constructor() {
    this.loadPersistedSettings();
  }

  private loadPersistedSettings() {
    if (typeof window === 'undefined') return;
    try {
      const savedMode = localStorage.getItem('civora_render_mode');
      const savedTier = localStorage.getItem('civora_render_tier') as QualityTier | null;
      if (savedMode === 'manual' && savedTier && TIER_SETTINGS[savedTier]) {
        this.isAutoMode = false;
        this.currentTier = savedTier;
      }
    } catch {}
  }

  public getSettings(): QualitySettings {
    return TIER_SETTINGS[this.currentTier];
  }

  public getTier(): QualityTier {
    return this.currentTier;
  }

  public isAuto(): boolean {
    return this.isAutoMode;
  }

  public setTier(tier: QualityTier, manual: boolean = true) {
    if (manual) {
      this.isAutoMode = false;
      try {
        localStorage.setItem('civora_render_mode', 'manual');
        localStorage.setItem('civora_render_tier', tier);
      } catch {}
    }

    if (this.currentTier !== tier) {
      this.currentTier = tier;
      this.lastTierChangeTime = Date.now();
      this.lowFpsStreak = 0;
      this.highFpsStreak = 0;
      this.notifyListeners();
    }
  }

  public setAutoMode(enabled: boolean) {
    this.isAutoMode = enabled;
    try {
      localStorage.setItem('civora_render_mode', enabled ? 'auto' : 'manual');
    } catch {}
  }

  /**
   * Called by the central telemetry loop with the rolling average FPS.
   * Uses sustained thresholds and cooldown to prevent rapid oscillation.
   */
  public reportFramerate(avgFps: number) {
    if (!this.isAutoMode) return;
    const now = Date.now();
    if (now - this.lastTierChangeTime < this.COOLDOWN_MS) return;

    if (avgFps < 32 && avgFps > 5) {
      this.lowFpsStreak += 1;
      this.highFpsStreak = 0;
      if (this.lowFpsStreak >= 6) { // ~3 seconds sustained low FPS
        if (this.currentTier === 'high') {
          this.setTier('medium', false);
        } else if (this.currentTier === 'medium') {
          this.setTier('low', false);
        }
        this.lowFpsStreak = 0;
      }
    } else if (avgFps >= 56) {
      this.highFpsStreak += 1;
      this.lowFpsStreak = 0;
      if (this.highFpsStreak >= 14) { // ~7 seconds sustained solid 60 FPS
        if (this.currentTier === 'low') {
          this.setTier('medium', false);
        } else if (this.currentTier === 'medium') {
          this.setTier('high', false);
        }
        this.highFpsStreak = 0;
      }
    } else {
      this.lowFpsStreak = 0;
      this.highFpsStreak = 0;
    }
  }

  public subscribe(listener: QualityListener): () => void {
    this.listeners.add(listener);
    listener(this.getSettings());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const settings = this.getSettings();
    for (const listener of this.listeners) {
      listener(settings);
    }
  }
}

export const qualityManager = new RenderingQualityManager();
