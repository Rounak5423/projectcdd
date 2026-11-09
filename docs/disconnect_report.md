# GENESIS Engine: Unified World Disconnect Diagnostic Report

**Document Version:** 1.0.0  
**Audit Date:** November 9, 2026  
**Auditor:** Senior Simulation Architect & QA Lead  
**Status:** FORENSIC DIAGNOSTIC COMPLETED — IDENTIFIED ARCHITECTURAL DISCONNECTS ACROSS 3D WORLD, SIMULATION ENGINE & AI MODELS  

---

## 1. Executive Summary

An exhaustive audit of the GENESIS Engine codebase revealed that the system has operated as three siloed, loosely connected layers:
1. **The Backend Simulation Engine:** Advances scalar counters in SQLite (`economy_resources`, `worlds`) using differential/causal equations, but does not derive aggregates from individual buildings, road graphs, utility networks, or citizen agents.
2. **The 3D WebGL Command Center:** Renders a rich city with buildings, vehicles, pedestrians, zoning grids, and roads, but runs its own local React state. Building placement silently falls back to client-only state; demolition calls a 404 endpoint; zoning is purely frontend; roads, vehicles, and pedestrians are hardcoded arrays.
3. **The Machine Learning & AI Layer:** ML models (`accident_severity`, `casualty_count`, `forecast`) run on synthetic offline training arrays and default parameters rather than extracting real-time features from the live city state.

This report documents the exact evidence for each disconnect and establishes the target architecture to unify them into **ONE coherent, bidirectional system**.

---

## 2. Forensic Investigation of the Five Architectural Pillars

### 2.1 Pillar A: Construction, Bulldozing & Zoning Disconnect
*Question: What happens in the backend when the frontend builds, bulldozes, or zones something? Does a command endpoint exist, is it called, does it change the state the sim reads, and is the result persisted?*

- **Building Placement:**
  - **Frontend Origin:** `src/components/world3d/PlacementSystem.tsx` line 16 calls `placeBuilding(...)` in `src/context/GameStateContext.tsx` (lines 1144–1205).
  - **API Call:** Line 1199 invokes `civilizationApi.constructFacility(civilization.id, { catalogId, name, category, x, z, rotation, districtId })`.
  - **Defect:** `civilizationApi.constructFacility` posts to `/worlds/{civId}/buildings`. The backend model `BuildingConstructRequest` in `infrastructure.py` expects `{ type: str, x: float, y: float, z: float }`. Because `catalogId` is passed and `type` is omitted or mismatched, the request fails with validation/404 or falls back:
    ```typescript
    // src/services/civilizationApi.ts lines 177-183
    } catch {
      return {
        success: true,
        message: 'Facility queued in client simulation state.',
        isFallback: true,
      };
    }
    ```
    The building is appended to client-only `placedBuildings` and is **never persisted in SQLite or read by the backend simulation**.
- **Bulldozing / Demolition:**
  - **Frontend Origin:** `CS2ZoningAndInfoView3D.tsx` and `BuildingInspectorPanel.tsx` call `demolishBuilding(buildingId)` in `GameStateContext.tsx` (lines 1527–1545).
  - **API Call:** Line 1532 calls `civilizationApi.decommissionFacility(civilization.id, buildingId)`, which issues `DELETE /worlds/{civId}/buildings/{buildingId}`.
  - **Defect:** The backend endpoint in `infrastructure.py` line 296 is defined as `@router.delete("/buildings/{building_id}")` (omitting `/worlds/{id}`). The frontend call returns `404 Not Found`, which is caught by `.catch(() => {})`. The demolition is completely lost on refresh.
- **Zoning:**
  - **Frontend Origin:** `CS2ZoningAndInfoView3D.tsx` line 52 calls `paintZoneTile(cell.x, cell.z, activeZoneTool)` in `GameStateContext.tsx` (lines 429–448).
  - **Defect:** `paintZoneTile` only mutates `zonedTiles` in React memory (`setZonedTiles((prev) => ...)`). **No backend endpoint exists or is called.** The backend simulation has zero knowledge of zoned residential, commercial, or industrial land.
- **Road Drawing:**
  - **Frontend Origin:** `src/components/world3d/RoadNetwork.tsx` lines 360–501 hardcodes 12 `RoadSegmentData` objects in a `useMemo` hook. There is no tool or API endpoint to create, modify, or remove roads.

---

### 2.2 Pillar B: Provenance of Displayed Numbers (Simulation Metrics)
*Question: Where do the displayed numbers (people, electricity, water, jobs, traffic) come from? List every place a metric is generated and whether it is derived from entities or independently produced.*

| Metric | Source Location | How It Is Currently Generated | Classification |
| :--- | :--- | :--- | :--- |
| **Population** | `engine/simulation.py` (lines 379–422) | Derived from previous tick population plus net births/deaths from causal engine differential equation. **Not derived from residential building occupancy or citizen entities.** | ⚠️ Semi-Derived Counter |
| **Electricity Supply & Demand** | `engine/simulation.py` (lines 374, 382, 387) | `energy_prod = energy_rate * time_factor * 10.0`, where `energy_rate` is a static database column. **Not computed from power plant nodes, electrical transmission lines, or building loads.** | ❌ Independent Counter |
| **Water Supply & Pressure** | `engine/simulation.py` (lines 373, 381, 386) | `water_prod = water_rate * time_factor * 10.0`, where `water_rate` is a static database column. **Not computed from water towers, pumps, or pipe networks.** | ❌ Independent Counter |
| **Jobs & Employment** | `engine/simulation.py` (line 418) | Fixed static `employment_rate = 0.95`. **Not derived from commercial/industrial workplace capacities or citizen commuters.** | ❌ Hardcoded Scalar |
| **Traffic Congestion** | `src/components/world3d/VehiclesSystem.tsx` (lines 24–38) | Hardcoded frontend singleton: `activeVehicles: 12`, `congestionIndex: 8`, `trafficFlowEfficiency: 92`. **Not calculated from road segment volume-to-capacity (V/C) ratios.** | ❌ Hardcoded Fake |
| **Civic Tax Revenue** | `src/context/GameStateContext.tsx` (line 389) | `taxRate` is a local React state variable (`useState(18)`). Never read by backend economy ledger. | ❌ Cosmetic State |

