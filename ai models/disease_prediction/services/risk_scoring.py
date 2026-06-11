"""
services/risk_scoring.py
────────────────────────────────────────────────────────────────
Model 7 (Risk Scoring) + Model 7b (Hospital Load Prediction)
Formula:
  risk_score = 0.4 × outbreak_probability
             + 0.3 × hotspot_density
             + 0.2 × hospital_load
             + 0.1 × environmental_risk
Output: LOW | MEDIUM | HIGH | CRITICAL
"""
from __future__ import annotations

import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

RISK_THRESHOLDS = {
    "CRITICAL": 75,
    "HIGH":     55,
    "MEDIUM":   35,
    "LOW":       0,
}

# Disease-specific CFR (Case Fatality Rate)
DISEASE_CFR = {
    "Malaria": 0.003,
    "Dengue": 0.002,
    "Tuberculosis": 0.15,
    "Cholera": 0.02,
    "Typhoid": 0.01,
    "Pneumonia": 0.05,
    "Hepatitis B": 0.10,
    "Hepatitis C": 0.08,
    "AIDS": 0.60,
    "Heart attack": 0.15,
    "Paralysis (brain hemorrhage)": 0.25,
}

DEFAULT_CFR = 0.005
DEFAULT_SEVERE_RATE = 0.15  # 15% of infected need hospitalisation


class RiskScorer:
    """
    Composite district health risk index calculator.
    Combines outbreak probability, spatial hotspot density,
    hospital load, and environmental risk into a single 0–100 score.
    """

    def calculate(
        self,
        outbreak_probability: float,    # 0–1
        hotspot_density: float,         # 0–1 (fraction of cases in clusters)
        hospital_load_ratio: float,     # 0–1+ (0.8 = 80% capacity used)
        environmental_risk: float = 0.5,  # 0–1
    ) -> Dict:
        """
        Compute composite risk score and label.
        """
        # Clamp all inputs to [0, 1]
        op = max(0.0, min(1.0, outbreak_probability))
        hd = max(0.0, min(1.0, hotspot_density))
        hl = max(0.0, min(1.0, hospital_load_ratio))
        er = max(0.0, min(1.0, environmental_risk))

        raw_score = 0.40 * op + 0.30 * hd + 0.20 * hl + 0.10 * er
        score = round(min(100.0, raw_score * 100), 1)

        level = "LOW"
        for lbl, threshold in RISK_THRESHOLDS.items():
            if score >= threshold:
                level = lbl
                break

        return {
            "risk_score": score,
            "risk_level": level,
            "components": {
                "outbreak_probability": round(op * 100, 1),
                "hotspot_density": round(hd * 100, 1),
                "hospital_load": round(hl * 100, 1),
                "environmental_risk": round(er * 100, 1),
            },
            "formula": (
                f"{score:.1f} = "
                f"0.4×{op*100:.0f} + 0.3×{hd*100:.0f} "
                f"+ 0.2×{hl*100:.0f} + 0.1×{er*100:.0f}"
            ),
        }

    def calculate_from_forecast(
        self,
        forecast_result: Dict,
        hotspot_result: Dict,
        hospital_result: Dict,
        weather: Dict,
    ) -> Dict:
        """High-level wrapper: pull numbers from sub-model outputs."""
        op = forecast_result.get("outbreak_probability", 0.3)
        hd = hotspot_result.get("hotspot_density", 0.2)
        hl_ratio = hospital_result.get("load_ratio", 0.4) / 100
        # Environmental risk from weather
        temp = weather.get("temperature_mean", 28)
        rain = weather.get("precipitation_total", 10)
        er = min(1.0, (rain / 100 + abs(temp - 30) / 20) / 2)
        return self.calculate(op, hd, hl_ratio, er)


class HospitalLoadPredictor:
    """
    Model 7b — Predict healthcare system demand.
    Input:  predicted_cases, population, hospital_capacity
    Output: bed_demand, doctor_demand, hospital_overload_risk
    """

    def predict(
        self,
        predicted_cases: int,
        population: int,
        hospital_beds: int,
        doctors: int,
        nurses: int,
        disease: str = "Dengue",
        severe_rate: Optional[float] = None,
    ) -> Dict:
        cfr = DISEASE_CFR.get(disease, DEFAULT_CFR)
        sr = severe_rate or DEFAULT_SEVERE_RATE

        severe_patients = max(1, int(predicted_cases * sr))
        mild_patients = predicted_cases - severe_patients

        # Bed demand: severe patients need beds; mild need OPD only
        bed_demand = severe_patients
        # Doctor demand: 1 doctor per 6 severe + 1 per 20 mild OPD
        doctor_demand = max(1, int(severe_patients / 6 + mild_patients / 20))
        nurse_demand = max(1, int(bed_demand / 3))

        # Expected deaths
        expected_deaths = round(predicted_cases * cfr, 1)

        # Load ratio
        load_ratio = round(bed_demand / max(hospital_beds, 1) * 100, 1)
        doc_ratio = round(doctor_demand / max(doctors, 1) * 100, 1)

        if load_ratio >= 100:
            status = "OVERLOADED"
        elif load_ratio >= 80:
            status = "STRESSED"
        elif load_ratio >= 50:
            status = "MODERATE"
        else:
            status = "NORMAL"

        return {
            "predicted_cases": predicted_cases,
            "severe_patients": severe_patients,
            "mild_patients": mild_patients,
            "bed_demand": bed_demand,
            "beds_available": hospital_beds,
            "doctor_demand": doctor_demand,
            "doctors_available": doctors,
            "nurse_demand": nurse_demand,
            "nurses_available": nurses,
            "load_ratio": load_ratio,
            "doctor_utilisation": doc_ratio,
            "expected_deaths": expected_deaths,
            "overload_status": status,
            "beds_shortage": max(0, bed_demand - hospital_beds),
            "doctor_shortage": max(0, doctor_demand - doctors),
            "recommendation": (
                "ACTIVATE EMERGENCY PROTOCOL — expand capacity immediately"
                if status == "OVERLOADED"
                else "Prepare surge capacity — monitor daily"
                if status == "STRESSED"
                else "Current capacity adequate — maintain surveillance"
            ),
        }


# Singletons
risk_scorer = RiskScorer()
hospital_load_predictor = HospitalLoadPredictor()
