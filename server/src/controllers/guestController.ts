import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as guestService from '../services/guestService';
import { guestCreateSchema, guestUpdateSchema, guestListQuerySchema } from '../validation/guestSchemas';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = guestListQuerySchema.parse(req.query);
  const result = await guestService.listGuests(query);
  res.json({ success: true, ...result });
});

export const getBySlug = asyncHandler(async (req: Request, res: Response) => {
  const guest = await guestService.getGuestBySlug(req.params.slug);
  res.json({ success: true, item: guest });
});

export const getStays = asyncHandler(async (req: Request, res: Response) => {
  const query = {
    page: Number(req.query.page) || 1,
    pageSize: Number(req.query.pageSize) || 20,
    status: req.query.status as string | undefined,
  };
  const result = await guestService.getGuestStays(req.params.slug, query);
  res.json({ success: true, ...result });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = guestCreateSchema.parse(req.body);
  const guest = await guestService.createGuest(data);
  res.status(201).json({ success: true, item: guest });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = guestUpdateSchema.parse(req.body);
  const guest = await guestService.updateGuest(req.params.slug, data);
  res.json({ success: true, item: guest });
});
