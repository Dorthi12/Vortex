# backend/models/infrastructure/model_loader.py
import os
import pickle
import logging

logger = logging.getLogger("infrastructure_model_loader")

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))

# Map model names to filenames
MODELS = {
    "road_damage_model": "road_damage_model.pkl",
    "bridge_risk_model": "bridge_risk_model.pkl",
    "dam_forecast_model": "dam_forecast_model.pkl",
    "grid_failure_model": "grid_failure_model.pkl",
    "traffic_forecast_model": "traffic_forecast_model.pkl",
    "asset_failure_model": "asset_failure_model.pkl"
}

_LOADED_MODELS = {}

def load_model(model_name: str):
    """
    Safely load a model pickle file from the models directory.
    If the file does not exist, returns None and uses fallback mock logic.
    """
    if model_name not in MODELS:
        logger.error(f"Unknown model name: {model_name}")
        return None

    if model_name in _LOADED_MODELS:
        return _LOADED_MODELS[model_name]

    model_path = os.path.join(MODEL_DIR, MODELS[model_name])
    if not os.path.exists(model_path):
        logger.warning(f"Model file not found at {model_path}. Fallback mock estimator will be used.")
        return None

    try:
        with open(model_path, "rb") as f:
            model = pickle.load(f)
            _LOADED_MODELS[model_name] = model
            logger.info(f"Successfully loaded model: {model_name}")
            return model
    except Exception as e:
        logger.error(f"Error loading model {model_name} from {model_path}: {e}")
        return None

def predict(model_name: str, inputs: dict) -> dict:
    """
    Generate inference predictions using the loaded model or its fallback logic.
    """
    model = load_model(model_name)
    
    # Standard fallback simulation values if model files are empty or missing
    if model is None:
        if model_name == "road_damage_model":
            return {
                "damage_type": "Severe Potholes / Raveling",
                "severity": "critical" if inputs.get("traffic_load", 50) > 75 else "high",
                "estimated_repair_cost": float(inputs.get("pothole_count", 5) * 4500),
                "failure_probability": min(1.0, float(inputs.get("traffic_load", 50) * 0.01 + 0.15))
            }
        elif model_name == "bridge_risk_model":
            vibration = inputs.get("vibration_hz", 5.0)
            corrosion = inputs.get("corrosion_rate_index", 2.0)
            failure_prob = min(0.99, (vibration * 0.08 + corrosion * 0.15))
            return {
                "failure_probability": float(round(failure_prob, 3)),
                "remaining_useful_life_years": max(1, int(15 - corrosion * 2)),
                "recommended_inspection_days": max(7, int(365 * (1.0 - failure_prob)))
            }
        elif model_name == "dam_forecast_model":
            inflow = inputs.get("inflow_cusecs", 15000.0)
            outflow = inputs.get("outflow_cusecs", 12000.0)
            return {
                "forecast_24h_meters": float(inputs.get("water_level_meters", 75.0) + (inflow - outflow) * 0.0001),
                "forecast_48h_meters": float(inputs.get("water_level_meters", 75.0) + (inflow - outflow) * 0.0002),
                "forecast_72h_meters": float(inputs.get("water_level_meters", 75.0) + (inflow - outflow) * 0.0003),
                "risk_state": "critical" if inflow > 40000 else "watch" if inflow > 25000 else "safe"
            }
        elif model_name == "grid_failure_model":
            peak_load = inputs.get("peak_load_mva", 80.0)
            substation_load = inputs.get("substation_load_mva", 65.0)
            risk = min(1.0, (substation_load / peak_load) ** 2)
            return {
                "risk_percent": float(round(risk * 100, 2)),
                "likely_cause": "Transformer Thermal Overload" if risk > 0.8 else "Vegetation Intrusion / Transient fault",
                "impact_radius_km": float(round(risk * 4.5, 2))
            }
        elif model_name == "traffic_forecast_model":
            base_count = inputs.get("vehicle_count", 500)
            closures = len(inputs.get("road_closures", []))
            congestion = min(100, (base_count / 10) + (closures * 20))
            return {
                "congestion_score": float(round(congestion, 2)),
                "predicted_hotspots": ["Sangamwadi Highway", "Hadapsar Bypass"] if congestion > 65 else ["Yerawada Causeway"]
            }
        elif model_name == "asset_failure_model":
            health = inputs.get("health_score", 80)
            risk = inputs.get("risk_score", 20)
            fail_prob = (100 - health) * 0.007 + risk * 0.003
            return {
                "failure_probability": float(round(min(1.0, max(0.0, fail_prob)), 3)),
                "health_trend": "stable" if health > 75 else "deteriorating"
            }

    # If model is loaded, execute standard model inference:
    try:
        # Standard pickle ML inference pipeline
        prediction = model.predict(inputs)
        return prediction
    except Exception as e:
        logger.error(f"Inference error with model {model_name}: {e}")
        return {"error": str(e)}

def health_check() -> dict:
    """
    Reports the status of the infrastructure AI model files.
    """
    status = {}
    for name, filename in MODELS.items():
        path = os.path.join(MODEL_DIR, filename)
        status[name] = {
            "loaded": name in _LOADED_MODELS,
            "file_exists": os.path.exists(path),
            "file_path": path
        }
    return status
