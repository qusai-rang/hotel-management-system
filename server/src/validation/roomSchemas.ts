import { z } from 'zod';
import { OCCUPANCY_STATUSES, HOUSEKEEPING_STATUSES } from '../models/enums';

const ObjectIdStr = z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid ObjectId');

export const roomCreateSchema = z.object({
  number: z.string().min(1).max(10).trim(),
  floor: z.number().int().min(1).max(20),
  roomTypeId: ObjectIdStr,
  capacityAdults: z.number().int().min(1).default(1),
  capacityChildren: z.number().int().min(0).optional(),
  bedsLabel: z.string().min(1).max(50).trim(),
  sizeSqft: z.number().int().min(0).optional(),
  rateOverrideCents: z.number().int().min(0).optional(),
  occupancyStatus: z.enum(OCCUPANCY_STATUSES).default('vacant'),
  housekeepingStatus: z.enum(HOUSEKEEPING_STATUSES).default('clean'),
  currentReservationId: ObjectIdStr.nullish(),
  priorityNote: z.string().max(500).optional(),
});

export const roomUpdateSchema = z.object({
  number: z.string().min(1).max(10).trim().optional(),
  floor: z.number().int().min(1).max(20).optional(),
  roomTypeId: ObjectIdStr.optional(),
  capacityAdults: z.number().int().min(1).optional(),
  capacityChildren: z.number().int().min(0).optional(),
  bedsLabel: z.string().min(1).max(50).trim().optional(),
  sizeSqft: z.number().int().min(0).optional(),
  rateOverrideCents: z.number().int().min(0).nullish(),
  occupancyStatus: z.enum(OCCUPANCY_STATUSES).optional(),
  housekeepingStatus: z.enum(HOUSEKEEPING_STATUSES).optional(),
  currentReservationId: ObjectIdStr.nullish(),
  priorityNote: z.string().max(500).nullish(),
  cleanedAt: z.coerce.date().nullish(),
}).refine(o => Object.keys(o).length > 0, { message: 'At least one field is required' });

export const roomListQuerySchema = z.object({
  floor: z.coerce.number().int().min(1).max(20).optional(),
  status: z.string().optional(),
  q: z.string().optional(),
  roomTypeId: ObjectIdStr.optional(),
  housekeepingStatus: z.enum(HOUSEKEEPING_STATUSES).optional(),
  occupancyStatus: z.enum(OCCUPANCY_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type RoomCreateInput = z.infer<typeof roomCreateSchema>;
export type RoomUpdateInput = z.infer<typeof roomUpdateSchema>;
export type RoomListQuery = z.infer<typeof roomListQuerySchema>;
