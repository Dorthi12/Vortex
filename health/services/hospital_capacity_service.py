# health/services/hospital_capacity_service.py
from datetime import datetime
from typing import Dict, List, Any
from sqlalchemy.orm import Session
from health.models.health_models import (
    Hospital, HospitalBed, HospitalAdmission, HospitalDischarge, HospitalCapacityLog
)

class HospitalCapacityService:
    
    @staticmethod
    def get_analytics(db: Session, hospital_id: int) -> Dict[str, Any]:
        """Calculate occupancy rates and utilization metrics"""
        hospital = db.query(Hospital).filter(Hospital.id == hospital_id, Hospital.is_deleted == False).first()
        if not hospital:
            raise ValueError("Hospital not found")
            
        # Get count of occupied general beds and ICU beds
        general_occupied = db.query(HospitalBed).filter(
            HospitalBed.hospital_id == hospital_id,
            HospitalBed.bed_type == "GENERAL",
            HospitalBed.is_occupied == True,
            HospitalBed.is_deleted == False
        ).count()
        
        icu_occupied = db.query(HospitalBed).filter(
            HospitalBed.hospital_id == hospital_id,
            HospitalBed.bed_type == "ICU",
            HospitalBed.is_occupied == True,
            HospitalBed.is_deleted == False
        ).count()

        # Let's count how many ventilators are active (active ICU patients with a ventilator requirement)
        # For simplicity, we assume active ventilator count is tracked or matches a percentage of active ICU beds
        # or we log ventilator use directly in admissions. Let's get active ventilator count from the latest log
        latest_log = db.query(HospitalCapacityLog).filter(
            HospitalCapacityLog.hospital_id == hospital_id
        ).order_by(HospitalCapacityLog.log_time.desc()).first()
        
        vent_occupied = latest_log.occupied_ventilators if latest_log else int(icu_occupied * 0.5)

        total_beds = hospital.total_beds
        total_icu = hospital.total_icu_beds
        total_vents = hospital.total_ventilators

        # Totals combined
        occupied_beds = general_occupied + icu_occupied

        occupancy_rate = round((occupied_beds / max(total_beds, 1)) * 100, 2)
        icu_utilization = round((icu_occupied / max(total_icu, 1)) * 100, 2)
        vent_utilization = round((vent_occupied / max(total_vents, 1)) * 100, 2)

        return {
            "hospital_id": hospital_id,
            "hospital_name": hospital.name,
            "total_beds": total_beds,
            "occupied_beds": occupied_beds,
            "occupancy_rate": occupancy_rate,
            "total_icu_beds": total_icu,
            "occupied_icu": icu_occupied,
            "icu_utilization": icu_utilization,
            "total_ventilators": total_vents,
            "occupied_ventilators": vent_occupied,
            "ventilator_utilization": vent_utilization
        }

    @staticmethod
    def admit_patient(db: Session, hospital_id: int, patient_name: str, bed_type: str) -> HospitalAdmission:
        """Find an empty bed and perform transactional admission"""
        # 1. Verify hospital existence
        hospital = db.query(Hospital).filter(Hospital.id == hospital_id, Hospital.is_deleted == False).first()
        if not hospital:
            raise ValueError("Hospital not found")

        # 2. Find an unoccupied bed of the requested type
        free_bed = db.query(HospitalBed).filter(
            HospitalBed.hospital_id == hospital_id,
            HospitalBed.bed_type == bed_type,
            HospitalBed.is_occupied == False,
            HospitalBed.is_deleted == False
        ).first()

        if not free_bed:
            raise ValueError(f"No available {bed_type} beds in this hospital.")

        # 3. Transactionally mark bed as occupied
        free_bed.is_occupied = True
        
        # 4. Create Admission record
        admission = HospitalAdmission(
            hospital_id=hospital_id,
            patient_name=patient_name,
            bed_id=free_bed.id,
            admission_date=datetime.utcnow(),
            status="ACTIVE"
        )
        db.add(admission)
        db.commit()
        db.refresh(admission)

        # 5. Log capacity change
        HospitalCapacityService._log_capacity(db, hospital_id)
        
        return admission

    @staticmethod
    def discharge_patient(db: Session, admission_id: int, medical_notes: str = None) -> HospitalDischarge:
        """Release the bed and perform transactional discharge"""
        # 1. Find the active admission
        admission = db.query(HospitalAdmission).filter(
            HospitalAdmission.id == admission_id,
            HospitalAdmission.status == "ACTIVE",
            HospitalAdmission.is_deleted == False
        ).first()
        
        if not admission:
            raise ValueError("Active admission not found")

        # 2. Update admission status
        admission.status = "DISCHARGED"
        
        # 3. Create discharge record
        discharge = HospitalDischarge(
            admission_id=admission.id,
            discharge_date=datetime.utcnow(),
            medical_notes=medical_notes
        )
        db.add(discharge)

        # 4. Mark bed as vacant
        bed = db.query(HospitalBed).filter(HospitalBed.id == admission.bed_id).first()
        if bed:
            bed.is_occupied = False

        db.commit()
        db.refresh(discharge)

        # 5. Log capacity change
        HospitalCapacityService._log_capacity(db, admission.hospital_id)
        
        return discharge

    @staticmethod
    def _log_capacity(db: Session, hospital_id: int):
        """Internal helper to write to hospital_capacity_logs"""
        # Get count of occupied general beds and ICU beds
        general_occupied = db.query(HospitalBed).filter(
            HospitalBed.hospital_id == hospital_id,
            HospitalBed.bed_type == "GENERAL",
            HospitalBed.is_occupied == True,
            HospitalBed.is_deleted == False
        ).count()
        
        icu_occupied = db.query(HospitalBed).filter(
            HospitalBed.hospital_id == hospital_id,
            HospitalBed.bed_type == "ICU",
            HospitalBed.is_occupied == True,
            HospitalBed.is_deleted == False
        ).count()

        # Simple logic: assume 50% of occupied ICU beds require a ventilator
        vent_occupied = int(icu_occupied * 0.5)

        log = HospitalCapacityLog(
            hospital_id=hospital_id,
            occupied_beds=general_occupied + icu_occupied,
            occupied_icu=icu_occupied,
            occupied_ventilators=vent_occupied,
            log_time=datetime.utcnow()
        )
        db.add(log)
        db.commit()
