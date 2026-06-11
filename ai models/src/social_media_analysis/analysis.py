"""
analysis.py
===========
Core NLP pipeline for the NETRAVAAH community platform.

Handles:
- Sentiment analysis (multilingual - Hindi + English)
- Issue detection using trained BERT model
- Falls back to zero-shot if trained model not found
- Location extraction with geocoding to lat/lng
- OCR from images
- Trend detection with time windows
- MongoDB storage
"""

from transformers import pipeline, BertTokenizer
import torch
import spacy
from collections import Counter
import requests
from PIL import Image
import pytesseract
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
import time
import pandas as pd
from pathlib import Path
from datetime import datetime, timedelta
from pymongo import MongoClient
import json
import os
from dotenv import load_dotenv

load_dotenv()

# -------------------------------------------------
# MongoDB Setup
# -------------------------------------------------

_mongo_client   = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/"))
_db             = _mongo_client["netravaah"]
_locations_col  = _db["locations"]
_social_signals = _db["social_signals"]
_trends_col     = _db["trends"]

# -------------------------------------------------
# Issue Categories
# -------------------------------------------------

ISSUE_CATEGORIES = [
    "Water Supply",
    "Road Damage",
    "Electricity",
    "Street Lights",
    "Drainage and Sewage",
    "Flooding",
    "Garbage Collection",
    "Public Toilets",
    "Healthcare",
    "Education",
    "Public Safety",
    "Public Transport",
    "Air Pollution",
    "Water Pollution",
    "Corruption",
    "Government Schemes",
    "Agriculture",
    "Other",
]

SENTIMENT_LABELS = ["negative", "neutral", "positive"]

# -------------------------------------------------
# Load Local Locations CSV
# -------------------------------------------------

_LOCAL_LOCATIONS = {}

def _load_local_locations():
    """Load locations_india.csv into memory for fast offline lookup."""
    global _LOCAL_LOCATIONS

    possible_paths = [
        Path("data/locations_india.csv"),
        Path("../../data/locations_india.csv"),
        Path("../data/locations_india.csv"),
        Path("../../../data/locations_india.csv"),
    ]

    for path in possible_paths:
        if path.exists():
            df = pd.read_csv(path)
            for _, row in df.iterrows():
                key = row["location_name"].lower().strip()
                _LOCAL_LOCATIONS[key] = {
                    "name":         row["location_name"],
                    "lat":          float(row["latitude"]),
                    "lng":          float(row["longitude"]),
                    "state":        row["state"],
                    "district":     row["district"],
                    "display_name": f"{row['location_name']}, {row['district']}, {row['state']}, India",
                    "source":       "local_csv",
                }
            print(f"Loaded {len(_LOCAL_LOCATIONS)} locations from {path}")
            return

    print("Warning: locations_india.csv not found. Will use Nominatim API only.")

_load_local_locations()

# -------------------------------------------------
# Model Loading
# -------------------------------------------------

_device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Device: {_device}")

# -- Sentiment Model (always use multilingual BERT) --
print("Loading sentiment model...")
_sentiment_pipeline = pipeline(
    "sentiment-analysis",
    model="nlptown/bert-base-multilingual-uncased-sentiment",
    truncation=True,
    max_length=512,
    device=0 if _device == "cuda" else -1,
)
print("Sentiment model loaded.")

# -- Issue Detection Model --
# Try to load trained BERT model first
# Fall back to zero-shot if not found

_trained_model    = None
_trained_tokenizer = None
_zero_shot_pipeline = None
_label_map        = None

