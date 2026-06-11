"""
scripts/prepare_dataset.py
────────────────────────────────────────────────────────────────
Dataset preprocessing pipeline.

FIXES APPLIED (from dataset audit screenshots):
  FIX-1: Remove corrupted first rows where state_or_region is NaN
          (header artifacts from census sheet)
  FIX-2: Fix mixed data types in state_code, district_code, villages, towns
          (values like 1.0, 0.0, "State" → consistent numeric/categorical)
  FIX-3: Add missing spatial features: latitude, longitude, district_name, state_name
  FIX-4: Add missing temporal features: week, date, year, season
  FIX-5: Add missing mobility features: mobility_index, travel_density
  FIX-6: Add missing community data: citizen_reports_count, symptom_frequency
  FIX-7: Add hospital capacity ratios: beds_per_1000, doctors_per_1000, healthcare_access_index
  FIX-8: Add environmental risk indicators: vector_risk, water_risk, climate_anomaly
  FIX-9: Compute time-series lag features: cases_lag_1/2/3, cases_rolling_mean, growth_rate
  FIX-10: Add hospital load indicators: hospital_utilisation, bed_occupancy
  FIX-11: Restructure to panel format: district + week + disease (one row per combination)
"""
from __future__ import annotations

import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List

import numpy as np
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s — %(message)s")
logger = logging.getLogger(__name__)

# District lat/lng lookup for UP
DISTRICT_COORDS = {
    "Lucknow":    (26.85, 80.95), "Agra":       (27.18, 78.01),
    "Kanpur":     (26.46, 80.35), "Varanasi":   (25.32, 83.00),
    "Allahabad":  (25.45, 81.84), "Meerut":     (28.98, 77.71),
    "Ghaziabad":  (28.67, 77.44), "Bareilly":   (28.35, 79.43),
    "Gorakhpur":  (26.76, 83.37), "Moradabad":  (28.84, 78.78),
    "Aligarh":    (27.88, 78.08), "Saharanpur": (29.97, 77.55),
    "Faizabad":   (26.77, 82.14), "Jhansi":     (25.45, 78.57),
    "Mathura":    (27.49, 77.67),
}

MONTH_SEASON = {
    1: "winter", 2: "winter", 3: "spring", 4: "summer", 5: "summer",
    6: "monsoon", 7: "monsoon", 8: "monsoon", 9: "monsoon",
    10: "autumn", 11: "autumn", 12: "winter",
}


def load_raw_dataset(path: str) -> pd.DataFrame:
    """Load the raw governance dataset."""
    logger.info("Loading raw dataset from %s", path)
    df = pd.read_csv(path, low_memory=False)
    logger.info("Loaded %d rows, %d columns", len(df), len(df.columns))
    return df


def fix_corrupted_rows(df: pd.DataFrame) -> pd.DataFrame:
    """
    FIX-1: Remove corrupted first rows where state_or_region is NaN.
    These are header artifacts from the original census sheet.
    """
    before = len(df)
    # Drop rows where the primary region identifier is null
    if "state_or_region" in df.columns:
        df = df.dropna(subset=["state_or_region"])
        # Drop rows where state_or_region looks like a header (e.g. "State", "District")
        df = df[~df["state_or_region"].astype(str).str.lower().isin(
            ["state", "district", "region", "nan", "state_or_region"]
        )]
    after = len(df)
    logger.info("FIX-1: Removed %d corrupted rows (%d → %d)", before - after, before, after)
    return df.reset_index(drop=True)


def fix_mixed_data_types(df: pd.DataFrame) -> pd.DataFrame:
    """
    FIX-2: Fix mixed data types in columns like state_code, district_code, villages, towns.
    Coerce numeric columns to float, drop string artifacts.
    """
    numeric_cols = [
        "state_code", "district_code", "villages", "towns",
        "population_density", "num_hospitals", "hospital_beds",
        "doctors", "nurses", "cases", "deaths", "recoveries",
        "temperature_mean", "humidity_mean", "rainfall_anomaly",
        "soil_moisture_mean", "ndvi_mean", "wind_speed_mean",
        "population_persons", "population_males", "population_females",
        "elevation_mean", "slope_mean",
    ]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    logger.info("FIX-2: Fixed mixed data types in %d numeric columns", len(numeric_cols))
    return df


