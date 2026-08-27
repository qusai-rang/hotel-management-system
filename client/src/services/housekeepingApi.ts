/* ================================================================== */
/*  Housekeeping API Service                                           */
/* ================================================================== */

import apiClient from './apiClient';
import type {
  ApiSuccessResponse,
  HousekeepingStatsDTO,
  HousekeepingTaskDTO,
  PaginatedResponse,
  StaffScheduleEntryDTO,
} from '@/types/api';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export async function fetchHousekeepingTasks(
  filters?: Record<string, unknown>,
): Promise<PaginatedResult<HousekeepingTaskDTO>> {
  const { data } = await apiClient.get<PaginatedResponse<HousekeepingTaskDTO>>(
    '/housekeeping/tasks',
    { params: filters },
  );
  if (!data.success) throw new Error('Failed to fetch housekeeping tasks');
  return { items: data.items ?? [], total: data.total ?? 0, page: data.page ?? 1, pageSize: data.pageSize ?? 20 };
}

export async function fetchHousekeepingStats(): Promise<HousekeepingStatsDTO> {
  const { data } = await apiClient.get<ApiSuccessResponse<HousekeepingStatsDTO>>(
    '/housekeeping/stats',
  );
  if (!data.success || !data.item) throw new Error('Failed to fetch housekeeping stats');
  return data.item;
}

export async function fetchStaffSchedule(
  date?: string,
): Promise<StaffScheduleEntryDTO[]> {
  const { data } = await apiClient.get<{ success: boolean; items: StaffScheduleEntryDTO[] }>(
    '/housekeeping/staff-schedule',
    { params: date ? { date } : undefined },
  );
  if (!data.success) throw new Error('Failed to fetch staff schedule');
  return data.items ?? [];
}
