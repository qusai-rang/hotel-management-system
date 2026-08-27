/* eslint-disable @typescript-eslint/no-explicit-any -- Mongoose documents are untyped after .lean() */

export interface PaymentDTO {
  id: string;
  folioId: string;
  amountCents: number;
  method: string;
  cardBrand: string | null;
  cardLast4: string | null;
  gatewayRef: string | null;
  status: string;
  processedBy: string | null;
  createdAt: string;
}

export function serializePayment(doc: any): PaymentDTO {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id.toString(),
    folioId: obj.folioId?.toString?.() ?? obj.folioId,
    amountCents: obj.amountCents,
    method: obj.method,
    cardBrand: obj.cardBrand ?? null,
    cardLast4: obj.cardLast4 ?? null,
    gatewayRef: obj.gatewayRef ?? null,
    status: obj.status,
    processedBy: obj.processedBy?.toString?.() ?? null,
    createdAt: obj.createdAt?.toISOString?.() ?? obj.createdAt ?? '',
  };
}
