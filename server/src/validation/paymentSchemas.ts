import { z } from 'zod';
import { PAYMENT_METHODS } from '../models/enums';

export const paymentCreateSchema = z.object({
  amountCents: z.number().int().min(1),
  method: z.enum(PAYMENT_METHODS),
  cardBrand: z.string().max(30).trim().optional(),
  cardLast4: z.string().length(4).trim().optional(),
  gatewayRef: z.string().max(100).trim().optional(),
  idempotencyKey: z.string().min(1).max(100).trim().optional(),
});

export const refundSchema = z.object({
  amountCents: z.number().int().min(1),
  reason: z.string().max(500).trim().optional(),
});

export type PaymentCreateInput = z.infer<typeof paymentCreateSchema>;
export type RefundInput = z.infer<typeof refundSchema>;
