import { Schema, model } from 'mongoose';
import mongoose from 'mongoose';

const templateSchema = new Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, required: true },
  tone: { type: String, default: '' },
  model: { type: String, default: '' },
  instructions: { type: String, default: '' },
  notes: { type: String, default: '' },
});

export default model('Template', templateSchema);