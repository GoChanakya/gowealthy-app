/**
 * Builds the HTTP Basic Authorization header
 * required by the NSE API.
 *
 * @param {string} loginId
 * @param {string} encryptedPassword
 * @returns {string}
 */
export function buildAuthHeader(loginId, encryptedPassword) {
    const raw = `${loginId}:${encryptedPassword}`;

    const base64Auth = Buffer.from(raw).toString("base64");

    return `Basic ${base64Auth}`;
}