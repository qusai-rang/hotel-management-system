import { z } from 'zod';
import { PAYMENT_METHODS } from '../models/enums';

const ObjectIdStr = z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid ObjectId');

export const checkoutPaymentSchema = z.object({
  amountCents: z.number().int().min(1),
  method: z.enum(PAYMENT_METHODS),
  cardBrand: z.string().max(30).trim().optional(),
  cardLast4: z.string().length(4).trim().optional(),
  gatewayRef: z.string().max(100).trim().optional(),
  idempotencyKey: z.string().min(1).max(100).trim().optional(),
});

export const checkoutCompletionSchema = z.object({}).optional();

export const invoiceGenerateSchema = z.object({
  folioId: ObjectIdStr,
});

export const invoiceQuerySchema = z.object({
  number: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CheckoutPaymentInput = z.infer<typeof checkoutPaymentSchema>;
export type InvoiceGenerateInput = z.infer<typeof invoiceGenerateSchema>;
