"""
=============================================================================
NETRAVAAH v5 — FastAPI  (schema-aligned with schema.prisma)
FILE: hazard_api.py

Drop-in FastAPI replacement for app.py (Flask).
Every response is shaped to match the Prisma schema models so the frontend
can persist data directly as DB rows.

Pydantic response models mirror Prisma schema models 1-to-1:

  AIAnalysisResponse        → AIAnalysis
    id (uuid), contentType=ISSUE_REPORT, modelType=PRIORITY,
    postId?, issueReportId?,
    sentiments[], sentimentScore?, priorityScore?,
    urgencyScore?, impactScore?,
    issueCategory (maps hazard → IssueCategory enum),
    issuePriority (maps alert level → IssuePriority enum),
    confidence?, extractedEntities? (Json — full hazard payload),
    summary?, modelName, modelVersion, processingTimeMs, createdAt

  IssueReportContext         — request fields drawn from IssueReport schema
    issueReportId?, reporterId?, caption, latitude, longitude,
    locationName?, status, priority, viewCount, isDuplicate

Enums — all mirror schema.prisma exactly:
  AIContentType  : POST | ISSUE_REPORT | COMMENT
  AIModelType    : SENTIMENT | PRIORITY | TOXICITY |
                   CATEGORY_CLASSIFICATION | LANGUAGE_DETECTION |
                   DUPLICATE_DETECTION | ENTITY_EXTRACTION |
                   MISINFORMATION_DETECTION
  IssueCategory  : WATER_SUPPLY | ROAD_DAMAGE | ELECTRICITY |
                   STREET_LIGHTS | DRAINAGE_AND_SEWAGE | FLOODING |
                   GARBAGE_COLLECTION | PUBLIC_TOILETS | HEALTHCARE |
                   EDUCATION | PUBLIC_SAFETY | PUBLIC_TRANSPORT |
                   AIR_POLLUTION | WATER_POLLUTION | CORRUPTION |
                   GOVERNMENT_SCHEMES | AGRICULTURE | OTHERS
  IssuePriority  : LOW | MEDIUM | HIGH | CRITICAL
  IssueStatus    : REPORTED | UNDER_REVIEW | VERIFIED | ASSIGNED |
                   IN_PROGRESS | RESOLVED | REJECTED | CLOSED
  Role           : USER | LEADER | ADMINISTRATOR | REPRESENTATIVE
  ThemePreference: LIGHT | DARK | SYSTEM
  AuthProvider   : LOCAL | GOOGLE
  MediaType      : IMAGE | VIDEO
  VoteType       : UPVOTE | DOWNVOTE

Hazard → IssueCategory mapping (for DB persistence):
  flood     → FLOODING
  landslide → ROAD_DAMAGE
  heatwave  → PUBLIC_HEALTH (→ HEALTHCARE)
  drought   → AGRICULTURE
  cyclone   → FLOODING

Alert level → IssuePriority mapping:
  CRITICAL  → CRITICAL
  HIGH      → HIGH
  MEDIUM    → MEDIUM
  WATCH     → LOW
  NORMAL    → LOW

Routes (all return AIAnalysis-shaped payloads where applicable):

  GET  /health                                  — status + model version
  GET  /api/overview                            — all 30 districts summary
  GET  /api/district/{name}                     — full detail, AIAnalysis response
  GET  /api/anomalies/{name}                    — anomaly z-scores, AIAnalysis response
  GET  /api/forecast-alerts/{name}              — 72h forecast, AIAnalysis response
  GET  /api/pipeline-status                     — all districts pipeline health
  GET  /api/pipeline-status/{name}              — one district pipeline health
  GET  /api/risk-map/{name}                     — risk grid (raw dict)
  GET  /api/evac-routes/{name}                  — evacuation plan
  GET  /api/road-blocks/{name}                  — IoT signals + barricade states
  GET  /api/dam-advisories                      — all dam advisories
  GET  /api/bridge-advisories                   — all bridge advisories
  GET  /api/alert/{alert_id}/citizen            — citizen message for alert
  GET  /api/alert/{alert_id}/govt               — govt message for alert
  POST /api/alert/{alert_id}/ack                — acknowledge an alert
  POST /api/poll                                — trigger refresh
  GET  /api/shelters                            — all shelters
  GET  /api/geocode                             — forward geocode
  GET  /api/reverse-geocode                     — reverse geocode
  GET  /api/infrastructure                      — dam+bridge+drainage per district
  GET  /api/export/alerts                       — CSV download
  GET  /api/export/anomalies                    — CSV download

  POST /api/analyse/district                    — on-demand district analysis,
                                                  returns AIAnalysisResponse[]
  POST /api/analyse/hazard                      — single hazard analysis for
                                                  any text/issue, returns
                                                  AIAnalysisResponse

Usage:
    uvicorn hazard_api:app --host 0.0.0.0 --port 8002 --reload
=============================================================================
"""

import io, json, csv, logging, threading, time
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import uuid4

import numpy as np
from fastapi import FastAPI, HTTPException, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

# ── Local imports (same package) ──────────────────────────────────
from config import MONITORED_DISTRICTS, THRESHOLDS, ALERT_LEVELS
from data_fetcher import fetch_all, init_db, store_weather, load_history, get_recent_alerts
from predictor import full_response_cycle, _bndl
from response_engine import IOT_BARRICADE_STATES

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")
logger = logging.getLogger("netravaah.fastapi")

# ══════════════════════════════════════════════════════════════════
#  ENUMS — mirror schema.prisma exactly
# ══════════════════════════════════════════════════════════════════

class AIContentType(str, Enum):
    POST         = "POST"
    ISSUE_REPORT = "ISSUE_REPORT"
    COMMENT      = "COMMENT"

class AIModelType(str, Enum):
    SENTIMENT                = "SENTIMENT"
    PRIORITY                 = "PRIORITY"
    TOXICITY                 = "TOXICITY"
    CATEGORY_CLASSIFICATION  = "CATEGORY_CLASSIFICATION"
    LANGUAGE_DETECTION       = "LANGUAGE_DETECTION"
    DUPLICATE_DETECTION      = "DUPLICATE_DETECTION"
    ENTITY_EXTRACTION        = "ENTITY_EXTRACTION"
    MISINFORMATION_DETECTION = "MISINFORMATION_DETECTION"

