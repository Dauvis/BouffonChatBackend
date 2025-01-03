import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import systemMessageService from "../services/systemMessageService.js";
import availableModels from "../config/modelData.js";

const router = express.Router();

router.get("/api/v1/options/tones", authMiddleware, (req, res) => {
  const toneOptions = systemMessageService.getToneOptionList();
  res.json({
    options: toneOptions
  });
});

router.get("/api/v1/options/models", authMiddleware, (req, res) => {
  const modelOptions = availableModels.map(entry => {
    return { value: entry.id, label: entry.name};
  });

  res.json({
    options: modelOptions
  });
});

export default router;
