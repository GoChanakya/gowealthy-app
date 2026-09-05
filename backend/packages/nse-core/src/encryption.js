import crypto from "crypto";

/**
 * Encrypts the NSE API secret exactly as required by the NSE MFSS spec
 * (v1.9.6, "Common Authentication For All APIs"):
 *
 *   plain_text         = API Secret (PWD)|<RANDOM Number>
 *   aes_encrypted_val  = AES128(salt, iv, API Member License KEY, plain_text)
 *   Encrypted Password = base64(iv::salt::aes_encrypted_val)
 *
 * @param {string} apiSecret  NSE API secret (PWD)
 * @param {string} apiKey     NSE API member license key
 * @returns {{ plainText: string, encryptedPassword: string }}
 */
export function aesEncrypt(apiSecret, apiKey) {
    const iv = crypto.randomBytes(16).toString("hex");
    const salt = crypto.randomBytes(16).toString("hex");

    const randomNumber = Math.floor(Math.random() * 1000000000);
    const plainText = `${apiSecret}|${randomNumber}`;

    const key = crypto.pbkdf2Sync(apiKey, Buffer.from(salt, "hex"), 1000, 16, "sha1");
    const cipher = crypto.createCipheriv("aes-128-cbc", key, Buffer.from(iv, "hex"));

    let encrypted = cipher.update(plainText, "utf8", "base64");
    encrypted += cipher.final("base64");

    const combined = `${iv}::${salt}::${encrypted}`;
    const encryptedPassword = Buffer.from(combined).toString("base64");

    return { plainText, encryptedPassword };
}
