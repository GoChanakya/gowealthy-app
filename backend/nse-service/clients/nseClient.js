const axios = require("axios");

async function callNSE(endpoint, headers = {}, method = "GET", body = null) {

    const url = `${process.env.NSE_BASE_URL}${endpoint}`;

    try {
        const response = await axios({
            method,
            url,
            headers,
            data: body,
            timeout: 10000
        });

        return response.data;

    } catch (error) {

        if (error.response) {
            return {
                status: error.response.status,
                data: error.response.data
            };
        }

        return { error: error.message };
    }
}

module.exports = { callNSE };