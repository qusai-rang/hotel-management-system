import { Schema, model } from 'mongoose';
import { USER_ROLES } from './enums';

const userSchema = new Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role:         { type: String, enum: USER_ROLES, required: true },
  active:       { type: Boolean, default: true },
  lastLoginAt:  { type: Date },
}, { timestamps: true });

export const User = model('User', userSchema);
