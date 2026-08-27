/* eslint-disable @typescript-eslint/no-explicit-any -- Mongoose lean()/populate() returns untyped shapes */
import { Guest } from '../models/Guest';
import { Reservation } from '../models/Reservation';
import { Folio } from '../models/Folio';
import { Payment } from '../models/Payment';
import { ApiError } from '../utils/ApiError';
import type { GuestCreateInput, GuestUpdateInput, GuestListQuery } from '../validation/guestSchemas';
import { serializeGuestProfile } from '../serializers/guestSerializer';
import type { GuestProfileDTO } from '../serializers/guestSerializer';

/* ------------------------------------------------------------------ */
/*  Slug generation                                                    */
/* ------------------------------------------------------------------ */

function slugify(first: string, last: string): string {
  return `${first} ${last}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/* ------------------------------------------------------------------ */
/*  List                                                               */
/* ------------------------------------------------------------------ */

export async function listGuests(query: GuestListQuery) {
  const { q, membershipTier, page, pageSize } = query;
  const filter: Record<string, unknown> = {};

  if (membershipTier) filter.membershipTier = membershipTier;
  if (q) {
    const regex = { $regex: q, $options: 'i' };
    filter.$or = [
      { firstName: regex },
      { lastName: regex },
      { email: regex },
      { phone: regex },
      { slug: regex },
    ];
  }

  const [docs, total] = await Promise.all([
    Guest.find(filter).sort({ lastName: 1, firstName: 1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    Guest.countDocuments(filter),
  ]);

  const items = docs.map(d => ({
    id: d._id.toString(),
    slug: d.slug,
    firstName: d.firstName,
    lastName: d.lastName,
    fullName: `${d.firstName} ${d.lastName}`.trim(),
    email: d.email ?? null,
    phone: d.phone ?? null,
    address: d.address ?? null,
    membershipTier: d.membershipTier,
    notes: d.notes ?? '',
  }));

  return { items, total, page, pageSize };
}

/* ------------------------------------------------------------------ */
/*  Profile (with derived stats)                                       */
/* ------------------------------------------------------------------ */

export async function getGuestBySlug(slug: string) {
  const doc = await Guest.findOne({ slug }).lean();
  if (!doc) throw ApiError.notFound('Guest not found');

  const guestId = doc._id;

  // Derived stats from reservations + folios + payments
  const reservations = await Reservation.find({ guestId }).lean();
  const folioIds = (await Folio.find({ guestId }).lean()).map(f => f._id);
  const payments = folioIds.length > 0
    ? await Payment.find({ folioId: { $in: folioIds }, status: 'captured' }).lean()
    : [];

  const totalStays = reservations.filter(r => r.status === 'checked_out' || r.status === 'checked_in').length;
  const totalSpendCents = payments.reduce((sum, p) => sum + p.amountCents, 0);
  const checkOutDates = reservations
    .filter(r => r.checkedOutAt)
    .map(r => r.checkedOutAt!)
    .sort((a, b) => b.getTime() - a.getTime());
  const lastVisit = checkOutDates.length > 0 ? checkOutDates[0].toISOString() : null;

  // Stay history
  const stayHistory: GuestProfileDTO['stayHistory'] = reservations.map(r => {
    return {
      reservationCode: r.code,
      checkInDate: r.checkInDate.toISOString(),
      checkOutDate: r.checkOutDate.toISOString(),
      roomNumber: null as string | null,
      roomTypeName: '',
      totalCents: r.ratePerNightCents * Math.ceil((r.checkOutDate.getTime() - r.checkInDate.getTime()) / 86400000),
      status: r.status,
    };
  });

  // Sort by check-in date descending
  stayHistory.sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime());

  return serializeGuestProfile(doc as any, { totalStays, totalSpendCents, lastVisit }, stayHistory);
}

/* ------------------------------------------------------------------ */
/*  Stays                                                              */
/* ------------------------------------------------------------------ */

export async function getGuestStays(slug: string, query: { page: number; pageSize: number; status?: string }) {
  const doc = await Guest.findOne({ slug }).lean();
  if (!doc) throw ApiError.notFound('Guest not found');

  const filter: Record<string, unknown> = { guestId: doc._id };
  if (query.status) filter.status = query.status;

  const [reservations, total] = await Promise.all([
    Reservation.find(filter)
      .sort({ checkInDate: -1 })
      .skip((query.page - 1) * query.pageSize)
      .limit(query.pageSize)
      .populate('roomTypeId', 'name')
      .populate('roomId', 'number')
      .lean(),
    Reservation.countDocuments(filter),
  ]);

  const items = reservations.map((r: any) => ({
    id: r._id.toString(),
    code: r.code,
    status: r.status,
    checkInDate: r.checkInDate.toISOString(),
    checkOutDate: r.checkOutDate.toISOString(),
    roomNumber: r.roomId?.number ?? null,
    roomTypeName: r.roomTypeId?.name ?? '',
    ratePerNightCents: r.ratePerNightCents,
    totalCents: r.ratePerNightCents * Math.ceil((r.checkOutDate.getTime() - r.checkInDate.getTime()) / 86400000),
  }));

  return { items, total, page: query.page, pageSize: query.pageSize };
}

/* ------------------------------------------------------------------ */
/*  Create                                                             */
/* ------------------------------------------------------------------ */

export async function createGuest(data: GuestCreateInput) {
  const slug = slugify(data.firstName, data.lastName);

  // Check slug uniqueness
  const existing = await Guest.findOne({ slug });
  if (existing) throw ApiError.conflict(`A guest with name "${data.firstName} ${data.lastName}" already exists`);

  // Check email uniqueness if provided
  if (data.email) {
    const emailExisting = await Guest.findOne({ email: data.email });
    if (emailExisting) throw ApiError.conflict(`Email "${data.email}" is already in use`);
  }

  const doc = await Guest.create({ ...data, slug });
  return { id: doc._id.toString(), slug: doc.slug };
}

/* ------------------------------------------------------------------ */
/*  Update                                                             */
/* ------------------------------------------------------------------ */

export async function updateGuest(slug: string, data: GuestUpdateInput) {
  const doc = await Guest.findOne({ slug });
  if (!doc) throw ApiError.notFound('Guest not found');

  if (data.email && data.email !== doc.email) {
    const emailExisting = await Guest.findOne({ email: data.email, _id: { $ne: doc._id } });
    if (emailExisting) throw ApiError.conflict(`Email "${data.email}" is already in use`);
  }

  // If name changes, regenerate slug
  let newSlug = slug;
  if (data.firstName || data.lastName) {
    newSlug = slugify(data.firstName ?? doc.firstName, data.lastName ?? doc.lastName);
    if (newSlug !== slug) {
      const slugExisting = await Guest.findOne({ slug: newSlug, _id: { $ne: doc._id } });
      if (slugExisting) throw ApiError.conflict(`A guest with this name already exists`);
    }
  }

  Object.assign(doc, data);
  doc.slug = newSlug;
  await doc.save();

  return { id: doc._id.toString(), slug: doc.slug };
}
