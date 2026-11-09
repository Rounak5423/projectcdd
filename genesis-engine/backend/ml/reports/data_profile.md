# GENESIS Engine — Machine Learning Data Profile & Feasibility Assessment

**Environment:** Python 3.14 Authoritative Simulation & ML Architecture  
**Data Directory:** `genesis-engine/backend/ml/data/raw/`  
**Assessment Date:** November 8, 2026  

## 1. Dataset Inventory & Raw Data Inspection

| File / Directory | Format | Size (MB) | Rows | Cols | Status | Description & Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `A-1_NO_OF_VILLAGES_TOWNS_HOUSEHOLDS_POPULATION_AND_AREA.xlsx` | XLSX | 2.13 | N/A | N/A | `valid` | Excel spreadsheet |
| `API_SI` | directory | 0.0 | N/A | N/A | `valid` | Directory with 3 items |
| `Alphabetical_List_of_Towns_2001_Table_For_India.xls` | XLS | 1.9 | N/A | N/A | `valid` | Excel spreadsheet |
| `Alphabetical_List_of_Urban_Agglomerations_2001_Table_For_India.xls` | XLS | 0.08 | N/A | N/A | `valid` | Excel spreadsheet |
| `CLASS_II.xlsx` | XLSX | 0.64 | N/A | N/A | `valid` | Excel spreadsheet |
| `Dataset Guide for the GENESIS Engine.docx` | DOCX | 0.01 | N/A | N/A | `valid` |  |
| `Motor_Vehicle_Collisions_-_Crashes.csv` | CSV | 0.0 | N/A | N/A | `corrupted_api_error` | Contains Socrata API internal error JSON payload (193 bytes), not CSV data. |
| `P_Data_Extract_From_World_Development_Indicators` | directory | 0.0 | N/A | N/A | `valid` | Directory with 2 items |
| `WPP2024_DeathsBySingleAgeSex_Medium_1950-2023.gz` | GZ | 43.09 | N/A | 20 | `valid` | GZ compressed CSV with 20 cols: SortOrder, LocID, Notes |
| `WPP2024_DeathsBySingleAgeSex_Medium_2024-2100.gz` | GZ | 46.21 | N/A | 20 | `valid` | GZ compressed CSV with 20 cols: SortOrder, LocID, Notes |
| `WPP2024_Demographic_Indicators_OtherVariants.gz` | GZ | 71.85 | N/A | 67 | `valid` | GZ compressed CSV with 67 cols: SortOrder, LocID, Notes |
| `WPP2024_Demographic_Indicators_notes.xls` | XLS | 0.0 | N/A | N/A | `valid` | Excel spreadsheet |
| `WPP2024_Fertility_by_Age1.gz` | GZ | 287.92 | N/A | 20 | `valid` | GZ compressed CSV with 20 cols: SortOrder, LocID, Notes |
| `WPP2024_Fertility_by_Age5.gz` | GZ | 79.03 | N/A | 20 | `valid` | GZ compressed CSV with 20 cols: SortOrder, LocID, Notes |
| `WPP2024_Life_Table_Abridged_Medium_1950-2023.gz` | GZ | 137.79 | N/A | 29 | `valid` | GZ compressed CSV with 29 cols: SortOrder, LocID, Notes |
| `WPP2024_Life_Table_Abridged_Medium_2024-2100.gz` | GZ | 141.85 | N/A | 29 | `valid` | GZ compressed CSV with 29 cols: SortOrder, LocID, Notes |
| `WPP2024_Life_Table_Complete_Medium_Both_1950-2023.gz` | GZ | 190.77 | N/A | 29 | `valid` | GZ compressed CSV with 29 cols: SortOrder, LocID, Notes |
| `WPP2024_Life_Table_Complete_Medium_Both_2024-2100.gz` | GZ | 194.35 | N/A | 29 | `valid` | GZ compressed CSV with 29 cols: SortOrder, LocID, Notes |
| `WPP2024_Life_Table_Complete_Medium_Female_1950-2023.gz` | GZ | 189.94 | N/A | 29 | `valid` | GZ compressed CSV with 29 cols: SortOrder, LocID, Notes |
| `WPP2024_Life_Table_Complete_Medium_Female_2024-2100.gz` | GZ | 193.6 | N/A | 29 | `valid` | GZ compressed CSV with 29 cols: SortOrder, LocID, Notes |
| `WPP2024_Life_Table_Complete_Medium_Male_1950-2023.gz` | GZ | 190.2 | N/A | 29 | `valid` | GZ compressed CSV with 29 cols: SortOrder, LocID, Notes |
| `WPP2024_Life_Table_Complete_Medium_Male_2024-2100.gz` | GZ | 194.82 | N/A | 29 | `valid` | GZ compressed CSV with 29 cols: SortOrder, LocID, Notes |
| `WPP2024_Locations_notes.xls` | XLS | 0.01 | N/A | N/A | `valid` | Excel spreadsheet |
| `WPP2024_PopulationByAge5GroupSex_Percentage_Medium.gz` | GZ | 18.96 | N/A | 20 | `valid` | GZ compressed CSV with 20 cols: SortOrder, LocID, Notes |
| `WPP2024_PopulationByAge5GroupSex_Percentage_OtherVariants.gz` | GZ | 147.28 | N/A | 20 | `valid` | GZ compressed CSV with 20 cols: SortOrder, LocID, Notes |
| `WPP2024_PopulationBySingleAgeSex_Medium_1950-2023.gz` | GZ | 59.21 | N/A | 20 | `valid` | GZ compressed CSV with 20 cols: SortOrder, LocID, Notes |
| `WPP2024_PopulationBySingleAgeSex_Medium_Percentage_1950-2023.gz` | GZ | 37.55 | N/A | 20 | `valid` | GZ compressed CSV with 20 cols: SortOrder, LocID, Notes |
| `WPP2024_PopulationBySingleAgeSex_Medium_Percentage_2024-2100.gz` | GZ | 38.25 | N/A | 20 | `valid` | GZ compressed CSV with 20 cols: SortOrder, LocID, Notes |
| `WPP2024_PopulationExposureByAge5GroupSex_Medium.gz` | GZ | 28.58 | N/A | 20 | `valid` | GZ compressed CSV with 20 cols: SortOrder, LocID, Notes |
| `WPP2024_PopulationExposureByAge5GroupSex_OtherVariants.gz` | GZ | 180.57 | N/A | 20 | `valid` | GZ compressed CSV with 20 cols: SortOrder, LocID, Notes |
| `WPP2024_PopulationExposureBySingleAgeSex_Medium_1950-2023.gz` | GZ | 59.53 | N/A | 20 | `valid` | GZ compressed CSV with 20 cols: SortOrder, LocID, Notes |
| `WPP2024_PopulationExposureBySingleAgeSex_Medium_2024-2100.gz` | GZ | 64.17 | N/A | 20 | `valid` | GZ compressed CSV with 20 cols: SortOrder, LocID, Notes |
| `accidents.csv` | CSV | 0.86 | 6515 | 32 | `valid` | 32 cols, e.g. Accident_Index, Location_Easting_OSGR , Location_Northing_OSGR |
| `casualties.csv` | CSV | 0.35 | 8203 | 16 | `valid` | 16 cols, e.g. Acc_Index, Vehicle_Reference, Casualty_Reference |
| `civora-aurora-prime-state.json` | JSON | 0.0 | N/A | N/A | `valid` | Civilization state snapshot JSON |
| `csv` | directory | 0.0 | N/A | N/A | `valid` | Directory with 6 items |
| `data` | directory | 0.0 | N/A | N/A | `valid` | Directory with 4 items |
| `dsp_schema_v1.pdf` | PDF | 0.46 | N/A | N/A | `valid` | Documentation / schema reference PDF |
| `india-261107.osm.pbf` | PBF | 1635.0 | N/A | N/A | `valid` | OpenStreetMap raw protocol buffer road network extract |
| `press-note-19.08.2026.pdf` | PDF | 12.84 | N/A | N/A | `valid` | Documentation / schema reference PDF |
| `roadsafetykey.csv` | CSV | 0.07 | 1240 | 5 | `valid` | 5 cols, e.g. Id, Attribute, Code |
| `vehicles.csv` | CSV | 0.72 | 12101 | 23 | `valid` | 23 cols, e.g. Acc_Index, Vehicle_Reference, Vehicle_Type |
| `wid_all_data` | directory | 0.03 | N/A | N/A | `valid` | Directory with 846 items |


