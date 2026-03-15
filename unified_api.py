"""
=============================================================================
NETRAVAAH — Unified FastAPI  (schema-aligned with schema.prisma)
FILE: unified_api.py

Single FastAPI application — all 4 ML modules under one server.
Each module is on its own URL prefix (no route collisions ever).

  PREFIX       MODULE
  /hazard/*    Module 1 — Hazard Prediction
               Natural disaster early warning, 30 Indian districts.
               5 hazards: flood, landslide, heatwave, drought, cyclone.
               Pipeline: Historical→Baseline→Live(7d)→Anomaly→Forecast(72h)
                         →ML→CI→Alerts→Govt Response

  /agro/*      Module 2 — Agro Advisory
               6 agricultural ML models + Gemini-powered Civic AI.
                 /agro/predict/yield                 RF+GB stack
                 /agro/predict/stress                RFC 6-class
                 /agro/predict/disease               ResNet-9 CNN + Gemini
                 /agro/predict/irrigation            HistGBR + FAO-56
                 /agro/predict/crop_recommendation   XGBoost + physics
                 /agro/predict/risk                  RF+XGBoost meta
               Civic AI (all return AIAnalysis-shaped rows):
                 /agro/ai/analyse/post               → AIAnalysis[] + SentimentAnalysis
                 /agro/ai/analyse/issue              → AIAnalysis[]
                 /agro/ai/sentiment                  sentiment + priority
                 /agro/ai/classify                   IssueCategory classification
                 /agro/ai/priority                   priority + urgency + impact
                 /agro/ai/duplicate                  duplicate IssueReport detection
                 /agro/ai/entities                   entity extraction
                 /agro/ai/toxicity                   toxicity / abuse detection
                 /agro/predict/district_bulletin     combined advisory

  /sma/*       Module 3 — Social Media Analysis
               Multi-task BERT (issue + sentiment) + EfficientNet-B4.
                 /sma/community/post                 submit post
                 /sma/community/post/upload          file upload
                 /sma/community/analyze/{post_id}    analyze existing Post
                 /sma/community/post/{post_id}       get cached analysis
                 /sma/community/feed                 filtered feed
                 /sma/community/trends               trends (1h/6h/24h)
                 /sma/community/locations            geocoded hotspot map
                 /sma/community/signals              NLP signals
                 /sma/community/stats                category counts
                 /sma/community/issues               IssueCategory enum list
                 /sma/community/priority             high-priority posts

  /disease/*   Module 4 — Disease Intelligence System
               9-step pipeline for Uttar Pradesh districts.
                 /disease/api/v1/citizen/report
                 /disease/api/v1/symptoms/extract
                 /disease/api/v1/symptoms/list
                 /disease/api/v1/disease/predict
                 /disease/api/v1/disease/predict-from-text
                 /disease/api/v1/cases/ingest
                 /disease/api/v1/cases/summary/{disease}
                 /disease/api/v1/forecast
                 /disease/api/v1/forecast/all/{disease}
                 /disease/api/v1/hotspots/{disease}
                 /disease/api/v1/seir/simulate
                 /disease/api/v1/seir/multi-district
                 /disease/api/v1/risk/score
                 /disease/api/v1/remedy/plan
                 /disease/api/v1/dashboard
                 /disease/api/v1/mobility/{district}
                 /disease/api/v1/pipeline/full
                 /disease/api/v1/pipeline/schema
                 /disease/api/v1/districts
                 /disease/api/v1/diseases
                 /disease/api/v1/weather/{district}
                 /disease/api/v1/feature-store/{district}

Prisma schema alignment:
  All enums mirror schema.prisma exactly (declared once, shared by all modules):
    AIContentType, AIModelType, IssueCategory, IssuePriority, IssueStatus,
    Role, ThemePreference, AuthProvider, MediaType, VoteType

  AIAnalysisResponse mirrors Prisma AIAnalysis model 1-to-1:
    id (uuid), contentType, modelType, postId?, issueReportId?, commentId?,
    sentiments[], sentimentScore?, priorityScore?, toxicityScore?,
    urgencyScore?, impactScore?, detectedLanguage?,
    issueCategory?, issuePriority?, confidence?,
    extractedEntities? (Json), summary?, modelName?, modelVersion?,
    processingTimeMs?, createdAt (datetime)

  SentimentAnalysisResponse mirrors Prisma SentimentAnalysis:
    id (uuid), postId, text?, finalIssue?, confidence?, decidedBy?,
    sentimentLabel?, sentimentScore?, priorityScore?,
    wardNumber?, assignedToDepartment?,
    locations?, textAnalysis?, imageAnalysis?,
    processedAt?, nlpProcessed, createdAt

Directory layout expected (adjust _BASE paths at top of file if different):
  <repo_root>/
    unified_api.py                 ← this file
    hazard_prediction/             ← Module 1 package
    agro_dept/                     ← Module 2 package
    social_media_analysis/         ← Module 3 package (sma/ renamed)
    disease_prediction/            ← Module 4 package

Usage:
    uvicorn unified_api:app --host 0.0.0.0 --port 8000 --reload
    uvicorn unified_api:app --host 0.0.0.0 --port 8000 --workers 4
=============================================================================
"""
from __future__ import annotations

import csv
import io
import json
import logging
import os
import sqlite3
import sys
import threading
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import uuid4

