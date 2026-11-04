const STORAGE_KEY = 'csrf_token';

export function getStoredCsrfToken(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredCsrfToken(token: string | null | undefined): void {
  try {
    if (token) {
      window.localStorage.setItem(STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    return;
  }
}

export function clearStoredCsrfToken(): void {
  setStoredCsrfToken(null);
}