class IssueCategory(str, Enum):
    WATER_SUPPLY        = "WATER_SUPPLY"
    ROAD_DAMAGE         = "ROAD_DAMAGE"
    ELECTRICITY         = "ELECTRICITY"
    STREET_LIGHTS       = "STREET_LIGHTS"
    DRAINAGE_AND_SEWAGE = "DRAINAGE_AND_SEWAGE"
    FLOODING            = "FLOODING"
    GARBAGE_COLLECTION  = "GARBAGE_COLLECTION"
    PUBLIC_TOILETS      = "PUBLIC_TOILETS"
    HEALTHCARE          = "HEALTHCARE"
    EDUCATION           = "EDUCATION"
    PUBLIC_SAFETY       = "PUBLIC_SAFETY"
    PUBLIC_TRANSPORT    = "PUBLIC_TRANSPORT"
    AIR_POLLUTION       = "AIR_POLLUTION"
    WATER_POLLUTION     = "WATER_POLLUTION"
    CORRUPTION          = "CORRUPTION"
    GOVERNMENT_SCHEMES  = "GOVERNMENT_SCHEMES"
    AGRICULTURE         = "AGRICULTURE"
    OTHERS              = "OTHERS"

class IssuePriority(str, Enum):
    LOW      = "LOW"
    MEDIUM   = "MEDIUM"
    HIGH     = "HIGH"
    CRITICAL = "CRITICAL"

class IssueStatus(str, Enum):
    REPORTED     = "REPORTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    VERIFIED     = "VERIFIED"
    ASSIGNED     = "ASSIGNED"
    IN_PROGRESS  = "IN_PROGRESS"
    RESOLVED     = "RESOLVED"
    REJECTED     = "REJECTED"
    CLOSED       = "CLOSED"

# Additional enums from schema.prisma (for completeness / future routes)
class Role(str, Enum):
    USER           = "USER"
    LEADER         = "LEADER"
    ADMINISTRATOR  = "ADMINISTRATOR"
    REPRESENTATIVE = "REPRESENTATIVE"

class ThemePreference(str, Enum):
    LIGHT  = "LIGHT"
    DARK   = "DARK"
    SYSTEM = "SYSTEM"

class AuthProvider(str, Enum):
    LOCAL  = "LOCAL"
    GOOGLE = "GOOGLE"

class MediaType(str, Enum):
    IMAGE = "IMAGE"
    VIDEO = "VIDEO"

class VoteType(str, Enum):
    UPVOTE   = "UPVOTE"
    DOWNVOTE = "DOWNVOTE"

# ══════════════════════════════════════════════════════════════════
#  HAZARD → SCHEMA MAPPINGS
# ══════════════════════════════════════════════════════════════════

# Maps NETRAVAAH hazard names → Prisma IssueCategory enum values
HAZARD_TO_CATEGORY: Dict[str, IssueCategory] = {
    "flood":     IssueCategory.FLOODING,
    "landslide": IssueCategory.ROAD_DAMAGE,
    "heatwave":  IssueCategory.HEALTHCARE,
    "drought":   IssueCategory.AGRICULTURE,
    "cyclone":   IssueCategory.FLOODING,
}

# Maps NETRAVAAH alert level strings → Prisma IssuePriority enum values
LEVEL_TO_PRIORITY: Dict[str, IssuePriority] = {
    "CRITICAL": IssuePriority.CRITICAL,
    "HIGH":     IssuePriority.HIGH,
    "MEDIUM":   IssuePriority.MEDIUM,
    "WATCH":    IssuePriority.LOW,
    "NORMAL":   IssuePriority.LOW,
}

# ══════════════════════════════════════════════════════════════════
#  PYDANTIC MODELS
# ══════════════════════════════════════════════════════════════════

class AIAnalysisResponse(BaseModel):
    """
    Mirror of the Prisma AIAnalysis model.
    Every hazard prediction result is shaped as this model so it can be
    persisted directly as an AIAnalysis DB row, linked to an IssueReport.
    """
    id:               str                      = Field(default_factory=lambda: str(uuid4()))
    contentType:      AIContentType            = AIContentType.ISSUE_REPORT
    modelType:        AIModelType              = AIModelType.PRIORITY
    postId:           Optional[str]            = None
    issueReportId:    Optional[str]            = None
    commentId:        Optional[str]            = None
    sentiments:       List[str]                = Field(default_factory=list)
    sentimentScore:   Optional[float]          = None
    priorityScore:    Optional[float]          = None
    toxicityScore:    Optional[float]          = None
    urgencyScore:     Optional[float]          = None
    impactScore:      Optional[float]          = None
    detectedLanguage: Optional[str]            = None
    issueCategory:    Optional[IssueCategory]  = None
    issuePriority:    Optional[IssuePriority]  = None
    confidence:       Optional[float]          = None
    extractedEntities: Optional[Dict[str, Any]] = None
    summary:          Optional[str]            = None
    modelName:        Optional[str]            = None
    modelVersion:     Optional[str]            = None
    processingTimeMs: Optional[int]            = None
    createdAt:        datetime                 = Field(default_factory=datetime.now)


# ── Request body for on-demand analysis routes ────────────────────

class DistrictAnalysisRequest(BaseModel):
    """
    On-demand district hazard analysis request.
    IssueReport FK fields are optional — if provided, the returned
    AIAnalysisResponse rows are linked to that IssueReport in the DB.
    """
    district:      str             = Field(..., description="District name (must be in MONITORED_DISTRICTS)")
    # IssueReport FK / context fields (mirror schema.prisma IssueReport model)
    issueReportId: Optional[str]   = None
    reporterId:    Optional[str]   = None
    caption:       Optional[str]   = Field(None, description="Issue caption — used as summary context")
    locationName:  Optional[str]   = None
    status:        IssueStatus     = IssueStatus.REPORTED
    priority:      IssuePriority   = IssuePriority.MEDIUM
    viewCount:     int             = 0
    isDuplicate:   bool            = False
    duplicateOfId: Optional[str]   = None
    assignedToId:  Optional[str]   = None


