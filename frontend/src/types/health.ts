// Types for Health Governance module

export interface OutbreakPrediction {
  id?: number;
  district_name: string;
  disease: string;
  outbreak_probability: number;
  severity_score: number;
  expected_cases_7d: number;
  expected_cases_30d: number;
  risk_heatmap?: {
    points: Array<{ lat: number; lng: number; weight: number }>;
  };
  confidence_score: number;
  created_at?: string;
}

export interface HospitalForecast {
  id?: number;
  district_name: string;
  hospital_name: string;
  current_occupancy: number;
  icu_usage: number;
  ventilator_usage: number;
  expected_occupancy: number;
  icu_requirement_forecast: number;
  bed_shortage_warning: boolean;
  resource_recommendation: string;
  created_at?: string;
}

export interface AmbulanceDispatch {
  dispatch_id: string;
  ambulance_plate: string;
  current_lat: number;
  current_lng: number;
  traffic_conditions: string;
  emergency_severity: string;
  assigned_hospital: string;
  hospital_availability: {
    available_beds: number;
    available_icu: number;
  };
  eta_minutes: number;
  route_geometry?: {
    coordinates: Array<{ lat: number; lng: number }>;
  };
  status: string;
  created_at?: string;
}

export interface MedicineForecast {
  id?: number;
  district_name: string;
  pharmacy_name: string;
  medicine_name: string;
  current_inventory: number;
  predicted_demand: number;
  stockout_risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  restock_recommendation: string;
  created_at?: string;
}

export interface VaccinationForecast {
  id?: number;
  district_name: string;
  disease_name: string;
  required_doses: number;
  coverage_forecast_pct: number;
  priority_zones: Array<{
    zone_name: string;
    risk_index: number;
    unvaccinated_population: number;
    target_doses: number;
  }>;
  campaign_recommendation: string;
  created_at?: string;
}

export interface HealthAgentReport {
  id?: number;
  query_text: string;
  district_name: string;
  risk_level: string;
  contributing_factors: string[];
  expected_spread: string;
  recommended_actions: string[];
  resource_requirements: {
    emergency_beds?: number;
    icu_beds?: number;
    vaccine_doses?: number;
    fogging_crews?: number;
    medical_personnel?: number;
  };
  confidence_score: number;
  created_at?: string;
}

export interface SimulationRun {
  simulation_id: string;
  simulation_type: string;
  district_name: string;
  parameters: Record<string, any>;
  timeline: Array<{
    day: number;
    S: number;
    E: number;
    I: number;
    R: number;
    new_cases: number;
  }>;
  impact_metrics: {
    peak_day: number;
    peak_infected: number;
    total_cases_simulated: number;
    attack_rate_pct: number;
    total_recovered_final: number;
  };
  resource_utilization?: {
    peak_bed_demand: number;
    peak_icu_demand: number;
  };
  mortality_reduction_pct: number;
  created_at?: string;
}

export interface HealthDashboardSummary {
  status: string;
  active_alerts: number;
  kpis: {
    high_outbreak_zones: number;
    hospital_bed_alerts: number;
    active_ambulance_dispatches: number;
    critical_stockout_medicines: number;
  };
  recent_outbreaks: Array<{
    id: number;
    district: string;
    disease: string;
    prob: number;
    severity: number;
    cases_7d: number;
    time: string;
  }>;
  recent_hospital_loads: Array<{
    id: number;
    hospital: string;
    district: string;
    occupancy: number;
    expected: number;
    shortage: boolean;
    time: string;
  }>;
  recent_dispatches: Array<{
    dispatch_id: string;
    plate: string;
    hospital: string;
    eta: number;
    status: string;
    severity: string;
    lat: number;
    lng: number;
    time: string;
  }>;
  recent_medicines: Array<{
    id: number;
    pharmacy: string;
    medicine: string;
    inventory: number;
    demand: number;
    risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    time: string;
  }>;
  recent_vaccinations: Array<{
    id: number;
    district: string;
    disease: string;
    required: number;
    forecast: number;
    campaign: string;
    time: string;
  }>;
  recent_simulations: Array<{
    id: string;
    type: string;
    district: string;
    reduction: number;
    metrics: Record<string, any>;
    time: string;
  }>;
}
