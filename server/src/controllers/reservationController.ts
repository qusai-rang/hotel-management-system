import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as reservationService from '../services/reservationService';
import * as folioService from '../services/folioService';
import { reservationListQuerySchema, createReservationSchema, updateReservationSchema, addInternalNoteSchema } from '../validation/reservationSchemas';

function getUserId(req: Request): string {
  const user = (req as Request & { user?: { id: string } }).user;
  return user?.id ?? '';
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = reservationListQuerySchema.parse(req.query);
  const result = await reservationService.listReservations(query);
  res.json({ success: true, ...result });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const reservation = await reservationService.getReservationById(req.params.id);
  res.json({ success: true, item: reservation });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = createReservationSchema.parse(req.body);
  const userId = getUserId(req);
  const result = await reservationService.createReservation(data, userId);
  res.status(201).json({ success: true, item: result });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = updateReservationSchema.parse(req.body);
  const userId = getUserId(req);
  const result = await reservationService.updateReservation(req.params.id, data, userId);
  res.json({ success: true, item: result });
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const result = await reservationService.cancelReservation(req.params.id, userId);
  res.json({ success: true, item: result });
});

export const getFolio = asyncHandler(async (req: Request, res: Response) => {
  const folio = await folioService.getFolioByReservation(req.params.id);
  res.json({ success: true, item: folio });
});

export const checkIn = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const result = await reservationService.checkInReservation(req.params.id, userId);
  res.json({ success: true, item: result });
});

export const addNote = asyncHandler(async (req: Request, res: Response) => {
  const data = addInternalNoteSchema.parse(req.body);
  const userId = getUserId(req);
  const result = await reservationService.addInternalNote(req.params.id, data, userId);
  res.status(201).json({ success: true, item: result });
});
