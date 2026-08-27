/* eslint-disable @typescript-eslint/no-explicit-any -- Mongoose documents are untyped after .lean() */

export interface FolioDTO {
  id: string;
  folioNumber: string;
  reservationId: string;
  guestId: string;
  charges: {
    description: string;
    department: string;
    quantity: number;
    unitAmountCents: number;
    totalCents: number;
    postedAt: string;
    postedBy: string | null;
  }[];
  discounts: {
    label: string;
    amountCents: number;
  }[];
  taxRateBps: number;
  status: string;
  computed: {
    subtotalCents: number;
    taxCents: number;
    discountTotalCents: number;
    totalCents: number;
    paidCents: number;
    balanceCents: number;
  };
  createdAt: string;
}

export function serializeFolio(doc: any, paidCents: number): FolioDTO {
  const obj = doc.toObject ? doc.toObject() : doc;

  const subtotalCents = (obj.charges ?? []).reduce(
    (sum: number, c: any) => sum + c.quantity * c.unitAmountCents, 0,
  );
  const taxCents = Math.round(subtotalCents * (obj.taxRateBps / 10000));
  const discountTotalCents = (obj.discounts ?? []).reduce(
    (sum: number, d: any) => sum + d.amountCents, 0,
  );
  const totalCents = subtotalCents + taxCents - discountTotalCents;
  const balanceCents = totalCents - paidCents;

  return {
    id: obj._id.toString(),
    folioNumber: obj.folioNumber,
    reservationId: obj.reservationId?.toString?.() ?? obj.reservationId,
    guestId: obj.guestId?.toString?.() ?? obj.guestId,
    charges: (obj.charges ?? []).map((c: any) => ({
      description: c.description,
      department: c.department,
      quantity: c.quantity,
      unitAmountCents: c.unitAmountCents,
      totalCents: c.quantity * c.unitAmountCents,
      postedAt: c.postedAt?.toISOString?.() ?? c.postedAt ?? '',
      postedBy: c.postedBy?.toString?.() ?? null,
    })),
    discounts: (obj.discounts ?? []).map((d: any) => ({
      label: d.label,
      amountCents: d.amountCents,
    })),
    taxRateBps: obj.taxRateBps,
    status: obj.status,
    computed: { subtotalCents, taxCents, discountTotalCents, totalCents, paidCents, balanceCents },
    createdAt: obj.createdAt?.toISOString?.() ?? obj.createdAt ?? '',
  };
}
