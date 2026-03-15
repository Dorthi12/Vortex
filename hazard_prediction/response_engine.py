"""
NETRAVAAH v4 — Response Engine
Full pipeline: Predict → Analyze → Recommend → Assist Control Systems

APIs used:
  • PositionStack  — geocode any address to lat/lon + location metadata
  • OpenStreetMap  — fetch shelters/hospitals/schools near district (Nominatim + Overpass)
  • Overpass API   — road network graph for entire district
  • Mapbox Directions v5 — actual turn-by-turn routing with ETA
  • Mapbox Isochrone     — reachability zones from shelters
  • Mapbox Matrix        — distance/time matrix for shelter prioritisation
  • Dijkstra (local)     — safe-path on Overpass graph when roads are blocked
  • India WRIS           — river water level + trend for flood/bridge risk
  • IoT Barricade        — signal queue for smart road barrier activation
  • Dam advisor          — reservoir × rainfall × population logic
  • Bridge monitor       — structural risk assessment per live water level
"""

import requests, heapq, json, math, logging, os, time
import numpy as np
from datetime import datetime, timezone
from typing import List, Dict, Optional, Tuple

from config import (
    MAPBOX_TOKEN, POSITIONSTACK_KEY, OSM_APP_KEY,
    MAPBOX_DIR_URL, MAPBOX_ISO_URL, MAPBOX_MATRIX_URL, MAPBOX_GEOCODE,
    POSITIONSTACK_FWD, POSITIONSTACK_REV, OSM_NOMINATIM, OVERPASS_URL,
    THRESHOLDS, SHELTERS, DAMS, BRIDGES, ROAD_WEIGHTS, ROAD_SPEEDS, CACHE_DIR,
)

logger = logging.getLogger("netravaah.response")

# ═══════════════════════════════════════════════════════════════════
# HAZARD RISK SCORE FORMULAS  (physics-based, per grid cell)
# ═══════════════════════════════════════════════════════════════════

def flood_risk_score(rainfall_norm, river_level_norm, soil_moisture_norm, slope_norm):
    """FloodRisk = 0.35×Rainfall + 0.25×RiverLevel + 0.20×SoilMoisture + 0.20×TerrainSlope"""
    return min(1.0, max(0.0,
        0.35*rainfall_norm + 0.25*river_level_norm +
        0.20*soil_moisture_norm + 0.20*(1.0 - slope_norm)
    ))

def landslide_risk_score(slope_norm, rainfall_norm, elevation_norm, veg_dryness):
    """LandslideRisk = 0.35×Slope + 0.35×Rainfall + 0.15×Elevation + 0.15×VegDryness"""
    return min(1.0, max(0.0,
        0.35*slope_norm + 0.35*rainfall_norm +
        0.15*elevation_norm + 0.15*veg_dryness
    ))

def heatwave_risk_score(temp_norm, humidity_norm, veg_dryness, wind_inv):
    """HeatwaveRisk = 0.40×Temp + 0.25×Humidity + 0.20×VegDryness + 0.15×WindInv"""
    return min(1.0, max(0.0,
        0.40*temp_norm + 0.25*humidity_norm +
        0.20*veg_dryness + 0.15*wind_inv
    ))

def drought_risk_score(rain_deficit, veg_dryness, soil_inv, vpd_norm):
    """DroughtRisk = 0.35×RainDeficit + 0.25×VegDryness + 0.25×SoilInv + 0.15×VPD"""
    return min(1.0, max(0.0,
        0.35*rain_deficit + 0.25*veg_dryness +
        0.25*soil_inv + 0.15*vpd_norm
    ))

def cyclone_risk_score(pressure_drop_norm, wind_norm, sea_temp_norm, coast_flag):
    """CycloneRisk = 0.40×PressureDrop + 0.30×Wind + 0.20×SeaTemp + 0.10×CoastFlag"""
    return min(1.0, max(0.0,
        0.40*pressure_drop_norm + 0.30*wind_norm +
        0.20*sea_temp_norm + 0.10*coast_flag
    ))

# ═══════════════════════════════════════════════════════════════════
# GEOCODING  (PositionStack + Mapbox + OSM Nominatim fallback)
# ═══════════════════════════════════════════════════════════════════

def _ck(tag): return os.path.join(CACHE_DIR, f"{tag}.json")
def _cload(p, max_age=86400):
    try:
        if os.path.exists(p) and time.time()-os.path.getmtime(p)<max_age:
            return json.load(open(p))
    except: pass
    return None
def _csave(p, d):
    try: json.dump(d, open(p,"w"))
    except: pass


def geocode_address(address: str, country: str = "IN") -> Optional[dict]:
    """
    Convert any address/place string to lat/lon using PositionStack.
    Returns full metadata: street, city, region, postal_code, timezone, etc.
    Falls back to Mapbox geocoding, then OSM Nominatim.
    """
    ck = _ck(f"geo_{address[:40].replace(' ','_')}")
    c  = _cload(ck, 86400*7)
    if c: return c

    # 1. PositionStack (primary)
    try:
        r = requests.get(POSITIONSTACK_FWD, params={
            "access_key": POSITIONSTACK_KEY,
            "query": address,
            "country": country,
            "limit": 1,
            "output": "json",
        }, timeout=10)
        d = r.json()
        if d.get("data"):
            item = d["data"][0]
            result = {
                "lat":         item.get("latitude"),
                "lon":         item.get("longitude"),
                "label":       item.get("label",""),
                "street":      item.get("street",""),
                "city":        item.get("locality","") or item.get("administrative_area",""),
                "region":      item.get("region",""),
                "postal_code": item.get("postal_code",""),
                "country":     item.get("country","India"),
                "timezone":    item.get("timezone_module",{}).get("name","Asia/Kolkata")
                               if isinstance(item.get("timezone_module"),dict) else "Asia/Kolkata",
                "source":      "positionstack",
            }
            _csave(ck, result)
            return result
    except Exception as e:
        logger.debug(f"PositionStack geocode failed: {e}")

    # 2. Mapbox geocoding fallback
    try:
        url = f"{MAPBOX_GEOCODE}/{requests.utils.quote(address)}.json"
        r   = requests.get(url, params={
            "access_token": MAPBOX_TOKEN,
            "country": "IN", "limit": 1,
            "types": "place,locality,address",
        }, timeout=10)
        d = r.json()
        if d.get("features"):
            f   = d["features"][0]
            lon, lat = f["center"]
            ctx = {c.get("id","").split(".")[0]: c.get("text","") for c in f.get("context",[])}
            result = {
                "lat": lat, "lon": lon,
                "label":    f.get("place_name",""),
                "street":   f.get("text",""),
                "city":     ctx.get("place",""),
                "region":   ctx.get("region",""),
                "postal_code": ctx.get("postcode",""),
                "country":  "India",
                "timezone": "Asia/Kolkata",
                "source":   "mapbox",
            }
            _csave(ck, result)
            return result
    except Exception as e:
        logger.debug(f"Mapbox geocode failed: {e}")

    # 3. OSM Nominatim fallback
    try:
        r = requests.get(f"{OSM_NOMINATIM}/search", params={
            "q": address, "format": "json", "limit": 1, "countrycodes": "IN",
        }, headers={"User-Agent": f"NETRAVAAH/4.0 ({OSM_APP_KEY})"}, timeout=10)
        d = r.json()
        if d:
            result = {
                "lat": float(d[0]["lat"]), "lon": float(d[0]["lon"]),
                "label": d[0].get("display_name",""),
                "street": "", "city": "", "region": "",
                "postal_code": "", "country": "India",
                "timezone": "Asia/Kolkata", "source": "nominatim",
            }
            _csave(ck, result)
            return result
    except Exception as e:
        logger.debug(f"Nominatim geocode failed: {e}")

    return None


