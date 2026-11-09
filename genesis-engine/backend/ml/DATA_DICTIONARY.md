# GENESIS Engine — Telemetry Data Dictionary

This document specifies the authoritative schema, field types, valid ranges, and lineage for simulation telemetry exported to `ml/data/generated/<run_id>/`.

---

## 1. Storage & Partitioning Strategy

- **Root Directory:** `genesis-engine/backend/ml/data/generated/<run_id>/`
- **Format:** Apache Parquet with Snappy compression.
- **Partitioning Strategy:** Split **BY RUN** (Never by row). Run-level isolation ensures no temporal target leakage across Train, Validation, and Test partitions.
- **Run Identifier:** `run_{index:04d}_{seed}`.

---

## 2. Table Specifications

### 2.1 Citizens Snapshot Table (`citizens.parquet`)
Records individual citizen demographic, cognitive, and activity state sampled per telemetry interval.

| Field | Type | Unit / Format | Valid Range | Nullable | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `STRING` | UUID / Prefixed | Non-empty | No | Unique citizen agent identifier. |
| `age` | `FLOAT` | Simulated years | $[0.0, 120.0]$ | No | Citizen chronological age. |
| `education` | `FLOAT` | Education index | $[0.0, 5.0]$ | No | Highest attained education tier. |
| `health` | `FLOAT` | Normalized score | $[0.0, 1.0]$ | No | Physical wellbeing and vitality index. |
| `wealth` | `FLOAT` | GRC currency | $[0.0, \infty)$ | No | Accumulated personal wealth. |
| `household_id` | `STRING` | Prefixed ID | Non-empty | No | Household unit grouping identifier. |
| `home_id` | `STRING` | Building ID | Non-empty | No | Domicile structure identifier. |
| `work_id` | `STRING` | Building ID | Non-empty | Yes | Employer workplace identifier. |
| `school_id` | `STRING` | Building ID | Non-empty | Yes | School or university structure. |
| `current_activity` | `STRING` | Categorical | `home`, `at_work`, `at_school`, `leisure`, `commuting` | No | Current discrete activity state. |
| `world_id` | `STRING` | Simulation ID | Non-empty | No | Source civilization world identifier. |
| `tick` | `INT64` | Integer steps | $[0, \infty)$ | No | Simulation step index. |
| `seed` | `INT64` | Random seed | Any integer | No | Simulation initial RNG seed. |
| `policies` | `STRING` | JSON string | Valid JSON | No | Serialized active policy toggles. |

---

### 2.2 Trips Table (`trips.parquet`)
Records mobility origin-destination movements across the simulation road and transit network.

| Field | Type | Unit / Format | Valid Range | Nullable | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `trip_id` | `STRING` | Prefixed UUID | Non-empty | No | Unique trip movement identifier. |
| `citizen_id` | `STRING` | Citizen ID | Non-empty | No | Traveling citizen identifier. |
| `origin_id` | `STRING` | Road/Node ID | Non-empty | No | Trip origin graph node. |
| `destination_id`| `STRING` | Road/Node ID | Non-empty | No | Trip destination graph node. |
| `mode` | `STRING` | Categorical | `walking`, `bicycle`, `transit`, `car` | No | Selected transportation mode. |
| `departure_time`| `FLOAT` | Clock hour | $[0.0, 24.0)$ | No | Hour of trip departure. |
| `travel_time` | `FLOAT` | Sim-minutes | $[0.0, 300.0]$ | No | Duration of travel along shortest path. |
| `cost` | `FLOAT` | GRC currency | $[0.0, 100.0]$ | No | Monetary transit fare or fuel/toll cost. |
| `world_id` | `STRING` | Simulation ID | Non-empty | No | Source world identifier. |
| `tick` | `INT64` | Integer steps | $[0, \infty)$ | No | Simulation step index. |
| `seed` | `INT64` | Random seed | Any integer | No | Simulation initial RNG seed. |

---

### 2.3 Incidents Table (`incidents.parquet`)
Records road collisions, infrastructure failures, and emergency dispatch events.

