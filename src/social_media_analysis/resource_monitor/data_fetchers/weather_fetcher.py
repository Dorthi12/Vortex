"""
weather_fetcher.py
==================
Fetches live weather data for every Indian district
using Open-Meteo API (100% free, no API key needed).

Replaces static hazard CSV fields:
    temperature_mean    -> live temperature_celsius
    humidity_mean       -> live humidity_percent
    rainfall_anomaly    -> live precipitation_mm
    wind_speed_mean     -> live wind_speed_kmh
    soil_moisture_mean  -> live soil_moisture

API Docs: https://open-meteo.com/en/docs
No registration or API key required.

Run manually:
    python data_fetchers/weather_fetcher.py

Called by scheduler every 6 hours automatically.
"""

import requests
import os
from datetime import datetime, timedelta
from pymongo import MongoClient, UpdateOne
from dotenv import load_dotenv

load_dotenv()

_client  = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/"))
_db      = _client["netravaah"]
_col     = _db["weather_live"]
_hazard  = _db["hazard_data"]

# Open-Meteo API - completely free, no key needed
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

# Variables to fetch per district
WEATHER_VARIABLES = [
    "temperature_2m",           # Temperature at 2m height (°C)
    "relative_humidity_2m",     # Humidity (%)
    "precipitation",            # Rainfall (mm)
    "wind_speed_10m",           # Wind speed at 10m (km/h)
    "soil_moisture_0_to_1cm",   # Surface soil moisture (m³/m³)
    "surface_pressure",         # Pressure (hPa)
]


