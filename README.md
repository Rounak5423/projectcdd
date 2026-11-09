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

## 🚀 Quick Start

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
