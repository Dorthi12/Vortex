"""
config/settings.py — FIXED
FIXES:
  - pydantic v1 BaseSettings → pydantic_settings (v2) with v1 fallback
  - All API keys have defaults (no crash on missing .env)
  - Added mobility_updates + health_reports Kafka topics (were missing)
  - Added nurses/num_hospitals/area_sq_km to all district entries
  - Added openweather_base_url to settings (referenced by feature_engineering)
"""
from pathlib import Path
try:
    from pydantic_settings import BaseSettings
    from pydantic import Field
except ImportError:
    from pydantic import BaseSettings, Field  # type: ignore

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    app_name: str = "Disease Intelligence System"
    app_version: str = "2.0.0"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    debug: bool = False
    log_level: str = "INFO"

    gemini_api_key: str = Field(default="AIzaSyDDgHtjNZYdbV0Ojtkf7jfVYSr8GsgfA2Q", env="GEMINI_API_KEY")
    openweather_api_key: str = Field(default="701cf29be2f669b6266eb7b847b13a55", env="OPENWEATHER_API_KEY")
    weatherbit_api_key: str = Field(default="ffd13dad3d6c49a39f4b1b6a77b8d222", env="WEATHERBIT_API_KEY")
    generateio_api_key: str = Field(default="pvQtZAZV4AhQlw9NebYgv9TNXFQbAC9aCEmoPCZTK5mEDigZ", env="GENERATEIO_API_KEY")

    open_meteo_base_url: str = "https://api.open-meteo.com/v1/forecast"
    open_meteo_forecast_days: int = 16
    weatherbit_base_url: str = "https://api.weatherbit.io/v2.0"
    openweather_base_url: str = "https://api.openweathermap.org/data/2.5"  # FIX: used by feature_engineering

    hazard_dataset: str = str(BASE_DIR / "data" / "india_hazard_master_dataset_final.csv")

    database_url: str = "postgresql://postgres:postgres@localhost:5432/disease_intel"
    redis_url: str = "redis://localhost:6379/0"
    cache_ttl_seconds: int = 300

    kafka_bootstrap_servers: str = "localhost:9092"
    kafka_topic_citizen_reports: str = "citizen_reports"
    kafka_topic_weather_updates: str = "weather_updates"
    kafka_topic_mobility_updates: str = "mobility_updates"       # FIX: was missing
    kafka_topic_disease_cases: str = "disease_cases"
    kafka_topic_health_reports: str = "health_reports"           # FIX: was missing
    kafka_topic_outbreak_predictions: str = "outbreak_predictions"
    kafka_topic_government_actions: str = "government_actions"
    kafka_consumer_group: str = "disease-intel-group"

    model_save_path: str = str(BASE_DIR / "models" / "saved")
    outbreak_prob_alert_threshold: float = 0.7
    alert_risk_score_threshold: int = 75
    alert_cases_threshold: int = 50

    class Config:
        env_file = str(BASE_DIR / ".env")
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"


settings = Settings()

