import { aesEncrypt } from "./encryption.js";
import { buildAuthHeader } from "./auth.js";

/**
 * @typedef {object} NseCredentials
 * @property {string} loginId        NSE_LOGIN_ID
 * @property {string} apiSecret      NSE_API_SECRET
 * @property {string} memberApiKey   NSE_MEMBER_API_KEY
 * @property {string} memberCode     NSE_MEMBER_CODE
 * @property {string} baseUrl        NSE_BASE_URL
 * @property {string} [referer]      NSE_REFERER (defaults to baseUrl origin)
 * @property {string} [origin]       NSE_ORIGIN
 * @property {string} [userAgent]    NSE_USER_AGENT
 */

/**
 * Authorization header for a single NSE request. A fresh random number is
 * encrypted into every call, per spec.
 * @param {NseCredentials} creds
 */
export function buildNseAuthHeader(creds) {
    const enc = aesEncrypt(creds.apiSecret, creds.memberApiKey);
    return buildAuthHeader(creds.loginId, enc.encryptedPassword);
}

/** @param {NseCredentials} creds */
export function nseReferer(creds) {
    return creds.referer || `${new URL(creds.baseUrl).origin}/`;
}

/**
 * Full header set for an NSE API call.
 * @param {NseCredentials} creds
 */
export function buildNseHeaders(creds) {
    const headers = {
        Authorization: buildNseAuthHeader(creds),
        memberId: creds.memberCode,
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": creds.userAgent || "PostmanRuntime/7.51.1",
        Accept: "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US",
        Connection: "keep-alive",
        Referer: nseReferer(creds),
    };
    if (creds.origin) headers.Origin = creds.origin;
    return headers;
}

/**
 * Which NSE environment a base URL points at. Derived from the host so it
 * cannot drift out of sync with the URL that requests actually go to.
 * Hosts per NSE MFSS spec v1.9.6, page 6.
 * @param {string} baseUrl
 */
export function nseEnvironment(baseUrl) {
    const host = new URL(baseUrl).hostname;
    if (host === "nseinvestuat.nseindia.com") return "UAT";
    if (host === "www.nseinvest.com" || host === "nseinvest.com") return "PRODUCTION";
    return `UNKNOWN (${host})`;
}
