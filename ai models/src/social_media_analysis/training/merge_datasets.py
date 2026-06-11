"""
merge_datasets.py
=================
Merges all Kaggle datasets into one unified dataset folder.

Confirmed folder structure:
  raw data/
  ├── Air Pollution Image Dataset/
  │   └── Air Pollution Image Dataset/
  │       └── Combined_Dataset/
  │           └── IND_and_NEP/        -> Air_Pollution
  │
  ├── dataset/
  │   └── dataset/
  │       └── images/                 -> Flooding
  │           └── train/              -> Garbage_Collection
  │
  └── sih_road_dataset/
      └── sih_road_dataset/
          ├── poor/                   -> Road_Damage
          └── very_poor/              -> Road_Damage

Output:
  data/dataset/
  ├── Air_Pollution/
  ├── Flooding/
  ├── Garbage_Collection/
  └── Road_Damage/

Usage:
    cd C:\\Shriya\\VORTEX-SANKALP\\src\\social_media_analysis
    python training/merge_datasets.py
"""

import os
import shutil
import random
from pathlib import Path
from collections import defaultdict

# Paths - run from social_media_analysis/ folder
BASE_DIR   = Path("data")
RAW_DIR    = BASE_DIR / "raw data"
OUTPUT_DIR = BASE_DIR / "dataset"

VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

# Maximum images per category to keep dataset balanced
MAX_IMAGES_PER_CATEGORY = 1000

# Minimum images per category - script warns if below this
MIN_IMAGES_PER_CATEGORY = 100

# Dataset Mapping
# Each entry has:
#   source    -> path relative to raw data/
#   category  -> output folder name in data/dataset/
#   recursive -> True means include subfolders too

DATASET_MAPPING = [
    {
        "source":    "Air Pollution Image Dataset/Air Pollution Image Dataset/Combined_Dataset/IND_and_NEP",
        "category":  "Air_Pollution",
        "recursive": True,
    },
    {
        "source":    "dataset/dataset/images",
        "category":  "Flooding",
        "recursive": False,
    },
    {
        "source":    "dataset/dataset/images/train",
        "category":  "Garbage_Collection",
        "recursive": True,
    },
    {
        "source":    "sih_road_dataset/sih_road_dataset/poor",
        "category":  "Road_Damage",
        "recursive": True,
    },
    {
        "source":    "sih_road_dataset/sih_road_dataset/very_poor",
        "category":  "Road_Damage",
        "recursive": True,
    },
]


def get_images(folder: Path, recursive: bool) -> list:
    """Return all valid image paths from a folder."""
    if not folder.exists():
        return []

    files = []
    if recursive:
        for ext in VALID_EXTENSIONS:
            files += list(folder.rglob(f"*{ext}"))
            files += list(folder.rglob(f"*{ext.upper()}"))
    else:
        for ext in VALID_EXTENSIONS:
            files += list(folder.glob(f"*{ext}"))
            files += list(folder.glob(f"*{ext.upper()}"))

    files = list(set(f for f in files if f.is_file()))
    return files


def copy_images(images: list, target_dir: Path, category: str, start_idx: int = 0) -> int:
    """Copy images to target folder with clean sequential names.

    Example output names:
        Air_Pollution_00001.jpg
        Air_Pollution_00002.jpg

    Returns number of images successfully copied.
    """
    target_dir.mkdir(parents=True, exist_ok=True)
    copied = 0

    for i, img_path in enumerate(images):
        ext = img_path.suffix.lower()
        if ext not in VALID_EXTENSIONS:
            continue

        new_name    = f"{category}_{start_idx + i:05d}{ext}"
        target_path = target_dir / new_name

        if target_path.exists():
            copied += 1
            continue

        try:
            shutil.copy2(img_path, target_path)
            copied += 1
        except Exception as e:
            print(f"    Could not copy {img_path.name}. Reason: {e}")

    return copied


