"""
mismatch_detector.py
====================
Layer 3 - Detects mismanagement by comparing expected vs observed.
Layer 4 - Identifies likely causes.
Layer 5 - Generates immediate remedies.
Layer 6 - Suggests long term policy solutions.
Layer 7 - Routes to correct government department.
"""

from resource_estimator import estimate_all


# -------------------------------------------------
# Thresholds
# -------------------------------------------------

MISMATCH_THRESHOLD  = 0.35  # Score difference to flag as mismatch
COMPLAINT_THRESHOLD = 5     # Min complaints to consider as signal


# -------------------------------------------------
# Layer 3 - Mismatch Detection
# -------------------------------------------------

def detect_mismatches(estimates: dict) -> list:
    """
    Compare expected resource scores vs actual complaint signals.
    Returns list of detected mismatches.

    Mismatch = resource score is decent BUT complaints are high
               OR resource score is very low everywhere
    """
    mismatches = []
    complaints = estimates.get("complaints", {})

    # Water mismatch
    water_score = estimates["water"]["water_score"]
    water_complaints = complaints.get("water", 0)
    if water_score > 0.4 and water_complaints >= COMPLAINT_THRESHOLD:
        mismatches.append({
            "issue":            "Water Supply",
            "mismatch_score":   round(water_score - 0.2, 3),
            "expected_score":   water_score,
            "complaint_count":  water_complaints,
            "type":             "mismanagement",
            "detail":           "Water resources adequate but complaints high — distribution failure likely"
        })
    elif water_score < 0.3:
        mismatches.append({
            "issue":            "Water Supply",
            "mismatch_score":   round(1 - water_score, 3),
            "expected_score":   water_score,
            "complaint_count":  water_complaints,
            "type":             "shortage",
            "detail":           "Genuine water scarcity detected"
        })

    # Electricity mismatch
    elec_score     = estimates["electricity"]["electricity_score"]
    elec_complaints = complaints.get("electricity", 0)
    if elec_score > 0.4 and elec_complaints >= COMPLAINT_THRESHOLD:
        mismatches.append({
            "issue":            "Electricity",
            "mismatch_score":   round(elec_score - 0.2, 3),
            "expected_score":   elec_score,
            "complaint_count":  elec_complaints,
            "type":             "mismanagement",
            "detail":           "Installed capacity adequate but outage complaints high"
        })
    elif elec_score < 0.2:
        mismatches.append({
            "issue":            "Electricity",
            "mismatch_score":   round(1 - elec_score, 3),
            "expected_score":   elec_score,
            "complaint_count":  elec_complaints,
            "type":             "shortage",
            "detail":           "Low installed power capacity in region"
        })

    # Crop/Agriculture mismatch
    crop_score       = estimates["crop"]["crop_score"]
    agri_complaints  = complaints.get("agriculture", 0)
    ndvi_score       = estimates["crop"]["ndvi_score"]
    if ndvi_score > 0.5 and crop_score < 0.4:
        mismatches.append({
            "issue":            "Agriculture",
            "mismatch_score":   round(ndvi_score - crop_score, 3),
            "expected_score":   ndvi_score,
            "complaint_count":  agri_complaints,
            "type":             "mismanagement",
            "detail":           "Vegetation healthy but crop yield low — input/irrigation failure"
        })
    elif crop_score < 0.3:
        mismatches.append({
            "issue":            "Agriculture",
            "mismatch_score":   round(1 - crop_score, 3),
            "expected_score":   crop_score,
            "complaint_count":  agri_complaints,
            "type":             "stress",
            "detail":           "Crop stress detected — environmental or pest factors"
        })

    # Flooding mismatch
    flood_risk       = estimates["flood_risk"]["flood_risk_score"]
    flood_complaints = complaints.get("flooding", 0)
    if flood_risk > 0.5 and flood_complaints >= COMPLAINT_THRESHOLD:
        mismatches.append({
            "issue":            "Flooding",
            "mismatch_score":   round(flood_risk, 3),
            "expected_score":   flood_risk,
            "complaint_count":  flood_complaints,
            "type":             "infrastructure_failure",
            "detail":           "High flood risk area with active complaints — drainage infrastructure failing"
        })

    # Air Quality mismatch
    air_score       = estimates["air_quality"]["air_quality_score"]
    air_complaints  = complaints.get("air", 0)
    live_aqi        = estimates["air_quality"].get("live_aqi")
    if live_aqi and live_aqi > 150:
        mismatches.append({
            "issue":            "Air Pollution",
            "mismatch_score":   round(1 - air_score, 3),
            "expected_score":   air_score,
            "complaint_count":  air_complaints,
            "type":             "pollution",
            "detail":           f"Live AQI is {live_aqi} — {estimates['air_quality']['category']}"
        })
    elif air_score < 0.4 and air_complaints >= COMPLAINT_THRESHOLD:
        mismatches.append({
            "issue":            "Air Pollution",
            "mismatch_score":   round(1 - air_score, 3),
            "expected_score":   air_score,
            "complaint_count":  air_complaints,
            "type":             "pollution",
            "detail":           "Poor air quality with citizen complaints"
        })

    # Sort by severity
    mismatches.sort(key=lambda x: x["mismatch_score"], reverse=True)
    return mismatches


