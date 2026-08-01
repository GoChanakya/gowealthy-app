// razorpayClient.js
// ─────────────────────────────────────────────────────────────────────────────
// Penny-drop bank verification via RazorpayX "Fund Account Validation".
// Flow: create Contact -> create Fund Account (bank) -> create Validation.
// The validation credits ₹1 to the account and returns the registered name +
// account_status ("active" | "invalid"). In test mode (rzp_test_ keys) Razorpay
// returns simulated results without moving real money.
//
// Docs: https://razorpay.com/docs/razorpayx/api/fund-account-validation/
//
// Requires these env vars (backend/nse-service/.env):
//   RAZORPAY_KEY_ID           e.g. rzp_test_xxxx  (RazorpayX enabled)
//   RAZORPAY_KEY_SECRET
//   RAZORPAYX_ACCOUNT_NUMBER  the source RazorpayX account the ₹1 is debited from
// ─────────────────────────────────────────────────────────────────────────────

const axios = require("axios");

const RZP_BASE = "https://api.razorpay.com/v1";

function getRzpEnv() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const sourceAccount = process.env.RAZORPAYX_ACCOUNT_NUMBER;
  if (!keyId || !keySecret) throw new Error("Razorpay keys not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)");
  if (!sourceAccount) throw new Error("RAZORPAYX_ACCOUNT_NUMBER not configured");
  return { keyId, keySecret, sourceAccount };
}

function rzpClient() {
  const { keyId, keySecret } = getRzpEnv();
  return axios.create({
    baseURL: RZP_BASE,
    auth: { username: keyId, password: keySecret },
    headers: { "Content-Type": "application/json" },
    timeout: Number(process.env.RAZORPAY_TIMEOUT_MS || 30000),
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Run a penny-drop validation for one bank account.
 * @returns {Promise<{account_status:string, registered_name:string|null, validation_id:string, raw:object}>}
 */
async function verifyBankAccount({ name, ifsc, accountNumber, referenceId }) {
  const { sourceAccount } = getRzpEnv();
  const client = rzpClient();

  // 1. Contact
  const contactRes = await client.post("/contacts", {
    name: name || "Investor",
    type: "customer",
    reference_id: referenceId || undefined,
  });
  const contactId = contactRes.data?.id;

  // 2. Fund account (bank)
  const faRes = await client.post("/fund_accounts", {
    contact_id: contactId,
    account_type: "bank_account",
    bank_account: {
      name: name || "Investor",
      ifsc,
      account_number: accountNumber,
    },
  });
  const fundAccountId = faRes.data?.id;

  // 3. Validation (penny drop)
  let val = (await client.post("/fund_accounts/validations", {
    account_number: sourceAccount,
    fund_account: { id: fundAccountId },
    amount: 100,            // ₹1 in paise
    currency: "INR",
    notes: { purpose: "gowealthy_bank_verification", ref: referenceId || "" },
  })).data;

  // Validation may be async — poll briefly until it completes.
  const validationId = val?.id;
  for (let i = 0; i < 5 && val?.status === "created"; i++) {
    await sleep(1500);
    val = (await client.get(`/fund_accounts/validations/${validationId}`)).data;
  }

  return {
    account_status: val?.results?.account_status || val?.status || "unknown",
    registered_name: val?.results?.registered_name || null,
    validation_id: validationId,
    status: val?.status,
    raw: val,
  };
}

module.exports = { verifyBankAccount };
