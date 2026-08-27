import { Schema, model } from 'mongoose';
import { RESERVATION_STATUSES } from './enums';

const specialRequestSchema = new Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  iconName:    { type: String, trim: true },
  dueAt:       { type: Date },
}, { _id: false });

const reservationSchema = new Schema({
  code:              { type: String, required: true, unique: true, trim: true },
  guestId:           { type: Schema.Types.ObjectId, ref: 'Guest', required: true },
  roomTypeId:        { type: Schema.Types.ObjectId, ref: 'RoomType', required: true },
  roomId:            { type: Schema.Types.ObjectId, ref: 'Room' },
  status:            { type: String, enum: RESERVATION_STATUSES, default: 'pending' },
  checkInDate:       { type: Date, required: true },
  checkOutDate:      { type: Date, required: true },
  adults:            { type: Number, required: true, min: 1 },
  children:          { type: Number, default: 0, min: 0 },
  specialRequests:   [specialRequestSchema],
  ratePerNightCents: { type: Number, required: true, min: 0 },
  taxRateBps:        { type: Number, required: true, min: 0 },
  depositCents:      { type: Number, required: true, min: 0 },
  source:            { type: String, required: true, trim: true },
  createdBy:         { type: Schema.Types.ObjectId, ref: 'User', required: true },
  checkedInAt:       { type: Date },
  checkedOutAt:      { type: Date },
}, { timestamps: true });

reservationSchema.index({ guestId: 1, checkInDate: -1 });
reservationSchema.index({ status: 1, checkInDate: 1 });
reservationSchema.index({ roomId: 1, status: 1, checkInDate: 1, checkOutDate: 1 });

export const Reservation = model('Reservation', reservationSchema);
