import { Router } from "express";
import { asyncHandler } from "../lib/http.js";
import * as c from "../controllers/bank.controller.js";

export const bankRouter = Router();

bankRouter.post("/bank-add", asyncHandler("bank-add", c.bankAdd));
bankRouter.post("/cancel-cheque-upload", asyncHandler("cancel-cheque-upload", c.cancelChequeUpload));
bankRouter.post("/bank-elog", asyncHandler("bank-elog", c.bankElog));
bankRouter.post("/bank-status", asyncHandler("bank-status", c.bankStatus));
