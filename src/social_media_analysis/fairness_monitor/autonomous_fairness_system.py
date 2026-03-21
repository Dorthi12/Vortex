"""
autonomous_fairness_system.py
=============================
Complete autonomous fairness system combining:

1. Continuous Monitoring Agent  → detects bias every hour
2. Self Healing Agent           → fixes bias automatically  
3. Resolution Follow-up Agent   → contacts citizens, closes loop

All three work together as one system.
Runs in background via scheduler.
No human needed for routine operations.

Uses Groq API (llama-3.3-70b).
"""

import requests
import json
import os
from datetime import datetime, timedelta
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

_client  = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/"))
_db      = _client["netravaah"]
_signals = _db["social_signals"]
_feedback= _db["complaint_feedback"]
_alerts  = _db["fairness_alerts"]
_fixes   = _db["bias_corrections"]
_followup= _db["resolution_followups"]
_monitor = _db["bias_monitor_log"]

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL   = "llama-3.3-70b-versatile"

# Bias thresholds
WATCH_THRESHOLD   = 10.0   # log and monitor
WARNING_THRESHOLD = 20.0   # send warning
CRITICAL_THRESHOLD= 30.0   # immediate action + auto correction

# Resolution thresholds
FOLLOWUP_AFTER_DAYS  = 3   # follow up if no citizen response
ESCALATE_AFTER_DAYS  = 7   # escalate if no govt action
AUTOCLOSE_AFTER_DAYS = 14  # auto close if no response after govt resolved


# ==================================================
# SHARED TOOLS (used by all three agents)
# ==================================================

def get_recent_complaints(hours: int = 1) -> dict:
    """Get complaints from last N hours with language and location info."""
    since = (datetime.utcnow() - timedelta(hours=hours)).isoformat()

    complaints = list(_signals.find(
        {"nlp_processed": True, "processed_at": {"$gte": since}},
        {"_id": 0, "post_id": 1, "text": 1, "priority_score": 1,
         "confidence": 1, "final_issue": 1, "locations": 1,
         "resolution_status": 1, "sentiment": 1}
    ))

    hindi   = []
    english = []
    mixed   = []

    for c in complaints:
        text  = c.get("text", "")
        deva  = sum(1 for ch in text if "\u0900" <= ch <= "\u097F")
        ratio = deva / max(len(text.strip()), 1)
        lang  = "hindi" if ratio > 0.3 else "mixed" if ratio > 0.05 else "english"
        c["language"] = lang
        if lang == "hindi":   hindi.append(c)
        elif lang == "english":english.append(c)
        else:                  mixed.append(c)

    def avg_priority(lst):
        scores = [c["priority_score"] for c in lst if c.get("priority_score")]
        return round(sum(scores) / len(scores), 4) if scores else 0

    return {
        "total":          len(complaints),
        "hours_checked":  hours,
        "hindi_count":    len(hindi),
        "english_count":  len(english),
        "mixed_count":    len(mixed),
        "hindi_avg_priority":   avg_priority(hindi),
        "english_avg_priority": avg_priority(english),
        "mixed_avg_priority":   avg_priority(mixed),
        "fetched_at":     datetime.utcnow().isoformat(),
    }


def get_bias_baseline(days: int = 7) -> dict:
    """Get baseline bias scores from last 7 days for comparison."""
    since = (datetime.utcnow() - timedelta(days=days)).isoformat()

    complaints = list(_signals.find(
        {"nlp_processed": True, "processed_at": {"$gte": since}, "text": {"$exists": True}},
        {"_id": 0, "text": 1, "priority_score": 1}
    ))

    hindi_scores   = []
    english_scores = []

    for c in complaints:
        text  = c.get("text", "")
        deva  = sum(1 for ch in text if "\u0900" <= ch <= "\u097F")
        ratio = deva / max(len(text.strip()), 1)
        score = c.get("priority_score", 0)
        if ratio > 0.3:    hindi_scores.append(score)
        elif ratio <= 0.05: english_scores.append(score)

    hindi_avg   = round(sum(hindi_scores)   / len(hindi_scores),   4) if hindi_scores   else 0
    english_avg = round(sum(english_scores) / len(english_scores), 4) if english_scores else 0

    bias_pct = abs(english_avg - hindi_avg) / english_avg * 100 if english_avg > 0 else 0

    return {
        "period_days":   days,
        "hindi_avg":     hindi_avg,
        "english_avg":   english_avg,
        "bias_pct":      round(bias_pct, 2),
        "hindi_count":   len(hindi_scores),
        "english_count": len(english_scores),
    }


