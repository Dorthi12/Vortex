"""
Disease Intelligence Platform - Configuration
All API keys, endpoints, and system settings
"""

import os
from dataclasses import dataclass

# ─── API KEYS ────────────────────────────────────────────────────────────────
WEATHERBIT_API_KEY = os.getenv("WEATHERBIT_API_KEY", "ffd13dad3d6c49a39f4b1b6a77b8d222")
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "701cf29be2f669b6266eb7b847b13a55")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyDDgHtjNZYdbV0Ojtkf7jfVYSr8GsgfA2Q")
GENERATEIO_API_KEY = os.getenv("GENERATEIO_API_KEY", "pvQtZAZV4AhQlw9NebYgv9TNXFQbAC9aCEmoPCZTK5mEDigZ")

# Google Earth Engine token (JWT from uploaded image)
GEE_TOKEN = os.getenv("GEE_TOKEN", "eyJ0eXAiOiJKV1QiLCJvcmInaW4iOiJGYXJ0aGVuZ2luZS5nb29nbGUuY29tIi...")

# ─── EXTERNAL API ENDPOINTS ──────────────────────────────────────────────────
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
OPENWEATHER_URL = "https://api.openweathermap.org/data/2.5"
WEATHERBIT_URL = "https://api.weatherbit.io/v2.0"
IDSP_BASE_URL = "https://idsp.mohfw.gov.in"  # India Disease Surveillance Programme
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models"

# ─── DATABASE CONFIG ─────────────────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost:5432/disease_intel")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP", "localhost:9092")

# ─── KAFKA TOPICS ────────────────────────────────────────────────────────────
KAFKA_TOPICS = {
    "citizen_posts": "citizen.symptom.posts",
    "disease_predictions": "model.disease.predictions",
    "case_aggregations": "district.case.aggregations",
    "outbreak_alerts": "alert.outbreak",
    "hotspot_detections": "analysis.hotspot",
    "hospital_demand": "hospital.demand.forecast",
    "government_actions": "gov.action.plans",
    "citizen_advisories": "citizen.advisories",
}

# ─── MODEL PATHS ─────────────────────────────────────────────────────────────
MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models", "saved")
SYMPTOM_MODEL_PATH = os.path.join(MODEL_DIR, "symptom_classifier.pkl")
VECTORIZER_PATH = os.path.join(MODEL_DIR, "tfidf_vectorizer.pkl")
OUTBREAK_MODEL_PATH = os.path.join(MODEL_DIR, "outbreak_forecast.pkl")
HOTSPOT_MODEL_PATH = os.path.join(MODEL_DIR, "hotspot_dbscan.pkl")
SPREAD_MODEL_PATH = os.path.join(MODEL_DIR, "seir_params.json")
HOSPITAL_MODEL_PATH = os.path.join(MODEL_DIR, "hospital_demand.pkl")
RISK_MODEL_PATH = os.path.join(MODEL_DIR, "risk_scorer.pkl")

# ─── DATA PATHS ──────────────────────────────────────────────────────────────
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
GOVERNANCE_DATASET = os.path.join(DATA_DIR, "final_governance_dataset_with_climate.csv")
HAZARD_DATASET = os.path.join(DATA_DIR, "india_hazard_master_dataset_final.csv")
HOSPITAL_STATEWISE = os.path.join(DATA_DIR, "hospital_data", "Hospitals_and_Beds_statewise.csv")

# ─── DISEASE CLASSES ─────────────────────────────────────────────────────────
DISEASE_CLASSES = [
    "Fungal infection", "Allergy", "GERD", "Chronic cholestasis",
    "Drug Reaction", "Peptic ulcer disease", "AIDS", "Diabetes",
    "Gastroenteritis", "Bronchial Asthma", "Hypertension", "Migraine",
    "Cervical spondylosis", "Paralysis (brain hemorrhage)", "Jaundice",
    "Malaria", "Chicken pox", "Dengue", "Typhoid", "Hepatitis A",
    "Hepatitis B", "Hepatitis C", "Hepatitis D", "Hepatitis E",
    "Alcoholic hepatitis", "Tuberculosis", "Common Cold", "Pneumonia",
    "Dimorphic hemorrhoids(piles)", "Heart attack", "Varicose veins",
    "Hypothyroidism", "Hyperthyroidism", "Hypoglycemia", "Osteoarthritis",
    "Arthritis", "(vertigo) Paroymsal Positional Vertigo",
    "Acne", "Urinary tract infection", "Psoriasis", "Impetigo"
]

# ─── SYMPTOM KEYWORDS ────────────────────────────────────────────────────────
SYMPTOM_KEYWORDS = [
    "fever", "cough", "headache", "vomiting", "nausea", "diarrhea",
    "rash", "fatigue", "body pain", "joint pain", "chest pain",
    "breathlessness", "skin_rash", "yellowish_skin", "chills", "sweating",
    "high_fever", "muscle_pain", "stomach_pain", "back_pain", "cold",
    "sneezing", "itching", "weight_loss", "loss_of_appetite", "malaise"
]

# ─── RISK SCORE WEIGHTS ──────────────────────────────────────────────────────
RISK_WEIGHTS = {
    "outbreak_probability": 0.40,
    "hotspot_density": 0.30,
    "hospital_capacity_risk": 0.20,
    "environmental_risk": 0.10,
}

RISK_LEVELS = {
    (0.0, 0.25): "LOW",
    (0.25, 0.50): "MEDIUM",
    (0.50, 0.75): "HIGH",
    (0.75, 1.01): "CRITICAL",
}

# ─── AGGREGATION WINDOWS ─────────────────────────────────────────────────────
AGGREGATION_WINDOWS = [1, 3, 7]  # days

# ─── SEIR MODEL DEFAULTS ─────────────────────────────────────────────────────
SEIR_DEFAULTS = {
    "beta": 0.35,   # transmission rate
    "sigma": 0.20,  # incubation rate
    "gamma": 0.10,  # recovery rate
    "N": 100000,    # population
}

@dataclass
class AppConfig:
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 4
    reload: bool = False

app_config = AppConfig()
