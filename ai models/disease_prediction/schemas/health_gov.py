# schemas/health_gov.py
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

# ── FEATURE 1: OUTBREAK PREDICTION ──
class OutbreakPredictRequest(BaseModel):
    district_name: str = Field(..., example="Lucknow")
    disease: str = Field(..., example="Dengue")
    temperature: float = Field(..., description="In Celsius", example=28.5)
    humidity: float = Field(..., description="Percentage", example=75.0)
    rainfall: float = Field(..., description="In mm", example=120.0)
    population_density: float = Field(..., description="People per sq km", example=1800.0)
    historical_cases: int = Field(..., example=45)
    sanitation_index: float = Field(..., description="0 to 1 score", example=0.65)
    mosquito_density: float = Field(..., description="Vector count score", example=0.8)
    water_logging_reports: int = Field(..., example=8)

class OutbreakPredictResponse(BaseModel):
    id: Optional[int] = None
    district_name: str
    disease: str
    outbreak_probability: float
    severity_score: float
    expected_cases_7d: int
    expected_cases_30d: int
    risk_heatmap: Optional[Dict[str, Any]] = None
    confidence_score: float
    created_at: Optional[datetime] = None


# ── FEATURE 2: HOSPITAL LOAD FORECASTING ──
class HospitalForecastRequest(BaseModel):
    district_name: str = Field(..., example="Lucknow")
    hospital_name: str = Field(..., example="Lucknow General Hospital")
    current_occupancy: int = Field(..., description="Occupied beds count", example=180)
    icu_usage: int = Field(..., description="Occupied ICU beds count", example=35)
    ventilator_usage: int = Field(..., description="Occupied ventilators count", example=12)
    disease_outbreak_data: Optional[Dict[str, Any]] = Field(default=None, description="Nearby outbreaks")
    seasonal_trends: Optional[str] = Field(default="Monsoon Surge", example="Monsoon Surge")

class HospitalForecastResponse(BaseModel):
    id: Optional[int] = None
    district_name: str
    hospital_name: str
    current_occupancy: int
    icu_usage: int
    ventilator_usage: int
    expected_occupancy: int
    icu_requirement_forecast: int
    bed_shortage_warning: bool
    resource_recommendation: str
    created_at: Optional[datetime] = None


# ── FEATURE 3: AMBULANCE DISPATCH OPTIMIZER ──
class AmbulanceOptimizeRequest(BaseModel):
    ambulance_plate: str = Field(..., example="UP-32-EH-4532")
    current_lat: float = Field(..., example=26.845)
    current_lng: float = Field(..., example=80.945)
    traffic_conditions: str = Field(..., description="light | moderate | heavy", example="moderate")
    emergency_severity: str = Field(..., description="critical | serious | minor", example="critical")

class AmbulanceOptimizeResponse(BaseModel):
    dispatch_id: str
    ambulance_plate: str
    current_lat: float
    current_lng: float
    traffic_conditions: str
    emergency_severity: str
    assigned_hospital: str
    hospital_availability: Dict[str, Any]
    eta_minutes: int
    route_geometry: Optional[Dict[str, Any]] = None
    status: str
    created_at: Optional[datetime] = None


# ── FEATURE 4: MEDICINE DEMAND FORECASTING ──
class MedicineForecastRequest(BaseModel):
    district_name: str = Field(..., example="Lucknow")
    pharmacy_name: str = Field(..., example="District Jan Aushadhi Kendra")
    medicine_name: str = Field(..., example="Paracetamol 650mg")
    current_inventory: int = Field(..., example=500)
    disease_trends: Optional[Dict[str, Any]] = None
    historical_sales: Optional[Dict[str, Any]] = None
    seasonal_effects: Optional[str] = Field(default="Widespread Viral Wave", example="Widespread Viral Wave")

class MedicineForecastResponse(BaseModel):
    id: Optional[int] = None
    district_name: str
    pharmacy_name: str
    medicine_name: str
    current_inventory: int
    predicted_demand: int
    stockout_risk_level: str
    restock_recommendation: str
    created_at: Optional[datetime] = None


# ── FEATURE 5: VACCINATION PLANNING AI ──
class VaccinationForecastRequest(BaseModel):
    district_name: str = Field(..., example="Lucknow")
    disease_name: str = Field(..., example="Dengue")
    population_demographics: Optional[Dict[str, Any]] = None
    vaccination_records: Optional[Dict[str, Any]] = None
    disease_outbreak_data: Optional[Dict[str, Any]] = None

class VaccinationForecastResponse(BaseModel):
    id: Optional[int] = None
    district_name: str
    disease_name: str
    required_doses: int
    coverage_forecast_pct: float
    priority_zones: List[Dict[str, Any]]
    campaign_recommendation: str
    created_at: Optional[datetime] = None


# ── FEATURE 6: HEALTH GOVERNANCE AGENT ──
class AgentQueryRequest(BaseModel):
    query_text: str = Field(..., example="Analyze dengue risk in Lucknow")
    district_name: Optional[str] = Field(default="Lucknow", example="Lucknow")

class AgentQueryResponse(BaseModel):
    id: Optional[int] = None
    query_text: str
    district_name: str
    risk_level: str
    contributing_factors: List[str]
    expected_spread: str
    recommended_actions: List[str]
    resource_requirements: Dict[str, Any]
    confidence_score: float
    created_at: Optional[datetime] = None


# ── FEATURE 7: HEALTH DIGITAL TWIN ──
class SimulationRunRequest(BaseModel):
    simulation_type: str = Field(..., description="outbreak | vaccination | overflow | dispatch", example="outbreak")
    district_name: str = Field(..., example="Lucknow")
    parameters: Dict[str, Any] = Field(..., description="Configurable SEIR / Dispatch parameters")

class SimulationRunResponse(BaseModel):
    simulation_id: str
    simulation_type: str
    district_name: str
    parameters: Dict[str, Any]
    timeline: List[Dict[str, Any]]
    impact_metrics: Dict[str, Any]
    resource_utilization: Optional[Dict[str, Any]] = None
    mortality_reduction_pct: float
    created_at: Optional[datetime] = None
