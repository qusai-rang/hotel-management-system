import { Schema, model } from 'mongoose';
import { OCCUPANCY_STATUSES, HOUSEKEEPING_STATUSES } from './enums';

const roomSchema = new Schema({
  number:                  { type: String, required: true, unique: true, trim: true },
  floor:                   { type: Number, required: true },
  roomTypeId:              { type: Schema.Types.ObjectId, ref: 'RoomType', required: true },
  capacityAdults:          { type: Number, required: true, min: 1 },
  capacityChildren:        { type: Number, min: 0 },
  bedsLabel:               { type: String, required: true },
  sizeSqft:                { type: Number, min: 0 },
  rateOverrideCents:       { type: Number, min: 0 },
  occupancyStatus:         { type: String, enum: OCCUPANCY_STATUSES, default: 'vacant' },
  housekeepingStatus:      { type: String, enum: HOUSEKEEPING_STATUSES, default: 'clean' },
  currentReservationId:    { type: Schema.Types.ObjectId, ref: 'Reservation' },
  priorityNote:            { type: String },
  cleanedAt:               { type: Date },
}, { timestamps: true });

roomSchema.index({ floor: 1, occupancyStatus: 1 });
roomSchema.index({ roomTypeId: 1 });

export const Room = model('Room', roomSchema);
