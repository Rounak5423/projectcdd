# CIVORA Professional Game-Engine Optimization
# Phase 4 – Simulation Engine Architecture Audit

**Target System**: Backend Simulation Engine (`genesis-engine/backend/`)  
**Phase**: 4 of Optimization Master Plan  
**Status**: Task 1 Complete – Architecture Audit & Bottleneck Identification  
**Date**: November 2026  

---

## 1. Executive Overview

CIVORA's backend contains two distinct simulation execution architectures that evolved in parallel:
1. **Engine A: In-Memory Object-Oriented Simulation (`engine/simulation.py`, `engine/state.py`, `engine/models.py`)**:
   - Manages interactive multi-agent worlds in memory using Pydantic `WorldState` models.
   - Simulates fine-grained citizen cognitive dynamics (the AI Dependency Paradox), spatial movement, demographics, micro-occupations, and discrete Gini wealth distribution.
   - Supports counterfactual branching and comparison (`world_manager.branch()`, `world_manager.compare()`).
   - Driven by `/api/worlds/{id}/tick`, `/api/worlds/{id}/autotick/start`, and the WebSocket stream `/ws/{id}`.
2. **Engine B: Database-Backed Persistent Simulation (`engine/simulation_v1.py`, `engine/models_v1.py`, `api/v1/simulation.py`)**:
   - Manages persistent civilization worlds (e.g., `aurora-prime`) stored in SQLite.
   - Calculates macroeconomic growth, population compounding, resource production/consumption balances, research progress on active technologies, mission milestone evaluations, and progression XP/GRC.
   - Driven by `/api/v1/worlds/{id}/simulation/start`, `/pause`, `/resume`, `/advance`, and `/api/v1/civilizations/{id}/simulate`.

This audit maps every execution path, calculation dependency, scheduling flaw, and persistence bottleneck to establish the architectural foundation for Phase 4 optimization.

---

## 2. Simulation Execution Paths & Entry Points

```
                                  [ CLIENTS / FRONTEND ]
                                      |            |
                    HTTP REST API Controls          WebSocket Stream (/ws/{world_id})
                            |                              |
            +---------------+---------------+              |
            |                               |              |
    [Engine B: SQLite-Backed]       [Engine A: In-Memory]  |
    /api/v1/worlds/{id}/simulation/  /api/worlds/{id}/tick  |
    - /start                        - /autotick/start      |
    - /pause                        - /autotick/stop       |
    - /resume                       - /branch              |
    - /advance                      - /compare             |
            |                               |              |
    advance_world_simulation()        step_world() <-------+
            |                               |
    SQLite Database (WAL)           WorldStateManager._worlds
```

### Detailed Entry Point Catalog:

| Entry Point | Method | Target Engine | Execution Path | Synchronization |
| :--- | :--- | :--- | :--- | :--- |
| `/api/worlds/{id}/tick` | POST | Engine A / B fallback | `step_world(world)` if in `world_manager`, else `advance_world_simulation(id)` | None (unlocked) |
| `/api/worlds/{id}/autotick/start` | POST | Engine A | Spawns `_run_autotick` background task in `main.py` | Task dict (`autotick_tasks`) |
| `/ws/{id}` | WebSocket | Engine A / B fallback | Listens for `{"type": "tick"}` and calls `step_world` or `advance_world_simulation` | None |
| `/api/v1/worlds/{id}/simulation/start` | POST | Engine B | Sets DB status='running', spawns `_run_continuous_simulation` | Task dict (`active_simulation_tasks`) |
| `/api/v1/worlds/{id}/simulation/pause` | POST | Engine B | Sets DB status='paused', cancels task | Task dict |
| `/api/v1/worlds/{id}/simulation/resume` | POST | Engine B | Sets DB status='running', spawns `_run_continuous_simulation` | Task dict |
| `/api/v1/worlds/{id}/simulation/advance` | POST | Engine B | Calls `advance_world_simulation(id, ticks=req.ticks)` | None |
| `/api/worlds/{id}/branch` | POST | Engine A | `copy.deepcopy()` on `WorldState`, calls `step_world` for projected ticks | None |

---

## 3. World-State Representation & Data Flow

### Engine A (`WorldState` Pydantic Hierarchy):
```
WorldState
 ├── id, name, tick, year, grid_size, population_count
 ├── EnvironmentStats (climate, technology_level, environmental_quality, temperature, weather)
 ├── List[Building] (id, type, x, y, height, level, capacity)
 ├── List[Citizen] (N agents)
 │    ├── Demographics (id, age, occupation, wealth, x, y)
 │    ├── NeedsVector (hunger, energy, wellbeing)
 │    └── CognitiveProfile (independent_reasoning, problem_solving, critical_evaluation,
 │                          creativity, knowledge_retention, ai_dependency)
 ├── Resources (food, water, energy, materials)
 ├── Dict[str, Policy] (active, parameters, modifiers)
 ├── EconomyStats (gini, civic_stability, average_wealth, total_wealth, macro_innovation_index,
 │                 avg_ai_dependency, avg_reasoning, avg_problem_solving)
 └── List[HistorySnapshot] (rolling 600 snapshots)
```

