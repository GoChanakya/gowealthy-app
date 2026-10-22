import { Storage } from "@google-cloud/storage";
import { config } from "../config.js";

export const storage = new Storage({
    projectId: config.gcs.projectId,
    ...(config.gcs.keyFilename ? { keyFilename: config.gcs.keyFilename } : {}),
});
