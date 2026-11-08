"""
Data Cleaning & Lineage Pipeline for GENESIS Engine ML
"""

import os
import glob
import gzip
import hashlib
import json
import numpy as np
import pandas as pd
from ..config import RAW_DATA_DIR, PROCESSED_DATA_DIR, RANDOM_SEED


def compute_file_hash(filepath: str) -> str:
    hasher = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()[:16]


def clean_accident_data() -> pd.DataFrame:
    """
    Cleans UK STATS19 accident data.
    Builds modeling dataset for:
    - Accident Severity Classification (Fatal/Serious vs Slight)
    - Casualty Count Regression
    """
    raw_acc_path = os.path.join(RAW_DATA_DIR, "accidents.csv")
    if not os.path.exists(raw_acc_path):
        raise FileNotFoundError(f"Missing {raw_acc_path}")

    df = pd.read_csv(raw_acc_path)
    
    # 1. Parse Date & Temporal features
    df['parsed_date'] = pd.to_datetime(df['Date'], format='%d/%m/%Y', errors='coerce')
    # Drop rows without valid date
    df = df.dropna(subset=['parsed_date']).sort_values('parsed_date').reset_index(drop=True)
    
    # Extract time-of-day features
    time_series = pd.to_datetime(df['Time'], format='%H:%M', errors='coerce')
    df['hour'] = time_series.dt.hour.fillna(12).astype(int)
    df['is_night'] = ((df['hour'] >= 21) | (df['hour'] <= 5)).astype(int)
    df['is_rush_hour'] = (((df['hour'] >= 7) & (df['hour'] <= 9)) | ((df['hour'] >= 16) & (df['hour'] <= 18))).astype(int)
    df['is_weekend'] = df['Day_of_Week'].isin([1, 7]).astype(int)
    
    # 2. Target variables
    # Accident_Severity: 1=Fatal, 2=Serious, 3=Slight
    # Binary is_severe: 1 if Fatal/Serious, 0 if Slight
    df['is_severe'] = (df['Accident_Severity'] <= 2).astype(int)
    df['casualty_count'] = df['Number_of_Casualties'].clip(lower=1, upper=20).astype(int)
    
    # 3. Clean and encode features
    feature_cols = [
        'Speed_limit', 'Road_Type', 'Light_Conditions', 'Weather_Conditions',
        'Road_Surface_Conditions', 'Urban_or_Rural_Area', 'Junction_Detail',
        'Number_of_Vehicles', 'hour', 'is_night', 'is_rush_hour', 'is_weekend'
    ]
    
    # Impute missing values with median / mode
    for col in feature_cols:
        if col in df.columns:
            if df[col].isnull().any():
                df[col] = df[col].fillna(df[col].mode()[0])
            df[col] = df[col].astype(float)
            
    # Leakage check: verify no post-incident columns present in modeling features
    leaky_cols = ['Did_Police_Officer_Attend_Scene_of_Accident', 'LSOA_of_Accident_Location']
    for col in leaky_cols:
        assert col not in feature_cols, f"Target leakage risk: {col} cannot be a feature!"

    clean_df = df[['parsed_date', 'Accident_Index', 'is_severe', 'casualty_count'] + feature_cols]
    
    out_path = os.path.join(PROCESSED_DATA_DIR, "clean_accidents.parquet")
    clean_df.to_parquet(out_path, index=False)
    print(f"✓ Saved clean accidents dataset: {clean_df.shape} -> {out_path}")
    return clean_df


