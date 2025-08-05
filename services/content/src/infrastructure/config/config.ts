import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration schema
const configSchema = z.object({
  server: z.object({
    port: z.number().min(1).max(65535),
    host: z.string(),
    environment: z.enum(['development', 'staging', 'production'])
  }),
  database: z.object({
    mongodb: z.object({
      uri: z.string().url(),
      name: z.string(),
      options: z.object({
        maxPoolSize: z.number().default(10),
        minPoolSize: z.number().default(2),
        maxIdleTimeMS: z.number().default(10000)
      })
    })
  }),
  auth: z.object({
    jwt: z.object({
      secret: z.string().min(32),
      expiresIn: z.string().default('15m'),
      issuer: z.string().default('bespoke-ai-content-service')
    })
  }),
  crewAI: z.object({
    baseUrl: z.string().url(),
    apiKey: z.string(),
    timeout: z.number().default(30000)
  }),
  kafka: z.object({
    brokers: z.array(z.string()),
    clientId: z.string().default('content-service'),
    groupId: z.string().default('content-service-group')
  }),
  cors: z.object({
    origin: z.union([z.string(), z.array(z.string()), z.boolean()]),
    credentials: z.boolean().default(true)
  }),
  logging: z.object({
    level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    pretty: z.boolean().default(true)
  })
});

// Load and validate configuration
const loadConfig = () => {
  const config = {
    server: {
      port: parseInt(process.env.PORT || '8081', 10),
      host: process.env.HOST || '0.0.0.0',
      environment: process.env.NODE_ENV || 'development'
    },
    database: {
      mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
        name: process.env.MONGODB_DB_NAME || 'bespoke_content',
        options: {
          maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10', 10),
          minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2', 10),
          maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_TIME || '10000', 10)
        }
      }
    },
    auth: {
      jwt: {
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this',
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        issuer: 'bespoke-ai-content-service'
      }
    },
    crewAI: {
      baseUrl: process.env.CREW_AI_BASE_URL || 'http://localhost:8000',
      apiKey: process.env.CREW_AI_API_KEY || 'test-api-key',
      timeout: parseInt(process.env.CREW_AI_TIMEOUT || '30000', 10)
    },
    kafka: {
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      clientId: process.env.KAFKA_CLIENT_ID || 'content-service',
      groupId: process.env.KAFKA_GROUP_ID || 'content-service-group'
    },
    cors: {
      origin: process.env.CORS_ORIGIN ? 
        process.env.CORS_ORIGIN.split(',') : 
        ['http://localhost:3000'],
      credentials: true
    },
    logging: {
      level: process.env.LOG_LEVEL as any || 'info',
      pretty: process.env.NODE_ENV !== 'production'
    }
  };

  // Validate configuration
  return configSchema.parse(config);
};

export type Config = z.infer<typeof configSchema>;
export const config: Config = loadConfig();