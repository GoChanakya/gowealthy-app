import assert from "node:assert/strict";
import test from "node:test";

process.env.NSE_LOGIN_ID = "test-login";
process.env.NSE_API_SECRET = "test-secret";
process.env.NSE_MEMBER_API_KEY = "test-member-key";
process.env.NSE_MEMBER_CODE = "test-member";
process.env.NSE_BASE_URL = "https://nse.example.test";
process.env.RAZORPAY_KEY_ID = "rzp_live_test_key";
process.env.RAZORPAY_KEY_SECRET = "rzp_live_test_secret";
process.env.RAZORPAYX_ACCOUNT_NUMBER = "7878780080316316";
process.env.RAZORPAY_BASE_URL = "https://razorpay.example.test";
process.env.RAZORPAY_POLL_ATTEMPTS = "2";
process.env.RAZORPAY_POLL_INTERVAL_MS = "0";

const { verifyBankAccount } = await import("../src/services/bank.service.js");

function jsonResponse(body, { ok = true, status = 200 } = {}) {
    return {
        ok,
        status,
        text: async () => JSON.stringify(body),
    };
}

test("creates and polls a RazorpayX penny-drop validation", async (t) => {
    const calls = [];
    t.mock.method(globalThis, "fetch", async (url, options = {}) => {
        calls.push({ url, options });
        if (calls.length === 1) {
            return jsonResponse({
                id: "fav_test123",
                status: "created",
                validation_results: {},
            });
        }
        return jsonResponse({
            id: "fav_test123",
            status: "completed",
            validation_results: {
                account_status: "valid",
                registered_name: "Test Investor",
                details: "The beneficiary account is valid.",
                name_match_score: 100,
            },
            utr: "123456789012",
        });
    });

    const result = await verifyBankAccount({
        accountNumber: "765432123456789",
        ifsc: "HDFC0000053",
        name: "Test Investor",
        contact: "9876543210",
        email: "investor@example.com",
        requestId: "test-request",
    });

    assert.equal(calls.length, 2);
    assert.equal(calls[0].url, "https://razorpay.example.test/v1/fund_accounts/validations");
    assert.match(calls[0].options.headers.Authorization, /^Basic /);

    const requestBody = JSON.parse(calls[0].options.body);
    assert.equal(requestBody.source_account_number, "7878780080316316");
    assert.equal(requestBody.validation_type, "pennydrop");
    assert.deepEqual(requestBody.fund_account.bank_account, {
        name: "Test Investor",
        ifsc: "HDFC0000053",
        account_number: "765432123456789",
    });
    assert.equal(requestBody.fund_account.contact.contact, "9876543210");

    assert.equal(calls[1].url, "https://razorpay.example.test/v1/fund_accounts/validations/fav_test123");
    assert.deepEqual(result, {
        success: true,
        verified: true,
        pending: false,
        validation_id: "fav_test123",
        status: "completed",
        account_status: "valid",
        registered_name: "Test Investor",
        name_match_score: 100,
        details: "The beneficiary account is valid.",
        reason: null,
        utr: "123456789012",
    });
});
