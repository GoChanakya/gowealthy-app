import { NSE_ENDPOINTS } from "@gowealthy/nse-core";
import { nsePost } from "../lib/nse.js";

/**
 * Short authorization / payment link. Doc: /nsemfdesk/api/v2/reports/GET_LINK
 * Response: { productType, productRefId, firstHolderLink, secondHolderLink, thirdHolderLink, errorMessage }
 */
export async function getLink({ productType, productRefId }) {
    console.log(`🔗 [get-link] type: ${productType}, refId: ${productRefId}`);
    const response = await nsePost(NSE_ENDPOINTS.GET_LINK, { productType, productRefId });
    console.log(`✅ [get-link] link: ${response.data?.firstHolderLink}`);
    return response.data;
}

/**
 * Re-trigger the email/SMS authorization communication.
 * Doc: /nsemfdesk/api/v2/registration/RESEND_COMM
 */
export async function resendComm({ productType, productRefId }) {
    console.log(`📨 [resend-comm] type: ${productType}, refId: ${productRefId}`);
    const response = await nsePost(NSE_ENDPOINTS.RESEND_COMM, { productType, productRefId });
    console.log(`✅ [resend-comm] status: ${response.data?.response_status}`);
    return response.data;
}
