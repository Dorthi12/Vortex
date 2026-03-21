"""
bias_detector.py
================
Detects bias in the priority model across:
1. Language (Hindi vs English vs Mixed)
2. Rural vs Urban complaints

Computes statistical fairness metrics and
flags significant bias for AI investigation.
"""

import os
import math
from datetime import datetime, timedelta
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

_client  = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/"))
_db      = _client["netravaah"]
_signals = _db["social_signals"]

# Bias significance threshold
# If difference > 15% → significant bias
BIAS_THRESHOLD = 15.0

# Urban population density threshold
# Districts with density > 500 per sq km = urban
URBAN_DENSITY_THRESHOLD = 500


# --------------------------------------------------
# Language Detection
# --------------------------------------------------

def detect_complaint_language(text: str) -> str:
    """Detect language of complaint text."""
    if not text:
        return "unknown"
    devanagari = sum(1 for c in text if "\u0900" <= c <= "\u097F")
    ratio      = devanagari / max(len(text.strip()), 1)
    if ratio > 0.3:   return "hindi"
    if ratio > 0.05:  return "mixed"
    return "english"


# --------------------------------------------------
# Language Bias Detection
# --------------------------------------------------

def detect_language_bias(days: int = 30) -> dict:
    """
    Detect if Hindi complaints are scored lower than English.

    Compares:
      - Average priority score by language
      - Average confidence score by language
      - Resolution rates by language
    """
    since = (datetime.utcnow() - timedelta(days=days)).isoformat()

    complaints = list(_signals.find(
        {
            "nlp_processed": True,
            "processed_at":  {"$gte": since},
            "text":          {"$exists": True, "$ne": None},
        },
        {
            "_id":              0,
            "text":             1,
            "priority_score":   1,
            "confidence":       1,
            "final_issue":      1,
            "sentiment":        1,
            "resolution_status":1,
        }
    ))

    # Group by language
    groups = {"hindi": [], "english": [], "mixed": []}

    for c in complaints:
        lang = detect_complaint_language(c.get("text", ""))
        if lang in groups:
            groups[lang].append(c)

    # Calculate metrics per language
    stats = {}
    for lang, items in groups.items():
        if not items:
            stats[lang] = {"count": 0}
            continue

        priorities = [i["priority_score"] for i in items if i.get("priority_score")]
        confidences= [i["confidence"]     for i in items if i.get("confidence")]
        resolved   = [i for i in items if i.get("resolution_status") in [
            "RESOLVED_CONFIRMED", "RESOLVED_AUTO", "RESOLVED_TIMEOUT"
        ]]

        stats[lang] = {
            "count":           len(items),
            "avg_priority":    round(sum(priorities) / len(priorities), 4) if priorities else 0,
            "avg_confidence":  round(sum(confidences)/ len(confidences), 4) if confidences else 0,
            "resolution_rate": round(len(resolved) / len(items) * 100, 2),
        }

    # Detect bias
    biases = []

    if stats.get("hindi", {}).get("count", 0) > 10 and stats.get("english", {}).get("count", 0) > 10:

        hindi_pri   = stats["hindi"]["avg_priority"]
        english_pri = stats["english"]["avg_priority"]

        if english_pri > 0:
            diff_pct = abs(english_pri - hindi_pri) / english_pri * 100

            if diff_pct >= BIAS_THRESHOLD:
                direction = "lower" if hindi_pri < english_pri else "higher"
                biases.append({
                    "type":          "Language Bias",
                    "comparison":    "Hindi vs English priority scores",
                    "hindi_avg":     hindi_pri,
                    "english_avg":   english_pri,
                    "difference_pct":round(diff_pct, 2),
                    "direction":     f"Hindi complaints scored {direction} than English",
                    "significant":   diff_pct >= BIAS_THRESHOLD,
                    "severity":      "High" if diff_pct >= 25 else "Medium",
                })

        # Resolution rate bias
        hindi_res   = stats["hindi"]["resolution_rate"]
        english_res = stats["english"]["resolution_rate"]

        if english_res > 0:
            res_diff = abs(english_res - hindi_res)
            if res_diff >= BIAS_THRESHOLD:
                biases.append({
                    "type":          "Resolution Bias",
                    "comparison":    "Hindi vs English resolution rates",
                    "hindi_rate":    hindi_res,
                    "english_rate":  english_res,
                    "difference_pct":round(res_diff, 2),
                    "direction":     f"Hindi complaints resolved {'less' if hindi_res < english_res else 'more'} frequently",
                    "significant":   True,
                    "severity":      "High" if res_diff >= 25 else "Medium",
                })

    return {
        "bias_type":    "language",
        "period_days":  days,
        "stats":        stats,
        "biases_found": biases,
        "bias_detected":len(biases) > 0,
        "checked_at":   datetime.utcnow().isoformat(),
    }


# --------------------------------------------------
# Rural vs Urban Bias Detection
# --------------------------------------------------

