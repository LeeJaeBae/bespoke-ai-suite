// MongoDB initialization script for Campaign Service

// Create campaign_db database
db = db.getSiblingDB('campaign_db');

// Create campaigns collection with indexes
db.createCollection('campaigns');

// Create indexes for better performance
db.campaigns.createIndex({ "user_id": 1 });
db.campaigns.createIndex({ "status": 1 });
db.campaigns.createIndex({ "created_at": -1 });
db.campaigns.createIndex({ "updated_at": -1 });
db.campaigns.createIndex({ "date_range.start_date": 1 });
db.campaigns.createIndex({ "date_range.end_date": 1 });
db.campaigns.createIndex({ "channels": 1 });
db.campaigns.createIndex({ "tags": 1 });
db.campaigns.createIndex({ "content_ids": 1 });
db.campaigns.createIndex({ "name": "text", "description": "text" });

// Compound indexes for common queries
db.campaigns.createIndex({ "user_id": 1, "status": 1 });
db.campaigns.createIndex({ "user_id": 1, "created_at": -1 });
db.campaigns.createIndex({ "status": 1, "date_range.start_date": 1 });
db.campaigns.createIndex({ "status": 1, "date_range.end_date": 1 });

print("Campaign database initialized successfully!");
print("Created campaigns collection with performance indexes.");

// Optional: Insert sample data for development
if (db.getName() === 'campaign_db') {
    print("Database setup complete for Campaign Service!");
}