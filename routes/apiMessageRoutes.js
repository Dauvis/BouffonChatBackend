import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import logger from "../services/loggingService.js"
import messageService from "../services/messageService.js";
import chatService from "../services/chatService.js";
import chatUtil from "../util/chatUtil.js"
import errorUtil from "../util/errorUtil.js";

const router = express.Router();

router.post("/api/v1/message", authMiddleware, async (req, res) => {
  const { chatId, message: userMessage } = req.body;
  const profileId = req.user.profileId;
  
  logger.debug(`Received for ${chatId}: ${userMessage}`)

  try {
    const chat = (await chatService.findChat(profileId, chatId))[0];

    if (!chat) {
      errorUtil.response(res, 404, errorUtil.errorCodes.chatNotFound,
        `Unable to find chat ${chatId} for ${profileId}`,
        "Unable to find chat"
      );
      return;
    }

    if (chat && chatUtil.chatLimitPercent(chat) >= 100) {
      errorUtil.response(res, 400, errorUtil.errorCodes.validation, "Chat has reached it limit. Please start a new one.");
      return;
    }

    const { assistantMessage, tokens, exchangeId } = await messageService.sendMessage(profileId, chatId, userMessage)

    logger.debug(`Sent for ${chatId}: ${assistantMessage}`)

    res.json({ chatId, tokens, exchangeId, assistantMessage });
  } catch (error) {
    errorUtil.handleRouterError(res, error, "POST /api/v1/message");
  }
});

export default router;
