/* ================================================================== */
/*  Rooms API Service                                                  */
/* ================================================================== */

import apiClient from './apiClient';
import type { ApiSuccessResponse, PaginatedResponse, RoomDetailDTO, RoomListItem } from '@/types/api';

export async function fetchRooms(filters?: Record<string, unknown>): Promise<RoomListItem[]> {
  const { data } = await apiClient.get<PaginatedResponse<RoomListItem>>('/api/v1/rooms', { params: filters });
  if (!data.success) throw new Error('Failed to fetch rooms');
  return data.items ?? [];
}

export async function fetchRoomById(id: string): Promise<RoomDetailDTO> {
  const { data } = await apiClient.get<ApiSuccessResponse<RoomDetailDTO>>(`/api/v1/rooms/${id}`);
  if (!data.success || !data.item) throw new Error('Room not found');
  return data.item;
}