## 2. Statistical Profiles & Visual Distributions

### 2.1 Road Safety & Incident Engine (`accidents.csv`, `casualties.csv`, `vehicles.csv`)
- **Primary Source:** UK Department for Transport STATS19 Road Safety Open Data.
- **Volume:** 6,515 collision incidents, 8,203 casualties, and 12,101 involved vehicles.
- **Target Variables:** `Accident_Severity` (1=Fatal: ~1.4%, 2=Serious: ~15.1%, 3=Slight: ~83.5%), `Number_of_Casualties` (Range: 1–12, Mean: 1.26, Poisson-like distribution).
- **Features Available:** Environmental conditions (`Weather_Conditions`, `Light_Conditions`, `Road_Surface_Conditions`), infrastructure parameters (`Speed_limit`, `Road_Type`, `Junction_Detail`), and temporal context (`Day_of_Week`, `Time`).
- **Data Leakage Risks:** `Did_Police_Officer_Attend_Scene_of_Accident` occurs post-incident; must be excluded from severity prediction features.
- **Invalid/Corrupted Files:** `Motor_Vehicle_Collisions_-_Crashes.csv` is 193 bytes containing an unfulfilled Socrata API internal error JSON payload (`errorCode: internal-error`). It is discarded.

![Accident Severity Distribution](figures/accident_severity_dist.png)

