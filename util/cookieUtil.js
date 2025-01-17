import CryptoJS from "crypto-js";
import crypto from "crypto";
import config from "../config/config.js";
import logger from "../services/loggingService.js";
import errorUtil from "./errorUtil.js";

function setCookie(res, name, value) {
    res.cookie(name, value, { maxAge: config.cookieLife * 1000, httpOnly: true, secure: true, sameSite: 'None' });
}

function getCookie(req, name) {    
    const value = req.cookies[name];
    return value || '';
}

function deleteCookie(res, name) {
    res.clearCookie(name, { httpOnly: true, secure: true, sameSite: 'None' });
}

function encryptValues(profileId, randomKey) {
    const catValue = `${profileId}|${randomKey}`;
    const encrypted = CryptoJS.AES.encrypt(catValue, config.cookieSecret).toString();
    return encrypted;
}

function decryptValue(encrypted) {
    const catBytes = CryptoJS.AES.decrypt(encrypted, config.cookieSecret);
    const catValue = catBytes.toString(CryptoJS.enc.Utf8);
    const parsed = catValue.split("|");

    return { profileId: parsed[0], randomKey: parsed[1]};
}

function setSessionCookie(res, {profileId, randomKey}) {
    if (!profileId || !randomKey) {
        throw errorUtil.error(500, errorUtil.errorCodes.internalError,
            "Attempting to call setSessionCookie without profile identifier or randomized key",
            "Internal error establishing session"
        );
    }

    try {
    const encrypted = encryptValues(profileId, randomKey);
    setCookie(res, "bc.session", encrypted);
    } catch (error) {
        throw errorUtil.error(500, errorUtil.errorCodes.sessionError,
            `Failure to set session cookie: ${error}`,
            "Internal error establishing session"
        );
    }
}

function getSessionCookie(req) {
    try {
        const encrypted = getCookie(req, "bc.session");
        const values = decryptValue(encrypted);
        return values;
    } catch (error) {        
        logger.error(`Failure to obtain session information: ${error}`);
        return null;
    }
}

function deleteSessionCookie(res) {
    try {
        deleteCookie(res, "bc.session");
    } catch (error) {
        throw errorUtil.error(500, errorUtil.errorCodes.sessionError,
            `Failure to remove session information: ${error}`,
            "Internal error attempting to clear session data"
        );
    }
}

function getRandomKey() {
    return crypto.randomBytes(32).toString('hex');
}

const cookieUtil = {setCookie, getCookie, setSessionCookie, getSessionCookie, getRandomKey, deleteCookie, deleteSessionCookie};

export default cookieUtil;