def _load_trained_model():
    """Load trained BERT multitask model from models/multitask/"""
    global _trained_model, _trained_tokenizer, _label_map

    model_dir = Path("models/multitask")
    weights_path  = model_dir / "best_model.pt"
    metadata_path = model_dir / "metadata.json"

    if not weights_path.exists() or not metadata_path.exists():
        return False

    try:
        from model import MultiTaskBERT

        with open(metadata_path) as f:
            metadata = json.load(f)

        _label_map = metadata.get("label_map", {str(i): cat for i, cat in enumerate(ISSUE_CATEGORIES)})

        model_name = metadata.get("model_name", "bert-base-multilingual-cased")
        num_issues = metadata.get("num_issue_labels", len(ISSUE_CATEGORIES))
        num_sentiments = metadata.get("num_sentiment_labels", 3)

        _trained_tokenizer = BertTokenizer.from_pretrained(model_name)

        _trained_model = MultiTaskBERT(
            model_name=model_name,
            num_issue_labels=num_issues,
            num_sentiment_labels=num_sentiments,
        )
        _trained_model.load_state_dict(
            torch.load(weights_path, map_location=_device)
        )
        _trained_model.to(_device)
        _trained_model.eval()

        print("Trained BERT model loaded from models/multitask/")
        return True

    except Exception as e:
        print(f"Could not load trained model: {e}")
        return False


def _load_zero_shot():
    """Load zero-shot classifier as fallback."""
    global _zero_shot_pipeline
    print("Loading zero-shot classifier as fallback...")
    _zero_shot_pipeline = pipeline(
        "zero-shot-classification",
        model="facebook/bart-large-mnli",
        device=0 if _device == "cuda" else -1,
    )
    print("Zero-shot classifier loaded.")


# Try trained model first, fall back to zero-shot
if not _load_trained_model():
    print("Trained model not found. Using zero-shot classifier.")
    _load_zero_shot()

# -- spaCy for NER --
print("Loading spaCy...")
try:
    _nlp = spacy.load("en_core_web_sm")
except OSError:
    raise OSError("Run: python -m spacy download en_core_web_sm")

_geolocator = Nominatim(user_agent="netravaah_civic_platform")
print("All models loaded.")

# -------------------------------------------------
# Sentiment Analysis
# -------------------------------------------------

def _normalize_sentiment(label: str) -> str:
    """Convert star ratings from nlptown model to positive/negative/neutral."""
    stars_map = {
        "1 star":  "negative",
        "2 stars": "negative",
        "3 stars": "neutral",
        "4 stars": "positive",
        "5 stars": "positive",
    }
    return stars_map.get(label.lower(), "neutral")


def analyze_sentiment(texts: list) -> list:
    """Run multilingual sentiment analysis on a list of texts.

    Works with Hindi, English, Tamil, Telugu, Bengali and more.
    Returns list of dicts with label and score.
    """
    if not texts:
        return []

    raw_results = _sentiment_pipeline(texts)
    normalized  = []

    for r in raw_results:
        normalized.append({
            "label":     _normalize_sentiment(r["label"]),
            "raw_label": r["label"],
            "score":     round(r["score"], 4),
        })

    return normalized


# -------------------------------------------------
# Issue Detection
# -------------------------------------------------

def _detect_with_trained_model(text: str) -> dict:
    """Detect issue using trained BERT multitask model."""
    encoding = _trained_tokenizer(
        text[:512],
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=128,
    )

    input_ids      = encoding["input_ids"].to(_device)
    attention_mask = encoding["attention_mask"].to(_device)

    with torch.no_grad():
        output = _trained_model(
            input_ids=input_ids,
            attention_mask=attention_mask,
        )

    issue_probs = torch.softmax(output.issue_logits, dim=1)[0]
    top_idx     = issue_probs.argmax().item()
    confidence  = issue_probs[top_idx].item()

    issue_type = _label_map.get(str(top_idx), ISSUE_CATEGORIES[top_idx])

    return {
        "issue_type": issue_type,
        "confidence": round(confidence, 3),
        "source":     "trained_model",
    }


def _detect_with_zero_shot(text: str) -> dict:
    """Detect issue using zero-shot classification."""
    result = _zero_shot_pipeline(text[:512], ISSUE_CATEGORIES)
    return {
        "issue_type": result["labels"][0],
        "confidence": round(result["scores"][0], 3),
        "source":     "zero_shot",
    }


