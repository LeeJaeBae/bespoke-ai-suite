// Switch to admin database
db = db.getSiblingDB('admin');

// Create root user if not exists
db.createUser({
  user: 'mongo',
  pwd: 'mongo123',
  roles: [{ role: 'root', db: 'admin' }]
});

// Create application databases
db = db.getSiblingDB('bespoke_content');
db.createCollection('contents');
db.createCollection('templates');
db.createCollection('media');

// Create indexes
db.contents.createIndex({ "userId": 1, "createdAt": -1 });
db.contents.createIndex({ "type": 1 });
db.contents.createIndex({ "campaignId": 1 });
db.contents.createIndex({ "status": 1 });

// Create user for content service
db.createUser({
  user: 'content_service',
  pwd: 'content_mongo_2025',
  roles: [
    { role: 'readWrite', db: 'bespoke_content' }
  ]
});

// Analytics database
db = db.getSiblingDB('bespoke_analytics');
db.createCollection('events');
db.createCollection('metrics');
db.createCollection('reports');

// Create indexes for analytics
db.events.createIndex({ "timestamp": -1 });
db.events.createIndex({ "userId": 1, "eventType": 1 });
db.metrics.createIndex({ "timestamp": -1, "metricType": 1 });

// Create user for analytics service
db.createUser({
  user: 'analytics_service',
  pwd: 'analytics_mongo_2025',
  roles: [
    { role: 'readWrite', db: 'bespoke_analytics' }
  ]
});