# GENESIS Engine: Master Coupling & Architecture Map

**Document Version:** 2.0.0 (Unified World Architecture Edition)  
**Date:** November 9, 2026  
**Status:** ARCHITECTURAL SPECIFICATION & SUBSYSTEM COUPLING MATRIX  

---

## 1. Before vs. Target Architecture Overview

### 1.1 Before Architecture: Decoupled & Siloed Layers

```mermaid
flowchart TD
    subgraph Frontend["3D WebGL Frontend (Client-Side Only)"]
        UI_Placement["PlacementSystem (Local placedBuildings)"]
        UI_Zoning["CS2ZoningAndInfoView3D (Local zonedTiles)"]
        UI_Vehicles["VehiclesSystem (Hardcoded 12 Vehicles)"]
        UI_Peds["PedestriansSystem (Hardcoded 36 Walkers)"]
        UI_HUD["WorldHUD / EconomyPage (Local taxRate, Fake Stats)"]
    end

    subgraph BackendSim["Backend Simulation Engine (SQLite Counters)"]
        DB_Worlds["worlds (tick, year, day)"]
        DB_Econ["economy_resources (Static Multipliers: energy_rate, water_rate)"]
        SimLoop["advance_world_simulation (Net Compound Formula)"]
        CausalVitals["causal_vitals (Vital Signs Engine)"]
    end

    subgraph MLAI["Machine Learning & AI Layer"]
        ModelRegistry["ml/inference/registry.py"]
        AccidentModel["Accident Severity / Casualties (Synthetic Vectors)"]
        ForecastModel["Forecast Model (Synthetic Compound Curves)"]
    end

    UI_Placement -.->|"Fails / Silently Falls Back"| BackendSim
    UI_Zoning -.->|"NO-OP (Zero Backend Call)"| BackendSim
    UI_Vehicles -.->|"NO-OP (Isolated Waypoints)"| BackendSim
    UI_Peds -.->|"NO-OP (Isolated Loops)"| BackendSim
    SimLoop -.->|"Arbitrary Counters (No Graph)"| DB_Econ
    MLAI -.->|"Reads Offline / Synthetic Data"| SimLoop

    style UI_Placement stroke:#e74c3c,stroke-width:2px;
    style UI_Zoning stroke:#e74c3c,stroke-width:2px;
    style UI_Vehicles stroke:#e74c3c,stroke-width:2px;
    style SimLoop stroke:#f39c12,stroke-width:2px;
    style AccidentModel stroke:#e74c3c,stroke-width:2px;
```

---

### 1.2 Target Unified Architecture: Single Source of Truth

```mermaid
flowchart TD
    subgraph Client3D["3D WebGL Command Center (View + Command Source)"]
        Tools["Build / Bulldoze / Zone / Road / Policy Tools"]
        Store["frontend/src/world/worldStore (Synced State by ID & Version)"]
        Renderer3D["Three.js Renderers (Instanced Buildings, Roads, Vehicles, Agents)"]
        HUD["HUD & InfoViews (Painted strictly from Synced State)"]
    end

    subgraph CommandGateway["Unified Command & Sync Gateway"]
        CmdEndpoint["POST /api/v1/worlds/{id}/commands (Batch, Idempotent, RBAC, Costs)"]
        SyncEndpoint["GET /api/v1/worlds/{id}/state (Authoritative Snapshot)"]
        ActionLog["GET /api/v1/worlds/{id}/action-log (Audit Trail & Undo Stack)"]
        WS["WebSocket /ws/world/{id} (Versioned Entity Deltas)"]
    end

    subgraph UnifiedWorld["Backend Unified World State & Simulation Engine"]
        WState["Authoritative WorldState (Entities with Stable IDs)"]
        RoadNet["Road Network Graph (A* Routing, Capacity, BPR Congestion)"]
        Utilities["Utility Graphs (Power Flow, Water Pressure, Outages)"]
        BuildingsZoning["Zoned Lots & Buildings (RCI Demand, Spawn, Abandonment)"]
        CitizensVehicles["Citizens & Vehicles (Schedules, OD Pairs, LOD Trips)"]
        DerivedSim["Deterministic Tick Order (All Metrics Derived from Graph)"]
    end

    subgraph AIEngine["Unified AI & Decision Engine"]
        FeatureExtractor["engine/world/features.py (Single Live State Extractor)"]
        RiskOverlays["Live Spatial Risk Scores (Blackouts, Traffic, Accidents)"]
        Counterfactuals["Branch Counterfactual Projections (Surrogate / Sim)"]
        AdvisorControl["Sandboxed Policy Recommendations (Guardrailed Commands)"]
    end

    %% Bidirectional Flows
    Tools -->|"Validated Commands"| CmdEndpoint
    CmdEndpoint -->|"Mutate Entities & Invalidate Caches"| WState
    WState -->|"Advance Tick"| DerivedSim
    DerivedSim -->|"Update Entities & Metrics"| WState
    WState -->|"State Version Deltas"| WS
    WState -->|"Full Snapshot"| SyncEndpoint
    WS -->|"Reconcile by Version"| Store
    SyncEndpoint -->|"Initial Load / Resync"| Store
    Store -->|"Render"| Renderer3D
    Store -->|"Display"| HUD
    CmdEndpoint -->|"Record Changes"| ActionLog

    %% AI Connections
    WState -->|"Authoritative Graph"| FeatureExtractor
    FeatureExtractor -->|"Live Features"| RiskOverlays
    FeatureExtractor -->|"Live Features"| Counterfactuals
    FeatureExtractor -->|"Live Features"| AdvisorControl
    RiskOverlays -->|"Overlays to View"| HUD
    AdvisorControl -->|"Propose Commands"| CmdEndpoint

    style Client3D fill:#1a241e,stroke:#2ecc71,stroke-width:2px;
    style CommandGateway fill:#1f2824,stroke:#3498db,stroke-width:2px;
    style UnifiedWorld fill:#1e261f,stroke:#f39c12,stroke-width:2px;
    style AIEngine fill:#251e2b,stroke:#9b59b6,stroke-width:2px;
```

---

## 2. Authoritative Tick Sequence Order

The unified simulation advances in a strict, deterministic sequence where each subsystem consumes the output of upstream stages and writes into the shared `WorldState`:

1. **Needs & Utilities:** Power and water flow across network graphs. Supply, demand, and shortages/outages computed per building node. Disconnected buildings lose operational efficacy.
2. **Environmental Quality:** Industrial emissions and road traffic diffuse into air pollution and noise fields.
3. **Public Health & Disease:** Shortages and pollution propagate into sickness and hospital admission queues.
4. **Incidents & Hazards:** Traffic volume and road types generate accidents; emergency dispatch routes vehicles via A*.
5. **Hospital & Emergency Response:** Hospitals admit patients up to capacity; bed occupancy determines mortality hazard.
6. **Mortality & Demographics:** Gompertz aging and hazard multipliers compute deaths by cause; Hadwiger fertility computes births.
7. **Economy & Labor Force:** Citizen schedules determine commutes; commercial/industrial buildings employ workers and generate tax revenue.
8. **Citizen Satisfaction & Happiness:** Commute times, noise, utility stability, and taxation determine citizen happiness.
9. **Unrest & Protests:** Low satisfaction and basic need deprivations trigger civil unrest and strikes.
10. **Governance & AI Feedback:** Policy edicts and AI advisor recommendations respond to state metrics.
