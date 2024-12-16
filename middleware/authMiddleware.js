import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import apiUtil from "../util/apiUtil.js";
import logger from "../services/loggingService.js"

const ensureAuthenticated = (req, res, next) => {
  const token = req.session.token;
  if (token) {
    jwt.verify(token, config.jwtSecret, (err, user) => {
      if (err) {
        logger.debug("Access by unauthorized user");
        return res.status(401).json(apiUtil.apiErrorResponse(apiUtil.errorCodes.unauthorized, "User not authorized"));
      }
      req.user = user;
      next();
    });
  } else {
    logger.debug("Access by unauthorized user");
    res.status(401).json(apiUtil.apiErrorResponse(apiUtil.errorCodes.unauthorized, "User not authorized"));
  }
};

export default ensureAuthenticated;