"""
Models 4-7:
  Model 4 — Hotspot Detection (DBSCAN clustering)
  Model 5 — Disease Spread Simulation (SEIR epidemiological model)
  Model 6 — Hospital Demand Prediction
  Model 7 — District Risk Scoring
"""

import logging
import numpy as np
import pandas as pd
from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime

from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler

from .settings import (
    GOVERNANCE_DATASET, HOSPITAL_STATEWISE, RISK_WEIGHTS, RISK_LEVELS, SEIR_DEFAULTS
)

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════════
# MODEL 4 — HOTSPOT DETECTION
# ═══════════════════════════════════════════════════════════════════════════════

class HotspotPoint:
    def __init__(self, district, lat, lon, cases, disease, population_density=500.0):
        self.district = district
        self.lat = lat
        self.lon = lon
        self.cases = cases
        self.disease = disease
        self.population_density = population_density

class HotspotCluster:
    def __init__(self, cluster_id, districts, center_lat, center_lon, total_cases, disease, severity, avg_population_density, radius_km):
        self.cluster_id = cluster_id
        self.districts = districts
        self.center_lat = center_lat
        self.center_lon = center_lon
        self.total_cases = total_cases
        self.disease = disease
        self.severity = severity  # LOW / MEDIUM / HIGH / CRITICAL
        self.avg_population_density = avg_population_density
        self.radius_km = radius_km


class HotspotDetector:
    """
    Identifies geographic clusters of disease spread using DBSCAN.
    Uses lat/lon + case density as input.
    """

    # Severity thresholds (total cases in cluster)
    SEVERITY_THRESHOLDS = {
        "CRITICAL": 500,
        "HIGH": 200,
        "MEDIUM": 50,
        "LOW": 0
    }

    def __init__(self, eps_km: float = 50.0, min_samples: int = 2):
        # Convert km to approximate degrees (1° ≈ 111 km)
        self.eps_deg = eps_km / 111.0
        self.min_samples = min_samples
        self.scaler = StandardScaler()

    def detect_hotspots(
        self, points: list[HotspotPoint], disease: str = None
    ) -> list[HotspotCluster]:
        """Run DBSCAN clustering on disease case locations"""

        if not points:
            return []

        # Filter by disease
        filtered = [p for p in points if disease is None or p.disease == disease]
        if len(filtered) < self.min_samples:
            logger.warning("Too few points ({}) for hotspot detection".format(len(filtered)))
            return []

        # Feature matrix: lat, lon, log(cases), population_density
        X = np.array([
            [p.lat, p.lon, np.log1p(p.cases), p.population_density / 1000]
            for p in filtered
        ])

        # Scale
        X_scaled = self.scaler.fit_transform(X)

        # DBSCAN
        db = DBSCAN(eps=self.eps_deg, min_samples=self.min_samples, metric='euclidean')
        labels = db.fit_predict(X_scaled)

        # Build clusters
        clusters = []
        unique_labels = set(labels)
        unique_labels.discard(-1)  # -1 = noise

        for cluster_id in unique_labels:
            mask = labels == cluster_id
            cluster_points = [p for p, m in zip(filtered, mask) if m]

            center_lat = np.mean([p.lat for p in cluster_points])
            center_lon = np.mean([p.lon for p in cluster_points])
            total_cases = sum(p.cases for p in cluster_points)
            avg_density = np.mean([p.population_density for p in cluster_points])

            # Estimate radius from spread of points
            lats = np.array([p.lat for p in cluster_points])
            lons = np.array([p.lon for p in cluster_points])
            radius_deg = np.sqrt(np.var(lats) + np.var(lons))
            radius_km = radius_deg * 111.0

            # Determine severity
            severity = "LOW"
            for sev, threshold in self.SEVERITY_THRESHOLDS.items():
                if total_cases >= threshold:
                    severity = sev
                    break

            clusters.append(HotspotCluster(
                cluster_id=int(cluster_id),
                districts=[p.district for p in cluster_points],
                center_lat=round(center_lat, 4),
                center_lon=round(center_lon, 4),
                total_cases=total_cases,
                disease=cluster_points[0].disease,
                severity=severity,
                avg_population_density=round(avg_density, 1),
                radius_km=round(radius_km, 2)
            ))

        return sorted(clusters, key=lambda x: x.total_cases, reverse=True)

    def get_hotspot_density_map(self, points: list[HotspotPoint]) -> pd.DataFrame:
        """Returns per-district hotspot density scores"""
        rows = []
        for p in points:
            rows.append({
                "district": p.district,
                "lat": p.lat,
                "lon": p.lon,
                "cases": p.cases,
                "disease": p.disease,
                "population_density": p.population_density,
                "case_density": p.cases / max(p.population_density, 1) * 1000
            })
        df = pd.DataFrame(rows)
        if not df.empty:
            df["hotspot_score"] = (
                (df["cases"] / df["cases"].max()) * 0.6 +
                (df["case_density"] / df["case_density"].max()) * 0.4
            )
        return df


