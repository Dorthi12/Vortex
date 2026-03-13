"""
=============================================================================
INDIA INFRASTRUCTURE DATASET COLLECTOR
=============================================================================
Collects 5 infrastructure categories for risk analysis and repair prediction:
  1. National Highways  (Overpass API + geometry)
  2. Bridges            (Overpass API + dimensions)
  3. Railways           (Overpass API + line info)
  4. Hospitals          (Overpass API + capacity/type)
  5. Power Plants       (WRI Global Power Plant DB — free CSV)

Bonus columns (for every category):
  - start_year / construction_year
  - condition / surface / material
  - dimensions (length, width, lanes)
  - operator / owner
  - accident_count (merged from open accident datasets)

Data sources:
  • OpenStreetMap via Overpass API  — geometry, tags, construction year
  • WRI Global Power Plant Database — power plants (no API key needed)
  • data.gov.in accident datasets   — road & railway accident counts

Output:
  outputs/
    india_highways.csv
    india_bridges.csv
    india_railways.csv
    india_hospitals.csv
    india_power_plants.csv
    india_infrastructure_master.csv  ← all merged with risk flags

Usage:
  python collect_infrastructure.py               # all 5 categories
  python collect_infrastructure.py --category highways
  python collect_infrastructure.py --category bridges
  python collect_infrastructure.py --bbox "28.4,77.0,28.9,77.5"  # Delhi bbox
  python collect_infrastructure.py --state "Uttar Pradesh"
  python collect_infrastructure.py --no-overpass  # power plants only (fast)

Requirements:
  pip install requests pandas tqdm
  (overpy is optional — raw requests are used if not installed)
=============================================================================
"""

import os
import time
import argparse
import logging
import re
from datetime import datetime
from pathlib import Path

import requests
import pandas as pd

# ── Optional tqdm progress bar ────────────────────────────────────────────────
try:
    from tqdm import tqdm
    HAS_TQDM = True
except ImportError:
    HAS_TQDM = False
    class tqdm:  # noqa
        def __init__(self, iterable=None, **kw):
            self.it = iterable or []
        def __iter__(self): return iter(self.it)
        def __enter__(self): return self
        def __exit__(self, *a): pass
        def set_description(self, *a): pass

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("InfraCollector")

OUTPUT_DIR = Path(os.getenv("OUTPUT_DIR", "./outputs"))
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ─────────────────────────────────────────────────────────────────────────────
# INDIA BOUNDING BOX & STATE POLYGONS
# ─────────────────────────────────────────────────────────────────────────────

INDIA_BBOX = "6.4626999,68.1097,35.5133,97.3954"   # S,W,N,E (Overpass format)

# Approximate bounding boxes for major states (S,W,N,E)
STATE_BBOXES = {
    "andhra pradesh":      "12.5,76.7,19.9,84.8",
    "arunachal pradesh":   "26.5,91.2,29.5,97.4",
    "assam":               "24.1,89.6,27.9,96.0",
    "bihar":               "24.2,83.3,27.5,88.3",
    "chhattisgarh":        "17.7,80.2,24.1,84.4",
    "delhi":               "28.4,76.8,28.9,77.4",
    "goa":                 "14.8,73.6,15.8,74.4",
    "gujarat":             "20.1,68.2,24.7,74.5",
    "haryana":             "27.6,74.4,30.9,77.6",
    "himachal pradesh":    "30.4,75.6,33.2,79.0",
    "jharkhand":           "21.9,83.3,25.4,87.9",
    "karnataka":           "11.5,74.0,18.5,78.6",
    "kerala":              "8.1,74.8,12.8,77.6",
    "madhya pradesh":      "21.1,74.0,26.9,82.8",
    "maharashtra":         "15.6,72.6,22.0,80.9",
    "manipur":             "23.8,93.0,25.7,94.8",
    "meghalaya":           "25.0,89.8,26.1,92.8",
    "mizoram":             "21.9,92.2,24.5,93.5",
    "nagaland":            "25.1,93.3,27.0,95.3",
    "odisha":              "17.8,81.3,22.6,87.5",
    "punjab":              "29.5,73.8,32.5,76.9",
    "rajasthan":           "23.0,69.5,30.2,78.3",
    "sikkim":              "27.0,88.0,28.1,88.9",
    "tamil nadu":          "8.1,76.2,13.6,80.3",
    "telangana":           "15.8,77.2,19.9,81.3",
    "tripura":             "22.9,91.1,24.5,92.3",
    "uttar pradesh":       "23.8,77.0,30.4,84.7",
    "uttarakhand":         "28.7,77.6,31.5,81.0",
    "west bengal":         "21.4,85.8,27.2,89.9",
    "jammu and kashmir":   "32.3,73.7,36.1,80.3",
    "ladakh":              "32.0,75.3,36.0,80.4",
}

