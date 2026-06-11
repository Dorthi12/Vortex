-- ============================================================
-- Disease Intelligence System — PostgreSQL + PostGIS Schema
-- FIXED:
--   1. Added district_features table (THE most critical missing table)
--   2. Added climate_data table (was missing)
--   3. Added hospital_utilisation + bed_occupancy columns to outbreak_predictions
--   4. Added mobility_data table for GenerateIO data
--   5. Added indexes on district_features for fast ML queries
-- ============================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── DISTRICTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS districts (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL UNIQUE,
    state         VARCHAR(100) DEFAULT 'Uttar Pradesh',
    lat           DOUBLE PRECISION NOT NULL,
    lng           DOUBLE PRECISION NOT NULL,
    population    BIGINT,
    area_sq_km    DOUBLE PRECISION,
    hospital_beds INT DEFAULT 0,
    doctors       INT DEFAULT 0,
    nurses        INT DEFAULT 0,
    num_hospitals INT DEFAULT 0,
    geom          GEOMETRY(Point, 4326),
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── CITIZEN REPORTS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS citizen_reports (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id         VARCHAR(50) UNIQUE,
    citizen_id        VARCHAR(100),
    district          VARCHAR(100),
    text              TEXT,
    lat               DOUBLE PRECISION,
    lng               DOUBLE PRECISION,
    source            VARCHAR(50) DEFAULT 'web',
    extracted_symptoms TEXT[],
    predicted_disease VARCHAR(100),
    confidence        DOUBLE PRECISION,
    geom              GEOMETRY(Point, 4326),
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── DISEASE CASES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS disease_cases (
    id            SERIAL PRIMARY KEY,
    district      VARCHAR(100) NOT NULL,
    disease       VARCHAR(100) NOT NULL,
    cases         INT DEFAULT 0,
    deaths        INT DEFAULT 0,
    recoveries    INT DEFAULT 0,
    week_number   INT,
    year          INT,
    report_date   DATE DEFAULT CURRENT_DATE,
    source        VARCHAR(50) DEFAULT 'official',
    created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cases_district_disease ON disease_cases(district, disease);
CREATE INDEX IF NOT EXISTS idx_cases_date            ON disease_cases(report_date);
CREATE INDEX IF NOT EXISTS idx_cases_week_year       ON disease_cases(week_number, year);

-- ── CLIMATE DATA (FIX: was completely missing) ────────────────
CREATE TABLE IF NOT EXISTS climate_data (
    id                     SERIAL PRIMARY KEY,
    district               VARCHAR(100) NOT NULL,
    date                   DATE NOT NULL,
    temperature_mean       DOUBLE PRECISION,
    temperature_max        DOUBLE PRECISION,
    temperature_min        DOUBLE PRECISION,
    humidity_mean          DOUBLE PRECISION,
    precipitation_total    DOUBLE PRECISION,
    wind_speed_mean        DOUBLE PRECISION,
    cloud_cover_mean       DOUBLE PRECISION,
    soil_moisture_mean     DOUBLE PRECISION,
    vapour_pressure_deficit DOUBLE PRECISION,
    pressure_msl_mean      DOUBLE PRECISION,
    rain_days_7d           INT,
    rainfall_anomaly       DOUBLE PRECISION,
    source                 VARCHAR(50) DEFAULT 'open_meteo',
    created_at             TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(district, date)
);
CREATE INDEX IF NOT EXISTS idx_climate_district_date ON climate_data(district, date);

-- ── MOBILITY DATA (FIX: GenerateIO data storage — was missing) ──
CREATE TABLE IF NOT EXISTS mobility_data (
    id                     SERIAL PRIMARY KEY,
    district               VARCHAR(100) NOT NULL,
    date                   DATE NOT NULL,
    mobility_index         DOUBLE PRECISION,
    traffic_density        DOUBLE PRECISION,
    travel_density         DOUBLE PRECISION,
    inter_district_flow    DOUBLE PRECISION,
    public_transport_usage DOUBLE PRECISION,
    source                 VARCHAR(50) DEFAULT 'generateio',
    created_at             TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(district, date)
);

-- ── DISTRICT FEATURES (FIX: THE most critical missing table) ──
-- All ML models read from this unified feature store.
CREATE TABLE IF NOT EXISTS district_features (
    id                       SERIAL PRIMARY KEY,
    district                 VARCHAR(100) NOT NULL,
    disease                  VARCHAR(100) NOT NULL,
    week                     INT NOT NULL,
    year                     INT NOT NULL,
    season                   VARCHAR(20),
    -- Population
    population               BIGINT,
    population_density       DOUBLE PRECISION,
    -- Healthcare capacity
    hospital_beds            INT,
    doctors                  INT,
    nurses                   INT,
    beds_per_1000            DOUBLE PRECISION,
    doctors_per_1000         DOUBLE PRECISION,
    healthcare_access_index  DOUBLE PRECISION,
    -- Disease time series
    cases                    INT DEFAULT 0,
    deaths                   INT DEFAULT 0,
    recoveries               INT DEFAULT 0,
    cases_lag_1              DOUBLE PRECISION DEFAULT 0,
    cases_lag_2              DOUBLE PRECISION DEFAULT 0,
    cases_lag_3              DOUBLE PRECISION DEFAULT 0,
    cases_rolling_mean       DOUBLE PRECISION DEFAULT 0,
    cases_growth_rate        DOUBLE PRECISION DEFAULT 0,
    cases_acceleration       DOUBLE PRECISION DEFAULT 0,
    -- Climate
    temperature_mean         DOUBLE PRECISION,
    humidity_mean            DOUBLE PRECISION,
    rainfall                 DOUBLE PRECISION,
    soil_moisture            DOUBLE PRECISION,
    -- Environmental risk indicators (FIX: were missing)
    vector_risk              DOUBLE PRECISION DEFAULT 0,
    water_risk               DOUBLE PRECISION DEFAULT 0,
    climate_anomaly          DOUBLE PRECISION DEFAULT 0,
    -- Mobility (FIX: was missing)
    mobility_index           DOUBLE PRECISION DEFAULT 0.5,
    -- Community signal
    citizen_reports_count    INT DEFAULT 0,
    symptom_frequency        DOUBLE PRECISION DEFAULT 0,
    -- Hospital demand (FIX: derived features were missing)
    hospital_utilisation     DOUBLE PRECISION DEFAULT 0,
    bed_occupancy            DOUBLE PRECISION DEFAULT 0,
    created_at               TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(district, disease, week, year)
);
CREATE INDEX IF NOT EXISTS idx_df_district_disease  ON district_features(district, disease);
CREATE INDEX IF NOT EXISTS idx_df_week_year         ON district_features(week, year);
CREATE INDEX IF NOT EXISTS idx_df_district_week     ON district_features(district, week, year);

-- ── OUTBREAK PREDICTIONS (FIX: added hospital_utilisation columns) ──
CREATE TABLE IF NOT EXISTS outbreak_predictions (
    id                      SERIAL PRIMARY KEY,
    district                VARCHAR(100) NOT NULL,
    disease                 VARCHAR(100) NOT NULL,
    risk_level              VARCHAR(20),
    risk_score              DOUBLE PRECISION,
    outbreak_probability    DOUBLE PRECISION,
    projected_cases         INT,
    cases_lag_1             DOUBLE PRECISION,
    cases_lag_2             DOUBLE PRECISION,
    growth_rate             DOUBLE PRECISION,
    hospital_utilisation_pct DOUBLE PRECISION,    -- FIX: was missing
    bed_occupancy_pct       DOUBLE PRECISION,     -- FIX: was missing
    model_version           VARCHAR(20),
    weather_temp            DOUBLE PRECISION,
    weather_humidity        DOUBLE PRECISION,
    weather_rain            DOUBLE PRECISION,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ── GOVERNMENT ACTIONS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS government_actions (
    id                SERIAL PRIMARY KEY,
    plan_id           VARCHAR(100) UNIQUE,
    district          VARCHAR(100),
    disease           VARCHAR(100),
    risk_level        VARCHAR(20),
    immediate_actions JSONB,
    resources         JSONB,
    alert_sms         TEXT,
    status            VARCHAR(50) DEFAULT 'dispatched',
    dispatched_at     TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_at   TIMESTAMPTZ,
    completed_at      TIMESTAMPTZ
);

-- ── HOTSPOT CLUSTERS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hotspot_clusters (
    id           SERIAL PRIMARY KEY,
    cluster_id   INT,
    disease      VARCHAR(100),
    districts    VARCHAR(100)[],
    center_lat   DOUBLE PRECISION,
    center_lng   DOUBLE PRECISION,
    total_cases  INT,
    severity     VARCHAR(20),
    geom         GEOMETRY(Point, 4326),
    detected_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── SEED DISTRICT DATA ────────────────────────────────────────
INSERT INTO districts (name, lat, lng, population, hospital_beds, doctors, nurses, num_hospitals, area_sq_km) VALUES
('Lucknow',    26.85, 80.95, 4589838, 3200, 890, 1800, 48, 2528),
('Agra',       27.18, 78.01, 4418797, 2400, 640, 1300, 36, 4027),
('Kanpur',     26.46, 80.35, 4581268, 2800, 780, 1600, 42, 3029),
('Varanasi',   25.32, 83.00, 3676841, 2100, 590, 1200, 31, 1535),
('Allahabad',  25.45, 81.84, 5954391, 3100, 820, 1650, 46, 5482),
('Meerut',     28.98, 77.71, 3443689, 1900, 510, 1050, 28, 2590),
('Ghaziabad',  28.67, 77.44, 4681645, 2600, 710, 1450, 39, 1179),
('Bareilly',   28.35, 79.43, 4448359, 2200, 600, 1220, 33, 4120),
('Gorakhpur',  26.76, 83.37, 4440895, 2300, 620, 1250, 34, 3483),
('Moradabad',  28.84, 78.78, 4772006, 2100, 570, 1150, 30, 3718),
('Aligarh',    27.88, 78.08, 3673889, 1800, 490,  980, 26, 3650),
('Saharanpur', 29.97, 77.55, 3464228, 1700, 460,  920, 25, 3689),
('Faizabad',   26.77, 82.14, 2469578, 1200, 320,  650, 18, 2765),
('Jhansi',     25.45, 78.57, 1998603, 1100, 290,  580, 16, 5024),
('Mathura',    27.49, 77.67, 2547184, 1300, 350,  700, 19, 3340)
ON CONFLICT (name) DO NOTHING;

-- ── UPDATE GEOMETRY ───────────────────────────────────────────
UPDATE districts SET geom = ST_SetSRID(ST_MakePoint(lng, lat), 4326) WHERE geom IS NULL;
