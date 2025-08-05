-- Create databases for each service
CREATE DATABASE IF NOT EXISTS bespoke_db;
CREATE DATABASE IF NOT EXISTS content_service;
CREATE DATABASE IF NOT EXISTS campaign_service;
CREATE DATABASE IF NOT EXISTS analytics_service;

-- Create users for each service
CREATE USER IF NOT EXISTS content_service_user WITH PASSWORD 'content_pass_2025';
CREATE USER IF NOT EXISTS campaign_service_user WITH PASSWORD 'campaign_pass_2025';
CREATE USER IF NOT EXISTS user_service_user WITH PASSWORD 'user_pass_2025';
CREATE USER IF NOT EXISTS analytics_service_user WITH PASSWORD 'analytics_pass_2025';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE content_service TO content_service_user;
GRANT ALL PRIVILEGES ON DATABASE campaign_service TO campaign_service_user;
GRANT ALL PRIVILEGES ON DATABASE bespoke_db TO user_service_user;
GRANT ALL PRIVILEGES ON DATABASE analytics_service TO analytics_service_user;

-- Enable UUID extension
\c bespoke_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";