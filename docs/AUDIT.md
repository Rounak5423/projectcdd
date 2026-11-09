# GENESIS Engine: Master Forensic Audit & Remediation Plan

**Document:** `docs/AUDIT.md`  
**Date:** November 9, 2026  
**Auditor:** Principal Simulation Architect, Backend/ML Engineer & 3D Frontend Engineer  
**Status:** PHASE 0 COMPLETED — EMPIRICAL CODE & RUNTIME AUDIT (NO PRODUCTION EDITS MADE YET)  
**Baseline Test Execution Results:**
- `npm run build`: **Passed** (3,611 modules in 1.69s)
- Pytest Backend: **95 / 95 Passed** in 2.40s
- Live Requirements: **21 / 21 Passed** in 0.95s
- Playwright E2E: **7 / 7 Passed** in 1.1m

---

## Executive Summary

While all existing automated tests pass their local assertions, an exhaustive forensic inspection of the codebase reveals fundamental architectural divergences between claimed capabilities and actual implementation. The simulation currently operates with split sources of truth, disconnected frontend-only features, ungrounded visual overlays, unscaled demographic equations, and security vulnerabilities.

This audit provides concrete code citations, runtime evidence, severity ratings, and exact fix plans for all 14 core architectural issues to guide the subsequent implementation phases.

---

## Forensic Audit of Suspected Issues

### 1. Split Population Provenance (Multiple Conflicting Sources of Truth)
- **Severity:** `CRITICAL`
- **Files & Lines:**
  - `genesis-engine/backend/engine/simulation.py:422, 493`
  - `genesis-engine/backend/engine/causal/engine.py:237`
  - `genesis-engine/backend/engine/world/simulation.py:446, 488`
  - `genesis-engine/backend/db/database.py:45-70` (`citizens` table)
- **Forensic Evidence:**
  1. In `engine/causal/engine.py` line 237, population is updated as an integer scalar counter:
     ```python
     new_population = max(0, population + births - total_deaths)
     ```
     which is written to `economy_resources.population` in `engine/simulation.py:493`.
  2. Simultaneously, in `engine/world/simulation.py` line 446:
     ```python
     derived_population = max(100, total_occupants)
     ```
     where `total_occupants = sum(b.current_occupants for b in active_buildings)`.
  3. Meanwhile, the `citizens` table in SQLite holds a static seeded list of individual agent rows (only 40 to 432 rows), completely decoupled from `derived_population` or `new_population`.
- **Impact:** Adding or zoning residential buildings increases building capacity, but does not spawn citizen agent rows in SQLite. Conversely, deaths in the causal engine decrement the scalar counter without removing any rows from `citizens` or vacating building residential slots.
- **Fix Plan (Phase 1 & 2):**
  - Establish `citizens` table as the **single source of truth** for population.
  - Every citizen entity must possess a unique ID, demographic traits, `home_building_id`, and `work_building_id`.
  - `derived_population = SELECT COUNT(*) FROM citizens WHERE is_alive = 1 AND world_id = ?`.
  - Births instantiate new citizen rows assigned to households; deaths mark citizen rows `is_alive = 0` and unbind their home/job slots.

---

### 2. Time-Scale & Rate Conversion Anomaly (Missing Daily /365 Scaling)
- **Severity:** `HIGH`
- **Files & Lines:**
  - `genesis-engine/backend/engine/causal/engine.py:155, 175, 196`
  - `genesis-engine/backend/engine/simulation.py:371-384`
- **Forensic Evidence:**
  1. In `engine/causal/engine.py` lines 175 and 196:
     ```python
     raw_births = population * cbr_rate * dt * fertility_modifier
     baseline_aging_deaths = int(round(population * cdr_rate * dt * ml_hazard_multiplier))
     ```
     where `cbr_rate = 14.5 / 1000.0 = 0.0145` (annual) and `dt = 1.0 / 365.0`.
  2. For a city of population $P = 432$:
     $$\text{raw\_births} = 432 \times 0.0145 \times \frac{1}{365} = 0.01716$$
     $$\text{births} = \text{int}(\text{round}(0.01716)) = 0$$
  3. Because births and natural deaths are truncated to integers every daily tick without a persistent fractional probability accumulator, cities with population below ~15,000 experience **exactly zero births and zero natural deaths** on every tick.
  4. In `engine/simulation.py` lines 371-384:
     ```python
     time_factor = (ticks * days_per_tick) / 30.0
     food_prod = econ["food_rate"] * time_factor * 10.0
     ```
     Arbitrary multipliers (`/ 30.0 * 10.0`) conflate monthly rates with daily ticks.
