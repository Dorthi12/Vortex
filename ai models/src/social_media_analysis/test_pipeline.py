"""
test_pipeline.py
================
End to end test of the full NETRAVAAH pipeline.

Tests:
1. Text only post
2. Hindi text post
3. Mixed Hindi English post
4. Image only post (uses a sample image from dataset)
5. Text + image post
6. MongoDB save and retrieve
7. Trend computation
8. Location extraction

Run from social_media_analysis/ folder:
    python test_pipeline.py
"""

from image_pipeline import process_community_post
from analysis import compute_trends, _social_signals, _locations_col
from datetime import datetime
import os
import sys

PASS = "PASS"
FAIL = "FAIL"
results = []

def test(name: str, condition: bool, detail: str = ""):
    status = PASS if condition else FAIL
    results.append((name, status, detail))
    print(f"  [{status}] {name}" + (f" - {detail}" if detail else ""))


print("")
print("=" * 60)
print("NETRAVAAH - Full Pipeline Test")
print("=" * 60)

# -------------------------------------------------
# Test 1 - English Text Post
# -------------------------------------------------
print("\nTest 1: English text post")
try:
    result = process_community_post({
        "id":       "test_en_001",
        "text":     "Road near Connaught Place Delhi is completely broken with deep potholes",
        "platform": "community",
        "user_id":  "tester",
        "timestamp":datetime.utcnow().isoformat(),
    })
    test("Issue detected",   result["final_issue"] != "Other",          result["final_issue"])
    test("Confidence > 0.3", result["confidence"] > 0.3,                str(result["confidence"]))
    test("Sentiment set",    result["sentiment"]["label"] in ["negative","neutral","positive"], result["sentiment"]["label"])
    test("Saved to MongoDB", _social_signals.find_one({"post_id": "test_en_001"}) is not None)
except Exception as e:
    test("English text post", False, str(e))

# -------------------------------------------------
# Test 2 - Hindi Text Post
# -------------------------------------------------
print("\nTest 2: Hindi text post")
try:
    result = process_community_post({
        "id":       "test_hi_001",
        "text":     "Hamare mohalle mein kachra gaadi 2 hafte se nahi aayi Mumbai mein",
        "platform": "community",
        "user_id":  "tester",
        "timestamp":datetime.utcnow().isoformat(),
    })
    test("Issue detected",   result["final_issue"] != "",               result["final_issue"])
    test("Confidence set",   result["confidence"] >= 0.0,               str(result["confidence"]))
    test("Decided by set",   result["decided_by"] in ["text","text_fallback","none"], result["decided_by"])
except Exception as e:
    test("Hindi text post", False, str(e))

# -------------------------------------------------
# Test 3 - Mixed Hindi English Post
# -------------------------------------------------
print("\nTest 3: Mixed Hindi English post")
try:
    result = process_community_post({
        "id":       "test_mix_001",
        "text":     "Bijli 3 din se nahi hai, electricity supply completely down in Rohini Delhi",
        "platform": "community",
        "user_id":  "tester",
        "timestamp":datetime.utcnow().isoformat(),
    })
    test("Issue detected",   result["final_issue"] != "",               result["final_issue"])
    test("Location found",   len(result["locations"]) > 0,              str([l["name"] for l in result["locations"]]))
except Exception as e:
    test("Mixed text post", False, str(e))

# -------------------------------------------------
# Test 4 - Image Post (using sample from dataset)
# -------------------------------------------------
print("\nTest 4: Image post from local file")
try:
    sample_image_path = None
    search_dirs = [
        "data/dataset/Road_Damage",
        "data/dataset/Flooding",
        "data/dataset/Garbage_Collection",
        "data/dataset/Air_Pollution",
    ]
    for d in search_dirs:
        if os.path.exists(d):
            files = [f for f in os.listdir(d) if f.endswith((".jpg",".jpeg",".png"))]
            if files:
                sample_image_path = os.path.join(d, files[0])
                break

    if sample_image_path:
        with open(sample_image_path, "rb") as f:
            image_bytes = f.read()

        result = process_community_post({
            "id":          "test_img_001",
            "text":        None,
            "image_bytes": image_bytes,
            "platform":    "community",
            "user_id":     "tester",
            "timestamp":   datetime.utcnow().isoformat(),
        })
        test("Image classified",  result["image_analysis"] is not None)
        test("Issue detected",    result["final_issue"] != "",           result["final_issue"])
        test("Decided by image",  result["decided_by"] in ["image","none"])
    else:
        test("Image post", False, "No sample images found in data/dataset/")
