import { Schema, model } from 'mongoose';
import mongoose from 'mongoose';

const ExchangeSchema = new Schema({
    userMessage: { type: String, required: true },
    assistantMessage: { type: String, required: true },
    additionalData: { type: Schema.Types.Mixed }
});

const ChatSchema = new Schema({
    type: { type: String, required: true },
    name: { type: String, required: true },
    tone: { type: String, required: true },
    instructions: { type: String, default: '' },
    notes: { type: String, default: '' },
    tokens: { type: Number, required: true },
    temperature: { type: Number, required: true, default: 0.5 },
    topP: { type: Number, required: true, default: 0.5 },
    model: { type: String, required: true },
    systemMessage: { type: String, required: true },
    lastActivity: { type: Date, default: Date.now, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },
    exchanges: [ExchangeSchema],
    undoStack: [ExchangeSchema]
});

export default model('Chat', ChatSchema);