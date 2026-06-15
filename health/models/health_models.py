# health/models/health_models.py
from datetime import datetime
from sqlalchemy import (
    Column, Integer, Float, String, Boolean, DateTime, ForeignKey, Text, JSON, Index
)
from sqlalchemy.orm import relationship
from health.models.database import Base

# Audit + Soft Delete Mixin
class AuditMixin:
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime, nullable=True)

# 1. Disease Outbreak Predictions
class HealthOutbreakPrediction(Base, AuditMixin):
    __tablename__ = "health_outbreak_predictions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    disease = Column(String(100), nullable=False)
    outbreak_probability = Column(Float, nullable=False)
    risk_category = Column(String(50), nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    confidence_score = Column(Float, nullable=False)
    expected_case_growth = Column(Float, nullable=False)
    affected_wards = Column(JSON, nullable=True) # List of wards

    __table_args__ = (
        Index("idx_outbreak_disease", "disease"),
        Index("idx_outbreak_risk", "risk_category"),
    )

# 2. Hospital Capacity Management
class Hospital(Base, AuditMixin):
    __tablename__ = "hospitals"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    district = Column(String(100), nullable=False)
    location = Column(String(255), nullable=True)
    total_beds = Column(Integer, default=0, nullable=False)
    total_icu_beds = Column(Integer, default=0, nullable=False)
    total_ventilators = Column(Integer, default=0, nullable=False)

    beds = relationship("HospitalBed", back_populates="hospital", cascade="all, delete-orphan")
    admissions = relationship("HospitalAdmission", back_populates="hospital")
    logs = relationship("HospitalCapacityLog", back_populates="hospital")

    __table_args__ = (
        Index("idx_hospital_district", "district"),
    )

class HospitalBed(Base, AuditMixin):
    __tablename__ = "hospital_beds"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False)
    bed_number = Column(String(50), nullable=False)
    bed_type = Column(String(50), nullable=False) # GENERAL, ICU
    is_occupied = Column(Boolean, default=False, nullable=False)

    hospital = relationship("Hospital", back_populates="beds")
    admissions = relationship("HospitalAdmission", back_populates="bed")

    __table_args__ = (
        Index("idx_bed_hospital_occupied", "hospital_id", "is_occupied"),
    )

class HospitalAdmission(Base, AuditMixin):
    __tablename__ = "hospital_admissions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False)
    patient_name = Column(String(255), nullable=False)
    bed_id = Column(Integer, ForeignKey("hospital_beds.id"), nullable=False)
    admission_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String(50), default="ACTIVE", nullable=False) # ACTIVE, DISCHARGED

    hospital = relationship("Hospital", back_populates="admissions")
    bed = relationship("HospitalBed", back_populates="admissions")
    discharge = relationship("HospitalDischarge", back_populates="admission", uselist=False)

class HospitalDischarge(Base, AuditMixin):
    __tablename__ = "hospital_discharges"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    admission_id = Column(Integer, ForeignKey("hospital_admissions.id"), nullable=False)
    discharge_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    medical_notes = Column(Text, nullable=True)

    admission = relationship("HospitalAdmission", back_populates="discharge")

class HospitalCapacityLog(Base, AuditMixin):
    __tablename__ = "hospital_capacity_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False)
    occupied_beds = Column(Integer, default=0, nullable=False)
    occupied_icu = Column(Integer, default=0, nullable=False)
    occupied_ventilators = Column(Integer, default=0, nullable=False)
    log_time = Column(DateTime, default=datetime.utcnow, nullable=False)

    hospital = relationship("Hospital", back_populates="logs")

# 3. Medicine Surveillance Engine
class MedicineInventory(Base, AuditMixin):
    __tablename__ = "medicine_inventory"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    pharmacy_name = Column(String(255), nullable=False)
    medicine_name = Column(String(255), nullable=False)
    stock_level = Column(Integer, default=0, nullable=False)
    price = Column(Float, default=0.0, nullable=False)

    __table_args__ = (
        Index("idx_med_inventory_name", "medicine_name"),
    )

class MedicineUsageLog(Base, AuditMixin):
    __tablename__ = "medicine_usage_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    pharmacy_name = Column(String(255), nullable=False)
    medicine_name = Column(String(255), nullable=False)
    quantity_sold = Column(Integer, nullable=False)
    log_time = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_med_usage_log_time", "medicine_name", "log_time"),
    )

class DiseaseMedicineMap(Base, AuditMixin):
    __tablename__ = "disease_medicine_map"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    disease_name = Column(String(100), nullable=False)
    medicine_name = Column(String(255), nullable=False)
    weight = Column(Float, default=1.0, nullable=False)

