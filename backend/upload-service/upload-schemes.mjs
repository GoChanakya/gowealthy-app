// upload-schemes.mjs
// ─────────────────────────────────────────────────────────────────────────────
// Curates the NSE master-download JSON, enriches each scheme with the latest
// NAV from AMFI (matched by ISIN), and uploads the result to a public GCS bucket
// so the mobile app can fetch a small, real fund list.
//
// RUN:  node upload-schemes.mjs
//
// PREREQS:
//   1. backend/nse-service/schemes_app.json exists
//      (generate it by hitting POST http://localhost:3000/api/nse/master-download)
//   2. service-account-key.json is present in THIS folder (backend/upload-service/)
//   3. The bucket named in BUCKET_NAME below has been created in project
//      "gowealthy-app" with public read (allUsers -> Storage Object Viewer).
// ─────────────────────────────────────────────────────────────────────────────

import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── CONFIG — set these once ──────────────────────────────────────────────────
const BUCKET_NAME = 'gowealthy-scheme-master';       // ← must match the bucket you create
const OBJECT_PATH = 'schemes/funds.json';            // ← path inside the bucket
const PROJECT_ID  = 'gowealthy-app';                 // ← same project as service-account-key.json
const KEY_FILE    = path.join(__dirname, 'service-account-key.json');
const SOURCE_JSON = path.join(__dirname, '..', 'nse-service', 'schemes_app.json');
const AMFI_NAV_URL = 'https://www.amfiindia.com/spages/NAVAll.txt';
// ─────────────────────────────────────────────────────────────────────────────

// Turn an AMC code like "PPFASMUTUALFUND_MF" into a readable "PPFAS Mutual Fund".
function amcLabel(code = '') {
  return code
    .replace(/_MF$/i, '')
    .replace(/MUTUALFUND/i, ' Mutual Fund')
    .replace(/\s+/g, ' ')
    .trim() || code;
}

// Collapse the long NSE scheme name a little (keeps it, just tidies whitespace).
function cleanName(name = '') {
  return name.replace(/\s+/g, ' ').trim();
}

async function fetchAmfiNav() {
  console.log('🌐 Fetching latest NAV from AMFI...');
  const byIsin = {};
  try {
    const res = await fetch(AMFI_NAV_URL);
    if (!res.ok) throw new Error(`AMFI responded ${res.status}`);
    const text = await res.text();
    // Format: SchemeCode;ISIN(Growth);ISIN(Reinvest);SchemeName;NAV;Date
    for (const line of text.split(/\r?\n/)) {
      const parts = line.split(';');
      if (parts.length < 6) continue;
      const isinGrowth   = parts[1].trim();
      const isinReinvest = parts[2].trim();
      const nav          = parseFloat(parts[4]);
      const date         = parts[5].trim();
      if (isNaN(nav)) continue;
      if (isinGrowth)   byIsin[isinGrowth]   = { nav, date };
      if (isinReinvest) byIsin[isinReinvest] = { nav, date };
    }
    console.log(`✅ AMFI NAV loaded for ${Object.keys(byIsin).length} ISINs`);
  } catch (err) {
    console.warn(`⚠️  AMFI NAV fetch failed (${err.message}). Uploading without NAV.`);
  }
  return byIsin;
}

async function main() {
  // 1. Load source
  if (!fs.existsSync(SOURCE_JSON)) {
    console.error(`❌ Source file not found: ${SOURCE_JSON}`);
    console.error('   Hit POST http://localhost:3000/api/nse/master-download first.');
    process.exit(1);
  }
  if (!fs.existsSync(KEY_FILE)) {
    console.error(`❌ service-account-key.json not found in ${__dirname}`);
    process.exit(1);
  }

  const all = JSON.parse(fs.readFileSync(SOURCE_JSON, 'utf8'));
  console.log(`📦 Loaded ${all.length} schemes from master file`);

  // 2. Curate → active Growth plans that allow SIP + purchase
  const curatedRaw = all.filter(s =>
    s.amc_active_flag === 'Y' &&
    s.sip_allowed === 'Y' &&
    s.purchase_allowed === 'Y' &&
    /GROWTH/i.test(s.scheme_name) &&
    !/IDCW|DIVIDEND/i.test(s.scheme_name)
  );
  console.log(`🔍 Curated to ${curatedRaw.length} active Growth plans`);

  // 3. Enrich with NAV
  const navByIsin = await fetchAmfiNav();
  let matched = 0;

  const funds = curatedRaw.map(s => {
    const navInfo = navByIsin[s.isin] || null;
    if (navInfo) matched++;
    return {
      schemeCode: s.sch_code,
      isin:       s.isin,
      name:       cleanName(s.scheme_name),
      amc:        amcLabel(s.amc_code),
      amcCode:    s.amc_code,
      category:   s.scheme_type,          // EQUITY / DEBT / HYBRID / ELSS / ...
      minSIP:     Number(s.min_sip) || null,
      nav:        navInfo ? navInfo.nav : null,
      navDate:    navInfo ? navInfo.date : null,
    };
  });
  console.log(`💰 NAV matched for ${matched}/${funds.length} funds`);

  const payload = {
    generatedAt: new Date().toISOString(),
    count: funds.length,
    funds,
  };

  // 4. Save a local copy for inspection
  const localOut = path.join(__dirname, 'funds.json');
  fs.writeFileSync(localOut, JSON.stringify(payload));
  console.log(`📝 Wrote local copy: ${localOut} (${(fs.statSync(localOut).size / 1024).toFixed(0)} KB)`);

  // 5. Upload to GCS
  const storage = new Storage({ projectId: PROJECT_ID, keyFilename: KEY_FILE });
  const file = storage.bucket(BUCKET_NAME).file(OBJECT_PATH);

  console.log(`☁️  Uploading to gs://${BUCKET_NAME}/${OBJECT_PATH} ...`);
  await file.save(JSON.stringify(payload), {
    contentType: 'application/json',
    metadata: { cacheControl: 'public, max-age=3600' },
  });

  // If the bucket uses fine-grained ACLs, make the object public.
  // (With uniform bucket-level access this throws — that's fine; set public at
  //  the bucket level via allUsers -> Storage Object Viewer instead.)
  try {
    await file.makePublic();
    console.log('🔓 Object marked public via ACL');
  } catch {
    console.log('ℹ️  Skipped per-object ACL (uniform bucket-level access). Ensure the BUCKET grants allUsers -> Storage Object Viewer.');
  }

  const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${OBJECT_PATH}`;
  console.log(`\n✅ Done. Public URL:\n   ${publicUrl}\n`);
}

main().catch(err => {
  console.error('❌ Upload failed:', err.message);
  process.exit(1);
});
