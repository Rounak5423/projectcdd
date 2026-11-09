# Changelog: GENESIS Engine

All notable changes to the GENESIS Engine codebase are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