def detect_issue(text: str) -> dict:
    """Classify civic issue from text.

    Uses trained BERT model if available, otherwise zero-shot.
    Returns issue type and confidence score.
    """
    if not text or not text.strip():
        return {"issue_type": "Other", "confidence": 0.0, "source": "none"}

    try:
        if _trained_model is not None:
            return _detect_with_trained_model(text)
        else:
            return _detect_with_zero_shot(text)
    except Exception as e:
        print(f"Issue detection failed: {e}")
        return {"issue_type": "Other", "confidence": 0.0, "source": "error"}


# -------------------------------------------------
# Location Extraction and Geocoding
# -------------------------------------------------

def _geocode_with_retry(location_name: str, retries: int = 3) -> dict:
    """Geocode a location name to lat/lng.

    Priority:
    1. Local CSV  (instant, offline)
    2. MongoDB cache
    3. Nominatim API
    """
    name_lower = location_name.lower().strip()

    # Priority 1 - local CSV
    if name_lower in _LOCAL_LOCATIONS:
        return _LOCAL_LOCATIONS[name_lower]

    # Priority 2 - MongoDB cache
    cached = _locations_col.find_one({"name": location_name})
    if cached:
        return {
            "name":         location_name,
            "lat":          cached["lat"],
            "lng":          cached["lng"],
            "display_name": cached.get("display_name"),
            "source":       "cache",
        }

    # Priority 3 - Nominatim API
    for attempt in range(retries):
        try:
            time.sleep(1)
            geo = _geolocator.geocode(
                location_name + ", India",
                timeout=10,
                language="en",
            )

            if geo:
                result = {
                    "name":         location_name,
                    "lat":          geo.latitude,
                    "lng":          geo.longitude,
                    "display_name": geo.address,
                    "source":       "nominatim",
                }
                _locations_col.update_one(
                    {"name": location_name},
                    {"$set": {**result, "cached_at": datetime.utcnow().isoformat()}},
                    upsert=True,
                )
                return result

            return {
                "name":         location_name,
                "lat":          None,
                "lng":          None,
                "display_name": None,
                "source":       "not_found",
            }

        except (GeocoderTimedOut, GeocoderServiceError) as e:
            print(f"Geocoding attempt {attempt + 1} failed for {location_name}: {e}")
            time.sleep(2 ** attempt)

    return {
        "name":         location_name,
        "lat":          None,
        "lng":          None,
        "display_name": None,
        "source":       "failed",
    }


def extract_locations(text: str) -> list:
    """Extract location names from text and geocode each to lat/lng."""
    if not text or not text.strip():
        return []

    doc = _nlp(text)
    location_names = list({
        ent.text
        for ent in doc.ents
        if ent.label_ in ["GPE", "LOC"]
    })

    if not location_names:
        return []

    return [_geocode_with_retry(name) for name in location_names]


def save_location_signal(post_id: str, locations: list, platform: str):
    """Save location signals to MongoDB for heatmap feature."""
    for loc in locations:
        if loc.get("lat") and loc.get("lng"):
            _locations_col.update_one(
                {"name": loc["name"]},
                {
                    "$set": {
                        "name":         loc["name"],
                        "lat":          loc["lat"],
                        "lng":          loc["lng"],
                        "display_name": loc.get("display_name"),
                    },
                    "$push":     {"post_ids": post_id},
                    "$inc":      {"mention_count": 1},
                    "$addToSet": {"platforms": platform},
                },
                upsert=True,
            )


# -------------------------------------------------
# OCR
# -------------------------------------------------

def ocr_image(url: str) -> str:
    """Download image from URL and extract text using OCR."""
    try:
        resp = requests.get(url, stream=True, timeout=10)
        img  = Image.open(resp.raw)
        return pytesseract.image_to_string(img)
    except Exception as e:
        print(f"OCR failed for {url}: {e}")
        return ""


# -------------------------------------------------
# Unified Post Analyzer
# -------------------------------------------------

