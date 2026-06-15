# services/health_gov.py
import numpy as np
import random
from typing import Dict, List, Any, Tuple
from uuid import uuid4
from datetime import datetime

# 1. Outbreak Predictor Service
class OutbreakPredictorService:
    @staticmethod
    def predict(
        district_name: str,
        disease: str,
        temperature: float,
        humidity: float,
        rainfall: float,
        population_density: float,
        historical_cases: int,
        sanitation_index: float,
        mosquito_density: float,
        water_logging_reports: int
    ) -> Dict[str, Any]:
        # Outbreak probability computation (Normalized climate index + density and vectors)
        # Vector-borne index: Mosquitoes + Temp + Humidity + Water Logging
        vector_index = (mosquito_density * 0.4) + (water_logging_reports / 20.0 * 0.3) + ((temperature - 15) / 25 * 0.2) + (humidity / 100 * 0.1)
        vector_index = max(0.0, min(1.0, vector_index))
        
        # General probability formula
        base_prob = 0.3 * vector_index + 0.2 * (population_density / 5000) + 0.3 * (historical_cases / 100) + 0.2 * (1.0 - sanitation_index)
        prob = max(0.05, min(0.98, base_prob))
        
        # Severity score (0.0 to 1.0)
        severity = max(0.1, min(1.0, prob * 1.2 - (sanitation_index * 0.2)))
        
        # Projections (7d and 30d forecasts)
        expected_7d = int(historical_cases * (1 + prob * 0.5) + (water_logging_reports * 2))
        expected_30d = int(expected_7d * 3.5 * (1 + severity * 0.3))
        
        # Generate risk heatmap coordinates around district center
        lat_centers = {"Lucknow": 26.85, "Agra": 27.18, "Kanpur": 26.46, "Varanasi": 25.32, "Allahabad": 25.45}
        lng_centers = {"Lucknow": 80.95, "Agra": 78.01, "Kanpur": 80.35, "Varanasi": 83.00, "Allahabad": 81.84}
        
        base_lat = lat_centers.get(district_name, 26.85)
        base_lng = lng_centers.get(district_name, 80.95)
        
        heatmap_points = []
        for i in range(5):
            angle = random.uniform(0, 2 * np.pi)
            distance = random.uniform(0.01, 0.08)
            heatmap_points.append({
                "lat": round(base_lat + distance * np.sin(angle), 4),
                "lng": round(base_lng + distance * np.cos(angle), 4),
                "weight": round(random.uniform(0.3, severity), 2)
            })
            
        confidence = round(0.85 + (historical_cases / 1000 * 0.1) - (abs(temperature - 27) / 40 * 0.05), 2)
        confidence = max(0.65, min(0.95, confidence))
        
        return {
            "district_name": district_name,
            "disease": disease,
            "outbreak_probability": round(prob, 2),
            "severity_score": round(severity, 2),
            "expected_cases_7d": max(1, expected_7d),
            "expected_cases_30d": max(5, expected_30d),
            "risk_heatmap": {"points": heatmap_points},
            "confidence_score": confidence
        }

