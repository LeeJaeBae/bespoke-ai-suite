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
    model: z.string().default('claude-3-opus'),
    temperature: z.number().min(0).max(1).default(0.7),
    maxTokens: z.number().default(4000),
    timeout: z.number().default(30000),
    retryAttempts: z.number().default(3),
    fallbackStrategy: z.enum(['local', 'alternative', 'none']).default('local')
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
  }),
  rag: z.object({
    weaviate: z.object({
      scheme: z.string().default('http'),
      host: z.string().default('localhost:8080'),
      apiKey: z.string().optional()
    }),
    openai: z.object({
      apiKey: z.string(),
      embeddingModel: z.string().default('text-embedding-3-small'),
      dimensions: z.number().default(1536)
    }),
    processing: z.object({
      chunkSize: z.number().default(512),
      chunkOverlap: z.number().default(50)
    }),
    collection: z.object({
      name: z.string().default('ContentDocuments'),
      distance: z.enum(['cosine', 'euclidean', 'manhattan']).default('cosine')
    })
  }),
  llm: z.object({
    primary: z.object({
      provider: z.enum(['claude', 'openai']).default('claude'),
      apiKey: z.string(),
      model: z.string().default('claude-3-sonnet-20240229'),
      temperature: z.number().min(0).max(2).default(0.7),
      maxTokens: z.number().default(4000)
    }),
    fallback: z.object({
      provider: z.enum(['claude', 'openai']).default('openai'),
      apiKey: z.string(),
      model: z.string().default('gpt-4-turbo-preview'),
      temperature: z.number().min(0).max(2).default(0.7),
      maxTokens: z.number().default(4000)
    }).optional(),
    retryAttempts: z.number().default(3),
    retryDelay: z.number().default(1000)
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
      model: process.env.CREW_AI_MODEL || 'claude-3-opus',
      temperature: parseFloat(process.env.CREW_AI_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.CREW_AI_MAX_TOKENS || '4000', 10),
      timeout: parseInt(process.env.CREW_AI_TIMEOUT || '30000', 10),
      retryAttempts: parseInt(process.env.CREW_AI_RETRY_ATTEMPTS || '3', 10),
      fallbackStrategy: (process.env.CREW_AI_FALLBACK_STRATEGY as any) || 'local'
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
    },
    rag: {
      weaviate: {
        scheme: process.env.WEAVIATE_SCHEME || 'http',
        host: process.env.WEAVIATE_HOST || 'localhost:8080',
        apiKey: process.env.WEAVIATE_API_KEY
      },
      openai: {
        apiKey: process.env.OPENAI_API_KEY || 'test-openai-key',
        embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
        dimensions: parseInt(process.env.OPENAI_EMBEDDING_DIMENSIONS || '1536', 10)
      },
      processing: {
        chunkSize: parseInt(process.env.RAG_CHUNK_SIZE || '512', 10),
        chunkOverlap: parseInt(process.env.RAG_CHUNK_OVERLAP || '50', 10)
      },
      collection: {
        name: process.env.WEAVIATE_COLLECTION_NAME || 'ContentDocuments',
        distance: (process.env.WEAVIATE_DISTANCE_METRIC as any) || 'cosine'
      }
    },
    llm: {
      primary: {
        provider: (process.env.LLM_PRIMARY_PROVIDER as any) || 'claude',
        apiKey: process.env.LLM_PRIMARY_API_KEY || process.env.CLAUDE_API_KEY || 'test-claude-key',
        model: process.env.LLM_PRIMARY_MODEL || 'claude-3-sonnet-20240229',
        temperature: parseFloat(process.env.LLM_PRIMARY_TEMPERATURE || '0.7'),
        maxTokens: parseInt(process.env.LLM_PRIMARY_MAX_TOKENS || '4000', 10)
      },
      fallback: process.env.LLM_FALLBACK_PROVIDER ? {
        provider: process.env.LLM_FALLBACK_PROVIDER as any,
        apiKey: process.env.LLM_FALLBACK_API_KEY || process.env.OPENAI_API_KEY || 'test-openai-key',
        model: process.env.LLM_FALLBACK_MODEL || 'gpt-4-turbo-preview',
        temperature: parseFloat(process.env.LLM_FALLBACK_TEMPERATURE || '0.7'),
        maxTokens: parseInt(process.env.LLM_FALLBACK_MAX_TOKENS || '4000', 10)
      } : undefined,
      retryAttempts: parseInt(process.env.LLM_RETRY_ATTEMPTS || '3', 10),
      retryDelay: parseInt(process.env.LLM_RETRY_DELAY || '1000', 10)
    }
  };

  // Validate configuration
  return configSchema.parse(config);
};

export type Config = z.infer<typeof configSchema>;
export const config: Config = loadConfig();