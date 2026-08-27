import { Schema, model } from 'mongoose';
import { ACTIVITY_ENTITY_TYPES } from './enums';

const activityLogSchema = new Schema({
  actorId:    { type: Schema.Types.ObjectId, ref: 'User' },
  entityType: { type: String, enum: ACTIVITY_ENTITY_TYPES, required: true },
  entityId:   { type: Schema.Types.ObjectId, required: true },
  action:     { type: String, required: true, trim: true },
  title:      { type: String, required: true, trim: true },
  description:{ type: String, default: '' },
  meta:       { type: Schema.Types.Mixed, default: () => ({}) },
}, { timestamps: true });

activityLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

export const ActivityLog = model('ActivityLog', activityLogSchema);
