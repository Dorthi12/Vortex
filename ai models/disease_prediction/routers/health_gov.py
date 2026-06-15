# routers/health_gov.py
import json
import logging
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime

# DB and Schema Imports
from models.health_gov_db import (
    get_db, HealthOutbreakPrediction, HospitalForecast,
    AmbulanceDispatch, MedicineForecast, VaccinationForecast,
    HealthAgentReport, SimulationRun
)
from schemas.health_gov import (
    OutbreakPredictRequest, OutbreakPredictResponse,
    HospitalForecastRequest, HospitalForecastResponse,
    AmbulanceOptimizeRequest, AmbulanceOptimizeResponse,
    MedicineForecastRequest, MedicineForecastResponse,
    VaccinationForecastRequest, VaccinationForecastResponse,
    AgentQueryRequest, AgentQueryResponse,
    SimulationRunRequest, SimulationRunResponse
)
from repositories.health_gov import HealthGovRepository

# Business Logic and Agent
from services.health_gov import (
    OutbreakPredictorService, HospitalLoadForecasterService,
    AmbulanceDispatchOptimizerService, MedicineDemandForecasterService,
    VaccinationCampaignPlannerService, DigitalTwinSimulationService
)
from agents.health_gov_agent import HealthGovAgent
from disease_prediction.services.kafka_pipeline import pipeline

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/health", tags=["Health Governance Platform"])

# ── WEBSOCKET CONNECTION MANAGER ──
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Remaining connections: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to connection: {e}")
                # Connection might be dead, but we handle cleanup on disconnect

manager = ConnectionManager()


# ── HELPER: KAFKA & WEBSOCKET BUNDLER ──
def broadcast_and_stream(topic: str, payload: Dict[str, Any], bg_tasks: BackgroundTasks):
    # 1. Publish to Kafka
    try:
        pipeline.producer.send(topic, payload, key=payload.get("district_name") or payload.get("ambulance_plate"))
    except Exception as e:
        logger.error(f"Kafka publish error on topic {topic}: {e}")

    # 2. Add background task to broadcast to WebSocket
    bg_tasks.add_task(manager.broadcast, {"stream": topic, "data": payload, "timestamp": datetime.utcnow().isoformat()})


# ── ENDPOINTS ──

# WebSocket Route
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial confirmation message
        await websocket.send_json({"status": "CONNECTED", "message": "NETRAVAAH Health Realtime Stream active"})
        while True:
            # Keep connection open by listening for any ping message
            data = await websocket.receive_text()
            await websocket.send_json({"status": "PONG", "received": data})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
        manager.disconnect(websocket)


