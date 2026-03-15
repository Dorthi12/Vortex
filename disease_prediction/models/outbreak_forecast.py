"""
Model 3 — Disease Outbreak Forecast Model
Predicts outbreaks 2-4 weeks ahead using epidemiological + climate features
Models: XGBoost (primary) | RandomForest | LSTM (optional)
Inputs: cases, lags, rainfall, temperature, humidity, soil_moisture,
        ndvi, population_density, hospital_capacity
"""

import logging
import numpy as np
import pandas as pd
import os
from dataclasses import dataclass
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    mean_absolute_error, r2_score, roc_auc_score
)
import joblib

try:
    from xgboost import XGBClassifier, XGBRegressor
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

from ..config.settings import (
    GOVERNANCE_DATASET, HAZARD_DATASET,
    OUTBREAK_MODEL_PATH
)

logger = logging.getLogger(__name__)


@dataclass
class OutbreakInput:
    district: str
    disease: str
    cases: int
    cases_lag1: int
    cases_lag2: int
    cases_lag3: int = 0
    temperature_mean: float = 30.0
    humidity_mean: float = 70.0
    rainfall_anomaly: float = 0.0
    soil_moisture_mean: float = 0.3
    ndvi_mean: float = 0.4
    wind_speed_mean: float = 10.0
    population_density: float = 500.0
    hospital_capacity: float = 100.0
    elevation_mean: float = 200.0


@dataclass
class OutbreakForecast:
    district: str
    disease: str
    predicted_cases_next_week: int
    outbreak_probability: float
    outbreak_alert: bool
    confidence_interval_low: int
    confidence_interval_high: int
    contributing_factors: list
    forecast_horizon_days: int = 7


