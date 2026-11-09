"""
Test Suite for Telemetry, Behavioral ML Models & Sandboxed AI Policy Controller
Verifies:
1. Telemetry exporter: Schema conformity, non-null identifiers, Parquet serialization
2. Write throughput benchmark (< 10% engine tick overhead)
3. Run-level partitioning: Strict zero-leakage independence across train/val/test
4. Determinism: Seeded simulation produces bitwise/numerical consistency
5. Graceful fallback: System operates normally without ML libraries or model files
6. Inference latency: 50-year forecast executes in under 200 ms on CPU
7. Policy Controller: Strict sandboxing (live DB state unmodified) and kill-switch enforcement
8. API security & RBAC: POST /api/v1/ml/recommend requires admin auth (401/403/200)
"""

import os
import json
import time
import pytest
import pyarrow.parquet as pq
from unittest.mock import patch
from fastapi.testclient import TestClient

from main import app
from auth.security import create_access_token
from db.database import get_db_connection
from ml.config import GENERATED_DATA_DIR, MODELS_DIR
from ml.inference.registry import predict_civilisation_forecast
from ml.control.controller import (
    generate_policy_recommendation,
    SurrogateMPCController,
    HeuristicController,
    KillSwitchActiveError
)
from engine.simulation import create_initial_world, step_world

client = TestClient(app)


# -----------------------------------------------------------------------------
# 1. Telemetry Schema & Parquet Verification
# -----------------------------------------------------------------------------

def test_telemetry_schema_and_parquet_columns():
    manifest_path = os.path.join(GENERATED_DATA_DIR, "manifest.json")
    assert os.path.exists(manifest_path), "manifest.json must exist in generated data"
    with open(manifest_path, "r") as f:
        manifest = json.load(f)

    runs = manifest["runs"]
    assert len(runs) >= 500, f"Expected at least 500 generated runs, found {len(runs)}"
    first_run = runs[0]
    run_dir = os.path.join(GENERATED_DATA_DIR, first_run["run_id"])

    # 1. Citizens table
    citizens_file = os.path.join(run_dir, "citizens.parquet")
    assert os.path.exists(citizens_file)
    c_table = pq.read_table(citizens_file)
    expected_c_cols = {"id", "world_id", "tick", "seed", "age", "education", "health", "wealth", "current_activity"}
    assert expected_c_cols.issubset(set(c_table.column_names))
    assert c_table.num_rows > 0

    # 2. Trips table
    trips_file = os.path.join(run_dir, "trips.parquet")
    assert os.path.exists(trips_file)
    t_table = pq.read_table(trips_file)
    expected_t_cols = {"trip_id", "citizen_id", "origin_id", "destination_id", "mode", "departure_time", "travel_time", "cost"}
    assert expected_t_cols.issubset(set(t_table.column_names))

    # 3. Incidents table
    incidents_file = os.path.join(run_dir, "incidents.parquet")
    assert os.path.exists(incidents_file)
    i_table = pq.read_table(incidents_file)
    expected_i_cols = {"incident_id", "type", "severity", "casualties", "tick", "world_id"}
    assert expected_i_cols.issubset(set(i_table.column_names))

    # 4. Demographics table
    demo_file = os.path.join(run_dir, "demographics.parquet")
    assert os.path.exists(demo_file)
    d_table = pq.read_table(demo_file)
    expected_d_cols = {"event_id", "event_type", "age", "cause", "world_id", "tick"}
    assert expected_d_cols.issubset(set(d_table.column_names))

    # 5. City Metrics table
    metrics_file = os.path.join(run_dir, "city_metrics.parquet")
    assert os.path.exists(metrics_file)
    m_table = pq.read_table(metrics_file)
    expected_m_cols = {"world_id", "tick", "population", "gdp", "gini", "traffic_congestion"}
    assert expected_m_cols.issubset(set(m_table.column_names))


# -----------------------------------------------------------------------------
# 2. Write Throughput Benchmark (< 10% Tick Overhead)
# -----------------------------------------------------------------------------

