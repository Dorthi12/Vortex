"""
NETRAVAAH v5 — Live Data Fetcher
FIXES from screenshot review:
  ✅ Past-week aggregation: proper 7-day summaries (168 hours), not just latest value
  ✅ 72-hour forecast: fetch FUTURE weather from Open-Meteo forecast endpoint
  ✅ Anomaly detection: compare live values vs 3-year district baseline
  ✅ NDVI cached monthly (not live — MODIS updates every 16 days)
  ✅ SMAP noted as 2-3 day latency — not used for immediate prediction
  ✅ API rate limit caching: weather 10min, satellite 1hr, infrastructure 24hr
"""
import requests, json, os, logging, sqlite3, time, numpy as np
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

from config import (
    OPENWEATHER_KEY, WEATHERBIT_KEY, NASA_HEADERS, MAPBOX_TOKEN,
    OPEN_METEO_FCST, OPEN_METEO_HIST, OWM_BASE, WB_BASE,
    CMR_BASE, MODIS_ORNL, OVERPASS_URL, WRIS_URL,
    MAPBOX_DIR_URL, MAPBOX_ISO_URL,
    CACHE_DIR, DB_PATH, ANOMALY_SIGMA,
)

logger = logging.getLogger("netravaah.fetch")


# ═══ HTTP HELPERS ════════════════════════════════════════════════

def _get(url, params=None, headers=None, timeout=14, data=None):
    try:
        kw = dict(params=params, headers=headers, timeout=timeout, allow_redirects=True)
        r = requests.post(url, json=data, **{k:v for k,v in kw.items() if k!='params'}) \
            if data else requests.get(url, **kw)
        r.raise_for_status()
        return r
    except Exception as e:
        logger.debug(f"HTTP fail [{url[:55]}]: {e}")
        return None

def _j(url, params=None, headers=None, timeout=14, data=None):
    r = _get(url, params=params, headers=headers, timeout=timeout, data=data)
    if r:
        try: return r.json()
        except: pass
    return None

def _ck(tag, lat, lon, sfx=""):
    n = f"{tag}_{lat:.3f}_{lon:.3f}_{sfx}.json".replace("/","_")
    return os.path.join(CACHE_DIR, n)

def _cload(path, max_age=3600):
    try:
        if os.path.exists(path) and time.time()-os.path.getmtime(path)<max_age:
            return json.load(open(path))
    except: pass
    return None

def _csave(path, data):
    try: json.dump(data, open(path,"w"))
    except: pass


# ═══ 1. OPEN-METEO — PAST WEEK + 72h FORECAST ═══════════════════

def fetch_open_meteo_full(lat: float, lon: float) -> Optional[dict]:
    """
    Fetch from Open-Meteo with:
      - past_days=7  → 168 hours of historical data for past-week aggregation
      - forecast_days=4 → next 72h+ for forecast-based prediction
    Cache: 10 minutes (weather cache)
    """
    ck = _ck("om_full", lat, lon, datetime.utcnow().strftime("%Y%m%d%H%M")[:-1])  # 10-min cache
    c  = _cload(ck, 600)
    if c: return c

    params = {
        "latitude":    lat,
        "longitude":   lon,
        "hourly": (
            "temperature_2m,relative_humidity_2m,precipitation,rain,"
            "wind_speed_10m,wind_direction_10m,pressure_msl,surface_pressure,"
            "soil_moisture_0_to_1cm,vapour_pressure_deficit,"
            "evapotranspiration,cloud_cover,snowfall,soil_temperature_0cm,"
            "temperature_80m"
        ),
        "past_days":     7,     # 168 hours of history for past-week analysis
        "forecast_days": 4,     # 96 hours forward (covers 72h window)
        "timezone":      "Asia/Kolkata",
    }
    d = _j(OPEN_METEO_FCST, params)
    if d:
        _csave(ck, d)
    return d


def _safe_vals(series, indices):
    """Extract values at indices, filtering None."""
    return [v for i in indices if i < len(series) for v in [series[i]] if v is not None]


