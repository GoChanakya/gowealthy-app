/**
 * Structured one-line JSON activity log. Cloud Run / Cloud Logging picks these
 * up from stdout and indexes the fields.
 */
export function logActivity(route, event, details = {}) {
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        event,
        ...details,
    }));
}