def test_telemetry_exporter_throughput_overhead(tmp_path):
    # Warmup
    w_warm = create_initial_world(population_size=40, grid_size=20, seed=42)
    for _ in range(20):
        step_world(w_warm)

    world_no_telem = create_initial_world(population_size=40, grid_size=20, seed=42)
    world_telem = create_initial_world(population_size=40, grid_size=20, seed=42)

    num_ticks = 120

    from ml.telemetry import TelemetryBatchExporter, set_telemetry_exporter
    test_exporter = TelemetryBatchExporter(output_dir=str(tmp_path), interval_ticks=6, batch_size=200, enabled=True)
    set_telemetry_exporter(test_exporter)

    # Baseline: exporter disabled
    test_exporter.enabled = False
    t0 = time.perf_counter()
    for _ in range(num_ticks):
        world_no_telem = step_world(world_no_telem)
    duration_baseline = time.perf_counter() - t0

    # With non-blocking telemetry batch exporter enabled (hourly interval)
    test_exporter.enabled = True
    t1 = time.perf_counter()
    for _ in range(num_ticks):
        world_telem = step_world(world_telem)
    duration_telemetry = time.perf_counter() - t1

    test_exporter.close()
    set_telemetry_exporter(None)

    overhead_ratio = (duration_telemetry - duration_baseline) / max(duration_baseline, 1e-6)
    # The queue-based exporter is non-blocking; overhead is strictly below 10%
    assert overhead_ratio < 0.10, f"Overhead ratio {overhead_ratio*100:.2f}% exceeds 10% bound"


# -----------------------------------------------------------------------------
# 3. Split-by-Run Independence (Zero Leakage)
# -----------------------------------------------------------------------------

def test_run_level_split_independence():
    splits_file = os.path.join(GENERATED_DATA_DIR, "splits_manifest.json")
    assert os.path.exists(splits_file), "splits_manifest.json must be present"
    with open(splits_file, "r") as f:
        splits = json.load(f)

    train_set = set(splits["train"])
    val_set = set(splits["val"])
    test_set = set(splits["test"])

    assert len(train_set) == 350
    assert len(val_set) == 75
    assert len(test_set) == 75

    # Assert complete mutual exclusion (zero run-level leakage)
    assert train_set.isdisjoint(val_set), "Train and Validation sets have overlapping run_ids!"
    assert train_set.isdisjoint(test_set), "Train and Test sets have overlapping run_ids!"
    assert val_set.isdisjoint(test_set), "Validation and Test sets have overlapping run_ids!"


# -----------------------------------------------------------------------------
# 4. Simulation Determinism with Fixed Seed
# -----------------------------------------------------------------------------

def test_simulation_determinism_with_seed():
    world_a = create_initial_world(population_size=40, grid_size=20, seed=1337)
    world_b = create_initial_world(population_size=40, grid_size=20, seed=1337)

    for _ in range(20):
        world_a = step_world(world_a)
        world_b = step_world(world_b)

    assert world_a.tick == world_b.tick
    assert world_a.population_count == world_b.population_count
    assert world_a.economy.gini == world_b.economy.gini
    assert world_a.economy.civic_stability == world_b.economy.civic_stability
    assert world_a.economy.average_wealth == world_b.economy.average_wealth


# -----------------------------------------------------------------------------
# 5. Graceful Fallback When ML Models Are Missing
# -----------------------------------------------------------------------------

def test_graceful_fallback_when_models_absent():
    # If surrogate model is unavailable, controller falls back to Heuristic
    mpc = SurrogateMPCController(num_candidates=10)
    mpc.surrogate_model = None

    obs = [50.0, 100.0, 0.42, 0.70, 0.65, 0.20, 10.0]
    action = mpc.select_action(obs)

    # Heuristic triggers UBI when gini > 0.38
    assert isinstance(action, dict)
    assert action["universal_basic_income"] is True
    assert 0.05 <= action["tax_rate"] <= 0.40

    # Analytical forecasting fallback works seamlessly
    with patch("ml.inference.registry.ML_ENABLED", False):
        res = predict_civilisation_forecast({"population": 50000, "treasury": 250000.0, "gini_index": 0.38}, horizon_years=50)
        assert res["ml_enabled"] is False
        assert len(res["years"]) == 50
        assert "population" in res["forecasts"]


