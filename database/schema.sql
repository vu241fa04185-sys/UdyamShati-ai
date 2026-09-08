-- =============================================================================
-- SIH26091: AI-Driven Hyper-Local Business Advisory & Financial Structuring
-- Ministry of Social Justice & Empowerment (MoSJE)
-- Database DDL Schema (PostgreSQL + PostGIS + pgvector)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 1. Users and Authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'ENTREPRENEUR',
    full_name VARCHAR(255) NOT NULL,
    preferred_language VARCHAR(10) DEFAULT 'hi',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Locations & Geographic Information
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    village_name VARCHAR(255) NOT NULL,
    mandal_or_block VARCHAR(255) NOT NULL,
    district VARCHAR(255) NOT NULL,
    state VARCHAR(255) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    population INT DEFAULT 5000,
    households INT DEFAULT 1000,
    road_connectivity_grade VARCHAR(5) DEFAULT 'A',
    power_reliability_hours DECIMAL(4, 1) DEFAULT 20.0,
    nearest_mandi_distance_km DECIMAL(6, 2) DEFAULT 8.5,
    geom GEOMETRY(Point, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_locations_geom ON locations USING GIST (geom);

-- 3. Entrepreneur Profiles
CREATE TABLE IF NOT EXISTS entrepreneurs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    social_category VARCHAR(50) DEFAULT 'OBC',
    gender VARCHAR(20) DEFAULT 'MALE',
    annual_family_income DECIMAL(12, 2) DEFAULT 180000.00,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    custom_latitude DECIMAL(10, 7),
    custom_longitude DECIMAL(10, 7),
    available_capital DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    liquid_reserve DECIMAL(12, 2) DEFAULT 20000.00,
    land_acres DECIMAL(6, 2) DEFAULT 0.00,
    has_shop_building BOOLEAN DEFAULT FALSE,
    has_vehicle BOOLEAN DEFAULT FALSE,
    has_machinery BOOLEAN DEFAULT FALSE,
    has_electricity BOOLEAN DEFAULT TRUE,
    has_water_source BOOLEAN DEFAULT TRUE,
    has_internet BOOLEAN DEFAULT TRUE,
    has_storage_facility BOOLEAN DEFAULT FALSE,
    skills TEXT[] DEFAULT '{}',
    experience_years INT DEFAULT 0,
    business_interest VARCHAR(255),
    target_monthly_income DECIMAL(10, 2) DEFAULT 25000.00,
    risk_preference VARCHAR(20) DEFAULT 'MODERATE',
    preferred_language VARCHAR(10) DEFAULT 'hi',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Business Categories
CREATE TABLE IF NOT EXISTS business_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_code VARCHAR(100) UNIQUE NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_hi VARCHAR(255) NOT NULL,
    name_te VARCHAR(255) NOT NULL,
    sector VARCHAR(100) NOT NULL,
    description TEXT,
    min_capital DECIMAL(12, 2) NOT NULL,
    max_capital DECIMAL(12, 2) NOT NULL,
    min_land_acres DECIMAL(6, 2) DEFAULT 0.0,
    requires_water BOOLEAN DEFAULT FALSE,
    requires_three_phase_power BOOLEAN DEFAULT FALSE,
    typical_margin_pct DECIMAL(5, 2) DEFAULT 25.0,
    base_monthly_revenue DECIMAL(12, 2) DEFAULT 60000.00,
    base_monthly_expense DECIMAL(12, 2) DEFAULT 40000.00,
    risk_tier VARCHAR(20) DEFAULT 'MEDIUM',
    seasonality_factor VARCHAR(50) DEFAULT 'LOW',
    is_active BOOLEAN DEFAULT TRUE
);

-- 5. Hyper-Local Competitors & Businesses
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES business_categories(id) ON DELETE CASCADE,
    village_name VARCHAR(255),
    mandal VARCHAR(255),
    district VARCHAR(255),
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    estimated_monthly_turnover DECIMAL(12, 2),
    operational_years INT DEFAULT 3,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    geom GEOMETRY(Point, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_businesses_geom ON businesses USING GIST (geom);

-- 6. Hyper-Local Market Indicator Data
CREATE TABLE IF NOT EXISTS market_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    category_id UUID REFERENCES business_categories(id) ON DELETE CASCADE,
    demand_index DECIMAL(5, 2) DEFAULT 75.0,
    supply_index DECIMAL(5, 2) DEFAULT 50.0,
    local_unit_price DECIMAL(10, 2),
    price_trend VARCHAR(20) DEFAULT 'STABLE',
    data_confidence_score DECIMAL(5, 2) DEFAULT 88.0,
    last_verified_date DATE DEFAULT CURRENT_DATE,
    source_reference VARCHAR(255) DEFAULT 'District Industry Center (DIC) & APMC Mandi'
);

