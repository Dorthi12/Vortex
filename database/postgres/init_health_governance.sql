-- NETRAVAAH AI-Powered Predictive Healthcare Governance Schema (PostgreSQL)

-- 1. Disease Outbreak Predictions
CREATE TABLE IF NOT EXISTS health_outbreak_predictions (
    id SERIAL PRIMARY KEY,
    district_name VARCHAR(255) NOT NULL,
    disease VARCHAR(255) NOT NULL,
    temperature FLOAT NOT NULL,
    humidity FLOAT NOT NULL,
    rainfall FLOAT NOT NULL,
    population_density FLOAT NOT NULL,
    historical_cases INTEGER NOT NULL,
    sanitation_index FLOAT NOT NULL,
    mosquito_density FLOAT NOT NULL,
    water_logging_reports INTEGER NOT NULL,
    outbreak_probability FLOAT NOT NULL,
    severity_score FLOAT NOT NULL,
    expected_cases_7d INTEGER NOT NULL,
    expected_cases_30d INTEGER NOT NULL,
    risk_heatmap JSONB,  -- Detailed coordinate-based risk hotspots
    confidence_score FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Hospital Forecasts
CREATE TABLE IF NOT EXISTS hospital_forecasts (
    id SERIAL PRIMARY KEY,
    district_name VARCHAR(255) NOT NULL,
    hospital_name VARCHAR(255) NOT NULL,
    current_occupancy INTEGER NOT NULL,
    icu_usage INTEGER NOT NULL,
    ventilator_usage INTEGER NOT NULL,
    disease_outbreak_data JSONB, -- Related active outbreaks and case loads
    seasonal_trends VARCHAR(100),
    expected_occupancy INTEGER NOT NULL,
    icu_requirement_forecast INTEGER NOT NULL,
    bed_shortage_warning BOOLEAN DEFAULT FALSE,
    resource_recommendation TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Ambulance Dispatches
CREATE TABLE IF NOT EXISTS ambulance_dispatches (
    id SERIAL PRIMARY KEY,
    dispatch_id UUID DEFAULT gen_random_uuid() UNIQUE,
    ambulance_plate VARCHAR(50) NOT NULL,
    current_lat FLOAT NOT NULL,
    current_lng FLOAT NOT NULL,
    traffic_conditions VARCHAR(100) NOT NULL, -- light | moderate | heavy
    emergency_severity VARCHAR(50) NOT NULL, -- critical | serious | minor
    assigned_hospital VARCHAR(255) NOT NULL,
    hospital_availability JSONB, -- bed/ICU status at target hospital
    eta_minutes INTEGER NOT NULL,
    route_geometry JSONB, -- Optimized polyline path
    status VARCHAR(50) DEFAULT 'DISPATCHED', -- DISPATCHED | EN_ROUTE | ARRIVED | COMPLETED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Medicine Forecasts
CREATE TABLE IF NOT EXISTS medicine_forecasts (
    id SERIAL PRIMARY KEY,
    district_name VARCHAR(255) NOT NULL,
    pharmacy_name VARCHAR(255) NOT NULL,
    medicine_name VARCHAR(255) NOT NULL,
    current_inventory INTEGER NOT NULL,
    disease_trends JSONB, -- Current disease velocities
    historical_sales JSONB, -- History of sales logs
    seasonal_effects VARCHAR(100),
    predicted_demand INTEGER NOT NULL,
    stockout_risk_level VARCHAR(50) NOT NULL, -- CRITICAL | HIGH | MEDIUM | LOW
    restock_recommendation TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Vaccination Forecasts
CREATE TABLE IF NOT EXISTS vaccination_forecasts (
    id SERIAL PRIMARY KEY,
    district_name VARCHAR(255) NOT NULL,
    disease_name VARCHAR(255) NOT NULL,
    population_demographics JSONB, -- age splits, vulnerable groups
    vaccination_records JSONB, -- current coverage stats
    disease_outbreak_data JSONB, -- current regional cases
    required_doses INTEGER NOT NULL,
    coverage_forecast_pct FLOAT NOT NULL,
    priority_zones JSONB, -- Array of priority wards/sub-districts
    campaign_recommendation TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Health Governance Agent Reports
CREATE TABLE IF NOT EXISTS health_agent_reports (
    id SERIAL PRIMARY KEY,
    query_text TEXT NOT NULL,
    district_name VARCHAR(255) NOT NULL,
    risk_level VARCHAR(50) NOT NULL,
    contributing_factors JSONB NOT NULL,
    expected_spread TEXT NOT NULL,
    recommended_actions JSONB NOT NULL,
    resource_requirements JSONB NOT NULL,
    confidence_score FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Health Digital Twin Simulation Runs
CREATE TABLE IF NOT EXISTS simulation_runs (
    id SERIAL PRIMARY KEY,
    simulation_id UUID DEFAULT gen_random_uuid() UNIQUE,
    simulation_type VARCHAR(100) NOT NULL, -- outbreak | vaccination | overflow | dispatch
    district_name VARCHAR(255) NOT NULL,
    parameters JSONB NOT NULL, -- initial infected, recovery rate, policy intervention day, etc.
    timeline JSONB NOT NULL, -- time-series array of simulated S, E, I, R variables
    impact_metrics JSONB NOT NULL, -- peak day, attack rate, peak infected count
    resource_utilization JSONB,
    mortality_reduction_pct FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance & query optimizations
CREATE INDEX IF NOT EXISTS idx_health_outbreak_district ON health_outbreak_predictions (district_name, disease);
CREATE INDEX IF NOT EXISTS idx_hospital_forecasts_name ON hospital_forecasts (hospital_name);
CREATE INDEX IF NOT EXISTS idx_ambulance_dispatches_plate ON ambulance_dispatches (ambulance_plate, status);
CREATE INDEX IF NOT EXISTS idx_medicine_forecasts_med ON medicine_forecasts (medicine_name);
CREATE INDEX IF NOT EXISTS idx_vaccination_forecasts_dist ON vaccination_forecasts (district_name, disease_name);
CREATE INDEX IF NOT EXISTS idx_health_agent_reports_dist ON health_agent_reports (district_name);
CREATE INDEX IF NOT EXISTS idx_simulation_runs_type ON simulation_runs (simulation_type, district_name);

-- Table Comments
COMMENT ON TABLE health_outbreak_predictions IS 'Inputs and AI outputs for the disease outbreak prediction model';
COMMENT ON TABLE hospital_forecasts IS 'Calculated hospital capacity, ICU forecasts, and resource warnings';
COMMENT ON TABLE ambulance_dispatches IS 'Active optimized dispatches log and route mapping';
COMMENT ON TABLE medicine_forecasts IS 'Inventory metrics and predicted pharmaceutical restocking recommendations';
COMMENT ON TABLE vaccination_forecasts IS 'Targeted vaccination doses, coverage projections, and campaign details';
COMMENT ON TABLE health_agent_reports IS 'LLM Governance Agent audit trail and advisory reports';
COMMENT ON TABLE simulation_runs IS 'Digital Twin compartmental SEIR simulation runs history';
