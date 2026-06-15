# health/schemas/health_schemas.py
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# Base schema for soft delete & audits
class HealthBaseSchema(BaseModel):
    id: int
    created_at: datetime
    updated_at: datetime
    is_deleted: bool
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Module 1: Outbreak Prediction ---
class OutbreakPredictRequest(BaseModel):
    disease: str = Field(..., example="Dengue")
    disease_reports: int = Field(..., ge=0)
    historical_outbreaks: int = Field(..., ge=0)
    temperature: float = Field(..., description="in Celsius")
    humidity: float = Field(..., ge=0, le=100)
    rainfall: float = Field(..., ge=0)
    sanitation_index: float = Field(..., ge=0, le=1)
    population_density: float = Field(..., ge=0)

class OutbreakPredictResponse(BaseModel):
    id: int
    disease: str
    outbreak_probability: float
    risk_category: str
    confidence_score: float
    expected_case_growth: float
    affected_wards: List[str]
    created_at: datetime

    class Config:
        from_attributes = True

# --- Module 2: Hospital Capacity ---
class HospitalCreate(BaseModel):
    name: str
    district: str
    location: Optional[str] = None
    total_beds: int = Field(..., ge=0)
    total_icu_beds: int = Field(..., ge=0)
    total_ventilators: int = Field(..., ge=0)

class HospitalSchema(HealthBaseSchema):
    name: str
    district: str
    location: Optional[str] = None
    total_beds: int
    total_icu_beds: int
    total_ventilators: int

class HospitalBedCreate(BaseModel):
    hospital_id: int
    bed_number: str
    bed_type: str # GENERAL, ICU
    is_occupied: bool = False

class HospitalBedSchema(HealthBaseSchema):
    hospital_id: int
    bed_number: str
    bed_type: str
    is_occupied: bool

class AdmissionRequest(BaseModel):
    hospital_id: int
    patient_name: str
    bed_type: str # GENERAL, ICU

class AdmissionResponse(BaseModel):
    id: int
    hospital_id: int
    patient_name: str
    bed_id: int
    bed_number: str
    admission_date: datetime
    status: str

class DischargeRequest(BaseModel):
    admission_id: int
    medical_notes: Optional[str] = None

class CapacityAnalyticsResponse(BaseModel):
    hospital_id: int
    hospital_name: str
    total_beds: int
    occupied_beds: int
    occupancy_rate: float
    total_icu_beds: int
    occupied_icu: int
    icu_utilization: float
    total_ventilators: int
    occupied_ventilators: int
    ventilator_utilization: float

# --- Module 3: Medicine Surveillance ---
class MedicineInventoryCreate(BaseModel):
    pharmacy_name: str
    medicine_name: str
    stock_level: int = Field(..., ge=0)
    price: float = Field(..., ge=0.0)

class MedicineInventorySchema(HealthBaseSchema):
    pharmacy_name: str
    medicine_name: str
    stock_level: int
    price: float

class MedicineUsageLogCreate(BaseModel):
    pharmacy_name: str
    medicine_name: str
    quantity_sold: int = Field(..., ge=1)

class DiseaseMedicineMapCreate(BaseModel):
    disease_name: str
    medicine_name: str
    weight: float = Field(default=1.0, ge=0.0)

class DiseaseSignalResponse(BaseModel):
    id: int
    disease_name: str
    match_percentage: float
    signal_status: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Module 4: Vaccination ---
class VaccineCreate(BaseModel):
    name: str
    targeted_disease: str
    recommended_age_months: int = Field(..., ge=0)

class VaccineSchema(HealthBaseSchema):
    name: str
    targeted_disease: str
    recommended_age_months: int

class VaccinationRecordCreate(BaseModel):
    center_id: int
    patient_name: str
    vaccine_id: int
    dose_number: int = Field(..., ge=1)

class VaccinationRecordResponse(BaseModel):
    id: int
    center_id: int
    patient_name: str
    vaccine_id: int
    dose_number: int
    administered_at: datetime

    class Config:
        from_attributes = True

class VaccinationStockUpdate(BaseModel):
    center_id: int
    vaccine_id: int
    quantity: int = Field(..., ge=0)

# --- Module 5: Ambulance Dispatch ---
class AmbulanceCreate(BaseModel):
    plate_number: str
    vehicle_type: str # BASIC, ADVANCED

class AmbulanceSchema(HealthBaseSchema):
    plate_number: str
    vehicle_type: str
    status: str

class LocationUpdate(BaseModel):
    ambulance_id: int
    latitude: float
    longitude: float

class DispatchRequestCreate(BaseModel):
    emergency_lat: float
    emergency_lng: float
    severity_level: str # critical, serious, minor

class DispatchHistoryResponse(BaseModel):
    id: int
    dispatch_request_id: int
    ambulance_id: int
    hospital_id: Optional[int]
    eta_minutes: int
    route_points: Optional[List[Dict[str, float]]]
    created_at: datetime

    class Config:
        from_attributes = True

# --- Module 6: Health Governance Agent ---
class AgentAnalyzeRequest(BaseModel):
    query_text: str = Field(..., example="Analyze health status of Sector 4B.")
    district_name: str = Field(..., example="Lucknow")

class AgentAnalyzeResponse(BaseModel):
    risk_level: str
    key_issues: List[str]
    recommended_actions: List[str]
    required_resources: Dict[str, Any]
    confidence_score: float
    created_at: datetime
