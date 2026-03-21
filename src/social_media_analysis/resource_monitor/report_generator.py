"""
report_generator.py
===================
Generates government ready reports for all districts
and saves them to MongoDB reports collection.

Run manually or called by scheduler daily:
    python resource_monitor/report_generator.py
"""

import os
from pymongo import MongoClient, UpdateOne
from datetime import datetime
from mismatch_detector import full_mismatch_analysis
from dotenv import load_dotenv

load_dotenv()

_client  = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/"))
_db      = _client["netravaah"]
_hazard  = _db["hazard_data"]
_reports = _db["resource_reports"]


def generate_district_report(district: str, state: str) -> dict:
    """Generate and save report for one district."""
    print(f"  Generating report: {district}, {state}...")

    analysis = full_mismatch_analysis(district, state)

    if "error" in analysis:
        return analysis

    report = {
        "district":           district,
        "state":              state,
        "lat":                analysis.get("lat"),
        "lng":                analysis.get("lng"),
        "severity":           analysis["severity"],
        "issues_count":       analysis["issues_count"],
        "issues_detected":    analysis["issues_detected"],
        "resource_scores":    analysis["resource_scores"],
        "population_density": analysis.get("population_density"),
        "generated_at":       datetime.utcnow().isoformat(),
        "report_date":        datetime.utcnow().strftime("%Y-%m-%d"),
    }

    _reports.update_one(
        {"district": district, "state": state},
        {"$set": report},
        upsert=True,
    )

    return report


def generate_all_reports():
    """
    Generate reports for all districts in the hazard database.
    Called by scheduler every 24 hours.
    """
    districts = list(_hazard.find({}, {"district": 1, "state": 1, "_id": 0}))
    print(f"Generating reports for {len(districts)} districts...")

    generated = 0
    failed    = 0

    for d in districts:
        try:
            report = generate_district_report(d["district"], d["state"])
            if "error" not in report:
                generated += 1
            else:
                failed += 1
        except Exception as e:
            print(f"  Error for {d['district']}: {e}")
            failed += 1

    _reports.create_index([("state", 1), ("district", 1)])
    _reports.create_index("severity")
    _reports.create_index("generated_at")

    print(f"Done: {generated} reports generated, {failed} failed")
    return generated


def get_district_report(district: str, state: str = None) -> dict:
    """Get latest report for a district."""
    query = {"district": {"$regex": district, "$options": "i"}}
    if state:
        query["state"] = {"$regex": state, "$options": "i"}
    return _reports.find_one(query, {"_id": 0})


def get_critical_districts() -> list:
    """Get all districts with Critical or High severity."""
    return list(_reports.find(
        {"severity": {"$in": ["Critical", "High"]}},
        {
            "_id":           0,
            "district":      1,
            "state":         1,
            "severity":      1,
            "issues_count":  1,
            "lat":           1,
            "lng":           1,
            "resource_scores":1,
        }
    ).sort("issues_count", -1))


def get_state_summary(state: str) -> dict:
    """Get summary of all districts in a state."""
    reports = list(_reports.find(
        {"state": {"$regex": state, "$options": "i"}},
        {"_id": 0}
    ))

    if not reports:
        return {"error": f"No reports found for {state}"}

    severity_counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    issue_counts    = {}

    for r in reports:
        sev = r.get("severity", "Low")
        severity_counts[sev] = severity_counts.get(sev, 0) + 1

        for issue in r.get("issues_detected", []):
            name = issue["issue"]
            issue_counts[name] = issue_counts.get(name, 0) + 1

    return {
        "state":            state,
        "total_districts":  len(reports),
        "severity_summary": severity_counts,
        "top_issues":       sorted(issue_counts.items(), key=lambda x: x[1], reverse=True),
        "critical_districts": [
            r["district"] for r in reports if r.get("severity") in ["Critical", "High"]
        ],
        "generated_at":     datetime.utcnow().isoformat(),
    }


if __name__ == "__main__":
    # Test with a few districts first
    test_districts = [
        ("Karnal", "Haryana"),
        ("Lucknow", "Uttar Pradesh"),
        ("Pune", "Maharashtra"),
    ]

    for district, state in test_districts:
        report = generate_district_report(district, state)
        print(f"\n{district}, {state}:")
        print(f"  Severity:       {report.get('severity')}")
        print(f"  Issues found:   {report.get('issues_count')}")
        for issue in report.get("issues_detected", []):
            print(f"  - {issue['issue']}: {issue['type']} (score: {issue['mismatch_score']})")