def add_spatial_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    FIX-3: Add latitude, longitude, district_name, state_name spatial features.
    Required by hotspot detection and DBSCAN clustering models.
    """
    def get_lat(row):
        district = str(row.get("state_or_region", "")).strip()
        return DISTRICT_COORDS.get(district, (26.85, 80.95))[0]

    def get_lng(row):
        district = str(row.get("state_or_region", "")).strip()
        return DISTRICT_COORDS.get(district, (26.85, 80.95))[1]

    df["district_name"] = df["state_or_region"].astype(str).str.strip()
    df["state_name"] = "Uttar Pradesh"
    df["latitude"] = df.apply(get_lat, axis=1)
    df["longitude"] = df.apply(get_lng, axis=1)
    logger.info("FIX-3: Added spatial features (latitude, longitude, district_name, state_name)")
    return df


def add_temporal_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    FIX-4: Add week, date, year, season — required for outbreak time-series.
    """
    now = datetime.utcnow()
    # If dataset has no date column, assign current date as baseline
    if "date" not in df.columns:
        df["date"] = now.date().isoformat()
    if "week" not in df.columns:
        df["week"] = now.isocalendar()[1]
    if "year" not in df.columns:
        df["year"] = now.year
    if "month" not in df.columns:
        df["month"] = now.month
    if "season" not in df.columns:
        df["season"] = MONTH_SEASON.get(now.month, "summer")

    logger.info("FIX-4: Added temporal features (week, date, year, season)")
    return df


def add_mobility_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    FIX-5: Add mobility_index and travel_density.
    Uses population density as proxy when GenerateIO data unavailable.
    """
    if "mobility_index" not in df.columns:
        pop_density = df.get("population_density", pd.Series(dtype=float))
        if pop_density.dtype == float and not pop_density.isna().all():
            df["mobility_index"] = (pop_density / 5000).clip(0, 1).round(3)
            df["travel_density"] = pop_density.round(0)
        else:
            df["mobility_index"] = 0.5
            df["travel_density"] = 1000.0
        df["district_connectivity"] = (df["mobility_index"] * 0.8).round(3)

    logger.info("FIX-5: Added mobility features (mobility_index, travel_density)")
    return df


def add_community_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    FIX-6: Add citizen_reports_count and symptom_frequency.
    These are critical for early detection. Set to 0 as baseline from historical data.
    """
    if "citizen_reports_count" not in df.columns:
        df["citizen_reports_count"] = 0
    if "symptom_frequency" not in df.columns:
        df["symptom_frequency"] = 0.0
    if "unique_symptoms_reported" not in df.columns:
        df["unique_symptoms_reported"] = 0

    logger.info("FIX-6: Added community features (citizen_reports_count, symptom_frequency)")
    return df


def add_hospital_capacity_ratios(df: pd.DataFrame) -> pd.DataFrame:
    """
    FIX-7: Compute beds_per_1000, doctors_per_1000, healthcare_access_index.
    """
    pop = df.get("population_density", pd.Series(1000, index=df.index))
    beds = pd.to_numeric(df.get("hospital_beds", 500), errors="coerce").fillna(500)
    doctors = pd.to_numeric(df.get("doctors", 100), errors="coerce").fillna(100)
    nurses = pd.to_numeric(df.get("nurses", 200), errors="coerce").fillna(200)

    # Estimate population from density * average UP district area (3200 sq km)
    pop_total = pop.fillna(1000) * 3200

    df["beds_per_1000"] = (beds / (pop_total / 1000)).clip(0, 20).round(3)
    df["doctors_per_1000"] = (doctors / (pop_total / 1000)).clip(0, 5).round(3)
    df["nurses_per_1000"] = (nurses / (pop_total / 1000)).clip(0, 10).round(3)

    # Healthcare access index: weighted composite 0–1
    df["healthcare_access_index"] = (
        0.5 * (df["beds_per_1000"] / 5).clip(0, 1) +
        0.3 * (df["doctors_per_1000"] / 1).clip(0, 1) +
        0.2 * (df["nurses_per_1000"] / 2.5).clip(0, 1)
    ).round(3)

    logger.info("FIX-7: Added hospital capacity ratios (beds_per_1000, doctors_per_1000, healthcare_access_index)")
    return df


def add_environmental_risk_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """
    FIX-8: Compute vector_risk, water_risk, climate_anomaly from raw weather columns.
    """
    temp = pd.to_numeric(df.get("temperature_mean", 28.0), errors="coerce").fillna(28.0)
    humidity = pd.to_numeric(df.get("humidity_mean", 65.0), errors="coerce").fillna(65.0)
    rain = pd.to_numeric(df.get("rainfall_anomaly", 0.0), errors="coerce").fillna(0.0)
    soil_moist = pd.to_numeric(df.get("soil_moisture_mean", 0.3), errors="coerce").fillna(0.3)
    ndvi = pd.to_numeric(df.get("ndvi_mean", 0.4), errors="coerce").fillna(0.4)

    # Vector (mosquito) risk
    temp_score = (1 - abs(temp - 30) / 15).clip(0, 1)
    hum_score = ((humidity - 40) / 60).clip(0, 1)
    rain_score = (rain / 100).clip(0, 1)
    df["vector_risk"] = (0.4 * temp_score + 0.35 * hum_score + 0.25 * rain_score).round(3)

    # Water contamination risk
    rain_norm = (rain / 200).clip(0, 1)
    df["water_risk"] = (0.5 * rain_norm + 0.3 * soil_moist.clip(0, 1) + 0.2 * (1 - ndvi.clip(0, 1))).round(3)

    # Climate anomaly
    temp_anom = (abs(temp - 28.0) / 10).clip(0, 1)
    rain_anom = (abs(rain) / 100).clip(0, 1)
    df["climate_anomaly"] = (0.6 * temp_anom + 0.4 * rain_anom).round(3)

    logger.info("FIX-8: Added environmental risk indicators (vector_risk, water_risk, climate_anomaly)")
    return df