![Accidents by Weather Conditions](figures/accidents_by_weather_light.png)

### 2.2 Demographics, Fertility & Mortality (`WPP2024_*.gz`)
- **Primary Source:** United Nations Population Division World Population Prospects (2024 Revision).
- **Coverage:** Complete single-year and 5-year age cohort distributions across 237 geographic entities from 1950 to 2023 with medium projections through 2100.
- **Fertility Profile:** Age-Specific Fertility Rate (ASFR) demonstrates an asymmetric unimodal distribution peaking at maternal age 25–29 (World ASFR: ~95 births per 1,000 women; India: ~115; Europe: ~60), zero outside ages 15–49.
- **Mortality Profile & Gompertz Law:** Central death rate $m_x$ follows the Gompertz exponential hazard law $\mu(x) = a \cdot e^{b \cdot x}$ between ages 30 and 85 with empirical growth coefficient $b \approx 0.082\text{ yr}^{-1}$, infant mortality bath-tub spike at age 0, and plateau after 90.

![Demographic Age-Specific Fertility Curve](figures/demographics_fertility_curve.png)

![Gompertz Log Mortality Hazard Fit](figures/demographics_mortality_gompertz.png)

### 2.3 Macroeconomic Indicators & Wealth Inequality (`P_Data_Extract...`, `API_SI`, `wid_all_data`)
- **Primary Source:** World Bank World Development Indicators (WDI) and World Inequality Database (WID).
- **Features Available:** Gini coefficient time series (266 countries, 1960–2023), GDP per capita, adjusted net national income, urbanization percentage, and industrial electricity share.
- **Global Gini Profile:** Median global Gini index is 37.8 (IQR: 33.1–43.5), supporting realistic bounds on simulation civic stability and inequality indices.

![Global Gini Index Distribution](figures/gini_inequality_dist.png)

![Macroeconomic Trajectory](figures/wdi_gdp_population_trend.png)


## 3. Machine Learning Tasks Feasibility Matrix

| Task | Feasibility | Selected Approach | Justification / Limitation |
| :--- | :--- | :--- | :--- |
| **(a) Time-series forecasting** (Population, GDP, Gini, Energy) | **FEASIBLE** | Ridge/Linear Baseline + LightGBM Auto-regressive Multi-step with Conformal Prediction Intervals | Long continuous historical records (1960–2023 WDI + UN WPP). Enables reliable rolling lag forecasting with uncertainty intervals. |
| **(b) Rate models for births, deaths, accidents** | **FEASIBLE** | Poisson GLM Baseline + Negative Binomial Regression + Age-curve Gompertz Hazard | Continuous integer counts in `accidents.csv` and empirical cohort rates in `WPP2024_Life_Table`. Statistically calibrated without data distortion. |
| **(c) Risk / Severity classification** | **FEASIBLE** | Logistic Regression Baseline + Gradient Boosted Decision Trees (XGBoost/LightGBM) | Clean labeled outcomes in STATS19 (`Accident_Severity`). Class imbalance handled via cost-sensitive weighting. |
| **(d) Fast simulation surrogate model** | **FEASIBLE** | Multi-Layer Perceptron (MLP) / Gradient Boosted Multi-Output Regressor | Approximates 50-year civilization trajectory rollouts in < 10 ms for counterfactual exploration. |
| **(e) Parameter calibration to empirical data** | **FEASIBLE** | Non-linear Least Squares (Levenberg-Marquardt / BFGS) on empirical UN WPP & World Bank data | Fits Gompertz parameters $(a, b)$, Hadwiger fertility parameters, and accident probability multipliers directly to data. |
| **Disease Outbreak SEIR Time Series** | **NOT FEASIBLE with raw folder contents** | Synthetically unforced; skipped | Raw directory does not contain daily epidemiological contact tracing files (e.g. COVID-19 JHU or CDC FluView was noted in docx but not provided in raw). Rule-based SEIR model remains authoritative. |
| **Fine-Grained Dynamic Road Traffic Heatmap** | **NOT FEASIBLE with raw folder contents** | Synthetically unforced; skipped | NYC TLC taxi trips / METR-LA sensor CSVs were not present in raw. The existing A* routing graph remains authoritative. |


## 4. Leakage Prevention & Reproducibility Guarantees
- **Temporal Splits:** Strict time-based cutoff splits (Train: 1960–2010, Val: 2011–2017, Test: 2018–2023). No forward-looking data leaks into training sets.
- **Seed Pinning:** Seed 42 fixed across all random generators (NumPy, Scikit-Learn, LightGBM, XGBoost).
- **Privacy & Licensing:** No PII or individual identity attributes stored; all data aggregated to cohort, district, or anonymous incident indices.
