import { Schema, model } from 'mongoose';
import { CHARGE_DEPARTMENTS, FOLIO_STATUSES } from './enums';

const chargeSchema = new Schema({
  description:     { type: String, required: true, trim: true },
  department:      { type: String, enum: CHARGE_DEPARTMENTS, required: true },
  quantity:        { type: Number, required: true, min: 1 },
  unitAmountCents: { type: Number, required: true, min: 0 },
  postedAt:        { type: Date, default: () => new Date() },
  postedBy:        { type: Schema.Types.ObjectId, ref: 'User' },
}, { _id: false });

const discountSchema = new Schema({
  label:       { type: String, required: true, trim: true },
  amountCents: { type: Number, required: true, min: 0 },
}, { _id: false });

const folioSchema = new Schema({
  folioNumber:    { type: String, required: true, unique: true, trim: true },
  reservationId:  { type: Schema.Types.ObjectId, ref: 'Reservation', required: true, unique: true },
  guestId:        { type: Schema.Types.ObjectId, ref: 'Guest', required: true },
  charges:        [chargeSchema],
  discounts:      [discountSchema],
  taxRateBps:     { type: Number, required: true, min: 0 },
  status:         { type: String, enum: FOLIO_STATUSES, default: 'open' },
}, { timestamps: true });

export const Folio = model('Folio', folioSchema);
