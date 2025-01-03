import CryptoJS from "crypto-js";
import crypto from "crypto";
import config from "../config/config.js";
import logger from "../services/loggingService.js";

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
        throw new Error("information missing for refresh cookie");
    }

    try {
    const encrypted = encryptValues(profileId, randomKey);
    setCookie(res, "bc.session", encrypted);
    } catch (error) {
        throw new Error("failure to set refresh cookie: " + error.message);
    }
}

function getSessionCookie(req) {
    try {
        const encrypted = getCookie(req, "bc.session");
        const values = decryptValue(encrypted);
        return values;
    } catch (error) {
        logger.error("failure to get refresh cookie: " + error.message);
        return null;
    }
}

function deleteSessionCookie(res) {
    try {
        deleteCookie(res, "bc.session");
    } catch (error) {
        throw new Error("failure to delete refresh cookie: " + error.message);
    }
}

function getRandomKey() {
    return crypto.randomBytes(32).toString('hex');
}

const cookieUtil = {setCookie, getCookie, setSessionCookie, getSessionCookie, getRandomKey, deleteCookie, deleteSessionCookie};

export default cookieUtil;