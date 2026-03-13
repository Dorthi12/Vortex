"""
services/feature_engineering.py — FIXED
FIXES:
  1. BUG CRASH: fetch_openweather_current referenced self.openweather_base (undefined)
     → Now uses self.openweather_base_url (set in __init__ from settings)
  2. GenerateIO mobility API integration added (was completely absent)
  3. Derived environmental risk indicators added: vector_risk, water_risk, climate_anomaly
  4. Time-dimension features added: week, year, season (needed for outbreak forecasting)
  5. beds_per_1000 / doctors_per_1000 / healthcare_access_index derived fields added
  6. citizen_reports_count + symptom_frequency added to district feature store
"""
from __future__ import annotations
import json, logging
from datetime import datetime
from typing import Dict, List, Optional
import numpy as np
import pandas as pd
import requests

logger = logging.getLogger(__name__)

SYMPTOM_SYNONYMS: Dict[str, str] = {
    "temperature":"fever","temp":"fever","pyrexia":"fever","high temperature":"fever",
    "headache":"headache","head pain":"headache","cephalgia":"headache",
    "coughing":"cough","dry cough":"cough","wet cough":"cough","productive cough":"cough",
    "throwing up":"vomiting","puking":"vomiting","vomited":"vomiting","emesis":"vomiting",
    "loose motion":"diarrhea","loose stool":"diarrhea","watery stool":"diarrhea","dysentery":"diarrhea",
    "tired":"fatigue","tiredness":"fatigue","exhausted":"fatigue","lethargic":"fatigue",
    "skin rash":"skin_rash","rashes":"rash","spots on skin":"rash","eruption":"rash",
    "yellow eyes":"jaundice","yellow skin":"yellowing_of_skin","yellowish skin":"yellowing_of_skin",
    "stomach pain":"abdominal_pain","belly pain":"abdominal_pain","tummy ache":"stomach_pain",
    "stomach ache":"stomach_pain","abdominal cramp":"abdominal_pain",
    "breathing difficulty":"difficulty_breathing","breathlessness":"breathlessness",
    "shortness of breath":"shortness_of_breath","dyspnea":"difficulty_breathing",
    "chest pain":"chest_pain","chest tightness":"chest_tightness","chest pressure":"chest_pain",
    "joint pain":"joint_pain","body ache":"muscle_pain","body pain":"muscle_pain",
    "runny nose":"runny_nose","blocked nose":"congestion","stuffy nose":"congestion",
    "sore throat":"sore_throat","throat pain":"sore_throat","throat irritation":"sore_throat",
    "shivering":"chills","shiver":"chills","rigor":"chills","goosebumps":"chills",
    "sweating":"sweating","perspiration":"sweating","night sweats":"night_sweats",
    "itching":"itching","itch":"itching","pruritus":"itching",
    "nausea":"nausea","nauseous":"nausea","queasy":"nausea","feel sick":"nausea",
    "dizziness":"dizziness","dizzy":"dizziness","lightheaded":"dizziness",
    "weight loss":"weight_loss","losing weight":"weight_loss","weight reduction":"weight_loss",
    "blood in urine":"burning_urination","painful urination":"burning_urination",
    "dark urine":"dark_urine","brown urine":"dark_urine","tea coloured urine":"dark_urine",
    "swollen joints":"swelling","puffiness":"swelling",
    "frequent urination":"frequent_urination","urinary frequency":"frequent_urination",
}

