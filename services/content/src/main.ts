import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import mongoose from 'mongoose';
import { config } from './infrastructure/config/config.js';
import { errorHandler } from './infrastructure/middleware/errorHandler.js';
import { contentRoutes } from './infrastructure/routes/contentRoutes.js';
import { ContentController } from './infrastructure/controllers/ContentController.js';

// Import repositories
import { MongoContentRepository } from './infrastructure/repositories/MongoContentRepository.js';

// Import external services
import { CrewAIAgentService } from './infrastructure/external/CrewAIAgentService.js';
import { WeaviateRAGService } from './infrastructure/external/WeaviateRAGService.js';
import { KafkaEventPublisher } from './infrastructure/external/KafkaEventPublisher.js';
import { LLMManager } from './infrastructure/external/LLMManager.js';

// Import use cases
import { CreateContentUseCase } from './application/use-cases/CreateContentUseCase.js';
import { GetContentUseCase } from './application/use-cases/GetContentUseCase.js';
import { UpdateContentUseCase } from './application/use-cases/UpdateContentUseCase.js';
import { DeleteContentUseCase } from './application/use-cases/DeleteContentUseCase.js';
import { ListContentUseCase } from './application/use-cases/ListContentUseCase.js';
import { PublishContentUseCase } from './application/use-cases/PublishContentUseCase.js';

async function bootstrap() {
  // Create Fastify instance
  const fastify = Fastify({
    logger: {
      level: config.logging.level,
      transport: config.logging.pretty ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname'
        }
      } : undefined
    }
  });

  // Register plugins
  await fastify.register(cors, config.cors);
  await fastify.register(helmet);

  // Register Swagger
  await fastify.register(swagger, {
    swagger: {
      info: {
        title: 'Content Service API',
        description: 'AI-powered content generation and management service',
        version: '1.0.0'
      },
      host: `${config.server.host}:${config.server.port}`,
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        { name: 'content', description: 'Content management endpoints' }
      ]
    }
  });

  await fastify.register(swaggerUI, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    }
  });

  // Set error handler
  fastify.setErrorHandler(errorHandler);

  // Connect to MongoDB
  try {
    await mongoose.connect(config.database.mongodb.uri, {
      dbName: config.database.mongodb.name,
      maxPoolSize: config.database.mongodb.options.maxPoolSize,
      minPoolSize: config.database.mongodb.options.minPoolSize,
      maxIdleTimeMS: config.database.mongodb.options.maxIdleTimeMS
    });
    fastify.log.info('Connected to MongoDB');
  } catch (error) {
    fastify.log.error('MongoDB connection error:', error);
    process.exit(1);
  }

  // Initialize repositories
  const contentRepository = new MongoContentRepository();

  // Initialize LLM Manager
  const llmManager = new LLMManager(
    {
      primary: {
        provider: config.llm.primary.provider,
        apiKey: config.llm.primary.apiKey,
        model: config.llm.primary.model,
        temperature: config.llm.primary.temperature,
        maxTokens: config.llm.primary.maxTokens
      },
      fallback: config.llm.fallback ? {
        provider: config.llm.fallback.provider,
        apiKey: config.llm.fallback.apiKey,
        model: config.llm.fallback.model,
        temperature: config.llm.fallback.temperature,
        maxTokens: config.llm.fallback.maxTokens
      } : undefined,
      retryAttempts: config.llm.retryAttempts,
      retryDelay: config.llm.retryDelay
    },
    fastify.log
  );
  
  // Initialize external services
  const aiAgentService = new CrewAIAgentService(
    {
      apiKey: config.crewAI.apiKey,
      baseUrl: config.crewAI.baseUrl,
      model: config.crewAI.model || 'claude-3-opus',
      temperature: config.crewAI.temperature || 0.7,
      maxTokens: config.crewAI.maxTokens || 4000,
      timeout: config.crewAI.timeout || 30000,
      retryAttempts: config.crewAI.retryAttempts || 3,
      fallbackStrategy: config.crewAI.fallbackStrategy || 'local'
    },
    fastify.log,
    llmManager // Pass LLM Manager to Crew AI service
  );

  // Initialize RAG service
  const ragService = new WeaviateRAGService(
    {
      weaviate: {
        scheme: config.rag.weaviate.scheme,
        host: config.rag.weaviate.host,
        apiKey: config.rag.weaviate.apiKey
      },
      openai: {
        apiKey: config.rag.openai.apiKey,
        model: config.rag.openai.embeddingModel,
        dimensions: config.rag.openai.dimensions
      },
      collection: {
        name: config.rag.collection.name,
        distance: config.rag.collection.distance
      },
      processing: {
        chunkSize: config.rag.processing.chunkSize,
        chunkOverlap: config.rag.processing.chunkOverlap,
        embeddingModel: config.rag.openai.embeddingModel
      }
    },
    fastify.log
  );

  // Initialize RAG service collection
  try {
    await ragService.initialize();
    fastify.log.info('RAG service initialized successfully');
  } catch (error) {
    fastify.log.error('Failed to initialize RAG service:', error);
    // Continue without RAG for now
  }

  const eventPublisher = new KafkaEventPublisher({
    brokers: config.kafka.brokers,
    clientId: config.kafka.clientId
  });

  // Initialize use cases
  const createContentUseCase = new CreateContentUseCase(
    contentRepository,
    aiAgentService,
    eventPublisher
  );
  const getContentUseCase = new GetContentUseCase(contentRepository);
  const updateContentUseCase = new UpdateContentUseCase(contentRepository, eventPublisher);
  const deleteContentUseCase = new DeleteContentUseCase(contentRepository, eventPublisher);
  const listContentUseCase = new ListContentUseCase(contentRepository);
  const publishContentUseCase = new PublishContentUseCase(contentRepository, eventPublisher);

  // Initialize controller
  const contentController = new ContentController(
    createContentUseCase,
    getContentUseCase,
    updateContentUseCase,
    deleteContentUseCase,
    listContentUseCase,
    publishContentUseCase
  );

  // Register routes
  await contentRoutes(fastify, contentController);

  // Graceful shutdown
  const gracefulShutdown = async () => {
    fastify.log.info('Shutting down gracefully...');
    await fastify.close();
    await mongoose.connection.close();
    process.exit(0);
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  // Start server
  try {
    await fastify.listen({
      port: config.server.port,
      host: config.server.host
    });
    
    fastify.log.info(`Content Service running on ${config.server.host}:${config.server.port}`);
    fastify.log.info(`API Documentation available at http://${config.server.host}:${config.server.port}/documentation`);
  } catch (error) {
    fastify.log.error('Server startup error:', error);
    process.exit(1);
  }
}

// Start the application
bootstrap().catch((error) => {
  console.error('Bootstrap error:', error);
  process.exit(1);
});