# FIX: Added nurses, num_hospitals, area_sq_km to every district record
DISTRICTS_UP = [
    {"name": "Lucknow",    "lat": 26.85, "lng": 80.95, "population": 4589838, "hospital_beds": 3200, "doctors": 890, "nurses": 1800, "num_hospitals": 48, "area_sq_km": 2528},
    {"name": "Agra",       "lat": 27.18, "lng": 78.01, "population": 4418797, "hospital_beds": 2400, "doctors": 640, "nurses": 1300, "num_hospitals": 36, "area_sq_km": 4027},
    {"name": "Kanpur",     "lat": 26.46, "lng": 80.35, "population": 4581268, "hospital_beds": 2800, "doctors": 780, "nurses": 1600, "num_hospitals": 42, "area_sq_km": 3029},
    {"name": "Varanasi",   "lat": 25.32, "lng": 83.00, "population": 3676841, "hospital_beds": 2100, "doctors": 590, "nurses": 1200, "num_hospitals": 31, "area_sq_km": 1535},
    {"name": "Allahabad",  "lat": 25.45, "lng": 81.84, "population": 5954391, "hospital_beds": 3100, "doctors": 820, "nurses": 1650, "num_hospitals": 46, "area_sq_km": 5482},
    {"name": "Meerut",     "lat": 28.98, "lng": 77.71, "population": 3443689, "hospital_beds": 1900, "doctors": 510, "nurses": 1050, "num_hospitals": 28, "area_sq_km": 2590},
    {"name": "Ghaziabad",  "lat": 28.67, "lng": 77.44, "population": 4681645, "hospital_beds": 2600, "doctors": 710, "nurses": 1450, "num_hospitals": 39, "area_sq_km": 1179},
    {"name": "Bareilly",   "lat": 28.35, "lng": 79.43, "population": 4448359, "hospital_beds": 2200, "doctors": 600, "nurses": 1220, "num_hospitals": 33, "area_sq_km": 4120},
    {"name": "Gorakhpur",  "lat": 26.76, "lng": 83.37, "population": 4440895, "hospital_beds": 2300, "doctors": 620, "nurses": 1250, "num_hospitals": 34, "area_sq_km": 3483},
    {"name": "Moradabad",  "lat": 28.84, "lng": 78.78, "population": 4772006, "hospital_beds": 2100, "doctors": 570, "nurses": 1150, "num_hospitals": 30, "area_sq_km": 3718},
    {"name": "Aligarh",    "lat": 27.88, "lng": 78.08, "population": 3673889, "hospital_beds": 1800, "doctors": 490, "nurses": 980,  "num_hospitals": 26, "area_sq_km": 3650},
    {"name": "Saharanpur", "lat": 29.97, "lng": 77.55, "population": 3464228, "hospital_beds": 1700, "doctors": 460, "nurses": 920,  "num_hospitals": 25, "area_sq_km": 3689},
    {"name": "Faizabad",   "lat": 26.77, "lng": 82.14, "population": 2469578, "hospital_beds": 1200, "doctors": 320, "nurses": 650,  "num_hospitals": 18, "area_sq_km": 2765},
    {"name": "Jhansi",     "lat": 25.45, "lng": 78.57, "population": 1998603, "hospital_beds": 1100, "doctors": 290, "nurses": 580,  "num_hospitals": 16, "area_sq_km": 5024},
    {"name": "Mathura",    "lat": 27.49, "lng": 77.67, "population": 2547184, "hospital_beds": 1300, "doctors": 350, "nurses": 700,  "num_hospitals": 19, "area_sq_km": 3340},
]

DISEASE_CATEGORIES = {
    "vector":           ["Malaria", "Dengue", "Chikungunya", "Japanese Encephalitis"],
    "waterborne":       ["Typhoid", "Cholera", "Hepatitis A", "hepatitis A", "Gastroenteritis", "Jaundice"],
    "airborne":         ["Tuberculosis", "Pneumonia", "Chicken pox", "Bronchial Asthma", "Common Cold", "Influenza"],
    "bloodborne":       ["Hepatitis B", "Hepatitis C", "Hepatitis D", "Hepatitis E", "AIDS"],
    "ncd":              ["Diabetes", "Hypertension", "Arthritis", "Osteoarthritis", "Heart attack",
                         "Bronchial Asthma", "Migraine", "Hypothyroidism", "Hyperthyroidism"],
    "skin":             ["Fungal infection", "Acne", "Psoriasis", "Impetigo", "Drug Reaction", "Allergy", "Chicken pox"],
    "gastrointestinal": ["GERD", "Peptic ulcer disease", "Gastroenteritis", "Chronic cholestasis",
                         "Alcoholic hepatitis", "Dimorphic hemorrhoids(piles)"],
}