ALL_SYMPTOMS = [
    "abdominal_pain","acid_reflux","anxiety","arm_pain","blackheads","bleeding","blisters",
    "bloating","blood_in_sputum","bloody_stool","blurry_vision","bone_pain","breathlessness",
    "bruising","burning_sensation","burning_urination","chest_pain","chest_tightness","chills",
    "cloudy_urine","cold_intolerance","confusion","congestion","constipation","cough",
    "cracking_joints","cramping","crust","dark_urine","decreased_range_of_motion","dehydration",
    "depression","diarrhea","difficulty_breathing","difficulty_swallowing","dizziness","dry_skin",
    "excessive_thirst","eye_pain","fatigue","fever","foul_smell","frequent_urination","headache",
    "heartburn","heaviness","high_fever","hunger","itching","jaundice","jaw_pain","joint_pain",
    "light_sensitivity","loss_of_appetite","loss_of_balance","mood_swings","mucus","muscle_pain",
    "muscle_weakness","nausea","neck_pain","night_sweats","numbness","pain","pain_during_bowel",
    "patches","pelvic_pain","pimples","prolonged_fever","rapid_heartbeat","rash","red_sores",
    "redness","regurgitation","runny_nose","severe_headache","shortness_of_breath",
    "skin_discoloration","skin_eruptions","skin_irritation","skin_peeling","skin_rash","sneezing",
    "sore_throat","stiffness","stomach_pain","sweating","swelling","swollen_legs","tinnitus",
    "tiredness","tremors","vision_problems","visual_disturbances","vomiting","watery_eyes",
    "weakness","weight_gain","weight_loss","wheezing","yellowing_of_skin",
]

def _month_to_season(month: int) -> str:
    if month in (12, 1, 2):   return "winter"
    if month in (3, 4, 5):    return "spring"
    if month in (6, 7, 8, 9): return "monsoon"
    return "post_monsoon"


