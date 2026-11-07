# GENESIS Engine v2.0 Simulation Suite

The **GENESIS Persistent Artificial Civilisation Engine & Policy Platform (v2.0)** is an autonomous artificial civilization builder, policy laboratory, and counterfactual experiment simulator.

## Directory Contents

- **`genesis_engine_v2.py`**: Standalone production-grade Python 3.10+ FastAPI backend implementing all 9 interconnected simulation engines, SQLite WAL persistence layer, WebSockets telemetry, counterfactual branching, and an embedded Glassmorphic Command Center.
- **`genesis_v2.db`**: Persistent SQLite database storing civilizations, buildings, demographic profiles, policies, and experiment snapshots.
- **`run_simulation.sh`**: Launch script configured to use the local virtual environment.

---

## Architecture & Core Mechanics

### 1. The 9 Interconnected Simulation Engines
1. **Population**: Dynamic age-cohort modeling, birth/death fertility curves, net migration, workforce allocation.
2. **Resources**: Multi-tier resource consumption (Energy, Biomass, Minerals, Quantum Compute), renewable energy grid transitions.
3. **Economy**: Production modeling, Universal Basic Income (UBI) distributions, Gini coefficient inequality calculation.
4. **Infrastructure**: Power grid stability, housing saturation, maintenance overheads.
5. **Environment**: Industrial carbon footprint, ecological stability indices, climate mitigation technologies.
6. **Governance**: Public approval ratings, social cohesion, corruption friction, institutional trust.
7. **Events Engine**: Stochastic systemic crisis generation (e.g., Solar Flares, Synthetic Epidemics, Quantum Grid Failures).
8. **Progression**: Civilisation XP scaling, level promotions, and tech tree unlocks.
9. **Branching & Experiments**: Non-destructive counterfactual sandbox projecting parallel world trajectories against baseline history.

### 2. Cognitive Science: The AI Dependency Paradox
Models the longitudinal decay of human reasoning and critical analysis when cognitive tasks are delegated to synthetic intelligences without friction or scaffolding:

$$\text{Atrophy} = (1.0 - \text{scaffolding\_friction}) \times 0.015 \times \text{ai\_dependency}$$

- **High AI Dependency + Low Scaffolding Friction**: Accelerated human cognitive atrophy, degradation of independent critical thinking.
- **Scaffolding Policy Interventions**: Preserves cognitive resilience and reasoning capabilities even in advanced technological epochs.

### 3. Genesis Research Credits (GRC) Transaction Economy
- GRC is strictly required to run counterfactual scenario branching.
- Credits are passively generated per tick by research facilities (`university`, `research_center`) and awarded on civilisational milestones.
- Atomic balance enforcement guarantees balances can never drop below zero (`HTTP 402 Payment Required`).

---

## How to Run

### Starting the Server
From the project root:
```bash
./run_v2.sh
```
Or from inside this directory:
```bash
./run_simulation.sh
# OR
../genesis-engine/backend/venv/bin/python3 genesis_engine_v2.py
```

### Accessing the Dashboard & APIs
- **Glassmorphic Strategy Command Center**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
  - Interactive Three.js 3D WebGL isometric city grid
  - Dynamic Chart.js 5-axis cognitive radar chart
  - Dual-trajectory scenario branching visualizer
  - Real-time WebSocket telemetry stream
- **Interactive OpenAPI / Swagger Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
