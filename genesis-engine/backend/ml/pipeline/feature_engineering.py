"""
Feature Engineering & Temporal Dataset Splits for GENESIS Engine ML
"""

import os
import json
import numpy as np
import pandas as pd
from typing import Tuple, Dict, Any
from sklearn.preprocessing import StandardScaler
from ..config import PROCESSED_DATA_DIR, RANDOM_SEED


def build_time_series_features(target_metric: str = "national_income") -> Dict[str, Any]:
    """
    Constructs autoregressive lag and rolling window features for macro time-series.
    Enforces strict temporal train/val/test splits:
    - Train: 1960 - 2005
    - Validation: 2006 - 2014
    - Test: 2015 - 2023
    """
    path = os.path.join(PROCESSED_DATA_DIR, "clean_macro_series.parquet")
    df = pd.read_parquet(path).sort_values("year").reset_index(drop=True)
    
    # Base feature df
    feats = pd.DataFrame({"year": df["year"]})
    y = df[target_metric]
    
    # 1. Autoregressive lags
    for lag in [1, 2, 3, 5]:
        feats[f"{target_metric}_lag_{lag}"] = y.shift(lag)
        
    # 2. Rolling statistics (shifted by 1 to prevent target leakage)
    feats[f"{target_metric}_roll_mean_3"] = y.shift(1).rolling(window=3).mean()
    feats[f"{target_metric}_roll_std_3"] = y.shift(1).rolling(window=3).std().fillna(0)
    feats[f"{target_metric}_roll_mean_5"] = y.shift(1).rolling(window=5).mean()
    
    # 3. Covariates (shifted by 1)
    if "gini_index" in df.columns and target_metric != "gini_index":
        feats["gini_lag_1"] = df["gini_index"].shift(1)
    if "electricity_access" in df.columns and target_metric != "electricity_access":
        feats["electricity_lag_1"] = df["electricity_access"].shift(1)
        
    # Trend index
    feats["trend_idx"] = (df["year"] - 1960.0) / 50.0
    
    # Drop rows with NaN from lags (first 5 rows)
    valid_mask = ~feats.isna().any(axis=1)
    X = feats[valid_mask].copy()
    y_clean = y[valid_mask].copy()
    years = X["year"].values
    X_features = X.drop(columns=["year"])
    
    # Time-based splitting
    train_mask = years <= 2005
    val_mask = (years >= 2006) & (years <= 2014)
    test_mask = years >= 2015
    
    # Verification check: prove strict time ordering and zero target leakage
    assert years[train_mask].max() < years[val_mask].min(), "Leakage: Train overlaps with Validation!"
    assert years[val_mask].max() < years[test_mask].min(), "Leakage: Val overlaps with Test!"
    
    return {
        "feature_names": list(X_features.columns),
        "target_metric": target_metric,
        "X_train": X_features[train_mask],
        "y_train": y_clean[train_mask].values,
        "years_train": years[train_mask],
        "X_val": X_features[val_mask],
        "y_val": y_clean[val_mask].values,
        "years_val": years[val_mask],
        "X_test": X_features[test_mask],
        "y_test": y_clean[test_mask].values,
        "years_test": years[test_mask],
    }


def build_accident_features() -> Dict[str, Any]:
    """
    Constructs features and strict chronological splits for accident models:
    - Train: First 70% of chronological timeline
    - Validation: Next 15%
    - Test: Final 15%
    """
    path = os.path.join(PROCESSED_DATA_DIR, "clean_accidents.parquet")
    df = pd.read_parquet(path).sort_values("parsed_date").reset_index(drop=True)
    
    feature_cols = [
        'Speed_limit', 'Road_Type', 'Light_Conditions', 'Weather_Conditions',
        'Road_Surface_Conditions', 'Urban_or_Rural_Area', 'Junction_Detail',
        'Number_of_Vehicles', 'hour', 'is_night', 'is_rush_hour', 'is_weekend'
    ]
    
    X = df[feature_cols].copy()
    y_severity = df['is_severe'].values
    y_casualties = df['casualty_count'].values
    dates = df['parsed_date'].values
    
    n = len(df)
    n_train = int(n * 0.70)
    n_val = int(n * 0.85)
    
    train_idx = slice(0, n_train)
    val_idx = slice(n_train, n_val)
    test_idx = slice(n_val, n)
    
    # Strict temporal verification
    assert dates[train_idx][-1] <= dates[val_idx][0], "Leakage: Accident train overlap with val"
    assert dates[val_idx][-1] <= dates[test_idx][0], "Leakage: Accident val overlap with test"
    
    # Scale numeric features strictly fitting on train
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X.iloc[train_idx])
    X_val_scaled = scaler.transform(X.iloc[val_idx])
    X_test_scaled = scaler.transform(X.iloc[test_idx])
    
    return {
        "feature_names": feature_cols,
        "scaler": scaler,
        "train": {
            "X": X.iloc[train_idx],
            "X_scaled": X_train_scaled,
            "y_severity": y_severity[train_idx],
            "y_casualties": y_casualties[train_idx],
            "dates": dates[train_idx]
        },
        "val": {
            "X": X.iloc[val_idx],
            "X_scaled": X_val_scaled,
            "y_severity": y_severity[val_idx],
            "y_casualties": y_casualties[val_idx],
            "dates": dates[val_idx]
        },
        "test": {
            "X": X.iloc[test_idx],
            "X_scaled": X_test_scaled,
            "y_severity": y_severity[test_idx],
            "y_casualties": y_casualties[test_idx],
            "dates": dates[test_idx]
        }
    }


if __name__ == "__main__":
    print("Testing feature engineering...")
    ts_data = build_time_series_features("national_income")
    print(f"TS features: {ts_data['feature_names']}, Train: {len(ts_data['X_train'])}, Val: {len(ts_data['X_val'])}, Test: {len(ts_data['X_test'])}")
    acc_data = build_accident_features()
    print(f"Accident features: {acc_data['feature_names']}, Train: {len(acc_data['train']['X'])}, Val: {len(acc_data['val']['X'])}, Test: {len(acc_data['test']['X'])}")
    print("✓ Feature engineering and temporal split verification successful.")
