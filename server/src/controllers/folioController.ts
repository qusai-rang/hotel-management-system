import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as folioService from '../services/folioService';
import { chargeSchema, discountSchema } from '../validation/folioSchemas';
import { paymentCreateSchema, refundSchema } from '../validation/paymentSchemas';

function getUserId(req: Request): string {
  const user = (req as Request & { user?: { id: string } }).user;
  return user?.id ?? '';
}

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const folio = await folioService.getFolioById(req.params.id);
  res.json({ success: true, item: folio });
});

export const getByReservation = asyncHandler(async (req: Request, res: Response) => {
  const folio = await folioService.getFolioByReservation(req.params.id);
  res.json({ success: true, item: folio });
});

export const addCharge = asyncHandler(async (req: Request, res: Response) => {
  const data = chargeSchema.parse(req.body);
  const result = await folioService.addCharge(req.params.id, data, getUserId(req));
  res.json({ success: true, item: result });
});

export const addDiscount = asyncHandler(async (req: Request, res: Response) => {
  const data = discountSchema.parse(req.body);
  const result = await folioService.addDiscount(req.params.id, data, getUserId(req));
  res.json({ success: true, item: result });
});

export const addPayment = asyncHandler(async (req: Request, res: Response) => {
  const data = paymentCreateSchema.parse(req.body);
  const result = await folioService.addPayment(req.params.id, data, getUserId(req));
  res.status(201).json({ success: true, item: result });
});

export const refund = asyncHandler(async (req: Request, res: Response) => {
  const data = refundSchema.parse(req.body);
  const result = await folioService.refundPayment(req.params.id, req.params.paymentId, data, getUserId(req));
  res.json({ success: true, item: result });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { reservationId } = req.body;
  if (!reservationId) {
    res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'reservationId is required' } });
    return;
  }
  const result = await folioService.createFolio(reservationId, getUserId(req));
  res.status(201).json({ success: true, item: result });
});