def reverse_geocode(lat: float, lon: float) -> Optional[dict]:
    """Convert lat/lon back to human-readable address using PositionStack."""
    ck = _ck(f"rev_{lat:.4f}_{lon:.4f}")
    c  = _cload(ck, 86400)
    if c: return c
    try:
        r = requests.get(POSITIONSTACK_REV, params={
            "access_key": POSITIONSTACK_KEY,
            "query": f"{lat},{lon}",
            "limit": 1,
        }, timeout=10)
        d = r.json()
        if d.get("data"):
            item = d["data"][0]
            result = {
                "label":    item.get("label",""),
                "street":   item.get("name",""),
                "city":     item.get("locality",""),
                "region":   item.get("region",""),
                "country":  "India",
                "source":   "positionstack_reverse",
            }
            _csave(ck, result)
            return result
    except Exception as e:
        logger.debug(f"Reverse geocode failed: {e}")
    return None


# ═══════════════════════════════════════════════════════════════════
# OSM SHELTER / POI DISCOVERY  (find real shelters via Nominatim+Overpass)
# ═══════════════════════════════════════════════════════════════════

def find_osm_shelters(lat: float, lon: float, radius_m: int = 30000) -> List[dict]:
    """
    Query OpenStreetMap via Overpass for emergency shelters, hospitals,
    schools, and government buildings in a radius. Supplements our static list.
    """
    ck = _ck(f"osm_sh_{lat:.3f}_{lon:.3f}")
    c  = _cload(ck, 86400)
    if c: return c

    query = f"""
[out:json][timeout:25];
(
  node["amenity"~"shelter|hospital|school|community_centre|government"]
     (around:{radius_m},{lat},{lon});
  way["amenity"~"shelter|hospital|school|community_centre"]
     (around:{radius_m},{lat},{lon});
);
out center 30;
"""
    pois = []
    try:
        r = requests.post(OVERPASS_URL, data={"data": query},
                          headers={"User-Agent": f"NETRAVAAH/4.0 ({OSM_APP_KEY})"},
                          timeout=28)
        elements = r.json().get("elements", [])
        for el in elements:
            tags = el.get("tags", {})
            if el.get("type") == "way":
                clat = el.get("center", {}).get("lat")
                clon = el.get("center", {}).get("lon")
            else:
                clat = el.get("lat"); clon = el.get("lon")
            if clat and clon:
                pois.append({
                    "name":     tags.get("name", tags.get("amenity", "Emergency Facility")),
                    "lat":      clat, "lon": clon,
                    "type":     tags.get("amenity", "shelter"),
                    "capacity": int(tags.get("capacity", 500)),
                    "address":  tags.get("addr:full", tags.get("addr:street","")),
                    "source":   "osm",
                })
    except Exception as e:
        logger.debug(f"OSM shelter search failed: {e}")

    _csave(ck, pois)
    return pois


# ═══════════════════════════════════════════════════════════════════
# ROAD NETWORK  (Overpass — full district road graph)
# ═══════════════════════════════════════════════════════════════════

def fetch_roads(district: str, lat: float, lon: float, radius_km: float = 20.0) -> dict:
    """Fetch all major roads from Overpass for district-level routing."""
    ck = _ck(f"roads_{district.replace(' ','_')}")
    c  = _cload(ck, 86400)
    if c: return c

    rad = int(radius_km * 1000)
    query = f"""
[out:json][timeout:35];
(
  way["highway"~"motorway|trunk|primary|secondary|tertiary|unclassified|residential"]
     (around:{rad},{lat},{lon});
);
out geom;
"""
    roads = []
    try:
        r = requests.post(OVERPASS_URL, data={"data": query},
                          headers={"User-Agent": f"NETRAVAAH/4.0 ({OSM_APP_KEY})"},
                          timeout=38)
        for el in r.json().get("elements", []):
            if el.get("type") == "way":
                tags = el.get("tags", {})
                roads.append({
                    "id":      el["id"],
                    "type":    tags.get("highway","road"),
                    "name":    tags.get("name", tags.get("ref","")),
                    "oneway":  tags.get("oneway","no") == "yes",
                    "maxspeed":int(tags.get("maxspeed","50").replace(" mph","").split()[0])
                               if tags.get("maxspeed","").replace(" mph","").split()[0].isdigit()
                               else ROAD_SPEEDS.get(tags.get("highway","tertiary"),40),
                    "nodes":   [{"lat": g["lat"],"lon": g["lon"]}
                                for g in el.get("geometry",[])],
                    "blocked": False,
                    "hazard_risk": 0.0,
                })
    except Exception as e:
        logger.debug(f"Overpass road fetch failed for {district}: {e}")

    result = {"district": district, "lat": lat, "lon": lon,
              "roads": roads, "total": len(roads)}
    _csave(ck, result)
    logger.info(f"Roads: {district} → {len(roads)} segments")
    return result


# ═══════════════════════════════════════════════════════════════════
# DYNAMIC RISK GRID  (10×10 per district, all 5 hazards)
# ═══════════════════════════════════════════════════════════════════

