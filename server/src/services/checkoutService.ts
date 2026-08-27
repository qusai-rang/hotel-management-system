/* eslint-disable @typescript-eslint/no-explicit-any -- Mongoose lean/populate returns untyped shapes */
import mongoose from 'mongoose';
import { Reservation } from '../models/Reservation';
import { Room } from '../models/Room';
import { Folio } from '../models/Folio';
import { Payment } from '../models/Payment';
import { Invoice } from '../models/Invoice';
import { ActivityLog } from '../models/ActivityLog';
import { ApiError } from '../utils/ApiError';
import { serializeCheckoutSession, serializeCheckoutCompletion } from '../serializers/checkoutSerializer';
import type { CheckoutPaymentInput } from '../validation/checkoutSchemas';
import { createCheckoutHousekeepingTask } from './housekeepingService';
import { generateInvoice } from './invoiceService';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

async function getTotalPaid(folioId: mongoose.Types.ObjectId, session?: mongoose.ClientSession): Promise<number> {
  const pipeline: any[] = [
    { $match: { folioId, status: 'captured' } },
    { $group: { _id: null, total: { $sum: '$amountCents' } } },
  ];
  const result = session
    ? await Payment.aggregate(pipeline).session(session)
    : await Payment.aggregate(pipeline);
  return result[0]?.total ?? 0;
}

function computeFolioTotals(folio: any, paidCents: number) {
  const subtotalCents = (folio.charges ?? []).reduce(
    (sum: number, c: any) => sum + c.quantity * c.unitAmountCents, 0,
  );
  const taxCents = Math.round(subtotalCents * (folio.taxRateBps / 10000));
  const discountTotalCents = (folio.discounts ?? []).reduce(
    (sum: number, d: any) => sum + d.amountCents, 0,
  );
  const totalCents = subtotalCents + taxCents - discountTotalCents;
  const balanceCents = totalCents - paidCents;
  return { subtotalCents, taxCents, discountTotalCents, totalCents, balanceCents };
}

/* ------------------------------------------------------------------ */
/*  GET checkout session                                               */
/* ------------------------------------------------------------------ */

export async function getCheckoutSession(reservationId: string) {
  const reservation = await Reservation.findById(reservationId)
    .populate('guestId')
    .populate('roomId')
    .populate('roomTypeId');

  if (!reservation) throw ApiError.notFound('Reservation not found');

  const resObj = reservation.toObject();
  const room = resObj.roomId;
  const roomType = resObj.roomTypeId;
  const guest = resObj.guestId;

  // Must have a room assigned
  if (!room) {
    throw ApiError.conflict('Reservation has no room assigned — cannot checkout');
  }

  // Must be checked_in
  if (resObj.status !== 'checked_in') {
    throw ApiError.conflict(`Cannot checkout reservation in "${resObj.status}" status`);
  }

  // Must have a folio
  const folioDoc = await Folio.findOne({ reservationId: reservation._id }).lean();
  if (!folioDoc) {
    throw ApiError.notFound('No folio found for this reservation — cannot checkout');
  }

  const paidCents = await getTotalPaid(folioDoc._id);
  const payments = await Payment.find({ folioId: folioDoc._id }).sort({ createdAt: -1 }).lean();

  return serializeCheckoutSession(reservation, guest, room, roomType, folioDoc, paidCents, payments);
}

/* ------------------------------------------------------------------ */
/*  POST checkout payment                                              */
/* ------------------------------------------------------------------ */

export async function collectCheckoutPayment(
  reservationId: string,
  data: CheckoutPaymentInput,
  userId: string,
) {
  // Verify reservation is checkout-eligible
  const reservation = await Reservation.findById(reservationId);
  if (!reservation) throw ApiError.notFound('Reservation not found');
  if (reservation.status !== 'checked_in') {
    throw ApiError.conflict(`Cannot collect payment for reservation in "${reservation.status}" status`);
  }

  const folio = await Folio.findOne({ reservationId: reservation._id });
  if (!folio) throw ApiError.notFound('No folio found for this reservation');
  if (folio.status === 'settled') {
    throw ApiError.conflict('Folio is already settled — no further payments accepted');
  }

  if (data.method === 'card' && !data.cardLast4) {
    throw ApiError.badRequest('cardLast4 is required for card payments');
  }

  // Create payment
  const [payment] = await Payment.create([{
    folioId: folio._id,
    amountCents: data.amountCents,
    method: data.method,
    cardBrand: data.cardBrand,
    cardLast4: data.cardLast4,
    gatewayRef: data.gatewayRef,
    status: 'captured',
    processedBy: new mongoose.Types.ObjectId(userId),
  }]);

  await ActivityLog.create([{
    actorId: new mongoose.Types.ObjectId(userId),
    entityType: 'payment',
    entityId: payment._id,
    action: 'captured',
    title: `Checkout payment captured: $${(data.amountCents / 100).toFixed(2)}`,
    description: `${data.method} payment recorded at checkout`,
    meta: { reservationId, folioId: folio._id.toString(), method: data.method, amountCents: data.amountCents },
  }]);

  // Return updated session
  return getCheckoutSession(reservationId);
}