# ═══════════════════════════════════════════════════════════════════════════════
# MODEL 5 — SEIR DISEASE SPREAD SIMULATION
# ═══════════════════════════════════════════════════════════════════════════════

class SEIRInput:
    def __init__(self, source_district: str, target_district: str, disease: str,
                 initial_infected: int, population_source: int, population_target: int,
                 mobility_factor: float, distance_km: float,
                 beta: Optional[float] = None, sigma: Optional[float] = None,
                 gamma: Optional[float] = None):
        self.source_district = source_district
        self.target_district = target_district
        self.disease = disease
        self.initial_infected = initial_infected
        self.population_source = population_source
        self.population_target = population_target
        self.mobility_factor = mobility_factor  # 0-1, fraction of population moving
        self.distance_km = distance_km
        self.beta = beta   # transmission rate
        self.sigma = sigma  # incubation rate (1/incubation period)
        self.gamma = gamma  # recovery rate (1/infectious period)


class SEIRResult:
    def __init__(self, source_district: str, target_district: str, disease: str,
                 spread_probability: float, days_to_arrival: int, peak_cases_target: int,
                 seir_curve: dict, r0: float):
        self.source_district = source_district
        self.target_district = target_district
        self.disease = disease
        self.spread_probability = spread_probability
        self.days_to_arrival = days_to_arrival
        self.peak_cases_target = peak_cases_target
        self.seir_curve = seir_curve  # {"S": [], "E": [], "I": [], "R": []}
        self.r0 = r0


