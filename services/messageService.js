import chatService from "./chatService.js";
import messageServiceGPT from "./messageServiceGPT.js";
import logger from "./loggingService.js"

function isStandardGPT(model) {
    return (model === "gpt-4o" || model === "gpt-4o-mini")
}

async function sendMessage(profileId, chatId, userMessage) {
    try {
        const chats = await chatService.findChat(profileId, chatId);
        const chat = chats[0];

        if (isStandardGPT(chat.model)) {
            const { assistantMessage, tokens } = await messageServiceGPT.sendMessage(chat.model, userMessage, chat.systemMessage, chat.exchanges)
            const exchangeId = await chatService.applyExchange(chat, tokens, userMessage, assistantMessage, null);
            return { assistantMessage, tokens, exchangeId }
        }
    } catch (error) {
        logger.error(`Error processing user message: ${error}`);
        throw new Error("Error processing user message");
    }
}

const messageService = { sendMessage }

export default messageService
