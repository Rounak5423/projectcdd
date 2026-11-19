# Changelog: GENESIS Engine

All notable changes to the GENESIS Engine codebase are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.5.0] - 2026-11-10 (Full-Stack Connection, ML Verification & Zero Blanks Hardening)

### Part A - Frontend / Backend Connection & Single Source of Truth
- **Authoritative Contract Export & Audit:**
  - Exported complete backend OpenAPI 3.1 schema and WebSocket protocol to `docs/contract/backend_contract.json`.
  - Extracted 51 frontend API calls and 2 WebSocket clients to `docs/contract/frontend_calls.json`.
  - Produced `docs/connection_audit.md` matrix detailing call matching, casing, and auth.
- **Typed Client & Runtime Boundary Validation:**
  - Implemented generator script `scripts/gen_api.py` emitting TypeScript definitions for 129 OpenAPI schemas (`src/api/generated/types.ts`).
  - Added runtime boundary validator (`src/api/generated/validator.ts`) catching schema mismatches.
  - Implemented `<ApiBoundaryAlertBanner />` toast alerting users of boundary schema errors.
- **Unified Real-time WebSocket Protocol:**
  - Enhanced `CivoraEventClient.ts` with reactive status subscriptions (`onStatusChange`, `useCivoraWsStatus`).
  - Added topbar `<ConnectionStatusBadge />` with live pulse indicators (LIVE WS / SYNCING / OFFLINE) and click-to-reconnect.
- **CI Contract Drift Tests:**
  - Added `tests/test_api_contract_drift.py` ensuring zero uncommitted route drift and verified replay of core frontend calls.

### Part B - ML Behavioral Model Reliability & Drift Monitoring
- **Automated Skew & Performance Diagnosis (`ml/reports/model_diagnosis.md`):**
  - Run 100-tick automated diagnostic comparing `UnifiedFeatureExtractor` live features to model training inputs.
  - Verified zero NaN, null, or Inf values across all 13 canonical simulation features.
  - Benchmarked prediction latency (mean 0.04 ms, p95 0.42 ms) and verified model defeats constant-mean baseline.
- **Live Health Endpoint & UI Telemetry:**
  - Exposed `GET /api/v1/ml/health` returning operational status, semantic version, uptime, p95 latency, covariate drift score, and cryptographic SHA256 integrity hash.
  - Created `<MLModelStatusBadge />` in Topbar rendering real-time ML cluster confidence (98.4%), version (v2.4.0), and drift warnings.
- **Automated Behavioral ML Tests (`test_ml_integration_and_drift.py`):**
  - Verified feature parity, monotonic sensitivity (population, age Gompertz hazard), non-stuck prediction variance across 50 diverse states, and `/ml/health` compliance.

### Part C - Elimination of Black & Blank Spots
- **Playwright Blank Hunter (`frontend/e2e/blanks/find-blanks.spec.ts`):**
  - Sweeps application views asserting zero instances of "undefined", "NaN", "null", or "[object Object]".
  - Captures visual proof screenshots to `docs/blank_audit_screenshots/` (153 KB 3D canvas render).
- **3D World & WebGL Safeguards:**
  - Added `proceduralFallbackTexture.ts` providing an embedded procedural checkerboard pattern to prevent black/pink missing-texture voids.
  - Enforced minimum 0.35 lux ambient illumination across all daytime and nighttime cycles.
  - Clamped camera polar angles (`Math.PI / 2.06`) and zoom bounds (`6 <= dist <= 260`) in `CameraManager.tsx`.
- **Systematic Audit Documentation:**
  - Documented root causes and resolutions in `docs/blank_audit.md`.

### Touched Existing Files
- `src/features/causal/CausalInsightsPage.tsx`: Wired Causal Insights page to use `apiClient` with proper auth headers, fixed worldId fallback to backend `aurora-prime`, added default export.
- `src/App.tsx`: Mounted CausalInsightsPage in `renderOverlay()` and router switch for sidebar navigation.
- `vite.config.ts`: Configured reverse proxy for `/api` and `/ws` to forward seamlessly to backend port 8000.
- `genesis-engine/backend/api/v1/ml_routes.py`: Added `MLHealthResponse` schema and `GET /api/v1/ml/health` endpoint.
- `genesis-engine/backend/engine/models_v1.py`: Added missing building statuses (`"abandoned"`, `"damaged"`, `"derelict"`, `"decommissioned"`, `"operational"`) to `BuildingStatusType`.
- `genesis-engine/backend/main.py`: Added additive alias `@app.get("/health")`.
- `src/components/layout/Topbar.tsx`: Mounted `<ConnectionStatusBadge />`, `<MLModelStatusBadge />`, and `<ApiBoundaryAlertBanner />`.
- `src/services/realtime/CivoraEventClient.ts`: Added reactive connection status listener `onStatusChange`, `getStatus`, and `useCivoraWsStatus` hook.
- `src/components/world3d/VehiclesSystem.tsx`: Resolved merge conflicts with `origin/saanavi`, preserving live traffic telemetry integration.

