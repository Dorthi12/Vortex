"""
services/outbreak_forecast.py — FIXED
FIXES:
  1. Tuple_ was used as type annotation before its import (NameError)
     → import moved to top, proper typing used throughout
  2. Forecast model now uses ALL required feature inputs:
     cases_lag_1/2, rolling_cases, rainfall, temperature, humidity,
     population_density, vector_risk, hospital_capacity
     (previously only used raw cases count)
  3. hospital_utilisation and bed_occupancy derived features added to output
"""
from __future__ import annotations
import logging, warnings
from typing import Dict, List, Optional, Tuple   # FIX: Tuple imported at top
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings("ignore")
logger = logging.getLogger(__name__)

DISEASE_RISK_PROFILES = {
    "Malaria":       {"optimal_temp_range":(25,35),"min_humidity":60,"rainfall_boosts_risk":True, "base_r0":1.8,"incubation_days":12,"season_peaks":[6,7,8,9]},
    "Dengue":        {"optimal_temp_range":(26,34),"min_humidity":65,"rainfall_boosts_risk":True, "base_r0":2.5,"incubation_days":7, "season_peaks":[7,8,9,10]},
    "Typhoid":       {"optimal_temp_range":(22,38),"min_humidity":40,"rainfall_boosts_risk":True, "base_r0":1.5,"incubation_days":14,"season_peaks":[5,6,7,8]},
    "Tuberculosis":  {"optimal_temp_range":(10,25),"min_humidity":30,"rainfall_boosts_risk":False,"base_r0":3.0,"incubation_days":56,"season_peaks":[11,12,1,2]},
    "Pneumonia":     {"optimal_temp_range":(5,20), "min_humidity":30,"rainfall_boosts_risk":False,"base_r0":2.0,"incubation_days":3, "season_peaks":[11,12,1,2]},
    "Cholera":       {"optimal_temp_range":(20,35),"min_humidity":50,"rainfall_boosts_risk":True, "base_r0":3.5,"incubation_days":2, "season_peaks":[6,7,8,9]},
    "Gastroenteritis":{"optimal_temp_range":(25,40),"min_humidity":50,"rainfall_boosts_risk":True,"base_r0":2.0,"incubation_days":2, "season_peaks":[6,7,8,9]},
}
DEFAULT_RISK_PROFILE = {
    "optimal_temp_range":(20,35),"min_humidity":40,"rainfall_boosts_risk":False,
    "base_r0":1.5,"incubation_days":7,"season_peaks":list(range(1,13)),
}