class HazardAnalysisRequest(BaseModel):
    """
    Analyse a single reported text/issue and map it to a hazard category.
    Used for classifying user-submitted IssueReports into natural hazard types.
    Fields mirror schema.prisma IssueReport + Post models.
    """
    # Content
    text:          str             = Field(..., description="Issue caption or post text")
    locationName:  Optional[str]   = None
    latitude:      Optional[float] = None
    longitude:     Optional[float] = None
    # IssueReport FK fields
    issueReportId: Optional[str]   = None
    postId:        Optional[str]   = None
    reporterId:    Optional[str]   = None
    # IssueReport status context
    status:        IssueStatus     = IssueStatus.REPORTED
    priority:      IssuePriority   = IssuePriority.MEDIUM


# ── Lightweight inline response models ───────────────────────────

class DistrictSummary(BaseModel):
    """Lightweight overview row — one per monitored district."""
    district:           str
    state:              str
    lat:                float
    lon:                float
    probabilities:      Dict[str, float]
    confidence_intervals: Dict[str, float]
    active_hazards:     List[str]
    overall_level:      str
    issuePriority:      IssuePriority          # schema-aligned alias for overall_level
    alert_count:        int
    anomaly_count:      int
    forecast_triggered: List[str]
    forecast_max_prob:  float
    timestamp:          str


class AnomalyResponse(BaseModel):
    """Anomaly detection result — also returned as AIAnalysisResponse."""
    district:          str
    timestamp:         str
    anomalies:         Dict[str, Any]
    anomaly_summary:   Dict[str, Any]
    baseline_source:   str
    weather_snapshot:  Dict[str, Any]
    # Schema-aligned field: ready-to-INSERT AIAnalysis row
    aiAnalysis:        AIAnalysisResponse


class ForecastAlertResponse(BaseModel):
    """72-hour forecast alert result — also returned as AIAnalysisResponse."""
    district:          str
    timestamp:         str
    forecast_alerts:   Dict[str, Any]
    summary:           Dict[str, Any]
    forecast_weather:  Dict[str, Any]
    triggered_hazards: List[str]
    # Schema-aligned field: ready-to-INSERT AIAnalysis row
    aiAnalysis:        AIAnalysisResponse


class PipelineStatusResponse(BaseModel):
    global_pipeline: Dict[str, bool]
    districts:       List[Dict[str, Any]]


class PollRequest(BaseModel):
    district: Optional[str] = None


class AckResponse(BaseModel):
    ok:    bool
    acked: int


# ══════════════════════════════════════════════════════════════════
#  IN-MEMORY CACHE  (same pattern as original Flask app)
# ══════════════════════════════════════════════════════════════════

_CACHE:   Dict[str, dict] = {}
_WEATHER: Dict[str, dict] = {}
_LOCK = threading.Lock()


def _run_district(loc: dict) -> dict:
    d, st, lat, lon = loc["district"], loc["state"], loc["lat"], loc["lon"]
    try:
        b         = _bndl()
        baselines = b.get("district_baselines", {})
        live      = fetch_all(loc, bundle_baselines=baselines)
        store_weather(live)
        history   = load_history(d, hours=72)
        result    = full_response_cycle(d, st, lat, lon, live, history)
        with _LOCK:
            _CACHE[d]   = result
            _WEATHER[d] = live
        logger.info(
            f"✓ {d}: {result['overall_level']} | active={result['active_hazards']} | "
            f"anomalies={result.get('anomaly_summary',{}).get('anomalies_detected',0)} | "
            f"72h={result.get('forecast_summary',{}).get('triggered_hazards',[])}"
        )
        return result
    except Exception as e:
        logger.error(f"✗ {d}: {e}", exc_info=True)
        return {}


def _monitor_loop():
    while True:
        logger.info("Monitor loop starting…")
        for loc in MONITORED_DISTRICTS:
            _run_district(loc)
            time.sleep(3)
        logger.info("Monitor loop complete. Sleeping 10 minutes.")
        time.sleep(600)


def _start_monitor():
    t = threading.Thread(target=_monitor_loop, daemon=True)
    t.start()
    logger.info("Background monitor started.")


# ══════════════════════════════════════════════════════════════════
#  HELPERS
# ══════════════════════════════════════════════════════════════════

def _district_loc(name: str) -> dict:
    """Return loc dict for district name or raise 404."""
    loc = next(
        (d for d in MONITORED_DISTRICTS if d["district"].lower() == name.lower()),
        None,
    )
    if not loc:
        raise HTTPException(status_code=404,
                            detail=f"District '{name}' not in monitored list")
    return loc


def _cached_or_run(name: str) -> dict:
    c = _CACHE.get(name)
    if not c:
        loc = _district_loc(name)
        c   = _run_district(loc)
    if not c:
        raise HTTPException(status_code=503,
                            detail=f"Data unavailable for district '{name}'")
    return c


def _level_to_priority(level: str) -> IssuePriority:
    return LEVEL_TO_PRIORITY.get(level, IssuePriority.LOW)


def _hazard_to_category(hazard: str) -> IssueCategory:
    return HAZARD_TO_CATEGORY.get(hazard.lower(), IssueCategory.OTHERS)


def _prob_to_sentiment(prob: float) -> List[str]:
    """Map hazard probability to sentiment labels (matches existing /ai/* convention)."""
    if prob >= 0.80: return ["critical", "very_negative", "urgent"]
    if prob >= 0.65: return ["high_risk", "negative", "urgent"]
    if prob >= 0.50: return ["medium_risk", "negative"]
    if prob >= 0.35: return ["watch", "neutral"]
    return ["normal", "positive"]


