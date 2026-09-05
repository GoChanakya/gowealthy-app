import { Storage } from "@google-cloud/storage";
import { config } from "../config.js";

// Uses default credentials: the Cloud Run service account on GCP, or
// GOOGLE_APPLICATION_CREDENTIALS / gcloud auth locally.
const storage = new Storage();
const bucket = storage.bucket(config.gcs.bucketName);

/** Writes `jsonData` to the configured public object as pretty JSON. */
export async function uploadSchemesJson(jsonData) {
    const file = bucket.file(config.gcs.objectPath);

    await file.save(JSON.stringify(jsonData, null, 2), {
        contentType: "application/json",
        resumable: false,
    });

    console.log(`Uploaded to gs://${config.gcs.bucketName}/${config.gcs.objectPath}`);
}