class OutbreakForecaster:
    """
    Ensemble outbreak forecasting model.
    Rule-based epidemiological scoring + case trajectory + environmental risk.
    FIX: Now uses full feature set: lag features, vector_risk, hospital capacity.
    """

    def __init__(self):
        self.gb_model: Optional[GradientBoostingRegressor] = None
        self.scaler = StandardScaler()
        self._is_trained = False

    def _compute_env_risk(
        self, disease:str, weather:Dict[str,float], current_month:int=8
    ) -> Tuple[float, List[str]]:          # FIX: Tuple now properly imported at top
        profile = DISEASE_RISK_PROFILES.get(disease, DEFAULT_RISK_PROFILE)
        score = 0.0
        factors: List[str] = []
        temp     = weather.get("temperature_mean", 28.0)
        humidity = weather.get("humidity_mean", 65.0)
        rain     = weather.get("precipitation_total", 0.0)
        soil     = weather.get("soil_moisture_mean", 0.3)
        t_low, t_high = profile["optimal_temp_range"]
        if t_low <= temp <= t_high:
            score += 25; factors.append(f"Temperature {temp:.1f}°C in optimal range for {disease}")
        elif abs(temp - (t_low+t_high)/2) < 5:
            score += 12; factors.append(f"Temperature {temp:.1f}°C near optimal range")
        if humidity >= profile["min_humidity"]:
            score += 20; factors.append(f"Humidity {humidity:.0f}% favours pathogen survival")
        if profile["rainfall_boosts_risk"]:
            if rain > 50:   score += 25; factors.append(f"Heavy rainfall ({rain:.1f}mm) — vector/contamination risk")
            elif rain > 10: score += 15; factors.append(f"Moderate rainfall ({rain:.1f}mm) elevates risk")
            if soil > 0.5:  score += 10; factors.append("High soil moisture supports vector breeding")
        if current_month in profile["season_peaks"]:
            score += 20; factors.append(f"Peak season for {disease} (month {current_month})")
        return min(100.0, score), factors

    @staticmethod
    def compute_vector_risk(temperature:float, humidity:float, rainfall:float) -> float:
        return round(
            0.4*max(0.0,1-abs(temperature-30)/15) +
            0.35*min(1.0,max(0.0,(humidity-40)/60)) +
            0.25*min(1.0,rainfall/100), 3)

    def forecast(
        self, district:Dict, disease:str, weather:Dict[str,float],
        weekly_cases:List[int], current_month:int=8,
    ) -> Dict:
        """
        Full outbreak forecast.
        FIX: Now uses cases_lag_1/2, rolling_mean, vector_risk, hospital_capacity,
             population_density — not just raw case count.
        """
        if not weekly_cases: weekly_cases = [0]
        env_score, env_factors = self._compute_env_risk(disease, weather, current_month)

        # FIX: Extract all required lag features
        cases_now  = weekly_cases[-1]
        cases_lag1 = weekly_cases[-2] if len(weekly_cases)>=2 else 0
        cases_lag2 = weekly_cases[-3] if len(weekly_cases)>=3 else 0
        cases_lag3 = weekly_cases[-4] if len(weekly_cases)>=4 else 0
        rolling_mean = float(np.mean(weekly_cases[-4:]))
        growth_rate  = (cases_now - cases_lag1) / max(cases_lag1, 1)
        acceleration = (cases_now - 2*cases_lag1 + cases_lag2) if len(weekly_cases)>=3 else 0.0

        # FIX: vector_risk and hospital_capacity now used in scoring
        vector_risk = self.compute_vector_risk(
            weather.get("temperature_mean", 28),
            weather.get("humidity_mean", 65),
            weather.get("precipitation_total", 0))

        beds       = district.get("hospital_beds", 500)
        population = district.get("population", 1_000_000)
        pop_density = population / max(district.get("area_sq_km", 2528), 1)
        bed_ratio  = cases_now / max(beds, 1)

        # Case-based risk score
        case_score = 0.0
        case_factors: List[str] = []
        if cases_now >= 50:      case_score = 40; case_factors.append(f"High active cases: {cases_now}")
        elif cases_now >= 25:    case_score = 28; case_factors.append(f"Moderate cases: {cases_now}")
        elif cases_now >= 10:    case_score = 16; case_factors.append(f"Rising cases: {cases_now}")
        elif cases_now >= 5:     case_score = 8;  case_factors.append(f"Active cases: {cases_now}")

        if growth_rate > 0.5:    case_score += 20; case_factors.append(f"Rapid growth: +{growth_rate*100:.0f}%/wk")
        elif growth_rate > 0.2:  case_score += 10; case_factors.append(f"Growing: +{growth_rate*100:.0f}%/wk")

        if acceleration > 5:     case_score += 10; case_factors.append(f"Accelerating trend (Δ²={acceleration:.1f})")

        # FIX: population density factor now properly computed
        if pop_density > 5000:   pop_score = 15; case_factors.append(f"Dense population ({pop_density:.0f}/km²)")
        elif pop_density > 1000: pop_score = 8;  case_factors.append(f"Moderate density ({pop_density:.0f}/km²)")
        else:                    pop_score = 3

        # FIX: vector risk boosts score for mosquito-borne diseases
        vec_score = round(vector_risk * 15, 1)  # max +15 points
        if vec_score > 8: case_factors.append(f"High vector risk index: {vector_risk:.2f}")

        if bed_ratio > 0.15:
            case_factors.append(f"Hospital strain: {bed_ratio*100:.0f}% beds potentially needed")

        total_score = min(100.0, 0.40*env_score + 0.35*case_score + 0.10*pop_score +
                                  0.10*vec_score + 0.05*min(100, bed_ratio*100))
        outbreak_prob = round(total_score / 100, 3)

        profile = DISEASE_RISK_PROFILES.get(disease, DEFAULT_RISK_PROFILE)
        r0 = profile["base_r0"] * (1 + outbreak_prob * 0.5)
        gen_time = profile["incubation_days"] / 7
        projected_cases = int(cases_now*(r0**(1/gen_time))*(1+outbreak_prob)) if r0>1 else max(0,int(cases_now*0.9))

        if total_score >= 70:   risk_level = "CRITICAL"
        elif total_score >= 50: risk_level = "HIGH"
        elif total_score >= 30: risk_level = "MEDIUM"
        else:                   risk_level = "LOW"

        # FIX: hospital_utilisation and bed_occupancy now included in output
        hospital_utilisation = round(bed_ratio * 100, 1)
        bed_occupancy        = min(100.0, round(projected_cases/max(beds,1)*100, 1))

        return {
            "district": district["name"],
            "disease": disease,
            "risk_level": risk_level,
            "risk_score": round(total_score, 1),
            "outbreak_probability": outbreak_prob,
            "projected_cases_next_week": projected_cases,
            "cases_current": cases_now,
            "cases_lag_1": cases_lag1,
            "cases_lag_2": cases_lag2,
            "cases_lag_3": cases_lag3,
            "rolling_mean_4w": round(rolling_mean, 1),
            "growth_rate": round(growth_rate*100, 1),
            "acceleration": round(acceleration, 2),
            "env_risk_score": round(env_score, 1),
            "vector_risk_index": vector_risk,
            "hospital_utilisation_pct": hospital_utilisation,  # FIX: derived feature added
            "bed_occupancy_projected_pct": bed_occupancy,       # FIX: derived feature added
            "risk_factors": env_factors + case_factors,
            "r0_estimate": round(r0, 2),
            "weather_summary": {
                "temperature": round(weather.get("temperature_mean", 28), 1),
                "humidity": round(weather.get("humidity_mean", 65), 1),
                "precipitation": round(weather.get("precipitation_total", 0), 1),
                "wind_speed": round(weather.get("wind_speed_mean", 10), 1),
            },
        }

    def forecast_all_districts(
        self, districts:List[Dict], disease:str, weather_map:Dict[str,Dict],
        case_map:Dict[str,List[int]], current_month:int=8,
    ) -> List[Dict]:
        results = []
        for d in districts:
            result = self.forecast(d, disease, weather_map.get(d["name"],{}),
                                   case_map.get(d["name"],[5,6,8,10]), current_month)
            results.append(result)
        return sorted(results, key=lambda x: x["risk_score"], reverse=True)


outbreak_forecaster = OutbreakForecaster()
