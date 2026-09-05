import { config } from "../config.js";
import * as otpService from "../services/otp.service.js";

// POST /api/send-otp   { email }
export async function sendOtp(req, res) {
    try {
        const { email } = req.body;

        if (!email || !email.includes("@")) {
            return res.status(400).json({ success: false, message: "Valid email is required" });
        }

        await otpService.sendOtp(email);

        res.json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
        console.error("❌ Error sending email:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send email. Please try again.",
            error: config.nodeEnv === "development" ? error.message : undefined,
        });
    }
}

// POST /api/verify-otp   { email, otp }
export async function verifyOtp(req, res) {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: "Email and OTP are required" });
        }

        const result = otpService.verifyOtp(email, otp);
        if (!result.ok) {
            return res.status(400).json({ success: false, message: result.message });
        }

        res.json({ success: true, message: "Email verified successfully", emailVerified: true });
    } catch (error) {
        console.error("❌ Error verifying OTP:", error);
        res.status(500).json({ success: false, message: "Verification failed. Please try again." });
    }
}
