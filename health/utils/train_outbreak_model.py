# health/utils/train_outbreak_model.py
import pickle
import os
import numpy as np
from sklearn.ensemble import RandomForestRegressor

def train_and_save_model():
    print("Generating dummy training data for outbreak prediction...")
    # Features: disease_reports, historical_outbreaks, temperature, humidity, rainfall, sanitation_index, population_density
    np.random.seed(42)
    X = np.random.rand(200, 7)
    # Target: outbreak probability (bounded between 0 and 1)
    y = np.clip(0.3 * X[:, 0] + 0.1 * X[:, 1] + 0.1 * X[:, 2] + 0.15 * X[:, 3] + 0.15 * X[:, 4] - 0.2 * X[:, 5] + 0.1 * X[:, 6] + np.random.normal(0, 0.05, 200), 0.0, 1.0)
    
    print("Training RandomForestRegressor model...")
    model = RandomForestRegressor(n_estimators=50, random_state=42)
    model.fit(X, y)
    
    # Target directory path
    target_dir = "c:/Users/d12ra/Vortex/health/models"
    os.makedirs(target_dir, exist_ok=True)
    
    model_path = os.path.join(target_dir, "outbreak_model.pkl")
    print(f"Saving model to {model_path}...")
    with open(model_path, "wb") as f:
        pickle.dump(model, f)
    print("Model successfully trained and saved!")

if __name__ == "__main__":
    train_and_save_model()
