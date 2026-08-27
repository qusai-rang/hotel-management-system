import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/ApiError';
import { mapZodError } from '../utils/mapZodError';
import { sendApiError } from '../utils/apiResponse';

/** Mongoose documents fail with a ValidationError whose name we can detect generically. */
function isMongooseValidationError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    (err as { name?: unknown }).name === 'ValidationError'
  );
}

/**
 * Central error handler — must stay last and keep the 4-argument signature so
 * Express recognizes it. Resolution order: Zod -> ApiError -> Mongoose
 * ValidationError -> fallback 500 (message hidden outside development).
 * Stack traces are logged only in non-production; headers/bodies are never logged.
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  let apiError: ApiError;

  if (err instanceof ZodError) {
    apiError = ApiError.validation(mapZodError(err));
  } else if (err instanceof ApiError) {
    apiError = err;
  } else if (isMongooseValidationError(err)) {
    // Forward-compatible hook until models land in the next phase.
    apiError = new ApiError(422, 'VALIDATION_ERROR', 'Document validation failed');
  } else {
    const devMessage =
      env.NODE_ENV !== 'production' && err instanceof Error
        ? err.message
        : 'Internal server error';
    apiError = ApiError.internal(devMessage);
  }

  logger.error('request failed', {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    status: apiError.statusCode,
    code: apiError.code,
    ...(env.NODE_ENV !== 'production'
      ? { stack: err instanceof Error ? err.stack : String(err) }
      : {}),
  });

  sendApiError(res, apiError, req.requestId);
}
