/* ================================================================== */
/*  Checkout API Service                                               */
/* ================================================================== */

import apiClient from './apiClient';
import type { ApiSuccessResponse, CheckoutSessionDTO, CheckoutCompletionDTO } from '@/types/api';

export interface CheckoutPaymentPayload {
  amountCents: number;
  method: 'card' | 'cash' | 'online' | 'room_charge';
  cardBrand?: string;
  cardLast4?: string;
  gatewayRef?: string;
}

export async function fetchCheckoutSession(reservationId: string): Promise<CheckoutSessionDTO> {
  const { data } = await apiClient.get<ApiSuccessResponse<CheckoutSessionDTO>>(
    `/api/v1/checkout/${reservationId}`,
  );
  if (!data.success || !data.item) throw new Error('Checkout session not found');
  return data.item;
}

export async function collectCheckoutPayment(
  reservationId: string,
  payload: CheckoutPaymentPayload,
): Promise<CheckoutSessionDTO> {
  const { data } = await apiClient.post<ApiSuccessResponse<CheckoutSessionDTO>>(
    `/api/v1/checkout/${reservationId}/payments`,
    payload,
  );
  if (!data.success || !data.item) throw new Error('Failed to collect payment');
  return data.item;
}

export async function completeCheckout(reservationId: string): Promise<CheckoutCompletionDTO> {
  const { data } = await apiClient.post<ApiSuccessResponse<CheckoutCompletionDTO>>(
    `/api/v1/checkout/${reservationId}/complete`,
  );
  if (!data.success || !data.item) throw new Error('Failed to complete checkout');
  return data.item;
}