- **Impact:** Simulation population remains completely static unless catastrophic mass starvation or thirst occurs.
- **Fix Plan (Phase 1 & 3):**
  - Implement a persistent fractional accumulator (`birth_pool`, `death_pool`) or evaluate stochastic Poisson/Binomial draws per citizen agent:
    $$P(\text{event per day}) = 1 - (1 - \text{Rate}_{\text{annual}})^{1/365}$$
  - Standardize all database rates to explicit annual or daily SI units.

---

### 3. Flawed Undo Engine (Absolute State vs. Delta Reversal & Exploitable Refunds)
- **Severity:** `HIGH`
- **Files & Lines:**
  - `genesis-engine/backend/engine/world/commands.py:500-524`
  - `src/context/GameStateContext.tsx:470-510`
- **Forensic Evidence:**
  1. In `src/context/GameStateContext.tsx`:
     ```typescript
     const previous = historyStack[historyStack.length - 1];
     setPlacedBuildings(previous.placedBuildings);
     setZonedTiles(previous.zonedTiles);
     setResources(previous.resources);
     ```
     The frontend restores an absolute snapshot of previous resources, clobbering any simulation economic gains that occurred during the interval.
  2. In `engine/world/commands.py` line 521:
     ```python
     conn.execute("UPDATE economy_resources SET materials = MAX(0.0, materials - ?) WHERE world_id = ?", (cost_refund, world_id))
     ```
     Demolishing grants a 70% refund. If the player spends the refunded materials immediately and then invokes Undo, the deduction is clamped at `MAX(0.0, ...)`, allowing infinite material generation exploits.
  3. When a building is demolished, its occupants and workers are evicted. Undoing demolition restores the building row in SQL, but does not re-assign evicted citizens to their prior home/job slots.
- **Impact:** Economic exploits and corrupted entity foreign keys upon undo.
- **Fix Plan (Phase 1):**
  - Transition undo from snapshots to **strict inverse-delta operations** stored in SQLite `undo_stack` table.
  - Require that undoing a demolition verifies treasury funds; if insufficient, the undo command is rejected.
  - Restore citizen occupancy bindings atomically in the same SQL transaction.

---

### 4. Protest Threshold Lacks Hysteresis & Has No Concrete Downstream Penalties
- **Severity:** `HIGH`
- **Files & Lines:**
  - `genesis-engine/backend/engine/causal/engine.py:285-322`
- **Forensic Evidence:**
  1. In `engine/causal/engine.py` line 285:
     ```python
     if grievance > self.config.grievance_protest_threshold: # 0.42
         # Escalation
     else:
         # De-escalation
     ```
     If grievance fluctuates around 0.42 (e.g. 0.421 then 0.419), protests violently switch between escalation and decay on alternating ticks with zero inertia or hysteresis.
  2. The only downstream effect of protest intensity is:
     ```python
     new_stability = max(0.08, civic_stability - (new_protest_intensity * 0.08 * days))
     ```
     Protests have **zero effect** on factory/commercial productivity, zero effect on municipal service budgets, zero disruption to traffic or public transit, and zero impact on tax collection.
- **Impact:** Protests feel cosmetic and superficial; they do not threaten the city's operational viability.
- **Fix Plan (Phase 3):**
  - Implement a dual-threshold Schmitt trigger / hysteresis loop: ignition at $G \ge 0.48$, de-escalation only when $G \le 0.32$.
  - Couple protest intensity directly to industrial/commercial output (strikes: $-(0.5 \times \text{intensity})$ productivity), municipal service disruption, and increased police budget requirements.

---

### 5. Unbounded Cognitive Skill Equation, Undefined $\eta$, and Disconnected Outcomes
- **Severity:** `MEDIUM`
- **Files & Lines:**
  - `genesis-engine/backend/engine/cognitive.py:5-69`
  - `genesis-engine/backend/engine/simulation.py:803-809`
