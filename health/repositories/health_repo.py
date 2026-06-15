# health/repositories/health_repo.py
from datetime import datetime
from typing import List, Type, TypeVar, Optional, Generic
from sqlalchemy.orm import Session
from health.models.database import Base

T = TypeVar("T", bound=Base)

class BaseRepository(Generic[T]):
    """Generic Repository for CRUD and Soft Deletes"""
    
    def __init__(self, model: Type[T]):
        self.model = model

    def get_by_id(self, db: Session, id: int) -> Optional[T]:
        return db.query(self.model).filter(
            self.model.id == id,
            self.model.is_deleted == False
        ).first()

    def get_all(self, db: Session) -> List[T]:
        return db.query(self.model).filter(
            self.model.is_deleted == False
        ).all()

    def create(self, db: Session, obj_data: dict) -> T:
        db_obj = self.model(**obj_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: T, obj_data: dict) -> T:
        for field, val in obj_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, val)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, db_obj: T) -> T:
        """Soft Delete"""
        db_obj.is_deleted = True
        db_obj.deleted_at = datetime.utcnow()
        db.commit()
        db.refresh(db_obj)
        return db_obj


# Custom repository implementations
from health.models.health_models import (
    HealthOutbreakPrediction, Hospital, HospitalBed, HospitalAdmission,
    HospitalDischarge, HospitalCapacityLog, MedicineInventory, MedicineUsageLog,
    DiseaseMedicineMap, DiseaseSignal, Vaccine, VaccinationCenter,
    VaccinationRecord, VaccinationStock, VaccineRecommendation, Ambulance,
    AmbulanceLocation, DispatchRequest, DispatchHistory, HealthAgentReport
)

class OutbreakRepository(BaseRepository[HealthOutbreakPrediction]):
    def __init__(self):
        super().__init__(HealthOutbreakPrediction)
        
    def get_latest(self, db: Session, limit: int = 10) -> List[HealthOutbreakPrediction]:
        return db.query(self.model).filter(
            self.model.is_deleted == False
        ).order_by(self.model.created_at.desc()).limit(limit).all()

class HospitalRepository(BaseRepository[Hospital]):
    def __init__(self):
        super().__init__(Hospital)

class HospitalBedRepository(BaseRepository[HospitalBed]):
    def __init__(self):
        super().__init__(HospitalBed)

class AdmissionRepository(BaseRepository[HospitalAdmission]):
    def __init__(self):
        super().__init__(HospitalAdmission)

class DischargeRepository(BaseRepository[HospitalDischarge]):
    def __init__(self):
        super().__init__(HospitalDischarge)

class CapacityLogRepository(BaseRepository[HospitalCapacityLog]):
    def __init__(self):
        super().__init__(HospitalCapacityLog)

class MedicineInventoryRepository(BaseRepository[MedicineInventory]):
    def __init__(self):
        super().__init__(MedicineInventory)

class MedicineUsageLogRepository(BaseRepository[MedicineUsageLog]):
    def __init__(self):
        super().__init__(MedicineUsageLog)

class DiseaseMedicineMapRepository(BaseRepository[DiseaseMedicineMap]):
    def __init__(self):
        super().__init__(DiseaseMedicineMap)

class DiseaseSignalRepository(BaseRepository[DiseaseSignal]):
    def __init__(self):
        super().__init__(DiseaseSignal)
        
    def get_latest_signals(self, db: Session, limit: int = 10) -> List[DiseaseSignal]:
        return db.query(self.model).filter(
            self.model.is_deleted == False
        ).order_by(self.model.created_at.desc()).limit(limit).all()

class VaccineRepository(BaseRepository[Vaccine]):
    def __init__(self):
        super().__init__(Vaccine)

class VaccinationCenterRepository(BaseRepository[VaccinationCenter]):
    def __init__(self):
        super().__init__(VaccinationCenter)

class VaccinationRecordRepository(BaseRepository[VaccinationRecord]):
    def __init__(self):
        super().__init__(VaccinationRecord)

class VaccinationStockRepository(BaseRepository[VaccinationStock]):
    def __init__(self):
        super().__init__(VaccinationStock)

class VaccineRecommendationRepository(BaseRepository[VaccineRecommendation]):
    def __init__(self):
        super().__init__(VaccineRecommendation)

class AmbulanceRepository(BaseRepository[Ambulance]):
    def __init__(self):
        super().__init__(Ambulance)

class AmbulanceLocationRepository(BaseRepository[AmbulanceLocation]):
    def __init__(self):
        super().__init__(AmbulanceLocation)

class DispatchRequestRepository(BaseRepository[DispatchRequest]):
    def __init__(self):
        super().__init__(DispatchRequest)

class DispatchHistoryRepository(BaseRepository[DispatchHistory]):
    def __init__(self):
        super().__init__(DispatchHistory)

class HealthAgentReportRepository(BaseRepository[HealthAgentReport]):
    def __init__(self):
        super().__init__(HealthAgentReport)
