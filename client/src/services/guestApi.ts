/* ================================================================== */
/*  Guests API Service                                                 */
/* ================================================================== */

import apiClient from './apiClient';
import type { ApiSuccessResponse, GuestListItem, GuestProfileDTO, PaginatedResponse } from '@/types/api';

export async function fetchGuests(filters?: Record<string, unknown>): Promise<GuestListItem[]> {
  const { data } = await apiClient.get<PaginatedResponse<GuestListItem>>('/guests', { params: filters });
  if (!data.success) throw new Error('Failed to fetch guests');
  return data.items ?? [];
}

export async function fetchGuestBySlug(slug: string): Promise<GuestProfileDTO> {
  const { data } = await apiClient.get<ApiSuccessResponse<GuestProfileDTO>>(`/guests/${slug}`);
  if (!data.success || !data.item) throw new Error('Guest not found');
  return data.item;
}
