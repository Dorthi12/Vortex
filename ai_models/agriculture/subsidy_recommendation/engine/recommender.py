import os
import json
import time
import logging
from typing import Dict, Any, List

from ...common.monitoring.metrics import metrics_tracker
from ...common.kafka.producer import ag_producer
from ...api_contracts.subsidy import SubsidyRequest, SubsidyResponse

logger = logging.getLogger(__name__)

class SubsidyRecommender:
    def __init__(self):
        self.knowledge_base_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "knowledge_base",
            "subsidies.json"
        )
        self.schemes = self._load_schemes()

    def _load_schemes(self) -> List[Dict[str, Any]]:
        if os.path.exists(self.knowledge_base_path):
            try:
                with open(self.knowledge_base_path, "r") as f:
                    data = json.load(f)
                    return data.get("schemes", [])
            except Exception as e:
                logger.error(f"Error loading subsidies database: {e}")
                return []
        else:
            logger.warning(f"Subsidies database not found at {self.knowledge_base_path}. Using empty fallback.")
            return []

    def evaluate(self, request: SubsidyRequest) -> SubsidyResponse:
        start_time = time.time()
        metrics_tracker.track_prediction("subsidy_recommendation")

        try:
            eligible_schemes = []
            total_benefits = 0.0
            required_docs_set = set()

            req_state = request.state.lower().strip()
            req_category = request.farmer_category.strip()
            req_land = request.land_size_hectares
            req_crop = request.crop_type.lower().strip()

            for scheme in self.schemes:
                # 1. State check
                scope = scheme.get("scope", "National")
                if scope == "State":
                    eligible_states = [s.lower() for s in scheme.get("eligible_states", [])]
                    if req_state not in eligible_states:
                        continue

                # 2. Farmer category check
                categories = scheme.get("farmer_categories", [])
                # If farmer category is not in list, skip
                # Check for case insensitivity or exact match
                if req_category not in categories:
                    # try lower/upper checks
                    matched_cat = False
                    for cat in categories:
                        if req_category.lower() == cat.lower():
                            req_category = cat
                            matched_cat = True
                            break
                    if not matched_cat:
                        continue

                # 3. Land size check
                max_land = scheme.get("max_land_hectares", 9999.0)
                if req_land > max_land:
                    continue

                # 4. Crop type check
                eligible_crops = [c.lower() for c in scheme.get("eligible_crops", [])]
                if "all" not in eligible_crops and req_crop not in eligible_crops:
                    continue

                # If all pass, calculate benefit
                calc_type = scheme.get("benefit_calculator", "fixed")
                benefit_value = 0.0

                if calc_type == "fixed":
                    benefit_value = scheme.get("benefit_rate_per_year_inr", 0.0)
                elif calc_type == "per_hectare_fixed":
                    rate = scheme.get("benefit_rate_per_hectare_inr", 0.0)
                    benefit_value = rate * req_land
                elif calc_type == "per_hectare_subsidy":
                    rate = scheme.get("benefit_rate_per_hectare_inr", 0.0)
                    subsidy_pct_map = scheme.get("rates", {})
                    pct = subsidy_pct_map.get(req_category, 0.5)
                    benefit_value = rate * req_land * pct

                eligible_schemes.append({
                    "scheme_name": scheme["name"],
                    "benefit_type": scheme["benefit_type"],
                    "calculated_benefit_inr": round(benefit_value, 2)
                })

                total_benefits += benefit_value
                for doc in scheme.get("required_documents", []):
                    required_docs_set.add(doc)

            response = SubsidyResponse(
                eligible_schemes=eligible_schemes,
                total_benefits_value_inr=round(total_benefits, 2),
                required_documents=sorted(list(required_docs_set))
            )

            # Track latency metric
            duration = time.time() - start_time
            metrics_tracker.track_latency("subsidy_recommendation", duration)

            # Publish event to Kafka
            if ag_producer:
                ag_producer.publish_ag_event(
                    topic="scheme-updates",
                    event_type="subsidy_evaluated",
                    payload={"request": request.model_dump(), "response": response.model_dump()}
                )

            return response

        except Exception as e:
            metrics_tracker.track_failure("subsidy_recommendation")
            logger.error(f"Subsidy recommender evaluation failed: {e}")
            raise e
