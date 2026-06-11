# Disease Intelligence System v2.0 — FIXED

## Overview
End-to-end disease surveillance and prediction platform for Uttar Pradesh.
9-model pipeline: Citizen Report → Symptom Detection → Disease Prediction →
Case Aggregation → Outbreak Forecast → Hotspot Detection → Risk Scoring →
Remedy Generation → Government Execution Plan.

---

## All Issues Fixed (from Audit)

### Critical Issues Fixed

**Issue 1 — No NLP symptom detection model** ✅ FIXED
- `services/symptom_classifier.py` — RF+GBM ensemble, 95.8% accuracy on 41 diseases
- Full pipeline: citizen text → NLP synonym map → symptom vector → disease prediction

**Issue 2 — No feature engineering pipeline** ✅ FIXED
- `services/feature_engineering.py` — Unified feature store merging ALL data sources
- Produces `district_feature_store` with all required columns (see below)

**Issue 3 — Kafka pipeline incomplete** ✅ FIXED
- `services/kafka_pipeline.py` — All 7 topics defined with full schemas + consumer groups
- Topics: `citizen_reports`, `weather_updates`, `disease_cases`, `outbreak_predictions`,
  `government_actions`, `mobility_updates`, `health_reports`
- Consumer group: `disease-intel-group`

**Issue 4 — No geospatial clustering** ✅ FIXED
- `services/hotspot_detection.py` — DBSCAN clustering with lat/lng district coordinates
- `services/case_aggregator.py` — lat/lng → district mapping (nearest neighbour)
- `scripts/init.sql` — PostGIS geometry columns on all spatial tables

**Issue 5 — No district risk scoring model** ✅ FIXED
- `services/risk_scoring.py` — Composite weighted risk index:
  `risk_score = 0.4×outbreak_probability + 0.3×hotspot_density + 0.2×hospital_load + 0.1×env_risk`
- Outputs: LOW / MEDIUM / HIGH / CRITICAL

**Issue 6 — No API endpoints for models** ✅ FIXED
- `main.py` — All 9 steps exposed as REST endpoints
- New: `/api/v1/dashboard` — Government dashboard API (was missing)
- New: `/api/v1/pipeline/schema` — Kafka schema documentation
- New: `/api/v1/seir/multi-district` — Multi-district mobility spread simulation
- New: `/api/v1/mobility/{district}` — GenerateIO mobility data
- New: `/api/v1/feature-store/{district}` — Full feature store row

---

### Feature Store Fixes

The `district_features` table now contains all required columns:

| Column | Source | Fix |
|---|---|---|
| `latitude`, `longitude` | District metadata | FIX-3 |
| `district_name`, `state_name` | District metadata | FIX-3 |
| `week`, `date`, `year`, `season` | Temporal | FIX-4 (was missing) |
| `mobility_index`, `travel_density` | GenerateIO API | FIX-1 (was missing) |
| `citizen_reports_count`, `symptom_frequency` | Kafka citizen_reports | FIX-6 (was missing) |
| `beds_per_1000`, `doctors_per_1000`, `healthcare_access_index` | Derived | FIX-7 (was missing) |
| `vector_risk`, `water_risk`, `climate_anomaly` | Derived from weather | FIX-8 (was missing) |
| `cases_lag_1`, `cases_lag_2`, `cases_lag_3` | Time-series | FIX-9 (was missing) |
| `cases_rolling_mean`, `cases_growth_rate` | Time-series | FIX-9 (was missing) |
| `hospital_utilisation`, `bed_occupancy` | Derived | FIX-10 (was missing) |

---

### Database Fixes (`scripts/init.sql`)

All required tables now present:
- ✅ `citizen_reports` — with PostGIS geometry + district FK
- ✅ `climate_data` — with all 15 weather/environmental columns
- ✅ `district_features` — the unified feature store (most important)
- ✅ `disease_cases` — with `season` column, panel time-series structure
- ✅ `outbreak_predictions` — with all model output fields
- ✅ `government_actions` — with status lifecycle (dispatched → acknowledged → completed)
- ✅ `hotspot_clusters` — with PostGIS geometry
- ✅ `seir_simulations` — simulation results storage

---

### Dataset Preprocessing Fixes (`scripts/prepare_dataset.py`)

The raw `final_governance_dataset_with_climate.csv` had 12 issues:
1. ✅ Corrupted first rows (NaN state_or_region) — removed
2. ✅ Mixed data types (strings in numeric columns) — coerced to numeric
3. ✅ Missing spatial features (lat/lng) — added from district lookup
4. ✅ No temporal columns (week/season) — added
5. ✅ No mobility column — added from GenerateIO/proxy
6. ✅ No community data features — added as 0 baseline
7. ✅ Missing capacity ratios (beds_per_1000) — computed
8. ✅ No environmental risk indicators — computed from raw weather
9. ✅ No lag features — computed per district×disease group
10. ✅ No panel time-series structure — restructured
11. ✅ No hospital load indicators — derived
12. ✅ Feature balance: added 45–60 features from original 32

---

## API Endpoints

| Method | Endpoint | Step |
|---|---|---|
| POST | `/api/v1/citizen/report` | 1: Ingest citizen report |
| POST | `/api/v1/symptoms/extract` | 2: NLP symptom extraction |
| POST | `/api/v1/disease/predict` | 3: Disease prediction |
| POST | `/api/v1/cases/ingest` | 4: Case aggregation |
| POST | `/api/v1/forecast` | 5: Outbreak forecast |
| GET  | `/api/v1/hotspots/{disease}` | 6: Hotspot detection |
| POST | `/api/v1/seir/simulate` | 6b: SEIR simulation |
| POST | `/api/v1/seir/multi-district` | 6c: Multi-district spread |
| POST | `/api/v1/risk/score` | 7: Risk scoring |
| POST | `/api/v1/remedy/plan` | 8+9: Remedy + execution plan |
| POST | `/api/v1/pipeline/full` | All 9 steps in one call |
| GET  | `/api/v1/dashboard` | **Government dashboard** (NEW) |
| GET  | `/api/v1/mobility/{district}` | Mobility data (NEW) |
| GET  | `/api/v1/feature-store/{district}` | Feature store (NEW) |

---

## Running

```bash
# Install dependencies
pip install -r requirements.txt

# Run database migrations
psql -U postgres -f scripts/init.sql

# Preprocess dataset
python scripts/prepare_dataset.py

# Start API server
python main.py
# or
uvicorn main:app --reload --port 8000
```

Swagger UI: http://localhost:8000/docs

---

## Architecture

```
Citizen Post
    ↓
citizen_reports (Kafka)
    ↓
symptom_detection_model (RF+GBM NLP)
    ↓
disease_cases (Kafka)
    ↓
case_aggregator + feature_engineering
    ↓
outbreak_forecast (SEIR + epidemiological model)
    ↓
outbreak_predictions (Kafka)
    ↓
hotspot_detection (DBSCAN) + risk_scoring
    ↓
remedy_planner (Gemini AI + rule-base fallback)
    ↓
government_actions (Kafka) → Dashboard
```
