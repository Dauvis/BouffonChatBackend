import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { config } from "../config/config.js";
import logger from "../services/loggingService.js";
import apiUtil from "../util/apiUtil.js";
import jwt from "jsonwebtoken";
import tokenUtil from "../util/tokenUtil.js";
import profileService from "../services/profileService.js";

const router = express.Router();

const respondUnauthorized = (res, message = "Authentication necessary") => {
  return res
    .status(401)
    .json(apiUtil.apiErrorResponse(apiUtil.errorCodes.security, message));
};

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
    logger.error(`Error handling Google authentication: ${error}`);
    res
      .status(401)
      .json(
        apiUtil.apiErrorResponse(
          apiUtil.errorCodes.unauthorized,
          "Failed to authenticate using Google token"
        )
      );
  }
});

router.delete("/api/v1/login", authMiddleware, async (req, res) => {
  const profileId = req.user.profileId;

  try {
    await profileService.updateProfile(profileId, { refreshToken: "" });
    req.session.destroy((err) => {
      if (err) return respondUnauthorized(res, "Failed to log out");
      res.status(200).json({ message: "Successfully logged out" });
    });
  } catch (error) {
    logger.error(`Error logging out profile ${profileId}: ${error.message}`);
    respondUnauthorized(res, "Failed to log out of the app");
  }
});

router.post("/api/v1/login/refresh", async (req, res) => {
  const { token } = req.session;

  if (!token) {
    return respondUnauthorized(res);
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
      logger.debug(
        `Refresh attempt with invalid token for profile ${profileId}`
      );
      return respondUnauthorized(res);
    }

    const accessToken = tokenUtil.createToken(
      getTokenPayload(profile),
      config.jwtSecret,
      config.accessTokenLife
    );

    req.session.token = accessToken;
    res.status(200).json({ message: "Access token refreshed successfully" });
  } catch (error) {
    logger.error(`Failed to refresh access for profile: ${error.message}`);
    respondUnauthorized(res);
  }
});

export default router;
