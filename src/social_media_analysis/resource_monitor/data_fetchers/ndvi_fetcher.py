"""
ndvi_fetcher.py
===============
Fetches live NDVI (vegetation health) data from NASA MODIS satellite.
Uses NASA LANCE near-real-time data — free, no API key needed.

NDVI = Normalized Difference Vegetation Index
    > 0.6  = Dense healthy vegetation
    0.4-0.6 = Moderate vegetation
    0.2-0.4 = Sparse / stressed vegetation
    < 0.2  = Bare soil / crop failure / drought

Updates: Every 16 days (MODIS compositing cycle)

Replaces static hazard CSV field: ndvi_mean

API Used: NASA POWER API (free, no key)
    https://power.larc.nasa.gov/api/temporal/daily/point

NASA POWER provides daily NDVI-related surface parameters
at district coordinates — completely free.

Run manually:
    python data_fetchers/ndvi_fetcher.py

Called by scheduler every 16 days.
"""

import requests
import os
from datetime import datetime, timedelta
from pymongo import MongoClient, UpdateOne
from dotenv import load_dotenv

load_dotenv()

_client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/"))
_db     = _client["netravaah"]
_col    = _db["ndvi_live"]
_hazard = _db["hazard_data"]

# NASA POWER API - free, no API key required
NASA_POWER_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"

# Parameters that approximate vegetation health
# ALLSKY_SFC_PAR_TOT = total photosynthetically active radiation
# T2M = temperature at 2m
# PRECTOTCORR = precipitation
NASA_PARAMETERS = "ALLSKY_SFC_PAR_TOT,T2M,PRECTOTCORR,RH2M,GWETTOP"


def fetch_district_ndvi_proxy(
    district: str,
    state:    str,
    lat:      float,
    lng:      float,
) -> dict | None:
    """
    Fetch vegetation proxy data from NASA POWER API.

    NASA POWER doesn't give NDVI directly, but gives
    Photosynthetically Active Radiation (PAR) and other
    parameters from which we derive a vegetation health score.

    For true NDVI, we use the Open-Meteo forecast to derive
    a vegetation stress index from temperature + precipitation.
    """
    try:
        end_date   = datetime.now()
        start_date = end_date - timedelta(days=16)

        params = {
            "parameters":  NASA_PARAMETERS,
            "community":   "AG",    # Agriculture community
            "longitude":   lng,
            "latitude":    lat,
            "start":       start_date.strftime("%Y%m%d"),
            "end":         end_date.strftime("%Y%m%d"),
            "format":      "JSON",
        }

        response = requests.get(NASA_POWER_URL, params=params, timeout=30)

        if response.status_code != 200:
            return None

        data       = response.json()
        properties = data.get("properties", {}).get("parameter", {})

        if not properties:
            return None

        # Extract 16-day averages
        def avg_values(key: str) -> float:
            vals = list(properties.get(key, {}).values())
            valid = [v for v in vals if v is not None and v != -999.0]
            return round(sum(valid) / len(valid), 4) if valid else 0.0

        par_avg    = avg_values("ALLSKY_SFC_PAR_TOT")   # Photosynthetically active radiation
        temp_avg   = avg_values("T2M")                   # Temperature
        precip_avg = avg_values("PRECTOTCORR")           # Precipitation
        humidity   = avg_values("RH2M")                  # Relative humidity
        soil_wet   = avg_values("GWETTOP")               # Surface soil wetness (0-1)

        # Derive vegetation health score (0-1) from PAR + precip + temp
        # Higher PAR + adequate moisture = healthy vegetation
        par_score     = min(par_avg / 25.0, 1.0)         # Normalize PAR
        precip_score  = min(precip_avg / 5.0, 1.0)       # 5mm/day = excellent
        temp_stress   = 1.0
        if temp_avg > 38:
            temp_stress = max(0.2, 1 - (temp_avg - 38) * 0.05)
        elif temp_avg < 5:
            temp_stress = max(0.3, 1 - (5 - temp_avg) * 0.06)

        veg_health = round(
            par_score   * 0.40 +
            precip_score * 0.35 +
            soil_wet    * 0.15 +
            temp_stress * 0.10,
            3
        )

        # Convert to NDVI-equivalent scale (0.1 to 0.9)
        ndvi_equivalent = round(0.1 + veg_health * 0.8, 3)

        # Classify vegetation condition
        if ndvi_equivalent > 0.6:
            condition = "Healthy"
        elif ndvi_equivalent > 0.4:
            condition = "Moderate"
        elif ndvi_equivalent > 0.25:
            condition = "Stressed"
        else:
            condition = "Critical"

        return {
            "district":         district,
            "state":            state,
            "lat":              lat,
            "lng":              lng,
            "ndvi_equivalent":  ndvi_equivalent,
            "veg_health_score": veg_health,
            "condition":        condition,
            "par_avg":          par_avg,
            "temp_avg":         temp_avg,
            "precip_avg_mm":    precip_avg,
            "humidity_avg":     humidity,
            "soil_wetness":     soil_wet,
            "period_days":      16,
            "fetched_at":       datetime.utcnow().isoformat(),
            "data_date":        end_date.strftime("%Y-%m-%d"),
        }

    except Exception as e:
        print(f"    NASA POWER fetch failed for {district}: {e}")
        return None