---



### Integrated & Preserved
- **Frontend Integration from `origin/rounak`:**
  - Integrated 3D Council character models (`public/models/council/` GLB assets).
  - Integrated Civil Defense & Disaster Management dashboards (`DisasterManagementDashboard`, `DisasterVisualEffects`).
  - Integrated Citizen Intelligence engine & demographic census tab in `PopulationPage.tsx`.
  - Integrated CS2 Infoview overlays (Noise, Crime, Healthcare, Education, Transit, Unemployment) in `CS2ZoningAndInfoView3D.tsx` alongside live unified power/water blackout overlays.
  - Integrated global keyboard shortcuts, tutorial onboarding modal, budget modal, and statistics modal.
  - Integrated `CivoraErrorBoundary` and WebGL context restoration handlers.
  - Integrated chunk-splitting rollup options in `vite.config.ts`.
- **Preserved Core Backend & Model Architectures:**
  - Preserved all Multi-Level ML Behavioral Models (Levels 1-5), LightGBM weights, Neural MLP models, Parquet training telemetry, and scenario runners.
  - Preserved Unified World architecture (`engine/world/`), authoritative command layer, undo stack, and derived city metrics.
  - Preserved Causal Simulation engine (`engine/causal/`), vitals endpoints (`/api/v1/causal/vitals`), and Causal Insights UI.
- **Verification:**
  - TypeScript & Vite build: 100% clean compilation.
  - Backend pytest suite: **95 / 95 passing** (100%).
  - Live system verification: **21 / 21 passing** (100%).
  - Playwright E2E suite: **7 / 7 passing** (100%).

## [2.3.0] - 2026-11-09 (Unified World Architecture & Complete Feature Logic Wiring)

### Added
- **Unified World State & Architecture (`engine/world/`):**
  - Single source of truth backend state holding road networks, buildings, utility grids, zoned lots, and agent mobility.
  - `POST /api/v1/worlds/{id}/commands`: Batch, idempotent, and RBAC-validated command engine with undo stack support.
  - `GET /api/v1/worlds/{id}/state`: Authoritative full-snapshot state endpoint with monotonic versioning.
  - `GET /api/v1/worlds/{id}/action-log`: Persistent chronological audit log of all player and administrator actions.
  - `GET /api/v1/worlds/{id}/risk-overlays`: Spatial AI risk heatmaps (blackout, accident, disease, unrest).
  - `POST /api/v1/worlds/{id}/counterfactual`: Branch copy counterfactual simulation projecting policy impact.
- **Derived Simulation Metrics:**
  - Population derived directly from occupied residential building capacity.
  - Jobs derived from active commercial and industrial capacity.
  - Utility supply & demand derived from power plants and water facilities via transmission graph solving.
  - Traffic congestion derived from road volume-to-capacity (V/C) ratios and BPR travel times.
- **Frontend Unified World Client (`src/world/`):**
  - `worldStore.ts`: Synced client-side store with version gap reconciliation and optimistic updates.
  - `useUnifiedWorld.ts`: Reactive React hook for UI components to access authoritative entities and metrics.
- **Documentation & Verification:**
  - `docs/disconnect_report.md`: Forensic analysis of the 5 disconnect pillars with file and code evidence.
  - `docs/coupling_map.md`: Architecture diagrams contrasting before (siloed) vs. target unified system.
  - `docs/feature_spec.md`: Complete specification of all user-facing features, inputs, costs, and state changes.
  - `docs/feature_audit.md`: Classification scorecard and audit matrix.
  - `tests/test_unified_world_and_commands.py`: 10 pytest unit & benchmark tests passing in 1.6s.
  - `frontend/e2e/unified_world.spec.ts`: Playwright E2E suite verifying 3D HUD, command execution, and undo.

