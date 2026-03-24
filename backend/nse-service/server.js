require("dotenv").config();

const express = require("express");

const { aesEncrypt } =
    require("./utils/encryption");

const { buildAuthHeader } =
    require("./utils/auth");

const nseClient =
    require("./clients/nseClient");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {

    res.send(
        "NSE Node working"
    );

});

app.post("/test-master", async (req, res) => {

    try {

        const enc =
            aesEncrypt(
                process.env.NSE_API_SECRET,
                process.env.NSE_MEMBER_API_KEY
            );

        const authHeader =
            buildAuthHeader(
                process.env.NSE_LOGIN_ID,
                enc.encryptedPassword
            );

        console.log("auth:", authHeader);

        const response =
            await nseClient.post(

                "/nsemfdesk/api/v2/reports/MASTER_DOWNLOAD",

                {
                    file_type: "SCH"
                },

                {

                    headers: {

                        Authorization: authHeader,

                        memberId:
                            process.env.NSE_MEMBER_CODE,

                        "Content-Type":
                            "application/json",

                        "User-Agent":
                            "PostmanRuntime/7.51.1",

                        Accept: "*/*",

                        "Accept-Encoding":
                            "gzip, deflate, br",

                        "Accept-Language":
                            "en-US",

                        Connection:
                            "keep-alive",

                        Referer:
                            "https://www.nseinvest.com/nsemfdesk/login.htm"
                    }
                }
            );

        res.json(
            response.data
        );

    }

    catch (err) {

        console.log(
            err.response?.data ||
            err.message
        );

        res.status(500).json({

            error:
                err.response?.data ||
                err.message
        });
    }

});

app.listen(

    3000,

    () =>
        console.log(
            "Server running on 3000"
        )

);