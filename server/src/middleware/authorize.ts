import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import type { UserRole } from '../models/enums';

/**
 * Require that the authenticated user (set by the authenticate middleware)
 * has one of the specified roles.
 *
 * Must be used **after** authenticate in the middleware chain:
 *   router.get('/path', authenticate, authorize('admin'), handler)
 */
export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw ApiError.forbidden('Insufficient permissions');
    }
    next();
  };
}