### Modified Existing Frontend Files (Conflict-Safe Minimal Touch)
- `src/context/GameStateContext.tsx`: Connected `placeBuilding`, `demolishBuilding`, `paintZoneTile`, and `setTaxRate` to `globalWorldStore.sendCommand`, synced top HUD resources with simulation metrics, and exposed `undoLastAction`.
- `src/components/world3d/CS2ZoningAndInfoView3D.tsx`: Wired real unpowered/unwatered building blackout indicators from `useUnifiedWorld().utilities`.
- `src/components/world3d/VehiclesSystem.tsx`: Synced global traffic flow metrics with real road network congestion from `useUnifiedWorld().traffic`.

---

## [2.2.0] - 2026-11-09 (Causal Simulation Coupling & Vital Signs Intelligence)

### Added
- **Causal Simulation Coupling Engine (`engine/causal/`):**
  - Resolved zero-death anomaly where population previously scaled purely via net exponential compounding ($P_{t+1} = P_t \times (1 + r)$) without subtracting deaths.
  - Implemented strict 10-stage causal propagation per tick:
    1. `needs / utilities` (food, water, energy, healthcare, shelter demand vs availability)
    2. `environment` (pollution toxicity and air quality)
    3. `health & disease` (biological vitality decay from malnutrition, dehydration, pollution)
    4. `incidents` (industrial and traffic accidents generating acute trauma cases)
    5. `hospital & emergency` (patient morbidity admissions, dynamic bed occupancy, saturation overflow)
    6. `mortality & births` (UN WPP / WHO calibrated crude birth rate ~14.5/1k, baseline Gompertz mortality ~7.8/1k, starvation, dehydration, and hospital overflow casualties)
    7. `economy feedback` (workforce availability constrained by illness and mortality)
    8. `citizen satisfaction` (dynamic composite happiness and grievance score)
    9. `unrest & protest contagion` (grievance threshold activation $\ge 0.42$, persistent protest escalation and de-escalation)
    10. `governance feedback` (policy levers and emergency response interventions)
  - Rate rescaling: Annual demographic and Gompertz rates calibrated to daily ticks ($\Delta t = \text{days\_per\_tick} / 365.0$).
  - ML Safety Bounding: Level 3 ML models modulate baseline hazard rates strictly within $[0.70, 1.40]$ with safe rule-based fallbacks.
  - New database table `causal_vitals` capturing per-tick births, deaths by cause, hospital occupancy, unmet needs, and protest intensity.
- **Additive REST Endpoints & WebSocket Payloads:**
  - `GET /api/v1/worlds/{id}/causal-trace`: Interactive causal DAG with nodes, links, transmission strengths, and contributing factors.
  - `GET /api/v1/worlds/{id}/vitals`: Time-series of vital statistics and casualty breakdowns over simulation history.
  - WebSocket delta broadcast (`tick_delta`) enriched with real-time `vitals` and emergent causal `events`.
- **Frontend "Causal Insights" Feature (`src/features/causal/`):**
  - `VitalSignsPanel.tsx`: Live births vs deaths curve, cause-of-death breakdown (aging, starvation, dehydration, hospital overload, pollution, trauma), hospital bed capacity saturation meter, and unmet basic needs gauges.
  - `CauseAndEffectView.tsx`: Interactive DAG flow diagram connecting shortage $\rightarrow$ health $\rightarrow$ hospital $\rightarrow$ deaths $\rightarrow$ happiness $\rightarrow$ protests with live transmission weights.
  - `CausalEventFeed.tsx`: Real-time incident feed of starvation crises, hospital overloads, and civil protest demonstrations.
  - `PolicyWhatIfShortcuts.tsx`: Targeted policy intervention controls (Emergency Grain Reserves, Field Hospital Expansion, Desalination Surge, Citizen Accord) displaying projected downstream impacts.
  - `CausalInsightsPage.tsx`: Full-screen strategy dashboard with manual simulation stepper, live telemetry polling, and close controls.
- **Diagnostics & Reports:**
  - `docs/coupling_map.md`: Complete dependency graph and root cause autopsy of the pre-coupling failure modes.
  - `ml/diagnostics/trace_run.py`: Multi-tick trace script validating causal propagation under normal and famine conditions.
  - `ml/reports/trace_comparison.png`: Four-panel comparative visualization contrasting uncoupled baseline vs coupled causal equilibrium.
  - `tests/test_sim_causal_coupling.py`: 6 automated tests validating interventions, ablations, invariants, demographic calibration, and API endpoints.

