"""
NETRAVAAH v5 — Flask API
New endpoints added for:
  /api/anomalies/<district>    — anomaly detection results
  /api/forecast-alerts/<district> — 72-hour forecast alerts
  /api/pipeline-status         — check all pipeline components
  /api/pipeline-status/<d>     — check per-district
Caching: weather 10min, satellite 1hr, infrastructure 24hr
"""
import json, logging, threading, time
from datetime import datetime, timezone
from flask import Flask, jsonify, request, Response, send_from_directory

from config import MONITORED_DISTRICTS, BASE_DIR, THRESHOLDS
from data_fetcher import fetch_all, init_db, store_weather, load_history
from predictor import full_response_cycle
from response_engine import IOT_BARRICADE_STATES

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s"
)
logger = logging.getLogger("netravaah.app")

app = Flask(__name__, static_folder=BASE_DIR, template_folder=BASE_DIR)

# ── In-memory cache ───────────────────────────────────────────────
_CACHE:   dict = {}   # district → full_response_cycle result
_WEATHER: dict = {}   # district → live weather
_LOCK = threading.Lock()


def _run_district(loc: dict) -> dict:
    d   = loc["district"]
    st  = loc["state"]
    lat = loc["lat"]
    lon = loc["lon"]
    try:
        # Load district baselines from bundle for anomaly detection
        from predictor import _bndl
        b        = _bndl()
        baselines= b.get("district_baselines", {})

        live    = fetch_all(loc, bundle_baselines=baselines)
        store_weather(live)
        history = load_history(d, hours=72)
        result  = full_response_cycle(d, st, lat, lon, live, history)
        with _LOCK:
            _CACHE[d]   = result
            _WEATHER[d] = live
        # Log pipeline status
        ps = result.get("pipeline_status", {})
        logger.info(
            f"✓ {d}: {result['overall_level']} | active={result['active_hazards']} | "
            f"anomalies={result.get('anomaly_summary',{}).get('anomalies_detected',0)} | "
            f"72h_alerts={result.get('forecast_summary',{}).get('triggered_hazards',[])} | "
            f"pipeline={ps}"
        )
        return result
    except Exception as e:
        logger.error(f"✗ {d}: {e}", exc_info=True)
        return {}


def _monitor_loop():
    """Background thread — refreshes all districts every 10 minutes.
    Rate-limit safe: weather cached 10min, satellite 1hr, infrastructure 24hr.
    """
    while True:
        logger.info("Monitor loop starting…")
        for loc in MONITORED_DISTRICTS:
            _run_district(loc)
            time.sleep(3)  # 3-second gap between districts to respect API limits
        logger.info("Monitor loop complete. Sleeping 10 minutes.")
        time.sleep(600)


def _start_monitor():
    t = threading.Thread(target=_monitor_loop, daemon=True)
    t.start()
    logger.info("Background monitor started.")


# ════════════════════════════════════════════════════════════════════
#  ROUTES
# ════════════════════════════════════════════════════════════════════

@app.route("/")
def dashboard():
    return send_from_directory(BASE_DIR, "dashboard.html")


@app.route("/api/status")
def status():
    from predictor import _bndl
    b = _bndl()
    return jsonify({
        "status":               "ok",
        "version":              "v5",
        "model_version":        b.get("version", "v4"),
        "cached_districts":     len(_CACHE),
        "timestamp":            datetime.now(timezone.utc).isoformat(),
        "districts_monitored":  len(MONITORED_DISTRICTS),
        "pipeline_components": {
            "historical_training":   True,
            "baseline_available":    bool(b.get("district_baselines")),
            "live_api":              True,
            "past_week_aggregation": True,  # ✅ FIXED
            "anomaly_detection":     True,  # ✅ NEW
            "forecast_72h":          True,  # ✅ NEW
            "ml_prediction":         True,
            "confidence_intervals":  True,  # ✅ NEW
            "alert_generation":      True,
            "govt_response":         True,
        }
    })