def clean_macro_time_series() -> pd.DataFrame:
    """
    Cleans macroeconomic time-series (GDP, National Income, Electricity, Gini)
    from World Bank WDI and WID data.
    """
    wdi_files = glob.glob(os.path.join(RAW_DATA_DIR, "P_Data_Extract_From_World_Development_Indicators/*_Data.csv"))
    if not wdi_files:
        raise FileNotFoundError("WDI Data CSV not found.")
        
    df_wdi = pd.read_csv(wdi_files[0], encoding='latin1')
    year_cols = [c for c in df_wdi.columns if '[YR' in c]
    
    # Target key macro indicators
    indicators = {
        'Adjusted net national income (constant 2015 US$)': 'national_income',
        'Access to electricity (% of population)': 'electricity_access',
        'Air transport, freight (million ton-km)': 'logistics_volume'
    }
    
    records = []
    for raw_name, clean_name in indicators.items():
        sub = df_wdi[df_wdi['Series Name'] == raw_name]
        if not sub.empty:
            row = sub.iloc[0]
            for yc in year_cols:
                yr = int(yc.split('[YR')[1].replace(']', ''))
                val = pd.to_numeric(row[yc], errors='coerce')
                records.append({'year': yr, 'metric': clean_name, 'value': val})
                
    df_macro = pd.DataFrame(records)
    df_macro = df_macro.pivot(index='year', columns='metric', values='value').sort_index()
    
    # Interpolate / ffill missing historical points
    df_macro = df_macro.interpolate(method='linear').bfill().ffill()
    
    # Also attach Gini index time-series from API_SI
    gini_files = glob.glob(os.path.join(RAW_DATA_DIR, "API_SI/API_SI.POV.GINI*.csv"))
    if gini_files:
        df_gini = pd.read_csv(gini_files[0], skiprows=4)
        # Compute annual global mean/median Gini index across reporting countries
        year_gini_cols = [c for c in df_gini.columns if c.isdigit() and int(c) >= 1960]
        gini_yearly = {}
        for yc in year_gini_cols:
            yr = int(yc)
            median_val = pd.to_numeric(df_gini[yc], errors='coerce').median()
            gini_yearly[yr] = median_val / 100.0  # Normalized to 0.0 - 1.0
        s_gini = pd.Series(gini_yearly, name='gini_index')
        df_macro = df_macro.join(s_gini)
        df_macro['gini_index'] = df_macro['gini_index'].interpolate().bfill().ffill()

    # Normalize index
    df_macro = df_macro.reset_index()
    out_path = os.path.join(PROCESSED_DATA_DIR, "clean_macro_series.parquet")
    df_macro.to_parquet(out_path, index=False)
    print(f"✓ Saved clean macro time-series: {df_macro.shape} -> {out_path}")
    return df_macro


def clean_demographics_rates() -> dict:
    """
    Cleans UN WPP Life Tables and Fertility datasets to produce cohort tables
    for Gompertz and Hadwiger calibration.
    """
    fert_path = os.path.join(RAW_DATA_DIR, "WPP2024_Fertility_by_Age5.gz")
    mort_path = os.path.join(RAW_DATA_DIR, "WPP2024_Life_Table_Abridged_Medium_1950-2023.gz")
    
    # 1. Fertility Rates by Age Cohort
    with gzip.open(fert_path, 'rt') as f:
        df_fert = pd.read_csv(f, usecols=['Location', 'Time', 'AgeGrpStart', 'AgeGrpSpan', 'ASFR', 'PASFR', 'Births'])
    # Global empirical baseline
    fert_world = df_fert[(df_fert['Location'] == 'World') & (df_fert['Time'] == 2020)].sort_values('AgeGrpStart')
    fert_out = os.path.join(PROCESSED_DATA_DIR, "clean_fertility_cohorts.parquet")
    fert_world.to_parquet(fert_out, index=False)
    
    # 2. Mortality Life Table Rates by Age
    with gzip.open(mort_path, 'rt') as f:
        df_mort = pd.read_csv(f, usecols=['Location', 'Time', 'Sex', 'AgeGrpStart', 'AgeGrpSpan', 'mx', 'qx', 'lx', 'ex'])
    mort_world = df_mort[(df_mort['Location'] == 'World') & (df_mort['Time'] == 2020) & (df_mort['Sex'] == 'Total')].sort_values('AgeGrpStart')
    mort_out = os.path.join(PROCESSED_DATA_DIR, "clean_mortality_cohorts.parquet")
    mort_world.to_parquet(mort_out, index=False)
    
    print(f"✓ Saved clean fertility ({len(fert_world)} rows) and mortality ({len(mort_world)} rows) cohort datasets")
    return {"fertility": fert_out, "mortality": mort_out}


def run_cleaning_pipeline():
    print("=== Running GENESIS ML Data Cleaning Pipeline ===")
    acc_df = clean_accident_data()
    macro_df = clean_macro_time_series()
    demo_dict = clean_demographics_rates()
    
    # Write dataset lineage metadata
    metadata = {
        "random_seed": RANDOM_SEED,
        "processed_datasets": {
            "clean_accidents": {
                "rows": len(acc_df),
                "cols": len(acc_df.columns),
                "target_balance_is_severe": float(acc_df['is_severe'].mean())
            },
            "clean_macro_series": {
                "years_range": [int(macro_df['year'].min()), int(macro_df['year'].max())],
                "rows": len(macro_df)
            }
        }
    }
    meta_path = os.path.join(PROCESSED_DATA_DIR, "lineage.json")
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"✓ Lineage metadata written: {meta_path}")


if __name__ == "__main__":
    run_cleaning_pipeline()
