"""
Comprehensive Automated Test Suite for GENESIS Engine ML Subsystem
Verifies:
1. Data pipeline shapes and lineage
2. Strict temporal ordering and zero target leakage
3. Model smoke tests (forecasting, severity, casualties, surrogate)
4. Safe fallback to calibrated rule-based logic when ML is disabled
5. Reproducibility and determinism
6. Fast inference latency benchmark (< 200ms for 50-year horizon)
7. Full API endpoints and RBAC security
"""

import os
import time
import pytest
from fastapi.testclient import TestClient

from main import app
from auth.security import create_access_token
from ml.config import PROCESSED_DATA_DIR, RANDOM_SEED
from ml.pipeline.feature_engineering import build_time_series_features, build_accident_features
from ml.inference.registry import (
    predict_civilisation_forecast,
    evaluate_incident_risk,
    load_calibration_params
)
from engine.state import world_manager, WorldStateManager
from engine.simulation import step_world

client = TestClient(app)


# -----------------------------------------------------------------------------
# 1. Pipeline & Leakage Tests
# -----------------------------------------------------------------------------

def test_data_pipeline_shapes_and_splits():
    if not os.path.exists(os.path.join(PROCESSED_DATA_DIR, "clean_accidents.parquet")):
        pytest.skip("Processed ML datasets excluded from repository (.gitignore)")
    acc_data = build_accident_features()
    assert len(acc_data["train"]["X"]) > 0
    assert len(acc_data["val"]["X"]) > 0
    assert len(acc_data["test"]["X"]) > 0
    assert len(acc_data["feature_names"]) == 12

    ts_data = build_time_series_features("national_income")
    assert len(ts_data["X_train"]) > 0
    assert len(ts_data["X_val"]) > 0
    assert len(ts_data["X_test"]) > 0


def test_no_target_leakage_and_time_ordering():
    if not os.path.join(PROCESSED_DATA_DIR, "clean_macro_series.parquet"):
        pytest.skip("Processed ML datasets excluded from repository (.gitignore)")
    if not os.path.exists(os.path.join(PROCESSED_DATA_DIR, "clean_macro_series.parquet")):
        pytest.skip("Processed ML datasets excluded from repository (.gitignore)")
    # Time-series ordering
    ts_data = build_time_series_features("national_income")
    train_max = ts_data["years_train"].max()
    val_min = ts_data["years_val"].min()
    val_max = ts_data["years_val"].max()
    test_min = ts_data["years_test"].min()

    assert train_max < val_min, f"Target leakage: train_max {train_max} >= val_min {val_min}"
    assert val_max < test_min, f"Target leakage: val_max {val_max} >= test_min {test_min}"

    # Accident temporal ordering
    acc_data = build_accident_features()
    train_dates = acc_data["train"]["dates"]
    val_dates = acc_data["val"]["dates"]
    test_dates = acc_data["test"]["dates"]

    assert train_dates[-1] <= val_dates[0], "Accident split target leakage: train overlaps with val"
    assert val_dates[-1] <= test_dates[0], "Accident split target leakage: val overlaps with test"


# -----------------------------------------------------------------------------
# 2. Model Smoke & Fallback Tests
# -----------------------------------------------------------------------------

def test_civilisation_forecast_smoke_and_intervals():
    state = {"population": 120000, "treasury": 500000.0, "gini_index": 0.35, "year": 2026}
    res = predict_civilisation_forecast(state, horizon_years=10)

    assert "forecasts" in res
    assert "population" in res["forecasts"]
    assert "treasury" in res["forecasts"]
    assert "gini_index" in res["forecasts"]

    # Check uncertainty intervals consistency
    pop_fc = res["forecasts"]["population"]
    assert len(pop_fc["median"]) == 10
    assert len(pop_fc["lower_p10"]) == 10
    assert len(pop_fc["upper_p90"]) == 10
    for low, med, high in zip(pop_fc["lower_p10"], pop_fc["median"], pop_fc["upper_p90"]):
        assert low <= med <= high, "Quantile interval violation: lower <= median <= upper required"


def test_incident_risk_evaluation_smoke():
    risk_day = evaluate_incident_risk(speed_limit=30.0, is_night=0)
    risk_night = evaluate_incident_risk(speed_limit=60.0, is_night=1)

    assert 0.0 <= risk_day["is_severe_probability"] <= 1.0
    assert 0.0 <= risk_night["is_severe_probability"] <= 1.0
    # Higher speed and night condition should have elevated severe probability
    assert risk_night["is_severe_probability"] >= risk_day["is_severe_probability"]
    assert risk_day["expected_casualties"] >= 1.0


