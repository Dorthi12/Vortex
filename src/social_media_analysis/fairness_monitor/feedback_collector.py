"""
feedback_collector.py
=====================
Handles citizen feedback on complaint resolution.

Citizens can:
1. Mark complaint as resolved or not
2. Rate the resolution (1-5 stars)
3. Report how long it took

Government can:
1. Mark complaint as resolved
2. Add action taken description

Stores everything in MongoDB feedback collection.
"""

import os
from datetime import datetime
from pymongo import MongoClient, UpdateOne
from dotenv import load_dotenv

load_dotenv()

_client   = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/"))
_db       = _client["netravaah"]
_feedback = _db["complaint_feedback"]
_signals  = _db["social_signals"]


# --------------------------------------------------
# Citizen Feedback
# --------------------------------------------------

def submit_citizen_feedback(
    post_id:       str,
    resolved:      bool,
    stars:         int   = None,
    days_to_fix:   int   = None,
    comment:       str   = None,
    citizen_id:    str   = None,
) -> dict:
    """
    Citizen submits feedback on whether their complaint was resolved.

    Args:
        post_id:     ID of the original complaint post
        resolved:    True if resolved, False if not
        stars:       1-5 rating of resolution quality
        days_to_fix: How many days it took to resolve
        comment:     Optional citizen comment
        citizen_id:  Citizen user ID

    Returns:
        Saved feedback document
    """
    if stars and not (1 <= stars <= 5):
        raise ValueError("Stars must be between 1 and 5")

    # Get original complaint for context
    original = _signals.find_one({"post_id": post_id}, {"_id": 0})

    feedback = {
        "post_id":       post_id,
        "citizen_id":    citizen_id,
        "resolved":      resolved,
        "stars":         stars,
        "days_to_fix":   days_to_fix,
        "comment":       comment,
        "submitted_at":  datetime.utcnow().isoformat(),
        "feedback_type": "citizen",

        # Context from original complaint
        "issue_type":    original.get("final_issue")   if original else None,
        "state":         original.get("locations", [{}])[0].get("state")    if original else None,
        "district":      original.get("locations", [{}])[0].get("name")     if original else None,
        "language":      _detect_language(original.get("text", ""))         if original else None,
        "priority_score":original.get("priority_score")                     if original else None,
        "sentiment":     original.get("sentiment", {}).get("label")         if original else None,
    }

    _feedback.update_one(
        {"post_id": post_id, "feedback_type": "citizen"},
        {"$set": feedback},
        upsert=True,
    )

    # Update resolution status in social_signals
    new_status = "RESOLVED_CONFIRMED" if resolved else "REOPENED"
    _signals.update_one(
        {"post_id": post_id},
        {
            "$set": {
                "resolution_status":    new_status,
                "citizen_confirmed":    resolved,
                "citizen_stars":        stars,
                "citizen_feedback_at":  datetime.utcnow().isoformat(),
            }
        }
    )

    return feedback


def submit_government_action(
    post_id:        str,
    resolved:       bool,
    action_taken:   str,
    department:     str   = None,
    officer_id:     str   = None,
    days_taken:     int   = None,
) -> dict:
    """
    Government officer marks a complaint as resolved with action details.

    Args:
        post_id:      ID of the original complaint
        resolved:     True if resolved
        action_taken: Description of what was done
        department:   Which department took action
        officer_id:   Officer who resolved it
        days_taken:   Days from complaint to resolution
    """
    action = {
        "post_id":       post_id,
        "resolved":      resolved,
        "action_taken":  action_taken,
        "department":    department,
        "officer_id":    officer_id,
        "days_taken":    days_taken,
        "submitted_at":  datetime.utcnow().isoformat(),
        "feedback_type": "government",
    }

    _feedback.update_one(
        {"post_id": post_id, "feedback_type": "government"},
        {"$set": action},
        upsert=True,
    )

    # Update social_signals
    _signals.update_one(
        {"post_id": post_id},
        {
            "$set": {
                "govt_resolved":      resolved,
                "govt_action":        action_taken,
                "govt_department":    department,
                "govt_resolved_at":   datetime.utcnow().isoformat(),
                "resolution_status":  "RESOLVED_PENDING" if resolved else "IN_PROGRESS",
            }
        }
    )

    return action


