/* eslint-disable @typescript-eslint/no-explicit-any -- Mongoose lean/populate returns untyped shapes */

export interface ReservationListItem {
  id: string;
  code: string;
  guest: { id: string; fullName: string; initials: string; email: string | null; phone: string | null } | null;
  roomType: { id: string; code: string; name: string } | null;
  room: { id: string; number: string } | null;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  status: string;
  ratePerNightCents: number;
  totalCents: number;
  depositCents: number;
  adults: number;
  children: number;
  source: string;
  createdAt: string;
}

export interface ReservationDetailDTO {
  id: string;
  code: string;
  status: string;
  guest: { id: string; slug: string; fullName: string; email: string | null; phone: string | null; membershipTier: string } | null;
  roomType: { id: string; code: string; name: string; bedLabel: string; amenities: any[] } | null;
  room: { id: string; number: string; floor: number; bedsLabel: string } | null;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  adults: number;
  children: number;
  ratePerNightCents: number;
  taxRateBps: number;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  depositCents: number;
  amountPaidCents: number;
  outstandingCents: number;
  specialRequests: { title: string; description: string | null; iconName: string | null; dueAt: string | null }[];
  internalNotes: { body: string; addedBy: string | null; addedAt: string }[];
  source: string;
  createdBy: string;
  createdAt: string;
}

function nightsBetween(checkIn: Date, checkOut: Date): number {
  const diffMs = checkOut.getTime() - checkIn.getTime();
  return Math.round(diffMs / 86400000);
}

function initials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export function serializeReservationListItem(doc: any): ReservationListItem {
  const obj = doc.toObject ? doc.toObject() : doc;
  const guest = obj.guestId;
  const rt = obj.roomTypeId;
  const room = obj.roomId;
  const nights = nightsBetween(new Date(obj.checkInDate), new Date(obj.checkOutDate));
  const totalCents = obj.ratePerNightCents * nights;

  return {
    id: obj._id.toString(),
    code: obj.code,
    guest: guest ? {
      id: guest._id?.toString?.() ?? guest.toString(),
      fullName: `${guest.firstName} ${guest.lastName}`.trim(),
      initials: initials(guest.firstName, guest.lastName),
      email: guest.email ?? null,
      phone: guest.phone ?? null,
    } : null,
    roomType: rt ? { id: rt._id?.toString?.() ?? rt.toString(), code: rt.code, name: rt.name } : null,
    room: room ? { id: room._id?.toString?.() ?? room.toString(), number: room.number } : null,
    checkInDate: new Date(obj.checkInDate).toISOString(),
    checkOutDate: new Date(obj.checkOutDate).toISOString(),
    nights,
    status: obj.status,
    ratePerNightCents: obj.ratePerNightCents,
    totalCents,
    depositCents: obj.depositCents,
    adults: obj.adults,
    children: obj.children,
    source: obj.source,
    createdAt: obj.createdAt?.toISOString?.() ?? obj.createdAt ?? '',
  };
}

export function serializeReservationDetail(doc: any, amountPaidCents: number): ReservationDetailDTO {
  const obj = doc.toObject ? doc.toObject() : doc;
  const guest = obj.guestId;
  const rt = obj.roomTypeId;
  const room = obj.roomId;
  const nights = nightsBetween(new Date(obj.checkInDate), new Date(obj.checkOutDate));
  const subtotalCents = obj.ratePerNightCents * nights;
  const taxCents = Math.round(subtotalCents * (obj.taxRateBps / 10000));
  const totalCents = subtotalCents + taxCents;
  const outstandingCents = totalCents - amountPaidCents;

  return {
    id: obj._id.toString(),
    code: obj.code,
    status: obj.status,
    guest: guest ? {
      id: guest._id?.toString?.() ?? guest.toString(),
      slug: guest.slug ?? '',
      fullName: `${guest.firstName} ${guest.lastName}`.trim(),
      email: guest.email ?? null,
      phone: guest.phone ?? null,
      membershipTier: guest.membershipTier ?? 'standard',
    } : null,
    roomType: rt ? {
      id: rt._id?.toString?.() ?? rt.toString(),
      code: rt.code,
      name: rt.name,
      bedLabel: rt.bedLabel ?? '',
      amenities: rt.amenities ?? [],
    } : null,
    room: room ? {
      id: room._id?.toString?.() ?? room.toString(),
      number: room.number,
      floor: room.floor,
      bedsLabel: room.bedsLabel,
    } : null,
    checkInDate: new Date(obj.checkInDate).toISOString(),
    checkOutDate: new Date(obj.checkOutDate).toISOString(),
    nights,
    adults: obj.adults,
    children: obj.children,
    ratePerNightCents: obj.ratePerNightCents,
    taxRateBps: obj.taxRateBps,
    subtotalCents,
    taxCents,
    totalCents,
    depositCents: obj.depositCents,
    amountPaidCents,
    outstandingCents,
    specialRequests: (obj.specialRequests ?? []).map((sr: any) => ({
      title: sr.title,
      description: sr.description ?? null,
      iconName: sr.iconName ?? null,
      dueAt: sr.dueAt?.toISOString?.() ?? null,
    })),
    internalNotes: (obj.internalNotes ?? []).map((n: any) => ({
      body: n.body,
      addedBy: n.addedBy?.toString?.() ?? null,
      addedAt: n.addedAt?.toISOString?.() ?? null,
    })),
    source: obj.source,
    createdBy: obj.createdBy?.toString?.() ?? '',
    createdAt: obj.createdAt?.toISOString?.() ?? obj.createdAt ?? '',
  };
}