def test_safe_fallback_when_ml_disabled(monkeypatch):
    import ml.inference.registry as reg
    monkeypatch.setattr(reg, "ML_ENABLED", False)

    state = {"population": 100000, "treasury": 400000.0, "gini_index": 0.38, "year": 2026}
    res = reg.predict_civilisation_forecast(state, horizon_years=5)

    assert res["ml_enabled"] is False
    assert res["forecasts"]["population"]["method"] == "rule_based_calibrated"
    assert len(res["forecasts"]["population"]["median"]) == 5


def test_determinism_and_reproducibility():
    state = {"population": 85000, "treasury": 320000.0, "gini_index": 0.36, "year": 2026}
    res1 = predict_civilisation_forecast(state, horizon_years=5)
    res2 = predict_civilisation_forecast(state, horizon_years=5)

    assert res1["forecasts"]["population"]["median"] == res2["forecasts"]["population"]["median"]
    assert res1["forecasts"]["treasury"]["median"] == res2["forecasts"]["treasury"]["median"]


# -----------------------------------------------------------------------------
# 3. Latency Benchmark (< 200 ms for 50-year horizon)
# -----------------------------------------------------------------------------

def test_inference_latency_benchmark():
    state = {"population": 500000, "treasury": 2500000.0, "gini_index": 0.40, "year": 2026}
    
    # Warmup
    _ = predict_civilisation_forecast(state, horizon_years=50)

    # Measure latency across 10 trials
    durations = []
    for _ in range(10):
        t0 = time.perf_counter()
        _ = predict_civilisation_forecast(state, horizon_years=50)
        durations.append((time.perf_counter() - t0) * 1000.0)

    avg_latency_ms = sum(durations) / len(durations)
    print(f"\n[LATENCY BENCHMARK] 50-year horizon forecast: {avg_latency_ms:.2f} ms")
    assert avg_latency_ms < 200.0, f"Latency benchmark failed: {avg_latency_ms:.2f} ms >= 200 ms"


# -----------------------------------------------------------------------------
# 4. Counterfactual Branching Surrogate Agreement
# -----------------------------------------------------------------------------

def test_counterfactual_surrogate_agreement():
    mgr = WorldStateManager()
    test_world = mgr.create(name="Surrogate Test Universe", population=50, seed=42)

    res = mgr.project_counterfactual_surrogate(test_world.id, horizon_years=5)
    assert "agreement_metrics" in res
    assert res["agreement_metrics"]["population_agreement_pct"] > 70.0
    assert res["agreement_metrics"]["gini_agreement_pct"] > 70.0


# -----------------------------------------------------------------------------
# 5. REST API Endpoints & RBAC Security
# -----------------------------------------------------------------------------

def test_get_ml_models_endpoint():
    res = client.get("/api/v1/ml/models")
    assert res.status_code == 200
    data = res.json()
    assert "ml_enabled" in data
    assert "registry" in data
    assert "calibration" in data


def test_world_forecast_endpoint():
    payload = {"horizon_years": 8, "metrics": ["population", "treasury"]}
    res = client.post("/api/v1/worlds/aurora-prime/forecast", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["world_id"] == "aurora-prime"
    assert data["horizon_years"] == 8
    assert "population" in data["forecasts"]


def test_world_risk_endpoint():
    res = client.get("/api/v1/worlds/aurora-prime/risk")
    assert res.status_code == 200
    data = res.json()
    assert "is_severe_probability" in data
    assert "risk_tier" in data
    assert data["risk_tier"] in ["LOW", "MEDIUM", "HIGH"]


def test_ml_calibrate_rbac():
    # 1. Unauthorized attempt (no token) -> 401
    res_unauth = client.post("/api/v1/ml/calibrate")
    assert res_unauth.status_code == 401

    # 2. Citizen user attempt (player1) -> 403 Forbidden
    token_user = create_access_token({"sub": "usr_player1_001", "username": "player1", "role": "user"})
    res_user = client.post("/api/v1/ml/calibrate", headers={"Authorization": f"Bearer {token_user}"})
    assert res_user.status_code == 403

    # 3. Administrator attempt (admin) -> 200 OK
    token_admin = create_access_token({"sub": "usr_admin_001", "username": "admin", "role": "admin"})
    res_admin = client.post("/api/v1/ml/calibrate", headers={"Authorization": f"Bearer {token_admin}"})
    assert res_admin.status_code == 200
    data = res_admin.json()
    assert data["status"] == "success"
    assert "calibrated_parameters" in data