def get_rural_urban_stats(hours: int = 1) -> dict:
    """Get rural vs urban priority comparison for recent complaints."""
    since   = (datetime.utcnow() - timedelta(hours=hours)).isoformat()
    hazard  = _db["hazard_data"]

    district_density = {}
    for d in hazard.find({}, {"district": 1, "population_density": 1, "_id": 0}):
        district_density[d["district"].lower()] = d.get("population_density", 0) or 0

    complaints = list(_signals.find(
        {"nlp_processed": True, "processed_at": {"$gte": since}, "locations.0": {"$exists": True}},
        {"_id": 0, "locations": 1, "priority_score": 1}
    ))

    urban  = []
    rural  = []

    for c in complaints:
        district = (c.get("locations") or [{}])[0].get("name", "").lower()
        density  = district_density.get(district, 0)
        score    = c.get("priority_score", 0)
        if density >= 500: urban.append(score)
        else:              rural.append(score)

    rural_avg = round(sum(rural)  / len(rural),  4) if rural  else 0
    urban_avg = round(sum(urban) / len(urban), 4) if urban else 0
    bias_pct  = abs(urban_avg - rural_avg) / urban_avg * 100 if urban_avg > 0 else 0

    return {
        "rural_count":  len(rural),
        "urban_count":  len(urban),
        "rural_avg":    rural_avg,
        "urban_avg":    urban_avg,
        "bias_pct":     round(bias_pct, 2),
        "hours_checked":hours,
    }


def get_previous_alerts(hours: int = 24) -> list:
    """Get alerts from last N hours to avoid duplicate alerts."""
    since  = (datetime.utcnow() - timedelta(hours=hours)).isoformat()
    alerts = list(_alerts.find(
        {"created_at": {"$gte": since}},
        {"_id": 0, "type": 1, "severity": 1, "bias_pct": 1, "created_at": 1}
    ).sort("created_at", -1).limit(10))
    return alerts


def apply_language_correction(correction_factor: float, min_score: float = 0.0) -> dict:
    """
    Apply correction factor to Hindi complaints.
    Self healing action taken by agent.
    """
    since = (datetime.utcnow() - timedelta(days=1)).isoformat()

    hindi_complaints = list(_signals.find(
        {
            "nlp_processed": True,
            "processed_at":  {"$gte": since},
            "priority_score":{"$lt": min_score if min_score > 0 else 1.0},
        },
        {"_id": 1, "post_id": 1, "text": 1, "priority_score": 1}
    ))

    corrected = 0
    for c in hindi_complaints:
        text  = c.get("text", "")
        deva  = sum(1 for ch in text if "\u0900" <= ch <= "\u097F")
        ratio = deva / max(len(text.strip()), 1)

        if ratio > 0.3:
            old_score = c.get("priority_score", 0)
            new_score = min(round(old_score + correction_factor, 3), 1.0)

            _signals.update_one(
                {"_id": c["_id"]},
                {"$set": {
                    "priority_score":    new_score,
                    "bias_corrected":    True,
                    "correction_factor": correction_factor,
                    "original_score":    old_score,
                    "corrected_at":      datetime.utcnow().isoformat(),
                }}
            )
            corrected += 1

    _fixes.insert_one({
        "type":              "language_correction",
        "correction_factor": correction_factor,
        "complaints_fixed":  corrected,
        "applied_at":        datetime.utcnow().isoformat(),
    })

    return {
        "action":            "language_correction_applied",
        "correction_factor": correction_factor,
        "complaints_fixed":  corrected,
    }


