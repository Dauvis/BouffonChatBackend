import NodeCache from "node-cache";
import config from "../config/config.js";
import profileService from "./profileService.js";
import tokenUtil from "../util/tokenUtil.js";
import logger from "../services/loggingService.js";

const accessTokenCache = new NodeCache();

function setToken(profileId, token) {
    accessTokenCache.set(profileId, token, config.accessTokenLife);
}

function getToken(profileId) {
    return accessTokenCache.get(profileId);    
}

function removeToken(profileId) {
    accessTokenCache.del(profileId);
}

async function refreshToken(profileId, randomKey) {
    try {
        const profile = await profileService.findProfile(profileId);
        const tokenInfo = tokenUtil.verifyToken(profile.refreshToken, config.refreshSecret);

        if (!profile || !tokenInfo || randomKey !== tokenInfo.key) {
            logger.warn(`Unable to refresh profile ${profileId} due to unpaired keys: ${randomKey} vs. ${tokenInfo.key}`);
            return null;
        }

        const accessToken = tokenUtil.createToken(
        tokenUtil.getTokenPayload(profile),
        config.jwtSecret,
        config.accessTokenLife
        );

        setToken(profileId, accessToken);
        return accessToken;
    } catch (error) {
        logger.error(`Error while refreshing token for profile ${profileId}: ${error}`);
        return null;
    }
}

const accessTokenService = {setToken, getToken, removeToken, refreshToken};

export default accessTokenService;