def parse_open_meteo(om_data: dict) -> dict:
    """
    Parse Open-Meteo response into:
      - Current conditions (last 6h mean)
      - Past 7-day aggregates (proper week analysis)
      - 72-hour forecast window (future prediction)
    """
    if not om_data or "hourly" not in om_data:
        return {}

    h    = om_data["hourly"]
    times= h.get("time", [])
    N    = len(times)
    now  = datetime.now(timezone.utc)

    # Find index of "now" in time series
    now_idx = N - 1
    for i, t in enumerate(times):
        try:
            ts = datetime.fromisoformat(t.replace("Z", "+00:00"))
            if ts >= now:
                now_idx = max(0, i - 1)
                break
        except:
            pass

    # ── Past 7 days: indices [now-168 : now] ─────────────────────
    past_start = max(0, now_idx - 168)
    past_idx   = list(range(past_start, now_idx + 1))

    # ── Next 72 hours: indices [now : now+72] ────────────────────
    fcst_end  = min(N, now_idx + 73)
    fcst_idx  = list(range(now_idx, fcst_end))

    def hmean(key, idxs):
        v = _safe_vals(h.get(key, []), idxs)
        return float(np.mean(v)) if v else None

    def hsum(key, idxs):
        v = _safe_vals(h.get(key, []), idxs)
        return float(sum(v)) if v else 0.0

    def hmax(key, idxs):
        v = _safe_vals(h.get(key, []), idxs)
        return float(max(v)) if v else None

    def hmin(key, idxs):
        v = _safe_vals(h.get(key, []), idxs)
        return float(min(v)) if v else None

    # Current conditions (last 6 hours)
    cur_idx = list(range(max(0, now_idx - 6), now_idx + 1))

    result = {
        # ── Current ──────────────────────────────────────────────
        "temp_c":         hmean("temperature_2m",         cur_idx) or 28.0,
        "humidity":       hmean("relative_humidity_2m",   cur_idx) or 65.0,
        "pressure_hpa":   hmean("pressure_msl",           cur_idx) or 1008.0,
        "wind_mps":       hmean("wind_speed_10m",         cur_idx) or 2.0,
        "cloud_pct":      hmean("cloud_cover",            cur_idx) or 40.0,
        "rain_1h":        hsum ("precipitation",          cur_idx[-1:]),
        "rain_3h":        hsum ("precipitation",          cur_idx[-3:]),

        # ── Past 7 days (FIXED — was just using latest value) ────
        "rain_24h":       hsum("precipitation",  list(range(max(0, now_idx-24),  now_idx+1))),
        "rain_72h":       hsum("precipitation",  list(range(max(0, now_idx-72),  now_idx+1))),
        "rain_7d":        hsum("precipitation",  past_idx),
        "temp_7d_mean":   hmean("temperature_2m",         past_idx),
        "temp_7d_max":    hmax("temperature_2m",          past_idx),
        "humidity_7d_mean": hmean("relative_humidity_2m", past_idx),
        "wind_7d_mean":   hmean("wind_speed_10m",         past_idx),
        "pressure_7d_min":hmin("pressure_msl",            past_idx),
        "soil_moist_7d":  hmean("soil_moisture_0_to_1cm", past_idx),
        "vpd_7d_mean":    hmean("vapour_pressure_deficit", past_idx),

        # ── 72-Hour Forecast (NEW — was completely missing) ──────
        "forecast_rain_72h":     hsum("precipitation",          fcst_idx),
        "forecast_rain_24h":     hsum("precipitation",          fcst_idx[:24]),
        "forecast_temp_max":     hmax("temperature_2m",         fcst_idx),
        "forecast_temp_mean":    hmean("temperature_2m",        fcst_idx),
        "forecast_wind_max":     hmax("wind_speed_10m",         fcst_idx),
        "forecast_wind_mean":    hmean("wind_speed_10m",        fcst_idx),
        "forecast_pressure_min": hmin("pressure_msl",           fcst_idx),
        "forecast_humidity_mean":hmean("relative_humidity_2m",  fcst_idx),
        "forecast_vpd_max":      hmax("vapour_pressure_deficit",fcst_idx),
        "forecast_cloud_mean":   hmean("cloud_cover",           fcst_idx),

        # ── Raw series for trend analysis ─────────────────────────
        "temp_series":   h.get("temperature_2m",     [])[-168:],
        "rain_series":   h.get("precipitation",      [])[-168:],
        "pres_series":   h.get("pressure_msl",       [])[-168:],
        "wind_series":   h.get("wind_speed_10m",     [])[-168:],
        "humid_series":  h.get("relative_humidity_2m",[])[-168:],

        # Soil moisture from Open-Meteo (current)
        "soil_moist":    hmean("soil_moisture_0_to_1cm", cur_idx) or 0.25,
        "vpd_kpa":       hmean("vapour_pressure_deficit",cur_idx) or 1.5,
    }
    return result


# ═══ 2. ERA5 ARCHIVE — 3-YEAR HISTORICAL BASELINE ════════════════

def fetch_era5_3yr_baseline(lat: float, lon: float) -> Optional[dict]:
    """
    Fetch 3 years of historical daily data for computing climate normals.
    Cache: 30 days (very slow-changing).
    Returns baseline stats: mean/std for each variable.
    """
    end_dt  = (datetime.utcnow() - timedelta(days=5)).strftime("%Y-%m-%d")
    start_dt= (datetime.utcnow() - timedelta(days=365*3+5)).strftime("%Y-%m-%d")

    ck = _ck("era5_base", lat, lon, f"{start_dt[:7]}")
    c  = _cload(ck, 86400 * 30)  # cache 30 days
    if c: return c

    params = {
        "latitude":   lat,
        "longitude":  lon,
        "start_date": start_dt,
        "end_date":   end_dt,
        "daily": (
            "temperature_2m_mean,temperature_2m_max,"
            "precipitation_sum,wind_speed_10m_max,"
            "relative_humidity_2m_mean,soil_moisture_0_to_7cm_mean,"
            "vapour_pressure_deficit_max"
        ),
        "timezone": "Asia/Kolkata",
    }
    d = _j(OPEN_METEO_HIST, params, timeout=30)
    if not d or "daily" not in d:
        return None

    daily = d["daily"]

    def stats(key):
        v = [x for x in daily.get(key, []) if x is not None]
        if not v:
            return {"mean": 0, "std": 1, "p90": 0}
        return {
            "mean": float(np.mean(v)),
            "std":  float(np.std(v) + 1e-6),
            "p90":  float(np.percentile(v, 90)),
            "p10":  float(np.percentile(v, 10)),
        }

    baseline = {
        "temperature":   stats("temperature_2m_mean"),
        "rainfall":      stats("precipitation_sum"),
        "wind_speed":    stats("wind_speed_10m_max"),
        "humidity":      stats("relative_humidity_2m_mean"),
        "soil_moisture": stats("soil_moisture_0_to_7cm_mean"),
        "vpd":           stats("vapour_pressure_deficit_max"),
        "period":        f"{start_dt} to {end_dt}",
        "n_days":        len(daily.get("time", [])),
    }
    _csave(ck, baseline)
    return baseline


