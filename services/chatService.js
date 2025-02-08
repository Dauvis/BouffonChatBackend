import config from '../config/config.js';
import Chat from '../models/chatDocument.js';
import systemMessageService from "../services/systemMessageService.js";
import errorUtil from '../util/errorUtil.js';
import logger from './loggingService.js';
import modelUtil from "../util/modelUtil.js"

/**
 * Create a new chat document
 * @param {Object} newChatData - data for the new chat document
 * @returns {Promise<Object>} - newly created chat document
 */
async function createChat(profileId, chatParameters) {
    try {
        const modelId = chatParameters.model || systemMessageService.defaultModel();
        const model = modelUtil.find(modelId);
        const parameters = systemMessageService.getToneParameters(chatParameters.tone);

        // doing it this way to mitigate shenanigans
        const newChatData = {
            owner: profileId,
            type: chatParameters.type,
            name: chatParameters.name,
            tone: model.devMsg ? chatParameters.tone : systemMessageService.defaultModel(),
            instructions: model.devMsg ? chatParameters.instructions : "",
            notes: model.devMsg ? chatParameters.notes : "",
            tokens: 0,
            temperature: parameters.temperature,
            topP: parameters.topP,
            model: modelId,
            systemMessage: model.devMsg ?
                systemMessageService.buildSystemMessage(chatParameters.tone, chatParameters.instructions, chatParameters.notes) :
                "Not available"
        };

        const chatDoc = new Chat(newChatData);
        return await chatDoc.save();
    } catch (error) {
        throw errorUtil.error(500, errorUtil.errorCodes.dataStoreError,
            `Error creating chat for profile ${profileId}: ${error}`,
            "Internal error when creating a new chat");
    }
}

/**
 * Fetch abridged chat information for profile
 * @param {string} profileId 
 * @returns array of abridged chats for specified profile
 */
async function fetchChatsAbridged(profileId) {
    if (!profileId) {
        throw errorUtil.error(500, errorUtil.errorCodes.internalError,
            "Attempt to call fetchChatsAbridged without a profile",
            "Internal error when fetching chats"
        );
    }

    try {
        const chats = await Chat.find({ owner: profileId }, { type: 1, name: 1 });
        return chats;
    } catch (error) {
        throw errorUtil.error(500, errorUtil.errorCodes.dataStoreError,
            `Error fetching abridged chat list for profile ${profileId}: ${error}`,
            "Internal error when fetching chats"
        );
    }
}

/**
 * Finds chat for specified profile and chat identifiers
 * @param {string} profileId 
 * @param {string} chatId 
 * @returns an array containing the chat
 */
async function findChat(profileId, chatId) {
    if (!profileId || !chatId) {
        throw errorUtil.error(500, errorUtil.errorCodes.internalError,
            "Attempt to call findChat without a profile or chat identifier",
            "Internal error while attempting load chat"
        );
    }

    try {
        const chat = await Chat.find({ owner: profileId, _id: chatId })
        return chat;
    } catch (error) {
        throw errorUtil.error(500, errorUtil.errorCodes.dataStoreError,
            `Error fetching chat ${chatId} for profile ${profileId}: ${error}`,
            "Internal error while attempting to load chat."
        );
    }
}

/**
 * Updates chat specified by profile and chat identifiers
 * @param {string} profileId 
 * @param {string} chatId 
 * @param {object} chatData 
 * @returns updated chat information
 */
async function updateChat(profileId, chatId, chatData) {
    if (!profileId || !chatId) {
        throw errorUtil.error(500, errorUtil.errorCodes.internalError,
            "Attempt to call updateChat without a profile or chat identifier",
            "Internal error attempting to update chat"
        );
    }

    try {
        const updated = await Chat.findOneAndUpdate(
            { owner: profileId, _id: chatId },
            chatData,
            { new: true, runValidators: true });

        if (!updated) {
            throw errorUtil.error(404, errorUtil.errorCodes.chatNotFound,
                `Chat ${chatId} for profile ${profileId} not found`,
                "Specified chat does not exist"
            );
        }

        return updated._doc;
    } catch (error) {
        throw errorUtil.error(500, errorUtil.errorCodes.dataStoreError,
            `Error updating chat ${chatId} for profile ${profileId}: ${error}`,
            "Internal error attempting to update chat"
        );
    }
}

/**
 * Delete specified chat
 * @param {string} profileId 
 * @param {string} chatId 
 * @returns data of delete chat
 */
async function deleteChat(profileId, chatId) {
    if (!profileId || !chatId) {
        throw errorUtil.error(500, errorUtil.errorCodes.internalError,
            "Attempt to call deleteChat without a profile or chat identifier",
            "Internal error while deleting chat"
        );
    }

    try {
        const deleted = await Chat.findOneAndDelete(
            { owner: profileId, _id: chatId },
            { runValidators: true }
        );

        if (!deleted) {
            throw errorUtil.error(404, errorUtil.errorCodes.chatNotFound,
                `Unabled to find chat ${chatId} for ${profileId}`,
                "Unable to find chat to delete"
            );
        }

        return deleted._doc;
    } catch (error) {
        throw errorUtil.error(500, errorUtil.errorCodes.dataStoreError,
            `Error deleting chat ${chatId} for profile ${profileId}: ${error}`,
            "Internal error while deleting chat"
        );
    }
}

