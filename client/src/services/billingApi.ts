/* ================================================================== */
/*  Billing API Service                                                */
/* ================================================================== */

import apiClient from './apiClient';
import type { ApiSuccessResponse, BillingMetrics, BillingTransactionRow, PaginatedResponse } from '@/types/api';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export async function fetchBillingTransactions(
  filters?: Record<string, unknown>,
): Promise<PaginatedResult<BillingTransactionRow>> {
  const { data } = await apiClient.get<PaginatedResponse<BillingTransactionRow>>(
    '/billing/transactions',
    { params: filters },
  );
  if (!data.success) throw new Error('Failed to fetch billing transactions');
  return { items: data.items ?? [], total: data.total ?? 0, page: data.page ?? 1, pageSize: data.pageSize ?? 20 };
}

export async function fetchBillingMetrics(): Promise<BillingMetrics> {
  const { data } = await apiClient.get<ApiSuccessResponse<BillingMetrics>>('/billing/metrics');
  if (!data.success || !data.item) throw new Error('Failed to fetch billing metrics');
  return data.item;
}
