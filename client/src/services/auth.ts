/* ================================================================== */
/*  Auth Token Storage                                                 */
/* ================================================================== */

/**
 * With httpOnly cookies, the token is stored in a cookie and automatically
 * sent with requests. We don't store it in localStorage anymore.
 * This file is kept for compatibility but functions are no-ops.
 */

export function getAuthToken(): string | null {
  // httpOnly cookie - not accessible from JS
  // This is kept for backwards compatibility but returns null
  return null;
}

export function setAuthToken(): void {
  // No-op: token is set via httpOnly cookie by the server
}

export function removeAuthToken(): void {
  // No-op: token is cleared via httpOnly cookie by the server
}

export function isAuthenticated(): boolean {
  // Can't check httpOnly cookie from JS
  // Use useAuth hook which calls /auth/me
  return false;
}
