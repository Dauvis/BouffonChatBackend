import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import profileService from "../services/profileService.js";
import logger from "../services/loggingService.js";
import errorUtil from "../util/errorUtil.js";

const router = express.Router();

router.get("/api/v1/profile", authMiddleware, async (req, res) => {
    try {
        const userProfile = await profileService.findProfileByGoogleId(req.user.sub);

        if (!userProfile) {
            errorUtil.response(res, 404, errorUtil.errorCodes.profileNotFound, "Unable able to user profile");
            logger.warn(`Unable to find profile: ${req.user.profileId}`);
            return;
        }

        const { googleId, refreshToken, ...publicProfile } = userProfile._doc;

        res.json({
            profile: publicProfile,
        });
    } catch (error) {
        errorUtil.handleRouterError(res, error, "GET /api/v1/profile");
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
            errorUtil.response(res, 400, errorUtil.errorCodes.validation, "Name and email fields must have a value");
            return;
        }

        await profileService.updateProfile(profileId, data);

        res.status(204).send();
    } catch (error) {
        errorUtil.handleRouterError(res, error, "PUT /api/v1/profile");
    }
});

export default router;
