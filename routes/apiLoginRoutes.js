import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { config } from "../config/config.js";
import logger from "../services/loggingService.js";
import apiUtil from "../util/apiUtil.js";
import tokenUtil from "../util/tokenUtil.js";
import profileService from "../services/profileService.js";
import cookieUtil from "../util/cookieUtil.js";
import accessTokenService from "../services/accessTokenService.js";

const router = express.Router();

const respondUnauthorized = (res, errorCode, message) => {
  return res.status(401).json(apiUtil.apiErrorResponse(errorCode, message));
};

const respondServerError = (res, errorCode, message) => {
  return res.status(500).json(apiUtil.apiErrorResponse(errorCode, message));
};

router.post("/api/v1/login", async (req, res) => {
  try {
    const idToken = req.body.token;
    const payload = await tokenUtil.verifyGoogleToken(idToken);

    if (!payload) {
      respondUnauthorized(
        res,
        apiUtil.errorCodes.notAuthenticated,
        "Google token verification failed"
      );
      return;
    }

    const userData = {
      googleId: payload.sub,
      name: payload.name,
      email: payload.email,
    };

    const profile = await profileService.getOrCreateProfile(userData);
    const randomKey = cookieUtil.getRandomKey();
    cookieUtil.setSessionCookie(res, {
      profileId: profile._id,
      randomKey: randomKey,
    });

    const refreshToken = tokenUtil.createToken(
      tokenUtil.getTokenPayload(profile, randomKey),
      config.refreshSecret,
      config.refreshTokenLife
    );

    await profileService.updateProfile(profile._id, { refreshToken });

    const accessToken = tokenUtil.createToken(
      tokenUtil.getTokenPayload(profile),
      config.jwtSecret,
      config.accessTokenLife
    );

    accessTokenService.setToken(profile._id.toString(), accessToken);
    const profileDoc = profile._doc;
    res.json({
      profile: profileService.excludePrivateProperties(profileDoc),
    });
  } catch (error) {
    logger.error("Authentication failed: " + error.message);
    respondUnauthorized(
      res,
      apiUtil.errorCodes.notAuthenticated,
      "Failure to authenticate with Google"
    );
  }
});

router.delete("/api/v1/login", authMiddleware, async (req, res) => {
  const profileId = req.user.profileId;

  try {
    await profileService.updateProfile(profileId, { refreshToken: "" });
    cookieUtil.deleteSessionCookie(res);
    accessTokenService.removeToken(profileId);
    res.status(204).send();
  } catch (error) {
    logger.error(`Failure to log out profile ${profileId}: ${error.message}`);
    respondServerError(
      res,
      apiUtil.errorCodes.unknownError,
      "Failed to log out of the app"
    );
  }
});

export default router;
