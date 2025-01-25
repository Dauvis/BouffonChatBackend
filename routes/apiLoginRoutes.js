import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import config from "../config/config.js";
import tokenUtil from "../util/tokenUtil.js";
import profileService from "../services/profileService.js";
import cookieUtil from "../util/cookieUtil.js";
import accessTokenService from "../services/accessTokenService.js";
import errorUtil from "../util/errorUtil.js";

const router = express.Router();

router.post("/api/v1/login", async (req, res) => {
    try {
        const idToken = req.body.token;
        const payload = await tokenUtil.verifyGoogleToken(idToken);

        if (!payload) {
            errorUtil.response(res, 401, errorUtil.errorCodes.notAuthenticated, "Token verification failed");
            return;
        }

        const userData = {
            googleId: payload.sub,
            name: payload.name,
            email: payload.email,
        };

        const profile = await profileService.findOrLink(userData);

        if (!profile) {
            errorUtil.response(res, 403, errorUtil.errorCodes.notAuthorized, "This email address has not been whitelisted. Contact the administrator for assistance.");
            return;
        }

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

        await profileService.update(profile._id, { refreshToken });

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
        errorUtil.handleRouterError(res, error, "POST /api/v1/login");
    }
});

router.delete("/api/v1/login", authMiddleware, async (req, res) => {
    const profileId = req.user.profileId;

    try {
        await profileService.update(profileId, { refreshToken: "" });
        cookieUtil.deleteSessionCookie(res);
        accessTokenService.removeToken(profileId);
        res.status(204).send();
    } catch (error) {
        errorUtil.handleRouterError(res, error, "DELETE /api/v1/login");
    }
});

export default router;
