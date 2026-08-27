import type { UserRole } from '../models/enums';

export interface JwtPayload {
  sub: string;
  role: UserRole;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  lastLoginAt: Date | null;
}

export interface AuthenticatedUser extends SafeUser {
  id: string;
}
