/* ================================================================== */
/*  Folio API Service                                                  */
/* ================================================================== */

import apiClient from './apiClient';
import type { ApiSuccessResponse, FolioDTO } from '@/types/api';

export async function fetchFolio(id: string): Promise<FolioDTO> {
  const { data } = await apiClient.get<ApiSuccessResponse<FolioDTO>>(`/folios/${id}`);
  if (!data.success || !data.item) throw new Error('Folio not found');
  return data.item;
}
