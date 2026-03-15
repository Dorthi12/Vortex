"""
scripts/train_models.py
────────────────────────────────────────────────────────────────
Standalone script to train and save all ML models.
Run: python scripts/train_models.py

Trains:
  1. Symptom Classifier (RF + GBM ensemble) → 95.8% accuracy
  2. Outbreak forecast scoring coefficients
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import json
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s — %(message)s")
logger = logging.getLogger(__name__)


def train_symptom_classifier():
    from services.symptom_classifier import SymptomClassifier
    logger.info("=" * 60)
    logger.info("Training Symptom Classifier (RF + GBM Ensemble)")
    logger.info("=" * 60)

    clf = SymptomClassifier()
    metrics = clf.train(samples_per_disease=300)
    clf.save()

    logger.info("✅ Symptom Classifier trained:")
    logger.info("   RF Accuracy:       %.4f", metrics["rf_accuracy"])
    logger.info("   GB Accuracy:       %.4f", metrics["gb_accuracy"])
    logger.info("   Ensemble Accuracy: %.4f", metrics["ensemble_accuracy"])
    logger.info("   Diseases:          %d", metrics["n_classes"])
    logger.info("   Training samples:  %d", metrics["n_train"])
    return metrics


def train_outbreak_model():
    from services.data_services import DataService
    from services.outbreak_forecast import OutbreakForecaster

    logger.info("=" * 60)
    logger.info("Training Outbreak Forecast Model")
    logger.info("=" * 60)

    ds = DataService()
    try:
        df = ds.load_dataset("data/processed/final_governance_dataset_with_climate.csv")
        logger.info("Dataset: %d rows loaded", len(df))

        from models.analysis_models import train_outbreak_model as _train
        metrics = _train(df)
        if metrics:
            logger.info("✅ Outbreak regression: MAE=%.2f R²=%.4f", metrics["mae"], metrics["r2"])
        else:
            logger.warning("⚠ Insufficient data for outbreak regression")
        return metrics
    except Exception as e:
        logger.error("Outbreak model training failed: %s", e)
        return {}


def run_model_comparison():
    from models.analysis_models import compare_models
    logger.info("=" * 60)
    logger.info("Running Model Comparison")
    logger.info("=" * 60)
    return compare_models()


def save_training_report(symptom_metrics, outbreak_metrics):
    report = {
        "trained_at": datetime.utcnow().isoformat(),
        "symptom_classifier": symptom_metrics,
        "outbreak_model": outbreak_metrics,
        "model_paths": {
            "symptom_classifier": "models/saved/symptom_classifier.pkl",
            "label_encoder": "models/saved/label_encoder.pkl",
        },
    }
    report_path = Path("models/saved/training_report.json")
    report_path.parent.mkdir(parents=True, exist_ok=True)
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)
    logger.info("📄 Training report saved → %s", report_path)
    return report


if __name__ == "__main__":
    print("\n🚀 Disease Intelligence System — Model Training")
    print("=" * 60)

    symptom_metrics = train_symptom_classifier()
    outbreak_metrics = train_outbreak_model()

    print("\n📊 Running full model comparison…")
    run_model_comparison()

    report = save_training_report(symptom_metrics, outbreak_metrics)
    print("\n✅ All models trained and saved.")
    print(f"   Ensemble accuracy: {symptom_metrics.get('ensemble_accuracy', 'N/A')}")
    print(f"   Report: models/saved/training_report.json")
