"""
Data Ingestion Services:
  - WeatherService (Open-Meteo + OpenWeather + Weatherbit)
  - SatelliteService (Google Earth Engine via NDVI/soil)
  - IDSPService (India Disease Surveillance Programme)
  - CitizenPostService (community symptom reports)
  - HazardDataService (India hazard dataset)
"""

import logging
import requests
import pandas as pd
import numpy as np
from datetime import datetime
from dataclasses import dataclass
from typing import Optional
import os

from ..config.settings import (
    weatherbit_api_key, openweather_api_key, gemini_api_key,
    open_meteo_base_url, openweather_base_url, weatherbit_base_url,
    hazard_dataset
)

logger = logging.getLogger(__name__)


# ─── DATA CLASSES ─────────────────────────────────────────────────────────────
@dataclass
class WeatherData:
    district: str
    lat: float
    lon: float
    temperature_mean: float
    humidity_mean: float
    rainfall_mm: float
    rainfall_anomaly: float
    wind_speed: float
    pressure: float
    cloud_cover: float
    source: str
    timestamp: datetime = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()

@dataclass
class SatelliteData:
    district: str
    lat: float
    lon: float
    ndvi_mean: float
    soil_moisture: float
    surface_water_occurrence: float
    elevation_mean: float
    slope_mean: float
    timestamp: datetime = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()

@dataclass
class IDSPReport:
    district: str
    state: str
    disease: str
    cases: int
    deaths: int
    week_number: int
    year: int
    source_url: str = ""