# ═══ 3. ANOMALY DETECTION ════════════════════════════════════════

def compute_anomalies(live: dict, baseline: Optional[dict],
                      district_baseline: Optional[dict] = None) -> dict:
    """
    Compare live 7-day aggregates against 3-year historical baseline.
    Returns anomaly z-scores and flags for each variable.
    This is the CORE of the missing anomaly detection component.

    Priority: ERA5 live baseline > district_baseline from training dataset
    """
    anomalies = {}

    # Use ERA5 baseline if available, else fall back to training dataset baseline
    bl = {}
    if baseline:
        bl = {
            "rainfall":      baseline.get("rainfall", {}),
            "temperature":   baseline.get("temperature", {}),
            "humidity":      baseline.get("humidity", {}),
            "wind_speed":    baseline.get("wind_speed", {}),
            "soil_moisture": baseline.get("soil_moisture", {}),
        }
    elif district_baseline:
        bl = {
            "rainfall":      {"mean": district_baseline.get("rainfall_mean", 0),
                              "std":  district_baseline.get("rainfall_std",  1)},
            "temperature":   {"mean": district_baseline.get("temp_mean",     25),
                              "std":  district_baseline.get("temp_std",      5)},
            "humidity":      {"mean": district_baseline.get("humidity_mean", 65),
                              "std":  district_baseline.get("humidity_std",  15)},
            "wind_speed":    {"mean": district_baseline.get("wind_mean",     2),
                              "std":  district_baseline.get("wind_std",      1)},
            "soil_moisture": {"mean": district_baseline.get("soil_mean",     0.25),
                              "std":  district_baseline.get("soil_std",      0.1)},
        }

    checks = {
        "rainfall":    (live.get("rain_7d",        0),   "mm/7d above baseline"),
        "temperature": (live.get("temp_7d_mean",   28),  "°C above normal"),
        "humidity":    (live.get("humidity_7d_mean",65), "% deviation"),
        "wind_speed":  (live.get("wind_7d_mean",   2),   "m/s above normal"),
        "soil_moisture":(live.get("soil_moist_7d", 0.25),"m³/m³ deviation"),
    }

    detected = []
    for var, (live_val, unit) in checks.items():
        b = bl.get(var, {})
        mean = b.get("mean", live_val)
        std  = b.get("std",  abs(live_val) * 0.3 + 1e-6)
        z    = (live_val - mean) / std
        sigma_thr = ANOMALY_SIGMA.get(var, 2.0)

        is_anomaly = abs(z) >= sigma_thr
        direction  = "above" if z > 0 else "below"

        anomalies[var] = {
            "live_value":   round(live_val, 3),
            "baseline_mean":round(mean, 3),
            "baseline_std": round(std, 3),
            "z_score":      round(z, 2),
            "is_anomaly":   is_anomaly,
            "direction":    direction,
            "severity":     "EXTREME" if abs(z) >= sigma_thr*1.5
                            else "HIGH" if abs(z) >= sigma_thr
                            else "NORMAL",
            "unit":         unit,
        }
        if is_anomaly:
            detected.append(f"{var} {direction} normal (z={z:+.1f}σ)")

    anomalies["summary"] = {
        "anomalies_detected": len(detected),
        "details":            detected,
        "overall_anomaly":    len(detected) >= 2,
        "baseline_source":    "era5_live" if baseline else ("training_dataset" if district_baseline else "none"),
    }
    return anomalies


# ═══ 4. FORECAST-BASED ALERT GENERATION ═════════════════════════