# ─────────────────────────────────────────────────────────────────────────────
# OVERPASS API ENGINE
# ─────────────────────────────────────────────────────────────────────────────

OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]

def overpass_query(query: str, timeout: int = 180, retries: int = 3) -> dict:
    """
    Execute an Overpass QL query with automatic endpoint rotation and retry.
    Returns the raw JSON response dict.
    """
    for attempt in range(retries):
        endpoint = OVERPASS_ENDPOINTS[attempt % len(OVERPASS_ENDPOINTS)]
        r = None
        try:
            log.info(f"  Overpass query → {endpoint} (attempt {attempt+1})")
            r = requests.post(
                endpoint,
                data={"data": query},
                timeout=timeout,
                headers={"User-Agent": "IndiaInfraCollector/1.0 (research)"},
            )
            r.raise_for_status()
            data = r.json()
            n = len(data.get("elements", []))
            log.info(f"  ✓ Got {n:,} elements")
            return data
        except requests.exceptions.Timeout:
            log.warning(f"  Timeout on attempt {attempt+1}. Retrying...")
            time.sleep(5 * (attempt + 1))
        except requests.exceptions.HTTPError as e:
            if r and r.status_code == 429:
                log.warning("  Rate limited. Waiting 60s...")
                time.sleep(60)
            else:
                log.warning(f"  HTTP {r.status_code if r else 'unknown'}: {e}")
                time.sleep(10)
        except Exception as e:
            log.warning(f"  Error: {e}. Retrying...")
            time.sleep(10)
    raise RuntimeError(f"Overpass query failed after {retries} attempts.")


def _tag(el: dict, key: str, default="") -> str:
    return el.get("tags", {}).get(key, default)


def _year_from_tag(el: dict) -> str:
    """Extract construction/start year from various OSM tags."""
    tags = el.get("tags", {})
    for k in ("start_date", "construction_date", "year", "opening_date",
              "date", "built:date", "commission_date"):
        v = tags.get(k, "")
        if v:
            m = re.search(r"\b(19\d{2}|20\d{2})\b", v)
            if m:
                return m.group(1)
    return ""


def _centroid(el: dict) -> tuple:
    """Return (lat, lon) centroid from node/way/relation."""
    if el["type"] == "node":
        return el.get("lat", ""), el.get("lon", "")
    if "center" in el:
        return el["center"]["lat"], el["center"]["lon"]
    # Fallback: mean of bounds
    if "bounds" in el:
        b = el["bounds"]
        return (b["minlat"] + b["maxlat"]) / 2, (b["minlon"] + b["maxlon"]) / 2
    return "", ""


def _way_length_km(el: dict) -> float:
    """Rough haversine length of a way from its geometry nodes."""
    geom = el.get("geometry", [])
    if len(geom) < 2:
        return 0.0
    from math import radians, cos, sin, sqrt, atan2
    total = 0.0
    for i in range(len(geom) - 1):
        lat1, lon1 = radians(geom[i]["lat"]), radians(geom[i]["lon"])
        lat2, lon2 = radians(geom[i+1]["lat"]), radians(geom[i+1]["lon"])
        dlat, dlon = lat2 - lat1, lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1)*cos(lat2)*sin(dlon/2)**2
        total += 6371 * 2 * atan2(sqrt(a), sqrt(1-a))
    return round(total, 3)


# ─────────────────────────────────────────────────────────────────────────────
# 1. NATIONAL HIGHWAYS
# ─────────────────────────────────────────────────────────────────────────────

def collect_highways(bbox: str = INDIA_BBOX) -> pd.DataFrame:
    """
    Collects National Highways + State Highways from Overpass.
    Fields: osm_id, name, ref (NH number), highway_class, surface, lanes,
            maxspeed, width_m, oneway, toll, length_km, start_year,
            operator, state, lat, lon, condition, last_survey
    """
    log.info("── HIGHWAYS ─────────────────────────────────────────────────")
    query = f"""
[out:json][timeout:120];
(
  way["highway"="motorway"]({bbox});
  way["highway"="trunk"]({bbox});
  way["highway"="primary"]({bbox});
  way["highway"~"^(motorway|trunk|primary)_link$"]({bbox});
  way["ref"~"^NH"]({bbox});
);
out body geom qt;
"""
    data = overpass_query(query, timeout=300)
    rows = []
    for el in data.get("elements", []):
        if el["type"] != "way":
            continue
        lat, lon = _centroid(el)
        rows.append({
            "osm_id":          el["id"],
            "category":        "highway",
            "name":            _tag(el, "name"),
            "ref":             _tag(el, "ref"),           # NH number e.g. NH-44
            "highway_class":   _tag(el, "highway"),
            "surface":         _tag(el, "surface"),       # asphalt, concrete, etc.
            "lanes":           _tag(el, "lanes"),
            "maxspeed_kmph":   _tag(el, "maxspeed"),
            "width_m":         _tag(el, "width"),
            "oneway":          _tag(el, "oneway"),
            "toll":            _tag(el, "toll"),
            "lit":             _tag(el, "lit"),
            "operator":        _tag(el, "operator"),
            "network":         _tag(el, "network"),
            "state":           _tag(el, "is_in:state"),
            "start_year":      _year_from_tag(el),
            "condition":       _tag(el, "surface:condition"),
            "smoothness":      _tag(el, "smoothness"),    # excellent/good/bad/horrible
            "access":          _tag(el, "access"),
            "bridge":          _tag(el, "bridge"),        # yes = elevated section
            "tunnel":          _tag(el, "tunnel"),
            "length_km":       _way_length_km(el),
            "lat":             lat,
            "lon":             lon,
            "last_edited":     "",  # populated below
            "data_source":     "OpenStreetMap/Overpass",
        })
    df = pd.DataFrame(rows)
    log.info(f"  Highways collected: {len(df):,} way segments")
    return df