- **Forensic Evidence:**
  1. `REPORT.md` claims:
     $$\text{Skill}_{t+1} = \text{Skill}_t \cdot (1 - \delta_{\text{atrophy}} \cdot \text{AI\_Reliance}) + \eta \cdot \text{Cognitive\_Friction}$$
  2. In `engine/cognitive.py`, $\eta$ is nowhere defined as a configurable parameter. Scaffolding reinforcement is hardcoded as:
     ```python
     reinforcement = 0.004 * S * dt
     ```
  3. `update_citizen_cognition` is called only inside `step_world` (the test scenario runner). In `advance_world_simulation` (the live SQLite-backed server tick), citizen cognition is **never updated**.
  4. The calculated `Macro Innovation Index` is never fed into technology tree research speed, advisor decision quality, or worker productivity.
- **Impact:** The AI Dependency Paradox cognitive science framework is disconnected from live gameplay.
- **Fix Plan (Phase 3):**
  - Formalize the cognitive formula with explicit, bounded parameters ($\delta \in [0.01, 0.05], \eta \in [0.01, 0.05]$).
  - Call cognition updates on database citizens during the authoritative tick.
  - Wire the Macro Innovation Index to research point generation ($+25\%$ research speed at high cognitive health) and high-tech commercial yields.

---

### 6. Machine Learning Hierarchy Inconsistencies, Circular Synthetic Data & Pseudo-MPC
- **Severity:** `HIGH`
- **Files & Lines:**
  - `genesis-engine/backend/ml/control/controller.py:125-185`
  - `genesis-engine/backend/ml/inference/registry.py:20-280`
  - `genesis-engine/backend/ml/generate/run_scenarios.py:1-120`
- **Forensic Evidence:**
  1. In `ml/control/controller.py` lines 148-175 (`SurrogateMPCController`):
     ```python
     for _ in range(self.num_candidates): # 24 random samples
         cand_tax = round(float(self.rng.uniform(0.10, 0.32)), 3)
         ...
         x_in = np.array([[pop_norm, gdp_norm, gini, wellbeing, pollution, 1.0]])
         pred_delta = self.surrogate_model.predict(x_in)[0]
     ```
     The candidate policy values (`cand_tax`, `cand_health`, etc.) are **not even passed into the surrogate model** (`x_in` is identical for every candidate). It is purely random sampling with static hand-crafted penalty math, not a receding-horizon Model Predictive Controller.
  2. All behavioral models (routine, mode choice, incident risk) were trained on Parquet data generated by `run_scenarios.py` using GENESIS's own rule-based heuristic logic, creating circular self-reinforcement without empirical real-world validation.
  3. `ML_ENABLED` defaults to `false`. When enabled, model outputs are clipped to tight heuristic bounds, rendering ML predictions cosmetic.
- **Impact:** Misleading claims of AI control; surrogate MPC does not optimize policy dynamics.
- **Fix Plan (Phase 3):**
  - Implement a genuine multi-step receding horizon controller with policy actions explicitly in the input state vector.
  - Formally document synthetic data origin and calibrate baseline parameters against empirical municipal datasets (OECD / UN WPP).
  - Standardize naming into 5 clear tiers: Micro (Agent), Meso (Safety/Grid), Demographics (Mortality), Macro (Trajectory), Meta (Optimization).

---

### 7. Cosmetic 3D Overlays Without Backing Models & Euclidean Utility Radius
- **Severity:** `HIGH`
- **Files & Lines:**
  - `src/components/world3d/CS2ZoningAndInfoView3D.tsx:183-265`
  - `genesis-engine/backend/engine/world/utility_network.py:61-66`
- **Forensic Evidence:**
  1. In `CS2ZoningAndInfoView3D.tsx`, overlays for crime, healthcare, education, transit, and noise display static hardcoded labels on all buildings regardless of position:
     - Crime: `🛡️ PATROL: 98% SECURE`
     - Healthcare: `❤️ CLINIC ACCESS / 82 YR`
     - Education: `🎓 ACADEMY COGNITIVE SHIELD`
     - Transit: `🚌 TRANSIT STOP: 5 MIN`
     - Noise: `🔊 58 dB AMBIENT`
     - Unemployment: `💼 JOBS: 91% SATURATED`
  2. In `utility_network.py` lines 61-66, grid connection is determined by Euclidean distance between buildings (`dist <= 35.0` tiles) rather than graph traversal over physical electrical transmission lines or water pipe segments. Sewage is completely absent.
