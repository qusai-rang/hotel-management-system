import { z } from 'zod';
import { MEMBERSHIP_TIERS } from '../models/enums';

export const guestCreateSchema = z.object({
  firstName: z.string().min(1).max(50).trim(),
  lastName: z.string().min(1).max(50).trim(),
  email: z.string().email().optional(),
  phone: z.string().max(30).trim().optional(),
  address: z.object({
    lines: z.array(z.string().trim()).default([]),
    city: z.string().trim().optional(),
    country: z.string().trim().optional(),
  }).optional(),
  membershipTier: z.enum(MEMBERSHIP_TIERS).default('standard'),
  notes: z.string().max(2000).default(''),
});

export const guestUpdateSchema = z.object({
  firstName: z.string().min(1).max(50).trim().optional(),
  lastName: z.string().min(1).max(50).trim().optional(),
  email: z.string().email().optional(),
  phone: z.string().max(30).trim().optional(),
  address: z.object({
    lines: z.array(z.string().trim()).default([]),
    city: z.string().trim().optional(),
    country: z.string().trim().optional(),
  }).optional(),
  membershipTier: z.enum(MEMBERSHIP_TIERS).optional(),
  notes: z.string().max(2000).optional(),
}).refine(o => Object.keys(o).length > 0, { message: 'At least one field is required' });

export const guestListQuerySchema = z.object({
  q: z.string().optional(),
  membershipTier: z.enum(MEMBERSHIP_TIERS).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type GuestCreateInput = z.infer<typeof guestCreateSchema>;
export type GuestUpdateInput = z.infer<typeof guestUpdateSchema>;
export type GuestListQuery = z.infer<typeof guestListQuerySchema>;
