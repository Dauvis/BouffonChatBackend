const errorCodes = {
    notAuthenticated: "NotAuthenticated",
    needAuthentication: "NeedAuthentication",
    needRefresh: "NeedRefresh",
    unknownError: "UnknownError",
    profileNotFound: "ProfileNotFound",
    validation: "Validation",

    gpt: "GPT",
    api: "API",
    security: "Security",
}

function apiErrorResponse(errorCode, errorMessage) {
    return {
        errorCode: errorCode,
        message: errorMessage,
        occurrence: Date.now
    };
}

export default { errorCodes, apiErrorResponse };