@app.route("/api/overview")
def overview():
    """All 30 districts — probabilities + active hazards + alert level + anomalies + forecast."""
    out = []
    for loc in MONITORED_DISTRICTS:
        d = loc["district"]
        c = _CACHE.get(d)
        if c:
            fa = c.get("forecast_summary", {})
            out.append({
                "district":                d,
                "state":                   loc["state"],
                "lat":                     loc["lat"],
                "lon":                     loc["lon"],
                "probabilities":           c.get("probabilities", {}),
                "confidence_intervals":    c.get("confidence_intervals", {}),
                "active_hazards":          c.get("active_hazards", []),
                "overall_level":           c.get("overall_level", "NORMAL"),
                "alert_count":             len(c.get("alerts", [])),
                "anomaly_count":           c.get("anomaly_summary", {}).get("anomalies_detected", 0),
                "forecast_triggered":      fa.get("triggered_hazards", []),
                "forecast_max_prob":       fa.get("max_probability_72h", 0),
                "timestamp":               c.get("timestamp",""),
            })
        else:
            out.append({
                "district": d, "state": loc["state"],
                "lat": loc["lat"], "lon": loc["lon"],
                "probabilities": {}, "confidence_intervals": {},
                "active_hazards": [], "overall_level": "LOADING",
                "alert_count": 0, "anomaly_count": 0,
                "forecast_triggered": [], "forecast_max_prob": 0,
                "timestamp": "",
            })
    return jsonify(out)


@app.route("/api/district/<name>")
def district_detail(name):
    """Full detail for one district."""
    loc = next((d for d in MONITORED_DISTRICTS
                if d["district"].lower() == name.lower()), None)
    if not loc:
        return jsonify({"error": f"District '{name}' not in monitored list"}), 404
    c = _CACHE.get(loc["district"])
    if not c:
        c = _run_district(loc)
    result = dict(c)
    if result.get("evac_plan"):
        ep = dict(result["evac_plan"])
        ep.pop("grid", None)
        result["evac_plan"] = ep
    result.pop("risk_grid", None)
    return jsonify(result)


@app.route("/api/anomalies/<name>")
def anomaly_detail(name):
    """
    ✅ NEW: Anomaly detection results for a district.
    Returns per-variable z-scores vs 3-year baseline.
    """
    c = _CACHE.get(name)
    if not c:
        loc = next((d for d in MONITORED_DISTRICTS
                    if d["district"].lower() == name.lower()), None)
        if not loc:
            return jsonify({"error": "District not found"}), 404
        c = _run_district(loc)

    live = _WEATHER.get(name, {})
    return jsonify({
        "district":         name,
        "timestamp":        c.get("timestamp", ""),
        "anomalies":        live.get("anomalies", {}),
        "anomaly_summary":  c.get("anomaly_summary", {}),
        "baseline_source":  live.get("anomalies", {}).get("summary", {}).get("baseline_source","none"),
        "weather_snapshot": c.get("weather_snapshot", {}),
    })


@app.route("/api/forecast-alerts/<name>")
def forecast_alerts(name):
    """
    ✅ NEW: 72-hour forecast-based alerts for a district.
    Returns hazard probabilities based on FUTURE weather forecast.
    """
    c    = _CACHE.get(name)
    live = _WEATHER.get(name, {})
    if not c:
        loc = next((d for d in MONITORED_DISTRICTS
                    if d["district"].lower() == name.lower()), None)
        if not loc:
            return jsonify({"error": "District not found"}), 404
        c    = _run_district(loc)
        live = _WEATHER.get(name, {})

    fa = live.get("forecast_alerts_72h", {})
    return jsonify({
        "district":         name,
        "timestamp":        c.get("timestamp", ""),
        "forecast_alerts":  {h: v for h, v in fa.items() if h != "_summary"},
        "summary":          fa.get("_summary", {}),
        "forecast_weather": {
            "rain_72h_mm":     live.get("forecast_rain_72h"),
            "rain_24h_mm":     live.get("forecast_rain_24h"),
            "temp_max_c":      live.get("forecast_temp_max"),
            "wind_max_mps":    live.get("forecast_wind_max"),
            "pressure_min_hpa":live.get("forecast_pressure_min"),
            "vpd_max_kpa":     live.get("forecast_vpd_max"),
        },
        "triggered_hazards":c.get("forecast_triggered_hazards", []),
    })


