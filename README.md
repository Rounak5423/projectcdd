# GENESIS Engine: The Artificial Civilisation Engine

> An interactive world simulation, policy laboratory, and 3D WebGL command center implementing agent-based socio-economic modeling and the scientific study of the **AI Dependency Paradox**.

---

## 🏛 System Architecture (Citybound Paradigm)

GENESIS decouples the discrete time-step simulation engine from client-side visual rendering:
- **Backend Simulation Server:** Python 3.10+ / FastAPI running deterministic discrete ticks ($1 \text{ tick} = 0.1 \text{ simulated years}$).
- **Real-Time Telemetry Stream:** WebSocket delta buffers pushing micro-deltas to client viewports at low latency.
- **3D Command Center:** Three.js `InstancedMesh` WebGL isometric city grid and tactical React / Tailwind HUD.
- **State Forking Engine:** In-memory snapshot deep-copying at $T_{\text{branch}}$ for parallel counterfactual policy experiments (e.g. Baseline vs Intervention).

---

## 🔬 Scientific Core: The AI Dependency Paradox

GENESIS rigorously models the trade-off between automated AI assistance and cognitive capability retention:

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

To launch the complete engine (Backend API + 3D Command Center):

```bash
./run.sh
```

Or run manually:

```bash
cd genesis-engine/backend
source venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Then open your browser at:
- **3D Command Center UI:** [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Interactive REST API Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Live WebSocket Stream:** `ws://127.0.0.1:8000/ws/world/aurora-prime`

### 🔑 Default Credentials
| Username | Password | Role | Access Level |
| :--- | :--- | :--- | :--- |
| `player1` | `UserPassword123!` | `user` | Full game simulation, world creation, construction, policies, tech tree |
| `admin` | `AdminPassword123!` | `admin` | All game features + Administration Console (user management, platform KPIs) |

---

## 🧪 Testing & Verification

Run the automated test suite covering simulation determinism, cognitive formulas, Gini coefficients, RBAC security barriers, and counterfactual state cloning:

```bash
cd genesis-engine/backend
./venv/bin/pytest -v
```

---

## 📁 Repository Structure

```text
.
├── run.sh                       # One-click unified engine launcher
├── genesis-engine/
│   ├── backend/                 # Authoritative Python / FastAPI Simulation Engine
│   │   ├── main.py              # Application entrypoint & static SPA mounting
│   │   ├── db/database.py       # SQLite WAL persistence layer
│   │   ├── api/v1/              # Versioned API modules
│   │   │   ├── auth.py          # JWT authentication & session verification
│   │   │   ├── admin.py         # Role-based admin user management & platform KPIs
│   │   │   ├── worlds.py        # World lifecycle & simulation controls
│   │   │   ├── infrastructure.py# 3D spatial building management & elevation
│   │   │   ├── economy.py       # GDP, GRC credits, population, resource balances
│   │   │   ├── policies.py      # Governance policy laboratory
│   │   │   ├── progression.py   # Gamification, missions, XP & achievements
│   │   │   └── scenarios.py     # Snapshots, counterfactual branching & research trials
│   │   ├── engine/              # Core simulation logic & cognitive models
│   │   └── tests/               # 20 automated pytest test suites
│   └── frontend/                # React 19 + TypeScript + Three.js Command Center
│       ├── src/
│       │   ├── components/      # UI components (3D Canvas, Topbar, Sidebar, HUD)
│       │   ├── context/         # AuthContext (RBAC) & GameStateContext
│       │   ├── pages/           # Dashboard, World Explorer, Admin Console, etc.
│       │   └── services/        # civilizationApi.ts client service
│       └── dist/                # Production build bundle served by FastAPI
```

