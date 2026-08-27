import { z } from 'zod';

const ObjectIdStr = z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid ObjectId');

export const availabilityQuerySchema = z.object({
  roomTypeId: ObjectIdStr.optional(),
  from: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  to: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  adults: z.coerce.number().int().min(1).default(1),
  children: z.coerce.number().int().min(0).default(0),
  floor: z.coerce.number().int().min(1).max(20).optional(),
}).refine(
  (data) => {
    const fromDate = new Date(data.from);
    const toDate = new Date(data.to);
    return !isNaN(fromDate.getTime()) && !isNaN(toDate.getTime()) && toDate > fromDate;
  },
  { message: 'to date must be after from date', path: ['to'] },
);

export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
