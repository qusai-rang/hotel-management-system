import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as billingService from '../services/billingService';
import { billingTransactionQuerySchema } from '../validation/billingSchemas';

export const listTransactions = asyncHandler(async (req: Request, res: Response) => {
  const query = billingTransactionQuerySchema.parse(req.query);
  const result = await billingService.listTransactions(query);
  res.json({ success: true, ...result });
});

export const getMetrics = asyncHandler(async (_req: Request, res: Response) => {
  const metrics = await billingService.getBillingMetrics();
  res.json({ success: true, item: metrics });
});