def _build_ai_analysis(
    result: dict,
    hazard: str,
    issue_report_id: Optional[str] = None,
    model_type: AIModelType = AIModelType.PRIORITY,
    processing_ms: int = 0,
) -> AIAnalysisResponse:
    """
    Convert a full_response_cycle result for one hazard into an
    AIAnalysisResponse (Prisma AIAnalysis-shaped) row.
    """
    probs   = result.get("probabilities", {})
    ci_map  = result.get("confidence_intervals", {})
    prob    = probs.get(hazard, 0.0)
    ci      = ci_map.get(hazard, 0.05)
    level   = result.get("overall_level", "NORMAL")

    # Per-hazard level (not the overall district level)
    if prob >= 0.80:   hazard_level = "CRITICAL"
    elif prob >= 0.65: hazard_level = "HIGH"
    elif prob >= 0.50: hazard_level = "MEDIUM"
    elif prob >= 0.35: hazard_level = "WATCH"
    else:              hazard_level = "NORMAL"

    alert_match = next(
        (a for a in result.get("alerts", []) if a.get("hazard") == hazard), {}
    )

    return AIAnalysisResponse(
        contentType      = AIContentType.ISSUE_REPORT,
        modelType        = model_type,
        issueReportId    = issue_report_id,
        sentiments       = _prob_to_sentiment(prob),
        priorityScore    = round(prob, 4),
        urgencyScore     = round(min(1.0, prob * 1.1), 4),
        impactScore      = round(min(1.0, prob * 0.9), 4),
        issueCategory    = _hazard_to_category(hazard),
        issuePriority    = _level_to_priority(hazard_level),
        confidence       = round(max(0.0, 1.0 - ci), 4),
        extractedEntities = {
            "district":              result.get("district"),
            "state":                 result.get("state"),
            "lat":                   result.get("lat"),
            "lon":                   result.get("lon"),
            "hazard":                hazard,
            "probability":           prob,
            "confidence_interval":   ci,
            "hazard_level":          hazard_level,
            "overall_level":         level,
            "active_hazards":        result.get("active_hazards", []),
            "is_forecast_based":     alert_match.get("is_forecast_based", False),
            "hours_ahead":           alert_match.get("hours_ahead", 0),
            "citizen_msg":           alert_match.get("citizen_msg", ""),
            "govt_msg":              alert_match.get("govt_msg", ""),
            "model_version":         result.get("model_version", "v4"),
            "weather_snapshot":      result.get("weather_snapshot", {}),
            "anomaly_summary":       result.get("anomaly_summary", {}),
            "forecast_summary":      result.get("forecast_summary", {}),
            "pipeline_status":       result.get("pipeline_status", {}),
        },
        summary          = (
            f"{result.get('district','')}: {hazard.capitalize()} risk {prob:.0%} "
            f"({hazard_level}) — {result.get('model_version','v4')}"
        ),
        modelName        = "NETRAVAAH-v5",
        modelVersion     = result.get("model_version", "v4"),
        processingTimeMs = processing_ms,
    )


def _db_conn():
    import sqlite3
    from config import DB_PATH
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ══════════════════════════════════════════════════════════════════
#  FASTAPI APP
# ══════════════════════════════════════════════════════════════════

