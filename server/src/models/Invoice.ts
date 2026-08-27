import { Schema, model } from 'mongoose';
import { INVOICE_STATUSES } from './enums';

const invoiceLineItemSchema = new Schema({
  description:     { type: String, required: true, trim: true },
  subDescription:  { type: String, trim: true },
  quantity:        { type: Number, required: true, min: 1 },
  unitAmountCents: { type: Number, required: true, min: 0 },
}, { _id: false });

const invoiceSchema = new Schema({
  invoiceNumber:  { type: String, required: true, unique: true, trim: true },
  folioId:        { type: Schema.Types.ObjectId, ref: 'Folio', required: true },
  guestId:        { type: Schema.Types.ObjectId, ref: 'Guest' },
  hotelBlock: {
    _id: false,
    name:         { type: String, trim: true },
    addressLines: [{ type: String, trim: true }],
    email:        { type: String, trim: true },
    phone:        { type: String, trim: true },
  },
  billTo: {
    _id: false,
    name:         { type: String, trim: true },
    addressLines: [{ type: String, trim: true }],
    email:        { type: String, trim: true },
  },
  lineItems:         [invoiceLineItemSchema],
  subtotalCents:     { type: Number, required: true, min: 0 },
  taxRateBps:        { type: Number, required: true, min: 0 },
  taxCents:          { type: Number, required: true, min: 0 },
  discountTotalCents:{ type: Number, required: true, min: 0 },
  totalCents:        { type: Number, required: true, min: 0 },
  amountPaidCents:   { type: Number, required: true, min: 0 },
  balanceDueCents:   { type: Number, required: true, min: 0 },
  issueDate:         { type: Date, required: true },
  dueDate:           { type: Date, required: true },
  status:            { type: String, enum: INVOICE_STATUSES, default: 'issued' },
}, { timestamps: true });

invoiceSchema.index({ folioId: 1 });
invoiceSchema.index({ guestId: 1, issueDate: -1 });

export const Invoice = model('Invoice', invoiceSchema);
