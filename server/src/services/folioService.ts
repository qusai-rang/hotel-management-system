/* eslint-disable @typescript-eslint/no-explicit-any -- Mongoose documents are untyped after .lean() */
import mongoose from 'mongoose';
import { Folio } from '../models/Folio';
import { Reservation } from '../models/Reservation';
import { Counter } from '../models/Counter';
import { Payment } from '../models/Payment';
import { ActivityLog } from '../models/ActivityLog';
import { ApiError } from '../utils/ApiError';
import { serializeFolio } from '../serializers/folioSerializer';
import { serializePayment } from '../serializers/paymentSerializer';
import type { ChargeInput, DiscountInput } from '../validation/folioSchemas';
import type { PaymentCreateInput, RefundInput } from '../validation/paymentSchemas';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

async function getFolioByReservationId(reservationId: string) {
  return Folio.findOne({ reservationId }).lean();
}

async function getTotalPaid(folioId: mongoose.Types.ObjectId): Promise<number> {
  const result = await Payment.aggregate([
    { $match: { folioId, status: 'captured' } },
    { $group: { _id: null, total: { $sum: '$amountCents' } } },
  ]);
  return result[0]?.total ?? 0;
}

/* ------------------------------------------------------------------ */
/*  Get folio                                                          */
/* ------------------------------------------------------------------ */

export async function getFolioById(folioId: string) {
  const doc = await Folio.findById(folioId).lean();
  if (!doc) throw ApiError.notFound('Folio not found');
  const paidCents = await getTotalPaid(doc._id);
  return serializeFolio(doc, paidCents);
}

export async function getFolioByReservation(reservationId: string) {
  const doc = await getFolioByReservationId(reservationId);
  if (!doc) throw ApiError.notFound('No folio found for this reservation');
  const paidCents = await getTotalPaid(doc._id);
  return serializeFolio(doc, paidCents);
}

/* ------------------------------------------------------------------ */
/*  Create folio (for checked-in reservation without one)              */
/* ------------------------------------------------------------------ */

export async function createFolio(reservationId: string, userId: string) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const reservation = await Reservation.findById(reservationId).session(session);
    if (!reservation) throw ApiError.notFound('Reservation not found');

    // Check if folio already exists
    const existing = await Folio.findOne({ reservationId: reservation._id }).session(session);
    if (existing) {
      await session.abortTransaction();
      session.endSession();
      return getFolioById(existing._id.toString());
    }

    const guestId = reservation.guestId;
    if (!guestId) throw ApiError.badRequest('Reservation has no guest');

    // Generate folio number
    const counter = await Counter.findOneAndUpdate(
      { key: 'folio' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, session },
    );
    const folioNumber = `#${counter.seq}`;

    const [folio] = await Folio.create([{
      folioNumber,
      reservationId: reservation._id,
      guestId,
      charges: [],
      discounts: [],
      taxRateBps: reservation.taxRateBps,
      status: 'open',
    }], { session });

    await ActivityLog.create([{
      actorId: new mongoose.Types.ObjectId(userId),
      entityType: 'folio',
      entityId: folio._id,
      action: 'created',
      title: `Folio ${folioNumber} created`,
      description: `Folio created for Reservation ${reservation.code}`,
      meta: { reservationId, guestId: guestId.toString() },
    }], { session });

    await session.commitTransaction();

    const doc = await Folio.findById(folio._id).lean();
    return serializeFolio(doc!, 0);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/* ------------------------------------------------------------------ */
/*  Add charge                                                         */
/* ------------------------------------------------------------------ */

export async function addCharge(folioId: string, data: ChargeInput, userId: string) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const folio = await Folio.findById(folioId).session(session);
    if (!folio) throw ApiError.notFound('Folio not found');
    if (folio.status === 'settled') {
      throw ApiError.conflict('Cannot add charges to a settled folio');
    }

    const charge = {
      description: data.description,
      department: data.department,
      quantity: data.quantity,
      unitAmountCents: data.unitAmountCents,
      postedAt: new Date(),
      postedBy: new mongoose.Types.ObjectId(userId),
    };

    await Folio.findByIdAndUpdate(folioId, {
      $push: { charges: charge },
    }, { session });

    await ActivityLog.create([{
      actorId: new mongoose.Types.ObjectId(userId),
      entityType: 'folio',
      entityId: folio._id,
      action: 'charge_added',
      title: `Charge added: ${data.description}`,
      description: `${data.quantity}× $${(data.unitAmountCents / 100).toFixed(2)} (${data.department})`,
      meta: { department: data.department, amountCents: data.quantity * data.unitAmountCents },
    }], { session });

    await session.commitTransaction();

    // Return updated folio
    const updated = await Folio.findById(folioId).lean();
    if (!updated) throw ApiError.notFound('Folio not found');
    const paidCents = await getTotalPaid(updated._id);
    return serializeFolio(updated, paidCents);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/* ------------------------------------------------------------------ */
/*  Add discount                                                       */
/* ------------------------------------------------------------------ */

