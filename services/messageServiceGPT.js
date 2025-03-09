import OpenAI from "openai";
import config from "../config/config.js"
import errorUtil from "../util/errorUtil.js";

const openai = new OpenAI({
    apiKey: config.openAIKey,
});

function apiMessage(role, content) {
    return { role, content}
}

async function sendMessage(model, userMessage, systemMessage, exchanges, temperature = null, topP = null) {
    const messageList = systemMessage ? [ apiMessage("developer", systemMessage) ] : [];

    exchanges.forEach(element => {
        messageList.push(apiMessage("user", element.userMessage))
        messageList.push(apiMessage("assistant", element.assistantMessage))
    });

    messageList.push(apiMessage("user", userMessage));

    try {
        const options = {
            model,
            messages: messageList,
        }

        if (temperature) {
            options.temperature = temperature;
        }

        if (topP) {
            options.top_p = topP;
        }

        const response = await openai.chat.completions.create(options);
        const assistantMessage = response.choices[0].message.content.trim();
        const tokens = response.usage.total_tokens;
        return {assistantMessage, tokens};
    } catch (error) {
        throw errorUtil.error(503, errorUtil.errorCodes.gptError, 
            `Failed to communicate with GPT: ${error}`,
            "Internal error communicating with GPT"
        )
    }
}

const messageServiceGPT = { sendMessage }

export default messageServiceGPT;