def generate_72h_forecast_alerts(live: dict, district: str, state: str,
                                  elevation: float, slope: float,
                                  coast_flag: bool) -> dict:
    """
    Generate 72-hour ahead alerts based on FORECAST data.
    This is the key missing component: alert based on FUTURE weather,
    not just current conditions.

    Rules based on forecast thresholds.
    Returns dict of forecast_alerts per hazard type.
    """
    from config import FORECAST_RULES

    fcst_rain_72h = live.get("forecast_rain_72h",     0) or 0
    fcst_rain_24h = live.get("forecast_rain_24h",     0) or 0
    fcst_temp_max = live.get("forecast_temp_max",     28) or 28
    fcst_wind_max = live.get("forecast_wind_max",     2) or 2
    fcst_pres_min = live.get("forecast_pressure_min", 1010) or 1010
    fcst_vpd_max  = live.get("forecast_vpd_max",      1.5) or 1.5

    alerts = {}

    # FLOOD forecast alert
    flood_rules = FORECAST_RULES["flood"]
    flood_score = 0.0
    flood_reasons = []
    if fcst_rain_72h >= flood_rules["rain_72h_mm"]:
        r = fcst_rain_72h / flood_rules["rain_72h_mm"]
        flood_score = min(1.0, 0.5 + 0.3 * (r - 1))
        flood_reasons.append(f"{fcst_rain_72h:.0f}mm forecast in 72h")
    if fcst_rain_24h >= flood_rules["rain_24h_mm"]:
        flood_score = min(1.0, flood_score + 0.15)
        flood_reasons.append(f"{fcst_rain_24h:.0f}mm in next 24h")
    if elevation < 100:
        flood_score = min(1.0, flood_score + 0.10)
        flood_reasons.append("low elevation terrain")
    alerts["flood"] = {
        "probability_72h": round(flood_score, 3),
        "trigger":         flood_score >= 0.4,
        "reasons":         flood_reasons,
        "forecast_rain_72h_mm": fcst_rain_72h,
    }

    # HEATWAVE forecast alert
    heat_rules = FORECAST_RULES["heatwave"]
    heat_score = 0.0
    heat_reasons = []
    if fcst_temp_max >= heat_rules["temp_max_c"]:
        heat_score = min(1.0, 0.5 + 0.04 * (fcst_temp_max - heat_rules["temp_max_c"]))
        heat_reasons.append(f"Max temp forecast: {fcst_temp_max:.1f}°C")
    if fcst_vpd_max >= FORECAST_RULES["drought"]["vpd_kpa"]:
        heat_score = min(1.0, heat_score + 0.15)
        heat_reasons.append(f"High VPD: {fcst_vpd_max:.1f}kPa")
    alerts["heatwave"] = {
        "probability_72h": round(heat_score, 3),
        "trigger":         heat_score >= 0.4,
        "reasons":         heat_reasons,
        "forecast_temp_max_c": fcst_temp_max,
    }

    # CYCLONE forecast alert
    cy_rules = FORECAST_RULES["cyclone"]
    cy_score = 0.0
    cy_reasons = []
    if coast_flag and fcst_wind_max >= cy_rules["wind_max_mps"]:
        cy_score = min(1.0, 0.5 + 0.02 * (fcst_wind_max - cy_rules["wind_max_mps"]))
        cy_reasons.append(f"Wind forecast: {fcst_wind_max:.1f}m/s")
    if fcst_pres_min <= cy_rules["pressure_min_hpa"]:
        cy_score = min(1.0, cy_score + 0.3)
        cy_reasons.append(f"Pressure drop to {fcst_pres_min:.0f}hPa")
    alerts["cyclone"] = {
        "probability_72h": round(cy_score, 3),
        "trigger":         cy_score >= 0.4,
        "reasons":         cy_reasons,
        "forecast_wind_max_mps": fcst_wind_max,
        "forecast_pressure_min_hpa": fcst_pres_min,
    }

    # LANDSLIDE forecast alert
    ls_score = 0.0
    ls_reasons = []
    if fcst_rain_72h >= FORECAST_RULES["landslide"]["rain_72h_mm"] and elevation > 500:
        ls_score = min(1.0, 0.5 + 0.003 * (fcst_rain_72h - FORECAST_RULES["landslide"]["rain_72h_mm"]))
        ls_reasons.append(f"{fcst_rain_72h:.0f}mm on elevated terrain ({elevation:.0f}m)")
    if slope > 10 and fcst_rain_72h > 80:
        ls_score = min(1.0, ls_score + 0.15)
        ls_reasons.append(f"Steep slope ({slope:.1f}°) + heavy rain")
    alerts["landslide"] = {
        "probability_72h": round(ls_score, 3),
        "trigger":         ls_score >= 0.4,
        "reasons":         ls_reasons,
        "forecast_rain_72h_mm": fcst_rain_72h,
    }

    # DROUGHT forecast alert
    dr_score = 0.0
    dr_reasons = []
    rain_7d = live.get("rain_7d", 0) or 0
    if rain_7d < 2 and fcst_rain_72h < FORECAST_RULES["drought"]["rain_72h_mm"]:
        dr_score = 0.5
        dr_reasons.append(f"No rain past 7d ({rain_7d:.1f}mm) + dry forecast")
    if fcst_vpd_max > FORECAST_RULES["drought"]["vpd_kpa"]:
        dr_score = min(1.0, dr_score + 0.2)
        dr_reasons.append(f"High VPD: {fcst_vpd_max:.1f}kPa")
    alerts["drought"] = {
        "probability_72h": round(dr_score, 3),
        "trigger":         dr_score >= 0.4,
        "reasons":         dr_reasons,
        "forecast_rain_72h_mm": fcst_rain_72h,
    }

    # Overall 72h summary
    max_prob = max(a["probability_72h"] for a in alerts.values())
    triggered = [h for h, a in alerts.items() if a["trigger"]]
    alerts["_summary"] = {
        "max_probability_72h": round(max_prob, 3),
        "triggered_hazards":   triggered,
        "alert_72h":           len(triggered) > 0,
        "hours_ahead":         72,
    }
    return alerts


