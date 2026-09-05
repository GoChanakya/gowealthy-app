/**
 * Service URLs, built from this machine's LAN IPv4 address.
 *
 * The IP is detected automatically, so nothing has to be edited when the
 * router hands out a new lease or you switch between Wi-Fi and a hotspot.
 * This is the address the phone should be talking to in local development.
 *
 * Override order:
 *   1. BASE_IP env var          (e.g. BASE_IP=10.0.0.7 npm run lan-ip)
 *   2. auto-detected LAN IPv4   (os.networkInterfaces)
 *   3. 127.0.0.1                (last resort, offline)
 *
 * Run `npm run lan-ip` to print what it detected.
 */
import os from "os";

// Adapters that exist on a dev machine but are never the LAN address:
// VirtualBox / VMware / Hyper-V / WSL / Docker / Bluetooth / loopback-ish.
const VIRTUAL_ADAPTER = /(virtual|vbox|vmware|hyper-v|wsl|docker|bridge|bluetooth|loopback|tailscale|zerotier|tap|tun)/i;

// Private ranges, most-preferred first: home Wi-Fi, then carrier hotspots, then
// corporate 10.x. APIPA (169.254.x) means "no DHCP" and is worthless here.
function rangeRank(ip) {
    if (ip.startsWith("192.168.")) return 0;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return 1;
    if (ip.startsWith("10.")) return 2;
    if (ip.startsWith("169.254.")) return 9;
    return 3;
}

export function detectLanIPv4() {
    const candidates = [];

    for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
        for (const addr of addrs || []) {
            // Node <18 reports family as 'IPv4', >=18 as 4 - accept both.
            const isV4 = addr.family === "IPv4" || addr.family === 4;
            if (!isV4 || addr.internal) continue;

            candidates.push({
                name,
                address: addr.address,
                virtual: VIRTUAL_ADAPTER.test(name),
                rank: rangeRank(addr.address),
            });
        }
    }

    candidates.sort((a, b) => Number(a.virtual) - Number(b.virtual) || a.rank - b.rank);

    return candidates.length ? candidates[0].address : null;
}

export const DETECTED_IP = detectLanIPv4();
export const BASE_IP = process.env.BASE_IP || DETECTED_IP || "127.0.0.1";

// Local dev ports, matching mobile/src/config/services.js.
export const NSE_SERVICE_URL = `http://${BASE_IP}:3000`;
export const BACKEND_URL = `http://${BASE_IP}:3001`;
export const EMAIL_SERVICE_URL = `http://${BASE_IP}:5000`;
export const SCHEME_JOB_URL = `http://${BASE_IP}:8080`;

console.log(`BASE_IP           ${BASE_IP}${process.env.BASE_IP ? " (from env)" : ""}`);
console.log(`NSE_SERVICE_URL   ${NSE_SERVICE_URL}`);
console.log(`BACKEND_URL       ${BACKEND_URL}   (upload-service)`);
console.log(`EMAIL_SERVICE_URL ${EMAIL_SERVICE_URL}`);
console.log(`SCHEME_JOB_URL    ${SCHEME_JOB_URL}`);
