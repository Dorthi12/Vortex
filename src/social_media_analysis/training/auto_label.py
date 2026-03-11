"""
auto_label.py
=============
Automatically labels community posts from MongoDB using
zero-shot classification. Generates training_data.csv
for training the BERT text model.

Run this before train_text_model.py

Usage:
    python training/auto_label.py --limit 500
    python training/auto_label.py --source csv --input_csv my_texts.csv
"""

from transformers import pipeline
import pandas as pd
from datetime import datetime
from pymongo import MongoClient
import os
import argparse
from dotenv import load_dotenv

load_dotenv()

# -------------------------------------------------
# Models
# -------------------------------------------------

print("Loading models for auto labeling")

_classifier = pipeline(
    "zero-shot-classification",
    model="facebook/bart-large-mnli",
)

_sentiment_model = pipeline(
    "sentiment-analysis",
    model="nlptown/bert-base-multilingual-uncased-sentiment",
    truncation=True,
    max_length=512,
)

print("Models loaded.")

# -------------------------------------------------
# MongoDB
# -------------------------------------------------

_client         = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/"))
_db             = _client["netravaah"]
_social_signals = _db["social_signals"]

# -------------------------------------------------
# Categories
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

ISSUE_MAP = {cat: i for i, cat in enumerate(ISSUE_CATEGORIES)}

SENTIMENT_MAP = {
    "1 star":  0,
    "2 stars": 0,
    "3 stars": 1,
    "4 stars": 2,
    "5 stars": 2,
}

# Posts with confidence below this threshold
# will be labeled as Other instead of forcing a wrong label
CONFIDENCE_THRESHOLD = 0.35


# -------------------------------------------------
# Label Single Text
# -------------------------------------------------

def label_single(text: str) -> dict:
    """Auto label a single text with issue type and sentiment."""

    issue_result    = _classifier(text[:512], ISSUE_CATEGORIES)
    top_issue       = issue_result["labels"][0]
    top_confidence  = issue_result["scores"][0]

    if top_confidence < CONFIDENCE_THRESHOLD:
        top_issue      = "Other"
        top_confidence = 1.0

    sentiment_result  = _sentiment_model([text[:512]])[0]
    sentiment_raw     = sentiment_result["label"]
    sentiment_numeric = SENTIMENT_MAP.get(sentiment_raw, 1)

    return {
        "issue":            ISSUE_MAP[top_issue],
        "issue_name":       top_issue,
        "issue_confidence": round(top_confidence, 3),
        "sentiment":        sentiment_numeric,
        "sentiment_name":   sentiment_raw,
    }


# -------------------------------------------------
# Label From MongoDB
# -------------------------------------------------

def auto_label_from_mongodb(limit: int = 500) -> pd.DataFrame:
    """Pull unlabeled posts from MongoDB and auto label them.

    Only processes posts where nlp_processed is True
    but training_label does not exist yet.

    Saves labels back to MongoDB and returns DataFrame.
    """
    print(f"Fetching up to {limit} posts from MongoDB...")

    posts = list(
        _social_signals.find(
            {
                "nlp_processed":  True,
                "training_label": {"$exists": False},
            },
            {"_id": 1, "text": 1, "platform": 1}
        ).limit(limit)
    )

    if not posts:
        print("No unlabeled posts found in MongoDB.")
        print("Make sure citizens have posted on the community platform first.")
        return pd.DataFrame()

    print(f"Found {len(posts)} posts to label.")
    print("")

    rows  = []
    total = len(posts)

    for i, post in enumerate(posts):
        text = post.get("text", "").strip()
        if not text:
            continue

        print(f"  [{i+1}/{total}] {text[:60]}...")

        try:
            labels = label_single(text)

            # Save label back to MongoDB
            _social_signals.update_one(
                {"_id": post["_id"]},
                {"$set": {
                    "training_label": {
                        "issue":        labels["issue"],
                        "issue_name":   labels["issue_name"],
                        "sentiment":    labels["sentiment"],
                        "confidence":   labels["issue_confidence"],
                        "labeled_at":   datetime.utcnow().isoformat(),
                    }
                }}
            )

            rows.append({
                "text":             text,
                "platform":         post.get("platform", "community"),
                "issue":            labels["issue"],
                "issue_name":       labels["issue_name"],
                "issue_confidence": labels["issue_confidence"],
                "sentiment":        labels["sentiment"],
                "sentiment_name":   labels["sentiment_name"],
                "labeled_at":       datetime.utcnow().isoformat(),
            })

        except Exception as e:
            print(f"  Failed for post {post['_id']}: {e}")
            continue

    return pd.DataFrame(rows)


