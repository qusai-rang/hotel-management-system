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
  const { data } = await apiClient.get<PaginatedResponse<ReservationListItem>>('/api/v1/reservations', {
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
    '/api/v1/reservations',
    payload,
  );
  if (!data.success || !data.item) throw new Error('Failed to create reservation');
  return data.item;
}

export async function fetchReservationById(id: string): Promise<ReservationDetailDTO> {
  const { data } = await apiClient.get<ApiSuccessResponse<ReservationDetailDTO>>(
    `/api/v1/reservations/${id}`,
  );
  if (!data.success || !data.item) throw new Error('Reservation not found');
  return data.item;
}

export interface ReservationActionResult {
  id: string;
  code: string;
  status: string;
}

export async function cancelReservationApi(id: string): Promise<ReservationActionResult> {
  const { data } = await apiClient.post<ApiSuccessResponse<ReservationActionResult>>(
    '/api/v1/reservations/${id}/cancel',
  );
  if (!data.success || !data.item) throw new Error('Failed to cancel reservation');
  return data.item;
}

export async function checkInReservationApi(id: string): Promise<ReservationActionResult> {
  const { data } = await apiClient.post<ApiSuccessResponse<ReservationActionResult>>(
    '/api/v1/reservations/${id}/check-in',
  );
  if (!data.success || !data.item) throw new Error('Failed to check in reservation');
  return data.item;
}

export interface AddInternalNoteResult {
  id: string;
  code: string;
  notes: { body: string; addedBy: string | null; addedAt: string }[];
}

export async function addInternalNoteApi(id: string, body: string): Promise<AddInternalNoteResult> {
  const { data } = await apiClient.post<ApiSuccessResponse<AddInternalNoteResult>>(
    '/api/v1/reservations/${id}/notes',
    { body },
  );
  if (!data.success || !data.item) throw new Error('Failed to add note');
  return data.item;
}
