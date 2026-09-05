import { NSE_ENDPOINTS } from "@gowealthy/nse-core";
import { nsePost } from "../lib/nse.js";

/**
 * KYC status check. Doc: /nsemfdesk/api/v2/utility/KYC_CHECK
 * kyc_status "S" -> KYC found, "F" -> KYC absent (fresh eKYC needed).
 */
export async function kycCheck({ pan_no }) {
    console.log(`🔍 [kyc-check] PAN: ${pan_no}`);
    const response = await nsePost(NSE_ENDPOINTS.KYC_CHECK, { pan_no });
    console.log(`✅ [kyc-check] status: ${response.data?.kyc_status}`);
    return response.data;
}

/**
 * Fresh eKYC registration. Doc: /nsemfdesk/api/v1/EKYC/EKYCREG
 * Returns { link, message }; the investor completes eKYC on the NSE page.
 */
export async function ekycRegister({ amcCode, panNo, mobileNo, invEmail }) {
    console.log(`📝 [ekyc-register] PAN: ${panNo}, Mobile: ${mobileNo}`);
    console.log(`   invEmail (raw): ${JSON.stringify(invEmail)}, length: ${invEmail.length}`);
    const response = await nsePost(NSE_ENDPOINTS.EKYC_REGISTER, { amcCode, panNo, mobileNo, invEmail });
    console.log(`✅ [ekyc-register] message: ${response.data?.message}`);
    return response.data;
}
