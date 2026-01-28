import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { JwtService } from '../services/jwt.service';
import { logger } from '../utils/logger';
import type { AuthenticatedRequest, JwtValidationError } from '../types';

const errorDescriptionByCode: Record<string, string> = {
  EXPIRED_TOKEN: 'Token is expired',
  INVALID_TOKEN: 'Token is invalid',
};

const mapJwtErrorToCode = (error: JwtValidationError | undefined) =>
  error === 'EXPIRED_TOKEN' ? 'EXPIRED_TOKEN' : 'INVALID_TOKEN';

export const authMiddleware = (jwtService: JwtService): RequestHandler =>
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('manifest_request_denied', {
        reason: 'missing_token',
        path: req.path,
      });
      return res.status(401).json({
        error: 'invalid_token',
        error_description: 'Authorization token not provided',
        code: 'INVALID_TOKEN',
      });
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      logger.warn('manifest_request_denied', {
        reason: 'empty_token',
        path: req.path,
      });
      return res.status(401).json({
        error: 'invalid_token',
        error_description: 'Authorization token not provided',
        code: 'INVALID_TOKEN',
      });
    }

    const validation = await jwtService.validateToken(token);
    if (!validation.valid || !validation.payload) {
      const code = mapJwtErrorToCode(validation.error);
      logger.warn('manifest_request_denied', {
        reason: validation.error || 'invalid_token',
        path: req.path,
      });
      return res.status(401).json({
        error: 'invalid_token',
        error_description: errorDescriptionByCode[code],
        code,
      });
    }

    const roles = jwtService.extractRoles(validation.payload);
    const userInfo = jwtService.extractUserInfo(validation.payload);

    (req as AuthenticatedRequest).user = {
      ...userInfo,
      roles,
    };

    return next();
  };
