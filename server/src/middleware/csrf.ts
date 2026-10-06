import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

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

  // Skip CSRF for login endpoint (handled by rate limiting)
  if (req.path === '/auth/login') {
    return next();
  }

  // Skip CSRF for health check
  if (req.path === '/health') {
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

export function issueCsrfToken(_req: Request, res: Response): void {
  const token = generateCsrfToken();
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by JavaScript
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    path: '/',
  });
  
  // Also set header for convenience
  res.setHeader(CSRF_HEADER_NAME, token);
}

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };