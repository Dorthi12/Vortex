# NETRAVAAH — Social Media Analysis Feature

> AI-powered civic grievance detection from citizen posts using NLP and Computer Vision

---

## Overview

The Social Media Analysis feature is the core intelligence layer of NETRAVAAH. It automatically reads citizen complaints submitted as text or images, classifies the civic issue, detects sentiment, extracts locations, and assigns a priority score — all in real time.

---

## Folder Structure

```
src/social_media_analysis/
│
├── .env                          # Environment variables (MongoDB URI, tokens)
├── app.py                        # FastAPI routes — main entry point
├── analysis.py                   # NLP pipeline (BERT, sentiment, NER, geocoding)
├── image_pipeline.py             # Combines text + image analysis, picks winner
├── image_classifier.py           # EfficientNet-B4 image model loader
├── model.py                      # BERT multitask model architecture
├── test_pipeline.py              # End-to-end pipeline tests
│
├── models/
│   ├── multitask/
│   │   ├── best_model.pt         # Trained BERT weights (84.29% issue accuracy)
│   │   └── metadata.json         # Label map, model config
│   └── image_classifier/
│       ├── best_model.pth        # Trained EfficientNet weights (99.48% accuracy)
│       └── metadata.json         # Class names, config
│
├── data/
│   ├── locations_india.csv       # 359 Indian locations for offline geocoding
│   └── raw data/
│       └── fine_tuning_grievances.csv  # Kaggle grievance dataset (2000 rows)
│
├── training/
│   ├── prepare_text_data.py      # Prepares text training data
│   ├── prepare_dataset.py        # Prepares image dataset
│   ├── merge_datasets.py         # Merges multiple data sources
│   ├── auto_label.py             # Auto labels images
│   ├── train_text_model.py       # Trains BERT multitask model
│   └── train_image_model.py      # Trains EfficientNet image model
│
└── resource_monitor/             # Feature 2 — Resource Mismanagement Monitor
```

---

## Tech Stack

| Component | Technology |
|---|---|
| API Framework | FastAPI + Uvicorn |
| Text Model | BERT (bert-base-multilingual-cased) |
| Image Model | EfficientNet-B4 |
| NER | spaCy (en_core_web_sm) |
| Sentiment | nlptown/bert-base-multilingual-uncased-sentiment |
| Zero-shot fallback | facebook/bart-large-mnli |
| OCR | Pytesseract |
| Geocoding | Nominatim (OpenStreetMap) + local CSV |
| Database | MongoDB Atlas |
| Deep Learning | PyTorch + Transformers (HuggingFace) |

---

## Pipeline Flow

```
Citizen submits post (text / image / both)
        ↓
app.py receives request (FastAPI)
        ↓
image_pipeline.py orchestrates both models
        ↓
    ┌───────────────┬──────────────────┐
    ↓               ↓                  ↓
Text NLP        Image CNN           OCR (if image has text)
(analysis.py)   (image_classifier)  (pytesseract)
    ↓               ↓
BERT detects    EfficientNet
issue +         classifies
sentiment       image issue
    ↓               ↓
    └───────┬───────┘
            ↓
    Compare confidence scores
    Higher confidence wins
            ↓
    Compute priority score
            ↓
    Extract locations (spaCy NER)
            ↓
    Geocode to lat/lng
            ↓
    Save to MongoDB
            ↓
    Return response to Node.js backend
```

---

## Issue Categories (18 total)

Matches `IssueCategory` enum in Prisma schema:

