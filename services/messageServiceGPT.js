import OpenAI from "openai";
import config from "../config/config.js"
import logger from "./loggingService.js"

const openai = new OpenAI({
    apiKey: config.openAIKey,
});

function apiMessage(role, content) {
    return { role, content}
}

async function sendMessage(model, userMessage, systemMessage, exchanges) {
    const messageList = systemMessage ? [ apiMessage("developer", systemMessage) ] : [];

    exchanges.forEach(element => {
        messageList.push(apiMessage("user", element.userMessage))
        messageList.push(apiMessage("assistant", element.assistantMessage))
    });

    messageList.push(apiMessage("user", userMessage));

    try {
        const response = await openai.chat.completions.create({
            model,
            messages: messageList
        });
    
        const assistantMessage = response.choices[0].message.content.trim();
        const tokens = response.usage.total_tokens;
        return {assistantMessage, tokens};
    } catch (error) {
        logger.error(`GPT interaction failed: ${error}`);
        throw new Error("GPT interaction failed");
    }
}

const messageServiceGPT = { sendMessage }

export default messageServiceGPT;