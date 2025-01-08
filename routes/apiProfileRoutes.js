import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import profileService from "../services/profileService.js";
import logger from "../services/loggingService.js";
import apiUtil from "../util/apiUtil.js";

const router = express.Router();

router.get("/api/v1/profile", authMiddleware, async (req, res) => {
  try {
    const userProfile = await profileService.findProfileByGoogleId(req.user.sub);

    if (!userProfile) {
      logger.debug(`Unable to find profile: ${req.user.sub}`);
      res.status(404).json(apiUtil.apiErrorResponse(apiUtil.errorCodes.profileNotFound, "Unable to find profile"));
      return;
    }

    const { googleId, refreshToken, ...publicProfile } = userProfile._doc;

    logger.debug(`Profile ${publicProfile._id} fetched using Google Id ${googleId}`);

    res.json({
      profile: publicProfile,
    });  
  } catch (error) {
    logger.error(`Error when fetching profile: ${error}`);
    res.status(500).json(apiUtil.apiErrorResponse(apiUtil.errorCodes.unknownError, "Error when fetching profile"));
  }
});

router.put("/api/v1/profile", authMiddleware, async (req, res) => {
  try {
    const profileId = req.user.profileId;
    const updates = req.body;

    const data = {
      name: updates.name,
      email: updates.email,
      defaultTone: updates.defaultTone,
      defaultInstructions: updates.defaultInstructions,
      defaultModel: updates.defaultModel,
    };

    if (!data.name || !data.email) {
      res.status(400).json(apiUtil.apiErrorResponse(apiUtil.errorCodes.validation, "Name and emails fields must have a value"));
      return;
    }

    await profileService.updateProfile(profileId, data);

    logger.debug(`Profile ${profileId} updated`);

    res.status(204).send();
  } catch (error) {
    logger.error(`Error when updating profile: ${error}`);
    res.status(500).json(apiUtil.apiErrorResponse(apiUtil.errorCodes.unknownError, "Error when updating profile"));
  }
});

export default router;
