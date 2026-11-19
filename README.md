# GENESIS Engine: The Artificial Civilisation Engine

> An interactive world simulation, policy laboratory, and 3D WebGL command center implementing agent-based socio-economic modeling, Cities: Skylines II-grade simulation depth, and the empirical study of the **AI Dependency Paradox**.

---

## 🏛 System Architecture (Citybound Paradigm)

GENESIS decouples the authoritative discrete time-step simulation engine from client-side visual rendering:
- **Backend Simulation Server:** Python 3.10+ / FastAPI running deterministic discrete ticks ($1 \text{ tick} = 1 \text{ simulated day}$, with annual demographic aggregation every 365 ticks).
- **Cities: Skylines II Simulation Depth:** Graph-based road network with A* congestion routing (BPR volume-delay curves), 2D continuous urban diffusion fields (land value, pollution with wind advection, noise, crime), individual citizen agents with daily schedules (home → work/school → leisure → home), and 12 multi-channel 3D WebGL Info Views.
- **Real-Time Telemetry Stream:** WebSocket delta buffers pushing micro-deltas (`tick_delta`) with JWT authentication.
- **3D Command Center:** Three.js / React Three Fiber WebGL isometric city grid with procedural terrain, instanced buildings, diurnal lighting, dynamic weather (rain, snow, clouds), animated pedestrians, and a CS2-style tactical HUD.
- **State Forking Engine:** In-memory snapshot deep-copying and discrete SQLite save slots for parallel counterfactual policy experiments (e.g. Baseline vs Intervention).

---

## 🔬 Scientific Core: The AI Dependency Paradox

GENESIS models the trade-off between automated AI assistance and human cognitive capability retention:

1. **AI Dependency Accumulation:**
   $$\mathcal{D}_{i, t+1} = \min(1.0, \, \mathcal{D}_{i, t} + A \cdot 0.02)$$

2. **Problem-Solving Speedup:**
   $$P_{i, t+1} = \min(1.0, \, P_{i, t} + A \cdot 0.01)$$

3. **Cognitive Complacency Decay (Atrophy):**
   $$\text{Atrophy} = (1.0 - \mathcal{S}) \times 0.015 \times \mathcal{D}_{i, t}$$
   $$R_{i, t+1} = \max(0.1, \, R_{i, t} - \text{Atrophy}) \quad (\text{Independent Reasoning})$$
   $$E_{i, t+1} = \max(0.1, \, E_{i, t} - \text{Atrophy}) \quad (\text{Critical Evaluation})$$

4. **Macro Collective Innovation Index:**
   $$\mathcal{I}_{\text{macro}} = \frac{1}{N} \sum_{i=1}^N \left( 0.6 \cdot R_i + 0.4 \cdot (1.0 - \mathcal{D}_i) \right)$$

---

## 🐳 Docker & Container Deployment (Recommended)

Run the complete GENESIS stack (FastAPI + SQLite WAL backend, Nginx React WebGL frontend, live WebSocket streaming) with one command on any platform:

```bash
# 1. Prepare environment
cp .env.example .env

# 2. Launch production stack in background
docker compose up -d
# or: make up
```

