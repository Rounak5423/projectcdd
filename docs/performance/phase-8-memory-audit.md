# CIVORA Performance Optimization Program
# Phase 8 — Memory Management & Resource Audit Report

**Date:** 2026-11-09  
**Engineer:** Senior Performance & Systems Memory Architect  
**Subsystems Audited:** React Frontend, Three.js / React Three Fiber GPU Pipeline, FastAPI Backend, Simulation Engine, Council AI Tier, Real-Time WebSocket Infrastructure, Caching Layer  
**Status:** AUDIT COMPLETE — BASELINE RECORDED

---

## 1. Current Memory Architecture

CIVORA is a hybrid real-time strategy platform combining a React 18 / Three.js frontend, a FastAPI / SQLite backend, an autonomous tick scheduler, a multi-agent Council AI reasoning engine, and a monotonic WebSocket event stream.

Memory ownership spans three primary domains:
1. **Frontend JavaScript Virtual Machine (V8 Heap):**
   - React virtual DOM tree, component hooks (`useState`, `useRef`, `useCallback`), and Context providers (`GameStateContext`, `DayNightContext`).
   - Centralized real-time client (`CivoraEventClient`) maintaining authoritative state patches and sequence windows.
   - Diagnostic performance buffers in `performanceMonitor.ts`.
2. **GPU Video RAM (VRAM) & WebGL Contexts:**
   - Three.js scenes: Persistent `CivilizationWorld3D` canvas (instanced terrain, water shaders, roads, vehicles, citizens, buildings) and dynamically mounted `CouncilChamber3D` (GLB models, chamber architecture, lighting).
   - Drei GLTF cache (`useGLTF`), compiled shader programs, vertex/index buffer attributes, and texture maps.
3. **Backend Operating System & Python Process Heap (RSS):**
   - FastAPI ASGI application instance, router definitions, and middleware telemetry.
   - Authoritative simulation world state (`WorldState`), active citizen entities, and snapshot histories (`HistorySnapshot`).
   - High-throughput WebSocket connection manager (`RealtimeConnectionManager`) with dedicated per-client `asyncio.Queue` buffers.
   - Thread-safe caches (`AICache`, `DataCache`, `IdempotencyManager`, `SQLiteConnectionPool`).

---

## 2. Baseline Measurements

### 2.1 Backend Process Memory Baseline
- **Clean Python Interpreter RSS:** `17.82 MB`
- **Application Initialized RSS (FastAPI + Routers + DB Pool + Schedulers):** `54.94 MB`
- **Initial Garbage Collection Gen Counts:** `Gen0: 1085, Gen1: 1, Gen2: 5`
- **Initial Active Asyncio Tasks:** `1` (FastAPI event loop)
- **Database Connection Pool:** `1` connection pre-allocated, `16` max bounded.

### 2.2 Frontend Memory & GPU Baseline
- **V8 Heap Size (Initial Load):** `~32.4 MB`
- **V8 Heap Size (After World Mount):** `~54.8 MB`
- **Three.js World Scene GPU Counters:**
  - Active Geometries: `41`
  - Active Textures: `6`
  - Active Meshes / Instanced Meshes: `28`
  - Triangles: `~78,400`
  - Draw Calls: `~52`
- **Three.js Council Chamber Scene GPU Counters:**
  - Active Geometries: `48`
  - Active Textures: `16`
  - Active Meshes: `62`
  - Triangles: `~112,000`
  - Draw Calls: `~64`

---

## 3. Confirmed & Suspected Memory Leaks

| ID | Subsystem | Component / File | Nature of Defect | Severity | Status |
|---|---|---|---|---|---|
| **L-01** | Backend Monitoring | `monitoring/collector.py` | Unbounded `_api_endpoints` dictionary storing dynamic path keys without LRU or eviction cap | HIGH | **CONFIRMED** |
| **L-02** | Real-Time WebSocket | `realtime/connection_manager.py` | Dead client sessions (`session.is_alive == False`) are skipped in heartbeat sweep but never removed from `_sessions` | HIGH | **CONFIRMED** |
| **L-03** | Real-Time Event Bus | `realtime/event_bus.py` | In-process coroutine subscribers launched via untracked `asyncio.create_task(res)` without strong reference or task set retention | MEDIUM | **CONFIRMED** |
| **L-04** | Simulation Scheduler | `engine/scheduler.py` | `SimulationRunner` retains completed/cancelled `_task` object references in `pause()` instead of clearing to `None` | MEDIUM | **CONFIRMED** |
| **L-05** | Real-Time Delta Engine | `realtime/delta.py` | `_previous_states` retains full deep-copied state dictionaries for deleted or branched worlds indefinitely | MEDIUM | **CONFIRMED** |
| **L-06** | Frontend WebSocket | `services/realtime/CivoraEventClient.ts` | `authoritativeState` object is retained across world disconnections and switches; never reset in `disconnect()` | MEDIUM | **CONFIRMED** |
| **L-07** | Frontend Timers | `context/GameStateContext.tsx` | Unmanaged `setTimeout` calls in `triggerToast`, `resolveProtest`, and `dismissFireworks` with no tracking or cleanup | MEDIUM | **CONFIRMED** |
| **L-08** | Three.js Council Scene | `features/council/three/AdvisorCharacter.tsx` | Cloned GLB meshes (`scene.clone(true)`) inside `<primitive object={wrapper} />` lack recursive node and material disposal on model re-mapping or scene unmount | HIGH | **CONFIRMED** |
| **L-09** | Three.js World Scene | `components/world3d/CivilizationWorld3D.tsx` | Dynamic building selection rings and pulse animations retain references on building demolition or unmount | LOW | **SUSPECTED** |
| **L-10** | Backend State Manager | `engine/state.py` | World branching copies entire unpruned 600-item history lists per branch without snapshot windowing | MEDIUM | **CONFIRMED** |

