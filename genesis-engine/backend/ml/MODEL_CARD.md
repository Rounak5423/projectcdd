# GENESIS Engine — Machine Learning Model Cards

This document provides formal model cards for both the Macroeconomic/Empirical models and the Simulation-Trained Behavioral Emulators and Sandboxed AI Policy Controller deployed within the GENESIS Engine.

---

## 1. Summary of Model Registry & Champions

### A. Behavioral Simulation Models (Trained on 500 Independent Telemetry Runs)

| Model Identifier | Target / Task | Candidate Architectures | Champion Architecture | Test Set Metric | Baseline Comparison | Inference Latency | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `activity_sequence` | Citizen Daily Activity | MLP (64x32) vs Markov | **Neural MLP Classifier** | **Accuracy: 1.000** | Markov Chain: 0.909 | 0.022 ms | `ACTIVE` |
| `mode_choice` | Commute Mode Selection | LightGBM vs Multinomial LR | **LightGBM Classifier** | **Accuracy: 0.999** | Multinomial LR: 0.963 | 0.031 ms | `ACTIVE` |
| `incident_risk` | Collision / Incident Severity | Calibrated LightGBM vs LogReg | **CalibratedClassifierCV (LightGBM)** | **ROC-AUC: 0.554, Brier: 0.133** | LogReg: 0.523, Brier: 0.135 | 0.040 ms | `ACTIVE` |
| `demographics_rates` | Births & Deaths Rates | LightGBM Poisson vs Empirical | **LightGBM Poisson** | **Trained Rate Model** | Empirical Baseline Rates | 0.035 ms | `ACTIVE` |
| `city_trajectory_surrogate` | Multi-Step City Trajectory | Linear Regression vs MLP | **Multivariate Linear Regression** | **Test $R^2$: 0.765** | MLP (overfit $R^2 < 0$) | **0.045 ms** | `ACTIVE` |

### B. Macroeconomic & Real-World Historical Models (WDI, WID, STATS19)

| Model Identifier | Primary Task | Model Architecture | Selected Champion | Test Metric | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `forecast_national_income` | Macroeconomic Trend | Auto-regressive Lags | **Ridge AR Baseline** | Test MAE: 1.82e11 (sMAPE: 7.39%) | `ACTIVE` |
| `forecast_gini_index` | Inequality Trajectory | Quantile GBDT [p10, p50, p90] | **LightGBM Quantile** | Test MAE: 0.011, Coverage: 72.7% | `ACTIVE` |
| `accident_severity` | Incident Risk Classification | Balanced Risk Classifier | **Logistic Regression Baseline** | Test ROC-AUC: 0.602, Brier: 0.232 | `ACTIVE` |
| `casualty_count` | Incident Casualties | Poisson Rate Regressor | **LightGBM Poisson** | Test MAE: 0.330 (vs Base: 0.348) | `ACTIVE` |
| `simulation_surrogate` | Fast Counterfactual Projection | Multi-Output Neural Network | **MLPRegressor (64x32)** | Test R²: 0.862, Latency: 0.034 ms | `ACTIVE` |

---

## 2. Behavioral Model Cards: Telemetry-Trained Emulators

### 2.1 Citizen Activity Sequence Predictor (`activity_sequence.joblib`)
- **Intended Use:** Predicts citizen diurnal states (`home`, `at_work`, `leisure`, `transit`) conditioned on temporal and demographic features.
- **Inputs:** `hour` (0–23), `age` (normalized), `education` (0.0–2.0), `health` (0.0–1.0), `wealth` (normalized).
- **Training Volume:** 17,500 citizen-hour observations from 350 training simulation runs.
- **Champion Architecture:** Multi-Layer Perceptron (64, 32 units, ReLU, Softmax output, Adam optimizer, early stopping).
- **Held-Out Test Performance (75 Runs):**
  - **Neural MLP Classifier:** Test Accuracy = **1.000**, F1-macro = 1.000.
  - **First-Order Markov Baseline:** Test Accuracy = **0.909**, F1-macro = 0.871.
  - *Delta:* **+9.1% accuracy gain** by conditioning on age and diurnal work shifts rather than memoryless transition matrices.
- **Latency:** 0.022 ms per inference call.
- **Ethical / Bias Considerations:** Ensures demographic diversity; does not segregate citizen opportunities based on wealth alone.

### 2.2 Discrete Mode Choice Model (`mode_choice.joblib`)
- **Intended Use:** Predicts commuter transportation choice (`walking`, `transit`, `car`) across trip origins and destinations.
- **Inputs:** `age`, `wealth`, `travel_time`, `cost`, `departure_hour`.
- **Training Volume:** 2,800 commuting trips across diverse zone topologies and road configurations.
- **Champion Architecture:** Gradient Boosted Decision Trees (`LightGBMClassifier(n_estimators=100, learning_rate=0.05, max_depth=5)`).
- **Held-Out Test Performance (75 Runs):**
  - **LightGBM Classifier:** Test Accuracy = **0.999**, Log-Loss = 0.014.
  - **Multinomial Logistic Regression Baseline:** Test Accuracy = **0.963**, Log-Loss = 0.128.
  - *Delta:* Captures nonlinear wealth thresholds where public transit transitions to private car ownership.
- **Latency:** 0.031 ms per decision.

### 2.3 Incident Severity & Accident Risk (`incident_risk_calibrated.joblib`)
- **Intended Use:** Predicts probability of severe/fatal incidents to drive emergency services allocation.
- **Inputs:** `traffic_congestion`, `weather_severity`, `light_condition`, `is_night`, `speed_limit`.
- **Champion Architecture:** `CalibratedClassifierCV` wrapping `LightGBMClassifier` using sigmoid probability calibration.
- **Held-Out Test Performance (75 Runs):**
  - **Calibrated LightGBM:** Test ROC-AUC = **0.554**, Brier Score = **0.133**.
  - **Logistic Regression Baseline:** Test ROC-AUC = **0.523**, Brier Score = **0.135**.
  - *Calibration Curve:* Well-calibrated probabilities across decile risk buckets $[0.05, 0.45]$ matching observed incident frequencies within $\pm 1.8\%$.
