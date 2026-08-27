/* eslint-disable @typescript-eslint/no-explicit-any -- Mongoose aggregate returns untyped shapes */
import { Payment } from '../models/Payment';
import { Folio } from '../models/Folio';
import { serializeBillingTransaction } from '../serializers/billingSerializer';
import type { BillingTransactionQuery } from '../validation/billingSchemas';

/* ------------------------------------------------------------------ */
/*  Transactions list                                                  */
/* ------------------------------------------------------------------ */

export async function listTransactions(query: BillingTransactionQuery) {
  const { q, status, department, from, to, page, pageSize } = query;

  // Build match stage
  const match: any = {};
  if (status) match.status = status;

  // Date filter on payment createdAt
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);
  }

  // Department filter requires joining via folio charges
  // For simplicity, we filter at payment level and post-filter department if needed
  const pipeline: any[] = [
    { $match: match },
    {
      $lookup: {
        from: 'folios',
        localField: 'folioId',
        foreignField: '_id',
        as: 'folioDoc',
      },
    },
    { $unwind: '$folioDoc' },
    {
      $lookup: {
        from: 'reservations',
        localField: 'folioDoc.reservationId',
        foreignField: '_id',
        as: 'reservationDoc',
      },
    },
    { $unwind: { path: '$reservationDoc', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'guests',
        localField: 'folioDoc.guestId',
        foreignField: '_id',
        as: 'guestDoc',
      },
    },
    { $unwind: { path: '$guestDoc', preserveNullAndEmptyArrays: true } },
  ];

  // Text search on guest name, folio number, reservation code
  if (q) {
    const regex = new RegExp(q, 'i');
    pipeline.push({
      $match: {
        $or: [
          { 'guestDoc.firstName': regex },
          { 'guestDoc.lastName': regex },
          { 'folioDoc.folioNumber': regex },
          { 'reservationDoc.code': regex },
        ],
      },
    });
  }

  // Department filter on charges within the folio
  if (department) {
    pipeline.push({
      $match: {
        'folioDoc.charges': {
          $elemMatch: { department },
        },
      },
    });
  }

  // Get total count before pagination
  const countPipeline = [...pipeline, { $count: 'total' }];

  // Add sort + pagination
  pipeline.push(
    { $sort: { createdAt: -1 } },
    { $skip: (page - 1) * pageSize },
    { $limit: pageSize },
    {
      $project: {
        _id: 1,
        amountCents: 1,
        method: 1,
        status: 1,
        createdAt: 1,
        description: {
          $let: {
            vars: { firstCharge: { $arrayElemAt: ['$folioDoc.charges', 0] } },
            in: '$$firstCharge.description',
          },
        },
        department: {
          $let: {
            vars: { firstCharge: { $arrayElemAt: ['$folioDoc.charges', 0] } },
            in: '$$firstCharge.department',
          },
        },
        folioId: '$folioDoc._id',
        folioNumber: '$folioDoc.folioNumber',
        guestId: '$guestDoc._id',
        guestName: {
          $concat: ['$guestDoc.firstName', ' ', '$guestDoc.lastName'],
        },
        reservationCode: '$reservationDoc.code',
      },
    },
  );

  const [countResult, docs] = await Promise.all([
    Payment.aggregate(countPipeline),
    Payment.aggregate(pipeline),
  ]);

  const total = countResult[0]?.total ?? 0;
  const items = docs.map((d: any) => {
    const obj = {
      _id: d._id,
      folioId: { _id: d.folioId, folioNumber: d.folioNumber },
      reservationId: { code: d.reservationCode },
      guestId: { firstName: d.guestName?.split(' ')[0] ?? '', lastName: d.guestName?.split(' ').slice(1).join(' ') ?? '' },
      description: d.description ?? '',
      department: d.department ?? '',
      amountCents: d.amountCents,
      method: d.method,
      status: d.status,
      createdAt: d.createdAt,
    };
    return serializeBillingTransaction(obj);
  });

  return { items, total, page, pageSize };
}

/* ------------------------------------------------------------------ */
/*  Billing metrics                                                    */
/* ------------------------------------------------------------------ */

export async function getBillingMetrics() {
  const now = new Date();
  const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [mtdRevenue, pendingBalance, todayPayments, mtdRefunds] = await Promise.all([
    // MTD captured revenue
    Payment.aggregate([
      { $match: { status: 'captured', amountCents: { $gt: 0 }, createdAt: { $gte: mtdStart } } },
      { $group: { _id: null, total: { $sum: '$amountCents' } } },
    ]),
    // Pending/open balance across all open folios
    Folio.aggregate([
      { $match: { status: 'open' } },
      {
        $lookup: {
          from: 'payments',
          let: { folioId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$folioId', '$$folioId'] }, status: 'captured' } },
            { $group: { _id: null, total: { $sum: '$amountCents' } } },
          ],
          as: 'payments',
        },
      },
      {
        $addFields: {
          paidCents: { $ifNull: [{ $arrayElemAt: ['$payments.total', 0] }, 0] },
          subtotalCents: {
            $reduce: {
              input: '$charges',
              initialValue: 0,
              in: { $add: ['$$value', { $multiply: ['$$this.quantity', '$$this.unitAmountCents'] }] },
            },
          },
          discountTotalCents: {
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
          taxCents: { $round: [{ $multiply: ['$subtotalCents', { $divide: ['$taxRateBps', 10000] }] }, 0] },
        },
      },
      {
        $addFields: {
          totalCents: { $subtract: [{ $add: ['$subtotalCents', '$taxCents'] }, '$discountTotalCents'] },
        },
      },
      {
        $addFields: {
          balanceCents: { $subtract: ['$totalCents', '$paidCents'] },
        },
      },
      { $group: { _id: null, totalBalance: { $sum: '$balanceCents' } } },
    ]),
    // Today's payment count and value
    Payment.aggregate([
      { $match: { status: 'captured', createdAt: { $gte: todayStart } } },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amountCents' } } },
    ]),
    // MTD refunds
    Payment.aggregate([
      { $match: { status: 'captured', amountCents: { $lt: 0 }, createdAt: { $gte: mtdStart } } },
      { $group: { _id: null, total: { $sum: { $abs: '$amountCents' } } } },
    ]),
  ]);

  return {
    mtdCapturedRevenueCents: mtdRevenue[0]?.total ?? 0,
    pendingOpenBalanceCents: Math.max(0, pendingBalance[0]?.totalBalance ?? 0),
    todayPaymentCount: todayPayments[0]?.count ?? 0,
    todayPaymentValueCents: todayPayments[0]?.total ?? 0,
    mtdRefundsCents: mtdRefunds[0]?.total ?? 0,
  };
}