class SEIRSpreadModel:
    """
    SEIR epidemiological model for inter-district disease spread.
    S(t+1) = S - beta*S*I/N
    E(t+1) = E + beta*S*I/N - sigma*E
    I(t+1) = I + sigma*E - gamma*I
    R(t+1) = R + gamma*I
    """

    # Disease-specific SEIR parameters
    DISEASE_PARAMS = {
        "Dengue":    {"beta": 0.40, "sigma": 0.25, "gamma": 0.14},
        "Malaria":   {"beta": 0.35, "sigma": 0.20, "gamma": 0.10},
        "Typhoid":   {"beta": 0.25, "sigma": 0.14, "gamma": 0.07},
        "Tuberculosis": {"beta": 0.15, "sigma": 0.03, "gamma": 0.03},
        "Pneumonia": {"beta": 0.45, "sigma": 0.33, "gamma": 0.20},
        "Common Cold":  {"beta": 0.55, "sigma": 0.50, "gamma": 0.33},
        "Cholera":   {"beta": 0.60, "sigma": 0.50, "gamma": 0.25},
        "COVID-19":  {"beta": 0.35, "sigma": 0.20, "gamma": 0.10},
    }

    def simulate(self, inp: SEIRInput, days: int = 90) -> SEIRResult:
        """Run SEIR simulation"""

        # Get disease parameters
        params = self.DISEASE_PARAMS.get(inp.disease, SEIR_DEFAULTS)
        beta = inp.beta or params.get("beta", 0.35)
        sigma = inp.sigma or params.get("sigma", 0.20)
        gamma = inp.gamma or params.get("gamma", 0.10)

        # Calculate spread probability based on mobility and distance
        distance_decay = np.exp(-inp.distance_km / 200)  # exponential decay
        spread_prob = inp.mobility_factor * distance_decay * min(
            inp.initial_infected / inp.population_source, 1.0
        ) * 10

        spread_prob = min(0.99, max(0.01, spread_prob))

        # Days until disease arrives in target district
        days_to_arrival = max(1, int(inp.distance_km / (inp.mobility_factor * 50 + 1)))

        # SEIR in target district (starting when disease arrives)
        N = inp.population_target
        # Seed infected = proportional to spread probability
        I0 = max(1, int(spread_prob * 10))
        E0 = I0 * 2
        S0 = N - E0 - I0
        R0_val = 0

        S, E, I, R = [float(S0)], [float(E0)], [float(I0)], [float(R0_val)]

        for _ in range(days - 1):
            new_exposed = beta * S[-1] * I[-1] / N
            new_infected = sigma * E[-1]
            new_recovered = gamma * I[-1]

            S.append(max(0.0, S[-1] - new_exposed))
            E.append(max(0.0, E[-1] + new_exposed - new_infected))
            I.append(max(0.0, I[-1] + new_infected - new_recovered))
            R.append(R[-1] + new_recovered)

        r0 = beta / gamma
        peak_cases = max(I)

        return SEIRResult(
            source_district=inp.source_district,
            target_district=inp.target_district,
            disease=inp.disease,
            spread_probability=round(spread_prob, 4),
            days_to_arrival=days_to_arrival,
            peak_cases_target=int(peak_cases),
            seir_curve={
                "S": [round(x) for x in S[:30]],  # return first 30 days
                "E": [round(x) for x in E[:30]],
                "I": [round(x) for x in I[:30]],
                "R": [round(x) for x in R[:30]],
            },
            r0=round(r0, 2)
        )

    def multi_district_spread(
        self,
        source_district: str,
        disease: str,
        initial_cases: int,
        neighboring_districts: list[dict]  # [{"name", "population", "distance_km", "mobility"}]
    ) -> list[SEIRResult]:
        """Simulate spread to multiple neighboring districts"""

        results = []
        for neighbor in neighboring_districts:
            inp = SEIRInput(
                source_district=source_district,
                target_district=neighbor["name"],
                disease=disease,
                initial_infected=initial_cases,
                population_source=1000000,
                population_target=neighbor.get("population", 500000),
                mobility_factor=neighbor.get("mobility", 0.05),
                distance_km=neighbor.get("distance_km", 100),
            )
            results.append(self.simulate(inp))

        return sorted(results, key=lambda x: x.spread_probability, reverse=True)


# ═══════════════════════════════════════════════════════════════════════════════
# MODEL 6 — HOSPITAL DEMAND PREDICTION
# ═══════════════════════════════════════════════════════════════════════════════

class HospitalDemandInput:
    def __init__(self, district: str, disease: str, predicted_cases: int, population: int,
                 existing_hospital_beds: int, existing_doctors: int, existing_nurses: int,
                 severity_factor: float = 0.3):
        self.district = district
        self.disease = disease
        self.predicted_cases = predicted_cases
        self.population = population
        self.existing_hospital_beds = existing_hospital_beds
        self.existing_doctors = existing_doctors
        self.existing_nurses = existing_nurses
        self.severity_factor = severity_factor  # fraction requiring hospitalization


