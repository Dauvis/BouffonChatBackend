const errorCodes = {
    notAuthenticated: "NotAuthenticated",
    needAuthentication: "NeedAuthentication",
    unknownError: "UnknownError",
    profileNotFound: "ProfileNotFound",
    validation: "Validation",
}

function apiErrorResponse(errorCode, errorMessage) {
    return {
        errorCode: errorCode,
        message: errorMessage,
        occurrence: Date.now
    };
}

const apiUtil = { errorCodes, apiErrorResponse };

export default apiUtil;