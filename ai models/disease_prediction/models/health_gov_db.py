# models/health_gov_db.py
from datetime import datetime
from uuid import uuid4
from sqlalchemy import (
    create_engine, Column, Integer, Float, String, Boolean, DateTime, JSON, Text
)
from sqlalchemy.orm import declarative_base, sessionmaker
from disease_prediction.config.settings import settings

Base = declarative_base()

class HealthOutbreakPrediction(Base):
    __tablename__ = 'health_outbreak_predictions'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    district_name = Column(String(255), nullable=False)
    disease = Column(String(255), nullable=False)
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    rainfall = Column(Float, nullable=False)
    population_density = Column(Float, nullable=False)
    historical_cases = Column(Integer, nullable=False)
    sanitation_index = Column(Float, nullable=False)
    mosquito_density = Column(Float, nullable=False)
    water_logging_reports = Column(Integer, nullable=False)
    outbreak_probability = Column(Float, nullable=False)
    severity_score = Column(Float, nullable=False)
    expected_cases_7d = Column(Integer, nullable=False)
    expected_cases_30d = Column(Integer, nullable=False)
    risk_heatmap = Column(JSON, nullable=True)
    confidence_score = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class HospitalForecast(Base):
    __tablename__ = 'hospital_forecasts'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    district_name = Column(String(255), nullable=False)
    hospital_name = Column(String(255), nullable=False)
    current_occupancy = Column(Integer, nullable=False)
    icu_usage = Column(Integer, nullable=False)
    ventilator_usage = Column(Integer, nullable=False)
    disease_outbreak_data = Column(JSON, nullable=True)
    seasonal_trends = Column(String(100), nullable=True)
    expected_occupancy = Column(Integer, nullable=False)
    icu_requirement_forecast = Column(Integer, nullable=False)
    bed_shortage_warning = Column(Boolean, default=False)
    resource_recommendation = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class AmbulanceDispatch(Base):
    __tablename__ = 'ambulance_dispatches'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    dispatch_id = Column(String(50), default=lambda: str(uuid4()), unique=True)
    ambulance_plate = Column(String(50), nullable=False)
    current_lat = Column(Float, nullable=False)
    current_lng = Column(Float, nullable=False)
    traffic_conditions = Column(String(100), nullable=False)
    emergency_severity = Column(String(50), nullable=False)
    assigned_hospital = Column(String(255), nullable=False)
    hospital_availability = Column(JSON, nullable=True)
    eta_minutes = Column(Integer, nullable=False)
    route_geometry = Column(JSON, nullable=True)
    status = Column(String(50), default='DISPATCHED')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class MedicineForecast(Base):
    __tablename__ = 'medicine_forecasts'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    district_name = Column(String(255), nullable=False)
    pharmacy_name = Column(String(255), nullable=False)
    medicine_name = Column(String(255), nullable=False)
    current_inventory = Column(Integer, nullable=False)
    disease_trends = Column(JSON, nullable=True)
    historical_sales = Column(JSON, nullable=True)
    seasonal_effects = Column(String(100), nullable=True)
    predicted_demand = Column(Integer, nullable=False)
    stockout_risk_level = Column(String(50), nullable=False)
    restock_recommendation = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class VaccinationForecast(Base):
    __tablename__ = 'vaccination_forecasts'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    district_name = Column(String(255), nullable=False)
    disease_name = Column(String(255), nullable=False)
    population_demographics = Column(JSON, nullable=True)
    vaccination_records = Column(JSON, nullable=True)
    disease_outbreak_data = Column(JSON, nullable=True)
    required_doses = Column(Integer, nullable=False)
    coverage_forecast_pct = Column(Float, nullable=False)
    priority_zones = Column(JSON, nullable=True)
    campaign_recommendation = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class HealthAgentReport(Base):
    __tablename__ = 'health_agent_reports'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    query_text = Column(Text, nullable=False)
    district_name = Column(String(255), nullable=False)
    risk_level = Column(String(50), nullable=False)
    contributing_factors = Column(JSON, nullable=False)
    expected_spread = Column(Text, nullable=False)
    recommended_actions = Column(JSON, nullable=False)
    resource_requirements = Column(JSON, nullable=False)
    confidence_score = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class SimulationRun(Base):
    __tablename__ = 'simulation_runs'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    simulation_id = Column(String(50), default=lambda: str(uuid4()), unique=True)
    simulation_type = Column(String(100), nullable=False)
    district_name = Column(String(255), nullable=False)
    parameters = Column(JSON, nullable=False)
    timeline = Column(JSON, nullable=False)
    impact_metrics = Column(JSON, nullable=False)
    resource_utilization = Column(JSON, nullable=True)
    mortality_reduction_pct = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# Engine & Sessionmaker
engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