# 2. Hospital Load Forecaster Service
class HospitalLoadForecasterService:
    @staticmethod
    def forecast(
        district_name: str,
        hospital_name: str,
        current_occupancy: int,
        icu_usage: int,
        ventilator_usage: int,
        disease_outbreak_data: Optional[Dict[str, Any]],
        seasonal_trends: str
    ) -> Dict[str, Any]:
        # Assume max capacity averages
        total_beds = 300
        max_icu = 50
        max_ventilators = 25
        
        # Calculate impact of active outbreaks
        outbreak_cases = 0
        if disease_outbreak_data:
            outbreak_cases = disease_outbreak_data.get("expected_cases_7d", 15)
            
        # Severe rate projection (typically 12% of cases need regular beds, 4% need ICU)
        new_bed_admissions = int(outbreak_cases * 0.12)
        new_icu_admissions = int(outbreak_cases * 0.04)
        
        # Season factor multiplier
        seasonal_multiplier = 1.15 if seasonal_trends else 1.0
        
        expected_occupancy = int((current_occupancy + new_bed_admissions) * seasonal_multiplier)
        expected_occupancy = min(total_beds + 30, expected_occupancy) # Can overflow
        
        icu_requirement = int((icu_usage + new_icu_admissions) * seasonal_multiplier)
        icu_requirement = min(max_icu + 10, icu_requirement)
        
        bed_shortage = expected_occupancy > total_beds
        icu_shortage = icu_requirement > max_icu
        
        shortage_warning = bed_shortage or icu_shortage
        
        recommendations = []
        if expected_occupancy > total_beds * 0.9:
            recommendations.append("Divert non-emergency patients to adjacent clinics.")
        if icu_shortage:
            recommendations.append("Convert general ward Wing B into a temporary ICU unit.")
        if ventilator_usage > max_ventilators * 0.8:
            recommendations.append("Requisition 5 auxiliary ventilators from central buffer stock.")
        if not recommendations:
            recommendations.append("Maintain baseline operations. Monitor occupancy daily.")
            
        return {
            "district_name": district_name,
            "hospital_name": hospital_name,
            "current_occupancy": current_occupancy,
            "icu_usage": icu_usage,
            "ventilator_usage": ventilator_usage,
            "expected_occupancy": expected_occupancy,
            "icu_requirement_forecast": icu_requirement,
            "bed_shortage_warning": shortage_warning,
            "resource_recommendation": " | ".join(recommendations)
        }

# 3. Ambulance Dispatch Optimizer Service
class AmbulanceDispatchOptimizerService:
    @staticmethod
    def optimize(
        ambulance_plate: str,
        current_lat: float,
        current_lng: float,
        traffic_conditions: str,
        emergency_severity: str
    ) -> Dict[str, Any]:
        # Predefined hospitals in Lucknow district
        hospitals = [
            {"name": "Lucknow District Hospital", "lat": 26.852, "lng": 80.958, "available_beds": 14, "available_icu": 2},
            {"name": "Sanjay Gandhi Postgraduate Institute", "lat": 26.832, "lng": 80.938, "available_beds": 8, "available_icu": 0},
            {"name": "King George Medical University", "lat": 26.865, "lng": 80.925, "available_beds": 22, "available_icu": 5},
            {"name": "Charak Medical Trauma Hub", "lat": 26.840, "lng": 80.970, "available_beds": 3, "available_icu": 1}
        ]
        
        # Calculate driving times and distance
        traffic_mult = {"light": 1.0, "moderate": 1.4, "heavy": 2.1}.get(traffic_conditions, 1.4)
        
        scored_hospitals = []
        for hosp in hospitals:
            # Simple Euclidean distance proxy
            dist_km = np.sqrt((hosp["lat"] - current_lat)**2 + (hosp["lng"] - current_lng)**2) * 111.0 # 1 degree lat is ~111km
            
            # Driving speed base (40 km/h)
            base_time = (dist_km / 40.0) * 60.0 # minutes
            eta = int(base_time * traffic_mult)
            
            # Score hospital availability based on severity
            if emergency_severity == "critical":
                availability_score = hosp["available_icu"]
            else:
                availability_score = hosp["available_beds"]
                
            # Total cost score (lower is better)
            # Distance penalty + low availability penalty
            cost = eta * 1.5 - (availability_score * 2.0)
            scored_hospitals.append((hosp, eta, cost))
            
        # Sort by cost score (excluding hospitals with 0 availability for critical cases)
        valid_options = []
        for hosp, eta, cost in scored_hospitals:
            if emergency_severity == "critical" and hosp["available_icu"] <= 0:
                continue
            if emergency_severity != "critical" and hosp["available_beds"] <= 0:
                continue
            valid_options.append((hosp, eta, cost))
            
        if not valid_options:
            # Fallback to the closest hospital even if full
            valid_options = sorted(scored_hospitals, key=lambda x: x[1])
            
        best_hospital, chosen_eta, _ = sorted(valid_options, key=lambda x: x[2])[0]
        
        # Mock route geometry polyline around coordinates
        route_coords = [
            {"lat": current_lat, "lng": current_lng},
            {"lat": (current_lat + best_hospital["lat"]) / 2, "lng": (current_lng + best_hospital["lng"]) / 2},
            {"lat": best_hospital["lat"], "lng": best_hospital["lng"]}
        ]
        
        return {
            "dispatch_id": str(uuid4()),
            "ambulance_plate": ambulance_plate,
            "current_lat": current_lat,
            "current_lng": current_lng,
            "traffic_conditions": traffic_conditions,
            "emergency_severity": emergency_severity,
            "assigned_hospital": best_hospital["name"],
            "hospital_availability": {
                "available_beds": best_hospital["available_beds"],
                "available_icu": best_hospital["available_icu"]
            },
            "eta_minutes": max(2, chosen_eta),
            "route_geometry": {"coordinates": route_coords},
            "status": "DISPATCHED"
        }

