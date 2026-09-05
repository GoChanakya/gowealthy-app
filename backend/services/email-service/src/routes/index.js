import { Router } from "express";
import { DOMAIN } from "../lib/mailer.js";
import * as otp from "../controllers/otp.controller.js";

export const router = Router();

router.post("/api/send-otp", otp.sendOtp);
router.post("/api/verify-otp", otp.verifyOtp);

router.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "GoWealthy Email Service is running",
        timestamp: new Date().toISOString(),
        domain: DOMAIN,
    });
});
