/**
 * CIVORA — Centralized Frontend Performance Monitor (Phase 1)
 *
 * Lightweight, non-intrusive performance monitoring module tracking:
 * 1. FPS, average FPS, and frame times via a bounded rolling buffer.
 * 2. Main-thread Long Tasks via PerformanceObserver (when supported).
 * 3. Browser memory heap allocation (when supported).
 * 4. API request latencies and error rates via Axios interceptors.
 * 5. Asset loading times for GLB, textures and chunks via Resource Timing API.
 * 6. Three.js draw calls, triangles, textures and geometry counts.
 * 7. WebSocket connection health and telemetry.
 *
 * Designed with strict zero-GC overhead and never updates React state every animation frame.
 */

export interface ThreeSceneMetrics {
  sceneId: string;
  fps: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  sceneObjects: number;
  frameRenderTimeMs: number;
  memoryUsage?: {
    geometries: number;
    textures: number;
  };
  lastUpdated: number;
}

export interface ApiCallRecord {
  id: string;
  method: string;
  url: string;
  durationMs: number;
  status: number;
  timestamp: number;
}

export interface LongTaskRecord {
  durationMs: number;
  startTime: number;
}

export interface AssetLoadRecord {
  name: string;
  durationMs: number;
  transferSizeKB: number;
  initiatorType: string;
}

export interface FrontendTelemetrySnapshot {
  fps: {
    current: number;
    average: number;
    min: number;
    max: number;
    frameTimeMs: number;
  };
  longTasks: {
    supported: boolean;
    count: number;
    totalDurationMs: number;
    maxDurationMs: number;
    recent: LongTaskRecord[];
  };
  memory: {
    supported: boolean;
    usedJSHeapSizeMB: number | null;
    totalJSHeapSizeMB: number | null;
    jsHeapSizeLimitMB: number | null;
  };
  api: {
    recent: ApiCallRecord[];
    averageDurationMs: number;
    totalCount: number;
    errorCount: number;
  };
  assets: {
    supported: boolean;
    recent: AssetLoadRecord[];
  };
  three: {
    world?: ThreeSceneMetrics;
    council?: ThreeSceneMetrics;
    activeScene: string | null;
  };
  websocket: {
    status: 'connected' | 'disconnected' | 'connecting' | 'idle';
    messagesSent: number;
    messagesReceived: number;
    lastMessageTimestamp: number | null;
    reconnectCount: number;
    errorCount: number;
  };
  monitoringEnabled: boolean;
  timestamp: string;
}

const STORAGE_KEY = 'civora_perf_monitoring_enabled';

class CentralPerformanceMonitor {
  private enabled: boolean = true;
  private rafId: number | null = null;
  private lastRafTime: number = 0;
  private frameCount: number = 0;
  private lastSampleTime: number = 0;

  // Rolling frame time buffer (up to 120 frames)
  private readonly frameTimes: number[] = [];
  private readonly maxFrameSamples: number = 120;
  private currentFps: number = 60;
  private averageFps: number = 60;
  private minFps: number = 60;
  private maxFps: number = 60;
  private currentFrameTimeMs: number = 16.6;

  // Long tasks observer
  private longTaskObserver: PerformanceObserver | null = null;
  private longTasksSupported: boolean = false;
  private longTaskCount: number = 0;
  private longTasksTotalMs: number = 0;
  private longTasksMaxMs: number = 0;
  private recentLongTasks: LongTaskRecord[] = [];

  // Resource timing observer
  private resourceObserver: PerformanceObserver | null = null;
  private resourcesSupported: boolean = false;
  private recentAssetLoads: AssetLoadRecord[] = [];

  // API Call Ring Buffer
  private recentApiCalls: ApiCallRecord[] = [];
  private readonly maxApiRecords: number = 30;
  private apiTotalCount: number = 0;
  private apiErrorCount: number = 0;

  // Three.js Scene Metrics
  private threeMetrics: Record<string, ThreeSceneMetrics> = {};
  private activeThreeScene: string | null = null;

  // WebSocket State
  private wsStatus: 'connected' | 'disconnected' | 'connecting' | 'idle' = 'idle';
  private wsMessagesSent: number = 0;
  private wsMessagesReceived: number = 0;
  private wsLastMessageTimestamp: number | null = null;
  private wsReconnectCount: number = 0;
  private wsErrorCount: number = 0;

