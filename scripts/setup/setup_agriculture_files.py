import os

ROOT_DIR = "c:\\Users\\d12ra\\Vortex\\ai_models\\agriculture"

# ==========================================
# WRITE COMMON MODULES
# ==========================================

common_files = {
    "common/kafka/producer.py": '''import logging
from typing import Dict, Any, Optional
from infrastructure.kafka.producers.base import BaseProducer
from infrastructure.kafka.schemas.events import EventEnvelope

logger = logging.getLogger(__name__)

class AgProducer(BaseProducer):
    """Producer for publishing agriculture-related events."""
    
    def publish_ag_event(self, topic: str, event_type: str, payload: Dict[str, Any], key: Optional[str] = None) -> bool:
        event = EventEnvelope(
            event_type=event_type,
            source="agriculture_intelligence",
            payload=payload
        )
        logger.info(f"Publishing {event_type} to topic {topic}")
        return self.produce(topic=topic, event=event, key=key)

# Singleton producer
ag_producer = None
try:
    ag_producer = AgProducer()
except Exception as e:
    logger.warning(f"Could not initialize AgProducer on start (Kafka broker down): {e}")
''',

    "common/monitoring/metrics.py": '''import time
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
''',

    "common/explainability/explainer.py": '''import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class ModelExplainer:
    """Provides SHAP/LIME feature contributions placeholders."""
    
    def explain_prediction(self, model_name: str, features: Dict[str, Any]) -> Dict[str, float]:
        logger.info(f"Calculating SHAP values for model '{model_name}'...")
        # Placeholder feature importance
        return {k: 0.1 for k in features.keys()}

explainer = ModelExplainer()
''',

    "common/model_registry/client.py": '''import os
import json
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class ModelRegistryClient:
    """Manages model loading metadata and versions."""
    
    def get_model_metadata(self, module_path: str) -> Dict[str, Any]:
        metadata_file = os.path.join(module_path, "metadata", "metadata.json")
        if os.path.exists(metadata_file):
            try:
                with open(metadata_file, "r") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading model metadata: {e}")
        return {"model_name": "unknown", "version": "0.0.0"}

registry_client = ModelRegistryClient()
''',

    "common/feature_store/client.py": '''import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class FeatureStoreClient:
    """Mock feature store client to fetch real-time crop/soil/weather metrics."""
    
    def get_district_features(self, district: str) -> Dict[str, Any]:
        logger.info(f"Fetching historical feature store metrics for '{district}'...")
        return {
            "soil_ph": 6.5,
            "organic_matter": 2.4,
            "historical_rainfall_mean": 1150.0,
            "nitrogen_avg": 120.0,
            "phosphorus_avg": 45.0,
            "potassium_avg": 180.0
        }

feature_store = FeatureStoreClient()
'''
}

# ==========================================
# WRITE API CONTRACTS (Pydantic Models)
# ==========================================

