# CIVORA — COUNCIL OF ADVISORS
## COUNCIL INTELLIGENCE DATA MAP

This document provides the authoritative mapping of domain-specific data requirements for the six permanent Council advisors against the actual database and simulation models in CIVORA (`genesis-engine/backend/db/genesis.db` and `engine/simulation_v1.py`).

No database fields or metrics are invented. Unavailable indicators are explicitly identified.

---

## 1. Domain Data Mapping Matrix

| Advisor | Domain | Required Analytical Data | Existing Source in CIVORA | Availability | Notes & Limitations |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **The Chancellor** | Governance & Society | Civic Stability Index | `economy_resources.civic_stability` | **Available** | Real float in [0.2, 1.0]; derives from wealth disparity |
| | | Wealth Disparity (Gini) | `economy_resources.gini_coefficient` | **Available** | Real float in [0.0, 1.0]; calculated from citizen wealth |
| | | Public Directorate Approval | `economy_resources.happiness` | **Available** | Real float in [0.0, 1.0]; citizen average satisfaction poll |
| | | Active Social Policies | `policies` table (`is_active = 1`, `category='Social'`) | **Available** | Real policies like UBI and AI mandates |
| | | Administrative Infrastructure | `buildings` table (`type='Government'`) | **Available** | Government Citadel level & capacity |
| | | Crime Statistics | None | **Unavailable** | Not modelled in discrete simulation; reported as unavailable |
| | | Social Class Mobility | None | **Unavailable** | Not tracked over longitudinal cohorts |
| **The Treasurer** | Economy & Finance | Sovereign GDP & Growth Rate | `economy_resources.gdp`, `gdp_growth_rate` | **Available** | Authoritative macro-economic values |
| | | Effective Tax Rate | `economy_resources.tax_rate` | **Available** | Real float (e.g. 0.16 = 16%) |
| | | Citizen Average Income | `economy_resources.average_income` | **Available** | Real currency value (e.g. $52,400) |
| | | Employment Rate | `economy_resources.employment_rate` | **Available** | Real float in [0.0, 1.0] |
| | | Genesis Research Credits (GRC) | `progression.grc_balance` | **Available** | Authoritative sovereign liquid capital |
| | | Resource Production/Burn Rates | `economy_resources.food_rate`, `water_rate`, etc. | **Available** | Real deltas per tick |
| | | Industrial Building Economy | `buildings` table (`type='Industry'`, `effects`) | **Available** | Materials generation & GDP contribution |
| | | Sovereign Debt & Bond Market | None | **Unavailable** | Debt/bond instruments not simulated in discrete engine |
| **The Grand Scholar** | Science & Knowledge | Research Point Reserves & Rate | `economy_resources.research_points`, `research_rate` | **Available** | Real accumulated scientific capital and rate |
| | | Unlocked / Researching Techs | `technologies` table (`is_unlocked`, `is_researching`) | **Available** | Authoritative science tree state |
| | | Cognitive Independence (R) | `citizens.independent_reasoning` | **Available** | Evaluated across alive citizen sample |
| | | AI Dependency Ratio (D) | `citizens.ai_dependency` | **Available** | Real telemetry tracking cognitive atrophy |
| | | Macro Collective Innovation | `metrics_history.macro_innovation` | **Available** | $I_{macro} = \frac{1}{N} \sum (0.6 R_i + 0.4(1 - D_i))$ |
| | | Academic Infrastructure | `buildings` table (`type='Research'`, `type='Education'`) | **Available** | Research Hubs and Logic Academies |
| | | Patent Registry & Intellectual Prop | None | **Unavailable** | Intellectual property micro-layer not modelled |
| **The Royal Architect** | Infrastructure & Development | Total Housing Capacity | `buildings` table (`type='Residential'`, `capacity`) | **Available** | Aggregated across active residential zones |
| | | Civilisation Population | `economy_resources.population` | **Available** | Compares against total housing capacity |
| | | Construction & Upgrade Costs | `buildings.construction_cost`, `upgrade_cost` | **Available** | Real JSON resource requirements |
| | | Urban Grid Dimensions | `worlds.grid_size` | **Available** | Spatial matrix bounds (e.g. 32x32) |
| | | Building Operating Status | `buildings.status` (`active`, `constructing`, `upgrading`)| **Available** | Real building lifecycle state |
| | | Road Network Topology | None | **Unavailable** | Physical road routing vectors not modelled; zoning is grid-based |
| | | Structural Wear & Tear | None | **Unavailable** | Building degradation rate not simulated in current tick engine |
| **The High Physician** | Health & Wellbeing | Citizen Well-Being Index | `citizens.wellbeing` (average) | **Available** | Sampled across citizen demographic layer |
| | | Citizen Health Index | `citizens.health` (average) | **Available** | Real physiological indicator |
| | | Clean Water Reserves & Flow | `economy_resources.water`, `water_rate` | **Available** | Vital life-support surplus/deficit |
| | | Food Stockpiles & Agriculture | `economy_resources.food`, `food_rate` | **Available** | Nutritional security indices |
| | | Healthcare Infrastructure | `buildings` table (`type='Healthcare'`, `capacity`) | **Available** | Hospital capacity and mortality reduction |
| | | Pandemic Pathogen Vectors | None | **Unavailable** | Active epidemic contagion not simulated; reported as unavailable |
| | | Mental Health Diagnostics | None | **Unavailable** | Only aggregate `wellbeing` is tracked |
| **The Keeper of Nature** | Environment & Ecology | Environmental Health Score | `economy_resources.environmental_health` | **Available** | Real float in [0.0, 1.0] |
| | | Ecological Pollution Index | `economy_resources.pollution` | **Available** | Real emissions index |
| | | Clean Energy Ratio | `buildings` table (`type='Energy'`, `clean_energy_ratio`)| **Available** | Geothermal and wind vs industrial load |
| | | Ecological Subsidies Policy | `policies` table (`clean_energy_subsidies`) | **Available** | Parameterized emission abatement policies |
| | | Ecological Restoration Arrays | `buildings` table (`type='Environment'`) | **Available** | Wind arrays and biosphere conservation zones |
| | | Forest Canopy Coverage (km²) | None | **Unavailable** | Discrete tree canopy square meters not modelled |
| | | Biome Biodiversity Count | None | **Unavailable** | Individual species extinction vectors not modelled |

---

## 2. Historical Telemetry Availability

Historical metric trends are available via the `metrics_history` table:

- `world_id`: Civilisation scope isolation
- `tick`: Discrete time increment (1 tick = 0.1 simulated years = 36.5 days)
- `year` & `day`: Imperial calendar timestamp
- `population`: Demographic progression
- `gdp`: Economic output history
- `happiness`: Public sentiment trend
- `employment`: Workforce utilization trend
- `environment`: Ecological health score history
- `gini`: Disparity trajectory
- `civic_stability`: Social order trajectory
- `macro_innovation`: Collective cognitive resilience trajectory
- `avg_ai_dependency`: Autonomous complacency trend
- `avg_reasoning`: Critical cognitive reasoning trend
- `food`, `energy`, `materials`: Inventory histories

When fewer than 2 historical points exist in `metrics_history`, longitudinal delta analysis is reported as `insufficient_historical_telemetry`, maintaining data integrity.

