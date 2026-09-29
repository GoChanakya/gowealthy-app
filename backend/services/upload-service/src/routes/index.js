import { Router } from "express";
import { createSignedUploadPolicy } from "../services/upload.service.js";
import {
    getFundCard,
    getFundRecommendations,
    RecommendationError,
} from "../services/fund-recommendations.service.js";

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

router.get("/api/mf/recommendations", async (req, res) => {
    try {
        res.json(await getFundRecommendations({
            personaCode: req.query.persona_code,
            limit: req.query.limit,
        }));
    } catch (error) {
        console.error("Error loading fund recommendations:", error.message);
        res.status(error instanceof RecommendationError ? error.status : 500).json({
            error: error instanceof RecommendationError ? error.message : "Failed to load fund recommendations",
        });
    }
});

router.post("/api/mf/recommendations", async (req, res) => {
    try {
        const userProfile = req.body?.profile ?? req.body;
        res.json(await getFundRecommendations({
            personaCode: userProfile?.persona_code,
            userProfile,
            limit: req.body?.limit,
        }));
    } catch (error) {
        console.error("Error loading personalized fund recommendations:", error.message);
        res.status(error instanceof RecommendationError ? error.status : 500).json({
            error: error instanceof RecommendationError ? error.message : "Failed to load fund recommendations",
        });
    }
});

router.get("/api/mf/fund-cards/:schemeCode", async (req, res) => {
    try {
        res.json(await getFundCard({
            schemeCode: req.params.schemeCode,
            personaCode: req.query.persona_code,
        }));
    } catch (error) {
        console.error("Error loading fund card:", error.message);
        res.status(error instanceof RecommendationError ? error.status : 500).json({
            error: error instanceof RecommendationError ? error.message : "Failed to load fund card",
        });
    }
});

router.post("/api/mf/fund-cards/:schemeCode", async (req, res) => {
    try {
        const userProfile = req.body?.profile ?? req.body;
        res.json(await getFundCard({
            schemeCode: req.params.schemeCode,
            personaCode: userProfile?.persona_code,
            userProfile,
        }));
    } catch (error) {
        console.error("Error loading personalized fund card:", error.message);
        res.status(error instanceof RecommendationError ? error.status : 500).json({
            error: error instanceof RecommendationError ? error.message : "Failed to load fund card",
        });
    }
});