api_contracts = {
    "api_contracts/crop_recommendation.py": '''from pydantic import BaseModel, Field

class CropRecommendRequest(BaseModel):
    nitrogen: float = Field(..., ge=0, description="Nitrogen content in soil (mg/kg)")
    phosphorus: float = Field(..., ge=0, description="Phosphorus content in soil (mg/kg)")
    potassium: float = Field(..., ge=0, description="Potassium content in soil (mg/kg)")
    temperature: float = Field(..., description="Temperature in Celsius")
    humidity: float = Field(..., ge=0, le=100, description="Relative humidity percentage")
    ph: float = Field(..., ge=0, le=14, description="pH value of the soil")
    rainfall: float = Field(..., ge=0, description="Rainfall in mm")

class CropRecommendResponse(BaseModel):
    recommended_crop: str = Field(..., description="Optimally recommended crop")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score of prediction")
    explainability: dict = Field(default_factory=dict, description="SHAP feature importances")
''',

    "api_contracts/crop_yield.py": '''from pydantic import BaseModel, Field

class CropYieldRequest(BaseModel):
    crop: str = Field(..., description="Crop name")
    district: str = Field(..., description="District name")
    area_hectares: float = Field(..., ge=0.01, description="Land area in hectares")
    fertilizer_usage_kg: float = Field(..., ge=0, description="Total fertilizer used in kg")
    rainfall_seasonal_mm: float = Field(..., ge=0, description="Seasonal rainfall in mm")

class CropYieldResponse(BaseModel):
    predicted_yield_tonnes: float = Field(..., ge=0.0, description="Predicted crop yield in metric tonnes")
    yield_per_hectare: float = Field(..., description="Tonnes per hectare")
    confidence: float = Field(..., ge=0.0, le=1.0)
''',

    "api_contracts/fertilizer.py": '''from pydantic import BaseModel, Field

class FertilizerRecommendRequest(BaseModel):
    crop: str = Field(..., description="Crop name")
    soil_type: str = Field(..., description="E.g., Clayey, Sandy, Loamy, Alluvial")
    nitrogen: float = Field(..., description="Soil Nitrogen level (mg/kg)")
    phosphorus: float = Field(..., description="Soil Phosphorus level (mg/kg)")
    potassium: float = Field(..., description="Soil Potassium level (mg/kg)")

class FertilizerRecommendResponse(BaseModel):
    crop: str
    soil_type: str
    fertilizers: dict = Field(..., description="DOSAGE mapping (Urea, DAP, MOP in kg/acre)")
    organic_alternatives: list = Field(default_factory=list)
    application_schedule: list = Field(default_factory=list)
''',

    "api_contracts/soil_health.py": '''from pydantic import BaseModel, Field

class SoilHealthRequest(BaseModel):
    ph: float = Field(..., ge=0, le=14)
    organic_matter_percent: float = Field(..., ge=0, le=100)
    nitrogen: float = Field(..., ge=0)
    phosphorus: float = Field(..., ge=0)
    potassium: float = Field(..., ge=0)
    bulk_density: float = Field(..., ge=0, description="g/cm3")

class SoilHealthResponse(BaseModel):
    health_score: float = Field(..., ge=0.0, le=100.0, description="Composite health index")
    soil_class: str = Field(..., description="E.g., Excellent, Good, Degraded, Critical")
    recommendations: list = Field(default_factory=list)
''',

    "api_contracts/mandi_price.py": '''from pydantic import BaseModel, Field
from datetime import date

class MandiPriceRequest(BaseModel):
    market_name: str = Field(..., description="Mandi market place")
    commodity: str = Field(..., description="Commodity name")
    target_date: date = Field(..., description="Future date to forecast")

class MandiPriceResponse(BaseModel):
    commodity: str
    market_name: str
    forecasted_price_quintal: float = Field(..., ge=0.0, description="Price in INR per Quintal (100kg)")
    confidence: float
    historical_price_trend: list = Field(default_factory=list)
''',

    "api_contracts/rainfall.py": '''from pydantic import BaseModel, Field

class RainfallRequest(BaseModel):
    district: str
    month: int = Field(..., ge=1, le=12)
    elevation_m: float
    humidity: float

class RainfallResponse(BaseModel):
    predicted_rainfall_mm: float = Field(..., ge=0.0)
    anomaly_status: str = Field(..., description="Normal, Deficit, Excess")
    confidence: float
''',

    "api_contracts/harvest_window.py": '''from pydantic import BaseModel, Field
from datetime import date

class HarvestWindowRequest(BaseModel):
    crop: str
    planting_date: date
    district: str
    gdd_accumulated: float = Field(..., ge=0, description="Growing Degree Days accumulated")

class HarvestWindowResponse(BaseModel):
    optimal_start_date: date
    optimal_end_date: date
    risk_factor: str = Field(..., description="Low, Medium, High (e.g. frost risk, monsoon overlay)")
    confidence: float
''',

    "api_contracts/irrigation.py": '''from pydantic import BaseModel, Field

class IrrigationRequest(BaseModel):
    crop: str
    soil_moisture_percent: float = Field(..., ge=0, le=100)
    evapotranspiration_mm: float = Field(..., ge=0)
    days_since_last_water: int = Field(..., ge=0)

class IrrigationResponse(BaseModel):
    irrigation_required: bool
    volume_liters_hectare: float = Field(..., ge=0.0)
    urgency: str = Field(..., description="LOW, MEDIUM, HIGH, IMMEDIATE")
''',

    "api_contracts/disease_detection.py": '''from pydantic import BaseModel, Field

class DiseaseRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded string of crop leaf image")
    crop: str = Field("unknown", description="Optional crop filter context")

class DiseaseResponse(BaseModel):
    disease_detected: str = Field(..., description="Name of detected disease or 'Healthy'")
    confidence: float = Field(..., ge=0.0, le=1.0)
    treatment_advisory: list = Field(default_factory=list)
''',

    "api_contracts/pest_detection.py": '''from pydantic import BaseModel, Field

class PestRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded leaf/insect image")

class PestResponse(BaseModel):
    pest_detected: str = Field(..., description="Name of detected pest")
    confidence: float = Field(..., ge=0.0, le=1.0)
    severity_level: str = Field(..., description="E.g., Low, Moderate, Severe outbreak")
    countermeasures: list = Field(default_factory=list)
''',

    "api_contracts/nutrient_deficiency.py": '''from pydantic import BaseModel, Field

class NutrientDeficiencyRequest(BaseModel):
    image_base64: str = Field(...)

class NutrientDeficiencyResponse(BaseModel):
    deficiency_detected: str = Field(..., description="E.g., Nitrogen, Potassium, Iron deficiency, or None")
    confidence: float
    corrective_actions: list = Field(default_factory=list)
''',

    "api_contracts/growth_stage.py": '''from pydantic import BaseModel, Field

class GrowthStageRequest(BaseModel):
    image_base64: str
    crop: str

class GrowthStageResponse(BaseModel):
    detected_stage: str = Field(..., description="E.g., Germination, Vegetative, Flowering, Maturity")
    confidence: float
    growth_index: float = Field(..., description="Normalized stage score between 0.0 and 1.0")
''',

    "api_contracts/subsidy.py": '''from pydantic import BaseModel, Field

class SubsidyRequest(BaseModel):
    state: str
    farmer_category: str = Field(..., description="Small, Marginal, Large, SC/ST, Woman")
    land_size_hectares: float = Field(..., ge=0)
    crop_type: str

class SubsidyResponse(BaseModel):
    eligible_schemes: list = Field(default_factory=list, description="Array of subsidy details")
    total_benefits_value_inr: float = Field(..., ge=0)
    required_documents: list = Field(default_factory=list)
''',

    "api_contracts/risk_score.py": '''from pydantic import BaseModel, Field

class RiskRequest(BaseModel):
    district: str
    crop: str
    weather_risk_score: float = Field(..., ge=0, le=100)
    pest_risk_score: float = Field(..., ge=0, le=100)
    disease_risk_score: float = Field(..., ge=0, le=100)
    market_risk_score: float = Field(..., ge=0, le=100)
    yield_risk_score: float = Field(..., ge=0, le=100)

class RiskResponse(BaseModel):
    composite_risk_score: float = Field(..., ge=0.0, le=100.0)
    risk_category: str = Field(..., description="Low, Medium, High, Critical")
    mitigation_strategies: list = Field(default_factory=list)
''',

    "api_contracts/credit_risk.py": '''from pydantic import BaseModel, Field

class CreditRiskRequest(BaseModel):
    farmer_id: str
    annual_income_inr: float = Field(..., ge=0)
    land_valuation_inr: float = Field(..., ge=0)
    loan_amount_requested: float = Field(..., ge=0)
    past_default_history: bool = Field(...)
    predicted_yield_tonnes: float = Field(..., ge=0)

class CreditRiskResponse(BaseModel):
    approval_recommendation: bool
    credit_score: float = Field(..., ge=300.0, le=900.0)
    risk_rating: str = Field(..., description="AAA, AA, A, B, C, D")
    confidence: float
''',

    "api_contracts/rag.py": '''from pydantic import BaseModel, Field

class RagQueryRequest(BaseModel):
    query: str = Field(..., description="Natural language question from farmer/expert")
    vector_database: str = Field("Qdrant", description="Vector storage backend: Qdrant or FAISS")

class RagQueryResponse(BaseModel):
    answer: str = Field(..., description="Generated answer with domain relevance")
    citations: list = Field(default_factory=list, description="List of source document citations")
''',

    "api_contracts/farmer_agent.py": '''from pydantic import BaseModel, Field

class FarmerAgentRequest(BaseModel):
    audio_base64: Optional[str] = Field(None, description="STT input audio base64")
    text_input: Optional[str] = Field(None, description="Text input if no audio")
    input_language: str = Field("Hindi", description="Hindi, Tamil, Telugu, Marathi, Bengali, English")
    output_channel: str = Field("text", description="text or audio")

class FarmerAgentResponse(BaseModel):
    translated_query: str
    agent_text_response: str
    audio_response_base64: Optional[str] = None
    resolved_language: str
''',

    "api_contracts/advisory_agent.py": '''from pydantic import BaseModel, Field

class AdvisoryRequest(BaseModel):
    district: str
    crop: str
    soil_ph: float
    nitrogen: float
    phosphorus: float
    potassium: float

class AdvisoryResponse(BaseModel):
    advisory_id: str
    soil_analysis: str
    recommended_fertilizers: dict
    subsidies_applicable: list
    market_price_outlook: str
    overall_risk_rating: str
    advisory_summary: str
'''
}

def write_files():
    # Write Common Files
    for filename, content in common_files.items():
        filepath = os.path.join(ROOT_DIR, filename)
        with open(filepath, "w") as f:
            f.write(content)
        print(f"Written: {filename}")

    # Write API Contracts
    for filename, content in api_contracts.items():
        filepath = os.path.join(ROOT_DIR, filename)
        with open(filepath, "w") as f:
            f.write(content)
        print(f"Written: {filename}")

if __name__ == "__main__":
    write_files()
    print("Base files generation complete.")
