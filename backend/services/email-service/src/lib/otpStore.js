import { config } from "../config.js";

/**
 * OTP storage.
 *
 * The default implementation is in-memory, which is correct for a single
 * instance. When this service runs with more than one Cloud Run instance the
 * send and verify calls can land on different instances, so either pin
 * max-instances=1 or swap this module for a shared store (Firestore / Redis)
 * that implements the same get/set/delete/entries contract.
 */
class MemoryOtpStore {
    #map = new Map();

    get(email) { return this.#map.get(email); }
    set(email, record) { this.#map.set(email, record); }
    delete(email) { this.#map.delete(email); }
    entries() { return this.#map.entries(); }

    /** Drops expired records. Returns the emails that were removed. */
    cleanup(now = Date.now()) {
        const removed = [];
        for (const [email, data] of this.#map.entries()) {
            if (now > data.expiresAt) {
                this.#map.delete(email);
                removed.push(email);
            }
        }
        return removed;
    }
}

export const otpStore = new MemoryOtpStore();

/** Periodic expiry sweep (keeps the process from holding stale OTPs). */
export function startOtpCleanup() {
    const timer = setInterval(() => {
        for (const email of otpStore.cleanup()) {
            console.log(`🧹 Cleaned up expired OTP for ${email}`);
        }
    }, config.otp.cleanupIntervalMs);
    timer.unref?.();
    return timer;
}
