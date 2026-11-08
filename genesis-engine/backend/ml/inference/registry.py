"""
ML Model Registry, Cached Inference Engine & Rule-Based Safe Fallbacks
"""

import os
import json
import logging
import joblib
import numpy as np
from typing import Dict, Any, List, Optional
from functools import lru_cache

from ..config import MODELS_DIR, CALIBRATION_DIR, ML_ENABLED, RANDOM_SEED, REALISM_GUARDRAILS
from ..calibration.calibrate import apply_realism_guardrails

logger = logging.getLogger("genesis.ml.inference")

_LOADED_MODELS: Dict[str, Any] = {}
_CALIBRATION_PARAMS: Optional[Dict[str, Any]] = None


def load_calibration_params() -> Dict[str, Any]:
    global _CALIBRATION_PARAMS
    if _CALIBRATION_PARAMS is not None:
        return _CALIBRATION_PARAMS
        
    calib_file = os.path.join(CALIBRATION_DIR, "params_v1.json")
    if os.path.exists(calib_file):
        try:
            with open(calib_file, "r") as f:
                _CALIBRATION_PARAMS = json.load(f)
                return _CALIBRATION_PARAMS
        except Exception as e:
            logger.warning(f"Error loading calibration params: {e}")
            
    # Default fallback constants
    _CALIBRATION_PARAMS = {
        "version": "default_uncalibrated",
        "gompertz_mortality": {"a_base_hazard": 0.00015, "b_aging_rate": 0.08},
        "hadwiger_fertility": {"peak_maternal_age": 27.5, "peak_fertility_rate": 0.095},
        "incident_accident_engine": {
            "severity_probabilities": {"fatal": 0.015, "serious": 0.15, "slight": 0.835},
            "night_hazard_multiplier": 1.4,
            "mean_casualties_per_incident": 1.25
        },
        "macro_inequality_bounds": {"gini_min": 0.22, "gini_median": 0.38, "gini_max": 0.65}
    }
    return _CALIBRATION_PARAMS


def load_model_bundle(model_name: str) -> Optional[Dict[str, Any]]:
    if model_name in _LOADED_MODELS:
        return _LOADED_MODELS[model_name]
        
    path = os.path.join(MODELS_DIR, f"{model_name}.joblib")
    if os.path.exists(path):
        try:
            bundle = joblib.load(path)
            _LOADED_MODELS[model_name] = bundle
            return bundle
        except Exception as e:
            logger.warning(f"Failed to load model {model_name}: {e}")
            return None
    return None


