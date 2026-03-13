# NETRAVAAH v5 — AI-Powered Natural Hazard Early Warning System

## Architecture (All 9 Steps Fully Implemented)

```
Historical dataset (3 years)
        ↓
Compute baseline climate patterns  ← district_baselines in bundle
        ↓
Live weather data (past 7 days)    ← Open-Meteo past_days=7 (FIXED ✅)
        ↓
Compute anomalies                  ← vs ERA5 3-year baseline (NEW ✅)
        ↓
Weather forecast (next 72 hours)   ← Open-Meteo forecast endpoint (NEW ✅)
        ↓
ML model prediction                ← 5 models + confidence intervals (NEW ✅)
        ↓
Hazard probability (± CI)          ← e.g. "Flood risk: 0.73 ± 0.08"
        ↓
Alert generation (72h ahead)       ← forecast-triggered alerts (NEW ✅)
        ↓
Government response                ← NDRF + evacuation + dam/bridge
```

## Pipeline: v4 vs v5

| Component               | v4 | v5 | Fix |
|------------------------|----|----|-----|
| Historical dataset training | ✅ | ✅ | — |
| Live API integration   | ✅ | ✅ | — |
| Hazard prediction model| ✅ | ✅ | Bug fixes applied |
| Infrastructure response| ✅ | ✅ | — |
| **Past week analysis** | ❌ | ✅ | Uses full 168h aggregate |
| **Anomaly detection**  | ❌ | ✅ | z-score vs ERA5 3yr baseline |
| **72 hour forecast**   | ❌ | ✅ | Open-Meteo forecast_days=4 |

## All Bugs Fixed

### Critical Bugs
1. **Humidity in Kelvin** — `humidity_mean - 273.15` was wrong. Humidity is 0-100%. Fixed.
2. **Data leakage** — labels used `rainfall_anomaly` which was also a model input. Removed leakage.
3. **Random train/test split** — hazard prediction requires time-based split. Fixed to positional 80/20.
4. **NDVI claimed as live** — MODIS updates every 16 days. Now cached 16 days, not hourly.
5. **SMAP latency** — SMAP has 2-3 day lag. Marked supplementary only.

### Architecture Bugs
6. **Past-week aggregation** — was using only `data[-1]` (latest value). Fixed to full 168-hour sums.
7. **Missing 72h forecast** — now fetches `forecast_days=4` and generates forecast-based alerts.
8. **Missing anomaly detection** — now computes z-scores vs ERA5 3-year baseline.
9. **River proximity wrong** — `exp(-elevation/150)` is not river proximity. Fixed to use SWO proxy.
10. **Urban heat oversimplified** — now uses temp × NDVI × pop_density combination.
11. **API keys in code** — moved to `.env` file.
12. **API rate limits** — weather cached 10min, satellite 1hr, NDVI 16d, infrastructure 24hr.
13. **No confidence intervals** — now computed via tree variance for RF/ET models.
14. **TWI missing** — Terrain Wetness Index added for landslide prediction.

## New Endpoints

```
GET  /api/anomalies/<district>         anomaly z-scores vs 3yr baseline
GET  /api/forecast-alerts/<district>   72h forecast-based alerts
GET  /api/pipeline-status              all 9 pipeline components
GET  /api/pipeline-status/<district>   per-district pipeline
GET  /api/export/anomalies             CSV of all anomalies
```

## Quick Start

```bash
pip install -r requirements.txt
cp .env.template .env
python train.py        # retrain with fixed features
python app.py          # run server on port 5000
```

## APIs
- Open-Meteo: past 7 days + 72h forecast
- Weatherbit: UV, solar, AQI
- OpenWeatherMap: fallback
- NASA SMAP: soil moisture (supplementary, 2-3d lag)
- MODIS ORNL: NDVI (16-day cycle)
- India WRIS: river levels
- Overpass: road network
- Mapbox: routing + isochrones
- Gemini: AI advisory generation
