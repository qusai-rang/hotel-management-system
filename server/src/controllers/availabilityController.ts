import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as availabilityService from '../services/availabilityService';
import { availabilityQuerySchema } from '../validation/availabilitySchemas';

export const search = asyncHandler(async (req: Request, res: Response) => {
  const query = availabilityQuerySchema.parse(req.query);
  const results = await availabilityService.searchAvailability(query);
  res.json({ success: true, items: results });
});
