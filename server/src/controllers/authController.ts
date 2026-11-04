import type { Request, Response } from 'express';
import { login as loginService, loginSchema } from '../services/authService';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { COOKIE_NAME } from '../middleware/authenticate';
import { issueCsrfToken, CSRF_COOKIE_NAME } from '../middleware/csrf';
import { getCookieSecurityOptions } from '../utils/cookieOptions';

/**
 * POST /api/v1/auth/login
 *
 * Body: { email, password }
 * Returns: { success, user }
 * Sets httpOnly cookie with JWT token.
 *
 * Invalid credentials produce a generic 401 so that callers
 * cannot enumerate valid emails.
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const result = await loginService(input.email, input.password);

  // Set httpOnly cookie with JWT
  res.cookie(COOKIE_NAME, result.token, {
    httpOnly: true,
    ...getCookieSecurityOptions(req),
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    path: '/',
  });

  // Issue CSRF token for subsequent requests
  const csrfToken = issueCsrfToken(req, res);

  res.status(200).json({
    success: true,
    user: result.user,
    csrfToken,
  });
});

/**
 * POST /api/v1/auth/logout
 *
 * Clears the auth cookie.
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const cookieSecurity = getCookieSecurityOptions(req);
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    ...cookieSecurity,
    path: '/',
  });
  res.clearCookie(CSRF_COOKIE_NAME, {
    httpOnly: false,
    ...cookieSecurity,
    path: '/',
  });

  res.status(200).json({ success: true });
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

  const csrfToken = req.cookies?.[CSRF_COOKIE_NAME] ?? issueCsrfToken(req, res);

  res.status(200).json({
    success: true,
    user: req.user,
    csrfToken,
  });
});
