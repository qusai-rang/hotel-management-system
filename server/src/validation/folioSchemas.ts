import { z } from 'zod';
import { CHARGE_DEPARTMENTS } from '../models/enums';

export const chargeSchema = z.object({
  description: z.string().min(1).max(200).trim(),
  department: z.enum(CHARGE_DEPARTMENTS),
  quantity: z.number().int().min(1),
  unitAmountCents: z.number().int().min(0),
});

export const discountSchema = z.object({
  label: z.string().min(1).max(200).trim(),
  amountCents: z.number().int().min(1),
});

export type ChargeInput = z.infer<typeof chargeSchema>;
export type DiscountInput = z.infer<typeof discountSchema>;
