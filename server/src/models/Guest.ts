import { Schema, model } from 'mongoose';
import { MEMBERSHIP_TIERS } from './enums';

const guestSchema = new Schema({
  slug:             { type: String, required: true, unique: true, trim: true },
  firstName:        { type: String, required: true, trim: true },
  lastName:         { type: String, required: true, trim: true },
  email:            { type: String, sparse: true, lowercase: true, trim: true },
  phone:            { type: String, trim: true },
  address: {
    _id: false,
    lines:   [{ type: String, trim: true }],
    city:    { type: String, trim: true },
    country: { type: String, trim: true },
  },
  membershipTier: { type: String, enum: MEMBERSHIP_TIERS, default: 'standard' },
  notes:          { type: String, default: '' },
}, { timestamps: true });

guestSchema.index({ firstName: 'text', lastName: 'text' });

export const Guest = model('Guest', guestSchema);
