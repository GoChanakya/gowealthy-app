require("dotenv").config();
const express = require("express");

const { aesEncrypt } = require("./utils/encryption");
const { buildAuthHeader } = require("./utils/auth");
const { callNSE } = require("./clients/nseClient");
const app = express();
app.use(express.json());

app.get("/", (req, res) => {
    res.send("NSE Service Running");
});

/* TEST ENCRYPTION ROUTE */
app.get("/debug-encryption", (req, res) => {

    const result = aesEncrypt(
        process.env.NSE_API_SECRET,
        process.env.NSE_MEMBER_API_KEY
    );

    const authHeader = buildAuthHeader(
        process.env.NSE_LOGIN_ID,
        result.encryptedPassword
    );

    res.json({
        plainText: result.plainText,
        encryptedPassword: result.encryptedPassword,
        authHeader
    });
});

app.post("/test-master", async (req, res) => {

    const enc = aesEncrypt(
        process.env.NSE_API_SECRET,
        process.env.NSE_MEMBER_API_KEY
    );

    const authHeader = buildAuthHeader(
        process.env.NSE_LOGIN_ID,
        enc.encryptedPassword
    );

    const headers = {
        "Authorization": authHeader,
        "memberId": process.env.NSE_MEMBER_CODE,
        "Content-Type": "application/json",
        "User-Agent": "PostmanRuntime/7.51.1",
        "Accept": "*/*",
        "Accept-Language": "en-US",
        "Connection": "keep-alive",
        "Referer": "https://www.nseinvest.com/nsemfdesk/login.htm"
    };

    const data = await callNSE(
    "/nsemfdesk/api/v2/reports/MASTER_DOWNLOAD",
    headers,
    "POST",
    {"file_type": "SCH"}   // empty body for now
);

    res.json(data);
});

app.listen(process.env.PORT, () => {
    console.log("NSE Service running on port", process.env.PORT);
});