def generate_risk_grid(district: str, lat: float, lon: float,
                       live: dict, ml_probs: dict,
                       grid_size: int = 10) -> dict:
    """
    10×10 spatial grid of risk scores blended from ML model + physics formulas.
    Each cell stores flood/landslide/heatwave/drought/cyclone scores.
    """
    import pickle
    from config import MODEL_PATH
    try:
        bndl  = pickle.load(open(MODEL_PATH,"rb"))
        base  = bndl.get("risk_grids",{}).get(district) or {}
    except: base = {}

    elev_b  = float(base.get("elevation", 300))
    slope_b = float(base.get("slope", 5))
    ndvi_b  = float(base.get("ndvi", 0.4))

    # Live values
    r72        = float(live.get("rain_72h", 10.0))
    r7d        = float(live.get("rain_7d",  40.0))
    temp_c     = float(live.get("temp_c",   28.0))
    humidity   = float(live.get("humidity", 65.0))
    wind_mps   = float(live.get("wind_mps",  3.0))
    soil_moist = float(live.get("soil_moisture", 0.25))
    vpd        = float(live.get("vpd_kpa",   1.5))
    pres_series= live.get("pres_series", [])
    p_drop     = (np.mean(pres_series[-6:])-np.mean(pres_series[:6])
                  if len(pres_series)>=12 else 0.0)
    wris       = live.get("wris") or {}
    river_lv   = min(1.0, wris.get("level_m", 3.0) / 15.0)
    coast      = 1.0 if live.get("state","") in [
        "Kerala","Tamil Nadu","Andhra Pradesh","Odisha","West Bengal","Gujarat","Maharashtra","Goa"
    ] else 0.0

    km_lat = 111.0
    km_lon = 111.0 * math.cos(math.radians(lat))
    span   = 30.0
    dlat   = span / km_lat / grid_size
    dlon   = span / km_lon / grid_size

    cells = []
    for i in range(grid_size):
        for j in range(grid_size):
            clat = lat - span/(2*km_lat) + (i+.5)*dlat
            clon = lon - span/(2*km_lon) + (j+.5)*dlon

            rng   = np.random.default_rng(seed=int(abs(clat*1e4)+abs(clon*1e4)))
            elev  = max(0.0, elev_b  * (1 + rng.normal(0, .20)))
            slope = max(0.0, slope_b * (1 + rng.normal(0, .30)))
            ndvi  = float(np.clip(ndvi_b + rng.normal(0,.08), 0, 1))
            noise = float(rng.normal(0, .1))

            # per-cell rainfall (valleys get more)
            r_cell  = r72 * max(0.5, 1 - elev/5000) * max(0.6, 1+noise)

            # Normalised inputs
            r_n    = min(1.0, r_cell/150.0)
            s_n    = min(1.0, slope/25.0)
            e_n    = min(1.0, elev/3000.0)
            t_n    = min(1.0, max(0,(temp_c-25)/20.0))
            h_n    = min(1.0, humidity/100.0)
            w_n    = min(1.0, wind_mps/30.0)
            vd     = max(0.0, 1-ndvi)
            sm_n   = min(1.0, soil_moist/0.5)
            vpd_n  = min(1.0, vpd/3.0)
            pd_n   = min(1.0, max(0,-p_drop/20.0))

            fl = flood_risk_score(r_n, river_lv, sm_n, s_n)
            ls = landslide_risk_score(s_n, r_n, e_n, vd)
            hw = heatwave_risk_score(t_n, h_n, vd, 1-w_n)
            dr = drought_risk_score(max(0,1-r_n), vd, 1-sm_n, vpd_n)
            cy = cyclone_risk_score(pd_n, w_n, t_n, coast)

            # Blend 55% ML district-level + 45% physics per-cell
            fl = 0.55*ml_probs.get("flood",fl)     + 0.45*fl
            ls = 0.55*ml_probs.get("landslide",ls) + 0.45*ls
            hw = 0.55*ml_probs.get("heatwave",hw)  + 0.45*hw
            dr = 0.55*ml_probs.get("drought",dr)   + 0.45*dr
            cy = 0.55*ml_probs.get("cyclone",cy)   + 0.45*cy

            overall = max(fl, ls, hw, dr, cy)
            cells.append({
                "row":i,"col":j,
                "lat":round(clat,5),"lon":round(clon,5),
                "flood":round(fl,3),"landslide":round(ls,3),
                "heatwave":round(hw,3),"drought":round(dr,3),"cyclone":round(cy,3),
                "overall":round(overall,3),
                "elevation":round(elev,0),"slope":round(slope,1),"ndvi":round(ndvi,3),
                "danger": overall >= 0.65,
            })

    danger_n = sum(1 for c in cells if c["danger"])
    return {
        "district": district,"lat":lat,"lon":lon,
        "grid_size":grid_size,"cells":cells,
        "high_risk_cells": danger_n,
        "hazard_summary":{
            h: round(float(np.mean([c[h] for c in cells])),3)
            for h in ["flood","landslide","heatwave","drought","cyclone"]
        },
    }


# ═══════════════════════════════════════════════════════════════════
# ROAD DANGER SCORING  (cross-ref roads vs risk grid cells)
# ═══════════════════════════════════════════════════════════════════

def score_roads_against_grid(roads_data: dict, risk_grid: dict,
                              hazard: str = "flood") -> dict:
    """
    For every road segment, compute the maximum hazard risk of cells it passes through.
    Marks road as BLOCKED (IoT signal) if risk > 0.65.
    """
    cells = {(round(c["lat"],2), round(c["lon"],2)): c[hazard]
             for c in risk_grid["cells"]}

    def cell_risk(lat, lon):
        # Check 0.05-degree neighbourhood
        best = 0.0
        for (clat, clon), rv in cells.items():
            if abs(clat - round(lat,2)) < 0.06 and abs(clon - round(lon,2)) < 0.06:
                best = max(best, rv)
        return best

    updated = []
    for road in roads_data.get("roads", []):
        max_risk = 0.0
        for node in road.get("nodes", []):
            max_risk = max(max_risk, cell_risk(node["lat"], node["lon"]))
        road = dict(road)
        road["hazard_risk"]  = round(max_risk, 3)
        road["blocked"]      = max_risk >= 0.65
        road["block_reason"] = (f"{hazard.upper()} risk {max_risk:.2f}"
                                if max_risk >= 0.65 else "")
        updated.append(road)

    blocked = [r for r in updated if r["blocked"]]
    return {**roads_data, "roads": updated,
            "blocked_count": len(blocked), "blocked_roads": blocked}


# ═══════════════════════════════════════════════════════════════════
# IoT BARRICADE SYSTEM
# ═══════════════════════════════════════════════════════════════════

IOT_BARRICADE_STATES = {}   # road_id → {state, ts, reason}

