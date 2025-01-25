import mongoose from 'mongoose';
import { Schema, model } from 'mongoose';

const profileSchema = new Schema({
  googleId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  defaultInstructions: { type: String, default: '' },
  defaultTone: { type: String, default: '' },
  defaultModel: { type: String, default: '' },
  refreshToken: { type: String, default: ''},
  status: { type: String, default: 'inactive'},
  templateMRU: [ mongoose.Schema.Types.Mixed ],
});

export default model('Profile', profileSchema);