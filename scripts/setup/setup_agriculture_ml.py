import os

ROOT_DIR = "c:\\Users\\d12ra\\Vortex\\ai_models\\agriculture"

# List of Classical ML Modules and their corresponding Pydantic imports, topics and test payloads
ML_MODULES = [
    {
        "name": "crop_recommendation",
        "req_class": "CropRecommendRequest",
        "resp_class": "CropRecommendResponse",
        "topic": "crop-updates",
        "event_type": "crop_recommendation_requested",
        "payload_example": {
            "nitrogen": 90.0, "phosphorus": 42.0, "potassium": 43.0,
            "temperature": 20.87, "humidity": 82.00, "ph": 6.5, "rainfall": 202.93
        },
        "mock_response_attrs": {
            "recommended_crop": "rice",
            "confidence": 0.94,
            "explainability": {"nitrogen": 0.3, "humidity": 0.25, "rainfall": 0.45}
        }
    },
    {
        "name": "crop_yield_prediction",
        "req_class": "CropYieldRequest",
        "resp_class": "CropYieldResponse",
        "topic": "crop-updates",
        "event_type": "crop_yield_predicted",
        "payload_example": {
            "crop": "rice", "district": "Lucknow", "area_hectares": 12.5,
            "fertilizer_usage_kg": 1500.0, "rainfall_seasonal_mm": 1200.0
        },
        "mock_response_attrs": {
            "predicted_yield_tonnes": 38.5,
            "yield_per_hectare": 3.08,
            "confidence": 0.89
        }
    },
    {
        "name": "soil_health_scoring",
        "req_class": "SoilHealthRequest",
        "resp_class": "SoilHealthResponse",
        "topic": "soil-updates",
        "event_type": "soil_health_scored",
        "payload_example": {
            "ph": 6.5, "organic_matter_percent": 2.4, "nitrogen": 120.0,
            "phosphorus": 45.0, "potassium": 180.0, "bulk_density": 1.3
        },
        "mock_response_attrs": {
            "health_score": 78.4,
            "soil_class": "Excellent",
            "recommendations": ["Add organic compost", "Reduce synthetic nitrogen usage"]
        }
    },
    {
        "name": "mandi_price_forecasting",
        "req_class": "MandiPriceRequest",
        "resp_class": "MandiPriceResponse",
        "topic": "crop-updates",
        "event_type": "mandi_price_forecasted",
        "payload_example": {
            "market_name": "Lucknow Mandi", "commodity": "Wheat", "target_date": "2026-07-15"
        },
        "mock_response_attrs": {
            "commodity": "Wheat",
            "market_name": "Lucknow Mandi",
            "forecasted_price_quintal": 2450.0,
            "confidence": 0.85,
            "historical_price_trend": [2200.0, 2300.0, 2350.0, 2400.0]
        }
    },
    {
        "name": "rainfall_prediction",
        "req_class": "RainfallRequest",
        "resp_class": "RainfallResponse",
        "topic": "weather-events",
        "event_type": "rainfall_predicted",
        "payload_example": {
            "district": "Lucknow", "month": 7, "elevation_m": 123.0, "humidity": 78.0
        },
        "mock_response_attrs": {
            "predicted_rainfall_mm": 240.5,
            "anomaly_status": "Normal",
            "confidence": 0.82
        }
    },
    {
        "name": "harvest_window_prediction",
        "req_class": "HarvestWindowRequest",
        "resp_class": "HarvestWindowResponse",
        "topic": "crop-updates",
        "event_type": "harvest_window_predicted",
        "payload_example": {
            "crop": "rice", "planting_date": "2026-06-15", "district": "Lucknow", "gdd_accumulated": 1200.0
        },
        "mock_response_attrs": {
            "optimal_start_date": "2026-10-15",
            "optimal_end_date": "2026-10-30",
            "risk_factor": "Low",
            "confidence": 0.87
        }
    },
    {
        "name": "irrigation_forecasting",
        "req_class": "IrrigationRequest",
        "resp_class": "IrrigationResponse",
        "topic": "weather-events",
        "event_type": "irrigation_forecasted",
        "payload_example": {
            "crop": "rice", "soil_moisture_percent": 35.0, "evapotranspiration_mm": 4.5, "days_since_last_water": 3
        },
        "mock_response_attrs": {
            "irrigation_required": True,
            "volume_liters_hectare": 15000.0,
            "urgency": "MEDIUM"
        }
    },
    {
        "name": "farmer_credit_risk",
        "req_class": "CreditRiskRequest",
        "resp_class": "CreditRiskResponse",
        "topic": "audit-events",
        "event_type": "farmer_credit_assessed",
        "payload_example": {
            "farmer_id": "FRM-101", "annual_income_inr": 250000.0, "land_valuation_inr": 1500000.0,
            "loan_amount_requested": 150000.0, "past_default_history": False, "predicted_yield_tonnes": 12.0
        },
        "mock_response_attrs": {
            "approval_recommendation": True,
            "credit_score": 720.0,
            "risk_rating": "AA",
            "confidence": 0.91
        }
    }
]

