import time
import logging
from typing import Dict, Any, List

from ...common.monitoring.metrics import metrics_tracker
from ...common.kafka.producer import ag_producer
from ...api_contracts.risk_score import RiskRequest, RiskResponse

logger = logging.getLogger(__name__)

class RiskCalculator:
    def __init__(self):
        # Weights for composite risk score calculation
        self.weights = {
            "weather": 0.30,
            "pest": 0.15,
            "disease": 0.15,
            "market": 0.20,
            "yield": 0.20
        }

    def calculate_risk(self, request: RiskRequest) -> RiskResponse:
        start_time = time.time()
        metrics_tracker.track_prediction("agricultural_risk_engine")

        try:
            # Composite risk calculation
            composite_score = (
                request.weather_risk_score * self.weights["weather"] +
                request.pest_risk_score * self.weights["pest"] +
                request.disease_risk_score * self.weights["disease"] +
                request.market_risk_score * self.weights["market"] +
                request.yield_risk_score * self.weights["yield"]
            )

            # Map to category
            if composite_score < 30.0:
                category = "Low"
            elif composite_score < 60.0:
                category = "Medium"
            elif composite_score < 85.0:
                category = "High"
            else:
                category = "Critical"

            # Formulate mitigation strategies based on component risks
            strategies = []
            if request.weather_risk_score >= 60.0:
                strategies.append("Recommend crop insurance coverage and construct runoff drains or rain shelters.")
            if request.pest_risk_score >= 60.0:
                strategies.append("Deploy pheromone traps and prepare targeted chemical/organic insecticides.")
            if request.disease_risk_score >= 60.0:
                strategies.append("Isolate infected rows and apply recommended fungicides or systemic anti-bacterials.")
            if request.market_risk_score >= 60.0:
                strategies.append("Store produce in cold storage to delay sales, or explore MSP guarantees and e-NAM contracts.")
            if request.yield_risk_score >= 60.0:
                strategies.append("Conduct detailed soil analysis to identify micronutrient deficits and adjust irrigation schedules.")

            # Default mitigation strategies if overall risk is not Low, but no component hit >= 60
            if not strategies:
                if category == "Low":
                    strategies.append("Maintain standard agronomic practices and monitor weekly weather forecasts.")
                else:
                    strategies.append("Conduct routine inspections of crop health, soil moisture, and local mandi price updates.")

            response = RiskResponse(
                composite_risk_score=round(composite_score, 2),
                risk_category=category,
                mitigation_strategies=strategies
            )

            # Track latency
            duration = time.time() - start_time
            metrics_tracker.track_latency("agricultural_risk_engine", duration)

            # Publish Kafka event
            if ag_producer:
                ag_producer.publish_ag_event(
                    topic="hazard-alerts",
                    event_type="risk_score_calculated",
                    payload={"request": request.model_dump(), "response": response.model_dump()}
                )

            return response

        except Exception as e:
            metrics_tracker.track_failure("agricultural_risk_engine")
            logger.error(f"Agricultural risk calculation failed: {e}")
            raise e
