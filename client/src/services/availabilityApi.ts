/* ================================================================== */
/*  Availability API Service                                           */
/* ================================================================== */

import apiClient from './apiClient';
import type { AvailabilityGroup } from '@/types/api';

export interface AvailabilitySearchParams {
  from: string;
  to: string;
  adults?: number;
  children?: number;
  roomTypeId?: string;
}

interface AvailabilityResponse {
  success: boolean;
  items: AvailabilityGroup[];
}

export async function searchAvailability(
  params: AvailabilitySearchParams,
): Promise<AvailabilityGroup[]> {
  const apiParams: Record<string, unknown> = {
    from: params.from,
    to: params.to,
    adults: params.adults ?? 1,
    children: params.children ?? 0,
  };
  if (params.roomTypeId) apiParams.roomTypeId = params.roomTypeId;

  const { data } = await apiClient.get<AvailabilityResponse>('/api/v1/availability', {
    params: apiParams,
  });
  if (!data.success) throw new Error('Failed to search availability');
  return data.items ?? [];
}
