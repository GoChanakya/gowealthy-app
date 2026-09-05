import { Router } from "express";
import { healthRouter } from "./health.routes.js";
import { kycRouter } from "./kyc.routes.js";
import { clientRouter } from "./client.routes.js";
import { bankRouter } from "./bank.routes.js";
import { linksRouter } from "./links.routes.js";
import { ordersRouter } from "./orders.routes.js";
import { schemesRouter } from "./schemes.routes.js";
import { mandateRouter } from "./mandate.routes.js";
import { sipRouter } from "./sip.routes.js";

export const API_PREFIX = "/api/nse";

export const router = Router();

router.use(healthRouter);
router.use(API_PREFIX, kycRouter);
router.use(API_PREFIX, clientRouter);
router.use(API_PREFIX, bankRouter);
router.use(API_PREFIX, linksRouter);
router.use(API_PREFIX, ordersRouter);
router.use(API_PREFIX, schemesRouter);
router.use(API_PREFIX, mandateRouter);
router.use(API_PREFIX, sipRouter);

/** Printed at startup; also a quick reference of the public surface. */
export const ROUTE_TABLE = [
    ["GET", "/api/nse/health", "service health + NSE environment"],
    ["POST", "/api/nse/kyc-check", "KYC_CHECK (Screen 2)"],
    ["POST", "/api/nse/ekyc-register", "EKYCREG (Screen 3)"],
    ["POST", "/api/nse/ucc-register", "CLIENTCOMMON183 (Screen 5+6)"],
    ["POST", "/api/nse/ucc-modify", "CLIENTMODIFICATION"],
    ["POST", "/api/nse/fatca-upload", "FATCA (Screen 5)"],
    ["POST", "/api/nse/bank-add", "CLIENTBANKDTL (Screen 6)"],
    ["POST", "/api/nse/get-link", "GET_LINK (Screen 5 post-UCC)"],
    ["POST", "/api/nse/order-entry", "NORMAL purchase/redemption"],
    ["POST", "/api/nse/purchase-payment", "purchase_payment (existing orders)"],
    ["POST", "/api/nse/upi-payment-status", "upi_status_check (did the payment land?)"],
    ["POST", "/api/nse/order-cancel", "ORDER_CAN (cancel an unpaid order)"],
    ["POST", "/api/nse/order-status", "ORDER_STATUS / PROV_ORDERS report"],
    ["POST", "/api/nse/resend-comm", "RESEND_COMM"],
    ["POST", "/api/nse/mandate-register", "MANDATE (trading prep)"],
    ["POST", "/api/nse/client-auth-status", "client_authorization (polling)"],
    ["POST", "/api/nse/sip-register", "SIP registration (trading)"],
    ["POST", "/api/nse/schemes", "live tradeable scheme catalogue"],
    ["POST", "/api/nse/master-download", "MASTER_DOWNLOAD (count / inspect)"],
    ["POST", "/api/nse/sip-report", "SIP_REG_REPORT (list registered SIPs)"],
    ["POST", "/api/nse/sip-cancel", "SIP_CAN (stop installments)"],
    ["POST", "/api/nse/mandate-status", "MANDATE_STATUS (approved? UMRN?)"],
    ["POST", "/api/nse/sip-umrn", "SIPUMRN (attach mandate to SIP)"],
    ["POST", "/api/nse/cancel-cheque-upload", "CANCELCHEQUE (bank verification)"],
    ["POST", "/api/nse/bank-elog", "ELOGBANK (bank verification)"],
    ["POST", "/api/nse/bank-status", "client_master_report (bank status)"],
];
