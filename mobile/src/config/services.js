import Constants from 'expo-constants';

/**
 * Service URLs, built from the dev machine's LAN IPv4 address.
 *
 * In a dev build / Expo Go, the packager already told the app which host it was
 * downloaded from — that host IS the laptop's LAN IP, so we reuse it instead of
 * hardcoding one that goes stale every time the router hands out a new lease.
 *
 * Resolution order:
 *   1. EXPO_PUBLIC_BASE_IP env var  (put it in .env to pin a host)
 *   2. Expo dev-server host         (auto, matches whatever `expo start` printed)
 *   3. FALLBACK_IP below            (release builds, where there is no packager)
 */

// Used only when nothing can be detected — e.g. a standalone release build.
// Point this at the deployed host once the services are no longer on a laptop.
const FALLBACK_IP = '192.168.1.18';

// hostUri looks like "192.168.1.18:8081" or "exp://192.168.1.18:8081".
// Different SDK versions park it in different places, so check all of them.
function readDevServerHost() {
  const raw =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.debuggerHost ||
    Constants.linkingUri ||
    '';

  if (!raw) return null;

  // Strip any scheme, then the port/path, leaving a bare host.
  const host = raw.replace(/^\w+:\/\//, '').split('/')[0].split(':')[0];

  return host || null;
}

function resolveBaseIp() {
  const fromEnv = process.env.EXPO_PUBLIC_BASE_IP;
  if (fromEnv) return fromEnv;

  const host = readDevServerHost();
  // "localhost" shows up on the iOS simulator / web, where it is correct as-is.
  if (host) return host;

  return FALLBACK_IP;
}

export const BASE_IP = resolveBaseIp();

export const BACKEND_URL       = `http://${BASE_IP}:3001`;
export const NSE_SERVICE_URL   = `http://${BASE_IP}:3000`;
export const EMAIL_SERVICE_URL = `http://${BASE_IP}:5000`;

if (__DEV__) {
  console.log(`[services] BASE_IP = ${BASE_IP}`);
}

// Public GCS location of the NAV-enriched NSE fund list.
// SCHEMES_BUCKET + SCHEMES_PATH must exactly match BUCKET_NAME + OBJECT_PATH in
// backend/upload-service/refresh-funds.mjs.
export const SCHEMES_BUCKET = 'mf-data-public';
export const SCHEMES_PATH   = 'nse-schemes/funds.json';
export const SCHEMES_URL    = `https://storage.googleapis.com/${SCHEMES_BUCKET}/${SCHEMES_PATH}`;
