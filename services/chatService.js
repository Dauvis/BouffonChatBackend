import Chat from '../models/chatDocument.js';
import mongoose from 'mongoose';
import logger from "../services/loggingService.js";
import systemMessageService from "../services/systemMessageService.js";

/**
 * Create a new chat document
 * @param {Object} newChatData - data for the new chat document
 * @returns {Promise<Object>} - newly created chat document
 */
async function createChat(profileId, chatParameters) {
    try {
        const newChatData = {
            owner: profileId,
            type: chatParameters.chatType,
            name: chatParameters.chatName,
            tone: chatParameters.chatTone,
            instructions: chatParameters.chatInstructions,
            notes: chatParameters.chatNotes,
            tokens: 0,
            model: systemMessageService.defaultModel(),
            systemMessage: systemMessageService.buildSystemMessage(chatParameters.chatTone, chatParameters.chatInstructions, chatParameters.chatNotes)
        };

        const chatDoc = new Chat(newChatData);
        return await chatDoc.save();
    } catch (error) {
        logger.error(`Error creating chat: ${chatParameters.chatType}, ${chatParameters.chatName}, ${chatParameters.chatTone}`);
        throw new Error('Error creating new chat');
    }
}

const chatService = {createChat};

export default chatService;