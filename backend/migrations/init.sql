-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user profiles (preferences)
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    min_budget DECIMAL(10, 2),
    max_budget DECIMAL(10, 2),
    location_city VARCHAR(100),
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    search_radius_km DECIMAL(5, 2),
    unit_types TEXT[], -- bedrooms, studios, etc
    preferred_neighborhoods TEXT[],
    excluded_neighborhoods TEXT[],
    preferred_sources TEXT[], -- Facebook, Zillow, etc
    notification_email BOOLEAN DEFAULT TRUE,
    notification_sms BOOLEAN DEFAULT FALSE,
    notification_whatsapp BOOLEAN DEFAULT FALSE,
    notification_push BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create automation rules
CREATE TABLE IF NOT EXISTS automation_rules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    conditions JSONB NOT NULL, -- {"price_max": 2500, "scam_risk": "low", ...}
    actions JSONB NOT NULL, -- {"notify": "email", "save_listing": true}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create saved listings
CREATE TABLE IF NOT EXISTS saved_listings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    listing_id VARCHAR(100) NOT NULL,
    title VARCHAR(255),
    price DECIMAL(10, 2),
    source VARCHAR(100),
    url VARCHAR(500),
    image_url VARCHAR(500),
    ai_score INTEGER,
    scam_risk INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_evaluated_at TIMESTAMP
);

-- Create AI agents
CREATE TABLE IF NOT EXISTS ai_agents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    agent_type VARCHAR(100), -- scanner, evaluator, scam_detector, ranker
    source VARCHAR(100), -- facebook, zillow, craigslist, etc
    status VARCHAR(50) DEFAULT 'active', -- active, paused, error
    n8n_workflow_id VARCHAR(255),
    configuration JSONB, -- agent-specific config
    last_run TIMESTAMP,
    next_run TIMESTAMP,
    error_log TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create agent activity log
CREATE TABLE IF NOT EXISTS agent_activities (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(100), -- scan, evaluate, scam_detection, ranking
    status VARCHAR(50), -- running, completed, failed
    listings_processed INTEGER DEFAULT 0,
    listings_matched INTEGER DEFAULT 0,
    scams_detected INTEGER DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    output_data JSONB,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(100), -- deal, scam, system, match
    title VARCHAR(255),
    description TEXT,
    related_listing_id VARCHAR(100),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- Create rule activity logs
CREATE TABLE IF NOT EXISTS rule_activity_logs (
    id SERIAL PRIMARY KEY,
    rule_id INTEGER NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    listings_matched INTEGER,
    actions_executed JSONB
);

-- Create audit log
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(255),
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    changes JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_automation_rules_user_id ON automation_rules(user_id);
CREATE INDEX idx_saved_listings_user_id ON saved_listings(user_id);
CREATE INDEX idx_saved_listings_created_at ON saved_listings(created_at);
CREATE INDEX idx_ai_agents_user_id ON ai_agents(user_id);
CREATE INDEX idx_agent_activities_agent_id ON agent_activities(agent_id);
CREATE INDEX idx_agent_activities_user_id ON agent_activities(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_rule_activity_logs_rule_id ON rule_activity_logs(rule_id);
