"""
GENESIS Engine ML Configuration & Environment Flags
"""

import os
from pathlib import Path

# Base paths
BACKEND_DIR = Path(__file__).resolve().parent.parent
ML_DIR = BACKEND_DIR / "ml"
RAW_DATA_DIR = ML_DIR / "data" / "raw"
PROCESSED_DATA_DIR = ML_DIR / "data" / "processed"
GENERATED_DATA_DIR = ML_DIR / "data" / "generated"
MODELS_DIR = ML_DIR / "models" / "saved"
CALIBRATION_DIR = ML_DIR / "calibration"
RUNS_DIR = ML_DIR / "runs"
REPORTS_DIR = ML_DIR / "reports"

# Ensure runtime directories exist
PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
GENERATED_DATA_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)
CALIBRATION_DIR.mkdir(parents=True, exist_ok=True)
RUNS_DIR.mkdir(parents=True, exist_ok=True)

# Flags
ML_ENABLED = os.environ.get("ML_ENABLED", "0").lower() in ("1", "true", "yes", "on")
TELEMETRY_ENABLED = os.environ.get("TELEMETRY_ENABLED", "0").lower() in ("1", "true", "yes", "on")
TELEMETRY_INTERVAL_TICKS = int(os.environ.get("TELEMETRY_INTERVAL_TICKS", "1"))
AI_CONTROLLER_KILL_SWITCH = os.environ.get("AI_CONTROLLER_KILL_SWITCH", "0").lower() in ("1", "true", "yes", "on")
RANDOM_SEED = 42

# Guardrail bounds for calibrated simulation
REALISM_GUARDRAILS = {
    "annual_population_growth_rate": (-0.05, 0.08),  # -5% to +8%
    "life_expectancy_years": (35.0, 95.0),
    "gini_index": (0.18, 0.75),
    "gdp_growth_rate": (-0.20, 0.25),
    "annual_accident_rate_per_100k": (5.0, 350.0),
    "maternal_fertility_age_bounds": (14.0, 50.0)
}

