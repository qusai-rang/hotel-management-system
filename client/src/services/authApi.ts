/* ================================================================== */
/*  Auth API Service                                                   */
/* ================================================================== */

import apiClient from './apiClient';
import type { LoginResponse, MeResponse, SafeUser } from '@/types/api';

/* ------------------------------------------------------------------ */
/*  Login                                                              */
/* ------------------------------------------------------------------ */

export async function loginApi(email: string, password: string): Promise<{ user: SafeUser; token: string }> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password });
  if (!data.success) throw new Error('Login failed');
  return { user: data.user, token: data.token };
}

/* ------------------------------------------------------------------ */
/*  Get current user                                                   */
/* ------------------------------------------------------------------ */

export async function getMeApi(): Promise<SafeUser> {
  const { data } = await apiClient.get<MeResponse>('/auth/me');
  if (!data.success) throw new Error('Failed to fetch user');
  return data.user;
}
