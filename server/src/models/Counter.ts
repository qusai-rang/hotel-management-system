import { Schema, model } from 'mongoose';

const counterSchema = new Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, required: true, default: 0 },
});

export const Counter = model('Counter', counterSchema);
