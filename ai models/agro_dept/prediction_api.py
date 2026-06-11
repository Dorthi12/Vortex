"""
=============================================================================
PREDICTION API  — FastAPI  (schema-aligned with schema.prisma)
FILE: prediction_api/prediction_api.py

Pydantic response models mirror Prisma schema models 1-to-1:

  AIAnalysisResponse       → AIAnalysis
    id (uuid), contentType, modelType,
    postId?, issueReportId?, commentId?,
    sentiments[], sentimentScore?, priorityScore?, toxicityScore?,
    urgencyScore?, impactScore?, detectedLanguage?,
    issueCategory?, issuePriority?, confidence?,
    extractedEntities? (Json), summary?, modelName?, modelVersion?,
    processingTimeMs?, createdAt (datetime)

  SentimentAnalysisResponse → SentimentAnalysis
    id (uuid), postId,
    text?, finalIssue? (IssueCategory), confidence?, decidedBy?,
    sentimentLabel?, sentimentScore?, priorityScore?,
    wardNumber?, assignedToDepartment?,
    locations? (Json), textAnalysis? (Json), imageAnalysis? (Json),
    processedAt? (datetime), nlpProcessed (bool), createdAt (datetime)

  PostAnalysisFullResponse  — combined response for /ai/analyse/post
    aiAnalyses: list[AIAnalysisResponse]   — one per model, ready to INSERT
    sentimentAnalysis: SentimentAnalysisResponse — ready to INSERT

Request models carry all relevant FK and status fields from Prisma:

  PostAnalysisRequest    → Post fields (postId, authorId, caption,
                           locationName, latitude, longitude,
                           sentimentScore?, priorityScore?, imageUrl?)

  IssueAnalysisRequest   → IssueReport fields (issueReportId, reporterId,
                           caption, description, latitude, longitude,
                           locationName, status, priority, viewCount,
                           isDuplicate, duplicateOfId, assignedToId,
                           imageUrls[])

  DuplicateRequest       → IssueReport duplicate fields (isDuplicate,
                           duplicateOfId) + existingIssues context

Enums — all mirror schema.prisma exactly:
  AIContentType    : POST | ISSUE_REPORT | COMMENT
  AIModelType      : SENTIMENT | PRIORITY | TOXICITY |
                     CATEGORY_CLASSIFICATION | LANGUAGE_DETECTION |
                     DUPLICATE_DETECTION | ENTITY_EXTRACTION |
                     MISINFORMATION_DETECTION
  IssueCategory    : WATER_SUPPLY | ROAD_DAMAGE | ELECTRICITY |
                     STREET_LIGHTS | DRAINAGE_AND_SEWAGE | FLOODING |
                     GARBAGE_COLLECTION | PUBLIC_TOILETS | HEALTHCARE |
                     EDUCATION | PUBLIC_SAFETY | PUBLIC_TRANSPORT |
                     AIR_POLLUTION | WATER_POLLUTION | CORRUPTION |
                     GOVERNMENT_SCHEMES | AGRICULTURE | OTHERS
  IssuePriority    : LOW | MEDIUM | HIGH | CRITICAL
  IssueStatus      : REPORTED | UNDER_REVIEW | VERIFIED | ASSIGNED |
                     IN_PROGRESS | RESOLVED | REJECTED | CLOSED
  Role             : USER | LEADER | ADMINISTRATOR | REPRESENTATIVE
  ThemePreference  : LIGHT | DARK | SYSTEM
  AuthProvider     : LOCAL | GOOGLE
  MediaType        : IMAGE | VIDEO
  VoteType         : UPVOTE | DOWNVOTE

Agricultural prediction endpoints (Models 1-6) return AIAnalysisResponse
with issueCategory=AGRICULTURE so results can be persisted as AIAnalysis rows.

Routes:
  POST /ai/analyse/post              — PostAnalysisFullResponse (AIAnalysis[] + SentimentAnalysis)
  POST /ai/analyse/issue             — List[AIAnalysisResponse]
  POST /ai/sentiment                 — AIAnalysisResponse
  POST /ai/classify                  — AIAnalysisResponse
  POST /ai/priority                  — AIAnalysisResponse
  POST /ai/duplicate                 — AIAnalysisResponse
  POST /ai/entities                  — AIAnalysisResponse
  POST /ai/toxicity                  — AIAnalysisResponse

  POST /predict/yield                — Model 1: crop yield
  POST /predict/stress               — Model 2: crop stress
  POST /predict/disease              — Model 3: disease + Gemini remedy
  POST /predict/irrigation           — Model 4: irrigation requirement
  POST /predict/crop_recommendation  — Model 5: crop suitability
  POST /predict/risk                 — Model 6: composite risk score

  GET  /predict/district_bulletin    — combined district advisory
  GET  /health

Usage:
    uvicorn prediction_api.prediction_api:app --host 0.0.0.0 --port 8001 --reload
=============================================================================
"""

import os, sys, time, logging, json
from typing import Optional, List, Any, Dict
from datetime import datetime
from enum import Enum
from uuid import uuid4

import numpy as np
import requests
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

log = logging.getLogger("PredictionAPI")
logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s [%(levelname)s] %(message)s")

# ─────────────────────────────────────────────────────────────────────────────
# Paths & keys
# ─────────────────────────────────────────────────────────────────────────────
OUTPUT_DIR = os.getenv("OUTPUT_DIR", "./outputs")
MODELS_DIR = os.path.join(OUTPUT_DIR, "saved_models")
os.makedirs(MODELS_DIR, exist_ok=True)

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "models"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "decision_engine"))

GEMINI_API_KEY  = os.getenv("GEMINI_API_KEY",  "AIzaSyDDgHtjNZYdbV0Ojtkf7jfVYSr8GsgfA2Q")
OPENWEATHER_KEY = os.getenv("OPENWEATHER_KEY", "701cf29be2f669b6266eb7b847b13a55")
WEATHERBIT_KEY  = os.getenv("WEATHERBIT_KEY",  "ffd13dad3d6c49a39f4b1b6a77b8d222")
OPEN_METEO_URL  = "https://api.open-meteo.com/v1/forecast"
GEMINI_URL      = (
    f"https://generativelanguage.googleapis.com/v1beta/models/"
    f"gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
)

# ─────────────────────────────────────────────────────────────────────────────
# Enums — mirror schema.prisma exactly
# ─────────────────────────────────────────────────────────────────────────────

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

# ─────────────────────────────────────────────────────────────────────────────
# Shared response shape: AIAnalysis — matches Prisma model exactly
# ─────────────────────────────────────────────────────────────────────────────

class AIAnalysisResponse(BaseModel):
    """
    Mirror of the Prisma AIAnalysis model.
    Every /ai/* route returns this (or a list of these for full-analysis).
    Fields match schema.prisma AIAnalysis exactly — ready to INSERT as a DB row.
    """
    id:                 str                      = Field(default_factory=lambda: str(uuid4()))
    contentType:        AIContentType
    modelType:          AIModelType
    postId:             Optional[str]            = None
    issueReportId:      Optional[str]            = None
    commentId:          Optional[str]            = None
    sentiments:         List[str]                = Field(default_factory=list)
    sentimentScore:     Optional[float]          = None
    priorityScore:      Optional[float]          = None
    toxicityScore:      Optional[float]          = None
    urgencyScore:       Optional[float]          = None
    impactScore:        Optional[float]          = None
    detectedLanguage:   Optional[str]            = None
    issueCategory:      Optional[IssueCategory]  = None
    issuePriority:      Optional[IssuePriority]  = None
    confidence:         Optional[float]          = None
    extractedEntities:  Optional[Dict[str, Any]] = None
    summary:            Optional[str]            = None
    modelName:          Optional[str]            = None
    modelVersion:       Optional[str]            = None
    processingTimeMs:   Optional[int]            = None
    createdAt:          datetime                 = Field(default_factory=datetime.now)

# ─────────────────────────────────────────────────────────────────────────────
# SentimentAnalysisResponse — mirrors Prisma SentimentAnalysis model exactly
# Used by /ai/analyse/post to also return a SentimentAnalysis-shaped row
# ─────────────────────────────────────────────────────────────────────────────

class SentimentAnalysisResponse(BaseModel):
    """
    Mirror of the Prisma SentimentAnalysis model.
    Returned alongside AIAnalysisResponse by /ai/analyse/post so the caller
    can persist both AIAnalysis rows AND a SentimentAnalysis row in one call.
    """
    id:                   str                      = Field(default_factory=lambda: str(uuid4()))
    postId:               str
    text:                 Optional[str]            = None
    finalIssue:           Optional[IssueCategory]  = None
    confidence:           Optional[float]          = None
    decidedBy:            Optional[str]            = None          # e.g. "gemini-1.5-flash"
    sentimentLabel:       Optional[str]            = None
    sentimentScore:       Optional[float]          = None
    priorityScore:        Optional[float]          = None
    wardNumber:           Optional[str]            = None
    assignedToDepartment: Optional[str]            = None
    locations:            Optional[Dict[str, Any]] = None          # Json in schema
    textAnalysis:         Optional[Dict[str, Any]] = None          # Json in schema
    imageAnalysis:        Optional[Dict[str, Any]] = None          # Json in schema
    processedAt:          Optional[datetime]        = None
    nlpProcessed:         bool                     = False
    createdAt:            datetime                 = Field(default_factory=datetime.now)


