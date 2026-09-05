/**
 * Small HTTP helpers shared by every controller.
 */

/** A 400 with the exact `{ success: false, error }` body the app expects. */
export class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
        this.statusCode = 400;
    }
}

/**
 * Wraps an async controller so rejections reach the error middleware, tagged
 * with the route name used in logs and error payloads.
 */
export function asyncHandler(routeName, fn) {
    return (req, res, next) => {
        req.routeName = routeName;
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * Names of `fields` that are missing on `rec`.
 * With `allowZero`, the string "0" counts as present (matches NSE flag semantics).
 */
export function missingFields(rec, fields, { allowZero = false } = {}) {
    return fields.filter((f) => {
        const v = rec?.[f];
        return allowZero ? (!v && v !== "0") : !v;
    });
}

/** Throws a ValidationError unless `value` is a non-empty array. */
export function requireNonEmptyArray(value, name) {
    if (!value || !Array.isArray(value) || value.length === 0) {
        throw new ValidationError(`${name} array is required`);
    }
}
