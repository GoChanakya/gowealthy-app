import { logActivity } from "../lib/logger.js";

/**
 * Request-level activity log for /api/nse routes. Records body keys rather
 * than values so sensitive PAN, bank-account and credential values are never
 * written to the console.
 */
export function activityLog(req, res, next) {
    if (!req.path.startsWith("/api/nse")) return next();
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    req.activityId = requestId;
    logActivity(req.path, "request", {
        requestId,
        method: req.method,
        bodyKeys: Object.keys(req.body || {}),
    });
    res.on("finish", () => logActivity(req.path, "response", {
        requestId,
        method: req.method,
        statusCode: res.statusCode,
    }));
    next();
}