# ═══════════════════════════════════════════════════════════════════════════════
# WEATHER SERVICE
# ═══════════════════════════════════════════════════════════════════════════════
class WeatherService:
    """
    Fetches weather data from Open-Meteo (free), OpenWeather, and Weatherbit.
    Tries Open-Meteo first (no rate limit), falls back to others.
    """

    # District → (lat, lon) lookup for major Indian districts
    DISTRICT_COORDS = {
        "Lucknow": (26.8467, 80.9462),
        "Kanpur": (26.4499, 80.3319),
        "Agra": (27.1767, 78.0081),
        "Varanasi": (25.3176, 82.9739),
        "Allahabad": (25.4358, 81.8463),
        "Delhi": (28.6139, 77.2090),
        "Mumbai": (19.0760, 72.8777),
        "Bengaluru": (12.9716, 77.5946),
        "Chennai": (13.0827, 80.2707),
        "Kolkata": (22.5726, 88.3639),
        "Hyderabad": (17.3850, 78.4867),
        "Pune": (18.5204, 73.8567),
        "Jaipur": (26.9124, 75.7873),
        "Patna": (25.5941, 85.1376),
        "Bhopal": (23.2599, 77.4126),
        "Sitapur": (27.5706, 80.6826),
        "Barabanki": (26.9259, 81.1947),
        "Karnal": (29.6857, 76.9905),
        "Kurukshetra": (29.9695, 76.8783),
    }

    def get_coords(self, district: str) -> tuple[float, float]:
        """Get coordinates for district, defaulting to center of India"""
        return self.DISTRICT_COORDS.get(district, (20.5937, 78.9629))

    def fetch_open_meteo(self, district: str, days: int = 7) -> Optional[WeatherData]:
        """Fetch from Open-Meteo (free, no key required)"""
        lat, lon = self.get_coords(district)
        try:
            params = {
                "latitude": lat,
                "longitude": lon,
                "hourly": ",".join([
                    "temperature_2m", "relative_humidity_2m", "precipitation",
                    "wind_speed_10m", "cloud_cover", "surface_pressure",
                    "soil_moisture_0_to_1cm", "vapour_pressure_deficit"
                ]),
                "forecast_days": min(days, 16),
                "timezone": "Asia/Kolkata"
            }
            resp = requests.get(open_meteo_base_url, params=params, timeout=15)
            resp.raise_for_status()
            data = resp.json()
            hourly = data.get("hourly", {})

            temps = hourly.get("temperature_2m", [25.0])
            humidity = hourly.get("relative_humidity_2m", [70.0])
            precip = hourly.get("precipitation", [0.0])
            wind = hourly.get("wind_speed_10m", [10.0])
            cloud = hourly.get("cloud_cover", [50.0])
            pressure = hourly.get("surface_pressure", [1013.0])
            soil = hourly.get("soil_moisture_0_to_1cm", [0.3])

            def safe_mean(lst):
                lst = [x for x in lst if x is not None]
                return float(np.mean(lst)) if lst else 0.0

            return WeatherData(
                district=district,
                lat=lat,
                lon=lon,
                temperature_mean=round(safe_mean(temps), 2),
                humidity_mean=round(safe_mean(humidity), 2),
                rainfall_mm=round(sum(p for p in precip if p), 2),
                rainfall_anomaly=round(safe_mean(precip) * 1000, 2),
                wind_speed=round(safe_mean(wind), 2),
                pressure=round(safe_mean(pressure), 2),
                cloud_cover=round(safe_mean(cloud), 2),
                source="open_meteo"
            )
        except Exception as e:
            logger.warning("Open-Meteo failed for {}: {}".format(district, e))
            return None

    def fetch_openweather(self, district: str) -> Optional[WeatherData]:
        """Fetch current weather from OpenWeather API"""
        lat, lon = self.get_coords(district)
        try:
            url = "{}/weather".format(openweather_base_url)
            params = {
                "lat": lat, "lon": lon,
                "appid": openweather_api_key,
                "units": "metric"
            }
            resp = requests.get(url, params=params, timeout=10)
            resp.raise_for_status()
            d = resp.json()

            return WeatherData(
                district=district,
                lat=lat,
                lon=lon,
                temperature_mean=d["main"]["temp"],
                humidity_mean=d["main"]["humidity"],
                rainfall_mm=d.get("rain", {}).get("1h", 0.0),
                rainfall_anomaly=d.get("rain", {}).get("1h", 0.0) * 1000,
                wind_speed=d["wind"]["speed"],
                pressure=d["main"]["pressure"],
                cloud_cover=d["clouds"]["all"],
                source="openweather"
            )
        except Exception as e:
            logger.warning("OpenWeather failed for {}: {}".format(district, e))
            return None

    def fetch_weatherbit(self, district: str) -> Optional[WeatherData]:
        """Fetch from Weatherbit API"""
        lat, lon = self.get_coords(district)
        try:
            url = "{}/current".format(weatherbit_base_url)
            params = {
                "lat": lat, "lon": lon,
                "key": weatherbit_api_key,
                "units": "M"
            }
            resp = requests.get(url, params=params, timeout=10)
            resp.raise_for_status()
            d = resp.json()["data"][0]

            return WeatherData(
                district=district,
                lat=lat,
                lon=lon,
                temperature_mean=d.get("temp", 30),
                humidity_mean=d.get("rh", 70),
                rainfall_mm=d.get("precip", 0.0),
                rainfall_anomaly=d.get("precip", 0.0) * 1000,
                wind_speed=d.get("wind_spd", 10),
                pressure=d.get("pres", 1013),
                cloud_cover=d.get("clouds", 50),
                source="weatherbit"
            )
        except Exception as e:
            logger.warning("Weatherbit failed for {}: {}".format(district, e))
            return None

    def get_weather(self, district: str) -> WeatherData:
        """
        Try APIs in order: Open-Meteo → OpenWeather → Weatherbit → Default
        """
        data = self.fetch_open_meteo(district)
        if data:
            return data

        data = self.fetch_openweather(district)
        if data:
            return data

        data = self.fetch_weatherbit(district)
        if data:
            return data

        # Return default estimates
        logger.warning("All weather APIs failed for {}. Using defaults.".format(district))
        lat, lon = self.get_coords(district)
        return WeatherData(
            district=district, lat=lat, lon=lon,
            temperature_mean=30.0, humidity_mean=70.0,
            rainfall_mm=5.0, rainfall_anomaly=2000.0,
            wind_speed=10.0, pressure=1013.0, cloud_cover=50.0,
            source="default_fallback"
        )