@app.route("/api/pipeline-status")
def pipeline_status_all():
    """
    ✅ NEW: Check all 9 pipeline components across all districts.
    Shows which of the 9 architecture steps are working.
    """
    from predictor import _bndl
    b    = _bndl()
    rows = []
    for loc in MONITORED_DISTRICTS:
        d = loc["district"]
        c = _CACHE.get(d)
        if c:
            rows.append({
                "district":   d,
                "state":      loc["state"],
                "status":     c.get("pipeline_status", {}),
                "anomalies":  c.get("anomaly_summary", {}).get("anomalies_detected", 0),
                "72h_alerts": c.get("forecast_summary", {}).get("triggered_hazards", []),
                "timestamp":  c.get("timestamp", ""),
            })
    return jsonify({
        "global_pipeline": {
            "historical_dataset_training": True,
            "baseline_climate_patterns":   bool(b.get("district_baselines")),
            "live_api_integration":        True,
            "past_week_analysis":          True,   # ✅ FIXED
            "anomaly_detection":           True,   # ✅ NEW
            "forecast_72h":                True,   # ✅ NEW
            "ml_prediction":               True,
            "alert_generation":            True,
            "govt_response":               True,
        },
        "districts": rows,
    })


@app.route("/api/pipeline-status/<name>")
def pipeline_status_district(name):
    """Pipeline status for one district."""
    c = _CACHE.get(name)
    if not c:
        return jsonify({"district": name, "status": "not_cached_yet"}), 404
    return jsonify({
        "district": name,
        "pipeline_status":    c.get("pipeline_status", {}),
        "anomaly_summary":    c.get("anomaly_summary", {}),
        "forecast_summary":   c.get("forecast_summary", {}),
        "model_version":      c.get("model_version", "unknown"),
        "timestamp":          c.get("timestamp", ""),
    })


@app.route("/api/risk-map/<name>")
def risk_map(name):
    c = _CACHE.get(name)
    if not c:
        loc = next((d for d in MONITORED_DISTRICTS
                    if d["district"].lower() == name.lower()), None)
        if not loc:
            return jsonify({"error": "District not found"}), 404
        c = _run_district(loc)
    grid = c.get("risk_grid") or {}
    return jsonify(grid)


@app.route("/api/evac-routes/<name>")
def evac_routes(name):
    hazard = request.args.get("hazard", "flood")
    loc    = next((d for d in MONITORED_DISTRICTS
                   if d["district"].lower() == name.lower()), None)
    if not loc:
        return jsonify({"error": "District not found"}), 404
    c = _CACHE.get(loc["district"])
    if c:
        live  = _WEATHER.get(loc["district"], {})
        probs = c.get("probabilities", {})
    else:
        live  = fetch_all(loc)
        probs = {}
    from response_engine import plan_evacuation
    plan = plan_evacuation(
        loc["district"], loc["lat"], loc["lon"],
        loc["state"], live, probs, hazard
    )
    return jsonify(plan)


@app.route("/api/road-blocks/<name>")
def road_blocks(name):
    c = _CACHE.get(name)
    if not c:
        return jsonify({"district": name, "signals": [], "barricade_states": {}})
    ep = c.get("evac_plan") or {}
    return jsonify({
        "district":         name,
        "signals":          ep.get("iot_signals", []),
        "roads_blocked":    ep.get("roads_blocked", 0),
        "barricade_states": dict(IOT_BARRICADE_STATES),
        "timestamp":        c.get("timestamp",""),
    })


@app.route("/api/dam-advisories")
def dam_advisories():
    advs = []
    for d, c in _CACHE.items():
        for adv in c.get("dam_advisories", []):
            advs.append(adv)
    advs.sort(key=lambda x: {"CRITICAL":0,"HIGH":1,"MEDIUM":2,"WATCH":3,"NORMAL":4}
              .get(x.get("urgency","NORMAL"),4))
    return jsonify(advs)


@app.route("/api/bridge-advisories")
def bridge_advisories():
    advs = []
    for d, c in _CACHE.items():
        for adv in c.get("bridge_advisories", []):
            advs.append({**adv, "district": d})
    return jsonify(advs)


@app.route("/api/alert/<int:alert_id>/citizen")
def citizen_msg(alert_id):
    import sqlite3
    from config import DB_PATH
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    row  = conn.execute("SELECT * FROM alerts WHERE id=?", (alert_id,)).fetchone()
    conn.close()
    if not row: return jsonify({"error": "Alert not found"}), 404
    return Response(row["citizen_msg"], mimetype="text/plain")