def analyze_post(post: dict) -> dict:
    """Full NLP analysis of a single community post.

    Handles text and optional image URL via OCR.
    Saves result to MongoDB automatically.
    """
    text     = post.get("text", "") or ""
    post_id  = str(post.get("id", ""))
    platform = post.get("platform", "community")

    if post.get("image_url"):
        ocr_text = ocr_image(post["image_url"])
        if ocr_text:
            text += " " + ocr_text

    text = text.strip()

    if not text:
        return {
            "post_id":       post_id,
            "text":          "",
            "platform":      platform,
            "sentiment":     {"label": "neutral", "score": 0.0},
            "locations":     [],
            "issue":         {"issue_type": "Other", "confidence": 0.0},
            "processed_at":  datetime.utcnow().isoformat(),
            "nlp_processed": True,
        }

    sentiment = analyze_sentiment([text])[0]
    locations = extract_locations(text)
    issue     = detect_issue(text)

    if locations:
        save_location_signal(post_id, locations, platform)

    result = {
        "post_id":       post_id,
        "text":          text,
        "platform":      platform,
        "sentiment":     sentiment,
        "locations":     locations,
        "issue":         issue,
        "processed_at":  datetime.utcnow().isoformat(),
        "nlp_processed": True,
    }

    _social_signals.update_one(
        {"post_id": post_id},
        {"$set": result},
        upsert=True,
    )

    return result


# -------------------------------------------------
# Trend Detection
# -------------------------------------------------

def compute_trends(posts: list) -> dict:
    """Detect trends across posts with time based bucketing."""
    now    = datetime.utcnow()
    trends = {
        "last_1hr":    Counter(),
        "last_6hr":    Counter(),
        "last_24hr":   Counter(),
        "by_location": {},
        "total":       Counter(),
    }

    for post in posts:
        text = post.get("text", "")
        if not text:
            continue

        issue = detect_issue(text)["issue_type"]
        trends["total"][issue] += 1

        raw_ts = post.get("timestamp")
        if raw_ts:
            try:
                post_time = datetime.fromisoformat(str(raw_ts).replace("Z", ""))
                age       = now - post_time
                if age <= timedelta(hours=1):
                    trends["last_1hr"][issue] += 1
                if age <= timedelta(hours=6):
                    trends["last_6hr"][issue] += 1
                if age <= timedelta(hours=24):
                    trends["last_24hr"][issue] += 1
            except (ValueError, TypeError):
                pass

        locations = extract_locations(text)
        for loc in locations:
            loc_name = loc["name"]
            if loc_name not in trends["by_location"]:
                trends["by_location"][loc_name] = Counter()
            trends["by_location"][loc_name][issue] += 1

    snapshot = {
        "snapshot_at": now.isoformat(),
        "last_1hr":    dict(trends["last_1hr"]),
        "last_6hr":    dict(trends["last_6hr"]),
        "last_24hr":   dict(trends["last_24hr"]),
        "by_location": {k: dict(v) for k, v in trends["by_location"].items()},
        "total":       dict(trends["total"]),
    }

    _trends_col.insert_one(snapshot)
    return snapshot


# -------------------------------------------------
# Test
# -------------------------------------------------

if __name__ == "__main__":
    sample_posts = [
        {
            "id":        "1",
            "text":      "Paani ki pipeline toot gayi hai Sector 14 Delhi mein",
            "platform":  "community",
            "timestamp": datetime.utcnow().isoformat(),
        },
        {
            "id":        "2",
            "text":      "Road near Connaught Place is completely broken with deep potholes",
            "platform":  "community",
            "timestamp": datetime.utcnow().isoformat(),
        },
        {
            "id":        "3",
            "text":      "Garbage not collected in Andheri Mumbai for 2 weeks, stinking badly",
            "platform":  "community",
            "timestamp": datetime.utcnow().isoformat(),
        },
    ]

    for post in sample_posts:
        print(f"\nPost     : {post['text'][:60]}")
        result = analyze_post(post)
        print(f"Issue    : {result['issue']['issue_type']} ({result['issue']['confidence']}) via {result['issue']['source']}")
        print(f"Sentiment: {result['sentiment']['label']}")
        print(f"Locations: {[l['name'] for l in result['locations']]}")
