import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { getCookieSecurityOptions } from '../utils/cookieOptions';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

function generateCsrfToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function csrfProtection(req: Request, _res: Response, next: NextFunction): void {
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for login endpoint (handle both /auth/login and /api/v1/auth/login)
  const loginPaths = ['/auth/login', '/api/v1/auth/login', '/v1/auth/login'];
  const isLoginPath = loginPaths.some(
    (path) => req.path === path || req.path.startsWith('/api/v1/auth/'),
  );
  if (isLoginPath) {
    return next();
  }

  // Skip CSRF for health check
  if (req.path === '/health' || req.path === '/api/v1/health') {
    return next();
  }

  // Get token from cookie
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  // Get token from header
  const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    throw ApiError.forbidden('Invalid or missing CSRF token');
  }

  next();
}

export function issueCsrfToken(req: Request, res: Response): string {
  const token = generateCsrfToken();

  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by JavaScript
    ...getCookieSecurityOptions(req),
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    path: '/',
  });

  res.setHeader(CSRF_HEADER_NAME, token);

  return token;
}

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };
