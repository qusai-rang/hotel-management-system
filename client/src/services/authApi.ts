/* ================================================================== */
/*  Auth API Service                                                   */
/* ================================================================== */

import apiClient from './apiClient';
import { clearStoredCsrfToken, setStoredCsrfToken } from './csrf';
import type { LoginResponse, MeResponse, SafeUser } from '@/types/api';

/* ------------------------------------------------------------------ */
/*  Login                                                              */
/* ------------------------------------------------------------------ */

export async function loginApi(email: string, password: string): Promise<{ user: SafeUser; token?: string }> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password });
  if (!data.success) throw new Error('Login failed');
  setStoredCsrfToken(data.csrfToken);
  return { user: data.user };
}

/* ------------------------------------------------------------------ */
/*  Get current user                                                   */
/* ------------------------------------------------------------------ */

export async function getMeApi(): Promise<SafeUser> {
  const { data } = await apiClient.get<MeResponse>('/auth/me');
  if (!data.success) throw new Error('Failed to fetch user');
  setStoredCsrfToken(data.csrfToken);
  return data.user;
}

/* ------------------------------------------------------------------ */
/*  Logout                                                              */
/* ------------------------------------------------------------------ */

export async function logoutApi(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } finally {
    clearStoredCsrfToken();
  }
}
