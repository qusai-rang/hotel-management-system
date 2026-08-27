/* eslint-disable @typescript-eslint/no-explicit-any -- Mongoose populate/lean() returns untyped shapes */
import mongoose from 'mongoose';
import { Room } from '../models/Room';
import { RoomType } from '../models/RoomType';
import { Reservation } from '../models/Reservation';
import { ActivityLog } from '../models/ActivityLog';
import { ApiError } from '../utils/ApiError';
import type { RoomCreateInput, RoomUpdateInput, RoomListQuery } from '../validation/roomSchemas';
import { serializeRoomListItem, serializeRoomDetail } from '../serializers/roomSerializer';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function buildListFilter(query: RoomListQuery): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  if (query.floor) filter.floor = query.floor;
  if (query.occupancyStatus) filter.occupancyStatus = query.occupancyStatus;
  if (query.housekeepingStatus) filter.housekeepingStatus = query.housekeepingStatus;
  if (query.roomTypeId) filter.roomTypeId = new mongoose.Types.ObjectId(query.roomTypeId);

  // Combined "status" filter maps to display status
  if (query.status) {
    const s = query.status.toLowerCase();
    if (s === 'available') {
      filter.occupancyStatus = 'vacant';
      filter.housekeepingStatus = { $in: ['clean'] };
    } else if (s === 'occupied') {
      filter.occupancyStatus = 'occupied';
    } else if (s === 'dirty') {
      filter.occupancyStatus = 'vacant';
      filter.housekeepingStatus = { $in: ['dirty', 'cleaning', 'needs_inspection'] };
    } else if (s === 'maintenance') {
      filter.housekeepingStatus = 'out_of_order';
    }
  }

  return filter;
}

/* ------------------------------------------------------------------ */
/*  List                                                               */
/* ------------------------------------------------------------------ */

export async function listRooms(query: RoomListQuery) {
  const { q, page, pageSize } = query;
  let filter = buildListFilter(query);

  // Text search: room number + room type name
  if (q) {
    const matchingTypeIds = await RoomType.find({
      name: { $regex: q, $options: 'i' },
    }).distinct('_id');

    filter = {
      ...filter,
      $or: [
        { number: { $regex: q, $options: 'i' } },
        { roomTypeId: { $in: matchingTypeIds } },
      ],
    };
  }

  const [docs, total] = await Promise.all([
    Room.find(filter).populate('roomTypeId', 'code name').sort({ number: 1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    Room.countDocuments(filter),
  ]);

  // Resolve guests for occupied rooms
  const occupiedRoomIds = docs.filter((d: any) => d.occupancyStatus === 'occupied' && d.currentReservationId).map((d: any) => d.currentReservationId);
  const reservations = occupiedRoomIds.length > 0
    ? await Reservation.find({ _id: { $in: occupiedRoomIds } }).populate('guestId', 'firstName lastName').lean()
    : [];
  const resMap = new Map(reservations.map((r: any) => [r._id.toString(), r]));

  const items = docs.map((d: any) => {
    const rt = d.roomTypeId as any;
    const res = d.currentReservationId ? resMap.get(d.currentReservationId.toString()) : undefined;
    const guest = res?.guestId as any;
    return serializeRoomListItem(d, rt, guest, res);
  });

  return { items, total, page, pageSize };
}

/* ------------------------------------------------------------------ */
/*  Detail                                                             */
/* ------------------------------------------------------------------ */

export async function getRoomById(id: string) {
  const doc = await Room.findById(id).populate('roomTypeId').lean();
  if (!doc) throw ApiError.notFound('Room not found');

  const raw = JSON.parse(JSON.stringify(doc));
  const rtDoc = raw.roomTypeId;

  // Current stay
  let currentStay = null;
  if (raw.currentReservationId) {
    const res = await Reservation.findById(raw.currentReservationId).populate('guestId', 'firstName lastName _id').lean();
    if (res) {
      const rawRes = JSON.parse(JSON.stringify(res));
      const guest = rawRes.guestId;
      currentStay = {
        guestName: guest ? `${guest.firstName} ${guest.lastName}`.trim() : '',
        guestId: guest?._id ?? '',
        checkInDate: rawRes.checkInDate,
        checkOutDate: rawRes.checkOutDate,
        reservationCode: rawRes.code,
        bookingId: `#${rawRes.code}`,
      };
    }
  }

  // Maintenance/ticket info
  let maintenance = null;
  if (raw.housekeepingStatus === 'out_of_order' && raw.priorityNote) {
    maintenance = {
      title: raw.priorityNote,
      reportedAt: raw.updatedAt ?? '',
      assignedTo: '',
      estimatedFixAt: '',
    };
  }

  return serializeRoomDetail(raw, rtDoc, currentStay, maintenance);
}

/* ------------------------------------------------------------------ */
/*  Activity                                                           */
/* ------------------------------------------------------------------ */

export async function getRoomActivity(roomId: string, page = 1, pageSize = 20) {
  const room = await Room.findById(roomId).lean();
  if (!room) throw ApiError.notFound('Room not found');

  const filter = { entityType: 'room' as const, entityId: new mongoose.Types.ObjectId(roomId) };
  const [docs, total] = await Promise.all([
    ActivityLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    ActivityLog.countDocuments(filter),
  ]);

  const items = docs.map(d => ({
    id: d._id.toString(),
    action: d.action,
    title: d.title,
    description: d.description,
    createdAt: d.createdAt?.toISOString() ?? '',
    meta: d.meta ?? {},
  }));

  return { items, total, page, pageSize };
}

/* ------------------------------------------------------------------ */
/*  Create                                                             */
/* ------------------------------------------------------------------ */

export async function createRoom(data: RoomCreateInput) {
  const roomType = await RoomType.findById(data.roomTypeId).lean();
  if (!roomType) throw ApiError.badRequest('Invalid roomTypeId');

  const existing = await Room.findOne({ number: data.number });
  if (existing) throw ApiError.conflict(`Room number "${data.number}" already exists`);

  const doc = await Room.create(data);
  return { id: doc._id.toString(), number: doc.number };
}

/* ------------------------------------------------------------------ */
/*  Update                                                             */
/* ------------------------------------------------------------------ */

export async function updateRoom(id: string, data: RoomUpdateInput) {
  if (data.roomTypeId) {
    const roomType = await RoomType.findById(data.roomTypeId).lean();
    if (!roomType) throw ApiError.badRequest('Invalid roomTypeId');
  }

  if (data.number) {
    const existing = await Room.findOne({ number: data.number, _id: { $ne: id } });
    if (existing) throw ApiError.conflict(`Room number "${data.number}" already exists`);
  }

  const doc = await Room.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  if (!doc) throw ApiError.notFound('Room not found');
  return { id: doc._id.toString(), number: doc.number };
}
