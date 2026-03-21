"""
aqi_fetcher.py
==============
Fetches real time AQI data from WAQI (aqicn.org) API.
Updates MongoDB every hour via scheduler.

Token: f7bdb82a3693b58f29e0c44d3d57fb2823244248
API:   https://api.waqi.info

Run manually:
    python data_fetchers/aqi_fetcher.py
"""

import requests
import os
from pymongo import MongoClient, UpdateOne
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

_client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/"))
_db     = _client["netravaah"]
_col    = _db["aqi_data"]

WAQI_TOKEN = os.getenv("WAQI_TOKEN", "f7bdb82a3693b58f29e0c44d3d57fb2823244248")
BASE_URL   = "https://api.waqi.info"

# Major Indian cities to monitor
# Covers all states in hazard dataset
INDIAN_CITIES = [
    # North
    "delhi", "noida", "gurgaon", "lucknow", "kanpur", "agra", "varanasi",
    "jaipur", "jodhpur", "kota", "chandigarh", "amritsar", "ludhiana",
    "dehradun", "shimla", "srinagar",
    # East
    "patna", "gaya", "ranchi", "dhanbad", "bhubaneswar", "cuttack",
    "kolkata", "asansol", "siliguri",
    # West
    "mumbai", "pune", "nagpur", "nashik", "aurangabad", "ahmedabad",
    "surat", "vadodara", "rajkot", "bhopal", "indore", "jabalpur",
    "raipur", "bilaspur",
    # South
    "chennai", "coimbatore", "madurai", "bangalore", "mysore", "mangalore",
    "hyderabad", "warangal", "visakhapatnam", "vijayawada", "kochi",
    "thiruvananthapuram", "kozhikode",
    # Northeast
    "guwahati", "imphal", "shillong", "agartala",
]

# AQI category thresholds
def categorize_aqi(aqi: int) -> str:
    if aqi <= 50:   return "Good"
    if aqi <= 100:  return "Moderate"
    if aqi <= 150:  return "Unhealthy for Sensitive Groups"
    if aqi <= 200:  return "Unhealthy"
    if aqi <= 300:  return "Very Unhealthy"
    return "Hazardous"


def fetch_city_aqi(city: str) -> dict | None:
    """Fetch AQI for a single city."""
    try:
        url      = f"{BASE_URL}/feed/{city}/?token={WAQI_TOKEN}"
        response = requests.get(url, timeout=10)
        data     = response.json()

        if data.get("status") != "ok":
            return None

        d   = data["data"]
        aqi = d.get("aqi", 0)

        if not isinstance(aqi, (int, float)):
            return None

        return {
            "city":       d.get("city", {}).get("name", city),
            "aqi":        int(aqi),
            "category":   categorize_aqi(int(aqi)),
            "lat":        d.get("city", {}).get("geo", [None, None])[0],
            "lng":        d.get("city", {}).get("geo", [None, None])[1],
            "pm25":       d.get("iaqi", {}).get("pm25", {}).get("v"),
            "pm10":       d.get("iaqi", {}).get("pm10", {}).get("v"),
            "no2":        d.get("iaqi", {}).get("no2", {}).get("v"),
            "co":         d.get("iaqi", {}).get("co", {}).get("v"),
            "o3":         d.get("iaqi", {}).get("o3", {}).get("v"),
            "updated_at": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        print(f"  Failed for {city}: {e}")
        return None


def fetch_all_india_aqi():
    """
    Fetch AQI for all Indian cities and save to MongoDB.
    Called by scheduler every hour.
    """
    print(f"Fetching AQI data for {len(INDIAN_CITIES)} cities...")
    ops      = []
    success  = 0
    failed   = 0

    for city in INDIAN_CITIES:
        result = fetch_city_aqi(city)
        if result:
            ops.append(UpdateOne(
                {"city": result["city"]},
                {"$set": result},
                upsert=True,
            ))
            success += 1
            print(f"  {result['city']}: AQI {result['aqi']} ({result['category']})")
        else:
            failed += 1

    if ops:
        _col.bulk_write(ops)

    _col.create_index("city")
    _col.create_index("aqi")

    print(f"Done: {success} cities updated, {failed} failed")
    return success


def fetch_by_coordinates(lat: float, lng: float) -> dict | None:
    """Fetch nearest AQI station to given coordinates."""
    try:
        url      = f"{BASE_URL}/feed/geo:{lat};{lng}/?token={WAQI_TOKEN}"
        response = requests.get(url, timeout=10)
        data     = response.json()

        if data.get("status") != "ok":
            return None

        d   = data["data"]
        aqi = d.get("aqi", 0)

        return {
            "city":     d.get("city", {}).get("name", "Unknown"),
            "aqi":      int(aqi) if isinstance(aqi, (int, float)) else 0,
            "category": categorize_aqi(int(aqi) if isinstance(aqi, (int, float)) else 0),
            "pm25":     d.get("iaqi", {}).get("pm25", {}).get("v"),
            "pm10":     d.get("iaqi", {}).get("pm10", {}).get("v"),
        }
    except Exception:
        return None


def get_city_aqi(city: str) -> dict | None:
    """Get latest AQI for a city from MongoDB."""
    return _col.find_one(
        {"city": {"$regex": city, "$options": "i"}},
        {"_id": 0}
    )


def get_high_pollution_cities(aqi_threshold: int = 150) -> list:
    """Get all cities with AQI above threshold."""
    return list(_col.find(
        {"aqi": {"$gte": aqi_threshold}},
        {"_id": 0, "city": 1, "aqi": 1, "category": 1, "pm25": 1}
    ).sort("aqi", -1))


if __name__ == "__main__":
    fetch_all_india_aqi()
    print("\nHigh pollution cities (AQI > 150):")
    high = get_high_pollution_cities(150)
    for c in high[:10]:
        print(f"  {c['city']}: {c['aqi']} - {c['category']}")
