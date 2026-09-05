import { ValidationError } from "../lib/http.js";
import * as linksService from "../services/links.service.js";

// productType values accepted by GET_LINK (spec v1.9.6 p.86).
const VALID_PRODUCT_TYPES = [
    "PUR", "RED", "SWH_REG", "SIP_REG", "XSIP_REG", "XSIP_CAN",
    "STP_REG", "STP_CAN", "SWP_REG", "SWP_CAN",
    "CL_ACT", "SIP_CAN", "MANDATE_AUTH", "SIP_TOPUP",
];

// GET SHORT LINK
//   CL_ACT + client_code  -> UCC auth link
//   MANDATE_AUTH + mandate_id -> mandate auth link
//   PUR / SIP_REG / XSIP_REG / RED + order/reg id -> payment / auth links
export async function getLink(req, res) {
    const { productType, productRefId } = req.body;
    if (!productType || !productRefId) {
        throw new ValidationError("productType and productRefId are required");
    }
    if (!VALID_PRODUCT_TYPES.includes(productType)) {
        throw new ValidationError(`Invalid productType. Must be one of: ${VALID_PRODUCT_TYPES.join(", ")}`);
    }

    res.json(await linksService.getLink({ productType, productRefId }));
}

// RESEND COMMUNICATION (investor did not receive/open the auth email)
export async function resendComm(req, res) {
    const { productType, productRefId } = req.body;
    if (!productType || !productRefId) {
        throw new ValidationError("productType and productRefId are required");
    }

    res.json(await linksService.resendComm({ productType, productRefId }));
}
