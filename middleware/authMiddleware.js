import { config } from "../config/config.js";
import apiUtil from "../util/apiUtil.js";
import logger from "../services/loggingService.js";
import tokenUtil from "../util/tokenUtil.js";

const unauthorizedResponse = (res, errorCode, message = null) => {
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

const ensureAuthenticated = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    unauthorizedResponse(
      res,
      apiUtil.errorCodes.needAuthentication,
      "access token not found"
    );
    return;
  }

  const user = tokenUtil.verifyToken(token, config.jwtSecret);

  if (!user) {
    unauthorizedResponse(
      res,
      apiUtil.errorCodes.needRefresh,
      "access token verification failed"
    );
    return;
  }
  req.user = user;
  next();
};

export default ensureAuthenticated;