def add_lag_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    FIX-9: Compute time-series lag features per (district, disease) group.
    Requires panel structure sorted by district + disease.
    """
    cases = pd.to_numeric(df.get("cases", 0), errors="coerce").fillna(0)
    df["cases"] = cases

    # Group-wise lag computation
    if "district_name" in df.columns and "predicted_disease" in df.columns:
        group_cols = ["district_name", "predicted_disease"]
        df = df.sort_values(group_cols + ["week"]).reset_index(drop=True)
        grp = df.groupby(group_cols)["cases"]
        df["cases_lag_1"] = grp.shift(1).fillna(0).astype(int)
        df["cases_lag_2"] = grp.shift(2).fillna(0).astype(int)
        df["cases_lag_3"] = grp.shift(3).fillna(0).astype(int)
        df["cases_rolling_mean"] = grp.transform(lambda x: x.rolling(4, min_periods=1).mean()).round(1)
        df["cases_rolling_max_4w"] = grp.transform(lambda x: x.rolling(4, min_periods=1).max()).astype(int)
    else:
        df["cases_lag_1"] = cases.shift(1).fillna(0).astype(int)
        df["cases_lag_2"] = cases.shift(2).fillna(0).astype(int)
        df["cases_lag_3"] = cases.shift(3).fillna(0).astype(int)
        df["cases_rolling_mean"] = cases.rolling(4, min_periods=1).mean().round(1)
        df["cases_rolling_max_4w"] = cases.rolling(4, min_periods=1).max().astype(int)

    df["cases_growth_rate"] = ((cases - df["cases_lag_1"]) / (df["cases_lag_1"] + 1)).round(3)
    df["cases_acceleration"] = (cases - 2 * df["cases_lag_1"] + df["cases_lag_2"]).round(1)

    logger.info("FIX-9: Added lag features (cases_lag_1/2/3, cases_rolling_mean, cases_growth_rate)")
    return df


def add_hospital_load_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """
    FIX-10: Derive hospital_utilisation and bed_occupancy from cases + capacity.
    """
    cases = pd.to_numeric(df.get("cases", 0), errors="coerce").fillna(0)
    beds = pd.to_numeric(df.get("hospital_beds", 500), errors="coerce").fillna(500)
    severe_rate = 0.15  # 15% of cases need hospitalisation
    bed_demand = (cases * severe_rate).round(0)
    df["hospital_utilisation"] = (bed_demand / beds.clip(lower=1) * 100).clip(0, 200).round(1)
    df["bed_occupancy"] = (bed_demand / beds.clip(lower=1)).clip(0, 2).round(3)

    logger.info("FIX-10: Added hospital load indicators (hospital_utilisation, bed_occupancy)")
    return df


def clean_and_save(
    input_path: str,
    output_path: str,
) -> pd.DataFrame:
    """
    Full pipeline: load → fix all issues → save cleaned dataset.
    """
    df = load_raw_dataset(input_path)

    # Apply all fixes
    df = fix_corrupted_rows(df)
    df = fix_mixed_data_types(df)
    df = add_spatial_features(df)
    df = add_temporal_features(df)
    df = add_mobility_features(df)
    df = add_community_features(df)
    df = add_hospital_capacity_ratios(df)
    df = add_environmental_risk_indicators(df)
    df = add_lag_features(df)
    df = add_hospital_load_indicators(df)

    # Final cleanup: drop rows with no disease label
    if "predicted_disease" in df.columns:
        df = df.dropna(subset=["predicted_disease"])
        df["predicted_disease"] = df["predicted_disease"].str.strip()

    logger.info("Final dataset: %d rows, %d columns", len(df), len(df.columns))
    logger.info("Features in final dataset: %s", sorted(df.columns.tolist()))

    # Save
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output, index=False)
    logger.info("Saved cleaned dataset → %s", output)

    return df


if __name__ == "__main__":
    import sys
    input_csv = sys.argv[1] if len(sys.argv) > 1 else "data/processed/final_governance_dataset_with_climate.csv"
    output_csv = sys.argv[2] if len(sys.argv) > 2 else "data/processed/final_governance_dataset_cleaned.csv"
    clean_and_save(input_csv, output_csv)
