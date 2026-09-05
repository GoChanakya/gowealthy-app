import { Router } from "express";
import { asyncHandler } from "../lib/http.js";
import * as c from "../controllers/kyc.controller.js";

export const kycRouter = Router();

kycRouter.post("/kyc-check", asyncHandler("kyc-check", c.kycCheck));
kycRouter.post("/ekyc-register", asyncHandler("ekyc-register", c.ekycRegister));