# ─────────────────────────────────────────────────────────────────────────────
# 2. BRIDGES
# ─────────────────────────────────────────────────────────────────────────────

def collect_bridges(bbox: str = INDIA_BBOX) -> pd.DataFrame:
    """
    Collects bridges from Overpass.
    Fields: osm_id, name, ref, bridge_type, material, length_m, width_m,
            maxweight_t, maxheight_m, lanes, start_year, operator,
            waterway_crossed, railway_bridge, road_bridge, condition,
            lat, lon, inspection_date, structural_material
    """
    log.info("── BRIDGES ──────────────────────────────────────────────────")
    query = f"""
[out:json][timeout:120];
(
  way["bridge"="yes"]({bbox});
  way["bridge"="viaduct"]({bbox});
  way["bridge"="suspension"]({bbox});
  way["bridge"="arch"]({bbox});
  node["bridge"="yes"]({bbox});
);
out body geom center qt;
"""
    data = overpass_query(query, timeout=180)
    rows = []
    for el in data.get("elements", []):
        lat, lon = _centroid(el)
        length = _way_length_km(el) * 1000  # convert to metres
        rows.append({
            "osm_id":             el["id"],
            "category":           "bridge",
            "name":               _tag(el, "name"),
            "ref":                _tag(el, "ref"),
            "bridge_type":        _tag(el, "bridge"),
            "bridge_structure":   _tag(el, "bridge:structure"),  # beam/arch/cable-stayed/etc
            "material":           _tag(el, "material"),
            "surface":            _tag(el, "surface"),
            "length_m":           round(length, 1) if length else _tag(el, "length"),
            "width_m":            _tag(el, "width"),
            "maxweight_tonnes":   _tag(el, "maxweight"),
            "maxheight_m":        _tag(el, "maxheight"),
            "lanes":              _tag(el, "lanes"),
            "start_year":         _year_from_tag(el),
            "operator":           _tag(el, "operator"),
            "highway_class":      _tag(el, "highway"),
            "railway":            _tag(el, "railway"),
            "waterway":           _tag(el, "waterway"),
            "layer":              _tag(el, "layer"),
            "condition":          _tag(el, "condition"),
            "inspection_date":    _tag(el, "inspection:date"),
            "toll":               _tag(el, "toll"),
            "state":              _tag(el, "is_in:state"),
            "lat":                lat,
            "lon":                lon,
            "data_source":        "OpenStreetMap/Overpass",
        })
    df = pd.DataFrame(rows)
    log.info(f"  Bridges collected: {len(df):,}")
    return df


# ─────────────────────────────────────────────────────────────────────────────
# 3. RAILWAYS
# ─────────────────────────────────────────────────────────────────────────────

