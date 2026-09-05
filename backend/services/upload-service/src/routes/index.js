import { Router } from "express";
import { createSignedUploadPolicy } from "../services/upload.service.js";

export const router = Router();

// POST /api/generate-upload-url  { fileName, contentType, userId, docType }
router.post("/api/generate-upload-url", async (req, res) => {
    try {
        const { fileName, contentType, userId, docType } = req.body;
        res.json(await createSignedUploadPolicy({ fileName, contentType, userId, docType }));
    } catch (error) {
        console.error("Error generating signed POST URL:", error);
        res.status(500).json({ error: "Failed to generate upload URL" });
    }
});

router.get("/api/health", (req, res) => {
    res.json({ ok: true, service: "upload-service", time: new Date().toISOString() });
});
