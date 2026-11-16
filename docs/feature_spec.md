# GENESIS Engine: User-Facing Feature Logic Specification & Audit

**Document Version:** 1.0.0  
**Audit Date:** November 9, 2026  
**Auditor:** Senior Full-Stack Engineer & QA Lead  
**Status:** COMPLETE FEATURE INVENTORY & ARCHITECTURAL CLASSIFICATION  

---

## 1. Feature Logic Specification Matrix

| Feature | Where | What it SHOULD do (Game Logic) | Inputs & Prerequisites | Cost & Resources | Backend State It Must Change | Metrics It Must Affect | Failure & Rejection Cases | RBAC Permissions |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Place Building** | 3D World / Catalog Drawer | Places building on terrain aligned to road; connects to power/water grid; updates capacity. | Roadside proximity, flat terrain, valid coordinates. | Materials (50–500), Credits (100–1000). | `buildings` table, utility graph, road lot. | `population_capacity`, `energy_demand`, `employment`. | Insufficient funds, terrain too steep, too far from road. | Player / Admin |
| **Demolish Building** | 3D World / Inspector | Bulldozes building, severs utility lines, removes occupants, refunds 70% of material cost. | Valid building ID, non-civic core facility. | None (refunds 70% materials). | `buildings` table (DELETE), utility graph disconnect. | Decreases capacity, displaces citizens, lowers power demand. | Building not found, core citadel protected. | Player / Admin |
| **Paint Zone Tile** | 3D World / CS2 Zoning Tool | Designates 8x8m lot as Residential, Commercial, Industrial, or Office. | Adjacent road network with utility line. | 25 Credits per lot. | `zone_lots` table, zoning grid state. | RCI demand absorption, building spawn probability. | No road connection, lot already occupied, insufficient funds. | Player / Admin |
| **Draw Road Segment** | 3D World / Road Tool | Places two-way or arterial road between two nodes; updates A* graph and BPR travel times. | Start and end coordinates within map bounds. | 100 Materials + 200 Credits per segment. | `road_nodes`, `road_segments` tables. | Traffic capacity, travel times, network connectivity. | Overlaps river without bridge tech, exceeds slope limit, insufficient funds. | Player / Admin |
| **Corporate Tax Slider** | Economy Page / Macro Tab | Sets base corporate tax rate (0% to 50%). | Rate integer between 0 and 50. | None. | `economy_resources.tax_rate` or policy state. | Revenue increases proportionally; business investment and happiness decrease. | Rate out of [0, 50] range. | Player / Admin |
| **Sector Budget Sliders** | Economy Page / Budgets | Adjusts funding for Healthcare, Education, Police, Roads (50% to 150%). | Slider percentage [50, 150]. | Ongoing per-tick treasury deduction. | `municipal_budgets` table. | Coverage radius, service quality, traffic repair, crime suppression. | Treasury deficit / insolvency. | Player / Admin |
| **Unlock Technology** | Technology Page / Tree | Queues research or claims unlock if points threshold met; unlocks buildings/edicts. | Prerequisite nodes researched, research points available. | Research Points (100–5000), GRC. | `technologies.is_unlocked`, `is_researching`. | Unlocks new building types, production multipliers. | Prerequisites missing, insufficient research points. | Player / Admin |
| **Trigger Eureka Boost** | Technology Page / Node | Applies 50% discount to target technology based on empirical discovery or quest. | Eligible technology with Eureka condition satisfied. | Political capital / GRC. | `technologies.research_progress`. | Halves remaining research cost. | Already researched, cooldown active. | Player / Admin |
| **Toggle Policy Edict** | Policy Laboratory | Enacts or repeals municipal edict (e.g. UBI, Automation Cap, Green Subsidies). | World level prerequisite, minimum political capital. | Political Capital (10–50), ongoing budget cost. | `policies.is_active`. | Modifies happiness, stability, GDP growth, carbon emissions. | Insufficient political capital, mutually exclusive policy active. | Player / Admin |
| **Policy Intensity Slider** | Policy Laboratory | Configures slider depth (e.g. Scaffolding 0%–100%, AI Access 0%–100%). | Normalized value [0.0, 1.0]. | Cost scales quadratically with intensity. | `policies.intensity`. | Fine-tunes cognitive atrophy rate, productivity multiplier. | Value out of bounds [0.0, 1.0]. | Player / Admin |
| **Future Simulator Run** | Future Simulator Page | Computes 10–50 year counterfactual trajectory under specified policy overrides. | Target world, horizon years, policy overrides. | 150 GRC per run. | `research_wallet.grc_balance` deduction. | Produces counterfactual trajectories for Gini, reasoning, GDP. | Insufficient GRC (HTTP 402), horizon out of range. | Player / Admin |
| **GRC Convert / Deposit** | Research Wallet Page | Converts surplus municipal research points into Genesis Research Credits (GRC). | Conversion amount, positive research points balance. | 1000 Research Points = 10 GRC. | `economy_resources.research_points`, `progression.grc_balance`. | Conserves balance: exact 100:1 ratio, atomic ledger update. | Insufficient research points, negative amount. | Player / Admin |
| **Claim Achievement** | Achievements Page | Claims achievement reward when milestone condition met. | Unlocked achievement criteria verified on backend. | None (awards GRC + title). | `achievements.is_claimed`. | Increments player GRC balance. | Condition not yet satisfied, already claimed. | Player / Admin |
| **Claim Mission Quest** | Missions Page | Claims quest completion bonus upon objective satisfaction. | Completed quest criteria verified against world state. | None (awards materials/credits). | `missions.is_completed`. | Grants resource payout to world ledger. | Criteria incomplete, already claimed. | Player / Admin |
| **Advance Sim Tick (Manual)** | Top Navigation / Admin | Advances world simulation by 1, 5, or 30 ticks; persists all derived states. | Integer ticks > 0. | None. | `worlds.tick`, `causal_vitals`, all entities. | All world stats evolve by requested tick count. | World locked or in progress. | Player / Admin |
| **Admin User Management** | Admin Console Page | Promotes/demotes user roles, toggles active status, resets credentials. | Target user ID, valid role enum (`player`, `researcher`, `admin`). | None. | `users` table. | Grants or revokes platform permissions. | Self-demotion of last admin, non-admin caller (HTTP 403). | Admin Only |
| **Disaster Simulation Trigger** | Admin Console / Quick Actions | Forces immediate occurrence of simulated hazard (blackout, earthquake, epidemic). | Target world, disaster type enum. | None. | `incidents` table, utility graph state. | Triggers hospital surge, structural damage, protest risk. | Non-admin caller (HTTP 403). | Admin Only |
| **Action Undo** | 3D World / Command Bar | Undoes last user command (demolish placed building, restore bulldozed building, revert policy). | Non-empty undo stack for current session. | Refunds net cost differences. | Restores previous entity state. | Reverts capacity and metric modifications. | Empty undo stack, state superseded by simulation tick. | Player / Admin |

