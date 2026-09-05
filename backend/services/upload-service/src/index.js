import { config } from "./config.js";
import { createApp } from "./app.js";

const app = createApp();

app.listen(config.port, "0.0.0.0", () => {
    console.log(`Backend running on port ${config.port}`);
    console.log(`GCS bucket: ${config.gcs.bucketName} (${config.gcs.keyFilename ? "key file" : "default credentials"})`);
});