except Exception as e:
    test("Image post", False, str(e))

# -------------------------------------------------
# Test 5 - Text + Image Post
# -------------------------------------------------
print("\nTest 5: Text + image post combined")
try:
    sample_image_path = None
    for d in search_dirs:
        if os.path.exists(d):
            files = [f for f in os.listdir(d) if f.endswith((".jpg",".jpeg",".png"))]
            if files:
                sample_image_path = os.path.join(d, files[0])
                break

    if sample_image_path:
        with open(sample_image_path, "rb") as f:
            image_bytes = f.read()

        result = process_community_post({
            "id":          "test_both_001",
            "text":        "There is severe flooding in our area after heavy rain in Bangalore",
            "image_bytes": image_bytes,
            "platform":    "community",
            "user_id":     "tester",
            "timestamp":   datetime.utcnow().isoformat(),
        })
        test("Both analyses run",    result["text_analysis"] is not None and result["image_analysis"] is not None)
        test("Final issue decided",  result["decided_by"] in ["text","image","text_fallback"])
        test("Issue not empty",      result["final_issue"] != "")
    else:
        test("Text + image post", False, "No sample images found")
except Exception as e:
    test("Text + image post", False, str(e))

# -------------------------------------------------
# Test 6 - MongoDB Retrieval
# -------------------------------------------------
print("\nTest 6: MongoDB save and retrieve")
try:
    saved = _social_signals.find_one({"post_id": "test_en_001"}, {"_id": 0})
    test("Post retrieved",      saved is not None)
    test("Has final_issue",     "final_issue" in saved)
    test("Has sentiment",       "sentiment" in saved)
    test("Has processed_at",    "processed_at" in saved)
    test("Has nlp_processed",   saved.get("nlp_processed") is True)
except Exception as e:
    test("MongoDB retrieval", False, str(e))

# -------------------------------------------------
# Test 7 - Trend Computation
# -------------------------------------------------
print("\nTest 7: Trend computation")
try:
    posts = [
        {"text": "Road broken in Delhi", "timestamp": datetime.utcnow().isoformat()},
        {"text": "No water supply Mumbai", "timestamp": datetime.utcnow().isoformat()},
        {"text": "Garbage not collected", "timestamp": datetime.utcnow().isoformat()},
    ]
    trends = compute_trends(posts)
    test("Trends computed",     isinstance(trends, dict))
    test("Has total",           "total" in trends)
    test("Has last_1hr",        "last_1hr" in trends)
    test("Has snapshot_at",     "snapshot_at" in trends)
except Exception as e:
    test("Trend computation", False, str(e))

# -------------------------------------------------
# Test 8 - Location Extraction
# -------------------------------------------------
print("\nTest 8: Location extraction and geocoding")
try:
    result = process_community_post({
        "id":       "test_loc_001",
        "text":     "Severe waterlogging near Andheri station in Mumbai",
        "platform": "community",
        "timestamp":datetime.utcnow().isoformat(),
    })
    test("Locations extracted",  len(result["locations"]) > 0,          str([l["name"] for l in result["locations"]]))
    if result["locations"]:
        loc = result["locations"][0]
        has_coords = loc.get("lat") is not None and loc.get("lng") is not None
        test("Coordinates found",    has_coords, f"lat={loc.get('lat')} lng={loc.get('lng')}")
except Exception as e:
    test("Location extraction", False, str(e))

# -------------------------------------------------
# Final Summary
# -------------------------------------------------
print("")
print("=" * 60)
print("TEST SUMMARY")
print("=" * 60)

passed = sum(1 for _, s, _ in results if s == PASS)
failed = sum(1 for _, s, _ in results if s == FAIL)
total  = len(results)

print(f"\n  Passed : {passed}/{total}")
print(f"  Failed : {failed}/{total}")

if failed > 0:
    print("\nFailed tests:")
    for name, status, detail in results:
        if status == FAIL:
            print(f"  {name}" + (f" - {detail}" if detail else ""))

if failed == 0:
    print("\nAll tests passed. Pipeline is ready.")
else:
    print("\nSome tests failed. Check the errors above.")

print("=" * 60)