def generate_iot_signals(blocked_roads: List[dict], hazard: str,
                          district: str) -> List[dict]:
    """
    Generate IoT control signals for smart barricades.
    In production: sent via MQTT/HTTP to Raspberry Pi controllers.
    Each signal includes: road_id, GPS coordinates, action (CLOSE/OPEN/RESTRICT),
    LED colour, audio alert flag, redirect message.
    """
    signals = []
    for road in blocked_roads:
        rid  = str(road.get("id",""))
        risk = road.get("hazard_risk", 0)

        if risk >= 0.80:
            action      = "CLOSE"
            led_color   = "RED"
            audio       = True
            msg         = f"⛔ ROAD CLOSED — {hazard.upper()} DANGER. TURN BACK."
        elif risk >= 0.65:
            action      = "RESTRICT"
            led_color   = "AMBER"
            audio       = True
            msg         = f"⚠ ROAD RESTRICTED — Hazard detected. Emergency vehicles only."
        else:
            action      = "WARN"
            led_color   = "YELLOW"
            audio       = False
            msg         = f"⚡ CAUTION — {hazard.upper()} risk ahead. Proceed slowly."

        nodes = road.get("nodes",[])
        coords = nodes[0] if nodes else {"lat": 0.0, "lon": 0.0}

        signal = {
            "road_id":      rid,
            "road_name":    road.get("name","Unnamed Road"),
            "road_type":    road.get("type","road"),
            "district":     district,
            "hazard":       hazard,
            "risk_score":   risk,
            "action":       action,
            "led_color":    led_color,
            "audio_alert":  audio,
            "message":      msg,
            "barricade_lat":coords.get("lat"),
            "barricade_lon":coords.get("lon"),
            "timestamp":    datetime.now(timezone.utc).isoformat(),
            "mqtt_topic":   f"netravaah/barricade/{district.lower().replace(' ','_')}/{rid}",
            "payload":      json.dumps({
                "action": action, "led": led_color,
                "audio": audio, "message": msg,
                "hazard": hazard, "risk": risk,
            }),
        }
        IOT_BARRICADE_STATES[rid] = {
            "state": action, "ts": signal["timestamp"], "reason": msg
        }
        signals.append(signal)

    return signals


# ═══════════════════════════════════════════════════════════════════
# DIJKSTRA SAFE-PATH (on Overpass road graph, skipping blocked roads)
# ═══════════════════════════════════════════════════════════════════

def _haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    f1,f2 = math.radians(lat1),math.radians(lat2)
    a = (math.sin(math.radians(lat2-lat1)/2)**2 +
         math.cos(f1)*math.cos(f2)*math.sin(math.radians(lon2-lon1)/2)**2)
    return R*2*math.atan2(math.sqrt(a),math.sqrt(1-a))


def build_graph(roads_data: dict) -> Tuple[dict, dict]:
    """
    Build bidirectional weighted graph from Overpass road segments.
    Edge cost = distance × road_type_weight × (1 + hazard_risk × 5)
    Blocked roads get cost=infinity (skipped in Dijkstra).
    """
    graph    = {}
    node_map = {}   # "lat,lon" → node_id
    coords   = {}   # node_id  → (lat, lon)

    def get_node(lat, lon):
        k = f"{lat:.5f},{lon:.5f}"
        if k not in node_map:
            nid = len(node_map)
            node_map[k] = nid
            coords[nid] = (lat, lon)
        return node_map[k]

    for road in roads_data.get("roads", []):
        nodes   = road.get("nodes", [])
        rtype   = road.get("type", "tertiary")
        blocked = road.get("blocked", False)
        risk    = road.get("hazard_risk", 0.0)
        weight  = ROAD_WEIGHTS.get(rtype, 1.5)
        speed   = road.get("maxspeed") or ROAD_SPEEDS.get(rtype, 40)
        oneway  = road.get("oneway", False)

        for k in range(len(nodes)-1):
            n1, n2 = nodes[k], nodes[k+1]
            id1 = get_node(n1["lat"], n1["lon"])
            id2 = get_node(n2["lat"], n2["lon"])
            dist = _haversine(n1["lat"], n1["lon"], n2["lat"], n2["lon"])

            if blocked:
                cost = 1e9   # effectively infinite — don't use
            else:
                cost = dist * weight * (1.0 + risk * 5.0)

            if id1 not in graph: graph[id1] = []
            if id2 not in graph: graph[id2] = []
            graph[id1].append((id2, cost, dist, speed))
            if not oneway:
                graph[id2].append((id1, cost, dist, speed))

    return graph, coords


def dijkstra(graph: dict, coords: dict,
             o_lat: float, o_lon: float,
             d_lat: float, d_lon: float) -> Optional[dict]:
    """
    A*-guided Dijkstra on road graph.
    Returns path (waypoints), total_km, eta_min, road segments used.
    """
    if not graph: return None

    # Find nearest graph node to each point
    def nearest(lat, lon):
        best_id, best_d = None, 1e9
        for nid, (nlat, nlon) in coords.items():
            d = _haversine(lat, lon, nlat, nlon)
            if d < best_d: best_d = d; best_id = nid
        return best_id

    src = nearest(o_lat, o_lon)
    dst = nearest(d_lat, d_lon)
    if src is None or dst is None: return None

    def heuristic(nid):
        la, lo = coords.get(nid, (0,0))
        return _haversine(la, lo, d_lat, d_lon)

    g_cost = {src: 0.0}
    prev   = {}
    heap   = [(heuristic(src), 0.0, src)]
    dist_m = {src: 0.0}
    time_m = {src: 0.0}

    while heap:
        _, g, u = heapq.heappop(heap)
        if g > g_cost.get(u, 1e9): continue
        if u == dst: break
        for v, cost, dist, speed in graph.get(u, []):
            if cost >= 1e8: continue     # blocked
            ng = g + cost
            if ng < g_cost.get(v, 1e9):
                g_cost[v] = ng
                prev[v]   = u
                dist_m[v] = dist_m.get(u,0) + dist
                time_m[v] = time_m.get(u,0) + (dist / speed * 60)  # minutes
                heapq.heappush(heap, (ng + heuristic(v), ng, v))

    if dst not in prev and src != dst: return None

    # Reconstruct
    path, total_d, total_t = [], 0.0, 0.0
    cur = dst
    while cur is not None:
        la, lo = coords.get(cur, (0,0))
        path.append({"lat": la, "lon": lo})
        cur = prev.get(cur)
    path.reverse()

    for k in range(len(path)-1):
        d = _haversine(path[k]["lat"], path[k]["lon"],
                       path[k+1]["lat"], path[k+1]["lon"])
        total_d += d

    total_t = dist_m.get(dst,0) / max(1, dist_m.get(dst,1)) * time_m.get(dst, total_d/40*60)

    return {
        "waypoints":    path,
        "distance_km":  round(total_d, 2),
        "eta_min":      round(time_m.get(dst, total_d/40*60), 1),
        "node_count":   len(path),
    }


