"""
crop_loader.py
==============
Loads district wise crop production data from apy.csv into MongoDB.
Computes crop health index per district for agriculture monitoring.

Place apy.csv in data/ folder and run:
    python data_fetchers/crop_loader.py
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
_col    = _db["crop_data"]

# Key food crops to monitor
KEY_CROPS = [
    "Rice", "Wheat", "Maize", "Jowar", "Bajra",
    "Pulses", "Sugarcane", "Cotton", "Groundnut",
    "Soyabean", "Sunflower", "Potato", "Onion", "Tomato",
]


def load_crop_data(csv_path: str = None):
    """Load crop production data into MongoDB."""

    if csv_path is None:
        possible = [
            Path("data/apy.csv"),
            Path("../data/apy.csv"),
            Path("data/raw data/apy.csv"),
        ]
        for p in possible:
            if p.exists():
                csv_path = str(p)
                break

    if csv_path is None:
        raise FileNotFoundError("Place apy.csv in data/ folder")

    print(f"Loading crop data from {csv_path}...")
    df = pd.read_csv(csv_path)

    # Clean column names
    df.columns = df.columns.str.strip()
    df["Season"]        = df["Season"].str.strip()
    df["Crop"]          = df["Crop"].str.strip()
    df["State_Name"]    = df["State_Name"].str.strip()
    df["District_Name"] = df["District_Name"].str.strip()

    # Use most recent year available
    latest_year = df["Crop_Year"].max()
    recent      = df[df["Crop_Year"] >= latest_year - 3].copy()

    print(f"Using data from {latest_year-3} to {latest_year}")

    # Aggregate by district - total production and area
    district_agg = recent.groupby(
        ["State_Name", "District_Name"]
    ).agg(
        total_production=("Production", "sum"),
        total_area=("Area", "sum"),
        crop_count=("Crop", "nunique"),
    ).reset_index()

    # Calculate yield per hectare
    district_agg["yield_per_hectare"] = (
        district_agg["total_production"] /
        district_agg["total_area"].replace(0, np.nan)
    ).fillna(0)

    # Get top crop per district
    top_crop = (
        recent.groupby(["State_Name", "District_Name", "Crop"])["Production"]
        .sum()
        .reset_index()
        .sort_values("Production", ascending=False)
        .groupby(["State_Name", "District_Name"])
        .first()
        .reset_index()
        [["State_Name", "District_Name", "Crop"]]
        .rename(columns={"Crop": "primary_crop"})
    )

    district_agg = district_agg.merge(top_crop, on=["State_Name", "District_Name"])

    # Compute crop health index (0-1 scale)
    max_yield = district_agg["yield_per_hectare"].quantile(0.95)
    district_agg["crop_health_index"] = (
        district_agg["yield_per_hectare"] / max_yield
    ).clip(0, 1).round(3)

    print(f"Processing {len(district_agg)} districts...")
    ops = []
    for _, row in district_agg.iterrows():
        doc = {
            "state":              row["State_Name"],
            "district":           row["District_Name"].title(),
            "total_production":   round(row["total_production"], 2),
            "total_area_ha":      round(row["total_area"], 2),
            "yield_per_hectare":  round(row["yield_per_hectare"], 2),
            "crop_health_index":  row["crop_health_index"],
            "primary_crop":       row["primary_crop"],
            "crop_diversity":     int(row["crop_count"]),
            "data_year_range":    f"{latest_year-3}-{latest_year}",
        }
        ops.append(UpdateOne(
            {"district": row["District_Name"].title(), "state": row["State_Name"]},
            {"$set": doc},
            upsert=True,
        ))

    if ops:
        result = _col.bulk_write(ops)
        print(f"Loaded {result.upserted_count} new + {result.modified_count} updated")

    _col.create_index([("state", 1), ("district", 1)])
    print(f"Total districts in crop DB: {_col.count_documents({})}")


def get_district_crop(district: str, state: str = None) -> dict:
    """Get crop data for a district."""
    query = {"district": {"$regex": district, "$options": "i"}}
    if state:
        query["state"] = {"$regex": state, "$options": "i"}
    return _col.find_one(query, {"_id": 0})


def get_low_crop_health_districts(threshold: float = 0.3) -> list:
    """Get all districts with crop health index below threshold."""
    return list(_col.find(
        {"crop_health_index": {"$lt": threshold}},
        {"_id": 0, "state": 1, "district": 1, "crop_health_index": 1, "primary_crop": 1}
    ).sort("crop_health_index", 1))


if __name__ == "__main__":
    load_crop_data()
    sample = get_district_crop("Karnal", "Haryana")
    if sample:
        print("\nSample district crop data:")
        for k, v in sample.items():
            print(f"  {k}: {v}")

    low = get_low_crop_health_districts()
    print(f"\nDistricts with low crop health: {len(low)}")
    if low:
        print("Top 5 worst:")
        for d in low[:5]:
            print(f"  {d['district']}, {d['state']} -> {d['crop_health_index']}")
