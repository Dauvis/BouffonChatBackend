import { Schema, model } from 'mongoose';
import mongoose from 'mongoose';

const ToolCallSchema = new Schema({
    toolCallId: { type: String, required: true },
    callArgs: { type: Object, default: '' },
    callFunction: { type: String, required: true },
    callResult: { type: Object, default: '' }
});

const ToolCallCollectionSchema = new Schema({
    assistantMessage: { type: String, required: true },
    toolCalls: [ToolCallSchema]
});

const ExchangeSchema = new Schema({
    userMessage: { type: String, required: true },
    assistantMessage: { type: String, required: true },
    toolCallsCollections: [ToolCallCollectionSchema]
});

const ChatSchema = new Schema({
    type: { type: String, required: true },
    name: { type: String, required: true },
    tone: { type: String, required: true },
    instructions: { type: String, default: '' },
    notes: { type: String, default: '' },
    tokens: { type: Number, required: true },
    model: { type: String, required: true },
    systemMessage: { type: String, required: true },
    lastActivity: { type: Date, default: Date.now },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
    exchanges: [ExchangeSchema]
});

export default model('Chat', ChatSchema);