const crypto = require("crypto");

function aesEncrypt(apiSecret, apiKey) {

    const iv = crypto.randomBytes(16).toString("hex");
    const salt = crypto.randomBytes(16).toString("hex");

    const randomNumber =
        Math.floor(Math.random() * 1000000000);

    const plainText =
        `${apiSecret}|${randomNumber}`;

    const key =
        crypto.pbkdf2Sync(
            apiKey,
            Buffer.from(salt, "hex"),
            1000,
            16,
            "sha1"
        );

    const cipher =
        crypto.createCipheriv(
            "aes-128-cbc",
            key,
            Buffer.from(iv, "hex")
        );

    let encrypted =
        cipher.update(
            plainText,
            "utf8",
            "base64"
        );

    encrypted += cipher.final("base64");

    const combined =
        `${iv}::${salt}::${encrypted}`;

    const encryptedPassword =
        Buffer.from(combined).toString("base64");

    return {
        plainText,
        encryptedPassword
    };
}

module.exports = { aesEncrypt };