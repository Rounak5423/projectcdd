# CIVORA — Phase 1: Centralized Performance Monitoring Infrastructure

## 1. Overview & Objective

Phase 1 establishes a comprehensive, non-intrusive performance monitoring and diagnostics layer across the entire CIVORA application stack. 

Per the **Phase 1 Execution Rules**, this infrastructure performs **instrumentation, monitoring, and telemetry collection only**. It does not alter simulation rules, 3D models, database schemas, or game balances.

---

## 2. Architecture of the Monitoring System

The monitoring architecture is partitioned into two decoupled tiers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND CLIENT (Browser)                       │
│                                                                        │
│  [ CentralPerformanceMonitor ] (Singleton)                             │
│     ├── requestAnimationFrame Loop (Rolling 120-frame ring buffer)     │
│     ├── PerformanceObserver ('longtask') -> TBT & Frame Hitches        │
│     ├── PerformanceObserver ('resource') -> GLB / Texture timings      │
│     ├── Axios Interceptor -> REST latency & status codes               │
│     └── performance.memory -> JS Heap allocation                       │
│                                                                        │
│  [ ThreeSceneSampler ] (In-Canvas 2Hz WebGL Telemetry)                 │
│     ├── gl.info.render (Draw Calls, Triangles)                         │
│     ├── gl.info.memory (Geometries, Textures)                          │
│     └── scene.traverse (Active Scene Graph Objects)                    │
│                                                                        │
│  [ Developer Performance Dashboard ] (Modal / HUD)                     │
│     ├── Hotkeys: F2 or Ctrl+Shift+P                                    │
│     └── Live 1Hz subscription to local & backend diagnostics           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP GET /api/v1/diagnostics/metrics
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        BACKEND SERVER (FastAPI)                        │
│                                                                        │
│  [ PerformanceMetricsCollector ] (Thread-Safe In-Memory Singleton)     │
│     ├── PerformanceMonitoringMiddleware -> X-Correlation-ID & Latency │
│     ├── TracedConnection / TracedCursor -> SQLite Query Execution Time │
│     ├── Simulation Engine Ticker Hook -> Tick MS & Agent Count         │
│     ├── Council AI Orchestrator Hook -> Advisor Evaluation Timing      │
│     └── WebSocket Connection Manager -> Message Throughput & Payload   │
│                                                                        │
│  [ Diagnostics Router ] (/api/v1/diagnostics/*)                        │
│     ├── GET  /metrics  (Consolidated Telemetry Snapshot)               │
│     ├── POST /toggle   (Runtime Enable / Disable Toggle)               │
│     └── POST /reset    (Rolling Buffer Reset)                          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Metrics Catalog

### Available Metrics

| Category | Metric Name | Source / Methodology | Unit |
| :--- | :--- | :--- | :--- |
| **Frontend Rendering** | Current FPS & Rolling Average FPS | `requestAnimationFrame` delta ring buffer (120 samples) | Frames/sec |
| | Frame Duration | High-resolution timestamp delta | Milliseconds (ms) |
| | Min / Max FPS | Clamped extrema over sample window | Frames/sec |
| **Main-Thread Responsiveness** | Long Tasks Count | `PerformanceObserver` with `entryTypes: ['longtask']` | Count |
| | Total Blocking Time (TBT) | Cumulative duration of tasks exceeding 50ms | Milliseconds (ms) |
| | Worst Frame Hitch | Max duration of detected long task | Milliseconds (ms) |
| **Browser Memory** | Used JS Heap | `performance.memory.usedJSHeapSize` (Chromium) | Megabytes (MB) |
| | Total JS Heap & Limit | `performance.memory.totalJSHeapSize / jsHeapSizeLimit` | Megabytes (MB) |
| **3D WebGL (Three.js)** | Draw Calls | `renderer.info.render.calls` sampled at 2Hz | Count / frame |
| | Triangle Count | `renderer.info.render.triangles` sampled at 2Hz | Triangles |
| | Geometry Count | `renderer.info.memory.geometries` | Count |
| | Texture Count | `renderer.info.memory.textures` | Count |
| | Scene Object Count | Non-allocating `scene.traverse()` | Objects |
| | Frame Render Duration | R3F `useFrame` delta execution clock | Milliseconds (ms) |
| **Network & Assets** | Resource Load Timings | `PerformanceObserver` with `entryTypes: ['resource']` | Milliseconds (ms) |
| | Transfer Size | `PerformanceResourceTiming.transferSize` | Kilobytes (KB) |
| | Active WebSocket Clients | `ConnectionManager.active_connections` gauge | Count |
| | WS Messages Sent & Received | Packet counters on send/broadcast/receive | Count |
| | WS Approximate Data Volume | UTF-8 payload byte accumulation | Kilobytes (KB) |
| **Backend REST API** | Throughput | Sliding window request frequency over 60s | Req / second |
| | Latency (Avg, p50, p95, Min, Max)| In-memory rolling buffer of last 1,000 requests | Milliseconds (ms) |
| | Error Rate | 4xx / 5xx responses divided by total requests | Percentage (%) |
| | Per-Endpoint Traversal | Method + normalized path aggregated stats | Count, ms, status |
| | Slow Requests Log | Requests taking >250ms with Correlation IDs | Request record |
| **Database (SQLite)** | Query Execution Duration | Custom `TracedCursor` timing around SQLite executes | Milliseconds (ms) |
| | Total Query Count | Cumulative execution count | Count |
| | Slow Query Count | Queries exceeding 50ms threshold | Count |
| | Slow Query Log | Sanitized SQL strings (literals replaced with `?`) | Query record |
| | Connection Errors | SQLite operational/connection failure counter | Count |
| **Simulation Engine** | Tick Duration (Avg, p95) | `advance_world_simulation` & `step_world` timers | Milliseconds (ms) |
| | Processed Agent Count | Population size evaluated during tick | Agents / tick |
| | State Updates & DB Writes | Discrete simulation update and insert counters | Operations |
| | Simulation Errors | Caught exception counter in tick step | Count |
| **Council AI** | Deliberation Duration | Full 6-advisor conclave wall-clock timer | Milliseconds (ms) |
| | Per-Advisor Duration | Independent analysis timers for all 6 ministers | Milliseconds (ms) |
| | Pending AI Operations | Concurrency gauge for in-flight evaluations | Count |
| | Failure & Timeout Counts | Exception tracker in deliberation orchestrator | Count |

### Unavailable Metrics (Browser & Protocol Limitations)

1. **System-Wide Hardware GPU Utilization**:
   - *Limitation*: Browser JavaScript and WebGL specifications intentionally prevent access to physical GPU core utilization and temperature for sandboxing and security reasons.
   - *Alternative Used*: WebGL Draw Calls, Polygon Counts, Texture VRAM allocations, and Frame Render Timings provide proxy metrics for GPU load.
2. **True Network Round-Trip Time (RTT) on Server-Side WebSockets**:
   - *Limitation*: A backend server can only measure dispatch execution time for outbound packets; client-to-server physical network propagation latency cannot be determined without client echo pings.
   - *Alternative Used*: Explicitly documented in dashboard; measures server-side message dispatch duration and client message count.
3. **Browser Memory on Non-Chromium Engines**:
   - *Limitation*: `performance.memory` is a non-standard Chromium API (Google Chrome, Microsoft Edge, Brave, Opera) and is unavailable in Mozilla Firefox and Apple Safari.
   - *Handling*: Displays `"N/A - Unsupported in browser"` gracefully when undefined.

---

## 4. How to Access the Performance Dashboard

1. **Keyboard Shortcut**:
   - Press **`F2`** anywhere in the application.
   - Or press **`Ctrl + Shift + P`** (or **`Cmd + Shift + P`** on macOS).
2. **UI Navigation**:
   - Click the **Activity Pulse Icon (`Activity`)** in the top navigation bar (located directly to the left of the Tactical 3D Inspector toggle).

---

## 5. How to Disable Monitoring

Monitoring can be disabled at runtime without restarting the application:

1. **Via UI**:
   - Open the Performance Dashboard (`F2`).
   - Click the top-right toggle button (`ENABLED` / `PAUSED`).
2. **Via Backend API**:
   ```bash
   curl -X POST http://127.0.0.1:8000/api/v1/diagnostics/toggle \
     -H "Content-Type: application/json" \
     -d '{"enabled": false}'
   ```
3. **Via Browser LocalStorage**:
   - Set `localStorage.setItem('civora_perf_monitoring_enabled', 'false')`.

---

## 6. How to Interpret Metrics

- **Average FPS**: Target is `60 FPS` on standard displays (or `120/144` on high refresh displays). Below `45 FPS` indicates high draw-call density or fillrate pressure.
- **Frame Time**: Target is `< 16.6 ms` (60 FPS budget). Above `22 ms` triggers visible frame stuttering.
- **TBT (Total Blocking Time)**: Indicates main-thread JavaScript freezing. Target is `< 200 ms`.
- **Three.js Draw Calls**:
  - `World Stage`: Currently ~550–750 calls. Phase 3 target will reduce to `< 180` calls.
  - `Council Chamber`: Currently ~120–220 calls.
- **API p95 Latency**: Target is `< 50 ms` for local development. Above `150 ms` highlights unindexed database reads or heavy payload serialization.
- **Simulation Tick Duration**: Target is `< 15 ms`. Values above `35 ms` indicate database write contention at high speeds (10x).

---

## 7. Files Created & Modified

### Files Created:
1. `genesis-engine/backend/monitoring/__init__.py`: Package export.
2. `genesis-engine/backend/monitoring/collector.py`: Thread-safe, bounded rolling metrics collector.
3. `genesis-engine/backend/monitoring/middleware.py`: FastAPI ASGI performance & correlation middleware.
4. `genesis-engine/backend/monitoring/db_tracer.py`: SQLite `TracedConnection` and `TracedCursor` transparent wrapper.
5. `genesis-engine/backend/monitoring/router.py`: REST diagnostics API endpoints (`/diagnostics/metrics`, `/toggle`, `/reset`).
6. `genesis-engine/backend/tests/test_monitoring.py`: Pytest suite for the monitoring infrastructure.
7. `src/services/monitoring/performanceMonitor.ts`: Central frontend monitoring singleton.
8. `src/components/diagnostics/ThreeSceneSampler.tsx`: In-Canvas 2Hz WebGL sampler component.
9. `src/components/diagnostics/PerformanceDashboardModal.tsx`: Real-time developer performance dashboard modal.
10. `docs/performance/phase-1-monitoring.md`: This comprehensive documentation.

### Files Modified:
1. `genesis-engine/backend/main.py`: Attached `PerformanceMonitoringMiddleware`, mounted diagnostics router, instrumented WebSocket manager.
2. `genesis-engine/backend/db/database.py`: Integrated `TracedConnection` into `get_db_connection()`.
3. `genesis-engine/backend/engine/simulation_v1.py`: Instrumented `advance_world_simulation` tick duration & metrics.
4. `genesis-engine/backend/engine/simulation.py`: Instrumented `step_world` tick duration & metrics.
5. `genesis-engine/backend/app/features/council/intelligence/orchestrator.py`: Instrumented advisor and deliberation timings.
6. `src/services/civilizationApi.ts`: Attached Axios request/response timing interceptors.
7. `src/components/world3d/CivilizationWorld3D.tsx`: Embedded `ThreeSceneSampler sceneId="world"`.
8. `src/features/council/three/CouncilChamber3D.tsx`: Embedded `ThreeSceneSampler sceneId="council"`.
9. `src/components/layout/Topbar.tsx`: Added diagnostics toggle button and `Activity` icon.
10. `src/App.tsx`: Wired global `F2` / `Ctrl+Shift+P` shortcuts and embedded `PerformanceDashboardModal`.

---

## 8. Verification & Test Results

- **Backend Pytest Suite**: All **42 tests passed** in `7.83s` (`pytest genesis-engine/backend/tests -v`).
- **Frontend Production Build**: **0 TypeScript errors**, built cleanly in `6.74s` (`npm run build`).
- **Diagnostics API**: `GET /api/v1/diagnostics/metrics` validated and operational.
- **Dev Servers**:
  - Frontend: `http://localhost:5173/`
  - Backend: `http://localhost:8000/`