def fetch_district_weather(district: str, state: str, lat: float, lng: float) -> dict | None:
    """
    Fetch current weather for a district using its coordinates.
    Uses Open-Meteo API — free, no API key required.
    """
    try:
        params = {
            "latitude":  lat,
            "longitude": lng,
            "current":   ",".join(WEATHER_VARIABLES),
            "timezone":  "Asia/Kolkata",
            "forecast_days": 1,
        }

        response = requests.get(OPEN_METEO_URL, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        current = data.get("current", {})
        if not current:
            return None

        return {
            "district":           district,
            "state":              state,
            "lat":                lat,
            "lng":                lng,
            "temperature_celsius":round(current.get("temperature_2m", 0), 1),
            "humidity_percent":   round(current.get("relative_humidity_2m", 0), 1),
            "precipitation_mm":   round(current.get("precipitation", 0), 2),
            "wind_speed_kmh":     round(current.get("wind_speed_10m", 0), 1),
            "soil_moisture":      round(current.get("soil_moisture_0_to_1cm", 0), 4),
            "pressure_hpa":       round(current.get("surface_pressure", 0), 1),
            "fetched_at":         datetime.utcnow().isoformat(),
            "data_date":          datetime.now().strftime("%Y-%m-%d"),
        }

    except requests.RequestException as e:
        print(f"    Weather fetch failed for {district}: {e}")
        return None


def fetch_rainfall_last_7_days(lat: float, lng: float) -> float:
    """
    Fetch total rainfall over last 7 days for a location.
    Used to detect drought or flood conditions.
    """
    try:
        end_date   = datetime.now().strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")

        params = {
            "latitude":   lat,
            "longitude":  lng,
            "daily":      "precipitation_sum",
            "timezone":   "Asia/Kolkata",
            "start_date": start_date,
            "end_date":   end_date,
        }

        response = requests.get(
            "https://archive-api.open-meteo.com/v1/archive",
            params=params,
            timeout=10,
        )
        response.raise_for_status()
        data   = response.json()
        values = data.get("daily", {}).get("precipitation_sum", [])
        total  = sum(v for v in values if v is not None)
        return round(total, 2)

    except Exception:
        return 0.0


def fetch_all_districts_weather():
    """
    Fetch live weather for ALL districts in the hazard database.
    Called by scheduler every 6 hours.
    """
    districts = list(_hazard.find(
        {},
        {"district": 1, "state": 1, "lat": 1, "lng": 1, "_id": 0}
    ))

    print(f"Fetching live weather for {len(districts)} districts...")

    ops     = []
    success = 0
    failed  = 0

    for d in districts:
        lat = d.get("lat")
        lng = d.get("lng")

        if not lat or not lng:
            failed += 1
            continue

        weather = fetch_district_weather(d["district"], d["state"], lat, lng)

        if weather:
            # Also fetch 7-day rainfall total
            weather["rainfall_7day_mm"] = fetch_rainfall_last_7_days(lat, lng)

            # Derive heat stress flag
            temp = weather["temperature_celsius"]
            weather["heat_stress"]    = temp > 38
            weather["cold_stress"]    = temp < 5
            weather["high_rainfall"]  = weather["rainfall_7day_mm"] > 100
            weather["drought_risk"]   = weather["rainfall_7day_mm"] < 5 and weather["humidity_percent"] < 30

            ops.append(UpdateOne(
                {"district": d["district"], "state": d["state"]},
                {"$set": weather},
                upsert=True,
            ))
            success += 1

            if success % 50 == 0:
                print(f"  {success}/{len(districts)} done...")
        else:
            failed += 1

    if ops:
        _col.bulk_write(ops)

    _col.create_index([("state", 1), ("district", 1)])
    _col.create_index("heat_stress")
    _col.create_index("drought_risk")

    print(f"Done: {success} districts updated, {failed} failed")
    return success


def get_district_weather(district: str, state: str = None) -> dict | None:
    """Get latest weather data for a district."""
    query = {"district": {"$regex": district, "$options": "i"}}
    if state:
        query["state"] = {"$regex": state, "$options": "i"}
    return _col.find_one(query, {"_id": 0})


def get_heat_stress_districts() -> list:
    """Get all districts with active heat stress (temp > 38°C)."""
    return list(_col.find(
        {"heat_stress": True},
        {"_id": 0, "district": 1, "state": 1, "temperature_celsius": 1}
    ).sort("temperature_celsius", -1))


def get_drought_risk_districts() -> list:
    """Get all districts with drought risk."""
    return list(_col.find(
        {"drought_risk": True},
        {"_id": 0, "district": 1, "state": 1, "rainfall_7day_mm": 1, "humidity_percent": 1}
    ))


def get_flood_risk_districts() -> list:
    """Get all districts with high rainfall (>100mm in 7 days)."""
    return list(_col.find(
        {"high_rainfall": True},
        {"_id": 0, "district": 1, "state": 1, "rainfall_7day_mm": 1}
    ).sort("rainfall_7day_mm", -1))


if __name__ == "__main__":
    # Test with a few districts
    test_cases = [
        ("Karnal",   "Haryana",     29.68, 76.98),
        ("Lucknow",  "Uttar Pradesh", 26.85, 80.92),
        ("Pune",     "Maharashtra", 18.52, 73.86),
        ("Chennai",  "Tamil Nadu",  13.08, 80.27),
    ]

    print("Testing weather fetcher with sample districts...\n")
    for district, state, lat, lng in test_cases:
        w = fetch_district_weather(district, state, lat, lng)
        if w:
            print(f"{district}, {state}:")
            print(f"  Temperature: {w['temperature_celsius']}°C")
            print(f"  Humidity:    {w['humidity_percent']}%")
            print(f"  Rainfall:    {w['precipitation_mm']} mm")
            print(f"  Wind:        {w['wind_speed_kmh']} km/h")
            print(f"  Soil:        {w['soil_moisture']}")
            print()

    print("\nFetching full India weather data...")
    count = fetch_all_districts_weather()
    print(f"\nTotal: {count} districts updated")

    print("\nHeat stress districts:")
    for d in get_heat_stress_districts()[:5]:
        print(f"  {d['district']}, {d['state']}: {d['temperature_celsius']}°C")