# ─────────────────────────────────────────────────────────────────────────────
# Combined response for /ai/analyse/post — AIAnalysis rows + SentimentAnalysis row
# ─────────────────────────────────────────────────────────────────────────────

class PostAnalysisFullResponse(BaseModel):
    """
    Full response for POST /ai/analyse/post.
    aiAnalyses  — list of AIAnalysis rows to INSERT (one per model run)
    sentimentAnalysis — SentimentAnalysis row to INSERT (linked to Post via postId)
    """
    aiAnalyses:        List[AIAnalysisResponse]
    sentimentAnalysis: SentimentAnalysisResponse


# ─────────────────────────────────────────────────────────────────────────────
# Request bodies — schema-driven (IDs match DB foreign keys)
# ─────────────────────────────────────────────────────────────────────────────

class PostAnalysisRequest(BaseModel):
    # Post FK fields
    postId:        Optional[str]   = None
    authorId:      Optional[str]   = None
    # Post content fields (mirror schema.prisma Post model)
    caption:       str             = Field(..., description="Post caption / body text")
    locationName:  Optional[str]   = None
    latitude:      Optional[float] = None
    longitude:     Optional[float] = None
    # Existing Post scores — pass if already computed, otherwise API will derive them
    sentimentScore: Optional[float] = Field(None, description="Existing Post.sentimentScore from DB")
    priorityScore:  Optional[float] = Field(None, description="Existing Post.priorityScore from DB")
    # Vision input for Gemini image analysis
    imageUrl:      Optional[str]   = None


class IssueAnalysisRequest(BaseModel):
    # IssueReport FK / identity fields
    issueReportId: Optional[str]         = None
    reporterId:    Optional[str]         = None
    assignedToId:  Optional[str]         = None      # IssueReport.assignedToId
    # IssueReport content fields (mirror schema.prisma IssueReport model)
    caption:       str                   = Field(..., description="Issue title / caption")
    description:   Optional[str]         = None
    latitude:      float                 = 20.5
    longitude:     float                 = 78.9
    locationName:  Optional[str]         = None
    # IssueReport status fields — pass current DB values so AI can factor them in
    status:        IssueStatus           = IssueStatus.REPORTED
    priority:      IssuePriority         = IssuePriority.MEDIUM
    viewCount:     int                   = 0
    isDuplicate:   bool                  = False
    duplicateOfId: Optional[str]         = None
    # Media attached to the issue (urls for Gemini vision)
    imageUrls:     List[str]             = Field(default_factory=list)


class SentimentRequest(BaseModel):
    contentType:   AIContentType = AIContentType.POST
    postId:        Optional[str] = None
    issueReportId: Optional[str] = None
    commentId:     Optional[str] = None
    text:          str           = Field(..., description="Text to analyse")


class ClassifyRequest(BaseModel):
    contentType:   AIContentType = AIContentType.ISSUE_REPORT
    postId:        Optional[str] = None
    issueReportId: Optional[str] = None
    text:          str           = Field(..., description="Text to classify")


class PriorityRequest(BaseModel):
    contentType:    AIContentType          = AIContentType.ISSUE_REPORT
    postId:         Optional[str]          = None
    issueReportId:  Optional[str]          = None
    text:           str                    = Field(..., description="Text to score")
    sentimentScore: Optional[float]        = None
    issueCategory:  Optional[IssueCategory]= None


class DuplicateRequest(BaseModel):
    contentType:    AIContentType        = AIContentType.ISSUE_REPORT
    issueReportId:  Optional[str]        = None
    caption:        str                  = Field(..., description="New issue text")
    latitude:       float                = 20.5
    longitude:      float                = 78.9
    # Pass current IssueReport.isDuplicate / duplicateOfId if re-checking
    isDuplicate:    bool                 = False      # IssueReport.isDuplicate
    duplicateOfId:  Optional[str]        = None       # IssueReport.duplicateOfId
    existingIssues: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="List of {id, caption, latitude, longitude} from DB"
    )


class EntityRequest(BaseModel):
    contentType:   AIContentType = AIContentType.POST
    postId:        Optional[str] = None
    issueReportId: Optional[str] = None
    text:          str           = Field(..., description="Text to extract from")
    latitude:      Optional[float]= None
    longitude:     Optional[float]= None


class ToxicityRequest(BaseModel):
    contentType: AIContentType = AIContentType.COMMENT
    commentId:   Optional[str] = None
    postId:      Optional[str] = None
    text:        str           = Field(..., description="Text to check")


# ─────────────────────────────────────────────────────────────────────────────
# Agricultural Prediction Requests
# All include optional postId / issueReportId so predictions can be persisted
# as AIAnalysis rows with issueCategory=AGRICULTURE
# ─────────────────────────────────────────────────────────────────────────────

class YieldRequest(BaseModel):
    district:      str   = "chittoor"
    crop:          str   = "Rice"
    area_ha:       float = 10.0
    fertilizer_kg: float = 150.0
    irrigation:    bool  = True
    soil_ph:       float = 6.5
    soil_type_idx: int   = 2
    season:        str   = "Kharif"
    postId:        Optional[str] = None
    issueReportId: Optional[str] = None


class StressRequest(BaseModel):
    district:      str   = "hyderabad"
    crop:          str   = "Rice"
    season:        str   = "Kharif"
    ndvi:          float = 0.55
    postId:        Optional[str] = None
    issueReportId: Optional[str] = None


class DiseaseRequest(BaseModel):
    district:           str  = "hyderabad"
    disease_text:       str  = ""
    farmer_description: str  = ""
    postId:             Optional[str] = None
    issueReportId:      Optional[str] = None


class IrrigationRequest(BaseModel):
    district:      str   = "lucknow"
    crop:          str   = "Wheat"
    days_sowing:   int   = 45
    area_ha:       float = 8.0
    elevation_m:   float = 120.0
    postId:        Optional[str] = None
    issueReportId: Optional[str] = None


class SuitabilityRequest(BaseModel):
    district:       str   = "jaipur"
    soil_type_idx:  int   = 1
    ph:             float = 7.2
    nitrogen:       float = 180.0
    organic_matter: float = 0.9
    season:         str   = "Rabi"
    postId:         Optional[str] = None
    issueReportId:  Optional[str] = None


class RiskRequest(BaseModel):
    district:      str   = "patna"
    crop:          str   = "Rice"
    area_ha:       float = 10.0
    fertilizer_kg: float = 150.0
    irrigation:    bool  = True
    postId:        Optional[str] = None
    issueReportId: Optional[str] = None


# ─────────────────────────────────────────────────────────────────────────────
# FastAPI app
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="AgriAdvisory & Civic AI API",
    description=(
        "AI analysis endpoints fully aligned with schema.prisma. "
        "All /ai/* responses conform to Prisma models: "
        "AIAnalysis (id, contentType, modelType, scores, enums, createdAt), "
        "SentimentAnalysis (postId, finalIssue, wardNumber, assignedToDepartment, nlpProcessed…). "
        "All /predict/* responses return AIAnalysis-shaped payloads "
        "with issueCategory=AGRICULTURE. "
        "Enums: AIContentType, AIModelType, IssueCategory, IssuePriority, IssueStatus, "
        "Role, ThemePreference, AuthProvider, MediaType, VoteType — all mirror schema.prisma exactly."
    ),
    version="3.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────────────
# Internal helpers
# ─────────────────────────────────────────────────────────────────────────────

_MODELS: dict = {}

def _load_model(key: str):
    if key in _MODELS:
        return _MODELS[key]
    try:
        import joblib
        path = os.path.join(MODELS_DIR, f"{key}.pkl")
        if os.path.exists(path):
            _MODELS[key] = joblib.load(path)
            log.info(f"Loaded model: {key}")
            return _MODELS[key]
    except Exception as e:
        log.warning(f"Could not load {key}: {e}")
    return None


INDIA_COORDS = {
    "chittoor":(13.21,79.10),"delhi":(28.67,77.21),
    "patna":(25.61,85.14),   "lucknow":(26.85,80.95),
    "jaipur":(26.91,75.79),  "hyderabad":(17.38,78.49),
    "mumbai":(19.07,72.88),  "kolkata":(22.57,88.36),
    "amritsar":(31.63,74.87),"nagpur":(21.15,79.09),
    "pune":(18.52,73.85),    "bhopal":(23.25,77.41),
}

CROP_LIST = ["Rice","Wheat","Maize","Sugarcane","Cotton","Soybean",
             "Groundnut","Mustard","Pulses","Vegetables","Sorghum","Barley"]


