import type { Request, Response } from 'express';
import { login as loginService, loginSchema } from '../services/authService';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

/**
 * POST /api/v1/auth/login
 *
 * Body: { email, password }
 * Returns: { success, user, token }
 *
 * Invalid credentials produce a generic 401 so that callers
 * cannot enumerate valid emails.
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const result = await loginService(input.email, input.password);

  res.status(200).json({
    success: true,
    user:    result.user,
    token:   result.token,
  });
});

/**
 * GET /api/v1/auth/me
 *
 * Requires: authenticate middleware (runs before this handler)
 * Returns the currently authenticated user's safe representation.
 */
export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }

  res.status(200).json({
    success: true,
    user: req.user,
  });
});
