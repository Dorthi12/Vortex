"""
app.py
======
FastAPI backend for NETRAVAAH community platform.

Endpoints:
    POST /community/post           - submit post with text
    POST /community/post/upload    - submit post with image file upload
    GET  /community/feed           - get all posts
    GET  /community/trends         - trending civic issues
    GET  /community/locations      - geocoded locations for heatmap
    GET  /community/signals        - filtered signals feed
    GET  /community/stats          - category wise counts
    GET  /health                   - health check
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from image_pipeline import process_community_post
from analysis import compute_trends, _social_signals, _locations_col, _trends_col
from datetime import datetime
from pymongo import MongoClient
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="NETRAVAAH Community Platform",
    description="AI powered civic issue detection from community posts",
    version="1.0.0",
)

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------
# Request Models
# -------------------------------------------------

class CommunityPost(BaseModel):
    text:      Optional[str] = None
    image_url: Optional[str] = None
    user_id:   Optional[str] = None
    location:  Optional[str] = None
    timestamp: Optional[str] = None


# -------------------------------------------------
# Endpoints
# -------------------------------------------------

@app.get("/")
def root():
    return {
        "project": "NETRAVAAH",
        "module":  "Community Platform",
        "status":  "running",
    }


@app.post("/community/post")
def submit_post(post: CommunityPost):
    """Citizen submits a post with text and/or image URL.

    Runs full NLP and image analysis automatically.
    Saves result to MongoDB.
    """
    if not post.text and not post.image_url:
        raise HTTPException(
            status_code=400,
            detail="Post must have either text or image_url",
        )

    post_id = str(uuid.uuid4())

    result = process_community_post({
        "id":        post_id,
        "text":      post.text,
        "image_url": post.image_url,
        "user_id":   post.user_id,
        "platform":  "community",
        "timestamp": post.timestamp or datetime.utcnow().isoformat(),
    })

    return {
        "success":     True,
        "post_id":     result["post_id"],
        "final_issue": result["final_issue"],
        "confidence":  result["confidence"],
        "decided_by":  result["decided_by"],
        "sentiment":   result["sentiment"],
        "locations":   result["locations"],
        "processed_at":result["processed_at"],
    }


@app.post("/community/post/upload")
async def submit_post_with_image(
    text:      Optional[str]        = Form(None),
    user_id:   Optional[str]        = Form(None),
    image:     Optional[UploadFile] = File(None),
):
    """Citizen submits a post with a directly uploaded image file.

    Used when citizen uploads photo from their phone.
    Accepts multipart form data.
    """
    if not text and not image:
        raise HTTPException(
            status_code=400,
            detail="Post must have either text or image",
        )

    post_id    = str(uuid.uuid4())
    image_bytes = None

    if image:
        image_bytes = await image.read()

    # Build post dict
    post_data = {
        "id":          post_id,
        "text":        text,
        "image_url":   None,
        "image_bytes": image_bytes,
        "user_id":     user_id,
        "platform":    "community",
        "timestamp":   datetime.utcnow().isoformat(),
    }

    result = process_community_post(post_data)

    return {
        "success":     True,
        "post_id":     result["post_id"],
        "final_issue": result["final_issue"],
        "confidence":  result["confidence"],
        "decided_by":  result["decided_by"],
        "sentiment":   result["sentiment"],
        "locations":   result["locations"],
        "processed_at":result["processed_at"],
    }


@app.get("/community/feed")
def get_feed(
    issue_type: Optional[str] = None,
    sentiment:  Optional[str] = None,
    user_id:    Optional[str] = None,
    limit:      int           = 50,
    skip:       int           = 0,
):
    """Get community posts feed with optional filters.

    Filters:
        issue_type - Water Supply, Road Damage, Electricity etc.
        sentiment  - positive, negative, neutral
        user_id    - filter by specific citizen
        limit      - number of posts (default 50)
        skip       - for pagination
    """
    query = {"nlp_processed": True}

    if issue_type:
        query["final_issue"] = issue_type
    if sentiment:
        query["sentiment.label"] = sentiment
    if user_id:
        query["user_id"] = user_id

    posts = list(
        _social_signals.find(query, {"_id": 0})
        .sort("processed_at", -1)
        .skip(skip)
        .limit(limit)
    )

    return {
        "total": len(posts),
        "posts": posts,
    }


@app.get("/community/trends")
def get_trends():
    """Get latest civic issue trends.

    Shows issue frequency by 1hr, 6hr, 24hr and by location.
    Used for leadership dashboard.
    """
    latest = _trends_col.find_one(sort=[("snapshot_at", -1)])

    if not latest:
        recent_signals = list(
            _social_signals.find(
                {},
                {"text": 1, "timestamp": 1, "_id": 0}
            ).sort("processed_at", -1).limit(500)
        )
        if not recent_signals:
            raise HTTPException(
                status_code=404,
                detail="No trend data yet. Submit some posts first.",
            )
        return compute_trends(recent_signals)

    latest.pop("_id", None)
    return latest


@app.get("/community/locations")
def get_locations(min_mentions: int = 1):
    """Get all geocoded locations with lat/lng.

    Used by teammate for geo heatmap feature.
    """
    locations = list(
        _locations_col.find(
            {
                "lat": {"$ne": None},
                "lng": {"$ne": None},
                "mention_count": {"$gte": min_mentions},
            },
            {
                "_id":          0,
                "name":         1,
                "lat":          1,
                "lng":          1,
                "display_name": 1,
                "mention_count":1,
                "platforms":    1,
            },
        ).sort("mention_count", -1)
    )

    return {
        "total":     len(locations),
        "locations": locations,
    }


@app.get("/community/signals")
def get_signals(
    issue_type: Optional[str] = None,
    sentiment:  Optional[str] = None,
    decided_by: Optional[str] = None,
    limit:      int           = 50,
):
    """Get processed signals for dashboard team."""
    query = {"nlp_processed": True}

    if issue_type:
        query["final_issue"] = issue_type
    if sentiment:
        query["sentiment.label"] = sentiment
    if decided_by:
        query["decided_by"] = decided_by

    signals = list(
        _social_signals.find(query, {"_id": 0})
        .sort("processed_at", -1)
        .limit(limit)
    )

    return {
        "total":   len(signals),
        "signals": signals,
    }


@app.get("/community/stats")
def get_stats():
    """Get category wise post counts and sentiment breakdown.

    Used for dashboard summary cards.
    """
    pipeline_stages = [
        {"$match": {"nlp_processed": True}},
        {"$group": {
            "_id":      "$final_issue",
            "count":    {"$sum": 1},
            "negative": {"$sum": {"$cond": [{"$eq": ["$sentiment.label", "negative"]}, 1, 0]}},
            "neutral":  {"$sum": {"$cond": [{"$eq": ["$sentiment.label", "neutral"]}, 1, 0]}},
            "positive": {"$sum": {"$cond": [{"$eq": ["$sentiment.label", "positive"]}, 1, 0]}},
        }},
        {"$sort": {"count": -1}},
    ]

    stats = list(_social_signals.aggregate(pipeline_stages))
    for s in stats:
        s["issue_type"] = s.pop("_id")

    total_posts = sum(s["count"] for s in stats)

    return {
        "total_posts":  total_posts,
        "by_category":  stats,
        "generated_at": datetime.utcnow().isoformat(),
    }


@app.get("/health")
def health_check():
    """Check if service and MongoDB are running."""
    try:
        _social_signals.find_one()
        db_status = "connected"
    except Exception:
        db_status = "disconnected"

    return {
        "status":    "ok",
        "database":  db_status,
        "timestamp": datetime.utcnow().isoformat(),
    }


# -------------------------------------------------
# Run
# -------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
