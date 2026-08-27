import type { ZodError } from 'zod';
import type { ApiErrorDetail } from '../types/api';

/** Flattens Zod issues into the API's validation detail shape ({path,message}). */
export function mapZodError(error: ZodError): ApiErrorDetail[] {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}