---

### 2.3 Pillar C: Vehicles and Pedestrians in the 3D World
*Question: How are people and cars created and moved in the 3D world? Frontend-only randomness, or backend positions? Do they use the road graph, destinations, schedules, and the same entity IDs as the backend?*

- **Vehicles:**
  - `src/components/world3d/VehiclesSystem.tsx` defines 12 hardcoded vehicle objects (`veh-commuter-01`, `veh-transit-bus-01`, etc.) with fixed 3D waypoint coordinate arrays.
  - Movement is calculated in `useFrame` via `(clock.getElapsedTime() * speed) % totalDistance`.
  - Vehicles do not query the backend `RoadGraph`, do not originate from residential buildings, do not route to workplaces, and do not carry real citizen agents.
- **Pedestrians:**
  - `src/components/world3d/PedestriansSystem.tsx` defines 3 static pathway loops (`PEDESTRIAN_PATHS`) and instantiates 36 client-side pedestrian agents.
  - Agents wander on hardcoded waypoints with random clothes palettes. They share zero entity IDs with backend `citizens` in SQLite.

---

### 2.4 Pillar D: Machine Learning Feature Inputs
*Question: What data do the ML models take as input? Live state, or separate tables or synthetic generators?*

- **Accident Risk Model:** In `genesis-engine/backend/ml/inference/registry.py` lines 233–280, `evaluate_incident_risk` takes scalar parameters (`speed_limit=30.0`, `road_type=6`, `urban_or_rural=1`). When called by the API, it passes default values rather than computing feature averages across live road segments and traffic flows.
- **Forecast Model:** In `ml/inference/registry.py` lines 201–230, predictions are calculated via a synthetic exponential formula (`cur_pop *= 1.018`, `cur_treasury *= 1.035`) with static noise bands, completely bypassing the actual state of the city.
- **Root Cause:** Absence of a **Unified Feature Extractor** module that reads the live `WorldState` (graph topology, utility load ratios, zoned capacities, agent demographics) and produces normalized feature vectors for both inference and training.

---

### 2.5 Pillar E: WebSocket & State Contract Consistency
*Question: Is there one WebSocket or REST contract for state, or several? Are the IDs consistent between backend and frontend?*

- **ID Aliasing Mismatch:**
  - Frontend initializes with `civilization.id = "civ-aurora-01"`.
  - Backend database stores the canonical world as `aurora-prime`.
  - Previous endpoints without canonical alias resolution failed with `404 Not Found`.
- **Contract Fragmentation:**
  - `GET /api/v1/worlds/{id}` returns a monolithic Pydantic `WorldState`.
  - `GET /api/v1/worlds/{id}/vitals` returns a list of causal snapshots.
  - `WebSocket /ws/world/{id}` broadcasts `tick_delta` with raw numeric scalars (`delta: { population, gdp, happiness }`), but lacks:
    1. A monotonically increasing `version` sequence number.
    2. Entity change deltas (`created`, `updated`, `removed` for buildings, roads, vehicles).
    3. Resynchronization support on client disconnect or packet drop.

---

## 3. Root Cause Ranking

```
===================================================================================================
                                  ROOT CAUSE SEVERITY RANKING
===================================================================================================
 Rank  Defect Subsystem                 Impact Description
---------------------------------------------------------------------------------------------------
  1    Missing Unified Command Layer    All 3D tools (build, bulldoze, zone, road) bypass backend
                                        state or fail silently, preventing true interactivity.
  2    Independent Aggregate Counters   Electricity, water, jobs, and traffic are arbitrary scalar
                                        counters instead of being derived from graphs and buildings.
  3    Client-Only Vehicle/Agent World  Vehicles and pedestrians in 3D are hardcoded cosmetic loops
                                        rather than representations of real backend citizen trips.
  4    Disconnected AI Feature Pipeline ML models run on default synthetic vectors instead of the
                                        live urban graph and entity state.
  5    Fragmented Wire Protocol         WebSocket broadcasts loose scalars without versioning, entity
                                        deltas, or resync contracts.
===================================================================================================
```

---

## 4. Architectural Target & Resolution Plan

1. **Unified WorldState & Command Engine (`backend/engine/world/`):**
   - Implement `WorldStateManager` holding authoritative entities: `buildings`, `roads`, `zones`, `utilities`, `citizens`, `vehicles`.
   - Expose `POST /api/v1/worlds/{id}/commands` with batching, validation, affordability checks, RBAC, execution result, and undo stack.
   - Expose `GET /api/v1/worlds/{id}/state` and versioned WebSocket delta sync.
2. **Graph-Derived Simulation Logic:**
   - Power & Water utility networks solved via graph connectivity.
   - RCI demand-driven building spawn and abandonment.
   - Road graph with A* pathfinding and BPR congestion calculations.
3. **Frontend Unified World Store (`src/world/`):**
   - Connect 3D renderer and HUD to the synced backend state.
   - Wire all placement, bulldozer, and zoning tools to the command endpoint with optimistic updates.
   - Drive 3D vehicles and pedestrians from backend trip entities.
4. **Unified ML Feature Extractor (`backend/engine/world/features.py`):**
   - One shared feature extraction module generating risk scores and counterfactual projections from live state.

