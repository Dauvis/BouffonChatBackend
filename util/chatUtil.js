import systemMessageService from "../services/systemMessageService.js"
import modelUtil from "./modelUtil.js";

function chatLimitPercent(chat) {
    const tokenLimit = modelUtil.modelTokenLimit(chat.model);

    if (tokenLimit) {
        return 100 * (chat.tokens / tokenLimit);
    }

    return 0;
}

function isValidTone(tone) {
    const toneList = systemMessageService.getToneOptionList();

    return toneList.includes(tone);
}

const chatUtil = { chatLimitPercent, isValidTone };

export default chatUtil;