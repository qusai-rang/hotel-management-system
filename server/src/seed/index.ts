import 'dotenv/config';
import mongoose from 'mongoose';
import { Hotel } from '../models/Hotel';
import { User } from '../models/User';
import { RoomType } from '../models/RoomType';
import { Room } from '../models/Room';
import { Guest } from '../models/Guest';
import { Reservation } from '../models/Reservation';
import { Folio } from '../models/Folio';
import { Payment } from '../models/Payment';
import { Invoice } from '../models/Invoice';
import { HousekeepingTask } from '../models/HousekeepingTask';
import { ActivityLog } from '../models/ActivityLog';
import { Counter } from '../models/Counter';
import { hashPassword } from '../services/authService';
import { logger } from '../utils/logger';
import {
  hotelData,
  userData,
  roomTypeData,
  roomData,
  guestData,
  reservationData,
  checkoutSessionData,
  paymentData,
  invoiceData,
  housekeepingData,
  activityLogData,
  counterData,
} from './data';

/* ------------------------------------------------------------------ */
/*  Seed password environment variables                                */
/* ------------------------------------------------------------------ */

const SEED_PASSWORDS = {
  admin: process.env.SEED_ADMIN_PASSWORD,
  manager: process.env.SEED_MANAGER_PASSWORD,
  front_desk: process.env.SEED_FRONT_DESK_PASSWORD,
  housekeeping: process.env.SEED_HOUSEKEEPING_PASSWORD,
} as const;

function validateSeedPasswords(): void {
  const missing = Object.entries(SEED_PASSWORDS)
    .filter(([, v]) => !v)
    .map(([k]) => `SEED_${k.toUpperCase()}_PASSWORD`);
  if (missing.length > 0) {
    console.error(`\nSeed password environment variables are required but missing:\n  ${missing.join('\n  ')}\n`);
    console.error('Set them in server/.env before running the seed.');
    process.exit(1);
  }
}

