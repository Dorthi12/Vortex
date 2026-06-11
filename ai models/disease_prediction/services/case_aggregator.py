"""
services/case_aggregator.py
────────────────────────────────────────────────────────────────
Model 3 — District Case Aggregator
Combines:
  • Community predictions (from citizen posts)
  • Official district datasets
  • Geospatial lat/lng → district mapping

Outputs district_feature_store rows with case counts.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


class CaseAggregator:
    """
    Aggregates disease case reports (daily, weekly, district-level).
    Maps citizen GPS coordinates → district name.
    Merges community predictions with official health data.
    """

    def __init__(self):
        self._case_store: Dict[str, List[dict]] = {}  # district → list of cases
        self._prediction_store: List[dict] = []        # community predictions

    # ── GEO MAPPING ──────────────────────────────────────────
    @staticmethod
    def lat_lng_to_district(
        lat: float, lng: float, districts: List[dict]
    ) -> Optional[str]:
        """
        Map lat/lng coordinates → nearest district (Euclidean in degree space).
        In production: use PostGIS ST_Within for precise polygon lookup.
        """
        if not districts:
            return None
        best, best_dist = None, float("inf")
        for d in districts:
            dist = ((lat - d["lat"]) ** 2 + (lng - d["lng"]) ** 2) ** 0.5
            if dist < best_dist:
                best_dist = dist
                best = d["name"]
        return best

    # ── INGEST COMMUNITY PREDICTION ───────────────────────────
    def ingest_community_prediction(
        self,
        disease: str,
        district: str,
        confidence: float,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        timestamp: Optional[datetime] = None,
    ):
        """Record a community (citizen) disease prediction."""
        ts = timestamp or datetime.utcnow()
        self._prediction_store.append({
            "disease": disease,
            "district": district,
            "confidence": confidence,
            "lat": lat,
            "lng": lng,
            "timestamp": ts.isoformat(),
            "week": ts.isocalendar()[1],
            "year": ts.year,
        })

    # ── INGEST OFFICIAL CASE ──────────────────────────────────
    def ingest_official_case(
        self,
        district: str,
        disease: str,
        cases: int,
        deaths: int = 0,
        recoveries: int = 0,
        date: Optional[datetime] = None,
    ):
        """Record an officially confirmed case count."""
        ts = date or datetime.utcnow()
        if district not in self._case_store:
            self._case_store[district] = []
        self._case_store[district].append({
            "disease": disease,
            "cases": cases,
            "deaths": deaths,
            "recoveries": recoveries,
            "date": ts.date().isoformat(),
            "week": ts.isocalendar()[1],
            "year": ts.year,
        })

    # ── DAILY AGGREGATION ────────────────────────────────────
    def aggregate_daily(
        self, district: str, disease: str, date: Optional[datetime] = None
    ) -> Dict:
        """Sum case counts for a district/disease on a given day."""
        target_date = (date or datetime.utcnow()).date().isoformat()
        cases = self._case_store.get(district, [])
        day_cases = [
            c for c in cases
            if c["disease"] == disease and c["date"] == target_date
        ]
        community = [
            p for p in self._prediction_store
            if p["disease"] == disease and p["district"] == district
            and p["timestamp"][:10] == target_date
        ]
        return {
            "district": district,
            "disease": disease,
            "date": target_date,
            "official_cases": sum(c["cases"] for c in day_cases),
            "official_deaths": sum(c["deaths"] for c in day_cases),
            "official_recoveries": sum(c["recoveries"] for c in day_cases),
            "community_reports": len(community),
            "community_avg_confidence": (
                float(np.mean([c["confidence"] for c in community]))
                if community else 0.0
            ),
            "total_estimated_cases": sum(c["cases"] for c in day_cases)
            + int(len(community) * 0.3),  # community predictions add ~30% uplift
        }

    # ── WEEKLY AGGREGATION ────────────────────────────────────
    def aggregate_weekly(
        self, district: str, disease: str, weeks_back: int = 8
    ) -> List[Dict]:
        """Build weekly case time series for a district/disease."""
        now = datetime.utcnow()
        series = []
        for w in range(weeks_back, -1, -1):
            target = now - timedelta(weeks=w)
            week_num = target.isocalendar()[1]
            year = target.year
            cases = [
                c for c in self._case_store.get(district, [])
                if c["disease"] == disease
                and c["week"] == week_num and c["year"] == year
            ]
            community = [
                p for p in self._prediction_store
                if p["disease"] == disease and p["district"] == district
                and p["week"] == week_num and p["year"] == year
            ]
            series.append({
                "year": year,
                "week": week_num,
                "official_cases": sum(c["cases"] for c in cases),
                "community_reports": len(community),
                "total_cases": sum(c["cases"] for c in cases) + len(community) // 3,
            })
        return series

    # ── DISTRICT-LEVEL SUMMARY ────────────────────────────────
    def get_district_summary(
        self, districts: List[dict], disease: str
    ) -> pd.DataFrame:
        """Return a DataFrame with case summary per district."""
        rows = []
        for d in districts:
            name = d["name"]
            all_cases = [
                c for c in self._case_store.get(name, [])
                if c["disease"] == disease
            ]
            community = [
                p for p in self._prediction_store
                if p["disease"] == disease and p["district"] == name
            ]
            total = sum(c["cases"] for c in all_cases)
            rows.append({
                "district": name,
                "lat": d["lat"],
                "lng": d["lng"],
                "population": d.get("population", 0),
                "cases": total + len(community) // 3,
                "deaths": sum(c["deaths"] for c in all_cases),
                "recoveries": sum(c["recoveries"] for c in all_cases),
                "community_reports": len(community),
                "incidence_rate": round(
                    (total / max(d.get("population", 1), 1)) * 100_000, 2
                ),
            })
        return pd.DataFrame(rows).sort_values("cases", ascending=False)

    # ── LOAD FROM CSV (Official Dataset) ─────────────────────
    def load_from_csv(self, csv_path: str):
        """
        Load the official governance dataset CSV.
        Accepts: final_governance_dataset_with_climate.csv
        """
        try:
            df = pd.read_csv(csv_path, low_memory=False)
            logger.info("Loaded %d rows from %s", len(df), csv_path)
            for _, row in df.iterrows():
                disease = row.get("predicted_disease", "")
                if not disease or pd.isna(disease):
                    continue
                district_raw = str(row.get("state_or_region", "Lucknow"))
                # Map to nearest known district (simplified)
                district = district_raw if len(district_raw) < 30 else "Lucknow"
                try:
                    self.ingest_official_case(
                        district=district,
                        disease=str(disease),
                        cases=int(float(row.get("cases", 0) or 0)),
                        deaths=int(float(row.get("deaths", 0) or 0)),
                        recoveries=int(float(row.get("recoveries", 0) or 0)),
                    )
                except (ValueError, TypeError):
                    pass
            logger.info("Dataset ingestion complete.")
        except Exception as exc:
            logger.error("CSV load failed: %s", exc)


# Singleton
case_aggregator = CaseAggregator()
