/* eslint-disable @typescript-eslint/no-explicit-any -- Mongoose aggregate returns untyped shapes */
import { Room } from '../models/Room';
import { Reservation } from '../models/Reservation';
import { Payment } from '../models/Payment';
import { Folio } from '../models/Folio';
import { HousekeepingTask } from '../models/HousekeepingTask';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function todayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

/* ------------------------------------------------------------------ */
/*  Dashboard summary                                                  */
/* ------------------------------------------------------------------ */

export async function getDashboardSummary() {
  const { start: todayStart, end: todayEnd } = todayRange();

  const [
    roomStats,
    todayCheckIns,
    todayCheckOuts,
    upcomingReservations,
    recentBookings,
    todayPayments,
    mtdRevenue,
    openBalance,
    todayHkTasks,
  ] = await Promise.all([
    // Room occupancy breakdown
    Room.aggregate([
      {
        $facet: {
          byOccupancy: [
            { $group: { _id: '$occupancyStatus', count: { $sum: 1 } } },
          ],
          byHousekeeping: [
            { $group: { _id: '$housekeepingStatus', count: { $sum: 1 } } },
          ],
          total: [
            { $count: 'count' },
          ],
        },
      },
    ]),

    // Today's arrivals (confirmed reservations checking in today)
    Reservation.countDocuments({
      status: 'confirmed',
      checkInDate: { $gte: todayStart, $lt: todayEnd },
    }),

    // Today's departures (checked-in reservations checking out today)
    Reservation.countDocuments({
      status: 'checked_in',
      checkOutDate: { $gte: todayStart, $lt: todayEnd },
    }),

    // Upcoming reservations (confirmed/pending after today)
    Reservation.countDocuments({
      status: { $in: ['confirmed', 'pending'] },
      checkInDate: { $gte: todayEnd },
    }),

    // Recent bookings (newest 5)
    Reservation.find()
      .populate('guestId', 'firstName lastName')
      .populate('roomTypeId', 'code name')
      .populate('roomId', 'number')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),

    // Today's captured payments
    Payment.aggregate([
      { $match: { status: 'captured', amountCents: { $gt: 0 }, createdAt: { $gte: todayStart, $lt: todayEnd } } },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amountCents' } } },
    ]),

    // MTD revenue
    Payment.aggregate([
      { $match: { status: 'captured', amountCents: { $gt: 0 }, createdAt: { $gte: new Date(todayStart.getFullYear(), todayStart.getMonth(), 1) } } },
      { $group: { _id: null, total: { $sum: '$amountCents' } } },
    ]),

    // Outstanding open-folio balance
    Folio.aggregate([
      { $match: { status: 'open' } },
      {
        $lookup: {
          from: 'payments',
          let: { fid: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$folioId', '$$fid'] }, status: 'captured' } },
            { $group: { _id: null, total: { $sum: '$amountCents' } } },
          ],
          as: 'pays',
        },
      },
      {
        $addFields: {
          paidCents: { $ifNull: [{ $arrayElemAt: ['$pays.total', 0] }, 0] },
          sub: {
            $reduce: {
              input: '$charges',
              initialValue: 0,
              in: { $add: ['$$value', { $multiply: ['$$this.quantity', '$$this.unitAmountCents'] }] },
            },
          },
          disc: {
            $reduce: {
              input: '$discounts',
              initialValue: 0,
              in: { $add: ['$$value', '$$this.amountCents'] },
            },
          },
        },
      },
      {
        $addFields: {
          tax: { $round: [{ $multiply: ['$sub', { $divide: ['$taxRateBps', 10000] }] }, 0] },
        },
      },
      {
        $addFields: {
          total: { $subtract: [{ $add: ['$sub', '$tax'] }, '$disc'] },
        },
      },
      {
        $addFields: {
          bal: { $subtract: ['$total', '$paidCents'] },
        },
      },
      { $group: { _id: null, total: { $sum: '$bal' } } },
    ]),

    // Today's housekeeping tasks
    HousekeepingTask.countDocuments({
      lastActivityAt: { $gte: todayStart, $lt: todayEnd },
    }),
  ]);

  // Parse room stats
  const roomData = roomStats[0] || { byOccupancy: [], byHousekeeping: [], total: [] };
  const totalRooms = roomData.total[0]?.count ?? 0;

  const occMap: Record<string, number> = {};
  for (const r of roomData.byOccupancy) occMap[r._id] = r.count;

  const hkMap: Record<string, number> = {};
  for (const r of roomData.byHousekeeping) hkMap[r._id] = r.count;

  const occupiedRooms = occMap.occupied ?? 0;
  const vacantRooms = occMap.vacant ?? 0;
  const dirtyRooms = hkMap.dirty ?? 0;
  const cleaningRooms = hkMap.cleaning ?? 0;
  const needsInspectionRooms = hkMap.needs_inspection ?? 0;
  const maintenanceRooms = hkMap.out_of_order ?? 0;
  const availableRooms = Math.max(0, vacantRooms - dirtyRooms - cleaningRooms - needsInspectionRooms - maintenanceRooms);

  // Parse payments
  const todayPayData = todayPayments[0] ?? { count: 0, total: 0 };
  const mtdRevData = mtdRevenue[0] ?? { total: 0 };
  const openBalData = openBalance[0] ?? { total: 0 };

  // Serialize recent bookings
  const bookings = recentBookings.map((r: any) => {
    const guest = r.guestId;
    const rt = r.roomTypeId;
    const room = r.roomId;
    return {
      id: r._id.toString(),
      code: r.code,
      guestName: guest ? `${guest.firstName} ${guest.lastName}`.trim() : '',
      roomType: rt?.name ?? '',
      roomNumber: room?.number ?? '',
      checkInDate: r.checkInDate?.toISOString?.() ?? '',
      checkOutDate: r.checkOutDate?.toISOString?.() ?? '',
      status: r.status,
      createdAt: r.createdAt?.toISOString?.() ?? '',
    };
  });

  return {
    occupancy: {
      totalRooms,
      occupiedRooms,
      vacantRooms,
      availableRooms,
      dirtyRooms,
      cleaningRooms,
      needsInspectionRooms,
      maintenanceRooms,
      occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
    },
    today: {
      arrivals: todayCheckIns,
      departures: todayCheckOuts,
      housekeepingTasks: todayHkTasks,
    },
    upcoming: upcomingReservations,
    recentBookings: bookings,
    revenue: {
      todayCapturedCents: todayPayData.total,
      todayPaymentCount: todayPayData.count,
      mtdRevenueCents: mtdRevData.total,
      outstandingBalanceCents: Math.max(0, openBalData.total),
    },
  };
}
