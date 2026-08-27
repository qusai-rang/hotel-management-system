import { z } from 'zod';
import { HK_CONTEXTS, HK_TASK_TYPES, HK_TASK_STATUSES } from '../models/enums';

const ObjectIdStr = z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid ObjectId');

export const housekeepingTaskCreateSchema = z.object({
  roomId: ObjectIdStr,
  context: z.enum(HK_CONTEXTS),
  type: z.enum(HK_TASK_TYPES),
  status: z.enum(HK_TASK_STATUSES).default('dirty'),
  assigneeId: ObjectIdStr.nullish(),
  progressPercent: z.number().int().min(0).max(100).default(0),
  estimateCompletionAt: z.coerce.date().nullish(),
  ticket: z.object({
    title: z.string().max(200).trim(),
    reportedAt: z.coerce.date().optional(),
    assignedTeamLabel: z.string().max(100).trim().optional(),
    estimatedFixAt: z.coerce.date().optional(),
  }).optional(),
});

export const housekeepingTaskUpdateSchema = z.object({
  assigneeId: ObjectIdStr.nullish(),
  status: z.enum(HK_TASK_STATUSES).optional(),
  progressPercent: z.number().int().min(0).max(100).optional(),
  estimateCompletionAt: z.coerce.date().nullish(),
  ticket: z.object({
    title: z.string().max(200).trim().optional(),
    reportedAt: z.coerce.date().optional(),
    assignedTeamLabel: z.string().max(100).trim().optional(),
    estimatedFixAt: z.coerce.date().optional(),
  }).optional(),
}).refine(data => Object.keys(data).length > 0, { message: 'At least one field is required' });

export const housekeepingTaskQuerySchema = z.object({
  status: z.enum(HK_TASK_STATUSES).optional(),
  context: z.enum(HK_CONTEXTS).optional(),
  assigneeId: ObjectIdStr.optional(),
  roomId: ObjectIdStr.optional(),
  floor: z.coerce.number().int().min(1).optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const staffScheduleQuerySchema = z.object({
  floor: z.coerce.number().int().min(1).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type HousekeepingTaskCreateInput = z.infer<typeof housekeepingTaskCreateSchema>;
export type HousekeepingTaskUpdateInput = z.infer<typeof housekeepingTaskUpdateSchema>;
export type HousekeepingTaskQuery = z.infer<typeof housekeepingTaskQuerySchema>;
export type StaffScheduleQuery = z.infer<typeof staffScheduleQuerySchema>;
