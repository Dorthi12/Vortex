import time
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

# Basic Mock Prometheus/Evidently Metrics for local/dev tracking
class AgMetricsTracker:
    def __init__(self):
        self.prediction_counts = {}
        self.failures = {}
        self.latencies = {}

    def track_prediction(self, model_name: str):
        self.prediction_counts[model_name] = self.prediction_counts.get(model_name, 0) + 1

    def track_failure(self, model_name: str):
        self.failures[model_name] = self.failures.get(model_name, 0) + 1

    def track_latency(self, model_name: str, duration: float):
        if model_name not in self.latencies:
            self.latencies[model_name] = []
        self.latencies[model_name].append(duration)

    def check_drift(self, model_name: str, reference_data: Any, current_data: Any) -> Dict[str, Any]:
        logger.info(f"Checking data drift for {model_name} via Evidently placeholder...")
        return {
            "model_name": model_name,
            "drift_detected": False,
            "drift_score": 0.04
        }

metrics_tracker = AgMetricsTracker()
