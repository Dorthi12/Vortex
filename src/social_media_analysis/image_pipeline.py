"""
image_pipeline.py
=================
Combines text NLP and image classification into one unified pipeline.

When a citizen posts on the community platform with text and/or image,
this pipeline runs both models and picks the most confident result.
"""

from analysis import analyze_post, detect_issue, extract_locations, save_location_signal
from image_classifier import CivicImageClassifier
from pymongo import MongoClient
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

_mongo_client   = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/"))
_db             = _mongo_client["netravaah"]
_social_signals = _db["social_signals"]

# Load image classifier once at startup
_image_clf = None

def get_image_classifier():
    """Lazy load image classifier - only loads when first needed."""
    global _image_clf
    if _image_clf is None:
        try:
            _image_clf = CivicImageClassifier()
        except FileNotFoundError:
            print("Image model not found. Only text analysis will be used.")
            print("Run train_image_model.py to enable image classification.")
    return _image_clf


# -------------------------------------------------
# Main Pipeline
# -------------------------------------------------

def process_community_post(post: dict) -> dict:
    """Full pipeline for a community post with text and/or image.

    Steps:
    1. Run NLP on text
    2. Run image classification if image present
       Accepts image_url (URL) or image_bytes (direct upload)
    3. Combine results - higher confidence wins
    4. Save to MongoDB
    5. Return unified result

    Args:
        post: dict with keys:
            id           - unique post id
            text         - post caption or complaint text (optional)
            image_url    - URL to image (optional)
            image_bytes  - raw image bytes from direct upload (optional)
            platform     - always community for this project
            timestamp    - ISO format timestamp
            user_id      - citizen user id
    """
    post_id     = str(post.get("id", ""))
    platform    = post.get("platform", "community")
    text        = post.get("text", "") or ""
    image_url   = post.get("image_url")
    image_bytes = post.get("image_bytes")

    result = {
        "post_id":        post_id,
        "user_id":        post.get("user_id", ""),
        "platform":       platform,
        "text":           text,
        "image_url":      image_url,
        "timestamp":      post.get("timestamp", datetime.utcnow().isoformat()),
        "text_analysis":  None,
        "image_analysis": None,
        "final_issue":    "Other",
        "confidence":     0.0,
        "decided_by":     "none",
        "sentiment":      {"label": "neutral", "score": 0.0},
        "locations":      [],
        "processed_at":   datetime.utcnow().isoformat(),
        "nlp_processed":  True,
    }

    # Step 1 - Text Analysis
    if text.strip():
        text_result = analyze_post({
            "id":        post_id,
            "text":      text,
            "platform":  platform,
            "timestamp": post.get("timestamp"),
        })
        result["text_analysis"] = {
            "issue":     text_result["issue"],
            "sentiment": text_result["sentiment"],
            "locations": text_result["locations"],
        }
        result["sentiment"] = text_result["sentiment"]
        result["locations"] = text_result["locations"]
        print(f"Text: {text_result['issue']['issue_type']} ({text_result['issue']['confidence']})")

    # Step 2 - Image Analysis
    # Handles both URL and direct upload bytes
    if image_url or image_bytes:
        clf = get_image_classifier()
        if clf is not None:
            if image_bytes:
                image_result = clf.classify_from_bytes(image_bytes)
            else:
                image_result = clf.classify_from_url(image_url)

            result["image_analysis"] = image_result
            print(f"Image: {image_result['issue_type']} ({image_result['confidence']})")
        else:
            result["image_analysis"] = {
                "issue_type": "Unknown",
                "confidence": 0.0,
                "reliable":   False,
            }

    # Step 3 - Combine Results
    text_confidence  = 0.0
    image_confidence = 0.0
    text_issue       = "Other"
    image_issue      = "Other"

    if result["text_analysis"]:
        text_confidence = result["text_analysis"]["issue"].get("confidence", 0.0)
        text_issue      = result["text_analysis"]["issue"].get("issue_type", "Other")

    if result["image_analysis"]:
        image_confidence = result["image_analysis"].get("confidence", 0.0)
        image_issue      = result["image_analysis"].get("issue_type", "Other")

    if image_confidence >= text_confidence and image_confidence > 0.3:
        result["final_issue"] = image_issue
        result["confidence"]  = image_confidence
        result["decided_by"]  = "image"
    elif text_confidence > 0.3:
        result["final_issue"] = text_issue
        result["confidence"]  = text_confidence
        result["decided_by"]  = "text"
    elif text_issue != "Other":
        result["final_issue"] = text_issue
        result["confidence"]  = text_confidence
        result["decided_by"]  = "text_fallback"
    else:
        result["final_issue"] = "Other"
        result["confidence"]  = 0.0
        result["decided_by"]  = "none"

    print(f"Final: {result['final_issue']} (by {result['decided_by']})")

    # Step 4 - Save to MongoDB
    _social_signals.update_one(
        {"post_id": post_id},
        {"$set": result},
        upsert=True,
    )

    return result


# -------------------------------------------------
# Test
# -------------------------------------------------

if __name__ == "__main__":
    test_posts = [
        {
            "id":        "test_001",
            "text":      "Sadak bilkul toot gayi hai hamare mohalle mein Delhi",
            "image_url": None,
            "platform":  "community",
            "user_id":   "user_123",
            "timestamp": datetime.utcnow().isoformat(),
        },
        {
            "id":        "test_002",
            "text":      "Kachra nahi utha pichle 2 hafte se Andheri Mumbai mein",
            "image_url": None,
            "platform":  "community",
            "user_id":   "user_456",
            "timestamp": datetime.utcnow().isoformat(),
        },
    ]

    for post in test_posts:
        print(f"\nTesting: {post['text'][:50]}")
        result = process_community_post(post)
        print(f"Final issue : {result['final_issue']}")
        print(f"Confidence  : {result['confidence']}")
        print(f"Decided by  : {result['decided_by']}")
        print(f"Sentiment   : {result['sentiment']['label']}")
        print(f"Locations   : {[l['name'] for l in result['locations']]}")
