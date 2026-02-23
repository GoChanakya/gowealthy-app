const crypto = require("crypto");

/*
NSE REQUIREMENTS:
- AES 128 CBC
- IV = 16 bytes
- Salt = 16 bytes
*/

function generateRandomHex(size = 16) {
    return crypto.randomBytes(size).toString("hex");
}

function aesEncrypt(apiSecret, memberApiKey) {

    const iv = generateRandomHex(16);
    const salt = generateRandomHex(16);

    const randomNumber = Math.floor(Math.random() * 1000000000);

    const plainText = `${apiSecret}|${randomNumber}`;

    /*
    Key derivation must match Java logic.
    NSE AESUtil uses PBKDF2.
    */

    const key = crypto.pbkdf2Sync(
        memberApiKey,
        Buffer.from(salt, "hex"),
        1000,
        16,
        "sha1"
    );

    const cipher = crypto.createCipheriv(
        "aes-128-cbc",
        key,
        Buffer.from(iv, "hex")
    );

    let encrypted = cipher.update(plainText, "utf8", "base64");
    encrypted += cipher.final("base64");

    const finalPayload = `${iv}::${salt}::${encrypted}`;

    const encryptedPassword = Buffer.from(finalPayload).toString("base64");

    return {
        iv,
        salt,
        randomNumber,
        plainText,
        encryptedPassword
    };
}

module.exports = { aesEncrypt };