import chatService from "./chatService.js";
import messageServiceGPT from "./messageServiceGPT.js";
import errorUtil from "../util/errorUtil.js";

function isStandardGPT(model) {
    return (model === "gpt-4o" || model === "gpt-4o-mini");
}

function isReasoningGPT(model) {
    return (model === "o1-preview" || model === "o1-mini");
}

async function sendMessage(profileId, chatId, userMessage) {
    if (!profileId || !chatId) {
        throw errorUtil.error(500, errorUtil.errorCodes.internalError,
            "Attempt to call sendMessage without profile or chat identifiers",
            "Internal error attempting to send message to assistant"
        );
    }

    const chats = await chatService.findChat(profileId, chatId);
    const chat = chats[0];

    if (isStandardGPT(chat.model)) {
        const { assistantMessage, tokens } = await messageServiceGPT.sendMessage(chat.model, userMessage, 
            chat.systemMessage, chat.exchanges, chat.temperature, chat.topP);
        const exchangeId = await chatService.applyExchange(chat, tokens, userMessage, assistantMessage, null);
        return { assistantMessage, tokens, exchangeId }
    } else if (isReasoningGPT(chat.model)) {
        const { assistantMessage, tokens } = await messageServiceGPT.sendMessage(chat.model, userMessage, "", chat.exchanges);
        const exchangeId = await chatService.applyExchange(chat, tokens, userMessage, assistantMessage, null);
        return { assistantMessage, tokens, exchangeId }
    }
}

const messageService = { sendMessage }

export default messageService
