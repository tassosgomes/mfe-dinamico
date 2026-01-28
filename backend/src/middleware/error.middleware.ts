import type { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

export class HttpError extends Error {
  status: number;
  error: string;
  code?: string;
  detail?: string;

  constructor(status: number, error: string, detail?: string, code?: string) {
    super(detail || error);
    this.status = status;
    this.error = error;
    this.code = code;
    this.detail = detail;
  }
}

export const errorMiddleware: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof HttpError) {
    logger.warn('request_failed', {
      status: err.status,
      error: err.error,
      code: err.code,
    });

    return res.status(err.status).json({
      error: err.error,
      error_description: err.detail,
      code: err.code,
    });
  }

  logger.error('unexpected_error', err as Error);

  return res.status(500).json({
    error: 'server_error',
    error_description: 'Unexpected server error',
    code: 'SERVER_ERROR',
  });
};
