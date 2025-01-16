import Chat from '../models/chatDocument.js';
import logger from "../services/loggingService.js";
import systemMessageService from "../services/systemMessageService.js";

/**
 * Create a new chat document
 * @param {Object} newChatData - data for the new chat document
 * @returns {Promise<Object>} - newly created chat document
 */
async function createChat(profileId, chatParameters) {
    try {
        // doing it this way to mitigate shenanigans
        const newChatData = {
            owner: profileId,
            type: chatParameters.type,
            name: chatParameters.name,
            tone: chatParameters.tone,
            instructions: chatParameters.instructions,
            notes: chatParameters.notes,
            tokens: 0,
            model: chatParameters.model || systemMessageService.defaultModel(),
            systemMessage: systemMessageService.buildSystemMessage(chatParameters.tone, chatParameters.instructions, chatParameters.notes)
        };

        const chatDoc = new Chat(newChatData);
        return await chatDoc.save();
    } catch (error) {
        logger.error(`Error creating chat: ${chatParameters.type}, ${chatParameters.name}, ${chatParameters.tone}`);
        throw new Error('Error creating new chat');
    }
}

async function fetchChatsAbridged(profileId) {
    if (!profileId) {
        throw new Error("Attempt to call fetchChatsAbridged without a profile");
    }

    try {
        const chats = await Chat.find({ owner: profileId}, { type: 1, name: 1 });
        return chats;
    } catch (error) {
        logger.error(`Error fetching abridged chat list for profile ${profileId}`);
        throw new Error('Error fetching abridged chat list');
    }
}

async function findChat(profileId, chatId) {
    if (!profileId || !chatId) {
        throw new Error("Attempt to call findChat without a profile or chat identifier");
    }

    try {
        const chat = await Chat.find({owner: profileId, _id: chatId})
        return chat;
    } catch (error) {
        logger.error(`Error fetching chat ${chatId} for profile ${profileId}: {error}`);
        throw new Error('Error fetching chat');
    }
}

async function updateChat(profileId, chatId, chatData) {
    if (!profileId || !chatId) {
        throw new Error("Attempt to call updateChat without a profile or chat identifier");
    }

    try {
        const updated = await Chat.findOneAndUpdate(
            { owner: profileId, _id: chatId },
            chatData,
            { new: true, runValidators: true});

        if (!updated) {
            throw new Error(`Chat ${chatId} for profile ${profileId} not found`);
        }

        return updated._doc;
    } catch (error) {
        logger.error(`Error updating chat ${chatId} for profile ${profileId}`);
        throw new Error('Error updating chat');
    }
}

async function deleteChat(profileId, chatId) {
    if (!profileId || !chatId) {
        throw new Error("Attempt to call deleteChat without a profile or chat identifier");
    }

    try {
        const deleted = await Chat.findOneAndDelete(
            { owner: profileId, _id: chatId },
            { runValidators: true }
        );

        return deleted._doc;
    } catch (error) {
        logger.error(`Error deleting chat ${chatId} for profile ${profileId}`);
        throw new Error('Error deleting chat');
    }
}

async function applyExchange(chat, tokens, userMessage, assistantMessage, additionalInfo) {
    const curExchanges = chat.exchanges

    const data = {
        ...chat._doc,
        tokens: tokens,
        lastActivity: Date.now(),
        exchanges: [
            ...curExchanges,
            { userMessage, assistantMessage, additionalInfo }
        ],
        undoStack: []
    }

    const updated = await updateChat(chat.owner, chat._id, data)
    const exchangeId = updated.exchanges[updated.exchanges.length - 1]._id
    return exchangeId
}

async function undoPreviousExchange(profileId, chatId) {
    if (!profileId || !chatId) {
        throw new Error("Attempt to call undoPreviousExchange without a profile or chat identifier");
    }

    try {
        const chatList = await chatService.findChat(profileId, chatId);
        const chat = chatList[0]._doc;

        if (!chat) {
            throw new Error(`Unable to find chat ${chatId} for profile ${profileId}`);
        }

        const newExchanges = chat.exchanges.slice(0, -1);
        const curStack = chat.undoStack || [];
        const sliced = chat.exchanges.slice(-1);
        const last = sliced.length ? sliced[0] : null;
    
        if (last) {
            const data = {
                ...chat,
                lastActivity: Date.now(),
                exchanges: newExchanges,
                undoStack: [...curStack, last ]
            };

            const updated = await updateChat(chat.owner, chat._id, data);

            if (!updated) {
                throw new Error(`Failed to update undo operation for chat ${chatId} for profile ${profileId}`);
            }

            return last;
        } else {
            return '';
        }
    } catch (error) {
        throw error;
    }
}

async function redoPreviousExchange(profileId, chatId) {
    if (!profileId || !chatId) {
        throw new Error("Attempt to call redoPreviousExchange without a profile or chat identifier");
    }

    try {
        const list = await chatService.findChat(profileId, chatId);
        const chat = list[0]._doc;

        if (!chat) {
            throw new Error(`Unable to find chat ${chatId} for profile ${profileId}`);
        }

        const newStack = chat.undoStack.slice(0, -1);
        const curExchanges = chat.exchanges || [];
        const sliced = chat.undoStack.slice(-1);
        const last = sliced.length ? sliced[0] : null;
    
        if (last) {
            const data = {
                ...chat,
                lastActivity: Date.now(),
                exchanges: [...curExchanges, last],
                undoStack: newStack
            };

            const updated = await updateChat(chat.owner, chat._id, data);

            if (!updated) {
                throw new Error(`Failed to update redo operation for chat ${chatId} for profile ${profileId}`);
            }

            return last;
        } else {
            return '';
        }
    } catch (error) {
        throw error;
    }
}

const chatService = {createChat, fetchChatsAbridged, findChat, updateChat, deleteChat, 
    applyExchange, undoPreviousExchange, redoPreviousExchange };

export default chatService;