Access the stack at:
- **Web Application:** [http://localhost:3000](http://localhost:3000)
- **Health Probe:** [http://localhost:3000/health](http://localhost:3000/health)

### Useful Docker Make Targets
- `make dev`: Launch with live hot-reloading for both backend and frontend.
- `make test`: Run complete containerized verification (pytest + 365-tick + Playwright).
- `make backup-db`: Hot-backup live SQLite database atomically.
- `make restore-db BACKUP_FILE=<path>`: Restore database from snapshot.
- `make train`: Run machine learning training in isolated container.
- `make down`: Stop all running containers.

For complete deployment architectures, volume persistence runbooks, GPU acceleration, and troubleshooting, see [docs/DOCKER.md](docs/DOCKER.md).

---

## 🚀 Quick Start (Local Non-Containerized)

### 1. Environment Configuration
Copy `.env.example` to `.env` in both the repository root and `genesis-engine/backend/`:

```bash
cp .env.example .env
cp .env.example genesis-engine/backend/.env
```

Configuration variables include:
- `JWT_SECRET`: Secret key for signing bearer tokens.
- `DEFAULT_ADMIN_PASSWORD`: Seeded password for default `admin` account.
- `DEFAULT_USER_PASSWORD`: Seeded password for default `player1` account.
- `DATABASE_URL`: SQLite database file path (`sqlite:///./db/genesis.db`).

### 2. Launching the Engine
To start both the Backend API and pre-compiled 3D Command Center:

```bash
./run.sh
```

Or run manually:

```bash
cd genesis-engine/backend
source venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000
```

Open your browser at:
- **3D Command Center UI:** [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Interactive OpenAPI Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Authenticated WebSocket Stream:** `ws://127.0.0.1:8000/ws/world/aurora-prime?token=<JWT_TOKEN>`

### 🔑 Authentication & RBAC
Seeded credentials are configured via `.env` / `.env.example`:
| Role | Username | Password Source | Access Level |
| :--- | :--- | :--- | :--- |
| `user` | `player1` | `DEFAULT_USER_PASSWORD` | Full game simulation, world creation, construction, zoning, policies, tech tree |
| `admin` | `admin` | `DEFAULT_ADMIN_PASSWORD` | All game features + Administration Console (user management, platform KPIs) |

---

## 🧪 Testing & Verification

The test suite covers simulation determinism, A* pathfinding, diffusion fields, cognitive formulas, Gini coefficients, behavioral dynamics, save slots, RBAC security barriers, and live endpoints:

```bash
# Run 32 backend unit & behavioral tests
cd genesis-engine/backend
./venv/bin/pytest -v

# Run 21 live requirement integration tests (requires server running)
./venv/bin/python3 tests/verify_all_live_requirements.py

# Verify frontend TypeScript build
cd ../frontend
npm run build
```

**Test Status:** **53 / 53 Tests Passing (100.0%)** (32 Pytest backend tests + 21 Live integration tests).

---

## 📁 Repository Structure

```text
.
├── run.sh                       # One-click unified engine launcher
├── CHANGELOG.md                 # Detailed version history & milestone records
├── REPORT.md                    # Comprehensive technical report & architecture audit
├── .env.example                 # Environment variables template
├── genesis-engine/
│   ├── backend/                 # Authoritative Python / FastAPI Simulation Engine
│   │   ├── main.py              # Application entrypoint & static SPA mounting
│   │   ├── db/
│   │   │   ├── database.py      # SQLite WAL persistence layer
│   │   │   └── migrations.py    # Versioned schema migration runner
│   │   ├── api/v1/              # Versioned API modules
│   │   │   ├── auth.py          # Rate-limited JWT authentication & profile
│   │   │   ├── admin.py         # Role-based admin user management & platform KPIs
│   │   │   ├── worlds.py        # World lifecycle, tick loop & save slots
│   │   │   ├── cs2_routes.py    # CS2 REST API (RCI, infoviews, traffic, districts, budget)
│   │   │   ├── infrastructure.py# 3D spatial building management & elevation
│   │   │   ├── economy.py       # GDP, GRC credits, population, resource balances
│   │   │   ├── policies.py      # Governance policy laboratory
│   │   │   ├── progression.py   # Gamification, missions, XP & achievements
│   │   │   └── scenarios.py     # Snapshots, counterfactual branching & research trials
│   │   ├── engine/
│   │   │   ├── simulation.py    # Authoritative consolidated simulation loop
│   │   │   ├── cs2_simulation.py# RoadGraph, UrbanDiffusionFields, CitizenAgent
│   │   │   └── cognitive.py     # AI Dependency Paradox cognitive formulas
│   │   └── tests/               # 32 automated pytest test suites
│   └── frontend/                # React 19 + TypeScript + Three.js Command Center
│       ├── src/
│       │   ├── components/
│       │   │   ├── cs2/         # CS2 HUD, Budget, Statistics, Zoning, InfoViews, Chirper
│       │   │   ├── world3d/     # Procedural terrain, weather, pedestrians, day/night
│       │   │   └── game/        # Onboarding tutorial, keyboard shortcuts, protest modal
│       │   ├── context/         # AuthContext, GameStateContext, GraphicsSettingsContext
│       │   ├── pages/           # Landing, World Explorer, Dashboard, Settings, etc.
│       │   └── services/        # civilizationApi.ts client service & soundFx.ts
│       └── dist/                # Production build bundle served by FastAPI
```

---

## 📄 Documentation

- [REPORT.md](REPORT.md): In-depth architectural breakdown, empirical cognitive formulas, database schemas, REST endpoints, and verification audit.
- [CHANGELOG.md](CHANGELOG.md): Chronological record of additions, bug fixes, and test metrics.

---

## 📦 Standalone Python Prototype Architecture (origin/Saanvi Build)

# GENESIS - The Artificial Civilisation Engine

An interactive, simulated society. Hundreds of individual citizens work, learn, fall ill, form families and
react to resources, the economy, the environment, your policies and random events. A Three.js 3D world shows the
real state of the simulation; the Python backend is the only source of truth.

**Stack:** Python 3.10+, FastAPI, SQLite, WebSockets, Three.js, plain HTML/CSS/JS.

## 1. Install on Windows (VS Code)

1. Install Python 3.10 or newer from python.org (tick **Add python.exe to PATH**).
2. Extract `GENESIS_NEW.zip` somewhere simple, e.g. `C:\Projects\`. You should get `C:\Projects\GENESIS_NEW\`.
3. In VS Code: **File > Open Folder...** and choose `GENESIS_NEW`.
4. Open a terminal: **Terminal > New Terminal** (PowerShell) and run:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn genesis.api.main:app --reload
```

If PowerShell says scripts are disabled, run once: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, then activate again.
Expected output ends with `Uvicorn running on http://127.0.0.1:8000`.

5. Open **http://127.0.0.1:8000** in your browser (internet needed once for the Three.js library, see `genesis/static/vendor/README.txt` for offline use).

Shortcut: `.\run.ps1` does steps 4's commands for you.

## 2. Using GENESIS

* A short introduction appears on first launch (reopen it from **Help**).
* **Observe** tab: rotate/zoom the 3D world, click a person or building, read the dashboard cards (click one for an
  explanation), see history charts, events and the timeline that explains what happened, why and what you can do.
* **Control** tab: Start/Pause/Advance, speed, build (pick a building, click a green tile, confirm), upgrade (select a building),
  policies, research, experiments, snapshots, futures and comparison.
* Every spending action shows a confirmation screen first. Switching tabs never resets anything.
* Time: one simulation day = one tick. At 1x a day lasts 2 seconds. A simulated year = 60 days (citizens age one year per 60 days).
* Your civilisation is saved in `data/genesis.db` (autosave every 5 days and after every action). Closing the app freezes the world
  (offline progression is **off** by default; see `.env.example`).

## 3. Run the tests

```powershell
python -m pytest -q
```
or `python -m unittest discover -s tests -t .`. Expected: all tests pass (API tests need `fastapi` and `httpx` installed).

## 4. Project layout

```
GENESIS_NEW/
  genesis/
    simulation/   citizens, intelligence, population, resources, economy, infrastructure, environment,
                  governance, events, research, progression, metrics, recommendations, experiments,
                  scenarios, seed, engine, config
    models/       world.py (state container + seeded RNG), schemas.py (API request models)
    persistence/  store.py (SQLite)
    api/          main.py, deps.py, routes/api.py
    service.py    validation + actions (the only code the API calls)
    static/       index.html, style.css, app.js, world3d.js
  tests/  docs/ (API.md, ARCHITECTURE.md)  requirements.txt  .env.example
```

## 5. What is honestly implemented (and simplified)

Implemented and tested: seeded population with 13 professions, citizen needs/goals/learning/memories, births/deaths/migration/family pairing,
education (school, secondary, university) and retraining, jobs from building slots, four resources with shortages, economy (GDP, wages,
tax, treasury, Gini, poverty), 9 building types with construction/upgrade, environment, 6 policies, 8+ event types (random and condition-driven),
6 technologies, XP/levels/achievements/missions, GRC ledger, 5 experiments, snapshots, independent branches, comparison, SQLite save/load,
REST + WebSocket API.

Simplifications (by design):
* **Intelligence is rule-based**, not machine learning. `intelligence.decide()` is isolated so a learned policy can replace it later.
* Production depends on **staffing ratio and building condition**, not on each worker's daily activity (a worker "resting" still counts as staffed).
* Citizens move to a spot matching their activity each day (no pathfinding); the 3D view animates between positions.
* Water has no dedicated building: supply comes from the environment plus pipes in housing blocks.
* Upgrades are instant; construction takes fixed days; there is no demolition or repair button (upkeep repairs wear automatically).
* Policies and events affect the world through one-day-delayed modifiers computed at the start of each tick.
* Experiments use two to three independent copies of your civilisation and report simulated outcomes, **not real-world predictions**.
* Observe vs Control is a user-interface distinction; the API itself does not block actions in Observe.
* The numbers are tuned for playability, not calibrated to real economies.

Verification status: the simulation, persistence and service layers have automated tests. The FastAPI routes, WebSocket and browser UI
(including the 3D view) were written carefully and syntax-checked, but could not be run in the environment where they were built.
If something fails on your machine, send me the exact error message from the terminal or the browser console (F12).
