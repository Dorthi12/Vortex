"""
app.py - NETRAVAAH Social Media Analysis FastAPI
Routes aligned with Prisma schema.prisma
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from image_pipeline import process_community_post
from analysis import compute_trends, _social_signals, _locations_col, _trends_col
from datetime import datetime
from pymongo import MongoClient
import uuid, os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="NETRAVAAH Social Media Analysis",
    description="AI powered civic issue detection for NETRAVAAH",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# IssueCategory enum mapping (matches schema.prisma)
# --------------------------------------------------

ISSUE_CATEGORIES = {
    "Water Supply":        "WATER_SUPPLY",
    "Road Damage":         "ROAD_DAMAGE",
    "Electricity":         "ELECTRICITY",
    "Street Lights":       "STREET_LIGHTS",
    "Drainage and Sewage": "DRAINAGE_AND_SEWAGE",
    "Flooding":            "FLOODING",
    "Garbage Collection":  "GARBAGE_COLLECTION",
    "Public Toilets":      "PUBLIC_TOILETS",
    "Healthcare":          "HEALTHCARE",
    "Education":           "EDUCATION",
    "Public Safety":       "PUBLIC_SAFETY",
    "Public Transport":    "PUBLIC_TRANSPORT",
    "Air Pollution":       "AIR_POLLUTION",
    "Water Pollution":     "WATER_POLLUTION",
    "Corruption":          "CORRUPTION",
    "Government Schemes":  "GOVERNMENT_SCHEMES",
    "Agriculture":         "AGRICULTURE",
    "Other":               "OTHERS",
}

REVERSE_ISSUE_MAP = {v: k for k, v in ISSUE_CATEGORIES.items()}

def to_prisma_issue(issue: str) -> str:
    return ISSUE_CATEGORIES.get(issue, "OTHERS")

def to_display_issue(prisma_enum: str) -> str:
    return REVERSE_ISSUE_MAP.get(prisma_enum, "Other")

# --------------------------------------------------
# IssuePriority enum (matches schema.prisma)
# --------------------------------------------------

HIGH_PRIORITY_ISSUES   = {"FLOODING","PUBLIC_SAFETY","HEALTHCARE","WATER_SUPPLY","ELECTRICITY","AIR_POLLUTION"}
MEDIUM_PRIORITY_ISSUES = {"ROAD_DAMAGE","DRAINAGE_AND_SEWAGE","GARBAGE_COLLECTION","WATER_POLLUTION","PUBLIC_TRANSPORT"}

def compute_priority_score(confidence: float, sentiment_score: float, issue_type: str) -> float:
    prisma = to_prisma_issue(issue_type)
    weight = 1.0 if prisma in HIGH_PRIORITY_ISSUES else 0.85 if prisma in MEDIUM_PRIORITY_ISSUES else 0.70
    return round(min((confidence * 0.6 + (sentiment_score or 0.5) * 0.4) * weight, 1.0), 3)

def score_to_priority_enum(score: float) -> str:
    if score >= 0.8: return "CRITICAL"
    if score >= 0.6: return "HIGH"
    if score >= 0.4: return "MEDIUM"
    return "LOW"

# --------------------------------------------------
# Request Models (matching Prisma Post fields)
# --------------------------------------------------

class CommunityPostRequest(BaseModel):
    text:      Optional[str]   = None
    image_url: Optional[str]   = None
    user_id:   Optional[str]   = None    # -> Post.authorId
    location:  Optional[str]   = None    # -> Post.locationName
    latitude:  Optional[float] = None    # -> Post.latitude
    longitude: Optional[float] = None    # -> Post.longitude
    timestamp: Optional[str]   = None

class AnalyzeExistingPost(BaseModel):
    post_id:   str
    text:      Optional[str] = None
    image_url: Optional[str] = None

# --------------------------------------------------
# Helper
# --------------------------------------------------

def _build_response(result: dict) -> dict:
    sentiment       = result.get("sentiment", {})
    sentiment_score = sentiment.get("score", 0.0)
    final_issue     = result.get("final_issue", "Other")
    confidence      = result.get("confidence", 0.0)
    priority        = compute_priority_score(confidence, sentiment_score, final_issue)

    return {
        "post_id":             result["post_id"],
        "final_issue":         to_prisma_issue(final_issue),
        "final_issue_display": final_issue,
        "confidence":          confidence,
        "decided_by":          result.get("decided_by"),
        "sentiment_label":     sentiment.get("label"),
        "sentiment_score":     sentiment_score,
        "priority_score":      priority,
        "priority_enum":       score_to_priority_enum(priority),
        "locations":           result.get("locations", []),
        "text_analysis":       result.get("text_analysis"),
        "image_analysis":      result.get("image_analysis"),
        "processed_at":        result.get("processed_at"),
        "nlp_processed":       True,
        # Prisma-ready dict for Node.js to save into SentimentAnalysis table
        "prisma_ready": {
            "finalIssue":     to_prisma_issue(final_issue),
            "confidence":     confidence,
            "decidedBy":      result.get("decided_by"),
            "sentimentLabel": sentiment.get("label"),
            "sentimentScore": sentiment_score,
            "priorityScore":  priority,
            "locations":      result.get("locations", []),
            "textAnalysis":   result.get("text_analysis"),
            "imageAnalysis":  result.get("image_analysis"),
            "processedAt":    result.get("processed_at"),
            "nlpProcessed":   True,
        }
    }

# --------------------------------------------------
# Endpoints
# --------------------------------------------------

@app.get("/")
def root():
    return {"project": "NETRAVAAH", "module": "Social Media Analysis", "status": "running"}


@app.post("/community/post")
def submit_post(post: CommunityPostRequest):
    """
    Citizen submits post with text and/or image URL.
    Returns SentimentAnalysis fields ready for Prisma.
    """
    if not post.text and not post.image_url:
        raise HTTPException(status_code=400, detail="Post must have text or image_url")

    post_id = str(uuid.uuid4())
    result  = process_community_post({
        "id":        post_id,
        "text":      post.text,
        "image_url": post.image_url,
        "user_id":   post.user_id,
        "platform":  "community",
        "timestamp": post.timestamp or datetime.utcnow().isoformat(),
        "latitude":  post.latitude,
        "longitude": post.longitude,
        "location":  post.location,
    })
    return _build_response(result)


@app.post("/community/post/upload")
async def submit_post_with_image(
    text:    Optional[str]        = Form(None),
    user_id: Optional[str]        = Form(None),
    image:   Optional[UploadFile] = File(None),
):
    """
    Citizen submits post with direct image file upload.
    Accepts multipart form data (phone photo upload).
    """
    if not text and not image:
        raise HTTPException(status_code=400, detail="Post must have text or image")

    post_id     = str(uuid.uuid4())
    image_bytes = await image.read() if image else None

    result = process_community_post({
        "id":          post_id,
        "text":        text,
        "image_url":   None,
        "image_bytes": image_bytes,
        "user_id":     user_id,
        "platform":    "community",
        "timestamp":   datetime.utcnow().isoformat(),
    })
    return _build_response(result)


@app.post("/community/analyze/{post_id}")
def analyze_existing_post(post_id: str, request: AnalyzeExistingPost):
    """
    Analyze a post already created in Prisma/PostgreSQL.
    Called by Node.js backend after creating a Post record.
    Returns prisma_ready dict for Node.js to save into SentimentAnalysis.
    """
    if not request.text and not request.image_url:
        raise HTTPException(status_code=400, detail="Must provide text or image_url")

    result = process_community_post({
        "id":        post_id,
        "text":      request.text,
        "image_url": request.image_url,
        "platform":  "community",
        "timestamp": datetime.utcnow().isoformat(),
    })
    return _build_response(result)


@app.get("/community/post/{post_id}")
def get_post_analysis(post_id: str):
    """
    Get NLP analysis for a specific post.
    Used by Node.js to fetch analysis for a Prisma Post.
    """
    signal = _social_signals.find_one({"post_id": post_id}, {"_id": 0})
    if not signal:
        raise HTTPException(status_code=404, detail=f"No analysis found for post_id: {post_id}")
    signal["final_issue_prisma"] = to_prisma_issue(signal.get("final_issue", "Other"))
    return signal


@app.get("/community/feed")
def get_feed(
    issue_type: Optional[str] = None,
    sentiment:  Optional[str] = None,
    user_id:    Optional[str] = None,
    limit:      int           = 50,
    skip:       int           = 0,
):
    """
    Get community posts feed with optional filters.
    issue_type accepts display name ("Road Damage") or Prisma enum ("ROAD_DAMAGE").
    """
    query = {"nlp_processed": True}
    if issue_type:
        query["final_issue"] = to_display_issue(issue_type) if issue_type == issue_type.upper() else issue_type
    if sentiment:
        query["sentiment.label"] = sentiment.lower()
    if user_id:
        query["user_id"] = user_id

    posts = list(_social_signals.find(query, {"_id": 0}).sort("processed_at", -1).skip(skip).limit(limit))
    for p in posts:
        p["final_issue_prisma"] = to_prisma_issue(p.get("final_issue", "Other"))
    return {"total": len(posts), "posts": posts}


@app.get("/community/trends")
def get_trends():
    """
    Latest civic issue trends (1hr, 6hr, 24hr, by location).
    Used for leadership dashboard.
    """
    latest = _trends_col.find_one(sort=[("snapshot_at", -1)])
    if not latest:
        recent = list(_social_signals.find({}, {"text": 1, "timestamp": 1, "_id": 0}).sort("processed_at", -1).limit(500))
        if not recent:
            raise HTTPException(status_code=404, detail="No trend data yet.")
        return compute_trends(recent)
    latest.pop("_id", None)
    return latest


@app.get("/community/locations")
def get_locations(min_mentions: int = 1):
    """
    Geocoded locations with lat/lng and mention counts.
    Maps to Post.latitude, Post.longitude, Post.locationName in Prisma.
    Used by heatmap teammate.
    """
    locations = list(
        _locations_col.find(
            {"lat": {"$ne": None}, "lng": {"$ne": None}, "mention_count": {"$gte": min_mentions}},
            {"_id": 0, "name": 1, "lat": 1, "lng": 1, "display_name": 1, "mention_count": 1, "platforms": 1, "state": 1, "district": 1},
        ).sort("mention_count", -1)
    )
    return {"total": len(locations), "locations": locations}


@app.get("/community/signals")
def get_signals(
    issue_type:     Optional[str] = None,
    sentiment:      Optional[str] = None,
    decided_by:     Optional[str] = None,
    min_confidence: float         = 0.0,
    limit:          int           = 50,
):
    """
    Processed NLP signals for dashboard team.
    Returns data matching Prisma AIAnalysis model fields.
    """
    query = {"nlp_processed": True}
    if issue_type:
        query["final_issue"] = to_display_issue(issue_type) if issue_type == issue_type.upper() else issue_type
    if sentiment:
        query["sentiment.label"] = sentiment.lower()
    if decided_by:
        query["decided_by"] = decided_by
    if min_confidence > 0:
        query["confidence"] = {"$gte": min_confidence}

    signals = list(_social_signals.find(query, {"_id": 0}).sort("processed_at", -1).limit(limit))
    for s in signals:
        s["final_issue_prisma"] = to_prisma_issue(s.get("final_issue", "Other"))
    return {"total": len(signals), "signals": signals}


@app.get("/community/stats")
def get_stats():
    """
    Category wise post counts and sentiment breakdown.
    Includes Prisma IssueCategory enum values.
    Used for dashboard summary cards.
    """
    pipeline = [
        {"$match": {"nlp_processed": True}},
        {"$group": {
            "_id":            "$final_issue",
            "count":          {"$sum": 1},
            "negative":       {"$sum": {"$cond": [{"$eq": ["$sentiment.label", "negative"]}, 1, 0]}},
            "neutral":        {"$sum": {"$cond": [{"$eq": ["$sentiment.label", "neutral"]},  1, 0]}},
            "positive":       {"$sum": {"$cond": [{"$eq": ["$sentiment.label", "positive"]}, 1, 0]}},
            "avg_confidence": {"$avg": "$confidence"},
            "avg_priority":   {"$avg": "$priority_score"},
        }},
        {"$sort": {"count": -1}},
    ]
    stats = list(_social_signals.aggregate(pipeline))
    for s in stats:
        display                = s.pop("_id") or "Other"
        s["issue_type"]        = display
        s["issue_type_prisma"] = to_prisma_issue(display)
        s["avg_confidence"]    = round(s.get("avg_confidence") or 0, 3)
        s["avg_priority"]      = round(s.get("avg_priority") or 0, 3)
    return {"total_posts": sum(s["count"] for s in stats), "by_category": stats, "generated_at": datetime.utcnow().isoformat()}


@app.get("/community/issues")
def get_issue_categories():
    """
    All issue categories with Prisma enum values.
    Matches IssueCategory enum in schema.prisma exactly.
    Used by frontend dropdowns.
    """
    return {"categories": [{"display": d, "prisma_enum": p} for d, p in ISSUE_CATEGORIES.items()]}


@app.get("/community/priority")
def get_high_priority_posts(min_priority: float = 0.6, limit: int = 20):
    """
    High priority posts for government action dashboard.
    Maps to IssueReport.priority (IssuePriority enum) in Prisma.
        CRITICAL >= 0.8
        HIGH     >= 0.6
        MEDIUM   >= 0.4
        LOW       < 0.4
    """
    posts = list(
        _social_signals.find(
            {"nlp_processed": True, "priority_score": {"$gte": min_priority}},
            {"_id": 0}
        ).sort("priority_score", -1).limit(limit)
    )
    for p in posts:
        p["priority_enum"]      = score_to_priority_enum(p.get("priority_score", 0))
        p["final_issue_prisma"] = to_prisma_issue(p.get("final_issue", "Other"))
    return {"total": len(posts), "posts": posts}


@app.get("/health")
def health_check():
    """Health check for service and MongoDB."""
    try:
        _social_signals.find_one()
        db_status = "connected"
    except Exception:
        db_status = "disconnected"
    return {"status": "ok", "database": db_status, "timestamp": datetime.utcnow().isoformat(), "module": "social_media_analysis"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
