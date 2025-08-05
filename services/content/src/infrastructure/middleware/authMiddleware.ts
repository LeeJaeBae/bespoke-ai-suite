import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';

interface JWTPayload {
  sub: string;
  role: string;
  iat?: number;
  exp?: number;
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        status: 'error',
        error: {
          code: 'MISSING_TOKEN',
          message: '인증 토큰이 필요합니다.'
        }
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const payload = jwt.verify(token, config.auth.jwt.secret, {
        issuer: config.auth.jwt.issuer
      }) as JWTPayload;

      // Attach user info to request
      (request as any).user = {
        id: payload.sub,
        role: payload.role
      };
    } catch (jwtError: any) {
      if (jwtError.name === 'TokenExpiredError') {
        return reply.code(401).send({
          status: 'error',
          error: {
            code: 'TOKEN_EXPIRED',
            message: '인증 토큰이 만료되었습니다.'
          }
        });
      }
      
      if (jwtError.name === 'JsonWebTokenError') {
        return reply.code(401).send({
          status: 'error',
          error: {
            code: 'INVALID_TOKEN',
            message: '유효하지 않은 토큰입니다.'
          }
        });
      }
      
      throw jwtError;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return reply.code(500).send({
      status: 'error',
      error: {
        code: 'AUTH_ERROR',
        message: '인증 처리 중 오류가 발생했습니다.'
      }
    });
  }
}

// Optional auth middleware - doesn't fail if no token is present
export async function optionalAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, but that's okay for optional auth
      return;
    }

    const token = authHeader.substring(7);
    
    try {
      const payload = jwt.verify(token, config.auth.jwt.secret, {
        issuer: config.auth.jwt.issuer
      }) as JWTPayload;

      (request as any).user = {
        id: payload.sub,
        role: payload.role
      };
    } catch (jwtError) {
      // Invalid token, but we don't fail the request
      console.warn('Invalid token in optional auth:', jwtError);
    }
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    // Don't fail the request
  }
}