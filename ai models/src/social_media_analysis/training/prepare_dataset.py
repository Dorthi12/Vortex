"""
prepare_dataset.py
==================
Handles train/val/test splitting for BOTH:
1. Text dataset (CSV) — for BERT text classifier
2. Image dataset (folders) — for EfficientNet image classifier

Run this BEFORE training either model.
"""

import os
import json
import shutil
import pandas as pd
from sklearn.model_selection import train_test_split
from collections import Counter
import random

# ─────────────────────────────────────────
# Config
# ─────────────────────────────────────────

RANDOM_SEED = 42
TRAIN_RATIO = 0.70
VAL_RATIO   = 0.15
TEST_RATIO  = 0.15  # must sum to 1.0

# Minimum samples per class — warn if below this
MIN_SAMPLES_PER_CLASS = 20

# ─────────────────────────────────────────
# Issue Categories — Single source of truth
# Used by BOTH text and image models
# ─────────────────────────────────────────

ISSUE_CATEGORIES = [
    "Road_Damage",
    "Garbage_Collection",
    "Flooding",
    "Electricity",
    "Water_Supply",
    "Drainage_Sewage",
    "Public_Toilets",
    "Healthcare",
    "Education",
    "Public_Safety",
    "Public_Transport",
    "Air_Pollution",
    "Water_Pollution",
    "Corruption",
    "Government_Schemes",
    "Agriculture",
    "Street_Lights",
    "Other",
]

# Numeric mapping
ISSUE_TO_IDX = {cat: i for i, cat in enumerate(ISSUE_CATEGORIES)}
IDX_TO_ISSUE = {i: cat for i, cat in enumerate(ISSUE_CATEGORIES)}

SENTIMENT_CATEGORIES = ["negative", "neutral", "positive"]
SENTIMENT_TO_IDX = {s: i for i, s in enumerate(SENTIMENT_CATEGORIES)}


# ═════════════════════════════════════════
# PART 1 — TEXT DATASET PREPARATION
# ═════════════════════════════════════════

