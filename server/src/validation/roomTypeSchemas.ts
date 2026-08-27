import { z } from 'zod';

const amenitySchema = z.object({
  iconName: z.string().min(1),
  label: z.string().min(1),
});

export const roomTypeCreateSchema = z.object({
  code: z.string().min(1).max(20).trim(),
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(500).default(''),
  basePricePerNightCents: z.number().int().min(0),
  maxGuests: z.number().int().min(1),
  bedLabel: z.string().min(1).max(50).trim(),
  sizeSqft: z.number().int().min(0).optional(),
  amenities: z.array(amenitySchema).default([]),
  accentColor: z.string().max(20).optional(),
});

export const roomTypeUpdateSchema = z.object({
  code: z.string().min(1).max(20).trim().optional(),
  name: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(500).optional(),
  basePricePerNightCents: z.number().int().min(0).optional(),
  maxGuests: z.number().int().min(1).optional(),
  bedLabel: z.string().min(1).max(50).trim().optional(),
  sizeSqft: z.number().int().min(0).optional(),
  amenities: z.array(amenitySchema).optional(),
  accentColor: z.string().max(20).optional(),
}).refine(o => Object.keys(o).length > 0, { message: 'At least one field is required' });

export const roomTypeListQuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type RoomTypeCreateInput = z.infer<typeof roomTypeCreateSchema>;
export type RoomTypeUpdateInput = z.infer<typeof roomTypeUpdateSchema>;
export type RoomTypeListQuery = z.infer<typeof roomTypeListQuerySchema>;