def _fetch_weather(lat: float, lon: float) -> dict:
    try:
        r = requests.get(OPEN_METEO_URL, timeout=10, params={
            "latitude": lat, "longitude": lon,
            "hourly": ("temperature_2m,relative_humidity_2m,precipitation,"
                       "soil_moisture_0_to_1cm,vapour_pressure_deficit,"
                       "wind_speed_10m,evapotranspiration"),
            "daily": ("precipitation_sum,temperature_2m_max,temperature_2m_min,"
                      "et0_fao_evapotranspiration"),
            "current": "temperature_2m,relative_humidity_2m,wind_speed_10m",
            "forecast_days": 7, "timezone": "Asia/Kolkata",
        })
        d=r.json(); h=d.get("hourly",{}); dy=d.get("daily",{}); c=d.get("current",{})
        avg = lambda k: float(np.nanmean(h.get(k,[0])[:168]))
        sm  = lambda k: float(np.nansum(dy.get(k,[0])))
        return {
            "temp":      c.get("temperature_2m", avg("temperature_2m")),
            "humidity":  avg("relative_humidity_2m"),
            "rain_7d":   sm("precipitation_sum"),
            "soil_m":    avg("soil_moisture_0_to_1cm") * 100,
            "vpd":       avg("vapour_pressure_deficit"),
            "wind":      avg("wind_speed_10m"),
            "et0":       float(dy.get("et0_fao_evapotranspiration",[0.3])[0]),
            "radiation": 18.0,
            "source":    "open-meteo",
        }
    except Exception:
        return {"temp":28,"humidity":65,"rain_7d":35,"soil_m":28,
                "vpd":1.5,"wind":12,"et0":0.28,"radiation":18,"source":"default"}