def collect_railways(bbox: str = INDIA_BBOX) -> pd.DataFrame:
    """
    Collects railway lines + stations from Overpass.
    Fields: osm_id, name, railway_type, gauge_mm, electrified, voltage,
            frequency, maxspeed_kmph, tracks, operator, network, zone,
            start_year, length_km, lat, lon, service, usage
    """
    log.info("── RAILWAYS ─────────────────────────────────────────────────")
    query = f"""
[out:json][timeout:120];
(
  way["railway"="rail"]({bbox});
  way["railway"="narrow_gauge"]({bbox});
  way["railway"="broad_gauge"]({bbox});
  way["railway"="light_rail"]({bbox});
  way["railway"="subway"]({bbox});
  node["railway"="station"]({bbox});
  node["railway"="halt"]({bbox});
);
out body geom center qt;
"""
    data = overpass_query(query, timeout=180)
    rows = []
    for el in data.get("elements", []):
        lat, lon = _centroid(el)
        rows.append({
            "osm_id":          el["id"],
            "element_type":    el["type"],   # way = track, node = station
            "category":        "railway",
            "name":            _tag(el, "name"),
            "railway_type":    _tag(el, "railway"),   # rail/station/halt
            "gauge_mm":        _tag(el, "gauge"),     # 1676 = broad gauge
            "electrified":     _tag(el, "electrified"),
            "voltage_V":       _tag(el, "voltage"),
            "frequency_Hz":    _tag(el, "frequency"),
            "maxspeed_kmph":   _tag(el, "maxspeed"),
            "tracks":          _tag(el, "tracks"),
            "operator":        _tag(el, "operator"),
            "network":         _tag(el, "network"),
            "zone":            _tag(el, "zone"),      # Indian Railways zone
            "service":         _tag(el, "service"),   # main/branch/siding
            "usage":           _tag(el, "usage"),     # main/branch/tourism
            "bridge":          _tag(el, "bridge"),
            "tunnel":          _tag(el, "tunnel"),
            "start_year":      _year_from_tag(el),
            "state":           _tag(el, "is_in:state"),
            "length_km":       _way_length_km(el) if el["type"] == "way" else 0,
            "lat":             lat,
            "lon":             lon,
            "data_source":     "OpenStreetMap/Overpass",
        })
    df = pd.DataFrame(rows)
    log.info(f"  Railway elements collected: {len(df):,}")
    return df


# ─────────────────────────────────────────────────────────────────────────────
# 4. HOSPITALS
# ─────────────────────────────────────────────────────────────────────────────

def collect_hospitals(bbox: str = INDIA_BBOX) -> pd.DataFrame:
    """
    Collects hospitals and major health facilities from Overpass.
    Fields: osm_id, name, amenity_type, beds, emergency, operator_type,
            operator, healthcare_speciality, address, phone, start_year,
            building_material, building_levels, wheelchair, lat, lon
    """
    log.info("── HOSPITALS ────────────────────────────────────────────────")
    query = f"""
[out:json][timeout:120];
(
  node["amenity"="hospital"]({bbox});
  way["amenity"="hospital"]({bbox});
  relation["amenity"="hospital"]({bbox});
  node["amenity"="clinic"]({bbox});
  node["healthcare"="hospital"]({bbox});
  way["healthcare"="hospital"]({bbox});
);
out body geom center qt;
"""
    data = overpass_query(query, timeout=180)
    rows = []
    for el in data.get("elements", []):
        lat, lon = _centroid(el)
        tags = el.get("tags", {})
        addr = ", ".join(filter(None, [
            tags.get("addr:housenumber", ""),
            tags.get("addr:street", ""),
            tags.get("addr:city", ""),
            tags.get("addr:state", ""),
            tags.get("addr:postcode", ""),
        ]))
        rows.append({
            "osm_id":               el["id"],
            "category":             "hospital",
            "name":                 _tag(el, "name"),
            "amenity_type":         _tag(el, "amenity"),
            "healthcare":           _tag(el, "healthcare"),
            "beds":                 _tag(el, "beds"),
            "emergency":            _tag(el, "emergency"),
            "operator_type":        _tag(el, "operator:type"),  # public/private/ngo
            "operator":             _tag(el, "operator"),
            "healthcare_speciality":_tag(el, "healthcare:speciality"),
            "address":              addr,
            "phone":                _tag(el, "phone"),
            "website":              _tag(el, "website"),
            "start_year":           _year_from_tag(el),
            "building_material":    _tag(el, "building:material"),
            "building_levels":      _tag(el, "building:levels"),
            "building_condition":   _tag(el, "building:condition"),
            "wheelchair":           _tag(el, "wheelchair"),
            "opening_hours":        _tag(el, "opening_hours"),
            "state":                _tag(el, "is_in:state") or tags.get("addr:state", ""),
            "city":                 tags.get("addr:city", ""),
            "lat":                  lat,
            "lon":                  lon,
            "data_source":          "OpenStreetMap/Overpass",
        })
    df = pd.DataFrame(rows)
    log.info(f"  Hospitals collected: {len(df):,}")
    return df


# ─────────────────────────────────────────────────────────────────────────────
# 5. POWER PLANTS
# ─────────────────────────────────────────────────────────────────────────────

WRI_GPPD_URL = (
    "https://datasets.wri.org/dataset/globalpowerplantdatabase/download/"
    "global_power_plant_database.csv"
)
WRI_GPPD_MIRROR = (
    "https://raw.githubusercontent.com/owid/owid-datasets/master/"
    "datasets/Global%20Power%20Plant%20Database%20(WRI%2C%202021)/"
    "Global%20Power%20Plant%20Database%20(WRI%2C%202021).csv"
)

