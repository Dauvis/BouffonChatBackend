const errorCodes = {
    notAuthenticated: "NotAuthenticated",
    needAuthentication: "NeedAuthentication",
    needRefresh: "NeedRefresh",
    unknownError: "UnknownError",
    profileNotFound: "ProfileNotFound",

    gpt: "GPT",
    api: "API",
    security: "Security",
    validation: "Validation"
}

function apiErrorResponse(errorCode, errorMessage) {
    return {
        errorCode: errorCode,
        message: errorMessage,
        occurrence: Date.now
    };
}

export default { errorCodes, apiErrorResponse };