import { config } from "../config/config.js";
import apiUtil from "../util/apiUtil.js";
import logger from "../services/loggingService.js";
import tokenUtil from "../util/tokenUtil.js";

const unauthorizedResponse = (res) => {
  logger.debug("Access by unauthorized user");
  return res
    .status(401)
    .json(
      apiUtil.apiErrorResponse(
        apiUtil.errorCodes.unauthorized,
        "User not authorized"
      )
    );
};

const ensureAuthenticated = (req, res, next) => {
  const token = req.session.token;
  if (token) {
    const user = tokenUtil.verifyToken(token, config.jwtSecret);

    if (!user) {
      unauthorizedResponse(res);
      return;
    }

    req.user = user;
    next();
  } else {
    unauthorizedResponse(res);
  }
};

export default ensureAuthenticated;
