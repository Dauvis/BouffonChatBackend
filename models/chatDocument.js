import { Schema, model } from 'mongoose';
import mongoose from 'mongoose';

const ToolCallSchema = new Schema({
    toolCallId: { type: String, required: true },
    callArgs: { type: Object, default: '' },
    callFunction: { type: String, required: true },
    callResult: { type: Object, default: '' }
}, {_id: false });

const ToolCallRecordSchema = new Schema({
    assistantMessage: { type: String, required: true },
    toolCalls: [ToolCallSchema]
}, {_id: false });

const GPTRecordSchema = new Schema({
    toolCallCollection: [ToolCallRecordSchema]
}, {_id: false })

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
    model: { type: String, required: true },
    systemMessage: { type: String, required: true },
    lastActivity: { type: Date, default: Date.now },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
    exchanges: [ExchangeSchema],
    undoStack: [ExchangeSchema]
});

export default model('Chat', ChatSchema);