# 1. Disease Outbreak Prediction
@router.post("/outbreak/predict", response_model=OutbreakPredictResponse)
async def predict_outbreak(req: OutbreakPredictRequest, bg_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    repo = HealthGovRepository(db)
    
    # Run prediction logic
    res = OutbreakPredictorService.predict(
        district_name=req.district_name,
        disease=req.disease,
        temperature=req.temperature,
        humidity=req.humidity,
        rainfall=req.rainfall,
        population_density=req.population_density,
        historical_cases=req.historical_cases,
        sanitation_index=req.sanitation_index,
        mosquito_density=req.mosquito_density,
        water_logging_reports=req.water_logging_reports
    )
    
    # Save to database
    db_model = HealthOutbreakPrediction(**res)
    saved = repo.save_outbreak_prediction(db_model)
    
    # Format payload for streaming
    payload = {
        "id": saved.id,
        "district_name": saved.district_name,
        "disease": saved.disease,
        "outbreak_probability": saved.outbreak_probability,
        "severity_score": saved.severity_score,
        "expected_cases_7d": saved.expected_cases_7d,
        "expected_cases_30d": saved.expected_cases_30d,
        "risk_heatmap": saved.risk_heatmap,
        "confidence_score": saved.confidence_score,
        "created_at": saved.created_at.isoformat()
    }
    
    # Publish outbreak prediction events
    broadcast_and_stream("health-events", payload, bg_tasks)
    if saved.outbreak_probability > 0.65:
        alert_payload = {
            "district_name": saved.district_name,
            "disease": saved.disease,
            "level": "HIGH" if saved.outbreak_probability < 0.8 else "CRITICAL",
            "message": f"CRITICAL alert: Outbreak probability of {saved.disease} in {saved.district_name} is {saved.outbreak_probability:.1%}",
            "projected_7d": saved.expected_cases_7d
        }
        broadcast_and_stream("outbreak-alerts", alert_payload, bg_tasks)
        
    return saved


# 2. Hospital Load Forecasting
@router.post("/hospital/forecast", response_model=HospitalForecastResponse)
async def forecast_hospital_load(req: HospitalForecastRequest, bg_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    repo = HealthGovRepository(db)
    
    res = HospitalLoadForecasterService.forecast(
        district_name=req.district_name,
        hospital_name=req.hospital_name,
        current_occupancy=req.current_occupancy,
        icu_usage=req.icu_usage,
        ventilator_usage=req.ventilator_usage,
        disease_outbreak_data=req.disease_outbreak_data,
        seasonal_trends=req.seasonal_trends or ""
    )
    
    db_model = HospitalForecast(**res)
    saved = repo.save_hospital_forecast(db_model)
    
    payload = {
        "id": saved.id,
        "district_name": saved.district_name,
        "hospital_name": saved.hospital_name,
        "current_occupancy": saved.current_occupancy,
        "icu_usage": saved.icu_usage,
        "expected_occupancy": saved.expected_occupancy,
        "icu_requirement_forecast": saved.icu_requirement_forecast,
        "bed_shortage_warning": saved.bed_shortage_warning,
        "resource_recommendation": saved.resource_recommendation,
        "created_at": saved.created_at.isoformat()
    }
    
    broadcast_and_stream("hospital-capacity", payload, bg_tasks)
    return saved


# 3. Ambulance Dispatch Optimizer
@router.post("/ambulance/optimize", response_model=AmbulanceOptimizeResponse)
async def optimize_ambulance_dispatch(req: AmbulanceOptimizeRequest, bg_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    repo = HealthGovRepository(db)
    
    res = AmbulanceDispatchOptimizerService.optimize(
        ambulance_plate=req.ambulance_plate,
        current_lat=req.current_lat,
        current_lng=req.current_lng,
        traffic_conditions=req.traffic_conditions,
        emergency_severity=req.emergency_severity
    )
    
    db_model = AmbulanceDispatch(**res)
    saved = repo.save_ambulance_dispatch(db_model)
    
    payload = {
        "dispatch_id": saved.dispatch_id,
        "ambulance_plate": saved.ambulance_plate,
        "assigned_hospital": saved.assigned_hospital,
        "eta_minutes": saved.eta_minutes,
        "status": saved.status,
        "severity": saved.emergency_severity,
        "coords": {"lat": saved.current_lat, "lng": saved.current_lng},
        "created_at": saved.created_at.isoformat()
    }
    
    broadcast_and_stream("ambulance-status", payload, bg_tasks)
    return saved


# 4. Medicine Demand Forecasting
@router.post("/medicine/forecast", response_model=MedicineForecastResponse)
async def forecast_medicine_demand(req: MedicineForecastRequest, bg_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    repo = HealthGovRepository(db)
    
    res = MedicineDemandForecasterService.forecast(
        district_name=req.district_name,
        pharmacy_name=req.pharmacy_name,
        medicine_name=req.medicine_name,
        current_inventory=req.current_inventory,
        disease_trends=req.disease_trends,
        historical_sales=req.historical_sales,
        seasonal_effects=req.seasonal_effects or ""
    )
    
    db_model = MedicineForecast(**res)
    saved = repo.save_medicine_forecast(db_model)
    
    payload = {
        "id": saved.id,
        "district_name": saved.district_name,
        "pharmacy_name": saved.pharmacy_name,
        "medicine_name": saved.medicine_name,
        "current_inventory": saved.current_inventory,
        "predicted_demand": saved.predicted_demand,
        "stockout_risk_level": saved.stockout_risk_level,
        "restock_recommendation": saved.restock_recommendation,
        "created_at": saved.created_at.isoformat()
    }
    
    broadcast_and_stream("medicine-demand", payload, bg_tasks)
    return saved


# 5. Vaccination Planning AI
@router.post("/vaccination/forecast", response_model=VaccinationForecastResponse)
async def forecast_vaccination_requirements(req: VaccinationForecastRequest, db: Session = Depends(get_db)):
    repo = HealthGovRepository(db)
    
    res = VaccinationCampaignPlannerService.plan(
        district_name=req.district_name,
        disease_name=req.disease_name,
        population_demographics=req.population_demographics,
        vaccination_records=req.vaccination_records,
        disease_outbreak_data=req.disease_outbreak_data
    )
    
    db_model = VaccinationForecast(**res)
    saved = repo.save_vaccination_forecast(db_model)
    return saved


# 6. Health Governance Agent
@router.post("/agent/query", response_model=AgentQueryResponse)
async def query_health_agent(req: AgentQueryRequest, db: Session = Depends(get_db)):
    repo = HealthGovRepository(db)
    district = req.district_name or "Lucknow"
    
    # Run Agent LLM reasoning (Gemini API with fallback)
    analysis = HealthGovAgent.analyze_district_health(req.query_text, district)
    
    # Map dictionary returned to DB model
    db_model = HealthAgentReport(
        query_text=req.query_text,
        district_name=district,
        risk_level=analysis.get("risk_level", "MEDIUM"),
        contributing_factors=analysis.get("contributing_factors", []),
        expected_spread=analysis.get("expected_spread", ""),
        recommended_actions=analysis.get("recommended_actions", []),
        resource_requirements=analysis.get("resource_requirements", {}),
        confidence_score=analysis.get("confidence_score", 0.8)
    )
    saved = repo.save_agent_report(db_model)
    return saved


# 7. Health Digital Twin
@router.post("/simulation/run", response_model=SimulationRunResponse)
async def run_simulation(req: SimulationRunRequest, db: Session = Depends(get_db)):
    repo = HealthGovRepository(db)
    
    params = req.parameters
    
    # Run outbreak simulator (SEIR compartmental modeling)
    res = DigitalTwinSimulationService.run_seir_simulation(
        district_name=req.district_name,
        population=params.get("population", 1000000),
        initial_infected=params.get("initial_infected", 100),
        recovery_days=params.get("recovery_days", 7.0),
        incubation_days=params.get("incubation_days", 5.0),
        beta_transmission=params.get("beta_transmission", 0.35),
        intervention_day=params.get("intervention_day", 15),
        intervention_efficacy=params.get("intervention_efficacy", 0.5),
        sim_days=params.get("simulation_days", 90)
    )
    
    db_model = SimulationRun(**res)
    saved = repo.save_simulation_run(db_model)
    return saved


# Dashboard summaries and stats log getters
@router.get("/dashboard/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    repo = HealthGovRepository(db)
    
    outbreaks = repo.get_outbreak_predictions(limit=10)
    hospitals = repo.get_hospital_forecasts(limit=10)
    ambulances = repo.get_ambulance_dispatches(limit=15)
    medicines = repo.get_medicine_forecasts(limit=15)
    vaccines = repo.get_vaccination_forecasts(limit=10)
    sims = repo.get_simulation_runs(limit=10)
    
    active_ambulances = repo.get_active_dispatches()
    
    # Calculate brief stats
    high_outbreak_risk = sum(1 for o in outbreaks if o.outbreak_probability > 0.7)
    bed_shortages = sum(1 for h in hospitals if h.bed_shortage_warning)
    stockout_meds = sum(1 for m in medicines if m.stockout_risk_level in ("CRITICAL", "HIGH"))
    
    return {
        "status": "success",
        "active_alerts": high_outbreak_risk + bed_shortages + stockout_meds,
        "kpis": {
            "high_outbreak_zones": high_outbreak_risk,
            "hospital_bed_alerts": bed_shortages,
            "active_ambulance_dispatches": len(active_ambulances),
            "critical_stockout_medicines": stockout_meds
        },
        "recent_outbreaks": [
            {
                "id": o.id, "district": o.district_name, "disease": o.disease,
                "prob": o.outbreak_probability, "severity": o.severity_score,
                "cases_7d": o.expected_cases_7d, "time": o.created_at.isoformat()
            } for o in outbreaks
        ],
        "recent_hospital_loads": [
            {
                "id": h.id, "hospital": h.hospital_name, "district": h.district_name,
                "occupancy": h.current_occupancy, "expected": h.expected_occupancy,
                "shortage": h.bed_shortage_warning, "time": h.created_at.isoformat()
            } for h in hospitals
        ],
        "recent_dispatches": [
            {
                "dispatch_id": a.dispatch_id, "plate": a.ambulance_plate,
                "hospital": a.assigned_hospital, "eta": a.eta_minutes,
                "status": a.status, "severity": a.emergency_severity,
                "lat": a.current_lat, "lng": a.current_lng, "time": a.created_at.isoformat()
            } for a in ambulances
        ],
        "recent_medicines": [
            {
                "id": m.id, "pharmacy": m.pharmacy_name, "medicine": m.medicine_name,
                "inventory": m.current_inventory, "demand": m.predicted_demand,
                "risk": m.stockout_risk_level, "time": m.created_at.isoformat()
            } for m in medicines
        ],
        "recent_vaccinations": [
            {
                "id": v.id, "district": v.district_name, "disease": v.disease_name,
                "required": v.required_doses, "forecast": v.coverage_forecast_pct,
                "campaign": v.campaign_recommendation, "time": v.created_at.isoformat()
            } for v in vaccines
        ],
        "recent_simulations": [
            {
                "id": s.simulation_id, "type": s.simulation_type, "district": s.district_name,
                "reduction": s.mortality_reduction_pct, "metrics": s.impact_metrics,
                "time": s.created_at.isoformat()
            } for s in sims
        ]
    }


# Fetch active ambulance dispatches
@router.get("/ambulance/dispatches", response_model=List[AmbulanceOptimizeResponse])
def get_dispatches(db: Session = Depends(get_db)):
    repo = HealthGovRepository(db)
    return repo.get_ambulance_dispatches(limit=50)


# Update ambulance status
@router.put("/ambulance/dispatch/{dispatch_id}/status", response_model=AmbulanceOptimizeResponse)
async def update_dispatch(dispatch_id: str, status: str, bg_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    repo = HealthGovRepository(db)
    updated = repo.update_dispatch_status(dispatch_id, status)
    if not updated:
        raise HTTPException(status_code=404, detail="Dispatch ID not found")
        
    payload = {
        "dispatch_id": updated.dispatch_id,
        "ambulance_plate": updated.ambulance_plate,
        "assigned_hospital": updated.assigned_hospital,
        "eta_minutes": updated.eta_minutes,
        "status": updated.status,
        "severity": updated.emergency_severity,
        "coords": {"lat": updated.current_lat, "lng": updated.current_lng},
        "created_at": updated.created_at.isoformat()
    }
    
    broadcast_and_stream("ambulance-status", payload, bg_tasks)
    return updated