def get_pending_followups() -> dict:
    """Get complaints that need citizen follow-up."""
    followup_since = (datetime.utcnow() - timedelta(days=FOLLOWUP_AFTER_DAYS)).isoformat()
    escalate_since = (datetime.utcnow() - timedelta(days=ESCALATE_AFTER_DAYS)).isoformat()
    close_since    = (datetime.utcnow() - timedelta(days=AUTOCLOSE_AFTER_DAYS)).isoformat()

    # Need citizen followup: govt resolved but citizen not confirmed
    need_followup = list(_signals.find(
        {
            "nlp_processed":     True,
            "govt_resolved":     True,
            "citizen_confirmed": {"$exists": False},
            "processed_at":      {"$lte": followup_since},
            "resolution_status": "RESOLVED_PENDING",
        },
        {"_id": 0, "post_id": 1, "final_issue": 1, "locations": 1,
         "priority_score": 1, "processed_at": 1}
    ).limit(50))

    # Need escalation: no govt action after 7 days
    need_escalation = list(_signals.find(
        {
            "nlp_processed":  True,
            "govt_resolved":  {"$exists": False},
            "processed_at":   {"$lte": escalate_since},
            "resolution_status": {"$in": ["OPEN", "IN_PROGRESS", None]},
        },
        {"_id": 0, "post_id": 1, "final_issue": 1, "locations": 1, "priority_score": 1}
    ).limit(50))

    # Auto close: resolved + no response after 14 days
    auto_close = list(_signals.find(
        {
            "nlp_processed":  True,
            "govt_resolved":  True,
            "processed_at":   {"$lte": close_since},
            "resolution_status": "RESOLVED_PENDING",
        },
        {"_id": 0, "post_id": 1, "final_issue": 1}
    ).limit(50))

    return {
        "need_followup":    len(need_followup),
        "need_escalation":  len(need_escalation),
        "auto_close":       len(auto_close),
        "followup_samples": need_followup[:5],
        "escalation_samples":need_escalation[:5],
    }


def process_followups(action: str, post_ids: list, reason: str = "") -> dict:
    """
    Process follow-up actions decided by the agent.

    Actions:
      send_followup   → mark as followup sent
      escalate        → mark as escalated
      auto_close      → mark as auto closed
    """
    processed = 0

    status_map = {
        "send_followup": "RESOLVED_PENDING",
        "escalate":      "ESCALATED",
        "auto_close":    "RESOLVED_TIMEOUT",
    }

    new_status = status_map.get(action, "RESOLVED_PENDING")

    for post_id in post_ids:
        _signals.update_one(
            {"post_id": post_id},
            {"$set": {
                "resolution_status": new_status,
                "followup_action":   action,
                "followup_reason":   reason,
                "followup_at":       datetime.utcnow().isoformat(),
            }}
        )
        _followup.insert_one({
            "post_id":    post_id,
            "action":     action,
            "reason":     reason,
            "processed_at":datetime.utcnow().isoformat(),
        })
        processed += 1

    return {
        "action":    action,
        "processed": processed,
        "status":    new_status,
    }


def save_alert(alert_type: str, severity: str, bias_pct: float, message: str, action_taken: str = None) -> dict:
    """Save a bias alert to MongoDB."""
    alert = {
        "type":         alert_type,
        "severity":     severity,
        "bias_pct":     bias_pct,
        "message":      message,
        "action_taken": action_taken,
        "created_at":   datetime.utcnow().isoformat(),
        "acknowledged": False,
    }
    _alerts.insert_one(alert)
    _alerts.create_index("created_at")
    print(f"  Alert saved: [{severity}] {message}")
    return alert


# ==================================================
# TOOL DEFINITIONS FOR AGENT
# ==================================================

