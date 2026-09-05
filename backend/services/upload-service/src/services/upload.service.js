import { config } from "../config.js";
import { bucket, bucketName } from "../lib/storage.js";

/**
 * Signed POST policy for a direct browser/app upload to
 * <docType>/<userId>/<fileName>. The "aadhaar" doc type is stored under the
 * legacy "adhar" folder name to match existing objects.
 */
export async function createSignedUploadPolicy({ fileName, contentType, userId, docType }) {
    const folderName = docType === "aadhaar" ? "adhar" : docType;
    const filePath = `${folderName}/${userId}/${fileName}`;
    const file = bucket.file(filePath);

    const [policy] = await file.generateSignedPostPolicyV4({
        expires: Date.now() + config.gcs.signedPolicyTtlMs,
        fields: {
            "Content-Type": contentType,
        },
    });

    return {
        url: policy.url,
        fields: policy.fields,
        fileUrl: `https://storage.googleapis.com/${bucketName}/${filePath}`,
        gcsUri: `gs://${bucketName}/${filePath}`,
    };
}