- **Latency:** 0.040 ms per query.

### 2.4 Demographics Rate Model (`demographics_rates.joblib`)
- **Intended Use:** Count-based prediction of birth and death events per district.
- **Inputs:** `cohort_age`, `mean_health`, `medical_budget`, `environmental_quality`.
- **Champion Architecture:** `LGBMRegressor(objective="poisson", n_estimators=60)`.
- **Comparison to Baseline:** Outperformed constant crude rate baseline by accurately capturing non-linear aging acceleration ($e^{0.08 \cdot \text{age}}$) and fertility peaks at maternal ages 26–29.

### 2.5 City Trajectory Surrogate (`city_trajectory_surrogate.joblib`)
- **Intended Use:** Multi-step forward projection of macro indicators ($\Delta \text{Population}$, $\Delta \text{GDP}$, $\Delta \text{Gini}$, $\Delta \text{Wellbeing}$, $\Delta \text{Pollution}$) over $H$ ticks in $< 0.1$ ms.
- **Training Data:** 350 simulation trajectories, 12 ticks per run, randomized policy matrices.
- **Champion Architecture:** Multivariate Linear Regression Baseline.
- **Held-Out Test Performance (75 Runs):**
  - **Multivariate Linear Regression Baseline:** Test $R^2 = \mathbf{0.765}$, Test MAE = $0.0078$, Latency = **0.045 ms**.
  - **Neural MLP (unregularized):** Overfit on small delta magnitudes ($R^2 < 0$).
  - *Occam's Razor Selection:* The simpler linear surrogate achieved superior out-of-sample generalization.
- **Speedup vs Authoritative Simulation:** **~880x faster** (0.045 ms vs ~40.0 ms per trajectory rollout).
- **Interval Coverage:** 88.0% of test observations fell within the [p10, p90] uncertainty band.

---

## 3. Sandboxed AI Policy Controller Benchmark

### 3.1 Problem Formulation & Action Space
The policy optimization task operates within a Gym-style interface (`GenesisEnv`):
- **Observation Space:** 7-dimensional normalized city state vector:
  $$s = [\text{population}, \text{gdp}, \text{gini}, \text{stability}, \text{wellbeing}, \text{pollution}, \text{treasury}]$$
- **Action Space:** 6-dimensional bounded policy action:
  - $\text{Tax Rate} \in [0.05, 0.40]$
  - $\text{Healthcare Budget Share} \in [0.05, 0.45]$
  - $\text{Education Budget Share} \in [0.05, 0.45]$
  - $\text{UBI Toggled} \in \{\text{False}, \text{True}\}$
  - $\text{Cognitive Scaffolding Toggled} \in \{\text{False}, \text{True}\}$
  - $\text{Green Energy Subsidy Toggled} \in \{\text{False}, \text{True}\}$
- **Reward Objective:**
  $$R(s, a) = 0.35 \cdot \text{Wellbeing} + 0.25 \cdot \text{Stability} + 0.20 \cdot (1 - \text{Gini}) + 0.10 \cdot (1 - \text{Pollution}) + 0.10 \cdot (1 - |\text{Tax} - 0.20|)$$

### 3.2 Safety Guardrails & Invariants
1. **Sandbox Isolation:** Live database world state is strictly read-only. Policy evaluations execute exclusively in copy-on-write scratch environments. Live records are asserted unmodified after runs.
2. **Hard Kill Switch:** Controlled by `AI_CONTROLLER_KILL_SWITCH`. When engaged, policy evaluations immediately halt and raise `KillSwitchActiveError` (HTTP 503).
3. **Action Clamping:** All parameters are clamped to valid constitutional bounds before execution.
4. **Immutable Audit Trail:** All recommendations are logged with timestamps, parameter vectors, and predicted confidence intervals to the SQLite `events` ledger.
5. **Human Approval:** Recommendations require explicit administrative approval (`requires_human_approval: true`).

### 3.3 Benchmark Results (Held-Out Seeds, 8-Step Horizon)

| Controller Strategy | Mean Cumulative Reward | Std Dev | Solve Time (ms) | Constraint Violations | Human Approval Flag |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DoNothing Baseline** | 6.855 | ± 0.039 | **0.001 ms** | **0.00%** | N/A |
| **Heuristic Baseline** | 6.855 | ± 0.039 | **0.001 ms** | **0.00%** | N/A |
| **Random Search (N=30)** | **6.972** | ± 0.025 | 0.005 ms | **0.00%** | Required |
| **Surrogate-Guided MPC (N=30)** | 6.908 | ± 0.058 | **0.165 ms** | **0.00%** | Required |

---

## 4. Retraining & Evaluation Pipeline

To retrain and evaluate all simulation behavioral models and run the controller benchmark:

```bash
cd genesis-engine/backend

# 1. Generate 500 parallel telemetry runs (completed in ~12.7s)
./venv/bin/python3 ml/generate/run_scenarios.py --runs 500 --workers 4

# 2. Validate schemas and partition train/val/test splits (zero leakage)
./venv/bin/python3 ml/pipeline/validate_telemetry.py

# 3. Train all simulation models & save artifacts to ml/models/saved/
./venv/bin/python3 ml/train_simulation_models.py

# 4. Run full test suite (79 tests including benchmarks & RBAC security)
./venv/bin/pytest tests/
```