def detect_rural_urban_bias(days: int = 30) -> dict:
    """
    Detect if rural complaints are scored lower than urban.

    Uses population density from hazard_data collection
    to classify districts as rural or urban.
    """
    since   = (datetime.utcnow() - timedelta(days=days)).isoformat()
    hazard  = _db["hazard_data"]

    # Build district → rural/urban map
    district_type = {}
    for d in hazard.find({}, {"district": 1, "population_density": 1, "_id": 0}):
        density      = d.get("population_density", 0) or 0
        is_urban     = density >= URBAN_DENSITY_THRESHOLD
        district_type[d["district"].lower()] = "urban" if is_urban else "rural"

    complaints = list(_signals.find(
        {
            "nlp_processed": True,
            "processed_at":  {"$gte": since},
            "locations.0":   {"$exists": True},
        },
        {
            "_id":              0,
            "locations":        1,
            "priority_score":   1,
            "confidence":       1,
            "final_issue":      1,
            "resolution_status":1,
        }
    ))

    groups = {"urban": [], "rural": []}

    for c in complaints:
        district = (c.get("locations") or [{}])[0].get("name", "").lower()
        area_type = district_type.get(district)
        if area_type in groups:
            groups[area_type].append(c)

    # Calculate metrics
    stats = {}
    for area, items in groups.items():
        if not items:
            stats[area] = {"count": 0}
            continue

        priorities = [i["priority_score"] for i in items if i.get("priority_score")]
        resolved   = [i for i in items if i.get("resolution_status") in [
            "RESOLVED_CONFIRMED", "RESOLVED_AUTO", "RESOLVED_TIMEOUT"
        ]]

        stats[area] = {
            "count":           len(items),
            "avg_priority":    round(sum(priorities) / len(priorities), 4) if priorities else 0,
            "resolution_rate": round(len(resolved) / len(items) * 100, 2),
        }

    # Detect bias
    biases = []

    if stats.get("rural", {}).get("count", 0) > 10 and stats.get("urban", {}).get("count", 0) > 10:

        rural_pri = stats["rural"]["avg_priority"]
        urban_pri = stats["urban"]["avg_priority"]

        if urban_pri > 0:
            diff_pct = abs(urban_pri - rural_pri) / urban_pri * 100

            if diff_pct >= BIAS_THRESHOLD:
                biases.append({
                    "type":          "Rural-Urban Bias",
                    "comparison":    "Rural vs Urban priority scores",
                    "rural_avg":     rural_pri,
                    "urban_avg":     urban_pri,
                    "difference_pct":round(diff_pct, 2),
                    "direction":     f"Rural complaints scored {'lower' if rural_pri < urban_pri else 'higher'} than Urban",
                    "significant":   True,
                    "severity":      "High" if diff_pct >= 25 else "Medium",
                })

        # Resolution rate bias
        rural_res = stats["rural"]["resolution_rate"]
        urban_res = stats["urban"]["resolution_rate"]

        if urban_res > 0:
            res_diff = abs(urban_res - rural_res)
            if res_diff >= BIAS_THRESHOLD:
                biases.append({
                    "type":          "Rural-Urban Resolution Bias",
                    "comparison":    "Rural vs Urban resolution rates",
                    "rural_rate":    rural_res,
                    "urban_rate":    urban_res,
                    "difference_pct":round(res_diff, 2),
                    "direction":     f"Rural complaints resolved {'less' if rural_res < urban_res else 'more'} often",
                    "significant":   True,
                    "severity":      "High" if res_diff >= 25 else "Medium",
                })

    return {
        "bias_type":    "rural_urban",
        "period_days":  days,
        "stats":        stats,
        "biases_found": biases,
        "bias_detected":len(biases) > 0,
        "checked_at":   datetime.utcnow().isoformat(),
    }


# --------------------------------------------------
# Full Bias Report
# --------------------------------------------------

def run_full_bias_check(days: int = 30) -> dict:
    """Run all bias checks and return combined report."""
    print("Running full bias check...")

    language_bias   = detect_language_bias(days)
    rural_urban_bias= detect_rural_urban_bias(days)

    all_biases = (
        language_bias["biases_found"] +
        rural_urban_bias["biases_found"]
    )

    critical = [b for b in all_biases if b.get("severity") == "High"]
    medium   = [b for b in all_biases if b.get("severity") == "Medium"]

    overall_severity = "High" if critical else "Medium" if medium else "Low"

    report = {
        "period_days":       days,
        "overall_severity":  overall_severity,
        "total_biases":      len(all_biases),
        "bias_detected":     len(all_biases) > 0,
        "language_bias":     language_bias,
        "rural_urban_bias":  rural_urban_bias,
        "all_biases":        all_biases,
        "generated_at":      datetime.utcnow().isoformat(),
    }

    # Save to MongoDB
    _db["bias_reports"].insert_one({**report, "type": "full_bias_check"})
    _db["bias_reports"].create_index("generated_at")

    print(f"  Biases found: {len(all_biases)}")
    print(f"  Severity:     {overall_severity}")

    return report


if __name__ == "__main__":
    report = run_full_bias_check(days=30)
    import json
    print(json.dumps(report, indent=2, default=str))