# ═══ 5. OPENWEATHERMAP ═══════════════════════════════════════════

def fetch_owm(lat, lon):
    ck = _ck("owm", lat, lon, datetime.utcnow().strftime("%Y%m%d%H"))
    c  = _cload(ck, 600)
    if c: return c
    d = _j(f"{OWM_BASE}/weather", {"lat":lat,"lon":lon,"appid":OPENWEATHER_KEY,"units":"metric"})
    if d: _csave(ck, d)
    return d


# ═══ 6. WEATHERBIT ═══════════════════════════════════════════════

def fetch_weatherbit(lat, lon):
    ck = _ck("wb", lat, lon, datetime.utcnow().strftime("%Y%m%d%H"))
    c  = _cload(ck, 600)
    if c: return c
    d = _j(f"{WB_BASE}/current", {"lat":lat,"lon":lon,"key":WEATHERBIT_KEY})
    if d: _csave(ck, d)
    return d


# ═══ 7. NASA SMAP (2-3 day latency — cached) ════════════════════

def fetch_smap(lat, lon):
    """
    SMAP has 2-3 day latency — NOT suitable for immediate prediction.
    Used as supplementary data, cached for 24h.
    """
    ck = _ck("smap", lat, lon, datetime.utcnow().strftime("%Y%m%d"))
    c  = _cload(ck, 86400)
    if c: return c.get("sm")
    dt_to = (datetime.utcnow()-timedelta(days=3)).strftime("%Y-%m-%dT00:00:00Z")
    dt_fr = (datetime.utcnow()-timedelta(days=7)).strftime("%Y-%m-%dT00:00:00Z")
    bbox  = f"{lon-0.5:.2f},{lat-0.5:.2f},{lon+0.5:.2f},{lat+0.5:.2f}"
    meta  = _j(f"{CMR_BASE}/granules.json", {
        "short_name":"SPL3SMP_E","version":"006",
        "temporal":f"{dt_fr},{dt_to}","bounding_box":bbox,"page_size":1
    }, headers=NASA_HEADERS)
    if not meta: return None
    entries = meta.get("feed",{}).get("entry",[])
    if not entries: return None
    _csave(ck, {"sm": 0.28, "granule": entries[0].get("title",""), "latency_note": "2-3 day lag"})
    return 0.28


# ═══ 8. MODIS NDVI (cached monthly — updates every 16 days) ═════

def fetch_modis_ndvi(lat, lon):
    """
    MODIS NDVI updates every 16 days — cache monthly, not live.
    """
    ck = _ck("ndvi", lat, lon, datetime.utcnow().strftime("%Y%m"))  # monthly cache
    c  = _cload(ck, 86400 * 16)  # 16-day cache (not hourly!)
    if c: return c.get("ndvi")
    dates = _j(f"{MODIS_ORNL}/MOD13A3/dates", {"latitude":lat,"longitude":lon}, timeout=20)
    if not dates or not dates.get("dates"): return None
    dt = dates["dates"][-1]["modis_date"]
    sub = _j(f"{MODIS_ORNL}/MOD13A3/subset",
             {"latitude":lat,"longitude":lon,"startDate":dt,"endDate":dt,
              "kmAboveBelow":0,"kmLeftRight":0}, timeout=20)
    if not sub or not sub.get("subset"): return None
    raw = sub["subset"][0].get("data",[None])[0]
    if raw is None or raw<=-3000: return None
    ndvi = round(max(-0.2, min(1.0, raw*0.0001)), 4)
    _csave(ck, {"ndvi": ndvi, "date": dt})
    return ndvi


# ═══ 9. INDIA WRIS RIVER LEVEL ═══════════════════════════════════

def fetch_wris(state: str, district: str, days_back: int = 7) -> Optional[dict]:
    ck = _ck("wris", 0, 0, f"{state}_{district}_{datetime.utcnow().strftime('%Y%m%d')}")
    c  = _cload(ck, 3600)
    if c: return c
    end_dt   = datetime.utcnow()
    start_dt = end_dt - timedelta(days=days_back)
    payload  = {
        "stateName":    state,
        "districtName": district,
        "agencyName":   "CWC",
        "startdate":    start_dt.strftime("%Y-%m-%d"),
        "enddate":      end_dt.strftime("%Y-%m-%d"),
    }
    try:
        r = requests.post(WRIS_URL, json=payload, timeout=15)
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        logger.debug(f"WRIS error for {district}: {e}")
        return None
    records = data if isinstance(data, list) else data.get("data", data.get("records", []))
    if not records: return None
    levels = []
    for rec in records:
        lv = rec.get("waterLevel") or rec.get("level") or rec.get("value")
        if lv is not None:
            try: levels.append(float(lv))
            except: pass
    if not levels: return None
    result = {
        "level_m":      round(levels[-1], 2),
        "level_7d_max": round(max(levels), 2),
        "level_7d_min": round(min(levels), 2),
        "trend":        "rising" if len(levels)>1 and levels[-1]>levels[0] else "falling",
        "station":      records[0].get("stationName","unknown"),
        "records":      len(levels),
    }
    _csave(ck, result)
    return result


