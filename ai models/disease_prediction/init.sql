-- Disease Intelligence Platform — PostgreSQL + PostGIS Schema

CREATE EXTENSION IF NOT EXISTS postgis;

-- ── District Features ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS district_features (
    id SERIAL PRIMARY KEY,
    district_name VARCHAR(255) NOT NULL,
    state_name VARCHAR(255),
    geom GEOMETRY(POLYGON, 4326),
    latitude FLOAT,
    longitude FLOAT,
    population BIGINT,
    population_density FLOAT,
    hospital_beds INTEGER,
    doctors INTEGER,
    nurses INTEGER,
    elevation_mean FLOAT,
    slope_mean FLOAT,
    ndvi_mean FLOAT,
    soil_moisture_mean FLOAT,
    surface_water_occurrence FLOAT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(district_name, state_name)
);

-- ── Disease Cases ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS disease_cases (
    id SERIAL PRIMARY KEY,
    district_name VARCHAR(255) NOT NULL,
    state_name VARCHAR(255),
    disease VARCHAR(255) NOT NULL,
    cases INTEGER DEFAULT 0,
    deaths INTEGER DEFAULT 0,
    recoveries INTEGER DEFAULT 0,
    active_cases INTEGER DEFAULT 0,
    source VARCHAR(100),  -- community | idsp | hospital
    confidence FLOAT DEFAULT 1.0,
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_disease_cases_district (district_name),
    INDEX idx_disease_cases_disease (disease),
    INDEX idx_disease_cases_date (report_date)
);

-- ── Citizen Reports ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS citizen_reports (
    id SERIAL PRIMARY KEY,
    report_id UUID DEFAULT gen_random_uuid(),
    district_name VARCHAR(255) NOT NULL,
    symptoms_text TEXT,
    image_provided BOOLEAN DEFAULT FALSE,
    predicted_disease VARCHAR(255),
    prediction_confidence FLOAT,
    prediction_source VARCHAR(100),
    symptoms_extracted TEXT[],
    report_lat FLOAT,
    report_lon FLOAT,
    geom GEOMETRY(POINT, 4326),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ── Hospital Capacity ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hospital_capacity (
    id SERIAL PRIMARY KEY,
    district_name VARCHAR(255),
    state_name VARCHAR(255),
    total_beds INTEGER,
    available_beds INTEGER,
    icu_beds INTEGER,
    ventilators INTEGER,
    doctors_on_duty INTEGER,
    nurses_on_duty INTEGER,
    overload_risk FLOAT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ── Climate Data ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS climate_data (
    id SERIAL PRIMARY KEY,
    district_name VARCHAR(255) NOT NULL,
    temperature_mean FLOAT,
    humidity_mean FLOAT,
    rainfall_mm FLOAT,
    rainfall_anomaly FLOAT,
    wind_speed FLOAT,
    pressure FLOAT,
    cloud_cover FLOAT,
    soil_moisture FLOAT,
    ndvi_mean FLOAT,
    data_source VARCHAR(100),
    observation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ── Risk Scores ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS risk_scores (
    id SERIAL PRIMARY KEY,
    district_name VARCHAR(255) NOT NULL,
    disease VARCHAR(255) NOT NULL,
    risk_score FLOAT NOT NULL,
    risk_level VARCHAR(50),
    outbreak_probability FLOAT,
    hotspot_density FLOAT,
    hospital_capacity_risk FLOAT,
    environmental_risk FLOAT,
    alert_priority INTEGER,
    computed_at TIMESTAMP DEFAULT NOW()
);

-- ── Government Actions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS government_actions (
    id SERIAL PRIMARY KEY,
    action_id UUID DEFAULT gen_random_uuid(),
    district_name VARCHAR(255) NOT NULL,
    disease VARCHAR(255) NOT NULL,
    risk_level VARCHAR(50),
    immediate_actions TEXT[],
    short_term_actions TEXT[],
    resource_requirements JSONB,
    coordination_agencies TEXT[],
    status VARCHAR(50) DEFAULT 'PENDING',  -- PENDING | IN_PROGRESS | COMPLETED
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ── Outbreak Forecasts ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS outbreak_forecasts (
    id SERIAL PRIMARY KEY,
    district_name VARCHAR(255),
    disease VARCHAR(255),
    predicted_cases_next_week INTEGER,
    outbreak_probability FLOAT,
    outbreak_alert BOOLEAN,
    confidence_interval_low INTEGER,
    confidence_interval_high INTEGER,
    forecast_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ── Kafka Event Log ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_log (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100),
    topic VARCHAR(200),
    payload JSONB,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_risk_scores_district ON risk_scores(district_name);
CREATE INDEX IF NOT EXISTS idx_risk_scores_level ON risk_scores(risk_level);
CREATE INDEX IF NOT EXISTS idx_outbreak_forecasts_district ON outbreak_forecasts(district_name);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_district ON citizen_reports(district_name);
CREATE INDEX IF NOT EXISTS idx_disease_cases_composite ON disease_cases(district_name, disease, report_date);

-- Spatial index
CREATE INDEX IF NOT EXISTS idx_citizen_reports_geom ON citizen_reports USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_district_features_geom ON district_features USING GIST(geom);

-- Comments
COMMENT ON TABLE district_features IS 'Base geographic and demographic features per district';
COMMENT ON TABLE disease_cases IS 'Rolling disease case counts from all sources';
COMMENT ON TABLE citizen_reports IS 'Raw citizen symptom submissions with disease predictions';
COMMENT ON TABLE risk_scores IS 'Computed composite health risk scores per district';
COMMENT ON TABLE government_actions IS 'Generated and tracked government action plans';
