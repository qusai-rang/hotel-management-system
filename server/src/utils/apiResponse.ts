import type { Response } from 'express';
import type { ApiErrorResponse, ApiSuccessResponse } from '../types/api';
import type { ApiError } from './ApiError';

/** Sends the canonical success envelope: { success: true, data }. */
export function sendSuccess<TData>(res: Response, data: TData, status = 200): void {
  const body: ApiSuccessResponse<TData> = { success: true, data };
  res.status(status).json(body);
}

/**
 * Sends the canonical error envelope:
 * { success: false, error: { code, message, details?, requestId? } }.
 * Empty details are omitted rather than serialized as an empty array.
 */
export function sendApiError(res: Response, error: ApiError, requestId?: string): void {
  const body: ApiErrorResponse = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      ...(error.details && error.details.length > 0 ? { details: error.details } : {}),
      ...(requestId ? { requestId } : {}),
    },
  };
  res.status(error.statusCode).json(body);
}