class DiseaseSignal(Base, AuditMixin):
    __tablename__ = "disease_signals"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    disease_name = Column(String(100), nullable=False)
    match_percentage = Column(Float, nullable=False)
    signal_status = Column(String(50), default="WARNING", nullable=False) # WARNING, ALERT, CRITICAL

# 4. Vaccination Management
class Vaccine(Base, AuditMixin):
    __tablename__ = "vaccines"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    targeted_disease = Column(String(100), nullable=False)
    recommended_age_months = Column(Integer, default=0, nullable=False)

    records = relationship("VaccinationRecord", back_populates="vaccine")
    stock = relationship("VaccinationStock", back_populates="vaccine")
    recommendations = relationship("VaccineRecommendation", back_populates="vaccine")

class VaccinationCenter(Base, AuditMixin):
    __tablename__ = "vaccination_centers"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    district = Column(String(100), nullable=False)
    location = Column(String(255), nullable=True)

    records = relationship("VaccinationRecord", back_populates="center")
    stock = relationship("VaccinationStock", back_populates="center")

class VaccinationRecord(Base, AuditMixin):
    __tablename__ = "vaccination_records"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    center_id = Column(Integer, ForeignKey("vaccination_centers.id"), nullable=False)
    patient_name = Column(String(255), nullable=False)
    vaccine_id = Column(Integer, ForeignKey("vaccines.id"), nullable=False)
    dose_number = Column(Integer, default=1, nullable=False)
    administered_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    center = relationship("VaccinationCenter", back_populates="records")
    vaccine = relationship("Vaccine", back_populates="records")

class VaccinationStock(Base, AuditMixin):
    __tablename__ = "vaccination_stock"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    center_id = Column(Integer, ForeignKey("vaccination_centers.id"), nullable=False)
    vaccine_id = Column(Integer, ForeignKey("vaccines.id"), nullable=False)
    quantity = Column(Integer, default=0, nullable=False)

    center = relationship("VaccinationCenter", back_populates="stock")
    vaccine = relationship("Vaccine", back_populates="stock")

class VaccineRecommendation(Base, AuditMixin):
    __tablename__ = "vaccine_recommendations"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_name = Column(String(255), nullable=False)
    recommended_vaccine_id = Column(Integer, ForeignKey("vaccines.id"), nullable=False)
    reason = Column(Text, nullable=True)

    vaccine = relationship("Vaccine", back_populates="recommendations")

# 5. Ambulance Dispatch
class Ambulance(Base, AuditMixin):
    __tablename__ = "ambulances"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    plate_number = Column(String(50), unique=True, nullable=False)
    vehicle_type = Column(String(50), nullable=False) # BASIC, ADVANCED
    status = Column(String(50), default="IDLE", nullable=False) # IDLE, DISPATCHED, ACTIVE

    locations = relationship("AmbulanceLocation", back_populates="ambulance", cascade="all, delete-orphan")
    dispatches = relationship("DispatchHistory", back_populates="ambulance")

class AmbulanceLocation(Base, AuditMixin):
    __tablename__ = "ambulance_locations"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    ambulance_id = Column(Integer, ForeignKey("ambulances.id"), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    ambulance = relationship("Ambulance", back_populates="locations")

class DispatchRequest(Base, AuditMixin):
    __tablename__ = "dispatch_requests"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    emergency_lat = Column(Float, nullable=False)
    emergency_lng = Column(Float, nullable=False)
    severity_level = Column(String(50), nullable=False) # critical, serious, minor
    status = Column(String(50), default="PENDING", nullable=False) # PENDING, DISPATCHED, COMPLETED

    dispatches = relationship("DispatchHistory", back_populates="request")

class DispatchHistory(Base, AuditMixin):
    __tablename__ = "dispatch_history"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    dispatch_request_id = Column(Integer, ForeignKey("dispatch_requests.id"), nullable=False)
    ambulance_id = Column(Integer, ForeignKey("ambulances.id"), nullable=False)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=True)
    eta_minutes = Column(Integer, nullable=False)
    route_points = Column(JSON, nullable=True) # Polyline coordinates

    request = relationship("DispatchRequest", back_populates="dispatches")
    ambulance = relationship("Ambulance", back_populates="dispatches")
    hospital = relationship("Hospital")

# 6. Health Governance Agent Reports
class HealthAgentReport(Base, AuditMixin):
    __tablename__ = "health_agent_reports"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    query_text = Column(Text, nullable=False)
    district_name = Column(String(100), nullable=False)
    risk_level = Column(String(50), nullable=False)
    contributing_factors = Column(JSON, nullable=False)
    expected_spread = Column(Text, nullable=False)
    recommended_actions = Column(JSON, nullable=False)
    resource_requirements = Column(JSON, nullable=False)
    confidence_score = Column(Float, nullable=False)