class HospitalDemandResult:
    def __init__(self, district: str, disease: str, predicted_cases: int, required_beds: int,
                 required_doctors: int, required_nurses: int, available_beds: int,
                 available_doctors: int, bed_shortage: int, doctor_shortage: int,
                 hospital_overload_risk: float, risk_category: str, recommendations: list):
        self.district = district
        self.disease = disease
        self.predicted_cases = predicted_cases
        self.required_beds = required_beds
        self.required_doctors = required_doctors
        self.required_nurses = required_nurses
        self.available_beds = available_beds
        self.available_doctors = available_doctors
        self.bed_shortage = bed_shortage
        self.doctor_shortage = doctor_shortage
        self.hospital_overload_risk = hospital_overload_risk
        self.risk_category = risk_category
        self.recommendations = recommendations


class HospitalDemandPredictor:
    """
    Predicts healthcare system stress based on predicted disease cases.
    Rule-based + regression model hybrid.
    """

    # Disease hospitalization rates (fraction of cases requiring beds)
    HOSPITALIZATION_RATES = {
        "Dengue": 0.35,
        "Malaria": 0.25,
        "Typhoid": 0.30,
        "Tuberculosis": 0.20,
        "Pneumonia": 0.45,
        "Hepatitis A": 0.15,
        "Hepatitis B": 0.20,
        "Heart attack": 0.90,
        "Diabetes": 0.05,
        "Hypertension": 0.08,
        "Bronchial Asthma": 0.20,
        "default": 0.15,
    }

    # Average bed days per patient
    BED_DAYS = {
        "Dengue": 5, "Malaria": 4, "Typhoid": 7,
        "Tuberculosis": 14, "Pneumonia": 6, "default": 5
    }

    # Doctor-to-patient ratio (patients per doctor per day)
    DOCTOR_RATIO = 10
    NURSE_RATIO = 5

    def predict(self, inp: HospitalDemandInput) -> HospitalDemandResult:
        """Predict hospital demand and identify shortfalls"""

        hosp_rate = self.HOSPITALIZATION_RATES.get(
            inp.disease, self.HOSPITALIZATION_RATES["default"]
        )
        bed_days = self.BED_DAYS.get(inp.disease, self.BED_DAYS["default"])

        # Peak daily patients (spread over avg bed days)
        daily_admissions = int(inp.predicted_cases * hosp_rate / bed_days)
        required_beds = int(inp.predicted_cases * hosp_rate)
        required_doctors = max(1, daily_admissions // self.DOCTOR_RATIO)
        required_nurses = max(1, daily_admissions // self.NURSE_RATIO)

        bed_shortage = max(0, required_beds - inp.existing_hospital_beds)
        doctor_shortage = max(0, required_doctors - inp.existing_doctors)

        # Overload risk = fraction of capacity utilized
        overload_risk = min(1.0, required_beds / max(inp.existing_hospital_beds, 1))

        # Risk category
        if overload_risk >= 0.90:
            risk_cat = "CRITICAL"
        elif overload_risk >= 0.70:
            risk_cat = "HIGH"
        elif overload_risk >= 0.50:
            risk_cat = "MEDIUM"
        else:
            risk_cat = "LOW"

        # Recommendations
        recs = []
        if bed_shortage > 0:
            recs.append("Emergency: Deploy {} additional beds".format(bed_shortage))
        if doctor_shortage > 0:
            recs.append("Mobilize {} additional doctors from nearby districts".format(doctor_shortage))
        if overload_risk > 0.7:
            recs.append("Activate mobile health units")
            recs.append("Set up temporary quarantine/treatment centers")
        if overload_risk > 0.5:
            recs.append("Alert private hospitals to prepare overflow capacity")
        if not recs:
            recs.append("Current capacity is sufficient — maintain monitoring")

        return HospitalDemandResult(
            district=inp.district,
            disease=inp.disease,
            predicted_cases=inp.predicted_cases,
            required_beds=required_beds,
            required_doctors=required_doctors,
            required_nurses=required_nurses,
            available_beds=inp.existing_hospital_beds,
            available_doctors=inp.existing_doctors,
            bed_shortage=bed_shortage,
            doctor_shortage=doctor_shortage,
            hospital_overload_risk=round(overload_risk, 4),
            risk_category=risk_cat,
            recommendations=recs
        )


# ═══════════════════════════════════════════════════════════════════════════════
# MODEL 7 — DISTRICT RISK SCORING
# ═══════════════════════════════════════════════════════════════════════════════

class RiskScoreInput:
    def __init__(self, district: str, disease: str, outbreak_probability: float         # 0-1
                 , hotspot_density: float              # 0-1 (normalized cluster density)
                 , hospital_capacity_risk: float       # 0-1 (from hospital demand model)
                 , environmental_risk: float           # 0-1 (climate/hazard composite)
                 , population_density: float = 500.0
                 , active_cases: int = 0):
        self.district = district
        self.disease = disease
        self.outbreak_probability = outbreak_probability
        self.hotspot_density = hotspot_density
        self.hospital_capacity_risk = hospital_capacity_risk
        self.environmental_risk = environmental_risk
        self.population_density = population_density
        self.active_cases = active_cases

class RiskScoreResult:
    def __init__(self, district: str, disease: str, risk_score: float, risk_level: str  # LOW / MEDIUM / HIGH / CRITICAL
                 , component_scores: dict, recommended_actions: list, alert_priority: int  # 1 (highest) - 5 (lowest)
                 , timestamp: datetime = field(default_factory=datetime.now)):
        self.district = district
        self.disease = disease
        self.risk_score = risk_score
        self.risk_level = risk_level
        self.component_scores = component_scores
        self.recommended_actions = recommended_actions
        self.alert_priority = alert_priority
        self.timestamp = timestamp


class DistrictRiskScorer:
    """
    Computes composite district health risk index.
    Formula: risk = 0.4*outbreak_prob + 0.3*hotspot_density
                  + 0.2*hospital_capacity_risk + 0.1*environmental_risk
    """

    WEIGHTS = RISK_WEIGHTS  # from config

    def score(self, inp: RiskScoreInput) -> RiskScoreResult:
        """Compute risk score and generate recommendations"""

        risk_score = (
            self.WEIGHTS["outbreak_probability"] * inp.outbreak_probability +
            self.WEIGHTS["hotspot_density"] * inp.hotspot_density +
            self.WEIGHTS["hospital_capacity_risk"] * inp.hospital_capacity_risk +
            self.WEIGHTS["environmental_risk"] * inp.environmental_risk
        )
        risk_score = round(min(1.0, max(0.0, risk_score)), 4)

        # Determine risk level
        risk_level = "LOW"
        for (low, high), level in RISK_LEVELS.items():
            if low <= risk_score < high:
                risk_level = level
                break

        # Alert priority
        priority_map = {"CRITICAL": 1, "HIGH": 2, "MEDIUM": 3, "LOW": 4}
        priority = priority_map.get(risk_level, 5)

        # Generate recommendations
        recs = self._generate_recommendations(inp, risk_level)

        return RiskScoreResult(
            district=inp.district,
            disease=inp.disease,
            risk_score=risk_score,
            risk_level=risk_level,
            component_scores={
                "outbreak_probability": round(inp.outbreak_probability, 3),
                "hotspot_density": round(inp.hotspot_density, 3),
                "hospital_capacity_risk": round(inp.hospital_capacity_risk, 3),
                "environmental_risk": round(inp.environmental_risk, 3),
            },
            recommended_actions=recs,
            alert_priority=priority
        )

    def _generate_recommendations(self, inp: RiskScoreInput, risk_level: str) -> list:
        recs = []

        if risk_level == "CRITICAL":
            recs += [
                "IMMEDIATE: Declare public health emergency in {}".format(inp.district),
                "Deploy rapid response teams within 24 hours",
                "Activate all available hospital surge capacity",
                "Issue public health advisory to all citizens",
                "Coordinate with central government for additional resources",
            ]
        elif risk_level == "HIGH":
            recs += [
                "Deploy health inspection teams to {}".format(inp.district),
                "Increase surveillance frequency to daily reporting",
                "Pre-position medicines and supplies",
                "Activate community health workers",
            ]
        elif risk_level == "MEDIUM":
            recs += [
                "Enhance community surveillance",
                "Conduct awareness campaigns",
                "Prepare hospital contingency plans",
            ]
        else:
            recs += [
                "Continue routine surveillance",
                "Maintain preventive measures",
            ]

        if inp.environmental_risk > 0.6:
            recs.append("Environmental intervention: drain stagnant water, fogging")
        if inp.hotspot_density > 0.7:
            recs.append("Geographic containment: focus on hotspot clusters in {}".format(inp.district))

        return recs

    def score_batch(self, inputs: list[RiskScoreInput]) -> pd.DataFrame:
        """Score multiple districts and return ranked DataFrame"""
        results = [self.score(inp) for inp in inputs]
        rows = []
        for r in results:
            row = {
                "district": r.district,
                "disease": r.disease,
                "risk_score": r.risk_score,
                "risk_level": r.risk_level,
                "alert_priority": r.alert_priority,
            }
            row.update(r.component_scores)
            rows.append(row)
        df = pd.DataFrame(rows).sort_values("risk_score", ascending=False)
        return df


# ─── TEST ALL ──────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    # Test Hotspot Detection
    detector = HotspotDetector()
    points = [
        HotspotPoint("Lucknow", 26.85, 80.95, 84, "Dengue", 800),
        HotspotPoint("Sitapur", 27.57, 80.68, 45, "Dengue", 450),
        HotspotPoint("Barabanki", 26.93, 81.19, 60, "Dengue", 550),
        HotspotPoint("Kanpur", 26.47, 80.35, 30, "Malaria", 900),
        HotspotPoint("Agra", 27.18, 78.01, 20, "Typhoid", 700),
    ]
    clusters = detector.detect_hotspots(points)
    print("Hotspot clusters detected: {}".format(len(clusters)))
    for c in clusters:
        print("  Cluster {}: {} | {} cases | {}".format(c.cluster_id, c.districts, c.total_cases, c.severity))

    # Test SEIR
    seir = SEIRSpreadModel()
    result = seir.simulate(SEIRInput(
        source_district="Lucknow",
        target_district="Kanpur",
        disease="Dengue",
        initial_infected=84,
        population_source=4589838,
        population_target=4575978,
        mobility_factor=0.08,
        distance_km=80,
    ))
    print("\nSEIR Spread: {} → {}".format(result.source_district, result.target_district))
    print("  Spread probability: {}".format(result.spread_probability))
    print("  Days to arrival: {}".format(result.days_to_arrival))
    print("  Peak cases: {}".format(result.peak_cases_target))
    print("  R0: {}".format(result.r0))

    # Test Hospital Demand
    hosp = HospitalDemandPredictor()
    hd = hosp.predict(HospitalDemandInput(
        district="Lucknow", disease="Dengue",
        predicted_cases=900, population=4589838,
        existing_hospital_beds=600, existing_doctors=150, existing_nurses=400
    ))
    print("\nHospital Demand: {}".format(hd.district))
    print("  Required beds: {} | Available: {} | Shortage: {}".format(hd.required_beds, hd.available_beds, hd.bed_shortage))
    print("  Risk: {}".format(hd.risk_category))

    # Test Risk Scoring
    scorer = DistrictRiskScorer()
    risk = scorer.score(RiskScoreInput(
        district="Lucknow", disease="Dengue",
        outbreak_probability=0.76,
        hotspot_density=0.80,
        hospital_capacity_risk=0.75,
        environmental_risk=0.60,
    ))
    print("\nRisk Score: {}".format(risk.district))
    print("  Score: {} | Level: {}".format(risk.risk_score, risk.risk_level))
    print("  Actions: {}".format(risk.recommended_actions[:2]))
