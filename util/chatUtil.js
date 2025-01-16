function chatLimitPercent(chat) {
    if (chat.model === "gpt-4o" || chat.model === "gpt-4o-mini") {
        return 100 * (chat.tokens / 25000);
    }

    return 0;
}

const chatUtil = { chatLimitPercent };

export default chatUtil;