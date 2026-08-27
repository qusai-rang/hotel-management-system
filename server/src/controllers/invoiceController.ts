import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as invoiceService from '../services/invoiceService';
import { invoiceGenerateSchema, invoiceQuerySchema } from '../validation/checkoutSchemas';

export const getByNumber = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await invoiceService.getInvoiceByNumber(req.params.number);
  res.json({ success: true, item: invoice });
});

export const generate = asyncHandler(async (req: Request, res: Response) => {
  const data = invoiceGenerateSchema.parse(req.body);
  const invoice = await invoiceService.generateInvoice(data.folioId, req.user!.id);
  res.status(201).json({ success: true, item: invoice });
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = invoiceQuerySchema.parse(req.query);
  const result = await invoiceService.listInvoices(query.page, query.pageSize);
  res.json({ success: true, ...result });
});
