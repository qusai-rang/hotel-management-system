import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as dashboardService from '../services/dashboardService';

export const summary = asyncHandler(async (_req: Request, res: Response) => {
  const result = await dashboardService.getDashboardSummary();
  res.json({ success: true, item: result });
});
