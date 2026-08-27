/* eslint-disable @typescript-eslint/no-explicit-any -- Mongoose documents are untyped after .lean()/.populate() */
/* ------------------------------------------------------------------ */
/*  Derived display status — not stored in DB, computed in serializer  */
/* ------------------------------------------------------------------ */

export type RoomDisplayStatus = 'available' | 'occupied' | 'dirty' | 'maintenance';

function deriveDisplayStatus(occupancy: string, housekeeping: string): RoomDisplayStatus {
  if (occupancy === 'occupied') return 'occupied';
  if (housekeeping === 'out_of_order') return 'maintenance';
  if (housekeeping === 'dirty' || housekeeping === 'cleaning' || housekeeping === 'needs_inspection') return 'dirty';
  return 'available';
}

/* ------------------------------------------------------------------ */
/*  Room list item                                                     */
/* ------------------------------------------------------------------ */

export interface RoomListItem {
  id: string;
  number: string;
  floor: number;
  roomType: { id: string; code: string; name: string };
  capacityAdults: number;
  capacityChildren: number | null;
  bedsLabel: string;
  sizeSqft: number | null;
  rateOverrideCents: number | null;
  occupancyStatus: string;
  housekeepingStatus: string;
  displayStatus: RoomDisplayStatus;
  currentGuest: { name: string; initials: string; departure: string } | null;
  priorityNote: string | null;
}

/* ------------------------------------------------------------------ */
/*  Room detail                                                        */
/* ------------------------------------------------------------------ */

export interface RoomDetailDTO {
  id: string;
  number: string;
  floor: number;
  roomType: {
    id: string;
    code: string;
    name: string;
    description: string;
    bedLabel: string;
    sizeSqft: number | null;
    amenities: { iconName: string; label: string }[];
    accentColor: string | null;
  };
  capacityAdults: number;
  capacityChildren: number | null;
  bedsLabel: string;
  sizeSqft: number | null;
  rateOverrideCents: number | null;
  occupancyStatus: string;
  housekeepingStatus: string;
  displayStatus: RoomDisplayStatus;
  currentStay: {
    guestName: string;
    guestId: string;
    checkInDate: string;
    checkOutDate: string;
    reservationCode: string;
    bookingId: string;
  } | null;
  maintenance: { title: string; reportedAt: string; assignedTo: string; estimatedFixAt: string } | null;
  priorityNote: string | null;
  cleanedAt: string | null;
}

/* ------------------------------------------------------------------ */
/*  Serializers                                                        */
/* ------------------------------------------------------------------ */

function initials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export function serializeRoomListItem(
  doc: any,
  roomType: any,
  guest?: { firstName: string; lastName: string } | null,
  reservation?: { checkOutDate: Date } | null,
): RoomListItem {
  const obj = doc.toObject ? doc.toObject() : doc;
  const display = deriveDisplayStatus(obj.occupancyStatus, obj.housekeepingStatus);

  let currentGuest: RoomListItem['currentGuest'] = null;
  if (guest && obj.occupancyStatus === 'occupied') {
    const dep = reservation?.checkOutDate;
    currentGuest = {
      name: `${guest.firstName} ${guest.lastName}`.trim(),
      initials: initials(guest.firstName, guest.lastName),
      departure: dep ? `Out: ${dep.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : '',
    };
  }

  return {
    id: obj._id.toString(),
    number: obj.number,
    floor: obj.floor,
    roomType: { id: roomType._id.toString(), code: roomType.code, name: roomType.name },
    capacityAdults: obj.capacityAdults,
    capacityChildren: obj.capacityChildren ?? null,
    bedsLabel: obj.bedsLabel,
    sizeSqft: obj.sizeSqft ?? null,
    rateOverrideCents: obj.rateOverrideCents ?? null,
    occupancyStatus: obj.occupancyStatus,
    housekeepingStatus: obj.housekeepingStatus,
    displayStatus: display,
    currentGuest,
    priorityNote: obj.priorityNote ?? null,
  };
}

export function serializeRoomDetail(
  doc: any,
  roomTypeDoc: any,
  currentStay: RoomDetailDTO['currentStay'],
  maintenance: RoomDetailDTO['maintenance'],
): RoomDetailDTO {
  const obj = doc.toObject ? doc.toObject() : doc;
  const rt = roomTypeDoc?.toObject ? roomTypeDoc.toObject() : roomTypeDoc;
  const display = deriveDisplayStatus(obj.occupancyStatus, obj.housekeepingStatus);

  return {
    id: obj._id.toString(),
    number: obj.number,
    floor: obj.floor,
    roomType: rt ? {
      id: rt._id.toString(),
      code: rt.code,
      name: rt.name,
      description: rt.description ?? '',
      bedLabel: rt.bedLabel,
      sizeSqft: rt.sizeSqft ?? null,
      amenities: rt.amenities ?? [],
      accentColor: rt.accentColor ?? null,
    } : { id: '', code: '', name: '', description: '', bedLabel: '', sizeSqft: null, amenities: [], accentColor: null },
    capacityAdults: obj.capacityAdults,
    capacityChildren: obj.capacityChildren ?? null,
    bedsLabel: obj.bedsLabel,
    sizeSqft: obj.sizeSqft ?? null,
    rateOverrideCents: obj.rateOverrideCents ?? null,
    occupancyStatus: obj.occupancyStatus,
    housekeepingStatus: obj.housekeepingStatus,
    displayStatus: display,
    currentStay,
    maintenance,
    priorityNote: obj.priorityNote ?? null,
    cleanedAt: obj.cleanedAt?.toISOString?.() ?? null,
  };
}