| Display Name | Prisma Enum |
|---|---|
| Water Supply | WATER_SUPPLY |
| Road Damage | ROAD_DAMAGE |
| Electricity | ELECTRICITY |
| Street Lights | STREET_LIGHTS |
| Drainage and Sewage | DRAINAGE_AND_SEWAGE |
| Flooding | FLOODING |
| Garbage Collection | GARBAGE_COLLECTION |
| Public Toilets | PUBLIC_TOILETS |
| Healthcare | HEALTHCARE |
| Education | EDUCATION |
| Public Safety | PUBLIC_SAFETY |
| Public Transport | PUBLIC_TRANSPORT |
| Air Pollution | AIR_POLLUTION |
| Water Pollution | WATER_POLLUTION |
| Corruption | CORRUPTION |
| Government Schemes | GOVERNMENT_SCHEMES |
| Agriculture | AGRICULTURE |
| Other | OTHERS |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /community/post | Submit post with text and/or image URL |
| POST | /community/post/upload | Submit post with direct image file upload |
| POST | /community/analyze/{post_id} | Analyze existing Prisma post by ID |
| GET | /community/post/{post_id} | Get analysis for a specific post |
| GET | /community/feed | Get all posts with optional filters |
| GET | /community/trends | Trending issues (1hr, 6hr, 24hr) |
| GET | /community/locations | Geocoded locations for heatmap |
| GET | /community/signals | Filtered NLP signals for dashboard |
| GET | /community/stats | Category wise counts and sentiment |
| GET | /community/issues | List all IssueCategory enum values |
| GET | /community/priority | High priority posts for govt dashboard |
| GET | /health | Health check |

---

## MongoDB Collections

```
netravaah database
│
├── social_signals      # Every citizen post with full NLP analysis
│   ├── post_id
│   ├── user_id
│   ├── text
│   ├── final_issue     # e.g. "Road Damage"
│   ├── confidence      # e.g. 0.87
│   ├── decided_by      # "text" | "image" | "text_fallback"
│   ├── sentiment       # { label, score }
│   ├── priority_score  # 0.0 to 1.0
│   ├── locations       # [ { name, lat, lng, state, district } ]
│   ├── text_analysis
│   ├── image_analysis
│   └── processed_at
│
├── locations           # Geocoded locations with mention counts
│   ├── name
│   ├── lat / lng
│   ├── mention_count
│   └── state / district
│
└── trends              # Hourly issue trend snapshots
    ├── snapshot_at
    ├── last_1hr
    ├── last_6hr
    ├── last_24hr
    └── by_location
```

---

## Model Performance

| Model | Task | Accuracy |
|---|---|---|
| BERT Multitask | Issue Detection | 84.29% |
| BERT Multitask | Sentiment Analysis | 98.85% |
| EfficientNet-B4 | Image Classification | 99.48% |

---

## Priority Score Formula

```
Priority = (confidence × 0.6 + sentiment_score × 0.4) × issue_weight

Issue weights:
  Flooding, Healthcare, Public Safety,
  Water Supply, Electricity, Air Pollution  →  1.0  (Critical)
  Road Damage, Drainage, Garbage,
  Water Pollution, Public Transport         →  0.85 (Medium-High)
  All others                                →  0.70 (Standard)

Score >= 0.8  →  CRITICAL
Score >= 0.6  →  HIGH
Score >= 0.4  →  MEDIUM
Score  < 0.4  →  LOW
```

---

## Setup and Run

**Install dependencies:**
```bash
pip install fastapi uvicorn pymongo[srv] transformers torch
pip install spacy geopy pytesseract Pillow python-dotenv
python -m spacy download en_core_web_sm
```

**Configure .env:**
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/netravaah
HF_HUB_DISABLE_SYMLINKS_WARNING=1
IMAGE_MODEL_DIR=models/image_classifier
WAQI_TOKEN=your_token_here
```

**Run the API:**
```bash
cd src/social_media_analysis
python app.py
```

API runs at: `http://localhost:8000`
Interactive docs at: `http://localhost:8000/docs`

---

## Integration With Node.js Backend

This Python service handles AI/NLP processing only. The Node.js backend handles user authentication, Prisma/PostgreSQL records, and serves the frontend.

```
Node.js creates Post in PostgreSQL
        ↓
Node.js calls POST /community/analyze/{post_id}
        ↓
Python returns prisma_ready dict
        ↓
Node.js saves it to Prisma SentimentAnalysis table
```

Every response includes a `prisma_ready` object with camelCase field names matching Prisma model fields exactly.

---

## Training Data

| Source | Rows | Labels |
|---|---|---|
| Kaggle civic grievance dataset | 2000 | 7 original → mapped to 18 |
| Synthetic generated data | ~500 per category | 18 categories |
| Combined training_data.csv | ~11000 | 18 categories |

---

*NETRAVAAH — AI Powered Governance Intelligence Platform*
*Feature 1: Social Media Analysis | Feature 2: Resource Monitor | Feature 3: Budget Simulator*