- **Impact:** Misleads the player into thinking complex service grids exist when every building shows identical fake values.
- **Fix Plan (Phase 1 & 2):**
  - Implement real 2D spatial diffusion fields for noise, air pollution, and crime originating from highway links, industrial parcels, and police stations.
  - Implement physical utility networks (substations, high-voltage lines, water mains, sewage pipes) as edge graphs with explicit flow capacity.
  - Wire overlays to query live cell-level grid values from the backend.

---

### 8. Disasters, Weather & Emergency Dispatch Exist Exclusively in Frontend Memory
- **Severity:** `HIGH`
- **Files & Lines:**
  - `src/simulation/disasterSimulationEngine.ts:1-326`
  - `src/components/dashboard/DisasterManagementDashboard.tsx:1-636`
  - `src/components/world3d/DisasterVisualEffects.tsx:1-237`
  - `genesis-engine/backend/engine/simulation.py:743` (weather is static `"Clear"`)
- **Forensic Evidence:**
  1. The backend API and database contain zero tables, endpoints, or state fields for natural disasters, emergency forces, containment progress, or structural damage.
  2. `src/simulation/disasterSimulationEngine.ts` maintains its own client-side disaster loop in React context. When the user reloads the browser, all active disasters, damage, and deployed units instantly disappear.
  3. Weather changes in `WeatherSystem.tsx` do not affect solar power generation, road traction, or citizen mode choice on the server.
- **Impact:** Disasters are a client-only mini-game with zero persistence or backend economic consequence.
- **Fix Plan (Phase 2):**
  - Add `disasters` and `weather_state` tables in SQLite.
  - Expose backend endpoints: `POST /worlds/{id}/disasters/trigger`, `POST /worlds/{id}/emergency/dispatch`.
  - Simulate disaster spread, building damage, and emergency unit arrival on the server; weather state modifies solar power output and road friction server-side.

---

### 9. Traffic Congestion Decoupled from Trip Generation & Temporal Scale Mismatch
- **Severity:** `HIGH`
- **Files & Lines:**
  - `genesis-engine/backend/engine/world/simulation.py:385-391`
  - `genesis-engine/backend/engine/world/road_network.py:165-180`
  - `src/components/world3d/VehiclesSystem.tsx:45-65`
- **Forensic Evidence:**
  1. In `engine/world/simulation.py` lines 387-390:
     ```python
     pseudo_seg = f"seg_active_{v.id}"
     traffic_counts[pseudo_seg] = traffic_counts.get(pseudo_seg, 0) + 1
     self.road_network.update_congestion_from_traffic(traffic_counts)
     ```
     `pseudo_seg` (`seg_active_veh_001`) does not match any valid segment ID in `self.road_network.segments`. Consequently, `update_congestion_from_traffic` updates zero actual road edges.
  2. There is no origin-destination (OD) trip generation matrix. Citizens do not commute between residential buildings and workplaces.
  3. Temporal mismatch: The simulation advances by 1 day per tick, but 3D vehicles animate in real-time seconds along hardcoded spline loops.
- **Impact:** Road traffic congestion metrics are dummy numbers and do not reflect actual city layout or road network bottlenecks.
- **Fix Plan (Phase 1 & 2):**
  - Implement agent-based daily commute scheduling: citizen agents generate trips from `home_id` to `work_id` at peak hours.
  - Assign vehicle volumes to actual road segment IDs using A* shortest path.
  - Calculate real V/C ratios and BPR congestion delays feeding travel times and citizen happiness.

---

### 10. Database Missing Fundamental Relational Infrastructure
- **Severity:** `HIGH`
- **Files & Lines:**
  - `genesis-engine/backend/db/database.py:35-180`
  - `genesis-engine/backend/db/migrations.py:1-250`