/**
 * Applies a new exchange to the specified chat
 * @param {string} chat 
 * @param {number} tokens 
 * @param {string} userMessage 
 * @param {string} assistantMessage 
 * @param {object} additionalInfo 
 * @returns The identifier of the newly created exchange
 */
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
    };

    const updated = await updateChat(chat.owner, chat._id, data);
    const exchangeId = updated.exchanges[updated.exchanges.length - 1]._id;
    return exchangeId;
}

/**
 * Removes the last exchange on specified chat
 * @param {string} profileId 
 * @param {string} chatId 
 * @returns the exchanged removed from the chat or empty string if none
 */
async function undoPreviousExchange(profileId, chatId) {
    if (!profileId || !chatId) {
        throw errorUtil.error(500, errorUtil.errorCodes.internalError,
            "Attempt to call undoPreviousExchange without a profile or chat identifier",
            "Internal error while undoing previous interaction"
        );
    }

    try {
        const chat = (await chatService.findChat(profileId, chatId))[0]._doc;

        if (!chat) {
            throw errorUtil.error(404, errorUtil.errorCodes.chatNotFound,
                `Unable to find chat ${chatId} for profile ${profileId}`,
                "Specified chat was not found"
            );
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
                undoStack: [...curStack, last]
            };

            const updated = await updateChat(chat.owner, chat._id, data);

            if (!updated) {
                throw errorUtil.error(404, errorUtil.errorCodes.chatNotFound,
                    `Failed to update undo operation for chat ${chatId} for profile ${profileId}`,
                    "Specified chat was not found"
                )
            }

            return last;
        } else {
            return '';
        }
    } catch (error) {
        throw errorUtil.error(500, errorUtil.errorCodes,
            `Error when reverting last exchange for chat ${chatId} for profile: ${profileId}: ${error}`,
            "Internal error while undoing previous interaction"
        );
    }
}

/**
 * Restores previously remove exchange on chat
 * @param {string} profileId 
 * @param {string} chatId 
 * @returns the exchange restored on the chat or empty string if none
 */
async function redoPreviousExchange(profileId, chatId) {
    if (!profileId || !chatId) {
        throw errorUtil.error(500, errorUtil.errorCodes.internalError,
            "Attempt to call redoPreviousExchange without a profile or chat identifier",
            "Internal error while undoing previous interaction"
        );
    }

    try {
        const chat = (await chatService.findChat(profileId, chatId))[0]._doc;

        if (!chat) {
            throw errorUtil.error(404, errorUtil.errorCodes.chatNotFound,
                `Unable to find chat ${chatId} for profile ${profileId}`,
                "Specified chat was not found"
            );
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
                throw errorUtil.error(404, errorUtil.errorCodes.chatNotFound,
                    `Failed to update redo operation for chat ${chatId} for profile ${profileId}`,
                    "Specified chat was not found"
                )
            }

            return last;
        } else {
            return '';
        }
    } catch (error) {
        throw errorUtil.error(500, errorUtil.errorCodes,
            `Error when restoring last exchange for chat ${chatId} for profile: ${profileId}: ${error}`,
            "Internal error while undoing previous interaction"
        );
    }
}

/**
 * Searches for temp chats that have been idle and deletes them
 */
async function performIdleChatPurge() {
    const cutoff = Date.now() - config.idleChatLife * 60 * 1000;

    try {
        const count = await Chat.deleteMany({ type: "temp", lastActivity: { $lte: cutoff } });

        if (count.deletedCount > 0) {
            logger.debug(`Purge deleted ${count.deletedCount} chats`);
        }
    } catch (error) {
        logger.error(`Error in performIdleChatPurge: ${error}`);
    }
}

/**
 * Generates file name for a chat for export
 */
function exportFilename(chatId, name) {
    let sanitized = name?.replace(/[<>:"/\\|?*]+/g, '_').trim() || "";
    sanitized = sanitized.substring(0, 64);

    return `${sanitized}_${chatId}.json`;
};

/**
 * Using an array of chat identifiers package the chats
 * @param {string} profileId 
 * @param {array} selection 
 * @returns array of chats packaged for export
 */
async function fetchExportData(profileId, selection) {
    const output = [];

    for (const chatId of selection) {
        const chats = await findChat(profileId, chatId);

        if (chats.length) {
            const chat = chats[0].toObject();
            const id = chat._id;
            const filename = exportFilename(chatId, chat.name);

            const cleanChat = { ...chat };
            delete cleanChat._id;
            delete cleanChat.owner;
            delete cleanChat.type;

            for (const exchange of cleanChat.exchanges) {
                delete exchange._id;
            }

            const data = JSON.stringify(cleanChat);
            output.push({ id, filename, data });
        }
    };

    return output;
}

/**
 * Using an array of chat identifier remove them
 * @param {string} profileId 
 * @param {array} chatList 
 */
async function purgeChats(profileId, chatList) {
    for (const chatId of chatList) {
        await deleteChat(profileId, chatId);
    }
}

/**
 * Creates a new chat from data imported from a file
 * @param {string} profileId 
 * @param {object} chat 
 * @returns newly created chat
 */
async function importChat(profileId, chat) {
    const modifiedChat = { ...chat };
    delete modifiedChat._id;
    modifiedChat.owner = profileId;
    modifiedChat.type = "archived";

    for (const exchange of modifiedChat.exchanges) {
        delete exchange._id;
    }

    const chatDoc = new Chat(modifiedChat);
    return await chatDoc.save();
}

const chatService = {
    createChat, fetchChatsAbridged, findChat, updateChat, deleteChat,
    applyExchange, undoPreviousExchange, redoPreviousExchange, performIdleChatPurge,
    fetchExportData, purgeChats, importChat
};

export default chatService;