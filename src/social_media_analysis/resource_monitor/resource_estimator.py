"""
resource_estimator.py
=====================
Estimates expected resource availability per district
by combining hazard data, electricity capacity, crop data and AQI.

This is Layer 2 of the Resource Mismanagement Module.
"""

import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

_client   = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/"))
_db       = _client["netravaah"]
_hazard   = _db["hazard_data"]            # base: elevation, population density (static, never changes)
_elec_gen = _db["electricity_generation"] # LIVE: daily NPP actual generation
_elec_cap = _db["electricity_capacity"]   # fallback: installed capacity
_crop     = _db["crop_data"]              # base crop history (updated seasonally)
_aqi      = _db["aqi_data"]              # LIVE: hourly WAQI AQI
_weather  = _db["weather_live"]          # LIVE: 6-hourly Open-Meteo (temp, rain, humidity)
_ndvi     = _db["ndvi_live"]             # LIVE: 16-day NASA vegetation index
_signals  = _db["social_signals"]


def estimate_water_availability(district_data: dict, district: str, state: str) -> dict:
    """
    Estimate water availability score (0-1) for a district.
    Uses LIVE weather data from Open-Meteo where available,
    falls back to hazard CSV data.
    """
    # Try live weather data first
    live_weather = _weather.find_one(
        {"district": {"$regex": district, "$options": "i"},
         "state":    {"$regex": state,    "$options": "i"}},
        {"_id": 0}
    )

    if live_weather:
        # Use live rainfall (7 day total) and humidity
        rainfall_mm    = live_weather.get("rainfall_7day_mm", 0)
        rainfall_factor = min(rainfall_mm / 70, 1.0)   # 70mm in 7 days = excellent
        soil_moisture  = live_weather.get("soil_moisture", 0.3)
        source         = "live"
    else:
        # Fallback to hazard CSV
        rainfall       = district_data.get("rainfall_anomaly", 4000)
        rainfall_factor = min(rainfall / 6000, 1.0)
        soil_moisture  = district_data.get("soil_moisture", 0.5)
        if soil_moisture > 1:
            soil_moisture = min(soil_moisture / 100, 1.0)
        source         = "static"

    surface_water = district_data.get("surface_water_occurrence", 50) / 100

    water_score = (
        surface_water    * 0.40 +
        rainfall_factor  * 0.35 +
        soil_moisture    * 0.25
    )

    return {
        "water_score":     round(water_score, 3),
        "surface_water":   round(surface_water, 3),
        "rainfall_factor": round(rainfall_factor, 3),
        "soil_moisture":   round(soil_moisture, 3),
        "data_source":     source,
    }


def estimate_electricity_availability(state: str, population_density: float) -> dict:
    """
    Estimate electricity availability using LIVE daily generation data.
    Falls back to installed capacity if live data not yet available.
    """
    # Try live generation data first (from NPP daily scraper)
    live_gen = _elec_gen.find_one(
        {"state": {"$regex": state, "$options": "i"}},
        {"_id": 0},
    )

    if live_gen and live_gen.get("utilization_pct"):
        utilization  = live_gen["utilization_pct"]
        # Convert utilization % to score (100% = 1.0, 0% = 0.0)
        elec_score   = round(min(utilization / 100, 1.0), 3)
        total_mw     = live_gen.get("installed_mw", 0)
        data_source  = "live"
    else:
        # Fallback to installed capacity
        cap_data = _elec_cap.find_one(
            {"state": {"$regex": state, "$options": "i"}},
            {"_id": 0}
        )
        if not cap_data:
            return {
                "electricity_score": 0.5,
                "total_capacity_mw": 0,
                "data_source":       "none",
            }
        total_mw    = cap_data.get("total_capacity_mw", 0)
        elec_score  = min(total_mw / 50000, 1.0)
        data_source = "static"
        utilization = None

    # Adjust for population density
    if population_density > 500:
        elec_score = round(elec_score * 0.85, 3)

    return {
        "electricity_score":  elec_score,
        "total_capacity_mw":  total_mw,
        "utilization_pct":    live_gen.get("utilization_pct") if live_gen else None,
        "underutilized":      live_gen.get("underutilized", False) if live_gen else False,
        "data_source":        data_source,
    }


