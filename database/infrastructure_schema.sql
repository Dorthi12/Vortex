-- database/infrastructure_schema.sql
-- NETRAVAAH Smart Infrastructure Database Schema

-- 1. Main Assets Registry Table
CREATE TABLE IF NOT EXISTS infra_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'road', 'bridge', 'dam', 'grid', 'utility'
    location VARCHAR(255) NOT NULL,
    health_score INT NOT NULL CHECK (health_score BETWEEN 0 AND 100),
    risk_score INT NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
    failure_probability DOUBLE PRECISION NOT NULL CHECK (failure_probability BETWEEN 0.0 AND 1.0),
    last_inspection TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    recommended_action VARCHAR(255) DEFAULT 'Monitor Only',
    status VARCHAR(50) DEFAULT 'operational', -- 'operational', 'watch', 'risk', 'critical'
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_infra_assets_type ON infra_assets(type);
CREATE INDEX IF NOT EXISTS idx_infra_assets_status ON infra_assets(status);

-- 2. Road Inspections & Deterioration Table
CREATE TABLE IF NOT EXISTS road_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES infra_assets(id) ON DELETE CASCADE,
    pothole_count INT DEFAULT 0,
    estimated_repair_cost DECIMAL(12, 2) DEFAULT 0.00,
    traffic_load_index INT DEFAULT 50, -- 1-100 scale
    weather_exposure_index INT DEFAULT 50, -- 1-100 scale
    wear_coefficient DOUBLE PRECISION DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bridge Sensor Readings Table
CREATE TABLE IF NOT EXISTS bridge_sensor_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES infra_assets(id) ON DELETE CASCADE,
    vibration_hz DOUBLE PRECISION DEFAULT 0.0,
    load_tons DOUBLE PRECISION DEFAULT 0.0,
    expansion_mm DOUBLE PRECISION DEFAULT 0.0,
    corrosion_rate_index DOUBLE PRECISION DEFAULT 0.0,
    crack_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Dam Telemetry Logs Table
CREATE TABLE IF NOT EXISTS dam_telemetry_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES infra_assets(id) ON DELETE CASCADE,
    water_level_meters DOUBLE PRECISION DEFAULT 0.0,
    reservoir_capacity_percent DOUBLE PRECISION DEFAULT 0.0,
    inflow_cusecs DOUBLE PRECISION DEFAULT 0.0,
    outflow_cusecs DOUBLE PRECISION DEFAULT 0.0,
    spillway_status VARCHAR(50) DEFAULT 'closed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Grid Substations Table
CREATE TABLE IF NOT EXISTS grid_substations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES infra_assets(id) ON DELETE CASCADE,
    substation_name VARCHAR(100) NOT NULL,
    transformer_count INT DEFAULT 1,
    active_load_mva DOUBLE PRECISION DEFAULT 0.0,
    peak_capacity_mva DOUBLE PRECISION DEFAULT 100.0,
    risk_percentage DOUBLE PRECISION DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Utility Infrastructure Monitoring Table
CREATE TABLE IF NOT EXISTS utility_monitoring_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tank_level_percent DOUBLE PRECISION DEFAULT 100.0,
    pipeline_pressure_psi DOUBLE PRECISION DEFAULT 60.0,
    leakage_count INT DEFAULT 0,
    sewer_blockages INT DEFAULT 0,
    failed_streetlights INT DEFAULT 0,
    energy_kwh DOUBLE PRECISION DEFAULT 0.0,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Traffic & Mobility Logs
CREATE TABLE IF NOT EXISTS traffic_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotspot_name VARCHAR(255) NOT NULL,
    congestion_score DOUBLE PRECISION DEFAULT 0.0,
    vehicle_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Capital Plans Table
CREATE TABLE IF NOT EXISTS capex_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_name VARCHAR(255) NOT NULL,
    budget_allocated DECIMAL(15, 2) NOT NULL,
    risk_reduction_percent DOUBLE PRECISION NOT NULL,
    projected_savings DECIMAL(15, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Maintenance Calendar Table
CREATE TABLE IF NOT EXISTS maintenance_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES infra_assets(id) ON DELETE CASCADE,
    inspection_date TIMESTAMP WITH TIME ZONE NOT NULL,
    crew_assigned VARCHAR(100) NOT NULL,
    priority VARCHAR(50) DEFAULT 'medium',
    action_type VARCHAR(100) NOT NULL, -- 'Inspection', 'Repair', 'Overlay'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- SEED DATA SETS
-- =========================================================================
INSERT INTO infra_assets (name, type, location, health_score, risk_score, failure_probability, recommended_action, status, latitude, longitude) VALUES
('Sangamwadi Confluence Bridge', 'bridge', 'Sangam Bridge Road', 91, 15, 0.05, 'Monitor Only', 'operational', 18.5398, 73.8617),
('Hadapsar Substation Node', 'grid', 'Hadapsar Industrial Zone', 82, 35, 0.12, 'Schedule Inspection', 'watch', 18.5089, 73.9258),
('Khadakwasla Dam Spillway', 'dam', 'Khadakwasla Reservoir', 98, 5, 0.01, 'Monitor Only', 'operational', 18.4354, 73.7629),
('Yerawada Bed Causeway', 'road', 'Yerawada riverbed margins', 45, 80, 0.65, 'Immediate Repair', 'critical', 18.5524, 73.8824),
('Aundh Highway Segment', 'road', 'Aundh Causeway Road', 78, 48, 0.28, 'Within 30 Days', 'risk', 18.5580, 73.8075),
('Shivajinagar Grid Hub', 'grid', 'Shivajinagar Civic Block', 90, 10, 0.03, 'Monitor Only', 'operational', 18.5312, 73.8445);