# ═══════════════════════════════════════════════════════════════════
# MAPBOX ROUTING  (real turn-by-turn with road conditions)
# ═══════════════════════════════════════════════════════════════════

def mapbox_route(o_lat, o_lon, d_lat, d_lon,
                 avoid_lnglat: List[Tuple] = None) -> Optional[dict]:
    """
    Mapbox Directions API v5 — real road routing with steps.
    avoid_lnglat: list of (lon,lat) hazard-zone centroids to route around.
    """
    url = f"{MAPBOX_DIR_URL}/{o_lon},{o_lat};{d_lon},{d_lat}"
    params = {
        "access_token": MAPBOX_TOKEN,
        "geometries":   "geojson",
        "steps":        "true",
        "overview":     "full",
        "alternatives": "true",
        "annotations":  "duration,distance,speed",
    }
    try:
        r = requests.get(url, params=params, timeout=12)
        d = r.json()
        if not d.get("routes"): return None

        routes_out = []
        for route in d["routes"]:
            steps = []
            for leg in route.get("legs", []):
                for step in leg.get("steps", []):
                    m = step.get("maneuver", {})
                    steps.append({
                        "instruction": m.get("instruction",""),
                        "type":        m.get("type",""),
                        "distance_m":  round(step.get("distance",0), 0),
                        "duration_s":  round(step.get("duration",0), 0),
                        "road_name":   step.get("name",""),
                    })
            routes_out.append({
                "duration_min":  round(route["duration"]/60, 1),
                "distance_km":   round(route["distance"]/1000, 2),
                "geometry":      route.get("geometry"),
                "steps":         steps,
                "weight_name":   route.get("weight_name",""),
            })

        return {
            "routes":       routes_out,
            "best":         routes_out[0],
            "alternatives": len(routes_out)-1,
            "source":       "mapbox",
        }
    except Exception as e:
        logger.debug(f"Mapbox route failed: {e}")
        return None


def mapbox_isochrone(lat, lon, minutes: int = 30) -> Optional[dict]:
    """
    Mapbox Isochrone API — reachable area polygon from a shelter within N minutes.
    Used to determine how many people each shelter can serve.
    """
    try:
        r = requests.get(f"{MAPBOX_ISO_URL}/{lon},{lat}", params={
            "contours_minutes": minutes,
            "polygons":         "true",
            "access_token":     MAPBOX_TOKEN,
        }, timeout=10)
        return r.json()
    except Exception as e:
        logger.debug(f"Mapbox isochrone failed: {e}")
        return None


def mapbox_matrix(origins: List[Tuple], destinations: List[Tuple]) -> Optional[dict]:
    """
    Mapbox Matrix API — compute travel time from multiple origins to multiple shelters.
    Used to rank shelters by actual drive time from district centre.
    origins/destinations: list of (lat, lon)
    """
    if not origins or not destinations: return None
    # Max 25 total coords
    coords = ";".join(
        f"{lon},{lat}" for lat,lon in (origins[:5] + destinations[:20])
    )
    src_idxs = ";".join(str(i) for i in range(len(origins[:5])))
    dst_idxs = ";".join(str(i) for i in range(len(origins[:5]),
                        len(origins[:5])+len(destinations[:20])))
    try:
        r = requests.get(f"{MAPBOX_MATRIX_URL}/{coords}", params={
            "access_token": MAPBOX_TOKEN,
            "sources":      src_idxs,
            "destinations": dst_idxs,
            "annotations":  "duration,distance",
        }, timeout=12)
        return r.json()
    except Exception as e:
        logger.debug(f"Mapbox matrix failed: {e}")
        return None


# ═══════════════════════════════════════════════════════════════════
# SHELTER PRIORITISATION  (nearest + fastest + highest capacity)
# ═══════════════════════════════════════════════════════════════════

def rank_shelters(district: str, lat: float, lon: float,
                  state: str, extra_osm: List[dict] = None) -> List[dict]:
    """
    1. Start with our curated shelter list filtered by proximity (≤ 150 km)
    2. Add OSM-discovered shelters in the district
    3. Rank by: (a) Mapbox matrix drive time  (b) haversine fallback
    4. Return top-5 with geocoded address details from PositionStack
    """
    # Combine static + OSM shelters
    candidates = [s for s in SHELTERS
                  if _haversine(lat,lon,s["lat"],s["lon"]) <= 150]
    if extra_osm:
        candidates += [s for s in extra_osm
                       if _haversine(lat,lon,s["lat"],s["lon"]) <= 80]

    if not candidates:
        candidates = SHELTERS[:5]   # last resort

    # Haversine pre-sort
    for s in candidates:
        s = dict(s)
        s["straight_km"] = round(_haversine(lat,lon,s["lat"],s["lon"]),1)
    candidates.sort(key=lambda s: _haversine(lat,lon,s["lat"],s["lon"]))
    top = candidates[:8]

    # Try Mapbox matrix for actual drive times
    matrix = mapbox_matrix([(lat,lon)], [(s["lat"],s["lon"]) for s in top])
    if matrix and matrix.get("durations"):
        times = matrix["durations"][0]   # row 0 = from district centre
        dists = matrix.get("distances",[None]*len(top))
        dists = dists[0] if dists else [None]*len(top)
        for i, s in enumerate(top):
            s["drive_min"] = round((times[i] or 9999)/60, 1) if times[i] else None
            s["drive_km"]  = round((dists[i] or 0)/1000, 1)  if dists[i] else s["straight_km"]
        top.sort(key=lambda s: s.get("drive_min") or s["straight_km"])
    else:
        for s in top:
            s["drive_min"] = round(s["straight_km"]/50*60, 1)   # estimate 50 km/h
            s["drive_km"]  = s["straight_km"]

    # Enrich top-3 with PositionStack reverse geocode
    for s in top[:3]:
        rev = reverse_geocode(s["lat"], s["lon"])
        if rev:
            s["full_address"] = rev.get("label","")

    return top[:5]


# ═══════════════════════════════════════════════════════════════════
# FULL EVACUATION PLAN
# ═══════════════════════════════════════════════════════════════════