# ═══════════════════════════════════════════════════════════════════════════════
# SATELLITE SERVICE (GEE-backed via hazard dataset)
# ═══════════════════════════════════════════════════════════════════════════════
class SatelliteService:
    """
    Provides NDVI, soil moisture, elevation, slope data.
    Reads from the India Hazard Master Dataset (GEE-derived).
    """

    def __init__(self):
        self._df = None
        self._load_hazard_data()

    def _load_hazard_data(self):
        try:
            self._df = pd.read_csv(hazard_dataset)
            logger.info("Loaded hazard dataset: {} rows".format(len(self._df)))
        except Exception as e:
            logger.warning("Hazard dataset load failed: {}".format(e))
            self._df = pd.DataFrame()

    def get_satellite_data(self, district: str, lat: float = None, lon: float = None) -> SatelliteData:
        """Get satellite features for a district from the hazard dataset"""

        if not self._df.empty:
            # Try to find by district name
            row = None
            for col in ["ADM2_NAME", "district", "name"]:
                if col in self._df.columns:
                    matches = self._df[self._df[col].str.lower() == district.lower()]
                    if not matches.empty:
                        row = matches.iloc[0]
                        break

            if row is not None:
                return SatelliteData(
                    district=district,
                    lat=float(row.get("latitude", lat or 20.0)),
                    lon=float(row.get("longitude", lon or 78.0)),
                    ndvi_mean=float(row.get("ndvi_mean", 4000.0)),
                    soil_moisture=float(row.get("soil_moisture_mean", 0.3)),
                    surface_water_occurrence=float(row.get("surface_water_occurrence", 50.0)),
                    elevation_mean=float(row.get("elevation_mean", 200.0)),
                    slope_mean=float(row.get("slope_mean", 2.0)),
                )

        # Default fallback
        return SatelliteData(
            district=district,
            lat=lat or 20.0,
            lon=lon or 78.0,
            ndvi_mean=4000.0,
            soil_moisture=0.3,
            surface_water_occurrence=50.0,
            elevation_mean=200.0,
            slope_mean=2.0,
        )


# ═══════════════════════════════════════════════════════════════════════════════
# IDSP SERVICE
# ═══════════════════════════════════════════════════════════════════════════════
class IDSPService:
    """
    India Disease Surveillance Programme data fetcher.
    Uses the governance dataset as baseline + simulates IDSP API calls.
    """

    IDSP_ENDPOINTS = {
        "weekly_report": "https://idsp.mohfw.gov.in/index4.php?lang=1&level=0&linkid=406&lid=3589",
        "disease_alerts": "https://idsp.mohfw.gov.in/index4.php?lang=1&level=0&linkid=406&lid=3568",
    }

    def __init__(self):
        self._cache = {}

    def fetch_district_report(self, district: str, state: str = None) -> list[IDSPReport]:
        """
        Fetch IDSP weekly disease report for a district.
        Tries actual IDSP URL, falls back to governance dataset.
        """
        reports = []

        # Try IDSP website (read-only public data)
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 Disease Surveillance System",
                "Accept": "application/json, text/html"
            }
            # IDSP typically provides weekly district bulletins
            # Using requests to scrape public data
            resp = requests.get(
                self.IDSP_ENDPOINTS["disease_alerts"],
                headers=headers,
                timeout=10
            )
            # Parse whatever we get (simplified — real implementation needs HTML parsing)
            if resp.status_code == 200:
                logger.info("IDSP connection successful for {}".format(district))
                # In production: parse HTML/JSON response
                # For now, return governance dataset fallback below
        except Exception as e:
            logger.debug("IDSP API not accessible: {}".format(e))

        # Fallback: governance dataset
        try:
            df = pd.read_csv(
                os.path.join(os.path.dirname(__file__), "..", "data", "final_governance_dataset_with_climate.csv")
            )
            # Filter for matching district
            mask = df["state_or_region"].astype(str).str.lower().str.contains(
                district.lower(), na=False
            )
            district_df = df[mask]

            for _, row in district_df.head(10).iterrows():
                disease = str(row.get("predicted_disease", "")).strip()
                if disease and disease != "nan":
                    reports.append(IDSPReport(
                        district=district,
                        state=state or str(row.get("state_or_region", "")),
                        disease=disease,
                        cases=int(row.get("cases", 0)),
                        deaths=int(row.get("deaths", 0)),
                        week_number=datetime.now().isocalendar()[1],
                        year=datetime.now().year,
                        source_url="governance_dataset"
                    ))
        except Exception as e:
            logger.warning("IDSP fallback failed: {}".format(e))

        return reports

    def get_national_disease_summary(self) -> pd.DataFrame:
        """Get national disease burden summary from governance dataset"""
        try:
            df = pd.read_csv(
                os.path.join(os.path.dirname(__file__), "..", "data", "final_governance_dataset_with_climate.csv")
            )
            summary = df.groupby("predicted_disease").agg(
                total_cases=("cases", "sum"),
                total_deaths=("deaths", "sum"),
                total_recoveries=("recoveries", "sum"),
                districts_affected=("state_or_region", "nunique")
            ).reset_index()
            summary = summary.sort_values("total_cases", ascending=False)
            return summary
        except Exception as e:
            logger.error("Could not generate national summary: {}".format(e))
            return pd.DataFrame()


