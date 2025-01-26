import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import chatService from "../services/chatService.js";
import errorUtil from "../util/errorUtil.js";
import chatUtil from "../util/chatUtil.js";
import profileService from "../services/profileService.js";

const router = express.Router();

router.post("/api/v1/chat", authMiddleware, async (req, res) => {
    try {
        const newChatOptions = req.body;
        const { name, tone, type, template } = req.body;     

        if (!name?.trim()) {
            errorUtil.response(res, 400, errorUtil.errorCodes.validation, "Chat requires a name");
            return;
        }

        if (!tone?.trim())
        {
            errorUtil.response(res, 400, errorUtil.errorCodes.validation, "Chat requrires a tone");
            return;
        }

        if (!chatUtil.isValidTone(tone)) {
            errorUtil.response(res, 400, errorUtil.errorCodes.validation, `${tone} is not a valid chat tone`);
            return;
        }

        const validTypes = new Set(['temp', 'active', 'archived']);
        if (!validTypes.has(type)) {
            errorUtil.response(res, 400, errorUtil.errorCodes.validation, `${type} is not a valid chat type`);
            return;
        }

        const newChat = await chatService.createChat(req.user.profileId, newChatOptions);
        const updatedMRU = await profileService.addTemplate(req.user.profileId, template);

        res.status(201).json({ chat: newChat, mru: updatedMRU });
    } catch (error) {
        errorUtil.handleRouterError(res, error, "POST /api/v1/chat");
    }
});

router.post("/api/v1/chat/:chatId/revert", authMiddleware, async (req, res) => {
    const {chatId} = req.params;
    const profileId = req.user.profileId;

    try {
        const exchange = await chatService.undoPreviousExchange(profileId, chatId);

        if (exchange) {
            res.json({ exchange });
        } else {
            res.status(204).send();
        }
    } catch (error) {
        errorUtil.handleRouterError(res, error, "POST /api/v1/chat/{id}/revert");
    }
});

router.post("/api/v1/chat/:chatId/restore", authMiddleware, async (req, res) => {
    const {chatId} = req.params;
    const profileId = req.user.profileId;

    try {
        const exchange = await chatService.redoPreviousExchange(profileId, chatId);

        if (exchange) {
            res.json({ exchange });
        } else {
            res.status(204).send();
        }
    } catch (error) {
        errorUtil.handleRouterError(res, error, "POST /api/v1/chat/{id}/restore");
    }
});

router.get("/api/v1/chat/:chatId?", authMiddleware, async (req, res) => {
    try {
        const { chatId } = req.params;
        const profileId = req.user.profileId;

        if (chatId) {
            const chat = await chatService.findChat(profileId, chatId);

            if (!chat.length) {
                errorUtil.response(res, 404, errorUtil.chatNotFound, "Specified chat not found");
                return;
            }
            res.json({ chats: chat });
        } else {
            const chats = await chatService.fetchChatsAbridged(profileId);
            res.json({ chats: chats });
        }
    } catch (error) {
        errorUtil.handleRouterError(res, error, "GET /api/v1/chat/{id?}");
    }
});

router.patch("/api/v1/chat/:chatId", authMiddleware, async (req, res) => {
    const { chatId } = req.params;
    const profileId = req.user.profileId;
    const updates = req.body;

    try {
        const data = {
            type: updates.type,
            name: updates.name
        };

        if (!data.name?.trim()) {
            errorUtil.response(res, 400, errorUtil.errorCodes.validation, "Chat requires a name");
            return;
        }

        const validTypes = new Set(['temp', 'active', 'archived']);
        if (!validTypes.has(data.type)) {
            errorUtil.response(res, 400, errorUtil.errorCodes.validation, `${data.type} is not a valid chat type`);
            return;
        }

        await chatService.updateChat(profileId, chatId, data);

        res.status(204).send();    
    } catch (error) {
        errorUtil.handleRouterError(res, error, "PATCH /api/v1/chat/{id}");
    }
});

router.delete("/api/v1/chat/:chatId", authMiddleware, async (req, res) => {
    const { chatId } = req.params;
    const profileId = req.user.profileId;

    try {
        await chatService.deleteChat(profileId, chatId);

        res.status(204).send();
    } catch (error) {
        errorUtil.handleRouterError(res, error, "DELETE /api/v1/chat/{id}");
    }
});

export default router;