def get_registered_models() -> Dict[str, Any]:
    reg_file = os.path.join(MODELS_DIR, "model_registry.json")
    if os.path.exists(reg_file):
        try:
            with open(reg_file, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {"status": "uninitialized", "results": {}}


# ==============================================================================
# INFERENCE WITH DETERMINISTIC SAFE FALLBACKS
# ==============================================================================

def predict_civilisation_forecast(
    current_state: Dict[str, Any],
    horizon_years: int = 10,
    metrics: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Produces multi-year forward projections with uncertainty intervals [p10, p50, p90].
    Safely falls back to calibrated analytical models if ML is disabled or files missing.
    """
    if metrics is None:
        metrics = ["population", "treasury", "gini_index"]
        
    calib = load_calibration_params()
    pop_0 = float(current_state.get("population", 50000))
    treasury_0 = float(current_state.get("treasury", 250000.0))
    gini_0 = float(current_state.get("gini_index", 0.38))
    
    # 1. ML-Enabled Accelerated Surrogate Pathway
    surrogate_bundle = load_model_bundle("simulation_surrogate") if ML_ENABLED else None
    
    forecasts = {}
    years = [int(current_state.get("year", 1) + y) for y in range(1, horizon_years + 1)]

    if ML_ENABLED and surrogate_bundle is not None:
        try:
            model = surrogate_bundle["model"]
            tax_rate = float(current_state.get("tax_rate", 0.15))
            health_b = float(current_state.get("healthcare_budget_pct", 0.20))
            edu_b = float(current_state.get("education_budget_pct", 0.20))

            pop_series = []
            treasury_series = []
            gini_series = []
            
            for y_step in range(1, horizon_years + 1):
                x_in = np.array([[pop_0 / 1e6, treasury_0 / 1e6, gini_0, tax_rate, health_b, edu_b, y_step / 50.0]])
                preds = model.predict(x_in)[0]
                
                # Apply deltas
                pred_pop = pop_0 * (1.0 + preds[0])
                pred_treasury = treasury_0 * (1.0 + preds[1])
                pred_gini = gini_0 + preds[2]
                
                # Guardrails
                pred_gini, _ = apply_realism_guardrails("gini_index", pred_gini)
                pop_series.append(round(pred_pop))
                treasury_series.append(round(pred_treasury, 2))
                gini_series.append(round(pred_gini, 4))
                
            forecasts["population"] = {
                "median": pop_series,
                "lower_p10": [round(v * 0.96) for v in pop_series],
                "upper_p90": [round(v * 1.04) for v in pop_series],
                "method": "ml_mlp_surrogate"
            }
            forecasts["treasury"] = {
                "median": treasury_series,
                "lower_p10": [round(v * 0.90, 2) for v in treasury_series],
                "upper_p90": [round(v * 1.10, 2) for v in treasury_series],
                "method": "ml_mlp_surrogate"
            }
            forecasts["gini_index"] = {
                "median": gini_series,
                "lower_p10": [round(max(0.18, v - 0.02), 4) for v in gini_series],
                "upper_p90": [round(min(0.70, v + 0.02), 4) for v in gini_series],
                "method": "ml_mlp_surrogate"
            }
        except Exception as e:
            logger.warning(f"ML forecast error: {e}, using calibrated fallback.")
            forecasts = _rule_based_forecast(pop_0, treasury_0, gini_0, horizon_years, calib)
    else:
        # Rule-based fallback
        forecasts = _rule_based_forecast(pop_0, treasury_0, gini_0, horizon_years, calib)

    return {
        "horizon_years": horizon_years,
        "years": years,
        "ml_enabled": ML_ENABLED,
        "forecasts": {k: forecasts[k] for k in metrics if k in forecasts}
    }


def _rule_based_forecast(
    pop_0: float, treasury_0: float, gini_0: float,
    horizon: int, calib: Dict[str, Any]
) -> Dict[str, Any]:
    """Analytical calibrated rule-based compound trajectory projection."""
    target_gini = calib.get("macro_inequality_bounds", {}).get("gini_median", 0.38)
    
    pop_median = []
    treasury_median = []
    gini_median = []
    
    cur_pop = pop_0
    cur_treasury = treasury_0
    cur_gini = gini_0
    
    for _ in range(horizon):
        cur_pop *= 1.018  # Calibrated ~1.8% annual net growth
        cur_treasury *= 1.035
        cur_gini += -0.012 * (cur_gini - target_gini)
        cur_gini, _ = apply_realism_guardrails("gini_index", cur_gini)
        
        pop_median.append(round(cur_pop))
        treasury_median.append(round(cur_treasury, 2))
        gini_median.append(round(cur_gini, 4))
        
    return {
        "population": {
            "median": pop_median,
            "lower_p10": [round(v * 0.95) for v in pop_median],
            "upper_p90": [round(v * 1.05) for v in pop_median],
            "method": "rule_based_calibrated"
        },
        "treasury": {
            "median": treasury_median,
            "lower_p10": [round(v * 0.92, 2) for v in treasury_median],
            "upper_p90": [round(v * 1.08, 2) for v in treasury_median],
            "method": "rule_based_calibrated"
        },
        "gini_index": {
            "median": gini_median,
            "lower_p10": [round(max(0.18, v - 0.015), 4) for v in gini_median],
            "upper_p90": [round(min(0.70, v + 0.015), 4) for v in gini_median],
            "method": "rule_based_calibrated"
        }
    }


def evaluate_incident_risk(
    speed_limit: float = 30.0,
    road_type: int = 6,
    light_conditions: int = 1,
    weather_conditions: int = 1,
    is_night: int = 0,
    urban_or_rural: int = 1
) -> Dict[str, Any]:
    """
    Computes accident severity probability and casualty count estimation.
    """
    calib = load_calibration_params()
    sev_bundle = load_model_bundle("accident_severity") if ML_ENABLED else None
    cas_bundle = load_model_bundle("casualty_count") if ML_ENABLED else None

    if ML_ENABLED and sev_bundle is not None:
        try:
            model = sev_bundle["model"]
            scaler = sev_bundle.get("scaler")
            # Construct standard 12-feature input vector
            raw_x = np.array([[speed_limit, road_type, light_conditions, weather_conditions, 1.0, urban_or_rural, 0.0, 2.0, 14.0, is_night, 0.0, 0.0]])
            x_in = scaler.transform(raw_x) if scaler else raw_x
            p_severe = float(model.predict_proba(x_in)[0, 1])
        except Exception as e:
            logger.warning(f"Error predicting accident severity: {e}")
            p_severe = 0.165
    else:
        # Calibrated baseline
        base_sev = calib.get("incident_accident_engine", {}).get("severity_probabilities", {})
        p_severe = base_sev.get("fatal", 0.014) + base_sev.get("serious", 0.13)
        if is_night:
            p_severe *= calib.get("incident_accident_engine", {}).get("night_hazard_multiplier", 1.4)
            
    p_severe = min(0.95, max(0.01, p_severe))
    
    if ML_ENABLED and cas_bundle is not None:
        try:
            cas_model = cas_bundle["model"]
            cas_scaler = cas_bundle.get("scaler")
            raw_x = np.array([[speed_limit, road_type, light_conditions, weather_conditions, 1.0, urban_or_rural, 0.0, 2.0, 14.0, is_night, 0.0, 0.0]])
            x_in = cas_scaler.transform(raw_x) if cas_scaler else raw_x
            expected_casualties = float(cas_model.predict(x_in)[0])
        except Exception:
            expected_casualties = calib.get("incident_accident_engine", {}).get("mean_casualties_per_incident", 1.26)
    else:
        expected_casualties = calib.get("incident_accident_engine", {}).get("mean_casualties_per_incident", 1.26)

    return {
        "is_severe_probability": round(p_severe, 4),
        "expected_casualties": round(expected_casualties, 2),
        "risk_tier": "HIGH" if p_severe > 0.35 else ("MEDIUM" if p_severe > 0.15 else "LOW"),
        "ml_enabled": ML_ENABLED
    }
