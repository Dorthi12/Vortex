"""
resource_api.py
===============
FastAPI endpoints for Resource Mismanagement Monitor.
Includes agentic AI investigation endpoints.

Endpoints:
    GET  /resource/district/{state}/{district}     - full district report
    GET  /resource/state/{state}                   - state summary
    GET  /resource/critical                        - all critical districts
    GET  /resource/scores/{state}/{district}       - resource scores only
    POST /resource/analyze/{state}/{district}      - trigger fresh analysis
    POST /resource/analyze-all                     - analyze all districts
    GET  /resource/map                             - map data
    GET  /resource/aqi                             - live AQI
    POST /resource/investigate/{state}/{district}  - AI agent investigation
    GET  /resource/investigation/{state}/{district}- get saved AI investigation
    GET  /resource/investigations/critical         - all critical AI investigations
    GET  /health
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from report_generator import (
    get_district_report,
    get_critical_districts,
    get_state_summary,
    generate_district_report,
    generate_all_reports,
)
from mismatch_detector import full_mismatch_analysis
from agentic_investigator import investigate_and_save


from pymongo import MongoClient
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="NETRAVAAH Resource Monitor",
    description="AI powered resource mismanagement detection with agentic investigation",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_client  = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/"))
_db      = _client["netravaah"]
_reports = _db["resource_reports"]
_invest  = _db["ai_investigations"]


# --------------------------------------------------
# Existing endpoints
# --------------------------------------------------

@app.get("/")
def root():
    return {
        "module":  "Resource Mismanagement Monitor",
        "project": "NETRAVAAH",
        "version": "2.0.0",
        "status":  "running",
        "ai":      "Groq llama-3.3-70b agentic investigator active",
    }


@app.get("/resource/district/{state}/{district}")
def get_district(state: str, district: str):
    """
    Get full resource mismanagement report for a district.
    Includes rule based analysis + AI investigation if available.
    """
    report = get_district_report(district, state)
    if not report:
        report = generate_district_report(district, state)
    if "error" in report:
        raise HTTPException(status_code=404, detail=report["error"])

    # Attach AI investigation if exists
    ai = _invest.find_one(
        {"district": {"$regex": district, "$options": "i"},
         "state":    {"$regex": state,    "$options": "i"}},
        {"_id": 0, "history": 0}
    )
    if ai:
        report["ai_investigation"] = ai

    return report


@app.get("/resource/state/{state}")
def get_state(state: str):
    summary = get_state_summary(state)
    if "error" in summary:
        raise HTTPException(status_code=404, detail=summary["error"])
    return summary


@app.get("/resource/critical")
def get_critical(limit: int = 50):
    districts = get_critical_districts()
    return {"total": len(districts), "districts": districts[:limit]}


@app.get("/resource/scores/{state}/{district}")
def get_scores(state: str, district: str):
    report = get_district_report(district, state)
    if not report:
        raise HTTPException(status_code=404, detail=f"No report for {district}, {state}")
    return {
        "district":        district,
        "state":           state,
        "severity":        report["severity"],
        "resource_scores": report["resource_scores"],
        "issues_count":    report["issues_count"],
        "lat":             report.get("lat"),
        "lng":             report.get("lng"),
    }


@app.post("/resource/analyze/{state}/{district}")
def trigger_analysis(state: str, district: str, background_tasks: BackgroundTasks):
    background_tasks.add_task(generate_district_report, district, state)
    return {"message": f"Analysis triggered for {district}, {state}", "status": "processing"}


@app.post("/resource/analyze-all")
def trigger_full_analysis(background_tasks: BackgroundTasks):
    background_tasks.add_task(generate_all_reports)
    return {"message": "Full India analysis triggered", "status": "processing"}


@app.get("/resource/map")
def get_map_data(severity: str = None):
    query = {"lat": {"$ne": None}, "lng": {"$ne": None}}
    if severity:
        query["severity"] = severity
    districts = list(_reports.find(query, {
        "_id": 0, "district": 1, "state": 1, "lat": 1, "lng": 1,
        "severity": 1, "issues_count": 1, "resource_scores": 1,
    }))
    return {"total": len(districts), "districts": districts}


@app.get("/resource/aqi")
def get_aqi_data(limit: int = 20):
    cities = list(_db["aqi_data"].find(
        {},
        {"_id": 0, "city": 1, "aqi": 1, "category": 1, "lat": 1, "lng": 1, "updated_at": 1}
    ).sort("aqi", -1).limit(limit))
    return {"total": len(cities), "cities": cities}


# --------------------------------------------------
# NEW — Agentic AI Investigation Endpoints
# --------------------------------------------------

@app.post("/resource/investigate/{state}/{district}")
def trigger_investigation(
    state:            str,
    district:         str,
    background_tasks: BackgroundTasks,
):
    """
    Trigger AI agent to investigate a specific district.

    The agent will:
    1. Fetch citizen complaints
    2. Check weather, electricity, AQI, vegetation data
    3. Analyze trends
    4. Generate root cause analysis
    5. Provide long term government resolution steps

    Runs in background. Fetch results from:
    GET /resource/investigation/{state}/{district}
    """
    background_tasks.add_task(investigate_and_save, district, state)
    return {
        "message":  f"AI agent investigating {district}, {state}",
        "status":   "processing",
        "fetch_at": f"/resource/investigation/{state}/{district}",
    }


@app.post("/resource/investigate/{state}/{district}/sync")
def investigate_sync(state: str, district: str):
    """
    Trigger AI agent investigation and wait for result.
    Returns complete investigation report synchronously.
    Use for real time demo or when you need immediate results.
    """
    result = investigate_and_save(district, state)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result


@app.get("/resource/investigation/{state}/{district}")
def get_investigation(state: str, district: str):
    """
    Get saved AI investigation for a district.
    Shows root cause analysis and long term resolution.
    """
    result = _invest.find_one(
        {
            "district": {"$regex": district, "$options": "i"},
            "state":    {"$regex": state,    "$options": "i"},
        },
        {"_id": 0, "history": 0}
    )
    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"No investigation found for {district}, {state}. "
                   f"Trigger one at POST /resource/investigate/{state}/{district}"
        )
    return result


@app.get("/resource/investigations/critical")
def get_critical_investigations(limit: int = 20):
    """
    Get all districts with Critical or High severity from AI investigations.
    Government priority action list.
    """
    investigations = list(_invest.find(
        {"severity": {"$in": ["Critical", "High"]}},
        {
            "_id":          0,
            "district":     1,
            "state":        1,
            "severity":     1,
            "issues_found": 1,
            "root_cause_analysis.primary_cause": 1,
            "immediate_actions": 1,
            "citizen_impact":    1,
            "investigated_at":   1,
        }
    ).sort("investigated_at", -1).limit(limit))

    return {
        "total":           len(investigations),
        "investigations":  investigations,
    }


@app.get("/resource/investigations/all")
def get_all_investigations(limit: int = 50):
    """Get all saved AI investigations."""
    investigations = list(_invest.find(
        {},
        {"_id": 0, "history": 0}
    ).sort("investigated_at", -1).limit(limit))
    return {"total": len(investigations), "investigations": investigations}


@app.post("/resource/investigate-state/{state}")
def investigate_state(state: str, background_tasks: BackgroundTasks, limit: int = 10):
    """
    Trigger AI investigation for top N critical districts in a state.
    Runs in background.
    """
    # Get most critical districts in this state
    critical = list(_reports.find(
        {
            "state":    {"$regex": state, "$options": "i"},
            "severity": {"$in": ["Critical", "High"]},
        },
        {"district": 1, "state": 1, "_id": 0}
    ).sort("issues_count", -1).limit(limit))

    if not critical:
        raise HTTPException(
            status_code=404,
            detail=f"No critical districts found in {state}"
        )

    for d in critical:
        background_tasks.add_task(investigate_and_save, d["district"], d["state"])

    return {
        "message":    f"Investigating {len(critical)} critical districts in {state}",
        "districts":  [d["district"] for d in critical],
        "status":     "processing",
    }


@app.get("/health")
def health():
    try:
        _reports.find_one()
        db = "connected"
    except Exception:
        db = "disconnected"

    groq_key = "configured" if os.getenv("GROQ_API_KEY") else "missing"

    return {
        "status":     "ok",
        "database":   db,
        "groq_api":   groq_key,
        "timestamp":  datetime.utcnow().isoformat(),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=True)
