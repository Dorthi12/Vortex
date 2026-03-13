"""
=============================================================================
MASTER DATASET LOADER — Governance AI Data API
API   : https://notour-toploftily-carrie.ngrok-free.dev
Schema: 61-column district-level crop + weather + governance dataset

Columns identified from API (governance_master_dataset.csv schema):
  id, year, state_name, state_code, district, district_code,
  crop_name, crop_code, crop_type, season,
  [weather cols]: rainfall_mean, temp_mean, humidity_mean, wind_speed_mean,
  [soil/land]:    landcover_mode, soil_type, ndvi_mean, soil_moisture_mean,
  [location]:     latitude_y, longitude_y,
  [socio]:        population_density, market_distance, irrigation_coverage,
                  fertilizer_use, insurance_coverage, smallholder_pct,
  [production]:   area_sown, production, yield_value, production_efficiency,
  [anomaly]:      rainfall_anomaly, temp_anomaly, drought_index,
  [risk]:         pest_incidence, disease_incidence, flood_risk, stress_score,
  [finance]:      credit_access, msp_coverage,
  [geo]:          .geo_y (GeoJSON polygon)
=============================================================================
"""

import requests
import pandas as pd
import numpy as np
import json
import time
from typing import Optional

# ─────────────────────────────────────────────────────────────────────────────
# API CONFIG
# ─────────────────────────────────────────────────────────────────────────────

API_BASE = "https://notour-toploftily-carrie.ngrok-free.dev"

ENDPOINTS = {
    "sample":      f"{API_BASE}/dataset/sample",
    "full":        f"{API_BASE}/dataset",
    "district":    f"{API_BASE}/dataset/district",
    "state":       f"{API_BASE}/dataset/state",
    "crop":        f"{API_BASE}/dataset/crop",
    "hazard":      f"{API_BASE}/hazard/predict",
    "schema":      f"{API_BASE}/dataset/schema",
    "swagger":     f"{API_BASE}/docs",
}

HEADERS = {
    "ngrok-skip-browser-warning": "true",
    "User-Agent": "AgriAdvisory-AI/1.0",
    "Accept": "application/json",
    "Content-Type": "application/json",
}

# ─────────────────────────────────────────────────────────────────────────────
# COLUMN MAPPING — from your 61-column governance_master_dataset
# ─────────────────────────────────────────────────────────────────────────────

# Maps API column names → internal feature names used by our 6 models
COLUMN_MAP = {
    # Identity
    "id":                   "id",
    "year":                 "year",
    "state_name":           "state",
    "state_code":           "state_code",
    "district":             "district",
    "district_code":        "district_code",

    # Crop
    "crop_name":            "crop",
    "crop_code":            "crop_code",
    "crop_type":            "crop_type",
    "season":               "season",

    # Weather
    "rainfall_mean":        "annual_rainfall",
    "temp_mean":            "mean_temp",
    "humidity_mean":        "humidity",
    "wind_speed_mean":      "wind_speed",
    "rainfall_anomaly":     "rainfall_anomaly",
    "temp_anomaly":         "temp_anomaly",

    # Soil / Land
    "soil_moisture_mean":   "soil_moisture",
    "ndvi_mean":            "ndvi",
    "landcover_mode":       "landcover_mode",

    # Location
    "latitude_y":           "latitude",
    "longitude_y":          "longitude",

    # Socioeconomic
    "population_density":   "population_density",
    "irrigation_coverage":  "irrigation_pct",
    "fertilizer_use":       "fertilizer_kg_ha",
    "insurance_coverage":   "insurance_pct",
    "smallholder_pct":      "smallholder_pct",
    "market_distance":      "market_access",
    "credit_access":        "credit_access",
    "msp_coverage":         "msp_coverage",

    # Production
    "area_sown":            "area_ha",
    "production":           "total_production",
    "yield_value":          "yield_tonne_ha",
    "production_efficiency":"production_efficiency",
    "mean_y":               "mean_y",

    # Risk / Anomaly
    "drought_index":        "drought_index",
    "flood_risk":           "flood_risk",
    "stress_score":         "stress_score_raw",
    "pest_incidence":       "pest_incidence",
    "disease_incidence":    "disease_incidence",
    "soil_ph":              "soil_ph",
    "soil_type":            "soil_type",
    "elevation":            "elevation",
    "evapotranspiration":   "evapotranspiration",
    "vpd":                  "vpd",
}

