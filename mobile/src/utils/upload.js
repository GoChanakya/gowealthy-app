import { File } from 'expo-file-system';

/**
 * Uploads a local file to a GCS v4 signed POST policy.
 *
 * Note on the `File`: expo's fetch (which replaces the global one from SDK 54
 * onward) rejects React Native's `{ uri, type, name }` form part with
 * "Unsupported FormDataPart implementation". It accepts strings, Blobs, and
 * anything exposing `bytes()` — which is what expo-file-system's `File` is.
 *
 * @param {string}  url    policy.url returned by /api/generate-upload-url
 * @param {object}  fields policy.fields returned alongside it
 * @param {string}  uri    local file:// URI (from the image picker)
 * @returns {Promise<Response>} the successful GCS response
 */
export async function uploadToSignedPost({ url, fields, uri }) {
  const formData = new FormData();

  // The signed policy fields must all precede the file — GCS requires "file"
  // to be the last part of the multipart body and ignores anything after it.
  Object.entries(fields).forEach(([key, value]) => {
    formData.append(key, value);
  });

  formData.append('file', new File(uri));

  const response = await fetch(url, { method: 'POST', body: formData });

  if (!response.ok) {
    const errText = await response.text();
    console.error('GCS Upload Error:', errText);
    throw new Error(`Failed to upload to Google Cloud Storage (${response.status})`);
  }

  return response;
}
