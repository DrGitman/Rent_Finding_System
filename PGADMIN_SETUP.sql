-- Run this SQL in pgAdmin to set up the Rent Scout database
-- Connect as the rentscout user

-- Create the main database
CREATE DATABASE rentscout_db;

-- Connect to the new database and create tables
-- (Run the next commands while connected to rentscout_db)

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Listings table
CREATE TABLE IF NOT EXISTS listings (
    id SERIAL PRIMARY KEY,
    source VARCHAR(50) NOT NULL,
    source_id VARCHAR(255),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    location VARCHAR(500),
    url VARCHAR(500),
    image_url VARCHAR(500),
    bedrooms INT,
    bathrooms INT,
    square_feet INT,
    ai_score FLOAT,
    scam_risk_score FLOAT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_listings_source ON listings(source);
CREATE INDEX idx_listings_user_id ON listings(user_id);
CREATE INDEX idx_listings_created_at ON listings(created_at);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Webhooks/Events table
CREATE TABLE IF NOT EXISTS webhook_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);

-- Scrapers log table
CREATE TABLE IF NOT EXISTS scraper_logs (
    id SERIAL PRIMARY KEY,
    scraper_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    items_scraped INT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Done! Your database is ready for Rent Scout