function getPasswordForRole(role: string): string {
  if (role === 'admin') return SEED_PASSWORDS.admin!;
  if (role === 'manager') return SEED_PASSWORDS.manager!;
  if (role === 'front_desk') return SEED_PASSWORDS.front_desk!;
  if (role === 'housekeeping') return SEED_PASSWORDS.housekeeping!;
  throw new Error(`No seed password configured for role: ${role}`);
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const seededModels = [
  Hotel, User, RoomType, Room, Guest,
  Reservation, Folio, Payment, Invoice,
  HousekeepingTask, ActivityLog, Counter,
];

async function dropSeededCollections(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- seed helper; deleteMany signature varies across model types
  await Promise.all(seededModels.map(c => (c as any).deleteMany({})));
}

/* eslint-disable @typescript-eslint/no-explicit-any -- seed helper; Mongoose Model types are contravariant */
async function upsert(
  model: any,
  filter: Record<string, unknown>,
  data: object,
): Promise<mongoose.Document> {
  const doc = await model.findOneAndUpdate(filter, { $set: data }, { upsert: true, new: true, runValidators: true });
  return doc as mongoose.Document;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function extractId(doc: { _id?: mongoose.Types.ObjectId }): string {
  return (doc._id ?? new mongoose.Types.ObjectId()).toString();
}

/* ------------------------------------------------------------------ */
/*  Seed phases                                                        */
/* ------------------------------------------------------------------ */

async function seedHotel(): Promise<void> {
  await upsert(Hotel, { name: hotelData.name }, hotelData);
  logger.info('seeded hotel');
}

async function seedUsers(): Promise<Map<string, string>> {
  const idMap = new Map<string, string>();
  for (const u of userData) {
    const password = getPasswordForRole(u.role);
    const passwordHash = await hashPassword(password);
    const doc = await upsert(User, { email: u.email }, {
      name: u.name,
      email: u.email,
      passwordHash,
      role: u.role,
      active: true,
    });
    idMap.set(u.seedKey, extractId(doc));
  }
  logger.info('seeded users', { count: userData.length });
  return idMap;
}

async function seedRoomTypes(): Promise<Map<string, string>> {
  const idMap = new Map<string, string>();
  for (const rt of roomTypeData) {
    const doc = await upsert(RoomType, { code: rt.code }, {
      code: rt.code,
      name: rt.name,
      description: rt.description,
      basePricePerNightCents: rt.basePricePerNightCents,
      maxGuests: rt.maxGuests,
      bedLabel: rt.bedLabel,
      sizeSqft: rt.sizeSqft,
      amenities: rt.amenities,
      accentColor: rt.accentColor,
    });
    idMap.set(rt.code, extractId(doc));
  }
  logger.info('seeded room types', { count: roomTypeData.length });
  return idMap;
}

async function seedRooms(roomTypeIds: Map<string, string>): Promise<Map<string, string>> {
  const idMap = new Map<string, string>();
  for (const r of roomData) {
    const roomTypeId = roomTypeIds.get(r.roomTypeCode);
    if (!roomTypeId) throw new Error(`Room type not found: ${r.roomTypeCode}`);
    const doc = await upsert(Room, { number: r.number }, {
      number: r.number,
      floor: r.floor,
      roomTypeId,
      capacityAdults: r.capacityAdults,
      capacityChildren: r.capacityChildren,
      bedsLabel: r.bedsLabel,
      sizeSqft: r.sizeSqft,
      rateOverrideCents: r.rateOverrideCents,
      occupancyStatus: r.occupancyStatus,
      housekeepingStatus: r.housekeepingStatus,
      priorityNote: r.priorityNote,
    });
    idMap.set(r.number, extractId(doc));
  }
  logger.info('seeded rooms', { count: roomData.length });
  return idMap;
}

async function seedGuests(): Promise<Map<string, string>> {
  const idMap = new Map<string, string>();
  for (const g of guestData) {
    const doc = await upsert(Guest, { slug: g.slug }, {
      slug: g.slug,
      firstName: g.firstName,
      lastName: g.lastName,
      email: g.email,
      phone: g.phone,
      address: g.address,
      membershipTier: g.membershipTier,
      notes: g.notes,
    });
    idMap.set(g.seedKey, extractId(doc));
  }
  logger.info('seeded guests', { count: guestData.length });
  return idMap;
}

async function seedReservations(
  guestIds: Map<string, string>,
  roomTypeIds: Map<string, string>,
  roomIds: Map<string, string>,
  userIds: Map<string, string>,
): Promise<Map<string, string>> {
  const idMap = new Map<string, string>();
  const createdById = userIds.get('front_desk') ?? userIds.values().next().value!;

  for (const r of reservationData) {
    const guestId = guestIds.get(r.guestSeedKey);
    if (!guestId) throw new Error(`Guest not found: ${r.guestSeedKey}`);
    const roomTypeId = roomTypeIds.get(r.roomTypeCode);
    if (!roomTypeId) throw new Error(`Room type not found: ${r.roomTypeCode}`);
    const roomId = r.roomNumber ? roomIds.get(r.roomNumber) : undefined;
    if (r.roomNumber && !roomId) throw new Error(`Room not found: ${r.roomNumber}`);

    const doc = await upsert(Reservation, { code: r.code }, {
      code: r.code,
      guestId,
      roomTypeId,
      roomId: roomId ?? null,
      status: r.status,
      checkInDate: r.checkInDate,
      checkOutDate: r.checkOutDate,
      adults: r.adults,
      children: r.children,
      specialRequests: r.specialRequests ?? [],
      ratePerNightCents: r.ratePerNightCents,
      taxRateBps: r.taxRateBps,
      depositCents: r.depositCents,
      source: r.source,
      createdBy: createdById,
      checkedInAt: r.checkedInAt ?? null,
      checkedOutAt: r.checkedOutAt ?? null,
    });
    idMap.set(r.code, extractId(doc));
  }
  logger.info('seeded reservations', { count: reservationData.length });
  return idMap;
}

async function seedFolios(
  reservationIds: Map<string, string>,
  guestIds: Map<string, string>,
): Promise<Map<string, string>> {
  const idMap = new Map<string, string>();
  for (const f of checkoutSessionData) {
    const reservationId = reservationIds.get(f.reservationCode);
    if (!reservationId) throw new Error(`Reservation not found: ${f.reservationCode}`);
    const guestId = guestIds.get(f.guestSeedKey);
    if (!guestId) throw new Error(`Guest not found: ${f.guestSeedKey}`);

    const doc = await upsert(Folio, { reservationId }, {
      folioNumber: f.folioNumber,
      reservationId,
      guestId,
      charges: f.charges,
      discounts: f.discounts,
      taxRateBps: f.taxRateBps,
      status: f.status,
    });
    idMap.set(f.folioNumber, extractId(doc));
  }
  logger.info('seeded folios', { count: checkoutSessionData.length });
  return idMap;
}

async function seedPayments(
  folioIds: Map<string, string>,
  userIds: Map<string, string>,
): Promise<void> {
  const createdById = userIds.get('front_desk') ?? userIds.values().next().value!;
  let count = 0;

  for (const p of paymentData) {
    const folioId = folioIds.get(p.folioNumber);
    if (!folioId) throw new Error(`Folio not found: ${p.folioNumber}`);

    await Payment.findOneAndUpdate(
      { folioId, amountCents: p.amountCents, method: p.method, status: p.status },
      { $setOnInsert: {
        folioId,
        amountCents: p.amountCents,
        method: p.method,
        cardBrand: p.cardBrand,
        cardLast4: p.cardLast4,
        gatewayRef: p.gatewayRef,
        status: p.status,
        processedBy: createdById,
      }},
      { upsert: true, new: true },
    );
    count++;
  }
  logger.info('seeded payments', { count });
}

async function seedInvoices(
  folioIds: Map<string, string>,
  guestIds: Map<string, string>,
): Promise<void> {
  let count = 0;
  for (const inv of invoiceData) {
    const folioId = folioIds.get(inv.folioNumber);
    if (!folioId) throw new Error(`Folio not found for invoice: ${inv.folioNumber}`);
    const guestId = guestIds.get(inv.guestSeedKey);
    if (!guestId) throw new Error(`Guest not found for invoice: ${inv.guestSeedKey}`);

    await upsert(Invoice, { invoiceNumber: inv.invoiceNumber }, {
      invoiceNumber: inv.invoiceNumber,
      folioId,
      guestId,
      hotelBlock: inv.hotelBlock,
      billTo: inv.billTo,
      lineItems: inv.lineItems,
      subtotalCents: inv.subtotalCents,
      taxRateBps: inv.taxRateBps,
      taxCents: inv.taxCents,
      discountTotalCents: inv.discountTotalCents,
      totalCents: inv.totalCents,
      amountPaidCents: inv.amountPaidCents,
      balanceDueCents: inv.balanceDueCents,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      status: inv.status,
    });
    count++;
  }
  logger.info('seeded invoices', { count });
}

async function seedHousekeepingTasks(
  roomIds: Map<string, string>,
  userIds: Map<string, string>,
): Promise<void> {
  let count = 0;
  for (const t of housekeepingData) {
    const roomId = roomIds.get(t.roomNumber);
    if (!roomId) throw new Error(`Room not found for housekeeping: ${t.roomNumber}`);
    const assigneeId = t.assigneeSeedKey ? userIds.get(t.assigneeSeedKey) : undefined;

    await HousekeepingTask.findOneAndUpdate(
      { roomId, context: t.context, type: t.type },
      { $setOnInsert: {
        roomId,
        context: t.context,
        type: t.type,
        status: t.status,
        assigneeId: assigneeId ?? null,
        progressPercent: t.progressPercent,
        estimateCompletionAt: t.estimateCompletionAt ?? null,
        lastActivityAt: t.lastActivityAt,
        ticket: t.ticket ?? null,
      }},
      { upsert: true, new: true },
    );
    count++;
  }
  logger.info('seeded housekeeping tasks', { count });
}

async function seedActivityLogs(
  roomIds: Map<string, string>,
  reservationIds: Map<string, string>,
): Promise<void> {
  let count = 0;
  for (const a of activityLogData) {
    let entityId: string;
    if (a.entityType === 'room') {
      entityId = roomIds.get(a.entityRef) ?? '';
    } else if (a.entityType === 'reservation') {
      entityId = reservationIds.get(a.entityRef) ?? '';
    } else {
      entityId = a.entityRef;
    }
    if (!entityId) throw new Error(`Entity not found for activity: ${a.entityType}/${a.entityRef}`);

    await ActivityLog.findOneAndUpdate(
      { entityType: a.entityType, entityId, action: a.action, createdAt: a.createdAt },
      { $setOnInsert: {
        entityType: a.entityType,
        entityId,
        action: a.action,
        title: a.title,
        description: a.description,
        meta: a.meta ?? {},
        createdAt: a.createdAt,
      }},
      { upsert: true, new: true },
    );
    count++;
  }
  logger.info('seeded activity logs', { count });
}

async function seedCounters(): Promise<void> {
  let count = 0;
  for (const c of counterData) {
    await Counter.findOneAndUpdate(
      { key: c.key },
      { $setOnInsert: { key: c.key, seq: c.seq } },
      { upsert: true, new: true },
    );
    count++;
  }
  logger.info('seeded counters', { count });
}

/* ------------------------------------------------------------------ */
/*  Main orchestrator                                                  */
/* ------------------------------------------------------------------ */

export async function seed(fresh = false): Promise<void> {
  validateSeedPasswords();

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required for seeding');

  const conn = await mongoose.connect(uri);
  logger.info('connected to MongoDB for seeding');

  if (fresh) {
    logger.info('fresh mode — dropping seeded collections');
    await dropSeededCollections();
  }

  await seedHotel();
  const userIds = await seedUsers();
  const roomTypeIds = await seedRoomTypes();
  const roomIds = await seedRooms(roomTypeIds);
  const guestIds = await seedGuests();
  const reservationIds = await seedReservations(guestIds, roomTypeIds, roomIds, userIds);
  const folioIds = await seedFolios(reservationIds, guestIds);
  await seedPayments(folioIds, userIds);
  await seedInvoices(folioIds, guestIds);
  await seedHousekeepingTasks(roomIds, userIds);
  await seedActivityLogs(roomIds, reservationIds);
  await seedCounters();

  const counts = {
    hotel: 1,
    users: userData.length,
    roomTypes: roomTypeData.length,
    rooms: roomData.length,
    guests: guestData.length,
    reservations: reservationData.length,
    folios: checkoutSessionData.length,
    payments: paymentData.length,
    invoices: invoiceData.length,
    housekeepingTasks: housekeepingData.length,
    activityLogs: activityLogData.length,
    counters: counterData.length,
  };

  logger.info('seed complete', counts);
  console.log('\nSeed summary:');
  console.log('  Hotel:', counts.hotel);
  console.log('  Users:', counts.users);
  console.log('  Room Types:', counts.roomTypes);
  console.log('  Rooms:', counts.rooms);
  console.log('  Guests:', counts.guests);
  console.log('  Reservations:', counts.reservations);
  console.log('  Folios:', counts.folios);
  console.log('  Payments:', counts.payments);
  console.log('  Invoices:', counts.invoices);
  console.log('  Housekeeping Tasks:', counts.housekeepingTasks);
  console.log('  Activity Logs:', counts.activityLogs);
  console.log('  Counters:', counts.counters);

  await conn.disconnect();
}

/* ------------------------------------------------------------------ */
/*  CLI entry point                                                    */
/* ------------------------------------------------------------------ */

const fresh = process.argv.includes('--fresh');

seed(fresh).catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
