import time
import logging
import datetime
from typing import Dict, Any

from ...common.monitoring.metrics import metrics_tracker
from ...common.kafka.producer import ag_producer
from ...api_contracts.advisory_agent import AdvisoryRequest, AdvisoryResponse

# Sub-module Predictors and Recommenders imports
from ...soil_health_scoring.inference.predictor import SoilHealthScoringPredictor
from ...fertilizer_recommendation.engine.recommender import FertilizerRecommender
from ...subsidy_recommendation.engine.recommender import SubsidyRecommender
from ...mandi_price_forecasting.inference.predictor import MandiPriceForecastingPredictor
from ...agricultural_risk_engine.scoring.calculator import RiskCalculator

logger = logging.getLogger(__name__)

class AdvisoryExecutor:
    def __init__(self):
        self.soil_health_predictor = SoilHealthScoringPredictor()
        self.fertilizer_recommender = FertilizerRecommender()
        self.subsidy_recommender = SubsidyRecommender()
        self.mandi_predictor = MandiPriceForecastingPredictor()
        self.risk_calculator = RiskCalculator()

    def generate_advisory(self, request: AdvisoryRequest) -> AdvisoryResponse:
        start_time = time.time()
        metrics_tracker.track_prediction("agriculture_advisory_agent")

        try:
            # 1. Run Soil Health scoring
            from ...api_contracts.soil_health import SoilHealthRequest
            sh_req = SoilHealthRequest(
                ph=request.soil_ph,
                organic_matter_percent=2.4,
                nitrogen=request.nitrogen,
                phosphorus=request.phosphorus,
                potassium=request.potassium,
                bulk_density=1.3
            )
            sh_resp = self.soil_health_predictor.predict(sh_req)

            # 2. Run Fertilizer recommendation
            from ...api_contracts.fertilizer import FertilizerRecommendRequest
            fert_req = FertilizerRecommendRequest(
                crop=request.crop,
                soil_type="Alluvial",
                nitrogen=request.nitrogen,
                phosphorus=request.phosphorus,
                potassium=request.potassium
            )
            fert_resp = self.fertilizer_recommender.recommend(fert_req)

            # 3. Run Subsidy recommendation
            from ...api_contracts.subsidy import SubsidyRequest
            subs_req = SubsidyRequest(
                state="Maharashtra",  # default state context for advisory
                farmer_category="Small",
                land_size_hectares=1.5,
                crop_type=request.crop
            )
            subs_resp = self.subsidy_recommender.evaluate(subs_req)

            # 4. Run Mandi price forecast
            from ...api_contracts.mandi_price import MandiPriceRequest
            target_date = datetime.date.today() + datetime.timedelta(days=30)
            mandi_req = MandiPriceRequest(
                market_name=f"{request.district} Mandi",
                commodity=request.crop,
                target_date=target_date
            )
            mandi_resp = self.mandi_predictor.predict(mandi_req)

            # 5. Run Risk scoring
            from ...api_contracts.risk_score import RiskRequest
            risk_req = RiskRequest(
                district=request.district,
                crop=request.crop,
                weather_risk_score=40.0,
                pest_risk_score=35.0,
                disease_risk_score=20.0,
                market_risk_score=30.0,
                yield_risk_score=25.0
            )
            risk_resp = self.risk_calculator.calculate_risk(risk_req)

            # 6. Aggregate results
            advisory_id = f"ADV-{int(start_time)}"
            
            soil_analysis = (
                f"Soil Health Score: {sh_resp.health_score} ({sh_resp.soil_class}). "
                f"Recommendations: {', '.join(sh_resp.recommendations)}"
            )
            
            subsidies_applicable = [s["scheme_name"] for s in subs_resp.eligible_schemes]
            
            market_price_outlook = (
                f"Expected price at {request.district} Mandi: INR {mandi_resp.forecasted_price_quintal}/quintal "
                f"by {target_date.isoformat()} (Confidence: {mandi_resp.confidence * 100}%)."
            )
            
            advisory_summary = (
                f"Advisory for {request.crop} in {request.district}. Soil health classification is {sh_resp.soil_class}. "
                f"Fertilizers to apply: {fert_resp.fertilizers}. Overall crop risk is {risk_resp.risk_category}."
            )

            response = AdvisoryResponse(
                advisory_id=advisory_id,
                soil_analysis=soil_analysis,
                recommended_fertilizers=fert_resp.fertilizers,
                subsidies_applicable=subsidies_applicable,
                market_price_outlook=market_price_outlook,
                overall_risk_rating=risk_resp.risk_category,
                advisory_summary=advisory_summary
            )

            # Track latency
            duration = time.time() - start_time
            metrics_tracker.track_latency("agriculture_advisory_agent", duration)

            # Publish event to Kafka
            if ag_producer:
                ag_producer.publish_ag_event(
                    topic="notifications",
                    event_type="agriculture_advisory_dispatched",
                    payload={"advisory_id": advisory_id, "crop": request.crop, "district": request.district}
                )

            return response

        except Exception as e:
            metrics_tracker.track_failure("agriculture_advisory_agent")
            logger.error(f"Advisory execution failed: {e}")
            raise e
