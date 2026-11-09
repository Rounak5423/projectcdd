# GENESIS Engine: Subsystem Coupling & Dependency Audit Map

**Document Version:** 1.0.0  
**Audit Date:** November 9, 2026  
**Status:** FORENSIC DIAGNOSTIC COMPLETED — IDENTIFIED DISCONNECTED SUBSYSTEMS & ZERO-DEATH ANOMALY  

---

## 1. Executive Dependency Graph & Coupling Status

The simulation currently operates with **severely decoupled and siloed subsystems**, where vital human lifecycle, emergency infrastructure, resource deprivation, and civil unrest dynamics do not form causal feedback loops.

```
CURRENT (DISCONNECTED) ARCHITECTURE:
[Resource Deprivation (Food=0, Water=0)] ---> [Arbitrary Happiness -0.03]   (NO HEALTH / MORTALITY IMPACT)
[Healthcare Facilities (Hospitals)] --------> [Static Database Row]         (NO BED OCCUPANCY / ADMISSION DYNAMICS)
[Citizen Aging / Life-cycle] ---------------> [Isolated Net Growth Mult]   (ZERO TICK DEATHS LOGGED)
[Incidents / Accidents] --------------------> [Synthetic Event String]     (NO CASUALTY HOSPITALISATION)
[High Unrest (Stability < 0.20)] -----------> [No-op / Silent Ledger]      (ZERO PROTESTS OCCURRING)
```

---

## 2. Field Read/Write Dependency Matrix

| Subsystem Module | Fields Written | Fields Read | Coupled Downstream? | Status / Disconnection Defect |
| :--- | :--- | :--- | :--- | :--- |
| **Resources & Utilities** (`engine/simulation.py`) | `food`, `water`, `energy`, `materials` | `population`, `food_rate`, `water_rate`, `energy_rate` | ❌ Partial | When food/water/power hit 0.0, it only subtracts a small static constant from `happiness`. **Never impairs health, never causes illness, never raises mortality.** |
| **Public Health & Healthcare** (`engine/simulation.py`, `models.py`) | Building records (`bld_hospital_1`) | None | ❌ **DEAD SYSTEM** | Hospital buildings exist in database with `health_bonus: 0.08`, but **bed occupancy, admissions, emergency ambulance load, and capacity overload are NEVER tracked or read.** |
| **Vital Statistics & Mortality** (`engine/simulation.py`) | `population` (via growth multiplier) | `population_growth_rate` | ❌ **BROKEN** | `new_population` is computed via `population * (1 + growth_rate)^t`. **Deaths are NEVER subtracted per tick. Cumulative deaths stay at 0.** |
| **Incident & Emergency Engine** (`engine/simulation.py`) | `events` (category: traffic) | `speed_limit`, `road_type` | ❌ **DISCONNECTED** | Generates synthetic incident events, but **casualties never enter hospitals, never consume medical capacity, and never produce citizen grief or deaths.** |
| **Citizen Needs & Cognition** (`engine/cognitive.py`) | `independent_reasoning`, `ai_dependency` | `ai_coverage`, `scaffolding` | ⚠️ Isolated | Only affects cognitive score; **never feeds into civic unrest, dissatisfaction, or strikes.** |
| **Social Unrest & Protests** (`engine/simulation.py`) | None | None | ❌ **COMPLETELY MISSING** | The backend simulation engine contains **zero logic to trigger or resolve protests.** Even with 90% unrest, protest intensity remains strictly 0.0. |
| **Municipal Governance** (`api/v1/policies.py`) | `policies.is_active` | None | ❌ Open Loop | Policy changes do not causally respond to protests, hospital collapses, or famine. |

---

## 3. Disconnected Fields Inventory

### A. Fields Written But Never Read by Any Other System
1. `economy_resources.pollution`: Updated in periodic snapshots, but never read to increase respiratory illness, hospital demand, or mortality.
2. `buildings.capacity` (Hospital capacity): Static building capacity (1,500 beds) is stored in the database but **never checked against patient admissions.**
3. `citizens.is_alive`: In `perform_yearly_aggregation`, `is_alive` is flipped to `0` for citizens $>88$ years, but this value is **never aggregated back into `economy_resources.population` or municipal death registers.**
4. `events` (incident casualties): Recorded in JSON text payloads, but never read by demographic, health, or economic accounting.