import numpy as np
from fastapi import (
    BackgroundTasks, FastAPI, File, Form, HTTPException,
    Path, Query, UploadFile,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")
logger = logging.getLogger("netravaah.unified")

# ─────────────────────────────────────────────────────────────────────────────
# PATH WIRING — adjust these to match your actual repo layout
# ─────────────────────────────────────────────────────────────────────────────
_BASE = os.path.dirname(os.path.abspath(__file__))

HAZARD_DIR  = os.path.join(_BASE, "hazard_prediction")
AGRO_DIR    = os.path.join(_BASE, "agro_dept")
SMA_DIR     = os.path.join(_BASE, "social_media_analysis")
DISEASE_DIR = os.path.join(_BASE, "disease_prediction")

for _p in [HAZARD_DIR, AGRO_DIR, SMA_DIR, DISEASE_DIR,
           os.path.join(AGRO_DIR, "models"),
           os.path.join(AGRO_DIR, "decision_engine")]:
    if _p not in sys.path:
        sys.path.insert(0, _p)


# =============================================================================
# SECTION 1 — SHARED PRISMA ENUMS (declared once, used by all 4 modules)
# =============================================================================

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


# =============================================================================
# SECTION 2 — SHARED PRISMA RESPONSE MODELS
# =============================================================================

class AIAnalysisResponse(BaseModel):
    """
    Mirrors Prisma AIAnalysis model exactly.
    Returned by all 4 modules — every field maps to a DB column.
    """
    id:                str                       = Field(default_factory=lambda: str(uuid4()))
    contentType:       AIContentType             = AIContentType.ISSUE_REPORT
    modelType:         AIModelType               = AIModelType.PRIORITY
    postId:            Optional[str]             = None
    issueReportId:     Optional[str]             = None
    commentId:         Optional[str]             = None
    sentiments:        List[str]                 = Field(default_factory=list)
    sentimentScore:    Optional[float]           = None
    priorityScore:     Optional[float]           = None
    toxicityScore:     Optional[float]           = None
    urgencyScore:      Optional[float]           = None
    impactScore:       Optional[float]           = None
    detectedLanguage:  Optional[str]             = None
    issueCategory:     Optional[IssueCategory]   = None
    issuePriority:     Optional[IssuePriority]   = None
    confidence:        Optional[float]           = None
    extractedEntities: Optional[Dict[str, Any]]  = None
    summary:           Optional[str]             = None
    modelName:         Optional[str]             = None
    modelVersion:      Optional[str]             = None
    processingTimeMs:  Optional[int]             = None
    createdAt:         datetime                  = Field(default_factory=datetime.now)


class SentimentAnalysisResponse(BaseModel):
    """Mirrors Prisma SentimentAnalysis model exactly."""
    id:                   str                       = Field(default_factory=lambda: str(uuid4()))
    postId:               str
    text:                 Optional[str]             = None
    finalIssue:           Optional[IssueCategory]   = None
    confidence:           Optional[float]           = None
    decidedBy:            Optional[str]             = None
    sentimentLabel:       Optional[str]             = None
    sentimentScore:       Optional[float]           = None
    priorityScore:        Optional[float]           = None
    wardNumber:           Optional[str]             = None
    assignedToDepartment: Optional[str]             = None
    locations:            Optional[Dict[str, Any]]  = None
    textAnalysis:         Optional[Dict[str, Any]]  = None
    imageAnalysis:        Optional[Dict[str, Any]]  = None
    processedAt:          Optional[datetime]        = None
    nlpProcessed:         bool                      = False
    createdAt:            datetime                  = Field(default_factory=datetime.now)


class PostAnalysisFullResponse(BaseModel):
    """Combined response for /agro/ai/analyse/post."""
    aiAnalyses:        List[AIAnalysisResponse]
    sentimentAnalysis: SentimentAnalysisResponse


# =============================================================================
# SECTION 3 — MODULE 1 HAZARD: internals + request models
# =============================================================================

HAZARD_TO_CATEGORY: Dict[str, IssueCategory] = {
    "flood":     IssueCategory.FLOODING,
    "landslide": IssueCategory.ROAD_DAMAGE,
    "heatwave":  IssueCategory.HEALTHCARE,
    "drought":   IssueCategory.AGRICULTURE,
    "cyclone":   IssueCategory.FLOODING,
}
LEVEL_TO_PRIORITY: Dict[str, IssuePriority] = {
    "CRITICAL": IssuePriority.CRITICAL,
    "HIGH":     IssuePriority.HIGH,
    "MEDIUM":   IssuePriority.MEDIUM,
    "WATCH":    IssuePriority.LOW,
    "NORMAL":   IssuePriority.LOW,
}

_h_loaded = False
_h_DISTRICTS: list = []
_h_CACHE:    Dict[str, dict] = {}
_h_WEATHER:  Dict[str, dict] = {}
_h_LOCK = threading.Lock()


def _h_import():
    global _h_loaded, _h_DISTRICTS
    if _h_loaded: return
    from hazard_prediction.config import MONITORED_DISTRICTS
    _h_DISTRICTS = MONITORED_DISTRICTS
    _h_loaded = True


def _h_run(loc: dict) -> dict:
    _h_import()
    from hazard_prediction.data_fetcher import fetch_all, store_weather, load_history
    from hazard_prediction.predictor   import full_response_cycle, _bndl
    d, st, lat, lon = loc["district"], loc["state"], loc["lat"], loc["lon"]
    try:
        b = _bndl(); live = fetch_all(loc, bundle_baselines=b.get("district_baselines", {}))
        store_weather(live); result = full_response_cycle(d, st, lat, lon, live, load_history(d, hours=72))
        with _h_LOCK: _h_CACHE[d] = result; _h_WEATHER[d] = live
        return result
    except Exception as e:
        logger.error(f"[hazard] {d}: {e}"); return {}


def _h_loc(name: str) -> dict:
    _h_import()
    loc = next((d for d in _h_DISTRICTS if d["district"].lower() == name.lower()), None)
    if not loc: raise HTTPException(404, f"District not found: {name}")
    return loc


def _h_cached(name: str) -> dict:
    c = _h_CACHE.get(name) or _h_run(_h_loc(name))
    if not c: raise HTTPException(503, f"Data unavailable: {name}")
    return c


def _h_lv2pri(lv: str) -> IssuePriority: return LEVEL_TO_PRIORITY.get(lv, IssuePriority.LOW)
def _h_prob2sent(p: float) -> List[str]:
    if p>=.80: return ["critical","very_negative","urgent"]
    if p>=.65: return ["high_risk","negative","urgent"]
    if p>=.50: return ["medium_risk","negative"]
    if p>=.35: return ["watch","neutral"]
    return ["normal","positive"]


def _h_ai(result: dict, hazard: str, irid: Optional[str]=None, ms: int=0) -> AIAnalysisResponse:
    p   = result.get("probabilities", {}).get(hazard, 0.0)
    ci  = result.get("confidence_intervals", {}).get(hazard, 0.05)
    hlv = "CRITICAL" if p>=.80 else "HIGH" if p>=.65 else "MEDIUM" if p>=.50 else "WATCH" if p>=.35 else "NORMAL"
    am  = next((a for a in result.get("alerts", []) if a.get("hazard")==hazard), {})
    return AIAnalysisResponse(
        contentType=AIContentType.ISSUE_REPORT, modelType=AIModelType.PRIORITY,
        issueReportId=irid, sentiments=_h_prob2sent(p),
        priorityScore=round(p, 4), urgencyScore=round(min(1.0, p*1.1), 4),
        impactScore=round(min(1.0, p*0.9), 4),
        issueCategory=HAZARD_TO_CATEGORY.get(hazard, IssueCategory.OTHERS),
        issuePriority=_h_lv2pri(hlv),
        confidence=round(max(0.0, 1.0-ci), 4),
        extractedEntities={
            "district": result.get("district"), "state": result.get("state"),
            "hazard": hazard, "probability": p, "ci": ci, "hazard_level": hlv,
            "overall_level": result.get("overall_level"),
            "active_hazards": result.get("active_hazards", []),
            "is_forecast_based": am.get("is_forecast_based", False),
            "hours_ahead": am.get("hours_ahead", 0),
            "citizen_msg": am.get("citizen_msg", ""), "govt_msg": am.get("govt_msg", ""),
            "model_version": result.get("model_version", "v4"),
            "weather_snapshot": result.get("weather_snapshot", {}),
            "anomaly_summary": result.get("anomaly_summary", {}),
            "forecast_summary": result.get("forecast_summary", {}),
        },
        summary=f"{result.get('district','')}: {hazard.capitalize()} {p:.0%} ({hlv})",
        modelName="NETRAVAAH-hazard-v5", modelVersion=result.get("model_version","v4"),
        processingTimeMs=ms,
    )


def _h_monitor():
    _h_import()
    while True:
        for loc in _h_DISTRICTS: _h_run(loc); time.sleep(3)
        time.sleep(600)


def _h_db():
    from hazard_prediction.config import DB_PATH
    c = sqlite3.connect(DB_PATH); c.row_factory = sqlite3.Row; return c


class HazardDistrictSummary(BaseModel):
    district: str; state: str; lat: float; lon: float
    probabilities: Dict[str, float]; confidence_intervals: Dict[str, float]
    active_hazards: List[str]; overall_level: str; issuePriority: IssuePriority
    alert_count: int; anomaly_count: int; forecast_triggered: List[str]
    forecast_max_prob: float; timestamp: str

class HazardAnalyseDistrictReq(BaseModel):
    district: str; issueReportId: Optional[str]=None; reporterId: Optional[str]=None
    caption: Optional[str]=None; locationName: Optional[str]=None
    status: IssueStatus=IssueStatus.REPORTED; priority: IssuePriority=IssuePriority.MEDIUM
    viewCount: int=0; isDuplicate: bool=False; duplicateOfId: Optional[str]=None
    assignedToId: Optional[str]=None

class HazardClassifyTextReq(BaseModel):
    text: str; locationName: Optional[str]=None
    latitude: Optional[float]=None; longitude: Optional[float]=None
    issueReportId: Optional[str]=None; postId: Optional[str]=None
    status: IssueStatus=IssueStatus.REPORTED; priority: IssuePriority=IssuePriority.MEDIUM

class HazardPollReq(BaseModel): district: Optional[str]=None


# =============================================================================
# SECTION 4 — MODULE 2 AGRO: request models
# =============================================================================

class AgroPostReq(BaseModel):
    postId: Optional[str]=None; authorId: Optional[str]=None
    caption: str=Field(...); locationName: Optional[str]=None
    latitude: Optional[float]=None; longitude: Optional[float]=None
    sentimentScore: Optional[float]=None; priorityScore: Optional[float]=None
    imageUrl: Optional[str]=None

class AgroIssueReq(BaseModel):
    issueReportId: Optional[str]=None; reporterId: Optional[str]=None
    assignedToId: Optional[str]=None; caption: str=Field(...)
    description: Optional[str]=None; latitude: float=20.5; longitude: float=78.9
    locationName: Optional[str]=None; status: IssueStatus=IssueStatus.REPORTED
    priority: IssuePriority=IssuePriority.MEDIUM; viewCount: int=0
    isDuplicate: bool=False; duplicateOfId: Optional[str]=None
    imageUrls: List[str]=Field(default_factory=list)

class AgroSentimentReq(BaseModel):
    contentType: AIContentType=AIContentType.POST
    postId: Optional[str]=None; issueReportId: Optional[str]=None
    commentId: Optional[str]=None; text: str=Field(...)

class AgroClassifyReq(BaseModel):
    contentType: AIContentType=AIContentType.ISSUE_REPORT
    postId: Optional[str]=None; issueReportId: Optional[str]=None
    text: str=Field(...)

class AgroPriorityReq(BaseModel):
    contentType: AIContentType=AIContentType.ISSUE_REPORT
    postId: Optional[str]=None; issueReportId: Optional[str]=None
    text: str=Field(...); sentimentScore: Optional[float]=None
    issueCategory: Optional[IssueCategory]=None

class AgroDuplicateReq(BaseModel):
    contentType: AIContentType=AIContentType.ISSUE_REPORT
    issueReportId: Optional[str]=None; caption: str=Field(...)
    latitude: float=20.5; longitude: float=78.9
    isDuplicate: bool=False; duplicateOfId: Optional[str]=None
    existingIssues: List[Dict[str, Any]]=Field(default_factory=list)

class AgroEntityReq(BaseModel):
    contentType: AIContentType=AIContentType.POST
    postId: Optional[str]=None; issueReportId: Optional[str]=None
    text: str=Field(...); latitude: Optional[float]=None; longitude: Optional[float]=None

class AgroToxicityReq(BaseModel):
    contentType: AIContentType=AIContentType.COMMENT
    commentId: Optional[str]=None; postId: Optional[str]=None; text: str=Field(...)

class AgroYieldReq(BaseModel):
    district: str="chittoor"; crop: str="Rice"; area_ha: float=10.0
    fertilizer_kg: float=150.0; irrigation: bool=True; soil_ph: float=6.5
    soil_type_idx: int=2; season: str="Kharif"
    postId: Optional[str]=None; issueReportId: Optional[str]=None

class AgroStressReq(BaseModel):
    district: str="hyderabad"; crop: str="Rice"; season: str="Kharif"; ndvi: float=0.55
    postId: Optional[str]=None; issueReportId: Optional[str]=None

class AgroDiseaseReq(BaseModel):
    district: str="hyderabad"; disease_text: str=""; farmer_description: str=""
    postId: Optional[str]=None; issueReportId: Optional[str]=None

class AgroIrrigationReq(BaseModel):
    district: str="lucknow"; crop: str="Wheat"; days_sowing: int=45
    area_ha: float=8.0; elevation_m: float=120.0
    postId: Optional[str]=None; issueReportId: Optional[str]=None

class AgroSuitabilityReq(BaseModel):
    district: str="jaipur"; soil_type_idx: int=1; ph: float=7.2
    nitrogen: float=180.0; organic_matter: float=0.9; season: str="Rabi"
    postId: Optional[str]=None; issueReportId: Optional[str]=None

class AgroRiskReq(BaseModel):
    district: str="patna"; crop: str="Rice"; area_ha: float=10.0
    fertilizer_kg: float=150.0; irrigation: bool=True
    postId: Optional[str]=None; issueReportId: Optional[str]=None


# =============================================================================
# SECTION 5 — MODULE 3 SMA: helpers + request models
# =============================================================================

_SMA_MAP = {
    "Water Supply":"WATER_SUPPLY","Road Damage":"ROAD_DAMAGE","Electricity":"ELECTRICITY",
    "Street Lights":"STREET_LIGHTS","Drainage and Sewage":"DRAINAGE_AND_SEWAGE",
    "Flooding":"FLOODING","Garbage Collection":"GARBAGE_COLLECTION",
    "Public Toilets":"PUBLIC_TOILETS","Healthcare":"HEALTHCARE","Education":"EDUCATION",
    "Public Safety":"PUBLIC_SAFETY","Public Transport":"PUBLIC_TRANSPORT",
    "Air Pollution":"AIR_POLLUTION","Water Pollution":"WATER_POLLUTION",
    "Corruption":"CORRUPTION","Government Schemes":"GOVERNMENT_SCHEMES",
    "Agriculture":"AGRICULTURE","Other":"OTHERS",
}
_SMA_REV = {v: k for k, v in _SMA_MAP.items()}
_SMA_HIGH   = {"FLOODING","PUBLIC_SAFETY","HEALTHCARE","WATER_SUPPLY","ELECTRICITY","AIR_POLLUTION"}
_SMA_MEDIUM = {"ROAD_DAMAGE","DRAINAGE_AND_SEWAGE","GARBAGE_COLLECTION","WATER_POLLUTION","PUBLIC_TRANSPORT"}


def _s2p(i: str) -> str: return _SMA_MAP.get(i, "OTHERS")
def _p2s(p: str) -> str: return _SMA_REV.get(p, "Other")
def _spri(conf: float, sent: float, issue: str) -> float:
    pr = _s2p(issue); w = 1.0 if pr in _SMA_HIGH else 0.85 if pr in _SMA_MEDIUM else 0.70
    return round(min((conf*0.6+(sent or 0.5)*0.4)*w, 1.0), 3)
def _spe(sc: float) -> str:
    return "CRITICAL" if sc>=.8 else "HIGH" if sc>=.6 else "MEDIUM" if sc>=.4 else "LOW"
def _sbr(result: dict) -> dict:
    sent=result.get("sentiment",{}); ss=sent.get("score",0.0)
    fi=result.get("final_issue","Other"); conf=result.get("confidence",0.0)
    pri=_spri(conf,ss,fi); pi=_s2p(fi)
    return {
        "post_id":result["post_id"],"final_issue":pi,"final_issue_display":fi,
        "confidence":conf,"decided_by":result.get("decided_by"),
        "sentiment_label":sent.get("label"),"sentiment_score":ss,
        "priority_score":pri,"priority_enum":_spe(pri),
        "locations":result.get("locations",[]),"text_analysis":result.get("text_analysis"),
        "image_analysis":result.get("image_analysis"),"processed_at":result.get("processed_at"),
        "nlp_processed":True,
        "prisma_ready":{
            "finalIssue":pi,"confidence":conf,"decidedBy":result.get("decided_by"),
            "sentimentLabel":sent.get("label"),"sentimentScore":ss,"priorityScore":pri,
            "locations":result.get("locations",[]),"textAnalysis":result.get("text_analysis"),
            "imageAnalysis":result.get("image_analysis"),"processedAt":result.get("processed_at"),
            "nlpProcessed":True,
        },
    }
def _sdb():
    from social_media_analysis.analysis import _social_signals, _locations_col, _trends_col
    return _social_signals, _locations_col, _trends_col


class SmaPostReq(BaseModel):
    text: Optional[str]=None; image_url: Optional[str]=None; user_id: Optional[str]=None
    location: Optional[str]=None; latitude: Optional[float]=None; longitude: Optional[float]=None
    timestamp: Optional[str]=None

class SmaAnalyzeReq(BaseModel):
    post_id: str; text: Optional[str]=None; image_url: Optional[str]=None


# =============================================================================
# SECTION 6 — MODULE 4 DISEASE: request models + lazy loader
# =============================================================================

class DiseaseCitizenReq(BaseModel):
    text: str=Field(...); district: str="Lucknow"
    lat: Optional[float]=None; lng: Optional[float]=None; citizen_id: Optional[str]="anon"

class DiseaseSymptomPredictReq(BaseModel):
    symptoms: List[str]=Field(...); top_k: int=Field(5,ge=1,le=10)

class DiseaseForecastReq(BaseModel):
    district: str; disease: str; cases: int=Field(10,ge=0)
    weeks_history: Optional[List[int]]=None

class DiseaseFullPipelineReq(BaseModel):
    district: str="Lucknow"; text: Optional[str]=None
    symptoms: Optional[List[str]]=None; disease: Optional[str]=None; cases: int=Field(15,ge=0)

class DiseaseCaseIngestReq(BaseModel):
    district: str; disease: str; cases: int; deaths: int=0; recoveries: int=0

class DiseaseMultiSEIRReq(BaseModel):
    disease: str="Dengue"; initial_infected: Dict[str,int]=Field(default={"Lucknow":20,"Kanpur":10})
    days: int=Field(60,ge=7,le=180); mobility_rate: float=Field(0.01,ge=0.0,le=0.1)


_dsvc: dict = {}
def _disease():
    if _dsvc: return _dsvc
    from disease_prediction.services.feature_engineering import feature_engineer
    from disease_prediction.services.symptom_classifier  import symptom_classifier
    from disease_prediction.services.case_aggregator     import case_aggregator
    from disease_prediction.services.outbreak_forecast   import outbreak_forecaster
    from disease_prediction.services.hotspot_detection   import hotspot_detector
    from disease_prediction.services.seir_model          import get_seir_model
    from disease_prediction.services.risk_scoring        import risk_scorer, hospital_load_predictor
    from disease_prediction.services.remedy_planner      import remedy_planner
    from disease_prediction.services.kafka_pipeline      import pipeline
    from disease_prediction.services.data_services       import data_service
    from disease_prediction.config.settings              import settings, DISTRICTS_UP
    _dsvc.update({"fe":feature_engineer,"sc":symptom_classifier,"ca":case_aggregator,
                  "of":outbreak_forecaster,"hd":hotspot_detector,"get_seir":get_seir_model,
                  "rs":risk_scorer,"hlp":hospital_load_predictor,"rp":remedy_planner,
                  "pipe":pipeline,"ds":data_service,"settings":settings,"UP":DISTRICTS_UP})
    return _dsvc


def _d_dist(svc, name):
    return next((d for d in svc["UP"] if d["name"]==name), svc["UP"][0])

def _d_weather(svc, dist):
    w = svc["fe"].extract_weather_features(dist["lat"], dist["lng"])
    w.update(svc["fe"].compute_environmental_risk_indicators(w, dist["lat"]))
    w.update(svc["fe"].fetch_mobility_data(dist["name"], dist["lat"], dist["lng"]))
    return w

def _d_records(svc, disease):
    df = svc["ca"].get_district_summary(svc["UP"], disease); recs = df.to_dict(orient="records")
    for r in recs:
        r["lat"]=next((d["lat"] for d in svc["UP"] if d["name"]==r["district"]),26.85)
        r["lng"]=next((d["lng"] for d in svc["UP"] if d["name"]==r["district"]),80.95)
    return recs

def _d_hospital(svc, dist, forecast, disease):
    return svc["hlp"].predict(
        predicted_cases=forecast["projected_cases_next_week"],
        population=dist["population"], hospital_beds=dist.get("hospital_beds",500),
        doctors=dist.get("doctors",100), nurses=dist.get("nurses",200), disease=disease)

def _d_risk(svc, forecast, hotspot, hospital):
    return svc["rs"].calculate(
        outbreak_probability=forecast["outbreak_probability"],
        hotspot_density=hotspot["hotspot_density"],
        hospital_load_ratio=hospital["load_ratio"]/100,
        environmental_risk=forecast["env_risk_score"]/100)


# =============================================================================
# SECTION 7 — FASTAPI APP + LIFESPAN
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 NETRAVAAH Unified API — 4 ML modules starting")

    try:
        from hazard_prediction.data_fetcher import init_db
        init_db()
        threading.Thread(target=_h_monitor, daemon=True).start()
        logger.info("✅ [hazard] monitor started")
    except Exception as e: logger.warning(f"[hazard] startup: {e}")

    try:
        svc = _disease()
        if not svc["sc"].is_trained:
            m = svc["sc"].train(); svc["sc"].save()
            logger.info(f"[disease] trained — acc={m.get('ensemble_accuracy','?'):.4f}")
        svc["ds"].load_dataset()
        logger.info("✅ [disease] services ready")
    except Exception as e: logger.warning(f"[disease] startup: {e}")

    yield

    try: _disease()["pipe"].stop_all()
    except Exception: pass
    logger.info("🛑 NETRAVAAH Unified API shutdown")


app = FastAPI(
    title="NETRAVAAH — Unified AI Platform",
    description=(
        "Single FastAPI server — all 4 NETRAVAAH ML modules. "
        "All responses are Prisma schema-aligned (AIAnalysis, SentimentAnalysis, "
        "IssueReport, Post). Modules: /hazard (disasters), /agro (agriculture+AI), "
        "/sma (social media), /disease (disease intelligence)."
    ),
    version="1.0.0",
    lifespan=lifespan,
)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


# =============================================================================
# ROOT + UNIFIED HEALTH
# =============================================================================

@app.get("/", tags=["Index"])
def root():
    return {"project":"NETRAVAAH Unified API","version":"1.0.0","docs":"/docs","health":"/health",
            "modules":{"hazard":"/hazard","agro":"/agro","sma":"/sma","disease":"/disease"}}


@app.get("/health", tags=["Health"])
def health():
    out = {"status":"ok","timestamp":datetime.now(timezone.utc).isoformat(),"schema_version":"prisma@3.0"}
    try:
        from hazard_prediction.predictor import _bndl
        b=_bndl(); out["hazard"]={"status":"ok","model_version":b.get("version","v4"),"cached":len(_h_CACHE)}
    except Exception as e: out["hazard"]={"status":"error","detail":str(e)}
    try:
        _h_import(); out["agro"]={"status":"ok"}
    except Exception as e: out["agro"]={"status":"error","detail":str(e)}
    try:
        ss,_,_=_sdb(); ss.find_one(); out["sma"]={"status":"ok","db":"connected"}
    except Exception as e: out["sma"]={"status":"degraded","db":"disconnected"}
    try:
        svc=_disease(); out["disease"]={"status":"ok","model_trained":svc["sc"].is_trained}
    except Exception as e: out["disease"]={"status":"error","detail":str(e)}
    return out


# =============================================================================
# MODULE 1 — HAZARD  /hazard/*
# =============================================================================

@app.get("/hazard/overview", response_model=List[HazardDistrictSummary], tags=["Hazard"])
def h_overview():
    """All 30 monitored districts — probabilities, active hazards, alert level."""
    _h_import(); out=[]
    for loc in _h_DISTRICTS:
        d=loc["district"]; c=_h_CACHE.get(d)
        if c:
            fa=c.get("forecast_summary",{}); lv=c.get("overall_level","NORMAL")
            out.append(HazardDistrictSummary(
                district=d,state=loc["state"],lat=loc["lat"],lon=loc["lon"],
                probabilities=c.get("probabilities",{}),confidence_intervals=c.get("confidence_intervals",{}),
                active_hazards=c.get("active_hazards",[]),overall_level=lv,issuePriority=_h_lv2pri(lv),
                alert_count=len(c.get("alerts",[])),anomaly_count=c.get("anomaly_summary",{}).get("anomalies_detected",0),
                forecast_triggered=fa.get("triggered_hazards",[]),forecast_max_prob=fa.get("max_probability_72h",0.0),
                timestamp=c.get("timestamp","")))
        else:
            out.append(HazardDistrictSummary(district=d,state=loc["state"],lat=loc["lat"],lon=loc["lon"],
                probabilities={},confidence_intervals={},active_hazards=[],overall_level="LOADING",
                issuePriority=IssuePriority.LOW,alert_count=0,anomaly_count=0,
                forecast_triggered=[],forecast_max_prob=0.0,timestamp=""))
    return out


@app.get("/hazard/district/{name}", tags=["Hazard"])
def h_district(name: str=Path(...), issueReportId: Optional[str]=Query(None)):
    """Full detail + per-hazard AIAnalysis rows ready for Prisma INSERT."""
    t0=time.time(); c=_h_cached(name); ms=int((time.time()-t0)*1000)
    r=dict(c)
    if r.get("evac_plan"): ep=dict(r["evac_plan"]); ep.pop("grid",None); r["evac_plan"]=ep
    r.pop("risk_grid",None)
    r["aiAnalyses"]=[_h_ai(c,h,issueReportId,ms).model_dump()
                     for h in ["flood","landslide","heatwave","drought","cyclone"]]
    return r


@app.get("/hazard/anomalies/{name}", tags=["Hazard"])
def h_anomalies(name: str=Path(...), issueReportId: Optional[str]=Query(None)):
    """Anomaly z-scores vs 3-year baseline + AIAnalysis row."""
    t0=time.time(); c=_h_cached(name); live=_h_WEATHER.get(name,{}); ms=int((time.time()-t0)*1000)
    probs=c.get("probabilities",{}); lead=max(probs,key=probs.get) if probs else "flood"
    mp=probs.get(lead,0.0); ans=c.get("anomaly_summary",{})
    ai=AIAnalysisResponse(
        contentType=AIContentType.ISSUE_REPORT, modelType=AIModelType.ENTITY_EXTRACTION,
        issueReportId=issueReportId, sentiments=_h_prob2sent(mp),
        priorityScore=round(mp,4),issueCategory=HAZARD_TO_CATEGORY.get(lead,IssueCategory.OTHERS),
        issuePriority=_h_lv2pri(c.get("overall_level","NORMAL")),
        confidence=round(1.0-c.get("confidence_intervals",{}).get(lead,0.1),4),
        extractedEntities={"district":name,"anomalies":live.get("anomalies",{}),"anomaly_summary":ans},
        summary=f"{name}: {ans.get('anomalies_detected',0)} anomaly(s)",
        modelName="NETRAVAAH-hazard-anomaly",processingTimeMs=ms)
    return {"district":name,"timestamp":c.get("timestamp",""),"anomalies":live.get("anomalies",{}),
            "anomaly_summary":ans,"weather_snapshot":c.get("weather_snapshot",{}),"aiAnalysis":ai.model_dump()}


@app.get("/hazard/forecast-alerts/{name}", tags=["Hazard"])
def h_forecast(name: str=Path(...), issueReportId: Optional[str]=Query(None)):
    """72-hour forecast-based alerts + AIAnalysis row."""
    t0=time.time(); c=_h_cached(name); live=_h_WEATHER.get(name,{}); ms=int((time.time()-t0)*1000)
    fa=live.get("forecast_alerts_72h",{}); triggered=c.get("forecast_triggered_hazards",[])
    probs=c.get("probabilities",{}); lead=triggered[0] if triggered else (max(probs,key=probs.get) if probs else "flood")
    mp=probs.get(lead,0.0)
    ai=AIAnalysisResponse(
        contentType=AIContentType.ISSUE_REPORT,modelType=AIModelType.PRIORITY,
        issueReportId=issueReportId,sentiments=_h_prob2sent(mp),
        priorityScore=round(mp,4),urgencyScore=round(min(1.0,mp*1.15),4),
        issueCategory=HAZARD_TO_CATEGORY.get(lead,IssueCategory.OTHERS),
        issuePriority=_h_lv2pri(c.get("overall_level","NORMAL")),
        confidence=round(1.0-c.get("confidence_intervals",{}).get(lead,0.1),4),
        extractedEntities={"district":name,"triggered_hazards":triggered,
            "forecast_alerts":{h:v for h,v in fa.items() if h!="_summary"},
            "forecast_weather":{"rain_72h_mm":live.get("forecast_rain_72h"),"rain_24h_mm":live.get("forecast_rain_24h"),
                                "temp_max_c":live.get("forecast_temp_max"),"wind_max_mps":live.get("forecast_wind_max")}},
        summary=f"{name}: 72h {lead} {mp:.0%} triggered={triggered}",
        modelName="NETRAVAAH-hazard-forecast",processingTimeMs=ms)
    return {"district":name,"timestamp":c.get("timestamp",""),
            "forecast_alerts":{h:v for h,v in fa.items() if h!="_summary"},
            "summary":fa.get("_summary",{}),"triggered_hazards":triggered,
            "forecast_weather":{"rain_72h_mm":live.get("forecast_rain_72h"),"temp_max_c":live.get("forecast_temp_max"),
                                "wind_max_mps":live.get("forecast_wind_max")},
            "aiAnalysis":ai.model_dump()}


@app.get("/hazard/pipeline-status", tags=["Hazard"])
def h_pipeline_all():
    _h_import()
    try:
        from hazard_prediction.predictor import _bndl; b=_bndl()
    except Exception: b={}
    rows=[{"district":loc["district"],"state":loc["state"],
           "status":c.get("pipeline_status",{}),"anomalies":c.get("anomaly_summary",{}).get("anomalies_detected",0),
           "72h_alerts":c.get("forecast_summary",{}).get("triggered_hazards",[]),
           "overall_level":c.get("overall_level","LOADING"),
           "issuePriority":_h_lv2pri(c.get("overall_level","NORMAL")).value,
           "timestamp":c.get("timestamp","")}
          for loc in _h_DISTRICTS if (c:=_h_CACHE.get(loc["district"]))]
    return {"global_pipeline":{"historical_dataset_training":True,"baseline_climate_patterns":bool(b.get("district_baselines")),
                               "live_api_integration":True,"past_week_analysis":True,"anomaly_detection":True,
                               "forecast_72h":True,"ml_prediction":True,"alert_generation":True,"govt_response":True},
            "districts":rows}


@app.get("/hazard/pipeline-status/{name}", tags=["Hazard"])
def h_pipeline_district(name: str=Path(...)):
    c=_h_CACHE.get(name)
    if not c: raise HTTPException(404,f"Not cached yet: {name}")
    lv=c.get("overall_level","NORMAL")
    return {"district":name,"pipeline_status":c.get("pipeline_status",{}),"overall_level":lv,
            "issuePriority":_h_lv2pri(lv).value,"anomaly_summary":c.get("anomaly_summary",{}),
            "forecast_summary":c.get("forecast_summary",{}),"timestamp":c.get("timestamp","")}


@app.get("/hazard/risk-map/{name}", tags=["Hazard"])
def h_riskmap(name: str=Path(...)): return _h_cached(name).get("risk_grid") or {}


@app.get("/hazard/evac-routes/{name}", tags=["Hazard"])
def h_evac(name: str=Path(...), hazard: str=Query("flood")):
    loc=_h_loc(name); c=_h_CACHE.get(loc["district"]); live=_h_WEATHER.get(loc["district"],{}) if c else {}
    if not c:
        from hazard_prediction.data_fetcher import fetch_all; live=fetch_all(loc)
    from hazard_prediction.response_engine import plan_evacuation
    return plan_evacuation(loc["district"],loc["lat"],loc["lon"],loc["state"],live,(c or {}).get("probabilities",{}),hazard)


@app.get("/hazard/road-blocks/{name}", tags=["Hazard"])
def h_roadblocks(name: str=Path(...)):
    from hazard_prediction.response_engine import IOT_BARRICADE_STATES
    c=_h_CACHE.get(name); ep=(c or {}).get("evac_plan") or {}
    return {"district":name,"signals":ep.get("iot_signals",[]),"roads_blocked":ep.get("roads_blocked",0),
            "barricade_states":dict(IOT_BARRICADE_STATES),"timestamp":(c or {}).get("timestamp","")}


@app.get("/hazard/dam-advisories", tags=["Hazard"])
def h_dams():
    advs=[adv for c in _h_CACHE.values() for adv in c.get("dam_advisories",[])]
    advs.sort(key=lambda x:{"CRITICAL":0,"HIGH":1,"MEDIUM":2,"WATCH":3,"NORMAL":4}.get(x.get("urgency","NORMAL"),4))
    return advs


@app.get("/hazard/bridge-advisories", tags=["Hazard"])
def h_bridges(): return [{**adv,"district":d} for d,c in _h_CACHE.items() for adv in c.get("bridge_advisories",[])]


@app.get("/hazard/infrastructure", tags=["Hazard"])
def h_infra():
    return {d:{"dam_advisories":c.get("dam_advisories",[]),"bridge_advisories":c.get("bridge_advisories",[]),
               "drainage_advisory":c.get("drainage_advisory",{})} for d,c in _h_CACHE.items()}


@app.get("/hazard/alert/{alert_id}/citizen", tags=["Hazard"])
def h_citizen(alert_id: int=Path(...)):
    conn=_h_db(); row=conn.execute("SELECT * FROM alerts WHERE id=?",(alert_id,)).fetchone(); conn.close()
    if not row: raise HTTPException(404,"Alert not found")
    return {"alert_id":alert_id,"citizen_msg":row["citizen_msg"]}


@app.get("/hazard/alert/{alert_id}/govt", tags=["Hazard"])
def h_govt(alert_id: int=Path(...)):
    conn=_h_db(); row=conn.execute("SELECT * FROM alerts WHERE id=?",(alert_id,)).fetchone(); conn.close()
    if not row: raise HTTPException(404,"Alert not found")
    return {"alert_id":alert_id,"govt_msg":row["govt_msg"]}


@app.post("/hazard/alert/{alert_id}/ack", tags=["Hazard"])
def h_ack(alert_id: int=Path(...)):
    conn=_h_db(); conn.execute("UPDATE alerts SET ack=1 WHERE id=?",(alert_id,)); conn.commit(); conn.close()
    return {"ok":True,"acked":alert_id}


@app.get("/hazard/shelters", tags=["Hazard"])
def h_shelters():
    from hazard_prediction.config import SHELTERS; return SHELTERS


@app.get("/hazard/geocode", tags=["Hazard"])
def h_geocode(q: str=Query(...)):
    from hazard_prediction.response_engine import geocode_address
    r=geocode_address(q)
    if not r: raise HTTPException(404,"Not found")
    return r


@app.get("/hazard/reverse-geocode", tags=["Hazard"])
def h_rev_geocode(lat: float=Query(...), lon: float=Query(...)):
    from hazard_prediction.response_engine import reverse_geocode
    r=reverse_geocode(lat,lon)
    if not r: raise HTTPException(404,"Not found")
    return r


@app.get("/hazard/export/alerts", tags=["Hazard"])
def h_export_alerts():
    conn=_h_db()
    rows=conn.execute("SELECT id,ts,district,state,hazard,probability,level,is_forecast_based,hours_ahead,ack FROM alerts ORDER BY ts DESC").fetchall()
    conn.close(); buf=io.StringIO(); w=csv.writer(buf)
    w.writerow(["id","timestamp","district","state","hazard","probability","level","is_forecast_based","hours_ahead","acknowledged"])
    w.writerows(rows)
    return StreamingResponse(iter([buf.getvalue()]),media_type="text/csv",
                             headers={"Content-Disposition":"attachment; filename=hazard_alerts.csv"})


@app.get("/hazard/export/anomalies", tags=["Hazard"])
def h_export_anomalies():
    conn=_h_db()
    rows=conn.execute("SELECT * FROM anomaly_log ORDER BY ts DESC LIMIT 1000").fetchall()
    conn.close(); buf=io.StringIO(); w=csv.writer(buf)
    w.writerow(["id","ts","district","state","variable","z_score","severity","live_value","baseline_mean"])
    w.writerows(rows)
    return StreamingResponse(iter([buf.getvalue()]),media_type="text/csv",
                             headers={"Content-Disposition":"attachment; filename=hazard_anomalies.csv"})


@app.post("/hazard/poll", tags=["Hazard"])
def h_poll(body: HazardPollReq=HazardPollReq()):
    if body.district:
        loc=_h_loc(body.district); threading.Thread(target=_h_run,args=(loc,),daemon=True).start()
        return {"queued":body.district}
    threading.Thread(target=_h_monitor,daemon=True).start(); return {"queued":"all"}


@app.post("/hazard/analyse/district", response_model=List[AIAnalysisResponse], tags=["Hazard"])
def h_analyse_district(req: HazardAnalyseDistrictReq):
    """Fresh district run → 5 AIAnalysisResponse rows (one per hazard). Links to issueReportId."""
    t0=time.time(); result=_h_run(_h_loc(req.district))
    if not result: raise HTTPException(503,f"Prediction failed: {req.district}")
    ms=int((time.time()-t0)*1000)
    return [_h_ai(result,h,req.issueReportId,ms) for h in ["flood","landslide","heatwave","drought","cyclone"]]


@app.post("/hazard/analyse/text", response_model=AIAnalysisResponse, tags=["Hazard"])
def h_analyse_text(req: HazardClassifyTextReq):
    """Classify free text → hazard category. Enriched with live data if district matched."""
    t0=time.time(); txt=req.text.lower()
    KMAP={"flood":["flood","inundation","waterlogging","submerge","deluge","overflow","river"],
          "landslide":["landslide","mudslide","hillslip","slope","debris","rockfall"],
          "heatwave":["heat","heatwave","hot","temperature","sunstroke","loo","scorching"],
          "drought":["drought","dry","water scarcity","no rain","crop failure","groundwater"],
          "cyclone":["cyclone","hurricane","storm","typhoon","wind","gale","depression"]}
    scores={h:sum(1 for kw in kws if kw in txt) for h,kws in KMAP.items()}
    lead=max(scores,key=scores.get) if max(scores.values())>0 else "flood"
    _h_import(); matched=None
    if req.locationName:
        ll=req.locationName.lower()
        matched=next((loc for loc in _h_DISTRICTS if loc["district"].lower() in ll or ll in loc["district"].lower()),None)
    lr=None
    if matched:
        lr=_h_CACHE.get(matched["district"])
        if not lr:
            try: lr=_h_run(matched)
            except Exception: lr=None
    ms=int((time.time()-t0)*1000)
    if lr:
        ai=_h_ai(lr,lead,req.issueReportId or req.postId,ms); ai.postId=req.postId; ai.issueReportId=req.issueReportId; return ai
    return AIAnalysisResponse(contentType=AIContentType.ISSUE_REPORT,modelType=AIModelType.CATEGORY_CLASSIFICATION,
        issueReportId=req.issueReportId,postId=req.postId,sentiments=[lead],
        priorityScore=round(min(1.0,scores[lead]*0.2+0.3),4),
        issueCategory=HAZARD_TO_CATEGORY.get(lead,IssueCategory.OTHERS),
        issuePriority={"cyclone":IssuePriority.CRITICAL,"flood":IssuePriority.HIGH,"landslide":IssuePriority.HIGH}.get(lead,IssuePriority.MEDIUM),
        confidence=round(min(1.0,0.4+scores[lead]*0.15),4),
        extractedEntities={"keyword_scores":scores,"location":req.locationName,"live_enriched":False},
        summary=f"Text→'{lead}' (score={scores[lead]}, no live match)",
        modelName="NETRAVAAH-hazard-classifier",processingTimeMs=ms)


# =============================================================================
# MODULE 2 — AGRO  /agro/*
# =============================================================================

@app.get("/agro/health", tags=["Agro"])
def a_health():
    from agro_dept.prediction_api import MODELS_DIR
    return {"status":"ok","models_dir":MODELS_DIR,"schema_version":"prisma@3.0",
            "available_models":[f[:-4] for f in os.listdir(MODELS_DIR) if f.endswith(".pkl")] if os.path.exists(MODELS_DIR) else []}


@app.post("/agro/ai/analyse/post", response_model=PostAnalysisFullResponse, tags=["Agro — Civic AI"])
def a_analyse_post(req: AgroPostReq):
    """Full Post analysis → AIAnalysis[] + SentimentAnalysis row (Prisma-ready INSERT)."""
    from agro_dept.prediction_api import analyse_post, PostAnalysisRequest
    return analyse_post(PostAnalysisRequest(**req.model_dump()))


@app.post("/agro/ai/analyse/issue", response_model=List[AIAnalysisResponse], tags=["Agro — Civic AI"])
def a_analyse_issue(req: AgroIssueReq):
    """Full IssueReport analysis → AIAnalysis[] rows."""
    from agro_dept.prediction_api import analyse_issue, IssueAnalysisRequest
    return analyse_issue(IssueAnalysisRequest(**req.model_dump()))


@app.post("/agro/ai/sentiment", response_model=AIAnalysisResponse, tags=["Agro — Civic AI"])
def a_sentiment(req: AgroSentimentReq):
    from agro_dept.prediction_api import sentiment, SentimentRequest
    return sentiment(SentimentRequest(**req.model_dump()))


@app.post("/agro/ai/classify", response_model=AIAnalysisResponse, tags=["Agro — Civic AI"])
def a_classify(req: AgroClassifyReq):
    from agro_dept.prediction_api import classify, ClassifyRequest
    return classify(ClassifyRequest(**req.model_dump()))


@app.post("/agro/ai/priority", response_model=AIAnalysisResponse, tags=["Agro — Civic AI"])
def a_priority(req: AgroPriorityReq):
    from agro_dept.prediction_api import priority, PriorityRequest
    return priority(PriorityRequest(**req.model_dump()))


@app.post("/agro/ai/duplicate", response_model=AIAnalysisResponse, tags=["Agro — Civic AI"])
def a_duplicate(req: AgroDuplicateReq):
    from agro_dept.prediction_api import duplicate, DuplicateRequest
    return duplicate(DuplicateRequest(**req.model_dump()))


@app.post("/agro/ai/entities", response_model=AIAnalysisResponse, tags=["Agro — Civic AI"])
def a_entities(req: AgroEntityReq):
    from agro_dept.prediction_api import entities, EntityRequest
    return entities(EntityRequest(**req.model_dump()))


@app.post("/agro/ai/toxicity", response_model=AIAnalysisResponse, tags=["Agro — Civic AI"])
def a_toxicity(req: AgroToxicityReq):
    from agro_dept.prediction_api import toxicity, ToxicityRequest
    return toxicity(ToxicityRequest(**req.model_dump()))


@app.post("/agro/predict/yield", response_model=AIAnalysisResponse, tags=["Agro — Prediction"])
def a_yield(req: AgroYieldReq):
    from agro_dept.prediction_api import predict_yield, YieldRequest
    return predict_yield(YieldRequest(**req.model_dump()))


@app.post("/agro/predict/stress", response_model=AIAnalysisResponse, tags=["Agro — Prediction"])
def a_stress(req: AgroStressReq):
    from agro_dept.prediction_api import predict_stress, StressRequest
    return predict_stress(StressRequest(**req.model_dump()))


@app.post("/agro/predict/disease", response_model=AIAnalysisResponse, tags=["Agro — Prediction"])
def a_disease(req: AgroDiseaseReq):
    from agro_dept.prediction_api import predict_disease, DiseaseRequest
    return predict_disease(DiseaseRequest(**req.model_dump()))


@app.post("/agro/predict/irrigation", response_model=AIAnalysisResponse, tags=["Agro — Prediction"])
def a_irrigation(req: AgroIrrigationReq):
    from agro_dept.prediction_api import predict_irrigation, IrrigationRequest
    return predict_irrigation(IrrigationRequest(**req.model_dump()))


@app.post("/agro/predict/crop_recommendation", response_model=AIAnalysisResponse, tags=["Agro — Prediction"])
def a_crop(req: AgroSuitabilityReq):
    from agro_dept.prediction_api import predict_crop, SuitabilityRequest
    return predict_crop(SuitabilityRequest(**req.model_dump()))


@app.post("/agro/predict/risk", response_model=AIAnalysisResponse, tags=["Agro — Prediction"])
def a_risk(req: AgroRiskReq):
    from agro_dept.prediction_api import predict_risk, RiskRequest
    return predict_risk(RiskRequest(**req.model_dump()))


@app.get("/agro/predict/district_bulletin", response_model=AIAnalysisResponse, tags=["Agro — Prediction"])
def a_bulletin(district: str=Query("chittoor"), crop: str=Query("Rice")):
    """All 6 agro models combined into one district advisory response."""
    from agro_dept.prediction_api import district_bulletin
    return district_bulletin(district=district, crop=crop)


# =============================================================================
# MODULE 3 — SMA  /sma/*
# =============================================================================

@app.post("/sma/community/post", tags=["SMA"])
def s_post(post: SmaPostReq):
    """Citizen post (text + image_url) → SentimentAnalysis + prisma_ready dict."""
    if not post.text and not post.image_url: raise HTTPException(400,"Need text or image_url")
    from social_media_analysis.image_pipeline import process_community_post
    pid=str(uuid4())
    return _sbr(process_community_post({"id":pid,"text":post.text,"image_url":post.image_url,
        "user_id":post.user_id,"platform":"community","timestamp":post.timestamp or datetime.utcnow().isoformat(),
        "latitude":post.latitude,"longitude":post.longitude,"location":post.location}))


@app.post("/sma/community/post/upload", tags=["SMA"])
async def s_post_upload(text: Optional[str]=Form(None), user_id: Optional[str]=Form(None), image: Optional[UploadFile]=File(None)):
    """Submit post with direct image file upload (multipart/form-data)."""
    if not text and not image: raise HTTPException(400,"Need text or image")
    from social_media_analysis.image_pipeline import process_community_post
    pid=str(uuid4()); img_bytes=await image.read() if image else None
    return _sbr(process_community_post({"id":pid,"text":text,"image_url":None,"image_bytes":img_bytes,
        "user_id":user_id,"platform":"community","timestamp":datetime.utcnow().isoformat()}))


@app.post("/sma/community/analyze/{post_id}", tags=["SMA"])
def s_analyze(post_id: str, req: SmaAnalyzeReq):
    """Analyze existing Prisma Post — returns prisma_ready for SentimentAnalysis INSERT."""
    if not req.text and not req.image_url: raise HTTPException(400,"Need text or image_url")
    from social_media_analysis.image_pipeline import process_community_post
    return _sbr(process_community_post({"id":post_id,"text":req.text,"image_url":req.image_url,
        "platform":"community","timestamp":datetime.utcnow().isoformat()}))


@app.get("/sma/community/post/{post_id}", tags=["SMA"])
def s_get_post(post_id: str):
    ss,_,_=_sdb(); sig=ss.find_one({"post_id":post_id},{"_id":0})
    if not sig: raise HTTPException(404,f"No analysis for {post_id}")
    sig["final_issue_prisma"]=_s2p(sig.get("final_issue","Other")); return sig


@app.get("/sma/community/feed", tags=["SMA"])
def s_feed(issue_type: Optional[str]=None, sentiment: Optional[str]=None,
           user_id: Optional[str]=None, limit: int=50, skip: int=0):
    """Filtered post feed. issue_type accepts display name or Prisma enum."""
    ss,_,_=_sdb(); q={"nlp_processed":True}
    if issue_type: q["final_issue"]=_p2s(issue_type) if issue_type==issue_type.upper() else issue_type
    if sentiment: q["sentiment.label"]=sentiment.lower()
    if user_id: q["user_id"]=user_id
    posts=list(ss.find(q,{"_id":0}).sort("processed_at",-1).skip(skip).limit(limit))
    for p in posts: p["final_issue_prisma"]=_s2p(p.get("final_issue","Other"))
    return {"total":len(posts),"posts":posts}


@app.get("/sma/community/trends", tags=["SMA"])
def s_trends():
    """Civic issue trends (1hr, 6hr, 24hr, by location)."""
    ss,_,tc=_sdb()
    from social_media_analysis.analysis import compute_trends
    latest=tc.find_one(sort=[("snapshot_at",-1)])
    if not latest:
        recent=list(ss.find({},{"text":1,"timestamp":1,"_id":0}).sort("processed_at",-1).limit(500))
        if not recent: raise HTTPException(404,"No trend data yet")
        return compute_trends(recent)
    latest.pop("_id",None); return latest


@app.get("/sma/community/locations", tags=["SMA"])
def s_locations(min_mentions: int=1):
    """Geocoded locations — maps to Post.latitude/longitude/locationName in Prisma."""
    _,lc,_=_sdb()
    locs=list(lc.find({"lat":{"$ne":None},"lng":{"$ne":None},"mention_count":{"$gte":min_mentions}},
                       {"_id":0,"name":1,"lat":1,"lng":1,"display_name":1,"mention_count":1,"state":1,"district":1}
                       ).sort("mention_count",-1))
    return {"total":len(locs),"locations":locs}


@app.get("/sma/community/signals", tags=["SMA"])
def s_signals(issue_type: Optional[str]=None, sentiment: Optional[str]=None,
              decided_by: Optional[str]=None, min_confidence: float=0.0, limit: int=50):
    """NLP signals for dashboard — fields match Prisma AIAnalysis model."""
    ss,_,_=_sdb(); q={"nlp_processed":True}
    if issue_type: q["final_issue"]=_p2s(issue_type) if issue_type==issue_type.upper() else issue_type
    if sentiment: q["sentiment.label"]=sentiment.lower()
    if decided_by: q["decided_by"]=decided_by
    if min_confidence: q["confidence"]={"$gte":min_confidence}
    sigs=list(ss.find(q,{"_id":0}).sort("processed_at",-1).limit(limit))
    for s in sigs: s["final_issue_prisma"]=_s2p(s.get("final_issue","Other"))
    return {"total":len(sigs),"signals":sigs}


@app.get("/sma/community/stats", tags=["SMA"])
def s_stats():
    """Category-wise counts + sentiment + IssuePriority enum values."""
    ss,_,_=_sdb()
    pipe=[{"$match":{"nlp_processed":True}},
          {"$group":{"_id":"$final_issue","count":{"$sum":1},
                     "negative":{"$sum":{"$cond":[{"$eq":["$sentiment.label","negative"]},1,0]}},
                     "neutral": {"$sum":{"$cond":[{"$eq":["$sentiment.label","neutral"]}, 1,0]}},
                     "positive":{"$sum":{"$cond":[{"$eq":["$sentiment.label","positive"]},1,0]}},
                     "avg_confidence":{"$avg":"$confidence"},"avg_priority":{"$avg":"$priority_score"}}},
          {"$sort":{"count":-1}}]
    stats=list(ss.aggregate(pipe))
    for s in stats:
        d=s.pop("_id") or "Other"; s["issue_type"]=d; s["issue_type_prisma"]=_s2p(d)
        s["avg_confidence"]=round(s.get("avg_confidence") or 0,3)
        s["avg_priority"]=round(s.get("avg_priority") or 0,3)
    return {"total_posts":sum(s["count"] for s in stats),"by_category":stats,
            "generated_at":datetime.utcnow().isoformat()}


@app.get("/sma/community/issues", tags=["SMA"])
def s_issues():
    """All IssueCategory enum values with display names. Use for frontend dropdowns."""
    return {"categories":[{"display":d,"prisma_enum":p} for d,p in _SMA_MAP.items()]}


@app.get("/sma/community/priority", tags=["SMA"])
def s_priority(min_priority: float=0.6, limit: int=20):
    """High-priority posts → maps to IssueReport.priority (IssuePriority enum) in Prisma."""
    ss,_,_=_sdb()
    posts=list(ss.find({"nlp_processed":True,"priority_score":{"$gte":min_priority}},{"_id":0}
                       ).sort("priority_score",-1).limit(limit))
    for p in posts:
        p["priority_enum"]=_spe(p.get("priority_score",0))
        p["final_issue_prisma"]=_s2p(p.get("final_issue","Other"))
    return {"total":len(posts),"posts":posts}


# =============================================================================
# MODULE 4 — DISEASE  /disease/*
# =============================================================================

@app.post("/disease/api/v1/citizen/report", tags=["Disease — Step 1"])
async def d_citizen(req: DiseaseCitizenReq, bg: BackgroundTasks):
    """Ingest citizen report → Kafka → extract symptoms → quick prediction."""
    svc=_disease(); district=req.district
    if req.lat and req.lng and not req.district:
        district=svc["ca"].lat_lng_to_district(req.lat,req.lng,svc["UP"]) or "Lucknow"
    rid=svc["pipe"].publish_citizen_report(district=district,text=req.text,
        lat=req.lat or 26.85,lng=req.lng or 80.95,citizen_id=req.citizen_id or "anon")
    extracted=svc["fe"].extract_symptoms_from_text(req.text)
    preds=svc["sc"].predict_from_symptoms(extracted,top_k=3)
    if preds: svc["ca"].ingest_community_prediction(disease=preds[0]["disease"],district=district,
        confidence=preds[0]["confidence"]/100,lat=req.lat,lng=req.lng)
    return {"report_id":rid,"district":district,"extracted_symptoms":extracted,
            "quick_prediction":preds[0] if preds else None,"kafka_topic":"citizen_reports"}


@app.post("/disease/api/v1/symptoms/extract", tags=["Disease — Step 2"])
async def d_extract(text: str):
    svc=_disease(); sym=svc["fe"].extract_symptoms_from_text(text); vec=svc["fe"].build_symptom_vector(sym)
    return {"input_text":text[:200],"extracted_symptoms":sym,"symptom_count":len(sym),"vector_size":len(vec)}


@app.get("/disease/api/v1/symptoms/list", tags=["Disease — Step 2"])
async def d_symlist():
    from disease_prediction.services.feature_engineering import ALL_SYMPTOMS
    return {"symptoms":ALL_SYMPTOMS,"count":len(ALL_SYMPTOMS)}


@app.post("/disease/api/v1/disease/predict", tags=["Disease — Step 3"])
async def d_predict(req: DiseaseSymptomPredictReq):
    """RF+GBM ensemble — 95.8% accuracy, 41 diseases."""
    svc=_disease()
    return {"input_symptoms":req.symptoms,"predictions":svc["sc"].predict_from_symptoms(req.symptoms,req.top_k),
            "model":"RF+GBM Ensemble (95.8%)","n_diseases":41}


@app.post("/disease/api/v1/disease/predict-from-text", tags=["Disease — Step 3"])
async def d_predict_text(text: str): return _disease()["sc"].predict_from_text(text)


@app.post("/disease/api/v1/cases/ingest", tags=["Disease — Step 4"])
async def d_ingest(req: DiseaseCaseIngestReq):
    svc=_disease(); svc["ca"].ingest_official_case(req.district,req.disease,req.cases,req.deaths,req.recoveries)
    svc["pipe"].publish_disease_cases(req.district,req.disease,req.cases,req.deaths,req.recoveries)
    return {"status":"ingested","district":req.district,"disease":req.disease}


@app.get("/disease/api/v1/cases/summary/{disease}", tags=["Disease — Step 4"])
async def d_summary(disease: str):
    svc=_disease(); df=svc["ca"].get_district_summary(svc["UP"],disease)
    return {"disease":disease,"districts":df.to_dict(orient="records")}


@app.post("/disease/api/v1/forecast", tags=["Disease — Step 5"])
async def d_forecast(req: DiseaseForecastReq):
    svc=_disease(); dist=_d_dist(svc,req.district); w=_d_weather(svc,dist)
    weekly=req.weeks_history or svc["ds"].generate_weekly_cases(req.district,req.disease)
    weekly[-1]=req.cases
    result=svc["of"].forecast(dist,req.disease,w,weekly,current_month=datetime.utcnow().month)
    svc["pipe"].publish_outbreak_prediction(result); return result


@app.get("/disease/api/v1/forecast/all/{disease}", tags=["Disease — Step 5"])
async def d_forecast_all(disease: str):
    svc=_disease(); wmap,cmap={},{}
    for d in svc["UP"]:
        w=_d_weather(svc,d); wmap[d["name"]]=w; cmap[d["name"]]=svc["ds"].generate_weekly_cases(d["name"],disease)
    return {"disease":disease,"district_forecasts":svc["of"].forecast_all_districts(svc["UP"],disease,wmap,cmap,current_month=datetime.utcnow().month)}


@app.get("/disease/api/v1/hotspots/{disease}", tags=["Disease — Step 6"])
async def d_hotspots(disease: str, min_cases: int=5):
    svc=_disease(); recs=_d_records(svc,disease)
    return {"disease":disease,"algorithm":"DBSCAN",
            "hotspot_result":svc["hd"].detect(recs,min_cases_threshold=min_cases),
            "heatmap_data":svc["hd"].build_heatmap_data(recs)}


@app.post("/disease/api/v1/seir/simulate", tags=["Disease — Step 6"])
async def d_seir(district: str="Lucknow", disease: str="Dengue", initial_infected: int=20,
                  days: int=90, intervention_day: Optional[int]=None):
    svc=_disease(); dist=_d_dist(svc,district); seir=svc["get_seir"](disease)
    sim=seir.simulate(dist["population"],initial_infected,days,intervention_day=intervention_day,intervention_reduction=0.5)
    return {"district":district,"disease":disease,"parameters":{"beta":seir.beta,"gamma":seir.gamma,"R0":seir.R0},
            "peak_info":seir.peak_info(sim),"simulation_day30":sim[min(30,len(sim)-1)],
            "simulation_day60":sim[min(60,len(sim)-1)],"full_simulation":sim}


@app.post("/disease/api/v1/seir/multi-district", tags=["Disease — Step 6"])
async def d_seir_multi(req: DiseaseMultiSEIRReq):
    svc=_disease(); seir=svc["get_seir"](req.disease)
    histories=seir.simulate_with_mobility(districts=svc["UP"],initial_infected_map=req.initial_infected,
                                           days=req.days,mobility_rate=req.mobility_rate)
    peaks={d:seir.peak_info(h) for d,h in histories.items()}
    return {"disease":req.disease,"days":req.days,"district_peaks":peaks,
            "most_affected":sorted(peaks.items(),key=lambda x:x[1]["peak_infected"],reverse=True)[:5]}


@app.post("/disease/api/v1/risk/score", tags=["Disease — Step 7"])
async def d_risk(district: str, disease: str, cases: int=15):
    svc=_disease(); dist=_d_dist(svc,district); w=_d_weather(svc,dist)
    weekly=svc["ds"].generate_weekly_cases(district,disease); weekly[-1]=cases
    forecast=svc["of"].forecast(dist,disease,w,weekly,current_month=datetime.utcnow().month)
    recs=_d_records(svc,disease); hotspot=svc["hd"].detect(recs)
    hospital=_d_hospital(svc,dist,forecast,disease); risk=_d_risk(svc,forecast,hotspot,hospital)
    return {"district":district,"disease":disease,"risk":risk,"forecast":forecast,"hospital_load":hospital,
            "hotspot_summary":{"n_clusters":hotspot["n_clusters"],"density":hotspot["hotspot_density"]}}


@app.post("/disease/api/v1/remedy/plan", tags=["Disease — Step 8+9"])
async def d_remedy(district: str, disease: str, cases: int=15, bg: BackgroundTasks=BackgroundTasks()):
    """Gemini AI remedy + government execution plan."""
    svc=_disease(); dist=_d_dist(svc,district); w=_d_weather(svc,dist)
    weekly=svc["ds"].generate_weekly_cases(district,disease); weekly[-1]=cases
    forecast=svc["of"].forecast(dist,disease,w,weekly,current_month=datetime.utcnow().month)
    hospital=_d_hospital(svc,dist,forecast,disease); recs=_d_records(svc,disease)
    hotspot=svc["hd"].detect(recs); risk=_d_risk(svc,forecast,hotspot,hospital)
    plan=svc["rp"].plan(district=district,disease=disease,risk_level=risk["risk_level"],
        risk_score=risk["risk_score"],weather=w,hospital_load=hospital,forecast=forecast,cases=cases)
    bg.add_task(svc["pipe"].publish_government_action,plan["execution_plan"])
    return {"district":district,"disease":disease,"risk":risk,"citizen_advice":plan["citizen_advice"],
            "first_line_treatment":plan["first_line_treatment"],"icd_code":plan["icd_code"],
            "execution_plan":plan["execution_plan"],"powered_by":plan["powered_by"]}


@app.get("/disease/api/v1/dashboard", tags=["Disease — Dashboard"])
async def d_dashboard(disease: str="Dengue"):
    """Government dashboard: district risk map, hospital capacity, outbreaks, alerts."""
    svc=_disease(); risk_map,alerts=[],[]
    for dist in svc["UP"]:
        w=_d_weather(svc,dist); weekly=svc["ds"].generate_weekly_cases(dist["name"],disease)
        forecast=svc["of"].forecast(dist,disease,w,weekly,current_month=datetime.utcnow().month)
        hospital=_d_hospital(svc,dist,forecast,disease)
        hs=svc["hd"].detect(svc["ca"].get_district_summary([dist],disease).to_dict(orient="records"),min_cases_threshold=1)
        risk=_d_risk(svc,forecast,hs,hospital)
        if forecast["outbreak_probability"]>svc["settings"].outbreak_prob_alert_threshold:
            alerts.append({"district":dist["name"],"disease":disease,
                           "outbreak_probability":forecast["outbreak_probability"],
                           "risk_level":risk["risk_level"],
                           "alert":f"⚠️ {disease} outbreak likely in {dist['name']}"})
        risk_map.append({"district":dist["name"],"lat":dist["lat"],"lng":dist["lng"],
                         "risk_level":risk["risk_level"],"risk_score":risk["risk_score"],
                         "outbreak_probability":forecast["outbreak_probability"],
                         "predicted_cases":forecast["projected_cases_next_week"],
                         "hospital_load_status":hospital["overload_status"]})
    recs=_d_records(svc,disease); hs_all=svc["hd"].detect(recs)
    risk_map.sort(key=lambda x:x["risk_score"],reverse=True)
    return {"generated_at":datetime.utcnow().isoformat(),"disease":disease,
            "summary":{"total_districts":len(svc["UP"]),"high_risk":[d for d in risk_map if d["risk_level"] in ("HIGH","CRITICAL")],
                       "alerts":len(alerts),"n_hotspot_clusters":hs_all["n_clusters"]},
            "district_risk_map":risk_map,"disease_heatmap":svc["hd"].build_heatmap_data(recs),
            "hotspot_clusters":hs_all["clusters"],"alerts":alerts}


@app.get("/disease/api/v1/mobility/{district}", tags=["Disease — Data"])
async def d_mobility(district: str):
    svc=_disease(); dist=_d_dist(svc,district)
    return {"district":district,"mobility":svc["fe"].fetch_mobility_data(dist["name"],dist["lat"],dist["lng"])}


@app.post("/disease/api/v1/pipeline/full", tags=["Disease — Full Pipeline"])
async def d_full(req: DiseaseFullPipelineReq):
    """🚀 Complete 9-step pipeline in one API call."""
    start=datetime.utcnow(); svc=_disease(); dist=_d_dist(svc,req.district)
    symptoms=req.symptoms or []
    if req.text:
        symptoms=list(set(symptoms+svc["fe"].extract_symptoms_from_text(req.text)))
    preds=svc["sc"].predict_from_symptoms(symptoms,top_k=5) if symptoms else []
    disease=req.disease or (preds[0]["disease"] if preds else "Dengue")
    weekly=svc["ds"].generate_weekly_cases(req.district,disease); weekly[-1]=req.cases
    w=_d_weather(svc,dist); forecast=svc["of"].forecast(dist,disease,w,weekly,current_month=start.month)
    seir=svc["get_seir"](disease); sim=seir.simulate(dist["population"],req.cases,days=60)
    recs=_d_records(svc,disease); hotspot=svc["hd"].detect(recs)
    hospital=_d_hospital(svc,dist,forecast,disease); risk=_d_risk(svc,forecast,hotspot,hospital)
    plan=svc["rp"].plan(district=req.district,disease=disease,risk_level=risk["risk_level"],
        risk_score=risk["risk_score"],weather=w,hospital_load=hospital,forecast=forecast,cases=req.cases)
    return {"pipeline_version":"2.0.0","elapsed_s":round((datetime.utcnow()-start).total_seconds(),2),
            "district":req.district,"disease":disease,"risk_level":risk["risk_level"],"risk_score":risk["risk_score"],
            "steps":{"step1":{"district":req.district},"step2":{"symptoms":symptoms,"count":len(symptoms)},
                     "step3":{"predictions":preds,"disease":disease},"step4":{"cases":req.cases},
                     "step5":forecast,"step6":{"hotspot":hotspot,"seir_peak":seir.peak_info(sim)},
                     "step7":{"risk":risk,"hospital":hospital},"step8_9":plan},
            "alert":plan["execution_plan"].get("public_alert_sms","")}


@app.get("/disease/api/v1/pipeline/schema", tags=["Disease — Full Pipeline"])
async def d_schema():
    return {"kafka_topics":_disease()["pipe"].get_schemas(),
            "data_flow":["citizen_reports→symptom_detection","symptom_detection→disease_cases",
                         "weather+cases→feature_store","feature_store→outbreak_forecast",
                         "outbreak→hotspot+risk","risk→remedy","remedy→government_actions"]}


@app.get("/disease/api/v1/districts", tags=["Disease — Reference"])
async def d_districts(): return {"districts":_disease()["UP"]}


@app.get("/disease/api/v1/diseases", tags=["Disease — Reference"])
async def d_diseases():
    from disease_prediction.config.settings import DISEASE_SYMPTOMS_KB
    return {"diseases":sorted(DISEASE_SYMPTOMS_KB.keys()),"count":len(DISEASE_SYMPTOMS_KB)}


@app.get("/disease/api/v1/weather/{district}", tags=["Disease — Reference"])
async def d_weather(district: str):
    svc=_disease(); dist=_d_dist(svc,district); w=_d_weather(svc,dist)
    return {"district":district,"weather":w}


@app.get("/disease/api/v1/feature-store/{district}", tags=["Disease — Reference"])
async def d_features(district: str, disease: str="Dengue"):
    svc=_disease(); dist=_d_dist(svc,district); weekly=svc["ds"].generate_weekly_cases(district,disease)
    return {"district":district,"disease":disease,"features":svc["fe"].build_district_feature_store(dist,disease,weekly)}


# =============================================================================
# ENTRYPOINT
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("unified_api:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
