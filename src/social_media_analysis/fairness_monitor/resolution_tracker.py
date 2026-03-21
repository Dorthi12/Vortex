"""
resolution_tracker.py
=====================
Automatically tracks and updates complaint resolution status.

Handles:
1. Auto detection - complaint volume drops after govt action
2. Time based auto close - 30 days with no update
3. Escalation - no govt action in X days
4. Resolution confidence scoring

Called by scheduler every 24 hours.
"""

import os
from datetime import datetime, timedelta
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

_client   = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/"))
_db       = _client["netravaah"]
_signals  = _db["social_signals"]
_feedback = _db["complaint_feedback"]
_tracking = _db["resolution_tracking"]

# --------------------------------------------------
# Resolution Status Values
# --------------------------------------------------

STATUS = {
    "OPEN":               "OPEN",
    "IN_PROGRESS":        "IN_PROGRESS",
    "RESOLVED_PENDING":   "RESOLVED_PENDING",   # govt resolved, citizen not confirmed
    "RESOLVED_CONFIRMED": "RESOLVED_CONFIRMED",  # citizen confirmed
    "RESOLVED_AUTO":      "RESOLVED_AUTO",       # auto detected from complaint drop
    "RESOLVED_TIMEOUT":   "RESOLVED_TIMEOUT",    # 30 days, no response
    "REOPENED":           "REOPENED",            # citizen said not fixed
    "ESCALATED":          "ESCALATED",           # no action in too long
}

# Days thresholds
DAYS_TO_ESCALATE     = 7    # no govt action → escalate
DAYS_TO_AUTO_CLOSE   = 30   # no response → auto close
COMPLAINT_DROP_PCT   = 60   # 60% drop in complaints → auto resolved


# --------------------------------------------------
# Resolution Confidence Score
# --------------------------------------------------

def calculate_resolution_confidence(post_id: str) -> int:
    """
    Calculate how confident we are that a complaint is resolved.
    Returns score 0-100.

    Factors:
      Government marked resolved:     +40
      Citizen confirmed resolved:     +40
      Citizen confirmed NOT resolved: -60
      Complaint volume dropped:       +15
      No new complaints in 14 days:   +5
    """
    signal = _signals.find_one({"post_id": post_id}, {"_id": 0})
    if not signal:
        return 0

    score = 0

    # Government marked resolved
    if signal.get("govt_resolved"):
        score += 40

    # Citizen feedback
    citizen_confirmed = signal.get("citizen_confirmed")
    if citizen_confirmed is True:
        score += 40
    elif citizen_confirmed is False:
        score -= 60

    # Check if complaints in same area dropped
    district  = (signal.get("locations") or [{}])[0].get("name")
    issue     = signal.get("final_issue")
    if district and issue:
        if _complaint_volume_dropped(district, issue, signal.get("processed_at")):
            score += 15

    # No new complaints in 14 days
    if district and issue:
        if _no_new_complaints(district, issue, days=14):
            score += 5

    return max(0, min(score, 100))


def _complaint_volume_dropped(district: str, issue: str, since_date: str) -> bool:
    """Check if complaint volume for issue in district dropped after complaint date."""
    try:
        complaint_date = datetime.fromisoformat(since_date)
        week_before    = (complaint_date - timedelta(days=7)).isoformat()
        week_after     = (complaint_date + timedelta(days=7)).isoformat()
        two_weeks_after= (complaint_date + timedelta(days=14)).isoformat()

        before_count = _signals.count_documents({
            "locations.name": {"$regex": district, "$options": "i"},
            "final_issue":    issue,
            "processed_at":   {"$gte": week_before, "$lt": complaint_date.isoformat()},
        })

        after_count = _signals.count_documents({
            "locations.name": {"$regex": district, "$options": "i"},
            "final_issue":    issue,
            "processed_at":   {"$gte": week_after, "$lt": two_weeks_after},
        })

        if before_count == 0:
            return False

        drop_pct = (before_count - after_count) / before_count * 100
        return drop_pct >= COMPLAINT_DROP_PCT

    except Exception:
        return False


