import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import chatService from "../services/chatService.js";
import apiUtil from "../util/apiUtil.js";
import logger from "../services/loggingService.js";

const router = express.Router();

router.post("/api/v1/chat", authMiddleware, async (req, res) => {
    try {
        const newChatOptions = req.body;
        const { chatName, chatTone, chatType } = req.body;     

        if (!chatName?.trim()) {
            res.status(400).json(apiUtil.apiErrorResponse(apiUtil.errorCodes.validation, 'Conversation name was not supplied'));
            return;
        }

        // Note: tone will be subjected to further checks in createChat()
        if (!chatTone?.trim())
        {
            res.status(400).json(apiUtil.apiErrorResponse(apiUtil.errorCodes.validation, 'Conversation tone was not supplied'));
            return;
        }

        const validTypes = new Set(['temp', 'active']);
        if (!validTypes.has(chatType)) {
            res.status(400).json(apiUtil.apiErrorResponse(apiUtil.errorCodes.validation, `${chatType} is not a valid conversation type`));
            return;
        }

        const newChat = await chatService.createChat(req.user.profileId, newChatOptions);

        res.status(201).json({ chat: newChat });
    } catch (error) {
        logger.error(`Failure to create chat for profile ${req.user.profileId}: ${error}`);
        res.status(500).json(apiUtil.apiErrorResponse(apiUtil.errorCodes.api, 'Failed to create a new conversation'))
    }
});

export default router;