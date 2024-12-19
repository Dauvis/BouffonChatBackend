import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import profileService from "../services/profileService.js";
import logger from "../services/loggingService.js";
import apiUtil from "../util/apiUtil.js";

const router = express.Router();

router.get("/api/v1/profile", authMiddleware, async (req, res) => {
  try {
    const userProfile = await profileService.findProfileByGoogleId(req.user.sub);
    const { googleId, refreshToken, ...publicProfile } = userProfile._doc;

    logger.debug(`Profile fetched for Google Id: {googleId}`);

    res.json({
      profile: publicProfile,
    });  
  } catch (error) {
    logger.error(`Failure to fetch profile: ${error}`);
    res.status(500).json(apiUtil.apiErrorResponse(apiUtil.errorCodes.api, "Failed to fetch profile"));
  }
});

router.put("/api/v1/profile", authMiddleware, async (req, res) => {
  try {
    const profileId = req.user.profileId;
    const updates = req.body;

    const data = {
      name: updates.profileName,
      email: updates.profileEmail,
      defaultTone: updates.profileTone,
      defaultInstructions: updates.profileInstructions,
    };

    await profileService.updateProfile(profileId, data);

    logger.debug(`Profile ${profileId} updated`);

    res.status(204).send();
  } catch (error) {
    logger.error(`Failed to update profile: ${error}`);
    res.status(500).json(apiUtil.apiErrorResponse(apiUtil.errorCodes.api, "Failed to update profile"));
  }
});

export default router;