### Engine B (SQLite Database Schema):
```
SQLite Tables
 ├── worlds (id, tick, year, day, simulation_status, simulation_speed, climate, tech_level)
 ├── economy_resources (population, gdp, food, water, energy, materials, research_points, grc)
 ├── progression (xp, level, title, thriving_score, grc_balance)
 ├── buildings (world_id, name, type, level, capacity, cost, effects)
 ├── citizens (world_id, age, occupation, wealth, hunger, energy, wellbeing, cognitive stats)
 ├── missions (world_id, title, target_metric, target_value, current_value, is_completed)
 ├── events (world_id, year, day, title, category, description, created_at)
 ├── technologies (world_id, name, research_cost, research_progress, is_unlocked, is_researching)
 ├── policies (world_id, name, is_active, parameters, effects)
 └── metrics_history (world_id, tick, year, day, population, gdp, happiness, employment, etc.)
```

---

## 4. Subsystem Calculations & Dependency Mapping

```
                                 [ POLICIES & ADVISOR DIRECTIVES ]
                                                │
                          ┌─────────────────────┴─────────────────────┐
                          ▼                                           ▼
             [ POPULATION & AGENTS ]                         [ INFRASTRUCTURE & TECH ]
             - Age progression (+0.1 yr)                     - Power generation
             - Spatial jitter (x, y)                         - Hydroponic yield
             - AI Dependency accumulation                    - Research facilities
             - Cognitive atrophy calculation                 - Housing capacity
             - Natural mortality & births                             │
                          │                                           │
                          └─────────────────────┬─────────────────────┘
                                                ▼
                                    [ MACRO RESOURCES ]
                                    - Food: prod(farm) - cons(pop * 8.0)
                                    - Water: prod(eng) - cons(pop * 10.0)
                                    - Energy: prod(power) - cons(pop * 6.5)
                                    - Materials: prod(ind) - cons(40.0)
                                    - Research: prod(res_hub)
                                                │
                                                ▼
                                     [ ECONOMIC DYNAMICS ]
                                    - Individual productivity & earnings
                                    - Automation tax deductions
                                    - UBI / dividend redistribution
                                    - Gini coefficient calculation: O(N log N)
                                    - Civic stability: max(0.2, 1.0 - 0.8 * Gini)
                                    - Macro Innovation: avg(0.6*R + 0.4*(1-D))
                                                │
                                                ▼
                                   [ PROGRESSION & EVENTS ]
                                    - Technology progress accumulation
                                    - Objective / Mission completion checks
                                    - Level XP / GRC threshold progression
                                    - Historical metrics snapshots
```

### Direct Mathematical Dependencies:
1. **Cognitive Atrophy**:
   $$\text{Atrophy}_i = (1.0 - S) \times 0.015 \times D_i - (\text{edu\_boost} \times 0.008)$$
   $$R_i \leftarrow \max(0.1, \min(1.0, R_i - \text{Atrophy}_i))$$
   *Upstream*: Scaffolding policy $S$, AI coverage $A$, citizen AI dependency $D_i$.  
   *Downstream*: Individual productivity, Macro Innovation Index.
2. **Individual Productivity**:
   $$\text{Efficiency}_i = 0.5 + (0.5 \times P_i) \times (1.0 - H_i \times 0.5)$$
   *Upstream*: Problem-solving $P_i$, Hunger deficit $H_i$.  
   *Downstream*: Resource output, earned wealth.
3. **Discrete Gini Coefficient**:
   $$\text{Gini} = \frac{2 \sum_{i=1}^n i \cdot w_i}{n \sum_{i=1}^n w_i} - \frac{n + 1}{n}$$
   *Upstream*: Array of citizen wealth $\{w_i\}$ sorted in ascending order.  
   *Downstream*: Civic stability $S_{\text{civic}} = \max(0.2, 1.0 - 0.8 \cdot \text{Gini})$.
4. **Macro Innovation Index**:
   $$I_{\text{macro}} = \frac{1}{N} \sum_{i=1}^N \left(0.6 \cdot R_i + 0.4 \cdot (1.0 - D_i)\right)$$
   *Upstream*: Reasoning $R_i$, Dependency $D_i$ for all living agents.  
   *Downstream*: National research multiplier, tech progression.

---

## 5. Identified Bottlenecks & Architectural Risks

