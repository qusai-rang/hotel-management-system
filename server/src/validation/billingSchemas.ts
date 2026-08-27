import { z } from 'zod';
import { CHARGE_DEPARTMENTS, PAYMENT_STATUSES } from '../models/enums';

export const billingTransactionQuerySchema = z.object({
  q: z.string().optional(),
  status: z.enum(PAYMENT_STATUSES).optional(),
  department: z.enum(CHARGE_DEPARTMENTS).optional(),
  from: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  to: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type BillingTransactionQuery = z.infer<typeof billingTransactionQuerySchema>;