# -------------------------------------------------
# Layer 4 - Cause Analysis
# -------------------------------------------------

CAUSE_RULES = {
    "Water Supply": {
        "mismanagement": [
            "Pipeline leakage in distribution network",
            "Illegal water extraction by industries",
            "Distribution system failure",
            "Canal blockage or siltation",
            "Pump station malfunction",
        ],
        "shortage": [
            "Depleted groundwater table",
            "Below normal rainfall",
            "Reservoir storage critically low",
            "Drought conditions",
        ],
    },
    "Electricity": {
        "mismanagement": [
            "Grid overload due to poor load management",
            "Transformer damage or failure",
            "Transmission line breakdown",
            "Power theft causing network strain",
            "Inadequate distribution infrastructure",
        ],
        "shortage": [
            "Insufficient installed generation capacity",
            "Fuel supply disruption to thermal plants",
            "Low water levels affecting hydro generation",
        ],
    },
    "Agriculture": {
        "mismanagement": [
            "Irrigation canal not maintained",
            "Fertilizer or seed supply disruption",
            "Agricultural extension services absent",
            "Crop loan not disbursed on time",
        ],
        "stress": [
            "Pest or disease outbreak",
            "Unseasonal rainfall or drought",
            "Extreme temperature stress on crops",
            "Soil degradation",
        ],
    },
    "Flooding": {
        "infrastructure_failure": [
            "Storm water drains blocked or inadequate",
            "River embankment breach",
            "Poor urban drainage planning",
            "Deforestation increasing runoff",
        ],
    },
    "Air Pollution": {
        "pollution": [
            "Industrial emissions without pollution control",
            "Vehicular pollution in urban areas",
            "Crop stubble burning",
            "Construction dust not controlled",
            "Solid waste burning at dump sites",
        ],
    },
}


def analyze_causes(mismatch: dict) -> list:
    """Identify likely causes for a detected mismatch."""
    issue = mismatch["issue"]
    mtype = mismatch["type"]
    rules = CAUSE_RULES.get(issue, {})
    return rules.get(mtype, rules.get(list(rules.keys())[0], ["Unknown cause"]) if rules else ["Unknown cause"])


# -------------------------------------------------
# Layer 5 - Immediate Remedies
# -------------------------------------------------

REMEDIES = {
    "Water Supply": {
        "mismanagement": [
            "Deploy emergency water tankers to affected areas",
            "Dispatch repair teams to fix pipeline leaks",
            "Activate emergency bore wells",
            "Release water from nearest reservoir",
            "Impose restrictions on industrial water use",
        ],
        "shortage": [
            "Deploy water tankers immediately",
            "Activate all available bore wells",
            "Issue water conservation advisory",
            "Ration water supply by schedule",
        ],
    },
    "Electricity": {
        "mismanagement": [
            "Deploy mobile transformer units",
            "Reroute electricity load from adjacent grid",
            "Repair damaged transmission lines on priority",
            "Deploy rapid response electrical teams",
        ],
        "shortage": [
            "Implement load shedding schedule",
            "Request emergency power from neighboring state",
            "Activate diesel generator backup for critical areas",
        ],
    },
    "Agriculture": {
        "mismanagement": [
            "Immediately release irrigation water from canals",
            "Distribute emergency fertilizer through cooperatives",
            "Deploy agricultural extension officers to villages",
            "Fast track crop loan disbursement",
        ],
        "stress": [
            "Distribute pesticides and crop protection inputs",
            "Send agricultural advisory to farmers via SMS",
            "Activate irrigation pumps in affected areas",
            "Deploy crop damage assessment teams",
        ],
    },
    "Flooding": {
        "infrastructure_failure": [
            "Deploy pumping machines to drain flood water",
            "Open relief camps in safe areas",
            "Clear blocked storm drains on emergency basis",
            "Position NDRF teams in high risk zones",
        ],
    },
    "Air Pollution": {
        "pollution": [
            "Issue health advisory and school closure orders",
            "Halt construction activity temporarily",
            "Increase water sprinkling on roads",
            "Deploy smog towers if available",
            "Restrict industrial activity during peak pollution",
        ],
    },
}


def generate_remedies(mismatch: dict) -> list:
    """Generate immediate action remedies for a mismatch."""
    issue = mismatch["issue"]
    mtype = mismatch["type"]
    issue_remedies = REMEDIES.get(issue, {})
    return issue_remedies.get(mtype, issue_remedies.get(list(issue_remedies.keys())[0], []) if issue_remedies else [])