def _no_new_complaints(district: str, issue: str, days: int = 14) -> bool:
    """Check if no new complaints for issue in district in last N days."""
    since = (datetime.utcnow() - timedelta(days=days)).isoformat()
    count = _signals.count_documents({
        "locations.name": {"$regex": district, "$options": "i"},
        "final_issue":    issue,
        "processed_at":   {"$gte": since},
        "nlp_processed":  True,
    })
    return count == 0


# --------------------------------------------------
# Auto Detection
# --------------------------------------------------

def auto_detect_resolutions() -> dict:
    """
    Scan all OPEN and IN_PROGRESS complaints.
    Auto mark as resolved if complaint volume dropped.
    Called by scheduler every 24 hours.
    """
    print("Running auto resolution detection...")

    open_complaints = list(_signals.find(
        {
            "nlp_processed":   True,
            "resolution_status": {"$in": [
                STATUS["OPEN"],
                STATUS["IN_PROGRESS"],
                STATUS["RESOLVED_PENDING"],
                None,
            ]},
        },
        {"post_id": 1, "final_issue": 1, "locations": 1, "processed_at": 1,
         "govt_resolved": 1, "_id": 0}
    ))

    auto_resolved  = 0
    auto_closed    = 0
    escalated      = 0

    for complaint in open_complaints:
        post_id      = complaint["post_id"]
        processed_at = complaint.get("processed_at", "")
        district     = (complaint.get("locations") or [{}])[0].get("name")
        issue        = complaint.get("final_issue")

        try:
            complaint_date = datetime.fromisoformat(processed_at)
            days_old       = (datetime.utcnow() - complaint_date).days
        except Exception:
            continue

        # Auto close after 30 days with no response
        if days_old >= DAYS_TO_AUTO_CLOSE:
            if complaint.get("govt_resolved"):
                new_status = STATUS["RESOLVED_TIMEOUT"]
                auto_closed += 1
            else:
                new_status = STATUS["ESCALATED"]
                escalated += 1

            _signals.update_one(
                {"post_id": post_id},
                {"$set": {
                    "resolution_status": new_status,
                    "auto_updated_at":   datetime.utcnow().isoformat(),
                }}
            )
            continue

        # Auto detect from complaint volume drop
        if district and issue and complaint.get("govt_resolved"):
            if _complaint_volume_dropped(district, issue, processed_at):
                confidence = calculate_resolution_confidence(post_id)
                _signals.update_one(
                    {"post_id": post_id},
                    {"$set": {
                        "resolution_status":      STATUS["RESOLVED_AUTO"],
                        "resolution_confidence":  confidence,
                        "auto_updated_at":        datetime.utcnow().isoformat(),
                    }}
                )
                auto_resolved += 1
                continue

        # Escalate if no govt action after 7 days
        if days_old >= DAYS_TO_ESCALATE and not complaint.get("govt_resolved"):
            _signals.update_one(
                {"post_id": post_id},
                {"$set": {
                    "resolution_status": STATUS["ESCALATED"],
                    "escalated_at":      datetime.utcnow().isoformat(),
                }}
            )
            escalated += 1

    print(f"  Auto resolved:  {auto_resolved}")
    print(f"  Auto closed:    {auto_closed}")
    print(f"  Escalated:      {escalated}")

    return {
        "auto_resolved": auto_resolved,
        "auto_closed":   auto_closed,
        "escalated":     escalated,
        "processed":     len(open_complaints),
        "run_at":        datetime.utcnow().isoformat(),
    }


# --------------------------------------------------
# Resolution Statistics
# --------------------------------------------------

