import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { toSafeUser } from '../utils/userSerializer';
import { asyncHandler } from '../utils/asyncHandler';
import type { JwtPayload } from '../types/auth';

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
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Authentication required');
    }

    const token = header.slice(7);

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