TOOLS = [
    {
        "type": "function",
        "function": {
            "name":        "get_recent_complaints",
            "description": "Get complaints from last N hours with language breakdown and average priority scores. Use this to check current bias levels.",
            "parameters": {
                "type": "object",
                "properties": {
                    "hours": {"type": "integer", "description": "Hours to look back, default 1"}
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name":        "get_bias_baseline",
            "description": "Get baseline bias scores from last 7 days to compare against current levels. Use this to determine if current bias is worse than normal.",
            "parameters": {
                "type": "object",
                "properties": {
                    "days": {"type": "integer", "description": "Days for baseline, default 7"}
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name":        "get_rural_urban_stats",
            "description": "Get rural vs urban priority score comparison for recent complaints.",
            "parameters": {
                "type": "object",
                "properties": {
                    "hours": {"type": "integer", "description": "Hours to look back, default 1"}
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name":        "get_previous_alerts",
            "description": "Check what alerts were already sent in last 24 hours to avoid duplicates.",
            "parameters": {
                "type": "object",
                "properties": {
                    "hours": {"type": "integer", "description": "Hours to look back, default 24"}
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name":        "apply_language_correction",
            "description": "Apply a correction factor to Hindi complaint priority scores to fix language bias. Only use when bias is Critical (>30%). correction_factor should be between 0.05 and 0.20.",
            "parameters": {
                "type": "object",
                "properties": {
                    "correction_factor": {
                        "type":        "number",
                        "description": "Amount to add to Hindi priority scores, between 0.05 and 0.20"
                    },
                    "min_score": {
                        "type":        "number",
                        "description": "Only correct complaints below this score, e.g. 0.6"
                    },
                },
                "required": ["correction_factor"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name":        "get_pending_followups",
            "description": "Get all complaints that need follow-up action. Returns complaints needing citizen notification, escalation or auto-close.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name":        "process_followups",
            "description": "Take follow-up action on complaints. Actions: send_followup (notify citizen), escalate (no govt action), auto_close (timeout).",
            "parameters": {
                "type": "object",
                "properties": {
                    "action":   {
                        "type":        "string",
                        "enum":        ["send_followup", "escalate", "auto_close"],
                        "description": "Action to take"
                    },
                    "post_ids": {
                        "type":        "array",
                        "items":       {"type": "string"},
                        "description": "List of post IDs to process"
                    },
                    "reason":   {
                        "type":        "string",
                        "description": "Reason for this action"
                    },
                },
                "required": ["action", "post_ids"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name":        "save_alert",
            "description": "Save a bias alert to the system. Use this to record findings even when not taking action.",
            "parameters": {
                "type": "object",
                "properties": {
                    "alert_type":   {"type": "string", "description": "language_bias or rural_urban_bias"},
                    "severity":     {"type": "string", "enum": ["Watch", "Warning", "Critical"]},
                    "bias_pct":     {"type": "number", "description": "Bias percentage detected"},
                    "message":      {"type": "string", "description": "Human readable alert message"},
                    "action_taken": {"type": "string", "description": "What action was taken if any"},
                },
                "required": ["alert_type", "severity", "bias_pct", "message"],
            },
        },
    },
]

TOOL_MAP = {
    "get_recent_complaints":    get_recent_complaints,
    "get_bias_baseline":        get_bias_baseline,
    "get_rural_urban_stats":    get_rural_urban_stats,
    "get_previous_alerts":      get_previous_alerts,
    "apply_language_correction":apply_language_correction,
    "get_pending_followups":    get_pending_followups,
    "process_followups":        process_followups,
    "save_alert":               save_alert,
}


def execute_tool(name: str, arguments: dict) -> str:
    func = TOOL_MAP.get(name)
    if not func:
        return json.dumps({"error": f"Unknown tool: {name}"})
    try:
        result = func(**arguments)
        return json.dumps(result, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})


# ==================================================
# THE AUTONOMOUS AGENT
# ==================================================

SYSTEM_PROMPT = """You are an autonomous fairness monitor for a civic complaint AI system in India.

You run every hour and have THREE jobs:

JOB 1 - CONTINUOUS MONITORING:
  Check if bias is emerging in recent complaints
  Compare Hindi vs English priority scores
  Compare rural vs urban priority scores
  Classify severity:
    < 10% difference  → Healthy, just log
    10-20% difference → Warning, save alert
    > 20% difference  → Critical, take action

JOB 2 - SELF HEALING:
  If bias is Critical (>20%):
    Apply correction factor to affected complaints automatically
    Verify correction worked
    Save what you did to audit log
  Use correction_factor between 0.05 (small fix) and 0.20 (large fix)
  Only correct complaints from last 24 hours
  Do NOT over-correct - check baseline first

JOB 3 - RESOLUTION FOLLOW-UP:
  Check pending followups
  For complaints where govt resolved but citizen not confirmed (3+ days):
    Mark for citizen followup notification
  For complaints with no govt action (7+ days):
    Escalate them
  For complaints resolved but timed out (14+ days):
    Auto close them
  Process these actions using process_followups tool

DECISION RULES:
  Always check previous alerts first to avoid duplicates
  Always check baseline before deciding bias is serious
  Apply corrections proportionally to bias severity
  Process ALL pending followups every run
  Save alerts for every finding even if no action taken

After completing all three jobs provide summary as JSON:
{
  "run_at": "ISO timestamp",
  "monitoring": {
    "language_bias_pct": 0.0,
    "rural_urban_bias_pct": 0.0,
    "severity": "Healthy/Warning/Critical",
    "action_taken": "none/alert_saved/correction_applied"
  },
  "self_healing": {
    "corrections_applied": true/false,
    "complaints_fixed": 0,
    "correction_factor": 0.0
  },
  "followup": {
    "followups_sent": 0,
    "escalated": 0,
    "auto_closed": 0
  },
  "overall_status": "Healthy/Warning/Critical",
  "next_action": "what should happen next run"
}

Return ONLY the JSON."""


def run_autonomous_cycle() -> dict:
    """
    Run one complete autonomous cycle.
    Handles monitoring + self healing + followup.
    Called every hour by scheduler.
    """
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Autonomous fairness cycle starting...")

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role":    "user",
            "content": f"Run your complete autonomous cycle now. Current time: {datetime.utcnow().isoformat()}. Check bias in recent complaints, apply corrections if needed, and process all pending followups.",
        }
    ]

    max_iterations = 12
    iteration      = 0
    tools_called   = []

    while iteration < max_iterations:
        iteration += 1

        try:
            response = requests.post(
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type":  "application/json",
                },
                json={
                    "model":       GROQ_MODEL,
                    "messages":    messages,
                    "tools":       TOOLS,
                    "tool_choice": "auto",
                    "max_tokens":  2000,
                    "temperature": 0.1,
                },
                timeout=60,
            )

            if response.status_code != 200:
                print(f"  Groq error: {response.status_code}")
                break

            data    = response.json()
            message = data["choices"][0]["message"]
            reason  = data["choices"][0]["finish_reason"]

            messages.append(message)

            # Agent finished
            if reason == "stop":
                content = message.get("content", "").strip()
                if content:
                    try:
                        if "```json" in content:
                            content = content.split("```json")[1].split("```")[0].strip()
                        elif "```" in content:
                            content = content.split("```")[1].split("```")[0].strip()

                        result = json.loads(content)
                        result["tools_called"] = tools_called
                        result["iterations"]   = iteration
                        result["agentic"]      = True

                        # Save cycle log
                        _monitor.insert_one({**result})
                        _monitor.create_index("run_at")

                        print(f"  Cycle complete. Status: {result.get('overall_status')}")
                        print(f"  Language bias: {result.get('monitoring', {}).get('language_bias_pct')}%")
                        print(f"  Corrections:   {result.get('self_healing', {}).get('complaints_fixed', 0)}")
                        print(f"  Followups:     {result.get('followup', {}).get('followups_sent', 0)}")

                        return result

                    except json.JSONDecodeError:
                        pass
                break

            # Agent calling tools
            if reason == "tool_calls":
                tool_results = []
                for tc in message.get("tool_calls", []):
                    name = tc["function"]["name"]
                    try:
                        args = json.loads(tc["function"]["arguments"])
                    except Exception:
                        args = {}

                    print(f"  Agent: {name}({list(args.keys())})")
                    tools_called.append(name)
                    result = execute_tool(name, args)

                    tool_results.append({
                        "role":         "tool",
                        "tool_call_id": tc["id"],
                        "content":      result,
                    })

                messages.extend(tool_results)

        except Exception as e:
            print(f"  Error: {e}")
            break

    return {
        "error":      "Cycle incomplete",
        "iterations": iteration,
        "agentic":    False,
        "run_at":     datetime.utcnow().isoformat(),
    }


# ==================================================
# MONITORING LOG RETRIEVAL
# ==================================================

def get_latest_cycle_log() -> dict:
    """Get the most recent autonomous cycle log."""
    log = _monitor.find_one({}, {"_id": 0}, sort=[("run_at", -1)])
    return log or {"message": "No cycle logs yet"}


def get_active_alerts(acknowledged: bool = False) -> list:
    """Get all active (unacknowledged) alerts."""
    return list(_alerts.find(
        {"acknowledged": acknowledged},
        {"_id": 0}
    ).sort("created_at", -1).limit(20))


def acknowledge_alert(alert_id: str) -> bool:
    """Mark an alert as acknowledged."""
    from bson import ObjectId
    result = _alerts.update_one(
        {"_id": ObjectId(alert_id)},
        {"$set": {"acknowledged": True, "acknowledged_at": datetime.utcnow().isoformat()}}
    )
    return result.modified_count > 0


def get_bias_trend(days: int = 7) -> list:
    """Get bias trend over last N days from cycle logs."""
    since = (datetime.utcnow() - timedelta(days=days)).isoformat()
    logs  = list(_monitor.find(
        {"run_at": {"$gte": since}},
        {
            "_id":  0,
            "run_at": 1,
            "monitoring.language_bias_pct":   1,
            "monitoring.rural_urban_bias_pct": 1,
            "monitoring.severity":             1,
            "overall_status":                  1,
        }
    ).sort("run_at", 1))
    return logs


def get_correction_history(days: int = 7) -> list:
    """Get history of all auto corrections applied."""
    since = (datetime.utcnow() - timedelta(days=days)).isoformat()
    return list(_fixes.find(
        {"applied_at": {"$gte": since}},
        {"_id": 0}
    ).sort("applied_at", -1))


if __name__ == "__main__":
    result = run_autonomous_cycle()
    print("\nCycle Result:")
    print(json.dumps(result, indent=2, default=str))