-- 7. Government Schemes (MoSJE & Central)
CREATE TABLE IF NOT EXISTS schemes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scheme_code VARCHAR(100) UNIQUE NOT NULL,
    organization VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    title_hi VARCHAR(255) NOT NULL,
    title_te VARCHAR(255) NOT NULL,
    scheme_type VARCHAR(100) NOT NULL,
    description TEXT,
    max_project_cost DECIMAL(14, 2) NOT NULL,
    max_loan_amount DECIMAL(14, 2) NOT NULL,
    beneficiary_margin_pct DECIMAL(5, 2) DEFAULT 10.0,
    concessional_loan_pct DECIMAL(5, 2) DEFAULT 90.0,
    interest_rate_pct DECIMAL(5, 2) NOT NULL,
    tenure_years INT NOT NULL,
    moratorium_months INT DEFAULT 3,
    subsidy_pct DECIMAL(5, 2) DEFAULT 0.0,
    eligible_social_categories TEXT[] DEFAULT '{"ALL"}',
    source_url VARCHAR(500) NOT NULL,
    last_verified_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE
);

-- 8. Government Scheme Eligibility Rules
CREATE TABLE IF NOT EXISTS scheme_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scheme_id UUID REFERENCES schemes(id) ON DELETE CASCADE,
    rule_code VARCHAR(100) NOT NULL,
    parameter_name VARCHAR(100) NOT NULL,
    operator VARCHAR(20) NOT NULL,
    threshold_value VARCHAR(255) NOT NULL,
    is_mandatory BOOLEAN DEFAULT TRUE,
    description_en VARCHAR(500) NOT NULL,
    description_hi VARCHAR(500) NOT NULL
);

-- 9. Recommendations Audit & History
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entrepreneur_id UUID REFERENCES entrepreneurs(id) ON DELETE CASCADE,
    category_id UUID REFERENCES business_categories(id) ON DELETE CASCADE,
    overall_suitability_score DECIMAL(5, 2) NOT NULL,
    confidence_score DECIMAL(5, 2) NOT NULL,
    market_score DECIMAL(5, 2) NOT NULL,
    financial_score DECIMAL(5, 2) NOT NULL,
    skill_score DECIMAL(5, 2) NOT NULL,
    profitability_score DECIMAL(5, 2) NOT NULL,
    competition_score DECIMAL(5, 2) NOT NULL,
    risk_safety_score DECIMAL(5, 2) NOT NULL,
    recommended_project_cost DECIMAL(12, 2) NOT NULL,
    own_contribution DECIMAL(12, 2) NOT NULL,
    loan_requirement DECIMAL(12, 2) NOT NULL,
    estimated_monthly_emi DECIMAL(10, 2) NOT NULL,
    estimated_monthly_revenue DECIMAL(12, 2) NOT NULL,
    estimated_monthly_expense DECIMAL(12, 2) NOT NULL,
    estimated_monthly_profit DECIMAL(12, 2) NOT NULL,
    dscr_ratio DECIMAL(5, 2) NOT NULL,
    matched_scheme_id UUID REFERENCES schemes(id),
    why_recommended_en TEXT NOT NULL,
    why_recommended_hi TEXT,
    why_recommended_te TEXT,
    key_risks JSONB DEFAULT '[]',
    risk_mitigations JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. RAG Scheme Knowledge Base & Embeddings
CREATE TABLE IF NOT EXISTS scheme_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scheme_id UUID REFERENCES schemes(id) ON DELETE CASCADE,
    document_title VARCHAR(255) NOT NULL,
    section_title VARCHAR(255),
    content_chunk TEXT NOT NULL,
    source_url VARCHAR(500),
    verified_date DATE DEFAULT CURRENT_DATE,
    embedding vector(384)
);
