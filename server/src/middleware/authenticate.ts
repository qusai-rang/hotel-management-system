import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { toSafeUser } from '../utils/userSerializer';
import { asyncHandler } from '../utils/asyncHandler';
import type { JwtPayload } from '../types/auth';

const COOKIE_NAME = 'auth_token';

/**
 * Extract token from cookies (httpOnly) or Authorization header.
 * Priority: cookie > header (for browser clients, cookie is used).
 */
function extractToken(req: Request): string | null {
  // Check httpOnly cookie first
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    return req.cookies[COOKIE_NAME];
  }
  // Fallback to Authorization header for API clients
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return null;
}

/**
 * Require a valid Bearer token.  Loads the user from MongoDB and attaches
 * a safe user representation to req.user.  Rejects:
 *  – missing / malformed Authorization header
 *  – invalid or expired JWT
 *  – unknown or inactive user
 *
 * The error message is intentionally generic so callers cannot enumerate
 * valid emails or distinguish between bad-email / bad-password.
 */
export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token = extractToken(req);

    if (!token) {
      throw ApiError.unauthorized('Authentication required');
    }

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch {
      throw ApiError.unauthorized('Invalid or expired token');
    }

    const user = await User.findById(payload.sub).lean();
    if (!user || !user.active) {
      throw ApiError.unauthorized('Invalid or expired token');
    }

    req.user = toSafeUser(user);
    next();
  },
);

export { COOKIE_NAME };
