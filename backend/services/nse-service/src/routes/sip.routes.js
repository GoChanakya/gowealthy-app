import { Router } from "express";
import { asyncHandler } from "../lib/http.js";
import * as c from "../controllers/sip.controller.js";

export const sipRouter = Router();

sipRouter.post("/sip-register", asyncHandler("sip-register", c.sipRegister));
sipRouter.post("/sip-report", asyncHandler("sip-report", c.sipReport));
sipRouter.post("/sip-cancel", asyncHandler("sip-cancel", c.sipCancel));
sipRouter.post("/sip-umrn", asyncHandler("sip-umrn", c.sipUmrn));
