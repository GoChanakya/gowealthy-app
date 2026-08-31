// ─────────────────────────────────────────────────────────────────────────────
// Distributor identity sent on every NSE order and registration.
//
// These were previously read from the investor's Firestore document, where
// nothing ever wrote them — so every order and SIP went to NSE with a blank ARN
// and EUIN. They are properties of GoChanakya, not of the investor, so they
// belong in config.
//
// Fill these in from your AMFI registration:
//   EXPO_PUBLIC_SUB_BROKER_ARN   e.g. "ARN-123456"  (must start with "ARN-")
//   EXPO_PUBLIC_EUIN             e.g. "E123456"     (E + 6 digits)
//   EXPO_PUBLIC_SUB_BROKER_CODE  your NSE sub-broker code, if you use one
//
// NSE treats sub_broker_arn as conditional-mandatory on SIP/XSIP/STP/SWP
// registration, so leaving it blank books business as direct rather than
// attributing it to you.
// ─────────────────────────────────────────────────────────────────────────────

const clean = (value) => String(value ?? '').trim().toUpperCase();

export const SUB_BROKER_ARN  = clean(process.env.EXPO_PUBLIC_SUB_BROKER_ARN);
export const SUB_BROKER_CODE = String(process.env.EXPO_PUBLIC_SUB_BROKER_CODE ?? '').trim();
export const EUIN            = clean(process.env.EXPO_PUBLIC_EUIN);

// EUIN declaration is Mandatory (Y/N) on orders and registrations; euin_number
// is conditional-mandatory only when the declaration is "Y". Declaring "Y"
// without a EUIN is rejected, so the two must move together.
export const EUIN_DECLARATION = EUIN ? 'Y' : 'N';

export const isValidArn  = (value = SUB_BROKER_ARN) => /^ARN-\w+$/.test(value);
export const isValidEuin = (value = EUIN) => /^E\d{6}$/.test(value);

/**
 * Distributor fields for an NSE payload, with the investor document allowed to
 * override (useful if a specific client is serviced under a different ARN).
 * @param {object} [investorData] mf_onboarding doc data
 */
export function distributorFields(investorData = {}) {
  const arn  = clean(investorData.sub_broker_arn) || SUB_BROKER_ARN;
  const euin = clean(investorData.euin_number)    || EUIN;
  const code = String(investorData.sub_broker_code ?? '').trim() || SUB_BROKER_CODE;

  if (arn && !isValidArn(arn)) {
    console.warn(`[distributor] sub_broker_arn "${arn}" does not look like ARN-XXXXXX; NSE will reject it.`);
  }
  if (euin && !isValidEuin(euin)) {
    console.warn(`[distributor] euin "${euin}" is not E + 6 digits; NSE will reject it.`);
  }

  return {
    sub_broker_arn:   arn,
    sub_broker_code:  code,
    euin_number:      euin,
    euin_declaration: euin ? 'Y' : 'N',
  };
}
