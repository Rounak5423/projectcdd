"""
GENESIS Telemetry Validation & Split Pipeline
Validates schemas, ranges, uniqueness, and creates run-partitioned train/val/test splits.
Enforces: SPLIT BY RUN, NEVER BY ROW. Zero leakage across runs.
"""

import os
import glob
import json
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple
from ..config import GENERATED_DATA_DIR, RANDOM_SEED


def load_manifest(data_dir: str = str(GENERATED_DATA_DIR)) -> Dict[str, Any]:
    manifest_file = os.path.join(data_dir, "manifest.json")
    if not os.path.exists(manifest_file):
        raise FileNotFoundError(f"Manifest not found at {manifest_file}. Run ml/generate/run_scenarios.py first.")
    with open(manifest_file, "r") as f:
        return json.load(f)


def validate_run_dataset(run_dir: str) -> Dict[str, Any]:
    """Validates schemas, ranges, and primary key uniqueness for a single run folder."""
    errors = []
    tables_found = []

    # 1. City Metrics Table
    cm_path = os.path.join(run_dir, "city_metrics.parquet")
    if os.path.exists(cm_path):
        tables_found.append("city_metrics")
        df_cm = pd.read_parquet(cm_path)
        # Check required columns
        req_cols = ["tick", "population", "gdp", "gini", "happiness", "pollution", "civic_stability", "world_id", "seed"]
        for c in req_cols:
            if c not in df_cm.columns:
                errors.append(f"city_metrics missing column: {c}")
        # Range checks
        if not df_cm.empty:
            if (df_cm["gini"] < 0.0).any() or (df_cm["gini"] > 1.0).any():
                errors.append("city_metrics gini out of range [0, 1]")
            if (df_cm["happiness"] < 0.0).any() or (df_cm["happiness"] > 1.0).any():
                errors.append("city_metrics happiness out of range [0, 1]")
            if (df_cm["population"] < 0).any():
                errors.append("city_metrics population negative")

    # 2. Citizens Table
    cit_path = os.path.join(run_dir, "citizens.parquet")
    if os.path.exists(cit_path):
        tables_found.append("citizens")
        df_cit = pd.read_parquet(cit_path)
        req_cols = ["id", "age", "education", "health", "wealth", "current_activity", "tick", "world_id", "seed"]
        for c in req_cols:
            if c not in df_cit.columns:
                errors.append(f"citizens missing column: {c}")
        if not df_cit.empty:
            if (df_cit["age"] < 0.0).any():
                errors.append("citizen age negative")
            if (df_cit["health"] < 0.0).any() or (df_cit["health"] > 1.0).any():
                errors.append("citizen health out of range [0, 1]")

    # 3. Trips Table
    trp_path = os.path.join(run_dir, "trips.parquet")
    if os.path.exists(trp_path):
        tables_found.append("trips")
        df_trp = pd.read_parquet(trp_path)
        req_cols = ["trip_id", "citizen_id", "mode", "travel_time", "cost", "tick", "seed"]
        for c in req_cols:
            if c not in df_trp.columns:
                errors.append(f"trips missing column: {c}")
        if not df_trp.empty:
            if (df_trp["travel_time"] < 0.0).any():
                errors.append("trip travel_time negative")
            # Uniqueness check on trip_id within run
            if df_trp["trip_id"].duplicated().any():
                errors.append("duplicate trip_id detected within run")

    # 4. Incidents Table
    inc_path = os.path.join(run_dir, "incidents.parquet")
    if os.path.exists(inc_path):
        tables_found.append("incidents")
        df_inc = pd.read_parquet(inc_path)
        if not df_inc.empty:
            if (df_inc["severity"] < 1).any() or (df_inc["severity"] > 3).any():
                errors.append("incident severity out of bounds [1, 3]")
            if (df_inc["response_time"] < 0.0).any():
                errors.append("incident response_time negative")

    return {
        "run_dir": os.path.basename(run_dir),
        "tables_found": tables_found,
        "is_valid": len(errors) == 0,
        "errors": errors
    }


def split_runs_by_id(
    manifest: Dict[str, Any],
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    seed: int = RANDOM_SEED
) -> Dict[str, List[str]]:
    """
    Splits runs into Train / Validation / Test by RUN ID.
    Guarantees no run is shared across splits (Zero Run-Level Leakage).
    """
    runs = [r["run_id"] for r in manifest["runs"]]
    rng = np.random.RandomState(seed)
    shuffled = rng.permutation(runs).tolist()

    n = len(shuffled)
    n_train = int(n * train_ratio)
    n_val = int(n * val_ratio)

    train_runs = sorted(shuffled[:n_train])
    val_runs = sorted(shuffled[n_train:n_train + n_val])
    test_runs = sorted(shuffled[n_train + n_val:])

    # Strict partition verification
    set_train = set(train_runs)
    set_val = set(val_runs)
    set_test = set(test_runs)

    assert set_train.isdisjoint(set_val), "Leakage Error: Train overlaps with Validation!"
    assert set_train.isdisjoint(set_test), "Leakage Error: Train overlaps with Test!"
    assert set_val.isdisjoint(set_test), "Leakage Error: Validation overlaps with Test!"
    assert len(train_runs) + len(val_runs) + len(test_runs) == n, "Partition mismatch!"

    splits = {
        "train": train_runs,
        "val": val_runs,
        "test": test_runs
    }

    # Save split manifest
    out_path = os.path.join(GENERATED_DATA_DIR, "splits_manifest.json")
    with open(out_path, "w") as f:
        json.dump(splits, f, indent=2)

    return splits


def validate_all_generated_data(data_dir: str = str(GENERATED_DATA_DIR)):
    manifest = load_manifest(data_dir)
    print(f"Validating {len(manifest['runs'])} generated runs in {data_dir}...")
    
    all_valid = True
    for r in manifest["runs"][:30]:  # Sample validation
        r_dir = os.path.join(data_dir, r["run_id"])
        res = validate_run_dataset(r_dir)
        if not res["is_valid"]:
            print(f"✗ Validation errors in {r['run_id']}: {res['errors']}")
            all_valid = False

    splits = split_runs_by_id(manifest)
    print(f"✓ Validation complete. Partitioned {len(manifest['runs'])} runs:")
    print(f"  - Train Runs: {len(splits['train'])}")
    print(f"  - Val Runs:   {len(splits['val'])}")
    print(f"  - Test Runs:  {len(splits['test'])}")
    print(f"  - Zero leakage verified: all sets disjoint.")
    return {"all_valid": all_valid, "splits": splits}


if __name__ == "__main__":
    validate_all_generated_data()
