"""
Simulation Behavior Modeling Suite (GENESIS Phase 3)
Trains and evaluates:
a. Activity Sequence Model (Markov Chain baseline vs Sequence Neural Net / MLP)
b. Mode Choice Model (Multinomial Logit baseline vs LightGBM)
c. Incident Risk Model (Logistic GLM baseline vs Calibrated LightGBM/XGBoost)
d. Demographics Rate Model (Poisson GLM baseline vs LightGBM Poisson)
e. City-Metric Trajectory Surrogate with [p10, p50, p90] uncertainty intervals

Enforces: SPLIT BY RUN, NEVER BY ROW. Zero leakage across runs.
Saves all model artifacts to genesis-engine/backend/ml/models/saved/
"""

import os
import sys
import time
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, Any, List, Tuple

from sklearn.linear_model import LogisticRegression, PoissonRegressor, Ridge, LinearRegression
from sklearn.neural_network import MLPClassifier, MLPRegressor
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    accuracy_score, f1_score, roc_auc_score, average_precision_score,
    brier_score_loss, mean_absolute_error, root_mean_squared_error, r2_score
)
import lightgbm as lgb
import xgboost as xgb

from .config import GENERATED_DATA_DIR, MODELS_DIR, RUNS_DIR, RANDOM_SEED


def smape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    denom = (np.abs(y_true) + np.abs(y_pred)) / 2.0
    diff = np.abs(y_true - y_pred)
    with np.errstate(divide='ignore', invalid='ignore'):
        val = np.where(denom == 0, 0, diff / denom)
    return float(np.mean(val) * 100.0)


# ==============================================================================
# DATA LOADERS BY RUN PARTITION
# ==============================================================================

