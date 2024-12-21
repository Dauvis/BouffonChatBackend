import jwt from "jsonwebtoken";
import {config} from "../config/config.js";
import { OAuth2Client } from "google-auth-library";
import logger from "../services/loggingService.js";

const client = new OAuth2Client(config.googleClientId);

const createToken = ({ sub, email, name, profileId, key }, secret, life) => {
  if (!sub || !email || !profileId) {
    throw new Error("insufficient data to create token");
  }

  return jwt.sign({ sub, email, name, profileId, key }, secret, { expiresIn: life + 's' });
};

const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    logger.error(`Token verification failed: ${error}`);
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
    logger.debug("Google token failure: ", error);
    return null;
  }
}

export default { createToken, verifyGoogleToken, verifyToken };