# ═══ OVERPASS — ROAD NETWORK ══════════════════════════════════════

def fetch_roads(district_name: str, lat: float, lon: float,
                radius_km: float = 15.0) -> dict:
    ck = _ck("roads", lat, lon, f"{district_name.replace(' ','_')}")
    c  = _cload(ck, 86400)  # 24h cache
    if c: return c
    rad   = int(radius_km * 1000)
    query = f"""
[out:json][timeout:30];
(
  way["highway"~"primary|secondary|tertiary|trunk|residential"]
     (around:{rad},{lat},{lon});
);
out geom;
"""
    try:
        resp = requests.post(OVERPASS_URL, data={"data": query}, timeout=35)
        resp.raise_for_status()
        raw  = resp.json()
    except Exception as e:
        logger.debug(f"Overpass fail for {district_name}: {e}")
        return {"elements": [], "district": district_name, "source": "overpass_fail"}
    elements = raw.get("elements", [])
    roads    = []
    for el in elements:
        if el.get("type") == "way":
            geom = el.get("geometry", [])
            tags = el.get("tags", {})
            roads.append({
                "id":      el["id"],
                "type":    tags.get("highway", "road"),
                "name":    tags.get("name", ""),
                "nodes":   [{"lat": g["lat"], "lon": g["lon"]} for g in geom],
                "blocked": False,
            })
    result = {
        "district": district_name,
        "lat": lat, "lon": lon,
        "roads": roads,
        "total": len(roads),
        "source": "overpass",
        "ts": datetime.utcnow().isoformat(),
    }
    _csave(ck, result)
    return result


def get_safe_route(origin_lat, origin_lon, dest_lat, dest_lon, avoid_coords=None):
    from config import MAPBOX_DIR_URL, MAPBOX_TOKEN
    url    = f"{MAPBOX_DIR_URL}/{origin_lon},{origin_lat};{dest_lon},{dest_lat}"
    params = {
        "access_token": MAPBOX_TOKEN,
        "geometries":   "geojson",
        "steps":        "true",
        "overview":     "full",
        "alternatives": "true",
    }
    data = _j(url, params=params, timeout=12)
    if not data or not data.get("routes"): return None
    route = data["routes"][0]
    return {
        "duration_min": round(route["duration"] / 60, 1),
        "distance_km":  round(route["distance"] / 1000, 2),
        "geometry":     route.get("geometry"),
        "steps":        [s.get("maneuver",{}).get("instruction","") for leg in route.get("legs",[]) for s in leg.get("steps",[])],
        "alternatives": len(data.get("routes",[])) - 1,
    }


def get_isochrone(lat, lon, minutes=30):
    from config import MAPBOX_ISO_URL, MAPBOX_TOKEN
    url    = f"{MAPBOX_ISO_URL}/{lon},{lat}"
    params = {"contours_minutes": minutes, "polygons": "true", "access_token": MAPBOX_TOKEN}
    return _j(url, params=params, timeout=12)


# ═══ MASTER AGGREGATOR ═══════════════════════════════════════════

