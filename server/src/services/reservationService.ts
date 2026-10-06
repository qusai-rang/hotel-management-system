/* eslint-disable @typescript-eslint/no-explicit-any -- Mongoose lean/populate returns untyped shapes */
import mongoose from 'mongoose';
import { Reservation } from '../models/Reservation';
import { Room } from '../models/Room';
import { RoomType } from '../models/RoomType';
import { Guest } from '../models/Guest';
import { Counter } from '../models/Counter';
import { ActivityLog } from '../models/ActivityLog';
import { Folio } from '../models/Folio';
import { Payment } from '../models/Payment';
import { Hotel } from '../models/Hotel';
import { ApiError } from '../utils/ApiError';
import type { ReservationListQuery, CreateReservationInput, UpdateReservationInput, AddInternalNoteInput } from '../validation/reservationSchemas';
import { serializeReservationListItem, serializeReservationDetail } from '../serializers/reservationSerializer';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ACTIVE_RESERVATION_STATUSES = ['pending', 'confirmed', 'checked_in'];
const DEPOSIT_RATIO = 0.5;

let cachedTaxRateBps: number | null = null;

async function getTaxRateBps(session?: mongoose.ClientSession): Promise<number> {
  if (cachedTaxRateBps !== null) return cachedTaxRateBps;
  const hotel = await Hotel.findOne().select('policies.taxRateBps').session(session ?? null).lean();
  cachedTaxRateBps = hotel?.policies?.taxRateBps ?? 1200;
  return cachedTaxRateBps;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function nightsBetween(checkIn: Date, checkOut: Date): number {
  return Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000);
}

