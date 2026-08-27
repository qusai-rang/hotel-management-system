/* ================================================================== */
/*  Invoice API Service                                                */
/* ================================================================== */

import apiClient from './apiClient';
import type { ApiSuccessResponse, InvoiceDTO } from '@/types/api';

export async function fetchInvoice(invoiceNumber: string): Promise<InvoiceDTO> {
  const { data } = await apiClient.get<ApiSuccessResponse<InvoiceDTO>>(
    `/invoices/${invoiceNumber}`,
  );
  if (!data.success || !data.item) throw new Error('Invoice not found');
  return data.item;
}