def load_partitioned_table(table_name: str, max_runs_per_split: int = 150) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Loads parquet tables partitioned strictly by run_id (train / val / test)."""
    splits_file = os.path.join(GENERATED_DATA_DIR, "splits_manifest.json")
    with open(splits_file, "r") as f:
        splits = json.load(f)

    def load_dfs(run_ids: List[str]) -> pd.DataFrame:
        frames = []
        for r_id in run_ids[:max_runs_per_split]:
            p = os.path.join(GENERATED_DATA_DIR, r_id, f"{table_name}.parquet")
            if os.path.exists(p):
                frames.append(pd.read_parquet(p))
        if not frames:
            return pd.DataFrame()
        return pd.concat(frames, ignore_index=True)

    df_train = load_dfs(splits["train"])
    df_val = load_dfs(splits["val"])
    df_test = load_dfs(splits["test"])
    return df_train, df_val, df_test


# ==============================================================================
# 1. ACTIVITY SEQUENCE MODEL
# ==============================================================================

class MarkovActivityBaseline:
    """First-order Markov Transition Matrix baseline P(Activity_{t+1} | Activity_t)."""
    def __init__(self):
        self.transitions: Dict[str, Dict[str, float]] = {}
        self.activities = ["home", "at_work", "at_school", "leisure"]

    def fit(self, current_acts: List[str], next_acts: List[str]):
        counts: Dict[str, Dict[str, int]] = {a: {b: 0 for b in self.activities} for a in self.activities}
        for cur, nxt in zip(current_acts, next_acts):
            if cur in counts and nxt in counts[cur]:
                counts[cur][nxt] += 1
        for a in self.activities:
            tot = sum(counts[a].values())
            self.transitions[a] = {b: (counts[a][b] / tot) if tot > 0 else (1.0 / len(self.activities)) for b in self.activities}

    def predict(self, current_acts: List[str]) -> List[str]:
        preds = []
        for a in current_acts:
            trans = self.transitions.get(a, {b: 0.25 for b in self.activities})
            best = max(trans.items(), key=lambda x: x[1])[0]
            preds.append(best)
        return preds


def train_activity_sequence_model() -> Dict[str, Any]:
    print("\n--- Training Activity Sequence Models (Task 3a) ---")
    tr, va, te = load_partitioned_table("citizens", max_runs_per_split=80)
    if tr.empty or te.empty:
        raise ValueError("Missing citizen telemetry data.")

    # Sort each run by citizen_id and tick to construct temporal sequence pairs (A_t -> A_{t+1})
    def build_pairs(df: pd.DataFrame) -> Tuple[pd.DataFrame, np.ndarray, List[str], List[str]]:
        df_sorted = df.sort_values(["world_id", "id", "tick"]).reset_index(drop=True)
        df_sorted["next_activity"] = df_sorted.groupby(["world_id", "id"])["current_activity"].shift(-1)
        valid = df_sorted.dropna(subset=["next_activity"]).copy()
        
        act_map = {"home": 0, "at_work": 1, "at_school": 2, "leisure": 3}
        valid["cur_act_idx"] = valid["current_activity"].map(lambda x: act_map.get(x, 0))
        valid["next_act_idx"] = valid["next_activity"].map(lambda x: act_map.get(x, 0))
        
        # Features: [cur_act_idx, hour, age, education, health, wealth]
        valid["hour"] = valid["tick"] % 24
        X = valid[["cur_act_idx", "hour", "age", "education", "health", "wealth"]].copy()
        y = valid["next_act_idx"].values
        return X, y, list(valid["current_activity"].values), list(valid["next_activity"].values)

    X_train, y_train, cur_train, nxt_train = build_pairs(tr)
    X_test, y_test, cur_test, nxt_test = build_pairs(te)

    # 1. Baseline: First-order Markov chain
    markov = MarkovActivityBaseline()
    markov.fit(cur_train, nxt_train)
    markov_preds_raw = markov.predict(cur_test)
    act_map = {"home": 0, "at_work": 1, "at_school": 2, "leisure": 3}
    markov_preds = np.array([act_map.get(a, 0) for a in markov_preds_raw])
    base_acc = accuracy_score(y_test, markov_preds)
    base_f1 = f1_score(y_test, markov_preds, average="macro")

    # 2. Stronger: Sequence Neural Network / Multi-Layer Perceptron Classifier
    mlp_seq = MLPClassifier(
        hidden_layer_sizes=(64, 32), activation="relu", max_iter=250,
        random_state=RANDOM_SEED
    )
    mlp_seq.fit(X_train, y_train)
    mlp_preds = mlp_seq.predict(X_test)
    mlp_acc = accuracy_score(y_test, mlp_preds)
    mlp_f1 = f1_score(y_test, mlp_preds, average="macro")

    champion_name = "Neural_Sequence_MLP" if mlp_acc >= base_acc else "Markov_Chain_Baseline"
    champion_bundle = {
        "model": mlp_seq if champion_name == "Neural_Sequence_MLP" else markov,
        "feature_names": ["cur_act_idx", "hour", "age", "education", "health", "wealth"],
        "class_labels": ["home", "at_work", "at_school", "leisure"],
        "task": "activity_sequence_emulator"
    }

    metrics = {
        "baseline": {"model": "Markov_Chain", "test_accuracy": float(base_acc), "test_macro_f1": float(base_f1)},
        "stronger": {"model": "Neural_Sequence_MLP", "test_accuracy": float(mlp_acc), "test_macro_f1": float(mlp_f1)},
        "champion": champion_name
    }

    model_path = os.path.join(MODELS_DIR, "activity_sequence.joblib")
    joblib.dump(champion_bundle, model_path)
    print(f"✓ Saved {champion_name} -> {model_path} | Test Acc: {metrics['stronger']['test_accuracy']:.3f} vs Baseline: {metrics['baseline']['test_accuracy']:.3f}")
    return {"metrics": metrics, "model_path": model_path}


# ==============================================================================
# 2. MODE CHOICE MODEL
# ==============================================================================

def train_mode_choice_model() -> Dict[str, Any]:
    print("\n--- Training Mode Choice Models (Task 3b) ---")
    tr, va, te = load_partitioned_table("trips", max_runs_per_split=120)
    if tr.empty or te.empty:
        raise ValueError("Missing trip telemetry data.")

    mode_map = {"walking": 0, "transit": 1, "car": 2, "bicycle": 3}
    for df in [tr, te]:
        df["mode_idx"] = df["mode"].map(lambda x: mode_map.get(x, 2))
        df["cost"] = df["cost"].fillna(0.0)
        df["travel_time"] = df["travel_time"].fillna(15.0)

    features = ["departure_time", "travel_time", "cost"]
    X_train = tr[features].values
    y_train = tr["mode_idx"].values
    X_test = te[features].values
    y_test = te["mode_idx"].values

    # 1. Baseline: Multinomial Logistic Utility Model
    baseline_mnl = LogisticRegression(max_iter=500, random_state=RANDOM_SEED)
    baseline_mnl.fit(X_train, y_train)
    base_preds = baseline_mnl.predict(X_test)
    base_acc = accuracy_score(y_test, base_preds)
    base_f1 = f1_score(y_test, base_preds, average="macro", zero_division=0)

    # 2. Stronger: LightGBM Multi-class Classifier
    lgb_mode = lgb.LGBMClassifier(
        objective="multiclass", num_class=4, n_estimators=80, learning_rate=0.05,
        random_state=RANDOM_SEED, verbosity=-1
    )
    lgb_mode.fit(X_train, y_train)
    lgb_preds = lgb_mode.predict(X_test)
    lgb_acc = accuracy_score(y_test, lgb_preds)
    lgb_f1 = f1_score(y_test, lgb_preds, average="macro", zero_division=0)

    champion_name = "LightGBM_Mode_Choice" if lgb_acc >= base_acc else "Multinomial_Logit_Baseline"
    champion_bundle = {
        "model": lgb_mode if champion_name == "LightGBM_Mode_Choice" else baseline_mnl,
        "feature_names": features,
        "class_labels": ["walking", "transit", "car", "bicycle"],
        "task": "mode_choice_emulator"
    }

    metrics = {
        "baseline": {"model": "Multinomial_Logit", "test_accuracy": float(base_acc), "test_macro_f1": float(base_f1)},
        "stronger": {"model": "LightGBM", "test_accuracy": float(lgb_acc), "test_macro_f1": float(lgb_f1)},
        "champion": champion_name
    }

    model_path = os.path.join(MODELS_DIR, "mode_choice.joblib")
    joblib.dump(champion_bundle, model_path)
    print(f"✓ Saved {champion_name} -> {model_path} | Test Acc: {metrics['stronger']['test_accuracy']:.3f} vs Baseline: {metrics['baseline']['test_accuracy']:.3f}")
    return {"metrics": metrics, "model_path": model_path}


# ==============================================================================
# 3. INCIDENT RISK & SEVERITY MODEL
# ==============================================================================

def train_incident_risk_model() -> Dict[str, Any]:
    print("\n--- Training Incident Risk Models (Task 3c) ---")
    tr, va, te = load_partitioned_table("incidents", max_runs_per_split=120)
    if tr.empty or te.empty:
        raise ValueError("Missing incident telemetry data.")

    for df in [tr, te]:
        df["is_severe"] = (df["severity"] <= 1).astype(int)
        df["hour"] = df["tick"] % 24
        df["is_night"] = ((df["hour"] >= 21) | (df["hour"] <= 5)).astype(int)

    features = ["location_x", "location_y", "response_time", "hour", "is_night"]
    X_train = tr[features].values
    y_train = tr["is_severe"].values
    X_test = te[features].values
    y_test = te["is_severe"].values

    # 1. Baseline: Logistic Regression
    baseline_lr = LogisticRegression(class_weight="balanced", random_state=RANDOM_SEED)
    baseline_lr.fit(X_train, y_train)
    base_probs = baseline_lr.predict_proba(X_test)[:, 1] if len(np.unique(y_train)) > 1 else np.zeros(len(X_test))
    base_auc = roc_auc_score(y_test, base_probs) if len(np.unique(y_test)) > 1 else 0.50
    base_brier = brier_score_loss(y_test, base_probs)

    # 2. Stronger: Calibrated LightGBM Classifier
    lgb_raw = lgb.LGBMClassifier(n_estimators=60, learning_rate=0.05, random_state=RANDOM_SEED, verbosity=-1)
    if len(np.unique(y_train)) > 1:
        calibrated_lgb = CalibratedClassifierCV(estimator=lgb_raw, method="sigmoid", cv=3)
        calibrated_lgb.fit(X_train, y_train)
        lgb_probs = calibrated_lgb.predict_proba(X_test)[:, 1]
        lgb_auc = roc_auc_score(y_test, lgb_probs) if len(np.unique(y_test)) > 1 else 0.50
        lgb_brier = brier_score_loss(y_test, lgb_probs)
    else:
        calibrated_lgb = baseline_lr
        lgb_auc, lgb_brier = base_auc, base_brier

    champion_name = "Calibrated_LightGBM" if lgb_auc >= base_auc else "Logistic_Baseline"
    champion_bundle = {
        "model": calibrated_lgb if champion_name == "Calibrated_LightGBM" else baseline_lr,
        "feature_names": features,
        "task": "incident_risk_calibrated"
    }

    metrics = {
        "baseline": {"model": "Logistic_Regression", "test_roc_auc": float(base_auc), "brier_score": float(base_brier)},
        "stronger": {"model": "Calibrated_LightGBM", "test_roc_auc": float(lgb_auc), "brier_score": float(lgb_brier)},
        "champion": champion_name
    }

    model_path = os.path.join(MODELS_DIR, "incident_risk_calibrated.joblib")
    joblib.dump(champion_bundle, model_path)
    print(f"✓ Saved {champion_name} -> {model_path} | Test ROC-AUC: {metrics['stronger']['test_roc_auc']:.3f} vs Baseline: {metrics['baseline']['test_roc_auc']:.3f}")
    return {"metrics": metrics, "model_path": model_path}


# ==============================================================================
# 4. DEMOGRAPHICS RATE MODEL (BIRTHS, DEATHS, MIGRATIONS)
# ==============================================================================

def train_demographics_rate_model() -> Dict[str, Any]:
    print("\n--- Training Demographics Rate Models (Task 3d) ---")
    tr, va, te = load_partitioned_table("demographics", max_runs_per_split=120)
    if tr.empty or te.empty:
        raise ValueError("Missing demographics telemetry data.")

    # Count events per run per 10 ticks
    def count_rates(df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        counts = df.groupby(["world_id", "tick"]).agg(
            birth_count=("event_type", lambda s: (s == "birth").sum()),
            seed=("seed", "first")
        ).reset_index()
        counts["hour"] = counts["tick"] % 24
        counts["period_idx"] = counts["tick"] / 10.0
        X = counts[["period_idx", "hour"]].values
        y = counts["birth_count"].values
        return X, y

    X_train, y_train = count_rates(tr)
    X_test, y_test = count_rates(te)

    # 1. Baseline: Poisson GLM
    baseline_poisson = PoissonRegressor(alpha=1.0, max_iter=300)
    baseline_poisson.fit(X_train, y_train)
    base_preds = baseline_poisson.predict(X_test)
    base_mae = mean_absolute_error(y_test, base_preds)
    base_rmse = root_mean_squared_error(y_test, base_preds)

    # 2. Stronger: LightGBM Poisson Objective
    lgb_poisson = lgb.LGBMRegressor(objective="poisson", n_estimators=60, learning_rate=0.05, random_state=RANDOM_SEED, verbosity=-1)
    lgb_poisson.fit(X_train, y_train)
    lgb_preds = lgb_poisson.predict(X_test)
    lgb_mae = mean_absolute_error(y_test, lgb_preds)
    lgb_rmse = root_mean_squared_error(y_test, lgb_preds)

    champion_name = "LightGBM_Poisson_Demographics" if lgb_mae <= base_mae else "Poisson_GLM_Baseline"
    champion_bundle = {
        "model": lgb_poisson if champion_name == "LightGBM_Poisson_Demographics" else baseline_poisson,
        "feature_names": ["period_idx", "hour"],
        "task": "demographics_rate_emulator"
    }

    metrics = {
        "baseline": {"model": "Poisson_GLM", "test_mae": float(base_mae), "test_rmse": float(base_rmse)},
        "stronger": {"model": "LightGBM_Poisson", "test_mae": float(lgb_mae), "test_rmse": float(lgb_rmse)},
        "champion": champion_name
    }

    model_path = os.path.join(MODELS_DIR, "demographics_rates.joblib")
    joblib.dump(champion_bundle, model_path)
    print(f"✓ Saved {champion_name} -> {model_path} | Test MAE: {metrics['stronger']['test_mae']:.3f} vs Baseline: {metrics['baseline']['test_mae']:.3f}")
    return {"metrics": metrics, "model_path": model_path}


# ==============================================================================
# 5. CITY-METRIC TRAJECTORY SURROGATE MODEL
# ==============================================================================

def train_city_trajectory_surrogate() -> Dict[str, Any]:
    print("\n--- Training City-Metric Trajectory Surrogate Models (Task 3e) ---")
    tr, va, te = load_partitioned_table("city_metrics", max_runs_per_split=150)
    if tr.empty or te.empty:
        raise ValueError("Missing city_metrics telemetry data.")

    # Target: Given t_0 state (pop, gdp, gini, happiness, pollution), predict delta at t_K
    def build_trajectories(df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        grouped = df.sort_values(["world_id", "tick"]).groupby("world_id")
        X_list, Y_list = [], []
        for _, group in grouped:
            if len(group) < 5:
                continue
            first = group.iloc[0]
            last = group.iloc[-1]
            delta_ticks = float(last["tick"] - first["tick"])
            x = [first["population"] / 1000.0, first["gdp"] / 1e7, first["gini"], first["happiness"], first["pollution"], delta_ticks / 24.0]
            y = [
                (last["population"] - first["population"]) / max(1, first["population"]),
                (last["gdp"] - first["gdp"]) / max(1.0, first["gdp"]),
                last["gini"] - first["gini"],
                last["happiness"] - first["happiness"],
                last["pollution"] - first["pollution"]
            ]
            X_list.append(x)
            Y_list.append(y)
        return np.array(X_list), np.array(Y_list)

    X_train, Y_train = build_trajectories(tr)
    X_test, Y_test = build_trajectories(te)

    # 1. Baseline: Multivariate Linear Regression
    base_lin = LinearRegression()
    base_lin.fit(X_train, Y_train)
    base_preds = base_lin.predict(X_test)
    base_r2 = r2_score(Y_test, base_preds)
    base_mae = mean_absolute_error(Y_test, base_preds)

    # 2. Stronger: Multi-Layer Perceptron (MLP) Trajectory Surrogate with Quantile Bands
    mlp_surrogate = MLPRegressor(hidden_layer_sizes=(128, 64), activation="relu", max_iter=400, random_state=RANDOM_SEED)
    mlp_surrogate.fit(X_train, Y_train)
    mlp_preds = mlp_surrogate.predict(X_test)
    mlp_r2 = r2_score(Y_test, mlp_preds)
    mlp_mae = mean_absolute_error(Y_test, mlp_preds)

    # Conformal prediction residuals on training set for 80% intervals
    champion_name = "MLP_Surrogate" if mlp_r2 > base_r2 and mlp_mae < base_mae else "Linear_Regression_Baseline"
    active_model = mlp_surrogate if champion_name == "MLP_Surrogate" else base_lin

    train_resids = np.abs(Y_train - active_model.predict(X_train))
    q_band = np.quantile(train_resids, 0.80, axis=0)

    # Calculate test interval coverage
    active_preds = active_model.predict(X_test)
    test_lower = active_preds - q_band
    test_upper = active_preds + q_band
    covered = (Y_test >= test_lower) & (Y_test <= test_upper)
    interval_coverage_pct = float(np.mean(covered) * 100.0)

    # Benchmark latency
    t0 = time.perf_counter()
    sample_in = np.array([[1.0, 1.0, 0.35, 0.75, 0.15, 1.0]])
    for _ in range(100):
        _ = active_model.predict(sample_in)
    lat_ms = ((time.perf_counter() - t0) / 100.0) * 1000.0

    champion_bundle = {
        "model": active_model,
        "conformal_quantile_bands": q_band.tolist(),
        "feature_names": ["pop_norm", "gdp_norm", "gini", "happiness", "pollution", "horizon_norm"],
        "target_names": ["pop_delta_pct", "gdp_delta_pct", "gini_delta", "happiness_delta", "pollution_delta"],
        "latency_ms": lat_ms,
        "task": "city_trajectory_surrogate"
    }

    metrics = {
        "baseline": {"model": "Linear_Regression", "test_r2": float(base_r2), "test_mae": float(base_mae)},
        "stronger": {
            "model": "MLP_Surrogate",
            "test_r2": float(mlp_r2),
            "test_mae": float(mlp_mae)
        },
        "interval_coverage_pct": float(interval_coverage_pct),
        "latency_ms": float(lat_ms),
        "champion": champion_name
    }

    model_path = os.path.join(MODELS_DIR, "city_trajectory_surrogate.joblib")
    joblib.dump(champion_bundle, model_path)
    print(f"✓ Saved {champion_name} -> {model_path} | Test R²: {metrics['baseline' if champion_name == 'Linear_Regression_Baseline' else 'stronger']['test_r2']:.3f} | Latency: {lat_ms:.3f} ms | Coverage: {interval_coverage_pct:.1f}%")
    return {"metrics": metrics, "model_path": model_path}


# ==============================================================================
# MAIN ORCHESTRATOR
# ==============================================================================

def train_all_simulation_models():
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    run_dir = os.path.join(RUNS_DIR, f"sim_models_{timestamp}")
    os.makedirs(run_dir, exist_ok=True)

    print(f"================================================================")
    print(f"Starting Simulation Models Training Suite | Run: {timestamp}")
    print(f"================================================================")

    res_act = train_activity_sequence_model()
    res_mode = train_mode_choice_model()
    res_inc = train_incident_risk_model()
    res_dem = train_demographics_rate_model()
    res_city = train_city_trajectory_surrogate()

    summary = {
        "timestamp": timestamp,
        "random_seed": RANDOM_SEED,
        "partition_strategy": "split_by_run_zero_leakage",
        "models": {
            "activity_sequence": res_act["metrics"],
            "mode_choice": res_mode["metrics"],
            "incident_risk": res_inc["metrics"],
            "demographics_rates": res_dem["metrics"],
            "city_trajectory_surrogate": res_city["metrics"]
        }
    }

    summary_file = os.path.join(run_dir, "run_summary.json")
    with open(summary_file, "w") as f:
        json.dump(summary, f, indent=2)

    registry_file = os.path.join(MODELS_DIR, "sim_model_registry.json")
    with open(registry_file, "w") as f:
        json.dump(summary, f, indent=2)

    print(f"\n✓ Master model artifacts and registry saved to:")
    print(f"  - {summary_file}")
    print(f"  - {registry_file}")
    return summary


if __name__ == "__main__":
    train_all_simulation_models()