/* ------------------------------------------------------------------ */
/*  POST checkout complete                                             */
/* ------------------------------------------------------------------ */

export async function completeCheckout(reservationId: string, actorId: string) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Load reservation
    const reservation = await Reservation.findById(reservationId).session(session);
    if (!reservation) throw ApiError.notFound('Reservation not found');

    // 2. Verify status = checked_in
    if (reservation.status === 'checked_out') {
      // Idempotent: return existing result
      await session.abortTransaction();
      session.endSession();
      return getAlreadyCompletedResult(reservationId);
    }
    if (reservation.status !== 'checked_in') {
      throw ApiError.conflict(`Cannot checkout reservation in "${reservation.status}" status`);
    }

    // 3. Verify room assignment
    if (!reservation.roomId) {
      throw ApiError.conflict('Reservation has no room assigned — cannot checkout');
    }

    // 4. Load folio
    const folio = await Folio.findOne({ reservationId: reservation._id }).session(session);
    if (!folio) throw ApiError.notFound('No folio found for this reservation');

    // 5. Recalculate final totals
    const paidCents = await getTotalPaid(folio._id, session);
    const totals = computeFolioTotals(folio, paidCents);

    // 6. Verify balance <= 0
    if (totals.balanceCents > 0) {
      throw ApiError.conflict(
        `Outstanding balance of $${(totals.balanceCents / 100).toFixed(2)} must be settled before checkout`,
      );
    }

    // 7. Generate invoice
    const invoice = await generateInvoice(folio._id.toString(), actorId, session);

    // 8. Set reservation.status = checked_out + checkedOutAt
    await Reservation.findByIdAndUpdate(reservationId, {
      $set: { status: 'checked_out', checkedOutAt: new Date() },
    }, { session });

    // 9. Update room: occupancyStatus = vacant, currentReservationId = null
    const room = await Room.findById(reservation.roomId).session(session);
    await Room.findByIdAndUpdate(reservation.roomId, {
      $set: {
        occupancyStatus: 'vacant',
        currentReservationId: null,
        housekeepingStatus: 'dirty',
      },
    }, { session });

    // 10. Create checkout housekeeping task (reuses existing hook)
    await createCheckoutHousekeepingTask(reservation.roomId.toString(), actorId, session);

    // 11. Set folio.status = settled
    await Folio.findByIdAndUpdate(folio._id, { $set: { status: 'settled' } }, { session });

    // 12. Activity logs
    await ActivityLog.create([{
      actorId: new mongoose.Types.ObjectId(actorId),
      entityType: 'reservation',
      entityId: reservation._id,
      action: 'checked_out',
      title: `Reservation ${reservation.code} checked out`,
      description: `Guest checked out. Invoice ${invoice.invoiceNumber} generated.`,
      meta: {
        reservationCode: reservation.code,
        invoiceNumber: invoice.invoiceNumber,
        totalCents: totals.totalCents,
        paidCents,
      },
    }], { session });

    await ActivityLog.create([{
      actorId: new mongoose.Types.ObjectId(actorId),
      entityType: 'room',
      entityId: reservation.roomId,
      action: 'occupancy_changed',
      title: `Room ${room?.number ?? ''} → vacant`,
      description: `Guest checked out. Room available for housekeeping.`,
      meta: { from: 'occupied', to: 'vacant', trigger: 'checkout' },
    }], { session });

    // 13. Commit
    await session.commitTransaction();

    return serializeCheckoutCompletion({
      reservationCode: reservation.code,
      status: 'checked_out',
      checkedOutAt: new Date().toISOString(),
      invoiceNumber: invoice.invoiceNumber,
      folioStatus: 'settled',
      roomNumber: room?.number ?? null,
      roomStatus: 'dirty',
    });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/* ------------------------------------------------------------------ */
/*  Idempotent result for already-checked-out                          */
/* ------------------------------------------------------------------ */

async function getAlreadyCompletedResult(reservationId: string) {
  const reservation = await Reservation.findById(reservationId).lean();
  if (!reservation) throw ApiError.notFound('Reservation not found');

  const folio = await Folio.findOne({ reservationId: reservation._id }).lean();
  const invoice = folio ? await Invoice.findOne({ folioId: folio._id }).lean() : null;
  const room = reservation.roomId ? await Room.findById(reservation.roomId).lean() : null;

  return serializeCheckoutCompletion({
    reservationCode: reservation.code,
    status: reservation.status,
    checkedOutAt: reservation.checkedOutAt?.toISOString?.() ?? '',
    invoiceNumber: invoice?.invoiceNumber ?? null,
    folioStatus: folio?.status ?? 'unknown',
    roomNumber: room?.number ?? null,
    roomStatus: room?.housekeepingStatus ?? null,
  });
}
