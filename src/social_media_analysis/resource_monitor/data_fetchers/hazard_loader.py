"""
hazard_loader.py
================
Loads the india_hazard_master_dataset_final.csv into MongoDB.
Provides district level environmental data for resource estimation.

Run once to load:
    python data_fetchers/hazard_loader.py

Data available per district:
    ndvi_mean               -> crop/vegetation health
    surface_water_occurrence -> water availability
    rainfall_anomaly        -> rainfall vs normal
    temperature_mean        -> heat stress
    humidity_mean           -> moisture
    elevation_mean          -> flood risk
    population_density      -> severity multiplier
    wind_speed_mean         -> weather
    lat / longitude         -> location
"""

import pandas as pd
import numpy as np
from pymongo import MongoClient, UpdateOne
from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()

_client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/"))
_db     = _client["netravaah"]
_col    = _db["hazard_data"]


def load_hazard_data(csv_path: str = None):
    """Load hazard dataset into MongoDB hazard_data collection."""

    if csv_path is None:
        possible = [
            Path("data/india_hazard_master_dataset_final.csv"),
            Path("../data/india_hazard_master_dataset_final.csv"),
            Path("data/raw data/india_hazard_master_dataset_final.csv"),
        ]
        for p in possible:
            if p.exists():
                csv_path = str(p)
                break

    if csv_path is None:
        raise FileNotFoundError(
            "Place india_hazard_master_dataset_final.csv in data/ folder"
        )

    print(f"Loading hazard data from {csv_path}...")
    df = pd.read_csv(csv_path)

    # Normalize temperature from Kelvin to Celsius
    df["temperature_celsius"] = df["temperature_mean"] - 273.15
    df["humidity_percent"]    = df["humidity_mean"] - 273.15

    # Fill missing soil moisture with district mean
    df["soil_moisture_mean"] = df["soil_moisture_mean"].fillna(
        df["soil_moisture_mean"].median()
    )

    ops = []
    for _, row in df.iterrows():
        doc = {
            "state":                    row["ADM1_NAME"],
            "district":                 row["ADM2_NAME"],
            "lat":                      row["latitude"],
            "lng":                      row["longitude"],
            "ndvi_mean":                row["ndvi_mean"],
            "surface_water_occurrence": row["surface_water_occurrence"],
            "rainfall_anomaly":         row["rainfall_anomaly"],
            "temperature_celsius":      round(row["temperature_celsius"], 2),
            "humidity_percent":         round(row["humidity_percent"], 2),
            "elevation_mean":           row["elevation_mean"],
            "population_density":       row["population_density"],
            "wind_speed_mean":          row["wind_speed_mean"],
            "soil_moisture":            row["soil_moisture_mean"],
            "slope_mean":               row["slope_mean"],
        }
        ops.append(UpdateOne(
            {"district": row["ADM2_NAME"], "state": row["ADM1_NAME"]},
            {"$set": doc},
            upsert=True,
        ))

    if ops:
        result = _col.bulk_write(ops)
        print(f"Loaded {result.upserted_count} new + {result.modified_count} updated districts")

    _col.create_index([("state", 1), ("district", 1)])
    print(f"Total districts in DB: {_col.count_documents({})}")


def get_district_data(district: str, state: str = None) -> dict:
    """Fetch hazard data for a specific district."""
    query = {"district": {"$regex": district, "$options": "i"}}
    if state:
        query["state"] = {"$regex": state, "$options": "i"}
    return _col.find_one(query, {"_id": 0})


def get_state_data(state: str) -> list:
    """Fetch hazard data for all districts in a state."""
    return list(_col.find(
        {"state": {"$regex": state, "$options": "i"}},
        {"_id": 0}
    ))


if __name__ == "__main__":
    load_hazard_data()
    sample = get_district_data("Karnal", "Haryana")
    if sample:
        print("\nSample district data:")
        for k, v in sample.items():
            print(f"  {k}: {v}")
