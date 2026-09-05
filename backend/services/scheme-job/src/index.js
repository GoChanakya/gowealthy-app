import { config } from "./config.js";
import { createApp } from "./app.js";

const app = createApp();

app.listen(config.port, "0.0.0.0", () => {
    console.log(`Backend running on port ${config.port}`);
    console.log(`NSE base URL: ${config.nse.baseUrl}`);
    console.log(`Publishing to gs://${config.gcs.bucketName}/${config.gcs.objectPath}`);
});
