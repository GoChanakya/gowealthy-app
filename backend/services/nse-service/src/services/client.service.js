import { NSE_ENDPOINTS } from "@gowealthy/nse-core";
import { nsePost } from "../lib/nse.js";
import { logActivity } from "../lib/logger.js";
import { formatDdMmYyyy, lastDaysRange } from "../lib/dates.js";

/** UCC registration (183-column). Doc: /nsemfdesk/api/v2/registration/CLIENTCOMMON183 */
export async function uccRegister(reg_details) {
    const rec = reg_details[0];
    console.log(`📝 [ucc-register] UCC: ${rec.client_code}, PAN: ${rec.primary_holder_pan}`);
    const response = await nsePost(NSE_ENDPOINTS.UCC_REGISTER_183, { reg_details });
    const result = response.data?.reg_details?.[0];
    console.log(`✅ [ucc-register] status: ${result?.reg_status}, id: ${result?.reg_id}`);
    return response.data;
}

/** UCC modification. Doc: /nsemfdesk/api/v2/registration/CLIENTMODIFICATION */
export async function uccModify(reg_details) {
    const rec = reg_details[0];
    console.log(`✏️ [ucc-modify] UCC: ${rec.client_code}`);
    const response = await nsePost(NSE_ENDPOINTS.UCC_MODIFY, { reg_details });
    const result = response.data?.reg_details?.[0];
    console.log(`✅ [ucc-modify] status: ${result?.reg_status}, remark: ${result?.reg_remark}`);
    return response.data;
}

/** FATCA upload (individual). Doc: /nsemfdesk/api/v2/registration/FATCA */
export async function fatcaUpload(reg_details) {
    const rec = reg_details[0];
    console.log(`📝 [fatca-upload] PAN: ${rec.pan_rp}, Name: ${rec.inv_name}`);
    const response = await nsePost(NSE_ENDPOINTS.FATCA_UPLOAD, { reg_details });
    const result = response.data?.reg_details?.[0];
    console.log(`✅ [fatca-upload] status: ${result?.reg_status}, id: ${result?.reg_id}`);
    return response.data;
}

/**
 * Client authorization status (poll after the CL_ACT link is sent).
 * Doc: /nsemfdesk/api/v2/reports/client_authorization
 * Queries the last 7 days by AUTH_SENT_DATE for the given client.
 */
export async function clientAuthStatus({ client_code, requestId }) {
    console.log(`📊 [client-auth-status] UCC: ${client_code}`);

    const { from, to } = lastDaysRange(7);
    const response = await nsePost(NSE_ENDPOINTS.CLIENT_AUTHORIZATION, {
        from_date: formatDdMmYyyy(from),
        to_date: formatDdMmYyyy(to),
        client_code,
        date_type: "AUTH_SENT_DATE",
    });

    const authRow = response.data?.report_data?.[0];
    logActivity("client-auth-status", "nse_response", {
        requestId,
        httpStatus: response.status,
        clientCode: client_code,
        authStatus: authRow?.auth_status,
        firstHolderAuthStatus: authRow?.first_holder_auth_status,
    });
    console.log(`✅ [client-auth-status]:`, JSON.stringify(response.data));
    return response.data;
}