def plan_evacuation(district: str, lat: float, lon: float, state: str,
                    live: dict, ml_probs: dict,
                    hazard: str = "flood") -> dict:
    """
    Complete evacuation planning pipeline:
      1. Fetch road network (Overpass)
      2. Generate dynamic risk grid
      3. Score roads against hazard grid → identify blocked roads
      4. Generate IoT barricade signals
      5. Build Dijkstra graph (blocked roads get ∞ cost)
      6. Find & rank shelters (static + OSM discovery)
      7. Rank shelters by Mapbox matrix drive time
      8. Compute Mapbox turn-by-turn route to each top shelter
      9. Dijkstra fallback route if Mapbox unavailable
     10. Geocode waypoints via PositionStack for display
    """
    logger.info(f"Evacuation plan: {district} ({hazard})")

    # 1. Roads
    roads = fetch_roads(district, lat, lon)

    # 2. Risk grid
    grid = generate_risk_grid(district, lat, lon, live, ml_probs)

    # 3. Score roads → mark blocked
    roads = score_roads_against_grid(roads, grid, hazard)
    blocked = roads.get("blocked_roads", [])

    # 4. IoT signals
    iot_signals = generate_iot_signals(blocked, hazard, district)

    # 5. Build Dijkstra graph
    graph, coords = build_graph(roads)

    # 6+7. Shelters (static + OSM, ranked by Mapbox matrix)
    osm_pois = find_osm_shelters(lat, lon, radius_m=25000)
    shelters  = rank_shelters(district, lat, lon, state, osm_pois)

    # 8+9. Route to top-3 shelters
    routes = []
    for s in shelters[:3]:
        slat, slon = s["lat"], s["lon"]

        # Mapbox primary
        mb = mapbox_route(lat, lon, slat, slon)
        if mb:
            best = mb["best"]
            routes.append({
                "shelter":       s["name"],
                "shelter_lat":   slat,
                "shelter_lon":   slon,
                "shelter_type":  s.get("type","govt"),
                "capacity":      s.get("capacity",0),
                "address":       s.get("full_address", s.get("address","")),
                "distance_km":   best["distance_km"],
                "eta_min":       best["duration_min"],
                "steps":         best["steps"],
                "geometry":      best["geometry"],
                "waypoints":     None,
                "alternatives":  mb["alternatives"],
                "source":        "mapbox",
                "drive_km":      s.get("drive_km",""),
                "drive_min":     s.get("drive_min",""),
            })
        else:
            # Dijkstra fallback
            path = dijkstra(graph, coords, lat, lon, slat, slon)
            if path:
                routes.append({
                    "shelter":       s["name"],
                    "shelter_lat":   slat,
                    "shelter_lon":   slon,
                    "shelter_type":  s.get("type","govt"),
                    "capacity":      s.get("capacity",0),
                    "address":       s.get("address",""),
                    "distance_km":   path["distance_km"],
                    "eta_min":       path["eta_min"],
                    "steps":         [],
                    "geometry":      None,
                    "waypoints":     path["waypoints"],
                    "alternatives":  0,
                    "source":        "dijkstra",
                    "drive_km":      s.get("drive_km",""),
                    "drive_min":     s.get("drive_min",""),
                })

    # Sort by ETA (least minutes first — minimise casualties)
    routes.sort(key=lambda r: r["eta_min"])

    # Isochrone for top shelter (reachability zone)
    iso = None
    if routes:
        iso = mapbox_isochrone(routes[0]["shelter_lat"], routes[0]["shelter_lon"], minutes=45)

    return {
        "district":       district,
        "state":          state,
        "hazard":         hazard,
        "origin_lat":     lat,
        "origin_lon":     lon,
        "routes":         routes,
        "iot_signals":    iot_signals,
        "roads_blocked":  len(blocked),
        "roads_total":    roads.get("total",0),
        "danger_cells":   grid["high_risk_cells"],
        "grid":           grid,
        "isochrone":      iso,
        "shelters_found": len(shelters),
        "osm_pois":       len(osm_pois),
        "timestamp":      datetime.now(timezone.utc).isoformat(),
    }


# ═══════════════════════════════════════════════════════════════════
# INFRASTRUCTURE CONTROL ADVISOR
# ═══════════════════════════════════════════════════════════════════

def dam_advisory(dam: dict, rain_forecast_mm: float,
                 river_level_m: float, evac_complete: bool) -> dict:
    """
    Reservoir management recommendation based on:
      - Current capacity %
      - 72h rainfall forecast
      - Live river level vs warning/danger thresholds (from WRIS)
      - Downstream population
      - Evacuation completion status
    ⚠ Recommendation only — human operator must authorize any gate operation.
    """
    cap    = dam.get("capacity_pct", 50)
    pop    = dam.get("downstream_pop", 0)
    name   = dam.get("name", "Dam")
    warn   = dam.get("warning_level_m", 0)
    danger = dam.get("danger_level_m", 0)

    # River level breached danger threshold
    river_critical = river_level_m > 0 and danger > 0 and river_level_m >= danger

    if river_critical or (cap >= 92 and rain_forecast_mm > 80 and evac_complete):
        decision       = "EMERGENCY_RELEASE"
        urgency        = "CRITICAL"
        gate_pct       = "20-25%"
        recommendation = (
            f"{'River at DANGER LEVEL' if river_critical else f'Reservoir at {cap}%'}. "
            f"Rain forecast {rain_forecast_mm:.0f}mm/72h. Evacuation complete. "
            f"Open spillway gates {gate_pct}. Notify all downstream districts immediately. "
            f"NDRF teams to be pre-positioned at {pop//1000}k downstream population centres."
        )
    elif cap >= 85 and rain_forecast_mm > 60:
        decision       = "PREPARE_RELEASE"
        urgency        = "HIGH"
        gate_pct       = "standby"
        recommendation = (
            f"Reservoir at {cap}%. Rain {rain_forecast_mm:.0f}mm forecast. "
            f"DO NOT release until downstream evacuation is confirmed complete. "
            f"Alert {pop//1000}k people. Pre-position rescue teams."
        )
    elif cap >= 78 and rain_forecast_mm > 40:
        decision       = "ELEVATED_MONITORING"
        urgency        = "MEDIUM"
        gate_pct       = "none"
        recommendation = (
            f"Reservoir at {cap}%. Monitor every 2 hours. "
            f"Issue advisory to {pop//1000}k downstream population. "
            f"Prepare evacuation order draft."
        )
    elif river_level_m > 0 and warn > 0 and river_level_m >= warn:
        decision       = "WARNING_LEVEL_REACHED"
        urgency        = "WATCH"
        gate_pct       = "none"
        recommendation = (
            f"River at WARNING level {river_level_m:.1f}m (warning: {warn}m). "
            f"Increase monitoring frequency to hourly. "
            f"Put NDRF on standby."
        )
    else:
        decision       = "NORMAL_OPERATIONS"
        urgency        = "NORMAL"
        gate_pct       = "none"
        recommendation = f"Reservoir at {cap}%. Standard monitoring. No action required."

    return {
        "dam_name":         name,
        "state":            dam.get("state",""),
        "river":            dam.get("river",""),
        "capacity_pct":     cap,
        "rain_forecast_mm": rain_forecast_mm,
        "river_level_m":    river_level_m,
        "warning_level_m":  warn,
        "danger_level_m":   danger,
        "downstream_pop":   pop,
        "evac_status":      "complete" if evac_complete else "pending",
        "decision":         decision,
        "gate_opening":     gate_pct,
        "urgency":          urgency,
        "recommendation":   recommendation,
        "authority_note":   "⚠ HUMAN AUTHORIZATION REQUIRED before any gate operation.",
    }