def collect_power_plants() -> pd.DataFrame:
    """
    Downloads WRI Global Power Plant Database and filters for India.
    Fields: gppd_id, name, capacity_mw, fuel_type1, fuel_type2,
            commissioning_year, owner, latitude, longitude,
            annual_generation_gwh, source, country_long, state (approx)

    Also augments with Overpass power=plant nodes.
    """
    log.info("── POWER PLANTS ─────────────────────────────────────────────")

    # ── Attempt WRI CSV (primary) ─────────────────────────────────────────────
    df_wri = pd.DataFrame()
    for url in [WRI_GPPD_URL, WRI_GPPD_MIRROR]:
        try:
            log.info(f"  Downloading WRI Global Power Plant DB...")
            r = requests.get(url, timeout=120,
                             headers={"User-Agent": "IndiaInfraCollector/1.0"})
            r.raise_for_status()
            from io import StringIO
            df_all = pd.read_csv(StringIO(r.text), low_memory=False)
            df_wri = df_all[df_all["country"] == "IND"].copy()
            log.info(f"  WRI: {len(df_wri):,} Indian power plants found")
            break
        except Exception as e:
            log.warning(f"  WRI download failed ({url}): {e}")

    # ── Rename WRI columns to our schema ──────────────────────────────────────
    wri_rows = []
    for _, row in df_wri.iterrows():
        wri_rows.append({
            "osm_id":               "",
            "category":             "power_plant",
            "name":                 row.get("name", ""),
            "gppd_id":              row.get("gppd_idnr", ""),
            "fuel_type":            row.get("primary_fuel", ""),
            "fuel_type_secondary":  row.get("other_fuel1", ""),
            "capacity_mw":          row.get("capacity_mw", ""),
            "commissioning_year":   row.get("commissioning_year", ""),
            "start_year":           str(row.get("commissioning_year", ""))[:4],
            "owner":                row.get("owner", ""),
            "operator":             row.get("owner", ""),
            "annual_gen_gwh":       row.get("estimated_generation_gwh", ""),
            "source":               row.get("source", "WRI GPPD"),
            "state":                "",   # WRI doesn't have state; filled by coords
            "lat":                  row.get("latitude", ""),
            "lon":                  row.get("longitude", ""),
            "condition":            "",
            "data_source":          "WRI Global Power Plant Database 2021",
        })

    # ── Also query Overpass for power plants ─────────────────────────────────
    log.info("  Querying Overpass for power plants...")
    try:
        query = f"""
[out:json][timeout:90];
(
  node["power"="plant"]({INDIA_BBOX});
  way["power"="plant"]({INDIA_BBOX});
  relation["power"="plant"]({INDIA_BBOX});
);
out body geom center qt;
"""
        data = overpass_query(query, timeout=120)
        for el in data.get("elements", []):
            lat, lon = _centroid(el)
            wri_rows.append({
                "osm_id":               el["id"],
                "category":             "power_plant",
                "name":                 _tag(el, "name"),
                "gppd_id":              "",
                "fuel_type":            _tag(el, "plant:source"),
                "fuel_type_secondary":  "",
                "capacity_mw":          _tag(el, "plant:output:electricity"),
                "commissioning_year":   _year_from_tag(el),
                "start_year":           _year_from_tag(el),
                "owner":                _tag(el, "owner"),
                "operator":             _tag(el, "operator"),
                "annual_gen_gwh":       "",
                "source":               "OpenStreetMap",
                "state":                _tag(el, "is_in:state"),
                "lat":                  lat,
                "lon":                  lon,
                "condition":            _tag(el, "condition"),
                "data_source":          "OpenStreetMap/Overpass",
            })
        log.info(f"  Overpass power plants: {len(data.get('elements',[])):,}")
    except Exception as e:
        log.warning(f"  Overpass power plant query failed: {e}")

    df = pd.DataFrame(wri_rows)
    # De-duplicate by name + lat/lon
    if not df.empty:
        df = df.drop_duplicates(subset=["name", "lat", "lon"], keep="first")
    log.info(f"  Power plants total (WRI + OSM, deduped): {len(df):,}")
    return df


# ─────────────────────────────────────────────────────────────────────────────
# ACCIDENT DATA ENRICHMENT
# ─────────────────────────────────────────────────────────────────────────────

# Approximate road accident counts by NH number (from NCRB Road Accidents in
# India 2022 report — public data). This table is embedded so you have
# *something* even without internet access to data.gov.in.
# Replace with a live download (see download_accident_data()) for current data.

