/* ================================================================== */
/*  Dashboard API Service                                              */
/* ================================================================== */

import apiClient from './apiClient';
import type { ApiSuccessResponse, DashboardSummary } from '@/types/api';

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await apiClient.get<ApiSuccessResponse<DashboardSummary>>('/dashboard/summary');
  if (!data.success || !data.item) throw new Error('Failed to fetch dashboard summary');
  return data.item;
}
