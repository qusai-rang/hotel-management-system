import { z } from 'zod';

const ObjectIdStr = z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid ObjectId');

function todayMidnightUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export const availabilityQuerySchema = z.object({
  roomTypeId: ObjectIdStr.optional(),
  from: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  to: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  adults: z.coerce.number().int().min(1).default(1),
  children: z.coerce.number().int().min(0).max(10).default(0),
  floor: z.coerce.number().int().min(1).max(20).optional(),
}).refine(
  (data) => {
    const fromDate = new Date(data.from);
    const toDate = new Date(data.to);
    return !isNaN(fromDate.getTime()) && !isNaN(toDate.getTime()) && toDate > fromDate;
  },
  { message: 'to date must be after from date', path: ['to'] },
).refine(
  (data) => new Date(data.from) >= todayMidnightUTC(),
  { message: 'from date cannot be in the past', path: ['from'] },
).refine(
  (data) => {
    const diffMs = new Date(data.to).getTime() - new Date(data.from).getTime();
    const nights = Math.round(diffMs / 86400000);
    return nights <= 90;
  },
  { message: 'Stay cannot exceed 90 nights', path: ['to'] },
);

export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
