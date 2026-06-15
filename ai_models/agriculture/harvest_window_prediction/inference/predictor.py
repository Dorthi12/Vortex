import os
import time
import logging
import joblib
from typing import Dict, Any

from ...common.monitoring.metrics import metrics_tracker
from ...common.model_registry.client import registry_client
from ...common.explainability.explainer import explainer
from ...common.kafka.producer import ag_producer
from ...api_contracts.harvest_window import HarvestWindowRequest, HarvestWindowResponse

logger = logging.getLogger(__name__)

class HarvestWindowPredictionPredictor:
    def __init__(self):
        self.model_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "artifacts",
            "model.pkl"
        )
        self.metadata = registry_client.get_model_metadata(
            os.path.dirname(os.path.dirname(__file__))
        )
        self.model = None
        self._load_model()

    def _load_model(self):
        if os.path.exists(self.model_path):
            try:
                self.model = joblib.load(self.model_path)
                logger.info(f"Loaded {self.metadata.get('model_name')} model successfully.")
            except Exception as e:
                logger.error(f"Error loading model artifact: {e}")
                self.model = None
        else:
            logger.warning(f"Model artifact not found at {self.model_path}. Running in MOCK fallback mode.")
            self.model = None

    def predict(self, request: HarvestWindowRequest) -> HarvestWindowResponse:
        start_time = time.time()
        metrics_tracker.track_prediction("harvest_window_prediction")
        
        try:
            # Input Validation & Struct Mapping
            features = request.model_dump()
            
            # Predict Logic
            if self.model is not None:
                # Actual inference
                # In production: result = self.model.predict([list(features.values())])[0]
                pass
            
            # Mock Fallback / Inferences Values Mapping
            mock_attrs = {'optimal_start_date': '2026-10-15', 'optimal_end_date': '2026-10-30', 'risk_factor': 'Low', 'confidence': 0.87}
            
            # Explainability / SHAP calculations
            importances = explainer.explain_prediction("harvest_window_prediction", features)
            if "explainability" in mock_attrs:
                mock_attrs["explainability"] = importances

            response = HarvestWindowResponse(**mock_attrs)
            
            # Tracking metrics
            duration = time.time() - start_time
            metrics_tracker.track_latency("harvest_window_prediction", duration)
            
            # Publish Kafka event
            if ag_producer:
                ag_producer.publish_ag_event(
                    topic="crop-updates",
                    event_type="harvest_window_predicted",
                    payload={"request": features, "response": response.model_dump()}
                )
            
            return response
            
        except Exception as e:
            metrics_tracker.track_failure("harvest_window_prediction")
            logger.error(f"Prediction failed in HarvestWindowPredictionPredictor: {e}")
            raise e