def _gemini(prompt: str, image_b64: Optional[str] = None) -> str:
    parts = []
    if image_b64:
        parts.append({"inlineData": {"mimeType": "image/jpeg", "data": image_b64}})
    parts.append({"text": prompt})
    resp = requests.post(
        GEMINI_URL,
        json={"contents": [{"parts": parts}]},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["candidates"][0]["content"]["parts"][0]["text"]


def _priority_enum(score: float) -> IssuePriority:
    if score >= 0.75: return IssuePriority.CRITICAL
    if score >= 0.50: return IssuePriority.HIGH
    if score >= 0.25: return IssuePriority.MEDIUM
    return IssuePriority.LOW


def _sentiment_labels(score: float) -> List[str]:
    if score > 0.6:   return ["positive"]
    if score < -0.7:  return ["very_negative", "critical", "urgent"]
    if score < -0.4:  return ["negative", "urgent"]
    return ["neutral"]


def _safe_category(raw: str) -> IssueCategory:
    return IssueCategory(raw) if raw in IssueCategory.__members__ else IssueCategory.OTHERS


def _safe_priority(raw: str) -> IssuePriority:
    return IssuePriority(raw) if raw in IssuePriority.__members__ else IssuePriority.MEDIUM


# ─────────────────────────────────────────────────────────────────────────────
# HEALTH
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/health", summary="API health check")
def health():
    return {
        "status":           "ok",
        "models_dir":       MODELS_DIR,
        "available_models": [
            f[:-4] for f in os.listdir(MODELS_DIR) if f.endswith(".pkl")
        ] if os.path.exists(MODELS_DIR) else [],
        "schema_version":   "prisma@3.0",
        "schema_models":    ["AIAnalysis", "SentimentAnalysis", "Post", "IssueReport",
                             "Media", "Vote", "Comment", "Follow", "User"],
        "schema_enums":     ["AIContentType", "AIModelType", "IssueCategory", "IssuePriority",
                             "IssueStatus", "Role", "ThemePreference", "AuthProvider",
                             "MediaType", "VoteType"],
        "timestamp":        datetime.now().isoformat(),
    }


# =============================================================================
# CIVIC AI ROUTES  (/ai/*)
# Every route returns AIAnalysisResponse — shape matches Prisma AIAnalysis model
# =============================================================================

# ─────────────────────────────────────────────────────────────────────────────
# /ai/analyse/post — full pipeline: sentiment + category + priority + entities
# Returns List[AIAnalysisResponse] — one entry per model run, ready to INSERT
# ─────────────────────────────────────────────────────────────────────────────

@app.post(
    "/ai/analyse/post",
    response_model=PostAnalysisFullResponse,
    summary="Full AI analysis of a Post — returns AIAnalysis rows + SentimentAnalysis row",
)
def analyse_post(req: PostAnalysisRequest):
    """
    Runs SENTIMENT, CATEGORY_CLASSIFICATION, PRIORITY, ENTITY_EXTRACTION,
    TOXICITY in a single Gemini call.

    Returns PostAnalysisFullResponse:
      - aiAnalyses        → list[AIAnalysis]      — one row per model, keyed by postId
      - sentimentAnalysis → SentimentAnalysis row  — keyed by postId, ready to INSERT
    Both match schema.prisma exactly.
    """
    t_start = time.time()

    valid_cats = "|".join(IssueCategory.__members__.keys())
    prompt = f"""You are an AI for a civic issue reporting platform in India.
Analyse this post and return ONLY valid JSON (no markdown, no extra text):
{{
  "sentiment_label": "positive|neutral|negative",
  "sentiment_score": <float -1 to 1>,
  "priority_score":  <float 0 to 1>,
  "urgency_score":   <float 0 to 1>,
  "impact_score":    <float 0 to 1>,
  "toxicity_score":  <float 0 to 1>,
  "issue_category":  "<{valid_cats}>",
  "issue_priority":  "<LOW|MEDIUM|HIGH|CRITICAL>",
  "confidence":      <float 0 to 1>,
  "detected_language": "<ISO 639-1 e.g. en, hi, te>",
  "extracted_entities": {{
    "locations":    ["<place names>"],
    "ward_number":  "<ward if mentioned else null>",
    "department":   "<responsible dept e.g. PWD, BWSSB>",
    "people":       ["<person names>"]
  }},
  "summary": "<one-sentence summary for govt dashboard>"
}}
Post caption : "{req.caption}"
Location     : {req.locationName or 'Not specified'}
"""
    raw = {}
    try:
        raw = json.loads(_gemini(prompt).replace("```json","").replace("```","").strip())
    except Exception as e:
        log.warning(f"Gemini post analysis: {e}")
        raw = {
            "sentiment_label":"neutral","sentiment_score":0.0,
            "priority_score":0.5,"urgency_score":0.5,"impact_score":0.5,
            "toxicity_score":0.0,"issue_category":"OTHERS",
            "issue_priority":"MEDIUM","confidence":0.5,
            "detected_language":"en","extracted_entities":{},"summary":req.caption[:100],
        }

    ms              = int((time.time() - t_start) * 1000)
    sentiment_score = float(raw.get("sentiment_score", 0.0))
    category        = _safe_category(raw.get("issue_category","OTHERS")).value
    priority        = _safe_priority(raw.get("issue_priority","MEDIUM")).value
    conf            = round(float(raw.get("confidence", 0.5)), 4)
    entities        = raw.get("extracted_entities", {})
    now             = datetime.now()

    ai_analyses = [
        # 1. SENTIMENT
        AIAnalysisResponse(
            contentType      = AIContentType.POST,
            modelType        = AIModelType.SENTIMENT,
            postId           = req.postId,
            sentiments       = _sentiment_labels(sentiment_score),
            sentimentScore   = round(sentiment_score, 4),
            priorityScore    = round(float(raw.get("priority_score",0.5)), 4),
            detectedLanguage = raw.get("detected_language","en"),
            confidence       = conf,
            summary          = raw.get("summary"),
            modelName        = "gemini-1.5-flash",
            modelVersion     = "1.5",
            processingTimeMs = ms,
        ),
        # 2. CATEGORY_CLASSIFICATION
        AIAnalysisResponse(
            contentType      = AIContentType.POST,
            modelType        = AIModelType.CATEGORY_CLASSIFICATION,
            postId           = req.postId,
            sentiments       = [],
            issueCategory    = IssueCategory(category),
            issuePriority    = IssuePriority(priority),
            confidence       = conf,
            modelName        = "gemini-1.5-flash",
            modelVersion     = "1.5",
            processingTimeMs = ms,
        ),
        # 3. PRIORITY
        AIAnalysisResponse(
            contentType      = AIContentType.POST,
            modelType        = AIModelType.PRIORITY,
            postId           = req.postId,
            sentiments       = [],
            priorityScore    = round(float(raw.get("priority_score",0.5)), 4),
            urgencyScore     = round(float(raw.get("urgency_score",0.5)), 4),
            impactScore      = round(float(raw.get("impact_score",0.5)), 4),
            issuePriority    = IssuePriority(priority),
            confidence       = conf,
            modelName        = "gemini-1.5-flash",
            modelVersion     = "1.5",
            processingTimeMs = ms,
        ),
        # 4. ENTITY_EXTRACTION
        AIAnalysisResponse(
            contentType       = AIContentType.POST,
            modelType         = AIModelType.ENTITY_EXTRACTION,
            postId            = req.postId,
            sentiments        = [],
            extractedEntities = entities,
            confidence        = conf,
            modelName         = "gemini-1.5-flash",
            modelVersion      = "1.5",
            processingTimeMs  = ms,
        ),
        # 5. TOXICITY
        AIAnalysisResponse(
            contentType       = AIContentType.POST,
            modelType         = AIModelType.TOXICITY,
            postId            = req.postId,
            sentiments        = [],
            toxicityScore     = round(float(raw.get("toxicity_score",0.0)), 4),
            confidence        = conf,
            extractedEntities = {"is_toxic": float(raw.get("toxicity_score",0.0)) > 0.5},
            modelName         = "gemini-1.5-flash",
            modelVersion      = "1.5",
            processingTimeMs  = ms,
        ),
    ]

    # Build SentimentAnalysis row (mirrors Prisma SentimentAnalysis model)
    sa = SentimentAnalysisResponse(
        postId               = req.postId or "",
        text                 = req.caption,
        finalIssue           = IssueCategory(category),
        confidence           = conf,
        decidedBy            = "gemini-1.5-flash",
        sentimentLabel       = raw.get("sentiment_label", "neutral"),
        sentimentScore       = round(sentiment_score, 4),
        priorityScore        = round(float(raw.get("priority_score", 0.5)), 4),
        wardNumber           = entities.get("ward_number"),
        assignedToDepartment = entities.get("department"),
        locations            = {"places": entities.get("locations", [])},
        textAnalysis         = {
            "sentiment_label":    raw.get("sentiment_label"),
            "detected_language":  raw.get("detected_language", "en"),
            "summary":            raw.get("summary"),
        },
        imageAnalysis        = None,   # populated separately if imageUrl was analysed
        processedAt          = now,
        nlpProcessed         = True,
        createdAt            = now,
    )

    return PostAnalysisFullResponse(aiAnalyses=ai_analyses, sentimentAnalysis=sa)


# ─────────────────────────────────────────────────────────────────────────────
# /ai/analyse/issue
# ─────────────────────────────────────────────────────────────────────────────

@app.post(
    "/ai/analyse/issue",
    response_model=List[AIAnalysisResponse],
    summary="Full AI analysis of an IssueReport — one AIAnalysis row per model",
)
def analyse_issue(req: IssueAnalysisRequest):
    """
    issueReportId is the foreign key in every returned AIAnalysis record.
    Runs SENTIMENT, CATEGORY_CLASSIFICATION, PRIORITY, ENTITY_EXTRACTION.
    """
    t_start = time.time()
    desc    = req.description or ""
    valid_cats = "|".join(IssueCategory.__members__.keys())

    prompt = f"""You are an AI for a civic issue platform in India.
Analyse this citizen-reported issue and return ONLY valid JSON (no markdown):
{{
  "sentiment_label":    "positive|neutral|negative",
  "sentiment_score":    <float -1 to 1>,
  "priority_score":     <float 0 to 1>,
  "urgency_score":      <float 0 to 1>,
  "impact_score":       <float 0 to 1>,
  "toxicity_score":     <float 0 to 1>,
  "issue_category":     "<{valid_cats}>",
  "issue_priority":     "<LOW|MEDIUM|HIGH|CRITICAL>",
  "confidence":         <float 0 to 1>,
  "detected_language":  "<ISO 639-1>",
  "extracted_entities": {{
    "locations":    [],
    "ward_number":  null,
    "department":   "<PWD|BWSSB|BESCOM|BBMP|etc>",
    "people":       []
  }},
  "assigned_department": "<responsible govt dept>",
  "summary": "<one sentence for govt dashboard>"
}}
Issue title  : "{req.caption}"
Description  : "{desc}"
Location     : {req.locationName or 'Not specified'}
Coordinates  : {req.latitude}, {req.longitude}
Current status   : {req.status.value}
Current priority : {req.priority.value}
View count       : {req.viewCount}
Is duplicate     : {req.isDuplicate}
"""
    raw = {}
    try:
        raw = json.loads(_gemini(prompt).replace("```json","").replace("```","").strip())
    except Exception as e:
        log.warning(f"Gemini issue analysis: {e}")
        raw = {
            "sentiment_label":"negative","sentiment_score":-0.5,
            "priority_score":0.6,"urgency_score":0.6,"impact_score":0.5,
            "toxicity_score":0.0,"issue_category":"OTHERS",
            "issue_priority":"HIGH","confidence":0.5,"detected_language":"en",
            "extracted_entities":{},"assigned_department":"General",
            "summary":req.caption[:100],
        }

    ms              = int((time.time() - t_start) * 1000)
    sentiment_score = float(raw.get("sentiment_score", -0.3))
    category        = _safe_category(raw.get("issue_category","OTHERS")).value
    priority        = _safe_priority(raw.get("issue_priority","MEDIUM")).value
    conf            = round(float(raw.get("confidence",0.5)), 4)

    return [
        # 1. SENTIMENT
        AIAnalysisResponse(
            contentType      = AIContentType.ISSUE_REPORT,
            modelType        = AIModelType.SENTIMENT,
            issueReportId    = req.issueReportId,
            sentiments       = _sentiment_labels(sentiment_score),
            sentimentScore   = round(sentiment_score, 4),
            priorityScore    = round(float(raw.get("priority_score",0.6)), 4),
            detectedLanguage = raw.get("detected_language","en"),
            confidence       = conf,
            summary          = raw.get("summary"),
            modelName        = "gemini-1.5-flash",
            modelVersion     = "1.5",
            processingTimeMs = ms,
        ),
        # 2. CATEGORY_CLASSIFICATION
        AIAnalysisResponse(
            contentType       = AIContentType.ISSUE_REPORT,
            modelType         = AIModelType.CATEGORY_CLASSIFICATION,
            issueReportId     = req.issueReportId,
            sentiments        = [],
            issueCategory     = IssueCategory(category),
            issuePriority     = IssuePriority(priority),
            confidence        = conf,
            extractedEntities = {
                "assigned_department": raw.get("assigned_department","")
            },
            modelName         = "gemini-1.5-flash",
            modelVersion      = "1.5",
            processingTimeMs  = ms,
        ),
        # 3. PRIORITY
        AIAnalysisResponse(
            contentType      = AIContentType.ISSUE_REPORT,
            modelType        = AIModelType.PRIORITY,
            issueReportId    = req.issueReportId,
            sentiments       = [],
            priorityScore    = round(float(raw.get("priority_score",0.6)), 4),
            urgencyScore     = round(float(raw.get("urgency_score",0.6)), 4),
            impactScore      = round(float(raw.get("impact_score",0.5)), 4),
            issuePriority    = IssuePriority(priority),
            confidence       = conf,
            modelName        = "gemini-1.5-flash",
            modelVersion     = "1.5",
            processingTimeMs = ms,
        ),
        # 4. ENTITY_EXTRACTION
        AIAnalysisResponse(
            contentType       = AIContentType.ISSUE_REPORT,
            modelType         = AIModelType.ENTITY_EXTRACTION,
            issueReportId     = req.issueReportId,
            sentiments        = [],
            extractedEntities = raw.get("extracted_entities", {}),
            confidence        = conf,
            modelName         = "gemini-1.5-flash",
            modelVersion      = "1.5",
            processingTimeMs  = ms,
        ),
    ]


# ─────────────────────────────────────────────────────────────────────────────
# /ai/sentiment
# ─────────────────────────────────────────────────────────────────────────────

@app.post(
    "/ai/sentiment",
    response_model=AIAnalysisResponse,
    summary="Sentiment + priority for a single text (Post | IssueReport | Comment)",
)
def sentiment(req: SentimentRequest):
    t0 = time.time()
    prompt = f"""Analyse sentiment of this civic text. Return ONLY JSON:
{{
  "sentiment_label":   "positive|neutral|negative",
  "sentiment_score":   <float -1 to 1>,
  "priority_score":    <float 0 to 1>,
  "confidence":        <float 0 to 1>,
  "detected_language": "<ISO 639-1>"
}}
Text: "{req.text}"
"""
    raw = {}
    try:
        raw = json.loads(_gemini(prompt).replace("```json","").replace("```","").strip())
    except Exception as e:
        log.warning(f"Gemini sentiment: {e}")
        raw = {"sentiment_label":"neutral","sentiment_score":0.0,
               "priority_score":0.5,"confidence":0.5,"detected_language":"en"}

    s = float(raw.get("sentiment_score", 0.0))
    return AIAnalysisResponse(
        contentType      = req.contentType,
        modelType        = AIModelType.SENTIMENT,
        postId           = req.postId,
        issueReportId    = req.issueReportId,
        commentId        = req.commentId,
        sentiments       = _sentiment_labels(s),
        sentimentScore   = round(s, 4),
        priorityScore    = round(float(raw.get("priority_score",0.5)), 4),
        detectedLanguage = raw.get("detected_language","en"),
        confidence       = round(float(raw.get("confidence",0.5)), 4),
        modelName        = "gemini-1.5-flash",
        modelVersion     = "1.5",
        processingTimeMs = int((time.time()-t0)*1000),
    )


# ─────────────────────────────────────────────────────────────────────────────
# /ai/classify
# ─────────────────────────────────────────────────────────────────────────────

@app.post(
    "/ai/classify",
    response_model=AIAnalysisResponse,
    summary="Classify text into IssueCategory enum",
)
def classify(req: ClassifyRequest):
    t0         = time.time()
    valid_cats = "|".join(IssueCategory.__members__.keys())
    prompt     = f"""Classify this civic issue into exactly one category. Return ONLY JSON:
{{
  "issue_category": "<{valid_cats}>",
  "confidence":     <float 0 to 1>,
  "reasoning":      "<brief reason>"
}}
Text: "{req.text}"
"""
    raw = {}
    try:
        raw = json.loads(_gemini(prompt).replace("```json","").replace("```","").strip())
    except Exception as e:
        log.warning(f"Gemini classify: {e}")
        raw = {"issue_category":"OTHERS","confidence":0.5,"reasoning":""}

    return AIAnalysisResponse(
        contentType      = req.contentType,
        modelType        = AIModelType.CATEGORY_CLASSIFICATION,
        postId           = req.postId,
        issueReportId    = req.issueReportId,
        sentiments       = [],
        issueCategory    = _safe_category(raw.get("issue_category","OTHERS")),
        confidence       = round(float(raw.get("confidence",0.5)), 4),
        summary          = raw.get("reasoning"),
        modelName        = "gemini-1.5-flash",
        modelVersion     = "1.5",
        processingTimeMs = int((time.time()-t0)*1000),
    )


# ─────────────────────────────────────────────────────────────────────────────
# /ai/priority
# ─────────────────────────────────────────────────────────────────────────────

@app.post(
    "/ai/priority",
    response_model=AIAnalysisResponse,
    summary="Priority + urgency + impact scoring",
)
def priority(req: PriorityRequest):
    t0       = time.time()
    cat_hint = req.issueCategory.value if req.issueCategory else "unknown"
    prompt   = f"""Score the priority of this civic issue. Return ONLY JSON:
{{
  "priority_score":  <float 0 to 1>,
  "urgency_score":   <float 0 to 1>,
  "impact_score":    <float 0 to 1>,
  "issue_priority":  "<LOW|MEDIUM|HIGH|CRITICAL>",
  "confidence":      <float 0 to 1>
}}
Text          : "{req.text}"
Category hint : {cat_hint}
Sentiment     : {req.sentimentScore if req.sentimentScore is not None else 'unknown'}
"""
    raw = {}
    try:
        raw = json.loads(_gemini(prompt).replace("```json","").replace("```","").strip())
    except Exception as e:
        log.warning(f"Gemini priority: {e}")
        raw = {"priority_score":0.5,"urgency_score":0.5,"impact_score":0.5,
               "issue_priority":"MEDIUM","confidence":0.5}

    return AIAnalysisResponse(
        contentType      = req.contentType,
        modelType        = AIModelType.PRIORITY,
        postId           = req.postId,
        issueReportId    = req.issueReportId,
        sentiments       = [],
        priorityScore    = round(float(raw.get("priority_score",0.5)), 4),
        urgencyScore     = round(float(raw.get("urgency_score",0.5)), 4),
        impactScore      = round(float(raw.get("impact_score",0.5)), 4),
        issuePriority    = _safe_priority(raw.get("issue_priority","MEDIUM")),
        confidence       = round(float(raw.get("confidence",0.5)), 4),
        modelName        = "gemini-1.5-flash",
        modelVersion     = "1.5",
        processingTimeMs = int((time.time()-t0)*1000),
    )


# ─────────────────────────────────────────────────────────────────────────────
# /ai/toxicity
# ─────────────────────────────────────────────────────────────────────────────

@app.post(
    "/ai/toxicity",
    response_model=AIAnalysisResponse,
    summary="Toxicity / abusive content detection",
)
def toxicity(req: ToxicityRequest):
    t0     = time.time()
    prompt = f"""Detect toxicity / abusive content. Return ONLY JSON:
{{
  "toxicity_score": <float 0 to 1>,
  "is_toxic":       <true|false>,
  "toxicity_types": ["<hate_speech|abuse|spam|misinformation|none>"],
  "confidence":     <float 0 to 1>
}}
Text: "{req.text}"
"""
    raw = {}
    try:
        raw = json.loads(_gemini(prompt).replace("```json","").replace("```","").strip())
    except Exception as e:
        log.warning(f"Gemini toxicity: {e}")
        raw = {"toxicity_score":0.0,"is_toxic":False,"toxicity_types":["none"],"confidence":0.5}

    return AIAnalysisResponse(
        contentType       = req.contentType,
        modelType         = AIModelType.TOXICITY,
        commentId         = req.commentId,
        postId            = req.postId,
        sentiments        = raw.get("toxicity_types", ["none"]),
        toxicityScore     = round(float(raw.get("toxicity_score",0.0)), 4),
        confidence        = round(float(raw.get("confidence",0.5)), 4),
        extractedEntities = {"is_toxic": raw.get("is_toxic", False)},
        modelName         = "gemini-1.5-flash",
        modelVersion      = "1.5",
        processingTimeMs  = int((time.time()-t0)*1000),
    )


# ─────────────────────────────────────────────────────────────────────────────
# /ai/duplicate
# ─────────────────────────────────────────────────────────────────────────────

@app.post(
    "/ai/duplicate",
    response_model=AIAnalysisResponse,
    summary="Detect if an issue duplicates existing IssueReports",
)
def duplicate(req: DuplicateRequest):
    """
    Pass existingIssues from your DB query.
    If is_duplicate=true, set IssueReport.isDuplicate=true and
    IssueReport.duplicateOfId=duplicate_of_id in the DB.
    """
    t0           = time.time()
    existing_ctx = json.dumps(
        [{"id": e.get("id",""), "caption": e.get("caption","")}
         for e in req.existingIssues[:10]],
        ensure_ascii=False,
    )
    prompt = f"""Detect if the NEW ISSUE duplicates any EXISTING ISSUE. Return ONLY JSON:
{{
  "is_duplicate":     <true|false>,
  "duplicate_of_id":  "<matching issue id or null>",
  "similarity_score": <float 0 to 1>,
  "confidence":       <float 0 to 1>,
  "reason":           "<brief explanation>"
}}
New issue   : "{req.caption}"
Location    : ({req.latitude}, {req.longitude})
Existing    : {existing_ctx}
"""
    raw = {}
    try:
        raw = json.loads(_gemini(prompt).replace("```json","").replace("```","").strip())
    except Exception as e:
        log.warning(f"Gemini duplicate: {e}")
        raw = {"is_duplicate":False,"duplicate_of_id":None,
               "similarity_score":0.0,"confidence":0.5,"reason":"Analysis unavailable"}

    return AIAnalysisResponse(
        contentType       = req.contentType,
        modelType         = AIModelType.DUPLICATE_DETECTION,
        issueReportId     = req.issueReportId,
        sentiments        = [],
        confidence        = round(float(raw.get("confidence",0.5)), 4),
        extractedEntities = {
            "is_duplicate":     raw.get("is_duplicate", False),
            "duplicate_of_id":  raw.get("duplicate_of_id"),
            "similarity_score": round(float(raw.get("similarity_score",0.0)), 4),
            "reason":           raw.get("reason",""),
        },
        modelName         = "gemini-1.5-flash",
        modelVersion      = "1.5",
        processingTimeMs  = int((time.time()-t0)*1000),
    )


# ─────────────────────────────────────────────────────────────────────────────
# /ai/entities
# ─────────────────────────────────────────────────────────────────────────────

@app.post(
    "/ai/entities",
    response_model=AIAnalysisResponse,
    summary="Extract ward, department, location entities — maps to SentimentAnalysis.wardNumber + assignedToDepartment",
)
def entities(req: EntityRequest):
    t0     = time.time()
    prompt = f"""Extract civic entities from this text. Return ONLY JSON:
{{
  "locations":   ["<place names>"],
  "ward_number": "<ward number or null>",
  "department":  "<responsible govt dept e.g. PWD, BWSSB, BESCOM, BBMP>",
  "people":      ["<person names>"],
  "landmark":    "<nearest landmark or null>",
  "confidence":  <float 0 to 1>
}}
Text       : "{req.text}"
Coordinates: {req.latitude}, {req.longitude}
"""
    raw = {}
    try:
        raw = json.loads(_gemini(prompt).replace("```json","").replace("```","").strip())
    except Exception as e:
        log.warning(f"Gemini entities: {e}")
        raw = {"locations":[],"ward_number":None,"department":"General",
               "people":[],"landmark":None,"confidence":0.5}

    return AIAnalysisResponse(
        contentType       = req.contentType,
        modelType         = AIModelType.ENTITY_EXTRACTION,
        postId            = req.postId,
        issueReportId     = req.issueReportId,
        sentiments        = [],
        # ward_number and department also map to SentimentAnalysis columns
        extractedEntities = {k: v for k, v in raw.items() if k != "confidence"},
        confidence        = round(float(raw.get("confidence",0.5)), 4),
        modelName         = "gemini-1.5-flash",
        modelVersion      = "1.5",
        processingTimeMs  = int((time.time()-t0)*1000),
    )


# =============================================================================
# AGRICULTURAL PREDICTION ROUTES  (/predict/*)
# All return AIAnalysisResponse with issueCategory=AGRICULTURE
# so results can be persisted as AIAnalysis rows in the DB
# =============================================================================

STRESS_CLASSES = {0:"No Stress",1:"Heat Stress",2:"Drought Stress",
                  3:"Waterlogging",4:"Cold Stress",5:"Pest/Disease Risk"}
STRESS_ACTIONS = {
    0:"Normal. Continue monitoring.",
    1:"Apply mulching, increase irrigation, shade netting.",
    2:"Drip irrigation immediately. Anti-transpirant spray.",
    3:"Open drainage. Suspend irrigation. Check root rot.",
    4:"Cover crops. Delay sowing if <10 C.",
    5:"Preventive fungicide / bio-pesticide spray.",
}
RISK_CLASSES         = {0:"Low",1:"Moderate",2:"High",3:"Critical"}
RISK_TO_PRIORITY     = {
    "Low":IssuePriority.LOW, "Moderate":IssuePriority.MEDIUM,
    "High":IssuePriority.HIGH, "Critical":IssuePriority.CRITICAL,
}


# ─────────────────────────────────────────────────────────────────────────────
# /predict/yield
# ─────────────────────────────────────────────────────────────────────────────

@app.post(
    "/predict/yield",
    response_model=AIAnalysisResponse,
    summary="Model 1 — Crop yield prediction (RF + GB stack)",
)
def predict_yield(req: YieldRequest):
    t0     = time.time()
    coords = INDIA_COORDS.get(req.district.lower(), (20.5, 78.9))
    w      = _fetch_weather(*coords)

    rf     = _load_model("m1_rf");    gb  = _load_model("m1_gb")
    scaler = _load_model("m1_scaler"); fc = _load_model("m1_feat_cols")

    crop_idx   = CROP_LIST.index(req.crop) if req.crop in CROP_LIST else 0
    season_idx = ["Kharif","Rabi","Zaid","Annual"].index(req.season) \
                 if req.season in ["Kharif","Rabi","Zaid","Annual"] else 0

    if rf and gb and scaler and fc:
        feat = {
            "year": datetime.now().year,
            "annual_rainfall": min(w["rain_7d"]*52,3000),
            "mean_temp": w["temp"],
            "temp_stress_deg": max(0,w["temp"]-38)+max(0,10-w["temp"]),
            "soil_moisture": w["soil_m"],
            "ndvi": min(0.9, w["soil_m"]/100*0.5+w["humidity"]/100*0.3+0.2),
            "fertilizer_kg_ha": req.fertilizer_kg,
            "irrigation": int(req.irrigation),
            "soil_ph": req.soil_ph, "soil_type_idx": req.soil_type_idx,
            "crop_idx": crop_idx, "state_idx": 0, "season_idx": season_idx,
            "rainfall_anomaly":0,"drought_index":0.2,
            "population_density":400,"irrigation_pct":50 if req.irrigation else 20,
            "production_efficiency":1.0,"pest_incidence":10,"flood_risk":0.1,
        }
        x    = np.array([[feat.get(c,0) for c in fc]])
        x_sc = scaler.transform(x)
        rfp  = rf.predict(x_sc)
        yhat = float(gb.predict(np.hstack([x_sc,rfp.reshape(-1,1)]))[0])
        std  = np.array([t.predict(x_sc)[0] for t in rf.estimators_]).std()
        model_used = "RF+GB Stack"
    else:
        base = {"Rice":2.8,"Wheat":3.2,"Maize":3.5,"Sugarcane":68,"Cotton":1.8,
                "Soybean":1.9,"Groundnut":1.7,"Mustard":1.4,"Pulses":1.0,"Vegetables":12}
        yhat = base.get(req.crop, 2.5) * (1.0 if req.irrigation else 0.8)
        std  = 0.3
        model_used = "Synthetic estimate"

    yhat           = max(0, yhat)
    priority_score = round(max(0, min(1, (4.0 - yhat) / 4.0)), 4)

    return AIAnalysisResponse(
        contentType       = AIContentType.ISSUE_REPORT if req.issueReportId else AIContentType.POST,
        modelType         = AIModelType.PRIORITY,
        postId            = req.postId,
        issueReportId     = req.issueReportId,
        sentiments        = [],
        priorityScore     = priority_score,
        urgencyScore      = round(priority_score * 0.9, 4),
        impactScore       = round(priority_score * 0.8, 4),
        issueCategory     = IssueCategory.AGRICULTURE,
        issuePriority     = _priority_enum(priority_score),
        confidence        = round(max(0, 1 - std / max(yhat, 0.1)), 4),
        extractedEntities = {
            "district":          req.district,
            "crop":              req.crop,
            "predicted_yield":   round(yhat, 3),
            "yield_lower_95":    round(max(0, yhat-1.96*std), 3),
            "yield_upper_95":    round(yhat+1.96*std, 3),
            "total_production":  round(yhat * req.area_ha, 2),
            "forecast_band":     "High" if yhat>3.5 else "Medium" if yhat>2 else "Low",
            "live_temp":         w["temp"],
            "live_rain_7d":      w["rain_7d"],
            "weather_source":    w["source"],
        },
        summary           = (f"{req.district.title()} {req.crop}: predicted yield "
                             f"{yhat:.2f} t/ha"),
        modelName         = model_used,
        modelVersion      = "1.0.0",
        processingTimeMs  = int((time.time()-t0)*1000),
    )


# ─────────────────────────────────────────────────────────────────────────────
# /predict/stress
# ─────────────────────────────────────────────────────────────────────────────

@app.post(
    "/predict/stress",
    response_model=AIAnalysisResponse,
    summary="Model 2 — Crop stress detection (RFC, 6 classes)",
)
def predict_stress(req: StressRequest):
    t0     = time.time()
    coords = INDIA_COORDS.get(req.district.lower(), (20.5, 78.9))
    w      = _fetch_weather(*coords)

    model  = _load_model("m2_rfc")
    scaler = _load_model("m2_scaler")
    fc     = _load_model("m2_feat_cols")

    crop_idx   = {c:i for i,c in enumerate(CROP_LIST)}.get(req.crop, 0)
    season_idx = {"Kharif":0,"Rabi":1,"Zaid":2,"Annual":3}.get(req.season, 0)

    if model and scaler and fc:
        feat = {
            "mean_temp":w["temp"],"humidity":w["humidity"],
            "annual_rainfall":min(w["rain_7d"]*52,3000),
            "soil_moisture":w["soil_m"],"vpd":w["vpd"],
            "wind_speed":w["wind"],"evapotranspiration":w["et0"],
            "ndvi":req.ndvi,"crop_idx":crop_idx,"season_idx":season_idx,
            "rainfall_anomaly":0,"drought_index":0.2,
            "pest_incidence":10,"disease_incidence":5,
            "flood_risk":0.1,"temp_anomaly":0,
        }
        x    = np.array([[feat.get(c,0) for c in fc]])
        x_sc = scaler.transform(x)
        label= int(model.predict(x_sc)[0])
        proba= model.predict_proba(x_sc)[0]
        stress_score = int(sum(i*20*p for i,p in enumerate(proba)))
        model_used   = "RFC (calibrated)"
    else:
        T=w["temp"]; h=w["humidity"]; sm=w["soil_m"]
        if T>40:    label=1
        elif sm<15: label=2
        elif sm>60: label=3
        elif T<10:  label=4
        elif h>85:  label=5
        else:       label=0
        proba=[0.0]*6; proba[label]=1.0
        stress_score=label*20
        model_used="Rule-based fallback"

    stress_class   = STRESS_CLASSES[label]
    priority_score = round(stress_score / 100, 4)

    return AIAnalysisResponse(
        contentType       = AIContentType.ISSUE_REPORT if req.issueReportId else AIContentType.POST,
        modelType         = AIModelType.CATEGORY_CLASSIFICATION,
        postId            = req.postId,
        issueReportId     = req.issueReportId,
        sentiments        = [stress_class],
        sentimentScore    = round(-priority_score, 4),
        priorityScore     = priority_score,
        urgencyScore      = priority_score,
        issueCategory     = IssueCategory.AGRICULTURE,
        issuePriority     = _priority_enum(priority_score),
        confidence        = round(float(proba[label]), 4),
        extractedEntities = {
            "stress_class":      stress_class,
            "stress_score":      stress_score,
            "action":            STRESS_ACTIONS[label],
            "live_temp":         w["temp"],
            "live_humidity":     w["humidity"],
            "all_probabilities": {STRESS_CLASSES[i]: round(float(p),3)
                                   for i,p in enumerate(proba)},
        },
        summary           = f"{req.district.title()}: {stress_class}. {STRESS_ACTIONS[label]}",
        modelName         = model_used,
        modelVersion      = "2.0.0",
        processingTimeMs  = int((time.time()-t0)*1000),
    )


# ─────────────────────────────────────────────────────────────────────────────
# /predict/disease
# ─────────────────────────────────────────────────────────────────────────────

@app.post(
    "/predict/disease",
    response_model=AIAnalysisResponse,
    summary="Model 3 — Plant disease advisory (Gemini + outbreak tracker)",
)
def predict_disease(req: DiseaseRequest):
    t0    = time.time()
    label = req.disease_text or req.farmer_description or "Unknown plant disease"

    prompt = f"""You are a senior plant pathologist at ICAR, India.
Detected disease: "{label}" | District: {req.district}
Farmer description: "{req.farmer_description}"
Return ONLY valid JSON (no markdown):
{{"disease_name":"","causative_agent":"","severity_assessment":"Mild|Moderate|Severe",
"immediate_action":"","chemical_treatment":{{"fungicide":"","application":""}},
"biological_control":"","cultural_practices":"","government_schemes":"",
"urgency_level":"Low|Medium|High|Critical","spread_risk":"High|Medium|Low",
"advisory_for_dept":""}}"""

    remedy = {}
    try:
        remedy = json.loads(_gemini(prompt).replace("```json","").replace("```","").strip())
    except Exception as e:
        log.warning(f"Gemini disease: {e}")
        remedy = {
            "disease_name":label,"causative_agent":"Unknown",
            "severity_assessment":"Moderate",
            "immediate_action":"Contact local KVK for field inspection",
            "chemical_treatment":{"fungicide":"Consult KVK","application":"Foliar spray"},
            "biological_control":"Trichoderma viride @ 5g/L",
            "urgency_level":"Medium","spread_risk":"Medium",
            "advisory_for_dept":"Field survey recommended",
        }

    urgency_map    = {"Low":0.25,"Medium":0.5,"High":0.75,"Critical":1.0}
    urgency_val    = urgency_map.get(remedy.get("urgency_level","Medium"), 0.5)

    return AIAnalysisResponse(
        contentType       = AIContentType.ISSUE_REPORT if req.issueReportId else AIContentType.POST,
        modelType         = AIModelType.CATEGORY_CLASSIFICATION,
        postId            = req.postId,
        issueReportId     = req.issueReportId,
        sentiments        = [remedy.get("spread_risk","Medium").lower() + "_spread"],
        priorityScore     = round(urgency_val, 4),
        urgencyScore      = round(urgency_val, 4),
        issueCategory     = IssueCategory.AGRICULTURE,
        issuePriority     = _priority_enum(urgency_val),
        confidence        = 0.85,
        extractedEntities = remedy,
        summary           = (f"{remedy.get('disease_name','Disease')} in {req.district}: "
                             f"{remedy.get('immediate_action','See advisory')}"),
        modelName         = "gemini-1.5-flash",
        modelVersion      = "1.5",
        processingTimeMs  = int((time.time()-t0)*1000),
    )


# ─────────────────────────────────────────────────────────────────────────────
# /predict/irrigation
# ─────────────────────────────────────────────────────────────────────────────

@app.post(
    "/predict/irrigation",
    response_model=AIAnalysisResponse,
    summary="Model 4 — Irrigation requirement (HistGBR + FAO-56)",
)
def predict_irrigation(req: IrrigationRequest):
    t0     = time.time()
    coords = INDIA_COORDS.get(req.district.lower(), (20.5, 78.9))
    w      = _fetch_weather(*coords)

    model  = _load_model("m4_hgb")
    scaler = _load_model("m4_scaler")
    fc     = _load_model("m4_feat_cols")

    crop_idx = CROP_LIST.index(req.crop) if req.crop in CROP_LIST else 0

    if model and scaler and fc:
        feat = {
            "mean_temp":w["temp"],"humidity":w["humidity"],"wind_speed":w["wind"],
            "soil_moisture":w["soil_m"],"annual_rainfall":min(w["rain_7d"]*52,3000),
            "evapotranspiration":w["et0"],"ndvi":0.5,"crop_idx":crop_idx,
            "season_idx":0,"area_ha":req.area_ha,"elevation":req.elevation_m,
            "drought_index":0.2,"rainfall_anomaly":0,"production_efficiency":1.0,
        }
        x  = np.array([[feat.get(c,0) for c in fc]])
        ir = max(0, float(model.predict(scaler.transform(x))[0]))
        model_used = "HistGBR + FAO-56"
    else:
        T=w["temp"]; RH=w["humidity"]
        et0 = 0.0023*(T+17.8)*(4.5**0.5)
        ir  = max(0, et0*1.1 - w["rain_7d"]/7*0.7)
        model_used = "FAO-56 only"

    alert          = "Urgent" if ir>8 else "Scheduled" if ir>5 else "Normal" if ir>2 else "None"
    priority_score = round(min(1.0, ir/10.0), 4)

    return AIAnalysisResponse(
        contentType       = AIContentType.ISSUE_REPORT if req.issueReportId else AIContentType.POST,
        modelType         = AIModelType.PRIORITY,
        postId            = req.postId,
        issueReportId     = req.issueReportId,
        sentiments        = [alert.lower()],
        priorityScore     = priority_score,
        urgencyScore      = priority_score,
        issueCategory     = IssueCategory.AGRICULTURE,
        issuePriority     = _priority_enum(priority_score),
        confidence        = 0.82,
        extractedEntities = {
            "district":             req.district,
            "crop":                 req.crop,
            "irrigation_mm_day":    round(ir, 3),
            "irrigation_weekly_mm": round(ir*7, 2),
            "irrigation_m3_day":    round(ir*req.area_ha*10, 1),
            "alert":                alert,
            "recommended_method":   "Drip" if ir>5 else "Sprinkler" if ir>2 else "Rainfed",
            "et0_estimate":         round(w["et0"], 3),
            "weather_source":       w["source"],
        },
        summary           = f"{req.district.title()} {req.crop}: {ir:.1f} mm/day — {alert}",
        modelName         = model_used,
        modelVersion      = "4.0.0",
        processingTimeMs  = int((time.time()-t0)*1000),
    )


# ─────────────────────────────────────────────────────────────────────────────
# /predict/crop_recommendation
# ─────────────────────────────────────────────────────────────────────────────

CROP_PROFILES = {
    "Rice":     {"temp":(20,35),"rain":(900,2500),"ph":(5.5,7.0)},
    "Wheat":    {"temp":(10,25),"rain":(400,900), "ph":(6.0,7.5)},
    "Maize":    {"temp":(18,32),"rain":(600,1200),"ph":(5.8,7.0)},
    "Cotton":   {"temp":(21,37),"rain":(500,1000),"ph":(6.0,8.0)},
    "Soybean":  {"temp":(20,30),"rain":(600,1200),"ph":(6.0,7.0)},
    "Groundnut":{"temp":(22,35),"rain":(500,1200),"ph":(5.5,7.0)},
    "Mustard":  {"temp":(10,25),"rain":(300,750), "ph":(6.0,7.5)},
    "Pulses":   {"temp":(15,30),"rain":(400,900), "ph":(6.0,7.5)},
    "Sorghum":  {"temp":(25,40),"rain":(400,900), "ph":(5.5,8.0)},
    "Barley":   {"temp":(8,24), "rain":(300,800), "ph":(6.0,8.0)},
}

def _suit_score(crop, temp, rain, ph):
    p=CROP_PROFILES.get(crop,CROP_PROFILES["Rice"]); s=100.0
    t1,t2=p["temp"]; r1,r2=p["rain"]; p1,p2=p["ph"]
    if temp<t1: s-=min(40,(t1-temp)*4)
    if temp>t2: s-=min(40,(temp-t2)*4)
    if rain<r1: s-=min(35,(r1-rain)/25)
    if rain>r2: s-=min(25,(rain-r2)/40)
    if ph<p1:   s-=min(20,(p1-ph)*8)
    if ph>p2:   s-=min(20,(ph-p2)*8)
    return max(0,min(100,s))

@app.post(
    "/predict/crop_recommendation",
    response_model=AIAnalysisResponse,
    summary="Model 5 — Crop suitability (XGBoost + physics blend)",
)
def predict_crop(req: SuitabilityRequest):
    t0     = time.time()
    coords = INDIA_COORDS.get(req.district.lower(), (20.5, 78.9))
    w      = _fetch_weather(*coords)

    model  = _load_model("m5_xgb")
    scaler = _load_model("m5_scaler")
    fc     = _load_model("m5_feat_cols")

    rain_est = min(w["rain_7d"]*52, 3000)
    temp     = w.get("temp", 28)
    phys     = {c: _suit_score(c, temp, rain_est, req.ph) for c in CROP_PROFILES}

    if model and scaler and fc:
        feat = {
            "mean_temp":temp,"annual_rainfall":rain_est,"humidity":w["humidity"],
            "soil_ph":req.ph,"soil_type_idx":req.soil_type_idx,"elevation":150,
            "fertilizer_kg_ha":req.nitrogen,"ndvi":0.5,"crop_idx":0,
            "rainfall_anomaly":0,"drought_index":0.2,
            "population_density":400,"production_efficiency":1.0,
            "irrigation_pct":40,"temp_anomaly":0,
        }
        x     = np.array([[feat.get(c,0) for c in fc]])
        proba = model.predict_proba(scaler.transform(x))[0]
        ml    = {CROP_LIST[i]: float(p)*100 for i,p in enumerate(proba) if i<len(CROP_LIST)}
        final = {c: 0.6*phys.get(c,0)+0.4*ml.get(c,0) for c in phys}
        model_used = "XGBoost + Physics"
    else:
        final      = phys
        model_used = "Physics-only"

    ranked = sorted(final.items(), key=lambda x: x[1], reverse=True)
    CALS   = {
        "Kharif":"Sow: Jun-Jul | Harvest: Oct-Nov",
        "Rabi":"Sow: Oct-Nov | Harvest: Feb-Apr",
        "Zaid":"Sow: Feb-Mar | Harvest: May-Jun",
        "Annual":"Year-round cultivation",
    }

    return AIAnalysisResponse(
        contentType       = AIContentType.ISSUE_REPORT if req.issueReportId else AIContentType.POST,
        modelType         = AIModelType.CATEGORY_CLASSIFICATION,
        postId            = req.postId,
        issueReportId     = req.issueReportId,
        sentiments        = [ranked[0][0]],
        priorityScore     = round((100 - ranked[0][1]) / 100, 4),
        issueCategory     = IssueCategory.AGRICULTURE,
        issuePriority     = IssuePriority.LOW,
        confidence        = round(ranked[0][1] / 100, 4),
        extractedEntities = {
            "district":          req.district,
            "season":            req.season,
            "best_crop":         ranked[0][0],
            "best_score_pct":    round(ranked[0][1], 1),
            "top5":              [(c, round(s,1)) for c,s in ranked[:5]],
            "planting_calendar": CALS.get(req.season, "N/A"),
            "live_temp":         round(temp, 1),
            "annual_rain_est":   round(rain_est, 0),
        },
        summary           = (f"{req.district.title()} {req.season}: "
                             f"best crop = {ranked[0][0]} ({ranked[0][1]:.0f}%)"),
        modelName         = model_used,
        modelVersion      = "5.0.0",
        processingTimeMs  = int((time.time()-t0)*1000),
    )


# ─────────────────────────────────────────────────────────────────────────────
# /predict/risk
# ─────────────────────────────────────────────────────────────────────────────

@app.post(
    "/predict/risk",
    response_model=AIAnalysisResponse,
    summary="Model 6 — Composite agriculture risk (RF + XGBoost meta-ensemble)",
)
def predict_risk(req: RiskRequest):
    t0 = time.time()

    # Run sub-models (they already return AIAnalysisResponse)
    yield_res  = predict_yield(YieldRequest(
        district=req.district, crop=req.crop,
        area_ha=req.area_ha, fertilizer_kg=req.fertilizer_kg,
        irrigation=req.irrigation))
    stress_res = predict_stress(StressRequest(district=req.district, crop=req.crop))
    irr_res    = predict_irrigation(IrrigationRequest(
        district=req.district, crop=req.crop, area_ha=req.area_ha))

    # Pull values from extractedEntities
    yield_ent  = yield_res.extractedEntities  or {}
    stress_ent = stress_res.extractedEntities or {}
    irr_ent    = irr_res.extractedEntities    or {}

    yield_v  = float(yield_ent.get("predicted_yield", 2.5))
    stress_s = float(stress_ent.get("stress_score", 40))
    ir_v     = float(irr_ent.get("irrigation_mm_day", 5.0))

    rf     = _load_model("m6_rf")
    meta   = _load_model("m6_meta")
    scaler = _load_model("m6_scaler")
    fc     = _load_model("m6_feat_cols")

    coords = INDIA_COORDS.get(req.district.lower(), (20.5, 78.9))
    w      = _fetch_weather(*coords)

    if rf and meta and scaler and fc:
        feat = {
            "yield_tonne_ha":yield_v,"stress_score_raw":stress_s,
            "soil_moisture":w["soil_m"],"evapotranspiration":w["et0"],
            "mean_temp":w["temp"],"humidity":w["humidity"],
            "annual_rainfall":min(w["rain_7d"]*52,3000),
            "wind_speed":w["wind"],"vpd":w["vpd"],
            "rainfall_anomaly":0,"temp_anomaly":0,
            "drought_index":0.2,"flood_risk":0.1,
            "pest_incidence":10,"disease_incidence":5,
            "smallholder_pct":70,"insurance_pct":30,
            "irrigation_pct":50 if req.irrigation else 20,
            "market_access":6,"credit_access":40,
            "msp_coverage":60,"fertilizer_kg_ha":req.fertilizer_kg,
            "population_density":400,"ndvi":0.5,"production_efficiency":1.0,
        }
        x    = np.array([[feat.get(c,0) for c in fc]])
        x_sc = scaler.transform(x)
        rf_p = rf.predict_proba(x_sc)
        x_m  = np.hstack([x_sc,rf_p])
        lbl  = int(meta.predict(x_m)[0])
        proba= meta.predict_proba(x_m)[0]
        score= float(sum(i*25*p for i,p in enumerate(proba)))
        model_used = "RF+XGBoost Meta"
    else:
        score = min(100, max(0, (3.0-yield_v)/3.0*25 + stress_s*0.2 + 0.2*20))
        lbl   = 0 if score<25 else 1 if score<50 else 2 if score<75 else 3
        proba = [0.0]*4; proba[lbl]=1.0
        model_used = "Rule-based"

    risk_level = RISK_CLASSES[lbl]

    # Decision layer
    try:
        from policy_rules import generate_decision
        decision = generate_decision(
            district=req.district, yield_prediction=yield_v,
            risk_level=risk_level, risk_score=score,
            stress_class=stress_ent.get("stress_class",""),
            irrigation_mm_day=ir_v, best_crop=req.crop, disease_alert="normal")
        actions  = decision.immediate_actions
        schemes  = decision.government_schemes
        headline = decision.headline
    except Exception:
        HEADLINES = {"Low":"Normal","Moderate":"Precautionary",
                     "High":"Immediate action required","Critical":"Emergency intervention"}
        headline = HEADLINES.get(risk_level,"")
        actions  = []; schemes = ["PMFBY"]

    priority_score = round(score / 100, 4)

    return AIAnalysisResponse(
        contentType       = AIContentType.ISSUE_REPORT if req.issueReportId else AIContentType.POST,
        modelType         = AIModelType.PRIORITY,
        postId            = req.postId,
        issueReportId     = req.issueReportId,
        sentiments        = [risk_level.lower()],
        priorityScore     = priority_score,
        urgencyScore      = priority_score,
        impactScore       = round(priority_score * 0.9, 4),
        issueCategory     = IssueCategory.AGRICULTURE,
        issuePriority     = RISK_TO_PRIORITY.get(risk_level, IssuePriority.MEDIUM),
        confidence        = round(float(proba[lbl]), 4),
        extractedEntities = {
            "district":             req.district,
            "crop":                 req.crop,
            "risk_level":           risk_level,
            "risk_score":           round(score, 1),
            "advisory_headline":    headline,
            "immediate_actions":    actions,
            "government_schemes":   schemes,
            "class_probabilities":  {RISK_CLASSES[i]: round(float(p),3)
                                      for i,p in enumerate(proba)},
            "sub_predictions": {
                "yield":      yield_ent,
                "stress":     stress_ent,
                "irrigation": irr_ent,
            },
        },
        summary           = f"{req.district.title()} {req.crop}: {headline} (score={score:.0f}/100)",
        modelName         = model_used,
        modelVersion      = "6.0.0",
        processingTimeMs  = int((time.time()-t0)*1000),
    )


# ─────────────────────────────────────────────────────────────────────────────
# /predict/district_bulletin  (GET)
# ─────────────────────────────────────────────────────────────────────────────

@app.get(
    "/predict/district_bulletin",
    response_model=AIAnalysisResponse,
    summary="Full district advisory — all models combined into one AIAnalysis response",
)
def district_bulletin(
    district: str = Query("chittoor", description="District name"),
    crop:     str = Query("Rice",     description="Primary crop"),
):
    t0       = time.time()
    risk_res = predict_risk(RiskRequest(
        district=district, crop=crop, area_ha=10,
        fertilizer_kg=150, irrigation=True))
    suit_res = predict_crop(SuitabilityRequest(district=district, season="Kharif"))

    risk_ent = risk_res.extractedEntities or {}
    suit_ent = suit_res.extractedEntities or {}

    return AIAnalysisResponse(
        contentType       = AIContentType.ISSUE_REPORT,
        modelType         = AIModelType.PRIORITY,
        sentiments        = [risk_ent.get("risk_level","Low").lower()],
        priorityScore     = risk_res.priorityScore,
        urgencyScore      = risk_res.urgencyScore,
        impactScore       = risk_res.impactScore,
        issueCategory     = IssueCategory.AGRICULTURE,
        issuePriority     = risk_res.issuePriority,
        confidence        = risk_res.confidence,
        extractedEntities = {
            "bulletin_title":      f"District Agricultural Advisory — {district.title()}",
            "district":            district,
            "primary_crop":        crop,
            "risk_summary": {
                "level":    risk_ent.get("risk_level"),
                "score":    risk_ent.get("risk_score"),
                "headline": risk_ent.get("advisory_headline"),
            },
            "crop_recommendation": {
                "best_crop": suit_ent.get("best_crop"),
                "score_pct": suit_ent.get("best_score_pct"),
                "top5":      suit_ent.get("top5"),
            },
            "immediate_actions":  risk_ent.get("immediate_actions", []),
            "government_schemes": risk_ent.get("government_schemes", []),
            "sub_predictions":    risk_ent.get("sub_predictions", {}),
            "dashboard_ready":    True,
        },
        summary           = (f"Bulletin {district.title()}: "
                             f"{risk_ent.get('advisory_headline','')}"),
        modelName         = "AgriAdvisory-v3",
        modelVersion      = "3.0.0",
        processingTimeMs  = int((time.time()-t0)*1000),
    )


# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("prediction_api:app", host="0.0.0.0", port=8001, reload=True)
