import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateContentUseCase } from '@application/use-cases/CreateContentUseCase.js';
import { GetContentUseCase } from '@application/use-cases/GetContentUseCase.js';
import { UpdateContentUseCase } from '@application/use-cases/UpdateContentUseCase.js';
import { DeleteContentUseCase } from '@application/use-cases/DeleteContentUseCase.js';
import { ListContentUseCase } from '@application/use-cases/ListContentUseCase.js';
import { PublishContentUseCase } from '@application/use-cases/PublishContentUseCase.js';
import { CreateContentRequest, UpdateContentRequest } from '@application/dto/ContentDTO.js';
import { ContentFilter } from '@domain/repositories/ContentRepository.js';

interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string;
    role: string;
  };
}

export class ContentController {
  constructor(
    private readonly createContentUseCase: CreateContentUseCase,
    private readonly getContentUseCase: GetContentUseCase,
    private readonly updateContentUseCase: UpdateContentUseCase,
    private readonly deleteContentUseCase: DeleteContentUseCase,
    private readonly listContentUseCase: ListContentUseCase,
    private readonly publishContentUseCase: PublishContentUseCase
  ) {}

  async createContent(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.code(401).send({
          status: 'error',
          error: {
            code: 'UNAUTHORIZED',
            message: '인증이 필요합니다.'
          }
        });
      }

      const requestData: CreateContentRequest = {
        ...request.body as any,
        userId
      };

      const result = await this.createContentUseCase.execute(requestData);

      return reply.code(201).send({
        status: 'success',
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      });
    } catch (error: any) {
      return this.handleError(error, reply);
    }
  }

  async getContent(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const result = await this.getContentUseCase.execute({ id, userId: request.user?.id });

      if (!result) {
        return reply.code(404).send({
          status: 'error',
          error: {
            code: 'CONTENT_NOT_FOUND',
            message: '콘텐츠를 찾을 수 없습니다.'
          }
        });
      }

      return reply.send({
        status: 'success',
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      });
    } catch (error: any) {
      return this.handleError(error, reply);
    }
  }

  async updateContent(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const userId = request.user?.id;
      
      if (!userId) {
        return reply.code(401).send({
          status: 'error',
          error: {
            code: 'UNAUTHORIZED',
            message: '인증이 필요합니다.'
          }
        });
      }

      const requestData: UpdateContentRequest = {
        id,
        ...request.body as any,
        userId
      };

      const result = await this.updateContentUseCase.execute(requestData);

      return reply.send({
        status: 'success',
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      });
    } catch (error: any) {
      return this.handleError(error, reply);
    }
  }

  async deleteContent(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const userId = request.user?.id;
      
      if (!userId) {
        return reply.code(401).send({
          status: 'error',
          error: {
            code: 'UNAUTHORIZED',
            message: '인증이 필요합니다.'
          }
        });
      }

      await this.deleteContentUseCase.execute({ id, userId, userRole: request.user?.role || 'user' });

      return reply.code(204).send();
    } catch (error: any) {
      return this.handleError(error, reply);
    }
  }

  async listContent(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;
      
      const filter: ContentFilter = {
        userId: query.userId,
        type: query.type,
        status: query.status,
        tags: query.tags ? query.tags.split(',') : undefined,
        fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
        toDate: query.toDate ? new Date(query.toDate) : undefined
      };

      const pagination = {
        page: parseInt(query.page || '1'),
        limit: parseInt(query.limit || '10'),
        sortBy: query.sortBy || 'createdAt',
        sortOrder: query.sortOrder || 'desc'
      };

      const result = await this.listContentUseCase.execute({ filter, pagination });

      return reply.send({
        status: 'success',
        data: result.items,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          pagination: {
            total: result.total,
            page: result.page,
            totalPages: result.totalPages,
            hasNext: result.hasNext,
            hasPrevious: result.hasPrevious
          }
        }
      });
    } catch (error: any) {
      return this.handleError(error, reply);
    }
  }

  async publishContent(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const userId = request.user?.id;
      
      if (!userId) {
        return reply.code(401).send({
          status: 'error',
          error: {
            code: 'UNAUTHORIZED',
            message: '인증이 필요합니다.'
          }
        });
      }

      const result = await this.publishContentUseCase.execute({ id, userId: userId! });

      return reply.send({
        status: 'success',
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      });
    } catch (error: any) {
      return this.handleError(error, reply);
    }
  }

  private handleError(error: any, reply: FastifyReply) {
    if (error.name === 'ValidationError') {
      return reply.code(400).send({
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: '입력값이 유효하지 않습니다.',
          details: error.errors || error.message
        }
      });
    }

    if (error.message?.includes('not found')) {
      return reply.code(404).send({
        status: 'error',
        error: {
          code: 'NOT_FOUND',
          message: error.message
        }
      });
    }

    if (error.message?.includes('Unauthorized')) {
      return reply.code(403).send({
        status: 'error',
        error: {
          code: 'FORBIDDEN',
          message: error.message
        }
      });
    }

    // Log the error for debugging
    console.error('Controller error:', error);

    return reply.code(500).send({
      status: 'error',
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '서버 오류가 발생했습니다.'
      }
    });
  }
}