def get_overall_resolution_stats(days: int = 30) -> dict:
    """Get overall resolution statistics across all complaints."""
    since = (datetime.utcnow() - timedelta(days=days)).isoformat()

    pipeline = [
        {
            "$match": {
                "nlp_processed": True,
                "processed_at":  {"$gte": since},
            }
        },
        {
            "$group": {
                "_id":   "$resolution_status",
                "count": {"$sum": 1},
            }
        }
    ]

    status_counts = {s: 0 for s in STATUS.values()}
    status_counts[None] = 0

    for result in _signals.aggregate(pipeline):
        status = result["_id"]
        if status in status_counts:
            status_counts[status] = result["count"]

    total = sum(status_counts.values())
    resolved_statuses = [
        STATUS["RESOLVED_CONFIRMED"],
        STATUS["RESOLVED_AUTO"],
        STATUS["RESOLVED_TIMEOUT"],
    ]
    resolved_total = sum(status_counts.get(s, 0) for s in resolved_statuses)

    return {
        "period_days":     days,
        "total_complaints":total,
        "status_breakdown":status_counts,
        "resolved_total":  resolved_total,
        "resolution_rate": round(resolved_total / total * 100, 2) if total > 0 else 0,
        "escalated":       status_counts.get(STATUS["ESCALATED"], 0),
        "reopened":        status_counts.get(STATUS["REOPENED"], 0),
        "generated_at":    datetime.utcnow().isoformat(),
    }


def get_resolution_by_state(days: int = 30) -> list:
    """Get resolution rates broken down by state."""
    since = (datetime.utcnow() - timedelta(days=days)).isoformat()

    pipeline = [
        {
            "$match": {
                "nlp_processed": True,
                "processed_at":  {"$gte": since},
                "locations.0":   {"$exists": True},
            }
        },
        {
            "$group": {
                "_id": "$locations.0.state",
                "total":     {"$sum": 1},
                "resolved":  {"$sum": {"$cond": [
                    {"$in": ["$resolution_status", [
                        STATUS["RESOLVED_CONFIRMED"],
                        STATUS["RESOLVED_AUTO"],
                        STATUS["RESOLVED_TIMEOUT"],
                    ]]},
                    1, 0
                ]}},
                "escalated": {"$sum": {"$cond": [
                    {"$eq": ["$resolution_status", STATUS["ESCALATED"]]},
                    1, 0
                ]}},
            }
        },
        {"$sort": {"total": -1}},
    ]

    results = []
    for r in _signals.aggregate(pipeline):
        if not r["_id"]:
            continue
        total    = r["total"]
        resolved = r["resolved"]
        results.append({
            "state":           r["_id"],
            "total":           total,
            "resolved":        resolved,
            "escalated":       r["escalated"],
            "resolution_rate": round(resolved / total * 100, 2) if total > 0 else 0,
        })

    return results


def get_resolution_by_issue(days: int = 30) -> list:
    """Get resolution rates broken down by issue type."""
    since = (datetime.utcnow() - timedelta(days=days)).isoformat()

    pipeline = [
        {
            "$match": {
                "nlp_processed": True,
                "processed_at":  {"$gte": since},
            }
        },
        {
            "$group": {
                "_id": "$final_issue",
                "total":     {"$sum": 1},
                "resolved":  {"$sum": {"$cond": [
                    {"$in": ["$resolution_status", [
                        STATUS["RESOLVED_CONFIRMED"],
                        STATUS["RESOLVED_AUTO"],
                        STATUS["RESOLVED_TIMEOUT"],
                    ]]},
                    1, 0
                ]}},
                "avg_priority": {"$avg": "$priority_score"},
            }
        },
        {"$sort": {"total": -1}},
    ]

    results = []
    for r in _signals.aggregate(pipeline):
        if not r["_id"]:
            continue
        total    = r["total"]
        resolved = r["resolved"]
        results.append({
            "issue":           r["_id"],
            "total":           total,
            "resolved":        resolved,
            "resolution_rate": round(resolved / total * 100, 2) if total > 0 else 0,
            "avg_priority":    round(r.get("avg_priority") or 0, 3),
        })

    return results


if __name__ == "__main__":
    print("Running auto resolution detection...")
    result = auto_detect_resolutions()
    print(result)

    print("\nOverall resolution stats:")
    stats = get_overall_resolution_stats()
    print(stats)
