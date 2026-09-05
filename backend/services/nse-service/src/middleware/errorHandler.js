import { logActivity } from "../lib/logger.js";
import { ValidationError } from "../lib/http.js";

/**
 * Central error handler.
 *  - ValidationError  -> 400 { success:false, error }
 *  - NSE / axios error -> NSE status (or 500) { success:false, route, error }
 * Payload shapes are unchanged from the original single-file service.
 */
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
    if (err instanceof ValidationError) {
        return res.status(err.statusCode).json({ success: false, error: err.message });
    }

    const routeName = req.routeName || req.path;
    const status = err.response?.status || 500;
    const error = err.response?.data || err.message;

    logActivity(routeName, "nse_error", { httpStatus: status, error });
    console.error(`[${routeName}]`, error);

    res.status(status).json({ success: false, route: routeName, error });
}
