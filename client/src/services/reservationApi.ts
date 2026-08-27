/* ================================================================== */
/*  Reservations API Service                                           */
/* ================================================================== */

import apiClient from './apiClient';
import type { ApiSuccessResponse, PaginatedResponse, ReservationDetailDTO, ReservationListItem } from '@/types/api';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export async function fetchReservations(
  filters?: Record<string, unknown>,
): Promise<PaginatedResult<ReservationListItem>> {
  const { data } = await apiClient.get<PaginatedResponse<ReservationListItem>>('/reservations', {
    params: filters,
  });
  if (!data.success) throw new Error('Failed to fetch reservations');
  return {
    items: data.items ?? [],
    total: data.total ?? 0,
    page: data.page ?? 1,
    pageSize: data.pageSize ?? 20,
  };
}

export interface CreateReservationPayload {
  guestId?: string;
  newGuest?: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    membershipTier?: 'standard' | 'gold' | 'platinum';
  };
  roomTypeId: string;
  roomId?: string | null;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  specialRequests?: Array<{ title: string; description?: string; iconName?: string }>;
  source?: string;
}

export interface CreateReservationResult {
  id: string;
  code: string;
  status: string;
}

export async function createReservationApi(
  payload: CreateReservationPayload,
): Promise<CreateReservationResult> {
  const { data } = await apiClient.post<{ success: boolean; item: CreateReservationResult }>(
    '/reservations',
    payload,
  );
  if (!data.success || !data.item) throw new Error('Failed to create reservation');
  return data.item;
}

export async function fetchReservationById(id: string): Promise<ReservationDetailDTO> {
  const { data } = await apiClient.get<ApiSuccessResponse<ReservationDetailDTO>>(
    `/reservations/${id}`,
  );
  if (!data.success || !data.item) throw new Error('Reservation not found');
  return data.item;
}
