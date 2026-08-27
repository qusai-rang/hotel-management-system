import type { Types } from 'mongoose';
import type { UserRole } from '../models/enums';
import type { SafeUser } from '../types/auth';

/**
 * Shape of a Mongoose User document's plain-object form.
 * Matches the subset of fields the User model exposes.
 */
export interface UserDocSnapshot {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: string;
  active: boolean;
  lastLoginAt?: Date | null;
}

/**
 * Strip sensitive/internal fields and produce a JSON-safe user
 * representation for API responses.
 */
export function toSafeUser(doc: UserDocSnapshot): SafeUser {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    role: doc.role as UserRole,
    active: doc.active,
    lastLoginAt: doc.lastLoginAt ?? null,
  };
}