| Field | Type | Unit / Format | Valid Range | Nullable | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `incident_id` | `STRING` | Prefixed UUID | Non-empty | No | Unique incident event identifier. |
| `type` | `STRING` | Categorical | `traffic`, `fire`, `medical`, `crime`, `infrastructure` | No | Incident classification category. |
| `severity` | `INT32` | Integer scale | $1, 2, 3$ | No | 1 = Fatal/Catastrophic, 2 = Serious, 3 = Slight. |
| `location_x` | `FLOAT` | Grid coord | $[0.0, \text{grid\_size}]$ | No | Cartesian X coordinate of incident. |
| `location_y` | `FLOAT` | Grid coord | $[0.0, \text{grid\_size}]$ | No | Cartesian Y coordinate of incident. |
| `response_time` | `FLOAT` | Sim-minutes | $[0.0, 120.0]$ | No | Emergency dispatch travel latency. |
| `casualties` | `INT32` | Headcount | $[0, 50]$ | No | Number of injured or deceased individuals. |
| `world_id` | `STRING` | Simulation ID | Non-empty | No | Source world identifier. |
| `tick` | `INT64` | Integer steps | $[0, \infty)$ | No | Simulation step index. |
| `seed` | `INT64` | Random seed | Any integer | No | Simulation initial RNG seed. |

---

### 2.4 Demographic Events Table (`demographics.parquet`)
Records discrete vital demographic state transitions.

| Field | Type | Unit / Format | Valid Range | Nullable | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `event_id` | `STRING` | Prefixed UUID | Non-empty | No | Unique demographic event identifier. |
| `event_type` | `STRING` | Categorical | `birth`, `death`, `immigration`, `emigration` | No | Vital event classification. |
| `age` | `FLOAT` | Simulated years | $[0.0, 120.0]$ | No | Age at event occurrence (0.0 for births). |
| `cause` | `STRING` | Categorical | `natural`, `disease`, `accident`, `violence`, `starvation` | Yes | Cause of mortality (for death events). |
| `world_id` | `STRING` | Simulation ID | Non-empty | No | Source world identifier. |
| `tick` | `INT64` | Integer steps | $[0, \infty)$ | No | Simulation step index. |
| `seed` | `INT64` | Random seed | Any integer | No | Simulation initial RNG seed. |

---

### 2.5 City Metrics Table (`city_metrics.parquet`)
Records macroeconomic, environmental, and civic stability aggregates.

| Field | Type | Unit / Format | Valid Range | Nullable | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `tick` | `INT64` | Integer steps | $[0, \infty)$ | No | Simulation step index. |
| `population` | `INT64` | Citizen count | $[0, 10^8]$ | No | Total living population. |
| `gdp` | `FLOAT` | GRC currency | $[0.0, \infty)$ | No | Gross Domestic Product / Economic Yield. |
| `gini` | `FLOAT` | Index ratio | $[0.0, 1.0]$ | No | Gini coefficient of wealth concentration. |
| `happiness` | `FLOAT` | Normalized score | $[0.0, 1.0]$ | No | Aggregate citizen life satisfaction. |
| `pollution` | `FLOAT` | Normalized score | $[0.0, 1.0]$ | No | Environmental air and ground pollution. |
| `civic_stability`|`FLOAT` | Normalized score | $[0.0, 1.0]$ | No | Social harmony and civic peace index. |
| `average_health`| `FLOAT` | Normalized score | $[0.0, 1.0]$ | No | Population mean physical health. |
| `average_education`|`FLOAT`| Normalized score | $[0.0, 1.0]$ | No | Population mean educational attainment. |
| `traffic_congestion`|`FLOAT`| Ratio | $[0.0, 1.0]$ | No | Average road segment volume-to-capacity ratio. |
| `world_id` | `STRING` | Simulation ID | Non-empty | No | Source world identifier. |
| `seed` | `INT64` | Random seed | Any integer | No | Simulation initial RNG seed. |
| `policies` | `STRING` | JSON string | Valid JSON | No | Serialized active policy configuration. |
