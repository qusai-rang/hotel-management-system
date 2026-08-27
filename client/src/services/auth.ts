/* ================================================================== */
/*  Auth Token Storage                                                 */
/* ================================================================== */

const TOKEN_KEY = 'luxestay_auth_token';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // SSR or storage full — silently ignore
  }
}

export function removeAuthToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // silently ignore
  }
}

export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}
