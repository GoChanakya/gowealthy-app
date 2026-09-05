/**
 * NSE MFSS API paths (NNF spec v1.9.6). Every outbound call in the backend
 * references one of these so a spec change is a one-line edit.
 */
export const NSE_ENDPOINTS = Object.freeze({
    // Utility / KYC
    KYC_CHECK: "/nsemfdesk/api/v2/utility/KYC_CHECK",
    EKYC_REGISTER: "/nsemfdesk/api/v1/EKYC/EKYCREG",

    // Client registration
    UCC_REGISTER_183: "/nsemfdesk/api/v2/registration/CLIENTCOMMON183",
    UCC_MODIFY: "/nsemfdesk/api/v2/registration/CLIENTMODIFICATION",
    FATCA_UPLOAD: "/nsemfdesk/api/v2/registration/FATCA",
    CLIENT_BANK_DETAIL: "/nsemfdesk/api/v2/registration/CLIENTBANKDTL",
    BANK_ELOG: "/nsemfdesk/api/v2/registration/ELOGBANK",
    RESEND_COMM: "/nsemfdesk/api/v2/registration/RESEND_COMM",
    SIP_UMRN: "/nsemfdesk/api/v2/registration/SIPUMRN",

    // Product registration
    MANDATE_REGISTER: "/nsemfdesk/api/v2/registration/product/MANDATE",
    SIP_REGISTER: "/nsemfdesk/api/v2/registration/product/SIP",

    // Transactions / payments
    ORDER_NORMAL: "/nsemfdesk/api/v2/transaction/NORMAL",
    PURCHASE_PAYMENT: "/nsemfdesk/api/v2/payments/purchase_payment",
    UPI_STATUS_CHECK: "/nsemfdesk/api/v2/payments/upi_status_check",

    // Cancellation
    SIP_CANCEL: "/nsemfdesk/api/v2/cancellation/SIP_CAN",
    ORDER_CANCEL: "/nsemfdesk/api/v2/cancellation/ORDER_CAN",

    // File upload
    CANCEL_CHEQUE_UPLOAD: "/nsemfdesk/api/v2/fileupload/CANCELCHEQUE",

    // Reports
    GET_LINK: "/nsemfdesk/api/v2/reports/GET_LINK",
    CLIENT_AUTHORIZATION: "/nsemfdesk/api/v2/reports/client_authorization",
    MANDATE_STATUS: "/nsemfdesk/api/v2/reports/MANDATE_STATUS",
    CLIENT_MASTER_REPORT: "/nsemfdesk/api/v2/reports/client_master_report",
    MASTER_DOWNLOAD: "/nsemfdesk/api/v2/reports/MASTER_DOWNLOAD",
    ORDER_STATUS: "/nsemfdesk/api/v2/reports/ORDER_STATUS",
    PROV_ORDERS: "/nsemfdesk/api/v2/reports/PROV_ORDERS",
    SIP_REG_REPORT: "/nsemfdesk/api/v2/reports/SIP_REG_REPORT",
    XSIP_REG_REPORT: "/nsemfdesk/api/v2/reports/XSIP_REG_REPORT",
});
