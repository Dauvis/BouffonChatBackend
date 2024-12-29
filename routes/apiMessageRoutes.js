import express from "express";
import OpenAI from "openai";
import config from "../config/config.js";
import authMiddleware from "../middleware/authMiddleware.js";
import apiUtil from "../util/apiUtil.js";
import logger from "../services/loggingService.js"

const router = express.Router();

const openai = new OpenAI({
    apiKey: config.openAIKey,
  });
  
router.post("/api/v1/message", authMiddleware, async (req, res) => {
  const userMessage = req.body.message;
  
  try {
    const response = await openai.chat.completions.create({
      model: config.gptModel,
      messages: [{ role: "user", content: userMessage }],
      max_tokens: 50,
    });

    const gptResponse = response.choices[0].message.content.trim();

    logger.debug("===GPT Interaction===");
    logger.debug(`Sent: ${userMessage}`);
    logger.debug(`Received: ${gptResponse}`);

    res.json({ reply: gptResponse });
  } catch (error) {
    logger.error(`Failure to communicate with GPT ${error.message}`);
    res.status(500).json(apiUtil.apiErrorResponse(apiUtil.errorCodes.unknownError, "Failure to communicate with GPT API"));
  }
});

export default router;
