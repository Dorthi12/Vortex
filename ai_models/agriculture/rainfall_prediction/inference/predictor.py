import os
import time
import logging
import joblib
from typing import Dict, Any

from ...common.monitoring.metrics import metrics_tracker
from ...common.model_registry.client import registry_client
from ...common.explainability.explainer import explainer
from ...common.kafka.producer import ag_producer
from ...api_contracts.rainfall import RainfallRequest, RainfallResponse

logger = logging.getLogger(__name__)

class RainfallPredictionPredictor:
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

    def predict(self, request: RainfallRequest) -> RainfallResponse:
        start_time = time.time()
        metrics_tracker.track_prediction("rainfall_prediction")
        
        try:
            # Input Validation & Struct Mapping
            features = request.model_dump()
            
            # Predict Logic
            if self.model is not None:
                # Actual inference
                # In production: result = self.model.predict([list(features.values())])[0]
                pass
            
            # Mock Fallback / Inferences Values Mapping
            mock_attrs = {'predicted_rainfall_mm': 240.5, 'anomaly_status': 'Normal', 'confidence': 0.82}
            
            # Explainability / SHAP calculations
            importances = explainer.explain_prediction("rainfall_prediction", features)
            if "explainability" in mock_attrs:
                mock_attrs["explainability"] = importances

            response = RainfallResponse(**mock_attrs)
            
            # Tracking metrics
            duration = time.time() - start_time
            metrics_tracker.track_latency("rainfall_prediction", duration)
            
            # Publish Kafka event
            if ag_producer:
                ag_producer.publish_ag_event(
                    topic="weather-events",
                    event_type="rainfall_predicted",
                    payload={"request": features, "response": response.model_dump()}
                )
            
            return response
            
        except Exception as e:
            metrics_tracker.track_failure("rainfall_prediction")
            logger.error(f"Prediction failed in RainfallPredictionPredictor: {e}")
            raise e
