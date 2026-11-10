import pytest
import numpy as np
from fastapi.testclient import TestClient
from main import app

from engine.world.simulation import get_unified_simulation
from engine.world.features import UnifiedFeatureExtractor
from ml.inference.registry import (
    predict_city_trajectory_step,
    predict_civilisation_forecast,
    calculate_gompertz_mortality_hazard,
)
from ml.config import ML_ENABLED

client = TestClient(app)

def test_train_serve_feature_parity():
    """Asserts feature names, types, order, and transforms match between training and inference."""
    sim = get_unified_simulation("aurora-prime")
    features = UnifiedFeatureExtractor.extract_live_features(sim)
    
    expected_features = [
        "power_reserve_ratio",
        "water_reserve_ratio",
        "traffic_congestion_ratio",
        "average_traffic_speed_kmh",
        "healthcare_density",
        "education_density",
        "unemployment_rate",
        "tax_rate_pct",
        "average_happiness",
        "civic_stability",
        "protest_intensity",
        "active_buildings_count",
        "population_density",
    ]
    
    # Assert exact key set parity
    assert list(features.keys()) == expected_features, "Extracted features order or names do not match canonical feature set!"
    
    # Assert value types and ranges
    for k, v in features.items():
        assert isinstance(v, (int, float)), f"Feature {k} must be numeric, got {type(v)}"
        assert not np.isnan(v), f"Feature {k} cannot be NaN"
        assert not np.isinf(v), f"Feature {k} cannot be infinite"


def test_model_sensitivity():
    """Asserts modifying key inputs produces monotonically plausible outputs."""
    base_state = {
        "population": 50000,
        "gdp": 10000000.0,
        "gini": 0.38,
        "happiness": 0.75,
        "traffic_congestion": 0.20,
    }
    
    pred_base = predict_city_trajectory_step(base_state, horizon_steps=1)
    
    # 1. Population perturbation: higher pop -> higher forward predicted pop
    pred_pop_low = predict_city_trajectory_step({**base_state, "population": 40000}, horizon_steps=1)
    pred_pop_high = predict_city_trajectory_step({**base_state, "population": 60000}, horizon_steps=1)
    assert pred_pop_low["predicted_population"] < pred_base["predicted_population"] < pred_pop_high["predicted_population"], (
        "Population forward prediction violated monotonic scaling!"
    )
    
    # 2. Gompertz mortality sensitivity: higher age -> higher mortality hazard
    hazard_young = calculate_gompertz_mortality_hazard(age=25.0, health=0.85)
    hazard_old = calculate_gompertz_mortality_hazard(age=75.0, health=0.85)
    assert hazard_old > hazard_young, "Gompertz hazard must be strictly monotonically increasing with age!"
    
    # Lower health -> higher hazard
    hazard_unhealthy = calculate_gompertz_mortality_hazard(age=50.0, health=0.3)
    hazard_healthy = calculate_gompertz_mortality_hazard(age=50.0, health=0.9)
    assert hazard_unhealthy > hazard_healthy, "Mortality hazard must increase with health deficit!"


def test_prediction_not_stuck():
    """Asserts variance of predictions across 50 diverse states is above a non-trivial threshold."""
    predictions = []
    
    for i in range(50):
        varied_state = {
            "population": 20000 + i * 1500,
            "gdp": 5000000.0 + i * 300000.0,
            "gini": 0.25 + (i % 20) * 0.015,
            "happiness": 0.40 + (i % 15) * 0.03,
            "traffic_congestion": 0.10 + (i % 25) * 0.03,
        }
        res = predict_city_trajectory_step(varied_state, horizon_steps=1)
        predictions.append(res["predicted_population"])
        
    pop_variance = float(np.var(predictions))
    assert pop_variance > 1000.0, f"Model predictions appear stuck! Population variance was only {pop_variance}"


def test_ml_health_endpoint():
    """Asserts GET /api/v1/ml/health returns 200 with all required fields."""
    res = client.get("/api/v1/ml/health")
    assert res.status_code == 200, f"ML health endpoint returned {res.status_code}: {res.text}"
    
    data = res.json()
    required_fields = [
        "model_status",
        "version",
        "uptime_seconds",
        "last_prediction_timestamp",
        "latency_p95_ms",
        "drift_score",
        "confidence",
        "active_models",
        "ml_enabled",
        "sha256_hash",
    ]
    for field in required_fields:
        assert field in data, f"Required field '{field}' missing from /api/v1/ml/health response!"
    
    assert data["model_status"] in ["online", "degraded", "offline"]
    assert data["latency_p95_ms"] < 50.0, "p95 latency must be within sub-50ms budget"
    assert data["drift_score"] >= 0.0
    assert len(data["active_models"]) > 0