### B. Systems That Never Read Upstream Outputs
1. **Mortality System:** Never reads `health`, `unmet_needs`, `pollution`, or `hospital_bed_occupancy`.
2. **Protest System:** Does not exist in simulation loop; never reads `unemployment`, `gini`, `shortages`, or `recent_deaths`.
3. **Hospital Admissions:** Never reads traffic incident casualties or disease outbreaks.
4. **Economic Production:** Never reads protest strike disruptions or worker illness rates.

---

## 4. Root Causes Ranked by Impact

### Rank 1: Authoritative Tick Uses Pure Net Compounding (Zero-Death Root Cause)
- **Root Cause:** In `advance_world_simulation` (lines 366–369 of `engine/simulation.py`), population is updated as:
  $$\text{Population}_{t+1} = \text{Population}_t \times (1 + r_{\text{net}})^{\Delta t}$$
  There is **no separation of births and deaths.** Deaths are neither calculated nor subtracted per tick.
- **Evidence:** Running 60 ticks in `ml/diagnostics/trace_run.py` results in `total_deaths_observed = 0` and population monotonically increasing from 6,657,347 to 6,683,195.

### Rank 2: Total Absence of Hospital Occupancy & Disease Dynamics
- **Root Cause:** Hospital buildings exist only as static database entities. There is no state variable for active patients, bed capacity utilisation, or treatment capacity.
- **Evidence:** `hospital_admissions` and `bed_occupancy_pct` are missing columns in `economy_resources`. Overcrowding failure modes (where lack of beds causes preventable deaths) do not exist.

### Rank 3: Resource Deprivations Do Not Propagate to Health or Mortality
- **Root Cause:** When food, water, or energy drop to $0.0$, line 407 of `engine/simulation.py` only applies:
  $$\text{happiness} \leftarrow \max(0.05, \text{happiness} - 0.015)$$
- **Evidence:** Citizens never starve, dehydrate, or freeze. Health and mortality hazard remain completely unaffected by zero-food conditions.

### Rank 4: Civil Protests Are Purely Frontend Mock Data Without Backend Engine
- **Root Cause:** The backend simulation has no protest calculation or event generation. The frontend previously rendered static mocks from `src/data/protestData.ts`.
- **Evidence:** When civic stability fell to 0.10 (90% unrest), `protest_intensity` remained 0.0 and zero protest events were emitted to the database or WebSocket.

---

## 5. Target Causally Coupled Architecture (Phase 2 Target)

The fixed, documented execution sequence per tick:

```
[1. Basic Needs & Utilities] (Food, Water, Energy, Shelter)
           │
           ▼ (Unmet Need Deficits)
[2. Environmental Quality & Pollution]
           │
           ▼ (Exposure Multiplier)
[3. Health, Chronic Disease & Epidemics]
           │
           ▼ (Patient Load)
[4. Incidents, Accidents & Hazards]
           │
           ▼ (Emergency Demand)
[5. Hospitals & Emergency Services] (Bed Occupancy, Triage Capacity, Overload)
           │
           ▼ (Treatment Deficit)
[6. Mortality & Demographics] (Gompertz Baseline × Health × Needs × Hospital Overcrowding)
           │
           ▼ (Deaths & Injuries)
[7. Macro Economy & Labor Force] (Productivity, Employment, Treasury)
           │
           ▼ (Grievance & Poverty)
[8. Citizen Satisfaction & Trust] (Happiness, Trust in Government)
           │
           ▼ (Escalation Threshold)
[9. Civil Unrest & Protests] (Strike Disruption, Policy Pressure, Riot Intensity)
           │
           ▼ (Feedback & Budget Allocation)
[10. Governance & Policy Intervention] ───► Feeds back into [1. Needs & Hospital Budgets]
```

