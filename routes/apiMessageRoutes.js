import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import apiUtil from "../util/apiUtil.js";
import logger from "../services/loggingService.js"
import messageService from "../services/messageService.js";
import chatService from "../services/chatService.js";
import chatUtil from "../util/chatUtil.js"

const router = express.Router();

router.post("/api/v1/message", authMiddleware, async (req, res) => {
  const { chatId, message: userMessage } = req.body;
  const profileId = req.user.profileId;
  
  logger.debug(`Received for ${chatId}: ${userMessage}`)

  try {
    const chat = (await chatService.findChat(profileId, chatId))[0];

    if (chat && chatUtil.chatLimitPercent(chat) >= 100) {
      res.status(400).json(apiUtil.apiErrorResponse(apiUtil.errorCodes.tokenLimit, "Conversation has reached its limit. Please start a new one."));
      return;
    }

    const { assistantMessage, tokens, exchangeId } = await messageService.sendMessage(profileId, chatId, userMessage)

    logger.debug(`Sent for ${chatId}: ${assistantMessage}`)

    res.json({ chatId, tokens, exchangeId, assistantMessage });
  } catch (error) {
    logger.error(`Failure to communicate with AI API: ${error.message}`);
    res.status(500).json(apiUtil.apiErrorResponse(apiUtil.errorCodes.unknownError, "Failure to communicate with AI API"));
  }
});

export default router;