# -----------------------------------------------------------------------------
# 6. Benchmark: 50-Year Forecast Latency Under 200 ms on CPU
# -----------------------------------------------------------------------------

def test_50_year_forecast_latency_benchmark():
    state = {
        "year": 2026,
        "population": 85000,
        "treasury": 750000.0,
        "gini_index": 0.36,
        "tax_rate": 0.18
    }

    latencies = []
    for _ in range(10):
        t0 = time.perf_counter()
        _ = predict_civilisation_forecast(state, horizon_years=50)
        latencies.append((time.perf_counter() - t0) * 1000.0)

    mean_latency_ms = sum(latencies) / len(latencies)
    # Target < 200ms on CPU
    assert mean_latency_ms < 200.0, f"Mean latency {mean_latency_ms:.2f}ms exceeds 200ms target"


# -----------------------------------------------------------------------------
# 7. Policy Controller Sandboxing & Kill-Switch
# -----------------------------------------------------------------------------

def test_policy_controller_sandboxing():
    # Check DB before
    conn = get_db_connection()
    row_before = conn.execute("SELECT population, gdp, tax_rate FROM economy_resources WHERE world_id = 'aurora-prime'").fetchone()
    conn.close()

    assert row_before is not None
    pop_before = row_before["population"]
    tax_before = row_before["tax_rate"]

    # Run recommendation
    rec = generate_policy_recommendation("aurora-prime", {
        "population": pop_before,
        "gdp": row_before["gdp"],
        "gini_coefficient": 0.38
    })

    assert rec["is_sandbox_execution"] is True
    assert "recommended_action" in rec
    assert rec["safety_audit"]["requires_human_approval"] is True

    # Check DB after: MUST BE UNCHANGED
    conn2 = get_db_connection()
    row_after = conn2.execute("SELECT population, gdp, tax_rate FROM economy_resources WHERE world_id = 'aurora-prime'").fetchone()
    conn2.close()

    assert row_after["population"] == pop_before, "Live world state was mutated by controller!"
    assert row_after["tax_rate"] == tax_before, "Live tax rate was mutated by controller!"


def test_policy_controller_kill_switch():
    with patch("ml.control.controller.AI_CONTROLLER_KILL_SWITCH", True):
        with pytest.raises(KillSwitchActiveError):
            generate_policy_recommendation("aurora-prime", {"population": 50000})


# -----------------------------------------------------------------------------
# 8. API RBAC Security for POST /api/v1/ml/recommend
# -----------------------------------------------------------------------------

def test_recommend_endpoint_rbac_unauthorized():
    # 1. No Authorization header -> 401
    res = client.post("/api/v1/ml/recommend", json={"world_id": "aurora-prime"})
    assert res.status_code == 401


def test_recommend_endpoint_rbac_forbidden_for_user():
    # 2. Regular user -> 403 Forbidden
    login_res = client.post("/api/v1/auth/login", json={
        "username": "player1",
        "password": "UserPassword123!"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    user_token = login_res.json()["access_token"]

    res = client.post(
        "/api/v1/ml/recommend",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"world_id": "aurora-prime"}
    )
    assert res.status_code == 403


def test_recommend_endpoint_admin_success():
    # 3. Admin user -> 200 OK
    login_res = client.post("/api/v1/auth/login", json={
        "username": "admin",
        "password": "AdminPassword123!"
    })
    assert login_res.status_code == 200, f"Admin login failed: {login_res.text}"
    admin_token = login_res.json()["access_token"]

    res = client.post(
        "/api/v1/ml/recommend",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"world_id": "aurora-prime"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["is_sandbox_execution"] is True
    assert "recommended_action" in data
    assert "predicted_effects" in data
    assert "safety_audit" in data
    assert data["safety_audit"]["requires_human_approval"] is True
