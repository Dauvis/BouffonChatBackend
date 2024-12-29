import config from "../config/config.js";
import apiUtil from "../util/apiUtil.js";
import logger from "../services/loggingService.js";
import tokenUtil from "../util/tokenUtil.js";
import cookieUtil from "../util/cookieUtil.js";
import accessTokenService from "../services/accessTokenService.js";

function unauthorizedResponse(res, errorCode, message = null) {
  logger.debug(
    "Access by unauthorized user: " + message ||
      "no additional information given"
  );
  return res
    .status(401)
    .json(
      apiUtil.apiErrorResponse(
        errorCode,
        "Unauthenticated: refresh or authentication necessary"
      )
    );
};

async function ensureAuthenticated(req, res, next) {
  const {profileId, randomKey} = cookieUtil.getSessionCookie(req);  
  let token = accessTokenService.getToken(profileId);

  if (!token) {
    token = await accessTokenService.refreshToken(profileId, randomKey);

    if (!token) {
      unauthorizedResponse(res, apiUtil.errorCodes.needAuthentication, "Access needs authentication");
      return;
    }
  }

  const user = tokenUtil.verifyToken(token, config.jwtSecret);

  if (!user) {
    unauthorizedResponse(res, apiUtil.errorCodes.errorCodes.needAuthentication, "Access needs authentication");
    return;
  }

  req.user = user;
  next();
};

export default ensureAuthenticated;