def resolve_path(raw_dir: Path, source: str) -> Path:
    """Try to find the correct folder path.

    Kaggle datasets sometimes extract with slightly different
    folder structures so this tries a few common patterns.
    """
    path = raw_dir / source
    if path.exists():
        return path

    parts = source.split("/")
    if len(parts) > 1:
        alt = raw_dir / "/".join(parts[1:])
        if alt.exists():
            print(f"    Note: Using alternate path: {alt}")
            return alt

    if len(parts) > 2:
        alt = raw_dir / "/".join(parts[2:])
        if alt.exists():
            print(f"    Note: Using alternate path: {alt}")
            return alt

    return path


def merge_datasets():
    print("")
    print("=" * 60)
    print("NETRAVAAH - Dataset Merger")
    print("=" * 60)
    print("")
    print(f"Raw data folder : {RAW_DIR.absolute()}")
    print(f"Output folder   : {OUTPUT_DIR.absolute()}")

    if not RAW_DIR.exists():
        print("")
        print(f"Error: Raw data folder not found at {RAW_DIR.absolute()}")
        print("run from:")
        print("C:\\Shriya\\VORTEX-SANKALP\\src\\social_media_analysis\\")
        return

    category_counts = defaultdict(int)
    category_idx    = defaultdict(int)

    for mapping in DATASET_MAPPING:
        source_path = resolve_path(RAW_DIR, mapping["source"])
        category    = mapping["category"]
        recursive   = mapping["recursive"]

        print("")
        print("-" * 50)
        print(f"Source   : {mapping['source']}")
        print(f"Category : {category}")

        if not source_path.exists():
            print(f"Not found: {source_path}")
            print("Skipping this entry. Check the folder name manually.")
            continue

        images = get_images(source_path, recursive)

        if not images:
            print("No images found in this folder.")
            continue

        print(f"Images found : {len(images)}")

        random.seed(42)
        random.shuffle(images)

        already_have = category_counts[category]
        remaining    = MAX_IMAGES_PER_CATEGORY - already_have

        if remaining <= 0:
            print(f"Category {category} is already at the maximum of {MAX_IMAGES_PER_CATEGORY} images. Skipping.")
            continue

        images_to_copy = images[:remaining]
        print(f"Copying      : {len(images_to_copy)} images")

        target_dir = OUTPUT_DIR / category
        start_idx  = category_idx[category]
        copied     = copy_images(images_to_copy, target_dir, category, start_idx)

        category_counts[category] += copied
        category_idx[category]    += copied

        print(f"Done         : {copied} images saved to {target_dir}")

    print("")
    print("=" * 60)
    print("MERGE COMPLETE - Summary")
    print("=" * 60)
    print("")
    print(f"  {'Category':<25} {'Count':>6}  Status")
    print(f"  {'-' * 45}")

    total    = 0
    warnings = []

    for category in sorted(category_counts.keys()):
        count  = category_counts[category]
        total += count

        if count < MIN_IMAGES_PER_CATEGORY:
            status = f"Low - need {MIN_IMAGES_PER_CATEGORY - count} more images"
            warnings.append(category)
        elif count >= MAX_IMAGES_PER_CATEGORY:
            status = "Capped at maximum"
        else:
            status = "Good"

        print(f"  {category:<25} {count:>6}  {status}")

    print("")
    print(f"  Total images : {total}")
    print(f"  Categories   : {len(category_counts)}")

    if warnings:
        print("")
        print("The following categories do not have enough images yet.")
        print("Download more data from Kaggle for these before training:")
        print("")
        for cat in warnings:
            needed = MIN_IMAGES_PER_CATEGORY - category_counts[cat]
            print(f"  {cat} - currently has {category_counts[cat]} images, needs {needed} more")

    print("")
    print("=" * 60)
    print("Dataset is ready at: data/dataset/")
    print("")
    print("Next step - run this command:")
    print("  python training/prepare_dataset.py --mode image")
    print("=" * 60)
    print("")


if __name__ == "__main__":
    merge_datasets()