  // Subscribers for throttled telemetry broadcast (1 Hz / 2 Hz)
  private listeners: Set<(snapshot: FrontendTelemetrySnapshot) => void> = new Set();
  private broadcastInterval: number | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
          this.enabled = stored === 'true';
        }
      } catch {}

      if (this.enabled) {
        this.start();
      }
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    try {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    } catch {}

    if (enabled) {
      this.start();
    } else {
      this.stop();
    }
  }

  public start(): void {
    if (typeof window === 'undefined') return;

    this.stop(); // Clean any previous loops

    // 1. Initialize FPS loop via requestAnimationFrame
    this.lastRafTime = performance.now();
    this.lastSampleTime = performance.now();
    this.frameCount = 0;

    const onFrame = (now: number) => {
      if (!this.enabled) return;

      const delta = now - this.lastRafTime;
      this.lastRafTime = now;
      this.currentFrameTimeMs = Math.round(delta * 10) / 10;

      // Add to rolling buffer
      this.frameTimes.push(delta);
      if (this.frameTimes.length > this.maxFrameSamples) {
        this.frameTimes.shift();
      }
      this.frameCount++;

      // Compute FPS summary every 500ms
      if (now - this.lastSampleTime >= 500) {
        const elapsedSec = (now - this.lastSampleTime) / 1000;
        this.currentFps = Math.min(144, Math.round(this.frameCount / elapsedSec));
        this.frameCount = 0;
        this.lastSampleTime = now;

        if (this.frameTimes.length > 0) {
          const fpsValues = this.frameTimes.map((d) => (d > 0 ? 1000 / d : 60));
          this.averageFps = Math.min(144, Math.round(fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length));
          this.minFps = Math.min(144, Math.round(Math.min(...fpsValues)));
          this.maxFps = Math.min(144, Math.round(Math.max(...fpsValues)));
        }
      }

      this.rafId = requestAnimationFrame(onFrame);
    };

    this.rafId = requestAnimationFrame(onFrame);

    // 2. Setup Long Tasks Observer if supported
    try {
      if (typeof PerformanceObserver !== 'undefined') {
        const supported = (PerformanceObserver as any).supportedEntryTypes || [];
        if (supported.includes('longtask')) {
          this.longTasksSupported = true;
          this.longTaskObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const dur = Math.round(entry.duration);
              this.longTaskCount++;
              this.longTasksTotalMs += dur;
              this.longTasksMaxMs = Math.max(this.longTasksMaxMs, dur);
              this.recentLongTasks.unshift({
                durationMs: dur,
                startTime: Math.round(entry.startTime),
              });
              if (this.recentLongTasks.length > 15) {
                this.recentLongTasks.pop();
              }
            }
          });
          this.longTaskObserver.observe({ entryTypes: ['longtask'] });
        }

        // 3. Setup Resource Observer for GLB models, textures and large assets
        if (supported.includes('resource')) {
          this.resourcesSupported = true;
          this.resourceObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const res = entry as PerformanceResourceTiming;
              const name = res.name.split('/').pop()?.split('?')[0] || res.name;
              // Filter to assets of interest (GLB, JSON, images, scripts)
              if (/\.(glb|gltf|png|jpg|jpeg|webp|json|js)$/i.test(res.name)) {
                this.recentAssetLoads.unshift({
                  name,
                  durationMs: Math.round(res.duration),
                  transferSizeKB: Math.round(((res.transferSize || 0) / 1024) * 10) / 10,
                  initiatorType: res.initiatorType,
                });
                if (this.recentAssetLoads.length > 15) {
                  this.recentAssetLoads.pop();
                }
              }
            }
          });
          this.resourceObserver.observe({ entryTypes: ['resource'] });
        }
      }
    } catch (e) {
      // PerformanceObserver fallback safe
    }

    // 4. Start 1Hz snapshot broadcast to subscribers
    this.broadcastInterval = window.setInterval(() => {
      if (this.listeners.size > 0) {
        const snapshot = this.getSnapshot();
        this.listeners.forEach((cb) => {
          try {
            cb(snapshot);
          } catch {}
        });
      }
    }, 1000);
  }

  public stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.longTaskObserver) {
      this.longTaskObserver.disconnect();
      this.longTaskObserver = null;
    }
    if (this.resourceObserver) {
      this.resourceObserver.disconnect();
      this.resourceObserver = null;
    }
    if (this.broadcastInterval !== null) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
    }
  }

  // --------------------------------------------------------------------------
  // API Call Instrumentation
  // --------------------------------------------------------------------------
  public recordApiCall(method: string, url: string, durationMs: number, status: number): void {
    if (!this.enabled) return;

    this.apiTotalCount++;
    if (status >= 400 || status === 0) {
      this.apiErrorCount++;
    }

    const cleanUrl = url.replace(/https?:\/\/[^/]+/, '');
    const record: ApiCallRecord = {
      id: `api_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      method: method.toUpperCase(),
      url: cleanUrl,
      durationMs: Math.round(durationMs * 10) / 10,
      status,
      timestamp: Date.now(),
    };

    this.recentApiCalls.unshift(record);
    if (this.recentApiCalls.length > this.maxApiRecords) {
      this.recentApiCalls.pop();
    }
  }

  // --------------------------------------------------------------------------
  // Three.js Scene Instrumentation
  // --------------------------------------------------------------------------
  public recordThreeMetrics(sceneId: string, metrics: Omit<ThreeSceneMetrics, 'sceneId' | 'lastUpdated'>): void {
    if (!this.enabled) return;

    this.activeThreeScene = sceneId;
    this.threeMetrics[sceneId] = {
      ...metrics,
      sceneId,
      lastUpdated: Date.now(),
    };
  }

  // --------------------------------------------------------------------------
  // WebSocket Instrumentation
  // --------------------------------------------------------------------------
  public setWebSocketStatus(status: 'connected' | 'disconnected' | 'connecting' | 'idle'): void {
    if (!this.enabled) return;
    this.wsStatus = status;
    if (status === 'connecting') {
      this.wsReconnectCount++;
    }
  }

  public recordWebSocketMessageSent(): void {
    if (!this.enabled) return;
    this.wsMessagesSent++;
  }

  public recordWebSocketMessageReceived(): void {
    if (!this.enabled) return;
    this.wsMessagesReceived++;
    this.wsLastMessageTimestamp = Date.now();
  }

  public recordWebSocketError(): void {
    if (!this.enabled) return;
    this.wsErrorCount++;
  }

  // --------------------------------------------------------------------------
  // Subscription and Snapshots
  // --------------------------------------------------------------------------
  public subscribe(callback: (snapshot: FrontendTelemetrySnapshot) => void): () => void {
    this.listeners.add(callback);
    // Provide initial state immediately
    callback(this.getSnapshot());
    return () => {
      this.listeners.delete(callback);
    };
  }

  public getSnapshot(): FrontendTelemetrySnapshot {
    // Memory extraction if supported
    let memSupported = false;
    let usedHeap: number | null = null;
    let totalHeap: number | null = null;
    let limitHeap: number | null = null;

    if (typeof window !== 'undefined' && (performance as any).memory) {
      memSupported = true;
      const mem = (performance as any).memory;
      usedHeap = Math.round((mem.usedJSHeapSize / (1024 * 1024)) * 10) / 10;
      totalHeap = Math.round((mem.totalJSHeapSize / (1024 * 1024)) * 10) / 10;
      limitHeap = Math.round((mem.jsHeapSizeLimit / (1024 * 1024)) * 10) / 10;
    }

    const apiAvg =
      this.recentApiCalls.length > 0
        ? Math.round(
            (this.recentApiCalls.reduce((acc, c) => acc + c.durationMs, 0) / this.recentApiCalls.length) * 10
          ) / 10
        : 0;

    return {
      fps: {
        current: this.currentFps,
        average: this.averageFps,
        min: this.minFps,
        max: this.maxFps,
        frameTimeMs: this.currentFrameTimeMs,
      },
      longTasks: {
        supported: this.longTasksSupported,
        count: this.longTaskCount,
        totalDurationMs: this.longTasksTotalMs,
        maxDurationMs: this.longTasksMaxMs,
        recent: [...this.recentLongTasks],
      },
      memory: {
        supported: memSupported,
        usedJSHeapSizeMB: usedHeap,
        totalJSHeapSizeMB: totalHeap,
        jsHeapSizeLimitMB: limitHeap,
      },
      api: {
        recent: [...this.recentApiCalls],
        averageDurationMs: apiAvg,
        totalCount: this.apiTotalCount,
        errorCount: this.apiErrorCount,
      },
      assets: {
        supported: this.resourcesSupported,
        recent: [...this.recentAssetLoads],
      },
      three: {
        world: this.threeMetrics['world'],
        council: this.threeMetrics['council'],
        activeScene: this.activeThreeScene,
      },
      websocket: {
        status: this.wsStatus,
        messagesSent: this.wsMessagesSent,
        messagesReceived: this.wsMessagesReceived,
        lastMessageTimestamp: this.wsLastMessageTimestamp,
        reconnectCount: this.wsReconnectCount,
        errorCount: this.wsErrorCount,
      },
      monitoringEnabled: this.enabled,
      timestamp: new Date().toISOString(),
    };
  }

  public clearBuffers(): void {
    this.frameTimes.length = 0;
    this.recentLongTasks.length = 0;
    this.recentAssetLoads.length = 0;
    this.recentApiCalls.length = 0;
    this.apiTotalCount = 0;
    this.apiErrorCount = 0;
    this.longTaskCount = 0;
    this.longTasksTotalMs = 0;
  }
}

export const performanceMonitor = new CentralPerformanceMonitor();