class FeatureEngineer:
    """
    Unified feature builder merging all 6 data sources into
    district_feature_store (one row per district/disease/week).
    """

    def __init__(
        self,
        open_meteo_base: str = "https://api.open-meteo.com/v1/forecast",
        weatherbit_key: str = "",
        openweather_key: str = "",
        generateio_key: str = "",
        openweather_base_url: str = "https://api.openweathermap.org/data/2.5",
    ):
        self.open_meteo_base      = open_meteo_base
        self.weatherbit_key       = weatherbit_key
        self.openweather_key      = openweather_key
        self.generateio_key       = generateio_key
        self.openweather_base_url = openweather_base_url  # FIX: was missing, caused NameError crash
        self._weather_cache: Dict[str, dict] = {}
        self._mobility_cache: Dict[str, dict] = {}

    # ── NLP SYMPTOM EXTRACTION ─────────────────────────────────
    def extract_symptoms_from_text(self, text: str) -> List[str]:
        lower = text.lower()
        found: List[str] = []
        for phrase in sorted(SYMPTOM_SYNONYMS, key=len, reverse=True):
            if phrase in lower:
                sym = SYMPTOM_SYNONYMS[phrase]
                if sym not in found:
                    found.append(sym)
        for symptom in ALL_SYMPTOMS:
            if symptom.replace("_", " ") in lower and symptom not in found:
                found.append(symptom)
        return found

    def build_symptom_vector(self, symptoms: List[str]) -> Dict[str, int]:
        sym_set = set(symptoms)
        return {s: int(s in sym_set) for s in ALL_SYMPTOMS}

    # ── WEATHER APIs ──────────────────────────────────────────
    def fetch_open_meteo(self, lat: float, lng: float) -> Optional[dict]:
        key = f"{lat:.2f}_{lng:.2f}"
        if key in self._weather_cache:
            return self._weather_cache[key]
        params = {
            "latitude": lat, "longitude": lng, "forecast_days": 16,
            "hourly": ",".join([
                "temperature_2m","precipitation","wind_speed_10m","relative_humidity_2m",
                "temperature_80m","cloud_cover","snowfall","rain","soil_temperature_0cm",
                "soil_moisture_0_to_1cm","vapour_pressure_deficit","evapotranspiration",
                "pressure_msl","surface_pressure",
            ]),
        }
        try:
            r = requests.get(self.open_meteo_base, params=params, timeout=10)
            r.raise_for_status()
            data = r.json()
            self._weather_cache[key] = data
            return data
        except Exception as exc:
            logger.warning("Open-Meteo fetch failed: %s", exc)
            return None

    def fetch_openweather_current(self, lat: float, lng: float) -> Optional[dict]:
        """FIX: was using self.openweather_base (undefined) → now self.openweather_base_url"""
        if not self.openweather_key:
            return None
        try:
            url = f"{self.openweather_base_url}/weather"   # ← FIX
            r = requests.get(url, params={
                "lat": lat, "lon": lng,
                "appid": self.openweather_key, "units": "metric",
            }, timeout=8)
            r.raise_for_status()
            return r.json()
        except Exception as exc:
            logger.warning("OpenWeather fetch failed: %s", exc)
            return None

    def fetch_weatherbit_forecast(self, lat: float, lng: float) -> Optional[dict]:
        if not self.weatherbit_key:
            return None
        try:
            r = requests.get("https://api.weatherbit.io/v2.0/forecast/daily", params={
                "lat": lat, "lon": lng, "key": self.weatherbit_key, "days": 7,
            }, timeout=8)
            r.raise_for_status()
            return r.json()
        except Exception as exc:
            logger.warning("Weatherbit fetch failed: %s", exc)
            return None

    def extract_weather_features(self, lat: float, lng: float) -> Dict[str, float]:
        features: Dict[str, float] = {
            "temperature_mean": 28.0, "temperature_max": 35.0, "temperature_min": 22.0,
            "humidity_mean": 65.0, "precipitation_total": 0.0, "wind_speed_mean": 10.0,
            "cloud_cover_mean": 40.0, "soil_moisture_mean": 0.3,
            "vapour_pressure_deficit": 1.5, "pressure_msl_mean": 1010.0,
            "rain_days_7d": 2, "rainfall_anomaly": 0.0,
        }
        meteo = self.fetch_open_meteo(lat, lng)
        if meteo and "hourly" in meteo:
            h = meteo["hourly"]
            n = min(168, len(h.get("temperature_2m", [])))
            if n > 0:
                features["temperature_mean"] = float(np.mean(h["temperature_2m"][:n]))
                features["temperature_max"]  = float(np.max(h["temperature_2m"][:n]))
                features["temperature_min"]  = float(np.min(h["temperature_2m"][:n]))
                features["humidity_mean"]    = float(np.mean(h.get("relative_humidity_2m", [65]*n)[:n]))
                features["precipitation_total"] = float(np.sum(h.get("precipitation", [0]*n)[:n]))
                features["wind_speed_mean"]  = float(np.mean(h.get("wind_speed_10m", [10]*n)[:n]))
                features["cloud_cover_mean"] = float(np.mean(h.get("cloud_cover", [40]*n)[:n]))
                sm = h.get("soil_moisture_0_to_1cm", [])
                if sm:
                    features["soil_moisture_mean"] = float(np.mean([x for x in sm[:n] if x is not None] or [0.3]))
                vpd = h.get("vapour_pressure_deficit", [])
                if vpd:
                    features["vapour_pressure_deficit"] = float(np.mean([x for x in vpd[:n] if x is not None] or [1.5]))
                psl = h.get("pressure_msl", [])
                if psl:
                    features["pressure_msl_mean"] = float(np.mean([x for x in psl[:n] if x is not None] or [1010.0]))
                features["rain_days_7d"] = int(sum(1 for rv in h.get("rain",[0]*n)[:n] if rv and rv > 0.1))
        wb = self.fetch_weatherbit_forecast(lat, lng)
        if wb and "data" in wb:
            temps = [d.get("temp", 28) for d in wb["data"]]
            if temps:
                features["temperature_mean"] = float(np.mean(temps))
        return features

    # ── GENERATEIO MOBILITY API ────────────────────────────────
    # FIX: This was completely absent. Required for disease spread simulation.
    def fetch_mobility_data(self, lat: float, lng: float, district_name: str = "") -> Dict[str, float]:
        """
        Fetch mobility / traffic data from GenerateIO API.
        Used for disease spread simulation between districts (SEIR mobility model).
        Falls back to defaults if API unreachable.
        """
        if not self.generateio_key:
            return self._default_mobility()
        key = f"mob_{lat:.2f}_{lng:.2f}"
        if key in self._mobility_cache:
            return self._mobility_cache[key]
        try:
            r = requests.get("https://api.generate.io/v1/mobility", params={
                "lat": lat, "lon": lng, "radius": 50, "api_key": self.generateio_key,
            }, timeout=8)
            r.raise_for_status()
            data = r.json()
            result = {
                "mobility_index":         float(data.get("mobility_index", 0.5)),
                "traffic_density":        float(data.get("traffic_density", 0.4)),
                "travel_density":         float(data.get("travel_density", 0.45)),
                "inter_district_flow":    float(data.get("inter_district_flow", 0.3)),
                "public_transport_usage": float(data.get("public_transport_usage", 0.35)),
            }
            self._mobility_cache[key] = result
            return result
        except Exception as exc:
            logger.warning("GenerateIO mobility failed for %s: %s", district_name, exc)
            return self._default_mobility()

    @staticmethod
    def _default_mobility() -> Dict[str, float]:
        return {"mobility_index":0.50,"traffic_density":0.40,"travel_density":0.45,
                "inter_district_flow":0.30,"public_transport_usage":0.35}

    # ── HOSPITAL CAPACITY ─────────────────────────────────────
    @staticmethod
    def extract_hospital_features(hospital_beds:int, doctors:int, nurses:int,
                                   num_hospitals:int, population:int) -> Dict[str,float]:
        pop_k = max(population, 1) / 1000
        return {
            "hospital_beds": hospital_beds, "doctors": doctors,
            "nurses": nurses, "num_hospitals": num_hospitals,
            "beds_per_1k_pop": round(hospital_beds/pop_k, 4),
            "doctors_per_1k_pop": round(doctors/pop_k, 4),
            "nurses_per_1k_pop": round(nurses/pop_k, 4),
            "hospitals_per_1k_pop": round(num_hospitals/pop_k, 6),
            "beds_per_1000": round(hospital_beds/pop_k, 4),        # FIX: alias expected by forecast
            "doctors_per_1000": round(doctors/pop_k, 4),           # FIX: alias expected by forecast
            "healthcare_access_index": min(1.0, round(
                0.5*min(1.0, hospital_beds/max(population*0.002,1)) +
                0.3*min(1.0, doctors/max(population*0.001,1)) +
                0.2*min(1.0, num_hospitals/max(population/50000,1)), 3)),
        }

    @staticmethod
    def extract_population_features(population:int, area_sq_km:float=2528.0,
                                     urban_fraction:float=0.45) -> Dict[str,float]:
        return {
            "population": population,
            "population_density": round(population/max(area_sq_km,1), 2),
            "urban_population": int(population*urban_fraction),
            "rural_population": int(population*(1-urban_fraction)),
            "urban_fraction": urban_fraction,
        }

    @staticmethod
    def build_lag_features(weekly_cases:List[int], disease:str) -> Dict[str,float]:
        """FIX: All lag features now present: lag_1/2/3, rolling_mean, growth_rate, acceleration."""
        if not weekly_cases: weekly_cases = [0]
        arr = np.array(weekly_cases, dtype=float)
        n = len(arr)
        return {
            "cases_current":         float(arr[-1]),
            "cases_lag_1":           float(arr[-2]) if n>=2 else 0.0,
            "cases_lag_2":           float(arr[-3]) if n>=3 else 0.0,
            "cases_lag_3":           float(arr[-4]) if n>=4 else 0.0,
            "cases_rolling_mean_4w": float(np.mean(arr[-4:])),
            "cases_rolling_max_4w":  float(np.max(arr[-4:])),
            "cases_growth_rate":     float((arr[-1]-arr[-2])/max(arr[-2],1) if n>=2 else 0.0),
            "cases_acceleration":    float((arr[-1]-2*arr[-2]+arr[-3]) if n>=3 else 0.0),
            "disease": disease,
        }

    # ── ENVIRONMENTAL RISK INDICATORS ─────────────────────────
    # FIX: These derived features were completely missing; required by risk scoring
    @staticmethod
    def compute_environmental_risk_indicators(weather:Dict[str,float]) -> Dict[str,float]:
        temp = weather.get("temperature_mean", 28.0)
        humidity = weather.get("humidity_mean", 65.0)
        rain = weather.get("precipitation_total", 0.0)
        soil = weather.get("soil_moisture_mean", 0.3)
        # Vector mosquito risk
        vector_risk = round(
            0.4*max(0.0, 1-abs(temp-30)/15) +
            0.35*min(1.0,max(0.0,(humidity-40)/60)) +
            0.25*min(1.0, rain/100), 3)
        # Water contamination risk
        water_risk = round(0.6*min(1.0,rain/150) + 0.4*min(1.0,soil/0.7), 3)
        # Climate anomaly vs UP seasonal norm
        climate_anomaly = round(abs(temp-28.0)/28.0*0.5 + abs(rain-30.0)/31.0*0.5, 3)
        return {"vector_risk": vector_risk, "water_risk": water_risk, "climate_anomaly": climate_anomaly}

    # ── TIME DIMENSION ─────────────────────────────────────────
    # FIX: Without time features, outbreak model cannot learn seasonal patterns
    @staticmethod
    def build_time_features(dt: Optional[datetime] = None) -> Dict[str, object]:
        dt = dt or datetime.utcnow()
        iso = dt.isocalendar()
        return {"week": int(iso[1]), "year": int(iso[0]),
                "month": int(dt.month), "season": _month_to_season(dt.month)}

    # ── MASTER FEATURE STORE BUILDER ──────────────────────────
    def build_district_feature_store(
        self, district:dict, disease:str, weekly_cases:List[int],
        citizen_texts:Optional[List[str]]=None, dt:Optional[datetime]=None,
    ) -> Dict:
        """
        THE UNIFIED MERGE FUNCTION.
        Produces one row of district_features containing ALL columns required
        by every downstream ML model (outbreak forecast, hotspot, risk scoring).
        """
        features: Dict = {}

        weather = self.extract_weather_features(district["lat"], district["lng"])
        features.update(weather)

        features.update(self.extract_hospital_features(
            hospital_beds=district.get("hospital_beds",500),
            doctors=district.get("doctors",100),
            nurses=district.get("nurses",200),
            num_hospitals=district.get("num_hospitals",20),
            population=district.get("population",1_000_000),
        ))
        features.update(self.extract_population_features(
            population=district.get("population",1_000_000),
            area_sq_km=district.get("area_sq_km",2528.0),
        ))
        features.update(self.build_lag_features(weekly_cases, disease))
        features.update(self.fetch_mobility_data(district["lat"], district["lng"], district.get("name","")))
        features.update(self.compute_environmental_risk_indicators(weather))
        features.update(self.build_time_features(dt))

        if citizen_texts:
            all_ext: List[str] = []
            for t in citizen_texts: all_ext.extend(self.extract_symptoms_from_text(t))
            sym_c: Dict[str,int] = {}
            for s in all_ext: sym_c[s] = sym_c.get(s,0)+1
            features["citizen_reports_count"]    = len(citizen_texts)
            features["unique_symptoms_reported"] = len(sym_c)
            features["symptom_frequency"]        = round(len(all_ext)/max(len(citizen_texts),1),2)
            features["top_symptoms_json"]        = json.dumps(sorted(sym_c,key=sym_c.get,reverse=True)[:5])
        else:
            features["citizen_reports_count"]    = 0
            features["unique_symptoms_reported"] = 0
            features["symptom_frequency"]        = 0.0
            features["top_symptoms_json"]        = "[]"

        features["district"]          = district["name"]
        features["disease"]           = disease
        features["feature_timestamp"] = (dt or datetime.utcnow()).isoformat()
        return features

    def build_feature_matrix(self, districts:List[dict], disease:str,
                              case_map:Dict[str,List[int]]) -> pd.DataFrame:
        rows = []
        for dist in districts:
            row = self.build_district_feature_store(dist, disease, case_map.get(dist["name"],[5,6,8,10]))
            rows.append(row)
        return pd.DataFrame(rows)


# ── SINGLETON ─────────────────────────────────────────────────
from disease_prediction.config.settings import settings  # noqa: E402
feature_engineer = FeatureEngineer(
    weatherbit_key       = settings.weatherbit_api_key,
    openweather_key      = settings.openweather_api_key,
    generateio_key       = settings.generateio_api_key,
    openweather_base_url = settings.openweather_base_url,
)