function normalizeToMidnight(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function nextReservationCode(session: mongoose.ClientSession): Promise<string> {
  const counter = await Counter.findOneAndUpdate(
    { key: 'reservation' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, session },
  );
  return `RES-${String(counter.seq).padStart(5, '0')}`;
}

async function checkOverlap(
  roomId: mongoose.Types.ObjectId,
  checkInDate: Date,
  checkOutDate: Date,
  excludeReservationId?: mongoose.Types.ObjectId,
  session?: mongoose.ClientSession,
): Promise<boolean> {
  const filter: any = {
    roomId,
    status: { $in: ACTIVE_RESERVATION_STATUSES },
    checkInDate: { $lt: checkOutDate },
    checkOutDate: { $gt: checkInDate },
  };
  if (excludeReservationId) {
    filter._id = { $ne: excludeReservationId };
  }
  const count = await Reservation.countDocuments(filter).session(session ?? null);
  return count > 0;
}

/* ------------------------------------------------------------------ */
/*  List                                                               */
/* ------------------------------------------------------------------ */

export async function listReservations(query: ReservationListQuery) {
  const { q, status, roomTypeId, from, to, page, pageSize } = query;

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (roomTypeId) filter.roomTypeId = new mongoose.Types.ObjectId(roomTypeId);
  if (from) filter.checkOutDate = { $gt: normalizeToMidnight(new Date(from)) };
  if (to) filter.checkInDate = { $lt: normalizeToMidnight(new Date(to)) };

  if (q) {
    // Search by code or guest name
    const guestMatches = await Guest.find({
      $or: [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
      ],
    }).distinct('_id');

    filter.$or = [
      { code: { $regex: q, $options: 'i' } },
      { guestId: { $in: guestMatches } },
    ];
  }

  const [docs, total] = await Promise.all([
    Reservation.find(filter)
      .populate('guestId', 'firstName lastName email phone')
      .populate('roomTypeId', 'code name')
      .populate('roomId', 'number')
      .sort({ checkInDate: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Reservation.countDocuments(filter),
  ]);

  const items = docs.map(d => serializeReservationListItem(d));
  return { items, total, page, pageSize };
}

/* ------------------------------------------------------------------ */
/*  Detail                                                             */
/* ------------------------------------------------------------------ */

export async function getReservationById(id: string) {
  const doc = await Reservation.findById(id)
    .populate('guestId', 'firstName lastName email phone slug membershipTier')
    .populate('roomTypeId', 'code name bedLabel amenities')
    .populate('roomId', 'number floor bedsLabel')
    .lean();
  if (!doc) throw ApiError.notFound('Reservation not found');

  // Derive amount paid from actual folio/payment data
  let amountPaidCents = 0;
  const folio = await Folio.findOne({ reservationId: doc._id }).lean();
  if (folio) {
    const paidResult = await Payment.aggregate([
      { $match: { folioId: folio._id, status: 'captured' } },
      { $group: { _id: null, total: { $sum: '$amountCents' } } },
    ]);
    amountPaidCents = paidResult[0]?.total ?? 0;
  }

  return serializeReservationDetail(doc, amountPaidCents);
}

/* ------------------------------------------------------------------ */
/*  Create                                                             */
/* ------------------------------------------------------------------ */

export async function createReservation(data: CreateReservationInput, userId: string) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const taxRateBps = await getTaxRateBps(session);

    // 1. Validate guest
    let guestId: mongoose.Types.ObjectId;
    if (data.guestId) {
      const guest = await Guest.findById(data.guestId).session(session);
      if (!guest) throw ApiError.badRequest('Invalid guestId');
      guestId = guest._id;
    } else if (data.newGuest) {
      const slug = `${data.newGuest.firstName} ${data.newGuest.lastName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const existingSlug = await Guest.findOne({ slug }).session(session);
      if (existingSlug) throw ApiError.conflict(`A guest with name "${data.newGuest.firstName} ${data.newGuest.lastName}" already exists`);
      if (data.newGuest.email) {
        const existingEmail = await Guest.findOne({ email: data.newGuest.email }).session(session);
        if (existingEmail) throw ApiError.conflict(`Email "${data.newGuest.email}" is already in use`);
      }
      const [newGuest] = await Guest.create([{
        firstName: data.newGuest.firstName,
        lastName: data.newGuest.lastName,
        email: data.newGuest.email,
        phone: data.newGuest.phone,
        membershipTier: data.newGuest.membershipTier ?? 'standard',
        slug,
      }], { session });
      guestId = newGuest._id;
    } else {
      throw ApiError.badRequest('Either guestId or newGuest is required');
    }

    // 2. Validate room type
    const roomType = await RoomType.findById(data.roomTypeId).session(session);
    if (!roomType) throw ApiError.badRequest('Invalid roomTypeId');

    const checkInDate = normalizeToMidnight(new Date(data.checkInDate));
    const checkOutDate = normalizeToMidnight(new Date(data.checkOutDate));
    const nights = nightsBetween(checkInDate, checkOutDate);

    // Validate dates (service-layer backup for schema validation)
    const today = normalizeToMidnight(new Date());
    if (checkInDate < today) {
      throw ApiError.badRequest('checkInDate cannot be in the past');
    }
    if (checkOutDate <= checkInDate) {
      throw ApiError.badRequest('checkOutDate must be after checkInDate');
    }
    if (nights > 90) {
      throw ApiError.badRequest('Stay cannot exceed 90 nights');
    }

    // 3. Determine rate
    let ratePerNightCents = roomType.basePricePerNightCents;
    let roomId: mongoose.Types.ObjectId | null = null;

    if (data.roomId) {
      // Verify room exists and matches type
      const room = await Room.findById(data.roomId).session(session);
      if (!room) throw ApiError.badRequest('Invalid roomId');
      if (room.roomTypeId.toString() !== data.roomTypeId) {
        throw ApiError.badRequest('Room does not belong to the specified room type');
      }

      // Check availability within transaction
      const hasOverlap = await checkOverlap(room._id, checkInDate, checkOutDate, undefined, session);
      if (hasOverlap) {
        throw ApiError.conflict('Room is not available for the selected dates');
      }

      roomId = room._id;
      ratePerNightCents = room.rateOverrideCents ?? roomType.basePricePerNightCents;
    }

    // 4. Calculate financials
    const subtotalCents = ratePerNightCents * nights;
    const taxCents = Math.round(subtotalCents * (taxRateBps / 10000));
    const totalCents = subtotalCents + taxCents;
    const depositCents = Math.round(totalCents * DEPOSIT_RATIO);

    // 5. Generate reservation code
    const code = await nextReservationCode(session);

    // 6. Create reservation
    const [reservation] = await Reservation.create([{
      code,
      guestId,
      roomTypeId: new mongoose.Types.ObjectId(data.roomTypeId),
      roomId: roomId,
      status: roomId ? 'confirmed' : 'pending',
      checkInDate,
      checkOutDate,
      adults: data.adults,
      children: data.children,
      specialRequests: data.specialRequests ?? [],
      ratePerNightCents,
      taxRateBps,
      depositCents,
      source: data.source ?? 'direct',
      createdBy: new mongoose.Types.ObjectId(userId),
    }], { session });

    // 7. Activity log — room.currentReservationId is NOT set here.
    //    It is set only at check-in time when the room becomes occupied.
    await ActivityLog.create([{
      actorId: new mongoose.Types.ObjectId(userId),
      entityType: 'reservation',
      entityId: reservation._id,
      action: 'created',
      title: `Reservation ${code} created`,
      description: `New reservation for ${nights} night(s) at $${ratePerNightCents / 100}/night`,
      meta: {
        guestId: guestId.toString(),
        roomId: roomId?.toString(),
        roomTypeCode: roomType.code,
        checkInDate: checkInDate.toISOString(),
        checkOutDate: checkOutDate.toISOString(),
        totalCents,
        depositCents,
      },
    }], { session });

    await session.commitTransaction();
    return { id: reservation._id.toString(), code, status: reservation.status };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/* ------------------------------------------------------------------ */
/*  Update                                                             */
/* ------------------------------------------------------------------ */

export async function updateReservation(id: string, data: UpdateReservationInput, userId: string) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const taxRateBps = await getTaxRateBps(session);

    const existing = await Reservation.findById(id).session(session);
    if (!existing) throw ApiError.notFound('Reservation not found');

    if (existing.status === 'cancelled' || existing.status === 'checked_out') {
      throw ApiError.badRequest(`Cannot update a ${existing.status} reservation`);
    }

    const updateData: any = {};

    // Handle date changes
    const newCheckIn = data.checkInDate ? normalizeToMidnight(new Date(data.checkInDate)) : existing.checkInDate;
    const newCheckOut = data.checkOutDate ? normalizeToMidnight(new Date(data.checkOutDate)) : existing.checkOutDate;

    // Validate dates (service-layer backup for schema validation)
    const today = normalizeToMidnight(new Date());
    if (data.checkInDate && newCheckIn < today) {
      throw ApiError.badRequest('checkInDate cannot be in the past');
    }
    if (newCheckOut <= newCheckIn) {
      throw ApiError.badRequest('checkOutDate must be after checkInDate');
    }
    const nights = nightsBetween(newCheckIn, newCheckOut);
    if (nights > 90) {
      throw ApiError.badRequest('Stay cannot exceed 90 nights');
    }

    if (data.checkInDate) updateData.checkInDate = newCheckIn;
    if (data.checkOutDate) updateData.checkOutDate = newCheckOut;

    // Handle room reassignment
    let newRoomId = existing.roomId;
    if (data.roomId !== undefined) {
      if (data.roomId === null) {
        // Unassign room
        newRoomId = null;
        updateData.roomId = null;
      } else {
        const room = await Room.findById(data.roomId).session(session);
        if (!room) throw ApiError.badRequest('Invalid roomId');

        const targetRoomTypeId = data.roomTypeId ?? existing.roomTypeId.toString();
        if (room.roomTypeId.toString() !== targetRoomTypeId) {
          throw ApiError.badRequest('Room does not belong to the specified room type');
        }

        // Check availability (exclude this reservation)
        const hasOverlap = await checkOverlap(room._id, newCheckIn, newCheckOut, existing._id, session);
        if (hasOverlap) {
          throw ApiError.conflict('Room is not available for the selected dates');
        }

        newRoomId = room._id;
        updateData.roomId = room._id;
      }
    } else if (data.roomTypeId && data.roomTypeId !== existing.roomTypeId.toString()) {
      // Room type changed — if currently assigned to a room of old type, unassign
      if (existing.roomId) {
        const currentRoom = await Room.findById(existing.roomId).session(session);
        if (currentRoom && currentRoom.roomTypeId.toString() !== data.roomTypeId) {
          updateData.roomId = null;
          newRoomId = null;
        }
      }
      updateData.roomTypeId = new mongoose.Types.ObjectId(data.roomTypeId);

      // Recalculate rate
      const newRoomType = await RoomType.findById(data.roomTypeId).session(session);
      if (newRoomType) {
        updateData.ratePerNightCents = newRoomType.basePricePerNightCents;
      }
    }

    // Handle other fields
    if (data.adults !== undefined) updateData.adults = data.adults;
    if (data.children !== undefined) updateData.children = data.children;
    if (data.specialRequests !== undefined) updateData.specialRequests = data.specialRequests;

    // If room changed or dates changed, update status
    if (data.roomId !== undefined || data.checkInDate || data.checkOutDate) {
      if (newRoomId && existing.status === 'pending') {
        updateData.status = 'confirmed';
      }
    }

    // Recalculate financials if rate or dates changed
    if (updateData.ratePerNightCents || updateData.checkInDate || updateData.checkOutDate) {
      const rate = updateData.ratePerNightCents ?? existing.ratePerNightCents;
      const nights = nightsBetween(newCheckIn, newCheckOut);
      const subtotalCents = rate * nights;
      const taxCents = Math.round(subtotalCents * (taxRateBps / 10000));
      const totalCents = subtotalCents + taxCents;
      updateData.depositCents = Math.round(totalCents * DEPOSIT_RATIO);
    }

    await Reservation.findByIdAndUpdate(id, { $set: updateData }, { session });

    // Update room references — do NOT set currentReservationId here.
    // It is only set at check-in when the room becomes occupied.
    if (data.roomId !== undefined) {
      // Clear old room reference if room changed
      if (existing.roomId && existing.roomId.toString() !== (newRoomId?.toString() ?? '')) {
        await Room.findByIdAndUpdate(existing.roomId, { $unset: { currentReservationId: '' } }, { session });
      }
    }

    // Activity log
    await ActivityLog.create([{
      actorId: new mongoose.Types.ObjectId(userId),
      entityType: 'reservation',
      entityId: existing._id,
      action: 'updated',
      title: `Reservation ${existing.code} updated`,
      description: `Reservation updated: ${Object.keys(updateData).join(', ')}`,
      meta: { updatedFields: Object.keys(updateData) },
    }], { session });

    await session.commitTransaction();
    return { id: existing._id.toString(), code: existing.code };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/* ------------------------------------------------------------------ */
/*  Internal notes                                                     */
/* ------------------------------------------------------------------ */

export async function addInternalNote(id: string, data: AddInternalNoteInput, userId: string) {
  const reservation = await Reservation.findByIdAndUpdate(
    id,
    { $push: { internalNotes: { body: data.body, addedBy: new mongoose.Types.ObjectId(userId), addedAt: new Date() } } },
    { new: true, runValidators: true },
  );
  if (!reservation) throw ApiError.notFound('Reservation not found');

  await ActivityLog.create({
    actorId: new mongoose.Types.ObjectId(userId),
    entityType: 'reservation',
    entityId: reservation._id,
    action: 'note_added',
    title: `Note added to ${reservation.code}`,
    description: `Internal note added: ${data.body.slice(0, 80)}`,
  });

  return {
    id: reservation._id.toString(),
    code: reservation.code,
    notes: (reservation.internalNotes ?? []).map((n: any) => ({
      body: n.body,
      addedBy: n.addedBy?.toString?.() ?? null,
      addedAt: n.addedAt?.toISOString?.() ?? null,
    })),
  };
}

/* ------------------------------------------------------------------ */
/*  Cancel                                                             */
/* ------------------------------------------------------------------ */

export async function cancelReservation(id: string, userId: string) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existing = await Reservation.findById(id).session(session);
    if (!existing) throw ApiError.notFound('Reservation not found');

    if (existing.status === 'cancelled') {
      throw ApiError.conflict('Reservation is already cancelled');
    }

    if (existing.status === 'checked_in' || existing.status === 'checked_out') {
      throw ApiError.badRequest(`Cannot cancel a ${existing.status} reservation`);
    }

    await Reservation.findByIdAndUpdate(id, {
      $set: { status: 'cancelled' },
    }, { session });

    // Clear room reference
    if (existing.roomId) {
      await Room.findByIdAndUpdate(existing.roomId, {
        $unset: { currentReservationId: '' },
      }, { session });
    }

    // Activity log
    await ActivityLog.create([{
      actorId: new mongoose.Types.ObjectId(userId),
      entityType: 'reservation',
      entityId: existing._id,
      action: 'cancelled',
      title: `Reservation ${existing.code} cancelled`,
      description: `Reservation cancelled by user`,
      meta: { previousStatus: existing.status },
    }], { session });

    await session.commitTransaction();
    return { id: existing._id.toString(), code: existing.code, status: 'cancelled' };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/* ------------------------------------------------------------------ */
/*  Check-in                                                           */
/* ------------------------------------------------------------------ */

export async function checkInReservation(id: string, userId: string) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const reservation = await Reservation.findById(id).session(session);
    if (!reservation) throw ApiError.notFound('Reservation not found');

    // 1. Verify status = confirmed
    if (reservation.status === 'checked_in') {
      throw ApiError.conflict('Reservation is already checked in');
    }
    if (reservation.status === 'checked_out') {
      throw ApiError.conflict('Reservation is already checked out');
    }
    if (reservation.status === 'pending') {
      throw ApiError.conflict('Cannot check in a pending reservation — confirm first');
    }
    if (reservation.status === 'cancelled') {
      throw ApiError.conflict('Cannot check in a cancelled reservation');
    }
    if (reservation.status !== 'confirmed') {
      throw ApiError.conflict(`Cannot check in reservation in "${reservation.status}" status`);
    }

    // 2. Verify room assignment
    if (!reservation.roomId) {
      throw ApiError.conflict('Reservation has no room assigned — cannot check in');
    }

    // 3. Load and verify room
    const room = await Room.findById(reservation.roomId).session(session);
    if (!room) throw ApiError.notFound('Assigned room not found');

    // 4. Verify room matches reservation type
    if (room.roomTypeId.toString() !== reservation.roomTypeId.toString()) {
      throw ApiError.conflict('Assigned room does not match reservation room type');
    }

    // 5. Verify room occupancyStatus = vacant
    if (room.occupancyStatus !== 'vacant') {
      throw ApiError.conflict(`Room ${room.number} is not vacant (current status: ${room.occupancyStatus})`);
    }

    // 6. Verify room is not out_of_order
    if (room.housekeepingStatus === 'out_of_order') {
      throw ApiError.conflict(`Room ${room.number} is out of order and cannot be checked in`);
    }

    // 7. Set reservation.status = checked_in + checkedInAt
    await Reservation.findByIdAndUpdate(id, {
      $set: { status: 'checked_in', checkedInAt: new Date() },
    }, { session });

    // 9. Set room.occupancyStatus = occupied + currentReservationId
    await Room.findByIdAndUpdate(reservation.roomId, {
      $set: {
        occupancyStatus: 'occupied',
        currentReservationId: reservation._id,
      },
    }, { session });

    // 9. Activity logs
    await ActivityLog.create([{
      actorId: new mongoose.Types.ObjectId(userId),
      entityType: 'reservation',
      entityId: reservation._id,
      action: 'checked_in',
      title: `Reservation ${reservation.code} checked in`,
      description: `Guest checked into Room ${room.number}`,
      meta: { roomId: reservation.roomId.toString(), roomNumber: room.number },
    }], { session });

    await ActivityLog.create([{
      actorId: new mongoose.Types.ObjectId(userId),
      entityType: 'room',
      entityId: reservation.roomId,
      action: 'occupancy_changed',
      title: `Room ${room.number} → occupied`,
      description: `Guest checked in (Reservation ${reservation.code})`,
      meta: { from: 'vacant', to: 'occupied', reservationCode: reservation.code },
    }], { session });

    // 10. Commit
    await session.commitTransaction();
    return { id: reservation._id.toString(), code: reservation.code, status: 'checked_in' };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
