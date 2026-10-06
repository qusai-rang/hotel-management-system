import { Schema, model } from 'mongoose';

const roomTypeSchema = new Schema({
  code:                     { type: String, required: true, unique: true, trim: true },
  name:                     { type: String, required: true, trim: true },
  description:              { type: String, default: '' },
  basePricePerNightCents:   { type: Number, required: true, min: 0 },
  maxGuests:                { type: Number, required: true, min: 1 },
  bedLabel:                 { type: String, required: true },
  sizeSqft:                 { type: Number, min: 0 },
  amenities: [{
    _id: false,
    iconName: { type: String, required: true },
    label:    { type: String, required: true },
  }],
  accentColor: { type: String, trim: true },
  depositRatio: { type: Number, min: 0, max: 1, default: 0.5 },
}, { timestamps: true });

export const RoomType = model('RoomType', roomTypeSchema);