# -------------------------------------------------
# Layer 6 - Policy Solutions
# -------------------------------------------------

POLICY_SOLUTIONS = {
    "Water Supply": [
        "Upgrade aging water distribution pipelines",
        "Build additional water storage reservoirs",
        "Implement smart water meters across the district",
        "Install automated leak detection systems",
        "Promote rainwater harvesting in all buildings",
        "Develop groundwater recharge zones",
    ],
    "Electricity": [
        "Upgrade transmission and distribution infrastructure",
        "Build decentralized solar microgrids for villages",
        "Install smart grid monitoring systems",
        "Increase renewable energy capacity",
        "Establish district level energy storage systems",
    ],
    "Agriculture": [
        "Rehabilitate and desilt irrigation canals",
        "Subsidize climate resilient seed varieties",
        "Introduce district level pest monitoring systems",
        "Expand crop insurance coverage",
        "Develop farmer service centres at block level",
        "Promote micro irrigation like drip and sprinkler",
    ],
    "Flooding": [
        "Build comprehensive storm water drainage network",
        "Restore natural water bodies and wetlands",
        "Implement flood early warning systems",
        "Develop flood plain zoning regulations",
        "Plant trees along riverbanks to prevent erosion",
    ],
    "Air Pollution": [
        "Install continuous ambient air quality monitoring stations",
        "Enforce strict emission norms for industries",
        "Promote public transport to reduce vehicular pollution",
        "Ban open burning of agricultural waste",
        "Increase urban green cover and tree plantation",
    ],
}


def get_policy_solutions(issue: str) -> list:
    """Get long term policy solutions for an issue."""
    return POLICY_SOLUTIONS.get(issue, [
        "Conduct detailed assessment and planning",
        "Allocate dedicated budget for infrastructure",
        "Set up monitoring and reporting systems",
    ])


# -------------------------------------------------
# Layer 7 - Department Routing
# -------------------------------------------------

DEPARTMENT_ROUTING = {
    "Water Supply":  ["District Magistrate", "Jal Shakti / Water Resources Department", "Municipal Corporation"],
    "Electricity":   ["State Electricity Board", "Power Department", "District Magistrate"],
    "Agriculture":   ["Agriculture Department", "District Magistrate", "Krishi Vigyan Kendra"],
    "Flooding":      ["District Disaster Management Authority", "NDRF", "Public Works Department", "Irrigation Department"],
    "Air Pollution": ["State Pollution Control Board", "CPCB Regional Office", "District Magistrate", "Industries Department"],
}


def route_department(issue: str) -> list:
    """Get list of departments to notify for an issue."""
    return DEPARTMENT_ROUTING.get(issue, ["District Magistrate", "Concerned Department"])


# -------------------------------------------------
# Main Analysis Function
# -------------------------------------------------

def full_mismatch_analysis(district: str, state: str) -> dict:
    """
    Run complete mismatch analysis for a district.
    Returns structured government report ready output.
    """
    estimates  = estimate_all(district, state)

    if "error" in estimates:
        return estimates

    mismatches = detect_mismatches(estimates)

    issues_detected = []
    for mismatch in mismatches:
        issues_detected.append({
            "issue":              mismatch["issue"],
            "mismatch_score":     mismatch["mismatch_score"],
            "type":               mismatch["type"],
            "detail":             mismatch["detail"],
            "complaint_count":    mismatch["complaint_count"],
            "likely_causes":      analyze_causes(mismatch),
            "immediate_remedies": generate_remedies(mismatch),
            "policy_solutions":   get_policy_solutions(mismatch["issue"]),
            "notify_departments": route_department(mismatch["issue"]),
        })

    severity = "Critical" if any(m["mismatch_score"] > 0.6 for m in mismatches) else \
               "High"     if any(m["mismatch_score"] > 0.4 for m in mismatches) else \
               "Medium"   if mismatches else "Low"

    return {
        "district":         district,
        "state":            state,
        "lat":              estimates.get("lat"),
        "lng":              estimates.get("lng"),
        "severity":         severity,
        "issues_count":     len(issues_detected),
        "issues_detected":  issues_detected,
        "resource_scores": {
            "water":       estimates["water"]["water_score"],
            "electricity": estimates["electricity"]["electricity_score"],
            "crop":        estimates["crop"]["crop_score"],
            "air_quality": estimates["air_quality"]["air_quality_score"],
            "flood_risk":  estimates["flood_risk"]["flood_risk_score"],
        },
        "population_density": estimates.get("population_density"),
    }


if __name__ == "__main__":
    result = full_mismatch_analysis("Karnal", "Haryana")
    import json
    print(json.dumps(result, indent=2, default=str))