# --------------------------------------------------
# Language Detection Helper
# --------------------------------------------------

def _detect_language(text: str) -> str:
    """
    Simple language detection for Hindi vs English.
    Checks for presence of Devanagari characters.
    """
    if not text:
        return "unknown"

    devanagari_count = sum(1 for c in text if "\u0900" <= c <= "\u097F")
    total            = len(text.strip())

    if total == 0:
        return "unknown"

    ratio = devanagari_count / total

    if ratio > 0.3:
        return "hindi"
    elif ratio > 0.05:
        return "mixed"
    else:
        return "english"


# --------------------------------------------------
# Feedback Retrieval
# --------------------------------------------------

def get_complaint_feedback(post_id: str) -> dict:
    """Get all feedback for a specific complaint."""
    citizen_fb = _feedback.find_one(
        {"post_id": post_id, "feedback_type": "citizen"},
        {"_id": 0}
    )
    govt_fb = _feedback.find_one(
        {"post_id": post_id, "feedback_type": "government"},
        {"_id": 0}
    )
    return {
        "post_id":          post_id,
        "citizen_feedback": citizen_fb,
        "govt_feedback":    govt_fb,
    }


def get_resolution_stats(
    state:      str = None,
    issue_type: str = None,
    language:   str = None,
    days:       int = 30,
) -> dict:
    """
    Get resolution statistics for fairness analysis.
    Can filter by state, issue type or language.
    """
    from datetime import timedelta
    since = (datetime.utcnow() - timedelta(days=days)).isoformat()

    query = {
        "feedback_type": "citizen",
        "submitted_at":  {"$gte": since},
    }
    if state:
        query["state"]      = {"$regex": state,      "$options": "i"}
    if issue_type:
        query["issue_type"] = {"$regex": issue_type, "$options": "i"}
    if language:
        query["language"]   = language

    feedbacks = list(_feedback.find(query, {"_id": 0}))

    if not feedbacks:
        return {
            "total":           0,
            "resolved_count":  0,
            "resolution_rate": 0,
            "avg_stars":       0,
            "avg_days":        0,
        }

    resolved      = [f for f in feedbacks if f.get("resolved")]
    starred       = [f for f in feedbacks if f.get("stars")]
    days_reported = [f for f in feedbacks if f.get("days_to_fix")]

    return {
        "total":           len(feedbacks),
        "resolved_count":  len(resolved),
        "resolution_rate": round(len(resolved) / len(feedbacks) * 100, 2),
        "avg_stars":       round(sum(f["stars"] for f in starred) / len(starred), 2) if starred else 0,
        "avg_days":        round(sum(f["days_to_fix"] for f in days_reported) / len(days_reported), 1) if days_reported else 0,
        "filters": {
            "state":      state,
            "issue_type": issue_type,
            "language":   language,
            "days":       days,
        }
    }


if __name__ == "__main__":
    # Test
    print("Testing feedback collector...")

    fb = submit_citizen_feedback(
        post_id     = "test_001",
        resolved    = True,
        stars       = 4,
        days_to_fix = 3,
        comment     = "Road was fixed but took too long",
        citizen_id  = "citizen_123",
    )
    print("Citizen feedback saved:", fb)

    govt = submit_government_action(
        post_id      = "test_001",
        resolved     = True,
        action_taken = "Deployed road repair team, filled potholes",
        department   = "Public Works Department",
        days_taken   = 3,
    )
    print("Government action saved:", govt)

    stats = get_resolution_stats(days=30)
    print("Resolution stats:", stats)