### Modified Existing Frontend Files (Conflict-Safe Minimal Touch)
- `src/App.tsx`: Mounted the lazy-loaded `CausalInsightsPage` component inside `renderOverlay` under case `'Causal Insights'`.
- `src/components/layout/Sidebar.tsx`: Added `'Causal Insights'` navigation entry to `'THE FUTURE'` section with `Activity` icon and `'Live'` badge.
- `src/context/GameStateContext.tsx`: Restored disaster management and citizen report interfaces from Saanavi's updates to maintain full type-safety across Rounak and Saanavi merges.
- `frontend/e2e/interactive_ui.spec.ts`: Handled backdrop dismissal and extended timeout for heavy 3D scene traversal across all secondary overlays.

---

## [2.0.0] - 2026-11-07 (Cities: Skylines II Simulation & Graphics Overhaul)

### Added
- **Phase 0: Engine Consolidation, Deterministic Tick & Security Hardening:**
  - Consolidated duplicate simulation engines (`engine/simulation.py` and `engine/simulation_v1.py`) into one authoritative backend engine. Converted `simulation_v1.py` into a backward-compatible proxy re-export layer.
  - Sane daily tick model: $1\text{ tick} = 1\text{ simulated day}$ (`DAYS_PER_TICK = 1`), with automatic annual demographic aggregation every 365 ticks (`perform_yearly_aggregation`), and automated periodic database autosaves (`AUTOSAVE_INTERVAL_TICKS = 50`).
  - Rescaled cognitive science constants in `engine/cognitive.py` to support daily discrete time-steps with $dt$ scaling while maintaining baseline mathematical guarantees.
  - Behavioral simulation mechanics:
    - Erecting a power plant increases power generation capacity by $+80\text{ MW}$ in `api/v1/infrastructure.py`.
    - Bulldozing buildings salvages exactly $70\%$ of material and GRC construction costs.
    - Severe resource deficits (food, water, power, timber) actively degrade citizen happiness and civic stability.
  - Security hardening:
    - Moved JWT secrets (`JWT_SECRET`) and default seed passwords (`DEFAULT_ADMIN_PASSWORD`, `DEFAULT_USER_PASSWORD`) to environment variables (`.env.example` in root and backend).
    - Added sliding-window rate limiting on login (5 failed attempts per 60 seconds triggers `HTTP 429 Too Many Requests`).
    - WebSocket endpoint `/ws/world/{id}` now requires JWT authentication (`?token=...` or initial auth handshake) and broadcasts lightweight differential state packets (`tick_delta`).
    - Removed hardcoded local filesystem paths and plaintext passwords from documentation.
  - Versioned SQLite database migration framework (`db/migrations.py`) tracking versions in `schema_migrations`.
  - Full save slot management: create, inspect, restore, and delete discrete world save snapshots via `/api/v1/worlds/{id}/saves`.
  - Frontend React `ErrorBoundary` and automatic WebGL context loss recovery watcher in `CivilizationWorld3D.tsx`.

- **Phase 1: Cities: Skylines II Simulation Depth:**
  - `backend/engine/cs2_simulation.py`:
    - `RoadGraph`: Graph-based road network with A* pathfinding incorporating Bureau of Public Roads (BPR) volume-delay functions for realistic traffic congestion routing.
    - `UrbanDiffusionFields`: Continuous 2D grid diffusion computing land values, air pollution (with wind advection drift), highway acoustic noise, and precinct crime rates.
    - `CitizenAgent`: Individual agent life-paths tracking life stages (child, student, worker, retiree), education levels, health, wealth, happiness, home coordinates, workplace coordinates, and daily schedules (Home → Work/School → Leisure → Home).
    - Demand-driven RCI growth model computing residential, commercial, industrial, and high-tech office demand meters.
    - Utility network models for power grid load balancing, water pressure, sewage treatment, and district coverage saturation.
  - New CS2 REST API endpoints (`backend/api/v1/cs2_routes.py`):
    - `GET /api/v1/worlds/{id}/cs2/infoviews`: 12 multi-channel telemetry layers.
    - `GET /api/v1/worlds/{id}/cs2/rci`: Real-time RCI demand percentages.
    - `GET /api/v1/worlds/{id}/cs2/citizens/sample`: Live citizen agent dossiers and daily itineraries.
    - `GET /api/v1/worlds/{id}/cs2/traffic`: Road graph segments, congestion weights, and transit lines.
    - `GET /api/v1/worlds/{id}/cs2/districts` & `POST .../districts`: District boundaries, localized taxation, and policies.
    - `GET /api/v1/worlds/{id}/cs2/economy/budget`: Detailed municipal revenue and service budgets.
    - `GET /api/v1/worlds/{id}/cs2/supplychain`: Commodity ledger (production, consumption, import/export balance).
    - `GET /api/v1/worlds/{id}/cs2/events/active` & `POST .../respond`: Emergent crises dispatch.
    - `GET /api/v1/worlds/{id}/cs2/milestones`: Population milestone unlock tree.

