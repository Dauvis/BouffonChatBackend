import config from "../config/config.js";
import errorUtil from "../util/errorUtil.js";
import logger from "../services/loggingService.js";
import tokenUtil from "../util/tokenUtil.js";
import cookieUtil from "../util/cookieUtil.js";
import accessTokenService from "../services/accessTokenService.js";

function handleError(res) {
  errorUtil.response(res, 401, errorUtil.errorCodes.notAuthenticated, "API requires authentication to access this resource");
  logger.info("Access attempt by unauthenticatd connection");
}

async function ensureAuthenticated(req, res, next) {
  const {profileId, randomKey} = cookieUtil.getSessionCookie(req);  
  let token = accessTokenService.getToken(profileId);

  if (!token) {
    token = await accessTokenService.refreshToken(profileId, randomKey);

    if (!token) {
      handleError(res);
      return;
    }
  }

  const user = tokenUtil.verifyToken(token, config.jwtSecret);

  if (!user) {
    handleError(res);
    return;
}

  req.user = user;
  next();
};

export default ensureAuthenticated;