- **Forensic Evidence:**
  1. `citizens` table lacks foreign keys: no `household_id`, `home_building_id`, or `work_building_id`.
  2. Missing tables:
     - `utility_nodes` and `utility_edges` (power cables, water mains, sewage pipes).
     - `service_facilities` (police stations, fire stations, clinics, schools, garbage depots).
     - `transit_lines` and `transit_stops` (bus routes, stops, schedules).
     - `disasters` (active disaster state, epicenter, containment).
     - `council_votes` (advisor votes, rationale, timestamps).
     - `grc_transactions` (audit ledger for all credit debits/credits).
     - `undo_stack` (persistent command reversal stack).
  3. Worlds lack enforced user ownership: any authenticated user can mutate any world ID.
- **Impact:** Inability to persist complex urban networks, service coverage, or disaster recovery states across sessions.
- **Fix Plan (Phase 4):**
  - Author formal SQL migration scripts (`003_unified_entities.sql`) adding all missing tables with foreign keys and cascading deletes.
  - Enforce user world ownership checks across all endpoints.

---

### 11. SQLite Concurrency Bottleneck & Non-Atomic GRC Credit Deductions
- **Severity:** `CRITICAL`
- **Files & Lines:**
  - `genesis-engine/backend/api/v1/scenarios.py:85-104`
  - `genesis-engine/backend/db/database.py:15-30`
- **Forensic Evidence:**
  1. In `api/v1/scenarios.py` lines 86-103:
     ```python
     prog = conn.execute("SELECT grc_balance FROM progression WHERE world_id = ?", (req.world_id,)).fetchone()
     if not prog or prog["grc_balance"] < credit_cost:
         raise HTTPException(status_code=402, ...)
     ...
     conn.execute("UPDATE progression SET grc_balance = grc_balance - ? WHERE world_id = ?", (credit_cost, req.world_id))
     ```
     This check-then-act pattern allows concurrent requests to race and drive balances into negative numbers.
  2. SQLite defaults to a single writer lock. Under concurrent simulation steps, WebSocket broadcasts, and API requests, write queries throw `sqlite3.OperationalError: database is locked`.
- **Impact:** Financial race conditions and API deadlocks under moderate load.
- **Fix Plan (Phase 4):**
  - Implement atomic credit deduction:
    ```sql
    UPDATE progression SET grc_balance = grc_balance - :cost 
    WHERE world_id = :id AND grc_balance >= :cost;
    ```
    Verify `cursor.rowcount == 1`, otherwise raise HTTP 402.
  - Configure SQLite with `PRAGMA busy_timeout = 5000;`, WAL mode, and connection pooling / serial queue for writes.

---

### 12. Security Deficits: Weak PBKDF2 Iterations, Hardcoded Secrets, In-Memory Rate Limiting & Unauthenticated WebSockets
- **Severity:** `CRITICAL`
- **Files & Lines:**
  - `genesis-engine/backend/auth/security.py:9, 21`
  - `genesis-engine/backend/auth/security.py:15-35`
  - `genesis-engine/backend/main.py:98-100, 460-500`
  - `genesis-engine/backend/api/v1/auth.py:15-30`
- **Forensic Evidence:**
  1. `hash_password` uses 100,000 PBKDF2 iterations. OWASP recommends $\ge 600,000$ iterations for PBKDF2-HMAC-SHA256.
  2. Hardcoded fallback secret: `JWT_SECRET_KEY = os.environ.get("GENESIS_JWT_SECRET", "genesis_super_secret_jwt_key_2026_dev")`.
  3. `CORSMiddleware` allows `allow_origins=["*"]` unconditionally.
  4. The WebSocket route `/ws/world/{world_id}` in `main.py` performs **no JWT authentication check**. Anyone can connect and dispatch tick commands.
  5. The login rate limiter in `api/v1/auth.py` stores failed attempts in an in-memory dictionary `_failed_login_attempts`, which is lost on server restart and fails in multi-process deployments.
- **Impact:** Susceptibility to brute-force credential stuffing, token forgery, unauthorized WebSocket manipulation, and CORS attacks.
- **Fix Plan (Phase 6):**
  - Upgrade password hashing to PBKDF2 with 600,000 iterations (or argon2id) with automatic hash upgrade on login.
  - Require `GENESIS_JWT_SECRET` in production; refuse startup if default secret is present in production mode.
  - Require JWT token query parameter or protocol header on WebSocket connection (`/ws/world/{id}?token=...`).
  - Restrict CORS origins via environment variable. Store rate-limit counters in SQLite or Redis.

