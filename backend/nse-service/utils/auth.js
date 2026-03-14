function buildAuthHeader(loginId, encryptedPassword) {

    const raw = `${loginId}:${encryptedPassword}`;

    const base64Auth = Buffer.from(raw).toString("base64");

    return `Basic ${base64Auth}`;
}

module.exports = { buildAuthHeader };