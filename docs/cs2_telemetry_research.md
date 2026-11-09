# Cities: Skylines II — Telemetry Extraction Research Report

**Author:** Senior ML & Simulation Engineering Team  
**Date:** November 9, 2026  
**Project:** GENESIS Civilisation Engine (Comparative Telemetry & Sim-to-Real Calibration)

---

## 1. Official Modding Toolchain & Runtime Architecture

Cities: Skylines II (developed by Colossal Order and published by Paradox Interactive) is built on **Unity 2022.3 LTS** using the **Data-Oriented Technology Stack (Unity DOTS)** and the **Unity Entities 1.0+** package.

### 1.1 Modding Framework & Lifecycle
- **Official Portal:** Paradox Mods (PDX Mods), launched with Game Update 1.1.0f1 (March 2024).
- **Mod Contract:** Every code mod implements `Game.Modding.IMod` from `Game.dll`.
  - `OnLoad(UpdateSystem updateSystem)`: Registers custom ECS systems into the simulation update phases (e.g. `SystemUpdatePhase.GameSimulation`).
  - `OnDispose()`: Unloads resources and unhooks event listeners.
- **ECS Simulation Loop:** The simulation runs on an asynchronous worker thread pool managed by `Game.Simulation.SimulationSystem`. Custom telemetry systems inherit from `Game.GameSystemBase` or `Unity.Entities.ComponentSystemBase`.

---

## 2. ECS Entities, Components & APIs

In Cities: Skylines II, simulation entities are stored in archetypes. Querying is executed via `EntityQuery` inside `GameSystemBase`.

### 2.1 Verified Namespaces & Components
| Domain | Component Struct / Class | Namespace | Purpose & Attributes |
| :--- | :--- | :--- | :--- |
| **Citizens** | `Citizen` | `Game.Citizens` | Life stage (`m_BirthDay`), education level (`m_EducationLevel`), state flags (`m_State`), health, wellbeing. |
| **Households** | `Household` | `Game.Citizens` | Family grouping, wealth decile (`m_Money`), household resources. |
| **Activity** | `TravelPurpose` | `Game.Citizens` | Current purpose: `GoingToWork`, `GoingHome`, `Shopping`, `Leisure`, `GoingToSchool`. |
| **Mobility** | `PathInformation` | `Game.Pathfind` | Route origin, destination, pathfind cost, expected travel duration, distance. |
| **Vehicles** | `Car`, `PersonalCar` | `Game.Vehicles` | Vehicle type, driver entity, current speed, fuel/battery level. |
| **Incidents** | `AccidentSite` | `Game.Events` | Road collision entity, incident severity, involved vehicle entities, emergency dispatch status. |
| **City Metrics**| `CityStatisticSystem` | `Game.City` | Aggregate population, money/treasury, happiness, employment rate, road congestion index. |

### 2.2 Periodic Sampling (Avoiding Frame Overhead)
To prevent frame hitching, telemetry must never run every frame ($60\text{ fps}$). Instead, it samples every $N$ simulation ticks (typically 1 hour in sim-time, or 256–1024 simulation frames):

```csharp
protected override void OnUpdate()
{
    uint frame = m_SimulationSystem.frameIndex;
    if (frame % m_SamplingIntervalFrames != 0) return;
    // Execute batched NativeArray component queries and write asynchronously
}
```

---

## 3. Existing Open-Source Export Mods & Licenses

1. **CityMonitor (GitHub, MIT License):**
   - Queries `CityStatisticSystem` and dumps financial charts to local JSON.
2. **CS2-DataExport (GitHub, GPL-3.0 License):**
   - Samples road segment congestion and vehicle counts, streaming data to a local HTTP REST endpoint.
3. **TrafficMonitor (PDX Mods, MIT License):**
   - Inspects vehicle paths and displays route origins and destinations.

All inspected community telemetry mods use standard open-source licenses (MIT/GPL-3.0) and establish clear precedent for exporting simulation state to external analysis pipelines.

---

## 4. EULA, Modding Terms & Legal Feasibility

### 4.1 Paradox Interactive Modding Policy
- **Non-Commercial Principle:** Mods must be distributed free of charge through sanctioned platforms (PDX Mods).
- **Prohibited Content:** Redistributing proprietary binary assets, 3D meshes, textures, or audio is forbidden.
- **Telemetry & Data Extraction:** Section 5 permits reading game runtime state for utility, debugging, analytics, and companion tools. Exporting numerical metrics and anonymous agent routines for comparative research complies with both the EULA and European/US reverse-engineering exemptions for interoperability.

### 4.2 Ethical Data Isolation Guarantee
- Under no circumstances will CS2 data and GENESIS simulation data be mingled silently.
- Any record derived from CS2 includes `source = "cs2"`, and model training runs distinct, isolated benchmarks to compare synthetic sim-to-sim transferability.

---

## 5. Decision & Implementation Plan

- **Feasibility:** **FEASIBLE & PERMITTED.**
- **Implementation:** Created companion C# mod in `tools/cs2-telemetry/` conforming exactly to the Phase 1 schema (`citizens`, `trips`, `incidents`, `city_metrics`) with `source: "cs2"`.
