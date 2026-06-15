# health/services/vaccination_service.py
from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from health.models.health_models import (
    Vaccine, VaccinationCenter, VaccinationRecord, VaccinationStock, VaccineRecommendation
)

VACCINE_MAPPING = {
    "Measles": {"vaccine_name": "MMR", "recommended_age_months": 12},
    "Polio": {"vaccine_name": "OPV", "recommended_age_months": 0},
    "Influenza": {"vaccine_name": "Influenza Vaccine", "recommended_age_months": 6}
}

class VaccinationService:
    
    @staticmethod
    def initialize_vaccine_data(db: Session):
        """Pre-populate default vaccine records"""
        for disease, details in VACCINE_MAPPING.items():
            existing = db.query(Vaccine).filter(
                Vaccine.name == details["vaccine_name"],
                Vaccine.is_deleted == False
            ).first()
            if not existing:
                vaccine = Vaccine(
                    name=details["vaccine_name"],
                    targeted_disease=disease,
                    recommended_age_months=details["recommended_age_months"]
                )
                db.add(vaccine)
        db.commit()

    @staticmethod
    def get_recommendation(db: Session, patient_name: str, disease_name: str) -> Dict[str, Any]:
        """Generate a vaccine recommendation based on target disease"""
        VaccinationService.initialize_vaccine_data(db)
        
        vaccine = db.query(Vaccine).filter(
            Vaccine.targeted_disease == disease_name,
            Vaccine.is_deleted == False
        ).first()

        if not vaccine:
            raise ValueError(f"No vaccine recommendation available for disease: {disease_name}")

        reason = f"Recommended targeting of {disease_name} outbreaks. Standard vaccination age schedule: {vaccine.recommended_age_months} months."
        
        # Save recommendation
        rec = VaccineRecommendation(
            patient_name=patient_name,
            recommended_vaccine_id=vaccine.id,
            reason=reason
        )
        db.add(rec)
        db.commit()
        
        return {
            "patient_name": patient_name,
            "recommended_vaccine": vaccine.name,
            "targeted_disease": disease_name,
            "reason": reason,
            "created_at": rec.created_at
        }

    @staticmethod
    def update_stock(db: Session, center_id: int, vaccine_id: int, quantity: int) -> VaccinationStock:
        """Update center vaccination stock level"""
        # Ensure vaccine and center exist
        center = db.query(VaccinationCenter).filter(
            VaccinationCenter.id == center_id,
            VaccinationCenter.is_deleted == False
        ).first()
        if not center:
            raise ValueError("Vaccination center not found")
            
        vaccine = db.query(Vaccine).filter(
            Vaccine.id == vaccine_id,
            Vaccine.is_deleted == False
        ).first()
        if not vaccine:
            raise ValueError("Vaccine not found")

        stock = db.query(VaccinationStock).filter(
            VaccinationStock.center_id == center_id,
            VaccinationStock.vaccine_id == vaccine_id,
            VaccinationStock.is_deleted == False
        ).first()

        if stock:
            stock.quantity = quantity
        else:
            stock = VaccinationStock(
                center_id=center_id,
                vaccine_id=vaccine_id,
                quantity=quantity
            )
            db.add(stock)

        db.commit()
        db.refresh(stock)
        return stock

    @staticmethod
    def record_vaccination(db: Session, center_id: int, patient_name: str, vaccine_id: int, dose_number: int) -> VaccinationRecord:
        """Administer vaccine dose (deducts center stock level dynamically)"""
        # Check stock availability
        stock = db.query(VaccinationStock).filter(
            VaccinationStock.center_id == center_id,
            VaccinationStock.vaccine_id == vaccine_id,
            VaccinationStock.is_deleted == False
        ).first()

        if not stock or stock.quantity <= 0:
            raise ValueError("Insufficient vaccine stock at this center")

        # Deduct stock
        stock.quantity -= 1

        record = VaccinationRecord(
            center_id=center_id,
            patient_name=patient_name,
            vaccine_id=vaccine_id,
            dose_number=dose_number,
            administered_at=datetime.utcnow()
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def get_coverage_analytics(db: Session, district: str) -> Dict[str, Any]:
        """Generate coverage and dose requirements metrics"""
        # Query total records administered in this district
        total_doses = db.query(VaccinationRecord).join(VaccinationCenter).filter(
            VaccinationCenter.district == district,
            VaccinationRecord.is_deleted == False
        ).count()

        # Group count of records by vaccine name
        vaccines = db.query(Vaccine.name, func.count(VaccinationRecord.id)).select_from(VaccinationRecord).join(Vaccine).join(VaccinationCenter).filter(
            VaccinationCenter.district == district,
            VaccinationRecord.is_deleted == False
        ).group_by(Vaccine.name).all()

        vaccine_counts = {vname: count for vname, count in vaccines}

        # Simulating coverage percent based on typical local population values
        coverage_pct = min(round((total_doses / 5000) * 100, 2), 100.0) if total_doses > 0 else 0.0

        return {
            "district": district,
            "total_administered_doses": total_doses,
            "coverage_percentage": coverage_pct,
            "vaccines_distribution": vaccine_counts,
            "status": "STABLE" if coverage_pct >= 70.0 else "REQUIRES_ATTENTION"
        }
