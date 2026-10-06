/* eslint-disable @typescript-eslint/no-explicit-any -- Mongoose lean/populate returns untyped shapes */
import mongoose from 'mongoose';
import { Room } from '../models/Room';
import { RoomType } from '../models/RoomType';
import { Reservation } from '../models/Reservation';
import { ApiError } from '../utils/ApiError';
import type { AvailabilityQuery } from '../validation/availabilitySchemas';

/**
 * Date normalization: hotel reservations use date-only semantics (no time).
 * All dates are stored as UTC midnight. When comparing for availability,
 * we use the half-open interval [checkInDate, checkOutDate).
 *
 * Overlap predicate:
 *   existing.checkInDate < requested.checkOutDate
 *   AND existing.checkOutDate > requested.checkInDate
 *
 * This means checkout-on-checkin-day is ALLOWED (no overlap).
 */
const ACTIVE_RESERVATION_STATUSES = ['pending', 'confirmed', 'checked_in'];

function normalizeToMidnight(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function searchAvailability(query: AvailabilityQuery) {
  const fromDate = normalizeToMidnight(new Date(query.from));
  const toDate = normalizeToMidnight(new Date(query.to));

  // Validate dates (service-layer backup for schema validation)
  const today = normalizeToMidnight(new Date());
  if (fromDate < today) {
    throw ApiError.badRequest('checkInDate cannot be in the past');
  }
  if (toDate <= fromDate) {
    throw ApiError.badRequest('checkOutDate must be after checkInDate');
  }
  const nights = Math.round((toDate.getTime() - fromDate.getTime()) / 86400000);
  if (nights > 90) {
    throw ApiError.badRequest('Stay cannot exceed 90 nights');
  }

  const roomTypeFilter: Record<string, unknown> = {};
  if (query.roomTypeId) {
    roomTypeFilter._id = new mongoose.Types.ObjectId(query.roomTypeId);
  }

  const roomTypes = await RoomType.find(roomTypeFilter).lean();
  if (query.roomTypeId && roomTypes.length === 0) {
    throw ApiError.notFound('Room type not found');
  }

  const results: any[] = [];

  for (const rt of roomTypes) {
    const roomFilter: Record<string, unknown> = {
      roomTypeId: rt._id,
      housekeepingStatus: { $ne: 'out_of_order' },
    };
    if (query.floor) roomFilter.floor = query.floor;

    // Find rooms of this type
    const candidateRooms = await Room.find(roomFilter).lean();
    if (candidateRooms.length === 0) continue;

    // Find room IDs that have overlapping active reservations
    const candidateIds = candidateRooms.map(r => r._id);

    const overlappingReservations = await Reservation.find({
      roomId: { $in: candidateIds },
      status: { $in: ACTIVE_RESERVATION_STATUSES },
      checkInDate: { $lt: toDate },
      checkOutDate: { $gt: fromDate },
    }).select('roomId').lean();

    const blockedRoomIds = new Set(
      overlappingReservations.map((r: any) => r.roomId?.toString()).filter(Boolean),
    );

    const availableRooms = candidateRooms
      .filter(r => !blockedRoomIds.has(r._id.toString()))
      .filter(r => r.capacityAdults >= query.adults)
      .map(r => ({
        roomId: r._id.toString(),
        roomNumber: r.number,
        floor: r.floor,
        capacityAdults: r.capacityAdults,
        capacityChildren: r.capacityChildren ?? null,
        bedsLabel: r.bedsLabel,
        sizeSqft: r.sizeSqft ?? null,
        ratePerNightCents: r.rateOverrideCents ?? rt.basePricePerNightCents,
        roomType: {
          id: rt._id.toString(),
          code: rt.code,
          name: rt.name,
          amenities: rt.amenities ?? [],
          accentColor: rt.accentColor ?? null,
        },
      }));

    results.push({
      roomType: {
        id: rt._id.toString(),
        code: rt.code,
        name: rt.name,
        description: rt.description ?? '',
        bedLabel: rt.bedLabel,
        amenities: rt.amenities ?? [],
        accentColor: rt.accentColor ?? null,
        basePricePerNightCents: rt.basePricePerNightCents,
      },
      availableRooms,
    });
  }

  return results;
}