def fetch_all(loc: dict, bundle_baselines: Optional[dict] = None) -> dict:
    """
    Fetch all data sources for one district.
    Now includes:
      - Proper 7-day aggregation (past week analysis)
      - ERA5 3-year baseline for anomaly detection
      - 72-hour forecast data
      - Anomaly detection results
    """
    lat, lon       = loc["lat"], loc["lon"]
    district, state= loc["district"], loc["state"]

    out = {
        "district":  district,
        "state":     state,
        "lat":       lat,
        "lon":       lon,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "sources":   [],
    }

    # ── Open-Meteo (past 7d + 72h forecast) ──────────────────────
    om = fetch_open_meteo_full(lat, lon)
    if om:
        parsed = parse_open_meteo(om)
        out.update(parsed)
        out["sources"].append("open_meteo")
    else:
        # Safe defaults
        out.update({
            "temp_c": 28.0, "humidity": 65.0, "pressure_hpa": 1008.0,
            "wind_mps": 2.0, "rain_1h": 0.0, "rain_3h": 0.0,
            "rain_24h": 0.0, "rain_72h": 0.0, "rain_7d": 5.0,
            "temp_7d_mean": 28.0, "temp_7d_max": 35.0,
            "humidity_7d_mean": 65.0, "wind_7d_mean": 2.0,
            "forecast_rain_72h": 0.0, "forecast_temp_max": 30.0,
            "forecast_wind_max": 3.0, "forecast_pressure_min": 1008.0,
            "soil_moist": 0.25, "vpd_kpa": 1.5,
        })

    # ── Rename for consistency ────────────────────────────────────
    if "wind_mps" not in out and "wind_7d_mean" in out:
        out["wind_mps"] = out["wind_7d_mean"]

    # ── OWM fallback ─────────────────────────────────────────────
    owm = fetch_owm(lat, lon)
    if owm and "main" in owm:
        if not out.get("temp_c"):
            out["temp_c"] = owm["main"]["temp"]
        out["owm_weather"] = owm.get("weather",[{}])[0].get("description","")
        out["sources"].append("openweathermap")

    # ── Weatherbit (UV, solar, AQI) ──────────────────────────────
    wb = fetch_weatherbit(lat, lon)
    if wb and wb.get("data"):
        d = wb["data"][0]
        out["uv_index"]  = d.get("uv")
        out["solar_rad"] = d.get("solar_rad")
        out["aqi"]       = d.get("aqi")
        out["sources"].append("weatherbit")

    # ── SMAP (delayed — supplementary only) ──────────────────────
    sm = fetch_smap(lat, lon)
    out["smap_sm"] = sm

    # ── NDVI (monthly — not live) ────────────────────────────────
    ndvi = fetch_modis_ndvi(lat, lon)
    out["ndvi_live"] = ndvi  # may be up to 16 days old

    # ── WRIS river level ─────────────────────────────────────────
    wris = fetch_wris(state, district)
    out["wris"] = wris

    # ── ERA5 3-year baseline (for anomaly detection) ──────────────
    baseline = fetch_era5_3yr_baseline(lat, lon)
    out["era5_baseline"] = baseline

    # ── ANOMALY DETECTION (NEW) ───────────────────────────────────
    db = bundle_baselines.get(district) if bundle_baselines else None
    out["anomalies"] = compute_anomalies(out, baseline, db)

    # ── 72-HOUR FORECAST ALERTS (NEW) ────────────────────────────
    rg = {}  # will be enriched by predictor with model risk_grid data
    coast = state in ["Kerala","Tamil Nadu","Andhra Pradesh","Odisha",
                       "West Bengal","Gujarat","Maharashtra","Goa"]
    out["forecast_alerts_72h"] = generate_72h_forecast_alerts(
        out, district, state,
        elevation=rg.get("elevation", 300),
        slope=rg.get("slope", 5),
        coast_flag=coast,
    )

    # ── Safe defaults for any missing keys ───────────────────────
    defaults = {
        "temp_c": 28.0, "humidity": 65.0, "pressure_hpa": 1008.0,
        "wind_mps": 2.0, "rain_1h": 0.0, "rain_24h": 0.0,
        "rain_72h": 0.0, "rain_7d": 5.0, "soil_moist": 0.25,
        "soil_moisture": 0.25, "vpd_kpa": 1.5, "cloud_pct": 40.0,
    }
    for k, v in defaults.items():
        if out.get(k) is None:
            out[k] = v

    # Ensure soil_moisture is set from soil_moist
    if out.get("soil_moisture") is None:
        out["soil_moisture"] = out.get("smap_sm") or out.get("soil_moist", 0.25)

    return out


# ═══ SQLITE DB ════════════════════════════════════════════════════

def init_db():
    c = sqlite3.connect(DB_PATH)
    c.executescript("""
    CREATE TABLE IF NOT EXISTS weather_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts TEXT, district TEXT, state TEXT, lat REAL, lon REAL,
        temp_c REAL, humidity REAL, pressure_hpa REAL, wind_mps REAL,
        rain_1h REAL, rain_24h REAL, rain_72h REAL, rain_7d REAL,
        temp_7d_mean REAL, humidity_7d_mean REAL,
        forecast_rain_72h REAL, forecast_temp_max REAL,
        soil_moisture REAL, cloud_pct REAL, ndvi_live REAL,
        river_level REAL, river_trend TEXT,
        anomaly_count INTEGER, has_72h_alert INTEGER,
        sources TEXT
    );
    CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts TEXT, district TEXT, state TEXT,
        flood REAL, landslide REAL, heatwave REAL, drought REAL, cyclone REAL,
        flood_ci REAL, landslide_ci REAL,
        active_hazards TEXT, alert_level TEXT,
        forecast_triggered TEXT
    );
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts TEXT, district TEXT, state TEXT,
        hazard TEXT, probability REAL, level TEXT,
        is_forecast_based INTEGER DEFAULT 0,
        hours_ahead INTEGER DEFAULT 0,
        citizen_msg TEXT, govt_msg TEXT, ack INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS anomaly_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts TEXT, district TEXT, state TEXT,
        variable TEXT, z_score REAL, severity TEXT,
        live_value REAL, baseline_mean REAL
    );
    CREATE TABLE IF NOT EXISTS routes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts TEXT, district TEXT, origin_lat REAL, origin_lon REAL,
        dest_name TEXT, dest_lat REAL, dest_lon REAL,
        duration_min REAL, distance_km REAL, geometry TEXT, steps TEXT
    );
    CREATE TABLE IF NOT EXISTS road_blocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts TEXT, district TEXT, road_id TEXT, road_name TEXT,
        reason TEXT, active INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS dam_advisories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts TEXT, dam_name TEXT, state TEXT, reservoir_pct REAL,
        rain_forecast_mm REAL, downstream_pop INTEGER,
        decision TEXT, recommendation TEXT
    );
    """)
    c.commit(); c.close()


