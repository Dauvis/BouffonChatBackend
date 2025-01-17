import jwt from "jsonwebtoken";
import config from "../config/config.js";
import { OAuth2Client } from "google-auth-library";
import logger from "../services/loggingService.js";
import errorUtil from "./errorUtil.js";

const client = new OAuth2Client(config.googleClientId);

function createToken({ sub, email, name, profileId, key }, secret, life) {
    if (!sub || !email || !profileId) {
        throw errorUtil.error(500, errorUtil.errorCodes.internalError,
            "Attempt to call creationToken without sufficient data to create JWT",
            "Internal error establishing session"
        );
    }

    return jwt.sign({ sub, email, name, profileId, key }, secret, { expiresIn: life + 's' });
};

function verifyToken(token, secret) {
    try {
        return jwt.verify(token, secret);
    } catch (error) {
        logger.error(`Failed to verify JWT: ${error}`);
        return null;
    }
};

async function verifyGoogleToken(idToken) {
    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: config.googleClientId,
        });
        return ticket.getPayload();
    } catch (error) {
        logger.error(`Failed to verify Google ID token: ${error}`);
        return null;
    }
}

function getTokenPayload(profile, randomKey = null) {
    return ({
        sub: profile.googleId,
        email: profile.email,
        name: profile.name,
        profileId: profile._id,
        key: randomKey || "",
    });
}

const tokenUtil = { createToken, verifyGoogleToken, verifyToken, getTokenPayload };

export default tokenUtil;
