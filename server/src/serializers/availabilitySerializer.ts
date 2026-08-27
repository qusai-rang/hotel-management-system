/* eslint-disable @typescript-eslint/no-explicit-any -- Mongoose lean/populate returns untyped shapes */

export interface AvailabilityRoomItem {
  roomId: string;
  roomNumber: string;
  floor: number;
  capacityAdults: number;
  capacityChildren: number | null;
  bedsLabel: string;
  sizeSqft: number | null;
  ratePerNightCents: number;
  roomType: { id: string; code: string; name: string; amenities: any[]; accentColor: string | null };
}

export interface AvailabilityGroup {
  roomType: { id: string; code: string; name: string; description: string; bedLabel: string; amenities: any[]; accentColor: string | null; basePricePerNightCents: number };
  availableRooms: AvailabilityRoomItem[];
}

export function serializeAvailabilityRoom(doc: any, roomTypeDoc: any): AvailabilityRoomItem {
  const obj = doc.toObject ? doc.toObject() : doc;
  const rt = roomTypeDoc?.toObject ? roomTypeDoc.toObject() : roomTypeDoc;
  const rate = obj.rateOverrideCents ?? rt.basePricePerNightCents;
  return {
    roomId: obj._id.toString(),
    roomNumber: obj.number,
    floor: obj.floor,
    capacityAdults: obj.capacityAdults,
    capacityChildren: obj.capacityChildren ?? null,
    bedsLabel: obj.bedsLabel,
    sizeSqft: obj.sizeSqft ?? null,
    ratePerNightCents: rate,
    roomType: {
      id: rt._id.toString(),
      code: rt.code,
      name: rt.name,
      amenities: rt.amenities ?? [],
      accentColor: rt.accentColor ?? null,
    },
  };
}