def prepare_text_dataset(
    input_csv: str = "data/training_data.csv",
    output_dir: str = "data/text_splits",
):
    """Split text CSV into train/val/test sets.

    Input CSV must have columns: text, issue, sentiment
    where issue and sentiment are numeric indices.

    Saves:
        data/text_splits/train.csv
        data/text_splits/val.csv
        data/text_splits/test.csv
        data/text_splits/label_map.json
    """
    print("\n" + "="*55)
    print("TEXT DATASET PREPARATION")
    print("="*55)

    # ── Load ────────────────────────────────────────────────
    if not os.path.exists(input_csv):
        raise FileNotFoundError(
            f"Training CSV not found at '{input_csv}'.\n"
            f"Run auto_label.py first to generate it."
        )

    df = pd.read_csv(input_csv)
    print(f"\n Loaded {len(df)} rows from {input_csv}")

    # ── Validate columns ────────────────────────────────────
    required = {"text", "issue", "sentiment"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"CSV missing columns: {missing}")

    # ── Drop bad rows ────────────────────────────────────────
    before = len(df)
    df = df.dropna(subset=["text", "issue", "sentiment"])
    df = df[df["text"].str.strip() != ""]
    df["issue"] = df["issue"].astype(int)
    df["sentiment"] = df["sentiment"].astype(int)
    print(f" After cleaning: {len(df)} rows ({before - len(df)} dropped)")

    # ── Class distribution ──────────────────────────────────
    print("\n Issue Distribution:")
    issue_counts = Counter(df["issue"].tolist())
    for idx, count in sorted(issue_counts.items()):
        label = IDX_TO_ISSUE.get(idx, f"Unknown({idx})")
        bar = "█" * (count // 5)
        pct = round(count / len(df) * 100, 1)
        flag = "  LOW" if count < MIN_SAMPLES_PER_CLASS else ""
        print(f"  {label:<25} {count:>4} ({pct:>5}%) {bar}{flag}")

    # ── Warn about low classes ───────────────────────────────
    low_classes = [
        IDX_TO_ISSUE.get(idx, str(idx))
        for idx, count in issue_counts.items()
        if count < MIN_SAMPLES_PER_CLASS
    ]
    if low_classes:
        print(f"\n These classes have < {MIN_SAMPLES_PER_CLASS} samples:")
        print(f"   {low_classes}")
        print(f"   Collect more data for these before training.")

    # ── Split ────────────────────────────────────────────────
    # First split off test set
    train_val_df, test_df = train_test_split(
        df,
        test_size=TEST_RATIO,
        random_state=RANDOM_SEED,
        stratify=df["issue"],  # keep class balance in each split
    )

    # Then split train/val from remaining
    val_size_adjusted = VAL_RATIO / (TRAIN_RATIO + VAL_RATIO)
    train_df, val_df = train_test_split(
        train_val_df,
        test_size=val_size_adjusted,
        random_state=RANDOM_SEED,
        stratify=train_val_df["issue"],
    )

    print(f"\n Split complete:")
    print(f"   Train : {len(train_df)} rows ({TRAIN_RATIO*100:.0f}%)")
    print(f"   Val   : {len(val_df)} rows ({VAL_RATIO*100:.0f}%)")
    print(f"   Test  : {len(test_df)} rows ({TEST_RATIO*100:.0f}%)")

    # ── Save splits ──────────────────────────────────────────
    os.makedirs(output_dir, exist_ok=True)
    train_df.to_csv(os.path.join(output_dir, "train.csv"), index=False)
    val_df.to_csv(os.path.join(output_dir, "val.csv"), index=False)
    test_df.to_csv(os.path.join(output_dir, "test.csv"), index=False)

    # ── Save label maps ──────────────────────────────────────
    label_map = {
        "issue_to_idx": ISSUE_TO_IDX,
        "idx_to_issue": IDX_TO_ISSUE,
        "sentiment_to_idx": SENTIMENT_TO_IDX,
        "idx_to_sentiment": {str(i): s for i, s in enumerate(SENTIMENT_CATEGORIES)},
        "num_issue_labels": len(ISSUE_CATEGORIES),
        "num_sentiment_labels": len(SENTIMENT_CATEGORIES),
    }
    with open(os.path.join(output_dir, "label_map.json"), "w") as f:
        json.dump(label_map, f, indent=2)

    print(f"\n Saved to {output_dir}/")
    print(f"   train.csv, val.csv, test.csv, label_map.json")
    return train_df, val_df, test_df


# ═════════════════════════════════════════
# PART 2 — IMAGE DATASET PREPARATION
# ═════════════════════════════════════════

def prepare_image_dataset(
    input_dir: str = "data/dataset",
    output_dir: str = "data/image_splits",
):
    """Split image folders into train/val/test sets.

    Expects input structure:
        data/dataset/
        ├── Road_Damage/        ← folder name = class label
        │   ├── img001.jpg
        │   └── ...
        ├── Flooding/
        └── ...

    Creates output structure:
        data/image_splits/
        ├── train/
        │   ├── Road_Damage/
        │   └── ...
        ├── val/
        │   ├── Road_Damage/
        │   └── ...
        ├── test/
        │   ├── Road_Damage/
        │   └── ...
        └── metadata.json
    """
    print("\n" + "="*55)
    print("IMAGE DATASET PREPARATION")
    print("="*55)

    if not os.path.exists(input_dir):
        raise FileNotFoundError(
            f"Dataset folder not found at '{input_dir}'.\n"
            f"Download images from Kaggle first and put them in {input_dir}/"
        )

    # ── Scan classes ─────────────────────────────────────────
    classes = sorted([
        d for d in os.listdir(input_dir)
        if os.path.isdir(os.path.join(input_dir, d))
    ])

    if not classes:
        raise ValueError(f"No subfolders found in {input_dir}")

    print(f"\n Found {len(classes)} classes: {classes}")

    # ── Supported image formats ──────────────────────────────
    VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

    # ── Create output dirs ───────────────────────────────────
    for split in ["train", "val", "test"]:
        for cls in classes:
            os.makedirs(os.path.join(output_dir, split, cls), exist_ok=True)

    # ── Split each class separately ──────────────────────────
    # (stratified — keeps class balance across splits)
    split_counts = {"train": 0, "val": 0, "test": 0}
    class_stats = {}

    print("\n Image Distribution:")
    print(f"  {'Class':<25} {'Total':>6} {'Train':>6} {'Val':>5} {'Test':>5}")
    print(f"  {'-'*50}")

    for cls in classes:
        cls_dir = os.path.join(input_dir, cls)

        # Get all valid images
        images = [
            f for f in os.listdir(cls_dir)
            if os.path.splitext(f)[1].lower() in VALID_EXTENSIONS
        ]

        if len(images) < MIN_SAMPLES_PER_CLASS:
            print(f"  {cls}: only {len(images)} images — need at least {MIN_SAMPLES_PER_CLASS}")
            continue

        # Shuffle for randomness
        random.seed(RANDOM_SEED)
        random.shuffle(images)

        # Split indices
        n = len(images)
        n_test = max(1, int(n * TEST_RATIO))
        n_val = max(1, int(n * VAL_RATIO))
        n_train = n - n_test - n_val

        train_imgs = images[:n_train]
        val_imgs   = images[n_train:n_train + n_val]
        test_imgs  = images[n_train + n_val:]

        # Copy files to split directories
        for img in train_imgs:
            shutil.copy2(
                os.path.join(cls_dir, img),
                os.path.join(output_dir, "train", cls, img)
            )
        for img in val_imgs:
            shutil.copy2(
                os.path.join(cls_dir, img),
                os.path.join(output_dir, "val", cls, img)
            )
        for img in test_imgs:
            shutil.copy2(
                os.path.join(cls_dir, img),
                os.path.join(output_dir, "test", cls, img)
            )

        split_counts["train"] += n_train
        split_counts["val"] += n_val
        split_counts["test"] += n_test

        class_stats[cls] = {
            "total": n,
            "train": n_train,
            "val": n_val,
            "test": n_test
        }

        print(f"  {cls:<25} {n:>6} {n_train:>6} {n_val:>5} {n_test:>5}")

    print(f"\n Total split:")
    print(f"   Train : {split_counts['train']} images")
    print(f"   Val   : {split_counts['val']} images")
    print(f"   Test  : {split_counts['test']} images")

    # ── Save metadata ────────────────────────────────────────
    metadata = {
        "classes": classes,
        "class_to_idx": {cls: i for i, cls in enumerate(classes)},
        "idx_to_class": {str(i): cls for i, cls in enumerate(classes)},
        "split_counts": split_counts,
        "class_stats": class_stats,
        "train_ratio": TRAIN_RATIO,
        "val_ratio": VAL_RATIO,
        "test_ratio": TEST_RATIO,
    }

    metadata_path = os.path.join(output_dir, "metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\n Saved to {output_dir}/")
    print(f"   train/ val/ test/ metadata.json")
    return metadata


# ─────────────────────────────────────────
# Main
# ─────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Prepare datasets for training")
    parser.add_argument(
        "--mode",
        choices=["text", "image", "both"],
        default="both",
        help="Which dataset to prepare"
    )
    parser.add_argument("--text_input",  default="data/training_data.csv")
    parser.add_argument("--text_output", default="data/text_splits")
    parser.add_argument("--image_input", default="data/dataset")
    parser.add_argument("--image_output",default="data/image_splits")
    args = parser.parse_args()

    if args.mode in ("text", "both"):
        prepare_text_dataset(args.text_input, args.text_output)

    if args.mode in ("image", "both"):
        prepare_image_dataset(args.image_input, args.image_output)

    print("\n Dataset preparation complete!")
    print("Next steps:")
    if args.mode in ("text", "both"):
        print("  python train_text_model.py")
    if args.mode in ("image", "both"):
        print("  python train_image_model.py")