export async function addDiscount(folioId: string, data: DiscountInput, userId: string) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const folio = await Folio.findById(folioId).session(session);
    if (!folio) throw ApiError.notFound('Folio not found');
    if (folio.status === 'settled') {
      throw ApiError.conflict('Cannot add discounts to a settled folio');
    }

    const discount = {
      label: data.label,
      amountCents: data.amountCents,
    };

    await Folio.findByIdAndUpdate(folioId, {
      $push: { discounts: discount },
    }, { session });

    await ActivityLog.create([{
      actorId: new mongoose.Types.ObjectId(userId),
      entityType: 'folio',
      entityId: folio._id,
      action: 'discount_added',
      title: `Discount applied: ${data.label}`,
      description: `-$${(data.amountCents / 100).toFixed(2)}`,
      meta: { amountCents: data.amountCents },
    }], { session });

    await session.commitTransaction();

    const updated = await Folio.findById(folioId).lean();
    if (!updated) throw ApiError.notFound('Folio not found');
    const paidCents = await getTotalPaid(updated._id);
    return serializeFolio(updated, paidCents);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/* ------------------------------------------------------------------ */
/*  Add payment (simulated capture)                                    */
/* ------------------------------------------------------------------ */

export async function addPayment(folioId: string, data: PaymentCreateInput, userId: string) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const folio = await Folio.findById(folioId).session(session);
    if (!folio) throw ApiError.notFound('Folio not found');
    if (folio.status === 'settled') {
      throw ApiError.conflict('Cannot add payments to a settled folio');
    }

    if (data.method === 'card' && !data.cardLast4) {
      throw ApiError.badRequest('cardLast4 is required for card payments');
    }

    // Check for idempotency key to prevent duplicate payments
    if (data.idempotencyKey) {
      const existingPayment = await Payment.findOne({
        folioId: folio._id,
        idempotencyKey: data.idempotencyKey,
      }).session(session);

      if (existingPayment) {
        await session.abortTransaction();
        session.endSession();
        // Return existing payment (idempotent behavior)
        return serializePayment(existingPayment);
      }
    }

    // Create payment (simulated capture)
    const [payment] = await Payment.create([{
      folioId: folio._id,
      amountCents: data.amountCents,
      method: data.method,
      cardBrand: data.cardBrand,
      cardLast4: data.cardLast4,
      gatewayRef: data.gatewayRef,
      idempotencyKey: data.idempotencyKey,
      status: 'captured',
      processedBy: new mongoose.Types.ObjectId(userId),
    }], { session });

    await ActivityLog.create([{
      actorId: new mongoose.Types.ObjectId(userId),
      entityType: 'payment',
      entityId: payment._id,
      action: 'captured',
      title: `Payment captured: $${(data.amountCents / 100).toFixed(2)}`,
      description: `${data.method} payment recorded`,
      meta: { folioId: folioId, method: data.method, amountCents: data.amountCents },
    }], { session });

    // Check if folio should be settled
    // Calculate total from existing payments in DB (already committed) + this new payment
    const existingPaidResult = await Payment.aggregate([
      { $match: { folioId: folio._id, status: 'captured', _id: { $ne: payment._id } } },
      { $group: { _id: null, total: { $sum: '$amountCents' } } },
    ]).session(session);
    const existingPaid = existingPaidResult[0]?.total ?? 0;
    const paidCents = existingPaid + data.amountCents;

    const subtotalCents = (folio.charges ?? []).reduce(
      (sum: number, c: any) => sum + c.quantity * c.unitAmountCents, 0,
    );
    const taxCents = Math.round(subtotalCents * (folio.taxRateBps / 10000));
    const discountTotalCents = (folio.discounts ?? []).reduce(
      (sum: number, d: any) => sum + d.amountCents, 0,
    );
    const totalCents = subtotalCents + taxCents - discountTotalCents;
    const balanceCents = totalCents - paidCents;

    if (balanceCents <= 0 && folio.status === 'open') {
      await Folio.findByIdAndUpdate(folioId, { $set: { status: 'settled' } }, { session });
    }

    await session.commitTransaction();

    return serializePayment(payment);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/* ------------------------------------------------------------------ */
/*  Refund                                                             */
/* ------------------------------------------------------------------ */

export async function refundPayment(folioId: string, paymentId: string, data: RefundInput, userId: string) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const folio = await Folio.findById(folioId).session(session);
    if (!folio) throw ApiError.notFound('Folio not found');

    const originalPayment = await Payment.findOne({
      _id: paymentId, folioId: folio._id, status: 'captured',
    }).session(session);
    if (!originalPayment) {
      throw ApiError.notFound('Payment not found or not eligible for refund');
    }

    if (data.amountCents > originalPayment.amountCents) {
      throw ApiError.badRequest('Refund amount cannot exceed original payment');
    }

    // Create negative refund payment record
    const [refund] = await Payment.create([{
      folioId: folio._id,
      amountCents: -data.amountCents,
      method: originalPayment.method,
      cardBrand: originalPayment.cardBrand,
      cardLast4: originalPayment.cardLast4,
      gatewayRef: `refund-${originalPayment.gatewayRef ?? paymentId}`,
      status: 'captured',
      processedBy: new mongoose.Types.ObjectId(userId),
    }], { session });

    // Mark original as refunded if fully refunded
    if (data.amountCents >= originalPayment.amountCents) {
      await Payment.findByIdAndUpdate(paymentId, { $set: { status: 'refunded' } }, { session });
    }

    await ActivityLog.create([{
      actorId: new mongoose.Types.ObjectId(userId),
      entityType: 'payment',
      entityId: refund._id,
      action: 'refunded',
      title: `Refund processed: -$${(data.amountCents / 100).toFixed(2)}`,
      description: data.reason ?? 'Refund',
      meta: { originalPaymentId: paymentId, amountCents: data.amountCents, reason: data.reason },
    }], { session });

    await session.commitTransaction();

    return serializePayment(refund);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
