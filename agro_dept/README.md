## AGRI ADVISORY — 6 AI Models Setup

### Install all dependencies:
pip install numpy pandas scikit-learn matplotlib seaborn requests joblib xgboost torch torchvision pillow

---

## MODEL OVERVIEW

| # | Model | Algorithm | Training Records | Live APIs |
|---|-------|-----------|-----------------|-----------|
| 1 | Crop Yield Prediction | CNN + Random Forest Stack | 12,000 | Open-Meteo |
| 2 | Crop Stress Detection | Random Forest Classifier | 15,000 | Open-Meteo |
| 3 | Plant Disease Detection | ResNet-9 CNN + Gemini | 87K images | Gemini 1.5 Flash |
| 4 | Irrigation Requirement | HistGradientBoosting + FAO-56 | 15,000 | Open-Meteo + WeatherBit |
| 5 | Crop Suitability | XGBoost Classifier | 18,000 | Open-Meteo + OpenWeather |
| 6 | Agriculture Risk Score | RF + XGBoost Ensemble | 20,000 | All 3 APIs |

---

## API KEYS (pre-configured in all files)

- Open-Meteo      : No key needed — free unlimited
- WeatherBit      : ffd13dad3d6c49a39f4b1b6a77b8d222
- OpenWeatherMap  : 701cf29be2f669b6266eb7b847b13a55
- Google Gemini   : AIzaSyDDgHtjNZYdbV0Ojtkf7jfVYSr8GsgfA2Q

---

## HOW TO RUN

Run all 6 models:
    python run_all_models.py --district hyderabad --crop Rice --season Kharif

Run individual models:
    python run_all_models.py --model 1 --district patna --crop Wheat
    python run_all_models.py --model 3
    python run_all_models.py --model 6 --district jaipur

Demo mode (skip training, use saved pkl files):
    python run_all_models.py --demo

Train disease CNN (requires PlantVillage dataset download):
    python model3_disease_detection.py --train --epochs 5

Single image disease inference:
    python model3_disease_detection.py --infer /path/to/leaf.jpg

Download PlantVillage dataset:
    kaggle datasets download vipoooool/new-plant-diseases-dataset

---

## OUTPUT FILES

Plots saved to outputs/:
  model1_yield_prediction.png
  model2_stress_detection.png
  model3_training_curves.png
  model3_disease_frequency.png
  model4_irrigation.png
  model5_crop_suitability.png
  model6_risk_score.png
  model6_district_risk_map.png
  saved_models/  (all .pkl and .pth serialised models)

---

## TRAINING DATA REFERENCES

Model 1,2 : ICRISAT District Level Database  — data.icrisat.org/dld
Model 3   : PlantVillage Dataset              — kaggle vipoooool/new-plant-diseases-dataset
Model 4   : FAO-56 Penman-Monteith           — fao.org/3/x0490e
Model 5   : FAO GAEZ v4                      — gaez.fao.org
Model 6   : PMFBY Claim Data Schema          — pmfby.gov.in

Replace generate_*_data() functions with pd.read_csv() calls pointing to
official downloaded CSV files to use real government data.
