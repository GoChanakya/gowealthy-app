import crypto from "crypto";
import { config } from "../config.js";
import { otpStore } from "../lib/otpStore.js";
import { sendMail, DOMAIN } from "../lib/mailer.js";
import { buildOtpMessage } from "../templates/otpEmail.js";

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

/** Generates, stores and emails a fresh OTP for `email`. */
export async function sendOtp(email) {
    const otp = generateOTP();

    otpStore.set(email, {
        otp,
        expiresAt: Date.now() + config.otp.ttlMs,
        attempts: 0,
    });

    await sendMail(buildOtpMessage({ email, otp, domain: DOMAIN }));
    console.log(`✅ OTP sent to ${email}: ${otp}`);
}

/**
 * Verifies `otp` for `email`.
 * Returns { ok: true } or { ok: false, message } with the exact user-facing
 * messages the app displays.
 */
export function verifyOtp(email, otp) {
    const storedData = otpStore.get(email);

    if (!storedData) {
        return { ok: false, message: "OTP not found. Please request a new one." };
    }

    if (Date.now() > storedData.expiresAt) {
        otpStore.delete(email);
        return { ok: false, message: "OTP has expired. Please request a new one." };
    }

    if (storedData.attempts >= config.otp.maxAttempts) {
        otpStore.delete(email);
        return { ok: false, message: "Too many failed attempts. Please request a new OTP." };
    }

    if (storedData.otp !== otp.toString()) {
        storedData.attempts++;
        otpStore.set(email, storedData);
        return { ok: false, message: `Invalid OTP. ${config.otp.maxAttempts - storedData.attempts} attempts remaining.` };
    }

    otpStore.delete(email);
    console.log(`✅ Email verified: ${email}`);
    return { ok: true };
}
