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
  const mode = String(process.env.RAZORPAY_KEY_ID || "").startsWith("rzp_live") ? "LIVE" : "TEST";
  const acctMasked = String(accountNumber || "").replace(/.(?=.{4})/g, "X");
  console.log(`💧 [razorpay] START penny drop | mode=${mode} | acc=${acctMasked} | ifsc=${ifsc} | name="${name || ""}" | ref=${referenceId || "-"}`);

  const { sourceAccount } = getRzpEnv();
  const client = rzpClient();

  // 1. Contact
  console.log(`➡️  [razorpay] Step 1/3: creating contact...`);
  const contactRes = await client.post("/contacts", {
    name: name || "Investor",
    type: "customer",
    reference_id: referenceId || undefined,
  });
  const contactId = contactRes.data?.id;
  console.log(`✅ [razorpay] Step 1/3: contact created | id=${contactId}`);

  // 2. Fund account (bank)
  console.log(`➡️  [razorpay] Step 2/3: creating fund account for contact ${contactId}...`);
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
  console.log(`✅ [razorpay] Step 2/3: fund account created | id=${fundAccountId}`);

  // 3. Validation (penny drop)
  console.log(`➡️  [razorpay] Step 3/3: creating validation (₹1 penny drop) from source ${sourceAccount}...`);
  let val = (await client.post("/fund_accounts/validations", {
    account_number: sourceAccount,
    fund_account: { id: fundAccountId },
    amount: 100,            // ₹1 in paise
    currency: "INR",
    notes: { purpose: "gowealthy_bank_verification", ref: referenceId || "" },
  })).data;
  const validationId = val?.id;
  console.log(`✅ [razorpay] Step 3/3: validation created | id=${validationId} | status=${val?.status}`);

  // Validation may be async — poll briefly until it completes.
  let attempts = 0;
  for (let i = 0; i < 5 && val?.status === "created"; i++) {
    attempts = i + 1;
    console.log(`⏳ [razorpay] polling validation ${validationId} (attempt ${attempts}/5, status=${val?.status})...`);
    await sleep(1500);
    val = (await client.get(`/fund_accounts/validations/${validationId}`)).data;
  }
  if (attempts > 0) console.log(`🔁 [razorpay] polling done after ${attempts} attempt(s) | final status=${val?.status}`);

  const out = {
    account_status: val?.results?.account_status || val?.status || "unknown",
    registered_name: val?.results?.registered_name || null,
    validation_id: validationId,
    status: val?.status,
    raw: val,
  };
  console.log(`🏁 [razorpay] DONE | account_status=${out.account_status} | registered_name="${out.registered_name || ""}" | validation_id=${out.validation_id}`);
  return out;
}

module.exports = { verifyBankAccount };
