import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { config } from "../config/config.js";
import logger from "../services/loggingService.js";
import apiUtil from "../util/apiUtil.js";
import tokenUtil from "../util/tokenUtil.js";
import profileService from "../services/profileService.js";
import cookieUtil from "../util/cookieUtil.js";

const router = express.Router();

const respondUnauthorized = (res, errorCode, message) => {
  return res.status(401).json(apiUtil.apiErrorResponse(errorCode, message));
};

const respondServerError = (res, errorCode, message) => {
  return res.status(500).json(apiUtil.apiErrorResponse(errorCode, message));
};

const getTokenPayload = (profile, randomKey = null) => ({
  sub: profile.googleId,
  email: profile.email,
  name: profile.name,
  profileId: profile._id,
  key: randomKey || "",
});

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
    cookieUtil.setRefreshCookie(res, {
      sub: profile.googleId,
      profileId: profile._id,
      randomKey: randomKey,
    });

    const refreshToken = tokenUtil.createToken(
      getTokenPayload(profile, randomKey),
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
      token: accessToken,
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
    cookieUtil.deleteRefreshCookie(res);
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

router.post("/api/v1/login/refresh", async (req, res) => {
  try {
    const cookieValues = cookieUtil.getRefreshCookie(req);

    if (!cookieValues) {
      logger.debug("Failure to refresh due to invalid refresh cookie");
      return respondUnauthorized(
        res,
        apiUtil.errorCodes.needAuthentication,
        "Authentication is necessary"
      );
    }

    const profile = await profileService.findProfile(cookieValues.profileId);

    if (!profile) {
      logger.error(
        `Unable to refresh profile ${cookieValues.profileId} due to unpaired keys: ${cookieValues.randomKey} vs. ${profile.randomKey}`
      );
      return respondUnauthorized(
        res,
        apiUtil.errorCodes.needAuthentication,
        "Authentication is necessary"
      );
    }

    const accessToken = tokenUtil.createToken(
      getTokenPayload(profile),
      config.jwtSecret,
      config.accessTokenLife
    );

    res.status(200).json({ token: accessToken });
  } catch (error) {}
});

export default router;