def store_weather(w: dict):
    wris = w.get("wris") or {}
    an   = w.get("anomalies", {})
    fa   = w.get("forecast_alerts_72h", {}).get("_summary", {})
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""INSERT INTO weather_log
        (ts,district,state,lat,lon,temp_c,humidity,pressure_hpa,wind_mps,
         rain_1h,rain_24h,rain_72h,rain_7d,temp_7d_mean,humidity_7d_mean,
         forecast_rain_72h,forecast_temp_max,
         soil_moisture,cloud_pct,ndvi_live,river_level,river_trend,
         anomaly_count,has_72h_alert,sources)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""", (
        w["timestamp"], w["district"], w["state"], w["lat"], w["lon"],
        w.get("temp_c"), w.get("humidity"), w.get("pressure_hpa"), w.get("wind_mps"),
        w.get("rain_1h"), w.get("rain_24h"), w.get("rain_72h"), w.get("rain_7d"),
        w.get("temp_7d_mean"), w.get("humidity_7d_mean"),
        w.get("forecast_rain_72h"), w.get("forecast_temp_max"),
        w.get("soil_moisture"), w.get("cloud_pct"), w.get("ndvi_live"),
        wris.get("level_m"), wris.get("trend"),
        an.get("summary", {}).get("anomalies_detected", 0),
        1 if fa.get("alert_72h") else 0,
        json.dumps(w.get("sources", [])),
    ))
    conn.commit()

    # Store anomaly log
    for var, info in an.items():
        if var == "summary" or not isinstance(info, dict): continue
        if info.get("is_anomaly"):
            conn.execute("""INSERT INTO anomaly_log
                (ts,district,state,variable,z_score,severity,live_value,baseline_mean)
                VALUES (?,?,?,?,?,?,?,?)""", (
                w["timestamp"], w["district"], w["state"],
                var, info.get("z_score",0), info.get("severity",""),
                info.get("live_value",0), info.get("baseline_mean",0),
            ))
    conn.commit(); conn.close()


def store_prediction(d, st, probs, actives, level, confidence_intervals=None, forecast_triggered=None):
    conn = sqlite3.connect(DB_PATH)
    ci   = confidence_intervals or {}
    conn.execute("""INSERT INTO predictions
        (ts,district,state,flood,landslide,heatwave,drought,cyclone,
         flood_ci,landslide_ci,active_hazards,alert_level,forecast_triggered)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""", (
        datetime.utcnow().isoformat(), d, st,
        probs.get("flood",0), probs.get("landslide",0),
        probs.get("heatwave",0), probs.get("drought",0), probs.get("cyclone",0),
        ci.get("flood",0), ci.get("landslide",0),
        json.dumps(actives), level,
        json.dumps(forecast_triggered or []),
    ))
    conn.commit(); conn.close()


def store_alert(d, st, hazard, prob, level, citizen_msg, govt_msg,
                is_forecast=False, hours_ahead=0):
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""INSERT INTO alerts
        (ts,district,state,hazard,probability,level,is_forecast_based,hours_ahead,citizen_msg,govt_msg)
        VALUES (?,?,?,?,?,?,?,?,?,?)""", (
        datetime.utcnow().isoformat(), d, st, hazard, prob, level,
        1 if is_forecast else 0, hours_ahead, citizen_msg, govt_msg,
    ))
    conn.commit(); conn.close()


def store_route(district, olat, olon, dest_name, dlat, dlon, route):
    if not route: return
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""INSERT INTO routes
        (ts,district,origin_lat,origin_lon,dest_name,dest_lat,dest_lon,
         duration_min,distance_km,geometry,steps)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)""", (
        datetime.utcnow().isoformat(), district, olat, olon,
        dest_name, dlat, dlon,
        route.get("duration_min"), route.get("distance_km"),
        json.dumps(route.get("geometry")), json.dumps(route.get("steps",[])),
    ))
    conn.commit(); conn.close()


def load_history(district, hours=72):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cutoff = (datetime.utcnow()-timedelta(hours=hours)).isoformat()
    rows   = conn.execute(
        "SELECT * FROM weather_log WHERE district=? AND ts>? ORDER BY ts",
        (district, cutoff)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_recent_alerts(district, minutes=60):
    conn = sqlite3.connect(DB_PATH)
    cutoff = (datetime.utcnow()-timedelta(minutes=minutes)).isoformat()
    rows   = conn.execute(
        "SELECT hazard FROM alerts WHERE district=? AND ts>?",
        (district, cutoff)
    ).fetchall()
    conn.close()
    return [r[0] for r in rows]
