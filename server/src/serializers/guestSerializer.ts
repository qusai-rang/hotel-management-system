/* eslint-disable @typescript-eslint/no-explicit-any -- Mongoose documents are untyped after .lean()/.populate() */
export interface GuestListItem {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  address: { lines: string[]; city: string | null; country: string | null } | null;
  membershipTier: string;
  notes: string;
}

export interface GuestProfileDTO {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  address: { lines: string[]; city: string | null; country: string | null } | null;
  membershipTier: string;
  notes: string;
  stats: {
    totalStays: number;
    totalSpendCents: number;
    lastVisit: string | null;
  };
  stayHistory: {
    reservationCode: string;
    checkInDate: string;
    checkOutDate: string;
    roomNumber: string | null;
    roomTypeName: string;
    totalCents: number;
    status: string;
  }[];
}

export function serializeGuestListItem(doc: any): GuestListItem {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id.toString(),
    slug: obj.slug,
    firstName: obj.firstName,
    lastName: obj.lastName,
    fullName: `${obj.firstName} ${obj.lastName}`.trim(),
    email: obj.email ?? null,
    phone: obj.phone ?? null,
    address: obj.address ?? null,
    membershipTier: obj.membershipTier,
    notes: obj.notes ?? '',
  };
}

export function serializeGuestProfile(
  doc: any,
  stats: GuestProfileDTO['stats'],
  stayHistory: GuestProfileDTO['stayHistory'],
): GuestProfileDTO {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id.toString(),
    slug: obj.slug,
    firstName: obj.firstName,
    lastName: obj.lastName,
    fullName: `${obj.firstName} ${obj.lastName}`.trim(),
    email: obj.email ?? null,
    phone: obj.phone ?? null,
    address: obj.address ?? null,
    membershipTier: obj.membershipTier,
    notes: obj.notes ?? '',
    stats,
    stayHistory,
  };
}
