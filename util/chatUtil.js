import systemMessageService from "../services/systemMessageService.js"

function chatLimitPercent(chat) {
    if (chat.model === "gpt-4o" || chat.model === "gpt-4o-mini") {
        return 100 * (chat.tokens / 25000);
    }

    return 0;
}

function isValidTone(tone) {
    const toneList = systemMessageService.getToneOptionList();

    return toneList.includes(tone);
}

const chatUtil = { chatLimitPercent, isValidTone };

export default chatUtil;