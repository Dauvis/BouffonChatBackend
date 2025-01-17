import chatService from "./chatService.js";
import messageServiceGPT from "./messageServiceGPT.js";
import errorUtil from "../util/errorUtil.js";

function isStandardGPT(model) {
    return (model === "gpt-4o" || model === "gpt-4o-mini");
}

async function sendMessage(profileId, chatId, userMessage) {
    if (!profileId || !chatId) {
        throw errorUtil.error(500, errorUtil.errorCodes.internalError,
            "Attempt to call sendMessage without profile or chat identifiers",
            "Internal error attempting to send message to assistant"
        );
    }

    try {
        const chats = await chatService.findChat(profileId, chatId);
        const chat = chats[0];

        if (isStandardGPT(chat.model)) {
            const { assistantMessage, tokens } = await messageServiceGPT.sendMessage(chat.model, userMessage, chat.systemMessage, chat.exchanges)
            const exchangeId = await chatService.applyExchange(chat, tokens, userMessage, assistantMessage, null);
            return { assistantMessage, tokens, exchangeId }
        }
    } catch (error) {
        throw error;
    }
}

const messageService = { sendMessage }

export default messageService
