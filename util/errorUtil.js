import logger from "../services/loggingService.js";

class ApiError extends Error {
    constructor(message, status, code, responseMessage) {
        super(message);
        this.status = status;
        this.code = code;
        this.responseMessage = responseMessage;
    }
}
const errorCodes = {
    notAuthenticated: "NotAuthenticated",
    notAuthorized: "NotAuthorized",
    unknownError: "UnknownError",
    profileNotFound: "ProfileNotFound",
    validation: "Validation",
    templateNotFound: "TemplateNotFound",
    chatNotFound: "ChatNotFound",
    tokenLimit: "TokenLimit",
    dataStoreError: "DataStoreError",
    internalError: "InternalError",
    gptError: "GTPError",
    sessionError: "SessionError",
    noData: "NoData"
}

function errorResponse(errorCode, errorMessage) {
    return {
        errorCode: errorCode,
        message: errorMessage,
        occurrence: Date.now
    };
}

function error(status, code, logMessage, message) {
    return new ApiError(logMessage, status, code, message);
}

function response(res, status, code, message) {
    logger.debug(`Error response: [${status}]: ${message}`);
    res.status(status).json(errorResponse(code, message));
}

function handleRouterError(res, error, endpoint) {
    logger.error(`Error on endpoint ${endpoint}: ${error}`);

    if (error instanceof ApiError) {
        response(res, error.status, error.code, error.responseMessage);
    } else {
        response(res, 500, errorCodes.unknownError, "An unknown error was detected. Please return to main page and try again.");
    }
}

const errorUtil = { error, response, errorResponse, errorCodes, ApiError, handleRouterError };

export default errorUtil;