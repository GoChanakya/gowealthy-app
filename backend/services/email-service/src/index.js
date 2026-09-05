import { config } from "./config.js";
import { createApp } from "./app.js";
import { startOtpCleanup } from "./lib/otpStore.js";

console.log("🚀 Starting FREE Mailgun Email Service...");
console.log("📧 Domain:", config.mailgun.domain);
console.log("🆓 FREE Tier: 100 emails/day");

const app = createApp();
startOtpCleanup();

app.listen(config.port, "0.0.0.0", () => {
    console.log(`🚀 GoWealthy Email Service running on port ${config.port}`);
    console.log(`📧 Mailgun Domain: ${config.mailgun.domain || "Not configured"}`);
    console.log(`🔑 API Key: ${config.mailgun.apiKey ? "Set ✅" : "Missing ❌"}`);
});
