import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as roomTypeService from '../services/roomTypeService';
import { roomTypeCreateSchema, roomTypeUpdateSchema, roomTypeListQuerySchema } from '../validation/roomTypeSchemas';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = roomTypeListQuerySchema.parse(req.query);
  const result = await roomTypeService.listRoomTypes(query);
  res.json({ success: true, ...result });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const roomType = await roomTypeService.getRoomTypeById(req.params.id);
  res.json({ success: true, item: roomType });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = roomTypeCreateSchema.parse(req.body);
  const roomType = await roomTypeService.createRoomType(data);
  res.status(201).json({ success: true, item: roomType });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = roomTypeUpdateSchema.parse(req.body);
  const roomType = await roomTypeService.updateRoomType(req.params.id, data);
  res.json({ success: true, item: roomType });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const result = await roomTypeService.deleteRoomType(req.params.id);
  res.json({ success: true, ...result });
});
