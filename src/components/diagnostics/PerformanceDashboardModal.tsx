import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  Layers,
  Server,
  Zap,
  Radio,
  X,
  RefreshCw,
  Power,
  RotateCcw,
  Clock,
  Database,
  Users,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Sliders,
  Shield,
  Eye,
} from 'lucide-react';
import {
  performanceMonitor,
  FrontendTelemetrySnapshot,
} from '../../services/monitoring/performanceMonitor';
import { apiClient } from '../../services/civilizationApi';
import { soundFx } from '../../services/soundFx';

interface PerformanceDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'rendering' | 'backend' | 'simulation' | 'ai' | 'network';

export default function PerformanceDashboardModal({
  isOpen,
  onClose,
}: PerformanceDashboardModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [frontendData, setFrontendData] = useState<FrontendTelemetrySnapshot>(() =>
    performanceMonitor.getSnapshot()
  );
  const [backendData, setBackendData] = useState<any | null>(null);
  const [isLoadingBackend, setIsLoadingBackend] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshIntervalSec, setRefreshIntervalSec] = useState<number>(2);

  // Subscribe to Frontend Telemetry
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = performanceMonitor.subscribe((snapshot) => {
      setFrontendData(snapshot);
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  // Fetch Backend Telemetry
  const fetchBackendMetrics = async () => {
    if (!isOpen) return;
    setIsLoadingBackend(true);
    try {
      const res = await apiClient.get('/diagnostics/metrics');
      if (res.data) {
        setBackendData(res.data);
      }
    } catch (err) {
      // Backend diagnostics fallback safe
    } finally {
      setIsLoadingBackend(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBackendMetrics();
    }
  }, [isOpen]);

  // Polling loop for Backend metrics
  useEffect(() => {
    if (!isOpen || !autoRefresh) return;

    const timer = setInterval(() => {
      fetchBackendMetrics();
    }, refreshIntervalSec * 1000);

    return () => clearInterval(timer);
  }, [isOpen, autoRefresh, refreshIntervalSec]);

  // Global Keybinding (Escape to close, F2 / Ctrl+Shift+P handled globally in App)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleToggleMonitoring = async () => {
    soundFx.playClick();
    const nextState = !frontendData.monitoringEnabled;
    performanceMonitor.setEnabled(nextState);
    try {
      await apiClient.post('/diagnostics/toggle', { enabled: nextState });
    } catch {}
    fetchBackendMetrics();
  };

  const handleResetMetrics = async () => {
    soundFx.playClick();
    setIsRefreshing(true);
    performanceMonitor.clearBuffers();
    try {
      await apiClient.post('/diagnostics/reset');
    } catch {}
    await fetchBackendMetrics();
    setIsRefreshing(false);
  };

  // Three Scene metrics selection (World Explorer vs Council Chamber)
  const activeSceneKey = frontendData.three.activeScene === 'council' ? 'council' : 'world';
  const threeMetrics = frontendData.three[activeSceneKey] || frontendData.three.world;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 select-none font-sans">
      <div className="relative w-full max-w-5xl h-[88vh] max-h-[820px] bg-[#121613] border border-[#C5A66A]/40 rounded-xl shadow-2xl flex flex-col overflow-hidden text-[#EAE3D2]">
        {/* ================= HEADER ================= */}
        <div className="px-5 py-3.5 border-b border-[#2B372C] bg-[#161c17] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#C5A66A]/10 border border-[#C5A66A]/30 flex items-center justify-center text-[#C5A66A]">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-sm uppercase tracking-widest font-bold text-[#EAE3D2]">
                  CIVORA Performance Telemetry & Diagnostics
                </h2>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#8FA879]/15 text-[#8FA879] border border-[#8FA879]/30">
                  Phase 1 Engine Monitor
                </span>
              </div>
              <p className="text-[11px] text-[#A5AD9D]">
                Real-time operational metrics across Browser, WebGL 3D, FastAPI, SQLite and Council AI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Master Monitoring Toggle */}
            <button
              onClick={handleToggleMonitoring}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 border transition-all ${
                frontendData.monitoringEnabled
                  ? 'bg-[#8FA879]/20 text-[#8FA879] border-[#8FA879]/40 hover:bg-[#8FA879]/30'
                  : 'bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30'
              }`}
              title="Toggle Monitoring Engine On/Off"
            >
              <Power className="w-3.5 h-3.5" />
              <span>{frontendData.monitoringEnabled ? 'ENABLED' : 'PAUSED'}</span>
            </button>

            {/* Reset Buffers */}
            <button
              onClick={handleResetMetrics}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg bg-[#1D251F] hover:bg-[#253028] text-[#C5A66A] border border-[#C5A66A]/20 transition-all text-xs"
              title="Reset rolling metric buffers"
            >
              <RotateCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Close */}
            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-[#1D251F] hover:bg-red-950/60 text-[#A5AD9D] hover:text-red-400 border border-[#2B372C] transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ================= NAVIGATION TABS ================= */}
        <div className="flex items-center gap-1 px-5 py-2 border-b border-[#232d24] bg-[#141915] text-xs font-serif shrink-0 overflow-x-auto custom-scrollbar">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'rendering', label: '3D Rendering', icon: Layers },
            { id: 'backend', label: 'Backend API', icon: Server },
            { id: 'simulation', label: 'Simulation', icon: Cpu },
            { id: 'ai', label: 'Council AI', icon: Zap },
            { id: 'network', label: 'Network & WS', icon: Radio },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundFx.playClick();
                  setActiveTab(tab.id as TabType);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-medium ${
                  isActive
                    ? 'bg-[#C5A66A]/20 text-[#C5A66A] border border-[#C5A66A]/50 font-semibold shadow-inner'
                    : 'text-[#8A9588] hover:text-[#EAE3D2] hover:bg-[#1A221B]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <div className="ml-auto flex items-center gap-2 text-[11px] font-mono text-[#7D8B7A]">
            <span className="flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  frontendData.monitoringEnabled ? 'bg-[#8FA879] animate-pulse' : 'bg-red-500'
                }`}
              />
              {autoRefresh ? `Auto: ${refreshIntervalSec}s` : 'Manual'}
            </span>
          </div>
        </div>

        {/* ================= TAB CONTENT PANELS ================= */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
          {/* ---------------- A. OVERVIEW TAB ---------------- */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Top Quick Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* 1. FPS */}
                <div className="p-3 rounded-lg bg-[#161c17] border border-[#2B372C] flex flex-col justify-between">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-[#A5AD9D]">
                    Average FPS
                  </div>
                  <div className="text-2xl font-bold font-mono text-[#C5A66A] my-1">
                    {frontendData.fps.average}{' '}
                    <span className="text-xs text-[#8FA879] font-normal">
                      ({frontendData.fps.current})
                    </span>
                  </div>
                  <div className="text-[10px] text-[#7D8B7A] font-mono">
                    Min: {frontendData.fps.min} | Max: {frontendData.fps.max}
                  </div>
                </div>

                {/* 2. Frame Time */}
                <div className="p-3 rounded-lg bg-[#161c17] border border-[#2B372C] flex flex-col justify-between">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-[#A5AD9D]">
                    Frame Time
                  </div>
                  <div className="text-2xl font-bold font-mono text-[#EAE3D2] my-1">
                    {frontendData.fps.frameTimeMs} <span className="text-xs font-normal">ms</span>
                  </div>
                  <div className="text-[10px] text-[#7D8B7A] font-mono">
                    Budget: 16.6 ms (60 FPS)
                  </div>
                </div>

                {/* 3. API p95 */}
                <div className="p-3 rounded-lg bg-[#161c17] border border-[#2B372C] flex flex-col justify-between">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-[#A5AD9D]">
                    API p95 Latency
                  </div>
                  <div className="text-2xl font-bold font-mono text-[#C5A66A] my-1">
                    {backendData?.api?.latency?.p95_ms ?? 'N/A'}{' '}
                    <span className="text-xs font-normal">ms</span>
                  </div>
                  <div className="text-[10px] text-[#7D8B7A] font-mono">
                    Avg: {backendData?.api?.latency?.avg_ms ?? 'N/A'} ms
                  </div>
                </div>

                {/* 4. Sim Tick */}
                <div className="p-3 rounded-lg bg-[#161c17] border border-[#2B372C] flex flex-col justify-between">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-[#A5AD9D]">
                    Sim Tick Duration
                  </div>
                  <div className="text-2xl font-bold font-mono text-[#8FA879] my-1">
                    {backendData?.simulation?.tick_duration?.avg_ms ?? 'N/A'}{' '}
                    <span className="text-xs font-normal">ms</span>
                  </div>
                  <div className="text-[10px] text-[#7D8B7A] font-mono">
                    Total Ticks: {backendData?.simulation?.total_ticks ?? 0}
                  </div>
                </div>

                {/* 5. Memory Heap */}
                <div className="p-3 rounded-lg bg-[#161c17] border border-[#2B372C] flex flex-col justify-between">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-[#A5AD9D]">
                    JS Heap Memory
                  </div>
                  <div className="text-2xl font-bold font-mono text-[#EAE3D2] my-1">
                    {frontendData.memory.supported
                      ? `${frontendData.memory.usedJSHeapSizeMB} MB`
                      : 'N/A'}
                  </div>
                  <div className="text-[10px] text-[#7D8B7A] font-mono">
                    {frontendData.memory.supported
                      ? `Limit: ${frontendData.memory.jsHeapSizeLimitMB} MB`
                      : 'Unsupported in browser'}
                  </div>
                </div>

                {/* 6. WS Health */}
                <div className="p-3 rounded-lg bg-[#161c17] border border-[#2B372C] flex flex-col justify-between">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-[#A5AD9D]">
                    WebSocket State
                  </div>
                  <div className="text-lg font-bold font-mono text-[#8FA879] my-1 flex items-center gap-1.5 uppercase">
                    <span className="w-2 h-2 rounded-full bg-[#8FA879] animate-pulse" />
                    {backendData?.websocket?.active_connections > 0
                      ? `Online (${backendData.websocket.active_connections})`
                      : 'Standby'}
                  </div>
                  <div className="text-[10px] text-[#7D8B7A] font-mono">
                    Sent: {backendData?.websocket?.messages_sent ?? 0}
                  </div>
                </div>
              </div>

              {/* Subsystem Summary Overview Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 3D Scene Quick Diagnostics */}
                <div className="p-4 rounded-xl bg-[#161c17] border border-[#2B372C] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#232d24] pb-2">
                    <div className="flex items-center gap-2 text-xs font-serif font-bold text-[#C5A66A]">
                      <Layers className="w-4 h-4 text-[#C5A66A]" />
                      <span>Active 3D Canvas Telemetry</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#8FA879] uppercase">
                      {activeSceneKey === 'council' ? '🏛️ Council Chamber' : '🌍 World Stage'}
                    </span>
                  </div>

                  {threeMetrics ? (
                    <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                      <div className="p-2 rounded bg-[#1C241E] border border-[#2B372C]">
                        <span className="text-[10px] text-[#7D8B7A] block">Draw Calls</span>
                        <span className="text-base font-bold text-[#EAE3D2]">
                          {threeMetrics.drawCalls}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-[#1C241E] border border-[#2B372C]">
                        <span className="text-[10px] text-[#7D8B7A] block">Triangles</span>
                        <span className="text-base font-bold text-[#EAE3D2]">
                          {(threeMetrics.triangles / 1000).toFixed(1)}k
                        </span>
                      </div>
                      <div className="p-2 rounded bg-[#1C241E] border border-[#2B372C]">
                        <span className="text-[10px] text-[#7D8B7A] block">Geometries</span>
                        <span className="text-base font-bold text-[#EAE3D2]">
                          {threeMetrics.geometries}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-[#1C241E] border border-[#2B372C]">
                        <span className="text-[10px] text-[#7D8B7A] block">Textures</span>
                        <span className="text-base font-bold text-[#EAE3D2]">
                          {threeMetrics.textures}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-[#1C241E] border border-[#2B372C]">
                        <span className="text-[10px] text-[#7D8B7A] block">Scene Objects</span>
                        <span className="text-base font-bold text-[#EAE3D2]">
                          {threeMetrics.sceneObjects}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-[#1C241E] border border-[#2B372C]">
                        <span className="text-[10px] text-[#7D8B7A] block">Render Time</span>
                        <span className="text-base font-bold text-[#C5A66A]">
                          {threeMetrics.frameRenderTimeMs} ms
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-[#7D8B7A] font-mono">
                      No 3D Canvas currently rendering. Navigate to World Explorer or Council of
                      Advisors to sample WebGL telemetry.
                    </div>
                  )}
                </div>

                {/* Long Tasks & Main Thread Responsiveness */}
                <div className="p-4 rounded-xl bg-[#161c17] border border-[#2B372C] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#232d24] pb-2">
                    <div className="flex items-center gap-2 text-xs font-serif font-bold text-[#C5A66A]">
                      <Clock className="w-4 h-4 text-[#C5A66A]" />
                      <span>Main-Thread Responsiveness & Long Tasks (&gt;50ms)</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#A5AD9D]">
                      {frontendData.longTasks.supported ? 'PerformanceObserver' : 'Unsupported'}
                    </span>
                  </div>

                  {frontendData.longTasks.supported ? (
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between p-2 rounded bg-[#1C241E] border border-[#2B372C]">
                        <span className="text-[#A5AD9D]">Total Long Tasks Detected:</span>
                        <span className="font-bold text-[#EAE3D2]">
                          {frontendData.longTasks.count}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-[#1C241E] border border-[#2B372C]">
                        <span className="text-[#A5AD9D]">Total Blocking Time (TBT):</span>
                        <span className="font-bold text-[#C5A66A]">
                          {frontendData.longTasks.totalDurationMs} ms
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-[#1C241E] border border-[#2B372C]">
                        <span className="text-[#A5AD9D]">Worst Frame Hitch:</span>
                        <span className="font-bold text-[#EAE3D2]">
                          {frontendData.longTasks.maxDurationMs} ms
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-[#7D8B7A] font-mono">
                      PerformanceObserver Long Tasks API is not exposed by this browser engine.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ---------------- B. RENDERING TAB (THREE.JS) ---------------- */}
          {activeTab === 'rendering' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-serif font-bold uppercase tracking-wider text-[#C5A66A]">
                    WebGL & Three.js Canvas Metrics
                  </h3>
                  <p className="text-xs text-[#7D8B7A]">
                    Sampled at 2Hz via WebGLRenderer.info without forcing extra render passes
                  </p>
                </div>
              </div>

              {/* Per-Scene Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. World Explorer Scene */}
                <div className="p-4 rounded-xl bg-[#161c17] border border-[#2B372C] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#232d24] pb-2">
                    <span className="text-xs font-serif font-bold text-[#EAE3D2]">
                      CivilizationWorld3D (World Stage)
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        frontendData.three.world
                          ? 'bg-[#8FA879]/20 text-[#8FA879] border border-[#8FA879]/40'
                          : 'bg-[#232d24] text-[#7D8B7A]'
                      }`}
                    >
                      {frontendData.three.world ? 'ACTIVE' : 'IDLE / PAUSED'}
                    </span>
                  </div>

                  {frontendData.three.world ? (
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2.5 rounded bg-[#1C241E] border border-[#2B372C]">
                        <span className="text-[10px] text-[#7D8B7A] block">Draw Calls</span>
                        <span className="text-lg font-bold text-[#C5A66A]">
                          {frontendData.three.world.drawCalls}
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-[#1C241E] border border-[#2B372C]">
                        <span className="text-[10px] text-[#7D8B7A] block">Triangles</span>
                        <span className="text-lg font-bold text-[#EAE3D2]">
                          {(frontendData.three.world.triangles / 1000).toFixed(1)}k
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-[#1C241E] border border-[#2B372C]">
                        <span className="text-[10px] text-[#7D8B7A] block">Geometries</span>
                        <span className="text-lg font-bold text-[#EAE3D2]">
                          {frontendData.three.world.geometries}
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-[#1C241E] border border-[#2B372C]">
                        <span className="text-[10px] text-[#7D8B7A] block">Textures</span>
                        <span className="text-lg font-bold text-[#EAE3D2]">
                          {frontendData.three.world.textures}
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-[#1C241E] border border-[#2B372C]">
                        <span className="text-[10px] text-[#7D8B7A] block">Scene Objects</span>
                        <span className="text-lg font-bold text-[#EAE3D2]">
                          {frontendData.three.world.sceneObjects}
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-[#1C241E] border border-[#2B372C]">
                        <span className="text-[10px] text-[#7D8B7A] block">Render Duration</span>
                        <span className="text-lg font-bold text-[#8FA879]">
                          {frontendData.three.world.frameRenderTimeMs} ms
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-[#7D8B7A] font-mono">
                      World Explorer canvas is paused or not mounted.
                    </div>
                  )}
                </div>

                {/* 2. Council Chamber Scene */}
                <div className="p-4 rounded-xl bg-[#161c17] border border-[#2B372C] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#232d24] pb-2">
                    <span className="text-xs font-serif font-bold text-[#EAE3D2]">
                      CouncilChamber3D (Council Room)
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        frontendData.three.council
                          ? 'bg-[#8FA879]/20 text-[#8FA879] border border-[#8FA879]/40'
                          : 'bg-[#232d24] text-[#7D8B7A]'
                      }`}
                    >
                      {frontendData.three.council ? 'ACTIVE' : 'IDLE / NOT LOADED'}
                    </span>
                  </div>

                  {frontendData.three.council ? (
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2.5 rounded bg-[#1C241E] border border-[#2B372C]">
                        <span className="text-[10px] text-[#7D8B7A] block">Draw Calls</span>
                        <span className="text-lg font-bold text-[#C5A66A]">
                          {frontendData.three.council.drawCalls}
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-[#1C241E] border border-[#2B372C]">
                        <span className="text-[10px] text-[#7D8B7A] block">Triangles</span>
                        <span className="text-lg font-bold text-[#EAE3D2]">
                          {(frontendData.three.council.triangles / 1000).toFixed(1)}k
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-[#1C241E] border border-[#2B372C]">
                        <span className="text-[10px] text-[#7D8B7A] block">Geometries</span>
                        <span className="text-lg font-bold text-[#EAE3D2]">
                          {frontendData.three.council.geometries}
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-[#1C241E] border border-[#2B372C]">
                        <span className="text-[10px] text-[#7D8B7A] block">Textures</span>
                        <span className="text-lg font-bold text-[#EAE3D2]">
                          {frontendData.three.council.textures}
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-[#1C241E] border border-[#2B372C]">
                        <span className="text-[10px] text-[#7D8B7A] block">Scene Objects</span>
                        <span className="text-lg font-bold text-[#EAE3D2]">
                          {frontendData.three.council.sceneObjects}
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-[#1C241E] border border-[#2B372C]">
                        <span className="text-[10px] text-[#7D8B7A] block">Render Duration</span>
                        <span className="text-lg font-bold text-[#8FA879]">
                          {frontendData.three.council.frameRenderTimeMs} ms
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-[#7D8B7A] font-mono">
                      Council Chamber canvas is currently idle. Open the Council of Advisors page to
                      sample 3D minister telemetry.
                    </div>
                  )}
                </div>
              </div>

              {/* Asset Timing & GLB Downloads */}
              <div className="p-4 rounded-xl bg-[#161c17] border border-[#2B372C] space-y-3">
                <div className="flex items-center justify-between border-b border-[#232d24] pb-2">
                  <span className="text-xs font-serif font-bold text-[#C5A66A]">
                    Recent 3D Asset & Resource Load Timings
                  </span>
                  <span className="text-[10px] font-mono text-[#7D8B7A]">
                    Resource Timing API
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-[#232d24] text-[10px] text-[#7D8B7A] uppercase">
                        <th className="py-1.5 px-2">Asset Name</th>
                        <th className="py-1.5 px-2">Type</th>
                        <th className="py-1.5 px-2">Duration</th>
                        <th className="py-1.5 px-2">Transfer Size</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2720]">
                      {frontendData.assets.recent.length > 0 ? (
                        frontendData.assets.recent.map((asset, i) => (
                          <tr key={i} className="hover:bg-[#1a211b]">
                            <td className="py-1.5 px-2 text-[#EAE3D2] truncate max-w-[280px]">
                              {asset.name}
                            </td>
                            <td className="py-1.5 px-2 text-[#8FA879]">
                              {asset.initiatorType}
                            </td>
                            <td className="py-1.5 px-2 text-[#C5A66A]">
                              {asset.durationMs} ms
                            </td>
                            <td className="py-1.5 px-2 text-[#A5AD9D]">
                              {asset.transferSizeKB > 0 ? `${asset.transferSizeKB} KB` : 'Cached'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-[#7D8B7A]">
                            No recent resource loads recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- C. BACKEND API TAB ---------------- */}
          {activeTab === 'backend' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-serif font-bold uppercase tracking-wider text-[#C5A66A]">
                    FastAPI Server Performance & SQLite Tracing
                  </h3>
                  <p className="text-xs text-[#7D8B7A]">
                    Captured via PerformanceMonitoringMiddleware with Correlation IDs
                  </p>
                </div>
              </div>

              {/* Latency & Throughput Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-[#161c17] border border-[#2B372C]">
                  <span className="text-[10px] uppercase font-mono text-[#7D8B7A] block">
                    Throughput
                  </span>
                  <span className="text-xl font-bold font-mono text-[#EAE3D2]">
                    {backendData?.api?.throughput_req_per_sec ?? 0}{' '}
                    <span className="text-xs font-normal">req/s</span>
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#161c17] border border-[#2B372C]">
                  <span className="text-[10px] uppercase font-mono text-[#7D8B7A] block">
                    p50 Latency
                  </span>
                  <span className="text-xl font-bold font-mono text-[#C5A66A]">
                    {backendData?.api?.latency?.p50_ms ?? 0} ms
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#161c17] border border-[#2B372C]">
                  <span className="text-[10px] uppercase font-mono text-[#7D8B7A] block">
                    p95 Latency
                  </span>
                  <span className="text-xl font-bold font-mono text-[#C5A66A]">
                    {backendData?.api?.latency?.p95_ms ?? 0} ms
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#161c17] border border-[#2B372C]">
                  <span className="text-[10px] uppercase font-mono text-[#7D8B7A] block">
                    Error Rate
                  </span>
                  <span className="text-xl font-bold font-mono text-[#8FA879]">
                    {backendData?.api?.error_rate ?? 0}%
                  </span>
                </div>
              </div>

              {/* Endpoint Breakdown */}
              <div className="p-4 rounded-xl bg-[#161c17] border border-[#2B372C] space-y-3">
                <div className="flex items-center justify-between border-b border-[#232d24] pb-2">
                  <span className="text-xs font-serif font-bold text-[#EAE3D2]">
                    Monitored API Endpoints (Top Traversal)
                  </span>
                  <span className="text-[10px] font-mono text-[#7D8B7A]">
                    Total Requests: {backendData?.api?.total_requests ?? 0}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-[#232d24] text-[10px] text-[#7D8B7A] uppercase">
                        <th className="py-1.5 px-2">Endpoint</th>
                        <th className="py-1.5 px-2">Requests</th>
                        <th className="py-1.5 px-2">Avg Latency</th>
                        <th className="py-1.5 px-2">Min / Max</th>
                        <th className="py-1.5 px-2">Last Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2720]">
                      {backendData?.api?.endpoints?.length > 0 ? (
                        backendData.api.endpoints.map((ep: any, i: number) => (
                          <tr key={i} className="hover:bg-[#1a211b]">
                            <td className="py-1.5 px-2 text-[#EAE3D2] truncate max-w-[280px]">
                              {ep.endpoint}
                            </td>
                            <td className="py-1.5 px-2 text-[#C5A66A]">{ep.count}</td>
                            <td className="py-1.5 px-2 text-[#8FA879]">{ep.avg_duration_ms} ms</td>
                            <td className="py-1.5 px-2 text-[#7D8B7A]">
                              {ep.min_ms} / {ep.max_ms} ms
                            </td>
                            <td className="py-1.5 px-2">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] ${
                                  ep.last_status < 400
                                    ? 'bg-[#8FA879]/20 text-[#8FA879]'
                                    : 'bg-red-500/20 text-red-400'
                                }`}
                              >
                                {ep.last_status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-[#7D8B7A]">
                            No backend endpoints traversed yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Database Query Tracing */}
              <div className="p-4 rounded-xl bg-[#161c17] border border-[#2B372C] space-y-3">
                <div className="flex items-center justify-between border-b border-[#232d24] pb-2">
                  <div className="flex items-center gap-2 text-xs font-serif font-bold text-[#C5A66A]">
                    <Database className="w-4 h-4 text-[#C5A66A]" />
                    <span>SQLite Traced Query Telemetry</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#7D8B7A]">
                    Total Queries: {backendData?.database?.total_queries ?? 0}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                  <div className="p-2.5 rounded bg-[#1C241E] border border-[#2B372C]">
                    <span className="text-[10px] text-[#7D8B7A] block">Average Query Time</span>
                    <span className="text-base font-bold text-[#EAE3D2]">
                      {backendData?.database?.latency?.avg_ms ?? 0} ms
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-[#1C241E] border border-[#2B372C]">
                    <span className="text-[10px] text-[#7D8B7A] block">Slow Queries (&gt;50ms)</span>
                    <span className="text-base font-bold text-[#C5A66A]">
                      {backendData?.database?.slow_queries_count ?? 0}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-[#1C241E] border border-[#2B372C]">
                    <span className="text-[10px] text-[#7D8B7A] block">Connection Errors</span>
                    <span className="text-base font-bold text-[#8FA879]">
                      {backendData?.database?.errors_count ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- D. SIMULATION TAB ---------------- */}
          {activeTab === 'simulation' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-serif font-bold uppercase tracking-wider text-[#C5A66A]">
                    Civilisation Simulation Engine Telemetry
                  </h3>
                  <p className="text-xs text-[#7D8B7A]">
                    Discrete tick performance, state updates and agent throughput
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div className="p-3 rounded-lg bg-[#161c17] border border-[#2B372C]">
                  <span className="text-[10px] uppercase text-[#7D8B7A] block">Avg Tick Duration</span>
                  <span className="text-xl font-bold text-[#8FA879]">
                    {backendData?.simulation?.tick_duration?.avg_ms ?? 0} ms
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#161c17] border border-[#2B372C]">
                  <span className="text-[10px] uppercase text-[#7D8B7A] block">p95 Tick Duration</span>
                  <span className="text-xl font-bold text-[#C5A66A]">
                    {backendData?.simulation?.tick_duration?.p95_ms ?? 0} ms
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#161c17] border border-[#2B372C]">
                  <span className="text-[10px] uppercase text-[#7D8B7A] block">Processed Agents</span>
                  <span className="text-xl font-bold text-[#EAE3D2]">
                    {(backendData?.simulation?.last_processed_agents ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#161c17] border border-[#2B372C]">
                  <span className="text-[10px] uppercase text-[#7D8B7A] block">Total Ticks</span>
                  <span className="text-xl font-bold text-[#C5A66A]">
                    {backendData?.simulation?.total_ticks ?? 0}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#161c17] border border-[#2B372C] space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-[#232d24] pb-2">
                  <span className="font-serif font-bold text-[#EAE3D2]">
                    Simulation Engine Diagnostics
                  </span>
                  <span className="text-[10px] text-[#8FA879]">
                    Last Tick:{' '}
                    {backendData?.simulation?.last_tick_seconds_ago !== null
                      ? `${backendData.simulation.last_tick_seconds_ago}s ago`
                      : 'Never'}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between p-2 rounded bg-[#1C241E]">
                    <span className="text-[#A5AD9D]">State Updates Per Executed Tick:</span>
                    <span className="text-[#EAE3D2] font-bold">
                      {backendData?.simulation?.last_state_updates ?? 1}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-[#1C241E]">
                    <span className="text-[#A5AD9D]">Cumulative Historical Events Generated:</span>
                    <span className="text-[#EAE3D2] font-bold">
                      {backendData?.simulation?.total_events_generated ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-[#1C241E]">
                    <span className="text-[#A5AD9D]">Cumulative Database Writes Recorded:</span>
                    <span className="text-[#EAE3D2] font-bold">
                      {backendData?.simulation?.total_db_writes ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-[#1C241E]">
                    <span className="text-[#A5AD9D]">Simulation Execution Errors:</span>
                    <span className="text-[#8FA879] font-bold">
                      {backendData?.simulation?.errors_count ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- E. COUNCIL AI TAB ---------------- */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-serif font-bold uppercase tracking-wider text-[#C5A66A]">
                    Council Intelligence & AI Orchestration Telemetry
                  </h3>
                  <p className="text-xs text-[#7D8B7A]">
                    Latency profiling for multi-domain advisor deliberations
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-[#161c17] border border-[#2B372C]">
                  <span className="text-[10px] uppercase text-[#7D8B7A] block">Total AI Runs</span>
                  <span className="text-xl font-bold text-[#C5A66A]">
                    {backendData?.council_ai?.total_requests ?? 0}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#161c17] border border-[#2B372C]">
                  <span className="text-[10px] uppercase text-[#7D8B7A] block">Deliberation Avg</span>
                  <span className="text-xl font-bold text-[#8FA879]">
                    {backendData?.council_ai?.deliberation?.avg_ms ?? 0} ms
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#161c17] border border-[#2B372C]">
                  <span className="text-[10px] uppercase text-[#7D8B7A] block">Failed Operations</span>
                  <span className="text-xl font-bold text-red-400">
                    {backendData?.council_ai?.failed_requests ?? 0}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#161c17] border border-[#2B372C]">
                  <span className="text-[10px] uppercase text-[#7D8B7A] block">Pending Operations</span>
                  <span className="text-xl font-bold text-[#EAE3D2]">
                    {backendData?.council_ai?.pending_operations ?? 0}
                  </span>
                </div>
              </div>

              {/* Per-Advisor Breakdown */}
              <div className="p-4 rounded-xl bg-[#161c17] border border-[#2B372C] space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-[#232d24] pb-2">
                  <span className="font-serif font-bold text-[#C5A66A]">
                    Six Royal Advisor Independent Engine Profile
                  </span>
                  <span className="text-[10px] text-[#7D8B7A]">
                    Domain Analytical Evaluation Timing
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { id: 'adv_chancellor', name: 'Chancellor Malor Drake' },
                    { id: 'adv_treasurer', name: 'Treasurer Varian Voss' },
                    { id: 'adv_scholar', name: 'Grand Scholar Elyse Moran' },
                    { id: 'adv_architect', name: 'Royal Architect Corin Sol' },
                    { id: 'adv_physician', name: 'High Physician Thalia Rowe' },
                    { id: 'adv_keeper', name: 'Keeper Sarah Thorne' },
                  ].map((adv) => {
                    const stats = backendData?.council_ai?.advisors?.[adv.id];
                    return (
                      <div
                        key={adv.id}
                        className="p-3 rounded-lg bg-[#1C241E] border border-[#2B372C] space-y-1"
                      >
                        <div className="text-[11px] font-bold text-[#EAE3D2] truncate">
                          {adv.name}
                        </div>
                        <div className="flex justify-between text-[10px] text-[#A5AD9D]">
                          <span>Invocations:</span>
                          <span className="text-[#C5A66A]">{stats?.count ?? 0}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-[#A5AD9D]">
                          <span>Average Duration:</span>
                          <span className="text-[#8FA879]">{stats?.avg_ms ?? 0} ms</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-[#A5AD9D]">
                          <span>p95 Latency:</span>
                          <span className="text-[#C5A66A]">{stats?.p95_ms ?? 0} ms</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ---------------- F. NETWORK & WEBSOCKET TAB ---------------- */}
          {activeTab === 'network' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-serif font-bold uppercase tracking-wider text-[#C5A66A]">
                    WebSocket & Network Streaming Telemetry
                  </h3>
                  <p className="text-xs text-[#7D8B7A]">
                    Telemetry broadcast status, message volumes and connection health
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-[#161c17] border border-[#2B372C]">
                  <span className="text-[10px] uppercase text-[#7D8B7A] block">Active Clients</span>
                  <span className="text-xl font-bold text-[#8FA879]">
                    {backendData?.websocket?.active_connections ?? 0}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#161c17] border border-[#2B372C]">
                  <span className="text-[10px] uppercase text-[#7D8B7A] block">Messages Sent</span>
                  <span className="text-xl font-bold text-[#C5A66A]">
                    {backendData?.websocket?.messages_sent ?? 0}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#161c17] border border-[#2B372C]">
                  <span className="text-[10px] uppercase text-[#7D8B7A] block">Messages Recv</span>
                  <span className="text-xl font-bold text-[#EAE3D2]">
                    {backendData?.websocket?.messages_received ?? 0}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#161c17] border border-[#2B372C]">
                  <span className="text-[10px] uppercase text-[#7D8B7A] block">Network Errors</span>
                  <span className="text-xl font-bold text-red-400">
                    {backendData?.websocket?.errors_count ?? 0}
                  </span>
                </div>
              </div>

              {/* Data Volume & Limitations Card */}
              <div className="p-4 rounded-xl bg-[#161c17] border border-[#2B372C] space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-[#232d24] pb-2">
                  <span className="font-serif font-bold text-[#EAE3D2]">
                    Streaming Diagnostics & Measurement Notes
                  </span>
                  <span className="text-[10px] text-[#8FA879]">
                    Endpoint: /ws/world/&#123;id&#125;
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between p-2 rounded bg-[#1C241E]">
                    <span className="text-[#A5AD9D]">Approximate Outbound Payload:</span>
                    <span className="text-[#EAE3D2]">
                      {((backendData?.websocket?.bytes_sent_approx ?? 0) / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-[#1C241E]">
                    <span className="text-[#A5AD9D]">Approximate Inbound Payload:</span>
                    <span className="text-[#EAE3D2]">
                      {((backendData?.websocket?.bytes_received_approx ?? 0) / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-[#1C241E]">
                    <span className="text-[#A5AD9D]">Server-Side Dispatch Duration:</span>
                    <span className="text-[#C5A66A]">
                      {backendData?.websocket?.avg_processing_duration_ms ?? 0} ms
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#141915] border border-[#C5A66A]/30 text-[#A5AD9D] text-[11px] space-y-1">
                  <div className="flex items-center gap-1.5 text-[#C5A66A] font-bold">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Network Latency Measurement Limitation</span>
                  </div>
                  <p>
                    {backendData?.websocket?.limitations_note ||
                      'Server-side processing duration is measured. True client network round-trip latency requires client echo ping/pong.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= FOOTER ================= */}
        <div className="px-5 py-2.5 border-t border-[#2B372C] bg-[#141915] flex items-center justify-between text-[11px] font-mono text-[#7D8B7A] shrink-0">
          <div className="flex items-center gap-3">
            <span>
              Snapshot Time:{' '}
              {new Date(frontendData.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline">Hotkey: Ctrl+Shift+P or F2</span>
          </div>

          <div className="flex items-center gap-2">
            <span>Interval:</span>
            {[1, 2, 5].map((sec) => (
              <button
                key={sec}
                onClick={() => setRefreshIntervalSec(sec)}
                className={`px-1.5 py-0.5 rounded text-[10px] ${
                  refreshIntervalSec === sec
                    ? 'bg-[#C5A66A]/20 text-[#C5A66A] font-bold border border-[#C5A66A]/40'
                    : 'text-[#7D8B7A] hover:text-[#EAE3D2]'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
