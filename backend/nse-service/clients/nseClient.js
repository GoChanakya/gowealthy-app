const axios = require("axios");
const https = require("https");

const httpsAgent =
    new https.Agent({

        keepAlive: true,

        minVersion: "TLSv1.3",

        maxVersion: "TLSv1.3",

        ciphers:
            "TLS_AES_256_GCM_SHA384:" +
            "TLS_CHACHA20_POLY1305_SHA256:" +
            "TLS_AES_128_GCM_SHA256"
    });

const client =
    axios.create({

        baseURL:
            "https://nseinvestuat.nseindia.com",

        httpsAgent,

        timeout: 60000
    });

module.exports = client;