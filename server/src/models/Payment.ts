import { Schema, model } from 'mongoose';
import { PAYMENT_METHODS, PAYMENT_STATUSES } from './enums';

const paymentSchema = new Schema({
  folioId:       { type: Schema.Types.ObjectId, ref: 'Folio', required: true },
  amountCents:   { type: Number, required: true },
  method:        { type: String, enum: PAYMENT_METHODS, required: true },
  cardBrand:     { type: String, trim: true },
  cardLast4:     { type: String, trim: true },
  gatewayRef:    { type: String, trim: true },
  status:        { type: String, enum: PAYMENT_STATUSES, default: 'captured' },
  processedBy:   { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

paymentSchema.index({ folioId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

export const Payment = model('Payment', paymentSchema);
