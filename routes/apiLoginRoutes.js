import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { config } from "../config/config.js";
import logger from "../services/loggingService.js";
import apiUtil from "../util/apiUtil.js";
import jwt from "jsonwebtoken";
import tokenUtil from "../util/tokenUtil.js";
import profileService from "../services/profileService.js";

const router = express.Router();

const respondUnauthorized = (res, errorCode, message) => {
  return res.status(401).json(apiUtil.apiErrorResponse(errorCode, message));
};

const respondServerError = (res, errorCode, message) => {
  return res.status(500).json(apiUtil.apiErrorResponse(errorCode, message));
}

const getTokenPayload = (profile) => ({
  sub: profile.googleId,
  email: profile.email,
  name: profile.name,
  profileId: profile._id,
});

router.post("/api/v1/login", async (req, res) => {
  try {
    const idToken = req.body.token;
    const payload = await tokenUtil.verifyGoogleToken(idToken);

    if (!payload) {
      respondUnauthorized(res, apiUtil.errorCodes.notAuthenticated, "Google token verification failed");
      return;
    }

    const userData = {
      googleId: payload.sub,
      name: payload.name,
      email: payload.email,
    };

    const profile = await profileService.getOrCreateProfile(userData);
    const refreshToken = tokenUtil.createToken(
      getTokenPayload(profile),
      config.refreshSecret,
      config.refreshTokenLife
    );

    await profileService.updateProfile(profile._id, { refreshToken });
    const accessToken = tokenUtil.createToken(
      getTokenPayload(profile),
      config.jwtSecret,
      config.accessTokenLife
    );
    req.session.token = accessToken;
    const profileDoc = profile._doc;
    res.json({
      profile: profileService.excludePrivateProperties(profileDoc),
    });
  } catch (error) {
    logger.error("Authentication failed: " + error.message);
    respondUnauthorized(res, apiUtil.errorCodes.notAuthenticated, "Failure to authenticate with Google");
  }
});

router.delete("/api/v1/login", authMiddleware, async (req, res) => {
  const profileId = req.user.profileId;

  try {
    await profileService.updateProfile(profileId, { refreshToken: "" });
    req.session.destroy((err) => {
      if (err) {
        logger.error("Failure to destroy session for profile: " + profileId);
        return respondServerError(res, apiUtil.errorCodes.unknownError, "Failure to log out");
      }
      res.status(200).json({ message: "Successfully logged out" });
    });
  } catch (error) {
    logger.error(`Failure to log out profile ${profileId}: ${error.message}`);
    respondServerError(res, apiUtil.errorCodes.unknownError, "Failed to log out of the app");
  }
});

router.post("/api/v1/login/refresh", async (req, res) => {
  const { token } = req.session;

  if (!token) {
    return respondUnauthorized(res, apiUtil.errorCodes.needAuthentication, "Authentication is necessary");
  }

  try {
    const decodedPayload = jwt.decode(token);
    const profileId = decodedPayload.profileId;

    const profile = await profileService.findProfile(profileId);

    const isAuthorized =
      profile &&
      profile.refreshToken &&
      tokenUtil.verifyToken(profile.refreshToken, config.refreshSecret);

    if (!isAuthorized) {
      req.session.token = null;
      logger.debug(`Refresh attempt with invalid token for profile ${profileId}`);
      return respondUnauthorized(res, apiUtil.errorCodes.needAuthentication, "Refresh failed, authentication necessary");
    }

    const accessToken = tokenUtil.createToken(
      getTokenPayload(profile),
      config.jwtSecret,
      config.accessTokenLife
    );

    req.session.token = accessToken;
    res.status(200).json({ message: "Access refreshed successfully" });
  } catch (error) {
    logger.error(`Refresh attempt failed: ${error.message}`);
    respondUnauthorized(res, apiUtil.errorCodes.needAuthentication, "Refreshed failed, authentication necessary");
  }
});

export default router;
