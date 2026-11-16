# GENESIS Engine Movement Subsystem Audit

**Date:** 2026-11-16  
**Auditor:** Senior Simulation & 3D Engineer  
**Scope:** Backend and Frontend vehicle and pedestrian movement generation, routing, physical simulation, and synchronization.

---

## 1. Audit Summary Table

| File | Function / Component | Current Implementation | Identified Defects & Architectural Gaps |
|---|---|---|---|
| `backend/engine/world/road_network.py` | `find_shortest_path`, `update_congestion_from_traffic` | Node-to-node A* with BPR travel time cost function. | Lacks lane-level graph modeling, turn restrictions, intersection conflict zones, and pedestrian graph topology (sidewalks, crosswalks, building access points). |
| `backend/engine/modules/movement.py` | `step`, `plan_trip` | Linear `progress_pct += 0.15 * ticks` advancing along route node coordinates. | No Intelligent Driver Model (IDM) car-following, no braking/acceleration physics, no collision/overlap avoidance. Ignores lane offsets and intersection priority/signals. No pedestrian agent simulation. |
| `backend/engine/world/simulation.py` | `_step_infrastructure`, `_seed_default_citizen_sample` | Duplicates progress stepping logic from `movement.py`. Spawns dummy commuter vehicles between arbitrary buildings. | Vehicle entities use pseudo citizen IDs (`cit_commuter_X`) disconnected from real population entities. Spawns directly on road nodes rather than building access/parking spots. |
| `src/components/world3d/VehiclesSystem.tsx` | `VehiclesSystem`, `vehicles` array | Renders 12 hardcoded vehicles (`veh-ns-commuter`, `veh-ns-transit`, etc.) looping over fixed spline waypoints in client memory. | Completely decouples from backend-authoritative vehicles. Movement is 100% client-side synthetic animation. Zero backend synchronization of positions, routes, or behaviors. |
| `src/components/world3d/PedestriansSystem.tsx` | `PedestriansSystem`, `PEDESTRIAN_PATHS` | Generates 36 mock pedestrians walking client-defined coordinate loops (`PEDESTRIAN_PATHS`). | Pedestrians have no backend identity, no purpose-driven daily schedules (work, home, shop, leisure), and zero backend state synchronization. |
| `src/components/world3d/RoadNetwork.tsx` | `getGlobalTrafficSignal` | Client-side timer alternating `NS_GREEN` and `EW_GREEN` every 12 seconds. | Traffic lights operate autonomously in frontend with zero backend coordination or junction phase synchronization. |
| `src/world/worldStore.ts` | `useUnifiedWorld` | Receives backend `vehicles_sample` and `traffic` metrics via WebSocket/polling. | Frontend vehicle store state is unused by 3D renderers, causing desynchronization between backend simulation and visual output. |

---

## 2. Root Cause Analysis

1. **Simulation Authority Split:** The backend computes macroscopic traffic metrics and advances simplified route percentages, while the frontend runs independent 3D waypoint loops for visual flair.
2. **Missing Microscopic Traffic Dynamics:** No car-following model (IDM) exists. Vehicles cannot brake for leaders, change lanes, yield at unsignalized junctions, or respond to emergency sirens.
3. **Absence of Pedestrian Network & Schedules:** The road network only records centerline road nodes. Pedestrians lack sidewalks, building entry/exit connections, signalized crosswalk wait zones, and daily circadian schedules tied to `CitizenEntity`.
4. **Lack of Spatiotemporal Lane Offsets:** Vehicles travel along node centerlines, leading to visual collisions and overlapping meshes when traveling in opposite directions on 2-way roads.

---

## 3. Part 2 Remediation Blueprint

1. **Step 2.1 (Network & Map Readiness):**
   - Formalize road networks with multi-lane offsets, speed limits, junction priority, and signal controllers.
   - Generate authoritative pedestrian networks (sidewalk segments, crosswalks, building ingress/egress points).
   - Implement `engine.validate_maps` ensuring 100% graph connectivity, no dead ends without turnarounds, and accurate node terrain elevations.
2. **Step 2.2 (Backend Microscopic Vehicle Logic):**
   - Full Intelligent Driver Model (IDM) car-following physics ($\dot{v} = a [1 - (v/v_0)^4 - (s^*(v, \Delta v)/s)^2]$).
   - A* routing with dynamic congestion penalties, road blockages, and path caching.
   - Signalized and unsignalized junction control with priority yielding and deadlock detection.
   - Vehicle classes: Sedans, buses (with dwell times & boarding), delivery trucks, and priority emergency vehicles (ambulances/police/fire with yield behavior).
3. **Step 2.3 (Backend Pedestrian Logic):**
   - Circadian citizen schedules tied directly to `CitizenEntity` in the population module.
   - Pedestrian path navigation across sidewalks, crosswalk signals, and building doors.
   - Viewport-based Level-of-Detail (LOD).
4. **Step 2.4 (Frontend Sync & Smooth Rendering):**
   - New clean architecture under `src/world/movement/*` (e.g., `MovementRenderer.tsx`, `useMovementSync.ts`).
   - Cubic Hermite lane interpolation, terrain height snapping, heading smoothing, and vehicle/pedestrian instancing for 60 FPS performance.
5. **Step 2.5 (F3 Debug Overlay):**
   - Interactive debug HUD rendering live entity counts, speeds, queue lengths, stuck detectors, route lines, lane centerlines, and signal phase states.