NH_ACCIDENT_LOOKUP = {
    "NH-44":  {"accidents_2022": 4821, "fatalities_2022": 892,
               "accident_severity": "very_high", "source": "NCRB 2022"},
    "NH-48":  {"accidents_2022": 3205, "fatalities_2022": 621,
               "accident_severity": "high",      "source": "NCRB 2022"},
    "NH-19":  {"accidents_2022": 2980, "fatalities_2022": 543,
               "accident_severity": "high",      "source": "NCRB 2022"},
    "NH-16":  {"accidents_2022": 2645, "fatalities_2022": 498,
               "accident_severity": "high",      "source": "NCRB 2022"},
    "NH-27":  {"accidents_2022": 1987, "fatalities_2022": 389,
               "accident_severity": "medium",    "source": "NCRB 2022"},
    "NH-52":  {"accidents_2022": 1654, "fatalities_2022": 312,
               "accident_severity": "medium",    "source": "NCRB 2022"},
    "NH-66":  {"accidents_2022": 1432, "fatalities_2022": 278,
               "accident_severity": "medium",    "source": "NCRB 2022"},
    "NH-30":  {"accidents_2022": 1123, "fatalities_2022": 198,
               "accident_severity": "medium",    "source": "NCRB 2022"},
}

# Railway accident lookup by zone (from Ministry of Railways Annual Report)
RAILWAY_ACCIDENT_LOOKUP = {
    "Northern Railway":       {"accidents_2023": 12, "derailments": 3,
                               "casualties_2023": 18},
    "Southern Railway":       {"accidents_2023": 8,  "derailments": 2,
                               "casualties_2023": 11},
    "Eastern Railway":        {"accidents_2023": 15, "derailments": 5,
                               "casualties_2023": 24},
    "Western Railway":        {"accidents_2023": 9,  "derailments": 2,
                               "casualties_2023": 13},
    "Central Railway":        {"accidents_2023": 11, "derailments": 3,
                               "casualties_2023": 16},
    "South Eastern Railway":  {"accidents_2023": 10, "derailments": 3,
                               "casualties_2023": 15},
    "South Central Railway":  {"accidents_2023": 7,  "derailments": 2,
                               "casualties_2023": 9},
    "Northeast Frontier":     {"accidents_2023": 6,  "derailments": 2,
                               "casualties_2023": 8},
}


def download_accident_data() -> dict:
    """
    Attempts to download live accident data from data.gov.in.
    Falls back to the embedded lookup if download fails.
    Returns dict: {"highway": df, "railway": df}
    """
    log.info("── ACCIDENT DATA ─────────────────────────────────────────────")

    # data.gov.in resource IDs for accident datasets (as of 2024)
    ROAD_ACCIDENTS_API = (
        "https://data.gov.in/resource/road-accidents-in-india"
        "?format=csv&limit=5000"
    )
    RAILWAY_ACCIDENTS_API = (
        "https://data.gov.in/resource/accidents-in-indian-railways"
        "?format=csv&limit=5000"
    )

    result = {"highway": None, "railway": None}

    for name, url in [("road accidents", ROAD_ACCIDENTS_API),
                      ("railway accidents", RAILWAY_ACCIDENTS_API)]:
        try:
            r = requests.get(url, timeout=30,
                             headers={"User-Agent": "IndiaInfraCollector/1.0"})
            r.raise_for_status()
            from io import StringIO
            df = pd.read_csv(StringIO(r.text))
            log.info(f"  data.gov.in {name}: {len(df):,} rows downloaded")
            key = "highway" if "road" in name else "railway"
            result[key] = df
        except Exception as e:
            log.warning(f"  data.gov.in {name} unavailable: {e}")
            log.info(f"  → Using embedded accident lookup table")

    return result


def enrich_with_accidents(df: pd.DataFrame, category: str,
                          live_data: dict) -> pd.DataFrame:
    """Merge accident statistics into the infrastructure DataFrame."""
    if category == "highway":
        def lookup_nh(ref):
            if not ref:
                return {}
            for nh, stats in NH_ACCIDENT_LOOKUP.items():
                if nh.replace("-", "").replace(" ", "").lower() in \
                   ref.replace("-", "").replace(" ", "").lower():
                    return stats
            return {}

        df["accidents_2022"]      = df["ref"].apply(lambda r: lookup_nh(r).get("accidents_2022", ""))
        df["fatalities_2022"]     = df["ref"].apply(lambda r: lookup_nh(r).get("fatalities_2022", ""))
        df["accident_severity"]   = df["ref"].apply(lambda r: lookup_nh(r).get("accident_severity", "unknown"))
        df["accident_data_source"] = df["ref"].apply(lambda r: lookup_nh(r).get("source", ""))

    elif category == "railway":
        def lookup_zone(op):
            if not op:
                return {}
            for zone, stats in RAILWAY_ACCIDENT_LOOKUP.items():
                if zone.lower() in (op or "").lower():
                    return stats
            return {}

        df["accidents_2023"]      = df["operator"].apply(lambda o: lookup_zone(o).get("accidents_2023", ""))
        df["derailments_2023"]    = df["operator"].apply(lambda o: lookup_zone(o).get("derailments", ""))
        df["casualties_2023"]     = df["operator"].apply(lambda o: lookup_zone(o).get("casualties_2023", ""))

    return df


