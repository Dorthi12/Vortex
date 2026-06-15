# health/services/ambulance_dispatch_service.py
import math
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from health.models.health_models import (
    Ambulance, AmbulanceLocation, Hospital, DispatchRequest, DispatchHistory
)

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate Haversine distance in kilometers"""
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2)**2 + 
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

class AmbulanceDispatchService:
    
    @staticmethod
    def get_nearest_ambulance(db: Session, lat: float, lng: float) -> Optional[Ambulance]:
        """Find nearest IDLE ambulance based on Haversine distance"""
        idle_ambulances = db.query(Ambulance).filter(
            Ambulance.status == "IDLE",
            Ambulance.is_deleted == False
        ).all()
        
        if not idle_ambulances:
            return None

        nearest = None
        min_dist = float("inf")

        for amb in idle_ambulances:
            loc = db.query(AmbulanceLocation).filter(
                AmbulanceLocation.ambulance_id == amb.id,
                AmbulanceLocation.is_deleted == False
            ).order_by(AmbulanceLocation.created_at.desc()).first()
            
            if loc:
                dist = haversine_distance(lat, lng, loc.latitude, loc.longitude)
                if dist < min_dist:
                    min_dist = dist
                    nearest = amb
                    
        return nearest

    @staticmethod
    def get_nearest_hospital(db: Session, lat: float, lng: float, district: str) -> Optional[Hospital]:
        """Find nearest Hospital in the district"""
        hospitals = db.query(Hospital).filter(
            Hospital.district == district,
            Hospital.is_deleted == False
        ).all()

        if not hospitals:
            # Fallback to any hospital if none in this district
            hospitals = db.query(Hospital).filter(Hospital.is_deleted == False).all()

        if not hospitals:
            return None

        nearest = None
        min_dist = float("inf")

        for hosp in hospitals:
            # Parse coordinates from location string if formatted like "26.85,80.95"
            # Otherwise use default values
            h_lat, h_lng = 26.85, 80.95
            if hosp.location and "," in hosp.location:
                try:
                    parts = hosp.location.split(",")
                    h_lat, h_lng = float(parts[0]), float(parts[1])
                except ValueError:
                    pass
            
            dist = haversine_distance(lat, lng, h_lat, h_lng)
            if dist < min_dist:
                min_dist = dist
                nearest = hosp

        return nearest

    @staticmethod
    def calculate_eta_and_route(
        lat1: float, lng1: float, lat2: float, lng2: float, traffic: str = "moderate"
    ) -> Dict[str, Any]:
        """Calculate travel time (ETA) and route polyline points"""
        dist = haversine_distance(lat1, lng1, lat2, lng2)
        
        # Speed mapping (km/h)
        speed = 35.0
        if traffic == "light":
            speed = 50.0
        elif traffic == "heavy":
            speed = 15.0
            
        travel_hours = dist / speed
        eta_minutes = int(travel_hours * 60) + 3 # Add 3 minutes buffer

        # Optimize/simulate route geometry as a series of intermediate coordinates
        steps = 5
        route_points = []
        for i in range(steps + 1):
            t = i / steps
            inter_lat = lat1 + t * (lat2 - lat1)
            inter_lng = lng1 + t * (lng2 - lng1)
            route_points.append({"latitude": round(inter_lat, 5), "longitude": round(inter_lng, 5)})

        return {
            "distance_km": round(dist, 2),
            "eta_minutes": max(1, eta_minutes),
            "route_points": route_points
        }

    @staticmethod
    def dispatch_ambulance(
        db: Session, request_id: int, traffic_conditions: str = "moderate"
    ) -> DispatchHistory:
        """Core dispatch transactional flow"""
        req = db.query(DispatchRequest).filter(
            DispatchRequest.id == request_id,
            DispatchRequest.status == "PENDING",
            DispatchRequest.is_deleted == False
        ).first()

        if not req:
            raise ValueError("Pending dispatch request not found")

        # 1. Find nearest idle ambulance
        ambulance = AmbulanceDispatchService.get_nearest_ambulance(db, req.emergency_lat, req.emergency_lng)
        if not ambulance:
            raise ValueError("No available ambulances at the moment.")

        # 2. Find nearest hospital in Lucknow district ( Lucknow is default )
        hospital = AmbulanceDispatchService.get_nearest_hospital(db, req.emergency_lat, req.emergency_lng, "Lucknow")
        h_lat, h_lng = 26.85, 80.95
        h_id = None
        if hospital:
            h_id = hospital.id
            if hospital.location and "," in hospital.location:
                try:
                    parts = hospital.location.split(",")
                    h_lat, h_lng = float(parts[0]), float(parts[1])
                except ValueError:
                    pass

        # 3. Get ambulance current location
        amb_loc = db.query(AmbulanceLocation).filter(
            AmbulanceLocation.ambulance_id == ambulance.id,
            AmbulanceLocation.is_deleted == False
        ).order_by(AmbulanceLocation.created_at.desc()).first()
        
        a_lat, a_lng = req.emergency_lat + 0.05, req.emergency_lng + 0.05
        if amb_loc:
            a_lat, a_lng = amb_loc.latitude, amb_loc.longitude

        # 4. Calculate ETA & Route from ambulance -> incident -> hospital
        transit1 = AmbulanceDispatchService.calculate_eta_and_route(a_lat, a_lng, req.emergency_lat, req.emergency_lng, traffic_conditions)
        transit2 = AmbulanceDispatchService.calculate_eta_and_route(req.emergency_lat, req.emergency_lng, h_lat, h_lng, traffic_conditions)
        
        total_eta = transit1["eta_minutes"] + transit2["eta_minutes"]
        combined_route = transit1["route_points"] + transit2["route_points"]

        # 5. Transactionally update state
        req.status = "DISPATCHED"
        ambulance.status = "DISPATCHED"

        dispatch = DispatchHistory(
            dispatch_request_id=req.id,
            ambulance_id=ambulance.id,
            hospital_id=h_id,
            eta_minutes=total_eta,
            route_points=combined_route
        )
        db.add(dispatch)
        db.commit()
        db.refresh(dispatch)
        return dispatch
