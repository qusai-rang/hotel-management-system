/* ================================================================== */
/*  Feature Hooks — React Query powered, backed by real API             */
/* ================================================================== */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  RoomListItem,
  RoomDetailDTO,
  RoomTypeDTO,
  GuestListItem,
  GuestProfileDTO,
  ReservationListItem,
  ReservationDetailDTO,
  HousekeepingTaskDTO,
  HousekeepingStatsDTO,
  StaffScheduleEntryDTO,
  BillingTransactionRow,
  BillingMetrics,
  InvoiceDTO,
  DashboardSummary,
  AvailabilityGroup,
  CheckoutSessionDTO,
} from '@/types/api';
import type { AvailabilitySearchParams } from '@/services/availabilityApi';

import { fetchRoomTypes } from '@/services/roomTypeApi';
import { fetchRooms, fetchRoomById } from '@/services/roomApi';
import { fetchGuests, fetchGuestBySlug } from '@/services/guestApi';
import { searchAvailability } from '@/services/availabilityApi';
import { fetchReservations, fetchReservationById, createReservationApi, type CreateReservationPayload } from '@/services/reservationApi';
import { fetchHousekeepingTasks, fetchHousekeepingStats, fetchStaffSchedule, type PaginatedResult as HkPaginatedResult } from '@/services/housekeepingApi';
import { fetchBillingTransactions, fetchBillingMetrics, type PaginatedResult as BillingPaginatedResult } from '@/services/billingApi';
import { fetchInvoice } from '@/services/invoiceApi';
import { fetchDashboardSummary } from '@/services/dashboardApi';
import { fetchCheckoutSession, collectCheckoutPayment, completeCheckout, type CheckoutPaymentPayload } from '@/services/checkoutApi';

import {
  roomTypeKeys,
  roomKeys,
  guestKeys,
  availabilityKeys,
  reservationKeys,
  housekeepingKeys,
  billingKeys,
  folioKeys,
  invoiceKeys,
  dashboardKeys,
  checkoutKeys,
} from '@/constants/queryKeys';

/* ------------------------------------------------------------------ */
/*  Rooms                                                              */
/* ------------------------------------------------------------------ */

export function useRooms(filters?: Record<string, unknown>) {
  return useQuery<RoomListItem[]>({
    queryKey: roomKeys.list(filters),
    queryFn: () => fetchRooms(filters),
  });
}

export function useRoomDetail(roomId: string) {
  return useQuery<RoomDetailDTO | null>({
    queryKey: roomKeys.detail(roomId),
    queryFn: () => fetchRoomById(roomId),
    enabled: !!roomId,
  });
}

/* ------------------------------------------------------------------ */
/*  Room Types                                                         */
/* ------------------------------------------------------------------ */

export function useRoomTypes() {
  return useQuery<RoomTypeDTO[]>({
    queryKey: roomTypeKeys.list(),
    queryFn: fetchRoomTypes,
  });
}

/* ------------------------------------------------------------------ */
/*  Guests                                                             */
/* ------------------------------------------------------------------ */

export function useGuests(filters?: Record<string, unknown>) {
  return useQuery<GuestListItem[]>({
    queryKey: guestKeys.list(filters),
    queryFn: () => fetchGuests(filters),
  });
}

export function useGuestProfile(slug: string) {
  return useQuery<GuestProfileDTO | null>({
    queryKey: guestKeys.detail(slug),
    queryFn: () => fetchGuestBySlug(slug),
    enabled: !!slug,
  });
}

/* ------------------------------------------------------------------ */
/*  Reservations                                                       */
/* ------------------------------------------------------------------ */

export function useReservations(filters?: Record<string, unknown>) {
  return useQuery<import('@/services/reservationApi').PaginatedResult<ReservationListItem>>({
    queryKey: reservationKeys.list(filters),
    queryFn: () => fetchReservations(filters),
  });
}

