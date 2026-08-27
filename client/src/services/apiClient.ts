/* ================================================================== */
/*  Centralized Axios API Client                                       */
/* ================================================================== */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { getAuthToken, removeAuthToken } from './auth';

/* ------------------------------------------------------------------ */
/*  Create instance                                                     */
/* ------------------------------------------------------------------ */

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL as string,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* ------------------------------------------------------------------ */
/*  Request interceptor — attach Bearer token                           */
/* ------------------------------------------------------------------ */

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAuthToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
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
      removeAuthToken();
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
