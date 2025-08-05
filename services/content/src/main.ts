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
import { CrewAIClient } from './infrastructure/external/CrewAIClient.js';
import { KafkaEventPublisher } from './infrastructure/external/KafkaEventPublisher.js';

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

  // Initialize external services
  const crewAIService = new CrewAIClient({
    baseUrl: config.crewAI.baseUrl,
    apiKey: config.crewAI.apiKey
  });

  const eventPublisher = new KafkaEventPublisher({
    brokers: config.kafka.brokers,
    clientId: config.kafka.clientId
  });

  // Initialize use cases
  const createContentUseCase = new CreateContentUseCase(
    contentRepository,
    crewAIService,
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