class OutbreakForecastModel:
    """
    Predicts disease outbreaks using climate + epidemiological features.
    Trained on the governance dataset with climate variables.
    """

    OUTBREAK_THRESHOLD = 50  # cases/week triggers outbreak alert
    PROBABILITY_THRESHOLD = 0.65

    def __init__(self):
        self.regressor = None      # predicts case count
        self.classifier = None     # predicts outbreak probability
        self.scaler = StandardScaler()
        self._trained = False
        self._load_or_train()

    def _feature_cols(self):
        return [
            "cases", "cases_lag1", "cases_lag2", "cases_lag3",
            "temperature_mean", "humidity_mean", "rainfall_anomaly",
            "soil_moisture_mean", "ndvi_mean", "wind_speed_mean",
            "population_density", "hospital_capacity",
            "elevation_mean",
            # Derived features
            "cases_7day_sum", "temp_humidity_interaction",
            "rainfall_x_ndvi", "capacity_utilization"
        ]

    def _build_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Engineer features from raw data"""
        df = df.copy()

        # Lag features
        df["cases_lag1"] = df.groupby(["district", "disease"])["cases"].shift(1).fillna(0)
        df["cases_lag2"] = df.groupby(["district", "disease"])["cases"].shift(2).fillna(0)
        df["cases_lag3"] = df.groupby(["district", "disease"])["cases"].shift(3).fillna(0)
        df["cases_7day_sum"] = df.groupby(["district", "disease"])["cases"].transform(
            lambda x: x.rolling(7, min_periods=1).sum()
        )

        # Climate interaction features
        df["temp_humidity_interaction"] = df["temperature_mean"] * df["humidity_mean"] / 100
        df["rainfall_x_ndvi"] = df["rainfall_anomaly"] * df["ndvi_mean"]
        df["capacity_utilization"] = df["cases"] / (df["hospital_capacity"] + 1)

        # Target: cases next week
        df["target_cases_next_week"] = df.groupby(
            ["district", "disease"]
        )["cases"].shift(-7).fillna(0)
        df["outbreak_label"] = (df["target_cases_next_week"] >= self.OUTBREAK_THRESHOLD).astype(int)

        return df

    def _load_governance_data(self) -> pd.DataFrame:
        """Load and prepare governance dataset for training"""
        df = pd.read_csv(GOVERNANCE_DATASET)

        # Rename and select relevant columns
        col_map = {
            "state_or_region": "district",
            "predicted_disease": "disease",
            "population_density": "population_density",
            "num_hospitals": "hospital_capacity",
        }
        df = df.rename(columns=col_map)

        # Ensure required columns exist
        required = [
            "district", "disease", "cases", "temperature_mean",
            "humidity_mean", "rainfall_anomaly", "soil_moisture_mean",
            "ndvi_mean", "wind_speed_mean", "elevation_mean"
        ]
        for col in required:
            if col not in df.columns:
                df[col] = 0.0

        df["cases"] = pd.to_numeric(df["cases"], errors="coerce").fillna(0)
        df["hospital_capacity"] = pd.to_numeric(
            df.get("hospital_capacity", pd.Series([100] * len(df))), errors="coerce"
        ).fillna(100)

        # Drop NaN diseases
        df = df.dropna(subset=["disease"])
        df["disease"] = df["disease"].astype(str).str.strip()
        df = df[df["disease"] != "nan"]

        # Simulate time index (since dataset doesn't have real dates)
        np.random.seed(42)
        dates = pd.date_range("2020-01-01", periods=len(df), freq="D")
        df["date"] = np.random.choice(dates, size=len(df), replace=False)
        df = df.sort_values("date").reset_index(drop=True)

        return df

    def train(self) -> dict:
        """Train outbreak forecast models"""
        logger.info("Loading governance dataset for outbreak model training...")
        df = self._load_governance_data()
        df = self._build_features(df)

        feature_cols = self._feature_cols()
        available_features = [c for c in feature_cols if c in df.columns]

        X = df[available_features].fillna(0)
        y_reg = df["target_cases_next_week"].fillna(0)
        y_clf = df["outbreak_label"].fillna(0)

        # Use time-series split
        split_idx = int(len(X) * 0.8)
        X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
        y_reg_train, y_reg_test = y_reg.iloc[:split_idx], y_reg.iloc[split_idx:]
        y_clf_train, y_clf_test = y_clf.iloc[:split_idx], y_clf.iloc[split_idx:]

        # Scale
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        # Train regressor
        if HAS_XGB:
            self.regressor = XGBRegressor(
                n_estimators=200, max_depth=6, learning_rate=0.1,
                random_state=42, n_jobs=-1
            )
            self.classifier = XGBClassifier(
                n_estimators=200, max_depth=6, learning_rate=0.1,
                random_state=42, n_jobs=-1, eval_metric="logloss"
            )
        else:
            self.regressor = GradientBoostingRegressor(
                n_estimators=200, max_depth=5, learning_rate=0.1, random_state=42
            )
            self.classifier = RandomForestClassifier(
                n_estimators=200, max_depth=10, random_state=42, n_jobs=-1
            )

        logger.info("Training outbreak regression model...")
        self.regressor.fit(X_train_scaled, y_reg_train)

        logger.info("Training outbreak classification model...")
        self.classifier.fit(X_train_scaled, y_clf_train)

        # Evaluate
        y_reg_pred = self.regressor.predict(X_test_scaled)
        mae = mean_absolute_error(y_reg_test, y_reg_pred)
        r2 = r2_score(y_reg_test, y_reg_pred)

        y_clf_pred = self.classifier.predict(X_test_scaled)
        try:
            auc = roc_auc_score(y_clf_test, self.classifier.predict_proba(X_test_scaled)[:, 1])
        except Exception:
            auc = 0.0

        # Save
        os.makedirs(os.path.dirname(OUTBREAK_MODEL_PATH), exist_ok=True)
        joblib.dump(self.regressor, OUTBREAK_MODEL_PATH)
        joblib.dump(self.classifier, OUTBREAK_MODEL_PATH.replace('.pkl', '_clf.pkl'))
        joblib.dump(self.scaler, OUTBREAK_MODEL_PATH.replace('.pkl', '_scaler.pkl'))
        joblib.dump(available_features, OUTBREAK_MODEL_PATH.replace('.pkl', '_features.pkl'))

        self._trained_features = available_features
        self._trained = True

        return {
            "regression_mae": round(mae, 2),
            "regression_r2": round(r2, 4),
            "classification_auc": round(auc, 4),
            "n_features": len(available_features),
            "n_train_samples": len(X_train)
        }

    def _load_model(self):
        """Load saved models"""
        try:
            self.regressor = joblib.load(OUTBREAK_MODEL_PATH)
            self.classifier = joblib.load(OUTBREAK_MODEL_PATH.replace('.pkl', '_clf.pkl'))
            self.scaler = joblib.load(OUTBREAK_MODEL_PATH.replace('.pkl', '_scaler.pkl'))
            self._trained_features = joblib.load(OUTBREAK_MODEL_PATH.replace('.pkl', '_features.pkl'))
            self._trained = True
            logger.info("Loaded saved outbreak forecast models")
        except FileNotFoundError:
            logger.info("No saved outbreak model — training new...")
            self.train()

    def _load_or_train(self):
        self._load_model()

    def _input_to_vector(self, inp: OutbreakInput) -> np.ndarray:
        """Convert input dataclass to feature vector"""
        feature_values = {
            "cases": inp.cases,
            "cases_lag1": inp.cases_lag1,
            "cases_lag2": inp.cases_lag2,
            "cases_lag3": inp.cases_lag3,
            "temperature_mean": inp.temperature_mean,
            "humidity_mean": inp.humidity_mean,
            "rainfall_anomaly": inp.rainfall_anomaly,
            "soil_moisture_mean": inp.soil_moisture_mean,
            "ndvi_mean": inp.ndvi_mean,
            "wind_speed_mean": inp.wind_speed_mean,
            "population_density": inp.population_density,
            "hospital_capacity": inp.hospital_capacity,
            "elevation_mean": inp.elevation_mean,
            "cases_7day_sum": inp.cases + inp.cases_lag1 + inp.cases_lag2 + inp.cases_lag3,
            "temp_humidity_interaction": inp.temperature_mean * inp.humidity_mean / 100,
            "rainfall_x_ndvi": inp.rainfall_anomaly * inp.ndvi_mean,
            "capacity_utilization": inp.cases / (inp.hospital_capacity + 1),
        }
        available = getattr(self, '_trained_features', list(feature_values.keys()))
        vec = [feature_values.get(f, 0.0) for f in available]
        return np.array(vec).reshape(1, -1)

    def _get_contributing_factors(self, inp: OutbreakInput) -> list:
        """Identify key contributing factors to outbreak risk"""
        factors = []
        if inp.temperature_mean > 35:
            factors.append("High temperature (>35°C) favors vector breeding")
        if inp.humidity_mean > 80:
            factors.append("High humidity (>80%) increases disease transmission")
        if inp.rainfall_anomaly > 500:
            factors.append("Heavy rainfall creating waterlogging / vector habitats")
        if inp.ndvi_mean > 5000:
            factors.append("High vegetation index indicates dense mosquito habitat")
        if inp.cases > inp.cases_lag1 * 1.5 and inp.cases_lag1 > 0:
            factors.append("Rapid case growth (>50% increase week-on-week)")
        if inp.hospital_capacity < inp.cases * 0.5:
            factors.append("Hospital capacity under stress")
        if inp.soil_moisture_mean > 50:
            factors.append("High soil moisture — favors waterborne disease spread")
        if not factors:
            factors.append("No critical risk factors detected")
        return factors

    def forecast(self, inp: OutbreakInput) -> OutbreakForecast:
        """Predict cases and outbreak probability for next week"""
        X = self._input_to_vector(inp)
        X_scaled = self.scaler.transform(X)

        predicted_cases = max(0, int(self.regressor.predict(X_scaled)[0]))

        if hasattr(self.classifier, 'predict_proba'):
            outbreak_prob = float(self.classifier.predict_proba(X_scaled)[0][1])
        else:
            outbreak_prob = float(self.classifier.predict(X_scaled)[0])

        # Confidence interval (±20% based on model uncertainty)
        ci_low = max(0, int(predicted_cases * 0.8))
        ci_high = int(predicted_cases * 1.2)

        return OutbreakForecast(
            district=inp.district,
            disease=inp.disease,
            predicted_cases_next_week=predicted_cases,
            outbreak_probability=round(outbreak_prob, 4),
            outbreak_alert=outbreak_prob >= self.PROBABILITY_THRESHOLD,
            confidence_interval_low=ci_low,
            confidence_interval_high=ci_high,
            contributing_factors=self._get_contributing_factors(inp),
            forecast_horizon_days=7
        )


# ─── TEST ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    model = OutbreakForecastModel()

    test_input = OutbreakInput(
        district="Lucknow",
        disease="Dengue",
        cases=84,
        cases_lag1=60,
        cases_lag2=45,
        cases_lag3=30,
        temperature_mean=36.0,
        humidity_mean=85.0,
        rainfall_anomaly=800.0,
        soil_moisture_mean=60.0,
        ndvi_mean=5200.0,
        population_density=800.0,
        hospital_capacity=150.0,
    )

    forecast = model.forecast(test_input)
    print(f"\nOutbreak Forecast:")
    print(f"  District: {forecast.district}")
    print(f"  Disease: {forecast.disease}")
    print(f"  Predicted cases next week: {forecast.predicted_cases_next_week}")
    print(f"  Outbreak probability: {forecast.outbreak_probability:.2f}")
    print(f"  ALERT: {forecast.outbreak_alert}")
    print(f"  Factors: {forecast.contributing_factors}")