app = FastAPI(
    title="NETRAVAAH v5 — Natural Hazard Early Warning API",
    description=(
        "AI-powered hazard prediction for 30 Indian districts. "
        "All prediction endpoints return AIAnalysis-shaped payloads "
        "aligned with schema.prisma so results can be persisted directly "
        "as AIAnalysis DB rows linked to IssueReport records. "
        "Hazards: flood, landslide, heatwave, drought, cyclone. "
        "Pipeline: Historical→Baseline→Live(7d)→Anomaly→Forecast(72h)"
        "→ML→Confidence Intervals→Alerts→Govt Response."
    ),
    version="5.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)


# ══════════════════════════════════════════════════════════════════
#  HEALTH
# ══════════════════════════════════════════════════════════════════

@app.get("/health", summary="API health check + model version")
def health():
    b = _bndl()
    return {
        "status":              "ok",
        "version":             "v5",
        "model_version":       b.get("version", "v4"),
        "cached_districts":    len(_CACHE),
        "districts_monitored": len(MONITORED_DISTRICTS),
        "timestamp":           datetime.now(timezone.utc).isoformat(),
        # Schema alignment info
        "schema_version":      "prisma@3.0",
        "schema_models":       ["AIAnalysis", "IssueReport", "Post", "User",
                                "Media", "Vote", "Comment"],
        "schema_enums":        ["AIContentType", "AIModelType", "IssueCategory",
                                "IssuePriority", "IssueStatus", "Role",
                                "ThemePreference", "AuthProvider", "MediaType",
                                "VoteType"],
        "hazard_category_map": {k: v.value for k, v in HAZARD_TO_CATEGORY.items()},
        "pipeline_components": {
            "historical_training":   True,
            "baseline_available":    bool(b.get("district_baselines")),
            "live_api":              True,
            "past_week_aggregation": True,
            "anomaly_detection":     True,
            "forecast_72h":          True,
            "ml_prediction":         True,
            "confidence_intervals":  True,
            "alert_generation":      True,
            "govt_response":         True,
        },
    }


# ══════════════════════════════════════════════════════════════════
#  OVERVIEW — all 30 districts
# ══════════════════════════════════════════════════════════════════

@app.get(
    "/api/overview",
    response_model=List[DistrictSummary],
    summary="All 30 districts — probabilities, active hazards, alert level, anomaly & forecast counts",
)
def overview():
    out = []
    for loc in MONITORED_DISTRICTS:
        d = loc["district"]
        c = _CACHE.get(d)
        if c:
            fa    = c.get("forecast_summary", {})
            level = c.get("overall_level", "NORMAL")
            out.append(DistrictSummary(
                district             = d,
                state                = loc["state"],
                lat                  = loc["lat"],
                lon                  = loc["lon"],
                probabilities        = c.get("probabilities", {}),
                confidence_intervals = c.get("confidence_intervals", {}),
                active_hazards       = c.get("active_hazards", []),
                overall_level        = level,
                issuePriority        = _level_to_priority(level),
                alert_count          = len(c.get("alerts", [])),
                anomaly_count        = c.get("anomaly_summary", {}).get("anomalies_detected", 0),
                forecast_triggered   = fa.get("triggered_hazards", []),
                forecast_max_prob    = fa.get("max_probability_72h", 0.0),
                timestamp            = c.get("timestamp", ""),
            ))
        else:
            out.append(DistrictSummary(
                district             = d,
                state                = loc["state"],
                lat                  = loc["lat"],
                lon                  = loc["lon"],
                probabilities        = {},
                confidence_intervals = {},
                active_hazards       = [],
                overall_level        = "LOADING",
                issuePriority        = IssuePriority.LOW,
                alert_count          = 0,
                anomaly_count        = 0,
                forecast_triggered   = [],
                forecast_max_prob    = 0.0,
                timestamp            = "",
            ))
    return out


# ══════════════════════════════════════════════════════════════════
#  DISTRICT DETAIL
# Returns full result + a list of per-hazard AIAnalysisResponse rows
# so the caller can INSERT into AIAnalysis table in one shot.
# ══════════════════════════════════════════════════════════════════

@app.get(
    "/api/district/{name}",
    summary="Full detail for one district — includes AIAnalysis rows per hazard",
)
def district_detail(
    name: str = Path(..., description="District name"),
    issue_report_id: Optional[str] = Query(None,
        alias="issueReportId",
        description="Link returned AIAnalysis rows to this IssueReport FK"),
):
    """
    Returns the complete NETRAVAAH result dict plus an `aiAnalyses` list —
    one AIAnalysisResponse per hazard — ready to INSERT as AIAnalysis rows
    linked to the given issueReportId.
    """
    t0  = time.time()
    loc = _district_loc(name)
    c   = _cached_or_run(name)
    ms  = int((time.time() - t0) * 1000)

    result = dict(c)
    # Strip heavy fields not needed for REST response
    if result.get("evac_plan"):
        ep = dict(result["evac_plan"])
        ep.pop("grid", None)
        result["evac_plan"] = ep
    result.pop("risk_grid", None)

    # Build per-hazard AIAnalysis rows
    ai_analyses = [
        _build_ai_analysis(c, hazard, issue_report_id,
                           AIModelType.PRIORITY, ms)
        for hazard in ["flood", "landslide", "heatwave", "drought", "cyclone"]
    ]

    result["aiAnalyses"] = [a.model_dump() for a in ai_analyses]
    return result


# ══════════════════════════════════════════════════════════════════
#  ANOMALY DETAIL
# ══════════════════════════════════════════════════════════════════

@app.get(
    "/api/anomalies/{name}",
    response_model=AnomalyResponse,
    summary="Anomaly detection — per-variable z-scores vs 3-year baseline + AIAnalysis row",
)
def anomaly_detail(
    name: str = Path(..., description="District name"),
    issue_report_id: Optional[str] = Query(None, alias="issueReportId"),
):
    t0   = time.time()
    c    = _cached_or_run(name)
    live = _WEATHER.get(name, {})
    ms   = int((time.time() - t0) * 1000)

    # Build an AIAnalysis row for the highest-anomaly variable
    an_summary   = c.get("anomaly_summary", {})
    an_count     = an_summary.get("anomalies_detected", 0)
    # Use the overall district level to drive priority
    level        = c.get("overall_level", "NORMAL")
    probs        = c.get("probabilities", {})
    lead_hazard  = max(probs, key=probs.get) if probs else "flood"
    max_prob     = probs.get(lead_hazard, 0.0)

    ai = AIAnalysisResponse(
        contentType       = AIContentType.ISSUE_REPORT,
        modelType         = AIModelType.ENTITY_EXTRACTION,   # anomaly extraction
        issueReportId     = issue_report_id,
        sentiments        = _prob_to_sentiment(max_prob),
        priorityScore     = round(max_prob, 4),
        urgencyScore      = round(min(1.0, max_prob * 1.1), 4),
        issueCategory     = _hazard_to_category(lead_hazard),
        issuePriority     = _level_to_priority(level),
        confidence        = round(1.0 - c.get("confidence_intervals", {}).get(lead_hazard, 0.1), 4),
        extractedEntities = {
            "district":         name,
            "anomalies":        live.get("anomalies", {}),
            "anomaly_summary":  an_summary,
            "anomalies_count":  an_count,
            "baseline_source":  live.get("anomalies", {}).get("summary", {}).get("baseline_source", "none"),
            "weather_snapshot": c.get("weather_snapshot", {}),
        },
        summary           = (
            f"{name}: {an_count} anomaly(s) detected — "
            f"lead hazard {lead_hazard} at {max_prob:.0%}"
        ),
        modelName         = "NETRAVAAH-v5-anomaly",
        modelVersion      = c.get("model_version", "v4"),
        processingTimeMs  = ms,
    )

    return AnomalyResponse(
        district         = name,
        timestamp        = c.get("timestamp", ""),
        anomalies        = live.get("anomalies", {}),
        anomaly_summary  = an_summary,
        baseline_source  = live.get("anomalies", {}).get("summary", {}).get("baseline_source", "none"),
        weather_snapshot = c.get("weather_snapshot", {}),
        aiAnalysis       = ai,
    )


# ══════════════════════════════════════════════════════════════════
#  FORECAST ALERTS (72-hour)
# ══════════════════════════════════════════════════════════════════

@app.get(
    "/api/forecast-alerts/{name}",
    response_model=ForecastAlertResponse,
    summary="72-hour forecast-based alerts for a district + AIAnalysis row",
)
def forecast_alerts(
    name: str = Path(..., description="District name"),
    issue_report_id: Optional[str] = Query(None, alias="issueReportId"),
):
    t0   = time.time()
    c    = _cached_or_run(name)
    live = _WEATHER.get(name, {})
    ms   = int((time.time() - t0) * 1000)

    fa              = live.get("forecast_alerts_72h", {})
    fc_summary      = fa.get("_summary", {})
    triggered       = c.get("forecast_triggered_hazards", [])
    probs           = c.get("probabilities", {})
    lead_hazard     = triggered[0] if triggered else (max(probs, key=probs.get) if probs else "flood")
    max_prob        = probs.get(lead_hazard, 0.0)
    level           = c.get("overall_level", "NORMAL")

    ai = AIAnalysisResponse(
        contentType       = AIContentType.ISSUE_REPORT,
        modelType         = AIModelType.PRIORITY,
        issueReportId     = issue_report_id,
        sentiments        = _prob_to_sentiment(max_prob),
        priorityScore     = round(max_prob, 4),
        urgencyScore      = round(min(1.0, max_prob * 1.15), 4),   # forecast = higher urgency
        impactScore       = round(min(1.0, max_prob * 0.9), 4),
        issueCategory     = _hazard_to_category(lead_hazard),
        issuePriority     = _level_to_priority(level),
        confidence        = round(1.0 - c.get("confidence_intervals", {}).get(lead_hazard, 0.1), 4),
        extractedEntities = {
            "district":          name,
            "triggered_hazards": triggered,
            "forecast_alerts":   {h: v for h, v in fa.items() if h != "_summary"},
            "forecast_summary":  fc_summary,
            "forecast_weather": {
                "rain_72h_mm":      live.get("forecast_rain_72h"),
                "rain_24h_mm":      live.get("forecast_rain_24h"),
                "temp_max_c":       live.get("forecast_temp_max"),
                "wind_max_mps":     live.get("forecast_wind_max"),
                "pressure_min_hpa": live.get("forecast_pressure_min"),
                "vpd_max_kpa":      live.get("forecast_vpd_max"),
            },
            "hours_ahead": 72,
        },
        summary           = (
            f"{name}: 72h forecast — {lead_hazard} risk {max_prob:.0%}. "
            f"Triggered: {triggered or ['none']}"
        ),
        modelName         = "NETRAVAAH-v5-forecast",
        modelVersion      = c.get("model_version", "v4"),
        processingTimeMs  = ms,
    )

    return ForecastAlertResponse(
        district          = name,
        timestamp         = c.get("timestamp", ""),
        forecast_alerts   = {h: v for h, v in fa.items() if h != "_summary"},
        summary           = fc_summary,
        forecast_weather  = {
            "rain_72h_mm":      live.get("forecast_rain_72h"),
            "rain_24h_mm":      live.get("forecast_rain_24h"),
            "temp_max_c":       live.get("forecast_temp_max"),
            "wind_max_mps":     live.get("forecast_wind_max"),
            "pressure_min_hpa": live.get("forecast_pressure_min"),
            "vpd_max_kpa":      live.get("forecast_vpd_max"),
        },
        triggered_hazards = triggered,
        aiAnalysis        = ai,
    )


# ══════════════════════════════════════════════════════════════════
#  PIPELINE STATUS
# ══════════════════════════════════════════════════════════════════

@app.get(
    "/api/pipeline-status",
    response_model=PipelineStatusResponse,
    summary="All 9 pipeline components across all 30 districts",
)
def pipeline_status_all():
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
                "overall_level": c.get("overall_level", "LOADING"),
                "issuePriority": _level_to_priority(c.get("overall_level","NORMAL")).value,
                "timestamp":  c.get("timestamp", ""),
            })

    return PipelineStatusResponse(
        global_pipeline={
            "historical_dataset_training": True,
            "baseline_climate_patterns":   bool(b.get("district_baselines")),
            "live_api_integration":        True,
            "past_week_analysis":          True,
            "anomaly_detection":           True,
            "forecast_72h":                True,
            "ml_prediction":               True,
            "alert_generation":            True,
            "govt_response":               True,
        },
        districts=rows,
    )


