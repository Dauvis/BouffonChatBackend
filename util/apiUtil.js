const errorCodes = {
    unauthorized: "Unauthorized",
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