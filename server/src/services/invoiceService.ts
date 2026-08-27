/* eslint-disable @typescript-eslint/no-explicit-any -- Mongoose lean/populate returns untyped shapes */
import mongoose from 'mongoose';
import { Invoice } from '../models/Invoice';
import { Folio } from '../models/Folio';
import { Hotel } from '../models/Hotel';
import { Guest } from '../models/Guest';
import { Counter } from '../models/Counter';
import { ActivityLog } from '../models/ActivityLog';
import { ApiError } from '../utils/ApiError';
import { serializeInvoice } from '../serializers/checkoutSerializer';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

async function getNextInvoiceNumber(session?: mongoose.ClientSession): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const counterKey = `invoice-${year}`;

  const counter = await Counter.findOneAndUpdate(
    { key: counterKey },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, session },
  );

  return `INV-${year}-${String(counter.seq).padStart(4, '0')}`;
}

async function getTotalPaid(folioId: mongoose.Types.ObjectId, session?: mongoose.ClientSession): Promise<number> {
  const pipeline: any[] = [
    { $match: { folioId, status: 'captured' } },
    { $group: { _id: null, total: { $sum: '$amountCents' } } },
  ];
  const result = session
    ? await mongoose.model('Payment').aggregate(pipeline).session(session)
    : await mongoose.model('Payment').aggregate(pipeline);
  return result[0]?.total ?? 0;
}

/* ------------------------------------------------------------------ */
/*  Generate invoice from folio                                        */
/* ------------------------------------------------------------------ */

export async function generateInvoice(
  folioId: string,
  actorId: string,
  session?: mongoose.ClientSession,
) {
  // Check if invoice already exists for this folio
  const existing = session
    ? await Invoice.findOne({ folioId: new mongoose.Types.ObjectId(folioId) }).session(session)
    : await Invoice.findOne({ folioId: new mongoose.Types.ObjectId(folioId) });
  if (existing) return existing;

  const folio = session
    ? await Folio.findById(folioId).session(session)
    : await Folio.findById(folioId);
  if (!folio) throw ApiError.notFound('Folio not found');

  const hotel = session
    ? await Hotel.findOne().session(session)
    : await Hotel.findOne();
  if (!hotel) throw ApiError.badRequest('Hotel configuration not found');

  const guest = folio.guestId
    ? (session
      ? await Guest.findById(folio.guestId).session(session)
      : await Guest.findById(folio.guestId))
    : null;

  // Compute totals from folio
  const subtotalCents = (folio.charges ?? []).reduce(
    (sum: number, c: any) => sum + c.quantity * c.unitAmountCents, 0,
  );
  const taxCents = Math.round(subtotalCents * (folio.taxRateBps / 10000));
  const discountTotalCents = (folio.discounts ?? []).reduce(
    (sum: number, d: any) => sum + d.amountCents, 0,
  );
  const totalCents = subtotalCents + taxCents - discountTotalCents;
  const paidCents = await getTotalPaid(folio._id, session);
  const balanceDueCents = totalCents - paidCents;

  // Invoice number
  const invoiceNumber = await getNextInvoiceNumber(session);

  // Dates
  const issueDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (hotel.policies?.dueDays ?? 14));

  // Status: paid when balance <= 0
  const status = balanceDueCents <= 0 ? 'paid' : 'issued';

  // Build invoice snapshot
  const [invoice] = await Invoice.create([{
    invoiceNumber,
    folioId: folio._id,
    guestId: guest?._id ?? null,
    hotelBlock: {
      name: hotel.name,
      addressLines: hotel.addressLines ?? [],
      email: hotel.contact?.email ?? null,
      phone: hotel.contact?.phone ?? null,
    },
    billTo: guest ? {
      name: `${guest.firstName} ${guest.lastName}`.trim(),
      addressLines: guest.address?.lines ?? [],
      email: guest.email ?? null,
    } : { name: '', addressLines: [], email: null },
    lineItems: (folio.charges ?? []).map((c: any) => ({
      description: c.description,
      subDescription: c.subDescription ?? null,
      quantity: c.quantity,
      unitAmountCents: c.unitAmountCents,
    })),
    subtotalCents,
    taxRateBps: folio.taxRateBps,
    taxCents,
    discountTotalCents,
    totalCents,
    amountPaidCents: paidCents,
    balanceDueCents,
    issueDate,
    dueDate,
    status,
  }], { session });

  // Activity log
  if (actorId) {
    const logEntry = {
      actorId: new mongoose.Types.ObjectId(actorId),
      entityType: 'invoice' as const,
      entityId: invoice._id,
      action: 'created',
      title: `Invoice ${invoiceNumber} generated`,
      description: `Total: $${(totalCents / 100).toFixed(2)} | Status: ${status}`,
      meta: { folioId, invoiceNumber, totalCents, status },
    };
    if (session) {
      await ActivityLog.create([logEntry], { session });
    } else {
      await ActivityLog.create([logEntry]);
    }
  }

  return invoice;
}

/* ------------------------------------------------------------------ */
/*  Get invoice by number                                              */
/* ------------------------------------------------------------------ */

export async function getInvoiceByNumber(invoiceNumber: string) {
  const invoice = await Invoice.findOne({ invoiceNumber })
    .populate('folioId')
    .populate('guestId');
  if (!invoice) throw ApiError.notFound('Invoice not found');
  return serializeInvoice(invoice);
}

/* ------------------------------------------------------------------ */
/*  List invoices                                                      */
/* ------------------------------------------------------------------ */

export async function listInvoices(page = 1, pageSize = 20) {
  const [docs, total] = await Promise.all([
    Invoice.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Invoice.countDocuments(),
  ]);

  return { items: docs.map(d => serializeInvoice(d)), total, page, pageSize };
}