# -------------------------------------------------
# Label From CSV
# -------------------------------------------------

def auto_label_from_csv(input_csv: str) -> pd.DataFrame:
    """Label texts from a CSV file with a text column."""
    if not os.path.exists(input_csv):
        raise FileNotFoundError(f"Input CSV not found: {input_csv}")

    df    = pd.read_csv(input_csv)
    texts = df["text"].dropna().tolist()

    print(f"Labeling {len(texts)} texts from {input_csv}...")
    print("")

    rows  = []
    total = len(texts)

    for i, text in enumerate(texts):
        text = str(text).strip()
        if not text:
            continue

        print(f"  [{i+1}/{total}] {text[:60]}...")

        try:
            labels = label_single(text)
            rows.append({
                "text":             text,
                "issue":            labels["issue"],
                "issue_name":       labels["issue_name"],
                "issue_confidence": labels["issue_confidence"],
                "sentiment":        labels["sentiment"],
                "sentiment_name":   labels["sentiment_name"],
                "labeled_at":       datetime.utcnow().isoformat(),
            })
        except Exception as e:
            print(f"  Failed: {e}")
            continue

    return pd.DataFrame(rows)


# -------------------------------------------------
# Distribution Check
# -------------------------------------------------

def check_distribution(df: pd.DataFrame):
    """Print label distribution and warn about low categories."""
    print("")
    print("Label Distribution:")
    print("-" * 45)

    counts = df["issue_name"].value_counts()
    total  = len(df)

    for issue, count in counts.items():
        pct = round((count / total) * 100, 1)
        bar = "#" * (count // 5)
        print(f"  {issue:<28} {count:>4} ({pct:>5}%)  {bar}")

    print("")
    low = counts[counts < 20]
    if not low.empty:
        print("Categories with less than 20 samples (may affect model accuracy):")
        for issue, count in low.items():
            print(f"  {issue}: only {count} samples")
    else:
        print("All categories have enough samples.")


# -------------------------------------------------
# Main
# -------------------------------------------------

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Auto label training data")
    parser.add_argument(
        "--source",
        choices=["mongodb", "csv"],
        default="mongodb",
        help="Where to get texts from"
    )
    parser.add_argument(
        "--input_csv",
        default=None,
        help="Input CSV path if source is csv (must have text column)"
    )
    parser.add_argument(
        "--output_csv",
        default="data/training_data.csv",
        help="Where to save the labeled CSV"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=500,
        help="Max posts to label from MongoDB"
    )
    args = parser.parse_args()

    print("")
    print("=" * 50)
    print("NETRAVAAH - Auto Labeler")
    print(f"Categories : {len(ISSUE_CATEGORIES)}")
    print(f"Source     : {args.source}")
    print("=" * 50)
    print("")

    if args.source == "mongodb":
        df = auto_label_from_mongodb(limit=args.limit)
    else:
        if not args.input_csv:
            print("Error: provide --input_csv when using source=csv")
            exit(1)
        df = auto_label_from_csv(args.input_csv)

    if df.empty:
        print("No data was labeled.")
        exit()

    # Save only the columns needed for training
    os.makedirs(os.path.dirname(args.output_csv), exist_ok=True)
    training_df = df[["text", "issue", "sentiment"]].copy()
    training_df.to_csv(args.output_csv, index=False)

    print(f"\n{len(training_df)} rows saved to {args.output_csv}")

    check_distribution(df)

    print("")
    print("=" * 50)
    print("Next step - run:")
    print("  python training/prepare_dataset.py --mode text")
    print("=" * 50)
