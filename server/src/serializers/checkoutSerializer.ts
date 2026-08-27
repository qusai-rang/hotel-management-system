/* eslint-disable @typescript-eslint/no-explicit-any -- Mongoose lean/populate returns untyped shapes */

export interface CheckoutSessionDTO {
  reservation: {
    id: string;
    code: string;
    status: string;
    checkInDate: string;
    checkOutDate: string;
    adults: number;
    children: number;
    ratePerNightCents: number;
    nights: number;
  };
  guest: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: { lines: string[]; city: string | null; country: string | null } | null;
  } | null;
  room: {
    id: string;
    number: string;
    floor: number;
    bedsLabel: string;
    roomType: { id: string; code: string; name: string } | null;
  } | null;
  folio: {
    id: string;
    folioNumber: string;
    status: string;
    charges: {
      description: string;
      department: string;
      quantity: number;
      unitAmountCents: number;
      totalCents: number;
    }[];
    discounts: {
      label: string;
      amountCents: number;
    }[];
    taxRateBps: number;
    computed: {
      subtotalCents: number;
      taxCents: number;
      discountTotalCents: number;
      totalCents: number;
      paidCents: number;
      balanceCents: number;
    };
  } | null;
  payments: {
    id: string;
    amountCents: number;
    method: string;
    status: string;
    createdAt: string;
  }[];
}

export interface CheckoutCompletionDTO {
  reservationCode: string;
  status: string;
  checkedOutAt: string;
  invoiceNumber: string | null;
  folioStatus: string;
  roomNumber: string | null;
  roomStatus: string | null;
}

export function serializeCheckoutSession(
  reservation: any,
  guest: any,
  room: any,
  roomType: any,
  folio: any,
  paidCents: number,
  payments: any[],
): CheckoutSessionDTO {
  const resObj = reservation.toObject ? reservation.toObject() : reservation;
  const guestObj = guest ? (guest.toObject ? guest.toObject() : guest) : null;
  const roomObj = room ? (room.toObject ? room.toObject() : room) : null;
  const rtObj = roomType ? (roomType.toObject ? roomType.toObject() : roomType) : null;
  const folioObj = folio ? (folio.toObject ? folio.toObject() : folio) : null;

  const nights = Math.round(
    (new Date(resObj.checkOutDate).getTime() - new Date(resObj.checkInDate).getTime()) / 86400000,
  );

  // Compute folio totals
  let folioData: CheckoutSessionDTO['folio'] = null;
  if (folioObj) {
    const subtotalCents = (folioObj.charges ?? []).reduce(
      (sum: number, c: any) => sum + c.quantity * c.unitAmountCents, 0,
    );
    const taxCents = Math.round(subtotalCents * (folioObj.taxRateBps / 10000));
    const discountTotalCents = (folioObj.discounts ?? []).reduce(
      (sum: number, d: any) => sum + d.amountCents, 0,
    );
    const totalCents = subtotalCents + taxCents - discountTotalCents;
    const balanceCents = totalCents - paidCents;

    folioData = {
      id: folioObj._id.toString(),
      folioNumber: folioObj.folioNumber,
      status: folioObj.status,
      charges: (folioObj.charges ?? []).map((c: any) => ({
        description: c.description,
        department: c.department,
        quantity: c.quantity,
        unitAmountCents: c.unitAmountCents,
        totalCents: c.quantity * c.unitAmountCents,
      })),
      discounts: (folioObj.discounts ?? []).map((d: any) => ({
        label: d.label,
        amountCents: d.amountCents,
      })),
      taxRateBps: folioObj.taxRateBps,
      computed: { subtotalCents, taxCents, discountTotalCents, totalCents, paidCents, balanceCents },
    };
  }

  return {
    reservation: {
      id: resObj._id.toString(),
      code: resObj.code,
      status: resObj.status,
      checkInDate: new Date(resObj.checkInDate).toISOString(),
      checkOutDate: new Date(resObj.checkOutDate).toISOString(),
      adults: resObj.adults,
      children: resObj.children ?? 0,
      ratePerNightCents: resObj.ratePerNightCents,
      nights,
    },
    guest: guestObj ? {
      id: guestObj._id.toString(),
      name: `${guestObj.firstName} ${guestObj.lastName}`.trim(),
      email: guestObj.email ?? null,
      phone: guestObj.phone ?? null,
      address: guestObj.address ? {
        lines: guestObj.address.lines ?? [],
        city: guestObj.address.city ?? null,
        country: guestObj.address.country ?? null,
      } : null,
    } : null,
    room: roomObj ? {
      id: roomObj._id.toString(),
      number: roomObj.number,
      floor: roomObj.floor,
      bedsLabel: roomObj.bedsLabel,
      roomType: rtObj ? { id: rtObj._id.toString(), code: rtObj.code, name: rtObj.name } : null,
    } : null,
    folio: folioData,
    payments: payments.map(p => ({
      id: p._id.toString(),
      amountCents: p.amountCents,
      method: p.method,
      status: p.status,
      createdAt: p.createdAt?.toISOString?.() ?? '',
    })),
  };
}

