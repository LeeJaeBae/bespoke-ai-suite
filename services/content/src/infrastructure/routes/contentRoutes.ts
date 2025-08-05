import { FastifyInstance } from 'fastify';
import { ContentController } from '../controllers/ContentController.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware.js';

// Request/Response schemas for Swagger documentation
const contentSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    type: { type: 'string', enum: ['TEXT', 'IMAGE', 'VIDEO'] },
    title: { type: 'string' },
    body: { type: 'string' },
    userId: { type: 'string' },
    status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] },
    qualityScore: { type: 'number' },
    metadata: {
      type: 'object',
      properties: {
        keywords: { type: 'array', items: { type: 'string' } },
        tags: { type: 'array', items: { type: 'string' } },
        targetAudience: { type: 'string' },
        tone: { type: 'string' },
        language: { type: 'string' }
      }
    },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

const createContentSchema = {
  body: {
    type: 'object',
    required: ['type', 'prompt'],
    properties: {
      type: { type: 'string', enum: ['TEXT', 'IMAGE', 'VIDEO'] },
      prompt: { type: 'string', minLength: 10 },
      parameters: {
        type: 'object',
        properties: {
          targetAudience: { type: 'string' },
          tone: { type: 'string' },
          language: { type: 'string' },
          length: { type: 'string', enum: ['short', 'medium', 'long'] }
        }
      }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        data: contentSchema,
        meta: { type: 'object' }
      }
    }
  }
};

const updateContentSchema = {
  body: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      body: { type: 'string' },
      metadata: {
        type: 'object',
        properties: {
          keywords: { type: 'array', items: { type: 'string' } },
          tags: { type: 'array', items: { type: 'string' } },
          targetAudience: { type: 'string' },
          tone: { type: 'string' }
        }
      }
    }
  },
  params: {
    type: 'object',
    properties: {
      id: { type: 'string' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        data: contentSchema,
        meta: { type: 'object' }
      }
    }
  }
};

const listContentSchema = {
  querystring: {
    type: 'object',
    properties: {
      userId: { type: 'string' },
      type: { type: 'string', enum: ['TEXT', 'IMAGE', 'VIDEO'] },
      status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] },
      tags: { type: 'string' },
      fromDate: { type: 'string', format: 'date-time' },
      toDate: { type: 'string', format: 'date-time' },
      page: { type: 'integer', minimum: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100 },
      sortBy: { type: 'string' },
      sortOrder: { type: 'string', enum: ['asc', 'desc'] }
    }
  }
};

export async function contentRoutes(
  fastify: FastifyInstance,
  controller: ContentController
): Promise<void> {
  // Create content
  fastify.post('/contents', {
    preHandler: authMiddleware,
    schema: createContentSchema
  }, (request, reply) => controller.createContent(request, reply));

  // Get content by ID
  fastify.get('/contents/:id', {
    preHandler: optionalAuthMiddleware,
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, (request, reply) => controller.getContent(request, reply));

  // Update content
  fastify.put('/contents/:id', {
    preHandler: authMiddleware,
    schema: updateContentSchema
  }, (request, reply) => controller.updateContent(request, reply));

  // Delete content
  fastify.delete('/contents/:id', {
    preHandler: authMiddleware,
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, (request, reply) => controller.deleteContent(request, reply));

  // List contents
  fastify.get('/contents', {
    preHandler: optionalAuthMiddleware,
    schema: listContentSchema
  }, (request, reply) => controller.listContent(request, reply));

  // Publish content
  fastify.post('/contents/:id/publish', {
    preHandler: authMiddleware,
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, (request, reply) => controller.publishContent(request, reply));

  // Health check
  fastify.get('/health', async (request, reply) => {
    return reply.send({
      status: 'success',
      data: {
        service: 'content-service',
        status: 'healthy',
        timestamp: new Date().toISOString()
      }
    });
  });
}