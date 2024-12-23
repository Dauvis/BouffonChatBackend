import CryptoJS from "crypto-js";
import crypto from "crypto";
import {config} from "../config/config.js";
import logger from "../services/loggingService.js";

const setCookie = (res, name, value) => {
    res.cookie(name, value, { maxAge: config.cookieLife * 1000, httpOnly: true, secure: true, sameSite: 'None' });
}

const getCookie = (req, name) => {    
    const value = req.cookies[name];
    return value || '';
}

const deleteCookie = (res, name) => {
    res.clearCookie(name, { httpOnly: true, secure: true, sameSite: 'None' });
}

const encryptValues = (sub, profileId, randomKey) => {
    const catValue = `${sub}|${profileId}|${randomKey}`;
    const encrypted = CryptoJS.AES.encrypt(catValue, config.cookieSecret).toString();
    return encrypted;
}

const decryptValue = (encrypted) => {
    const catBytes = CryptoJS.AES.decrypt(encrypted, config.cookieSecret);
    const catValue = catBytes.toString(CryptoJS.enc.Utf8);
    const parsed = catValue.split("|");

    return { sub: parsed[0], profileId: parsed[1], randomKey: parsed[2]};
}

const setRefreshCookie = (res, {sub, profileId, randomKey}) => {
    if (!sub || !profileId || !randomKey) {
        throw new Error("information missing for refresh cookie");
    }

    try {
    const encrypted = encryptValues(sub, profileId, randomKey);
    setCookie(res, "bc.refresh", encrypted);
    } catch (error) {
        throw new Error("failure to set refresh cookie: " + error.message);
    }
}

const getRefreshCookie = (req) => {
    try {
        const encrypted = getCookie(req, "bc.refresh");
        const values = decryptValue(encrypted);
        return values;
    } catch (error) {
        logger.error("failure to get refresh cookie: " + error.message);
        return null;
    }
}

const deleteRefreshCookie = (res) => {
    try {
        deleteCookie(res, "bc.refresh");
    } catch (error) {
        throw new Error("failure to delete refresh cookie: " + error.message);
    }
}

const getRandomKey = () => {
    return crypto.randomBytes(32).toString('hex');
}

export default {setCookie, getCookie, setRefreshCookie, getRefreshCookie, getRandomKey, deleteCookie, deleteRefreshCookie};