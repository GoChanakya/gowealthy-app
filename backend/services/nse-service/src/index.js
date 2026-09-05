import { config } from "./config.js";
import { createApp } from "./app.js";
import { ROUTE_TABLE } from "./routes/index.js";

const app = createApp();

app.listen(config.port, () => {
    const env = config.nseEnvironment;
    const banner = env === "PRODUCTION" ? "LIVE - REAL MONEY, REAL INVESTORS" : "sandbox";
    console.log(`\nnse-service running on http://localhost:${config.port}`);
    console.log(`\n${"=".repeat(70)}`);
    console.log(`  NSE ENVIRONMENT : ${env}  ${banner}`);
    console.log(`  BASE URL        : ${config.nse.baseUrl}`);
    console.log(`  MEMBER CODE     : ${config.nse.memberCode || "(unset)"}`);
    console.log(`${"=".repeat(70)}`);
    console.log(`\nRoutes registered:`);
    for (const [method, path, description] of ROUTE_TABLE) {
        console.log(`  ${method.padEnd(4)} ${path.padEnd(34)} -> ${description}`);
    }
    console.log("");
});