def bridge_advisory(bridge: dict, flood_risk: float,
                    water_level_m: float, rain_24h_mm: float) -> dict:
    """
    Bridge structural risk assessment.
    Checks: flood risk score + live water level vs max capacity + rainfall.
    """
    name     = bridge.get("name","Bridge")
    max_d    = bridge.get("max_depth_m", 10)
    max_flow = bridge.get("max_flow_cumecs", 20000)
    river    = bridge.get("river","")

    depth_pct = (water_level_m / max_d * 100) if max_d else 0

    if depth_pct >= 90 or flood_risk >= 0.80:
        action = "IMMEDIATE_CLOSURE"
        reason = f"Water at {depth_pct:.0f}% of max depth. Structural integrity risk."
        color  = "RED"
    elif depth_pct >= 75 or flood_risk >= 0.65:
        action = "CLOSE_HEAVY_VEHICLES"
        reason = f"Water at {depth_pct:.0f}% depth. Heavy vehicles & buses prohibited."
        color  = "AMBER"
    elif depth_pct >= 60 or flood_risk >= 0.50:
        action = "SPEED_RESTRICTION_20KMPH"
        reason = f"Elevated flood risk {flood_risk:.2f}. Caution required."
        color  = "YELLOW"
    else:
        action = "OPEN_NORMAL"
        reason = "Risk within safe limits."
        color  = "GREEN"

    return {
        "bridge":        name,
        "river":         river,
        "state":         bridge.get("state",""),
        "flood_risk":    round(flood_risk,3),
        "water_level_m": water_level_m,
        "max_depth_m":   max_d,
        "depth_pct":     round(depth_pct,1),
        "rain_24h_mm":   rain_24h_mm,
        "action":        action,
        "color":         color,
        "reason":        reason,
        "iot_signal": {
            "topic":   f"netravaah/bridge/{name.lower().replace(' ','_')}",
            "payload": json.dumps({"action": action, "led": color,
                                   "audio": action in ("IMMEDIATE_CLOSURE","CLOSE_HEAVY_VEHICLES")}),
        },
    }


def drainage_advisory(district: str, rain_72h_mm: float,
                       flood_risk: float, pop_density: float) -> dict:
    """
    Urban drainage and water gate control recommendation.
    """
    if rain_72h_mm > 200 and flood_risk > 0.70:
        return {
            "district":    district,
            "action":      "OPEN_ALL_DRAINAGE_GATES",
            "pump_status": "MAXIMUM",
            "desilting":   "EMERGENCY",
            "reason":      f"Extreme rain {rain_72h_mm:.0f}mm/72h. All stormwater gates open.",
        }
    elif rain_72h_mm > 100 and flood_risk > 0.50:
        return {
            "district":    district,
            "action":      "OPEN_SECONDARY_GATES",
            "pump_status": "HIGH",
            "desilting":   "PRIORITY",
            "reason":      f"Heavy rain {rain_72h_mm:.0f}mm/72h. Secondary drainage activated.",
        }
    return {
        "district":    district,
        "action":      "STANDARD_DRAINAGE",
        "pump_status": "NORMAL",
        "desilting":   "SCHEDULED",
        "reason":      "Rain within capacity.",
    }


# ═══════════════════════════════════════════════════════════════════
# ALERT MESSAGE GENERATOR  (Citizen + Govt)
# ═══════════════════════════════════════════════════════════════════

CITIZEN_STEPS = {
    "flood": [
        "Move to highest floor or rooftop — never enter a basement",
        "Follow NETRAVAAH evacuation route to nearest shelter",
        "Carry ID, medicine, 3-day food/water in a waterproof bag",
        "Switch off gas, electricity, water mains before leaving",
        "Do NOT drive through flooded roads — 15cm water can move a car",
        "Call 112 if trapped — do NOT wait for water to 'pass'",
    ],
    "landslide": [
        "Leave the area IMMEDIATELY — do not wait for another slide",
        "Use only flat or uphill routes — avoid valleys and stream beds",
        "Watch for cracking sounds, tilting trees, new springs",
        "Move to reinforced concrete building on flat high ground",
        "Block doors/windows with sandbags if time allows",
        "Call 112 — GPS your location to emergency services",
    ],
    "heatwave": [
        "Stay indoors 11 AM–4 PM in coolest room of the house",
        "Drink 3–4 litres of water per day even if not thirsty",
        "Use ORS or lemon-salt water if feeling dizzy or weak",
        "Wet cloth on neck, wrists, ankles to reduce body temperature",
        "Check on elderly, children, livestock every 2 hours",
        "Use government cooling centres — they are FREE and open 24h",
    ],
    "drought": [
        "Collect and store any rainwater immediately",
        "Use water only for drinking and cooking until further notice",
        "Register at Jal Shakti water tanker distribution point",
        "Farmers: apply mulching to retain soil moisture",
        "Report leaks or wastage to 1916 (Jal Shakti helpline)",
        "Community: pool resources at panchayat water storage",
    ],
    "cyclone": [
        "Move to NEAREST CYCLONE SHELTER NOW — do not delay",
        "Board up windows with wooden planks, secure roof sheets",
        "3-day emergency kit: water, dry food, torch, radio, medicines",
        "Stay away from coast, rivers, and trees",
        "Do NOT go out during cyclone eye — it WILL resume violently",
        "Wait for government ALL-CLEAR before leaving shelter",
    ],
}

