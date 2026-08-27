import { z } from 'zod';
import { RESERVATION_STATUSES } from '../models/enums';

const ObjectIdStr = z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid ObjectId');

const specialRequestSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(500).optional(),
  iconName: z.string().max(50).optional(),
  dueAt: z.coerce.date().optional(),
});

export const reservationListQuerySchema = z.object({
  q: z.string().optional(),
  status: z.enum(RESERVATION_STATUSES).optional(),
  roomTypeId: ObjectIdStr.optional(),
  from: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  to: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const createReservationSchema = z.object({
  guestId: ObjectIdStr.optional(),
  newGuest: z.object({
    firstName: z.string().min(1).max(50).trim(),
    lastName: z.string().min(1).max(50).trim(),
    email: z.string().email().optional(),
    phone: z.string().max(30).trim().optional(),
    membershipTier: z.enum(['standard', 'gold', 'platinum']).optional(),
  }).optional(),
  roomTypeId: ObjectIdStr,
  roomId: ObjectIdStr.nullish(),
  checkInDate: z.coerce.date(),
  checkOutDate: z.coerce.date(),
  adults: z.number().int().min(1),
  children: z.number().int().min(0).default(0),
  specialRequests: z.array(specialRequestSchema).default([]),
  source: z.string().max(100).trim().default('direct'),
}).refine(
  (data) => data.guestId || data.newGuest,
  { message: 'Either guestId or newGuest is required', path: ['guestId'] },
).refine(
  (data) => data.checkOutDate > data.checkInDate,
  { message: 'checkOutDate must be after checkInDate', path: ['checkOutDate'] },
);

export const updateReservationSchema = z.object({
  roomTypeId: ObjectIdStr.optional(),
  roomId: ObjectIdStr.nullish(),
  checkInDate: z.coerce.date().optional(),
  checkOutDate: z.coerce.date().optional(),
  adults: z.number().int().min(1).optional(),
  children: z.number().int().min(0).optional(),
  specialRequests: z.array(specialRequestSchema).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' },
).refine(
  (data) => {
    if (data.checkInDate && data.checkOutDate) {
      return data.checkOutDate > data.checkInDate;
    }
    return true;
  },
  { message: 'checkOutDate must be after checkInDate', path: ['checkOutDate'] },
);

export type ReservationListQuery = z.infer<typeof reservationListQuerySchema>;
export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;
