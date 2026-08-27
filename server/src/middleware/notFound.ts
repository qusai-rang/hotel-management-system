import type { Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { sendApiError } from '../utils/apiResponse';

/**
 * Terminal handler for unmatched /api/v1 routes (mounted directly on the
 * app under the /api/v1 prefix so it never claims non-API paths).
 */
export function apiNotFound(req: Request, res: Response): void {
  sendApiError(res, ApiError.notFound(`Route not found: ${req.method} ${req.path}`), req.requestId);
}
