"""
Model Training, Cross-Validation, Evaluation & Model Artifact Registry
Covers:
1. Time-series forecasting (Ridge baseline vs Quantile LightGBM)
2. Accident severity risk classification (Logistic Regression baseline vs XGBoost / LightGBM)
3. Casualty count regression (Poisson GLM baseline vs LightGBM Poisson)
4. Fast counterfactual simulation surrogate (Linear baseline vs MLPRegressor)
"""

import os
import sys
import time
import json
import argparse
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, Any, Tuple

from sklearn.linear_model import Ridge, LogisticRegression, PoissonRegressor, LinearRegression
from sklearn.neural_network import MLPRegressor
from sklearn.metrics import (
    mean_absolute_error, root_mean_squared_error, r2_score,
    roc_auc_score, average_precision_score, f1_score, precision_score, recall_score, brier_score_loss
)
import lightgbm as lgb
import xgboost as xgb

from .config import MODELS_DIR, RUNS_DIR, RANDOM_SEED
from .pipeline.feature_engineering import build_time_series_features, build_accident_features


def smape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Symmetric Mean Absolute Percentage Error."""
    denom = (np.abs(y_true) + np.abs(y_pred)) / 2.0
    diff = np.abs(y_true - y_pred)
    with np.errstate(divide='ignore', invalid='ignore'):
        val = np.where(denom == 0, 0, diff / denom)
    return float(np.mean(val) * 100.0)


# ==============================================================================
# 1. TIME SERIES FORECASTING
# ==============================================================================

def train_timeseries_model(target_metric: str = "national_income") -> Dict[str, Any]:
    print(f"\n--- Training Time-Series Forecast Models for '{target_metric}' ---")
    data = build_time_series_features(target_metric)
    X_train, y_train = data["X_train"], data["y_train"]
    X_val, y_val = data["X_val"], data["y_val"]
    X_test, y_test = data["X_test"], data["y_test"]

    # 1. Baseline: Naive / Ridge AR
    baseline = Ridge(alpha=1.0, random_state=RANDOM_SEED)
    baseline.fit(X_train, y_train)
    y_pred_base_test = baseline.predict(X_test)
    base_mae = mean_absolute_error(y_test, y_pred_base_test)
    base_rmse = root_mean_squared_error(y_test, y_pred_base_test)
    base_smape = smape(y_test, y_pred_base_test)
    base_r2 = r2_score(y_test, y_pred_base_test)

    # 2. Stronger: Quantile LightGBM for Median & Prediction Intervals [p10, p90]
    lgb_median = lgb.LGBMRegressor(
        objective='quantile', alpha=0.5, n_estimators=60, learning_rate=0.05,
        random_state=RANDOM_SEED, verbosity=-1
    )
    lgb_lower = lgb.LGBMRegressor(
        objective='quantile', alpha=0.1, n_estimators=60, learning_rate=0.05,
        random_state=RANDOM_SEED, verbosity=-1
    )
    lgb_upper = lgb.LGBMRegressor(
        objective='quantile', alpha=0.9, n_estimators=60, learning_rate=0.05,
        random_state=RANDOM_SEED, verbosity=-1
    )

    lgb_median.fit(X_train, y_train)
    lgb_lower.fit(X_train, y_train)
    lgb_upper.fit(X_train, y_train)

    y_pred_test = lgb_median.predict(X_test)
    y_lower_test = lgb_lower.predict(X_test)
    y_upper_test = lgb_upper.predict(X_test)

    lgb_mae = mean_absolute_error(y_test, y_pred_test)
    lgb_rmse = root_mean_squared_error(y_test, y_pred_test)
    lgb_smape = smape(y_test, y_pred_test)
    lgb_r2 = r2_score(y_test, y_pred_test)

    # Interval coverage: percentage of ground truth falling between lower and upper
    coverage = float(np.mean((y_test >= y_lower_test) & (y_test <= y_upper_test)) * 100.0)

    # Select champion model
    champion_name = "LightGBM_Quantile" if lgb_mae <= base_mae else "Ridge_AR_Baseline"
    champion_model = {
        "median": lgb_median if champion_name == "LightGBM_Quantile" else baseline,
        "lower": lgb_lower,
        "upper": lgb_upper,
        "feature_names": data["feature_names"],
        "target_metric": target_metric
    }

    metrics = {
        "baseline": {
            "model": "Ridge_AR",
            "test_mae": float(base_mae),
            "test_rmse": float(base_rmse),
            "test_smape": float(base_smape),
            "test_r2": float(base_r2)
        },
        "stronger": {
            "model": "LightGBM_Quantile",
            "test_mae": float(lgb_mae),
            "test_rmse": float(lgb_rmse),
            "test_smape": float(lgb_smape),
            "test_r2": float(lgb_r2),
            "interval_coverage_pct": float(coverage)
        },
        "champion": champion_name
    }

    model_path = os.path.join(MODELS_DIR, f"forecast_{target_metric}.joblib")
    joblib.dump(champion_model, model_path)
    print(f"✓ Saved {champion_name} to {model_path} | Test MAE: {metrics['stronger' if champion_name == 'LightGBM_Quantile' else 'baseline']['test_mae']:.2f}")
    return {"metrics": metrics, "model_path": model_path}


# ==============================================================================
# 2. ACCIDENT SEVERITY RISK CLASSIFICATION
# ==============================================================================

def train_accident_severity_model() -> Dict[str, Any]:
    print("\n--- Training Accident Severity Risk Classification Models ---")
    data = build_accident_features()
    train, val, test = data["train"], data["val"], data["test"]

    # 1. Baseline: Logistic Regression with balanced weighting
    baseline = LogisticRegression(class_weight='balanced', max_iter=1000, random_state=RANDOM_SEED)
    baseline.fit(train["X_scaled"], train["y_severity"])
    base_probs = baseline.predict_proba(test["X_scaled"])[:, 1]
    base_preds = (base_probs >= 0.5).astype(int)

    base_auc = roc_auc_score(test["y_severity"], base_probs)
    base_pr_auc = average_precision_score(test["y_severity"], base_probs)
    base_f1 = f1_score(test["y_severity"], base_preds, zero_division=0)
    base_brier = brier_score_loss(test["y_severity"], base_probs)

    # 2. Stronger: XGBoost with scale_pos_weight
    pos_weight = (len(train["y_severity"]) - sum(train["y_severity"])) / max(1, sum(train["y_severity"]))
    xgb_clf = xgb.XGBClassifier(
        n_estimators=100, max_depth=4, learning_rate=0.05,
        scale_pos_weight=pos_weight, eval_metric='logloss',
        random_state=RANDOM_SEED
    )
    xgb_clf.fit(train["X"], train["y_severity"])
    xgb_probs = xgb_clf.predict_proba(test["X"])[:, 1]
    xgb_preds = (xgb_probs >= 0.5).astype(int)

    xgb_auc = roc_auc_score(test["y_severity"], xgb_probs)
    xgb_pr_auc = average_precision_score(test["y_severity"], xgb_probs)
    xgb_f1 = f1_score(test["y_severity"], xgb_preds, zero_division=0)
    xgb_brier = brier_score_loss(test["y_severity"], xgb_probs)

    # Feature importance
    feature_importances = dict(zip(data["feature_names"], [float(v) for v in xgb_clf.feature_importances_]))
    top_features = sorted(feature_importances.items(), key=lambda x: x[1], reverse=True)[:5]

    champion_name = "XGBoost_Classifier" if xgb_auc >= base_auc else "Logistic_Regression_Baseline"
    champion_bundle = {
        "model": xgb_clf if champion_name == "XGBoost_Classifier" else baseline,
        "scaler": data["scaler"] if champion_name == "Logistic_Regression_Baseline" else None,
        "feature_names": data["feature_names"],
        "task": "accident_severity"
    }

    metrics = {
        "baseline": {
            "model": "Logistic_Regression",
            "test_roc_auc": float(base_auc),
            "test_pr_auc": float(base_pr_auc),
            "test_f1": float(base_f1),
            "brier_score": float(base_brier)
        },
        "stronger": {
            "model": "XGBoost",
            "test_roc_auc": float(xgb_auc),
            "test_pr_auc": float(xgb_pr_auc),
            "test_f1": float(xgb_f1),
            "brier_score": float(xgb_brier),
            "top_features": top_features
        },
        "champion": champion_name
    }

    model_path = os.path.join(MODELS_DIR, "accident_severity.joblib")
    joblib.dump(champion_bundle, model_path)
    print(f"✓ Saved {champion_name} to {model_path} | Test ROC-AUC: {metrics['stronger']['test_roc_auc']:.3f} vs Baseline: {metrics['baseline']['test_roc_auc']:.3f}")
    return {"metrics": metrics, "model_path": model_path}


# ==============================================================================
# 3. CASUALTY COUNT RATE MODEL
# ==============================================================================

def train_casualty_count_model() -> Dict[str, Any]:
    print("\n--- Training Casualty Count Rate Models ---")
    data = build_accident_features()
    train, test = data["train"], data["test"]

    # 1. Baseline: Poisson Regressor
    baseline = PoissonRegressor(alpha=1.0, max_iter=300)
    baseline.fit(train["X_scaled"], train["y_casualties"])
    base_preds = baseline.predict(test["X_scaled"])
    base_mae = mean_absolute_error(test["y_casualties"], base_preds)
    base_rmse = root_mean_squared_error(test["y_casualties"], base_preds)

    # 2. Stronger: LightGBM Poisson Objective
    lgb_poisson = lgb.LGBMRegressor(
        objective='poisson', n_estimators=80, learning_rate=0.05,
        random_state=RANDOM_SEED, verbosity=-1
    )
    lgb_poisson.fit(train["X"], train["y_casualties"])
    lgb_preds = lgb_poisson.predict(test["X"])
    lgb_mae = mean_absolute_error(test["y_casualties"], lgb_preds)
    lgb_rmse = root_mean_squared_error(test["y_casualties"], lgb_preds)

    champion_name = "LightGBM_Poisson" if lgb_mae <= base_mae else "Poisson_GLM_Baseline"
    champion_bundle = {
        "model": lgb_poisson if champion_name == "LightGBM_Poisson" else baseline,
        "scaler": data["scaler"] if champion_name == "Poisson_GLM_Baseline" else None,
        "feature_names": data["feature_names"],
        "task": "casualty_count"
    }

    metrics = {
        "baseline": {
            "model": "Poisson_GLM",
            "test_mae": float(base_mae),
            "test_rmse": float(base_rmse)
        },
        "stronger": {
            "model": "LightGBM_Poisson",
            "test_mae": float(lgb_mae),
            "test_rmse": float(lgb_rmse)
        },
        "champion": champion_name
    }

    model_path = os.path.join(MODELS_DIR, "casualty_count.joblib")
    joblib.dump(champion_bundle, model_path)
    print(f"✓ Saved {champion_name} to {model_path} | Test MAE: {metrics['stronger']['test_mae']:.3f} vs Baseline: {metrics['baseline']['test_mae']:.3f}")
    return {"metrics": metrics, "model_path": model_path}


# ==============================================================================
# 4. SIMULATION SURROGATE MODEL (FAST COUNTERFACTUAL PROJECTIONS)
# ==============================================================================

def train_surrogate_model() -> Dict[str, Any]:
    print("\n--- Training Fast Counterfactual Simulation Surrogate Models ---")
    # Generate reproducible parameter exploration grid from simulation equations
    # Input vector: [pop_0, treasury_0, gini_0, tax_rate, healthcare_budget, education_budget, horizon_years]
    # Output delta vector: [pop_delta_pct, treasury_delta_pct, gini_delta]
    np.random.seed(RANDOM_SEED)
    N_SAMPLES = 2500
    
    pop_0 = np.random.uniform(50000, 2000000, N_SAMPLES)
    treasury_0 = np.random.uniform(100000, 10000000, N_SAMPLES)
    gini_0 = np.random.uniform(0.25, 0.55, N_SAMPLES)
    tax_rate = np.random.uniform(0.05, 0.45, N_SAMPLES)
    healthcare_budget = np.random.uniform(0.05, 0.35, N_SAMPLES)
    education_budget = np.random.uniform(0.05, 0.35, N_SAMPLES)
    horizon_years = np.random.choice([5, 10, 25, 50], N_SAMPLES)

    # Simulated physics outcome equations consistent with engine/simulation.py
    # Economic growth stimulated by education, dampened by excessive taxation
    net_tax_growth = (0.045 + 0.12 * education_budget - 0.15 * (tax_rate ** 1.8))
    # Population growth stimulated by healthcare
    pop_growth = (0.012 + 0.035 * healthcare_budget - 0.02 * (gini_0 ** 1.5))
    # Gini dynamics: high tax & education reduce Gini; high inequality grows slowly
    gini_shift = (-0.12 * tax_rate - 0.08 * education_budget + 0.04 * (1 - healthcare_budget))

    y_pop_pct = np.clip((1 + pop_growth) ** horizon_years - 1.0, -0.6, 5.0)
    y_treasury_pct = np.clip((1 + net_tax_growth) ** horizon_years - 1.0, -0.9, 10.0)
    y_gini_delta = np.clip(gini_shift * (horizon_years / 25.0), -0.20, 0.20)

    X = np.column_stack([pop_0 / 1e6, treasury_0 / 1e6, gini_0, tax_rate, healthcare_budget, education_budget, horizon_years / 50.0])
    Y = np.column_stack([y_pop_pct, y_treasury_pct, y_gini_delta])

    split_idx = int(N_SAMPLES * 0.8)
    X_train, X_test = X[:split_idx], X[split_idx:]
    Y_train, Y_test = Y[:split_idx], Y[split_idx:]

    # 1. Baseline: Multivariate Linear Regression
    baseline = LinearRegression()
    baseline.fit(X_train, Y_train)
    base_preds = baseline.predict(X_test)
    base_r2 = r2_score(Y_test, base_preds)
    base_mae = mean_absolute_error(Y_test, base_preds)

    # 2. Stronger: Multi-Layer Perceptron (MLP) Surrogate
    mlp = MLPRegressor(
        hidden_layer_sizes=(64, 32), activation='relu', max_iter=400,
        random_state=RANDOM_SEED
    )
    mlp.fit(X_train, Y_train)
    mlp_preds = mlp.predict(X_test)
    mlp_r2 = r2_score(Y_test, mlp_preds)
    mlp_mae = mean_absolute_error(Y_test, mlp_preds)

    # Latency benchmark: time for 50-year projection batch
    t0 = time.perf_counter()
    sample_input = np.array([[1.2, 5.0, 0.38, 0.18, 0.20, 0.22, 1.0]])
    for _ in range(100):
        _ = mlp.predict(sample_input)
    t_lat_ms = ((time.perf_counter() - t0) / 100.0) * 1000.0

    champion_bundle = {
        "model": mlp,
        "feature_names": ["pop_millions", "treasury_millions", "gini", "tax_rate", "healthcare_budget", "education_budget", "horizon_norm"],
        "target_names": ["pop_delta_pct", "treasury_delta_pct", "gini_delta"],
        "latency_ms": t_lat_ms
    }

    metrics = {
        "baseline": {"model": "Linear_Regression", "test_r2": float(base_r2), "test_mae": float(base_mae)},
        "stronger": {"model": "MLP_Surrogate", "test_r2": float(mlp_r2), "test_mae": float(mlp_mae), "latency_ms": float(t_lat_ms)},
        "champion": "MLP_Surrogate"
    }

    model_path = os.path.join(MODELS_DIR, "simulation_surrogate.joblib")
    joblib.dump(champion_bundle, model_path)
    print(f"✓ Saved MLP Surrogate to {model_path} | Test R²: {metrics['stronger']['test_r2']:.3f} | Latency: {t_lat_ms:.2f} ms")
    return {"metrics": metrics, "model_path": model_path}


# ==============================================================================
# MAIN ORCHESTRATOR
# ==============================================================================

def train_all():
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    run_dir = os.path.join(RUNS_DIR, timestamp)
    os.makedirs(run_dir, exist_ok=True)

    print(f"================================================================")
    print(f"Starting ML Training & Evaluation Suite | Run: {timestamp}")
    print(f"================================================================")

    res_ts = train_timeseries_model("national_income")
    res_gini = train_timeseries_model("gini_index")
    res_sev = train_accident_severity_model()
    res_cas = train_casualty_count_model()
    res_sur = train_surrogate_model()

    run_summary = {
        "timestamp": timestamp,
        "random_seed": RANDOM_SEED,
        "results": {
            "timeseries_income": res_ts["metrics"],
            "timeseries_gini": res_gini["metrics"],
            "accident_severity": res_sev["metrics"],
            "casualty_count": res_cas["metrics"],
            "simulation_surrogate": res_sur["metrics"]
        }
    }

    summary_file = os.path.join(run_dir, "run_summary.json")
    with open(summary_file, "w") as f:
        json.dump(run_summary, f, indent=2)

    # Also update master registry file
    registry_file = os.path.join(MODELS_DIR, "model_registry.json")
    with open(registry_file, "w") as f:
        json.dump(run_summary, f, indent=2)

    print(f"\n✓ Master model registry and run artifacts saved to:")
    print(f"  - {summary_file}")
    print(f"  - {registry_file}")
    return run_summary


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="GENESIS ML Model Training")
    parser.add_argument("--task", type=str, default="all", choices=["all", "timeseries", "severity", "casualties", "surrogate"])
    args = parser.parse_args()

    if args.task == "all":
        train_all()
    elif args.task == "timeseries":
        train_timeseries_model("national_income")
    elif args.task == "severity":
        train_accident_severity_model()
    elif args.task == "casualties":
        train_casualty_count_model()
    elif args.task == "surrogate":
        train_surrogate_model()
