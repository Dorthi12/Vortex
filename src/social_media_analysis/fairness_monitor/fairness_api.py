"""
fairness_api.py — NETRAVAAH Fairness Monitor v2.0
==================================================
Complete API for autonomous fairness system.

Part 1 - Citizen Feedback Loop
Part 2 - Bias Detection
Part 3 - Autonomous System (monitoring + healing + followup)
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from feedback_collector import (
    submit_citizen_feedback, submit_government_action,
    get_complaint_feedback,
)
from resolution_tracker import (
    auto_detect_resolutions, get_overall_resolution_stats,
    get_resolution_by_state, get_resolution_by_issue,
    calculate_resolution_confidence,
)
from bias_detector import (
    detect_language_bias, detect_rural_urban_bias, run_full_bias_check,
)
from fairness_agent import investigate_fairness, get_latest_fairness_report
from autonomous_fairness_system import (
    run_autonomous_cycle, get_latest_cycle_log, get_active_alerts,
    get_bias_trend, get_correction_history, acknowledge_alert,
)
from pymongo import MongoClient
from datetime import datetime
import os
from dotenv import load_dotenv
load_dotenv()

app = FastAPI(
    title="NETRAVAAH Fairness Monitor",
    description="Autonomous fairness: continuous monitoring + self healing + citizen follow-up",
    version="2.0.0",
)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

_client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/"))
_db     = _client["netravaah"]


class CitizenFeedbackRequest(BaseModel):
    post_id: str; resolved: bool
    stars: Optional[int] = None; days_to_fix: Optional[int] = None
    comment: Optional[str] = None; citizen_id: Optional[str] = None

class GovernmentActionRequest(BaseModel):
    post_id: str; resolved: bool; action_taken: str
    department: Optional[str] = None; officer_id: Optional[str] = None
    days_taken: Optional[int] = None


@app.get("/")
def root():
    return {"module": "Fairness Monitor", "project": "NETRAVAAH",
            "version": "2.0.0", "system": "Autonomous — runs every hour"}


# --------------------------------------------------
# Part 1 — Citizen Feedback
# --------------------------------------------------

@app.post("/fairness/feedback/citizen")
def citizen_feedback(r: CitizenFeedbackRequest):
    try:
        result = submit_citizen_feedback(r.post_id, r.resolved, r.stars, r.days_to_fix, r.comment, r.citizen_id)
        return {"success": True, "message": "Thank you for your feedback", "feedback": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/fairness/feedback/government")
def government_action(r: GovernmentActionRequest):
    result = submit_government_action(r.post_id, r.resolved, r.action_taken, r.department, r.officer_id, r.days_taken)
    return {"success": True, "message": "Action recorded", "action": result}


@app.get("/fairness/feedback/{post_id}")
def get_feedback(post_id: str):
    result = get_complaint_feedback(post_id)
    result["resolution_confidence"] = calculate_resolution_confidence(post_id)
    return result


@app.get("/fairness/resolution/stats")
def resolution_stats(days: int = 30):
    return get_overall_resolution_stats(days)


@app.get("/fairness/resolution/by-state")
def by_state(days: int = 30):
    return {"period_days": days, "by_state": get_resolution_by_state(days)}


@app.get("/fairness/resolution/by-issue")
def by_issue(days: int = 30):
    return {"period_days": days, "by_issue": get_resolution_by_issue(days)}


# --------------------------------------------------
# Part 2 — Bias Detection
# --------------------------------------------------

@app.get("/fairness/bias/language")
def language_bias(days: int = 30):
    return detect_language_bias(days)


@app.get("/fairness/bias/rural-urban")
def rural_urban_bias(days: int = 30):
    return detect_rural_urban_bias(days)


@app.get("/fairness/bias/full")
def full_bias(days: int = 30):
    return run_full_bias_check(days)


@app.post("/fairness/investigate/sync")
def investigate_sync():
    result = investigate_fairness()
    if "error" in result:
        raise HTTPException(status_code=500, detail=result.get("error"))
    return result


@app.get("/fairness/report/latest")
def latest_report():
    return get_latest_fairness_report()


# --------------------------------------------------
# Part 3 — Autonomous System
# --------------------------------------------------

@app.post("/fairness/autonomous/run")
def trigger_cycle(background_tasks: BackgroundTasks):
    """Manually trigger one autonomous cycle (background)."""
    background_tasks.add_task(run_autonomous_cycle)
    return {"message": "Cycle triggered", "fetch_at": "/fairness/autonomous/status"}


@app.post("/fairness/autonomous/run/sync")
def trigger_cycle_sync():
    """Trigger autonomous cycle and wait for result. Good for demo."""
    return run_autonomous_cycle()


@app.get("/fairness/autonomous/status")
def autonomous_status():
    """Latest autonomous cycle log — what the agent did last run."""
    return get_latest_cycle_log()


@app.get("/fairness/autonomous/alerts")
def get_alerts(acknowledged: bool = False, limit: int = 20):
    """Active bias alerts from continuous monitoring."""
    alerts = get_active_alerts(acknowledged)
    return {"total": len(alerts), "alerts": alerts[:limit]}


@app.post("/fairness/autonomous/alert/{alert_id}/acknowledge")
def ack_alert(alert_id: str):
    """Government acknowledges a bias alert."""
    if not acknowledge_alert(alert_id):
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"success": True}


@app.get("/fairness/autonomous/trend")
def bias_trend(days: int = 7):
    """Bias trend over time — is it improving or worsening?"""
    trend = get_bias_trend(days)
    return {"period_days": days, "data_points": len(trend), "trend": trend}


@app.get("/fairness/autonomous/corrections")
def correction_history(days: int = 7):
    """Audit trail of all auto corrections applied by self healing agent."""
    corrections = get_correction_history(days)
    return {"period_days": days, "total": len(corrections), "corrections": corrections}


# --------------------------------------------------
# Dashboard
# --------------------------------------------------

@app.get("/fairness/dashboard")
def dashboard(days: int = 30):
    """Complete fairness dashboard in one call."""
    resolution    = get_overall_resolution_stats(days)
    language      = detect_language_bias(days)
    rural_urban   = detect_rural_urban_bias(days)
    latest_cycle  = get_latest_cycle_log()
    active_alerts = get_active_alerts(False)
    trend         = get_bias_trend(7)
    corrections   = get_correction_history(7)
    all_biases    = language.get("biases_found", []) + rural_urban.get("biases_found", [])

    return {
        "period_days":     days,
        "system_status":   latest_cycle.get("overall_status", "Unknown"),
        "last_cycle_at":   latest_cycle.get("run_at"),
        "resolution_stats":resolution,
        "bias_summary": {
            "total_biases":  len(all_biases),
            "bias_detected": len(all_biases) > 0,
            "severity":      "High" if any(b.get("severity") == "High" for b in all_biases)
                             else "Medium" if all_biases else "None",
            "biases":        all_biases,
        },
        "active_alerts":   len(active_alerts),
        "alerts":          active_alerts[:5],
        "bias_trend_7d":   trend,
        "corrections_7d":  len(corrections),
        "generated_at":    datetime.utcnow().isoformat(),
    }


@app.get("/health")
def health():
    try:
        _db["social_signals"].find_one()
        db = "connected"
    except Exception:
        db = "disconnected"
    latest = get_latest_cycle_log()
    return {
        "status":        "ok",
        "database":      db,
        "groq_api":      "configured" if os.getenv("GROQ_API_KEY") else "missing",
        "autonomous":    "running" if latest.get("run_at") else "not started",
        "last_cycle":    latest.get("run_at"),
        "system_status": latest.get("overall_status", "Unknown"),
        "timestamp":     datetime.utcnow().isoformat(),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002, reload=True)
