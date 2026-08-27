/* eslint-disable @typescript-eslint/no-explicit-any -- Mongoose aggregate returns untyped shapes */

export interface BillingTransactionRow {
  id: string;
  folioId: string;
  folioNumber: string;
  guestName: string;
  guestId: string;
  reservationCode: string;
  description: string;
  department: string;
  amountCents: number;
  method: string;
  status: string;
  createdAt: string;
}

export function serializeBillingTransaction(doc: any): BillingTransactionRow {
  const obj = doc.toObject ? doc.toObject() : doc;
  const folio = obj.folioId ?? {};
  const reservation = folio.reservationId ?? {};
  const guest = folio.guestId ?? {};

  return {
    id: obj._id.toString(),
    folioId: folio._id?.toString?.() ?? '',
    folioNumber: folio.folioNumber ?? '',
    guestName: guest.firstName ? `${guest.firstName} ${guest.lastName}`.trim() : '',
    guestId: guest._id?.toString?.() ?? '',
    reservationCode: reservation.code ?? '',
    description: obj.description ?? '',
    department: obj.department ?? '',
    amountCents: obj.amountCents,
    method: obj.method,
    status: obj.status,
    createdAt: obj.createdAt?.toISOString?.() ?? obj.createdAt ?? '',
  };
}

export interface BillingMetrics {
  mtdCapturedRevenueCents: number;
  pendingOpenBalanceCents: number;
  todayPaymentCount: number;
  todayPaymentValueCents: number;
  mtdRefundsCents: number;
}
