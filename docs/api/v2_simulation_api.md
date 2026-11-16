# GENESIS Simulation Core v2.0 - API & Architecture Specification

## 1. Overview & Time Scale
The GENESIS Simulation Core v2.0 establishes a persistent, deterministic, single-authoritative simulation of artificial civilisations.
The simulation clock operates under an explicit, calibrated time standard:

| Unit | Sim Equivalent | Conversion |
| :--- | :--- | :--- |
| **1 Tick** | 1 Simulated Hour | Fundamental discrete time step |
| **24 Ticks** | 1 Simulated Day | Daily aggregation & continuous autosave |
| **720 Ticks** | 1 Simulated Month (30 Days) | Monthly fiscal & demographic review |
| **8,760 Ticks** | 1 Simulated Year (365 Days) | Annual demographic rollover & aging pass |

Deterministic replay is guaranteed through isolated per-world PRNG generators initialized with reproducible seeds (`random.Random(seed)`).

---

## 2. Nine Subsystem Modules (`engine/modules/`)

1. **Population (`population.py`)**: Individual agent models with age, sex, education, health, wealth, household, needs (hunger, thirst, warmth, safety), personality traits, and mood. Implements Gompertz biological mortality scaled to ticks with cause logging, Hadwiger fertility, and city-attractiveness migration.
2. **Resources (`resources.py`)**: Multi-tier production chains (food, water, energy, materials), finite storage capacities, transmission losses, and priority rationing.
3. **Economy (`economy.py`)**: Bottom-up GDP derived directly from citizen wages and enterprise gross value-add, Gini inequality index computed across the full citizen wealth distribution, municipal budget balancing, and taxes.
4. **Infrastructure (`infrastructure.py`)**: Building lifecycles (construction, upgrades, maintenance, abandonment, recovery), utility graph BFS distribution (power, water, sewage, waste) with outage propagation, and road topology.
5. **Environment (`environment.py`)**: 2D discrete diffusion fields ($16 \times 16$) for air, water, and soil pollution with wind vector advection and green canopy absorption, 4 distinct seasons (Spring, Summer, Autumn, Winter), and dynamic weather.
6. **Governance (`governance.py`)**: 8 public policy instruments with activation delays, costs, and trade-offs (including Universal Healthcare, Clean Energy Subsidies, and Smart Congestion Tolls), public trust, and protest dynamics mathematically driven by citizen grievance and inequality.
7. **Events (`events.py`)**: Causal crisis evaluation (famine, grid blackout, toxic smog, civil strikes) and stochastic scientific breakthroughs.
8. **Progression (`progression.py`)**: Civilisation Level and XP formulas, genuine milestone achievements, and empirical mission verification.
9. **Future Simulation (`future_sim.py`)**: Sandboxed scenario branching, counterfactual projection, and comparative analysis preserving the pristine base world.

*Plus **Movement (`movement.py`)**: A\* congestion-weighted vehicle routing over road segments, purpose-driven schedules (work, school, hospital, emergency), intersection queueing, and Level-of-Detail (LOD) rendering.*

---

## 3. Endpoints & Schema

### Single JSON World State
- **Schema**: `docs/schema/world_state.schema.json`
- **Demo Seed**: `docs/schema/demo_civilization_seed.json`
- **Endpoint**: `GET /api/v1/worlds/{id}/state/v2`

### Simulation Time Controls
- `POST /api/v1/worlds/{id}/simulation/start`
- `POST /api/v1/worlds/{id}/simulation/pause`
- `POST /api/v1/worlds/{id}/simulation/resume`
- `POST /api/v1/worlds/{id}/simulation/advance` (`{"ticks": 24}`)
- `POST /api/v1/worlds/{id}/simulation/speed` (`{"speed": "0.5x" | "1x" | "2x" | "4x" | "10x"}`)
- `GET /api/v1/worlds/{id}/simulation/status`

### Persistence & Save Slots
- `POST /api/v1/worlds/{id}/saves` (`{"slot_name": "backup_01", "slot_type": "manual"}`)
- `GET /api/v1/worlds/{id}/saves`
- `POST /api/v1/worlds/{id}/saves/{slot_name}/load`

### Policy Management
- `POST /api/v1/worlds/{id}/policies/{policy_id}/enact`
- `POST /api/v1/worlds/{id}/policies/{policy_id}/revoke`

### Scenario Branching & Counterfactuals
- `POST /api/v1/worlds/{id}/branch` (`{"branch_name": "green_transition", "scenario_overrides": {...}}`)
- `POST /api/v1/worlds/{id}/compare` (`{"branch_id": "...", "branch_metrics": {...}}`)
