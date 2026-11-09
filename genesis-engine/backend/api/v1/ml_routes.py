"""
Machine Learning & Simulation Science Endpoints for GENESIS Engine
Additive routes:
- GET  /api/v1/ml/models
- POST /api/v1/worlds/{world_id}/forecast
- GET  /api/v1/worlds/{world_id}/risk
- POST /api/v1/ml/calibrate (admin only)
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field

from db.database import get_db_connection
from auth.security import get_current_user_optional, get_current_admin
from ml.config import ML_ENABLED
from ml.inference.registry import (
    get_registered_models,
    predict_civilisation_forecast,
    evaluate_incident_risk,
    load_calibration_params
)
from ml.calibration.calibrate import run_calibration_pipeline
from ml.control.controller import generate_policy_recommendation, KillSwitchActiveError

router = APIRouter(tags=["Machine Learning & Calibration"])


def _resolve_world_id(world_id: str) -> str:
    if world_id in ["civ-aurora-01", "civ-default", "prime", "default"]:
        return "aurora-prime"
    return world_id


class ForecastRequest(BaseModel):
    horizon_years: int = Field(default=10, ge=1, le=100, description="Forecast horizon in years")
    metrics: Optional[List[str]] = Field(default=None, description="Subset of metrics: population, treasury, gini_index")


class ForecastResponse(BaseModel):
    world_id: str
    horizon_years: int
    years: List[int]
    ml_enabled: bool
    forecasts: Dict[str, Any]


class RiskResponse(BaseModel):
    world_id: str
    is_severe_probability: float
    expected_casualties: float
    risk_tier: str
    ml_enabled: bool
    indicators: Dict[str, Any]


class PolicyRecommendRequest(BaseModel):
    world_id: str = Field(default="aurora-prime", description="Target world identifier")


class PolicyRecommendResponse(BaseModel):
    world_id: str
    is_sandbox_execution: bool
    recommended_action: Dict[str, Any]
    predicted_effects: Dict[str, Any]
    safety_audit: Dict[str, Any]


@router.get("/ml/models")
async def get_ml_models():
    """
    Returns the machine learning model registry, active versions, test set metrics,
    and fallback availability status.
    """
    registry = get_registered_models()
    calib = load_calibration_params()
    return {
        "ml_enabled": ML_ENABLED,
        "registry": registry,
        "calibration": {
            "version": calib.get("version"),
            "backtest": calib.get("validation_backtest")
        }
    }


@router.post("/worlds/{world_id}/forecast", response_model=ForecastResponse)
async def forecast_world_trajectory(world_id: str, req: ForecastRequest):
    """
    Generates multi-year forward projections with [p10, p50, p90] uncertainty intervals
    for population, economic treasury, and inequality dynamics.
    Fast surrogate execution under 200 ms.
    """
    w_id = _resolve_world_id(world_id)
    conn = get_db_connection()
    row = conn.execute("""
    SELECT w.year, e.population, e.gdp, e.gini_coefficient, e.tax_rate
    FROM worlds w
    JOIN economy_resources e ON w.id = e.world_id
    WHERE w.id = ?
    """, (w_id,)).fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail=f"World '{world_id}' not found")

    state = {
        "year": row["year"],
        "population": row["population"],
        "treasury": row["gdp"],
        "gini_index": row["gini_coefficient"],
        "tax_rate": row["tax_rate"],
        "healthcare_budget_pct": 0.20,
        "education_budget_pct": 0.20
    }

    forecast_output = predict_civilisation_forecast(
        current_state=state,
        horizon_years=req.horizon_years,
        metrics=req.metrics
    )

    return ForecastResponse(
        world_id=world_id,
        horizon_years=forecast_output["horizon_years"],
        years=forecast_output["years"],
        ml_enabled=forecast_output["ml_enabled"],
        forecasts=forecast_output["forecasts"]
    )


@router.get("/worlds/{world_id}/risk", response_model=RiskResponse)
async def get_world_risk_scores(world_id: str):
    """
    Returns incident and accident risk evaluation for the active world.
    Predicts probability of severe incident and expected casualties based on
    infrastructure and city attributes.
    """
    w_id = _resolve_world_id(world_id)
    conn = get_db_connection()
    row = conn.execute("SELECT id FROM worlds WHERE id = ?", (w_id,)).fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail=f"World '{world_id}' not found")

    try:
        from engine.world.simulation import get_unified_simulation
        from engine.world.features import UnifiedFeatureExtractor
        sim = get_unified_simulation(w_id)
        live_feats = UnifiedFeatureExtractor.extract_live_features(sim)
        speed_lim = float(live_feats.get("average_traffic_speed_kmh", 45.0))
        congestion = float(live_feats.get("traffic_congestion_ratio", 0.1))
    except Exception:
        speed_lim = 45.0
        congestion = 0.1

    risk_eval = evaluate_incident_risk(
        speed_limit=speed_lim,
        road_type=6,
        light_conditions=1,
        weather_conditions=1,
        is_night=0,
        urban_or_rural=1
    )

    return RiskResponse(
        world_id=world_id,
        is_severe_probability=risk_eval["is_severe_probability"],
        expected_casualties=risk_eval["expected_casualties"],
        risk_tier=risk_eval["risk_tier"],
        ml_enabled=risk_eval["ml_enabled"],
        indicators={
            "speed_limit_mph": round(speed_lim * 0.621371, 1),
            "urban_area": True,
            "congestion_ratio": congestion,
            "lighting": "Daylight"
        }
    )


@router.post("/ml/calibrate")
async def trigger_calibration(
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    """
    Admin-only endpoint: fits empirical simulation parameters (Gompertz mortality,
    Hadwiger fertility, accident splits, Gini bounds) to raw data and writes params_v1.json.
    """
    calibrated = run_calibration_pipeline()
    return {
        "status": "success",
        "calibrated_by": current_admin.get("username", "admin"),
        "calibrated_parameters": calibrated
    }


@router.post("/ml/recommend", response_model=PolicyRecommendResponse)
async def recommend_policy(
    req: Optional[PolicyRecommendRequest] = None,
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    """
    Admin-only endpoint: runs sandboxed AI policy controller evaluation (never touching real world state).
    Returns recommended policy modifications with predicted impacts and confidence intervals,
    recording an immutable audit trail.
    """
    target_world_id = req.world_id if req and req.world_id else "aurora-prime"
    w_id = _resolve_world_id(target_world_id)

    conn = get_db_connection()
    row = conn.execute("""
    SELECT w.year, e.population, e.gdp, e.gini_coefficient, e.tax_rate,
           e.happiness, e.civic_stability, e.pollution
    FROM worlds w
    JOIN economy_resources e ON w.id = e.world_id
    WHERE w.id = ?
    """, (w_id,)).fetchone()
    conn.close()

    if not row:
        state = {
            "population": 50000,
            "gdp": 10000000.0,
            "gini_coefficient": 0.38,
            "civic_stability": 0.77,
            "happiness": 0.75,
            "pollution": 0.12,
            "treasury": 500000.0
        }
    else:
        state = {
            "population": row["population"],
            "gdp": row["gdp"],
            "gini_coefficient": row["gini_coefficient"],
            "civic_stability": row["civic_stability"] if "civic_stability" in row.keys() else 0.77,
            "happiness": row["happiness"] if "happiness" in row.keys() else 0.75,
            "pollution": row["pollution"] if "pollution" in row.keys() else 0.12,
            "treasury": row["gdp"]
        }

    try:
        recommendation = generate_policy_recommendation(target_world_id, state)
        return PolicyRecommendResponse(**recommendation)
    except KillSwitchActiveError as e:
        raise HTTPException(status_code=503, detail=str(e))

