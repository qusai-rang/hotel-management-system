import { Schema, model } from 'mongoose';

const hotelSchema = new Schema({
  name:           { type: String, required: true, trim: true },
  brandName:      { type: String, required: true, trim: true },
  addressLines:   [{ type: String, trim: true }],
  contact: {
    _id: false,
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
  },
  finance: {
    _id: false,
    iban:         { type: String, trim: true },
    paymentNotes: { type: String, trim: true },
  },
  policies: {
    _id: false,
    checkInTime:  { type: String, default: '15:00' },
    checkOutTime: { type: String, default: '11:00' },
    taxRateBps:   { type: Number, required: true, min: 0 },
    currency:     { type: String, default: 'USD' },
    dueDays:      { type: Number, default: 14, min: 0 },
  },
  floors: [{
    _id: false,
    number: { type: Number, required: true },
    label:  { type: String, required: true, trim: true },
  }],
}, { timestamps: true });

export const Hotel = model('Hotel', hotelSchema);
