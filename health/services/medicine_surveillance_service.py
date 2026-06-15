# health/services/medicine_surveillance_service.py
from datetime import datetime, timedelta
from typing import Dict, List, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from health.models.health_models import (
    MedicineInventory, MedicineUsageLog, DiseaseMedicineMap, DiseaseSignal
)

DISEASE_PROFILES = {
    "Dengue": [
        {"medicine_name": "Paracetamol 650mg", "weight": 0.5},
        {"medicine_name": "ORS Powder", "weight": 0.3},
        {"medicine_name": "IV Fluids (Normal Saline)", "weight": 0.2}
    ],
    "Typhoid": [
        {"medicine_name": "Cefixime 200mg", "weight": 0.6},
        {"medicine_name": "Azithromycin 500mg", "weight": 0.4}
    ],
    "Malaria": [
        {"medicine_name": "Artemisinin-based Combination Therapy (ACT)", "weight": 1.0}
    ]
}

class MedicineSurveillanceService:
    
    @staticmethod
    def initialize_disease_maps(db: Session):
        """Pre-populate the database with standard disease-to-medicine weights"""
        for disease, meds in DISEASE_PROFILES.items():
            for med in meds:
                # Check if mapping already exists
                existing = db.query(DiseaseMedicineMap).filter(
                    DiseaseMedicineMap.disease_name == disease,
                    DiseaseMedicineMap.medicine_name == med["medicine_name"],
                    DiseaseMedicineMap.is_deleted == False
                ).first()
                if not existing:
                    mapping = DiseaseMedicineMap(
                        disease_name=disease,
                        medicine_name=med["medicine_name"],
                        weight=med["weight"]
                    )
                    db.add(mapping)
        db.commit()

    @staticmethod
    def record_usage(db: Session, pharmacy_name: str, medicine_name: str, quantity: int) -> MedicineUsageLog:
        """Log medicine sales/usage and update inventory"""
        # 1. Update inventory stock
        inv = db.query(MedicineInventory).filter(
            MedicineInventory.pharmacy_name == pharmacy_name,
            MedicineInventory.medicine_name == medicine_name,
            MedicineInventory.is_deleted == False
        ).first()
        
        if inv:
            inv.stock_level = max(0, inv.stock_level - quantity)
        else:
            # Create a default inventory row
            inv = MedicineInventory(
                pharmacy_name=pharmacy_name,
                medicine_name=medicine_name,
                stock_level=1000 - quantity,
                price=50.0
            )
            db.add(inv)

        # 2. Record usage log
        usage_log = MedicineUsageLog(
            pharmacy_name=pharmacy_name,
            medicine_name=medicine_name,
            quantity_sold=quantity,
            log_time=datetime.utcnow()
        )
        db.add(usage_log)
        db.commit()
        db.refresh(usage_log)
        return usage_log

    @staticmethod
    def run_surveillance(db: Session, threshold_pct: float = 80.0) -> List[Dict[str, Any]]:
        """
        Analyze recent medicine consumption spikes and compute match percentages for active profiles.
        If the match percentage exceeds the threshold, trigger and save a DiseaseSignal alert.
        """
        # Ensure mappings are initialized
        MedicineSurveillanceService.initialize_disease_maps(db)

        # Get list of unique mapped diseases
        diseases = db.query(DiseaseMedicineMap.disease_name).distinct().all()
        diseases = [d[0] for d in diseases]

        signals_triggered = []
        now = datetime.utcnow()
        last_24h = now - timedelta(hours=24)
        previous_24h = now - timedelta(hours=48)

        for disease in diseases:
            mappings = db.query(DiseaseMedicineMap).filter(
                DiseaseMedicineMap.disease_name == disease,
                DiseaseMedicineMap.is_deleted == False
            ).all()

            if not mappings:
                continue

            total_weight = 0.0
            matched_weight = 0.0

            for mapping in mappings:
                med_name = mapping.medicine_name
                weight = mapping.weight
                total_weight += weight

                # Get quantity sold in last 24 hours
                recent_sales = db.query(func.sum(MedicineUsageLog.quantity_sold)).filter(
                    MedicineUsageLog.medicine_name == med_name,
                    MedicineUsageLog.log_time >= last_24h,
                    MedicineUsageLog.is_deleted == False
                ).scalar() or 0

                # Get baseline daily sales (average over the 24h before that)
                baseline_sales = db.query(func.sum(MedicineUsageLog.quantity_sold)).filter(
                    MedicineUsageLog.medicine_name == med_name,
                    MedicineUsageLog.log_time >= previous_24h,
                    MedicineUsageLog.log_time < last_24h,
                    MedicineUsageLog.is_deleted == False
                ).scalar() or 0

                # Determine if there is a spike.
                # If there are no baseline sales but recent sales > 20 units, consider it a spike.
                # Otherwise, if recent sales are 1.5x of baseline, it's a spike.
                is_spike = False
                if baseline_sales == 0 and recent_sales >= 15:
                    is_spike = True
                elif baseline_sales > 0 and (recent_sales / baseline_sales) >= 1.4:
                    is_spike = True

                if is_spike:
                    matched_weight += weight

            # Compute profile match percentage
            match_pct = round((matched_weight / max(total_weight, 0.1)) * 100, 2)
            
            # If match exceeds threshold, create an alert signal
            if match_pct >= threshold_pct:
                status = "CRITICAL" if match_pct >= 90 else "ALERT"
                
                # Create and save DiseaseSignal
                signal = DiseaseSignal(
                    disease_name=disease,
                    match_percentage=match_pct,
                    signal_status=status
                )
                db.add(signal)
                db.commit()
                
                signals_triggered.append({
                    "disease": disease,
                    "match_percentage": match_pct,
                    "signal_status": status,
                    "created_at": signal.created_at
                })

        return signals_triggered