@app.get(
    "/api/pipeline-status/{name}",
    summary="Pipeline status for one district",
)
def pipeline_status_district(name: str = Path(..., description="District name")):
    c = _CACHE.get(name)
    if not c:
        raise HTTPException(status_code=404,
                            detail=f"District '{name}' not yet cached — call POST /api/poll first")
    level = c.get("overall_level", "NORMAL")
    return {
        "district":        name,
        "pipeline_status": c.get("pipeline_status", {}),
        "anomaly_summary": c.get("anomaly_summary", {}),
        "forecast_summary":c.get("forecast_summary", {}),
        "model_version":   c.get("model_version", "unknown"),
        "overall_level":   level,
        "issuePriority":   _level_to_priority(level).value,
        "timestamp":       c.get("timestamp", ""),
    }


# ══════════════════════════════════════════════════════════════════
#  RISK MAP
# ══════════════════════════════════════════════════════════════════

@app.get("/api/risk-map/{name}", summary="Raw risk grid for a district")
def risk_map(name: str = Path(..., description="District name")):
    c = _cached_or_run(name)
    return c.get("risk_grid") or {}


# ══════════════════════════════════════════════════════════════════
#  EVACUATION ROUTES
# ══════════════════════════════════════════════════════════════════

@app.get("/api/evac-routes/{name}", summary="Evacuation plan for a district")
def evac_routes(
    name:   str = Path(..., description="District name"),
    hazard: str = Query("flood", description="Hazard type: flood | landslide | heatwave | drought | cyclone"),
):
    loc = _district_loc(name)
    c   = _CACHE.get(loc["district"])
    if c:
        live  = _WEATHER.get(loc["district"], {})
        probs = c.get("probabilities", {})
    else:
        live  = fetch_all(loc)
        probs = {}
    from response_engine import plan_evacuation
    plan = plan_evacuation(
        loc["district"], loc["lat"], loc["lon"],
        loc["state"], live, probs, hazard,
    )
    return plan


# ══════════════════════════════════════════════════════════════════
#  ROAD BLOCKS / IOT SIGNALS
# ══════════════════════════════════════════════════════════════════

@app.get("/api/road-blocks/{name}", summary="IoT barricade signals for a district")
def road_blocks(name: str = Path(..., description="District name")):
    c  = _CACHE.get(name)
    if not c:
        return {"district": name, "signals": [], "barricade_states": {}}
    ep = c.get("evac_plan") or {}
    return {
        "district":         name,
        "signals":          ep.get("iot_signals", []),
        "roads_blocked":    ep.get("roads_blocked", 0),
        "barricade_states": dict(IOT_BARRICADE_STATES),
        "timestamp":        c.get("timestamp", ""),
    }