DISEASE_SYMPTOMS_KB = {
    "Malaria":            ["fever","chills","sweating","headache","muscle_pain","nausea","vomiting","fatigue"],
    "Dengue":             ["high_fever","severe_headache","eye_pain","joint_pain","rash","bleeding","nausea","vomiting"],
    "Typhoid":            ["prolonged_fever","weakness","abdominal_pain","headache","constipation","fatigue","nausea"],
    "Tuberculosis":       ["cough","blood_in_sputum","weight_loss","night_sweats","fatigue","fever","chest_pain"],
    "Pneumonia":          ["chest_pain","cough","fever","difficulty_breathing","chills","fatigue","mucus"],
    "Hepatitis B":        ["jaundice","dark_urine","abdominal_pain","fatigue","nausea","vomiting","fever"],
    "Hepatitis C":        ["jaundice","fatigue","nausea","abdominal_pain","loss_of_appetite","dark_urine"],
    "Hepatitis D":        ["jaundice","abdominal_pain","nausea","fatigue","dark_urine"],
    "Hepatitis E":        ["jaundice","fatigue","nausea","abdominal_pain","fever"],
    "hepatitis A":        ["jaundice","fatigue","nausea","abdominal_pain","fever","dark_urine"],
    "Alcoholic hepatitis":["jaundice","abdominal_pain","nausea","vomiting","fatigue","fever"],
    "Chronic cholestasis":["itching","jaundice","abdominal_pain","fatigue","nausea"],
    "Jaundice":           ["yellowing_of_skin","dark_urine","itching","fatigue","nausea","abdominal_pain"],
    "Diabetes":           ["frequent_urination","excessive_thirst","weight_loss","blurry_vision","fatigue","weakness"],
    "Hypertension":       ["headache","dizziness","chest_pain","vision_problems","shortness_of_breath","nausea"],
    "Chicken pox":        ["rash","itching","fever","tiredness","headache","blisters"],
    "Bronchial Asthma":   ["breathlessness","wheezing","cough","mucus","chest_tightness","fatigue"],
    "Gastroenteritis":    ["diarrhea","vomiting","stomach_pain","nausea","fever","dehydration"],
    "Arthritis":          ["joint_pain","stiffness","swelling","redness","fatigue","decreased_range_of_motion"],
    "Cervical spondylosis":["neck_pain","stiffness","headache","dizziness","arm_pain","weakness"],
    "Common Cold":        ["sneezing","runny_nose","sore_throat","cough","congestion","fatigue"],
    "Migraine":           ["headache","nausea","vomiting","light_sensitivity","visual_disturbances","dizziness"],
    "Fungal infection":   ["itching","skin_rash","skin_eruptions","patches"],
    "Acne":               ["skin_rash","pimples","blackheads","skin_irritation"],
    "Psoriasis":          ["skin_rash","joint_pain","skin_peeling","itching","patches"],
    "AIDS":               ["weight_loss","fatigue","fever","cough","skin_rash","night_sweats","diarrhea"],
    "Urinary tract infection":["burning_urination","frequent_urination","foul_smell","cloudy_urine","pelvic_pain"],
    "Heart attack":       ["chest_pain","shortness_of_breath","sweating","nausea","arm_pain","jaw_pain"],
    "Allergy":            ["sneezing","watery_eyes","itching","skin_rash","runny_nose"],
    "GERD":               ["heartburn","acid_reflux","regurgitation","difficulty_swallowing","chest_pain","bloating"],
    "Hyperthyroidism":    ["fatigue","sweating","mood_swings","weight_loss","rapid_heartbeat","tremors"],
    "Hypothyroidism":     ["fatigue","weight_gain","depression","cold_intolerance","constipation","dry_skin"],
    "Hypoglycemia":       ["anxiety","sweating","dizziness","nausea","headache","hunger","confusion"],
    "Osteoarthritis":     ["joint_pain","stiffness","swelling","bone_pain","muscle_weakness","cracking_joints"],
    "Paralysis (brain hemorrhage)":["weakness","numbness","confusion","severe_headache","vomiting"],
    "Vertigo":            ["dizziness","loss_of_balance","nausea","vomiting","tinnitus"],
    "Varicose veins":     ["swollen_legs","cramping","pain","skin_discoloration","fatigue","heaviness"],
    "Peptic ulcer disease":["abdominal_pain","burning_sensation","bloating","nausea","vomiting","heartburn"],
    "Dimorphic hemorrhoids(piles)":["bloody_stool","pain_during_bowel","swelling","itching","constipation"],
    "Drug Reaction":      ["itching","skin_rash","bruising","weakness","nausea","fever"],
    "Impetigo":           ["skin_rash","blisters","red_sores","crust","itching"],
    "Cholera":            ["diarrhea","vomiting","dehydration","nausea","weakness","muscle_pain"],
}
