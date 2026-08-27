import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { toSafeUser } from '../utils/userSerializer';
import type { JwtPayload, SafeUser } from '../types/auth';

/* ------------------------------------------------------------------ */
/*  Zod schema – validates + normalises login input                    */
/* ------------------------------------------------------------------ */

export const loginSchema = z.object({
  email:    z.string().min(1, 'Email is required').email('Invalid email format')
    .transform(val => val.toLowerCase().trim()),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const BCRYPT_ROUNDS = 12;
const GENERIC_AUTH_ERROR = 'Invalid email or password';

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Authenticate a user by email + password.
 * Returns a safe user representation and a signed JWT.
 *
 * Both "email not found" and "wrong password" produce the same generic
 * error so that callers cannot enumerate valid accounts.
 */
export async function login(email: string, password: string): Promise<{ user: SafeUser; token: string }> {
  const user = await User.findOne({ email, active: true });

  if (!user) {
    throw ApiError.unauthorized(GENERIC_AUTH_ERROR);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw ApiError.unauthorized(GENERIC_AUTH_ERROR);
  }

  const now = new Date();
  await User.findByIdAndUpdate(user._id, { lastLoginAt: now });

  const jwtPayload: JwtPayload = {
    sub: user._id.toString(),
    role: user.role as JwtPayload['role'],
  };

  const token = jwt.sign(jwtPayload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });

  return {
    user: toSafeUser({ ...user.toObject(), lastLoginAt: now }),
    token,
  };
}

/**
 * Hash a plaintext password.  Exposed for seed-data / admin tooling.
 */
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, BCRYPT_ROUNDS);
}
