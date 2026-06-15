# health/services/outbreak_prediction_service.py
import pickle
import os
import numpy as np
from typing import List, Dict, Any

class OutbreakPredictionService:
    model_path = "c:/Users/d12ra/Vortex/health/models/outbreak_model.pkl"
    
    def __init__(self):
        self.model = None
        self._load_model()

    def _load_model(self):
        if os.path.exists(self.model_path):
            try:
                with open(self.model_path, "rb") as f:
                    self.model = pickle.load(f)
                print("[OK] Outbreak prediction model loaded successfully.")
            except Exception as e:
                print(f"[ERROR] Failed to load outbreak model: {e}")
        else:
            print(f"[WARNING] Model file {self.model_path} not found. Please run the training script.")

    def predict(
        self,
        disease: str,
        disease_reports: int,
        historical_outbreaks: int,
        temperature: float,
        humidity: float,
        rainfall: float,
        sanitation_index: float,
        population_density: float
    ) -> Dict[str, Any]:
        """
        Run inference using the pickled RandomForestRegressor.
        """
        # If model is not loaded, use a deterministic mock formula
        if self.model is None:
            # Re-try loading in case it was created after initialization
            self._load_model()
            
        if self.model is not None:
            # Inputs must be scaled/normalized or passed directly as training was done on [0, 1] range.
            # Since the model was fit on a dummy [0, 1] matrix, we scale features to realistic [0, 1] ranges for inference.
            # Normalization bounds:
            reports_norm = min(disease_reports / 500.0, 1.0)
            historical_norm = min(historical_outbreaks / 20.0, 1.0)
            temp_norm = min(max(temperature / 45.0, 0.0), 1.0)
            humidity_norm = humidity / 100.0
            rainfall_norm = min(rainfall / 500.0, 1.0)
            # Sanitation index and population density are already ratio-based (density normalized below)
            density_norm = min(population_density / 10000.0, 1.0)
            
            features = np.array([[
                reports_norm,
                historical_norm,
                temp_norm,
                humidity_norm,
                rainfall_norm,
                sanitation_index,
                density_norm
            ]])
            
            prob = float(self.model.predict(features)[0])
        else:
            # Fallback mathematical formula
            prob = (
                (disease_reports * 0.002) +
                (historical_outbreaks * 0.03) +
                (temperature * 0.005) +
                (humidity * 0.002) +
                (rainfall * 0.001) -
                (sanitation_index * 0.2) +
                (population_density * 0.00005)
            )
            prob = min(max(prob, 0.0), 1.0)

        # Map outbreak probability to category
        if prob < 0.35:
            category = "LOW"
        elif prob < 0.6:
            category = "MEDIUM"
        elif prob < 0.8:
            category = "HIGH"
        else:
            category = "CRITICAL"

        # Expected growth calculation
        expected_growth = round(disease_reports * prob * 1.5, 2)
        
        # Determine affected wards based on category
        wards_list = ["Ward 1A", "Ward 2B", "Ward 3C", "Ward 4D", "Ward 5E"]
        if category == "CRITICAL":
            affected_count = 4
        elif category == "HIGH":
            affected_count = 3
        elif category == "MEDIUM":
            affected_count = 2
        else:
            affected_count = 1
        
        affected_wards = wards_list[:affected_count]
        
        # Confidence score mapping
        conf = round(0.95 - (abs(prob - 0.5) * 0.1), 3)

        return {
            "disease": disease,
            "outbreak_probability": round(prob, 3),
            "risk_category": category,
            "confidence_score": conf,
            "expected_case_growth": expected_growth,
            "affected_wards": affected_wards
        }

outbreak_predict_service = OutbreakPredictionService()