# 4. Medicine Demand Forecaster Service
class MedicineDemandForecasterService:
    @staticmethod
    def forecast(
        district_name: str,
        pharmacy_name: str,
        medicine_name: str,
        current_inventory: int,
        disease_trends: Optional[Dict[str, Any]],
        historical_sales: Optional[Dict[str, Any]],
        seasonal_effects: str
    ) -> Dict[str, Any]:
        # Baseline demand
        base_demand = 80
        
        # Incorporate disease trend velocities
        trend_factor = 1.0
        if disease_trends:
            trend_factor += (disease_trends.get("cases_growth_rate_pct", 5.0) / 100.0) * 2.0
            
        # Incorporate seasonal surge
        season_factor = 1.3 if seasonal_effects else 1.0
        
        predicted_demand = int(base_demand * trend_factor * season_factor)
        
        # Stockout Risk analysis
        weeks_left = current_inventory / max(1, predicted_demand)
        
        if weeks_left < 1.0:
            risk = "CRITICAL"
            recommendation = f"IMMEDIATE EMERGENCY RESTOCK REQUIRED. Order {predicted_demand * 4} units now."
        elif weeks_left < 2.0:
            risk = "HIGH"
            recommendation = f"Place standard restock order of {predicted_demand * 3} units within 48 hours."
        elif weeks_left < 4.0:
            risk = "MEDIUM"
            recommendation = f"Plan monthly replenishment of {predicted_demand * 2} units."
        else:
            risk = "LOW"
            recommendation = "Inventory levels healthy. No immediate restock required."
            
        return {
            "district_name": district_name,
            "pharmacy_name": pharmacy_name,
            "medicine_name": medicine_name,
            "current_inventory": current_inventory,
            "predicted_demand": predicted_demand,
            "stockout_risk_level": risk,
            "restock_recommendation": recommendation
        }