# ═══════════════════════════════════════════════════════════════════════════════
# HAZARD DATA SERVICE
# ═══════════════════════════════════════════════════════════════════════════════
class HazardDataService:
    """Provides environmental hazard scores from India hazard master dataset"""

    def __init__(self):
        self._df = None
        try:
            self._df = pd.read_csv(hazard_dataset)
            # Normalize key columns
            for col in ["ndvi_mean", "soil_moisture_mean", "rainfall_anomaly", "temperature_mean"]:
                if col in self._df.columns:
                    self._df[col] = pd.to_numeric(self._df[col], errors="coerce").fillna(0)
            logger.info("Loaded hazard dataset: {} rows".format(len(self._df)))
        except Exception as e:
            logger.warning("Hazard dataset load failed: {}".format(e))

    def get_environmental_risk(self, district: str = None, lat: float = None, lon: float = None) -> float:
        """Compute environmental risk score (0-1) from hazard features"""

        if self._df is None or self._df.empty:
            return 0.3  # default moderate risk

        row = None
        if district and "ADM2_NAME" in self._df.columns:
            matches = self._df[
                self._df["ADM2_NAME"].str.lower() == district.lower()
            ]
            if not matches.empty:
                row = matches.iloc[0]

        if row is None:
            # Use nearest by coordinates
            if lat and lon and "latitude" in self._df.columns:
                dists = np.sqrt(
                    (self._df["latitude"] - lat) ** 2 +
                    (self._df["longitude"] - lon) ** 2
                )
                row = self._df.iloc[dists.idxmin()]
            else:
                row = self._df.iloc[0]

        # Compute risk components
        ndvi = float(row.get("ndvi_mean", 4000)) / 10000  # normalize
        soil = float(row.get("soil_moisture_mean", 0.3))
        rainfall = min(1.0, float(row.get("rainfall_anomaly", 2000)) / 5000)
        temp = min(1.0, max(0.0, (float(row.get("temperature_mean", 300)) - 270) / 40))

        # Environmental risk: high NDVI + rainfall + soil moisture = high vector risk
        env_risk = (
            0.30 * rainfall +
            0.25 * soil +
            0.25 * ndvi +
            0.20 * temp
        )
        return round(min(1.0, max(0.0, env_risk)), 4)


# ─── TEST ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    print("=== Testing Weather Service ===")
    ws = WeatherService()
    weather = ws.get_weather("Lucknow")
    print("Lucknow Weather: temp={}°C, humidity={}%, source={}".format(weather.temperature_mean, weather.humidity_mean, weather.source))

    print("\n=== Testing Satellite Service ===")
    sat = SatelliteService()
    sat_data = sat.get_satellite_data("Karnal")
    print("Karnal: NDVI={}, Soil={}".format(sat_data.ndvi_mean, sat_data.soil_moisture))

    print("\n=== Testing IDSP Service ===")
    idsp = IDSPService()
    reports = idsp.fetch_district_report("Lucknow")
    print("IDSP Reports: {} entries".format(len(reports)))
    if reports:
        print("  Sample: {} - {} cases".format(reports[0].disease, reports[0].cases))

    print("\n=== Testing Hazard Service ===")
    hazard = HazardDataService()
    risk = hazard.get_environmental_risk("Karnal")
    print("Karnal Environmental Risk: {}".format(risk))
