# repositories/health_gov.py
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from models.health_gov_db import (
    HealthOutbreakPrediction, HospitalForecast, AmbulanceDispatch,
    MedicineForecast, VaccinationForecast, HealthAgentReport, SimulationRun
)

class HealthGovRepository:
    def __init__(self, db: Session):
        self.db = db

    # 1. Outbreak Predictions
    def save_outbreak_prediction(self, pred: HealthOutbreakPrediction) -> HealthOutbreakPrediction:
        self.db.add(pred)
        self.db.commit()
        self.db.refresh(pred)
        return pred

    def get_outbreak_predictions(self, limit: int = 50) -> List[HealthOutbreakPrediction]:
        return self.db.query(HealthOutbreakPrediction).order_by(desc(HealthOutbreakPrediction.created_at)).limit(limit).all()

    def get_district_outbreak_predictions(self, district: str, limit: int = 10) -> List[HealthOutbreakPrediction]:
        return self.db.query(HealthOutbreakPrediction).filter(
            HealthOutbreakPrediction.district_name.ilike(district)
        ).order_by(desc(HealthOutbreakPrediction.created_at)).limit(limit).all()

    # 2. Hospital Forecasts
    def save_hospital_forecast(self, forecast: HospitalForecast) -> HospitalForecast:
        self.db.add(forecast)
        self.db.commit()
        self.db.refresh(forecast)
        return forecast

    def get_hospital_forecasts(self, limit: int = 50) -> List[HospitalForecast]:
        return self.db.query(HospitalForecast).order_by(desc(HospitalForecast.created_at)).limit(limit).all()

    # 3. Ambulance Dispatches
    def save_ambulance_dispatch(self, dispatch: AmbulanceDispatch) -> AmbulanceDispatch:
        self.db.add(dispatch)
        self.db.commit()
        self.db.refresh(dispatch)
        return dispatch

    def get_ambulance_dispatches(self, limit: int = 50) -> List[AmbulanceDispatch]:
        return self.db.query(AmbulanceDispatch).order_by(desc(AmbulanceDispatch.created_at)).limit(limit).all()

    def get_active_dispatches(self) -> List[AmbulanceDispatch]:
        return self.db.query(AmbulanceDispatch).filter(
            AmbulanceDispatch.status.in_(['DISPATCHED', 'EN_ROUTE', 'ARRIVED'])
        ).order_by(desc(AmbulanceDispatch.created_at)).all()

    def update_dispatch_status(self, dispatch_id: str, status: str) -> Optional[AmbulanceDispatch]:
        dispatch = self.db.query(AmbulanceDispatch).filter(AmbulanceDispatch.dispatch_id == dispatch_id).first()
        if dispatch:
            dispatch.status = status
            self.db.commit()
            self.db.refresh(dispatch)
        return dispatch

    # 4. Medicine Forecasts
    def save_medicine_forecast(self, forecast: MedicineForecast) -> MedicineForecast:
        self.db.add(forecast)
        self.db.commit()
        self.db.refresh(forecast)
        return forecast

    def get_medicine_forecasts(self, limit: int = 50) -> List[MedicineForecast]:
        return self.db.query(MedicineForecast).order_by(desc(MedicineForecast.created_at)).limit(limit).all()

    # 5. Vaccination Forecasts
    def save_vaccination_forecast(self, forecast: VaccinationForecast) -> VaccinationForecast:
        self.db.add(forecast)
        self.db.commit()
        self.db.refresh(forecast)
        return forecast

    def get_vaccination_forecasts(self, limit: int = 50) -> List[VaccinationForecast]:
        return self.db.query(VaccinationForecast).order_by(desc(VaccinationForecast.created_at)).limit(limit).all()

    # 6. Health Agent Reports
    def save_agent_report(self, report: HealthAgentReport) -> HealthAgentReport:
        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)
        return report

    def get_agent_reports(self, limit: int = 20) -> List[HealthAgentReport]:
        return self.db.query(HealthAgentReport).order_by(desc(HealthAgentReport.created_at)).limit(limit).all()

    # 7. Simulation Runs
    def save_simulation_run(self, run: SimulationRun) -> SimulationRun:
        self.db.add(run)
        self.db.commit()
        self.db.refresh(run)
        return run

    def get_simulation_runs(self, limit: int = 20) -> List[SimulationRun]:
        return self.db.query(SimulationRun).order_by(desc(SimulationRun.created_at)).limit(limit).all()