# ══════════════════════════════════════════════════════════════════
#  DAM + BRIDGE ADVISORIES
# ══════════════════════════════════════════════════════════════════

@app.get("/api/dam-advisories", summary="All dam advisories sorted by urgency")
def dam_advisories():
    advs = []
    for d, c in _CACHE.items():
        for adv in c.get("dam_advisories", []):
            advs.append(adv)
    advs.sort(key=lambda x: {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "WATCH": 3, "NORMAL": 4}
              .get(x.get("urgency", "NORMAL"), 4))
    return advs


@app.get("/api/bridge-advisories", summary="All bridge advisories")
def bridge_advisories():
    advs = []
    for d, c in _CACHE.items():
        for adv in c.get("bridge_advisories", []):
            advs.append({**adv, "district": d})
    return advs


# ══════════════════════════════════════════════════════════════════
#  INFRASTRUCTURE (dam + bridge + drainage)
# ══════════════════════════════════════════════════════════════════

@app.get("/api/infrastructure", summary="Dam, bridge and drainage advisories per district")
def infrastructure():
    out = {}
    for d, c in _CACHE.items():
        out[d] = {
            "dam_advisories":    c.get("dam_advisories", []),
            "bridge_advisories": c.get("bridge_advisories", []),
            "drainage_advisory": c.get("drainage_advisory", {}),
        }
    return out


# ══════════════════════════════════════════════════════════════════
#  ALERT MESSAGES (citizen + govt)
# ══════════════════════════════════════════════════════════════════

@app.get("/api/alert/{alert_id}/citizen",
         summary="Citizen-facing message for a stored alert")
