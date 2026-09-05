import { Router } from "express";
import { asyncHandler } from "../lib/http.js";
import * as c from "../controllers/mandate.controller.js";

export const mandateRouter = Router();

mandateRouter.post("/mandate-register", asyncHandler("mandate-register", c.mandateRegister));
mandateRouter.post("/mandate-status", asyncHandler("mandate-status", c.mandateStatus));