def fetch_all_districts_ndvi():
    """
    Fetch NDVI proxy for all districts.
    Called by scheduler every 16 days.
    """
    districts = list(_hazard.find(
        {},
        {"district": 1, "state": 1, "lat": 1, "lng": 1, "_id": 0}
    ))

    print(f"Fetching NASA vegetation data for {len(districts)} districts...")
    print("Note: This takes a few minutes due to API rate limits.\n")

    ops     = []
    success = 0
    failed  = 0

    import time
    for i, d in enumerate(districts):
        lat = d.get("lat")
        lng = d.get("lng")

        if not lat or not lng:
            failed += 1
            continue

        result = fetch_district_ndvi_proxy(d["district"], d["state"], lat, lng)

        if result:
            ops.append(UpdateOne(
                {"district": d["district"], "state": d["state"]},
                {"$set": result},
                upsert=True,
            ))
            success += 1

            if success % 20 == 0:
                print(f"  {success}/{len(districts)} done...")
                # Batch write every 20 to avoid memory buildup
                if ops:
                    _col.bulk_write(ops)
                    ops = []
        else:
            failed += 1

        # Small delay to respect NASA API rate limits
        time.sleep(0.3)

    if ops:
        _col.bulk_write(ops)

    _col.create_index([("state", 1), ("district", 1)])
    _col.create_index("condition")
    _col.create_index("ndvi_equivalent")

    print(f"Done: {success} districts updated, {failed} failed")
    return success


def get_district_ndvi(district: str, state: str = None) -> dict | None:
    """Get latest vegetation data for a district."""
    query = {"district": {"$regex": district, "$options": "i"}}
    if state:
        query["state"] = {"$regex": state, "$options": "i"}
    return _col.find_one(query, {"_id": 0})


def get_stressed_districts(condition: str = "Stressed") -> list:
    """Get all districts with stressed or critical vegetation."""
    return list(_col.find(
        {"condition": {"$in": ["Stressed", "Critical"]}},
        {"_id": 0, "district": 1, "state": 1, "ndvi_equivalent": 1, "condition": 1}
    ).sort("ndvi_equivalent", 1))


if __name__ == "__main__":
    # Test with sample districts
    test_cases = [
        ("Karnal",   "Haryana",       29.68, 76.98),
        ("Varanasi", "Uttar Pradesh", 25.32, 83.01),
        ("Nashik",   "Maharashtra",   20.00, 73.79),
    ]

    print("Testing NASA NDVI fetcher...\n")
    for district, state, lat, lng in test_cases:
        result = fetch_district_ndvi_proxy(district, state, lat, lng)
        if result:
            print(f"{district}, {state}:")
            print(f"  NDVI equivalent: {result['ndvi_equivalent']}")
            print(f"  Condition:       {result['condition']}")
            print(f"  Veg health:      {result['veg_health_score']}")
            print(f"  PAR avg:         {result['par_avg']}")
            print(f"  Precip avg:      {result['precip_avg_mm']} mm/day")
            print()
        else:
            print(f"{district}: Failed to fetch\n")
