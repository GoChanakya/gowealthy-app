import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import { Storage } from "@google-cloud/storage";
import nseClient from "./clients/nseClient.js";
import { aesEncrypt } from "./utils/encryption.js";
import { buildAuthHeader } from "./utils/auth.js";
dotenv.config();


const app = express();
const port = process.env.PORT || 8080;
app.use(cors());
app.use(express.json());


function getRequiredEnv(name) {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env var: ${name}`);
    return v;
}

function buildNseAuthHeader() {
    const enc = aesEncrypt(
        getRequiredEnv("NSE_API_SECRET"),
        getRequiredEnv("NSE_MEMBER_API_KEY")
    );
    return buildAuthHeader(getRequiredEnv("NSE_LOGIN_ID"), enc.encryptedPassword);
}

function nseReferer() {
    const base = process.env.NSE_BASE_URL || "https://nseinvestuat.nseindia.com";
    return process.env.NSE_REFERER || `${new URL(base).origin}/`;
}

function buildNseHeaders() {
    const headers = {
        Authorization: buildNseAuthHeader(),
        memberId: getRequiredEnv("NSE_MEMBER_CODE"),
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": process.env.NSE_USER_AGENT || "PostmanRuntime/7.51.1",
        Accept: "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US",
        Connection: "keep-alive",
        Referer: nseReferer(),
    };
    if (process.env.NSE_ORIGIN) headers.Origin = process.env.NSE_ORIGIN;
    return headers;
}

// Shared NSE error handler — logs + returns clean JSON to the frontend
function handleNseError(err, res, routeName) {
    console.error(`❌ [${routeName}]`, err.response?.data || err.message);
    const status = err.response?.status || 500;
    res.status(status).json({
        success: false,
        route: routeName,
        error: err.response?.data || err.message,
    });
}




// Initialize Google Cloud Storage
const storage = new Storage();

const bucketName = "mf-data-public";
const bucket = storage.bucket(bucketName);

// Object path inside the bucket
const destinationFile = "nse-schemes/funds.json";




async function uploadToGCS(jsonData) {
    const file = bucket.file(destinationFile);

    await file.save(
        JSON.stringify(jsonData, null, 2),
        {
            contentType: "application/json",
            resumable: false
        }
    );

    console.log(`Uploaded to gs://${bucketName}/${destinationFile}`);
}



function parseMasterDownload(rawText) {
    // Split into lines, drop empty ones (NSE files often end with trailing \n or a stray blank line)
    const lines = rawText.split(/\r?\n/).filter(line => line.trim().length > 0);

    if (lines.length < 2) return [];

    // Header row — split on "|", trim, drop trailing empty column (file ends with a "|")
    const headers = lines[0].split("|").map(h => h.trim()).filter(h => h.length > 0);

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split("|");
        if (cols.length < 2) continue; // skip junk/blank lines

        const row = {};
        headers.forEach((h, idx) => {
            row[h] = (cols[idx] ?? "").trim();
        });
        rows.push(row);
    }

    // Map to the clean shape your app actually needs
    return rows.map(r => ({
        unique_sr_no: r["UNIQUE SR NO"],
        scheme_code: r["SCHEME CODE"],
        rta_scheme_code: r["RTA SCHEME CODE"],
        amc_scheme_code: r["AMC SCHEME CODE"],
        isin: r["ISIN"],
        amc_code: r["AMC CODE"],
        scheme_type: r["SCHEME TYPE"],
        plan_type: r["PLAN TYPE"],
        scheme_name: r["SCHEME NAME"],

        purchase_allowed: r["PURCHASE ALLOWED"],
        purchase_transaction_mode: r["PURCHASE TRANSACTION MODE"],
        new_purchase_min_amount: r["NEW PURCHASE MIN AMOUNT"],
        additional_purchase_min_amount: r["ADDITIONAL PURCHASE MIN AMOUNT"],
        additional_purchase_max_amount: r["ADDITIONAL PURCHASE MAX AMOUNT"],
        purchase_amount_multiplier: r["PURCHASE AMOUNT MULTIPLIER"],
        purchase_cutoff_time: r["PURCHASE CUTOFF TIME"],

        redemption_allowed: r["REDEMPTION ALLOWED"],
        redemption_transaction_mode: r["REDEMPTION TRANSACTION MODE"],
        redemption_min_qty: r["REDEMPTION MIN QTY"],
        redemption_qty_multiplier: r["REDEMPTION QTY MULTIPLIER"],
        redemption_max_qty: r["REDEMPTION MAX QTY"],
        redemption_min_amount: r["REDEMPTION MIN AMOUNT"],
        redemption_max_amount: r["REDEMPTION MAX AMOUNT"],
        redemption_amount_multiplier: r["REDEMPTION AMOUNT MULTIPLIER"],
        redemption_cutoff_time: r["REDEMPTION CUTOFF TIME"],

        rta_agent_code: r["RTA AGENT CODE"],
        amc_active_flag: r["AMC ACTIVE FLAG"],
        div_reinvest_flag: r["DIV REINVEST FLAG"],

        sip_allowed: r["SIP ALLOWED"],
        stp_enabled: r["STP ENABLED"],
        swp_enabled: r["SWP ENABLED"],
        switch_allowed: r["SWITCH ALLOWED"],

        settlement_type: r["SETTLEMENT TYPE"],
        amc_ind: r["AMC IND"],

        face_value: r["FACE VALUE"],
        scheme_start_date: r["SCHEME START DATE"],
        maturity_date: r["MATURITY DATE"],

        exit_load_flag: r["EXIT LOAD FLAG"],
        exit_load: r["EXIT LOAD"],

        lock_in_period_flag: r["LOCK IN PERIOD_FLAG"],
        lock_in_period: r["LOCK IN PERIOD"],

        channel_partner_code: r["CHANNEL PARTNER CODE"],
        reopening_date: r["REOPENING DATE"]
    }));
}

app.post("/api/nse/master-download", async (req, res) => {
    console.log("hit");
    try {
        const file_type = req.body?.file_type || "SCH";
        const response = await nseClient.post(
            "/nsemfdesk/api/v2/reports/MASTER_DOWNLOAD",
            { file_type },
            { headers: buildNseHeaders() }
        );

        // response.data is the raw pipe-delimited text
        const rawText = typeof response.data === "string"
            ? response.data
            : JSON.stringify(response.data); // fallback safety net

        const schemes = parseMasterDownload(rawText);

        await uploadToGCS(schemes);

        res.json({
            success: true,
            count: schemes.length
        });
    } catch (err) {
        handleNseError(err, res, "master-download");
        console.log(err.response?.data || err.message);
    }
});


app.listen(port, "0.0.0.0", () => {
    console.log(`Backend running on port ${port}`);
});