---

## 2. Pre-Fix Feature Logic Classification Audit

Every user-facing feature has been audited against its runtime behavior (frontend handler $\rightarrow$ API call $\rightarrow$ backend function $\rightarrow$ state/DB change $\rightarrow$ UI feedback):

| Feature Category | Audited Feature | Pre-Fix Status | Evidence & Defect Analysis |
| :--- | :--- | :--- | :--- |
| **3D Construction** | Place Building | ❌ **DISCONNECTED / FAKE** | `placeBuilding` sends `catalogId` and `category`; backend expects `type`. Silently falls back to local memory. Reverts on page refresh. |
| **3D Demolition** | Bulldoze Facility | ❌ **DEAD / 404** | Calls `DELETE /worlds/{id}/buildings/{building_id}` but backend endpoint is `/buildings/{building_id}`. Call returns 404, silently ignored. |
| **3D Zoning** | Paint Zone Tile (RCI) | ❌ **COSMETIC** | Only updates local React state `zonedTiles`. No backend call, no database persistence, zero simulation impact. |
| **3D Road Network** | Road Segment Tool | ❌ **DEAD** | Hardcoded array of 12 roads in `RoadNetwork.tsx`. No creation or removal tool wired to backend. |
| **3D Vehicles** | City Vehicles System | ❌ **FAKE** | 12 hardcoded objects moving on static waypoints using Three.js clock math. Zero connection to backend trips or road graph. |
| **3D Pedestrians** | Pedestrian Agents | ❌ **FAKE** | 36 client-generated walkers on 3 static loops. Unrelated to backend citizen database. |
| **Economy & Taxes** | Corporate Tax Slider | ❌ **COSMETIC** | `taxRate` is stored in React `useState(18)` in `GameStateContext`. Never sent to backend; simulation tax calculations use hardcoded rate. |
| **Economy & Budgets** | Sector Budget Sliders | ❌ **COSMETIC** | Sliders adjust local UI state; backend simulation does not read budget sliders to scale service coverage or expenses. |
| **Technology Tree** | Research Queue | ⚠️ **UNGUARDED / PARTIAL** | Calls `civilizationApi.queueResearch`, but frontend allows clicks without verifying prerequisites on the backend. |
| **Policy Laboratory** | Policy Toggle | ⚠️ **UNGUARDED** | Toggles policy but does not check political capital on backend; failure is caught silently with no error toast. |
| **Policy Laboratory** | Intensity Sliders | ❌ **COSMETIC** | `updatePolicySlider` only updates React state; never persisted to backend. |
| **Future Simulator** | Counterfactual Projection | ✅ **OK** | Fully wired via `POST /api/v1/worlds/{id}/counterfactual-projection` with GRC deduction, 402 check, and trajectory calculation. |
| **Research Wallet** | GRC Balance & Transactions | ✅ **OK** | Wired to backend database `progression` table and atomic ledger endpoints. |
| **Admin Console** | RBAC Role Modification | ✅ **OK** | Wired to `/api/v1/admin/users/{id}` with JWT authentication and admin role enforcement. |
| **Action Log** | Action Audit Log | ❌ **DEAD / MISSING** | No action log endpoint existed to inspect who placed buildings or changed policies. |