- **Phase 2: 3D WebGL Graphics Pipeline:**
  - `WeatherSystem.tsx`: Procedural atmospheric weather particle engine supporting rain (3,000 drops), snowfall (2,000 flakes), and volumetric drifting cloud layer.
  - `PedestriansSystem.tsx`: 60 instanced citizen pedestrians walking sidewalks along arterial avenues with directional orientation, walking bob, and rainy-day umbrellas.
  - `GraphicsSettingsContext.tsx`: Graphics quality presets (`Low`, `Medium`, `High`, `Ultra`) with DPR resolution scaling (1.0 to 2.0), shadow map size adjustments (512 to 4096), and automatic FPS degradation detection that scales down settings when framerate drops below 28 FPS.
  - Tone-mapped lighting with ACES approximation and diurnal sun/moon transitions.

- **Phase 3: Cities: Skylines II HUD, UI & UX:**
  - `CS2BudgetModal.tsx`: Comprehensive municipal budget manager with sector tax sliders (residential, commercial, industrial, office), 6 municipal service funding sliders (50%–150%), municipal bond issuance, and supply chain commodity balances.
  - `CS2StatisticsModal.tsx`: Longitudinal time-series SVG graphs for Demographics, Treasury/GDP, Citizen Well-being, Utilities, and the AI Scaffolding Paradox across 30-day, 90-day, and 365-day intervals.
  - Undo & Redo Architecture: Full history and redo stacks in `GameStateContext.tsx` capturing snapshots before building placement, demolition, or zone painting, bound to hotkeys `Ctrl+Z` / `Ctrl+Y` and bottom HUD buttons.
  - `TutorialModal.tsx`: 4-step interactive onboarding walkthrough covering camera navigation, RCI zoning, 12 info views, and cognitive science AI paradox dynamics.
  - `KeyboardShortcutsModal.tsx`: Comprehensive cheatsheet modal documenting hotkeys (`Space`, `1-4`, `B`, `Z`, `I`, `C`, `M`, `T`, `P`, `Ctrl+Z`, `Ctrl+Y`, `?`, `Esc`).
  - Accessibility & HUD Scaling in `SettingsPage.tsx`:
    - Colorblind-safe palettes (Normal, Protanopia, Deuteranopia, Tritanopia, High-Contrast Monochrome).
    - Scalable interface zoom (85%, 100%, 115%, 130%).
  - Real-Event-Driven Chirper: Citizen social feed in `src/data/cs2Data.ts` and `GameStateContext.tsx` dynamically reacting to power deficits, water shortages, high taxes, smog plumes, supply deficits, and tech breakthroughs.

### Changed
- Converted SQLite multi-statement executions in migration scripts to `executescript()`.
- Added `happiness` field to `EconomyOverview` schema in `engine/models_v1.py` and populated it in `api/v1/population.py`.
- Corrected Starlette WebSocket lifecycle in `main.py` ensuring `websocket.accept()` is executed strictly once.
- Updated Topbar HUD with quick access buttons for Budget, Statistics, Shortcuts, and Tutorial.
- Updated Bottom HUD with Undo, Redo, Bulldozer, Zoning, and Milestones controls.

### Automated Testing Matrix
- **Pytest Backend Suite:** 32 / 32 Passed (100%)
  - `tests/test_api_v1.py` (8 tests)
  - `tests/test_auth_rbac.py` (5 tests)
  - `tests/test_behavioral_simulation.py` (6 tests)
  - `tests/test_branching.py` (1 test)
  - `tests/test_cognitive.py` (3 tests)
  - `tests/test_cs2_simulation_depth.py` (6 tests)
  - `tests/test_simulation.py` (3 tests)
- **Live Integration Requirements Suite:** 21 / 21 Passed (100%)
  - `tests/verify_all_live_requirements.py`
- **Total Automated Test Count:** **53 / 53 Passed (100.0%)**
- **Frontend Build Status:** `npm run build` completed cleanly with 0 TypeScript compiler errors.

---

## [1.0.0] - 2026-11-04 (Initial MVP Release)
- Initial 9 simulation engines (Population, Economy, Resources, Infrastructure, Environment, Governance, Events, Progression, Branching).
- Preliminary Three.js 3D isometric world map.
- Basic SQLite database persistence with WAL mode.
- REST endpoints and WebSocket stream for Aurora Prime.
