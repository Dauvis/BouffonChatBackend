import { config } from "../config/config.js";
import apiUtil from "../util/apiUtil.js";
import logger from "../services/loggingService.js";
import tokenUtil from "../util/tokenUtil.js";

const unauthorizedResponse = (res, errorCode, message = null) => {
  logger.debug("Access by unauthorized user: " + message || "no additional information given");
  return res
    .status(401)
    .json(
      apiUtil.apiErrorResponse(
        errorCode,
        "Unauthenticated: refresh or authentication necessary"
      )
    );
};

const ensureAuthenticated = (req, res, next) => {
  const token = req.session.token;
  if (token) {
    const user = tokenUtil.verifyToken(token, config.jwtSecret);

    if (!user) {
      unauthorizedResponse(res, apiUtil.errorCodes.needRefresh, "access token verification failed");
      return;
    }

    req.user = user;
    next();
  } else {
    unauthorizedResponse(res, apiUtil.errorCodes.needAuthentication, "session lacks access token");
  }
};

export default ensureAuthenticated;
