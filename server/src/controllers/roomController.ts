import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as roomService from '../services/roomService';
import { roomCreateSchema, roomUpdateSchema, roomListQuerySchema } from '../validation/roomSchemas';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = roomListQuerySchema.parse(req.query);
  const result = await roomService.listRooms(query);
  res.json({ success: true, ...result });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const room = await roomService.getRoomById(req.params.id);
  res.json({ success: true, item: room });
});

export const getActivity = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 20;
  const result = await roomService.getRoomActivity(req.params.id, page, pageSize);
  res.json({ success: true, ...result });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = roomCreateSchema.parse(req.body);
  const room = await roomService.createRoom(data);
  res.status(201).json({ success: true, item: room });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = roomUpdateSchema.parse(req.body);
  const room = await roomService.updateRoom(req.params.id, data);
  res.json({ success: true, item: room });
});