def citizen_msg(alert_id: int = Path(..., description="Alert DB row id")):
    conn = _db_conn()
    row  = conn.execute("SELECT * FROM alerts WHERE id=?", (alert_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"alert_id": alert_id, "citizen_msg": row["citizen_msg"]}


@app.get("/api/alert/{alert_id}/govt",
         summary="Government-facing message for a stored alert")
def govt_msg(alert_id: int = Path(..., description="Alert DB row id")):
    conn = _db_conn()
    row  = conn.execute("SELECT * FROM alerts WHERE id=?", (alert_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"alert_id": alert_id, "govt_msg": row["govt_msg"]}


@app.post("/api/alert/{alert_id}/ack",
          response_model=AckResponse,
          summary="Acknowledge an alert — sets ack=1 in the DB")
def ack_alert(alert_id: int = Path(..., description="Alert DB row id")):
    conn = _db_conn()
    conn.execute("UPDATE alerts SET ack=1 WHERE id=?", (alert_id,))
    conn.commit()
    conn.close()
    return AckResponse(ok=True, acked=alert_id)


# ══════════════════════════════════════════════════════════════════
#  POLL — trigger refresh
# ══════════════════════════════════════════════════════════════════

@app.post("/api/poll", summary="Trigger a background refresh (one district or all)")
def poll(body: PollRequest = PollRequest()):
    if body.district:
        loc = _district_loc(body.district)
        threading.Thread(target=_run_district, args=(loc,), daemon=True).start()
        return {"queued": body.district}
    threading.Thread(target=_monitor_loop, daemon=True).start()
    return {"queued": "all"}


# ══════════════════════════════════════════════════════════════════
#  SHELTERS
# ══════════════════════════════════════════════════════════════════

@app.get("/api/shelters", summary="All registered shelters with capacity and type")
def shelters():
    from config import SHELTERS
    return SHELTERS


# ══════════════════════════════════════════════════════════════════
#  GEOCODING
# ══════════════════════════════════════════════════════════════════

@app.get("/api/geocode", summary="Forward geocode an address")
def geocode(q: str = Query(..., description="Address string to geocode")):
    from response_engine import geocode_address
    result = geocode_address(q)
    if not result:
        raise HTTPException(status_code=404, detail="Address not found")
    return result


@app.get("/api/reverse-geocode", summary="Reverse geocode lat/lon to address")
def reverse_geocode(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    from response_engine import reverse_geocode as _rev
    result = _rev(lat, lon)
    if not result:
        raise HTTPException(status_code=404, detail="Location not found")
    return result


# ══════════════════════════════════════════════════════════════════
#  CSV EXPORTS
# ══════════════════════════════════════════════════════════════════

@app.get("/api/export/alerts",
         summary="Export all alerts as CSV",
         response_class=StreamingResponse)
def export_alerts():
    conn = _db_conn()
    rows = conn.execute(
        """SELECT id,ts,district,state,hazard,probability,level,
                  is_forecast_based,hours_ahead,ack
           FROM alerts ORDER BY ts DESC"""
    ).fetchall()
    conn.close()

    buf = io.StringIO()
    w   = csv.writer(buf)
    w.writerow(["id", "timestamp", "district", "state", "hazard",
                "probability", "level", "is_forecast_based", "hours_ahead", "acknowledged"])
    w.writerows(rows)

    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=netravaah_alerts.csv"},
    )


@app.get("/api/export/anomalies",
         summary="Export detected anomalies as CSV",
         response_class=StreamingResponse)
def export_anomalies():
    conn = _db_conn()
    rows = conn.execute(
        "SELECT * FROM anomaly_log ORDER BY ts DESC LIMIT 1000"
    ).fetchall()
    conn.close()

    buf = io.StringIO()
    w   = csv.writer(buf)
    w.writerow(["id", "ts", "district", "state", "variable",
                "z_score", "severity", "live_value", "baseline_mean"])
    w.writerows(rows)

    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=netravaah_anomalies.csv"},
    )


# ══════════════════════════════════════════════════════════════════
#  ON-DEMAND AI ANALYSIS ROUTES
#  These are the schema-native endpoints — they return full
#  List[AIAnalysisResponse] ready to INSERT into the AIAnalysis table.
# ══════════════════════════════════════════════════════════════════

@app.post(
    "/api/analyse/district",
    response_model=List[AIAnalysisResponse],
    summary=(
        "On-demand district analysis — returns one AIAnalysisResponse per hazard. "
        "Pass issueReportId to link results to an existing IssueReport in the DB."
    ),
)
def analyse_district(req: DistrictAnalysisRequest):
    """
    Triggers a fresh full_response_cycle for the given district and returns
    five AIAnalysisResponse rows (one per hazard: flood, landslide, heatwave,
    drought, cyclone), each ready to INSERT into the Prisma AIAnalysis table
    with issueReportId as the foreign key.

    This is the primary integration point between the hazard pipeline and the
    civic platform schema — call this when a new IssueReport is created for
    a monitored district.
    """
    t0  = time.time()
    loc = _district_loc(req.district)

    # Force fresh run
    result = _run_district(loc)
    if not result:
        raise HTTPException(status_code=503,
                            detail=f"Prediction failed for district '{req.district}'")

    ms = int((time.time() - t0) * 1000)

    return [
        _build_ai_analysis(result, hazard, req.issueReportId,
                           AIModelType.PRIORITY, ms)
        for hazard in ["flood", "landslide", "heatwave", "drought", "cyclone"]
    ]


@app.post(
    "/api/analyse/hazard",
    response_model=AIAnalysisResponse,
    summary=(
        "Classify a text/issue report into a hazard category + priority. "
        "Returns a single AIAnalysisResponse ready to INSERT as an AIAnalysis row."
    ),
)
def analyse_hazard(req: HazardAnalysisRequest):
    """
    Maps a user-submitted IssueReport text to a natural hazard category using
    keyword + location heuristics, then optionally enriches with live district
    predictions if the location matches a monitored district.

    Returns an AIAnalysisResponse that can be persisted directly:
      - issueCategory maps to the closest IssueCategory enum value
      - issuePriority is derived from the live district alert level
      - extractedEntities carries the full prediction payload
    """
    t0  = time.time()
    txt = req.text.lower()

    # ── Keyword → hazard mapping ──────────────────────────────────
    KEYWORD_MAP = {
        "flood":     ["flood", "inundation", "waterlogging", "submerge",
                      "deluge", "overflow", "river", "embankment"],
        "landslide": ["landslide", "mudslide", "hillslip", "slope",
                      "debris", "rockfall", "land slip"],
        "heatwave":  ["heat", "heatwave", "hot", "temperature", "sunstroke",
                      "loo", "scorching", "burning"],
        "drought":   ["drought", "dry", "water scarcity", "no rain",
                      "crop failure", "groundwater", "famine"],
        "cyclone":   ["cyclone", "hurricane", "storm", "typhoon",
                      "wind", "gale", "depression"],
    }

    # Score each hazard by keyword hits
    scores: Dict[str, int] = {h: 0 for h in KEYWORD_MAP}
    for hazard, keywords in KEYWORD_MAP.items():
        for kw in keywords:
            if kw in txt:
                scores[hazard] += 1

    lead_hazard = max(scores, key=scores.get)
    if scores[lead_hazard] == 0:
        lead_hazard = "flood"   # default

    # ── Try to enrich with live district prediction ───────────────
    matched_district = None
    if req.locationName:
        loc_lower = req.locationName.lower()
        for loc in MONITORED_DISTRICTS:
            if loc["district"].lower() in loc_lower or loc_lower in loc["district"].lower():
                matched_district = loc
                break

    live_result: Optional[dict] = None
    if matched_district:
        live_result = _CACHE.get(matched_district["district"])
        if not live_result:
            try:
                live_result = _run_district(matched_district)
            except Exception:
                live_result = None

    ms = int((time.time() - t0) * 1000)

    if live_result:
        # Return a full, live-enriched AIAnalysis row
        ai = _build_ai_analysis(
            live_result, lead_hazard,
            req.issueReportId or req.postId,
            AIModelType.CATEGORY_CLASSIFICATION, ms,
        )
        # Override issueReportId/postId correctly
        ai.issueReportId = req.issueReportId
        ai.postId        = req.postId
        return ai

    # ── Fallback: heuristic-only response ────────────────────────
    PRIORITY_BY_HAZARD = {
        "cyclone":   IssuePriority.CRITICAL,
        "flood":     IssuePriority.HIGH,
        "landslide": IssuePriority.HIGH,
        "heatwave":  IssuePriority.MEDIUM,
        "drought":   IssuePriority.MEDIUM,
    }

    return AIAnalysisResponse(
        contentType       = AIContentType.ISSUE_REPORT,
        modelType         = AIModelType.CATEGORY_CLASSIFICATION,
        issueReportId     = req.issueReportId,
        postId            = req.postId,
        sentiments        = [lead_hazard],
        priorityScore     = round(min(1.0, scores[lead_hazard] * 0.2 + 0.3), 4),
        issueCategory     = _hazard_to_category(lead_hazard),
        issuePriority     = PRIORITY_BY_HAZARD.get(lead_hazard, IssuePriority.MEDIUM),
        confidence        = round(min(1.0, 0.4 + scores[lead_hazard] * 0.15), 4),
        extractedEntities = {
            "matched_hazard":   lead_hazard,
            "keyword_scores":   scores,
            "location":         req.locationName,
            "latitude":         req.latitude,
            "longitude":        req.longitude,
            "district_matched": None,
            "live_enriched":    False,
            "input_text":       req.text[:200],
        },
        summary           = (
            f"Text classified as '{lead_hazard}' hazard "
            f"(keyword score={scores[lead_hazard]}) — "
            f"no live district match for '{req.locationName}'"
        ),
        modelName         = "NETRAVAAH-v5-classifier",
        modelVersion      = _bndl().get("version", "v4"),
        processingTimeMs  = ms,
    )


# ══════════════════════════════════════════════════════════════════
#  STARTUP
# ══════════════════════════════════════════════════════════════════

@app.on_event("startup")
def startup():
    init_db()
    logger.info("NETRAVAAH v5 FastAPI starting…")
    logger.info("Pipeline: Training→Baseline→Live(7d)→Anomaly→Forecast(72h)→ML→Alert→Govt")
    _start_monitor()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("hazard_api:app", host="0.0.0.0", port=8002, reload=True)
