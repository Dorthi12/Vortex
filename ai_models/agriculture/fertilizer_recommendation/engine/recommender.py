import os
import json
import time
import logging
from typing import Dict, Any

from ...common.monitoring.metrics import metrics_tracker
from ...common.kafka.producer import ag_producer
from ...api_contracts.fertilizer import FertilizerRecommendRequest, FertilizerRecommendResponse

logger = logging.getLogger(__name__)

class FertilizerRecommender:
    def __init__(self):
        self.rules_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "rules",
            "fertilizer_rules.json"
        )
        self.rules = self._load_rules()

    def _load_rules(self) -> Dict[str, Any]:
        if os.path.exists(self.rules_path):
            try:
                with open(self.rules_path, "r") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading fertilizer rules JSON: {e}")
                return {"crops": {}}
        else:
            logger.warning(f"Fertilizer rules file not found at {self.rules_path}. Using empty fallback.")
            return {"crops": {}}

    def recommend(self, request: FertilizerRecommendRequest) -> FertilizerRecommendResponse:
        start_time = time.time()
        metrics_tracker.track_prediction("fertilizer_recommendation")

        try:
            crop_lower = request.crop.lower()
            crop_rules = self.rules.get("crops", {}).get(crop_lower)
            if not crop_rules:
                logger.info(f"Crop '{request.crop}' not found in rules. Using default rules.")
                crop_rules = self.rules.get("crops", {}).get("default", {})

            # Retrieve targets
            target_n = crop_rules.get("target_n", 80.0)
            target_p = crop_rules.get("target_p", 40.0)
            target_k = crop_rules.get("target_k", 40.0)

            # Compute deficits (mg/kg)
            deficit_n = max(0.0, target_n - request.nitrogen)
            deficit_p = max(0.0, target_p - request.phosphorus)
            deficit_k = max(0.0, target_k - request.potassium)

            # Convert deficits to fertilizer amounts in kg per acre
            # DAP is 18% N, 46% P2O5 (P source)
            # Urea is 46% N (N source)
            # MOP is 60% K2O (K source)
            
            # 1. P Source: DAP (approx conversion factor: 1 mg/kg P deficiency ~ 2.2 kg/acre DAP)
            dap_needed = deficit_p * 2.2
            
            # DAP supplies some N: 18% of DAP weight is N
            n_supplied_by_dap = dap_needed * 0.18
            
            # 2. N Source: Urea (approx conversion factor: 1 mg/kg N deficiency ~ 2.0 kg/acre Urea)
            # Adjust N deficiency by what is already supplied by DAP
            net_deficit_n = max(0.0, (deficit_n * 2.0) - n_supplied_by_dap)
            urea_needed = net_deficit_n / 0.46
            
            # 3. K Source: MOP (approx conversion factor: 1 mg/kg K deficiency ~ 1.5 kg/acre MOP)
            mop_needed = deficit_k * 1.5

            fertilizers = {
                "Urea": round(urea_needed, 1),
                "DAP": round(dap_needed, 1),
                "MOP": round(mop_needed, 1)
            }

            response = FertilizerRecommendResponse(
                crop=request.crop,
                soil_type=request.soil_type,
                fertilizers=fertilizers,
                organic_alternatives=crop_rules.get("organic_alternatives", []),
                application_schedule=crop_rules.get("schedule", [])
            )

            # Track latency metric
            duration = time.time() - start_time
            metrics_tracker.track_latency("fertilizer_recommendation", duration)

            # Publish event to Kafka
            if ag_producer:
                ag_producer.publish_ag_event(
                    topic="crop-updates",
                    event_type="fertilizer_recommended",
                    payload={"request": request.model_dump(), "response": response.model_dump()}
                )

            return response

        except Exception as e:
            metrics_tracker.track_failure("fertilizer_recommendation")
            logger.error(f"Fertilizer recommendation engine failed: {e}")
            raise e