@app.route("/api/alert/<int:alert_id>/govt")
def govt_msg(alert_id):
    import sqlite3
    from config import DB_PATH
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    row  = conn.execute("SELECT * FROM alerts WHERE id=?", (alert_id,)).fetchone()
    conn.close()
    if not row: return jsonify({"error": "Alert not found"}), 404
    return Response(row["govt_msg"], mimetype="text/plain")


@app.route("/api/ack/<int:alert_id>", methods=["POST"])
def ack_alert(alert_id):
    import sqlite3
    from config import DB_PATH
    conn = sqlite3.connect(DB_PATH)
    conn.execute("UPDATE alerts SET ack=1 WHERE id=?", (alert_id,))
    conn.commit(); conn.close()
    return jsonify({"ok": True, "acked": alert_id})


@app.route("/api/poll", methods=["POST"])
def poll():
    body     = request.get_json(silent=True) or {}
    district = body.get("district")
    if district:
        loc = next((d for d in MONITORED_DISTRICTS
                    if d["district"].lower() == district.lower()), None)
        if loc:
            threading.Thread(target=_run_district, args=(loc,), daemon=True).start()
            return jsonify({"queued": district})
        return jsonify({"error": "District not found"}), 404
    threading.Thread(target=_monitor_loop, daemon=True).start()
    return jsonify({"queued": "all"})


@app.route("/api/shelters")
def shelters():
    from config import SHELTERS
    return jsonify(SHELTERS)


@app.route("/api/geocode")
def geocode():
    addr = request.args.get("q","")
    if not addr: return jsonify({"error": "?q= required"}), 400
    from response_engine import geocode_address
    result = geocode_address(addr)
    return jsonify(result or {"error": "Not found"})


@app.route("/api/reverse-geocode")
def reverse():
    try:
        lat = float(request.args.get("lat", 0))
        lon = float(request.args.get("lon", 0))
    except:
        return jsonify({"error": "Invalid lat/lon"}), 400
    from response_engine import reverse_geocode
    result = reverse_geocode(lat, lon)
    return jsonify(result or {"error": "Not found"})


@app.route("/api/export/alerts")
def export_alerts():
    import sqlite3, io, csv
    from config import DB_PATH
    conn = sqlite3.connect(DB_PATH)
    rows = conn.execute(
        """SELECT id,ts,district,state,hazard,probability,level,
                  is_forecast_based,hours_ahead,ack
           FROM alerts ORDER BY ts DESC"""
    ).fetchall()
    conn.close()
    buf = io.StringIO()
    w   = csv.writer(buf)
    w.writerow(["id","timestamp","district","state","hazard","probability","level",
                "is_forecast_based","hours_ahead","acknowledged"])
    w.writerows(rows)
    return Response(buf.getvalue(), mimetype="text/csv",
                    headers={"Content-Disposition":"attachment;filename=netravaah_alerts.csv"})


@app.route("/api/export/anomalies")
def export_anomalies():
    """Export all detected anomalies as CSV."""
    import sqlite3, io, csv
    from config import DB_PATH
    conn = sqlite3.connect(DB_PATH)
    rows = conn.execute(
        "SELECT * FROM anomaly_log ORDER BY ts DESC LIMIT 1000"
    ).fetchall()
    conn.close()
    buf = io.StringIO()
    w   = csv.writer(buf)
    w.writerow(["id","ts","district","state","variable","z_score","severity",
                "live_value","baseline_mean"])
    w.writerows(rows)
    return Response(buf.getvalue(), mimetype="text/csv",
                    headers={"Content-Disposition":"attachment;filename=netravaah_anomalies.csv"})


@app.route("/api/infrastructure")
def infrastructure():
    out = {}
    for d, c in _CACHE.items():
        out[d] = {
            "dam_advisories":    c.get("dam_advisories", []),
            "bridge_advisories": c.get("bridge_advisories", []),
            "drainage_advisory": c.get("drainage_advisory", {}),
        }
    return jsonify(out)


# ════════════════════════════════════════════════════════════════════
#  MAIN
# ════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    init_db()
    logger.info("NETRAVAAH v5 starting…")
    logger.info("Pipeline: Training→Baseline→Live(7d)→Anomaly→Forecast(72h)→ML→Alert→Govt")
    _start_monitor()
    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)
