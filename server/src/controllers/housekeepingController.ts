import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as housekeepingService from '../services/housekeepingService';
import { housekeepingTaskCreateSchema, housekeepingTaskUpdateSchema, housekeepingTaskQuerySchema, staffScheduleQuerySchema } from '../validation/housekeepingSchemas';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = housekeepingTaskQuerySchema.parse(req.query);
  const result = await housekeepingService.listTasks(query);
  res.json({ success: true, ...result });
});

export const getForRoom = asyncHandler(async (req: Request, res: Response) => {
  const tasks = await housekeepingService.getTasksForRoom(req.params.roomId);
  res.json({ success: true, items: tasks });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = housekeepingTaskCreateSchema.parse(req.body);
  const task = await housekeepingService.createTask(data, req.user!.id);
  res.status(201).json({ success: true, item: task });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = housekeepingTaskUpdateSchema.parse(req.body);
  const task = await housekeepingService.updateTask(req.params.id, data, req.user!.id);
  res.json({ success: true, item: task });
});

export const stats = asyncHandler(async (_req: Request, res: Response) => {
  const result = await housekeepingService.getStats();
  res.json({ success: true, item: result });
});

export const staffSchedule = asyncHandler(async (req: Request, res: Response) => {
  const query = staffScheduleQuerySchema.parse(req.query);
  const result = await housekeepingService.getStaffSchedule(query.floor);
  res.json({ success: true, items: result });
});
