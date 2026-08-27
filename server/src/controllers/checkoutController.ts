import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as checkoutService from '../services/checkoutService';
import { checkoutPaymentSchema } from '../validation/checkoutSchemas';

export const getSession = asyncHandler(async (req: Request, res: Response) => {
  const session = await checkoutService.getCheckoutSession(req.params.reservationId);
  res.json({ success: true, item: session });
});

export const collectPayment = asyncHandler(async (req: Request, res: Response) => {
  const data = checkoutPaymentSchema.parse(req.body);
  const session = await checkoutService.collectCheckoutPayment(req.params.reservationId, data, req.user!.id);
  res.json({ success: true, item: session });
});

export const complete = asyncHandler(async (req: Request, res: Response) => {
  const result = await checkoutService.completeCheckout(req.params.reservationId, req.user!.id);
  res.json({ success: true, item: result });
});
