/* ================================================================== */
/*  API Error / Loading Utilities                                      */
/* ================================================================== */

import type { ApiError } from '@/services/apiClient';

/* ------------------------------------------------------------------ */
/*  Error classification                                               */
/* ------------------------------------------------------------------ */

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as ApiError).code === 'string'
  );
}

export function getErrorCode(error: unknown): string | null {
  if (isApiError(error)) return error.code;
  if (error instanceof Error) return 'CLIENT_ERROR';
  return 'UNKNOWN_ERROR';
}

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred.';
}

/* ------------------------------------------------------------------ */
/*  Auth state helpers                                                 */
/* ------------------------------------------------------------------ */

export function isUnauthorized(error: unknown): boolean {
  return getErrorCode(error) === 'UNAUTHORIZED';
}

export function isForbidden(error: unknown): boolean {
  return getErrorCode(error) === 'FORBIDDEN';
}

export function isNotFound(error: unknown): boolean {
  return getErrorCode(error) === 'NOT_FOUND';
}

export function isConflict(error: unknown): boolean {
  return getErrorCode(error) === 'CONFLICT';
}

export function isValidationError(error: unknown): boolean {
  return getErrorCode(error) === 'VALIDATION_ERROR';
}

/* ------------------------------------------------------------------ */
/*  Loading / Empty state helpers                                      */
/* ------------------------------------------------------------------ */

export interface AsyncState {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  errorMessage: string | null;
}

export function deriveAsyncState<T>(
  isLoading: boolean,
  isError: boolean,
  error: unknown,
  data: T | undefined,
  isEmptyCheck?: (data: T) => boolean,
): AsyncState {
  const items = Array.isArray(data) ? data.length : undefined;
  return {
    isLoading,
    isError,
    isEmpty: !isLoading && !isError && (items === 0 || (data !== undefined && isEmptyCheck?.(data) === true)),
    errorMessage: isError ? getErrorMessage(error) : null,
  };
}