def estimate_crop_health(district: str, state: str, district_data: dict) -> dict:
    """
    Estimate crop health using LIVE NASA NDVI proxy and weather data.
    Falls back to static hazard data if live not available.
    """
    crop_data = _crop.find_one(
        {"district": {"$regex": district, "$options": "i"},
         "state":    {"$regex": state,    "$options": "i"}},
        {"_id": 0}
    )

    # Try live NDVI data from NASA
    live_ndvi = _ndvi.find_one(
        {"district": {"$regex": district, "$options": "i"},
         "state":    {"$regex": state,    "$options": "i"}},
        {"_id": 0}
    )

    # Try live weather for temperature stress
    live_weather = _weather.find_one(
        {"district": {"$regex": district, "$options": "i"},
         "state":    {"$regex": state,    "$options": "i"}},
        {"_id": 0}
    )

    if live_ndvi:
        ndvi_score  = live_ndvi.get("veg_health_score", 0.5)
        condition   = live_ndvi.get("condition", "Unknown")
        data_source = "live_nasa"
    else:
        # Fallback to static NDVI from hazard CSV
        ndvi       = district_data.get("ndvi_mean", 5000)
        ndvi_score = min(ndvi / 7000, 1.0)
        condition  = "Unknown"
        data_source = "static"

    if live_weather:
        temperature = live_weather.get("temperature_celsius", 25)
    else:
        temperature = district_data.get("temperature_celsius", 25)

    temp_stress = 1.0
    if temperature > 35:
        temp_stress = max(0.3, 1 - (temperature - 35) * 0.05)
    elif temperature < 10:
        temp_stress = max(0.4, 1 - (10 - temperature) * 0.05)

    if crop_data:
        db_health    = crop_data.get("crop_health_index", 0.5)
        crop_score   = (db_health * 0.5 + ndvi_score * 0.35 + temp_stress * 0.15)
        primary_crop = crop_data.get("primary_crop", "Unknown")
    else:
        crop_score   = (ndvi_score * 0.65 + temp_stress * 0.35)
        primary_crop = "Unknown"

    return {
        "crop_score":    round(crop_score, 3),
        "ndvi_score":    round(ndvi_score, 3),
        "temp_stress":   round(temp_stress, 3),
        "condition":     condition,
        "primary_crop":  primary_crop,
        "data_source":   data_source,
    }


def estimate_air_quality(district: str, state: str, district_data: dict) -> dict:
    """
    Estimate air quality combining live AQI and environmental data.
    """
    # Try to find AQI for district or state capital
    aqi_data = _aqi.find_one(
        {"city": {"$regex": district, "$options": "i"}},
        {"_id": 0}
    )
    if not aqi_data:
        aqi_data = _aqi.find_one(
            {"city": {"$regex": state.split()[0], "$options": "i"}},
            {"_id": 0}
        )

    if aqi_data:
        aqi       = aqi_data.get("aqi", 100)
        # Convert AQI to score (lower AQI = better = higher score)
        aqi_score = max(0, 1 - (aqi / 300))
        live_aqi  = aqi
        category  = aqi_data.get("category", "Moderate")
    else:
        # Estimate from NDVI and temperature
        ndvi      = district_data.get("ndvi_mean", 5000)
        temp      = district_data.get("temperature_celsius", 25)
        aqi_score = min(ndvi / 7000, 1.0) * 0.7 + max(0, 1 - temp / 50) * 0.3
        live_aqi  = None
        category  = "Estimated"

    return {
        "air_quality_score": round(aqi_score, 3),
        "live_aqi":          live_aqi,
        "category":          category,
    }


def estimate_flood_risk(district_data: dict) -> dict:
    """
    Estimate flood risk from elevation, rainfall and surface water.
    Lower elevation + high rainfall = higher flood risk.
    """
    elevation     = district_data.get("elevation_mean", 300)
    rainfall      = district_data.get("rainfall_anomaly", 4000)
    surface_water = district_data.get("surface_water_occurrence", 50)

    # Low elevation is higher risk
    elevation_risk = max(0, 1 - elevation / 1000)

    # High rainfall anomaly = higher risk
    rainfall_risk  = min(rainfall / 8000, 1.0)

    # High surface water = higher risk
    water_risk     = surface_water / 100

    flood_risk = (
        elevation_risk * 0.40 +
        rainfall_risk  * 0.35 +
        water_risk     * 0.25
    )

    return {
        "flood_risk_score": round(flood_risk, 3),
        "elevation_m":      round(elevation, 1),
        "risk_level":       "High" if flood_risk > 0.6 else "Medium" if flood_risk > 0.3 else "Low",
    }


def get_complaint_count(district: str, issue_type: str = None) -> int:
    """Get complaint count from MongoDB social_signals for a district."""
    query = {
        "nlp_processed": True,
        "locations.name": {"$regex": district, "$options": "i"},
    }
    if issue_type:
        query["final_issue"] = issue_type
    return _signals.count_documents(query)


def estimate_all(district: str, state: str) -> dict:
    """
    Full resource estimation for a district.
    Combines all data sources into one unified estimate.
    """
    district_data = _hazard.find_one(
        {
            "district": {"$regex": district, "$options": "i"},
            "state":    {"$regex": state, "$options": "i"},
        },
        {"_id": 0}
    )

    if not district_data:
        return {
            "error":    f"No hazard data found for {district}, {state}",
            "district": district,
            "state":    state,
        }

    pop_density = district_data.get("population_density", 10)

    water       = estimate_water_availability(district_data, district, state)
    electricity = estimate_electricity_availability(state, pop_density)
    crop        = estimate_crop_health(district, state, district_data)
    air         = estimate_air_quality(district, state, district_data)
    flood       = estimate_flood_risk(district_data)

    return {
        "district":          district,
        "state":             state,
        "lat":               district_data.get("lat"),
        "lng":               district_data.get("lng"),
        "population_density":pop_density,
        "water":             water,
        "electricity":       electricity,
        "crop":              crop,
        "air_quality":       air,
        "flood_risk":        flood,
        "complaints": {
            "water":       get_complaint_count(district, "Water Supply"),
            "electricity": get_complaint_count(district, "Electricity"),
            "flooding":    get_complaint_count(district, "Flooding"),
            "agriculture": get_complaint_count(district, "Agriculture"),
            "air":         get_complaint_count(district, "Air Pollution"),
        },
    }


if __name__ == "__main__":
    result = estimate_all("Karnal", "Haryana")
    import json
    print(json.dumps(result, indent=2, default=str))
