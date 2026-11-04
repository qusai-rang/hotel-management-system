/* ================================================================== */
/*  Centralized Axios API Client                                       */
/* ================================================================== */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

/* ------------------------------------------------------------------ */
/*  API prefix helpers                                                  */
/* ------------------------------------------------------------------ */

const API_PREFIX = '/api/v1';

function normalizeBaseURL(raw: string): string {
  return raw.trim().replace(/\/+$/, '').replace(/\/api\/v1$/, '');
}

function withApiPrefix(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const path = url.replace(/^\/api\/v1(?=\/|$)/, '');
  return `${API_PREFIX}${path.startsWith('/') ? path : `/${path}`}`;
}

const rawBaseURL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

/* ------------------------------------------------------------------ */
/*  Create instance                                                     */
/* ------------------------------------------------------------------ */

const apiClient = axios.create({
  baseURL: normalizeBaseURL(rawBaseURL),
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Required for httpOnly cookies
});

/* ------------------------------------------------------------------ */
/*  Request interceptor — add CSRF token from cookie                    */
/* ------------------------------------------------------------------ */

function getCsrfToken(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrf_token') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (config.url) {
    config.url = withApiPrefix(config.url);
  }

  // Skip CSRF for safe methods and login
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  const isLoginRequest = config.url?.includes('/auth/login');
  
  if (!safeMethods.includes(config.method?.toUpperCase() ?? '') && !isLoginRequest) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers['x-csrf-token'] = csrfToken;
    }
  }
  
  return config;
});

/* ------------------------------------------------------------------ */
/*  Response interceptor — normalize errors + handle 401                */
/* ------------------------------------------------------------------ */

export interface ApiError {
  code: string;
  message: string;
  details?: { path: string; message: string }[];
  requestId?: string;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ success: false; error: ApiError }>) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url ?? '';

    // 401 — session expired or invalid token on a protected endpoint.
    // Do NOT clear token or redirect when the request is to /auth/login
    // (invalid credentials are a normal login error, not a session expiry).
    const isLoginRequest = requestUrl.includes('/auth/login');
    if (status === 401 && !isLoginRequest) {
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Normalize error shape for consumers
    const apiError: ApiError = error.response?.data?.error ?? {
      code: status === 401 ? 'UNAUTHORIZED' : status === 403 ? 'FORBIDDEN' : 'NETWORK_ERROR',
      message: error.message ?? 'An unexpected error occurred',
    };

    return Promise.reject(apiError);
  },
);

export default apiClient;