export interface CheckoutCompletionDTO {
  reservationCode: string;
  status: string;
  checkedOutAt: string;
  invoiceNumber: string | null;
  folioStatus: string;
  roomNumber: string | null;
  roomStatus: string | null;
}

export function serializeCheckoutCompletion(data: {
  reservationCode: string;
  status: string;
  checkedOutAt: string;
  invoiceNumber: string | null;
  folioStatus: string;
  roomNumber: string | null;
  roomStatus: string | null;
}): CheckoutCompletionDTO {
  return { ...data };
}

export interface InvoiceDTO {
  id: string;
  invoiceNumber: string;
  folioId: string;
  guestId: string | null;
  hotelBlock: {
    name: string;
    addressLines: string[];
    email: string | null;
    phone: string | null;
  };
  billTo: {
    name: string;
    addressLines: string[];
    email: string | null;
  };
  lineItems: {
    description: string;
    subDescription: string | null;
    quantity: number;
    unitAmountCents: number;
    totalCents: number;
  }[];
  subtotalCents: number;
  taxRateBps: number;
  taxCents: number;
  discountTotalCents: number;
  totalCents: number;
  amountPaidCents: number;
  balanceDueCents: number;
  issueDate: string;
  dueDate: string;
  status: string;
  createdAt: string;
}

export function serializeInvoice(doc: any): InvoiceDTO {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id.toString(),
    invoiceNumber: obj.invoiceNumber,
    folioId: obj.folioId?._id?.toString?.() ?? obj.folioId?.toString?.() ?? obj.folioId,
    guestId: obj.guestId?._id?.toString?.() ?? obj.guestId?.toString?.() ?? null,
    hotelBlock: {
      name: obj.hotelBlock?.name ?? '',
      addressLines: obj.hotelBlock?.addressLines ?? [],
      email: obj.hotelBlock?.email ?? null,
      phone: obj.hotelBlock?.phone ?? null,
    },
    billTo: {
      name: obj.billTo?.name ?? '',
      addressLines: obj.billTo?.addressLines ?? [],
      email: obj.billTo?.email ?? null,
    },
    lineItems: (obj.lineItems ?? []).map((li: any) => ({
      description: li.description,
      subDescription: li.subDescription ?? null,
      quantity: li.quantity,
      unitAmountCents: li.unitAmountCents,
      totalCents: li.quantity * li.unitAmountCents,
    })),
    subtotalCents: obj.subtotalCents,
    taxRateBps: obj.taxRateBps,
    taxCents: obj.taxCents,
    discountTotalCents: obj.discountTotalCents,
    totalCents: obj.totalCents,
    amountPaidCents: obj.amountPaidCents,
    balanceDueCents: obj.balanceDueCents,
    issueDate: obj.issueDate?.toISOString?.() ?? '',
    dueDate: obj.dueDate?.toISOString?.() ?? '',
    status: obj.status,
    createdAt: obj.createdAt?.toISOString?.() ?? '',
  };
}
