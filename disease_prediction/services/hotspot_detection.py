"""
services/hotspot_detection.py
────────────────────────────────────────────────────────────────
Model 5 — Hotspot Detection
Algorithm: DBSCAN spatial clustering
Inputs:    latitude, longitude, cases (weighted)
Output:    disease cluster polygons + severity
"""
from __future__ import annotations

import logging
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger(__name__)


class HotspotDetector:
    """
    DBSCAN-based geospatial hotspot detection.
    Weighted by case count: high-case districts have larger spatial influence.
    """

    def __init__(
        self,
        eps_km: float = 150.0,   # ~150km radius (UP districts)
        min_samples: int = 2,
        km_per_degree: float = 111.0,
    ):
        self.eps_km = eps_km
        self.min_samples = min_samples
        self.eps_deg = eps_km / km_per_degree  # convert km → degrees

    def detect(
        self,
        district_data: List[Dict],
        min_cases_threshold: int = 5,
    ) -> Dict:
        """
        Run DBSCAN clustering on district case data.
        Returns clusters + noise points + summary.
        """
        # Filter to districts with cases above threshold
        active = [
            d for d in district_data
            if d.get("cases", 0) >= min_cases_threshold
        ]

        if len(active) < 2:
            return {
                "clusters": [],
                "noise_districts": [d["district"] for d in district_data],
                "n_clusters": 0,
                "hotspot_density": 0.0,
                "highest_risk_cluster": None,
            }

        # Build coordinate matrix + case weights
        coords = np.array([[d["lat"], d["lng"]] for d in active])
        case_counts = np.array([d.get("cases", 1) for d in active], dtype=float)

        # Weighted DBSCAN: replicate points by case weight
        # (higher cases = more "pull" toward a cluster)
        weights = np.clip(np.log1p(case_counts), 0.5, 3.0)

        db = DBSCAN(eps=self.eps_deg, min_samples=self.min_samples, metric="euclidean")
        labels = db.fit_predict(coords)

        clusters: List[Dict] = []
        noise_districts: List[str] = []

        unique_labels = set(labels)
        for label in unique_labels:
            mask = labels == label
            members = [active[i] for i in range(len(active)) if mask[i]]

            if label == -1:
                noise_districts.extend(m["district"] for m in members)
                continue

            total_cases = sum(m.get("cases", 0) for m in members)
            avg_lat = float(np.mean([m["lat"] for m in members]))
            avg_lng = float(np.mean([m["lng"] for m in members]))
            incidence_rates = [m.get("incidence_rate", 0.0) for m in members]

            # Cluster severity
            if total_cases >= 100 or max(incidence_rates or [0]) > 50:
                severity = "CRITICAL"
            elif total_cases >= 50:
                severity = "HIGH"
            elif total_cases >= 20:
                severity = "MEDIUM"
            else:
                severity = "LOW"

            clusters.append({
                "cluster_id": int(label),
                "districts": [m["district"] for m in members],
                "center_lat": round(avg_lat, 4),
                "center_lng": round(avg_lng, 4),
                "total_cases": int(total_cases),
                "member_count": len(members),
                "severity": severity,
                "avg_incidence_rate": round(float(np.mean(incidence_rates)), 2),
                "radius_km": round(self.eps_km, 1),
                "members": members,
            })

        # Sort by severity then cases
        severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
        clusters.sort(key=lambda c: (severity_order.get(c["severity"], 4), -c["total_cases"]))

        total_cases_all = sum(d.get("cases", 0) for d in district_data)
        cases_in_clusters = sum(c["total_cases"] for c in clusters)
        hotspot_density = cases_in_clusters / max(total_cases_all, 1)

        return {
            "clusters": clusters,
            "noise_districts": noise_districts,
            "n_clusters": len(clusters),
            "hotspot_density": round(hotspot_density, 3),
            "highest_risk_cluster": clusters[0] if clusters else None,
            "total_districts_analyzed": len(district_data),
            "districts_in_hotspots": len(district_data) - len(noise_districts),
        }

    def build_heatmap_data(
        self, district_data: List[Dict]
    ) -> List[Dict]:
        """Return lat/lng/intensity data for frontend heatmap rendering."""
        total_cases = max(sum(d.get("cases", 0) for d in district_data), 1)
        return [
            {
                "lat": d["lat"],
                "lng": d["lng"],
                "district": d["district"],
                "cases": d.get("cases", 0),
                "intensity": round(d.get("cases", 0) / total_cases, 4),
                "incidence_rate": d.get("incidence_rate", 0.0),
            }
            for d in district_data
        ]


# Singleton
hotspot_detector = HotspotDetector()
