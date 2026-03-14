// const axios = require("axios");

// async function callNSE(endpoint, headers = {}, method = "GET", body = null) {

//     const url = `${process.env.NSE_BASE_URL}${endpoint}`;

//     try {
//         const response = await axios({
//             method,
//             url,
//             headers,
//             data: body,
//             timeout: 10000
//         });

//         return response.data;

//     } catch (error) {

//         if (error.response) {
//             return {
//                 status: error.response.status,
//                 data: error.response.data
//             };
//         }

//         return { error: error.message };
//     }
// }

// module.exports = { callNSE };
const axios = require("axios");
const https = require("https");

const tlsAgent = new https.Agent({
    minVersion: "TLSv1.3",
    maxVersion: "TLSv1.3"
});

async function callNSE(endpoint, headers = {}, method = "GET", body = null) {
    const url = `${process.env.NSE_BASE_URL}${endpoint}`;
    try {
        const response = await axios({
            method, url, headers, data: body,
            timeout: 30000,
            httpsAgent: tlsAgent   // ← add this
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return { status: error.response.status, data: error.response.data };
        }
        return { error: error.message };
    }
}
module.exports = { callNSE };