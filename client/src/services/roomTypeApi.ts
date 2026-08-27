/* ================================================================== */
/*  Room Types API Service                                             */
/* ================================================================== */

import apiClient from './apiClient';
import type { PaginatedResponse, RoomTypeDTO } from '@/types/api';

export async function fetchRoomTypes(): Promise<RoomTypeDTO[]> {
  const { data } = await apiClient.get<PaginatedResponse<RoomTypeDTO>>('/room-types');
  if (!data.success) throw new Error('Failed to fetch room types');
  return data.items ?? [];
}
