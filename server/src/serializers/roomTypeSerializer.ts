/* eslint-disable @typescript-eslint/no-explicit-any -- Mongoose documents are untyped after .lean()/.populate() */
export interface RoomTypeDTO {
  id: string;
  code: string;
  name: string;
  description: string;
  basePricePerNightCents: number;
  maxGuests: number;
  bedLabel: string;
  sizeSqft: number | null;
  amenities: { iconName: string; label: string }[];
  accentColor: string | null;
  totalRooms: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoomTypeListItem {
  id: string;
  code: string;
  name: string;
  basePricePerNightCents: number;
  maxGuests: number;
  totalRooms: number;
}

export function serializeRoomType(doc: any, totalRooms: number): RoomTypeDTO {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id.toString(),
    code: obj.code,
    name: obj.name,
    description: obj.description ?? '',
    basePricePerNightCents: obj.basePricePerNightCents,
    maxGuests: obj.maxGuests,
    bedLabel: obj.bedLabel,
    sizeSqft: obj.sizeSqft ?? null,
    amenities: obj.amenities ?? [],
    accentColor: obj.accentColor ?? null,
    totalRooms,
    createdAt: obj.createdAt?.toISOString?.() ?? obj.createdAt ?? '',
    updatedAt: obj.updatedAt?.toISOString?.() ?? obj.updatedAt ?? '',
  };
}

export function serializeRoomTypeListItem(doc: any, totalRooms: number): RoomTypeListItem {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id.toString(),
    code: obj.code,
    name: obj.name,
    basePricePerNightCents: obj.basePricePerNightCents,
    maxGuests: obj.maxGuests,
    totalRooms,
  };
}