---

### 13. Frontend Broken Buttons, Cosmetic Modals & Client-Invented Numbers
- **Severity:** `HIGH`
- **Files & Lines:**
  - `src/components/cs2/CS2BudgetModal.tsx:61, 82-105`
  - `src/services/civilizationApi.ts:150-285`
- **Forensic Evidence:**
  1. In `src/components/cs2/CS2BudgetModal.tsx`, municipal debt and bonds are managed via local React state:
     ```typescript
     const [municipalDebt, setMunicipalDebt] = useState(15000);
     const handleIssueBond = (amount: number) => {
       setMunicipalDebt((prev) => prev + amount);
       ...
     }
     ```
     Bonds do not deposit funds into treasury, do not deduct interest on the server, and do not persist in SQLite.
  2. In `src/services/civilizationApi.ts`, 13 different endpoints catch network or HTTP errors and silently return `{ success: true, isFallback: true }`, masking broken routes and missing backend tables.
- **Impact:** Players perform actions that appear successful in the UI but have zero actual effect on the simulation.
- **Fix Plan (Phase 5):**
  - Create dedicated backend endpoints for municipal loans (`POST /worlds/{id}/bonds/issue`, `POST /worlds/{id}/bonds/repay`).
  - Remove silent fake fallback catches in `civilizationApi.ts`; properly bubble errors to React error boundaries or user toast alerts.

---

### 14. Documentation Deficits & Uncompressed Heavy 3D Assets
- **Severity:** `MEDIUM`
- **Files & Lines:**
  - `PROJECT_MASTER_STATUS_REPORT.md:60-75`
  - `REPORT.md:761`
  - `public/models/council/` (`real_undead_wizard.glb` is 80 MB, `real_carl_manfred.glb` is 20 MB)
- **Forensic Evidence:**
  1. Documentation files contain machine-specific absolute file links (`file:///Users/rangasamudramdivyamsh/...`), which break on all other developer machines and in GitHub rendering.
  2. In `public/models/council/`, uncompressed raw GLB models cause GitHub warnings during git push (80.01 MB file size) and high GPU memory usage during chamber loading.
  3. `public/models/council/manifest.json` lacks open-source licensing metadata or attribution for downloaded character assets.
- **Impact:** Repository bloat, slow page load times, and broken markdown links.
- **Fix Plan (Phase 5 & Docs):**
  - Replace all absolute `file:///` links across all markdown documentation with clean relative repository paths.
  - Compress GLB models using Draco geometry compression and KTX2 texture optimization, reducing file sizes by >70%.
  - Verify and document asset licenses in `manifest.json`.

---

## Remediation Roadmap by Phase

| Phase | Core Objective | Key Deliverables |
| :--- | :--- | :--- |
| **Phase 1: Architecture** | Single Source of Truth & Command Pipeline | Establish citizens as single population source; implement inverse-delta undo engine; unify time-step conversions. |
| **Phase 2: CS2 Depth** | Real Cities: Skylines II Simulation Dynamics | RCI zoning demand model; physical utility networks; spatial diffusion for noise/crime/pollution; backend disasters. |
| **Phase 3: Causal & ML** | Mathematical Rigor & Honest AI | Dual-threshold protest hysteresis; bounded cognitive skill model; true receding-horizon MPC policy optimization. |
| **Phase 4: Database** | Relational Integrity & Atomicity | Database migrations for utility edges, service facilities, and disasters; atomic GRC transactions; SQLite WAL tuning. |
| **Phase 5: Frontend** | Wire Dead Controls & Optimize 3D Assets | Wire budget/bond modals to backend; remove silent fallback catches; Draco-compress GLBs; error boundaries. |
| **Phase 6: Security & Ops** | Production Hardening | PBKDF2 600k iterations; authenticated WebSockets; strict CORS; per-user world ownership validation. |
| **Phase 7: Tests** | Rigorous Verification | Property tests for conservation laws; 1000-tick soak test; full Playwright E2E coverage; produce `docs/FINAL_REPORT.md`. |

---

*Forensic audit certified by Principal Simulation Architect & Systems Engineer on November 9, 2026.*

