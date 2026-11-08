# GENESIS Engine — Machine Learning Model Cards

This document provides formal model cards for the machine learning models, statistical rate calibration, and simulation surrogate architectures deployed within the GENESIS Engine.

---

## 1. Summary of Model Registry & Champions

| Model Identifier | Primary Task | Model Architecture | Selected Champion | Test Metric | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `forecast_national_income` | Macroeconomic Trend | Auto-regressive Lags | **Ridge AR Baseline** | Test MAE: 1.82e11 (sMAPE: 7.39%) | `ACTIVE` |
| `forecast_gini_index` | Inequality Trajectory | Quantile GBDT [p10, p50, p90] | **LightGBM Quantile** | Test MAE: 0.011, Coverage: 72.7% | `ACTIVE` |
| `accident_severity` | Incident Risk Classification | Balanced Risk Classifier | **Logistic Regression Baseline** | Test ROC-AUC: 0.602, Brier: 0.232 | `ACTIVE` |
| `casualty_count` | Incident Casualties | Poisson Rate Regressor | **LightGBM Poisson** | Test MAE: 0.330 (vs Base: 0.348) | `ACTIVE` |
| `simulation_surrogate` | Fast Counterfactual Projection | Multi-Output Neural Network | **MLPRegressor (64x32)** | Test R²: 0.862, Latency: 0.03 ms | `ACTIVE` |

---

## 2. Model Card: Macroeconomic & Inequality Forecasting

### Overview
- **Identifier:** `forecast_national_income` / `forecast_gini_index`
- **Intended Use:** Multi-year forward projection of civilization economic productivity and wealth concentration under policy regimes.
- **Data Source:** World Bank World Development Indicators (WDI) and World Inequality Database (WID) from 1960 to 2023.
- **Split Strategy:** Strict time-based cutoff — Train (1960–2005), Validation (2006–2014), Held-out Test (2015–2023). Zero forward-looking target leakage.

### Performance on Held-Out Test Set (2015–2023)
- **National Income:**
  - *Ridge AR Baseline:* Test MAE = \$182.0B, sMAPE = 7.39%, RMSE = \$222.6B.
  - *LightGBM:* Test MAE = \$1,761.5B (Overfit on small annual series).
  - *Champion Decision:* Retained simpler **Ridge AR Baseline** per Occam's razor.
- **Gini Index:**
  - *LightGBM Quantile:* Test MAE = 0.0114, sMAPE = 3.13%, Interval Coverage = 72.7% at [p10, p90].
  - *Champion Decision:* **LightGBM Quantile** selected for uncertainty quantification.

### Limitations & Failure Modes
- Sudden exogenous macroeconomic shocks (e.g. global pandemic, extreme geopolitical collapse) fall outside autoregressive lag dynamics.
- Realism guardrails clamp outputs to $[0.18, 0.75]$ to prevent divergent mathematical artifacts.

---

## 3. Model Card: Incident & Accident Risk Engine

### Overview
- **Identifier:** `accident_severity` and `casualty_count`
- **Intended Use:** Evaluates collision severity probability (fatal/serious vs slight) and expected emergency casualty load for city infrastructure and road networks.
- **Data Source:** UK Department for Transport STATS19 Open Data (6,515 incidents, 8,203 casualties).
- **Features Used:** `Speed_limit`, `Road_Type`, `Light_Conditions`, `Weather_Conditions`, `Road_Surface_Conditions`, `Urban_or_Rural_Area`, `Junction_Detail`, `Number_of_Vehicles`, `hour`, `is_night`, `is_rush_hour`, `is_weekend`.
- **Target Leakage Prevention:** Post-incident observations (e.g. `Did_Police_Officer_Attend_Scene_of_Accident`, `LSOA_of_Accident_Location`) were explicitly quarantined and excluded.

### Performance on Held-Out Test Set
- **Severity Classification:**
  - *Logistic Regression (Balanced):* Test ROC-AUC = 0.602, PR-AUC = 0.185, F1 = 0.253, Brier = 0.232.
  - *XGBoost:* Test ROC-AUC = 0.601, PR-AUC = 0.176, F1 = 0.245, Brier = 0.229.
  - *Champion Decision:* Retained **Logistic Regression Baseline** due to equivalent discriminative power with zero hyperparameter complexity.
- **Casualty Count:**
  - *LightGBM Poisson:* Test MAE = 0.330, RMSE = 0.571 (Outperformed Poisson GLM baseline MAE = 0.348).
  - *Champion Decision:* **LightGBM Poisson** selected.

---

## 4. Model Card: Fast Counterfactual Simulation Surrogate

### Overview
- **Identifier:** `simulation_surrogate`
- **Intended Use:** Instantaneous counterfactual rollout approximation ($< 1$ ms) to power real-time interactive policy exploration and branching before committing to full authoritative simulation ticks.
- **Architecture:** Feedforward Multi-Layer Perceptron (MLP) with 2 hidden layers (64, 32 neurons, ReLU activation).
- **Inputs:** Current population, treasury, Gini index, tax rate, healthcare budget share, education budget share, and forecast horizon.
- **Outputs:** Multi-output percentage deltas ($\Delta \text{Population}$, $\Delta \text{Treasury}$, $\Delta \text{Gini}$).

### Performance Metrics
- **Test Set $R^2$:** 0.862
- **Test Set MAE:** 0.0636
- **Inference Latency:** **0.034 ms** (Benchmarked across 100 trials, requirement: $< 200$ ms).
- **Branching Agreement:** Over 90% directional agreement with the authoritative reference simulation.

---

## 5. Statistical Calibration Config (`ml/calibration/params_v1.json`)

The engine constants are calibrated against empirical international data:
1. **Gompertz Adult Mortality:**
   $$\mu(x) = a \cdot e^{b \cdot x}$$
   - Fitted on UN WPP 2024 Life Tables (ages 30–85):
     $$a = 1.295 \times 10^{-4}, \quad b = 0.08016 \text{ yr}^{-1}, \quad R^2 = 0.9959$$
2. **Hadwiger Age-Specific Fertility:**
   - Fitted on UN WPP 2024 ASFR Cohorts:
     $$\text{Peak Maternal Age} = 27.3 \text{ years}, \quad \text{Spread} = 6.8 \text{ years}, \quad R^2 = 0.9750$$
3. **Collision Incident Severity Splits:**
   - Fatal: 1.41%
   - Serious: 12.71%
   - Slight: 85.88%
   - Night Risk Multiplier: $1.42 \times$
4. **Historical Validation Backtest:**
   - Starting from Year 2010 conditions and projecting 10 years forward (2011–2020), the calibrated simulation achieves a **2.76% MAPE** against real World Bank historical data.

---

## 6. Training & Retraining Instructions

To execute data preparation, training, evaluation, and calibration:

```bash
# 1. Clean raw datasets and build features
cd genesis-engine/backend
./venv/bin/python3 -m ml.pipeline.clean_data
./venv/bin/python3 -m ml.pipeline.feature_engineering

# 2. Run model training suite across all tasks
./venv/bin/python3 -m ml.train --task all

# 3. Or train individual tasks:
./venv/bin/python3 -m ml.train --task timeseries
./venv/bin/python3 -m ml.train --task severity
./venv/bin/python3 -m ml.train --task casualties
./venv/bin/python3 -m ml.train --task surrogate

# 4. Calibrate simulation constants
./venv/bin/python3 -m ml.calibration.calibrate
```

