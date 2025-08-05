import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';

export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Log error details
  console.error('Error occurred:', {
    message: error.message,
    statusCode: error.statusCode,
    validation: error.validation,
    stack: error.stack,
    url: request.url,
    method: request.method,
    headers: request.headers,
    body: request.body
  });

  // Handle validation errors from Fastify
  if (error.validation) {
    return reply.code(400).send({
      status: 'error',
      error: {
        code: 'VALIDATION_ERROR',
        message: '요청 데이터가 유효하지 않습니다.',
        details: error.validation
      }
    });
  }

  // Handle known HTTP errors
  if (error.statusCode && error.statusCode < 500) {
    return reply.code(error.statusCode).send({
      status: 'error',
      error: {
        code: error.code || 'CLIENT_ERROR',
        message: error.message
      }
    });
  }

  // Handle syntax errors in JSON parsing
  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    return reply.code(400).send({
      status: 'error',
      error: {
        code: 'INVALID_JSON',
        message: '잘못된 JSON 형식입니다.'
      }
    });
  }

  // Default to 500 error
  return reply.code(500).send({
    status: 'error',
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: '서버 오류가 발생했습니다.'
    }
  });
}