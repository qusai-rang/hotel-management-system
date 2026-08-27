import { Schema, model } from 'mongoose';
import { HK_CONTEXTS, HK_TASK_TYPES, HK_TASK_STATUSES } from './enums';

const ticketSchema = new Schema({
  title:              { type: String, trim: true },
  reportedAt:         { type: Date },
  assignedTeamLabel:  { type: String, trim: true },
  estimatedFixAt:     { type: Date },
}, { _id: false });

const housekeepingTaskSchema = new Schema({
  roomId:                    { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  context:                   { type: String, enum: HK_CONTEXTS, required: true },
  type:                      { type: String, enum: HK_TASK_TYPES, required: true },
  status:                    { type: String, enum: HK_TASK_STATUSES, default: 'dirty' },
  assigneeId:                { type: Schema.Types.ObjectId, ref: 'User' },
  progressPercent:           { type: Number, default: 0, min: 0, max: 100 },
  estimateCompletionAt:      { type: Date },
  lastActivityAt:            { type: Date, default: () => new Date() },
  ticket:                    ticketSchema,
}, { timestamps: true });

housekeepingTaskSchema.index({ status: 1, context: 1 });
housekeepingTaskSchema.index({ assigneeId: 1, status: 1 });
housekeepingTaskSchema.index({ roomId: 1, lastActivityAt: -1 });

export const HousekeepingTask = model('HousekeepingTask', housekeepingTaskSchema);