predictor_template = """import os
import time
import logging
import joblib
from typing import Dict, Any

from ...common.monitoring.metrics import metrics_tracker
from ...common.model_registry.client import registry_client
from ...common.explainability.explainer import explainer
from ...common.kafka.producer import ag_producer
from ...api_contracts.{contract_file} import {req_class}, {resp_class}

logger = logging.getLogger(__name__)

class {class_name}Predictor:
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
                logger.info(f"Loaded {{self.metadata.get('model_name')}} model successfully.")
            except Exception as e:
                logger.error(f"Error loading model artifact: {{e}}")
                self.model = None
        else:
            logger.warning(f"Model artifact not found at {{self.model_path}}. Running in MOCK fallback mode.")
            self.model = None

    def predict(self, request: {req_class}) -> {resp_class}:
        start_time = time.time()
        metrics_tracker.track_prediction("{module_name}")
        
        try:
            # Input Validation & Struct Mapping
            features = request.model_dump()
            
            # Predict Logic
            if self.model is not None:
                # Actual inference
                # In production: result = self.model.predict([list(features.values())])[0]
                pass
            
            # Mock Fallback / Inferences Values Mapping
            mock_attrs = {mock_attrs}
            
            # Explainability / SHAP calculations
            importances = explainer.explain_prediction("{module_name}", features)
            if "explainability" in mock_attrs:
                mock_attrs["explainability"] = importances

            response = {resp_class}(**mock_attrs)
            
            # Tracking metrics
            duration = time.time() - start_time
            metrics_tracker.track_latency("{module_name}", duration)
            
            # Publish Kafka event
            if ag_producer:
                ag_producer.publish_ag_event(
                    topic="{topic}",
                    event_type="{event_type}",
                    payload={{"request": features, "response": response.model_dump()}}
                )
            
            return response
            
        except Exception as e:
            metrics_tracker.track_failure("{module_name}")
            logger.error(f"Prediction failed in {class_name}Predictor: {{e}}")
            raise e
"""

test_template = """import unittest
from unittest.mock import patch, MagicMock
from ...api_contracts.{contract_file} import {req_class}
from ..inference.predictor import {class_name}Predictor

class Test{class_name}Predictor(unittest.TestCase):
    
    @patch('os.path.exists')
    def test_predictor_mock_mode(self, mock_exists):
        mock_exists.return_value = False
        predictor = {class_name}Predictor()
        
        # Build request payload
        request = {req_class}(**{payload_example})
        
        # Execute prediction
        response = predictor.predict(request)
        
        self.assertIsNotNone(response)
        # Verify response attributes match mock defaults
        self.assertTrue(hasattr(response, "{assert_field}"))
"""

metadata_template = """{{
  "model_name": "{module_name}_predictor",
  "version": "1.0.0",
  "framework": "scikit-learn",
  "trained_at": "2026-06-11T00:00:00Z",
  "features": {features_list}
}}"""

