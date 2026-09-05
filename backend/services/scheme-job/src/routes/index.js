import { Router } from "express";
import { refreshSchemeMaster } from "../services/masterDownload.service.js";

export const router = Router();

// POST /api/nse/master-download  { file_type? = "SCH" }
// Triggered by Cloud Scheduler (or manually) to refresh the public funds.json.
router.post("/api/nse/master-download", async (req, res) => {
    console.log("hit");
    try {
        const file_type = req.body?.file_type || "SCH";
        const count = await refreshSchemeMaster(file_type);
        res.json({ success: true, count });
    } catch (err) {
        const routeName = "master-download";
        console.error(`❌ [${routeName}]`, err.response?.data || err.message);
        const status = err.response?.status || 500;
        res.status(status).json({
            success: false,
            route: routeName,
            error: err.response?.data || err.message,
        });
    }
});

router.get("/api/health", (req, res) => {
    res.json({ ok: true, service: "scheme-job", time: new Date().toISOString() });
});
