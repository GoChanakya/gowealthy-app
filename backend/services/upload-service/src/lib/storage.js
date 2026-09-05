import { Storage } from "@google-cloud/storage";
import { config } from "../config.js";

const storage = new Storage({
    projectId: config.gcs.projectId,
    ...(config.gcs.keyFilename ? { keyFilename: config.gcs.keyFilename } : {}),
});

export const bucketName = config.gcs.bucketName;
export const bucket = storage.bucket(bucketName);