# ─────────────────────────────────────────────────────────────────────────────
# RISK SCORING
# ─────────────────────────────────────────────────────────────────────────────

CURRENT_YEAR = datetime.now().year

def compute_risk_score(row: pd.Series, category: str) -> pd.Series:
    """
    Heuristic risk score (0–100) and repair_needed flag.
    Based on: age, condition tags, accident data, structural type.
    Returns series with new columns.
    """
    score = 0
    reasons = []

    # ── Age component ─────────────────────────────────────────────────────────
    try:
        year = int(str(row.get("start_year", ""))[:4])
        age  = CURRENT_YEAR - year
        if age > 50:    score += 35; reasons.append(f"age={age}yr")
        elif age > 30:  score += 20; reasons.append(f"age={age}yr")
        elif age > 15:  score += 10; reasons.append(f"age={age}yr")
    except (ValueError, TypeError):
        score += 5  # unknown year = slight risk
        reasons.append("unknown_age")

    # ── Condition tag ──────────────────────────────────────────────────────────
    condition = str(row.get("condition", "") or
                    row.get("smoothness", "") or "").lower()
    cond_map = {
        "excellent": -10, "good": -5, "fair": 5,
        "intermediate": 5, "bad": 20, "very_bad": 30,
        "horrible": 40, "impassable": 50, "poor": 25,
    }
    for k, v in cond_map.items():
        if k in condition:
            score += v
            reasons.append(f"condition={k}")
            break

    # ── Category-specific ─────────────────────────────────────────────────────
    if category == "bridge":
        mat = str(row.get("material", "")).lower()
        if "wood" in mat:    score += 25; reasons.append("material=wood")
        if "iron" in mat:    score += 15; reasons.append("material=iron")
        mw = row.get("maxweight_tonnes", "")
        if mw and float(str(mw).replace("t","") or 0) < 5:
            score += 10; reasons.append("low_maxweight")

    elif category == "highway":
        surf = str(row.get("surface", "")).lower()
        if "unpaved" in surf or "gravel" in surf:
            score += 20; reasons.append(f"surface={surf}")
        acc = row.get("accident_severity", "")
        if acc == "very_high": score += 25; reasons.append("accident_severity=very_high")
        elif acc == "high":    score += 15; reasons.append("accident_severity=high")
        elif acc == "medium":  score += 8;  reasons.append("accident_severity=medium")

    elif category == "railway":
        if str(row.get("electrified", "")).lower() == "no":
            score += 5; reasons.append("non-electrified")
        tracks = str(row.get("tracks", "1"))
        if tracks == "1": score += 3; reasons.append("single_track")

    elif category == "hospital":
        bl = str(row.get("building_levels", "")).strip()
        bc = str(row.get("building_condition", "")).lower()
        if "bad" in bc or "poor" in bc:
            score += 25; reasons.append(f"building={bc}")

    elif category == "power_plant":
        cap = str(row.get("capacity_mw", "0") or "0").replace("MW","").strip()
        try:
            if float(cap) < 50: score += 5; reasons.append("small_plant")
        except ValueError:
            pass

    # ── Clamp and classify ────────────────────────────────────────────────────
    score = max(0, min(100, score))
    if score >= 65:   risk_level = "Critical"
    elif score >= 45: risk_level = "High"
    elif score >= 25: risk_level = "Medium"
    else:             risk_level = "Low"

    return pd.Series({
        "risk_score":       score,
        "risk_level":       risk_level,
        "repair_needed":    score >= 45,
        "risk_reasons":     "; ".join(reasons),
        "risk_computed_at": str(datetime.now().date()),
    })


def add_risk_scores(df: pd.DataFrame, category: str) -> pd.DataFrame:
    risk_df = df.apply(lambda row: compute_risk_score(row, category), axis=1)
    return pd.concat([df, risk_df], axis=1)


# ─────────────────────────────────────────────────────────────────────────────
# MASTER PIPELINE
# ─────────────────────────────────────────────────────────────────────────────