export function useReservationDetail(id: string) {
  return useQuery<ReservationDetailDTO | null>({
    queryKey: reservationKeys.detail(id),
    queryFn: () => fetchReservationById(id),
    enabled: !!id,
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReservationPayload) => createReservationApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reservationKeys.all });
      queryClient.invalidateQueries({ queryKey: availabilityKeys.all });
      queryClient.invalidateQueries({ queryKey: guestKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Housekeeping                                                       */
/* ------------------------------------------------------------------ */

export function useHousekeepingTasks(filters?: Record<string, unknown>) {
  return useQuery<HkPaginatedResult<HousekeepingTaskDTO>>({
    queryKey: housekeepingKeys.tasks(filters),
    queryFn: () => fetchHousekeepingTasks(filters),
  });
}

export function useHousekeepingStats() {
  return useQuery<HousekeepingStatsDTO | null>({
    queryKey: housekeepingKeys.stats(),
    queryFn: fetchHousekeepingStats,
  });
}

export function useStaffSchedule(date?: string) {
  return useQuery<StaffScheduleEntryDTO[]>({
    queryKey: housekeepingKeys.schedule(date),
    queryFn: () => fetchStaffSchedule(date),
  });
}

/* ------------------------------------------------------------------ */
/*  Billing                                                            */
/* ------------------------------------------------------------------ */

export function useBillingTransactions(filters?: Record<string, unknown>) {
  return useQuery<BillingPaginatedResult<BillingTransactionRow>>({
    queryKey: billingKeys.transactions(filters),
    queryFn: () => fetchBillingTransactions(filters),
  });
}

export function useBillingMetrics() {
  return useQuery<BillingMetrics | null>({
    queryKey: billingKeys.metrics(),
    queryFn: fetchBillingMetrics,
  });
}

/* ------------------------------------------------------------------ */
/*  Invoice                                                            */
/* ------------------------------------------------------------------ */

export function useInvoice(invoiceNumber: string) {
  return useQuery<InvoiceDTO | null>({
    queryKey: invoiceKeys.detail(invoiceNumber),
    queryFn: () => fetchInvoice(invoiceNumber),
    enabled: !!invoiceNumber,
  });
}

/* ------------------------------------------------------------------ */
/*  Dashboard                                                          */
/* ------------------------------------------------------------------ */

export function useDashboardSummary() {
  return useQuery<DashboardSummary | null>({
    queryKey: dashboardKeys.summary(),
    queryFn: fetchDashboardSummary,
  });
}

/* ------------------------------------------------------------------ */
/*  Availability                                                       */
/* ------------------------------------------------------------------ */

export function useAvailability(params: AvailabilitySearchParams | null) {
  return useQuery<AvailabilityGroup[]>({
    queryKey: availabilityKeys.search(params ? { ...params } : {}),
    queryFn: () => searchAvailability(params!),
    enabled: !!params?.from && !!params?.to,
  });
}

/* ------------------------------------------------------------------ */
/*  Checkout                                                           */
/* ------------------------------------------------------------------ */

export function useCheckoutSession(reservationId: string) {
  return useQuery<CheckoutSessionDTO | null>({
    queryKey: checkoutKeys.session(reservationId),
    queryFn: () => fetchCheckoutSession(reservationId),
    enabled: !!reservationId,
  });
}

export function useCheckoutPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reservationId, payload }: { reservationId: string; payload: CheckoutPaymentPayload }) =>
      collectCheckoutPayment(reservationId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: checkoutKeys.session(variables.reservationId) });
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
      queryClient.invalidateQueries({ queryKey: folioKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useCheckoutComplete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reservationId: string) => completeCheckout(reservationId),
    onSuccess: (_data, reservationId) => {
      queryClient.invalidateQueries({ queryKey: reservationKeys.all });
      queryClient.invalidateQueries({ queryKey: roomKeys.all });
      queryClient.invalidateQueries({ queryKey: housekeepingKeys.all });
      queryClient.invalidateQueries({ queryKey: folioKeys.all });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      queryClient.invalidateQueries({ queryKey: checkoutKeys.session(reservationId) });
    },
  });
}