# ─────────────────────────────────────────────────────────────────────────────
# MASTER DATA LOADER CLASS
# ─────────────────────────────────────────────────────────────────────────────

class GovernanceMasterDataset:
    """
    Loads governance master dataset from the ngrok API.
    Provides clean DataFrames ready for all 6 ML models.

    Usage:
        gds = GovernanceMasterDataset()
        df  = gds.load()                    # full dataset
        df  = gds.load_sample()             # sample (faster)
        df  = gds.for_model(1)              # pre-processed for model 1
    """

    def __init__(self, base_url: str = API_BASE, cache_path: str = "/tmp/governance_cache.csv"):
        self.base_url   = base_url.rstrip("/")
        self.cache_path = cache_path
        self._raw_df    = None
        self._clean_df  = None

    # ── Fetch ─────────────────────────────────────────────────────────────────

    def _get(self, endpoint: str, params: dict = None, retries: int = 3) -> dict | list:
        for attempt in range(retries):
            try:
                r = requests.get(
                    endpoint, headers=HEADERS, params=params, timeout=20
                )
                r.raise_for_status()
                return r.json()
            except requests.exceptions.JSONDecodeError:
                return r.text
            except requests.exceptions.ConnectionError as e:
                print(f"[WARN] Connection attempt {attempt+1}/{retries}: {e}")
                if attempt < retries - 1:
                    time.sleep(2 ** attempt)
                else:
                    raise
            except Exception as e:
                print(f"[ERROR] API call failed: {e}")
                raise

    def load_sample(self, use_cache: bool = True) -> pd.DataFrame:
        """Fetch /dataset/sample endpoint."""
        import os
        if use_cache and os.path.exists(self.cache_path):
            print(f"[INFO] Loading cached dataset from {self.cache_path}")
            df = pd.read_csv(self.cache_path)
        else:
            print(f"[INFO] Fetching sample from {ENDPOINTS['sample']}")
            data = self._get(ENDPOINTS["sample"])
            if isinstance(data, list):
                df = pd.DataFrame(data)
            elif isinstance(data, dict) and "data" in data:
                df = pd.DataFrame(data["data"])
            else:
                df = pd.DataFrame([data])
            df.to_csv(self.cache_path, index=False)
            print(f"[INFO] Cached {len(df)} rows to {self.cache_path}")

        self._raw_df   = df
        self._clean_df = self._clean(df)
        return self._clean_df

    def load_full(self, limit: int = None, use_cache: bool = True) -> pd.DataFrame:
        """Fetch full /dataset endpoint with optional limit."""
        import os
        cache = self.cache_path.replace(".csv", "_full.csv")
        if use_cache and os.path.exists(cache):
            print(f"[INFO] Loading full cached dataset")
            df = pd.read_csv(cache)
        else:
            print(f"[INFO] Fetching full dataset from API...")
            params = {"limit": limit} if limit else {}
            data   = self._get(ENDPOINTS["full"], params=params)
            if isinstance(data, list):
                df = pd.DataFrame(data)
            elif isinstance(data, dict):
                key = "data" if "data" in data else list(data.keys())[0]
                df  = pd.DataFrame(data[key])
            else:
                df = pd.DataFrame()
            df.to_csv(cache, index=False)
            print(f"[INFO] Cached {len(df)} rows")

        self._raw_df   = df
        self._clean_df = self._clean(df)
        return self._clean_df

    def load_by_district(self, district: str) -> pd.DataFrame:
        """Fetch data filtered by district."""
        data = self._get(ENDPOINTS["district"], params={"name": district})
        df   = pd.DataFrame(data if isinstance(data, list) else data.get("data", [data]))
        return self._clean(df)

    def load_by_state(self, state: str) -> pd.DataFrame:
        data = self._get(ENDPOINTS["state"], params={"name": state})
        df   = pd.DataFrame(data if isinstance(data, list) else data.get("data", [data]))
        return self._clean(df)

    def load_by_crop(self, crop: str) -> pd.DataFrame:
        data = self._get(ENDPOINTS["crop"], params={"name": crop})
        df   = pd.DataFrame(data if isinstance(data, list) else data.get("data", [data]))
        return self._clean(df)

    # ── Hazard Prediction endpoint ─────────────────────────────────────────────

    def predict_hazard(self, features: dict) -> dict:
        """
        POST to /hazard/predict with feature dict.
        Returns hazard prediction from the Governance AI engine.
        """
        try:
            r = requests.post(
                ENDPOINTS["hazard"],
                headers=HEADERS,
                json=features,
                timeout=20,
            )
            r.raise_for_status()
            return r.json()
        except Exception as e:
            print(f"[WARN] Hazard API: {e}")
            return {"error": str(e)}

    def predict_hazard_batch(self, df: pd.DataFrame) -> pd.DataFrame:
        """Run hazard prediction for each row in a DataFrame."""
        results = []
        for _, row in df.iterrows():
            feat   = row.to_dict()
            result = self.predict_hazard(feat)
            results.append(result)
        return pd.DataFrame(results)

    # ── Cleaning & Feature Engineering ────────────────────────────────────────

    def _clean(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Rename columns, fix dtypes, fill missing values.
        Produces a model-ready DataFrame.
        """
        df = df.copy()

        # Rename columns using map
        rename = {k: v for k, v in COLUMN_MAP.items() if k in df.columns}
        df.rename(columns=rename, inplace=True)

        # Drop geo JSON column (not used in ML)
        for col in [".geo_y", "geo_y", "geometry"]:
            if col in df.columns:
                df.drop(columns=[col], inplace=True)

        # Infer / derive missing columns
        df = self._derive_features(df)

        # Numeric coercion
        num_cols = [c for c in df.columns if c not in
                    ["state","district","crop","season","crop_type","soil_type"]]
        for c in num_cols:
            if c in df.columns:
                df[c] = pd.to_numeric(df[c], errors="coerce")

        # Fill numeric NaN with median
        num_df = df.select_dtypes(include=[np.number])
        df[num_df.columns] = num_df.fillna(num_df.median())

        # Fill string NaN
        for c in df.select_dtypes(include="object").columns:
            df[c] = df[c].fillna("Unknown")

        print(f"[INFO] Clean dataset: {len(df):,} rows × {len(df.columns)} cols")
        return df

    def _derive_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Derive missing features that models need."""

        # NDVI proxy if missing
        if "ndvi" not in df.columns:
            if "soil_moisture" in df.columns and "humidity" in df.columns:
                df["ndvi"] = np.clip(
                    df["soil_moisture"] / 100 * 0.5 + df["humidity"] / 100 * 0.3 + 0.2,
                    0.1, 0.9
                )
            else:
                df["ndvi"] = 0.5

        # Temp stress
        if "mean_temp" in df.columns:
            df["temp_stress_deg"] = (
                np.maximum(0, df["mean_temp"] - 38) +
                np.maximum(0, 10 - df["mean_temp"])
            )

        # Soil type index if string
        SOIL_ENC = {"Sandy":0,"Sandy Loam":1,"Loam":2,"Clay Loam":3,
                    "Clay":4,"Black":5,"Red":6,"Alluvial":7}
        if "soil_type" in df.columns:
            df["soil_type_idx"] = df["soil_type"].map(SOIL_ENC).fillna(2).astype(int)
        else:
            df["soil_type_idx"] = 2

        # Soil pH default
        if "soil_ph" not in df.columns:
            df["soil_ph"] = 6.8

        # Irrigation binary
        if "irrigation" not in df.columns:
            if "irrigation_pct" in df.columns:
                df["irrigation"] = (df["irrigation_pct"] > 30).astype(int)
            else:
                df["irrigation"] = 0

        # Elevation default
        if "elevation" not in df.columns:
            df["elevation"] = 150.0

        # VPD proxy
        if "vpd" not in df.columns:
            if "mean_temp" in df.columns and "humidity" in df.columns:
                T  = df["mean_temp"]
                RH = df["humidity"]
                es = 0.6108 * np.exp(17.27 * T / (T + 237.3))
                df["vpd"] = es * (1 - RH / 100)
            else:
                df["vpd"] = 1.5

        # ET proxy
        if "evapotranspiration" not in df.columns:
            df["evapotranspiration"] = 0.18

        # Production efficiency (if both area and production available)
        if "production_efficiency" not in df.columns:
            if "total_production" in df.columns and "area_ha" in df.columns:
                df["production_efficiency"] = (
                    df["total_production"] / df["area_ha"].replace(0, np.nan)
                ).fillna(1.0)

        # Market access score from distance (invert)
        if "market_access" not in df.columns:
            df["market_access"] = 5.0

        # Crop index
        CROPS = ["Rice","Wheat","Maize","Sugarcane","Cotton","Soybean",
                 "Groundnut","Mustard","Pulses","Vegetables","Sorghum","Barley"]
        if "crop" in df.columns:
            df["crop_idx"] = df["crop"].map({c: i for i, c in enumerate(CROPS)}).fillna(0).astype(int)

        # Season index
        SEASONS = ["Kharif","Rabi","Zaid","Annual"]
        if "season" in df.columns:
            df["season_idx"] = df["season"].map({s: i for i, s in enumerate(SEASONS)}).fillna(0).astype(int)

        # State index
        if "state" in df.columns:
            states = df["state"].unique()
            state_map = {s: i for i, s in enumerate(states)}
            df["state_idx"] = df["state"].map(state_map).fillna(0).astype(int)

        # Risk label from raw stress (for model 6)
        if "stress_score_raw" in df.columns:
            df["risk_label"] = pd.cut(
                df["stress_score_raw"],
                bins=[-np.inf, 25, 50, 75, np.inf],
                labels=[0, 1, 2, 3]
            ).astype(int)

        return df

    # ── Model-specific DataFrames ──────────────────────────────────────────────

    def for_model(self, model_num: int) -> pd.DataFrame:
        """Return feature/target split ready for a specific model."""
        df = self._clean_df if self._clean_df is not None else self.load_sample()

        if model_num == 1:
            return self._for_model1(df)
        elif model_num == 2:
            return self._for_model2(df)
        elif model_num == 4:
            return self._for_model4(df)
        elif model_num == 5:
            return self._for_model5(df)
        elif model_num == 6:
            return self._for_model6(df)
        else:
            return df

    def _for_model1(self, df):
        FEATS = ["year","annual_rainfall","mean_temp","temp_stress_deg",
                 "soil_moisture","ndvi","fertilizer_kg_ha","irrigation",
                 "soil_ph","soil_type_idx","crop_idx","state_idx","season_idx"]
        TARGET = "yield_tonne_ha"
        needed = [f for f in FEATS if f in df.columns]
        if TARGET in df.columns:
            out = df[needed + [TARGET]].dropna()
        else:
            out = df[needed].dropna()
        print(f"  Model 1 features: {len(out):,} rows × {len(needed)} feats")
        return out

    def _for_model2(self, df):
        FEATS = ["mean_temp","humidity","annual_rainfall","soil_moisture",
                 "vpd","wind_speed","evapotranspiration","ndvi",
                 "crop_idx","season_idx"]
        needed = [f for f in FEATS if f in df.columns]
        return df[needed].dropna()

    def _for_model4(self, df):
        FEATS = ["mean_temp","humidity","wind_speed","soil_moisture",
                 "annual_rainfall","evapotranspiration","ndvi",
                 "crop_idx","season_idx","area_ha","elevation"]
        needed = [f for f in FEATS if f in df.columns]
        return df[needed].dropna()

    def _for_model5(self, df):
        FEATS = ["mean_temp","annual_rainfall","humidity","soil_ph",
                 "soil_type_idx","elevation","fertilizer_kg_ha","ndvi","crop_idx"]
        needed = [f for f in FEATS if f in df.columns]
        if "crop_idx" in df.columns:
            return df[needed + ["crop_idx"]].dropna()
        return df[needed].dropna()

    def _for_model6(self, df):
        FEATS = ["yield_tonne_ha","stress_score_raw","soil_moisture",
                 "mean_temp","humidity","annual_rainfall","wind_speed","vpd",
                 "smallholder_pct","insurance_pct","irrigation_pct","market_access",
                 "disease_incidence","pest_incidence","rainfall_anomaly","drought_index"]
        needed = [f for f in FEATS if f in df.columns]
        if "risk_label" in df.columns:
            return df[needed + ["risk_label"]].dropna()
        return df[needed].dropna()

    # ── Utility ────────────────────────────────────────────────────────────────

    def summary(self) -> None:
        df = self._clean_df
        if df is None:
            print("[WARN] No data loaded yet. Call load_sample() first.")
            return
        print(f"\n{'='*60}")
        print(f"  Governance Master Dataset Summary")
        print(f"{'='*60}")
        print(f"  Rows       : {len(df):,}")
        print(f"  Columns    : {len(df.columns)}")
        if "year" in df.columns:
            print(f"  Year range : {int(df.year.min())} – {int(df.year.max())}")
        if "state" in df.columns:
            print(f"  States     : {df.state.nunique()}")
        if "district" in df.columns:
            print(f"  Districts  : {df.district.nunique()}")
        if "crop" in df.columns:
            print(f"  Crops      : {df.crop.nunique()} — {list(df.crop.unique()[:8])}")
        if "yield_tonne_ha" in df.columns:
            y = df["yield_tonne_ha"].dropna()
            print(f"  Yield      : {y.min():.2f} – {y.max():.2f} t/ha (μ={y.mean():.2f})")
        print(f"  Columns    : {list(df.columns)}")
        print(f"{'='*60}")

    def to_live_feature_dict(self, district: str = None) -> dict:
        """
        Pull the most recent row for a district → dict for live prediction.
        Falls back to column means if district not found.
        """
        df = self._clean_df
        if df is None:
            return {}
        if district and "district" in df.columns:
            sub = df[df["district"].str.lower() == district.lower()]
            if len(sub) > 0:
                row = sub.sort_values("year", ascending=False).iloc[0]
                return row.to_dict()
        # Return means as defaults
        return df.select_dtypes(include=[np.number]).mean().to_dict()


# ─────────────────────────────────────────────────────────────────────────────
# STANDALONE FETCH FUNCTION (used by all 6 model files)
# ─────────────────────────────────────────────────────────────────────────────

def fetch_master_dataset(use_cache: bool = True,
                         sample: bool = True) -> tuple[pd.DataFrame, GovernanceMasterDataset]:
    """
    Convenience function: returns (clean_df, gds_instance).
    
    Usage in any model file:
        from master_data_loader import fetch_master_dataset
        df, gds = fetch_master_dataset()
    """
    gds = GovernanceMasterDataset()
    if sample:
        df = gds.load_sample(use_cache=use_cache)
    else:
        df = gds.load_full(use_cache=use_cache)
    return df, gds


def get_latest_district_features(district: str,
                                  use_cache: bool = True) -> dict:
    """Get the most recent feature dict for a district from the API."""
    _, gds = fetch_master_dataset(use_cache=use_cache)
    return gds.to_live_feature_dict(district)


# ─────────────────────────────────────────────────────────────────────────────
# FALLBACK: synthetic data matching API schema (when API unavailable)
# ─────────────────────────────────────────────────────────────────────────────

def generate_fallback_data(n: int = 5000) -> pd.DataFrame:
    """
    Generate synthetic data that exactly matches the governance_master_dataset
    schema so models can train even without API access.
    Mirrors the column structure visible in the Swagger screenshots.
    """
    rng    = np.random.RandomState(42)
    STATES = ["Andhra Pradesh","Bihar","Gujarat","Karnataka","Maharashtra",
              "Punjab","Rajasthan","Tamil Nadu","Uttar Pradesh","West Bengal",
              "Madhya Pradesh","Haryana","Odisha","Telangana","Assam"]
    DISTS  = ["chittoor","patna","jaipur","lucknow","hyderabad",
              "amritsar","nagpur","bhopal","mysore","coimbatore"]
    CROPS  = ["Rice","Wheat","Maize","Sugarcane","Cotton","Soybean",
              "Groundnut","Mustard","Pulses","Vegetables"]
    SEASONS= ["Kharif","Rabi","Zaid","Annual"]
    CTYPES = ["Cereals","Pulses","Oilseeds","Cash Crops","Horticulture"]
    SOILS  = ["Alluvial","Black","Red","Laterite","Desert"]

    rows = []
    for i in range(n):
        state  = rng.choice(STATES)
        dist   = rng.choice(DISTS)
        crop   = rng.choice(CROPS)
        season = rng.choice(SEASONS)
        year   = int(rng.randint(1997, 2024))

        temp     = float(rng.uniform(15, 40))
        rain     = float(rng.uniform(200, 2500))
        humidity = float(rng.uniform(30, 95))
        sm       = float(rng.uniform(10, 60))
        ndvi     = float(rng.uniform(0.2, 0.85))
        wind     = float(rng.uniform(2, 35))
        area     = float(rng.uniform(0.5, 80))
        fert     = float(rng.uniform(40, 350))
        irr_pct  = float(rng.uniform(5, 90))
        pop_den  = float(rng.uniform(50, 1200))
        ph       = float(rng.uniform(5.0, 8.5))
        elev     = float(rng.uniform(0, 1500))

        # Yield calc
        CROP_BASE = {"Rice":2.8,"Wheat":3.2,"Maize":3.5,"Sugarcane":68,"Cotton":1.8,
                     "Soybean":1.9,"Groundnut":1.7,"Mustard":1.4,"Pulses":1.0,"Vegetables":12}
        base = CROP_BASE.get(crop, 2.5)
        rain_f  = min(rain / 800, 1.4)
        temp_f  = 1.0 if 18 <= temp <= 32 else 0.85
        ndvi_b  = (ndvi - 0.5) * 0.8
        fert_b  = min(fert/300, 1) * 0.6
        irr_b   = (irr_pct/100) * 0.4
        yield_v = max(0.1, base * rain_f * temp_f + ndvi_b + fert_b + irr_b
                      + rng.normal(0, 0.2))

        prod    = yield_v * area
        eff     = yield_v / base
        vpd     = 0.6108 * np.exp(17.27*temp/(temp+237.3)) * (1 - humidity/100)
        rain_an = float(rng.normal(0, 150))
        drought = max(0, min(1, 1 - rain/800))
        flood   = float(rng.random() < 0.1)
        stress  = max(0, (temp - 38)*2 + max(0, 10-temp)*2 + drought*40
                      + flood*30 + rng.normal(0, 5))
        stress  = min(100, stress)

        lat = {"Andhra Pradesh":14.5,"Bihar":25.1,"Gujarat":22.3,
               "Karnataka":15.3,"Maharashtra":19.7,"Punjab":31.1,
               "Rajasthan":27.0,"Tamil Nadu":11.1,"Uttar Pradesh":27.6,
               "West Bengal":22.6,"Madhya Pradesh":23.5,"Haryana":29.1,
               "Odisha":20.9,"Telangana":17.4,"Assam":26.2}.get(state, 20.5)
        lon = {"Andhra Pradesh":79.7,"Bihar":85.3,"Gujarat":71.6,
               "Karnataka":75.7,"Maharashtra":75.7,"Punjab":75.3,
               "Rajasthan":74.2,"Tamil Nadu":78.6,"Uttar Pradesh":80.9,
               "West Bengal":87.9,"Madhya Pradesh":77.7,"Haryana":76.1,
               "Odisha":84.8,"Telangana":78.5,"Assam":92.9}.get(state, 78.9)

        rows.append({
            "id":                   i + 37,
            "year":                 str(year) + f"-{year+1}",
            "state_name":           state,
            "state_code":           STATES.index(state) + 1,
            "district":             dist,
            "district_code":        int(rng.randint(100, 999)),
            "crop_name":            crop,
            "crop_code":            float(rng.randint(100, 600)),
            "crop_type":            rng.choice(CTYPES),
            "season":               season,
            "rainfall_mean":        round(rain, 1),
            "temp_mean":            round(temp, 1),
            "humidity_mean":        round(humidity, 1),
            "wind_speed_mean":      round(wind, 2),
            "rainfall_anomaly":     round(rain_an, 2),
            "soil_moisture_mean":   round(sm, 1),
            "ndvi_mean":            round(ndvi, 3),
            "landcover_mode":       float(rng.choice([10,20,30,40,50])),
            "latitude_y":           round(lat + rng.uniform(-2, 2), 6),
            "longitude_y":          round(lon + rng.uniform(-2, 2), 6),
            "mean_y":               round(yield_v * area, 3),
            "population_density":   round(pop_den, 2),
            "irrigation_coverage":  round(irr_pct, 1),
            "fertilizer_use":       round(fert, 1),
            "insurance_coverage":   round(float(rng.uniform(5, 70)), 1),
            "smallholder_pct":      round(float(rng.uniform(30, 95)), 1),
            "market_distance":      round(float(rng.uniform(5, 150)), 1),
            "credit_access":        round(float(rng.uniform(10, 80)), 1),
            "msp_coverage":         round(float(rng.uniform(20, 90)), 1),
            "area_sown":            round(area, 2),
            "production":           round(prod, 2),
            "yield_value":          round(yield_v, 3),
            "production_efficiency":round(eff, 4),
            "soil_ph":              round(ph, 2),
            "soil_type":            rng.choice(SOILS),
            "elevation":            round(elev, 1),
            "drought_index":        round(drought, 3),
            "flood_risk":           round(flood, 2),
            "stress_score":         round(stress, 2),
            "pest_incidence":       round(float(rng.uniform(0, 50)), 2),
            "disease_incidence":    round(float(rng.uniform(0, 40)), 2),
            "evapotranspiration":   round(float(rng.uniform(0.1, 0.5)), 4),
            "vpd":                  round(vpd, 4),
            "temp_anomaly":         round(float(rng.normal(0, 2)), 2),
        })

    df = pd.DataFrame(rows)
    print(f"[INFO] Fallback synthetic dataset: {len(df):,} rows × {len(df.columns)} cols")
    print(f"       (Matches governance_master_dataset.csv schema)")
    return df


# ─────────────────────────────────────────────────────────────────────────────
# SMART LOADER: API first, fallback to synthetic
# ─────────────────────────────────────────────────────────────────────────────

def smart_load(n_fallback: int = 8000,
               use_cache: bool = True) -> tuple[pd.DataFrame, GovernanceMasterDataset]:
    """
    Try to load from governance API.
    If unreachable, generate matching synthetic data.
    Returns (clean_df, gds_instance) either way.
    """
    gds = GovernanceMasterDataset()
    try:
        df = gds.load_sample(use_cache=use_cache)
        if len(df) > 0:
            print(f"[INFO] Loaded {len(df):,} rows from Governance API ✓")
            return df, gds
    except Exception as e:
        print(f"[WARN] Governance API unavailable: {e}")
        print(f"[INFO] Generating synthetic fallback dataset ({n_fallback:,} rows)...")

    raw_df         = generate_fallback_data(n_fallback)
    gds._raw_df    = raw_df
    gds._clean_df  = gds._clean(raw_df)
    return gds._clean_df, gds


# ─────────────────────────────────────────────────────────────────────────────
# MAIN (standalone test)
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("="*60)
    print("  Testing Governance Master Dataset Loader")
    print("="*60)

    df, gds = smart_load(n_fallback=5000)
    gds.summary()

    print("\n── First 3 rows ──────────────────────────────────────")
    pd.set_option("display.max_columns", 10)
    pd.set_option("display.width", 120)
    print(df.head(3))

    print("\n── Model-ready feature sets ──────────────────────────")
    for m in [1, 2, 4, 5, 6]:
        mdf = gds.for_model(m)
        print(f"  Model {m}: {mdf.shape[0]:,} rows × {mdf.shape[1]} cols")

    print("\n── Hazard prediction test ────────────────────────────")
    feat  = gds.to_live_feature_dict("patna")
    print(f"  Sample feature keys: {list(feat.keys())[:10]}")

    print("\n── Done ──────────────────────────────────────────────")