### Bottleneck 1: Unregulated Background Loops & Timing Drift
- **Files**: `api/v1/simulation.py` (`_run_continuous_simulation`), `main.py` (`_run_autotick`).
- **Current Implementation**:
  ```python
  while True:
      await asyncio.sleep(interval)
      # Synchronous blocking call directly on the event loop:
      advance_world_simulation(world_id, ticks=1)
  ```
- **Problems**:
  1. `advance_world_simulation()` is synchronous and CPU/DB bound. Running it directly on the event loop stalls all concurrent HTTP requests and WebSocket pings.
  2. `asyncio.sleep(interval)` does not compensate for execution duration. If a tick takes 40ms and interval is 100ms, ticks execute every 140ms instead of 100ms (accumulating heavy timing drift).
  3. No overload protection: when the system falls behind, ticks cannot catch up predictably.
  4. Lacks monotonic time scheduling (`time.monotonic()`).

### Bottleneck 2: Database Connection & Transaction Thrashing
- **File**: `engine/simulation_v1.py` (`advance_world_simulation`).
- **Current Implementation**:
  - Opens and closes a connection every single tick: `conn = get_db_connection()`.
  - Executes 5-6 queries and 4-5 updates per tick.
  - At `10x` simulation speed (10 ticks/second), the engine performs **50+ SQL queries and 40+ table writes per second** through SQLite.
- **Problems**:
  1. Massive disk I/O and WAL write-lock contention.
  2. Blocks concurrent read requests from dashboard and council endpoints.
  3. No dirty-state tracking: updates `economy_resources` and `progression` even when values haven't drifted.

### Bottleneck 3: O(N log N) Sorting and Repeated Agent Iterations
- **File**: `engine/economy.py`, `engine/cognitive.py`, `engine/simulation.py`.
- **Current Implementation**:
  - Citizen agents are iterated sequentially 3 to 4 times per tick:
    1. Loop 1: Age increment, cognitive update, spatial jitter, mortality.
    2. Loop 2: Scarcity-adjusted hunger, productivity, wealth calculation.
    3. Loop 3: UBI redistribution.
    4. Loop 4: Gini calculation with `valid_wealth.sort()`.
    5. Loop 5: Sum reductions for average wealth, avg reasoning, avg dependency, macro innovation.
- **Problems**:
  - For $N=1,000$ to $N=10,000$ agents, executing 5 separate Python loops with individual object property access causes severe main-thread CPU overhead.
  - `valid_wealth.sort()` is called on every tick even if wealth distribution barely shifted.

### Bottleneck 4: Concurrent Mutation & Race Conditions
- **Files**: `api/v1/simulation.py`, `main.py`.
- **Problem**:
  - An HTTP `advance` call (`/worlds/{id}/simulation/advance`) can execute concurrently while the background loop `_run_continuous_simulation` is actively executing `advance_world_simulation()`.
  - There is no mutual exclusion lock or state mutation lock per world, risking SQLite `database is locked` errors or corrupt state overwrites.

### Bottleneck 5: Memory Leak & Unbounded State Objects
- **File**: `engine/simulation.py`.
- **Problem**:
  - `world.history` stores full `HistorySnapshot` objects. While capped at 600, cloning via `copy.deepcopy()` during counterfactual branching (`world_manager.branch()`) clones all 600 snapshots and all citizen objects, consuming high memory and CPU time.

---

## 6. Optimization Roadmap for Phase 4

| Task | Target Module | Optimization Strategy |
| :--- | :--- | :--- |
| **Task 2** | `engine/scheduler.py` | Centralized `SimulationScheduler` with fixed-timestep accumulator, monotonic time regulation, overload clamp, and thread-pool execution for CPU/DB work. |
| **Task 3** | `engine/state_manager.py` | Unified `SimulationStateManager` with dirty-state tracking, dependency-based recalculation, and tick versioning. |
| **Task 4** | `engine/agent_engine.py` | Vectorized / batch agent processing, single-pass iteration, incremental metric aggregation, and conditional Gini calculation. |
| **Task 5** | `engine/worker.py` | Offload blocking simulation ticks from the asyncio event loop using `asyncio.to_thread` or executor pools without multiple state mutations. |
| **Task 6** | `engine/models.py` | Authoritative world-state ownership with tick-based versioning and invariant validation. |
| **Task 7** | `engine/persistence.py` | Batched writes, periodic metrics history flushing (every K ticks instead of every tick), and dirty-record transactions. |
| **Task 8** | `engine/snapshot.py` | Atomic checkpoints, rollback on error, and corruption recovery. |
| **Task 9** | `engine/events.py` | Filtered event generation (publish state deltas only when thresholds or status changes occur). |
| **Task 10-11** | `tests/` | Comprehensive determinism, performance benchmarking, and regression verification suite. |

---

## 7. Approval Gate

Task 1 is complete. No simulation logic or gameplay balance was altered during this audit.  
Proceeding to **Task 2: Centralized Simulation Scheduler** and subsequent engine refactoring.
