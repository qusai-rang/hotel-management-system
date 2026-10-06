import { RoomType } from '../models/RoomType';
import { Room } from '../models/Room';
import { ApiError } from '../utils/ApiError';
import type { RoomTypeCreateInput, RoomTypeUpdateInput, RoomTypeListQuery } from '../validation/roomTypeSchemas';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

async function getRoomCountsByType(): Promise<Map<string, number>> {
  const results = await Room.aggregate([
    { $group: { _id: '$roomTypeId', count: { $sum: 1 } } },
  ]);
  const map = new Map<string, number>();
  for (const r of results) {
    map.set(r._id.toString(), r.count);
  }
  return map;
}

/* ------------------------------------------------------------------ */
/*  Service                                                            */
/* ------------------------------------------------------------------ */

export async function listRoomTypes(query: RoomTypeListQuery) {
  const { q, page, pageSize } = query;
  const filter: Record<string, unknown> = {};
  if (q) {
    filter.$or = [
      { code: { $regex: q, $options: 'i' } },
      { name: { $regex: q, $options: 'i' } },
    ];
  }

  const [docs, total] = await Promise.all([
    RoomType.find(filter).sort({ code: 1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    RoomType.countDocuments(filter),
  ]);

  const counts = await getRoomCountsByType();
  const items = docs.map(d => {
    const count = counts.get(d._id.toString()) ?? 0;
    return {
      id: d._id.toString(),
      code: d.code,
      name: d.name,
      description: d.description ?? '',
      basePricePerNightCents: d.basePricePerNightCents,
      maxGuests: d.maxGuests,
      bedLabel: d.bedLabel ?? '',
      sizeSqft: d.sizeSqft ?? null,
      amenities: d.amenities ?? [],
      accentColor: d.accentColor ?? null,
      totalRooms: count,
      createdAt: d.createdAt?.toISOString() ?? '',
      updatedAt: d.updatedAt?.toISOString() ?? '',
    };
  });

  return { items, total, page, pageSize };
}

export async function getRoomTypeById(id: string) {
  const doc = await RoomType.findById(id).lean();
  if (!doc) throw ApiError.notFound('Room type not found');
  const counts = await getRoomCountsByType();
  const count = counts.get(doc._id.toString()) ?? 0;
  return {
    id: doc._id.toString(),
    code: doc.code,
    name: doc.name,
    description: doc.description ?? '',
    basePricePerNightCents: doc.basePricePerNightCents,
    maxGuests: doc.maxGuests,
    bedLabel: doc.bedLabel,
    sizeSqft: doc.sizeSqft ?? null,
    amenities: doc.amenities ?? [],
    accentColor: doc.accentColor ?? null,
    totalRooms: count,
    createdAt: doc.createdAt?.toISOString() ?? '',
    updatedAt: doc.updatedAt?.toISOString() ?? '',
  };
}

export async function createRoomType(data: RoomTypeCreateInput) {
  const existing = await RoomType.findOne({ code: data.code });
  if (existing) throw ApiError.conflict(`Room type code "${data.code}" already exists`);
  const doc = await RoomType.create(data);
  return { id: doc._id.toString(), code: doc.code, name: doc.name };
}

export async function updateRoomType(id: string, data: RoomTypeUpdateInput) {
  if (data.code) {
    const existing = await RoomType.findOne({ code: data.code, _id: { $ne: id } });
    if (existing) throw ApiError.conflict(`Room type code "${data.code}" already exists`);
  }
  const doc = await RoomType.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  if (!doc) throw ApiError.notFound('Room type not found');
  return { id: doc._id.toString(), code: doc.code, name: doc.name };
}

export async function deleteRoomType(id: string) {
  const roomCount = await Room.countDocuments({ roomTypeId: id });
  if (roomCount > 0) {
    throw ApiError.conflict(`Cannot delete: ${roomCount} room(s) reference this room type`);
  }
  const doc = await RoomType.findByIdAndDelete(id);
  if (!doc) throw ApiError.notFound('Room type not found');
  return { id: doc._id.toString() };
}
