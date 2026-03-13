"""
services/data_services.py
────────────────────────────────────────────────────────────────
Unified data access layer.
Loads and caches:
  • Official governance / hospital capacity dataset
  • District metadata
  • Historical case time series
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np
import pandas as pd

from disease_prediction.config.settings import DISTRICTS_UP

logger = logging.getLogger(__name__)

DATASET_PATH = Path("data/processed/final_governance_dataset_with_climate.csv")


class DataService:
    """
    Central data service that provides clean, ready-to-use
    DataFrames to all model services.
    """

    def __init__(self):
        self._df: Optional[pd.DataFrame] = None
        self._district_lookup: Dict[str, dict] = {d["name"]: d for d in DISTRICTS_UP}

    def load_dataset(self, path: Optional[str] = None) -> pd.DataFrame:
        """Load and clean the governance dataset."""
        csv_path = Path(path) if path else DATASET_PATH
        if not csv_path.exists():
            logger.warning("Dataset not found at %s — using synthetic data", csv_path)
            return self._generate_synthetic()

        logger.info("Loading dataset from %s", csv_path)
        df = pd.read_csv(csv_path, low_memory=False)

        # Clean numeric columns
        num_cols = [
            "population_density", "num_hospitals", "hospital_beds",
            "doctors", "nurses", "cases", "deaths", "recoveries",
            "temperature_mean", "humidity_mean", "rainfall_anomaly",
            "soil_moisture_mean", "ndvi_mean", "wind_speed_mean",
        ]
        for col in num_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")

        # Drop rows with no disease label
        df = df.dropna(subset=["predicted_disease"])
        df["predicted_disease"] = df["predicted_disease"].str.strip()

        self._df = df
        logger.info("Dataset loaded: %d rows, %d diseases", len(df), df["predicted_disease"].nunique())
        return df

    def _generate_synthetic(self) -> pd.DataFrame:
        """Generate synthetic fallback data for development."""
        from disease_prediction.config.settings import DISEASE_SYMPTOMS_KB
        import random
        diseases = list(DISEASE_SYMPTOMS_KB.keys())
        rows = []
        for _ in range(1000):
            disease = random.choice(diseases)
            rows.append({
                "predicted_disease": disease,
                "cases": random.randint(1, 50),
                "deaths": random.randint(0, 5),
                "recoveries": random.randint(0, 30),
                "population_density": random.uniform(200, 5000),
                "num_hospitals": random.randint(1, 100),
                "hospital_beds": random.randint(50, 3000),
                "doctors": random.randint(10, 500),
                "nurses": random.randint(20, 1000),
                "temperature_mean": random.uniform(20, 40),
                "humidity_mean": random.uniform(30, 90),
                "rainfall_anomaly": random.uniform(-100, 500),
            })
        return pd.DataFrame(rows)

    def get_disease_case_stats(self, disease: str) -> Dict:
        """Get aggregate stats for a disease from the dataset."""
        if self._df is None:
            self.load_dataset()
        sub = self._df[self._df["predicted_disease"] == disease]
        if sub.empty:
            return {"disease": disease, "total_rows": 0}
        return {
            "disease": disease,
            "total_rows": len(sub),
            "avg_cases": round(float(sub["cases"].mean()), 1),
            "max_cases": int(sub["cases"].max()),
            "avg_deaths": round(float(sub["deaths"].mean()), 1),
            "avg_recoveries": round(float(sub["recoveries"].mean()), 1),
            "avg_temperature": round(float(sub["temperature_mean"].mean()), 1),
            "avg_humidity": round(float(sub["humidity_mean"].mean()), 1),
        }

    def get_district(self, name: str) -> Optional[dict]:
        return self._district_lookup.get(name)

    def all_diseases(self) -> List[str]:
        if self._df is None:
            self.load_dataset()
        return sorted(self._df["predicted_disease"].unique().tolist())

    def generate_weekly_cases(self, district: str, disease: str, weeks: int = 8) -> List[int]:
        """Simulate or retrieve weekly case history for lag features."""
        import random
        seed = hash(f"{district}{disease}") % 1000
        random.seed(seed)
        base = random.randint(3, 20)
        trend = random.uniform(-0.05, 0.15)
        series = []
        val = base
        for _ in range(weeks):
            val = max(0, int(val * (1 + trend) + random.randint(-2, 5)))
            series.append(val)
        return series


# Singleton
data_service = DataService()
