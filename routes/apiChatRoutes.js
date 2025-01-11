import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import chatService from "../services/chatService.js";
import apiUtil from "../util/apiUtil.js";
import logger from "../services/loggingService.js";
import profile from "../models/profile.js";

const router = express.Router();

router.post("/api/v1/chat", authMiddleware, async (req, res) => {
    try {
        const newChatOptions = req.body;
        const { name, tone, type } = req.body;     

        if (!name?.trim()) {
            res.status(400).json(apiUtil.apiErrorResponse(apiUtil.errorCodes.validation, 'Conversation name was not supplied'));
            return;
        }

        // Note: tone will be subjected to further checks in createChat()
        if (!tone?.trim())
        {
            res.status(400).json(apiUtil.apiErrorResponse(apiUtil.errorCodes.validation, 'Conversation tone was not supplied'));
            return;
        }

        const validTypes = new Set(['temp', 'active']);
        if (!validTypes.has(type)) {
            res.status(400).json(apiUtil.apiErrorResponse(apiUtil.errorCodes.validation, `${type} is not a valid conversation type`));
            return;
        }

        const newChat = await chatService.createChat(req.user.profileId, newChatOptions);

        res.status(201).json({ chat: newChat });
    } catch (error) {
        logger.error(`Failure to create chat for profile ${req.user.profileId}: ${error}`);
        res.status(500).json(apiUtil.apiErrorResponse(apiUtil.errorCodes.unknownError, 'Failed to create a new conversation'))
    }
});

router.get("/api/v1/chat/:chatId?", authMiddleware, async (req, res) => {
    try {
        const { chatId } = req.params;
        const profileId = req.user.profileId;

        if (chatId) {
            const chat = await chatService.findChat(profileId, chatId);

            if (!chat.length) {
                res.status(404).json(apiUtil.apiErrorResponse(apiUtil.errorCodes.chatNotFound, "Chat was not found"));
                return;
            }
            res.json({ chats: chat });
        } else {
            const chats = await chatService.fetchChatsAbridged(profileId);
            res.json({ chats: chats });
        }
    } catch (error) {
        logger.error(`Failure to fetch chats for profile ${req.user.profileId}: ${error}`);
        res.status(500).json(apiUtil.apiErrorResponse(apiUtil.errorCodes.unknownError, 'Failed to fetch chats'))
    }
});

router.put("/api/v1/chat/:chatId", authMiddleware, async (req, res) => {
    const { chatId } = req.params;
    const profileId = req.user.profileId;
    const updates = req.body;

    try {
        const data = {
            type: updates.type,
            name: updates.name
        };

        if (!data.name?.trim()) {
            res.status(400).json(apiUtil.apiErrorResponse(apiUtil.errorCodes.validation, 'Conversation name was not supplied'));
            return;
        }

        const validTypes = new Set(['temp', 'active', 'archived']);
        if (!validTypes.has(data.type)) {
            res.status(400).json(apiUtil.apiErrorResponse(apiUtil.errorCodes.validation, `${data.type} is not a valid conversation type`));
            return;
        }

        await chatService.updateChat(profileId, chatId, data);

        logger.debug(`chat ${chatId} updated`);

        res.status(204).send();    
    } catch (error) {
        logger.error(`Failure to update chat for profile ${req.user.profileId}: ${error}`);
        res.status(500).json(apiUtil.apiErrorResponse(apiUtil.errorCodes.unknownError, 'Failed to update chat'))
    }
});

router.delete("/api/v1/chat/:chatId", authMiddleware, async (req, res) => {
    const { chatId } = req.params;
    const profileId = req.user.profileId;

    try {
        await chatService.deleteChat(profileId, chatId);

        res.status(204).send();
    } catch (error) {
        logger.error(`Failure to delete chat for profile ${req.user.profileId}: ${error}`);
        res.status(500).json(apiUtil.apiErrorResponse(apiUtil.errorCodes.unknownError, 'Failed to delete chat'))
    }
});

export default router;