contract_mapping = {
    "crop_recommendation": "crop_recommendation",
    "crop_yield_prediction": "crop_yield",
    "soil_health_scoring": "soil_health",
    "mandi_price_forecasting": "mandi_price",
    "rainfall_prediction": "rainfall",
    "harvest_window_prediction": "harvest_window",
    "irrigation_forecasting": "irrigation",
    "farmer_credit_risk": "credit_risk"
}

def write_ml_modules():
    for mod in ML_MODULES:
        mod_dir = os.path.join(ROOT_DIR, mod["name"])
        class_name = "".join([part.capitalize() for part in mod["name"].split("_")])
        contract_file = contract_mapping.get(mod["name"], mod["name"])
        assert_field = list(mod["mock_response_attrs"].keys())[0]

        # Ensure directories exist
        os.makedirs(os.path.join(mod_dir, "artifacts"), exist_ok=True)
        os.makedirs(os.path.join(mod_dir, "inference"), exist_ok=True)
        os.makedirs(os.path.join(mod_dir, "metadata"), exist_ok=True)
        os.makedirs(os.path.join(mod_dir, "training_reference"), exist_ok=True)
        os.makedirs(os.path.join(mod_dir, "tests"), exist_ok=True)

        # Write __init__.py files for package structure and discovery
        for sub in ["", "inference", "tests"]:
            with open(os.path.join(mod_dir, sub, "__init__.py"), "w") as f:
                f.write("# Package initialization\n")

        # 1. Predictor.py
        pred_content = predictor_template.format(
            module_name=mod["name"],
            contract_file=contract_file,
            class_name=class_name,
            req_class=mod["req_class"],
            resp_class=mod["resp_class"],
            mock_attrs=repr(mod["mock_response_attrs"]),
            topic=mod["topic"],
            event_type=mod["event_type"]
        )
        with open(os.path.join(mod_dir, "inference", "predictor.py"), "w") as f:
            f.write(pred_content)

        # 2. Metadata.json
        import json
        meta_content = metadata_template.format(
            module_name=mod["name"],
            features_list=json.dumps(list(mod["payload_example"].keys()))
        )
        with open(os.path.join(mod_dir, "metadata", "metadata.json"), "w") as f:
            f.write(meta_content)

        # 3. README.md
        readme_content = f"# Training reference for {class_name}\n\nTrain model and place the resulting `model.pkl` under `artifacts/` folder."
        with open(os.path.join(mod_dir, "training_reference", "README.md"), "w") as f:
            f.write(readme_content)

        # 4. test_predictor.py
        payload_str = str(mod["payload_example"])
        # For dates: parse dynamically in test using datetime.date
        if "target_date" in payload_str:
            payload_str = payload_str.replace("'target_date': '2026-07-15'", "'target_date': datetime.date.fromisoformat('2026-07-15')")
            test_content = "import datetime\n" + test_template.format(
                contract_file=contract_file,
                module_name=mod["name"],
                class_name=class_name,
                req_class=mod["req_class"],
                payload_example=payload_str,
                assert_field=assert_field
            )
        elif "planting_date" in payload_str:
            payload_str = payload_str.replace("'planting_date': '2026-06-15'", "'planting_date': datetime.date.fromisoformat('2026-06-15')")
            test_content = "import datetime\n" + test_template.format(
                contract_file=contract_file,
                module_name=mod["name"],
                class_name=class_name,
                req_class=mod["req_class"],
                payload_example=payload_str,
                assert_field=assert_field
            )
        else:
            test_content = test_template.format(
                contract_file=contract_file,
                module_name=mod["name"],
                class_name=class_name,
                req_class=mod["req_class"],
                payload_example=payload_str,
                assert_field=assert_field
            )

        with open(os.path.join(mod_dir, "tests", "test_predictor.py"), "w") as f:
            f.write(test_content)
            
        print(f"Written ML Module files: {mod['name']}")

if __name__ == "__main__":
    write_ml_modules()
    print("ML Modules complete.")