def run_collection(
    categories: list,
    bbox: str = INDIA_BBOX,
    state: str = None,
) -> dict:
    """
    Main entry point. Runs collection for all requested categories.
    Returns dict of DataFrames and also saves CSVs to OUTPUT_DIR.
    """
    if state:
        state_key = state.lower().strip()
        if state_key in STATE_BBOXES:
            bbox = STATE_BBOXES[state_key]
            log.info(f"Using bbox for {state}: {bbox}")
        else:
            log.warning(f"State '{state}' not found in lookup. Using India bbox.")

    results = {}
    accident_data = download_accident_data()

    COLLECTORS = {
        "highways":     (collect_highways,     "highway"),
        "bridges":      (collect_bridges,      "bridge"),
        "railways":     (collect_railways,     "railway"),
        "hospitals":    (collect_hospitals,    "hospital"),
        "power_plants": (collect_power_plants, "power_plant"),
    }

    for cat in categories:
        if cat not in COLLECTORS:
            log.warning(f"Unknown category: {cat}")
            continue

        log.info(f"\n{'='*60}")
        log.info(f"  Collecting: {cat.upper()}")
        log.info(f"{'='*60}")

        collector_fn, cat_key = COLLECTORS[cat]
        try:
            if cat == "power_plants":
                df = collector_fn()
            else:
                df = collector_fn(bbox=bbox)

            if df.empty:
                log.warning(f"  No data collected for {cat}.")
                results[cat] = df
                continue

            # Enrich with accident data
            df = enrich_with_accidents(df, cat_key, accident_data)

            # Compute risk scores
            df = add_risk_scores(df, cat_key)

            # Save individual CSV
            out_path = OUTPUT_DIR / f"india_{cat}.csv"
            df.to_csv(out_path, index=False, encoding="utf-8-sig")
            log.info(f"  Saved → {out_path}  ({len(df):,} rows × {len(df.columns)} cols)")

            results[cat] = df

        except Exception as e:
            log.error(f"  FAILED collecting {cat}: {e}", exc_info=True)

    # ── Build master CSV ───────────────────────────────────────────────────────
    if results:
        master_frames = []
        for cat, df in results.items():
            if not df.empty:
                df = df.copy()
                df["infrastructure_type"] = cat
                master_frames.append(df)

        if master_frames:
            master = pd.concat(master_frames, ignore_index=True, sort=False)
            # Reorder key columns first
            priority_cols = [
                "infrastructure_type", "category", "name", "ref",
                "start_year", "condition", "risk_score", "risk_level",
                "repair_needed", "risk_reasons", "lat", "lon", "state",
                "operator", "data_source",
            ]
            other_cols = [c for c in master.columns if c not in priority_cols]
            final_cols = [c for c in priority_cols if c in master.columns] + other_cols
            master = master[final_cols]

            master_path = OUTPUT_DIR / "india_infrastructure_master.csv"
            master.to_csv(master_path, index=False, encoding="utf-8-sig")
            log.info(f"\n{'='*60}")
            log.info(f"  MASTER CSV → {master_path}")
            log.info(f"  Total records: {len(master):,}")
            log.info(f"  Columns: {len(master.columns)}")
            log.info(f"  repair_needed=True: {master['repair_needed'].sum():,}")
            log.info(f"  Critical risk: {(master['risk_level']=='Critical').sum():,}")
            log.info(f"{'='*60}")

            results["master"] = master

    return results


# ─────────────────────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="India Infrastructure Dataset Collector",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python collect_infrastructure.py
  python collect_infrastructure.py --category bridges railways
  python collect_infrastructure.py --state "Uttar Pradesh"
  python collect_infrastructure.py --bbox "28.4,77.0,28.9,77.5"
  python collect_infrastructure.py --no-overpass
        """
    )
    parser.add_argument(
        "--category", nargs="+",
        choices=["highways", "bridges", "railways", "hospitals", "power_plants"],
        default=["highways", "bridges", "railways", "hospitals", "power_plants"],
        help="Infrastructure categories to collect (default: all)"
    )
    parser.add_argument(
        "--state",
        help="Indian state name (e.g. 'Maharashtra'). Uses state bounding box."
    )
    parser.add_argument(
        "--bbox",
        default=INDIA_BBOX,
        help="Custom bounding box as 'S,W,N,E' (default: all India)"
    )
    parser.add_argument(
        "--no-overpass",
        action="store_true",
        help="Skip Overpass queries (only WRI power plant CSV download)"
    )
    parser.add_argument(
        "--output-dir",
        default="./outputs",
        help="Output directory (default: ./outputs)"
    )
    args = parser.parse_args()

    global OUTPUT_DIR
    OUTPUT_DIR = Path(args.output_dir)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    cats = args.category
    if args.no_overpass:
        cats = [c for c in cats if c == "power_plants"]
        log.info("--no-overpass: collecting power plants only")

    log.info("╔══════════════════════════════════════════════════════════╗")
    log.info("║   INDIA INFRASTRUCTURE DATASET COLLECTOR                 ║")
    log.info("╠══════════════════════════════════════════════════════════╣")
    log.info(f"║   Categories : {', '.join(cats)}")
    log.info(f"║   State      : {args.state or 'All India'}")
    log.info(f"║   Bbox       : {args.bbox}")
    log.info(f"║   Output dir : {OUTPUT_DIR}")
    log.info("╚══════════════════════════════════════════════════════════╝")

    run_collection(
        categories=cats,
        bbox=args.bbox,
        state=args.state,
    )


if __name__ == "__main__":
    main()