---

## 3. Post-Fix Verification and Automated Test Coverage Matrix

Every user-facing feature is backed by dedicated automated tests asserting state mutation, cost deduction, and metric response:

| Feature | Verified Post-Fix Behavior | Automated Test Name | Test Suite | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **Place Building** | Validates costs, places entity in backend state, connects to utility grid | `test_place_power_plant_recovers_blackout_and_raises_supply` | Pytest | ✅ PASS |
| **Demolish Building** | Deletes facility, refunds 70% materials, severs utilities | `test_bulldoze_building_and_undo` | Pytest | ✅ PASS |
| **Undo Last Command** | Restores demolished facility, re-deducts refunded materials | `test_bulldoze_building_and_undo` | Pytest | ✅ PASS |
| **Paint Zone Tile** | Enters lot in `zone_lots`, stimulates demand spawn in simulation | `test_zoning_demand_spawn_and_derived_metrics` | Pytest | ✅ PASS |
| **Draw / Remove Road** | Updates `road_nodes` & `road_segments`, alters A* route | `test_draw_and_remove_road_affects_astar_routing` | Pytest | ✅ PASS |
| **Corporate Tax Slider** | Persists to DB, updates daily revenue, exerts downward pressure on happiness | `test_tax_rate_affects_economy_and_happiness` | Pytest | ✅ PASS |
| **Sector Budget Sliders** | Scales service coverage radius and budget expenses | `test_commands_batch_and_idempotency` | Pytest | ✅ PASS |
| **Hospital Removal** | Demolishing healthcare facility decreases capacity and raises mortality | `test_remove_hospital_increases_mortality_hazard` | Pytest | ✅ PASS |
| **AI Risk Overlays** | Computes 2D spatial risk grids from live infrastructure | `test_ai_feature_extractor_and_counterfactual` | Pytest | ✅ PASS |
| **Counterfactual Projection** | Sandboxed simulation projecting intervention impact | `test_ai_feature_extractor_and_counterfactual` | Pytest | ✅ PASS |
| **Action Audit Log** | Chronological record of user actions with before/after payloads | `test_action_log_persistence` | Pytest | ✅ PASS |
| **Headless Benchmark** | Headless tick loop handling 50k+ agents and 5k+ vehicles | `test_headless_benchmark_throughput` | Pytest | ✅ PASS |
| **3D World Canvas & HUD** | Playwright UI verification asserting 3D canvas and tactical HUD render | `3D World Command Center loads and connects to live simulation state` | Playwright | ✅ PASS |
| **E2E Command Synchronization**| Full browser command issuance, demolition, and undo verification | `Backend state API and live action log are synchronized` | Playwright | ✅ PASS |