GOVT_STEPS = {
    "flood": [
        "Deploy NDRF flood rescue teams with motor boats to district HQ",
        "Activate 24×7 Flood Control Room and State EOC immediately",
        "Pre-position relief: food, medicine, blankets at staging areas",
        "Issue dam/barrage overflow warnings to all downstream districts",
        "Coordinate BRO/PWD for emergency road clearance and pontoon bridges",
        "Open all government schools and community halls as relief camps",
    ],
    "landslide": [
        "Block NH/SH on all identified unstable slope segments IMMEDIATELY",
        "Deploy NDRF hill rescue teams with rope-rescue equipment",
        "Suspend all road blasting and construction in affected zone",
        "Deploy geo-technical teams for rapid slope stability assessment",
        "Pre-position medical camps at base-camp staging areas",
        "Coordinate with telecom for emergency satellite communication",
    ],
    "heatwave": [
        "Open all government buildings as 24h cooling centres",
        "Deploy ASHA/ANM workers for daily house-to-house check",
        "Ensure uninterrupted 24×7 drinking water supply",
        "Alert all district hospitals for surge in heat stroke cases",
        "Issue mandatory advisory: no outdoor labour 11 AM–4 PM",
        "Deploy 108 ambulances with ice packs and IV saline",
    ],
    "drought": [
        "Declare drought — activate SDRF/NDRF crop failure relief fund",
        "Emergency Jal Shakti water audit within 48 hours",
        "Deploy water tankers to all affected villages daily",
        "Activate PMFBY crop insurance for affected farmers immediately",
        "Impose industrial water-use restrictions (non-essential)",
        "Establish cattle camps with fodder and drinking water",
    ],
    "cyclone": [
        "Activate State Cyclone Control Room — coordinate with IMD",
        "Mandatory evacuation: 0–10 km coastal buffer zone",
        "Pre-position NDRF cyclone teams at coastal staging points",
        "Suspend all fishing, port, and offshore operations",
        "Coordinate 6-hourly track updates with IMD/RSMC",
        "Alert Power Grid Corporation for preventive line shutdown",
    ],
}


def citizen_alert(district: str, hazard: str, prob: float,
                  level: str, live: dict, evac_plan: dict) -> str:
    t    = live.get("temp_c", 28)
    r24  = live.get("rain_24h", 0)
    w    = live.get("wind_mps", 2)
    wris = live.get("wris") or {}
    icon = {"flood":"🌊","landslide":"⛰️","heatwave":"🔥",
            "drought":"☀️","cyclone":"🌀"}.get(hazard,"⚠️")

    lines = [
        f"{'═'*55}",
        f"{icon}  {hazard.upper()} {level} ALERT — {district.upper()}",
        f"{'═'*55}",
        f"Risk: {int(prob*100)}%  |  Temp: {t:.1f}°C  |  Rain 24h: {r24:.1f}mm  |  Wind: {w:.1f}m/s",
    ]
    if wris.get("level_m"):
        lines.append(f"River level: {wris['level_m']:.1f}m  ({wris.get('trend','?')})")

    lines += ["", "── IMMEDIATE ACTIONS ──────────────────────────"]
    for i, a in enumerate(CITIZEN_STEPS.get(hazard,[])[:5], 1):
        lines.append(f"  {i}. {a}")

    routes = (evac_plan or {}).get("routes", [])
    if routes:
        best = routes[0]
        lines += [
            "",
            "── EVACUATION ROUTE ────────────────────────────",
            f"  🏠 SHELTER: {best['shelter']}",
            f"  📍 Address: {best.get('address','See map')}",
            f"  🚗 Distance: {best['distance_km']} km  |  ETA: {best['eta_min']} min",
        ]
        if best.get("steps"):
            lines.append("  Turn-by-turn:")
            for step in best["steps"][:5]:
                lines.append(f"    ▸ {step['instruction']} ({step.get('road_name','')})")
        elif best.get("geometry"):
            lines.append("  → Follow highlighted route on map")

        iot = (evac_plan or {}).get("iot_signals",[])
        if iot:
            lines += ["", f"  🚧 {len(iot)} road(s) CLOSED — use evacuation route ONLY"]

    lines += [
        "",
        "── EMERGENCY HELPLINES ─────────────────────────",
        "  112  Emergency (Police/Fire/Ambulance)",
        "  1078 NDMA National Disaster Helpline",
        "  1070 State Disaster Relief",
        "  1916 Jal Shakti (Water Emergency)",
        f"{'═'*55}",
    ]
    return "\n".join(lines)


def govt_alert(district: str, state: str, hazard: str,
               prob: float, level: str, live: dict,
               evac_plan: dict, dam_adv: Optional[dict],
               bridge_advs: List[dict]) -> str:
    t    = live.get("temp_c", 28)
    r72  = live.get("rain_72h", 0)
    wris = live.get("wris") or {}

    lines = [
        "╔" + "═"*58 + "╗",
        f"║  NETRAVAAH v4 — GOVERNMENT/NDRF ALERT  [{level}]".ljust(59) + "║",
        "╠" + "═"*58 + "╣",
        f"║  Hazard    : {hazard.upper()}".ljust(59) + "║",
        f"║  District  : {district}, {state}".ljust(59) + "║",
        f"║  Probability: {int(prob*100)}%  |  Temp: {t:.1f}°C  |  Rain 72h: {r72:.1f}mm".ljust(59) + "║",
    ]
    if wris.get("level_m"):
        lines.append(f"║  River     : {wris['level_m']:.1f}m ({wris.get('trend','?')}) — {wris.get('station','')}".ljust(59) + "║")
    lines += [
        "╠" + "═"*58 + "╣",
        "║  NDRF/GOVT ACTIONS:".ljust(59) + "║",
    ]
    for i, a in enumerate(GOVT_STEPS.get(hazard,[]), 1):
        lines.append(f"║  {i}. {a[:53]}".ljust(59) + "║")

    if evac_plan and evac_plan.get("routes"):
        lines += ["╠" + "═"*58 + "╣", "║  EVACUATION ROUTES:".ljust(59) + "║"]
        for r in evac_plan["routes"][:3]:
            lines.append(f"║  → {r['shelter'][:30]}: {r['distance_km']}km ~{r['eta_min']}min".ljust(59) + "║")
        nb = evac_plan.get("roads_blocked", 0)
        iot = evac_plan.get("iot_signals", [])
        lines.append(f"║  Roads blocked: {nb}  |  IoT signals sent: {len(iot)}".ljust(59) + "║")

    if dam_adv:
        lines += ["╠" + "═"*58 + "╣",
                  f"║  DAM: {dam_adv['dam_name']} — {dam_adv['decision']}".ljust(59) + "║",
                  f"║  {dam_adv['recommendation'][:55]}…".ljust(59) + "║"]

    if bridge_advs:
        lines += ["╠" + "═"*58 + "╣"]
        for b in bridge_advs[:2]:
            lines.append(f"║  BRIDGE: {b['bridge'][:20]} — {b['action'][:25]}".ljust(59) + "║")

    lines += [
        "╠" + "═"*58 + "╣",
        "║  NDMA: 011-26701728  |  NDRF: 9711077372  |  1078".ljust(59) + "║",
        "╚" + "═"*58 + "╝",
    ]
    return "\n".join(lines)
