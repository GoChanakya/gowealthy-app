import { config } from "./config.js";
import { createApp } from "./app.js";

const app = createApp();

app.listen(config.port, "0.0.0.0", () => {
    const { bucketName, personalityScoresPath } = config.fundRecommendations;
    console.log(`Recommendation service running on port ${config.port}`);
    console.log(`Scores: gs://${bucketName}/${personalityScoresPath} (${config.gcs.keyFilename ? "key file" : "default credentials"})`);
});
