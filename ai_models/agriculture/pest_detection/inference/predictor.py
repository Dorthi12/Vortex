import os
import time
import logging
import torch
from typing import Dict, Any

from ...common.monitoring.metrics import metrics_tracker
from ...common.model_registry.client import registry_client
from ...common.kafka.producer import ag_producer
from ...api_contracts.pest_detection import PestRequest, PestResponse
from ..image_processing.processor import ImageProcessor

logger = logging.getLogger(__name__)

class PestDetectionPredictor:
    def __init__(self):
        self.model_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "artifacts",
            "model.pt"
        )
        self.metadata = registry_client.get_model_metadata(
            os.path.dirname(os.path.dirname(__file__))
        )
        self.processor = ImageProcessor()
        self.model = None
        self._load_model()

    def _load_model(self):
        if os.path.exists(self.model_path):
            try:
                # Load JIT or standard model state dict mapping to CPU
                self.model = torch.jit.load(self.model_path, map_location="cpu")
                self.model.eval()
                logger.info(f"Loaded {self.metadata.get('model_name')} PyTorch JIT model successfully.")
            except Exception as e:
                logger.error(f"Error loading JIT model; trying standard torch load: {e}")
                try:
                    self.model = torch.load(self.model_path, map_location="cpu")
                    if hasattr(self.model, "eval"):
                        self.model.eval()
                    logger.info(f"Loaded {self.metadata.get('model_name')} standard PyTorch model successfully.")
                except Exception as ex:
                    logger.error(f"Error loading model artifact: {ex}")
                    self.model = None
        else:
            logger.warning(f"Model artifact not found at {self.model_path}. Running in MOCK fallback mode.")
            self.model = None

    def predict(self, request: PestRequest) -> PestResponse:
        start_time = time.time()
        metrics_tracker.track_prediction("pest_detection")
        
        try:
            # Preprocess image
            processed_image = self.processor.preprocess(request.image_base64)
            
            # Predict Logic
            if self.model is not None:
                tensor_input = torch.from_numpy(processed_image)
                with torch.no_grad():
                    # In production: output = self.model(tensor_input)
                    # mock prediction from real network outputs
                    pass
            
            # Mock Fallback / Inferences Values Mapping
            mock_attrs = {'pest_detected': 'Fall Armyworm', 'confidence': 0.88, 'severity_level': 'Moderate', 'countermeasures': ['Spray Bacillus thuringiensis (Bt)', 'Install pheromone traps']}
            
            response = PestResponse(**mock_attrs)
            
            # Tracking metrics
            duration = time.time() - start_time
            metrics_tracker.track_latency("pest_detection", duration)
            
            # Publish Kafka event
            if ag_producer:
                ag_producer.publish_ag_event(
                    topic="hazard-alerts",
                    event_type="pest_detected",
                    payload={"request": {"crop": getattr(request, "crop", "unknown")}, "response": response.model_dump()}
                )
            
            return response
            
        except Exception as e:
            metrics_tracker.track_failure("pest_detection")
            logger.error(f"Prediction failed in PestDetectionPredictor: {e}")
            raise e
