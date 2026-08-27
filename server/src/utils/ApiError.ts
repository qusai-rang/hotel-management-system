import type { ApiErrorDetail } from '../types/api';

/**
 * Typed application error carrying an HTTP status, a machine-readable code,
 * a user-facing message and optional validation details. Everything the
 * central error middleware needs to render the API error envelope.
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: ApiErrorDetail[];

  constructor(statusCode: number, code: string, message: string, details?: ApiErrorDetail[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message = 'Bad request', details?: ApiErrorDetail[]): ApiError {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Authentication required'): ApiError {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Insufficient permissions'): ApiError {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static conflict(message = 'Resource conflict'): ApiError {
    return new ApiError(409, 'CONFLICT', message);
  }

  static validation(details: ApiErrorDetail[], message = 'Request validation failed'): ApiError {
    return new ApiError(422, 'VALIDATION_ERROR', message, details);
  }

  static internal(message = 'Internal server error'): ApiError {
    return new ApiError(500, 'INTERNAL_ERROR', message);
  }
}