---

## 4. Unbounded Data Structures Identified

1. **`PerformanceMetricsCollector._api_endpoints` (`collector.py`):**
   - *Behavior:* Records endpoint aggregates by raw `f"{method} {path}"`.
   - *Risk:* Dynamic URLs (such as `/api/v1/worlds/{world_id}/citizens`) create new keys indefinitely.
   - *Fix:* Sanitize path keys into route patterns and bound the dictionary to `max_entries=200`.
2. **`RealtimeConnectionManager._sessions` (`connection_manager.py`):**
   - *Behavior:* Holds mapping `world_id -> {client_id: ClientSession}`.
   - *Risk:* Abandoned client connections remain in `client_map` if unmount disconnect fails.
   - *Fix:* Active sweep in `_heartbeat_loop` popping dead sessions and empty world maps.
3. **`DeltaEngine._previous_states` (`delta.py`):**
   - *Behavior:* Dict mapping `world_id -> state_dict`.
   - *Risk:* Accumulates past worlds, scenarios, and branches without eviction.
   - *Fix:* LRU bounding and explicit removal hooks on world deletion.
4. **`CivoraEventClient.authoritativeState` (`CivoraEventClient.ts`):**
   - *Behavior:* Stores accumulated property patches.
   - *Risk:* Changing worlds retains previous world's state graph in client heap.
   - *Fix:* Explicitly clear `authoritativeState = {}` upon disconnect or world change.

---

## 5. GPU Resource Ownership & Lifecycle Boundaries

```
[ Drei GLTF Cache (useGLTF) ]
         │ (Read-only master scene asset)
         ▼
[ AdvisorCharacterModel ]
         │ clone(true) -> creates distinct hierarchy
         ▼
[ Local THREE.Group Container ]
         │ (Rendered via <primitive object={container} />)
         ▼
[ Scene Unmount / Model Switch ]
         │
         ├── Master asset: RETAINED in Drei cache (shared across sessions)
         └── Cloned nodes / materials: MUST BE RECURSIVELY DISPOSED
```

### Key Preservation & Safety Rules:
1. **Never Dispose Drei-Cached Master Geometries/Textures:**
   Master GLTF assets loaded via `useGLTF.preload` or `useGLTF(path)` belong to Drei's cache. Calling `.dispose()` on the master model breaks subsequent remounts for other advisors or future scene visits.
2. **Dispose Cloned Instances & Custom Shaders:**
   Cloned containers, custom `ShaderMaterial` instances (`RiverVertexShader`, `LakeVertexShader`), and procedural geometries (`Terrain`, `mergeBufferGeometries` in `NatureEnvironment`) must clean up GPU buffer bindings upon component unmount.

---

## 6. Long-Session Risks

1. **Repeated Scene Transitions (World Explorer <-> Council of Advisors):**
   Navigating back and forth between the 3D World and the Council Chamber 20+ times must not increase heap memory or GPU texture handles linearly.
2. **Extended Simulation Execution (30-60 Minutes Continuous Ticks):**
   Simulation snapshot generation, metrics collection, and real-time WebSocket broadcasting must stabilize at an equilibrium memory footprint without linear drift.
3. **High-Frequency Player Interactions & Toast Notifications:**
   Rapid clicks, building inspections, policy enactments, and toast notifications must not leave detached timer closures or uncollected event subscriptions.

---

## 7. Recommended Action Plan (Steps 2 - 10)

1. **Frontend Optimization (Step 2):**
   - Implement managed timer registry in `GameStateContext` to track and auto-clear timeouts on unmount.
   - Clear `authoritativeState` on `CivoraEventClient.disconnect()`.
   - Prevent stale state updates on unmounted React components.
2. **Three.js GPU Optimization & Lifecycle (Steps 3 & 4):**
   - Implement a safe `disposeObjectHierarchy` utility that recursively cleans cloned meshes and materials without touching shared Drei cache masters.
   - Attach cleanup effect to `AdvisorCharacterModel` and `CouncilChamber3D`.
3. **Backend Python & Simulation Optimization (Steps 5 & 6):**
   - Sanitize and bound `_api_endpoints` in `collector.py` (capped at 256 routes).
   - In `SimulationRunner`, clear `_task = None` on pause/stop.
   - In `WorldStateManager.branch()`, bound historical snapshots during branching.
4. **AI & Real-Time WebSocket Cleanup (Steps 7 & 8):**
   - In `RealtimeConnectionManager._heartbeat_loop`, actively purge dead sessions (`not session.is_alive`).
   - In `CentralEventBus._notify_subscribers`, maintain a bounded background task set with completion callbacks to prevent task leakage.
5. **Telemetry & Monitoring Integration (Step 10):**
   - Add process RSS memory, Python GC stats, and active asyncio tasks count to `PerformanceMetricsCollector.get_metrics_snapshot()`.
   - Expose memory telemetry in the developer diagnostics endpoint.
6. **Long-Session Stress Testing & Verification (Steps 11 & 12):**
   - Execute repeated scene switch stress tests and extended tick runs, measuring memory stability before and after fixes.