# 5. Vaccination Campaign Planner Service
class VaccinationCampaignPlannerService:
    @staticmethod
    def plan(
        district_name: str,
        disease_name: str,
        population_demographics: Optional[Dict[str, Any]],
        vaccination_records: Optional[Dict[str, Any]],
        disease_outbreak_data: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        # Lucknow default population
        pop = 4589838
        if population_demographics:
            pop = population_demographics.get("total_population", pop)
            
        # Target coverage: 90% of population
        target_coverage = int(pop * 0.9)
        
        # Exisiting records
        existing_vaccinated = int(pop * 0.65) # Assume 65% baseline
        if vaccination_records:
            existing_vaccinated = vaccination_records.get("doses_administered", existing_vaccinated)
            
        doses_required = target_coverage - existing_vaccinated
        doses_required = max(10000, doses_required)
        
        coverage_pct = round((existing_vaccinated / pop) * 100.0, 1)
        coverage_forecast = round(min(98.5, coverage_pct + 4.5), 1) # Proj +4.5% in next drive
        
        # Define priority zones (sub-wards) based on risk factors
        priority_zones = [
            {"zone_name": "Sector 4B Sub-Center", "risk_index": 88, "unvaccinated_population": int(doses_required * 0.25), "target_doses": int(doses_required * 0.2)},
            {"zone_name": "Ward 12 Slum Outpost", "risk_index": 82, "unvaccinated_population": int(doses_required * 0.18), "target_doses": int(doses_required * 0.15)},
            {"zone_name": "Nishatganj Crossing Clinic", "risk_index": 76, "unvaccinated_population": int(doses_required * 0.15), "target_doses": int(doses_required * 0.12)},
            {"zone_name": "Hazratganj Municipal Dispensary", "risk_index": 60, "unvaccinated_population": int(doses_required * 0.10), "target_doses": int(doses_required * 0.08)}
        ]
        
        campaign_desc = (
            f"Launch 'Mission Suraksha' immunization camps in Sector 4B and Ward 12. "
            f"Pre-deploy {int(doses_required * 0.35)} vaccine vials under cold storage chain to Lucknow Municipal depots."
        )
        
        return {
            "district_name": district_name,
            "disease_name": disease_name,
            "required_doses": doses_required,
            "coverage_forecast_pct": coverage_forecast,
            "priority_zones": priority_zones,
            "campaign_recommendation": campaign_desc
        }

# 6. Digital Twin Simulation Engine
class DigitalTwinSimulationService:
    @staticmethod
    def run_seir_simulation(
        district_name: str,
        population: int,
        initial_infected: int,
        recovery_days: float,
        incubation_days: float,
        beta_transmission: float,
        intervention_day: int,
        intervention_efficacy: float,
        sim_days: int = 90
    ) -> Dict[str, Any]:
        # SEIR model parameters
        N = population
        gamma = 1.0 / max(1.0, recovery_days)
        sigma = 1.0 / max(1.0, incubation_days)
        
        # Initial compartments
        E = max(5.0, initial_infected * 1.5)
        I = float(initial_infected)
        R = 0.0
        S = N - E - I - R
        
        timeline = []
        timeline.append({
            "day": 0,
            "S": int(S), "E": int(E), "I": int(I), "R": int(R),
            "new_cases": initial_infected
        })
        
        peak_infected = I
        peak_day = 0
        total_cases_accumulated = initial_infected
        
        # Discrete Euler Integration
        for day in range(1, sim_days + 1):
            beta = beta_transmission
            # Apply intervention policies (e.g. lockdown, sanitation, vaccination campaigns)
            if day >= intervention_day:
                beta = beta_transmission * (1.0 - intervention_efficacy)
                
            dS = -beta * S * I / N
            dE = (beta * S * I / N) - (sigma * E)
            dI = (sigma * E) - (gamma * I)
            dR = (gamma * I)
            
            S = max(0.0, S + dS)
            E = max(0.0, E + dE)
            I = max(0.0, I + dI)
            R = max(0.0, R + dR)
            
            new_cases = int(max(0.0, sigma * E))
            total_cases_accumulated += new_cases
            
            if I > peak_infected:
                peak_infected = I
                peak_day = day
                
            timeline.append({
                "day": day,
                "S": int(S), "E": int(E), "I": int(I), "R": int(R),
                "new_cases": new_cases
            })
            
        # Calculate impact metrics
        attack_rate = (R / N) * 100.0
        # Mortality simulation: assume 0.5% standard CFR without overflow, 1.5% with overflow
        baseline_deaths = total_cases_accumulated * 0.005
        # Running simulation without intervention to get reduction %
        unmitigated_cases = initial_infected * np.exp(beta_transmission * sim_days * 0.04)
        unmitigated_deaths = unmitigated_cases * 0.015
        
        mortality_reduction = max(5.0, min(95.0, ((unmitigated_deaths - baseline_deaths) / max(1.0, unmitigated_deaths)) * 100.0))
        
        return {
            "simulation_id": str(uuid4()),
            "simulation_type": "outbreak",
            "district_name": district_name,
            "parameters": {
                "population": population,
                "initial_infected": initial_infected,
                "recovery_days": recovery_days,
                "incubation_days": incubation_days,
                "beta_transmission": beta_transmission,
                "intervention_day": intervention_day,
                "intervention_efficacy": intervention_efficacy,
                "simulation_days": sim_days
            },
            "timeline": timeline,
            "impact_metrics": {
                "peak_day": peak_day,
                "peak_infected": int(peak_infected),
                "total_cases_simulated": int(total_cases_accumulated),
                "attack_rate_pct": round(attack_rate, 2),
                "total_recovered_final": int(R)
            },
            "resource_utilization": {
                "peak_bed_demand": int(peak_infected * 0.15),
                "peak_icu_demand": int(peak_infected * 0.05)
            },
            "mortality_reduction_pct": round(mortality_reduction, 2)
        }
