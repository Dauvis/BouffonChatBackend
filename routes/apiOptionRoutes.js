import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import systemMessageService from "../services/systemMessageService.js";

const router = express.Router();

router.get("/api/v1/options/tones", authMiddleware, (req, res) => {
  const toneOptions = systemMessageService.getToneOptionList();
  res.json({
    options: toneOptions
  });
});

export default router;
